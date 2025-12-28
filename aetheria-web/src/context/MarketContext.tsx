import React, { createContext, useEffect, useState, useRef } from 'react';
import { MatchingEngine } from '../lib/matchingEngine';
import { startMockMarket } from '../lib/mockMarket';
import type { Order, Trade } from '../lib/types';

export interface Ticker {
  symbol: string;
  price: number;
  change: number;
}

export interface MarketState {
  buys: Order[];
  sells: Order[];
  trades: Trade[];
  candles: { time: number; open: number; high: number; low: number; close: number }[];
  currentPrice: number;
  tickers: Ticker[];
}

const initialState: MarketState = {
  buys: [],
  sells: [],
  trades: [],
  candles: [],
  currentPrice: 42000,
  tickers: [],
};

export const MarketContext = createContext<{
  state: MarketState;
  placeOrder: (order: any) => string;
}>({
  state: initialState,
  placeOrder: () => '',
});

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MarketState>(initialState);
  const engine = useRef<MatchingEngine | null>(null);

  useEffect(() => {
    // Initialize Matching Engine
    engine.current = new MatchingEngine((p: any) => {
      if (p.type === 'snapshot') {
        setState((s) => ({
          ...s,
          buys: p.buys,
          sells: p.sells,
          trades: p.trades || [],
          // Keep existing candles if any, or init empty
          currentPrice: p.trades && p.trades.length > 0 ? p.trades[0].price : s.currentPrice
        }));
      } else if (p.type === 'trade') {
        setState((s) => ({
          ...s,
          trades: [p.trade, ...s.trades].slice(0, 50),
          buys: p.buys,
          sells: p.sells,
          currentPrice: p.trade.price
        }));
      } else if (p.type === 'orderbook') {
        setState((s) => ({ ...s, buys: p.buys, sells: p.sells }));
      }
    });

    // Start Mock Market Data Feed
    const stop = startMockMarket((m: any) => {
      if (m.type === 'snapshot') {
        // We can apply snapshot to engine if we want the engine to manage the full book
        // or just update state directly. 
        // The MatchingEngine instance needs to know about these orders to match against them.
        engine.current!.applySnapshot(m);
        
        // Load initial tickers if available
        if (m.tickers) {
            setState(s => ({ ...s, tickers: m.tickers }));
        }
      }
      if (m.type === 'tick') {
        // We received a trade from the mock market (external liquidity provider)
        // We can update our state, but also might want to feed it to engine if engine tracks last price
        
        setState((s) => {
            const newTrades = [
                {
                  id: m.trade.id,
                  price: m.trade.price,
                  amount: m.trade.amount,
                  timestamp: m.trade.timestamp,
                  takerSide: m.trade.side,
                },
                ...s.trades,
            ].slice(0, 50);
            
            return {
                ...s,
                trades: newTrades,
                currentPrice: m.trade.price,
                tickers: m.tickers || s.tickers
            };
        });
      }
    });

    return () => stop();
  }, []);

  const placeOrder = (order: any) => {
    if (engine.current) {
        return engine.current.place(order);
    }
    return '';
  };

  return (
    <MarketContext.Provider value={{ state, placeOrder }}>
      {children}
    </MarketContext.Provider>
  );
}
