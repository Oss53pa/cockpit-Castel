import React from 'react';
import { C } from '../constants';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, right }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: C.navy, margin: 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: C.gray500, margin: '4px 0 0 0' }}>{subtitle}</p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
