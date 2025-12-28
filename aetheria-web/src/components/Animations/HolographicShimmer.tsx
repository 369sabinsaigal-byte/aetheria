import React from 'react';

interface HolographicShimmerProps {
  children: React.ReactNode;
  className?: string;
}

export const HolographicShimmer: React.FC<HolographicShimmerProps> = ({
  children,
  className,
}) => {
  return (
    <div className={className ? `relative ${className}` : 'relative'}>
      <div className="virtual-card">
        <div className="holographic-gradient" />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

