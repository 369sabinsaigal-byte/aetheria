import React, { useState, useEffect, useRef } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import axios from 'axios';

interface TradeTicketProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCoin: string;
  currentPrice: number;
  initialSide?: 'buy' | 'sell';
  onOrderPlaced?: () => void;
}

const TradeTicket: React.FC<TradeTicketProps> = ({ 
  isOpen, 
  onClose, 
  selectedCoin, 
  currentPrice,
  initialSide = 'buy',
  onOrderPlaced
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const { webApp, user } = useTelegram();
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [leverage] = useState(1);
  const [marginMode] = useState('isolated');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setDragY(0);
    }
  }, [isOpen]);

  const handleOrderSubmit = async (order: any) => {
    try {
      if (webApp && webApp.hapticFeedback) {
         webApp.hapticFeedback.impactOccurred('heavy');
      }

      // Add userId
      const orderData = {
        ...order,
        userId: user?.id?.toString() || 'demo-user-id'
      };

      const response = await axios.post('http://localhost:3000/api/trading/order', orderData);
      
      if (response.data.success) {
        if (webApp) webApp.showAlert(`Order Placed: ${order.side} ${order.quantity} ${order.pair}`);
        if (onOrderPlaced) onOrderPlaced();
        onClose();
      }
    } catch (error: any) {
      console.error('Order error details:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (webApp) webApp.showAlert(`Failed: ${errorMessage}`);
      else alert(`Failed: ${errorMessage}`); // Fallback for browser testing
    }
  };

  // Market Order Tab
  const MarketOrderTab = () => {
    const [amount, setAmount] = useState('');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');

    return (
      <div className="p-4">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => {
                setSide('buy');
                if(webApp) webApp.hapticFeedback.selectionChanged();
            }}
            className={`flex-1 py-4 px-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 ${
              side === 'buy'
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => {
                setSide('sell');
                if(webApp) webApp.hapticFeedback.selectionChanged();
            }}
            className={`flex-1 py-4 px-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 ${
              side === 'sell'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            Sell
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-800 text-white text-4xl font-bold p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              {selectedCoin}
            </div>
          </div>
          <div className="text-center mt-2 text-gray-500 text-sm">
             ≈ ${(parseFloat(amount || '0') * currentPrice).toFixed(2)} USD
          </div>
        </div>

        {/* Slippage Warning */}
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 mb-6 flex items-start space-x-3">
             <span className="text-yellow-500 text-xl">⚠️</span>
             <div className="text-xs text-yellow-200/80">
                <strong>Slippage Shield Active:</strong> Orders &gt; 0.5% off mid-price will trigger a warning.
             </div>
        </div>

        <button
          onClick={() => handleOrderSubmit({
             type: 'market',
             side,
             pair: `${selectedCoin}USDT`,
             quantity: parseFloat(amount),
             price: currentPrice,
             leverage,
             marginMode
          })}
          disabled={!amount}
          className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg active:scale-95 transition-all ${
             !amount ? 'bg-gray-700 cursor-not-allowed' : 
             side === 'buy' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400'
          }`}
        >
          {side === 'buy' ? `Buy/Long ${selectedCoin}` : `Sell/Short ${selectedCoin}`}
        </button>
      </div>
    );
  };

  // Limit Order Tab (Wheel UI simplified)
  const LimitOrderTab = () => {
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState(currentPrice.toString());
    const [side, setSide] = useState<'buy' | 'sell'>(initialSide);

    return (
      <div className="p-4">
         <div className="flex space-x-2 mb-4 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setSide('buy')}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${
              side === 'buy' ? 'bg-gray-700 text-green-400 shadow-sm' : 'text-gray-400'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${
              side === 'sell' ? 'bg-gray-700 text-red-400 shadow-sm' : 'text-gray-400'
            }`}
          >
            Sell
          </button>
        </div>

        <div className="space-y-4 mb-6">
            <div>
                <label className="text-xs text-gray-400 uppercase font-bold ml-1">Limit Price</label>
                <div className="flex items-center mt-1">
                    <button className="p-3 bg-gray-800 rounded-l-xl text-gray-400 active:bg-gray-700" onClick={() => setPrice((parseFloat(price)-10).toString())}>-</button>
                    <input 
                        type="number" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="flex-1 bg-gray-800 text-center p-3 text-xl font-mono text-white focus:outline-none"
                    />
                    <button className="p-3 bg-gray-800 rounded-r-xl text-gray-400 active:bg-gray-700" onClick={() => setPrice((parseFloat(price)+10).toString())}>+</button>
                </div>
            </div>

            <div>
                <label className="text-xs text-gray-400 uppercase font-bold ml-1">Amount</label>
                <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`0.00 ${selectedCoin}`}
                    className="w-full mt-1 bg-gray-800 p-3 rounded-xl text-xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>

        <button
          onClick={() => handleOrderSubmit({
             type: 'limit',
             side,
             pair: `${selectedCoin}USDT`,
             quantity: parseFloat(amount),
             price: parseFloat(price),
             leverage,
             marginMode
          })}
          className="w-full py-4 bg-blue-600 rounded-xl font-bold text-white shadow-lg active:scale-95"
        >
           Place Limit Order
        </button>
      </div>
    );
  };

  // Multi-HODL Tab
  const MultiHodlTab = () => {
    const [amount, setAmount] = useState('100');
    const [multiplier, setMultiplier] = useState(5);
    const [direction, setDirection] = useState<'up' | 'down'>('up');

    return (
        <div className="p-4">
            <div className="flex space-x-4 mb-6">
                <div 
                    onClick={() => setDirection('up')}
                    className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        direction === 'up' ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-gray-800 opacity-50'
                    }`}
                >
                    <div className="text-2xl mb-1">🚀</div>
                    <div className="font-bold text-green-400">UP</div>
                </div>
                <div 
                    onClick={() => setDirection('down')}
                    className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        direction === 'down' ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-800 opacity-50'
                    }`}
                >
                    <div className="text-2xl mb-1">🐻</div>
                    <div className="font-bold text-red-400">DOWN</div>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Multiplier</span>
                    <span className="text-white font-bold">{multiplier}x</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={multiplier} 
                    onChange={(e) => setMultiplier(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1x</span>
                    <span>10x</span>
                    <span>20x</span>
                </div>
            </div>

            <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">Investment</label>
                <div className="flex items-center space-x-2">
                    <button className="p-3 bg-gray-800 rounded-lg" onClick={() => setAmount((Math.max(10, parseInt(amount)-10)).toString())}>-</button>
                    <div className="flex-1 bg-gray-800 rounded-lg p-3 text-center font-bold text-xl">
                        ${amount}
                    </div>
                    <button className="p-3 bg-gray-800 rounded-lg" onClick={() => setAmount((parseInt(amount)+10).toString())}>+</button>
                </div>
            </div>

            <button
                onClick={() => handleOrderSubmit({
                    type: 'multihodl',
                    direction: direction === 'up' ? 'bullish' : 'bearish',
                    pair: `${selectedCoin}USDT`,
                    quantity: parseFloat(amount),
                    price: currentPrice,
                    multiplier
                })}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 bg-gradient-to-r ${
                    direction === 'up' ? 'from-green-600 to-green-400' : 'from-red-600 to-red-400'
                }`}
            >
                Start Multi-HODL {multiplier}x
            </button>
        </div>
    );
  };

  const tabs = [
    { name: 'Market', component: MarketOrderTab },
    { name: 'Limit', component: LimitOrderTab },
    { name: 'Multi-HODL', component: MultiHodlTab }
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-50 transition-opacity"
            onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div 
        ref={sheetRef}
        className={`fixed left-0 right-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out transform ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '70vh' }}
      >
        {/* Drag Handle */}
        <div 
            className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
            onTouchStart={(e) => setDragY(e.touches[0].clientY)}
            onTouchMove={(e) => {
                const delta = e.touches[0].clientY - dragY;
                if (delta > 50) onClose(); // Simple swipe down to close
            }}
            onClick={onClose} // Fallback for click
        >
            <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
        </div>

        {/* Tab Headers */}
        <div className="flex px-4 border-b border-gray-800">
             {tabs.map((tab, index) => (
                <button
                    key={tab.name}
                    onClick={() => setActiveTab(index)}
                    className={`flex-1 py-3 text-sm font-bold tracking-wide transition-colors relative ${
                        activeTab === index ? 'text-white' : 'text-gray-500'
                    }`}
                >
                    {tab.name}
                    {activeTab === index && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full mx-4" />
                    )}
                </button>
             ))}
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto pb-20">
             <div className="overflow-hidden">
                {tabs.map((tab, index) => (
                <div key={index} className={index === activeTab ? '' : 'hidden'}>
                    <tab.component />
                </div>
                ))}
            </div>
        </div>
      </div>
    </>
  );
};

export default TradeTicket;
