import React, { useMemo } from 'react';

interface CoinFlyProps {
  count?: number;
  durationMs?: number;
  endX?: number;
  endY?: number;
}

export const CoinFly: React.FC<CoinFlyProps> = ({
  count = 6,
  durationMs = 900,
  endX = 120,
  endY = -180,
}) => {
  const coins = useMemo(
    () =>
      Array.from({ length: count }).map((_, index) => ({
        id: index,
        delay: index * 60,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {coins.map((coin) => (
        <div
          key={coin.id}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '80px',
            transform: 'translateX(-50%)',
            animationName: 'coin-fly',
            animationDuration: `${durationMs}ms`,
            animationDelay: `${coin.delay}ms`,
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            ['--end-x' as string]: `${endX}px`,
            ['--end-y' as string]: `${endY}px`,
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffd54f, #ffb300)',
              boxShadow: '0 0 10px rgba(255, 215, 64, 0.7)',
            }}
          />
        </div>
      ))}
    </div>
  );
};

