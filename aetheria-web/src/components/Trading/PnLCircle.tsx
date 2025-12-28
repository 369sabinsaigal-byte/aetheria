import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface PnLCircleProps {
  totalPnL: number;
  totalInvested: number;
  pnlPercent: number;
  size?: number;
}

const PnLCircle: React.FC<PnLCircleProps> = ({ 
  totalPnL, 
  totalInvested, 
  pnlPercent, 
  size = 120 
}) => {
  const isPositive = pnlPercent >= 0;
  const displayPercent = Math.min(Math.abs(pnlPercent), 100);
  
  const styles = buildStyles({
    textSize: '16px',
    textColor: isPositive ? '#10B981' : '#EF4444',
    pathColor: isPositive ? '#10B981' : '#EF4444',
    trailColor: '#374151',
    backgroundColor: '#1F2937',
  });

  return (
    <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
      <div style={{ width: size, height: size }}>
        <CircularProgressbar
          value={displayPercent}
          text={`${isPositive ? '+' : ''}${pnlPercent.toFixed(1)}%`}
          styles={styles}
        />
      </div>
      
      <div className="mt-3 text-center">
        <div className={`text-lg font-bold ${
          isPositive ? 'text-green-500' : 'text-red-500'
        }`}>
          ${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-gray-400">
          Total PnL
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Invested: ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};

export default PnLCircle;