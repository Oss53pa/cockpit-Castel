import React from 'react';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type { SyncStatusResult } from '@/types/sync.types';

interface SyncStatusBadgeProps {
  status: SyncStatusResult;
  size?: 'sm' | 'md' | 'lg';
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = SYNC_CONFIG.statusStyles[status.status];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

export default SyncStatusBadge;
