import { v4 as uuid } from 'uuid';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
let t: number | undefined;

export function startMockMarket(cb: (m: any) => void) {
  // Main Market (BTC)
  const mid = 42000;
  
  // Secondary Markets (Stocks & ETFs) - Mock Tickers
  const tickers = [
    { symbol: 'TSLAx', price: 175.50, change: -0.12 },
    { symbol: 'NVDAx', price: 890.20, change: -0.08 },
    { symbol: 'GOOGLx', price: 173.40, change: -0.48 },
    { symbol: 'COINx', price: 245.10, change: -0.03 },
    { symbol: 'AAPLx', price: 189.30, change: -0.13 },
    { symbol: 'HOODx', price: 18.20, change: 0.07 },
    { symbol: 'AMZNx', price: 180.50, change: -0.16 },
    { symbol: 'SPYx', price: 520.10, change: 0.04 },
  ];

  const buys = Array.from({ length: 20 }).map((_, i) => ({
    id: uuid(),
    side: 'buy',
    price: +(mid - (i + 1) * rand(1, 30)).toFixed(2),
    amount: +rand(0.01, 3).toFixed(4),
    type: 'limit',
    createdAt: Date.now(),
  }));
  const sells = Array.from({ length: 20 }).map((_, i) => ({
    id: uuid(),
    side: 'sell',
    price: +(mid + (i + 1) * rand(1, 30)).toFixed(2),
    amount: +rand(0.01, 3).toFixed(4),
    type: 'limit',
    createdAt: Date.now(),
  }));
  
  // Initial Snapshot with Tickers
  cb({ type: 'snapshot', buys, sells, trades: [], tickers });
  
  t = window.setInterval(() => {
    // Tick BTC
    const p = mid + (Math.random() - 0.5) * 150;
    
    // Update Tickers slightly
    const updatedTickers = tickers.map(t => ({
        ...t,
        price: t.price * (1 + (Math.random() - 0.5) * 0.002), // 0.2% fluctuation
        change: t.change + (Math.random() - 0.5) * 0.05
    }));

    cb({
      type: 'tick',
      trade: {
        id: uuid(),
        price: +p.toFixed(2),
        amount: +rand(0.001, 2).toFixed(6),
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: Date.now(),
      },
      tickers: updatedTickers
    });
  }, 600);
  
  return () => {
    if (t) window.clearInterval(t);
  };
}
