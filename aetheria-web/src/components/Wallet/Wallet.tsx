import React, { useState, useRef } from 'react';
import { SwapCard } from './SwapCard';
import { AssetGrid } from './AssetGrid';
import type { AssetItem } from './AssetGrid';
import { Wallet as WalletIcon, Percent, ArrowDownUp } from 'lucide-react';
import { motion } from 'framer-motion';

const STOCKS: AssetItem[] = [
  { symbol: 'TSLAx', change: -0.14, color: '#E31937', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg' },
  { symbol: 'NVDAx', change: -0.14, color: '#000000', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg' },
  { symbol: 'GOOGLx', change: -0.05, color: '#FFFFFF', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' },
  { symbol: 'COINx', change: 0.13, color: '#0052FF', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Coinbase_icon.svg' },
  { symbol: 'AAPLx', change: 0.05, color: '#000000', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' }, // Inverted for visibility
  { symbol: 'HOODx', change: 0.03, color: '#00C805', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Robinhood_Logo.svg' },
  { symbol: 'AMZNx', change: 0.14, color: '#000000', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg' },
  { symbol: 'SPYx', change: 0.04, color: '#FFFFFF', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/S%26P_500_Logo.svg/1024px-S%26P_500_Logo.svg.png' },
];

const TOKENS: AssetItem[] = [
  { symbol: 'TON', change: 3.44, color: '#0098EA', iconUrl: 'https://ton.org/download/ton_symbol.svg' },
  { symbol: 'USDT', change: 0.00, color: '#26A17B', iconUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=026' },
  { symbol: 'STON', change: 1.85, color: '#0088CC', iconUrl: 'https://app.ston.fi/img/ston-logo.svg' },
  { symbol: 'STORM', change: 2.98, color: '#FCD535', iconUrl: 'https://storm.tg/favicon.ico' },
  { symbol: 'Gold', change: -1.43, color: '#FFD700', iconUrl: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' }, // Placeholder
  { symbol: 'DUST', change: -2.13, color: '#000000', iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/19532.png' },
  { symbol: 'EVAA', change: 14.28, color: '#4F46E5', iconUrl: 'https://evaa.finance/favicon.ico' },
  { symbol: 'TAC', change: -1.25, color: '#7C3AED', iconUrl: 'https://tac.tg/favicon.ico' },
];

const MOST_TRADED: AssetItem[] = [
  { symbol: 'UTYA', change: 12.5, color: '#222', iconUrl: 'https://utyatoken.com/favicon.ico' },
  { symbol: 'tsTON', change: 3.2, color: '#0098EA', iconUrl: 'https://ton.org/download/ton_symbol.svg' },
  { symbol: 'MAJOR', change: 5.4, color: '#F59E0B', iconUrl: 'https://getmajor.bot/favicon.ico' },
  { symbol: 'Gold', change: -1.4, color: '#FFD700', iconUrl: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' },
];

export const Wallet: React.FC = () => {
  const [swapFrom, setSwapFrom] = useState('USDT');
  const [swapTo, setSwapTo] = useState('TON');
  const topRef = useRef<HTMLDivElement>(null);

  const handleAssetSelect = (symbol: string) => {
      if (symbol === swapFrom) {
          setSwapFrom('USDT');
      }
      setSwapTo(symbol);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] overflow-hidden font-sans">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div ref={topRef} className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
            
            {/* Swap Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SwapCard 
                  fromAsset={swapFrom}
                  toAsset={swapTo}
                  onFromAssetChange={setSwapFrom}
                  onToAssetChange={setSwapTo}
              />
            </motion.div>

            {/* Stocks & ETFs */}
            <div className="bg-[#1C1C1E] rounded-[24px] p-5 border border-white/5">
                <AssetGrid title="Stocks & ETFs" items={STOCKS} onSelect={handleAssetSelect} isNew={true} />
            </div>

            {/* Core Tokens */}
            <div className="bg-[#1C1C1E] rounded-[24px] p-5 border border-white/5">
                <AssetGrid title="Core Tokens" items={TOKENS} onSelect={handleAssetSelect} />
            </div>

             {/* Most Traded */}
            <div className="bg-[#1C1C1E] rounded-[24px] p-5 border border-white/5">
                <AssetGrid title="Most Traded" items={MOST_TRADED} onSelect={handleAssetSelect} />
            </div>
        </div>
      </div>

      {/* Floating Bottom Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px]">
        <div className="bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex justify-between items-center shadow-2xl">
            <button className="flex flex-col items-center gap-1 text-[#8E8E93] hover:text-white transition-colors">
                <WalletIcon size={22} strokeWidth={2} />
                <span className="text-[10px] font-medium">Wallet</span>
            </button>
            
            <button className="flex flex-col items-center gap-1 text-[#007AFF] relative group">
                <div className="absolute -top-12 bg-[#007AFF] p-3 rounded-full shadow-[0_8px_16px_rgba(0,122,255,0.3)] group-hover:scale-110 transition-transform duration-200">
                   <ArrowDownUp size={24} color="white" strokeWidth={2.5} />
                </div>
                <div className="h-6 w-6 mb-1"></div> {/* Spacer for the floating icon */}
                <span className="text-[10px] font-bold">Swap</span>
            </button>
            
            <button className="flex flex-col items-center gap-1 text-[#8E8E93] hover:text-white transition-colors">
                <Percent size={22} strokeWidth={2} />
                <span className="text-[10px] font-medium">Earn</span>
            </button>
        </div>
      </div>
    </div>
  );
};
