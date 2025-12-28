import { PrismaClient } from '@prisma/client';
import { TransactionType, TransactionStatus, TransactionCategory } from '../types';
import axios from 'axios';

const prisma = new PrismaClient();

export interface TonTransactionData {
  hash: string;
  lt: string;
  account: string;
  value: string;
  currency: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
}

export interface TonBalanceData {
  balance: string;
  currency: string;
}

export class TonBridgeService {
  private apiKey: string;
  private baseUrl: string;
  private masterWalletAddress: string;
  private toncenterUrl: string;

  constructor() {
    this.apiKey = process.env.TON_API_KEY || '';
    this.baseUrl = process.env.TON_API_URL || 'https://toncenter.com/api/v2';
    this.masterWalletAddress = process.env.TON_MASTER_WALLET_ADDRESS || '';
    this.toncenterUrl = 'https://toncenter.com/api/v2';
    
    if (!this.apiKey) {
      console.warn('TON_API_KEY not configured - using mock implementation');
    }
  }

  private async makeTonRequest(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<any> {
    if (!this.apiKey) {
      return this.mockTonRequest(endpoint, method, body);
    }

    try {
      const headers = {
        'X-API-Key': this.apiKey,
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
      console.error('TON API error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`TON API error: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }

  private async mockTonRequest(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

    if (endpoint.includes('/getTransactions')) {
      return {
        result: [
          {
            hash: `tx_${Math.random().toString(36).substr(2, 10)}`,
            lt: '1234567890',
            account: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
            value: '1000000000', // 1 TON in nanotons
            currency: 'TON',
            timestamp: Math.floor(Date.now() / 1000),
            status: 'success',
          }
        ]
      };
    }

    if (endpoint.includes('/getAddressBalance')) {
      return {
        result: '5000000000', // 5 TON in nanotons
      };
    }

    if (endpoint.includes('/sendTransaction')) {
      return {
        result: {
          hash: `tx_${Math.random().toString(36).substr(2, 10)}`,
          lt: '1234567890',
          status: 'success',
        }
      };
    }

    throw new Error(`Mock endpoint not implemented: ${method} ${endpoint}`);
  }

  async verifyTransaction(txHash: string): Promise<TonTransactionData | null> {
    try {
      const response = await this.makeTonRequest(`/getTransactions?address=${this.masterWalletAddress}&hash=${txHash}&limit=1`, 'GET');
      
      if (response.result && response.result.length > 0) {
        const tx = response.result[0];
        return {
          hash: tx.hash,
          lt: tx.lt,
          account: tx.account,
          value: tx.value,
          currency: 'TON',
          timestamp: tx.timestamp,
          status: tx.success ? 'success' : 'failed',
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error verifying TON transaction:', error);
      return null;
    }
  }

  async getBalance(address: string = this.masterWalletAddress): Promise<TonBalanceData> {
    try {
      const response = await this.makeTonRequest(`/getAddressBalance?address=${address}`, 'GET');
      
      return {
        balance: response.result,
        currency: 'TON',
      };
    } catch (error) {
      console.error('Error getting TON balance:', error);
      throw error;
    }
  }

  async processDeposit(userId: string, tonAmount: number, txHash: string): Promise<any> {
    // 1. Verify transaction on TON blockchain
    const transaction = await this.verifyTransaction(txHash);
    
    if (!transaction) {
      throw new Error('Transaction not found on TON blockchain');
    }

    if (transaction.status !== 'success') {
      throw new Error('Transaction failed on TON blockchain');
    }

    // 2. Convert TON amount to base units (nanotons)
    const amountInNanotons = Math.round(tonAmount * 1e9);
    
    if (parseInt(transaction.value) < amountInNanotons) {
      throw new Error('Transaction amount insufficient');
    }

    // 3. Create Transaction record
    const tx = await prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.CARD_TOPUP,
        category: TransactionCategory.CRYPTO,
        amount: tonAmount,
        currency: 'TON',
        cryptoAmount: tonAmount,
        cryptoCurrency: 'TON',
        status: TransactionStatus.COMPLETED,
        metadata: JSON.stringify({
          txHash,
          blockchain: 'TON',
          verificationTimestamp: Date.now(),
        }),
      }
    });

    // 4. Update Balance
    const balance = await prisma.balance.upsert({
      where: { userId_asset: { userId, asset: 'TON' } },
      update: { 
        available: { increment: tonAmount },
        total: { increment: tonAmount }
      },
      create: {
        userId,
        asset: 'TON',
        assetType: 'CRYPTO',
        available: tonAmount,
        total: tonAmount,
      }
    });

    return {
      transaction: tx,
      balance,
      verification: transaction,
    };
  }

  async sendTON(toAddress: string, amount: number, memo?: string): Promise<TonTransactionData> {
    try {
      // 1. Check master wallet balance
      const balance = await this.getBalance(this.masterWalletAddress);
      const masterBalance = parseInt(balance.balance) / 1e9; // Convert from nanotons
      
      if (masterBalance < amount) {
        throw new Error('Insufficient master wallet balance');
      }

      // 2. Create transaction
      const response = await this.makeTonRequest('/sendTransaction', 'POST', {
        from: this.masterWalletAddress,
        to: toAddress,
        amount: Math.round(amount * 1e9), // Convert to nanotons
        message: memo || 'TON Bridge withdrawal',
      });

      if (!response.result) {
        throw new Error('Failed to send TON transaction');
      }

      return {
        hash: response.result.hash,
        lt: response.result.lt,
        account: toAddress,
        value: Math.round(amount * 1e9).toString(),
        currency: 'TON',
        timestamp: Math.floor(Date.now() / 1000),
        status: 'success',
      };
    } catch (error) {
      console.error('Error sending TON:', error);
      throw error;
    }
  }

  async getTransactionHistory(address: string = this.masterWalletAddress, limit: number = 10): Promise<TonTransactionData[]> {
    try {
      const response = await this.makeTonRequest(`/getTransactions?address=${address}&limit=${limit}`, 'GET');
      
      return response.result.map((tx: any) => ({
        hash: tx.hash,
        lt: tx.lt,
        account: tx.account,
        value: tx.value,
        currency: 'TON',
        timestamp: tx.timestamp,
        status: tx.success ? 'success' : 'failed',
      }));
    } catch (error) {
      console.error('Error getting TON transaction history:', error);
      return [];
    }
  }

  async convertTONToUSD(tonAmount: number): Promise<number> {
    try {
      // Get TON price from CoinGecko or similar service
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'the-open-network',
          vs_currencies: 'usd',
        },
        timeout: 10000,
      });

      const tonPrice = response.data['the-open-network']?.usd || 0;
      return tonAmount * tonPrice;
    } catch (error) {
      console.error('Error getting TON price:', error);
      // Fallback to mock price
      return tonAmount * 2.5; // Mock TON price
    }
  }

  async processWebhook(eventType: string, eventData: any): Promise<void> {
    console.log(`Processing TON webhook: ${eventType}`, eventData);

    switch (eventType) {
      case 'transaction.confirmed':
        await this.handleTransactionConfirmed(eventData);
        break;
      case 'transaction.failed':
        await this.handleTransactionFailed(eventData);
        break;
      default:
        console.log(`Unhandled TON webhook event: ${eventType}`);
    }
  }

  private async handleTransactionConfirmed(eventData: any): Promise<void> {
    const { txHash, toAddress, amount, userId } = eventData;
    
    if (toAddress === this.masterWalletAddress) {
      // This is a deposit to our master wallet
      try {
        await this.processDeposit(userId, amount, txHash);
        console.log(`TON deposit processed for user ${userId}: ${amount} TON`);
      } catch (error) {
        console.error('Error processing TON deposit:', error);
      }
    }
  }

  private async handleTransactionFailed(eventData: any): Promise<void> {
    const { txHash, userId } = eventData;
    
    // Find and update failed transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId,
        metadata: {
          contains: txHash
        }
      }
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.FAILED }
      });
      console.log(`TON transaction ${transaction.id} marked as failed`);
    }
  }
}

export const tonBridgeService = new TonBridgeService();