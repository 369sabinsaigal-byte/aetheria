import { PrismaClient } from '@prisma/client';
import { TransactionType, TransactionStatus, TransactionCategory } from '../types';
import axios from 'axios';

const prisma = new PrismaClient();

export interface CirclePaymentData {
  id: string;
  type: 'payment' | 'payout';
  status: 'pending' | 'complete' | 'failed';
  amount: {
    amount: string;
    currency: string;
  };
  fees?: {
    amount: string;
    currency: string;
  };
  createDate: string;
  updateDate: string;
}

export interface CircleBalanceData {
  available: string;
  currency: string;
}

export class CirclePaymentsService {
  private apiKey: string;
  private baseUrl: string;
  private masterWalletId: string;

  constructor() {
    this.apiKey = process.env.CIRCLE_API_KEY || '';
    this.baseUrl = process.env.CIRCLE_ENV === 'production' 
      ? 'https://api.circle.com/v1'
      : 'https://api-sandbox.circle.com/v1';
    this.masterWalletId = process.env.CIRCLE_MASTER_WALLET_ID || '';
    
    if (!this.apiKey) {
      console.warn('CIRCLE_API_KEY not configured - using mock implementation');
    }
  }

  private async makeCircleRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT', body?: any): Promise<any> {
    if (!this.apiKey) {
      return this.mockCircleRequest(endpoint, method, body);
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
      console.error('Circle API error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Circle API error: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }

  private async mockCircleRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT', body?: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

    if (endpoint.includes('/payments')) {
      if (method === 'POST') {
        return {
          data: {
            id: `payment_${Math.random().toString(36).substr(2, 10)}`,
            type: 'payment',
            status: 'pending',
            amount: {
              amount: body.amount?.amount || '0.00',
              currency: body.amount?.currency || 'USD',
            },
            fees: {
              amount: '0.50',
              currency: 'USD',
            },
            createDate: new Date().toISOString(),
            updateDate: new Date().toISOString(),
          }
        };
      }

      if (method === 'GET') {
        return {
          data: [
            {
              id: `payment_${Math.random().toString(36).substr(2, 10)}`,
              type: 'payment',
              status: 'complete',
              amount: {
                amount: '100.00',
                currency: 'USD',
              },
              createDate: new Date(Date.now() - 86400000).toISOString(),
              updateDate: new Date(Date.now() - 86400000).toISOString(),
            }
          ]
        };
      }
    }

    if (endpoint.includes('/payouts')) {
      if (method === 'POST') {
        return {
          data: {
            id: `payout_${Math.random().toString(36).substr(2, 10)}`,
            type: 'payout',
            status: 'pending',
            amount: {
              amount: body.amount?.amount || '0.00',
              currency: body.amount?.currency || 'USD',
            },
            fees: {
              amount: '1.00',
              currency: 'USD',
            },
            createDate: new Date().toISOString(),
            updateDate: new Date().toISOString(),
          }
        };
      }
    }

    if (endpoint.includes('/wallets')) {
      if (method === 'GET') {
        return {
          data: {
            available: [
              {
                amount: '1000.00',
                currency: 'USD',
              }
            ]
          }
        };
      }
    }

    throw new Error(`Mock endpoint not implemented: ${method} ${endpoint}`);
  }

  async convertUSDCToUSD(userId: string, amount: number): Promise<any> {
    // 1. Get current USDC balance
    const usdcBalance = await prisma.balance.findUnique({
      where: { userId_asset: { userId, asset: 'USDC' } }
    });

    if (!usdcBalance || usdcBalance.available < amount) {
      throw new Error('Insufficient USDC balance');
    }

    // 2. Create Circle payment to convert USDC to USD
    const paymentData = await this.makeCircleRequest('/payments', 'POST', {
      idempotencyKey: `usdc_to_usd_${userId}_${Date.now()}`,
      amount: {
        amount: amount.toFixed(2),
        currency: 'USD',
      },
      source: {
        type: 'wallet',
        id: this.masterWalletId,
      },
      destination: {
        type: 'wallet',
        id: this.masterWalletId,
      },
      metadata: {
        userId,
        conversionType: 'USDC_TO_USD',
      },
    });

    // 3. Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.CRYPTO_SWAP,
        category: TransactionCategory.OTHER,
        amount: -amount,
        currency: 'USDC',
        cryptoAmount: amount,
        cryptoCurrency: 'USDC',
        status: TransactionStatus.PENDING,
        metadata: JSON.stringify({
          circlePaymentId: paymentData.data.id,
          conversionType: 'USDC_TO_USD',
          targetCurrency: 'USD',
          targetAmount: amount,
        }),
      }
    });

    // 4. Update USDC balance
    await prisma.balance.update({
      where: { userId_asset: { userId, asset: 'USDC' } },
      data: { available: { decrement: amount } }
    });

    // 5. Update or create USD balance
    const usdBalance = await prisma.balance.upsert({
      where: { userId_asset: { userId, asset: 'USD' } },
      update: { available: { increment: amount } },
      create: {
        userId,
        asset: 'USD',
        assetType: 'FIAT',
        available: amount,
        total: amount,
      }
    });

    // 6. Update transaction status to completed
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.COMPLETED }
    });

    return {
      transaction,
      usdBalance,
      circlePayment: paymentData.data,
    };
  }

  async convertUSDToUSDC(userId: string, amount: number): Promise<any> {
    // 1. Get current USD balance
    const usdBalance = await prisma.balance.findUnique({
      where: { userId_asset: { userId, asset: 'USD' } }
    });

    if (!usdBalance || usdBalance.available < amount) {
      throw new Error('Insufficient USD balance');
    }

    // 2. Create Circle payout to convert USD to USDC
    const payoutData = await this.makeCircleRequest('/payouts', 'POST', {
      idempotencyKey: `usd_to_usdc_${userId}_${Date.now()}`,
      amount: {
        amount: amount.toFixed(2),
        currency: 'USD',
      },
      destination: {
        type: 'wallet',
        id: this.masterWalletId,
      },
      metadata: {
        userId,
        conversionType: 'USD_TO_USDC',
      },
    });

    // 3. Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.CRYPTO_SWAP,
        category: TransactionCategory.OTHER,
        amount: -amount,
        currency: 'USD',
        cryptoAmount: amount,
        cryptoCurrency: 'USD',
        status: TransactionStatus.PENDING,
        metadata: JSON.stringify({
          circlePayoutId: payoutData.data.id,
          conversionType: 'USD_TO_USDC',
          targetCurrency: 'USDC',
          targetAmount: amount,
        }),
      }
    });

    // 4. Update USD balance
    await prisma.balance.update({
      where: { userId_asset: { userId, asset: 'USD' } },
      data: { available: { decrement: amount } }
    });

    // 5. Update or create USDC balance
    const usdcBalance = await prisma.balance.upsert({
      where: { userId_asset: { userId, asset: 'USDC' } },
      update: { available: { increment: amount } },
      create: {
        userId,
        asset: 'USDC',
        assetType: 'CRYPTO',
        available: amount,
        total: amount,
      }
    });

    // 6. Update transaction status to completed
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.COMPLETED }
    });

    return {
      transaction,
      usdcBalance,
      circlePayout: payoutData.data,
    };
  }

  async getWalletBalance(walletId: string = this.masterWalletId): Promise<CircleBalanceData[]> {
    const balanceData = await this.makeCircleRequest(`/wallets/${walletId}/balances`, 'GET');
    return balanceData.data.available;
  }

  async createPayment(userId: string, amount: number, currency: string = 'USD'): Promise<any> {
    const paymentData = await this.makeCircleRequest('/payments', 'POST', {
      idempotencyKey: `payment_${userId}_${Date.now()}`,
      amount: {
        amount: amount.toFixed(2),
        currency,
      },
      source: {
        type: 'wallet',
        id: this.masterWalletId,
      },
      metadata: {
        userId,
        paymentType: 'CARD_FUNDING',
      },
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.TOP_UP,
        category: TransactionCategory.OTHER,
        amount: amount,
        currency,
        status: TransactionStatus.COMPLETED,
        metadata: JSON.stringify({
          circlePaymentId: paymentData.data.id,
          paymentType: 'CARD_FUNDING',
        }),
      }
    });

    return {
      transaction,
      circlePayment: paymentData.data,
    };
  }

  async getPaymentHistory(userId: string, limit: number = 10): Promise<any[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        metadata: {
          contains: 'circlePaymentId'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions;
  }

  async processWebhook(eventType: string, eventData: any): Promise<void> {
    console.log(`Processing Circle webhook: ${eventType}`, eventData);

    switch (eventType) {
      case 'payment.completed':
        await this.handlePaymentCompleted(eventData);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(eventData);
        break;
      case 'payout.completed':
        await this.handlePayoutCompleted(eventData);
        break;
      case 'payout.failed':
        await this.handlePayoutFailed(eventData);
        break;
      default:
        console.log(`Unhandled Circle webhook event: ${eventType}`);
    }
  }

  private async handlePaymentCompleted(eventData: any): Promise<void> {
    const paymentId = eventData.id;
    
    const transaction = await prisma.transaction.findFirst({
      where: {
        metadata: {
          contains: paymentId
        }
      }
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED }
      });
      console.log(`Transaction ${transaction.id} marked as completed`);
    }
  }

  private async handlePaymentFailed(eventData: any): Promise<void> {
    const paymentId = eventData.id;
    
    const transaction = await prisma.transaction.findFirst({
      where: {
        metadata: {
          contains: paymentId
        }
      }
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.FAILED }
      });
      console.log(`Transaction ${transaction.id} marked as failed`);
    }
  }

  private async handlePayoutCompleted(eventData: any): Promise<void> {
    const payoutId = eventData.id;
    
    const transaction = await prisma.transaction.findFirst({
      where: {
        metadata: {
          contains: payoutId
        }
      }
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED }
      });
      console.log(`Payout transaction ${transaction.id} marked as completed`);
    }
  }

  private async handlePayoutFailed(eventData: any): Promise<void> {
    const payoutId = eventData.id;
    
    const transaction = await prisma.transaction.findFirst({
      where: {
        metadata: {
          contains: payoutId
        }
      }
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.FAILED }
      });
      console.log(`Payout transaction ${transaction.id} marked as failed`);
    }
  }
}

export const circlePaymentsService = new CirclePaymentsService();