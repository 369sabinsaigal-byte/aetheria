import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MarketList from './MarketList';
import ChartRoom from './ChartRoom';
import OrderBook from './OrderBook.tsx';
import TradingPanel from './TradingPanel.tsx';
import RecentTrades from './RecentTrades.tsx';
import { useTelegram } from '../../hooks/useTelegram';
import { webSocketService } from '../../services/websocket';

interface ProfessionalTradingUIProps {
  initialCoin?: string;
}

const ProfessionalTradingUI: React.FC<ProfessionalTradingUIProps> = ({ initialCoin = 'BTC' }) => {
  const { user, webApp } = useTelegram();
  
  const [selectedCoin, setSelectedCoin] = useState(initialCoin);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chart' | 'book' | 'trades'>('chart');
  const [showMobileMarkets, setShowMobileMarkets] = useState(false);

  useEffect(() => {
    // Initialize WebSocket Connection
    webSocketService.connect();
    
    fetchPortfolio();
    if (webApp) webApp.expand();
    setTimeout(() => setIsLoaded(true), 100);

    return () => {
      webSocketService.disconnect();
    };
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      const userId = user?.id?.toString() || 'demo-user-id';
      // Just fetch to trigger updates, ignoring response for now as UI doesn't display it
      await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/portfolio/${userId}/live`);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const handleCoinSelect = (coin: string) => {
    setSelectedCoin(coin);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      {/* Professional Header - Desktop */}
      <div className="hidden lg:block border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-[var(--text-secondary)]">
              Overview <span className="mx-2">›</span> <span className="text-[var(--text-primary)]">Trading</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse"></div>
              <span className="text-sm font-medium">Main Account</span>
              <span className="text-sm text-[var(--text-secondary)]">|</span>
              <span className="text-sm font-bold">0.452 BTC</span>
            </div>
            <button className="p-2 transition-colors hover:text-white text-[var(--text-secondary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm0 0V3" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white border border-[var(--border-color)]">
              JD
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header & Controls */}
      <div className="lg:hidden flex flex-col space-y-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2">
        <div className="flex justify-between items-center">
             <div className="flex items-center space-x-2" onClick={() => setShowMobileMarkets(!showMobileMarkets)}>
                 <span className="font-bold text-lg">{selectedCoin}</span>
                 <span className="text-sm px-2 py-0.5 rounded text-green-500 bg-green-500/10">+2.4%</span>
                 <svg className={`w-4 h-4 transform transition-transform ${showMobileMarkets ? 'rotate-180' : ''} text-[var(--text-secondary)]`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             </div>
        </div>
        {/* Mobile Tabs */}
        <div className="flex rounded p-1 bg-[var(--bg-primary)]">
             {['chart', 'book', 'trades'].map(tab => (
                 <button
                     key={tab}
                     onClick={() => setMobileTab(tab as any)}
                     className={`flex-1 py-1 text-xs font-medium rounded capitalize transition-colors ${
                       mobileTab === tab 
                         ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm' 
                         : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                     }`}
                 >
                     {tab}
                 </button>
             ))}
        </div>
      </div>

      {/* Main Trading Grid */}
      <div className={`flex flex-col lg:flex-row flex-1 overflow-hidden transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Left Column - Chart */}
        <div className={`flex-1 flex-col overflow-hidden border-r border-[var(--border-color)] ${mobileTab === 'chart' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex-1 bg-[var(--bg-secondary)]">
            <ChartRoom 
                isOpen={true}
                onClose={() => {}}
                symbol={selectedCoin}
                embedded={true}
                onOrderPlaced={fetchPortfolio}
            />
          </div>
        </div>

        {/* Center Column - Order Book & Trades */}
        <div className={`w-full lg:w-80 flex-col overflow-hidden border-r border-[var(--border-color)] bg-[var(--bg-secondary)] ${mobileTab !== 'chart' ? 'flex h-full' : 'hidden lg:flex'}`}>
          
          {/* Order Book */}
          <div className={`flex-1 border-b border-[var(--border-color)] ${mobileTab === 'trades' ? 'hidden lg:block' : 'block'}`}>
             <OrderBook symbol={selectedCoin} />
          </div>

          {/* Recent Trades */}
          <div className={`h-1/3 ${mobileTab === 'book' ? 'hidden lg:block' : 'block'}`}>
             <RecentTrades symbol={selectedCoin} />
          </div>
        </div>

        {/* Right Column - Order Entry & Market List */}
        <div className="hidden lg:flex flex-col w-80 bg-[var(--bg-secondary)]">
           <div className="flex-1 border-b border-[var(--border-color)]">
              <TradingPanel symbol={selectedCoin} onOrderPlaced={fetchPortfolio} />
           </div>
           <div className="h-1/3 flex flex-col">
              <div className="p-3 border-b border-[var(--border-color)]">
                 <h3 className="text-sm font-semibold text-[var(--text-primary)]">Market</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                 <MarketList 
                    onSelectCoin={(coin) => { handleCoinSelect(coin); }}
                    selectedCoin={selectedCoin} 
                 />
              </div>
           </div>
        </div>

      </div>

      {/* Wallet Modal Removed */}
    </div>
  );
};

export default ProfessionalTradingUI;