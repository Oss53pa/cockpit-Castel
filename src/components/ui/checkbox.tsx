import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({ className, checked, disabled, onCheckedChange }: CheckboxProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onCheckedChange?.(!checked);
  };

  return (
    <div
      role="checkbox"
      aria-checked={!!checked}
      aria-disabled={disabled}
      tabIndex={0}
      className={cn(
        'inline-flex items-center justify-center h-4 w-4 shrink-0 rounded border ring-offset-white transition-colors cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
        checked
          ? 'border-primary-900 bg-primary-900 text-primary-50'
          : 'border-primary-300',
        className
      )}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!disabled) onCheckedChange?.(!checked); } }}
    >
      <Check
        className={cn(
          'h-3 w-3 transition-opacity',
          checked ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}
Checkbox.displayName = 'Checkbox';

export { Checkbox };
