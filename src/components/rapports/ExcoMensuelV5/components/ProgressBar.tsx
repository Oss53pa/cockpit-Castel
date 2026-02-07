import React from 'react';
import { C } from '../constants';

interface ProgressBarProps {
  value: number;     // 0-100
  target?: number;   // optional target line
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({ value, target, color, height = 6, showLabel = true }: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, value));
  const barColor = color || (v >= 80 ? C.green : v >= 50 ? C.orange : C.red);

  return (
    <div className="w-full">
      <div
        style={{
          position: 'relative',
          height,
          backgroundColor: C.gray200,
          borderRadius: height / 2,
          overflow: 'visible',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${v}%`,
            backgroundColor: barColor,
            borderRadius: height / 2,
            transition: 'width 0.5s ease',
          }}
        />
        {target !== undefined && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(target, 100)}%`,
              top: -2,
              bottom: -2,
              width: 2,
              backgroundColor: C.navy,
              borderRadius: 1,
            }}
            title={`Cible: ${Math.round(target)}%`}
          />
        )}
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 11, color: C.gray500 }}>{Math.round(v)}%</span>
          {target !== undefined && (
            <span style={{ fontSize: 11, color: C.gray400 }}>Cible {Math.round(target)}%</span>
          )}
        </div>
      )}
    </div>
  );
}
