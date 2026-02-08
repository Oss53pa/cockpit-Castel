// ============================================================================
// PROPH3T ENGINE V2 — DÉTECTEUR D'ANOMALIES
// ============================================================================
// Détection d'anomalies avec seuils dynamiques (IQR, Z-score modifié)
// ============================================================================

import type {
  Anomaly,
  AnomalySeverity,
  ConfidenceScore,
  ProjectMetrics,
  ProjectModule,
  PrescriptiveAction,
} from '../core/types';
import {
  ANOMALY_CONFIG,
  getConfidenceLevel,
  METRIC_LABELS,
  MODULE_LABELS,
} from '../core/constants';

// ============================================================================
// TYPES INTERNES
// ============================================================================

interface MetricDefinition {
  key: keyof ProjectMetrics;
  module: ProjectModule;
  label: string;
  unit: string;
  higherIsBetter: boolean;
  criticalThreshold?: { min?: number; max?: number };
}

interface ThresholdResult {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  method: 'dynamic' | 'fallback';
  dataPoints: number;
}

interface OutlierResult {
  isOutlier: boolean;
  deviation: number;
  direction: 'above' | 'below' | 'normal';
  zScore: number;
}

// ============================================================================
// DÉFINITIONS DES MÉTRIQUES À SURVEILLER
// ============================================================================

const MONITORED_METRICS: MetricDefinition[] = [
  // Budget
  {
    key: 'tauxEngagement',
    module: 'budget',
    label: 'Taux d\'engagement',
    unit: '%',
    higherIsBetter: true,
  },
  {
    key: 'tauxRealisation',
    module: 'budget',
    label: 'Taux de réalisation',
    unit: '%',
    higherIsBetter: true,
  },

  // Planning
  {
    key: 'avancementGlobal',
    module: 'planning',
    label: 'Avancement global',
    unit: '%',
    higherIsBetter: true,
  },
  {
    key: 'actionsEnRetard',
    module: 'planning',
    label: 'Actions en retard',
    unit: 'actions',
    higherIsBetter: false,
    criticalThreshold: { max: 10 },
  },
  {
    key: 'actionsCritiques',
    module: 'planning',
    label: 'Actions critiques',
    unit: 'actions',
    higherIsBetter: false,
    criticalThreshold: { max: 5 },
  },

  // Commercial
  {
    key: 'tauxOccupation',
    module: 'commercialisation',
    label: 'Taux d\'occupation',
    unit: '%',
    higherIsBetter: true,
  },

  // Technique
  {
    key: 'avancementConstruction',
    module: 'construction',
    label: 'Avancement construction',
    unit: '%',
    higherIsBetter: true,
  },
  {
    key: 'avancementMobilisation',
    module: 'commercialisation',
    label: 'Avancement mobilisation',
    unit: '%',
    higherIsBetter: true,
  },
  {
    key: 'ecartSync',
    module: 'technique',
    label: 'Écart synchronisation',
    unit: 'points',
    higherIsBetter: false, // Plus proche de 0 = mieux
    criticalThreshold: { min: -20, max: 20 },
  },

  // RH
  {
    key: 'tauxRecrutement',
    module: 'rh',
    label: 'Taux de recrutement',
    unit: '%',
    higherIsBetter: true,
  },

  // Risques
  {
    key: 'risquesCritiques',
    module: 'technique',
    label: 'Risques critiques',
    unit: 'risques',
    higherIsBetter: false,
    criticalThreshold: { max: 3 },
  },
  {
    key: 'scoreRisqueMoyen',
    module: 'technique',
    label: 'Score risque moyen',
    unit: 'points',
    higherIsBetter: false,
    criticalThreshold: { max: 70 },
  },
];

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class AnomalyDetector {
  private previousAnomalies: Anomaly[] = [];

  constructor(previousAnomalies: Anomaly[] = []) {
    this.previousAnomalies = previousAnomalies;
  }

  // ==========================================================================
  // POINT D'ENTRÉE PRINCIPAL
  // ==========================================================================

  /**
   * Détecte les anomalies dans les métriques actuelles
   */
  public detectAnomalies(
    currentMetrics: ProjectMetrics,
    historicalMetrics: ProjectMetrics[],
    moduleFilter?: ProjectModule | 'all'
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const now = new Date();

    // Filtrer les métriques par module si spécifié
    const metricsToCheck = moduleFilter && moduleFilter !== 'all'
      ? MONITORED_METRICS.filter(m => m.module === moduleFilter)
      : MONITORED_METRICS;

    for (const metricDef of metricsToCheck) {
      const currentValue = currentMetrics[metricDef.key] as number;

      // Extraire l'historique pour cette métrique
      const historicalValues = historicalMetrics
        .map(m => m[metricDef.key] as number)
        .filter(v => v !== undefined && v !== null && !isNaN(v));

      // Calculer les seuils dynamiques
      const thresholds = this.calculateDynamicThresholds(
        historicalValues,
        metricDef.key
      );

      // Détecter si c'est un outlier
      const outlierResult = this.detectOutlier(
        currentValue,
        historicalValues,
        thresholds
      );

      if (outlierResult.isOutlier) {
        // Déterminer la sévérité
        const severity = this.determineSeverity(
          outlierResult,
          metricDef,
          currentValue
        );

        // Générer les causes possibles
        const possibleCauses = this.generatePossibleCauses(
          metricDef,
          outlierResult,
          currentValue
        );

        // Générer les actions suggérées
        const suggestedActions = this.generateSuggestedActions(
          metricDef,
          outlierResult,
          severity
        );

        // Calculer le score de confiance
        const confidence = this.calculateConfidence(
          thresholds,
          outlierResult,
          historicalValues.length
        );

        // Créer l'anomalie
        const anomaly: Anomaly = {
          id: `anomaly-${metricDef.key}-${now.getTime()}`,
          module: metricDef.module,
          metric: metricDef.key,
          metricLabel: metricDef.label,
          currentValue,
          expectedRange: { min: thresholds.min, max: thresholds.max },
          deviation: outlierResult.deviation,
          severity,
          confidence,
          possibleCauses,
          suggestedActions,
          detectedAt: now,
          isNew: true,
          persistenceDays: 0,
        };

        // Classifier l'anomalie (nouvelle vs persistante)
        const classifiedAnomaly = this.classifyAnomaly(anomaly);
        anomalies.push(classifiedAnomaly);
      }
    }

    // Mettre à jour la liste des anomalies précédentes
    this.previousAnomalies = anomalies;

    return anomalies;
  }

  // ==========================================================================
  // CALCUL DES SEUILS DYNAMIQUES
  // ==========================================================================

  /**
   * Calcule les seuils dynamiques basés sur la moyenne mobile + écart-type
   */
  private calculateDynamicThresholds(
    dataPoints: number[],
    metricKey: string
  ): ThresholdResult {
    const minPoints = ANOMALY_CONFIG.detection.minDataPoints;

    // Si pas assez de données, utiliser les seuils fallback
    if (dataPoints.length < minPoints) {
      const fallback = ANOMALY_CONFIG.fallbackThresholds[
        metricKey as keyof typeof ANOMALY_CONFIG.fallbackThresholds
      ];

      if (fallback) {
        return {
          min: fallback.min,
          max: fallback.max,
          mean: (fallback.min + fallback.max) / 2,
          stdDev: (fallback.max - fallback.min) / 4,
          method: 'fallback',
          dataPoints: dataPoints.length,
        };
      }

      // Fallback générique si pas de config
      const mean = dataPoints.length > 0
        ? dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length
        : 50;
      return {
        min: mean * 0.5,
        max: mean * 1.5,
        mean,
        stdDev: mean * 0.25,
        method: 'fallback',
        dataPoints: dataPoints.length,
      };
    }

    // Calculer la moyenne mobile
    const windowSize = Math.min(
      ANOMALY_CONFIG.detection.movingAverageWindow,
      dataPoints.length
    );
    const recentData = dataPoints.slice(-windowSize);
    const mean = recentData.reduce((a, b) => a + b, 0) / recentData.length;

    // Calculer l'écart-type
    const squaredDiffs = recentData.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / recentData.length;
    const stdDev = Math.sqrt(variance);

    // Seuils = moyenne ± 2 écarts-types (ou min 2 écarts-types si stdDev faible)
    const margin = Math.max(stdDev * 2, mean * 0.1);

    return {
      min: mean - margin,
      max: mean + margin,
      mean,
      stdDev,
      method: 'dynamic',
      dataPoints: dataPoints.length,
    };
  }

  // ==========================================================================
  // DÉTECTION D'OUTLIERS
  // ==========================================================================

  /**
   * Détecte si une valeur est un outlier en utilisant IQR et Z-score modifié
   */
  private detectOutlier(
    value: number,
    historicalValues: number[],
    thresholds: ThresholdResult
  ): OutlierResult {
    // Méthode 1: Simple comparaison aux seuils
    const isOutsideRange = value < thresholds.min || value > thresholds.max;

    // Méthode 2: IQR (si assez de données)
    let isIQROutlier = false;
    if (historicalValues.length >= ANOMALY_CONFIG.detection.minDataPoints) {
      isIQROutlier = this.detectByIQR(value, historicalValues);
    }

    // Méthode 3: Z-score modifié
    let zScore = 0;
    let isZScoreOutlier = false;
    if (historicalValues.length >= ANOMALY_CONFIG.detection.minDataPoints) {
      zScore = this.calculateModifiedZScore(value, historicalValues);
      isZScoreOutlier = Math.abs(zScore) > ANOMALY_CONFIG.detection.modifiedZScoreThreshold;
    }

    // Combiner les méthodes (2 sur 3 doivent confirmer)
    const methodsConfirming = [isOutsideRange, isIQROutlier, isZScoreOutlier]
      .filter(Boolean).length;
    const isOutlier = methodsConfirming >= 2 || (methodsConfirming === 1 && historicalValues.length < 5);

    // Calculer la déviation
    let deviation = 0;
    let direction: 'above' | 'below' | 'normal' = 'normal';

    if (value < thresholds.min) {
      deviation = ((thresholds.min - value) / thresholds.min) * 100;
      direction = 'below';
    } else if (value > thresholds.max) {
      deviation = ((value - thresholds.max) / thresholds.max) * 100;
      direction = 'above';
    }

    return {
      isOutlier,
      deviation: Math.round(deviation * 10) / 10,
      direction,
      zScore: Math.round(zScore * 100) / 100,
    };
  }

  /**
   * Détection par méthode IQR (Interquartile Range)
   */
  private detectByIQR(value: number, values: number[]): boolean {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);

    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    const multiplier = ANOMALY_CONFIG.detection.iqrMultiplier;
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    return value < lowerBound || value > upperBound;
  }

  /**
   * Calcule le Z-score modifié (robuste aux petits échantillons)
   * Utilise la médiane et le MAD (Median Absolute Deviation)
   */
  private calculateModifiedZScore(value: number, values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    // Médiane
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    // MAD (Median Absolute Deviation)
    const absoluteDeviations = values.map(v => Math.abs(v - median));
    const sortedDeviations = [...absoluteDeviations].sort((a, b) => a - b);
    const mad = n % 2 === 0
      ? (sortedDeviations[n / 2 - 1] + sortedDeviations[n / 2]) / 2
      : sortedDeviations[Math.floor(n / 2)];

    // Z-score modifié
    // Constante 0.6745 pour normaliser par rapport à l'écart-type
    if (mad === 0) return 0;
    return 0.6745 * (value - median) / mad;
  }

  // ==========================================================================
  // CLASSIFICATION ET SÉVÉRITÉ
  // ==========================================================================

  /**
   * Détermine la sévérité de l'anomalie
   */
  private determineSeverity(
    outlierResult: OutlierResult,
    metricDef: MetricDefinition,
    currentValue: number
  ): AnomalySeverity {
    // Vérifier d'abord les seuils critiques explicites
    if (metricDef.criticalThreshold) {
      const { min, max } = metricDef.criticalThreshold;
      if ((min !== undefined && currentValue < min) ||
          (max !== undefined && currentValue > max)) {
        return 'critical';
      }
    }

    // Basé sur la déviation
    const absDeviation = Math.abs(outlierResult.deviation);

    if (absDeviation > 50 || Math.abs(outlierResult.zScore) > 5) {
      return 'critical';
    }
    if (absDeviation > 25 || Math.abs(outlierResult.zScore) > 3.5) {
      return 'warning';
    }
    return 'info';
  }

  /**
   * Classifie l'anomalie (nouvelle vs persistante)
   */
  private classifyAnomaly(anomaly: Anomaly): Anomaly {
    // Chercher si cette anomalie existait déjà
    const previousAnomaly = this.previousAnomalies.find(
      a => a.metric === anomaly.metric && a.module === anomaly.module
    );

    if (previousAnomaly) {
      const daysSinceFirst = Math.floor(
        (anomaly.detectedAt.getTime() - previousAnomaly.detectedAt.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      // C'est une anomalie persistante
      anomaly.isNew = false;
      anomaly.persistenceDays = daysSinceFirst;
      anomaly.detectedAt = previousAnomaly.detectedAt; // Garder la date originale

      // Escalader la sévérité si elle persiste trop longtemps
      if (daysSinceFirst >= ANOMALY_CONFIG.persistence.escalationDays) {
        if (anomaly.severity === 'info') anomaly.severity = 'warning';
        else if (anomaly.severity === 'warning') anomaly.severity = 'critical';
      }
    }

    return anomaly;
  }

  // ==========================================================================
  // GÉNÉRATION DE CAUSES ET ACTIONS
  // ==========================================================================

  /**
   * Génère les causes possibles de l'anomalie
   */
  private generatePossibleCauses(
    metricDef: MetricDefinition,
    outlierResult: OutlierResult,
    currentValue: number
  ): string[] {
    const causes: string[] = [];
    const isBelow = outlierResult.direction === 'below';
    const isAbove = outlierResult.direction === 'above';

    switch (metricDef.key) {
      case 'tauxEngagement':
        if (isBelow) {
          causes.push('Retard dans les appels d\'offres ou validations');
          causes.push('Blocage budgétaire ou gel des dépenses');
          causes.push('Manque de ressources pour lancer les marchés');
        } else {
          causes.push('Accélération des engagements (rattrapage)');
          causes.push('Commandes anticipées non prévues');
        }
        break;

      case 'tauxRealisation':
        if (isBelow) {
          causes.push('Retard de facturation fournisseurs');
          causes.push('Litiges ou blocages de paiement');
          causes.push('Décalage entre engagement et réalisation');
        }
        break;

      case 'avancementGlobal':
        if (isBelow) {
          causes.push('Retard sur le chemin critique');
          causes.push('Ressources insuffisantes');
          causes.push('Problèmes techniques bloquants');
        }
        break;

      case 'actionsEnRetard':
        if (isAbove) {
          causes.push('Sous-estimation des durées initiales');
          causes.push('Dépendances non anticipées');
          causes.push('Manque de suivi ou de priorisation');
          causes.push('Surcharge des responsables');
        }
        break;

      case 'tauxOccupation':
        if (isBelow) {
          causes.push('Attractivité commerciale insuffisante');
          causes.push('Conditions de marché défavorables');
          causes.push('Concurrence sur le secteur');
          causes.push('Retard dans les négociations baux');
        }
        break;

      case 'ecartSync':
        if (Math.abs(currentValue) > 15) {
          causes.push('Désynchronisation construction vs commercialisation');
          if (currentValue > 0) {
            causes.push('Construction avance mais commercialisation en retard');
          } else {
            causes.push('Commercialisation avance mais construction en retard');
          }
        }
        break;

      case 'risquesCritiques':
        if (isAbove) {
          causes.push('Nouveaux risques identifiés non traités');
          causes.push('Escalade de risques existants');
          causes.push('Manque d\'actions de mitigation');
        }
        break;

      default:
        causes.push('Écart significatif par rapport à la tendance historique');
        causes.push('Vérifier les données sources');
    }

    return causes;
  }

  /**
   * Génère les actions suggérées pour résoudre l'anomalie
   */
  private generateSuggestedActions(
    metricDef: MetricDefinition,
    outlierResult: OutlierResult,
    severity: AnomalySeverity
  ): PrescriptiveAction[] {
    const actions: PrescriptiveAction[] = [];
    const isBelow = outlierResult.direction === 'below';
    const now = new Date();

    // Générer une action de base
    const baseAction: Partial<PrescriptiveAction> = {
      targetModule: metricDef.module,
      tags: ['anomalie', metricDef.key],
      confidence: {
        value: 70,
        level: 'high',
        factors: ['Basé sur les meilleures pratiques'],
        dataQuality: 80,
      },
    };

    switch (metricDef.key) {
      case 'tauxEngagement':
        if (isBelow) {
          actions.push({
            ...baseAction,
            id: `action-${metricDef.key}-1`,
            action: 'Organiser une réunion de déblocage des engagements',
            rationale: 'Un taux d\'engagement faible retarde les travaux et crée un effet boule de neige',
            expectedOutcome: 'Déblocage des marchés en attente, accélération des engagements',
            costOfInaction: 'Retard cumulé sur le planning, surcoûts potentiels',
            priority: severity === 'critical' ? 'P0' : 'P1',
            effort: 'medium',
            deadline: this.formatDeadline(now, severity === 'critical' ? 2 : 7),
          } as PrescriptiveAction);
        }
        break;

      case 'actionsEnRetard':
        actions.push({
          ...baseAction,
          id: `action-${metricDef.key}-1`,
          action: 'Analyser et reprioriser les actions en retard',
          rationale: `${outlierResult.deviation.toFixed(0)}% d'écart par rapport à la normale`,
          expectedOutcome: 'Réduction du nombre d\'actions en retard de 50% en 2 semaines',
          costOfInaction: 'Accumulation des retards, impact sur les jalons critiques',
          priority: severity === 'critical' ? 'P0' : 'P1',
          effort: 'medium',
          deadline: this.formatDeadline(now, 3),
        } as PrescriptiveAction);
        break;

      case 'tauxOccupation':
        if (isBelow) {
          actions.push({
            ...baseAction,
            id: `action-${metricDef.key}-1`,
            action: 'Intensifier les actions commerciales (prospection, offres)',
            rationale: 'Taux d\'occupation en dessous des attentes historiques',
            expectedOutcome: 'Signature de nouveaux baux, amélioration du taux',
            costOfInaction: 'Revenus réduits à l\'ouverture, viabilité commerciale menacée',
            priority: 'P1',
            effort: 'high',
            deadline: this.formatDeadline(now, 14),
          } as PrescriptiveAction);
        }
        break;

      case 'ecartSync':
        actions.push({
          ...baseAction,
          id: `action-${metricDef.key}-1`,
          action: 'Organiser un comité de synchronisation Construction/Commercial',
          rationale: 'Écart de synchronisation détecté, risque de désalignement',
          expectedOutcome: 'Plan de rattrapage validé, écart réduit sous 10%',
          costOfInaction: 'Locaux prêts sans locataires ou locataires sans locaux',
          priority: severity === 'critical' ? 'P0' : 'P1',
          effort: 'medium',
          deadline: this.formatDeadline(now, 5),
        } as PrescriptiveAction);
        break;

      case 'risquesCritiques':
        actions.push({
          ...baseAction,
          id: `action-${metricDef.key}-1`,
          action: 'Revue d\'urgence des risques critiques avec plan de mitigation',
          rationale: 'Nombre de risques critiques au-dessus du seuil acceptable',
          expectedOutcome: 'Chaque risque critique a un plan de mitigation actif',
          costOfInaction: 'Matérialisation probable des risques, impacts majeurs',
          priority: 'P0',
          effort: 'high',
          deadline: this.formatDeadline(now, 2),
        } as PrescriptiveAction);
        break;

      default:
        actions.push({
          ...baseAction,
          id: `action-${metricDef.key}-1`,
          action: `Investiguer l'anomalie sur ${metricDef.label}`,
          rationale: `Écart de ${outlierResult.deviation.toFixed(0)}% détecté`,
          expectedOutcome: 'Cause identifiée et plan de correction défini',
          costOfInaction: 'Risque de dégradation continue',
          priority: severity === 'critical' ? 'P1' : 'P2',
          effort: 'low',
          deadline: this.formatDeadline(now, severity === 'critical' ? 3 : 7),
        } as PrescriptiveAction);
    }

    return actions;
  }

  // ==========================================================================
  // CALCUL DE CONFIANCE
  // ==========================================================================

  /**
   * Calcule le score de confiance de l'anomalie détectée
   */
  private calculateConfidence(
    thresholds: ThresholdResult,
    outlierResult: OutlierResult,
    historicalDataPoints: number
  ): ConfidenceScore {
    let score = 50; // Base

    // Bonus si méthode dynamique (vs fallback)
    if (thresholds.method === 'dynamic') {
      score += 20;
    }

    // Bonus selon le nombre de points de données
    if (historicalDataPoints >= 30) score += 15;
    else if (historicalDataPoints >= 15) score += 10;
    else if (historicalDataPoints >= 7) score += 5;

    // Bonus si forte déviation (plus certain que c'est une anomalie)
    if (Math.abs(outlierResult.deviation) > 30) score += 10;
    else if (Math.abs(outlierResult.deviation) > 15) score += 5;

    // Bonus si Z-score élevé
    if (Math.abs(outlierResult.zScore) > 4) score += 10;
    else if (Math.abs(outlierResult.zScore) > 3) score += 5;

    // Plafonner à 100
    score = Math.min(100, score);

    const factors: string[] = [];
    if (thresholds.method === 'dynamic') {
      factors.push(`Seuils calculés sur ${thresholds.dataPoints} points`);
    } else {
      factors.push('Seuils de référence utilisés (données insuffisantes)');
    }
    factors.push(`Écart de ${outlierResult.deviation.toFixed(1)}%`);
    if (outlierResult.zScore !== 0) {
      factors.push(`Z-score modifié: ${outlierResult.zScore.toFixed(2)}`);
    }

    return {
      value: Math.round(score),
      level: getConfidenceLevel(score),
      factors,
      dataQuality: thresholds.method === 'dynamic'
        ? Math.min(100, historicalDataPoints * 3)
        : 40,
    };
  }

  // ==========================================================================
  // UTILITAIRES
  // ==========================================================================

  private formatDeadline(from: Date, daysToAdd: number): string {
    const deadline = new Date(from);
    deadline.setDate(deadline.getDate() + daysToAdd);
    return deadline.toISOString().split('T')[0];
  }

  /**
   * Retourne les anomalies filtrées par sévérité
   */
  public filterBySeverity(
    anomalies: Anomaly[],
    minSeverity: AnomalySeverity
  ): Anomaly[] {
    const severityOrder: AnomalySeverity[] = ['info', 'warning', 'critical'];
    const minIndex = severityOrder.indexOf(minSeverity);
    return anomalies.filter(
      a => severityOrder.indexOf(a.severity) >= minIndex
    );
  }

  /**
   * Retourne les nouvelles anomalies uniquement
   */
  public getNewAnomalies(anomalies: Anomaly[]): Anomaly[] {
    return anomalies.filter(a => a.isNew);
  }

  /**
   * Retourne les anomalies persistantes
   */
  public getPersistentAnomalies(anomalies: Anomaly[]): Anomaly[] {
    return anomalies.filter(
      a => !a.isNew && (a.persistenceDays || 0) >= ANOMALY_CONFIG.persistence.newThresholdDays
    );
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default AnomalyDetector;
