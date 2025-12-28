import React from 'react';

interface PortfolioData {
  totalInvested: number;
  totalPnL: number;
  totalValue: number;
  pnlPercent: number;
  positions: any[];
}

interface PortfolioSummaryProps {
  portfolio: PortfolioData;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolio }) => {
  // const [isExpanded, setIsExpanded] = useState(true);

  // Mock balances for the "Portfolio" panel
  const balances = [
    { name: 'UAE Dirham', amount: '0.56 AED', value: '0.15 USD', secondaryValue: '0.56 AED', icon: 'د.إ' },
    { name: 'US Dollar', amount: '0.00 USD', value: '0.00 USD', secondaryValue: '0.00 AED', icon: '$' },
    { name: 'Saudi Riyal', amount: '0.00 SAR', value: '0.00 USD', secondaryValue: '0.00 AED', icon: '﷼' },
    { name: 'Ethereum', amount: '0.00472457 ETH', value: '13.92 USD', secondaryValue: '51.12 AED', icon: 'Ξ' },
  ];

  return (
    <div className="bg-[#1E1E1E] rounded-2xl p-4 border border-gray-800 h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-white font-bold text-lg">Portfolio</h3>
        <div className="text-right">
          <div className="text-white font-bold text-xl">${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="text-gray-500 text-xs">AED {(portfolio.totalValue * 3.67).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {balances.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-xs font-bold">
                {item.icon}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{item.name}</div>
                <div className="text-gray-500 text-xs">{item.amount}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white text-sm">{item.value}</div>
              <div className="text-gray-500 text-xs">{item.secondaryValue}</div>
            </div>
          </div>
        ))}
        
        {/* Positions from portfolio prop */}
        {portfolio.positions.map((pos, idx) => (
            <div key={`pos-${idx}`} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center text-xs font-bold">
                {pos.coin[0]}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{pos.coin} Position</div>
                <div className={`text-xs ${pos.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {pos.side.toUpperCase()} {pos.leverage}x
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${pos.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
              </div>
              <div className="text-gray-500 text-xs">${pos.unrealisedPnL.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioSummary;
