import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import PnLCircle from './PnLCircle';
import MarketList from './MarketList';
import ChartRoom from './ChartRoom';
import PortfolioSummary from './PortfolioSummary';
import RecentTransactions from './RecentTransactions';
import { useTelegram } from '../../hooks/useTelegram';

interface PortfolioData {
  totalInvested: number;
  totalPnL: number;
  totalValue: number;
  pnlPercent: number;
  positions: any[];
  timestamp: number;
}

const TelegramTradingUI: React.FC = () => {
  const { user, webApp } = useTelegram();
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    totalInvested: 0,
    totalPnL: 0,
    totalValue: 0,
    pnlPercent: 0,
    positions: [],
    timestamp: Date.now()
  });
  
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  // const [isChartOpen, setIsChartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchPortfolio();
    if (webApp) webApp.expand();
    // Animation trigger
    setTimeout(() => setIsLoaded(true), 100);
  }, [user]);

  // Use webApp again to suppress unused warning
  useEffect(() => {
     if(webApp) {
         // console.log("Telegram WebApp Ready");
     }
  }, [webApp]);

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

  const handleCoinSelect = (coin: string) => {
    setSelectedCoin(coin);
    // On mobile, we might open a full screen chart. 
    // On desktop dashboard, we update the chart widget.
    // For now, let's assume dashboard layout for "isChartOpen" means focusing the chart area if needed,
    // or we can keep the ChartRoom as a separate component that is always visible in the dashboard.
    // However, the current ChartRoom is a full-screen overlay. Let's modify it or use it as is for now 
    // but the user wants a dashboard "like the image".
    // The image has the chart embedded. 
    // I should probably render ChartRoom inline if possible, or create a dashboard version.
    // For this step, I will render the components in a grid.
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 font-sans">
      {/* Top Nav (Simplified for now) */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-gray-400 text-sm">Overview &gt; <span className="text-white">Dashboard</span></div>
        <div className="flex items-center space-x-4">
            <button className="bg-gray-800 p-2 rounded-full hover:bg-gray-700">
                <span role="img" aria-label="notification">🔔</span>
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)] transition-all duration-700 ease-out transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Left Sidebar: Assets (3 cols) */}
        <div className="lg:col-span-3 h-full overflow-hidden">
            <MarketList 
                onSelectCoin={handleCoinSelect} 
                selectedCoin={selectedCoin} 
            />
        </div>

        {/* Center: Chart & Transactions (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-6 h-full overflow-y-auto no-scrollbar">
            {/* Chart Area - Reusing ChartRoom logic but inline? 
                The current ChartRoom is fixed fullscreen. 
                I'll render a placeholder or simplified chart widget here for now 
                or modify ChartRoom to accept a 'mode' prop.
                For immediate result, I'll use the ChartRoom as a modal as before but trigger it via the list,
                AND render a static ticker card here to match the image.
            */}
            
            {/* Top: Recent Txs (Matches image 2 center top) */}
            <div className="h-1/3">
                <RecentTransactions />
            </div>

            {/* Bottom: Ticker & Chart (Matches image 2 center bottom) */}
            <div className="h-2/3 bg-[#1E1E1E] rounded-2xl border border-gray-800 p-4 relative overflow-hidden">
                {/* Embed ChartRoom as relative if possible, or just a button to open it for now until refactor */}
                <ChartRoom 
                    isOpen={true} // Always open in dashboard mode? No, ChartRoom is fixed.
                    onClose={() => {}} 
                    symbol={selectedCoin} 
                    embedded={true}
                    onOrderPlaced={fetchPortfolio}
                />
            </div>
        </div>

        {/* Right: Portfolio (3 cols) */}
        <div className="lg:col-span-3 h-full overflow-hidden">
            <PortfolioSummary portfolio={portfolio} />
        </div>

      </div>
    </div>
  );
};

export default TelegramTradingUI;
