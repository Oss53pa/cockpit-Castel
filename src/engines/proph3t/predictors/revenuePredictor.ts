// ============================================================================
// PROPH3T ENGINE V2 — PRÉDICTEUR DE REVENUS
// ============================================================================
// Prévision des revenus commerciaux avec scoring de confiance
// ============================================================================

import type {
  Prediction,
  ConfidenceScore,
  ProjectState,
  CommercialAnalysis,
  TrendDirection,
} from '../core/types';
import { getConfidenceLevel, BENCHMARKS_WEST_AFRICA_SHOPPING_CENTER } from '../core/constants';

// ============================================================================
// CONSTANTES
// ============================================================================

const LOYER_MOYEN_M2_MOIS = 15000; // FCFA/m²/mois (benchmark)
const TAUX_OCCUPATION_CIBLE = 80; // %
const MOIS_RAMPUP = 6; // Mois pour atteindre le taux nominal

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class RevenuePredictor {
  /**
   * Génère les prédictions de revenus
   */
  public predict(state: ProjectState): Prediction[] {
    const predictions: Prediction[] = [];
    const now = new Date();

    // Analyse commerciale
    const analysis = this.analyzeCommercial(state);

    // Prédiction 1: Revenus An1
    const revenuPred = this.predictAnnualRevenue(state, analysis);
    if (revenuPred) {
      predictions.push({
        ...revenuPred,
        id: `revenue-annual-${now.getTime()}`,
        createdAt: now,
      } as Prediction);
    }

    // Prédiction 2: Impact taux occupation
    if (analysis.occupancyRate < TAUX_OCCUPATION_CIBLE - 10) {
      const shortfall = TAUX_OCCUPATION_CIBLE - analysis.occupancyRate;
      const revenueImpact = this.calculateRevenueShortfall(state, shortfall);

      predictions.push({
        id: `revenue-occupancy-${now.getTime()}`,
        type: 'revenue',
        title: `Manque à gagner: ${shortfall.toFixed(0)}% d'occupation`,
        description: `Le taux d'occupation (${analysis.occupancyRate.toFixed(0)}%) est ${shortfall.toFixed(0)} points sous l'objectif. Impact revenus estimé: ${this.formatAmount(revenueImpact)}/an.`,
        probability: 75,
        impact: shortfall > 20 ? 'critical' : shortfall > 10 ? 'high' : 'medium',
        confidence: this.calculateConfidence(state, analysis),
        timeHorizon: '90d',
        triggerConditions: [
          `Occupation: ${analysis.occupancyRate.toFixed(0)}%`,
          `Cible: ${TAUX_OCCUPATION_CIBLE}%`,
          `Écart: ${shortfall.toFixed(0)} points`,
        ],
        mitigationActions: this.generateCommercialMitigations(shortfall),
        trend: analysis.trend,
        createdAt: now,
        sourceModule: 'commercialisation',
      });
    }

    // Prédiction 3: Risque locataire ancre
    if (!state.anchorTenant?.signed) {
      const anchorPred = this.predictAnchorRisk(state);
      if (anchorPred) {
        predictions.push({
          ...anchorPred,
          id: `revenue-anchor-${now.getTime()}`,
          createdAt: now,
        } as Prediction);
      }
    }

    // Prédiction 4: Benchmark revenus
    const benchmarkPred = this.compareToBenchmark(state, analysis);
    if (benchmarkPred) {
      predictions.push({
        ...benchmarkPred,
        id: `revenue-benchmark-${now.getTime()}`,
        createdAt: now,
      } as Prediction);
    }

    return predictions;
  }

  /**
   * Retourne l'analyse commerciale
   */
  public getStatus(state: ProjectState): CommercialAnalysis {
    return this.analyzeCommercial(state);
  }

  /**
   * Analyse la situation commerciale
   */
  private analyzeCommercial(state: ProjectState): CommercialAnalysis {
    const {
      tauxOccupation,
      surfaceLouee,
      surfaceTotale,
      nombreBaux,
      nombreLots,
      revenuPrevisionnel,
    } = state.currentMetrics;

    // Déterminer la tendance
    let trend: TrendDirection = 'stable';
    if (state.historicalMetrics.length >= 7) {
      const recentOccupation = state.historicalMetrics.slice(-7).map(m => m.tauxOccupation);
      const avgRecent = recentOccupation.reduce((a, b) => a + b, 0) / recentOccupation.length;
      const oldOccupation = state.historicalMetrics.slice(-14, -7).map(m => m.tauxOccupation);
      const avgOld = oldOccupation.length > 0
        ? oldOccupation.reduce((a, b) => a + b, 0) / oldOccupation.length
        : avgRecent;

      if (avgRecent > avgOld + 2) trend = 'improving';
      else if (avgRecent < avgOld - 2) trend = 'deteriorating';
    }

    // Alertes
    const alerts: string[] = [];
    if (tauxOccupation < 50 && state.currentMetrics.joursRestants < 180) {
      alerts.push('Occupation < 50% à moins de 6 mois de l\'ouverture');
    }
    if (!state.anchorTenant?.signed) {
      alerts.push('Locataire ancre non signé');
    }
    if (nombreBaux < nombreLots * 0.5 && state.currentMetrics.joursRestants < 120) {
      alerts.push(`Seulement ${nombreBaux}/${nombreLots} baux signés`);
    }

    return {
      occupancyRate: tauxOccupation,
      targetRate: TAUX_OCCUPATION_CIBLE,
      signedLeases: nombreBaux,
      totalUnits: nombreLots,
      anchorSigned: state.anchorTenant?.signed ?? false,
      projectedAnnualRevenue: revenuPrevisionnel,
      trend,
      alerts,
    };
  }

  private predictAnnualRevenue(state: ProjectState, analysis: CommercialAnalysis): Partial<Prediction> | null {
    const { surfaceTotale, tauxOccupation } = state.currentMetrics;

    // Calculer le revenu théorique à 80% d'occupation
    const revenuTheorique80 = surfaceTotale * 0.8 * LOYER_MOYEN_M2_MOIS * 12;

    // Calculer le revenu projeté au taux actuel
    const revenuProjecte = surfaceTotale * (tauxOccupation / 100) * LOYER_MOYEN_M2_MOIS * 12;

    // Prendre en compte le ramp-up (premier trimestre à 50%)
    const revenuAn1Realiste = (revenuProjecte * 0.5 * 3 + revenuProjecte * 9) / 12 * 12;

    const ecart = revenuTheorique80 - revenuAn1Realiste;
    const ecartPct = (ecart / revenuTheorique80) * 100;

    if (ecartPct < 10) return null;

    return {
      type: 'revenue',
      title: `Revenus An1 projetés: ${this.formatAmount(revenuAn1Realiste)} FCFA`,
      description: `Revenus An1 estimés à ${this.formatAmount(revenuAn1Realiste)} FCFA (vs ${this.formatAmount(revenuTheorique80)} FCFA à 80% occupation). Manque à gagner: ${this.formatAmount(ecart)}.`,
      probability: 70,
      impact: ecartPct > 30 ? 'high' : 'medium',
      confidence: this.calculateConfidence(state, analysis),
      timeHorizon: '180d',
      triggerConditions: [
        `Taux occupation projeté: ${tauxOccupation.toFixed(0)}%`,
        `Revenu An1 estimé: ${this.formatAmount(revenuAn1Realiste)}`,
      ],
      mitigationActions: [{
        id: 'revenue-optimization',
        action: 'Plan d\'optimisation des revenus',
        rationale: `Récupérer ${this.formatAmount(ecart)} de manque à gagner`,
        expectedOutcome: 'Augmentation du taux d\'occupation et/ou des loyers',
        costOfInaction: `Manque à gagner de ${this.formatAmount(ecart)}/an`,
        priority: 'P1',
        effort: 'high',
        confidence: { value: 65, level: 'medium', factors: [], dataQuality: 70 },
        targetModule: 'commercialisation',
        tags: ['revenus', 'optimisation'],
      }],
      trend: analysis.trend,
      sourceModule: 'commercialisation',
    };
  }

  private predictAnchorRisk(state: ProjectState): Partial<Prediction> | null {
    const moisRestants = state.currentMetrics.joursRestants / 30;

    if (moisRestants > 12) return null;

    // Impact estimé de l'absence d'ancre
    const anchorSurfaceEstimate = state.currentMetrics.surfaceTotale * 0.2; // 20% typique
    const anchorRevenueImpact = anchorSurfaceEstimate * LOYER_MOYEN_M2_MOIS * 0.7 * 12; // -30% loyer ancre

    // Impact indirect (attractivité)
    const indirectImpact = state.currentMetrics.surfaceTotale * 0.3 * LOYER_MOYEN_M2_MOIS * 12 * 0.15;

    const totalImpact = anchorRevenueImpact + indirectImpact;

    return {
      type: 'revenue',
      title: 'Risque revenus: Locataire ancre non signé',
      description: `L'absence de locataire ancre à ${moisRestants.toFixed(0)} mois de l'ouverture menace ${this.formatAmount(totalImpact)} de revenus annuels.`,
      probability: Math.min(90, 100 - moisRestants * 8),
      impact: moisRestants < 6 ? 'critical' : 'high',
      confidence: {
        value: 80,
        level: 'high',
        factors: ['Statut signature ancre confirmé', 'Impact standard sur attractivité'],
        dataQuality: 85,
      },
      timeHorizon: '90d',
      triggerConditions: [
        'Bail ancre non signé',
        `${moisRestants.toFixed(0)} mois avant ouverture`,
      ],
      mitigationActions: [
        {
          id: 'anchor-priority',
          action: 'Priorisation absolue négociation ancre',
          rationale: 'L\'ancre conditionne le succès commercial',
          expectedOutcome: 'Signature du bail ancre sous 30 jours',
          costOfInaction: `Perte potentielle: ${this.formatAmount(totalImpact)}/an`,
          priority: 'P0',
          effort: 'high',
          confidence: { value: 75, level: 'high', factors: [], dataQuality: 80 },
          targetModule: 'commercialisation',
          tags: ['ancre', 'priorité'],
        },
        {
          id: 'anchor-plan-b',
          action: 'Identifier un locataire ancre alternatif',
          rationale: 'Plan B en cas d\'échec négociation',
          expectedOutcome: 'Alternative identifiée et pré-négociée',
          costOfInaction: 'Pas d\'alternative si échec',
          priority: 'P1',
          effort: 'medium',
          confidence: { value: 70, level: 'high', factors: [], dataQuality: 75 },
          targetModule: 'commercialisation',
          tags: ['ancre', 'alternative'],
        },
      ],
      trend: 'deteriorating',
      sourceModule: 'commercialisation',
    };
  }

  private compareToBenchmark(state: ProjectState, analysis: CommercialAnalysis): Partial<Prediction> | null {
    const benchmark = BENCHMARKS_WEST_AFRICA_SHOPPING_CENTER.find(
      b => b.metric === 'rent_per_sqm_month'
    );

    if (!benchmark || state.currentMetrics.surfaceLouee === 0) return null;

    // Calculer le loyer moyen actuel
    const loyerMoyenActuel = state.currentMetrics.revenuPrevisionnel /
      (state.currentMetrics.surfaceLouee * 12);

    const ecartPct = ((loyerMoyenActuel - benchmark.value) / benchmark.value) * 100;

    if (Math.abs(ecartPct) < 10) return null;

    const isBelow = ecartPct < 0;

    return {
      type: 'revenue',
      title: isBelow
        ? `Loyers ${Math.abs(ecartPct).toFixed(0)}% sous le benchmark`
        : `Loyers ${ecartPct.toFixed(0)}% au-dessus du benchmark`,
      description: `Loyer moyen: ${Math.round(loyerMoyenActuel).toLocaleString()} FCFA/m²/mois vs benchmark ${benchmark.value.toLocaleString()} FCFA.`,
      probability: 60,
      impact: isBelow && Math.abs(ecartPct) > 20 ? 'high' : 'medium',
      confidence: {
        value: 60,
        level: 'medium',
        factors: [`Comparaison avec ${benchmark.sampleSize} projets similaires`],
        dataQuality: 65,
      },
      timeHorizon: '180d',
      triggerConditions: [
        `Loyer moyen: ${Math.round(loyerMoyenActuel).toLocaleString()} FCFA`,
        `Benchmark: ${benchmark.value.toLocaleString()} FCFA`,
      ],
      mitigationActions: isBelow ? [{
        id: 'rent-review',
        action: 'Réviser la grille tarifaire',
        rationale: `Loyers ${Math.abs(ecartPct).toFixed(0)}% sous marché`,
        expectedOutcome: 'Alignement sur le benchmark',
        costOfInaction: `Manque à gagner: ${this.formatAmount(state.currentMetrics.surfaceLouee * (benchmark.value - loyerMoyenActuel) * 12)}/an`,
        priority: 'P2',
        effort: 'medium',
        confidence: { value: 55, level: 'medium', factors: [], dataQuality: 60 },
        targetModule: 'commercialisation',
        tags: ['revenus', 'benchmark'],
      }] : [],
      trend: 'stable',
      sourceModule: 'commercialisation',
    };
  }

  private calculateConfidence(state: ProjectState, analysis: CommercialAnalysis): ConfidenceScore {
    let score = 60;

    // Plus de baux signés = plus de confiance
    if (analysis.signedLeases >= analysis.totalUnits * 0.5) score += 15;
    else if (analysis.signedLeases >= analysis.totalUnits * 0.3) score += 8;

    // Ancre signé = plus de confiance
    if (analysis.anchorSigned) score += 10;

    // Historique
    if (state.historicalMetrics.length >= 30) score += 10;

    score = Math.min(90, score);

    return {
      value: score,
      level: getConfidenceLevel(score),
      factors: [
        `${analysis.signedLeases}/${analysis.totalUnits} baux signés`,
        analysis.anchorSigned ? 'Ancre signé' : 'Ancre non signé',
      ],
      dataQuality: Math.min(85, 50 + analysis.signedLeases * 2),
    };
  }

  private calculateRevenueShortfall(state: ProjectState, shortfallPct: number): number {
    const surfaceTotale = state.currentMetrics.surfaceTotale;
    const surfaceManquante = surfaceTotale * (shortfallPct / 100);
    return surfaceManquante * LOYER_MOYEN_M2_MOIS * 12;
  }

  private generateCommercialMitigations(shortfall: number): any[] {
    const actions = [];

    if (shortfall > 15) {
      actions.push({
        id: 'commercial-blitz',
        action: 'Campagne commerciale intensive',
        rationale: `Combler ${shortfall.toFixed(0)} points d'occupation`,
        expectedOutcome: `Gain de ${Math.min(shortfall, 10).toFixed(0)} points en 60 jours`,
        costOfInaction: 'Manque à gagner croissant',
        priority: 'P0',
        effort: 'high',
        confidence: { value: 70, level: 'high', factors: [], dataQuality: 75 },
        targetModule: 'commercialisation',
        tags: ['commercial', 'intensification'],
      });
    }

    actions.push({
      id: 'incentives',
      action: 'Proposer des incitations temporaires',
      rationale: 'Accélérer les signatures',
      expectedOutcome: 'Augmentation du taux de conversion',
      costOfInaction: 'Cycle de négociation plus long',
      priority: shortfall > 20 ? 'P1' : 'P2',
      effort: 'medium',
      confidence: { value: 65, level: 'medium', factors: [], dataQuality: 70 },
      targetModule: 'commercialisation',
      tags: ['commercial', 'incitations'],
    });

    return actions;
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

export default RevenuePredictor;
