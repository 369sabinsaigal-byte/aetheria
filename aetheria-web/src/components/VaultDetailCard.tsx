import React from 'react';
import { motion } from 'framer-motion';
import { theme } from '../theme';

interface VaultDetailCardProps {
  name: string;
  description: string;
  apy: number;
  tvl: number;
  minInvestment: number;
  strategy: string;
  allocation: Array<{ name: string; value: number; color: string }>;
  performanceData: number[]; // Array of values for the graph
}

export const VaultDetailCard: React.FC<VaultDetailCardProps> = ({
  name,
  description,
  apy,
  tvl,
  minInvestment,
  strategy,
  allocation,
  performanceData,
}) => {
  // --- Pie Chart Logic ---
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const pieSegments = allocation.map((item, index) => {
    const percent = item.value / 100;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return (
      <motion.circle
        key={item.name}
        cx="50"
        cy="50"
        r={radius}
        fill="transparent"
        stroke={item.color}
        strokeWidth="10"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        initial={{ strokeDasharray: `0 ${circumference}` }}
        animate={{ strokeDasharray }}
        transition={{ duration: 1, delay: index * 0.2 }}
        whileHover={{ scale: 1.05 }}
        style={{ transformOrigin: 'center', rotate: '-90deg' }}
      />
    );
  });

  // --- Line Graph Logic ---
  const graphWidth = 200;
  const graphHeight = 60;
  const maxVal = Math.max(...performanceData);
  const minVal = Math.min(...performanceData);
  
  const points = performanceData.map((val, i) => {
    const x = (i / (performanceData.length - 1)) * graphWidth;
    const y = graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <motion.div
      style={{
        background: theme.colors.surface,
        borderRadius: '20px',
        padding: '2rem',
        border: `1px solid ${theme.colors.primaryDark}`,
        boxShadow: theme.effects.shadow,
        color: theme.colors.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      whileHover={{ borderColor: theme.colors.primary, boxShadow: theme.effects.glow }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: theme.typography.h2, margin: 0, color: theme.colors.textPrimary }}>{name}</h3>
          <p style={{ color: theme.colors.textSecondary, fontSize: '0.9rem', marginTop: '0.5rem' }}>{description}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.colors.success }}>{apy}% APY</div>
          <div style={{ fontSize: '0.8rem', color: theme.colors.textSecondary }}>Historical Yield</div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
        
        {/* Allocation Pie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '100px', height: '100px' }}>
            <svg viewBox="0 0 100 100">
              {pieSegments}
            </svg>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            {allocation.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }}></div>
                <span style={{ color: theme.colors.textSecondary }}>{item.name}</span>
                <span style={{ fontWeight: 600 }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', height: '60px' }}>
            <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} style={{ overflow: 'visible' }}>
              <motion.path
                d={`M ${points}`}
                fill="none"
                stroke={theme.colors.success}
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              {/* Gradient Area under line (optional, simplified here) */}
            </svg>
          </div>
          <div style={{ fontSize: '0.7rem', color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
            30-Day Performance Trend
          </div>
        </div>
      </div>

      {/* Details & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: `1px solid ${theme.colors.primaryDark}` }}>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: theme.colors.textSecondary }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem' }}>TVL</span>
            <span style={{ color: theme.colors.textPrimary, fontWeight: 600 }}>${tvl.toLocaleString()}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem' }}>Min Invest</span>
            <span style={{ color: theme.colors.textPrimary, fontWeight: 600 }}>${minInvestment}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem' }}>Strategy</span>
            <span style={{ color: theme.colors.primary, fontWeight: 600 }}>{strategy}</span>
          </div>
        </div>

        <motion.button
          style={{
            background: theme.colors.goldGradient,
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '25px',
            color: theme.colors.background,
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
          whileHover={{ scale: 1.05, boxShadow: theme.effects.glow }}
          whileTap={{ scale: 0.95 }}
        >
          Invest Now
        </motion.button>
      </div>
    </motion.div>
  );
};
