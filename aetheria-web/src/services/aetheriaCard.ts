// Aetheria Card API Service
// Frontend-first API design with mock implementation
// This service provides a clean interface for card operations that can be swapped from mock to real backend

export interface Card {
  id: string;
  userId: string;
  type: CardType;
  status: CardStatus;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  cardNumber?: string;
  physicalStatus?: PhysicalCardStatus;
  dailyLimit: number;
  monthlyLimit: number;
  singleTxLimit: number;
  spentToday: number;
  spentThisMonth: number;
  frozen: boolean;
  allowOnline: boolean;
  allowInStore: boolean;
  allowAtm: boolean;
  allowInternational: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Balance {
  cardId: string;
  available: number;
  pending: number;
  currency: string;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  cardId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  merchant?: string;
  merchantCategory?: string;
  status: TransactionStatus;
  settledAt?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface SpendLimit {
  daily?: number;
  monthly?: number;
  singleTx?: number;
}

export interface TxFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export const CardType = {
  VIRTUAL: 'VIRTUAL',
  PHYSICAL: 'PHYSICAL'
} as const;

export type CardType = typeof CardType[keyof typeof CardType];

export const CardStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED'
} as const;

export type CardStatus = typeof CardStatus[keyof typeof CardStatus];

export const PhysicalCardStatus = {
  ORDERED: 'ORDERED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  ACTIVATED: 'ACTIVATED'
} as const;

export type PhysicalCardStatus = typeof PhysicalCardStatus[keyof typeof PhysicalCardStatus];

export const TransactionType = {
  PURCHASE: 'PURCHASE',
  REFUND: 'REFUND',
  TOP_UP: 'TOP_UP',
  WITHDRAWAL: 'WITHDRAWAL',
  FEE: 'FEE'
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const TransactionStatus = {
  PENDING: 'PENDING',
  SETTLED: 'SETTLED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
} as const;

export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

export interface AetheriaCardService {
  // Card lifecycle
  issueCard(userId: string, type: CardType): Promise<Card>;
  getCard(cardId: string): Promise<Card>;
  getUserCards(userId: string): Promise<Card[]>;
  
  // Controls
  freezeCard(cardId: string, frozen: boolean): Promise<void>;
  setSpendingLimit(cardId: string, limit: SpendLimit): Promise<void>;
  updateCardSettings(cardId: string, settings: Partial<Card>): Promise<void>;
  
  // Funding
  topUpFromWallet(cardId: string, amount: number, asset: string): Promise<Transaction>;
  getBalance(cardId: string): Promise<Balance>;
  
  // Transactions
  getTransactions(cardId: string, filters?: TxFilters): Promise<Transaction[]>;
  getTransaction(transactionId: string): Promise<Transaction>;
}

// Configuration
const ENABLE_MOCK = import.meta.env.VITE_ENABLE_MOCK_SERVICES === 'true';
const API_URL = import.meta.env.VITE_CARD_API_URL || 'http://localhost:3002/api';

// Mock data generator
const generateMockCard = (userId: string, type: CardType = CardType.VIRTUAL): Card => ({
  id: `card_${Math.random().toString(36).substr(2, 9)}`,
  userId,
  type,
  status: CardStatus.ACTIVE,
  lastFour: Math.floor(Math.random() * 9000 + 1000).toString(),
  expiryMonth: Math.floor(Math.random() * 12) + 1,
  expiryYear: new Date().getFullYear() + Math.floor(Math.random() * 5) + 1,
  dailyLimit: 1000,
  monthlyLimit: 25000,
  singleTxLimit: 10000,
  spentToday: Math.floor(Math.random() * 500),
  spentThisMonth: Math.floor(Math.random() * 5000),
  frozen: false,
  allowOnline: true,
  allowInStore: true,
  allowAtm: true,
  allowInternational: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

const generateMockBalance = (cardId: string): Balance => ({
  cardId,
  available: Math.floor(Math.random() * 10000) + 1000,
  pending: Math.floor(Math.random() * 500),
  currency: 'USD',
  lastUpdated: new Date()
});

const generateMockTransactions = (cardId: string, count: number = 10): Transaction[] => {
  const merchants = ['Starbucks', 'Amazon', 'Uber', 'Netflix', 'Apple', 'Spotify', 'Target', 'Walmart'];
  const types = [TransactionType.PURCHASE, TransactionType.REFUND, TransactionType.TOP_UP];
  const statuses = [TransactionStatus.SETTLED, TransactionStatus.PENDING];
  
  return Array.from({ length: count }, () => ({
    id: `tx_${Math.random().toString(36).substr(2, 9)}`,
    cardId,
    type: types[Math.floor(Math.random() * types.length)],
    amount: Math.floor(Math.random() * 500) + 10,
    currency: 'USD',
    merchant: merchants[Math.floor(Math.random() * merchants.length)],
    merchantCategory: 'retail',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    settledAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
  }));
};

// Mock implementation
class MockAetheriaCardService implements AetheriaCardService {
  private mockCards: Map<string, Card> = new Map();
  private mockBalances: Map<string, Balance> = new Map();
  private mockTransactions: Map<string, Transaction[]> = new Map();
  
  constructor() {
    // Initialize with some mock data
    const userId = 'user_123';
    const card = generateMockCard(userId);
    this.mockCards.set(card.id, card);
    this.mockBalances.set(card.id, generateMockBalance(card.id));
    this.mockTransactions.set(card.id, generateMockTransactions(card.id));
  }
  
  async issueCard(userId: string, type: CardType): Promise<Card> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const card = generateMockCard(userId, type);
    this.mockCards.set(card.id, card);
    this.mockBalances.set(card.id, generateMockBalance(card.id));
    this.mockTransactions.set(card.id, []);
    
    return card;
  }
  
  async getCard(cardId: string): Promise<Card> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const card = this.mockCards.get(cardId);
    if (!card) {
      throw new Error('Card not found');
    }
    
    return card;
  }
  
  async getUserCards(userId: string): Promise<Card[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return Array.from(this.mockCards.values()).filter(card => card.userId === userId);
  }
  
  async freezeCard(cardId: string, frozen: boolean): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const card = this.mockCards.get(cardId);
    if (!card) {
      throw new Error('Card not found');
    }
    
    card.frozen = frozen;
    card.updatedAt = new Date();
    this.mockCards.set(cardId, card);
  }
  
  async setSpendingLimit(cardId: string, limit: SpendLimit): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const card = this.mockCards.get(cardId);
    if (!card) {
      throw new Error('Card not found');
    }
    
    if (limit.daily) card.dailyLimit = limit.daily;
    if (limit.monthly) card.monthlyLimit = limit.monthly;
    if (limit.singleTx) card.singleTxLimit = limit.singleTx;
    
    card.updatedAt = new Date();
    this.mockCards.set(cardId, card);
  }
  
  async updateCardSettings(cardId: string, settings: Partial<Card>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const card = this.mockCards.get(cardId);
    if (!card) {
      throw new Error('Card not found');
    }
    
    Object.assign(card, settings, { updatedAt: new Date() });
    this.mockCards.set(cardId, card);
  }
  
  async topUpFromWallet(cardId: string, amount: number, _asset: string): Promise<Transaction> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const balance = this.mockBalances.get(cardId);
    if (!balance) {
      throw new Error('Card balance not found');
    }
    
    // Simulate top-up transaction
    const transaction: Transaction = {
      id: `tx_${Math.random().toString(36).substr(2, 9)}`,
      cardId,
      type: TransactionType.TOP_UP,
      amount,
      currency: 'USD',
      status: TransactionStatus.SETTLED,
      settledAt: new Date(),
      createdAt: new Date()
    };
    
    // Update balance
    balance.available += amount;
    balance.lastUpdated = new Date();
    this.mockBalances.set(cardId, balance);
    
    // Add transaction
    const transactions = this.mockTransactions.get(cardId) || [];
    transactions.unshift(transaction);
    this.mockTransactions.set(cardId, transactions);
    
    return transaction;
  }
  
  async getBalance(cardId: string): Promise<Balance> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const balance = this.mockBalances.get(cardId);
    if (!balance) {
      throw new Error('Card balance not found');
    }
    
    return balance;
  }
  
  async getTransactions(cardId: string, filters?: TxFilters): Promise<Transaction[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let transactions = this.mockTransactions.get(cardId) || [];
    
    // Apply filters
    if (filters) {
      if (filters.type) {
        transactions = transactions.filter(tx => tx.type === filters.type);
      }
      if (filters.status) {
        transactions = transactions.filter(tx => tx.status === filters.status);
      }
      if (filters.startDate) {
        transactions = transactions.filter(tx => tx.createdAt >= filters.startDate!);
      }
      if (filters.endDate) {
        transactions = transactions.filter(tx => tx.createdAt <= filters.endDate!);
      }
      if (filters.limit) {
        transactions = transactions.slice(0, filters.limit);
      }
    }
    
    return transactions;
  }
  
  async getTransaction(transactionId: string): Promise<Transaction> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    for (const transactions of this.mockTransactions.values()) {
      const transaction = transactions.find(tx => tx.id === transactionId);
      if (transaction) {
        return transaction;
      }
    }
    
    throw new Error('Transaction not found');
  }
}

// Real API implementation (for future use)
class RealAetheriaCardService implements AetheriaCardService {
  private apiUrl: string;
  
  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }
  
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  }
  
  async issueCard(userId: string, type: CardType): Promise<Card> {
    const response = await this.fetchWithAuth('/cards/issue', {
      method: 'POST',
      body: JSON.stringify({ userId, type })
    });
    return response.json();
  }
  
  async getCard(cardId: string): Promise<Card> {
    const response = await this.fetchWithAuth(`/cards/${cardId}`);
    return response.json();
  }
  
  async getUserCards(userId: string): Promise<Card[]> {
    const response = await this.fetchWithAuth(`/cards/user/${userId}`);
    return response.json();
  }
  
  async freezeCard(cardId: string, frozen: boolean): Promise<void> {
    await this.fetchWithAuth(`/cards/${cardId}/freeze`, {
      method: 'POST',
      body: JSON.stringify({ frozen })
    });
  }
  
  async setSpendingLimit(cardId: string, limit: SpendLimit): Promise<void> {
    await this.fetchWithAuth(`/cards/${cardId}/limits`, {
      method: 'POST',
      body: JSON.stringify(limit)
    });
  }
  
  async updateCardSettings(cardId: string, settings: Partial<Card>): Promise<void> {
    await this.fetchWithAuth(`/cards/${cardId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  }
  
  async topUpFromWallet(cardId: string, amount: number, asset: string): Promise<Transaction> {
    const response = await this.fetchWithAuth(`/cards/${cardId}/topup`, {
      method: 'POST',
      body: JSON.stringify({ amount, asset })
    });
    return response.json();
  }
  
  async getBalance(cardId: string): Promise<Balance> {
    const response = await this.fetchWithAuth(`/cards/${cardId}/balance`);
    return response.json();
  }
  
  async getTransactions(cardId: string, filters?: TxFilters): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await this.fetchWithAuth(`/cards/${cardId}/transactions?${queryParams}`);
    return response.json();
  }
  
  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await this.fetchWithAuth(`/transactions/${transactionId}`);
    return response.json();
  }
}

// Export singleton instance based on configuration
export const aetheriaCardService: AetheriaCardService = ENABLE_MOCK 
  ? new MockAetheriaCardService()
  : new RealAetheriaCardService(API_URL);

// Helper functions for common operations
export const getUserId = (): string => {
  // Get user ID from localStorage or wallet
  return localStorage.getItem('userId') || 'user_123';
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatCardNumber = (lastFour: string): string => {
  return `•••• •••• •••• ${lastFour}`;
};

export const getCardTypeIcon = (type: CardType): string => {
  return type === CardType.VIRTUAL ? '💳' : '🏦';
};

export default aetheriaCardService;