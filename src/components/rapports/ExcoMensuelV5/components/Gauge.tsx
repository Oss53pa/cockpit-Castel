import React from 'react';
import { C } from '../constants';

interface GaugeProps {
  value: number;       // 0-100
  size?: number;       // px, default 120
  strokeWidth?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export function Gauge({ value, size = 120, strokeWidth = 6, color, label, showValue = true }: GaugeProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedValue / 100) * circumference;
  const center = size / 2;

  const gaugeColor = color || (normalizedValue >= 80 ? C.green : normalizedValue >= 50 ? C.orange : C.red);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={C.gray200}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {showValue && (
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: size * 0.25, fontWeight: 600, fill: C.navy, fontFamily: 'Inter, sans-serif' }}
          >
            {Math.round(normalizedValue)}%
          </text>
        )}
      </svg>
      {label && (
        <span className="text-xs font-medium" style={{ color: C.gray600 }}>{label}</span>
      )}
    </div>
  );
}
