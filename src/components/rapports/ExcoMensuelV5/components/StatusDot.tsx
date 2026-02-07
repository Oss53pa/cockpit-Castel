import React from 'react';
import { C } from '../constants';

type DotStatus = 'done' | 'in-progress' | 'critical' | 'pending' | 'warning';

interface StatusDotProps {
  status: DotStatus;
  size?: number;
  label?: string;
}

const DOT_COLORS: Record<DotStatus, string> = {
  done: C.green,
  'in-progress': C.blue,
  critical: C.red,
  pending: C.gray300,
  warning: C.orange,
};

export function StatusDot({ status, size = 7, label }: StatusDotProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: DOT_COLORS[status],
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {label && <span style={{ fontSize: 12, color: C.gray600 }}>{label}</span>}
    </span>
  );
}
