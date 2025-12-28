import React, { useEffect, useRef, useState } from 'react';
import { useTelegram } from '../../hooks/useTelegram';

interface CoinData {
  symbol: string;
  price: number;
  change24h: number; // Percentage
  sparkline: number[]; // 60 points
}

interface TopMoversStripProps {
  onSelectCoin: (coin: string) => void;
  selectedCoin: string;
}

const TopMoversStrip: React.FC<TopMoversStripProps> = ({ onSelectCoin, selectedCoin }) => {
  const { webApp, user } = useTelegram();
  const [coins, setCoins] = useState<CoinData[]>([]);
  
  // Use user to prevent unused var warning
  useEffect(() => {
    if(user) {
        // console.log("User ready");
    }
  }, [user]);
  
  // Mock data generator
  useEffect(() => {
    const generateMockData = () => {
      const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'LINK', 'UNI', 'LTC', 'BCH'];
      const newCoins = symbols.map(symbol => {
        const basePrice = symbol === 'BTC' ? 45000 : symbol === 'ETH' ? 3000 : Math.random() * 100;
        const change = (Math.random() * 10) - 5;
        
        // Generate sparkline (random walk)
        const sparkline = [];
        let price = basePrice;
        for (let i = 0; i < 60; i++) {
          price = price * (1 + (Math.random() - 0.5) * 0.02);
          sparkline.push(price);
        }

        return {
          symbol,
          price: basePrice,
          change24h: change,
          sparkline
        };
      });

      // Sort by absolute 24h change desc
      newCoins.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
      setCoins(newCoins);
    };

    generateMockData();
    const interval = setInterval(generateMockData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-x-auto pb-4 pt-2 no-scrollbar snap-x snap-mandatory">
      <div className="flex px-4 space-x-3 w-max">
        {coins.map((coin) => (
          <CoinTile 
            key={coin.symbol} 
            coin={coin} 
            isSelected={selectedCoin === coin.symbol}
            onClick={() => {
              if (webApp && webApp.hapticFeedback) {
                webApp.hapticFeedback.impactOccurred('light');
              }
              onSelectCoin(coin.symbol);
            }}
          />
        ))}
      </div>
    </div>
  );
};

const CoinTile: React.FC<{ coin: CoinData; isSelected: boolean; onClick: () => void }> = ({ 
  coin, 
  isSelected, 
  onClick 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sparkline
    const points = coin.sparkline;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min;
    
    const width = canvas.width;
    const height = canvas.height;
    const step = width / (points.length - 1);

    ctx.beginPath();
    ctx.strokeStyle = coin.change24h >= 0 ? '#10B981' : '#EF4444'; // Green or Red
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    points.forEach((point, i) => {
      const x = i * step;
      // Normalize y (invert because canvas 0 is top)
      const y = height - ((point - min) / range) * height;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Check if stale (optional visual cue, implemented as opacity reduction if needed)
  }, [coin.sparkline, coin.change24h]);

  return (
    <div 
      onClick={onClick}
      className={`
        snap-center flex-shrink-0 w-28 p-3 rounded-xl transition-all duration-200
        ${isSelected ? 'bg-gray-700 ring-2 ring-blue-500' : 'bg-gray-800 active:scale-95'}
      `}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-sm text-white">{coin.symbol}</span>
        <span className={`text-xs font-medium ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
        </span>
      </div>
      
      <div className="text-xs text-gray-400 mb-2">
        ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>

      <canvas 
        ref={canvasRef} 
        width={80} 
        height={30} 
        className="w-full h-8 opacity-80"
      />
    </div>
  );
};

export default TopMoversStrip;
