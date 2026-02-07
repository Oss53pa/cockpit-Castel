// ============================================================================
// HOOK PARAMÈTRES MÉTIER — Directive CRMC Règle 1
// Lit les paramètres depuis secureConfigs avec fallback sur DEFAULT_*
// ============================================================================

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { ParametresMetierCategories, ParametreMetierCategory } from '@/types/parametresMetier';
import {
  DEFAULT_SEUILS_RISQUES,
  DEFAULT_SEUILS_CHEMIN_CRITIQUE,
  DEFAULT_SEUILS_SANTE_AXE,
  DEFAULT_SEUILS_METEO_DASHBOARD,
  DEFAULT_SEUILS_METEO_REPORT,
  DEFAULT_SEUILS_METEO_COPIL,
  DEFAULT_SEUILS_METEO_AXE_DASHBOARD,
  DEFAULT_SEUILS_SYNC_REPORT,
  DEFAULT_SEUILS_KPI_REPORT,
  DEFAULT_SEUILS_CONFIDENCE,
  DEFAULT_SEUILS_UI,
  DEFAULT_AXES_CONFIG_FULL,
  DEFAULT_PROJET_CONFIG,
  DEFAULT_METEO_STYLES,
} from '@/data/constants';

// ============================================================================
// DEFAULTS MAP — Lien entre clé DB et constante par défaut
// ============================================================================

const DEFAULTS: { [K in ParametreMetierCategory]: ParametresMetierCategories[K] } = {
  seuils_risques: DEFAULT_SEUILS_RISQUES as unknown as ParametresMetierCategories['seuils_risques'],
  seuils_chemin_critique: DEFAULT_SEUILS_CHEMIN_CRITIQUE as unknown as ParametresMetierCategories['seuils_chemin_critique'],
  seuils_sante_axe: DEFAULT_SEUILS_SANTE_AXE as unknown as ParametresMetierCategories['seuils_sante_axe'],
  seuils_meteo_dashboard: DEFAULT_SEUILS_METEO_DASHBOARD as unknown as ParametresMetierCategories['seuils_meteo_dashboard'],
  seuils_meteo_report: DEFAULT_SEUILS_METEO_REPORT as unknown as ParametresMetierCategories['seuils_meteo_report'],
  seuils_meteo_copil: DEFAULT_SEUILS_METEO_COPIL as unknown as ParametresMetierCategories['seuils_meteo_copil'],
  seuils_meteo_axe_dashboard: DEFAULT_SEUILS_METEO_AXE_DASHBOARD as unknown as ParametresMetierCategories['seuils_meteo_axe_dashboard'],
  seuils_sync_report: DEFAULT_SEUILS_SYNC_REPORT as unknown as ParametresMetierCategories['seuils_sync_report'],
  seuils_kpi_report: DEFAULT_SEUILS_KPI_REPORT as unknown as ParametresMetierCategories['seuils_kpi_report'],
  seuils_confidence: DEFAULT_SEUILS_CONFIDENCE as unknown as ParametresMetierCategories['seuils_confidence'],
  seuils_ui: DEFAULT_SEUILS_UI as unknown as ParametresMetierCategories['seuils_ui'],
  axes_config: DEFAULT_AXES_CONFIG_FULL as unknown as ParametresMetierCategories['axes_config'],
  projet_config: DEFAULT_PROJET_CONFIG as unknown as ParametresMetierCategories['projet_config'],
  meteo_styles: DEFAULT_METEO_STYLES as unknown as ParametresMetierCategories['meteo_styles'],
};

// ============================================================================
// DEEP MERGE — Fusionne les valeurs admin avec les défauts
// ============================================================================

function deepMerge<T>(defaults: T, overrides: Partial<T>): T {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return (overrides as T) ?? defaults;
  }
  const result = { ...defaults } as Record<string, unknown>;
  for (const key of Object.keys(overrides)) {
    const defaultVal = (defaults as Record<string, unknown>)[key];
    const overrideVal = (overrides as Record<string, unknown>)[key];
    if (
      defaultVal !== null &&
      defaultVal !== undefined &&
      typeof defaultVal === 'object' &&
      !Array.isArray(defaultVal) &&
      overrideVal !== null &&
      overrideVal !== undefined &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal)
    ) {
      result[key] = deepMerge(defaultVal, overrideVal as Partial<typeof defaultVal>);
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal;
    }
  }
  return result as T;
}

// ============================================================================
// CACHE — TTL 5s pour getParametreMetier (services non-React)
// ============================================================================

const cache = new Map<string, { value: unknown; timestamp: number }>();
const CACHE_TTL = 5000;

function getCached<K extends ParametreMetierCategory>(category: K): ParametresMetierCategories[K] | null {
  const entry = cache.get(category);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.value as ParametresMetierCategories[K];
  }
  return null;
}

function setCache<K extends ParametreMetierCategory>(category: K, value: ParametresMetierCategories[K]): void {
  cache.set(category, { value, timestamp: Date.now() });
}

// ============================================================================
// GETTER ASYNC — Pour services non-React
// ============================================================================

export async function getParametreMetier<K extends ParametreMetierCategory>(
  category: K
): Promise<ParametresMetierCategories[K]> {
  const cached = getCached(category);
  if (cached !== null) return cached;

  const dbKey = `parametres_metier.${category}`;
  const record = await db.secureConfigs.where('key').equals(dbKey).first();

  const defaults = DEFAULTS[category];
  if (!record) {
    setCache(category, defaults);
    return defaults;
  }

  try {
    const parsed = JSON.parse(record.value);
    const merged = deepMerge(defaults, parsed);
    setCache(category, merged);
    return merged;
  } catch {
    setCache(category, defaults);
    return defaults;
  }
}

// ============================================================================
// HOOK RÉACTIF — Pour composants React
// ============================================================================

export function useParametreMetier<K extends ParametreMetierCategory>(
  category: K
): ParametresMetierCategories[K] {
  const dbKey = `parametres_metier.${category}`;
  const defaults = DEFAULTS[category];

  const result = useLiveQuery(async () => {
    const record = await db.secureConfigs.where('key').equals(dbKey).first();
    if (!record) return defaults;
    try {
      const parsed = JSON.parse(record.value);
      return deepMerge(defaults, parsed);
    } catch {
      return defaults;
    }
  }, [dbKey]);

  return (result ?? defaults) as ParametresMetierCategories[K];
}

// ============================================================================
// SAVE — Sauvegarde une catégorie de paramètres
// ============================================================================

export async function saveParametreMetier<K extends ParametreMetierCategory>(
  category: K,
  value: Partial<ParametresMetierCategories[K]>
): Promise<void> {
  const dbKey = `parametres_metier.${category}`;
  const now = new Date().toISOString();
  const existing = await db.secureConfigs.where('key').equals(dbKey).first();

  if (existing) {
    await db.secureConfigs.update(existing.id!, {
      value: JSON.stringify(value),
      updatedAt: now,
    });
  } else {
    await db.secureConfigs.add({
      key: dbKey,
      value: JSON.stringify(value),
      isEncrypted: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Invalider le cache
  cache.delete(category);
}

// ============================================================================
// RESET — Supprime l'override DB, retour aux défauts
// ============================================================================

export async function resetParametreMetier<K extends ParametreMetierCategory>(
  category: K
): Promise<void> {
  const dbKey = `parametres_metier.${category}`;
  const existing = await db.secureConfigs.where('key').equals(dbKey).first();
  if (existing) {
    await db.secureConfigs.delete(existing.id!);
  }
  cache.delete(category);
}

// ============================================================================
// HELPERS — Pour vérifier si une catégorie a été personnalisée
// ============================================================================

export async function isParametreCustomized(category: ParametreMetierCategory): Promise<boolean> {
  const dbKey = `parametres_metier.${category}`;
  const count = await db.secureConfigs.where('key').equals(dbKey).count();
  return count > 0;
}

export function getParametreDefaults<K extends ParametreMetierCategory>(
  category: K
): ParametresMetierCategories[K] {
  return DEFAULTS[category];
}
