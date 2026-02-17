import type { Action, Jalon, Risque, MeteoProjet, SousTache, MeteoJalon, StatutJalonV2, StatutActionV2 } from '@/types';
import { getDaysUntil } from './utils';
import { SEUILS_METEO_DASHBOARD, SEUILS_RISQUES } from '@/data/constants';

// ============================================================================
// GARDE-FOUS GLOBAUX
// ============================================================================

/** Division sécurisée — retourne fallback si diviseur = 0 */
export function safeDivide(a: number, b: number, fallback = 0): number {
  return b === 0 ? fallback : a / b;
}

/** Array sécurisé — retourne [] si undefined/null */
export function safeArray<T>(arr: T[] | undefined | null): T[] {
  return arr ?? [];
}

/** Date sécurisée — retourne null si chaîne invalide */
export function safeDate(d: string | null | undefined): string | null {
  if (!d) return null;
  return !isNaN(Date.parse(d)) ? d : null;
}

// ============================================================================
// SPÉCIFICATIONS V2.0 - CALCULS AUTOMATISÉS
// ============================================================================

/**
 * Calcule le pourcentage d'avancement d'une action (spécifications v2.0)
 * - Si statut A_FAIRE → 0%
 * - Si statut FAIT → 100%
 * - Si statut BLOQUE → garde la valeur actuelle
 * - Si EN_COURS avec sous-tâches → basé sur les sous-tâches faites
 * - Si EN_COURS sans sous-tâches → valeur manuelle ou 50% par défaut
 */
export function calculerPourcentageAction(
  statut: StatutActionV2 | string,
  sousTaches: SousTache[] = [],
  pourcentageActuel: number = 50
): number {
  // Mapping des statuts legacy vers v2.0
  const statutNormalise = normaliserStatutAction(statut);

  if (statutNormalise === 'A_FAIRE') return 0;
  if (statutNormalise === 'FAIT') return 100;
  if (statutNormalise === 'BLOQUE') return pourcentageActuel;

  // EN_COURS avec sous-tâches (moyenne des avancements)
  if (sousTaches.length > 0) {
    const totalAvancement = sousTaches.reduce((sum, st) => sum + (st.avancement || 0), 0);
    return Math.round(totalAvancement / sousTaches.length);
  }

  // EN_COURS sans sous-tâches → valeur manuelle ou 50% par défaut
  return pourcentageActuel || 50;
}

/**
 * Calcule le pourcentage d'avancement d'un jalon (spécifications v2.0)
 * = Moyenne des pourcentages de toutes les actions du jalon
 */
export function calculerPourcentageJalon(actions: Action[]): number {
  if (actions.length === 0) return 0;

  const somme = actions.reduce((acc, action) => {
    return acc + (action.avancement || 0);
  }, 0);

  return Math.round(somme / actions.length);
}

/**
 * Calcule le statut d'un jalon (spécifications v2.0)
 * - A_VENIR : 0% et date début > aujourd'hui
 * - A_VALIDER : 100% atteint, en attente de validation
 * - ATTEINT : validé
 * - EN_RETARD : échéance dépassée et < 100%
 * - EN_COURS : en progression
 */
export function calculerStatutJalon(
  pourcentage: number,
  dateDebutPrevue: Date | string,
  datePrevue: Date | string,
  dateValidation?: Date | string | null,
  prerequisBloque?: boolean
): StatutJalonV2 {
  const now = new Date();
  const debut = new Date(dateDebutPrevue);
  const fin = new Date(datePrevue);

  if (dateValidation) {
    return 'ATTEINT';
  }

  // P3.6 — Si des prérequis ne sont pas atteints → bloqué
  if (prerequisBloque) {
    return 'BLOQUE';
  }

  if (pourcentage === 0 && debut > now) {
    return 'A_VENIR';
  }

  if (pourcentage === 100) {
    return 'A_VALIDER';
  }

  if (fin < now && pourcentage < 100) {
    return 'EN_RETARD';
  }

  return 'EN_COURS';
}

/**
 * Calcule la météo d'un jalon (spécifications v2.0)
 * Basée sur l'écart entre le % réel et le % théorique (temps écoulé)
 * - SOLEIL : en avance ou à l'heure (écart >= -5)
 * - NUAGEUX : léger retard (écart >= -20)
 * - ORAGEUX : retard significatif (écart < -20)
 */
export function calculerMeteoJalon(
  pourcentageReel: number,
  dateDebutPrevue: Date | string,
  dateFinPrevue: Date | string
): MeteoJalon {
  const now = new Date();
  const debut = new Date(dateDebutPrevue);
  const fin = new Date(dateFinPrevue);

  // J-3 : Garde durée = 0 (début = fin, ou dates invalides)
  const dureeTotal = fin.getTime() - debut.getTime();
  if (dureeTotal <= 0) {
    // Durée nulle ou négative → indéterminé, on renvoie NUAGEUX par défaut
    return pourcentageReel >= 100 ? 'SOLEIL' : 'NUAGEUX';
  }

  // Calcul du % théorique basé sur le temps écoulé
  const dureeEcoulee = Math.max(0, now.getTime() - debut.getTime());
  const pourcentageTheorique = Math.min(100, (dureeEcoulee / dureeTotal) * 100);

  // Écart entre réel et théorique
  const ecart = pourcentageReel - pourcentageTheorique;

  if (ecart >= -5) return 'SOLEIL';      // ☀️ En avance ou à l'heure
  if (ecart >= -20) return 'NUAGEUX';    // 🌤️ Léger retard
  return 'ORAGEUX';                       // ⛈️ Retard significatif
}

/**
 * Normalise un statut d'action legacy vers v2.0
 */
export function normaliserStatutAction(statut: string): StatutActionV2 {
  const mapping: Record<string, StatutActionV2> = {
    // Statuts v2.0
    'A_FAIRE': 'A_FAIRE',
    'EN_COURS': 'EN_COURS',
    'FAIT': 'FAIT',
    'BLOQUE': 'BLOQUE',
    // Statuts legacy
    'a_faire': 'A_FAIRE',
    'en_cours': 'EN_COURS',
    'termine': 'FAIT',
    'fait': 'FAIT',
    'bloque': 'BLOQUE',
    'a_planifier': 'A_FAIRE',
    'planifie': 'A_FAIRE',
    'en_attente': 'EN_COURS',
    'en_validation': 'EN_COURS',
    'annule': 'FAIT',
    'reporte': 'A_FAIRE',
  };
  return mapping[statut] || 'A_FAIRE';
}

/**
 * Normalise un statut de jalon legacy vers v2.0
 */
export function normaliserStatutJalon(statut: string): StatutJalonV2 {
  const mapping: Record<string, StatutJalonV2> = {
    // Statuts v2.0
    'A_VENIR': 'A_VENIR',
    'EN_COURS': 'EN_COURS',
    'A_VALIDER': 'A_VALIDER',
    'ATTEINT': 'ATTEINT',
    'EN_RETARD': 'EN_RETARD',
    'BLOQUE': 'BLOQUE',
    // Statuts legacy
    'a_venir': 'A_VENIR',
    'en_approche': 'EN_COURS',
    'en_danger': 'EN_RETARD',
    'bloque': 'BLOQUE',
    'atteint': 'ATTEINT',
    'depasse': 'EN_RETARD',
    'annule': 'ATTEINT',
  };
  return mapping[statut] || 'A_VENIR';
}

// ============================================================================
// DATE COMPARISON UTILITY (P1.4 — toujours comparer via Date, jamais via string)
// ============================================================================

/** Compare deux dates ISO : retourne true si dateFin est dans le passé par rapport à today */
export function isOverdue(dateFin: string | null | undefined, today?: string): boolean {
  if (!dateFin) return false;
  const fin = new Date(dateFin);
  if (isNaN(fin.getTime())) return false;
  const ref = today ? new Date(today) : new Date();
  ref.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  return fin.getTime() < ref.getTime();
}

// ============================================================================
// PROGRESS CALCULATIONS (existing)
// ============================================================================

export function calculateActionProgress(actions: Action[]): number {
  if (actions.length === 0) return 0;
  return actions.reduce((sum, a) => sum + a.avancement, 0) / actions.length;
}

export function calculateWeightedProgress(
  actions: Action[],
  getWeight: (action: Action) => number = () => 1
): number {
  if (actions.length === 0) return 0;

  const totalWeight = actions.reduce((sum, a) => sum + getWeight(a), 0);
  if (totalWeight === 0) return 0;

  const weightedSum = actions.reduce(
    (sum, a) => sum + a.avancement * getWeight(a),
    0
  );
  return weightedSum / totalWeight;
}

// ============================================================================
// METEO (PROJECT HEALTH) CALCULATIONS
// ============================================================================

export interface MeteoFactors {
  alertesCritiques: number;
  alertesHautes: number;
  actionsEnRetard: number;
  risquesCritiques: number;
  depassementsBudget: number;
}

export function calculateMeteo(factors: MeteoFactors): MeteoProjet {
  const {
    alertesCritiques,
    alertesHautes,
    actionsEnRetard,
    risquesCritiques,
    depassementsBudget,
  } = factors;

  // Rouge: Critical issues
  if (
    alertesCritiques >= SEUILS_METEO_DASHBOARD.rouge.alertesCritiques ||
    actionsEnRetard >= SEUILS_METEO_DASHBOARD.rouge.actionsEnRetard ||
    risquesCritiques >= SEUILS_METEO_DASHBOARD.rouge.risquesCritiques ||
    depassementsBudget >= SEUILS_METEO_DASHBOARD.rouge.depassementsBudget
  ) {
    return 'rouge';
  }

  // Jaune: Warning level
  if (
    alertesCritiques >= SEUILS_METEO_DASHBOARD.jaune.alertesCritiques ||
    alertesHautes >= SEUILS_METEO_DASHBOARD.jaune.alertesHautes ||
    actionsEnRetard >= SEUILS_METEO_DASHBOARD.jaune.actionsEnRetard ||
    risquesCritiques >= SEUILS_METEO_DASHBOARD.jaune.risquesCritiques ||
    depassementsBudget >= SEUILS_METEO_DASHBOARD.jaune.depassementsBudget
  ) {
    return 'jaune';
  }

  // Vert: All good
  return 'vert';
}

export function getMeteoColor(meteo: MeteoProjet): string {
  switch (meteo) {
    case 'vert':
      return 'bg-success-500';
    case 'jaune':
      return 'bg-warning-500';
    case 'rouge':
      return 'bg-error-500';
  }
}

export function getMeteoLabel(meteo: MeteoProjet): string {
  switch (meteo) {
    case 'vert':
      return 'Favorable';
    case 'jaune':
      return 'Vigilance';
    case 'rouge':
      return 'Critique';
  }
}

// ============================================================================
// RISK CALCULATIONS
// ============================================================================

export function calculateRiskScore(
  probabilite: 1 | 2 | 3 | 4 | 5,
  impact: 1 | 2 | 3 | 4 | 5
): number {
  return probabilite * impact;
}

/**
 * Niveau de risque basé sur la matrice 5×5 (max score = 25)
 * Seuils importés de SEUILS_RISQUES (constants.ts) — source unique
 */
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= SEUILS_RISQUES.critique) return 'critical';
  if (score >= SEUILS_RISQUES.majeur) return 'high';
  if (score >= SEUILS_RISQUES.modere) return 'medium';
  return 'low';
}

export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case 'critical':
      return 'bg-error-500 text-white';
    case 'high':
      return 'bg-warning-500 text-white';
    case 'medium':
      return 'bg-info-500 text-white';
    case 'low':
      return 'bg-success-500 text-white';
  }
}

export function buildRiskMatrix(risques: Risque[]): number[][] {
  // 5x5 matrix: [impact][probabilite] = count (grille 5×5, max score = 25)
  const matrix = Array(5)
    .fill(null)
    .map(() => Array(5).fill(0));

  risques.forEach((r) => {
    if (r.status !== 'closed' && r.status !== 'ferme') {
      const impactIdx = Math.min(4, Math.max(0, (r.impact || 1) - 1));
      const probIdx = Math.min(4, Math.max(0, (r.probabilite || 1) - 1));
      matrix[impactIdx][probIdx]++;
    }
  });

  return matrix;
}

// ============================================================================
// BUDGET / EVM CALCULATIONS (Earned Value Management)
// ============================================================================
//
// EVM est une méthode de gestion de projet qui mesure la performance en intégrant:
// - Le périmètre (scope)
// - Le planning (schedule)
// - Les coûts (cost)
//
// Termes clés:
// - PV (Planned Value) : Valeur planifiée - budget prévu à date
// - EV (Earned Value) : Valeur acquise - valeur du travail réellement accompli
// - AC (Actual Cost) : Coût réel - dépenses réelles à date
//
// Indices de performance:
// - SPI (Schedule Performance Index) = EV / PV
//   - SPI > 1 : en avance sur le planning
//   - SPI = 1 : dans les temps
//   - SPI < 1 : en retard
//
// - CPI (Cost Performance Index) = EV / AC
//   - CPI > 1 : sous le budget
//   - CPI = 1 : dans le budget
//   - CPI < 1 : dépassement budgétaire
//
// ============================================================================

/**
 * Calcule l'écart budgétaire (variance) entre prévu et réalisé.
 *
 * @param prevu - Montant budgété/prévu
 * @param realise - Montant réellement dépensé
 * @returns Objet avec valeur absolue et pourcentage d'écart
 *
 * @example
 * calculateBudgetVariance(100000, 95000) // { value: -5000, percent: -5 }
 */
export function calculateBudgetVariance(
  prevu: number,
  realise: number
): { value: number; percent: number } {
  const value = realise - prevu;
  const percent = prevu > 0 ? (value / prevu) * 100 : 0;
  return { value, percent };
}

/**
 * Calcule le Schedule Performance Index (SPI).
 *
 * SPI = EV / PV
 * - SPI > 1 : projet en avance
 * - SPI = 1 : projet dans les temps
 * - SPI < 1 : projet en retard
 *
 * @param EV - Earned Value (valeur acquise)
 * @param PV - Planned Value (valeur planifiée)
 * @returns SPI (1.0 si PV = 0)
 */
export function calculateSPI(EV: number, PV: number): number {
  return PV > 0 ? EV / PV : 1;
}

/**
 * Calcule le Cost Performance Index (CPI).
 *
 * CPI = EV / AC
 * - CPI > 1 : projet sous le budget
 * - CPI = 1 : projet dans le budget
 * - CPI < 1 : dépassement budgétaire
 *
 * @param EV - Earned Value (valeur acquise)
 * @param AC - Actual Cost (coût réel)
 * @returns CPI (1.0 si AC = 0)
 */
export function calculateCPI(EV: number, AC: number): number {
  return AC > 0 ? EV / AC : 1;
}

/**
 * Interprète le SPI en catégorie lisible.
 * Seuil de tolérance: ±5%
 */
export function interpretSPI(spi: number): 'ahead' | 'on_track' | 'behind' {
  if (spi > 1.05) return 'ahead';
  if (spi >= 0.95) return 'on_track';
  return 'behind';
}

/**
 * Interprète le CPI en catégorie lisible.
 * Seuil de tolérance: ±5%
 */
export function interpretCPI(cpi: number): 'under_budget' | 'on_budget' | 'over_budget' {
  if (cpi > 1.05) return 'under_budget';
  if (cpi >= 0.95) return 'on_budget';
  return 'over_budget';
}

// ============================================================================
// DATE CALCULATIONS
// ============================================================================

export function isActionLate(action: Action): boolean {
  if (action.statut === 'termine') return false;
  return isOverdue(action.date_fin_prevue);
}

export function getActionDaysLate(action: Action): number {
  if (action.statut === 'termine') return 0;
  const days = getDaysUntil(action.date_fin_prevue);
  return days < 0 ? Math.abs(days) : 0;
}

export function isJalonAtRisk(
  jalon: Jalon,
  actionsProgress: number,
  daysThreshold = 15,
  progressThreshold = 80
): boolean {
  if (jalon.statut === 'atteint') return false;
  const daysUntil = getDaysUntil(jalon.date_prevue);
  return daysUntil < daysThreshold && actionsProgress < progressThreshold;
}

// ============================================================================
// TREND CALCULATIONS
// ============================================================================

export type Trend = 'up' | 'down' | 'stable';

export function calculateTrend(
  current: number,
  previous: number,
  threshold = 5
): Trend {
  const diff = current - previous;
  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
}

export function getTrendIcon(trend: Trend): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'stable':
      return '→';
  }
}

export function getTrendColor(trend: Trend, isPositive = true): string {
  if (trend === 'stable') return 'text-primary-500';
  if (trend === 'up') {
    return isPositive ? 'text-success-500' : 'text-error-500';
  }
  return isPositive ? 'text-error-500' : 'text-success-500';
}
