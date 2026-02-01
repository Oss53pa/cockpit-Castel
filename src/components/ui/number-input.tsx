/**
 * NumberInput & MoneyInput - Composants de saisie numérique améliorés
 *
 * Résout les problèmes courants:
 * - Le "0" qui bloque la saisie
 * - Pas de décimales (nombres entiers)
 * - Séparateurs de milliers pour les montants
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// UTILS
// ============================================================================

/**
 * Formate un nombre avec séparateurs de milliers (espace)
 */
export function formatNumberWithSeparators(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? parseInt(value.replace(/\s/g, ''), 10) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('fr-FR');
}

/**
 * Parse une chaîne formatée en nombre
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  // Retirer tous les espaces et caractères non numériques (sauf le signe moins)
  const cleaned = value.replace(/[^\d-]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

// ============================================================================
// NumberInput - Pour les nombres simples (avancement, probabilité, etc.)
// ============================================================================

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number | null | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Afficher les séparateurs de milliers */
  formatThousands?: boolean;
  /** Suffixe à afficher (ex: "%", "j") */
  suffix?: string;
  error?: boolean;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({
    value,
    onChange,
    min,
    max,
    formatThousands = false,
    suffix,
    error,
    className,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState('');

    // Mettre à jour displayValue quand value change (de l'extérieur)
    React.useEffect(() => {
      if (!isFocused) {
        if (value === null || value === undefined) {
          setDisplayValue('');
        } else if (formatThousands) {
          setDisplayValue(formatNumberWithSeparators(value));
        } else {
          setDisplayValue(String(value));
        }
      }
    }, [value, isFocused, formatThousands]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // En mode focus, afficher la valeur brute sans formatage
      if (value !== null && value !== undefined) {
        setDisplayValue(String(value));
      }
      // Sélectionner tout le texte
      e.target.select();
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Reformater à la perte de focus
      if (value !== null && value !== undefined) {
        if (formatThousands) {
          setDisplayValue(formatNumberWithSeparators(value));
        } else {
          setDisplayValue(String(value));
        }
      }
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Permettre le champ vide
      if (inputValue === '') {
        setDisplayValue('');
        onChange(min ?? 0);
        return;
      }

      // Nettoyer l'input (retirer tout sauf chiffres et signe moins au début)
      let cleaned = inputValue.replace(/[^\d-]/g, '');

      // Gérer le signe moins (seulement au début)
      if (cleaned.includes('-')) {
        const isNegative = cleaned.startsWith('-');
        cleaned = cleaned.replace(/-/g, '');
        if (isNegative && (min === undefined || min < 0)) {
          cleaned = '-' + cleaned;
        }
      }

      // Retirer les zéros en tête (sauf si c'est juste "0" ou "-0")
      if (cleaned.length > 1 && cleaned.startsWith('0')) {
        cleaned = cleaned.replace(/^0+/, '') || '0';
      }
      if (cleaned.length > 2 && cleaned.startsWith('-0')) {
        cleaned = '-' + cleaned.slice(2).replace(/^0+/, '');
      }

      setDisplayValue(cleaned);

      const numValue = parseInt(cleaned, 10);
      if (!isNaN(numValue)) {
        let finalValue = numValue;
        if (min !== undefined && finalValue < min) finalValue = min;
        if (max !== undefined && finalValue > max) finalValue = max;
        onChange(finalValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permettre: backspace, delete, tab, escape, enter, flèches
      if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
        return;
      }
      // Permettre Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
        return;
      }
      // Permettre le signe moins (si min < 0 ou min non défini)
      if (e.key === '-' && (min === undefined || min < 0)) {
        return;
      }
      // Bloquer tout sauf les chiffres
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex h-10 w-full rounded-lg border border-primary-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error-500 focus-visible:ring-error-400',
            suffix && 'pr-8',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';

// ============================================================================
// MoneyInput - Pour les montants avec séparateurs de milliers
// ============================================================================

export interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number | null | undefined;
  onChange: (value: number) => void;
  /** Devise à afficher (défaut: FCFA) */
  currency?: string;
  /** Position de la devise */
  currencyPosition?: 'prefix' | 'suffix';
  error?: boolean;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({
    value,
    onChange,
    currency = 'FCFA',
    currencyPosition = 'suffix',
    error,
    className,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState('');

    // Mettre à jour displayValue quand value change (de l'extérieur)
    React.useEffect(() => {
      if (!isFocused) {
        if (value === null || value === undefined || value === 0) {
          setDisplayValue('');
        } else {
          setDisplayValue(formatNumberWithSeparators(value));
        }
      }
    }, [value, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // En mode focus, afficher la valeur brute
      if (value !== null && value !== undefined && value !== 0) {
        setDisplayValue(String(value));
      }
      e.target.select();
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Reformater à la perte de focus
      if (value !== null && value !== undefined && value !== 0) {
        setDisplayValue(formatNumberWithSeparators(value));
      } else {
        setDisplayValue('');
      }
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Permettre le champ vide
      if (inputValue === '') {
        setDisplayValue('');
        onChange(0);
        return;
      }

      // Nettoyer l'input
      let cleaned = inputValue.replace(/[^\d]/g, '');

      // Retirer les zéros en tête
      if (cleaned.length > 1) {
        cleaned = cleaned.replace(/^0+/, '') || '0';
      }

      setDisplayValue(cleaned);

      const numValue = parseInt(cleaned, 10);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permettre: backspace, delete, tab, escape, enter, flèches
      if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
        return;
      }
      // Permettre Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
        return;
      }
      // Bloquer tout sauf les chiffres
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <div className="relative">
        {currencyPosition === 'prefix' && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">
            {currency}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className={cn(
            'flex h-10 w-full rounded-lg border border-primary-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error-500 focus-visible:ring-error-400',
            currencyPosition === 'prefix' && 'pl-14',
            currencyPosition === 'suffix' && 'pr-14',
            className
          )}
          {...props}
        />
        {currencyPosition === 'suffix' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">
            {currency}
          </span>
        )}
      </div>
    );
  }
);
MoneyInput.displayName = 'MoneyInput';

// ============================================================================
// PercentInput - Pour les pourcentages (0-100)
// ============================================================================

export interface PercentInputProps extends Omit<NumberInputProps, 'min' | 'max' | 'suffix' | 'formatThousands'> {
  /** Autoriser les valeurs au-delà de 100 */
  allowOver100?: boolean;
}

export const PercentInput = React.forwardRef<HTMLInputElement, PercentInputProps>(
  ({ allowOver100 = false, ...props }, ref) => {
    return (
      <NumberInput
        ref={ref}
        min={0}
        max={allowOver100 ? undefined : 100}
        suffix="%"
        formatThousands={false}
        {...props}
      />
    );
  }
);
PercentInput.displayName = 'PercentInput';

// ============================================================================
// EXPORTS
// ============================================================================

export default NumberInput;
