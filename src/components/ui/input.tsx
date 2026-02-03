import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, onFocus, onChange, ...props }, ref) => {
    // Pour les champs numériques, effacer le 0 au focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === 'number' && e.target.value === '0') {
        e.target.value = '';
      }
      // Sélectionner tout le contenu
      e.target.select();
      onFocus?.(e);
    };

    // Pour les champs numériques, supprimer les zéros en tête
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === 'number') {
        let value = e.target.value;
        // Supprimer les zéros en tête (ex: "08000" -> "8000")
        if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
          value = value.replace(/^0+/, '');
          e.target.value = value;
        }
      }
      onChange?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-primary-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-error-500 focus-visible:ring-error-400',
          className
        )}
        ref={ref}
        onFocus={handleFocus}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
