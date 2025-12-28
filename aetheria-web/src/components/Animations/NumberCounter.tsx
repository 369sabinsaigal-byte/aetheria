import React from 'react';
import { animated, useSpring } from '@react-spring/web';

interface NumberCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const NumberCounter: React.FC<NumberCounterProps> = ({
  value,
  prefix,
  suffix,
  decimals = 2,
  className,
}) => {
  const { val } = useSpring({
    from: { val: 0 },
    val: value,
    config: { tension: 170, friction: 26 },
  });

  return (
    <animated.span className={className}>
      {val.to((v) => {
        const formatted = v.toFixed(decimals);
        return `${prefix ?? ''}${formatted}${suffix ?? ''}`;
      })}
    </animated.span>
  );
};

