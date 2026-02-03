import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Jalon, JalonFilters, JalonStatus, Axe, ProjectPhase, MeteoJalon, StatutJalonV2 } from '@/types';
import { AXES, PROJECT_PHASES } from '@/types';
import { getDaysUntil } from '@/lib/utils';
import { recalculateActionsForJalon } from '@/lib/dateCalculations';
import {
  calculerPourcentageJalon,
  calculerStatutJalon,
  calculerMeteoJalon,
} from '@/lib/calculations';
import { autoUpdateJalonStatus } from '@/services/autoCalculationService';
import { trackChange } from './useHistorique';
import { useAppStore } from '@/stores/appStore';

// Champs à tracker pour l'historique des modifications
const TRACKED_JALON_FIELDS: (keyof Jalon)[] = [
  'titre',
  'description',
  'statut',
  'date_prevue',
  'date_reelle',
  'date_validation',
  'avancement_prealables',
  'axe',
  'projectPhase',
  'responsable',
];

export function useJalons(filters?: JalonFilters) {
  const jalons = useLiveQuery(async () => {
    let query = db.jalons.toCollection();

    if (filters?.axe) {
      query = db.jalons.where('axe').equals(filters.axe);
    }

    let results = await query.toArray();

    if (filters?.status) {
      results = results.filter((j) => j.statut === filters.status);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(
        (j) =>
          j.titre.toLowerCase().includes(searchLower) ||
          j.description.toLowerCase().includes(searchLower)
      );
    }
    if (filters?.buildingCode) {
      results = results.filter((j) => j.buildingCode === filters.buildingCode);
    }
    if (filters?.projectPhase) {
      results = results.filter((j) => j.projectPhase === filters.projectPhase);
    }

    // Sort by date
    results.sort((a, b) =>
      new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime()
    );

    return results;
  }, [filters]);

  return jalons ?? [];
}

export function useJalon(id: number | undefined) {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    return db.jalons.get(id);
  }, [id]);
}

export function useJalonsByAxe(axe: Axe) {
  return useLiveQuery(async () => {
    return db.jalons.where('axe').equals(axe).toArray();
  }, [axe]) ?? [];
}

export function useProchainsJalons(limit = 5) {
  return useLiveQuery(async () => {
    const today = new Date().toISOString().split('T')[0];
    const jalons = await db.jalons.toArray();

    return jalons
      .filter((j) => j.date_prevue >= today && j.statut !== 'atteint')
      .sort((a, b) =>
        new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime()
      )
      .slice(0, limit);
  }, [limit]) ?? [];
}

export async function createJalon(
  jalon: Omit<Jalon, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = new Date().toISOString();
  return db.jalons.add({
    ...jalon,
    createdAt: now,
    updatedAt: now,
  } as Jalon);
}

export async function updateJalon(
  id: number,
  updates: Partial<Jalon>,
  options?: { skipTracking?: boolean; isExternal?: boolean }
): Promise<void> {
  // Récupérer le jalon actuel pour comparaison
  const currentJalon = await db.jalons.get(id);

  // Appliquer les updates
  await db.jalons.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  // Tracker les modifications dans l'historique
  if (!options?.skipTracking && currentJalon) {
    const auteurId = options?.isExternal ? 0 : (useAppStore.getState().currentUserId || 1);
    const newData = { ...currentJalon, ...updates };
    await trackChange('jalon', id, auteurId, currentJalon, newData, TRACKED_JALON_FIELDS);
  }
}

/**
 * Update a jalon and optionally propagate date changes to linked actions.
 * Par défaut, la propagation est activée (propagateToActions = true).
 */
export async function updateJalonWithPropagation(
  id: number,
  updates: Partial<Jalon>,
  options: { propagateToActions?: boolean } = { propagateToActions: true }
): Promise<{ actionsUpdated: number }> {
  await updateJalon(id, updates);

  let actionsUpdated = 0;
  // Propagation activée par défaut
  const shouldPropagate = options.propagateToActions !== false;
  if (shouldPropagate && updates.date_prevue) {
    actionsUpdated = await recalculateActionsForJalon(id, updates.date_prevue);
  }

  // Auto-recalculer le statut du jalon après mise à jour
  await autoUpdateJalonStatus(id);

  return { actionsUpdated };
}

export async function deleteJalon(id: number): Promise<void> {
  // Also unlink actions
  const actions = await db.actions.where('jalonId').equals(id).toArray();
  for (const action of actions) {
    await db.actions.update(action.id!, { jalonId: undefined });
  }
  await db.jalons.delete(id);
}

export function calculateJalonStatus(
  jalon: Jalon,
  actionsLiees: { avancement: number }[]
): JalonStatus {
  const daysUntil = getDaysUntil(jalon.date_prevue);
  const avgAvancement =
    actionsLiees.length > 0
      ? actionsLiees.reduce((sum, a) => sum + a.avancement, 0) / actionsLiees.length
      : 0;

  // Already achieved
  if (jalon.date_reelle) {
    return 'atteint';
  }

  // Overdue
  if (daysUntil < 0) {
    return 'depasse';
  }

  // At risk: less than 15 days and progress < 80%
  if (daysUntil < 15 && avgAvancement < 80) {
    return 'en_danger';
  }

  // Approaching: less than 30 days
  if (daysUntil < 30) {
    return 'en_approche';
  }

  // Upcoming
  return 'a_venir';
}

// ============================================================================
// RÉPARATION DES AXES JALONS
// ============================================================================

const VALID_AXES_SET = new Set<string>(AXES);

/**
 * Détermine l'axe correct d'un jalon à partir de son id_jalon et son titre.
 */
function inferAxeFromJalon(idJalon: string, titre: string): Axe {
  // Jalons référentiel par préfixe d'ID
  if (idJalon.startsWith('J1-')) return 'axe1_rh';
  if (idJalon.startsWith('J2-')) return 'axe2_commercial';
  if (idJalon.startsWith('J3-')) return 'axe3_technique';
  if (idJalon.startsWith('J4-')) return 'axe4_budget';
  if (idJalon.startsWith('J5-')) return 'axe5_marketing';
  if (idJalon.startsWith('J6-')) return 'axe6_exploitation';

  // Jalons globaux (J-001 à J-007)
  if (idJalon === 'J-001') return 'axe4_budget';
  if (idJalon === 'J-002') return 'axe1_rh';
  if (idJalon === 'J-003') return 'axe2_commercial';
  if (idJalon === 'J-004') return 'axe4_budget';
  if (idJalon === 'J-005') return 'axe5_marketing';
  if (idJalon === 'J-006') return 'axe6_exploitation';
  if (idJalon === 'J-007') return 'axe5_marketing';

  // Inférence par le titre pour les jalons legacy (JAL-YYYY-xxx, JAL-CC-xxx, etc.)
  const t = titre.toLowerCase();
  if (/recrut|formation|équipe|organigramme|\brh\b|manager recruté|agent|superviseur/.test(t)) return 'axe1_rh';
  if (/commerci|befa|occupation|preneur|boutique|locat|bail|signé.*contrat|contrat.*sign|vente|grille tarifaire|plan de commercialisation|artisan/.test(t)) return 'axe2_commercial';
  if (/budget|financ|coût|trésorerie|consolidé/.test(t)) return 'axe4_budget';
  if (/marketing|communication|campagne|signalétique|site web|teasing|promo|inaugur|lancement.*comm/.test(t)) return 'axe5_marketing';
  if (/exploit|sécurité|nettoyage|procédure.*exploit|logiciel.*gestion|commission.*sécurité|conformité|mise en service/.test(t)) return 'axe6_exploitation';

  // Par défaut : technique (travaux, réception, OPR, livraison, etc.)
  return 'axe3_technique';
}

/**
 * Répare les jalons en base qui n'ont pas d'axe défini ou qui ont un axe invalide.
 * Attribue l'axe correct basé sur l'id_jalon et le titre.
 */
export async function repairJalonAxes(): Promise<number> {
  const jalons = await db.jalons.toArray();
  let repaired = 0;

  for (const jalon of jalons) {
    if (!jalon.axe || !VALID_AXES_SET.has(jalon.axe)) {
      const correctAxe = inferAxeFromJalon(jalon.id_jalon, jalon.titre);
      await db.jalons.update(jalon.id!, { axe: correctAxe });
      repaired++;
    }
  }

  return repaired;
}

// ============================================================================
// RÉPARATION DES PHASES PROJET
// ============================================================================

const VALID_PHASES_SET = new Set<string>(PROJECT_PHASES);

/**
 * Détermine la phase projet à partir d'une date (limites non chevauchantes).
 *   Phase 1 Préparation   : ≤ 31 mars 2026
 *   Phase 2 Mobilisation  : 1 avril – 30 septembre 2026
 *   Phase 3 Lancement     : 1 octobre – 31 décembre 2026
 *   Phase 4 Stabilisation : ≥ 1 janvier 2027
 */
function getPhaseFromDate(dateStr: string): ProjectPhase {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth();

  if (y < 2026) return 'phase1_preparation';
  if (y === 2026 && m <= 2) return 'phase1_preparation';
  if (y === 2026 && m <= 8) return 'phase2_mobilisation';
  if (y === 2026) return 'phase3_lancement';
  return 'phase4_stabilisation';
}

/**
 * Répare le champ projectPhase de tous les jalons et actions
 * en le recalculant à partir de leur date.
 */
export async function repairProjectPhases(): Promise<number> {
  let repaired = 0;

  // Jalons : basé sur date_prevue
  const jalons = await db.jalons.toArray();
  for (const jalon of jalons) {
    if (!jalon.date_prevue) continue;
    const correctPhase = getPhaseFromDate(jalon.date_prevue);
    if (jalon.projectPhase !== correctPhase) {
      await db.jalons.update(jalon.id!, { projectPhase: correctPhase });
      repaired++;
    }
  }

  // Actions : basé sur date_fin_prevue (ou dateDebut en fallback)
  const actions = await db.actions.toArray();
  for (const action of actions) {
    const dateRef = action.date_fin_prevue || action.date_debut_prevue;
    if (!dateRef) continue;
    const correctPhase = getPhaseFromDate(dateRef);
    if (action.projectPhase !== correctPhase) {
      await db.actions.update(action.id!, { projectPhase: correctPhase });
      repaired++;
    }
  }

  return repaired;
}

export async function recalculateJalonStatuses(): Promise<void> {
  const jalons = await db.jalons.toArray();

  for (const jalon of jalons) {
    const actions = await db.actions
      .where('jalonId')
      .equals(jalon.id!)
      .toArray();

    const newStatus = calculateJalonStatus(jalon, actions);

    if (newStatus !== jalon.statut) {
      await db.jalons.update(jalon.id!, { statut: newStatus });
    }
  }
}

// ============================================================================
// HOOK useJalonCalculs (spécifications v2.0)
// ============================================================================

/**
 * Hook pour obtenir les calculs automatisés d'un jalon (spécifications v2.0)
 * Retourne le pourcentage, statut et météo calculés automatiquement
 */
export function useJalonCalculs(jalonId: number | undefined) {
  const jalon = useJalon(jalonId);

  // Récupérer les actions du jalon
  const actionsJalon = useLiveQuery(async () => {
    if (!jalonId) return [];
    return db.actions.where('jalonId').equals(jalonId).toArray();
  }, [jalonId]) ?? [];

  // Calculer le pourcentage (moyenne des actions)
  const pourcentage = useMemo(() => {
    return calculerPourcentageJalon(actionsJalon);
  }, [actionsJalon]);

  // Calculer le statut
  const statut = useMemo((): StatutJalonV2 => {
    if (!jalon) return 'A_VENIR';
    return calculerStatutJalon(
      pourcentage,
      jalon.date_prevue,
      jalon.date_prevue, // Utiliser date_prevue comme date de fin pour l'instant
      jalon.date_validation
    );
  }, [jalon, pourcentage]);

  // Calculer la météo
  const meteo = useMemo((): MeteoJalon => {
    if (!jalon) return 'SOLEIL';
    // Utiliser une date de début estimée (date_prevue - 30 jours si non définie)
    const dateDebut = jalon.date_prevue
      ? new Date(new Date(jalon.date_prevue).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      : jalon.date_prevue;
    return calculerMeteoJalon(pourcentage, dateDebut, jalon.date_prevue);
  }, [jalon, pourcentage]);

  // Calculer les jours restants
  const joursRestants = useMemo(() => {
    if (!jalon) return 0;
    return getDaysUntil(jalon.date_prevue);
  }, [jalon]);

  return {
    jalon,
    actionsJalon,
    pourcentage,
    statut,
    meteo,
    joursRestants,
  };
}
