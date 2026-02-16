// ============================================================================
// PROPH3T ENGINE V2 — COHERENCE SCANNER (ADDENDUM)
// ============================================================================
// Scanner d'intégrité et cohérence des données projet
// ============================================================================

import type { ProjectState, ConfidenceScore } from '../core/types';
import { getConfidenceLevel } from '../core/constants';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export type CoherenceCheckCategory =
  | 'data_integrity'
  | 'business_rules'
  | 'temporal_consistency'
  | 'cross_module'
  | 'reference_data';

export type CoherenceSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface CoherenceIssue {
  id: string;
  category: CoherenceCheckCategory;
  severity: CoherenceSeverity;
  title: string;
  description: string;
  affectedEntity?: string;
  affectedModule: string;
  suggestion: string;
  autoFixable: boolean;
  fixAction?: () => Promise<void>;
}

export interface CoherenceCheck {
  id: string;
  name: string;
  category: CoherenceCheckCategory;
  enabled: boolean;
  check: (state: ProjectState) => CoherenceIssue[];
}

export interface CoherenceScanResult {
  timestamp: Date;
  duration: number;
  checksExecuted: number;
  issues: CoherenceIssue[];
  summary: {
    total: number;
    byCategory: Record<CoherenceCheckCategory, number>;
    bySeverity: Record<CoherenceSeverity, number>;
    autoFixableCount: number;
  };
  overallScore: number; // 0-100
  status: 'healthy' | 'issues_found' | 'critical_issues';
}

// ============================================================================
// CHECKS PRÉDÉFINIS
// ============================================================================

const PREDEFINED_CHECKS: Omit<CoherenceCheck, 'enabled'>[] = [
  // DATA INTEGRITY
  {
    id: 'check-budget-totals',
    name: 'Cohérence totaux budget',
    category: 'data_integrity',
    check: (state) => {
      const issues: CoherenceIssue[] = [];
      const { budgetEngage, budgetRealise, budgetTotal } = state.currentMetrics;

      if (budgetRealise > budgetEngage) {
        issues.push({
          id: 'budget-realise-over-engage',
          category: 'data_integrity',
          severity: 'error',
          title: 'Budget réalisé > engagé',
          description: `Le budget réalisé (${budgetRealise.toLocaleString()}) dépasse le budget engagé (${budgetEngage.toLocaleString()})`,
          affectedModule: 'budget',
          suggestion: 'Vérifier les montants engagés ou les factures enregistrées',
          autoFixable: false,
        });
      }

      if (budgetEngage > budgetTotal * 1.3) {
        issues.push({
          id: 'budget-engage-over-total',
          category: 'data_integrity',
          severity: 'critical',
          title: 'Engagements > 130% du budget',
          description: `Les engagements (${budgetEngage.toLocaleString()}) dépassent largement le budget total (${budgetTotal.toLocaleString()})`,
          affectedModule: 'budget',
          suggestion: 'Arbitrage budgétaire urgent requis',
          autoFixable: false,
        });
      }

      return issues;
    },
  },
  {
    id: 'check-actions-totals',
    name: 'Cohérence comptage actions',
    category: 'data_integrity',
    check: (state) => {
      const issues: CoherenceIssue[] = [];
      const { actionsTotal, actionsTerminees, actionsEnRetard } = state.currentMetrics;

      if (actionsTerminees > actionsTotal) {
        issues.push({
          id: 'actions-terminated-over-total',
          category: 'data_integrity',
          severity: 'error',
          title: 'Actions terminées > total',
          description: `Incohérence: ${actionsTerminees} actions terminées pour ${actionsTotal} total`,
          affectedModule: 'planning',
          suggestion: 'Recalculer les compteurs d\'actions',
          autoFixable: true,
        });
      }

      if (actionsEnRetard > actionsTotal - actionsTerminees) {
        issues.push({
          id: 'actions-late-over-remaining',
          category: 'data_integrity',
          severity: 'warning',
          title: 'Actions en retard > restantes',
          description: `${actionsEnRetard} actions en retard mais seulement ${actionsTotal - actionsTerminees} restantes`,
          affectedModule: 'planning',
          suggestion: 'Recalculer le statut des actions',
          autoFixable: true,
        });
      }

      return issues;
    },
  },
  {
    id: 'check-surface-coherence',
    name: 'Cohérence surfaces',
    category: 'data_integrity',
    check: (state) => {
      const issues: CoherenceIssue[] = [];
      const { surfaceLouee, surfaceTotale, tauxOccupation } = state.currentMetrics;

      const calculatedRate = surfaceTotale > 0 ? (surfaceLouee / surfaceTotale) * 100 : 0;

      if (Math.abs(calculatedRate - tauxOccupation) > 2) {
        issues.push({
          id: 'occupation-rate-mismatch',
          category: 'data_integrity',
          severity: 'warning',
          title: 'Taux occupation incohérent',
          description: `Taux affiché: ${tauxOccupation.toFixed(1)}%, calculé: ${calculatedRate.toFixed(1)}%`,
          affectedModule: 'commercialisation',
          suggestion: 'Recalculer le taux d\'occupation depuis les surfaces',
          autoFixable: true,
        });
      }

      if (surfaceLouee > surfaceTotale) {
        issues.push({
          id: 'surface-louee-over-total',
          category: 'data_integrity',
          severity: 'error',
          title: 'Surface louée > totale',
          description: `Surface louée (${surfaceLouee} m²) dépasse la surface totale (${surfaceTotale} m²)`,
          affectedModule: 'commercialisation',
          suggestion: 'Vérifier les données de surfaces',
          autoFixable: false,
        });
      }

      return issues;
    },
  },

  // BUSINESS RULES
  {
    id: 'check-anchor-timeline',
    name: 'Timeline locataire ancre',
    category: 'business_rules',
    check: (state) => {
      const issues: CoherenceIssue[] = [];
      const { joursRestants } = state.currentMetrics;

      if (!state.anchorTenant?.signed && joursRestants < 180) {
        issues.push({
          id: 'anchor-not-signed-6-months',
          category: 'business_rules',
          severity: joursRestants < 90 ? 'critical' : 'warning',
          title: 'Ancre non signé proche ouverture',
          description: `Locataire ancre non signé à ${joursRestants} jours de l'ouverture`,
          affectedModule: 'commercialisation',
          suggestion: 'Prioriser la négociation ou identifier un plan B',
          autoFixable: false,
        });
      }

      return issues;
    },
  },
  {
    id: 'check-avancement-coherence',
    name: 'Cohérence avancement',
    category: 'business_rules',
    check: (state) => {
      const issues: CoherenceIssue[] = [];
      const { avancementGlobal, joursRestants, actionsTerminees, actionsTotal } = state.currentMetrics;

      const avancementActions = actionsTotal > 0 ? (actionsTerminees / actionsTotal) * 100 : 0;

      // Écart significatif entre avancement déclaré et actions
      if (Math.abs(avancementGlobal - avancementActions) > 20) {
        issues.push({
          id: 'avancement-vs-actions-gap',
          category: 'business_rules',
          severity: 'warning',
          title: 'Écart avancement / actions',
          description: `Avancement déclaré: ${avancementGlobal.toFixed(0)}%, actions terminées: ${avancementActions.toFixed(0)}%`,
          affectedModule: 'planning',
          suggestion: 'Recalibrer l\'avancement ou revoir le plan d\'actions',
          autoFixable: false,
        });
      }

      // Avancement faible avec peu de jours restants
      if (avancementGlobal < 50 && joursRestants < 120) {
        issues.push({
          id: 'low-avancement-near-deadline',
          category: 'business_rules',
          severity: 'critical',
          title: 'Avancement insuffisant',
          description: `Seulement ${avancementGlobal.toFixed(0)}% d'avancement à ${joursRestants} jours de l'ouverture`,
          affectedModule: 'planning',
          suggestion: 'Évaluer la faisabilité de la date cible',
          autoFixable: false,
        });
      }

      return issues;
    },
  },

  // TEMPORAL CONSISTENCY
  {
    id: 'check-dates-order',
    name: 'Ordre des dates projet',
    category: 'temporal_consistency',
    check: (state) => {
      const issues: CoherenceIssue[] = [];
      const today = new Date(state.dates.today);
      const softOpening = new Date(state.dates.softOpening);

      if (softOpening <= today) {
        issues.push({
          id: 'soft-opening-past',
          category: 'temporal_consistency',
          severity: 'critical',
          title: 'Date ouverture dans le passé',
          description: `La date de soft opening (${softOpening.toLocaleDateString()}) est dans le passé`,
          affectedModule: 'planning',
          suggestion: 'Mettre à jour la date cible du projet',
          autoFixable: false,
        });
      }

      return issues;
    },
  },
  {
    id: 'check-jours-restants',
    name: 'Calcul jours restants',
    category: 'temporal_consistency',
    check: (state) => {
      const issues: CoherenceIssue[] = [];
      const today = new Date(state.dates.today);
      const softOpening = new Date(state.dates.softOpening);
      const calculatedDays = Math.ceil((softOpening.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (Math.abs(calculatedDays - state.currentMetrics.joursRestants) > 2) {
        issues.push({
          id: 'jours-restants-mismatch',
          category: 'temporal_consistency',
          severity: 'warning',
          title: 'Jours restants incohérents',
          description: `Affiché: ${state.currentMetrics.joursRestants}j, calculé: ${calculatedDays}j`,
          affectedModule: 'planning',
          suggestion: 'Recalculer les jours restants',
          autoFixable: true,
        });
      }

      return issues;
    },
  },

  // CROSS MODULE
  {
    id: 'check-budget-occupation-correlation',
    name: 'Corrélation budget/occupation',
    category: 'cross_module',
    check: (state) => {
      const issues: CoherenceIssue[] = [];
      const { tauxOccupation, budgetEngage, budgetTotal, avancementGlobal } = state.currentMetrics;

      // Si budget presque épuisé mais occupation faible
      const budgetUsedPct = (budgetEngage / budgetTotal) * 100;
      if (budgetUsedPct > 80 && tauxOccupation < 50) {
        issues.push({
          id: 'budget-spent-low-occupation',
          category: 'cross_module',
          severity: 'warning',
          title: 'Budget engagé vs occupation',
          description: `${budgetUsedPct.toFixed(0)}% du budget engagé mais seulement ${tauxOccupation.toFixed(0)}% d'occupation`,
          affectedModule: 'budget',
          suggestion: 'Évaluer le risque d\'insuffisance de revenus pour couvrir les coûts',
          autoFixable: false,
        });
      }

      // Avancement faible mais budget élevé
      if (budgetUsedPct > avancementGlobal + 20) {
        issues.push({
          id: 'budget-ahead-of-progress',
          category: 'cross_module',
          severity: 'warning',
          title: 'Budget en avance sur avancement',
          description: `Budget engagé: ${budgetUsedPct.toFixed(0)}%, avancement: ${avancementGlobal.toFixed(0)}%`,
          affectedModule: 'budget',
          suggestion: 'Analyser les raisons du décalage',
          autoFixable: false,
        });
      }

      return issues;
    },
  },

  // REFERENCE DATA
  {
    id: 'check-lots-baux-coherence',
    name: 'Cohérence lots/baux',
    category: 'reference_data',
    check: (state) => {
      const issues: CoherenceIssue[] = [];
      const { nombreBaux, nombreLots } = state.currentMetrics;

      if (nombreBaux > nombreLots) {
        issues.push({
          id: 'baux-over-lots',
          category: 'reference_data',
          severity: 'error',
          title: 'Plus de baux que de lots',
          description: `${nombreBaux} baux signés pour ${nombreLots} lots disponibles`,
          affectedModule: 'commercialisation',
          suggestion: 'Vérifier la base des lots et des baux',
          autoFixable: false,
        });
      }

      return issues;
    },
  },
];

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class CoherenceScanner {
  private checks: CoherenceCheck[] = [];

  constructor() {
    this.initializeChecks();
  }

  /**
   * Initialise les checks avec les prédéfinis
   */
  private initializeChecks(): void {
    for (const check of PREDEFINED_CHECKS) {
      this.checks.push({ ...check, enabled: true });
    }
  }

  /**
   * Exécute un scan complet de cohérence
   */
  public scan(state: ProjectState): CoherenceScanResult {
    const startTime = Date.now();
    const allIssues: CoherenceIssue[] = [];
    let checksExecuted = 0;

    for (const check of this.checks) {
      if (!check.enabled) continue;

      try {
        const issues = check.check(state);
        allIssues.push(...issues);
        checksExecuted++;
      } catch (error) {
        logger.warn(`Erreur check ${check.id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    const summary = this.buildSummary(allIssues);
    const overallScore = this.calculateScore(summary);
    const status = this.determineStatus(summary);

    return {
      timestamp: new Date(),
      duration,
      checksExecuted,
      issues: allIssues,
      summary,
      overallScore,
      status,
    };
  }

  /**
   * Exécute un scan rapide (checks critiques uniquement)
   */
  public quickScan(state: ProjectState): CoherenceScanResult {
    const criticalChecks = this.checks.filter(c =>
      c.category === 'data_integrity' || c.category === 'temporal_consistency'
    );

    const originalChecks = this.checks;
    this.checks = criticalChecks;
    const result = this.scan(state);
    this.checks = originalChecks;

    return result;
  }

  /**
   * Exécute un check spécifique
   */
  public runCheck(checkId: string, state: ProjectState): CoherenceIssue[] {
    const check = this.checks.find(c => c.id === checkId);
    if (!check || !check.enabled) return [];

    try {
      return check.check(state);
    } catch (error) {
      logger.warn(`Erreur check ${checkId}:`, error);
      return [];
    }
  }

  /**
   * Active/désactive un check
   */
  public setCheckEnabled(checkId: string, enabled: boolean): void {
    const check = this.checks.find(c => c.id === checkId);
    if (check) {
      check.enabled = enabled;
    }
  }

  /**
   * Ajoute un check personnalisé
   */
  public addCheck(check: CoherenceCheck): void {
    this.checks.push(check);
  }

  /**
   * Liste les checks disponibles
   */
  public listChecks(): Array<{ id: string; name: string; category: CoherenceCheckCategory; enabled: boolean }> {
    return this.checks.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      enabled: c.enabled,
    }));
  }

  /**
   * Tente de corriger automatiquement les issues fixables
   */
  public async autoFix(issues: CoherenceIssue[]): Promise<{ fixed: number; failed: number }> {
    let fixed = 0;
    let failed = 0;

    for (const issue of issues) {
      if (!issue.autoFixable || !issue.fixAction) continue;

      try {
        await issue.fixAction();
        fixed++;
      } catch (error) {
        logger.warn(`Auto-fix échoué pour ${issue.id}:`, error);
        failed++;
      }
    }

    return { fixed, failed };
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private buildSummary(issues: CoherenceIssue[]): CoherenceScanResult['summary'] {
    const byCategory: Record<CoherenceCheckCategory, number> = {
      data_integrity: 0,
      business_rules: 0,
      temporal_consistency: 0,
      cross_module: 0,
      reference_data: 0,
    };

    const bySeverity: Record<CoherenceSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    let autoFixableCount = 0;

    for (const issue of issues) {
      byCategory[issue.category]++;
      bySeverity[issue.severity]++;
      if (issue.autoFixable) autoFixableCount++;
    }

    return {
      total: issues.length,
      byCategory,
      bySeverity,
      autoFixableCount,
    };
  }

  private calculateScore(summary: CoherenceScanResult['summary']): number {
    let score = 100;

    // Pénalités par sévérité
    score -= summary.bySeverity.critical * 25;
    score -= summary.bySeverity.error * 15;
    score -= summary.bySeverity.warning * 5;
    score -= summary.bySeverity.info * 1;

    return Math.max(0, Math.min(100, score));
  }

  private determineStatus(summary: CoherenceScanResult['summary']): CoherenceScanResult['status'] {
    if (summary.bySeverity.critical > 0) return 'critical_issues';
    if (summary.bySeverity.error > 0 || summary.bySeverity.warning > 2) return 'issues_found';
    return 'healthy';
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default CoherenceScanner;
