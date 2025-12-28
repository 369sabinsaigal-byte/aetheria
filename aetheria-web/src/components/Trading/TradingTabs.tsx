import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';

interface TradingTabsProps {
  onOrderSubmit: (order: any) => void;
  selectedCoin: string;
  currentPrice: number;
}

const TradingTabs: React.FC<TradingTabsProps> = ({ 
  onOrderSubmit, 
  selectedCoin, 
  currentPrice 
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const { theme } = useTheme();

  // Market Order Tab
  const MarketOrderTab = () => {
    const [amount, setAmount] = useState('');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || parseFloat(amount) <= 0) return;

      const order = {
        type: 'market',
        side,
        pair: `${selectedCoin}USDT`,
        quantity: parseFloat(amount),
        price: currentPrice
      };

      onOrderSubmit(order);
      setAmount('');
    };

    return (
      <div className="p-4">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setSide('buy')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              side === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Buy {selectedCoin}
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              side === 'sell'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Sell {selectedCoin}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount ({selectedCoin})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`0.00 ${selectedCoin}`}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
              min="0"
            />
          </div>

          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-400">Est. Value</div>
            <div className="text-lg font-semibold text-white">
              ${(parseFloat(amount || '0') * currentPrice).toFixed(2)}
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-medium ${
              side === 'buy'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } transition-colors`}
          >
            {side === 'buy' ? 'Buy' : 'Sell'} {selectedCoin}
          </button>
        </form>
      </div>
    );
  };

  // Limit Order Tab
  const LimitOrderTab = () => {
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !price || parseFloat(amount) <= 0 || parseFloat(price) <= 0) return;

      const order = {
        type: 'limit',
        side,
        pair: `${selectedCoin}USDT`,
        quantity: parseFloat(amount),
        price: parseFloat(price)
      };

      onOrderSubmit(order);
      setAmount('');
      setPrice('');
    };

    return (
      <div className="p-4">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setSide('buy')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              side === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Buy {selectedCoin}
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              side === 'sell'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Sell {selectedCoin}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price (USDT)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={`${currentPrice}`}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
              min="0"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount ({selectedCoin})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`0.00 ${selectedCoin}`}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
              min="0"
            />
          </div>

          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-400">Total</div>
            <div className="text-lg font-semibold text-white">
              ${(parseFloat(amount || '0') * parseFloat(price || '0')).toFixed(2)}
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-medium ${
              side === 'buy'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } transition-colors`}
          >
            Place Limit Order
          </button>
        </form>
      </div>
    );
  };

  // Multi-HODL Lite Tab
  const MultiHodlTab = () => {
    const [amount, setAmount] = useState('');
    const [direction, setDirection] = useState<'bullish' | 'bearish'>('bullish');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || parseFloat(amount) <= 0) return;

      const order = {
        type: 'multihodl',
        direction,
        pair: `${selectedCoin}USDT`,
        quantity: parseFloat(amount),
        price: currentPrice,
        tp: direction === 'bullish' ? currentPrice * 1.2 : currentPrice * 0.8, // ±20%
        sl: direction === 'bullish' ? currentPrice * 0.8 : currentPrice * 1.2  // ±20%
      };

      onOrderSubmit(order);
      setAmount('');
    };

    return (
      <div className="p-4">
        <div className="mb-4 p-3 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-500">
          <div className="text-sm font-medium text-blue-300 mb-1">🚀 Multi-HODL Lite</div>
          <div className="text-xs text-gray-300">
            Predict price direction with ±20% TP/SL. Share your prediction for viral rewards!
          </div>
        </div>

        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setDirection('bullish')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              direction === 'bullish'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            📈 Bullish
          </button>
          <button
            onClick={() => setDirection('bearish')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              direction === 'bearish'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            📉 Bearish
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Investment Amount (USDT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="1"
              min="10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-700 rounded-lg text-center">
              <div className="text-xs text-gray-400">Take Profit</div>
              <div className="text-sm font-semibold text-green-400">
                +20% (${(currentPrice * 1.2).toFixed(2)})
              </div>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg text-center">
              <div className="text-xs text-gray-400">Stop Loss</div>
              <div className="text-sm font-semibold text-red-400">
                -20% (${(currentPrice * 0.8).toFixed(2)})
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-medium ${
              direction === 'bullish'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } transition-colors`}
          >
            🎯 Predict {direction === 'bullish' ? 'Up' : 'Down'}
          </button>
        </form>
      </div>
    );
  };

  const tabs = [
    { name: 'Market', component: MarketOrderTab },
    { name: 'Limit', component: LimitOrderTab },
    { name: 'Multi-HODL', component: MultiHodlTab }
  ];

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-lg`}>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab, index) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(index)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Swipeable Content */}
      <div className="overflow-hidden">
        {tabs.map((tab, index) => (
          <div key={index} className={index === activeTab ? '' : 'hidden'}>
            <tab.component />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradingTabs;