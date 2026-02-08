// ============================================================================
// PROPH3T ENGINE V2 — PRÉDICTEUR DE COÛTS
// ============================================================================
// Prévision budgétaire avec scoring de confiance
// ============================================================================

import type {
  Prediction,
  ConfidenceScore,
  ProjectState,
  EVMResult,
} from '../core/types';
import { getConfidenceLevel, BENCHMARKS_WEST_AFRICA_SHOPPING_CENTER } from '../core/constants';

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class CostPredictor {
  /**
   * Génère les prédictions de coûts
   */
  public predict(state: ProjectState): Prediction[] {
    const predictions: Prediction[] = [];
    const now = new Date();

    // Calculer EVM
    const evm = this.calculateEVM(state);

    // Prédiction 1: Estimate at Completion
    if (evm.eac > evm.bac * 1.05) {
      const overrun = ((evm.eac - evm.bac) / evm.bac) * 100;
      predictions.push({
        id: `cost-eac-overrun-${now.getTime()}`,
        type: 'cost',
        title: `Dépassement budgétaire prévu: +${overrun.toFixed(0)}%`,
        description: `L'estimation à terminaison (EAC) est de ${this.formatAmount(evm.eac)} FCFA contre ${this.formatAmount(evm.bac)} FCFA prévus. CPI: ${evm.cpi.toFixed(2)}.`,
        probability: Math.min(90, 40 + overrun * 2),
        impact: overrun > 15 ? 'critical' : overrun > 10 ? 'high' : 'medium',
        confidence: this.calculateConfidence(evm, state),
        timeHorizon: '90d',
        triggerConditions: [
          `CPI = ${evm.cpi.toFixed(2)} (< 1 = dépassement)`,
          `EAC = ${this.formatAmount(evm.eac)} FCFA`,
        ],
        mitigationActions: this.generateCostMitigations(evm, overrun),
        trend: evm.cpi < 0.9 ? 'deteriorating' : 'stable',
        createdAt: now,
        sourceModule: 'budget',
      });
    }

    // Prédiction 2: Cash flow risk
    const cashFlowRisk = this.assessCashFlowRisk(state, evm);
    if (cashFlowRisk) {
      predictions.push({
        ...cashFlowRisk,
        id: `cost-cashflow-${now.getTime()}`,
        createdAt: now,
      } as Prediction);
    }

    // Prédiction 3: Benchmark comparison
    const benchmarkPred = this.compareToBenchmark(state);
    if (benchmarkPred) {
      predictions.push({
        ...benchmarkPred,
        id: `cost-benchmark-${now.getTime()}`,
        createdAt: now,
      } as Prediction);
    }

    return predictions;
  }

  /**
   * Calcule les indicateurs EVM
   */
  public calculateEVM(state: ProjectState): EVMResult {
    const { budgetTotal, budgetEngage, budgetRealise, avancementGlobal } = state.currentMetrics;

    const bac = budgetTotal;
    const pv = bac * (avancementGlobal / 100); // Valeur planifiée
    const ev = bac * (avancementGlobal / 100); // Valeur acquise (simplifiée)
    const ac = budgetRealise; // Coût réel

    const spi = pv > 0 ? ev / pv : 1;
    const cpi = ac > 0 ? ev / ac : 1;
    const eac = cpi > 0 ? bac / cpi : bac;
    const vac = bac - eac;

    const alerts: string[] = [];
    if (cpi < 0.9) alerts.push('CPI < 0.9 : Dépassement budgétaire significatif');
    if (cpi < 0.8) alerts.push('CPI < 0.8 : Alerte critique budget');
    if (spi < 0.9) alerts.push('SPI < 0.9 : Retard sur le planning');

    return {
      pv,
      ev,
      ac,
      bac,
      spi,
      cpi,
      eac,
      vac,
      interpretation: this.interpretEVM(cpi, spi),
      alerts,
    };
  }

  private interpretEVM(cpi: number, spi: number): string {
    if (cpi >= 1 && spi >= 1) {
      return 'Projet sous budget et en avance';
    } else if (cpi >= 1 && spi < 1) {
      return 'Sous budget mais en retard';
    } else if (cpi < 1 && spi >= 1) {
      return 'En avance mais dépassement budgétaire';
    } else {
      return 'En retard et dépassement budgétaire';
    }
  }

  private calculateConfidence(evm: EVMResult, state: ProjectState): ConfidenceScore {
    let score = 70;

    // Plus d'historique = plus de confiance
    if (state.historicalMetrics.length >= 30) score += 15;
    else if (state.historicalMetrics.length >= 14) score += 8;

    // Si avancement significatif, EVM plus fiable
    if (state.currentMetrics.avancementGlobal >= 30) score += 10;

    score = Math.min(95, score);

    return {
      value: score,
      level: getConfidenceLevel(score),
      factors: [
        `Basé sur ${state.historicalMetrics.length} points de données`,
        `Avancement: ${state.currentMetrics.avancementGlobal.toFixed(0)}%`,
        'Méthode EVM standard',
      ],
      dataQuality: Math.min(90, 60 + state.currentMetrics.avancementGlobal / 2),
    };
  }

  private generateCostMitigations(evm: EVMResult, overrun: number): any[] {
    const actions = [];

    if (overrun > 10) {
      actions.push({
        id: 'cost-audit',
        action: 'Audit budgétaire d\'urgence',
        rationale: `Dépassement de ${overrun.toFixed(0)}% détecté`,
        expectedOutcome: 'Identification des postes à optimiser',
        costOfInaction: `Dépassement final estimé: ${this.formatAmount(evm.eac - evm.bac)} FCFA`,
        priority: 'P0',
        effort: 'medium',
        confidence: { value: 80, level: 'high', factors: [], dataQuality: 80 },
        targetModule: 'budget',
        tags: ['budget', 'audit'],
      });
    }

    actions.push({
      id: 'cost-renegotiate',
      action: 'Renégocier les contrats fournisseurs',
      rationale: 'Optimisation des coûts restants',
      expectedOutcome: 'Réduction de 5-10% sur les engagements futurs',
      costOfInaction: 'Opportunité d\'économies manquée',
      priority: 'P1',
      effort: 'high',
      confidence: { value: 70, level: 'high', factors: [], dataQuality: 70 },
      targetModule: 'budget',
      tags: ['budget', 'négociation'],
    });

    return actions;
  }

  private assessCashFlowRisk(state: ProjectState, evm: EVMResult): Partial<Prediction> | null {
    const { budgetEngage, budgetRealise } = state.currentMetrics;
    const engagementsNonRealises = budgetEngage - budgetRealise;

    // Risque si beaucoup d'engagements en attente
    if (engagementsNonRealises < state.currentMetrics.budgetTotal * 0.2) {
      return null;
    }

    return {
      type: 'cost',
      title: 'Tension de trésorerie anticipée',
      description: `${this.formatAmount(engagementsNonRealises)} FCFA d'engagements non encore réalisés vont impacter le cash flow.`,
      probability: 70,
      impact: 'medium',
      confidence: {
        value: 75,
        level: 'high',
        factors: ['Basé sur écart engagement/réalisation'],
        dataQuality: 85,
      },
      timeHorizon: '30d',
      triggerConditions: [
        `Engagements non réalisés: ${this.formatAmount(engagementsNonRealises)} FCFA`,
      ],
      mitigationActions: [{
        id: 'cashflow-plan',
        action: 'Établir un plan de trésorerie prévisionnel',
        rationale: 'Anticiper les besoins de financement',
        expectedOutcome: 'Visibilité sur les besoins à 90 jours',
        costOfInaction: 'Risque de tension de trésorerie',
        priority: 'P1',
        effort: 'low',
        confidence: { value: 80, level: 'high', factors: [], dataQuality: 80 },
        targetModule: 'budget',
        tags: ['trésorerie'],
      }],
      trend: 'stable',
      sourceModule: 'budget',
    };
  }

  private compareToBenchmark(state: ProjectState): Partial<Prediction> | null {
    const benchmark = BENCHMARKS_WEST_AFRICA_SHOPPING_CENTER.find(
      b => b.metric === 'construction_cost_per_sqm'
    );

    if (!benchmark || state.currentMetrics.surfaceTotale === 0) return null;

    const actualCostPerSqm = state.currentMetrics.budgetTotal / state.currentMetrics.surfaceTotale;
    const benchmarkValue = benchmark.value;
    const ecart = ((actualCostPerSqm - benchmarkValue) / benchmarkValue) * 100;

    if (Math.abs(ecart) < 10) return null;

    const isAbove = ecart > 0;

    return {
      type: 'cost',
      title: isAbove
        ? `Coût au m² supérieur au benchmark (+${ecart.toFixed(0)}%)`
        : `Coût au m² inférieur au benchmark (${ecart.toFixed(0)}%)`,
      description: `Coût actuel: ${Math.round(actualCostPerSqm).toLocaleString()} FCFA/m². Benchmark régional: ${benchmarkValue.toLocaleString()} FCFA/m².`,
      probability: isAbove ? 80 : 60,
      impact: isAbove && ecart > 20 ? 'high' : 'medium',
      confidence: {
        value: 65,
        level: 'medium',
        factors: [`Comparaison avec ${benchmark.sampleSize} projets similaires`],
        dataQuality: 70,
      },
      timeHorizon: '90d',
      triggerConditions: [
        `Écart: ${ecart > 0 ? '+' : ''}${ecart.toFixed(0)}% vs benchmark`,
      ],
      mitigationActions: isAbove ? [{
        id: 'benchmark-analysis',
        action: 'Analyser les écarts par rapport au benchmark',
        rationale: 'Identifier les postes de surcoût',
        expectedOutcome: 'Plan d\'optimisation ciblé',
        costOfInaction: 'Maintien d\'un surcoût évitable',
        priority: 'P2',
        effort: 'medium',
        confidence: { value: 70, level: 'high', factors: [], dataQuality: 70 },
        targetModule: 'budget',
        tags: ['benchmark'],
      }] : [],
      trend: 'stable',
      sourceModule: 'budget',
    };
  }

  private formatAmount(amount: number): string {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} Md`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} k`;
    return amount.toFixed(0);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default CostPredictor;
