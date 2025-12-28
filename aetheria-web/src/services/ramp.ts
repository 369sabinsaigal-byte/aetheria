import axios from 'axios';

// Ramp Network API Configuration
const RAMP_CONFIG = {
  BASE_URL: import.meta.env.VITE_RAMP_BASE_URL || 'https://api.ramp.com',
  CLIENT_ID: import.meta.env.VITE_RAMP_CLIENT_ID || 'demo-client-id',
  CLIENT_SECRET: import.meta.env.VITE_RAMP_CLIENT_SECRET || 'demo-client-secret',
  VAULT_URL: import.meta.env.VITE_RAMP_VAULT_URL || 'https://vault-api.ramp.com'
};

// Types for Ramp Network integration
export interface VirtualCard {
  id: string;
  cardholderName: string;
  lastFour: string;
  expiration: string;
  spendingLimit: number;
  currency: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  createdAt: string;
  provider?: 'ramp' | 'striga';
}

export interface CardCreationRequest {
  userId: string;
  displayName: string;
  spendingLimit: number;
  currency?: string;
  merchantRestrictions?: string[];
  expirationDays?: number;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  status: 'PENDING' | 'SETTLED' | 'DECLINED';
  timestamp: string;
  cardLastFour: string;
}

export interface ConversionQuote {
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  fees: number;
  totalCost: number;
  expiresAt: string;
}

class RampService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  // Initialize Ramp service with authentication
  async initialize(): Promise<boolean> {
    try {
      await this.authenticate();
      console.log('Ramp Network service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Ramp service:', error);
      return false;
    }
  }

  // Authenticate with Ramp API using client credentials
  private async authenticate(): Promise<void> {
    if (this.isTokenValid()) {
      return;
    }

    try {
      const authString = btoa(`${RAMP_CONFIG.CLIENT_ID}:${RAMP_CONFIG.CLIENT_SECRET}`);
      
      const response = await axios.post(
        `${RAMP_CONFIG.BASE_URL}/developer/v1/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'cards:write cards:read cards:read_vault transactions:read limits:write'
        }),
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
    } catch (error) {
      console.error('Ramp authentication failed:', error);
      throw new Error('Failed to authenticate with Ramp Network');
    }
  }

  private isTokenValid(): boolean {
    return this.accessToken !== null && 
           this.tokenExpiry !== null && 
           this.tokenExpiry > new Date();
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.isTokenValid()) {
      await this.authenticate();
    }
  }

  // Create a new virtual card
  async createVirtualCard(request: CardCreationRequest): Promise<VirtualCard> {
    await this.ensureAuthenticated();

    try {
      // In a real implementation, we would make the API call:
      /*
      await axios.post(
        `${RAMP_CONFIG.BASE_URL}/developer/v1/cards/deferred/virtual`,
        {
          user_id: request.userId,
          display_name: request.displayName,
          spending_restrictions: {
            amount: request.spendingLimit,
            currency: request.currency || 'USD',
            interval: 'MONTHLY',
            transaction_amount_limit: request.spendingLimit * 0.1 // 10% of total limit per transaction
          },
          idempotency_key: this.generateIdempotencyKey()
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      */

      // In a real implementation, we would poll for the deferred task completion
      // For demo purposes, we'll return a mock card
      return this.mockVirtualCard(request);
    } catch (error) {
      console.error('Failed to create virtual card:', error);
      throw new Error('Virtual card creation failed');
    }
  }

  // Get virtual card details including sensitive information
  async getVirtualCardDetails(cardId: string): Promise<any> {
    await this.ensureAuthenticated();

    try {
      const response = await axios.get(
        `${RAMP_CONFIG.VAULT_URL}/developer/v1/cards/${cardId}/details`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get card details:', error);
      // Return mock data for development
      return this.mockCardDetails(cardId);
    }
  }

  // Get card transactions
  async getCardTransactions(cardId: string, limit: number = 10): Promise<Transaction[]> {
    await this.ensureAuthenticated();

    try {
      const response = await axios.get(
        `${RAMP_CONFIG.BASE_URL}/developer/v1/transactions`,
        {
          params: {
            card_id: cardId,
            limit,
            sort: 'timestamp_desc'
          },
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get transactions:', error);
      // Return mock transactions for development
      return this.mockTransactions(cardId, limit);
    }
  }

  // Get crypto-to-fiat conversion quote
  async getConversionQuote(
    sourceAmount: number,
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<ConversionQuote> {
    await this.ensureAuthenticated();

    try {
      const response = await axios.post(
        `${RAMP_CONFIG.BASE_URL}/developer/v1/quotes`,
        {
          source_amount: sourceAmount,
          source_currency: sourceCurrency,
          target_currency: targetCurrency
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get conversion quote:', error);
      // Return mock quote for development
      return this.mockConversionQuote(sourceAmount, sourceCurrency, targetCurrency);
    }
  }

  // Execute crypto-to-fiat conversion
  async executeConversion(
    quoteId: string,
    cardId: string
  ): Promise<{ success: boolean; transactionId?: string }> {
    await this.ensureAuthenticated();

    try {
      const response = await axios.post(
        `${RAMP_CONFIG.BASE_URL}/developer/v1/conversions`,
        {
          quote_id: quoteId,
          destination_card_id: cardId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, transactionId: response.data.transaction_id };
    } catch (error) {
      console.error('Failed to execute conversion:', error);
      return { success: false };
    }
  }

  // Helper methods for demo/development
  private mockVirtualCard(request: CardCreationRequest): VirtualCard {
    return {
      id: `card_${Date.now()}`,
      cardholderName: 'Demo User',
      lastFour: Math.floor(1000 + Math.random() * 9000).toString(),
      expiration: '12/28',
      spendingLimit: request.spendingLimit,
      currency: request.currency || 'USD',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      provider: 'ramp'
    };
  }

  private mockCardDetails(cardId: string): any {
    return {
      id: cardId,
      pan: `4111********${Math.floor(1000 + Math.random() * 9000)}`,
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      expiration: '12/28',
      cardholderName: 'Demo User'
    };
  }

  private mockTransactions(cardId: string, limit: number): Transaction[] {
    const merchants = ['Amazon', 'Starbucks', 'Uber', 'Netflix', 'Apple', 'Google', 'Spotify'];
    const categories = ['Shopping', 'Food', 'Transportation', 'Entertainment', 'Technology', 'Services'];
    
    return Array.from({ length: limit }, (_, i) => ({
      id: `txn_${Date.now()}_${i}`,
      amount: Math.floor(Math.random() * 100) + 5,
      currency: 'USD',
      merchant: merchants[Math.floor(Math.random() * merchants.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      status: i % 3 === 0 ? 'PENDING' : 'SETTLED',
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
      cardLastFour: cardId.slice(-4)
    }));
  }

  private mockConversionQuote(
    sourceAmount: number,
    sourceCurrency: string,
    targetCurrency: string
  ): ConversionQuote {
    const exchangeRate = sourceCurrency === 'BTC' ? 45000 : 1;
    const fees = sourceAmount * 0.01; // 1% fee
    const targetAmount = (sourceAmount * exchangeRate) - fees;

    return {
      sourceAmount,
      sourceCurrency,
      targetAmount,
      targetCurrency,
      exchangeRate,
      fees,
      totalCost: sourceAmount,
      expiresAt: new Date(Date.now() + 300000).toISOString() // 5 minutes
    };
  }
}

// Export singleton instance
export const rampService = new RampService();