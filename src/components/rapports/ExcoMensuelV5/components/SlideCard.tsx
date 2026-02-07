import React from 'react';
import { C } from '../constants';

interface SlideCardProps {
  children: React.ReactNode;
  accentColor?: string;
  accentPosition?: 'left' | 'top';
  className?: string;
  style?: React.CSSProperties;
}

export function SlideCard({ children, accentColor, accentPosition = 'left', className = '', style }: SlideCardProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: C.white,
        borderRadius: 10,
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        border: `1px solid ${C.gray200}`,
        ...(accentColor && accentPosition === 'left' ? { borderLeft: `4px solid ${accentColor}` } : {}),
        ...(accentColor && accentPosition === 'top' ? { borderTop: `4px solid ${accentColor}` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
