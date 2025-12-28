import { PrismaClient } from '@prisma/client';
import { CardType, CardStatus, PhysicalCardStatus, TransactionType, TransactionStatus, TransactionCategory, KYCStatus } from '../types';
import { stripeIssuingService } from './stripeIssuing';
import { circlePaymentsService } from './circlePayments';
import { tonBridgeService } from './tonBridge';

const prisma = new PrismaClient();

export interface CardFundingOptions {
  amount: number;
  currency: string;
  paymentMethod: 'usdc' | 'ton' | 'usd';
  cardId: string;
}

export interface CardControls {
  frozen?: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  singleTransactionLimit?: number;
  allowOnline?: boolean;
  allowInStore?: boolean;
  allowAtm?: boolean;
  allowInternational?: boolean;
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  category?: TransactionCategory;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AetheriaCardService {
  async issueCard(userId: string, type: string, options?: {
    cardholderData?: {
      name: string;
      email?: string;
      phone?: string;
      billing?: {
        address: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
      };
    };
    shippingAddress?: {
      name: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  }): Promise<any> {
    // 1. Get or create cardholder
    let cardholderId: string;
    
    if (options?.cardholderData) {
      const cardholder = await stripeIssuingService.createCardholder(userId, options.cardholderData);
      cardholderId = cardholder.id;
    } else {
      // Use existing cardholder or create default one
      const existingCards = await prisma.card.findMany({
        where: { userId },
        take: 1,
      });
      
      if (existingCards.length > 0) {
        cardholderId = existingCards[0].stripeCardholderId;
      } else {
        const cardholder = await stripeIssuingService.createCardholder(userId, {
          name: 'Default Cardholder',
        });
        cardholderId = cardholder.id;
      }
    }

    // 2. Issue card based on type
    let card;
    if (type === CardType.VIRTUAL) {
      card = await stripeIssuingService.issueVirtualCard(userId, cardholderId);
    } else if (type === CardType.PHYSICAL) {
      if (!options?.shippingAddress) {
        throw new Error('Shipping address required for physical cards');
      }
      card = await stripeIssuingService.issuePhysicalCard(userId, cardholderId, options.shippingAddress);
    } else {
      throw new Error('Invalid card type');
    }

    // 3. Create initial balance record
    await prisma.balance.upsert({
      where: { userId_asset: { userId, asset: 'USD' } },
      update: {},
      create: {
        userId,
        asset: 'USD',
        assetType: 'FIAT',
        available: 0,
        total: 0,
      }
    });

    return card;
  }

  async getCard(cardId: string): Promise<any> {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        user: true,
      }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    return card;
  }

  async getUserCards(userId: string): Promise<any[]> {
    const cards = await prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return cards;
  }

  async freezeCard(cardId: string, frozen: boolean): Promise<any> {
    const card = await stripeIssuingService.freezeCard(cardId, frozen);
    return card;
  }

  async setSpendingLimit(cardId: string, limits: {
    daily?: number;
    monthly?: number;
    singleTransaction?: number;
  }): Promise<any> {
    const card = await stripeIssuingService.setSpendingLimit(cardId, limits);
    return card;
  }

  async updateCardControls(cardId: string, controls: CardControls): Promise<any> {
    const card = await stripeIssuingService.updateCardControls(cardId, {
      allowOnline: controls.allowOnline,
      allowInStore: controls.allowInStore,
      allowAtm: controls.allowAtm,
      allowInternational: controls.allowInternational,
    });

    if (controls.frozen !== undefined) {
      await stripeIssuingService.freezeCard(cardId, controls.frozen);
    }

    if (controls.dailyLimit !== undefined || controls.monthlyLimit !== undefined || controls.singleTransactionLimit !== undefined) {
      await stripeIssuingService.setSpendingLimit(cardId, {
        daily: controls.dailyLimit,
        monthly: controls.monthlyLimit,
        singleTransaction: controls.singleTransactionLimit,
      });
    }

    return card;
  }

  async topUpFromWallet(cardId: string, amount: number, asset: string): Promise<any> {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { user: true }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    const userId = card.userId;

    // 1. Convert crypto to USD if needed
    let usdAmount = amount;
    
    if (asset === 'USDC') {
      const conversion = await circlePaymentsService.convertUSDCToUSD(userId, amount);
      usdAmount = amount; // 1:1 conversion
    } else if (asset === 'TON') {
      // Convert TON to USD using current price
      const tonPrice = await tonBridgeService.convertTONToUSD(amount);
      usdAmount = tonPrice;
      
      // Create TON transaction record
      await prisma.transaction.create({
        data: {
          userId,
          type: TransactionType.CRYPTO_SWAP,
          category: TransactionCategory.OTHER,
          amount: amount,
          currency: 'TON',
          cryptoAmount: amount,
          cryptoCurrency: 'TON',
          status: TransactionStatus.COMPLETED,
          metadata: JSON.stringify({
            conversionType: 'TON_TO_USD',
            usdAmount,
            tonPrice: tonPrice / amount,
          }),
        }
      });
    }

    // 2. Create card funding transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        cardId,
        type: TransactionType.TOP_UP,
        category: TransactionCategory.CARD,
        amount: usdAmount,
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        metadata: JSON.stringify({
          originalAsset: asset,
          originalAmount: amount,
          conversionRate: usdAmount / amount,
        }),
      }
    });

    // 3. Update USD balance
    const balance = await prisma.balance.upsert({
      where: { userId_asset: { userId, asset: 'USD' } },
      update: { 
        available: { increment: usdAmount },
        total: { increment: usdAmount }
      },
      create: {
        userId,
        asset: 'USD',
        assetType: 'FIAT',
        available: usdAmount,
        total: usdAmount,
      }
    });

    return {
      transaction,
      balance,
      usdAmount,
    };
  }

  async getBalance(userId: string, asset: string = 'USD'): Promise<any> {
    const balance = await prisma.balance.findUnique({
      where: { userId_asset: { userId, asset } }
    });

    if (!balance) {
      return {
        userId,
        asset,
        available: 0,
        total: 0,
      };
    }

    return balance;
  }

  async getCardBalance(cardId: string): Promise<any> {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { user: true }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    return this.getBalance(card.userId, 'USD');
  }

  async getTransactions(filters: TransactionFilters): Promise<any[]> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      include: {
        user: true,
        card: true,
      }
    });

    return transactions;
  }

  async getCardTransactions(cardId: string, filters?: TransactionFilters): Promise<any[]> {
    const where: any = { cardId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      include: {
        user: true,
        card: true,
      }
    });

    return transactions;
  }

  async processCardTransaction(cardId: string, amount: number, merchant: string, category: TransactionCategory): Promise<any> {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { user: true }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    if (card.frozen) {
      throw new Error('Card is frozen');
    }

    if (card.status !== CardStatus.ACTIVE) {
      throw new Error('Card is not active');
    }

    // 1. Check spending limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todaysTransactions = await prisma.transaction.findMany({
      where: {
        cardId,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.COMPLETED,
        createdAt: {
          gte: today,
        },
      },
    });

    const todaysSpending = todaysTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    if (todaysSpending + amount > card.dailyLimit) {
      throw new Error('Daily spending limit exceeded');
    }

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        cardId,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.COMPLETED,
        createdAt: {
          gte: thisMonth,
        },
      },
    });

    const monthlySpending = monthlyTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    if (monthlySpending + amount > card.monthlyLimit) {
      throw new Error('Monthly spending limit exceeded');
    }

    if (amount > card.singleTxLimit) {
      throw new Error('Single transaction limit exceeded');
    }

    // 2. Check balance
    const balance = await this.getBalance(card.userId, 'USD');
    
    if (balance.available < amount) {
      throw new Error('Insufficient balance');
    }

    // 3. Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: card.userId,
        cardId,
        type: TransactionType.PURCHASE,
        category,
        amount: -amount, // Negative for purchases
        currency: 'USD',
        merchant,
        status: TransactionStatus.COMPLETED,
        metadata: JSON.stringify({
          originalBalance: balance.available,
          newBalance: balance.available - amount,
        }),
      }
    });

    // 4. Update balance
    const updatedBalance = await prisma.balance.update({
      where: { userId_asset: { userId: card.userId, asset: 'USD' } },
      data: { 
        available: { decrement: amount },
        total: { decrement: amount }
      }
    });

    // 5. Update card spending
    await prisma.card.update({
      where: { id: cardId },
      data: {
        spentToday: { increment: amount },
        spentThisMonth: { increment: amount },
      }
    });

    return {
      transaction,
      balance: updatedBalance,
    };
  }

  async refundTransaction(transactionId: string, refundAmount?: number): Promise<any> {
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { card: true }
    });

    if (!originalTransaction) {
      throw new Error('Transaction not found');
    }

    if (originalTransaction.type !== TransactionType.CARD_TOPUP) {
      throw new Error('Only purchase transactions can be refunded');
    }

    const amount = refundAmount || Math.abs(originalTransaction.amount);

    // 1. Create refund transaction
    const refundTransaction = await prisma.transaction.create({
      data: {
        userId: originalTransaction.userId,
        cardId: originalTransaction.cardId,
        type: TransactionType.CARD_REFUND,
        category: originalTransaction.category,
        amount: amount, // Positive for refunds
        currency: originalTransaction.currency,
        merchantName: originalTransaction.merchantName,
        status: TransactionStatus.COMPLETED,
        metadata: JSON.stringify({
          originalTransactionId: transactionId,
          refundAmount: amount,
        }),
      }
    });

    // 2. Update balance
    const balance = await prisma.balance.update({
      where: { userId_asset: { userId: originalTransaction.userId, asset: 'USD' } },
      data: { 
        available: { increment: amount },
        total: { increment: amount }
      }
    });

    return {
      refundTransaction,
      balance,
    };
  }

  async updateKYCStatus(userId: string, status: KYCStatus, kycData?: any): Promise<any> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: status,
        kycData: kycData ? JSON.stringify(kycData) : undefined,
      }
    });

    return user;
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
}

export const aetheriaCardService = new AetheriaCardService();