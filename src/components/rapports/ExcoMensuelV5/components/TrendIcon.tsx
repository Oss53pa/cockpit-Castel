import React from 'react';
import { C } from '../constants';

interface TrendIconProps {
  direction: 'up' | 'down' | 'stable';
  size?: number;
}

export function TrendIcon({ direction, size = 16 }: TrendIconProps) {
  const config = {
    up:     { symbol: '↗', color: C.green },
    down:   { symbol: '↘', color: C.red },
    stable: { symbol: '→', color: C.gray400 },
  };
  const { symbol, color } = config[direction];

  return (
    <span style={{ fontSize: size, color, fontWeight: 500, lineHeight: 1 }}>{symbol}</span>
  );
}
