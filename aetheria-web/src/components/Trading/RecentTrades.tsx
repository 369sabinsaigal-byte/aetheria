import React, { useContext } from 'react';
import { MarketContext } from '../../context/MarketContext';

interface TradeDisplay {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  time: string;
}

interface RecentTradesProps {
  symbol: string;
}

const RecentTrades: React.FC<RecentTradesProps> = ({ symbol: _symbol }) => {
  const { state } = useContext(MarketContext);
  
  const trades: TradeDisplay[] = state.trades.map((t: any) => ({
    id: t.id,
    price: t.price,
    amount: t.amount,
    side: t.takerSide || t.side || 'buy', // Support both for compatibility
    time: new Date(t.timestamp).toLocaleTimeString([], { hour12: false })
  }));

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(4);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border-color)]">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Trades</h3>
          <button className="text-xs hover:text-white text-[var(--text-secondary)]">View All</button>
        </div>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <style>
            {`
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-10px); }
                to { opacity: 1; transform: translateX(0); }
            }
            .trade-row-enter {
                animation: slideIn 0.3s ease-out forwards;
            }
            `}
        </style>
        <div className="space-y-px">
          {trades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between px-3 py-1.5 transition-colors trade-row-enter hover:opacity-80">
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-mono`} style={{ color: trade.side === 'buy' ? 'var(--color-up)' : 'var(--color-down)' }}>
                  {trade.price.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  {formatNumber(trade.amount)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  {trade.time.split(':').slice(0, 2).join(':')}
                </span>
                <span className={`text-xs px-1 py-0.5 rounded ${trade.side === 'buy' ? 'bg-green-500/20 text-[var(--color-up)]' : 'bg-red-500/20 text-[var(--color-down)]'}`}>
                  {trade.side.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentTrades;