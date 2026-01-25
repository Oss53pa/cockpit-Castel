import React from 'react';
import { cn } from '@/lib/utils';
import type { DividerBlock as DividerBlockType } from '@/types/reportStudio';

interface DividerBlockProps {
  block: DividerBlockType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<DividerBlockType>) => void;
}

export function DividerBlock({
  block,
  isSelected,
  onSelect,
  onUpdate,
}: DividerBlockProps) {
  const getLineStyle = () => {
    switch (block.style) {
      case 'dashed':
        return 'border-dashed';
      case 'dotted':
        return 'border-dotted';
      default:
        return 'border-solid';
    }
  };

  return (
    <div
      className={cn(
        'relative py-4 px-2 rounded transition-all cursor-pointer group',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/30'
          : 'hover:bg-gray-50'
      )}
      onClick={onSelect}
    >
      <hr
        className={cn(
          'border-t-2 border-gray-300',
          getLineStyle(),
          isSelected && 'border-blue-400'
        )}
      />

      {/* Style selector on hover/select */}
      {isSelected && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-white rounded-full shadow-md px-2 py-1 border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ style: 'solid' });
            }}
            className={cn(
              'w-8 h-6 flex items-center justify-center rounded transition-colors',
              block.style === 'solid'
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            )}
            title="Ligne continue"
          >
            <div className="w-5 border-t-2 border-current border-solid" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ style: 'dashed' });
            }}
            className={cn(
              'w-8 h-6 flex items-center justify-center rounded transition-colors',
              block.style === 'dashed'
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            )}
            title="Ligne tiretée"
          >
            <div className="w-5 border-t-2 border-current border-dashed" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ style: 'dotted' });
            }}
            className={cn(
              'w-8 h-6 flex items-center justify-center rounded transition-colors',
              block.style === 'dotted'
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            )}
            title="Ligne pointillée"
          >
            <div className="w-5 border-t-2 border-current border-dotted" />
          </button>
        </div>
      )}
    </div>
  );
}
