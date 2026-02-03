import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'XOF'): string {
  if (amount === 0 || amount === null || amount === undefined) {
    return '0 FCFA';
  }
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

export function formatNumber(value: number, decimals?: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
}

export function formatDateLong(date: Date | string | undefined | null): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
}

export function formatDateRelative(date: Date | string | undefined | null): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Demain';
    if (days === -1) return 'Hier';
    if (days > 0 && days <= 7) return `Dans ${days} jours`;
    if (days < 0 && days >= -7) return `Il y a ${Math.abs(days)} jours`;
    return formatDate(d);
  } catch {
    return '-';
  }
}

export function getDaysUntil(date: Date | string | undefined | null): number {
  if (!date) return 0;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// ============================================================================
// COSMOS ANGRÉ - UTILITAIRES PARTAGÉS
// ============================================================================

// Type pour les codes bâtiment Cosmos Angré (unifié avec BATIMENTS_CONFIG)
export type BuildingCode = 'CC' | 'MKT' | 'BB1' | 'BB2' | 'BB3' | 'BB4';

export const VALID_BUILDING_CODES: BuildingCode[] = ['CC', 'MKT', 'BB1', 'BB2', 'BB3', 'BB4'];

// Convertir une Date en string ISO (YYYY-MM-DD)
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Calculer les dates d'alerte (J-30, J-15, J-7, J-3) à partir d'une date cible
export interface AlertDates {
  j30: string;
  j15: string;
  j7: string;
  j3: string;
}

export function getAlertDates(targetDate: Date | string): AlertDates {
  const date = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

  const j30 = new Date(date);
  j30.setDate(j30.getDate() - 30);

  const j15 = new Date(date);
  j15.setDate(j15.getDate() - 15);

  const j7 = new Date(date);
  j7.setDate(j7.getDate() - 7);

  const j3 = new Date(date);
  j3.setDate(j3.getDate() - 3);

  return {
    j30: toDateString(j30),
    j15: toDateString(j15),
    j7: toDateString(j7),
    j3: toDateString(j3),
  };
}

// Parser un code bâtiment depuis un ID d'action (ex: "CC.001" -> "CC")
export function parseBuildingCodeFromId(actionId: string): BuildingCode | undefined {
  const prefix = actionId.split('.')[0];
  return VALID_BUILDING_CODES.includes(prefix as BuildingCode)
    ? prefix as BuildingCode
    : undefined;
}
