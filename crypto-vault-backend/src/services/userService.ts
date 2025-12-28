import { PrismaClient, User, Card, Transaction, Balance } from '@prisma/client';
import { KYCStatus, TransactionType } from '../types';
import { aetheriaCardService } from './aetheriaCardService';
import { kycService } from './kycService';
import { stripeIssuingService } from './stripeIssuing';
import { circlePaymentsService } from './circlePayments';
import { tonBridgeService } from './tonBridge';

const prisma = new PrismaClient();

export interface UserRegistrationData {
  email: string;
  phone?: string;
  walletAddress?: string;
  referralCode?: string;
}

export interface UserProfile {
  user: User;
  cards: Card[];
  balances: Balance[];
  recentTransactions: Transaction[];
  kycStatus: {
    status: KYCStatus;
    data?: any;
  };
}

export class UserService {
  async registerUser(data: UserRegistrationData): Promise<User> {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // 2. Create new user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        walletAddress: data.walletAddress,
        kycStatus: KYCStatus.NOT_SUBMITTED,
        dailyLimit: 1000, // Default limits for unverified users
        monthlyLimit: 10000,
        referralCode: data.referralCode,
      }
    });

    // 3. Create default balance records
    await prisma.balance.createMany({
      data: [
        {
          userId: user.id,
          asset: 'USD',
          assetType: 'FIAT',
          available: 0,
          total: 0,
        },
        {
          userId: user.id,
          asset: 'USDC',
          assetType: 'CRYPTO',
          available: 0,
          total: 0,
        },
        {
          userId: user.id,
          asset: 'TON',
          assetType: 'CRYPTO',
          available: 0,
          total: 0,
        },
      ]
    });

    return user;
  }

  async getUserById(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        cards: {
          orderBy: { createdAt: 'desc' },
        },
        balances: true,
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        card: true,
      }
    });

    return {
      user,
      cards: user.cards,
      balances: user.balances,
      recentTransactions,
      kycStatus: {
        status: user.kycStatus,
        data: user.kycData ? JSON.parse(user.kycData) : undefined,
      },
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  async updateUserProfile(userId: string, data: {
    phone?: string;
    walletAddress?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
  }): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        phone: data.phone,
        walletAddress: data.walletAddress,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
      }
    });

    return user;
  }

  async updateUserLimits(userId: string, limits: {
    dailyLimit?: number;
    monthlyLimit?: number;
    singleTransactionLimit?: number;
  }): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: limits
    });

    return user;
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            cards: true,
            transactions: true,
          }
        },
        balances: true,
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate total transaction volume
    const transactionStats = await prisma.transaction.aggregate({
      where: { userId },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Calculate monthly spending
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlySpending = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'PURCHASE',
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      userId: user.id,
      email: user.email,
      kycStatus: user.kycStatus,
      cardCount: user._count.cards,
      transactionCount: user._count.transactions,
      totalTransactionVolume: Math.abs(transactionStats._sum.amount || 0),
      monthlySpending: Math.abs(monthlySpending._sum.amount || 0),
      balances: user.balances,
      joinedAt: user.createdAt,
    };
  }

  async deactivateUser(userId: string): Promise<User> {
    // 1. Freeze all user cards
    const userCards = await prisma.card.findMany({
      where: { userId }
    });

    for (const card of userCards) {
      await stripeIssuingService.freezeCard(card.id, true);
    }

    // 2. Update user status
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'DEACTIVATED',
      }
    });

    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    // 1. Check if user has any active cards
    const activeCards = await prisma.card.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      }
    });

    if (activeCards.length > 0) {
      throw new Error('Cannot delete user with active cards');
    }

    // 2. Delete user data (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });
  }

  async getUserReferrals(userId: string): Promise<any[]> {
    const referrals = await prisma.user.findMany({
      where: {
        referredBy: userId,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        kycStatus: true,
      }
    });

    return referrals;
  }

  async generateReferralCode(userId: string): Promise<string> {
    const code = `AETHERIA${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        referralCode: code,
      }
    });

    return code;
  }

  async getUserByReferralCode(code: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { referralCode: code }
    });
  }

  async addReferral(userId: string, referredByCode: string): Promise<void> {
    const referrer = await this.getUserByReferralCode(referredByCode);
    
    if (!referrer) {
      throw new Error('Invalid referral code');
    }

    if (referrer.id === userId) {
      throw new Error('Cannot refer yourself');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        referredBy: referrer.id,
      }
    });
  }

  async getUserNotifications(userId: string): Promise<any[]> {
    // This would typically come from a notifications table
    // For now, return recent transaction notifications
    const recentTransactions = await prisma.transaction.findMany({
      where: { 
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return recentTransactions.map(tx => ({
      id: tx.id,
      type: 'transaction',
      title: tx.type === TransactionType.CARD_PURCHASE ? 'Card Purchase' : 'Transaction Update',
      message: `${tx.merchantName || 'Transaction'} - $${Math.abs(tx.amount)}`,
      timestamp: tx.createdAt,
      read: false,
      data: tx,
    }));
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    // This would typically update a notifications table
    // For now, just log the action
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);
  }
}

export const userService = new UserService();