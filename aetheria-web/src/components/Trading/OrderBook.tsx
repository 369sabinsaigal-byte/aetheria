import React, { useContext } from 'react';
import { MarketContext } from '../../context/MarketContext';

interface OrderBookProps {
  symbol: string;
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol: _symbol }) => {
  const { state } = useContext(MarketContext);
  const { buys, sells, currentPrice } = state;

  // Binance sends data already sorted, but let's ensure consistency for display
  // Bids: High to Low
  // Asks: Low to High
  const bids = buys.slice(0, 15).map((b: any) => ({ ...b, total: 0 }));
  const asks = sells.slice(0, 15).map((a: any) => ({ ...a, total: 0 }));

  // Calculate cumulative totals for depth visualization
  let bidTotal = 0;
  bids.forEach(item => {
    bidTotal += item.amount;
    item.total = bidTotal;
  });

  let askTotal = 0;
  asks.forEach(item => {
    askTotal += item.amount;
    item.total = askTotal;
  });

  // Calculate spread
  const bestBid = bids.length > 0 ? bids[0].price : 0;
  const bestAsk = asks.length > 0 ? asks[0].price : 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const spreadPercent = bestAsk > 0 ? (spread / bestAsk) * 100 : 0;

  const maxTotal = Math.max(bidTotal, askTotal);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border-color)] flex justify-between items-center">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Order Book</h3>
          <div className="flex space-x-1">
             {[0.01, 0.1, 1].map(precision => (
                <button key={precision} className="text-[10px] px-1.5 py-0.5 rounded transition-colors bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                   {precision}
                </button>
             ))}
          </div>
      </div>

      {/* Asks (Sell Orders) */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end pb-1">
        <div className="space-y-0.5">
          {asks.slice(0, 15).reverse().map((ask: any, index: number) => (
            <div key={`ask-${index}`} className="flex items-center justify-between px-3 py-0.5 relative group hover:opacity-90 cursor-pointer">
              <div className="absolute inset-0 right-0 z-0 transition-all duration-300 bg-[var(--color-down)] opacity-15" 
                   style={{ width: `${(ask.total / maxTotal) * 100}%` }}></div>
              <span className="text-xs font-mono z-10 font-medium text-[var(--color-down)]">{ask.price.toFixed(2)}</span>
              <span className="text-[11px] font-mono z-10 text-right text-[var(--text-primary)]">{ask.amount.toFixed(4)}</span>
              <span className="text-[11px] font-mono z-10 text-right hidden xl:block text-[var(--text-secondary)]">{ask.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Spread / Current Price */}
      <div className="py-2 px-3 border-y border-[var(--border-color)] flex justify-between items-center bg-white/5">
         <div className="flex items-center space-x-2">
            <span className={`text-lg font-bold ${currentPrice >= (bestBid || 0) ? 'text-[var(--color-up)]' : 'text-[var(--color-down)]'}`}>
                {currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
            </span>
            <svg className={`w-3 h-3 ${currentPrice >= (bestBid || 0) ? 'text-[var(--color-up)]' : 'text-[var(--color-down)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={currentPrice >= (bestBid || 0) ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
            </svg>
         </div>
         <span className="text-xs font-mono text-[var(--text-secondary)]">Spread: {spread.toFixed(2)} ({spreadPercent.toFixed(2)}%)</span>
      </div>

      {/* Bids (Buy Orders) */}
      <div className="flex-1 overflow-hidden pt-1">
        <div className="space-y-0.5">
          {bids.slice(0, 15).map((bid: any, index: number) => (
            <div key={`bid-${index}`} className="flex items-center justify-between px-3 py-0.5 relative group hover:opacity-90 cursor-pointer">
              <div className="absolute inset-0 right-0 z-0 transition-all duration-300 bg-[var(--color-up)] opacity-15" 
                   style={{ width: `${(bid.total / maxTotal) * 100}%` }}></div>
              <span className="text-xs font-mono z-10 font-medium text-[var(--color-up)]">{bid.price.toFixed(2)}</span>
              <span className="text-[11px] font-mono z-10 text-right text-[var(--text-primary)]">{bid.amount.toFixed(4)}</span>
              <span className="text-[11px] font-mono z-10 text-right hidden xl:block text-[var(--text-secondary)]">{bid.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;