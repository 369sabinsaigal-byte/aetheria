import React, { useState, useContext } from 'react';
import { ArrowDownUp, Settings, ChevronDown, RefreshCw } from 'lucide-react';
import { UserContext } from '../../context/UserContext';
import { MarketContext } from '../../context/MarketContext';

export interface SwapCardProps {
  fromAsset?: string;
  toAsset?: string;
  onFromAssetChange?: (asset: string) => void;
  onToAssetChange?: (asset: string) => void;
}

export const SwapCard: React.FC<SwapCardProps> = ({ 
  fromAsset: propFromAsset, 
  toAsset: propToAsset,
  onFromAssetChange,
  onToAssetChange
}) => {
  const { portfolio, executeTrade } = useContext(UserContext)!;
  const { state: marketState } = useContext(MarketContext);

  const [internalFrom, setInternalFrom] = useState('USDT');
  const [internalTo, setInternalTo] = useState('TON');

  const fromAsset = propFromAsset || internalFrom;
  const toAsset = propToAsset || internalTo;

  const setFromAsset = (asset: string) => {
    if (onFromAssetChange) onFromAssetChange(asset);
    else setInternalFrom(asset);
  };

  const setToAsset = (asset: string) => {
    if (onToAssetChange) onToAssetChange(asset);
    else setInternalTo(asset);
  };
  const [fromAmount, setFromAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSelector, setShowSelector] = useState<'from' | 'to' | null>(null);

  // Available assets for swap
  const assets = [
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'TON', name: 'Toncoin' },
    // Stocks
    ...(marketState.tickers?.map(t => ({ symbol: t.symbol, name: t.symbol })) || [])
  ];

  // Get Price Helper
  const getPrice = (symbol: string) => {
    if (symbol === 'USDT') return 1;
    if (symbol === 'BTC') return marketState.currentPrice;
    
    // Check tickers
    const ticker = marketState.tickers?.find(t => t.symbol === symbol);
    if (ticker) return ticker.price;

    // Fallbacks
    if (symbol === 'TON') return 2.34; // Mock
    if (symbol === 'ETH') return 3000;
    
    return 0;
  };

  const fromPrice = getPrice(fromAsset);
  const toPrice = getPrice(toAsset);
  
  const exchangeRate = toPrice > 0 ? fromPrice / toPrice : 0;
  const toAmount = fromAmount ? (parseFloat(fromAmount) * exchangeRate) : 0;

  const handleSwap = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
        // We execute a trade. 
        // If From = USDT, we are BUYING ToAsset
        // If From = Asset, we are SELLING FromAsset (assuming To = USDT)
        // For simple swap, we treat it as generic trade.
        
        // However, our UserContext.executeTrade is simple (Buy/Sell against USDT).
        // For Cross-Asset Swap, we need more logic. 
        // For MVP, let's assume one side is always USDT for simplicity, or we chain trades.
        
        const amount = parseFloat(fromAmount);

        if (fromAsset === 'USDT') {
            // Buying ToAsset with USDT
            executeTrade('buy', toAsset, toAmount, toPrice);
        } else if (toAsset === 'USDT') {
            // Selling FromAsset for USDT
            executeTrade('sell', fromAsset, amount, fromPrice);
        } else {
            // Crypto-to-Crypto (Sell From -> Buy To)
            // 1. Sell FromAsset
            executeTrade('sell', fromAsset, amount, fromPrice);
            // 2. Buy ToAsset (with the USDT proceeds)
            const usdtProceeds = amount * fromPrice;
            const buyAmount = usdtProceeds / toPrice;
            executeTrade('buy', toAsset, buyAmount, toPrice);
        }
        
        setFromAmount('');
        setIsLoading(false);
    }, 1000);
  };

  const switchAssets = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
  };

  const getBalance = (symbol: string) => {
    const asset = portfolio.assets.find(a => a.symbol === symbol);
    return asset ? asset.balance : 0;
  };

  return (
    <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5 shadow-xl relative overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Swap
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Beta</span>
        </h2>
        <button className="text-gray-400 hover:text-white transition-colors">
            <Settings size={18} />
        </button>
      </div>

      {/* From Input */}
      <div className="bg-black/20 rounded-xl p-3 mb-2 hover:bg-black/30 transition-colors border border-transparent hover:border-white/5 group">
        <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400 font-medium">You Pay</span>
            <span className="text-xs text-gray-400">Balance: {getBalance(fromAsset).toFixed(4)}</span>
        </div>
        <div className="flex justify-between items-center">
            <input 
                type="number" 
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent text-2xl font-bold text-white outline-none w-full placeholder-gray-600"
            />
            <button 
                onClick={() => setShowSelector('from')}
                className="flex items-center gap-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] px-3 py-1.5 rounded-full transition-colors shrink-0 ml-2"
            >
                {/* Icon Placeholder */}
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {fromAsset[0]}
                </div>
                <span className="font-semibold text-white">{fromAsset}</span>
                <ChevronDown size={14} className="text-gray-400" />
            </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
            ${(parseFloat(fromAmount || '0') * fromPrice).toFixed(2)}
        </div>
      </div>

      {/* Switcher */}
      <div className="flex justify-center -my-3 relative z-10">
        <button 
            onClick={switchAssets}
            className="bg-[#2C2C2E] border border-[#1C1C1E] p-1.5 rounded-full text-blue-400 hover:text-white hover:bg-blue-600 transition-all shadow-lg"
        >
            <ArrowDownUp size={16} />
        </button>
      </div>

      {/* To Input */}
      <div className="bg-black/20 rounded-xl p-3 mt-2 hover:bg-black/30 transition-colors border border-transparent hover:border-white/5">
        <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400 font-medium">You Receive</span>
            <span className="text-xs text-gray-400">Balance: {getBalance(toAsset).toFixed(4)}</span>
        </div>
        <div className="flex justify-between items-center">
            <input 
                type="number" 
                value={toAmount > 0 ? toAmount.toFixed(6) : ''}
                readOnly
                placeholder="0"
                className="bg-transparent text-2xl font-bold text-white outline-none w-full placeholder-gray-600"
            />
            <button 
                onClick={() => setShowSelector('to')}
                className="flex items-center gap-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] px-3 py-1.5 rounded-full transition-colors shrink-0 ml-2"
            >
                 <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {toAsset[0]}
                </div>
                <span className="font-semibold text-white">{toAsset}</span>
                <ChevronDown size={14} className="text-gray-400" />
            </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
            ${(toAmount * toPrice).toFixed(2)}
        </div>
      </div>

      {/* Rate Info */}
      {exchangeRate > 0 && (
          <div className="flex justify-between items-center px-1 mt-3 mb-4">
              <span className="text-xs text-gray-500">Rate</span>
              <span className="text-xs text-white font-mono">1 {fromAsset} ≈ {exchangeRate.toFixed(6)} {toAsset}</span>
          </div>
      )}

      {/* Action Button */}
      <button 
        onClick={handleSwap}
        disabled={isLoading || !fromAmount}
        className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2
            ${isLoading || !fromAmount 
                ? 'bg-[#2C2C2E] text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-[0.98]'}`}
      >
        {isLoading ? (
            <>
                <RefreshCw size={18} className="animate-spin" />
                Swapping...
            </>
        ) : 'Swap'}
      </button>

      {/* Asset Selector Modal */}
      {showSelector && (
        <div className="absolute inset-0 bg-[#1C1C1E] z-20 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <span className="font-bold text-white">Select Token</span>
                <button 
                    onClick={() => setShowSelector(null)}
                    className="text-gray-400 hover:text-white"
                >
                    Close
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {assets.map((asset) => (
                    <button
                        key={asset.symbol}
                        onClick={() => {
                            if (showSelector === 'from') setFromAsset(asset.symbol);
                            else setToAsset(asset.symbol);
                            setShowSelector(null);
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                                {asset.symbol[0]}
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-bold text-white text-sm">{asset.symbol}</span>
                                <span className="text-xs text-gray-500">{asset.name}</span>
                            </div>
                        </div>
                        <span className="text-xs text-gray-400">
                            {getBalance(asset.symbol).toFixed(4)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
      )}

    </div>
  );
};
