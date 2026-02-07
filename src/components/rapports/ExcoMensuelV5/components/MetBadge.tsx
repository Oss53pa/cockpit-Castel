import React from 'react';
import { METEO_CONFIG, type MeteoLevel } from '../constants';
import { WeatherIcon } from './WeatherIcon';

interface MetBadgeProps {
  level: MeteoLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function MetBadge({ level, size = 'md', showLabel = true }: MetBadgeProps) {
  const config = METEO_CONFIG[level];
  const sizes = {
    sm: { padding: '2px 8px', fontSize: '11px', iconSize: 16 },
    md: { padding: '4px 12px', fontSize: '13px', iconSize: 20 },
    lg: { padding: '6px 16px', fontSize: '15px', iconSize: 24 },
  };
  const s = sizes[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: s.padding,
        borderRadius: '999px',
        backgroundColor: config.bgColor,
        color: config.color,
        fontSize: s.fontSize,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <WeatherIcon level={level} size={s.iconSize} />
      {showLabel && config.label}
    </span>
  );
}
