import React, { useEffect, useState } from 'react';
import { useTelegram } from '../../hooks/useTelegram';

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number; // Percentage
  sparkline: number[]; // 60 points
  volume: string;
}

interface MarketListProps {
  onSelectCoin: (coin: string) => void;
  selectedCoin: string;
}

const MarketList: React.FC<MarketListProps> = ({ onSelectCoin, selectedCoin }) => {
  const { webApp } = useTelegram();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  
  // Tabs
  const tabs = ['All', 'New', 'DeFi', 'Metaverse', 'Web3', 'Smart'];

  // Mock data generator
  useEffect(() => {
    const generateMockData = () => {
      const marketData = [
        { symbol: 'BTC', name: 'Bitcoin', basePrice: 87878.00, vol: '2.5B', change: 0.34, rank: 1 },
        { symbol: 'ETH', name: 'Ethereum', basePrice: 2947.09, vol: '1.2B', change: 0.46, rank: 2 },
        { symbol: 'SOL', name: 'Solana', basePrice: 124.43, vol: '800M', change: 0.92, rank: 3 },
        { symbol: 'BNB', name: 'BNB', basePrice: 598.20, vol: '600M', change: -0.12, rank: 4 },
        { symbol: 'XRP', name: 'XRP', basePrice: 1.87, vol: '400M', change: 1.43, rank: 5 },
        { symbol: 'DOGE', name: 'Dogecoin', basePrice: 0.12, vol: '200M', change: 0.89, rank: 6 },
        { symbol: 'ADA', name: 'Cardano', basePrice: 0.37, vol: '100M', change: -0.50, rank: 7 },
        { symbol: 'SHIB', name: 'Shiba Inu', basePrice: 0.000024, vol: '80M', change: 2.10, rank: 8 },
        { symbol: 'AVAX', name: 'Avalanche', basePrice: 35.40, vol: '50M', change: 1.20, rank: 9 },
        { symbol: 'DOT', name: 'Polkadot', basePrice: 7.20, vol: '40M', change: -1.10, rank: 10 },
      ];

      const newCoins = marketData.map(data => {
        // Slight randomization
        const currentPrice = data.basePrice * (1 + (Math.random() - 0.5) * 0.001);
        
        // Generate sparkline
        const sparkline = [];
        let price = currentPrice;
        for (let i = 0; i < 20; i++) {
          price = price * (1 + (Math.random() - 0.5) * 0.02);
          sparkline.push(price);
        }

        return {
          symbol: data.symbol,
          name: data.name,
          price: currentPrice,
          change24h: data.change,
          sparkline,
          volume: data.vol
        };
      });

      setCoins(newCoins);
    };

    generateMockData();
    const interval = setInterval(generateMockData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[var(--bg-secondary)] rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-[var(--text-primary)] font-bold text-lg">Assets</h3>
            <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
            {tabs.map(tab => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-medium whitespace-nowrap pb-1 border-b-2 transition-colors ${
                        activeTab === tab ? 'text-[var(--accent-color)] border-[var(--accent-color)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {coins.map((coin) => (
          <MarketRow 
            key={coin.symbol} 
            coin={coin} 
            isSelected={selectedCoin === coin.symbol}
            onClick={() => {
              if (webApp && webApp.hapticFeedback) {
                webApp.hapticFeedback.selectionChanged();
              }
              onSelectCoin(coin.symbol);
            }}
          />
        ))}
      </div>
    </div>
  );
};

const MarketRow: React.FC<{ coin: CoinData; isSelected: boolean; onClick: () => void }> = ({ coin, isSelected, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        px-4 py-3 flex items-center justify-between transition-all cursor-pointer border-l-2
        ${isSelected ? 'bg-[var(--bg-primary)] border-[var(--accent-color)]' : 'hover:bg-[var(--bg-primary)]/50 border-transparent'}
      `}
    >
      {/* Left: Info */}
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            coin.symbol === 'BTC' ? 'bg-orange-500/20 text-orange-500' :
            coin.symbol === 'ETH' ? 'bg-blue-500/20 text-blue-500' :
            coin.symbol === 'USDT' ? 'bg-teal-500/20 text-teal-500' :
            'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
        }`}>
            {coin.symbol[0]}
        </div>
        <div>
          <div className="text-[var(--text-primary)] text-sm font-bold leading-tight">{coin.symbol}</div>
          <div className="text-[var(--text-secondary)] text-[10px]">{coin.name}</div>
        </div>
      </div>

      {/* Right: Price & Change */}
      <div className="flex flex-col items-end">
        <div className="text-[var(--text-primary)] font-medium text-sm">
            USD {coin.price < 1 ? coin.price.toFixed(6) : coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[var(--text-secondary)] text-[10px] mb-0.5">
            AED {(coin.price * 3.67).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center ${
            coin.change24h >= 0 ? 'bg-green-500/20 text-[var(--color-up)]' : 'bg-red-500/20 text-[var(--color-down)]'
        }`}>
            {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default MarketList;
