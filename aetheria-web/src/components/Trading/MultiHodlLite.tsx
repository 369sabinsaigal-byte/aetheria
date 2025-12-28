import React, { useState } from 'react';
import { useTelegram } from '../../hooks/useTelegram';

interface MultiHodlLiteProps {
  onOrderSubmit: (order: any) => void;
  selectedCoin: string;
  currentPrice: number;
}

interface Prediction {
  id: string;
  coin: string;
  direction: 'bullish' | 'bearish';
  amount: number;
  entryPrice: number;
  tpPrice: number;
  slPrice: number;
  status: 'active' | 'won' | 'lost';
  createdAt: Date;
  shared: boolean;
}

const MultiHodlLite: React.FC<MultiHodlLiteProps> = ({
  onOrderSubmit,
  selectedCoin,
  currentPrice
}) => {
  const { webApp, user } = useTelegram();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'bullish' | 'bearish'>('bullish');

  // use user to prevent unused var warning
  React.useEffect(() => {
     if(user) {
        // console.log("User active in MultiHodl");
     }
  }, [user]);

  const handlePrediction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const investmentAmount = parseFloat(amount);
    const tpPrice = direction === 'bullish' ? currentPrice * 1.2 : currentPrice * 0.8;
    const slPrice = direction === 'bullish' ? currentPrice * 0.8 : currentPrice * 1.2;

    const prediction: Prediction = {
      id: `pred-${Date.now()}`,
      coin: selectedCoin,
      direction,
      amount: investmentAmount,
      entryPrice: currentPrice,
      tpPrice,
      slPrice,
      status: 'active',
      createdAt: new Date(),
      shared: false
    };

    setPredictions(prev => [prediction, ...prev]);

    // Submit as Multi-HODL order
    const order = {
      type: 'multihodl',
      direction,
      pair: `${selectedCoin}USDT`,
      quantity: investmentAmount / currentPrice, // Convert USDT to coin amount
      price: currentPrice,
      tp: tpPrice,
      sl: slPrice
    };

    onOrderSubmit(order);
    setAmount('');
  };

  const sharePrediction = (prediction: Prediction) => {
    if (!webApp) return;

    const message = `🚀 My ${prediction.coin} Prediction\n\n` +
      `${prediction.direction === 'bullish' ? '📈' : '📉'} ${prediction.direction.toUpperCase()}\n` +
      `Entry: $${prediction.entryPrice.toFixed(2)}\n` +
      `Target: $${prediction.tpPrice.toFixed(2)} (+20%)\n` +
      `Stop: $${prediction.slPrice.toFixed(2)} (-20%)\n\n` +
      `Amount: $${prediction.amount}\n` +
      `#${prediction.coin} #crypto #prediction`;

    webApp.showShareModal({
      text: message,
      url: 'https://t.me/AetheriaVaultBot'
    });

    // Mark as shared
    setPredictions(prev => 
      prev.map(p => p.id === prediction.id ? { ...p, shared: true } : p)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'text-green-400';
      case 'lost': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won': return '✅';
      case 'lost': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">🚀 Multi-HODL Lite</h3>
        <div className="text-sm text-gray-400">
          {predictions.filter(p => p.status === 'active').length} Active
        </div>
      </div>

      {/* Prediction Form */}
      <form onSubmit={handlePrediction} className="mb-6">
        <div className="flex space-x-2 mb-4">
          <button
            type="button"
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
            type="button"
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Investment Amount (USDT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="1"
            min="10"
            required
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

      {/* Active Predictions */}
      {predictions.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-white mb-3">Your Predictions</h4>
          <div className="space-y-3">
            {predictions.map((prediction) => (
              <div key={prediction.id} className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{prediction.coin}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      prediction.direction === 'bullish'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {prediction.direction.toUpperCase()}
                    </span>
                  </div>
                  <div className={`text-sm font-semibold ${getStatusColor(prediction.status)}`}>
                    {getStatusIcon(prediction.status)} {prediction.status.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                  <div>Entry: ${prediction.entryPrice.toFixed(2)}</div>
                  <div>Amount: ${prediction.amount}</div>
                  <div>TP: ${prediction.tpPrice.toFixed(2)}</div>
                  <div>SL: ${prediction.slPrice.toFixed(2)}</div>
                </div>

                {prediction.status === 'active' && (
                  <button
                    onClick={() => sharePrediction(prediction)}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium ${
                      prediction.shared
                        ? 'bg-gray-600 text-gray-400'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } transition-colors`}
                    disabled={prediction.shared}
                  >
                    {prediction.shared ? '✅ Shared' : '📤 Share Prediction'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiHodlLite;