import React, { useContext } from 'react';
import { PieChart } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { UserContext } from '../context/UserContext';
import { MarketContext } from '../context/MarketContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DashboardProps {
  onNavigate: (page: string, coin?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const { portfolio } = useContext(UserContext)!;
  const { state: marketState } = useContext(MarketContext);

  // Chart Data Preparation
  const chartData = {
    labels: portfolio.assets.map(a => a.symbol),
    datasets: [
      {
        data: portfolio.assets.map(a => {
            // Calculate value based on real-time prices
            if (a.symbol === 'USDT') return a.balance;
            if (a.symbol === 'BTC') return a.balance * marketState.currentPrice;
            
            const ticker = marketState.tickers?.find(t => t.symbol === a.symbol);
            if (ticker) return a.balance * ticker.price;

            // Fallbacks
            const price = a.symbol === 'ETH' ? 3105.20 : 
                          a.symbol === 'SOL' ? 142.50 : 0;
            return a.balance * price;
        }),
        backgroundColor: [
          '#0ECB81', // Green
          '#F6465D', // Red
          '#3C7EFF', // Blue
          '#FCD535', // Yellow
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#EAECEF',
          font: { family: 'Inter' },
          usePointStyle: true,
        }
      }
    },
    cutout: '75%',
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      {/* Portfolio Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Total Balance Card */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] flex flex-col justify-between">
          <div>
            <span className="text-[var(--text-secondary)] text-sm font-medium">Total Balance</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                ${portfolio.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-medium text-[var(--color-up)] bg-green-500/10 px-2 py-0.5 rounded">
                +2.4%
              </span>
            </div>
          </div>
          <div className="mt-4">
             <div className="h-1 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-color)]" style={{ width: '100%' }}></div>
             </div>
             <p className="text-xs text-[var(--text-secondary)] mt-2">
                All systems operational.
             </p>
          </div>
        </div>

        {/* Asset Allocation Chart */}
        <div className="allocation-card">
          <div className="card-header">
            <PieChart size={18} />
            <span>Asset Allocation</span>
          </div>
          <div className="chart-wrapper">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
