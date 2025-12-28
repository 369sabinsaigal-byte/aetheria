import React, { useState, useContext } from 'react';
import { MarketContext } from '../../context/MarketContext';
import { UserContext } from '../../context/UserContext';
import { useTelegram } from '../../hooks/useTelegram';

interface TradingPanelProps {
  symbol: string;
  onOrderPlaced?: () => void;
}

const TradingPanel: React.FC<TradingPanelProps> = ({ symbol, onOrderPlaced }) => {
  const { placeOrder, state: marketState } = useContext(MarketContext);
  const { executeTrade } = useContext(UserContext)!;
  const { webApp } = useTelegram();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop-limit'>('market');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState('');
  const [leverage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (webApp && webApp.hapticFeedback) {
      webApp.hapticFeedback.impactOccurred('heavy');
    }

    if (!amount) return;

    setSubmitting(true);
    
    try {
      const orderPrice = orderType === 'market' 
        ? marketState.currentPrice 
        : parseFloat(price);

      const orderData = {
        side: activeTab,
        type: orderType,
        price: orderPrice,
        amount: parseFloat(amount)
      };

      // 1. Place order via MarketContext (affects OrderBook)
      placeOrder(orderData);
      
      // 2. Execute trade via UserContext (affects Portfolio)
      // Note: In a real exchange, placing a limit order doesn't immediately execute trade
      // unless it matches. For this simulation, we'll assume immediate fill for market orders
      // or if limit price crosses market price.
      // For simplicity in this demo, we execute immediately if it's a Market order
      // or if it's a Limit order that is marketable.
      
      const isMarketable = orderType === 'market' || 
          (activeTab === 'buy' && orderPrice >= marketState.currentPrice) ||
          (activeTab === 'sell' && orderPrice <= marketState.currentPrice);

      if (isMarketable) {
          executeTrade(activeTab, symbol, parseFloat(amount), orderPrice);
      } else {
          // It's a resting limit order. 
          // In a full implementation, we'd add this to "Open Orders" in UserContext.
          // For now, we'll just log it.
          console.log('Limit order placed (resting):', orderData);
      }
      
      console.log('Order placed successfully:', orderData);
      
      if (onOrderPlaced) {
        onOrderPlaced();
      }
      
      // Reset form
      setPrice('');
      setAmount('');
      setTotal('');
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      {/* Header Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
         <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-3 text-sm font-bold uppercase transition-colors relative ${
               activeTab === 'buy' ? 'text-[var(--color-up)] bg-green-500/5' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
         >
            Buy
            {activeTab === 'buy' && (
               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-up)]" />
            )}
         </button>
         <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-3 text-sm font-bold uppercase transition-colors relative ${
               activeTab === 'sell' ? 'text-[var(--color-down)] bg-red-500/5' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
         >
            Sell
            {activeTab === 'sell' && (
               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-down)]" />
            )}
         </button>
      </div>

      {/* Order Controls */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
           <div className="flex space-x-2 text-xs">
              {['Market', 'Limit', 'Stop'].map(type => (
                 <button
                    key={type}
                    onClick={() => setOrderType(type.toLowerCase() as any)}
                    className={`px-2 py-1 rounded transition-colors ${
                       orderType === type.toLowerCase() 
                         ? 'text-[var(--text-primary)] bg-[var(--border-color)]' 
                         : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                 >
                    {type}
                 </button>
              ))}
           </div>
           <div className="flex items-center space-x-1 text-xs text-[var(--text-secondary)]">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span>{leverage}x</span>
           </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
           {orderType !== 'market' && (
             <div>
               <div className="flex justify-between text-xs mb-1 text-[var(--text-secondary)]">
                  <span>Price</span>
                  <span>USDT</span>
               </div>
               <div className="relative">
                  <input
                     type="number"
                     value={price}
                     onChange={(e) => setPrice(e.target.value)}
                     className="w-full p-3 rounded-lg text-sm font-mono focus:outline-none transition-all bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-color)]"
                     placeholder="0.00"
                  />
               </div>
             </div>
           )}

           <div>
             <div className="flex justify-between text-xs mb-1 text-[var(--text-secondary)]">
                <span>Amount</span>
                <span>{symbol}</span>
             </div>
             <div className="relative">
                <input
                   type="number"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full p-3 rounded-lg text-sm font-mono focus:outline-none transition-all bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-color)]"
                   placeholder="0.00"
                />
             </div>
           </div>

           {/* Percentage Slider / Buttons */}
           <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map(pct => (
                 <button
                    key={pct}
                    className="py-1 rounded text-xs transition-colors hover:bg-opacity-80 bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    onClick={() => {
                        // Logic to calculate amount based on balance would go here
                    }}
                 >
                    {pct}%
                 </button>
              ))}
           </div>

           {/* Total */}
           <div>
             <div className="flex justify-between text-xs mb-1 text-[var(--text-secondary)]">
                <span>Total</span>
                <span>USDT</span>
             </div>
             <div className="p-3 rounded-lg text-sm font-mono text-right bg-[var(--border-color)] text-[var(--text-primary)]">
                {total || '0.00'}
             </div>
           </div>

           {/* Submit Button */}
           <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className={`w-full py-3.5 rounded-lg font-bold text-sm uppercase tracking-wide transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg ${
                 activeTab === 'buy' 
                   ? 'bg-[var(--color-up)] shadow-green-500/20' 
                   : 'bg-[var(--color-down)] shadow-red-500/20'
              }`}
           >
              {submitting ? 'Processing...' : `${activeTab} ${symbol}`}
           </button>
        </div>

        {/* Balance Info */}
        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex justify-between text-xs text-[var(--text-secondary)]">
           <span>Avail. Balance</span>
           <span className="text-[var(--text-primary)]">10,420.50 USDT</span>
        </div>
      </div>
    </div>
  );
};

export default TradingPanel;