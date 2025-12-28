import React, { createContext, useState, useEffect, useContext } from 'react';
import { MarketContext } from './MarketContext';

export interface Asset {
  symbol: string;
  name: string;
  balance: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'transfer';
  asset: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  price?: number; // for trades
  side?: 'buy' | 'sell'; // for trades
}

export interface PortfolioState {
  assets: Asset[];
  transactions: Transaction[];
  totalEquity: number;
}

const initialAssets: Asset[] = [
  { symbol: 'USDT', name: 'Tether', balance: 10000 }, // Initial simulated deposit
  { symbol: 'BTC', name: 'Bitcoin', balance: 0 },
  { symbol: 'ETH', name: 'Ethereum', balance: 0 },
];

export const UserContext = createContext<{
  portfolio: PortfolioState;
  deposit: (asset: string, amount: number) => void;
  withdraw: (asset: string, amount: number) => boolean;
  executeTrade: (side: 'buy' | 'sell', symbol: string, amount: number, price: number) => void;
} | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('aetheria_assets');
    return saved ? JSON.parse(saved) : initialAssets;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('aetheria_txs');
    return saved ? JSON.parse(saved) : [];
  });

  const { state: marketState } = useContext(MarketContext);

  useEffect(() => {
    localStorage.setItem('aetheria_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('aetheria_txs', JSON.stringify(transactions));
  }, [transactions]);

  // Calculate Total Equity in USDT
  const totalEquity = assets.reduce((total, asset) => {
    if (asset.symbol === 'USDT') return total + asset.balance;
    
    // Check main market price
    if (asset.symbol === 'BTC') return total + (asset.balance * marketState.currentPrice);

    // Check secondary tickers
    const ticker = marketState.tickers?.find(t => t.symbol === asset.symbol);
    if (ticker) {
        return total + (asset.balance * ticker.price);
    }

    // Fallbacks
    const price = asset.symbol === 'ETH' ? 3000 : 
                  asset.symbol === 'SOL' ? 140 : 0;
    return total + (asset.balance * price);
  }, 0);

  const deposit = (symbol: string, amount: number) => {
    setAssets(prev => {
      const existing = prev.find(a => a.symbol === symbol);
      if (existing) {
        return prev.map(a => a.symbol === symbol ? { ...a, balance: a.balance + amount } : a);
      }
      return [...prev, { symbol, name: symbol, balance: amount }];
    });
    
    addTransaction({
      type: 'deposit',
      asset: symbol,
      amount,
      status: 'completed'
    });
  };

  const withdraw = (symbol: string, amount: number) => {
    const asset = assets.find(a => a.symbol === symbol);
    if (!asset || asset.balance < amount) return false;

    setAssets(prev => prev.map(a => a.symbol === symbol ? { ...a, balance: a.balance - amount } : a));
    
    addTransaction({
      type: 'withdrawal',
      asset: symbol,
      amount,
      status: 'completed' // In real app: pending
    });
    return true;
  };

  const executeTrade = (side: 'buy' | 'sell', symbol: string, amount: number, price: number) => {
    setAssets(prev => {
        const quoteSymbol = 'USDT';
        const cost = amount * price;

        let newAssets = [...prev];

        // 1. Handle Quote Currency (USDT)
        const quoteIdx = newAssets.findIndex(a => a.symbol === quoteSymbol);
        if (quoteIdx === -1) {
             if (side === 'buy') {
                 console.error('Insufficient funds');
                 return prev;
             }
             newAssets.push({ symbol: quoteSymbol, name: 'Tether', balance: cost });
        } else {
             if (side === 'buy') {
                 if (newAssets[quoteIdx].balance < cost) {
                     console.error('Insufficient funds');
                     return prev;
                 }
                 newAssets[quoteIdx] = { ...newAssets[quoteIdx], balance: newAssets[quoteIdx].balance - cost };
             } else {
                 newAssets[quoteIdx] = { ...newAssets[quoteIdx], balance: newAssets[quoteIdx].balance + cost };
             }
        }

        // 2. Handle Base Currency (Asset)
        const baseIdx = newAssets.findIndex(a => a.symbol === symbol);
        if (baseIdx === -1) {
            if (side === 'sell') {
                console.error('Insufficient asset balance');
                return prev;
            }
            newAssets.push({ symbol, name: symbol, balance: amount });
        } else {
            if (side === 'sell') {
                 if (newAssets[baseIdx].balance < amount) {
                     console.error('Insufficient asset balance');
                     return prev;
                 }
                 newAssets[baseIdx] = { ...newAssets[baseIdx], balance: newAssets[baseIdx].balance - amount };
            } else {
                 newAssets[baseIdx] = { ...newAssets[baseIdx], balance: newAssets[baseIdx].balance + amount };
            }
        }

        return newAssets;
    });

    addTransaction({
        type: 'trade',
        asset: symbol,
        amount,
        price,
        side,
        status: 'completed'
    });
  };

  const addTransaction = (tx: Partial<Transaction>) => {
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleString(),
      type: 'deposit', // default
      asset: 'USDT',
      amount: 0,
      status: 'completed',
      ...tx
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  return (
    <UserContext.Provider value={{ portfolio: { assets, transactions, totalEquity }, deposit, withdraw, executeTrade }}>
      {children}
    </UserContext.Provider>
  );
};
