import React from 'react';
import { SeparatorHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageBreakBlock as PageBreakBlockType } from '@/types/reportStudio';

interface PageBreakBlockProps {
  block: PageBreakBlockType;
  isSelected: boolean;
  onSelect: () => void;
}

export function PageBreakBlock({
  block,
  isSelected,
  onSelect,
}: PageBreakBlockProps) {
  // block is required by interface but not used in rendering
  void block;
  return (
    <div
      className={cn(
        'relative py-6 px-2 rounded transition-all cursor-pointer group',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/30'
          : 'hover:bg-gray-50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t-2 border-dashed border-gray-300" />
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
            isSelected
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          <SeparatorHorizontal className="h-4 w-4" />
          <span>Saut de page</span>
        </div>
        <div className="flex-1 border-t-2 border-dashed border-gray-300" />
      </div>

      {/* Visual indicator for print */}
      <p className="text-center text-xs text-gray-400 mt-2">
        Nouvelle page à l'export
      </p>
    </div>
  );
}
