import { PrismaClient, Card } from '@prisma/client';
import { CardType, CardStatus, PhysicalCardStatus } from '../types';

const prisma = new PrismaClient();

export interface StripeCardData {
  id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  cardholder: {
    id: string;
    name: string;
  };
  status: 'active' | 'inactive' | 'canceled';
  type: 'virtual' | 'physical';
  spending_controls?: {
    spending_limits?: Array<{
      amount: number;
      interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
    }>;
  };
}

export interface StripeCardholderData {
  id: string;
  name: string;
  email?: string;
  phone_number?: string;
  status: 'active' | 'inactive';
  type: 'individual' | 'company';
}

export class StripeIssuingService {
  private stripeApiKey: string;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor() {
    this.stripeApiKey = process.env.STRIPE_SECRET_KEY || '';
    if (!this.stripeApiKey) {
      console.warn('STRIPE_SECRET_KEY not configured - using mock implementation');
    }
  }

  private async makeStripeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT', body?: any): Promise<any> {
    if (!this.stripeApiKey) {
      return this.mockStripeRequest(endpoint, method, body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.stripeApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body ? new URLSearchParams(body).toString() : undefined,
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Stripe API error:', error);
      throw error;
    }
  }

  private async mockStripeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT', body?: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

    if (endpoint.includes('/issuing/cardholders')) {
      if (method === 'POST') {
        return {
          id: `ich_${Math.random().toString(36).substr(2, 10)}`,
          name: body.name,
          email: body.email,
          phone_number: body.phone_number,
          status: 'active',
          type: body.type || 'individual',
        } as StripeCardholderData;
      }
    }

    if (endpoint.includes('/issuing/cards')) {
      if (method === 'POST') {
        const last4 = Math.floor(1000 + Math.random() * 9000).toString();
        return {
          id: `ic_${Math.random().toString(36).substr(2, 10)}`,
          last4,
          brand: 'Visa',
          exp_month: new Date().getMonth() + 1,
          exp_year: new Date().getFullYear() + 3,
          cardholder: {
            id: body.cardholder,
            name: 'Cardholder Name',
          },
          status: 'active',
          type: body.type,
        } as StripeCardData;
      }

      if (method === 'GET') {
        return {
          id: endpoint.split('/').pop(),
          last4: '1234',
          brand: 'Visa',
          exp_month: 12,
          exp_year: 2026,
          cardholder: {
            id: 'ich_123',
            name: 'Cardholder Name',
          },
          status: 'active',
          type: 'virtual',
        } as StripeCardData;
      }

      if (method === 'PUT') {
        return {
          id: endpoint.split('/').pop(),
          last4: '1234',
          brand: 'Visa',
          exp_month: 12,
          exp_year: 2026,
          cardholder: {
            id: 'ich_123',
            name: 'Cardholder Name',
          },
          status: body.status || 'active',
          type: 'virtual',
          spending_controls: body.spending_controls,
        } as StripeCardData;
      }
    }

    throw new Error(`Mock endpoint not implemented: ${method} ${endpoint}`);
  }

  async createCardholder(userId: string, userData: {
    name: string;
    email?: string;
    phone?: string;
    billing?: {
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
  }): Promise<StripeCardholderData> {
    const cardholderData = await this.makeStripeRequest('/issuing/cardholders', 'POST', {
      name: userData.name,
      email: userData.email,
      phone_number: userData.phone,
      type: 'individual',
      billing: userData.billing ? JSON.stringify(userData.billing) : undefined,
    });

    return cardholderData;
  }

  async issueVirtualCard(userId: string, cardholderId: string): Promise<Card> {
    const stripeCard = await this.makeStripeRequest('/issuing/cards', 'POST', {
      cardholder: cardholderId,
      type: 'virtual',
      currency: 'usd',
      status: 'active',
    });

    const card = await prisma.card.create({
      data: {
        userId,
        type: CardType.VIRTUAL,
        status: CardStatus.ACTIVE,
        lastFour: stripeCard.last4,
        expiryMonth: stripeCard.exp_month,
        expiryYear: stripeCard.exp_year,
        cvv: Math.floor(100 + Math.random() * 900).toString(),
        stripeCardId: stripeCard.id,
        stripeCardholderId: cardholderId,
        dailyLimit: 1000,
        monthlyLimit: 25000,
        singleTxLimit: 10000,
        frozen: false,
        allowOnline: true,
        allowInStore: true,
        allowAtm: true,
        allowInternational: true,
      }
    });

    return card;
  }

  async issuePhysicalCard(userId: string, cardholderId: string, shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }): Promise<Card> {
    const stripeCard = await this.makeStripeRequest('/issuing/cards', 'POST', {
      cardholder: cardholderId,
      type: 'physical',
      currency: 'usd',
      status: 'active',
      shipping: JSON.stringify({
        name: shippingAddress.name,
        address: {
          line1: shippingAddress.line1,
          line2: shippingAddress.line2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
      }),
    });

    const card = await prisma.card.create({
      data: {
        userId,
        type: CardType.PHYSICAL,
        status: CardStatus.ACTIVE,
        lastFour: stripeCard.last4,
        expiryMonth: stripeCard.exp_month,
        expiryYear: stripeCard.exp_year,
        cvv: Math.floor(100 + Math.random() * 900).toString(),
        stripeCardId: stripeCard.id,
        stripeCardholderId: cardholderId,
        physicalStatus: PhysicalCardStatus.SHIPPED,
        shippingAddress: JSON.stringify(shippingAddress),
        trackingNumber: `TRK${Date.now()}`,
        dailyLimit: 1000,
        monthlyLimit: 25000,
        singleTxLimit: 10000,
        frozen: false,
        allowOnline: true,
        allowInStore: true,
        allowAtm: true,
        allowInternational: true,
      }
    });

    return card;
  }

  async getCard(stripeCardId: string): Promise<StripeCardData> {
    return await this.makeStripeRequest(`/issuing/cards/${stripeCardId}`, 'GET');
  }

  async updateCardStatus(stripeCardId: string, status: 'active' | 'inactive' | 'canceled'): Promise<StripeCardData> {
    return await this.makeStripeRequest(`/issuing/cards/${stripeCardId}`, 'PUT', {
      status,
    });
  }

  async freezeCard(cardId: string, frozen: boolean): Promise<Card> {
    const card = await prisma.card.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    await this.updateCardStatus(card.stripeCardId, frozen ? 'inactive' : 'active');

    return prisma.card.update({
      where: { id: cardId },
      data: { frozen }
    });
  }

  async setSpendingLimit(cardId: string, limits: { 
    daily?: number; 
    monthly?: number; 
    singleTransaction?: number;
  }): Promise<Card> {
    const card = await prisma.card.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    const spendingControls: any = {};
    
    if (limits.daily !== undefined || limits.monthly !== undefined) {
      spendingControls.spending_limits = [];
      
      if (limits.daily !== undefined) {
        spendingControls.spending_limits.push({
          amount: Math.round(limits.daily * 100), // Convert to cents
          interval: 'daily',
        });
      }
      
      if (limits.monthly !== undefined) {
        spendingControls.spending_limits.push({
          amount: Math.round(limits.monthly * 100), // Convert to cents
          interval: 'monthly',
        });
      }
    }

    await this.makeStripeRequest(`/issuing/cards/${card.stripeCardId}`, 'PUT', {
      spending_controls: JSON.stringify(spendingControls),
    });

    return prisma.card.update({
      where: { id: cardId },
      data: {
        dailyLimit: limits.daily ?? card.dailyLimit,
        monthlyLimit: limits.monthly ?? card.monthlyLimit,
        singleTxLimit: limits.singleTransaction ?? card.singleTxLimit,
      }
    });
  }

  async updateCardControls(cardId: string, controls: {
    allowOnline?: boolean;
    allowInStore?: boolean;
    allowAtm?: boolean;
    allowInternational?: boolean;
  }): Promise<Card> {
    const card = await prisma.card.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    const spendingControls: any = {};
    
    if (controls.allowOnline !== undefined) {
      spendingControls.allowed_categories = spendingControls.allowed_categories || [];
      if (controls.allowOnline) {
        spendingControls.allowed_categories.push('online_payments');
      }
    }
    
    if (controls.allowInternational !== undefined) {
      spendingControls.blocked_categories = spendingControls.blocked_categories || [];
      if (!controls.allowInternational) {
        spendingControls.blocked_categories.push('international');
      }
    }

    if (Object.keys(spendingControls).length > 0) {
      await this.makeStripeRequest(`/issuing/cards/${card.stripeCardId}`, 'PUT', {
        spending_controls: JSON.stringify(spendingControls),
      });
    }

    return prisma.card.update({
      where: { id: cardId },
      data: {
        allowOnline: controls.allowOnline ?? card.allowOnline,
        allowInStore: controls.allowInStore ?? card.allowInStore,
        allowAtm: controls.allowAtm ?? card.allowAtm,
        allowInternational: controls.allowInternational ?? card.allowInternational,
      }
    });
  }

  async getCardTransactions(stripeCardId: string, limit: number = 10): Promise<any[]> {
    return await this.makeStripeRequest(`/issuing/transactions?card=${stripeCardId}&limit=${limit}`, 'GET');
  }
}

export const stripeIssuingService = new StripeIssuingService();