import { db } from '@/db';
import type { Jalon, Action, PhaseReference } from '@/types';
import type { ProjectConfig } from '@/components/settings/ProjectSettings';
import type { ConfigPropagation } from '@/types/parametresMetier';
import { getParametreMetier } from '@/hooks/useParametresMetier';
import { withWriteContext } from '@/db/writeContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ============================================================================
// PURE DATE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Normalize a date string: "YYYY-MM" -> "YYYY-MM-01", "YYYY-MM-DD" unchanged.
 */
function normalizeDate(dateStr: string): string {
  return dateStr.length === 7 ? dateStr + '-01' : dateStr;
}

/**
 * Validate a date string and return true if it's a valid date.
 * Handles YYYY-MM-DD and YYYY-MM formats.
 */
export function isValidDateString(dateStr: string | null | undefined): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;

  const normalized = normalizeDate(dateStr);
  const date = new Date(normalized);

  // Check if date is valid (not NaN) and the string matches expected format
  if (isNaN(date.getTime())) return false;

  // Verify the date components match (to catch invalid dates like 2024-02-30)
  const [year, month, day] = normalized.split('-').map(Number);
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

/**
 * Safely parse a date string, returning null if invalid.
 */
export function safeParseDateString(dateStr: string | null | undefined): Date | null {
  if (!isValidDateString(dateStr)) return null;
  return new Date(normalizeDate(dateStr!));
}

/**
 * Format a Date object to YYYY-MM-DD string.
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get the date for a project phase from config.
 */
export function getPhaseDate(config: ProjectConfig, phaseRef: PhaseReference): string {
  return normalizeDate(config[phaseRef]);
}

/**
 * Compute a date from a phase reference date + offset in days.
 * Negative offset = before, positive = after.
 *
 * date_debut = phaseDate + delai_declenchement
 */
export function computeDateFromPhase(
  config: ProjectConfig,
  phaseRef: PhaseReference,
  delaiJours: number
): string {
  const ref = new Date(getPhaseDate(config, phaseRef));
  const result = new Date(ref.getTime() + delaiJours * MS_PER_DAY);
  return result.toISOString().split('T')[0];
}

/**
 * Compute the echeance (end date) from a start date and duration in days.
 *
 * date_fin = date_debut + duree_jours
 */
export function computeEcheance(dateDebut: string, dureeJours: number): string {
  const start = new Date(dateDebut);
  const result = new Date(start.getTime() + dureeJours * MS_PER_DAY);
  return result.toISOString().split('T')[0];
}

/**
 * Compute the delai_declenchement (offset in days) from a phase date and a target date.
 * Returns negative if target is before the phase date.
 */
export function computeDelaiFromDate(
  config: ProjectConfig,
  phaseRef: PhaseReference,
  targetDate: string
): number {
  const ref = new Date(getPhaseDate(config, phaseRef));
  const target = new Date(targetDate);
  return Math.round((target.getTime() - ref.getTime()) / MS_PER_DAY);
}

/**
 * Auto-detect which project phase a date is closest to (as a reference).
 * Returns the phase whose date is closest to the given date.
 */
export function detectPhaseForDate(
  config: ProjectConfig,
  dateStr: string
): PhaseReference {
  const target = new Date(dateStr).getTime();
  const phases: PhaseReference[] = [
    'dateDebutConstruction',
    'dateDebutMobilisation',
    'dateSoftOpening',
    'dateFinMobilisation',
  ];

  let closest: PhaseReference = 'dateSoftOpening';
  let minDist = Infinity;

  for (const phase of phases) {
    const phaseTime = new Date(getPhaseDate(config, phase)).getTime();
    const dist = Math.abs(target - phaseTime);
    if (dist < minDist) {
      minDist = dist;
      closest = phase;
    }
  }

  return closest;
}

/**
 * Compute duration in days between two dates.
 */
export function computeDureeJours(dateDebut: string, dateFin: string): number {
  return Math.round(
    (new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / MS_PER_DAY
  );
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format a delai_declenchement for display.
 * Ex: -90 -> "J-90"
 *      15 -> "J+15"
 *       0 -> "J-0"
 */
export function formatDelai(delai: number): string {
  if (delai === 0) return 'J-0';
  if (delai < 0) return `J${delai}`;
  return `J+${delai}`;
}

/**
 * Format delai with description.
 * Ex: -90, "Soft Opening" -> "J-90 (90j avant Soft Opening)"
 */
export function formatDelaiComplet(delai: number, phaseLabel: string): string {
  if (delai === 0) return `J-0 (jour du ${phaseLabel})`;
  if (delai < 0) return `J${delai} (${Math.abs(delai)}j avant ${phaseLabel})`;
  return `J+${delai} (${delai}j après ${phaseLabel})`;
}

// ============================================================================
// ÉCHÉANCE RESOLUTION (for display in list views)
// ============================================================================

/**
 * Resolve the échéance (end date) for an action.
 * Priority:
 *   1. date_fin_prevue if non-empty
 *   2. Compute from jalon_reference + delai_declenchement + duree_prevue_jours
 *   3. date_debut_prevue + duree_prevue_jours
 *   4. date_debut_prevue alone
 *   5. Compute from detected phase (fallback)
 */
export function resolveActionEcheance(
  config: ProjectConfig,
  action: {
    date_fin_prevue?: string;
    date_debut_prevue?: string;
    jalon_reference?: PhaseReference;
    delai_declenchement?: number;
    duree_prevue_jours?: number;
  }
): string | null {
  // 1. Existing date_fin_prevue
  if (action.date_fin_prevue) return action.date_fin_prevue;

  // 2. Compute from phase reference + offset + duration
  if (action.jalon_reference && action.delai_declenchement != null) {
    const dateDebut = computeDateFromPhase(config, action.jalon_reference, action.delai_declenchement);
    if (action.duree_prevue_jours && action.duree_prevue_jours > 0) {
      return computeEcheance(dateDebut, action.duree_prevue_jours);
    }
    return dateDebut;
  }

  // 3. date_debut_prevue + duration
  if (action.date_debut_prevue && action.duree_prevue_jours && action.duree_prevue_jours > 0) {
    return computeEcheance(action.date_debut_prevue, action.duree_prevue_jours);
  }

  // 4. date_debut_prevue alone
  if (action.date_debut_prevue) return action.date_debut_prevue;

  // 5. No data available
  return null;
}

/**
 * Resolve the échéance (date prévue) for a jalon.
 * Priority:
 *   1. date_prevue if non-empty
 *   2. Compute from jalon_reference + delai_declenchement
 *   3. Phase date from jalon_reference alone (offset = 0)
 *   4. Detect phase from date and return phase date
 */
export function resolveJalonEcheance(
  config: ProjectConfig,
  jalon: {
    date_prevue?: string;
    jalon_reference?: PhaseReference;
    delai_declenchement?: number;
  }
): string | null {
  // 1. Existing date_prevue
  if (jalon.date_prevue) return jalon.date_prevue;

  // 2. Compute from phase reference + offset
  if (jalon.jalon_reference && jalon.delai_declenchement != null) {
    return computeDateFromPhase(config, jalon.jalon_reference, jalon.delai_declenchement);
  }

  // 3. Phase date alone (offset = 0)
  if (jalon.jalon_reference) {
    return getPhaseDate(config, jalon.jalon_reference);
  }

  // 4. No data available
  return null;
}

// ============================================================================
// RECALCULATION PREVIEW & APPLICATION
// ============================================================================

export interface RecalculationPreview {
  jalons: Array<{
    id: number;
    titre: string;
    ancienneDate: string;
    nouvelleDate: string;
    phaseRef: string;
    delai: number;
    verrouille: boolean;
  }>;
  actions: Array<{
    id: number;
    titre: string;
    ancienDebut: string;
    nouveauDebut: string;
    ancienneFin: string;
    nouvelleFin: string;
    phaseRef: string;
    delai: number;
    verrouille: boolean;
  }>;
  jalonsAffectes: number;
  actionsAffectees: number;
  jalonsVerrouilles: number;
  actionsVerrouillees: number;
  /** Indique si le recalcul forcé des verrouillés est activé */
  forcerVerrouilles?: boolean;
}

export interface RecalculationOptions {
  /** Si true, recalcule aussi les éléments verrouillés manuellement */
  forcerVerrouilles?: boolean;
}

/**
 * Preview what would change if project phase dates are modified.
 * Recalculates all jalons/actions that have a jalon_reference + delai_declenchement.
 * @param config - Configuration du projet avec les dates de phase
 * @param options - Options de recalcul (forcerVerrouilles pour inclure les éléments verrouillés)
 */
export async function previewRecalculation(
  config: ProjectConfig,
  options: RecalculationOptions = {}
): Promise<RecalculationPreview> {
  const { forcerVerrouilles = false } = options;
  const jalons = await db.jalons.toArray();
  const actions = await db.actions.toArray();

  const jalonPreviews: RecalculationPreview['jalons'] = [];
  const actionPreviews: RecalculationPreview['actions'] = [];

  let jalonsVerrouilles = 0;
  let actionsVerrouillees = 0;

  for (const jalon of jalons) {
    const j = jalon as Jalon & {
      jalon_reference?: PhaseReference;
      delai_declenchement?: number;
      date_verrouillage_manuel?: boolean;
    };

    if (!j.jalon_reference || j.delai_declenchement == null) continue;

    const verrouille = !!j.date_verrouillage_manuel;
    const nouvelleDate = computeDateFromPhase(config, j.jalon_reference, j.delai_declenchement);

    if (verrouille) jalonsVerrouilles++;

    if (nouvelleDate !== jalon.date_prevue) {
      jalonPreviews.push({
        id: jalon.id!,
        titre: jalon.titre,
        ancienneDate: jalon.date_prevue,
        nouvelleDate,
        phaseRef: j.jalon_reference,
        delai: j.delai_declenchement,
        verrouille,
      });
    }
  }

  for (const action of actions) {
    const a = action as Action & {
      jalon_reference?: PhaseReference;
      delai_declenchement?: number;
      date_verrouillage_manuel?: boolean;
    };

    if (!a.jalon_reference || a.delai_declenchement == null) continue;

    const verrouille = !!a.date_verrouillage_manuel;
    const nouveauDebut = computeDateFromPhase(config, a.jalon_reference, a.delai_declenchement);
    const duree = action.duree_prevue_jours || computeDureeJours(action.date_debut_prevue, action.date_fin_prevue);
    const nouvelleFin = computeEcheance(nouveauDebut, duree);

    if (verrouille) actionsVerrouillees++;

    if (nouveauDebut !== action.date_debut_prevue || nouvelleFin !== action.date_fin_prevue) {
      actionPreviews.push({
        id: action.id!,
        titre: action.titre,
        ancienDebut: action.date_debut_prevue,
        nouveauDebut,
        ancienneFin: action.date_fin_prevue,
        nouvelleFin,
        phaseRef: a.jalon_reference,
        delai: a.delai_declenchement,
        verrouille,
      });
    }
  }

  return {
    jalons: jalonPreviews,
    actions: actionPreviews,
    // Si forcerVerrouilles, tous les éléments sont affectés
    jalonsAffectes: forcerVerrouilles
      ? jalonPreviews.length
      : jalonPreviews.filter((j) => !j.verrouille).length,
    actionsAffectees: forcerVerrouilles
      ? actionPreviews.length
      : actionPreviews.filter((a) => !a.verrouille).length,
    jalonsVerrouilles,
    actionsVerrouillees,
    forcerVerrouilles,
  };
}

/**
 * Apply recalculation: update all jalon & action dates based on
 * their stored phase reference + delai_declenchement.
 * @param config - Configuration du projet avec les dates de phase
 * @param options - Options de recalcul (forcerVerrouilles pour inclure les éléments verrouillés)
 */
export async function applyRecalculation(
  config: ProjectConfig,
  options: RecalculationOptions = {}
): Promise<{ jalons: number; actions: number; verrrouillesModifies: number }> {
  const { forcerVerrouilles = false } = options;
  const jalons = await db.jalons.toArray();
  const actions = await db.actions.toArray();

  let jalonsUpdated = 0;
  let actionsUpdated = 0;
  let verrrouillesModifies = 0;

  for (const jalon of jalons) {
    const j = jalon as Jalon & {
      jalon_reference?: PhaseReference;
      delai_declenchement?: number;
      date_verrouillage_manuel?: boolean;
    };

    // Skip si pas de référence ou délai
    if (!j.jalon_reference || j.delai_declenchement == null) {
      continue;
    }

    // Skip les verrouillés sauf si forcerVerrouilles est activé
    if (j.date_verrouillage_manuel && !forcerVerrouilles) {
      continue;
    }

    const nouvelleDate = computeDateFromPhase(config, j.jalon_reference, j.delai_declenchement);

    if (nouvelleDate !== jalon.date_prevue) {
      // Si on modifie un élément verrouillé, on déverrouille automatiquement
      const updateData: { date_prevue: string; date_verrouillage_manuel?: boolean } = {
        date_prevue: nouvelleDate,
      };
      if (j.date_verrouillage_manuel && forcerVerrouilles) {
        updateData.date_verrouillage_manuel = false;
        verrrouillesModifies++;
      }
      await db.jalons.update(jalon.id!, updateData);
      jalonsUpdated++;
    }
  }

  for (const action of actions) {
    const a = action as Action & {
      jalon_reference?: PhaseReference;
      delai_declenchement?: number;
      date_verrouillage_manuel?: boolean;
    };

    // Skip si pas de référence ou délai
    if (!a.jalon_reference || a.delai_declenchement == null) {
      continue;
    }

    // Skip les verrouillés sauf si forcerVerrouilles est activé
    if (a.date_verrouillage_manuel && !forcerVerrouilles) {
      continue;
    }

    const nouveauDebut = computeDateFromPhase(config, a.jalon_reference, a.delai_declenchement);
    const duree = action.duree_prevue_jours || computeDureeJours(action.date_debut_prevue, action.date_fin_prevue);
    const nouvelleFin = computeEcheance(nouveauDebut, duree);

    if (nouveauDebut !== action.date_debut_prevue || nouvelleFin !== action.date_fin_prevue) {
      // Si on modifie un élément verrouillé, on déverrouille automatiquement
      const updateData: {
        date_debut_prevue: string;
        date_fin_prevue: string;
        duree_prevue_jours: number;
        date_verrouillage_manuel?: boolean;
      } = {
        date_debut_prevue: nouveauDebut,
        date_fin_prevue: nouvelleFin,
        duree_prevue_jours: Math.max(duree, 0),
      };
      if (a.date_verrouillage_manuel && forcerVerrouilles) {
        updateData.date_verrouillage_manuel = false;
        verrrouillesModifies++;
      }
      await db.actions.update(action.id!, updateData);
      actionsUpdated++;
    }
  }

  return { jalons: jalonsUpdated, actions: actionsUpdated, verrrouillesModifies };
}

/**
 * Recalculate action dates when a jalon date changes.
 * For actions linked to this jalon (via jalonId), re-derive dates from the jalon's new date.
 * Uses the action's delai_declenchement from its own phase reference, not the jalon.
 */
export async function recalculateActionsForJalon(
  jalonId: number,
  newJalonDate: string
): Promise<number> {
  // This function is called when a jalon's date_prevue changes.
  // Actions linked to this jalon via jalonId that DON'T have their own jalon_reference
  // won't be auto-recalculated (they keep their manual dates).
  // Actions WITH jalon_reference are recalculated via applyRecalculation instead.
  // This function serves as a bridge: if actions are linked and have delai_declenchement
  // relative to the jalon's phase, we recalculate from that.

  const actions = await db.actions.where('jalonId').equals(jalonId).toArray();
  let updated = 0;

  for (const action of actions) {
    const a = action as Action & {
      delai_declenchement?: number;
      date_verrouillage_manuel?: boolean;
    };

    // Skip if locked or no offset configured
    if (a.date_verrouillage_manuel || a.delai_declenchement == null) continue;

    // Use the jalon's new date as the reference point for this action
    const nouveauDebut = new Date(
      new Date(newJalonDate).getTime() + a.delai_declenchement * MS_PER_DAY
    ).toISOString().split('T')[0];

    const duree = action.duree_prevue_jours || computeDureeJours(action.date_debut_prevue, action.date_fin_prevue);
    const nouvelleFin = computeEcheance(nouveauDebut, duree);

    if (nouveauDebut !== action.date_debut_prevue || nouvelleFin !== action.date_fin_prevue) {
      await db.actions.update(action.id!, {
        date_debut_prevue: nouveauDebut,
        date_fin_prevue: nouvelleFin,
        duree_prevue_jours: Math.max(duree, 0),
      });
      updated++;
    }
  }

  return updated;
}

// ============================================================================
// MIGRATION: CONVERT HARDCODED DATES TO PHASE REFERENCES
// ============================================================================

/**
 * Calculate the delay in days between a date and the soft opening date.
 * Negative = before soft opening, Positive = after soft opening.
 */
export function calculateDelayFromSoftOpening(dateStr: string, softOpeningStr: string): number {
  const date = new Date(normalizeDate(dateStr));
  const softOpening = new Date(normalizeDate(softOpeningStr));
  const diffMs = date.getTime() - softOpening.getTime();
  return Math.round(diffMs / MS_PER_DAY);
}

/**
 * Migrate all jalons and actions to use phase references.
 * This function:
 * 1. Calculates the delay (in days) between each date and the soft opening
 * 2. Sets jalon_reference = 'dateSoftOpening' and delai_declenchement for each item
 *
 * IMPORTANT: Cette migration ne modifie PAS les dates existantes (date_prevue, date_fin_prevue).
 * Elle ajoute uniquement les références de phase pour permettre le recalcul futur.
 * Les données modifiées par l'utilisateur sont préservées.
 *
 * After migration, changing the soft opening date will automatically update all dates.
 */
export async function migrateToPhaseReferences(
  config: ProjectConfig
): Promise<{ jalons: number; actions: number }> {
  const jalons = await db.jalons.toArray();
  const actions = await db.actions.toArray();
  const softOpening = config.dateSoftOpening;

  let jalonsUpdated = 0;
  let actionsUpdated = 0;

  // Migrate jalons - SEULEMENT ajouter les références, NE PAS modifier les dates
  for (const jalon of jalons) {
    if (!jalon.date_prevue) continue;

    // Skip si déjà migré (a déjà une référence de phase)
    const j = jalon as Jalon & { jalon_reference?: PhaseReference; delai_declenchement?: number };
    if (j.jalon_reference && j.delai_declenchement != null) continue;

    const delai = calculateDelayFromSoftOpening(jalon.date_prevue, softOpening);

    // Ajouter UNIQUEMENT les références, ne pas toucher aux dates existantes
    await db.jalons.update(jalon.id!, {
      jalon_reference: 'dateSoftOpening' as PhaseReference,
      delai_declenchement: delai,
    });
    jalonsUpdated++;
  }

  // Migrate actions - SEULEMENT ajouter les références, NE PAS modifier les dates
  for (const action of actions) {
    if (!action.date_fin_prevue) continue;

    // Skip si déjà migré (a déjà une référence de phase)
    const a = action as Action & { jalon_reference?: PhaseReference; delai_declenchement?: number };
    if (a.jalon_reference && a.delai_declenchement != null) continue;

    // Calculate delay based on the START date (date_debut_prevue)
    const delaiDebut = action.date_debut_prevue
      ? calculateDelayFromSoftOpening(action.date_debut_prevue, softOpening)
      : calculateDelayFromSoftOpening(action.date_fin_prevue, softOpening) - (action.duree_prevue_jours || 7);

    // Ajouter UNIQUEMENT les références, ne pas toucher aux dates existantes
    await db.actions.update(action.id!, {
      jalon_reference: 'dateSoftOpening' as PhaseReference,
      delai_declenchement: delaiDebut,
    });
    actionsUpdated++;
  }

  return { jalons: jalonsUpdated, actions: actionsUpdated };
}

/**
 * Preview migration: show what would be migrated without applying changes.
 */
export async function previewMigration(
  config: ProjectConfig
): Promise<{
  jalons: Array<{ id: number; titre: string; date: string; delai: number }>;
  actions: Array<{ id: number; titre: string; date: string; delai: number }>;
}> {
  const jalons = await db.jalons.toArray();
  const actions = await db.actions.toArray();
  const softOpening = config.dateSoftOpening;

  const jalonPreviews = jalons
    .filter(j => j.date_prevue)
    .map(j => ({
      id: j.id!,
      titre: j.titre,
      date: j.date_prevue,
      delai: calculateDelayFromSoftOpening(j.date_prevue, softOpening),
    }));

  const actionPreviews = actions
    .filter(a => a.date_fin_prevue)
    .map(a => ({
      id: a.id!,
      titre: a.titre,
      date: a.date_fin_prevue,
      delai: a.date_debut_prevue
        ? calculateDelayFromSoftOpening(a.date_debut_prevue, softOpening)
        : calculateDelayFromSoftOpening(a.date_fin_prevue, softOpening) - (a.duree_prevue_jours || 7),
    }));

  return { jalons: jalonPreviews, actions: actionPreviews };
}

// ============================================================================
// DATE PROJETÉE — PROPAGATION BIDIRECTIONNELLE
// ============================================================================

/**
 * Type de conflit détecté dans les dates projetées
 */
export interface ConflitDate {
  type: 'soft_opening_depasse' | 'verrouillage_incompatible' | 'inversion_sequence';
  criticite: 'critical' | 'high';
  entiteType: 'action' | 'jalon';
  entiteId: number;
  titre: string;
  details: string;
}

/**
 * Calcule la date projetée d'un jalon à partir de l'état de ses actions prérequises.
 * Ne modifie JAMAIS date_prevue (référence contractuelle).
 */
export async function calculerDateProjetee(jalonId: number): Promise<{
  date_projetee: string | null;
  glissement_jours: number;
  actions_en_retard: number;
  actions_total: number;
}> {
  const jalon = await db.jalons.get(jalonId);
  if (!jalon) return { date_projetee: null, glissement_jours: 0, actions_en_retard: 0, actions_total: 0 };

  const config = await getParametreMetier('config_propagation');
  const prerequisIds = jalon.actions_prerequises || [];

  if (prerequisIds.length === 0) {
    return { date_projetee: jalon.date_prevue, glissement_jours: 0, actions_en_retard: 0, actions_total: 0 };
  }

  const allActions = await db.actions.toArray();
  const prerequisActions = allActions.filter(a => prerequisIds.includes(a.id_action));

  if (prerequisActions.length === 0) {
    return { date_projetee: jalon.date_prevue, glissement_jours: 0, actions_en_retard: 0, actions_total: prerequisIds.length };
  }

  const now = new Date();
  let maxFinDate = 0;
  let actionsEnRetard = 0;

  for (const action of prerequisActions) {
    let dateFin: number;
    if (action.statut === 'termine' && action.date_fin_reelle) {
      dateFin = new Date(action.date_fin_reelle).getTime();
    } else {
      const dateFinPrevue = new Date(action.date_fin_prevue).getTime();
      if (dateFinPrevue < now.getTime() && action.statut !== 'termine') {
        // Action en retard : projeter la fin = now + retard accumulé
        const retard = now.getTime() - dateFinPrevue;
        dateFin = dateFinPrevue + retard * 2; // Projection pessimiste
        actionsEnRetard++;
      } else {
        dateFin = dateFinPrevue;
      }
    }
    if (dateFin > maxFinDate) maxFinDate = dateFin;
  }

  // Ajouter le buffer configurable
  const dateProjeteeMs = maxFinDate + config.jalon_buffer_jours * MS_PER_DAY;
  const dateProjetee = new Date(dateProjeteeMs).toISOString().split('T')[0];

  const datePrevueMs = new Date(jalon.date_prevue).getTime();
  const glissement = Math.round((dateProjeteeMs - datePrevueMs) / MS_PER_DAY);

  return {
    date_projetee: glissement > 0 ? dateProjetee : jalon.date_prevue,
    glissement_jours: Math.max(0, glissement),
    actions_en_retard: actionsEnRetard,
    actions_total: prerequisActions.length,
  };
}

/**
 * Recalcule la date projetée de TOUS les jalons.
 * Wrappé dans withWriteContext pour traçabilité.
 */
export async function recalculateTousLesJalonsProjetee(): Promise<{
  jalonsUpdated: number;
  conflits: Array<{ jalonId: number; titre: string; type: string; details: string }>;
}> {
  const jalons = await db.jalons.toArray();
  let jalonsUpdated = 0;
  const conflits: Array<{ jalonId: number; titre: string; type: string; details: string }> = [];

  await withWriteContext({ source: 'auto-calc', description: 'Recalcul batch date_projetee' }, async () => {
    for (const jalon of jalons) {
      if (!jalon.id) continue;
      const result = await calculerDateProjetee(jalon.id);

      if (result.date_projetee && result.date_projetee !== jalon.date_projetee) {
        await db.jalons.update(jalon.id, {
          date_projetee: result.date_projetee,
          date_projetee_calculee_at: new Date().toISOString(),
        });
        jalonsUpdated++;
      }

      if (result.glissement_jours > 0) {
        conflits.push({
          jalonId: jalon.id,
          titre: jalon.titre,
          type: 'glissement',
          details: `Glissement de ${result.glissement_jours}j (${result.actions_en_retard}/${result.actions_total} actions en retard)`,
        });
      }
    }
  });

  return { jalonsUpdated, conflits };
}

/**
 * Propagation descendante : quand un jalon glisse, propose le recalcul
 * des actions dépendantes. Ne modifie pas les actions verrouillées.
 */
export async function propagerGlissementJalon(jalonId: number): Promise<{
  actionsRecalculees: number;
  actionsVerrouillees: number;
  conflits: Array<{ actionId: number; titre: string; type: string }>;
}> {
  const jalon = await db.jalons.get(jalonId);
  if (!jalon || !jalon.date_projetee || !jalon.date_prevue) {
    return { actionsRecalculees: 0, actionsVerrouillees: 0, conflits: [] };
  }

  const glissementMs = new Date(jalon.date_projetee).getTime() - new Date(jalon.date_prevue).getTime();
  const glissementJours = Math.round(glissementMs / MS_PER_DAY);

  if (glissementJours <= 0) {
    return { actionsRecalculees: 0, actionsVerrouillees: 0, conflits: [] };
  }

  // Actions liées à ce jalon (via jalonId ou jalon_reference)
  const actionsLiees = await db.actions.where('jalonId').equals(jalonId).toArray();

  let actionsRecalculees = 0;
  let actionsVerrouillees = 0;
  const conflits: Array<{ actionId: number; titre: string; type: string }> = [];

  await withWriteContext({ source: 'auto-calc', description: `Propagation glissement jalon ${jalonId}` }, async () => {
    for (const action of actionsLiees) {
      if (!action.id) continue;

      if (action.date_verrouillage_manuel) {
        actionsVerrouillees++;
        conflits.push({
          actionId: action.id,
          titre: action.titre,
          type: 'verrouillage_incompatible',
        });
        continue;
      }

      if (action.date_debut_prevue) {
        const nouveauDebut = new Date(
          new Date(action.date_debut_prevue).getTime() + glissementJours * MS_PER_DAY
        ).toISOString().split('T')[0];
        const duree = action.duree_prevue_jours || computeDureeJours(action.date_debut_prevue, action.date_fin_prevue);
        const nouvelleFin = computeEcheance(nouveauDebut, duree);

        await db.actions.update(action.id, {
          date_debut_prevue: nouveauDebut,
          date_fin_prevue: nouvelleFin,
        });
        actionsRecalculees++;
      }
    }
  });

  return { actionsRecalculees, actionsVerrouillees, conflits };
}

/**
 * Détecte les conflits de dates projetées.
 * Retourne une liste de conflits classés par criticité.
 */
export async function detecterConflitsDates(): Promise<ConflitDate[]> {
  const conflits: ConflitDate[] = [];
  const projetConfig = await getParametreMetier('projet_config');
  const config = await getParametreMetier('config_propagation');
  const softOpening = projetConfig.jalonsClés.softOpening;
  const softOpeningMs = new Date(softOpening).getTime();

  const jalons = await db.jalons.toArray();
  const actions = await db.actions.toArray();

  // Type 1: date_projetee dépasse soft opening
  for (const action of actions) {
    if (action.statut === 'termine') continue;
    const dateFin = action.date_fin_prevue;
    if (!dateFin) continue;

    const dateFinMs = new Date(dateFin).getTime();
    if (dateFinMs > softOpeningMs && action.id) {
      conflits.push({
        type: 'soft_opening_depasse',
        criticite: 'critical',
        entiteType: 'action',
        entiteId: action.id,
        titre: action.titre,
        details: `Date fin prévue (${dateFin}) dépasse le soft opening (${softOpening})`,
      });
    }
  }

  // Type 2: verrouillage incompatible (action verrouillée + jalon parent glissé)
  for (const jalon of jalons) {
    if (!jalon.date_projetee || !jalon.date_prevue || !jalon.id) continue;
    const glissement = Math.round(
      (new Date(jalon.date_projetee).getTime() - new Date(jalon.date_prevue).getTime()) / MS_PER_DAY
    );
    if (glissement <= 0) continue;

    const actionsLiees = actions.filter(a => a.jalonId === jalon.id);
    for (const action of actionsLiees) {
      if (action.date_verrouillage_manuel && action.id) {
        conflits.push({
          type: 'verrouillage_incompatible',
          criticite: 'high',
          entiteType: 'action',
          entiteId: action.id,
          titre: action.titre,
          details: `Action verrouillée mais jalon "${jalon.titre}" glissé de ${glissement}j`,
        });
      }
    }
  }

  // Type 3: inversion de séquence (action N se termine après action N+1 avec dépendance)
  for (const action of actions) {
    if (!action.successeurs || action.statut === 'termine') continue;
    const dateFinA = action.date_fin_prevue;
    if (!dateFinA) continue;

    for (const dep of action.successeurs) {
      const succ = actions.find(a => a.id_action === dep.id);
      if (!succ || !succ.date_debut_prevue || !action.id) continue;

      if (new Date(dateFinA).getTime() > new Date(succ.date_debut_prevue).getTime()) {
        conflits.push({
          type: 'inversion_sequence',
          criticite: 'high',
          entiteType: 'action',
          entiteId: action.id,
          titre: action.titre,
          details: `Fin prévue (${dateFinA}) après début successeur "${succ.titre}" (${succ.date_debut_prevue})`,
        });
      }
    }
  }

  return conflits;
}
