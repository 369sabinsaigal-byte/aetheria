import React from 'react';
import { motion } from 'framer-motion';

export interface AssetItem {
  symbol: string;
  name?: string;
  price?: number;
  change: number;
  iconUrl?: string;
  color?: string;
}

interface AssetGridProps {
  title: string;
  items: AssetItem[];
  onSelect?: (symbol: string) => void;
  isNew?: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export const AssetGrid: React.FC<AssetGridProps> = ({ title, items, onSelect, isNew }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3 px-1">
        <div className="flex items-center gap-2">
            <h3 className="text-[#8E8E93] font-semibold text-[15px]">{title}</h3>
            {isNew && (
                <span className="text-[10px] bg-[#007AFF] text-white px-1.5 py-0.5 rounded-[4px] font-bold">NEW</span>
            )}
        </div>
        <button className="text-[#007AFF] text-[15px] font-normal hover:opacity-80">See all</button>
      </div>

      <motion.div 
        className="grid grid-cols-4 gap-y-6 gap-x-2"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {items.map((item) => (
          <motion.div 
            key={item.symbol} 
            variants={itemAnim}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect && onSelect(item.symbol)}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div 
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center mb-2 shadow-sm relative overflow-hidden"
              style={{ backgroundColor: item.color || '#1C1C1E' }}
            >
              {item.iconUrl ? (
                <img src={item.iconUrl} alt={item.symbol} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">{item.symbol[0]}</span>
              )}
            </div>
            
            <span className="text-white font-semibold text-[13px] mb-0.5 leading-tight">{item.symbol}</span>
            
            <div className={`flex items-center text-[11px] font-medium ${item.change >= 0 ? 'text-[#32D74B]' : 'text-[#FF453A]'}`}>
                <span>{item.change >= 0 ? '↑' : '↓'}</span>
                <span className="ml-0.5">{Math.abs(item.change).toFixed(2)}%</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

