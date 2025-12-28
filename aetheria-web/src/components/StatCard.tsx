import React from 'react';
import { motion } from 'framer-motion';
import { theme } from '../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, prefix = '$', suffix = '' }) => {
  return (
    <motion.div
      style={{
        background: theme.colors.surface,
        borderRadius: '16px',
        padding: '1.5rem',
        border: `1px solid ${theme.colors.primaryDark}`,
        boxShadow: theme.effects.shadow,
        color: theme.colors.textPrimary,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: theme.effects.glow, borderColor: theme.colors.primary }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <h3 style={{ 
        color: theme.colors.textSecondary, 
        fontSize: '0.9rem', 
        marginBottom: '0.5rem',
        fontWeight: 500 
      }}>
        {title}
      </h3>
      
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <motion.div
          key={String(value)}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          style={{ 
            fontSize: '1.8rem', 
            fontWeight: 700,
            color: theme.colors.textPrimary
          }}
        >
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </motion.div>
        
        {change !== undefined && (
          <span style={{ 
            color: change >= 0 ? theme.colors.success : theme.colors.error,
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
          </span>
        )}
      </div>
    </motion.div>
  );
};
