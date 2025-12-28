import { PrismaClient } from '@prisma/client';
import { KYCStatus } from '../types';
import axios from 'axios';

const prisma = new PrismaClient();

export interface KYCVerificationData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documentNumber: string;
  documentFrontImage?: string; // Base64 encoded image
  documentBackImage?: string; // Base64 encoded image
  selfieImage?: string; // Base64 encoded image
}

export interface KYCProviderResponse {
  verificationId: string;
  status: 'approved' | 'rejected' | 'pending' | 'manual_review';
  confidenceScore: number;
  failureReasons?: string[];
  documentVerification?: {
    documentType: string;
    documentNumber: string;
    expiryDate: string;
    isValid: boolean;
  };
  faceVerification?: {
    isMatch: boolean;
    confidenceScore: number;
  };
  addressVerification?: {
    isMatch: boolean;
    confidenceScore: number;
  };
}

export class KYCService {
  private apiKey: string;
  private baseUrl: string;
  private provider: 'jumio' | 'onfido' | 'veriff';

  constructor() {
    this.apiKey = process.env.KYC_API_KEY || '';
    this.baseUrl = process.env.KYC_API_URL || '';
    this.provider = (process.env.KYC_PROVIDER as 'jumio' | 'onfido' | 'veriff') || 'jumio';
    
    if (!this.apiKey) {
      console.warn('KYC_API_KEY not configured - using mock implementation');
    }
  }

  private async makeKYCRequest(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<any> {
    if (!this.apiKey) {
      return this.mockKYCRequest(endpoint, method, body);
    }

    try {
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers,
        data: body,
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      console.error('KYC API error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`KYC API error: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }

  private async mockKYCRequest(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

    if (endpoint.includes('/verify')) {
      const verificationData = body?.verificationData;
      
      // Mock verification logic
      const isApproved = Math.random() > 0.2; // 80% approval rate
      const confidenceScore = Math.random() * 0.3 + 0.7; // 70-100% confidence
      
      const response: KYCProviderResponse = {
        verificationId: `kyc_${Math.random().toString(36).substr(2, 10)}`,
        status: isApproved ? 'approved' : 'manual_review',
        confidenceScore,
        failureReasons: isApproved ? undefined : ['Document unclear', 'Face mismatch'],
        documentVerification: {
          documentType: verificationData?.documentType || 'passport',
          documentNumber: verificationData?.documentNumber || '123456789',
          expiryDate: '2025-12-31',
          isValid: true,
        },
        faceVerification: {
          isMatch: isApproved,
          confidenceScore: isApproved ? confidenceScore : 0.3,
        },
        addressVerification: {
          isMatch: true,
          confidenceScore: 0.9,
        },
      };

      return response;
    }

    if (endpoint.includes('/status')) {
      return {
        verificationId: body?.verificationId,
        status: 'approved',
        confidenceScore: 0.95,
      };
    }

    throw new Error(`Mock endpoint not implemented: ${method} ${endpoint}`);
  }

  async submitKYCVerification(userId: string, verificationData: KYCVerificationData): Promise<any> {
    // 1. Validate input data
    if (!verificationData.firstName || !verificationData.lastName || !verificationData.dateOfBirth) {
      throw new Error('Missing required personal information');
    }

    if (!verificationData.address || !verificationData.address.line1 || !verificationData.address.city) {
      throw new Error('Missing required address information');
    }

    if (!verificationData.documentType || !verificationData.documentNumber) {
      throw new Error('Missing required document information');
    }

    // 2. Check if user already has pending KYC
    const existingKYC = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true }
    });

    if (existingKYC?.kycStatus === KYCStatus.PENDING) {
      throw new Error('KYC verification already in progress');
    }

    if (existingKYC?.kycStatus === KYCStatus.APPROVED) {
      throw new Error('KYC already approved');
    }

    // 3. Update user KYC status to pending
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: KYCStatus.PENDING,
        kycData: JSON.stringify({
          submittedAt: new Date().toISOString(),
          verificationData: {
            firstName: verificationData.firstName,
            lastName: verificationData.lastName,
            dateOfBirth: verificationData.dateOfBirth,
            address: verificationData.address,
            documentType: verificationData.documentType,
            documentNumber: verificationData.documentNumber,
          }
        }),
      }
    });

    // 4. Submit to KYC provider
    try {
      const response = await this.makeKYCRequest('/verify', 'POST', {
        verificationData,
        userId,
        callbackUrl: `${process.env.API_BASE_URL}/webhooks/kyc`,
      });

      // 5. Update user with verification results
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: this.mapProviderStatusToKYCStatus(response.status),
          kycData: JSON.stringify({
            submittedAt: new Date().toISOString(),
            verificationId: response.verificationId,
            providerResponse: response,
            confidenceScore: response.confidenceScore,
            failureReasons: response.failureReasons,
          }),
        }
      });

      return {
        user: updatedUser,
        verificationResult: response,
      };
    } catch (error) {
      // Revert KYC status on failure
      await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: KYCStatus.REJECTED,
          kycData: JSON.stringify({
            submittedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        }
      });

      throw error;
    }
  }

  async getKYCStatus(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        kycStatus: true,
        kycData: true,
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId: user.id,
      kycStatus: user.kycStatus,
      kycData: user.kycData ? JSON.parse(user.kycData) : null,
    };
  }

  async updateKYCStatus(userId: string, status: KYCStatus, verificationData?: any): Promise<any> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: status,
        kycData: verificationData ? JSON.stringify(verificationData) : undefined,
      }
    });

    return user;
  }

  async processKYCWebhook(eventType: string, eventData: any): Promise<void> {
    console.log(`Processing KYC webhook: ${eventType}`, eventData);

    const { verificationId, userId, status, failureReasons } = eventData;

    // Update user KYC status based on webhook
    const kycStatus = this.mapProviderStatusToKYCStatus(status);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus,
        kycData: JSON.stringify({
          verificationId,
          webhookReceivedAt: new Date().toISOString(),
          finalStatus: status,
          failureReasons,
        }),
      }
    });

    // Handle special cases
    if (kycStatus === KYCStatus.APPROVED) {
      await this.handleKYCApproved(userId);
    } else if (kycStatus === KYCStatus.REJECTED) {
      await this.handleKYCRejected(userId, failureReasons);
    }
  }

  private mapProviderStatusToKYCStatus(providerStatus: string): KYCStatus {
    switch (providerStatus) {
      case 'approved':
        return KYCStatus.APPROVED;
      case 'rejected':
        return KYCStatus.REJECTED;
      case 'pending':
      case 'manual_review':
        return KYCStatus.PENDING;
      default:
        return KYCStatus.REJECTED;
    }
  }

  private async handleKYCApproved(userId: string): Promise<void> {
    console.log(`KYC approved for user ${userId}`);
    
    // Update user limits or permissions
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Increase limits for verified users
        dailyLimit: 10000,
        monthlyLimit: 100000,
      }
    });
  }

  private async handleKYCRejected(userId: string, failureReasons?: string[]): Promise<void> {
    console.log(`KYC rejected for user ${userId}:`, failureReasons);
    
    // Keep restrictive limits for unverified users
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyLimit: 1000,
        monthlyLimit: 10000,
      }
    });
  }

  async getVerificationRequirements(country?: string): Promise<any> {
    // Return country-specific requirements
    const requirements = {
      default: {
        documents: ['passport', 'drivers_license', 'national_id'],
        selfieRequired: true,
        addressVerification: true,
        minAge: 18,
      },
      US: {
        documents: ['passport', 'drivers_license'],
        selfieRequired: true,
        addressVerification: true,
        minAge: 18,
        ssnRequired: true,
      },
      UK: {
        documents: ['passport', 'drivers_license', 'national_id'],
        selfieRequired: true,
        addressVerification: true,
        minAge: 18,
      },
      // Add more countries as needed
    };

    return requirements[country as keyof typeof requirements] || requirements.default;
  }

  async validateDocumentImage(base64Image: string, documentType: string): Promise<any> {
    // Basic validation - in production, use proper image analysis
    if (!base64Image || base64Image.length < 1000) {
      throw new Error('Invalid document image');
    }

    // Check if image is too large (max 10MB)
    const imageSize = Math.ceil(base64Image.length * 0.75); // Base64 is ~33% larger
    if (imageSize > 10 * 1024 * 1024) {
      throw new Error('Document image too large (max 10MB)');
    }

    return {
      valid: true,
      size: imageSize,
      type: documentType,
    };
  }
}

export const kycService = new KYCService();