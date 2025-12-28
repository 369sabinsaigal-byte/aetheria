import React from 'react';

interface LiquidFillProps {
  progress: number;
  size?: number;
}

export const LiquidFill: React.FC<LiquidFillProps> = ({ progress, size = 72 }) => {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '999px',
        border: '1px solid rgba(255,255,255,0.15)',
        padding: '4px',
        background:
          'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.2), transparent 60%), rgba(15,15,20,1)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '999px',
          overflow: 'hidden',
          position: 'relative',
          background: 'rgba(10,10,15,1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(${100 - clamped}%)`,
            background:
              'linear-gradient(135deg, rgba(0,136,204,0.9), rgba(108,92,231,0.9))',
            animation: 'breathe 3s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
};

