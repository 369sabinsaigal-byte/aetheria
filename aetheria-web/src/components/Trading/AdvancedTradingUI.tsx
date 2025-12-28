import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PnLCircle from './PnLCircle';
import NewsStrip from './NewsStrip';
import TradingTabs from './TradingTabs';
import { useTelegram } from '../../hooks/useTelegram';

interface PortfolioData {
  totalInvested: number;
  totalPnL: number;
  totalValue: number;
  pnlPercent: number;
  positions: any[];
  timestamp: number;
  topGainer?: string;
  topLoser?: string;
}

const AdvancedTradingUI: React.FC = () => {
  const { user } = useTelegram();
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    totalInvested: 0,
    totalPnL: 0,
    totalValue: 0,
    pnlPercent: 0,
    positions: [],
    timestamp: Date.now()
  });
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [currentPrice, setCurrentPrice] = useState(45000);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  const coins = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'LINK', 'UNI', 'LTC', 'BCH'];

  useEffect(() => {
    // Fetch initial portfolio data
    fetchPortfolio();
    
    // Set up WebSocket connection for real-time updates
    const userId = user?.id?.toString() || 'demo-user-id';
    const ws = new WebSocket(`ws://localhost:3000?userId=${userId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for portfolio updates');
      setWsConnection(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'portfolio:update' || data.type === 'portfolio:initial') {
          setPortfolio(data.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnection(null);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);

  // Use wsConnection to prevent unused var warning
  useEffect(() => {
    if (wsConnection) {
        // console.log('WS State changed');
    }
  }, [wsConnection]);

  useEffect(() => {
    // Fetch current price for selected coin
    fetchCurrentPrice();
    const priceInterval = setInterval(fetchCurrentPrice, 5000); // Update every 5 seconds
    return () => clearInterval(priceInterval);
  }, [selectedCoin]);

  const fetchPortfolio = async () => {
    try {
      const userId = user?.id?.toString() || 'demo-user-id';
      const response = await axios.get(`http://localhost:3000/api/portfolio/${userId}/live`);
      if (response.data.success) {
        setPortfolio(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const fetchCurrentPrice = async () => {
    try {
      // Mock price for now - in real implementation, fetch from your trading service
      const mockPrices = {
        'BTC': 45000 + Math.random() * 1000 - 500,
        'ETH': 3000 + Math.random() * 200 - 100,
        'SOL': 100 + Math.random() * 20 - 10,
        'XRP': 0.5 + Math.random() * 0.1 - 0.05,
        'ADA': 0.4 + Math.random() * 0.08 - 0.04,
        'DOT': 8 + Math.random() * 2 - 1,
        'LINK': 15 + Math.random() * 3 - 1.5,
        'UNI': 6 + Math.random() * 2 - 1,
        'LTC': 70 + Math.random() * 10 - 5,
        'BCH': 200 + Math.random() * 30 - 15
      };
      setCurrentPrice(mockPrices[selectedCoin as keyof typeof mockPrices] || 100);
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const handleOrderSubmit = async (order: any) => {
    try {
      const response = await axios.post('http://localhost:3000/api/trading/order', {
        ...order,
        userId: user?.id?.toString() || 'demo-user-id'
      });
      
      if (response.data.success) {
        // Refresh portfolio after successful order
        fetchPortfolio();
        alert(`Order placed successfully! ${order.type} ${order.side} ${order.quantity} ${selectedCoin}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* News Strip */}
      <NewsStrip />

      <div className="px-4 pb-4">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* PnL Circle */}
          <div className="flex justify-center">
            <PnLCircle
              totalPnL={portfolio.totalPnL}
              totalInvested={portfolio.totalInvested}
              pnlPercent={portfolio.pnlPercent}
              size={150}
            />
          </div>

          {/* Portfolio Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Total Value</div>
              <div className="text-2xl font-bold text-white">
                ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Positions</div>
              <div className="text-2xl font-bold text-white">
                {portfolio.positions.length}
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Top Gainer</div>
              <div className="text-lg font-semibold text-green-400">
                {portfolio.topGainer || 'N/A'}
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Top Loser</div>
              <div className="text-lg font-semibold text-red-400">
                {portfolio.topLoser || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Coin Selector */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2">Select Coin</div>
          <div className="grid grid-cols-5 gap-2">
            {coins.map((coin) => (
              <button
                key={coin}
                onClick={() => setSelectedCoin(coin)}
                className={`p-3 rounded-lg font-medium transition-colors ${
                  selectedCoin === coin
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="text-sm">{coin}</div>
                <div className="text-xs text-gray-400 mt-1">
                  ${currentPrice.toFixed(selectedCoin === 'XRP' || selectedCoin === 'ADA' ? 4 : 2)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trading Tabs */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Trade {selectedCoin}/USDT
            </h3>
            <TradingTabs
              onOrderSubmit={handleOrderSubmit}
              selectedCoin={selectedCoin}
              currentPrice={currentPrice}
            />
          </div>

          {/* Positions List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Open Positions</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {portfolio.positions.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No open positions
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {portfolio.positions.map((position, index) => (
                    <div key={index} className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{position.coin}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            position.side === 'long' 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-red-900 text-red-300'
                          }`}>
                            {position.side.toUpperCase()}
                          </span>
                        </div>
                        <div className={`text-sm font-semibold ${
                          position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                        <div>
                          <div>Entry: ${position.avgEntry?.toFixed(2)}</div>
                          <div>Current: ${position.currentPrice?.toFixed(2)}</div>
                        </div>
                        <div>
                          <div>Qty: {position.qty}</div>
                          <div>PnL: ${position.unrealisedPnL?.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTradingUI;