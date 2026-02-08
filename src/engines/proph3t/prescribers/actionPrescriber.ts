// ============================================================================
// PROPH3T ENGINE V2 — PRESCRIPTEUR D'ACTIONS
// ============================================================================
// Orchestrateur des recommandations prescriptives
// ============================================================================

import type {
  PrescriptiveAction,
  Prediction,
  ProjectState,
  Anomaly,
  CascadeEffect,
  SimulationResult,
  ConfidenceScore,
} from '../core/types';
import { getConfidenceLevel } from '../core/constants';
import { PriorityMatrix, type PrioritizedAction } from './priorityMatrix';
import { DecisionTree, type DecisionContext } from './decisionTree';

// ============================================================================
// TYPES
// ============================================================================

export interface PrescriptionInput {
  predictions: Prediction[];
  anomalies: Anomaly[];
  cascades: CascadeEffect[];
  simulations?: SimulationResult[];
  state: ProjectState;
}

export interface PrescriptionOutput {
  actions: PrioritizedAction[];
  summary: PrescriptionSummary;
  urgentActions: PrioritizedAction[];
  byModule: Record<string, PrioritizedAction[]>;
  generatedAt: Date;
}

export interface PrescriptionSummary {
  totalActions: number;
  byPriority: { P0: number; P1: number; P2: number; P3: number };
  topModules: { module: string; count: number }[];
  estimatedEffort: { low: number; medium: number; high: number };
  overallRiskScore: number;
  recommendedFocus: string;
}

export interface ActionContext {
  source: 'prediction' | 'anomaly' | 'cascade' | 'simulation';
  sourceId: string;
  additionalData?: Record<string, unknown>;
}

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class ActionPrescriber {
  private priorityMatrix: PriorityMatrix;
  private decisionTree: DecisionTree;

  constructor() {
    this.priorityMatrix = new PriorityMatrix();
    this.decisionTree = new DecisionTree();
  }

  /**
   * Génère toutes les actions prescriptives
   */
  public prescribe(input: PrescriptionInput): PrescriptionOutput {
    const allActions: PrescriptiveAction[] = [];

    // 1. Actions depuis les prédictions (via arbre de décision)
    const predictionActions = this.prescribeFromPredictions(
      input.predictions,
      input.state
    );
    allActions.push(...predictionActions);

    // 2. Actions depuis les anomalies
    const anomalyActions = this.prescribeFromAnomalies(
      input.anomalies,
      input.state
    );
    allActions.push(...anomalyActions);

    // 3. Actions depuis les cascades
    const cascadeActions = this.prescribeFromCascades(
      input.cascades,
      input.state
    );
    allActions.push(...cascadeActions);

    // 4. Actions depuis les simulations (si présentes)
    if (input.simulations) {
      const simulationActions = this.prescribeFromSimulations(
        input.simulations,
        input.state
      );
      allActions.push(...simulationActions);
    }

    // 5. Dédupliquer et fusionner les actions similaires
    const dedupedActions = this.deduplicateAndMerge(allActions);

    // 6. Prioriser via la matrice Eisenhower
    const prioritizedActions = this.priorityMatrix.prioritize(dedupedActions);

    // 7. Générer le résumé
    const summary = this.generateSummary(prioritizedActions, input);

    // 8. Grouper par module
    const byModule = this.groupByModule(prioritizedActions);

    return {
      actions: prioritizedActions,
      summary,
      urgentActions: prioritizedActions.filter(a =>
        a.priority === 'P0' || a.priority === 'P1'
      ),
      byModule,
      generatedAt: new Date(),
    };
  }

  /**
   * Prescrit une action unique pour une situation donnée
   */
  public prescribeSingle(
    prediction: Prediction,
    state: ProjectState
  ): PrioritizedAction | null {
    const context: DecisionContext = { prediction, state };
    const action = this.decisionTree.evaluate(context);

    if (!action) return null;

    const [prioritized] = this.priorityMatrix.prioritize([action]);
    return prioritized;
  }

  /**
   * Met à jour les priorités suite à un changement de contexte
   */
  public reprioritize(
    actions: PrescriptiveAction[],
    newState: ProjectState
  ): PrioritizedAction[] {
    // Réappliquer la matrice de priorité avec le nouvel état
    return this.priorityMatrix.prioritize(actions);
  }

  // ============================================================================
  // MÉTHODES DE PRESCRIPTION PAR SOURCE
  // ============================================================================

  private prescribeFromPredictions(
    predictions: Prediction[],
    state: ProjectState
  ): PrescriptiveAction[] {
    const actions: PrescriptiveAction[] = [];

    for (const prediction of predictions) {
      // Utiliser l'arbre de décision
      const context: DecisionContext = { prediction, state };
      const treeAction = this.decisionTree.evaluate(context);

      if (treeAction) {
        actions.push({
          ...treeAction,
          tags: [...(treeAction.tags || []), 'from-prediction'],
        });
      }

      // Ajouter les actions de mitigation de la prédiction elle-même
      if (prediction.mitigationActions) {
        for (const mitigation of prediction.mitigationActions) {
          actions.push({
            ...mitigation,
            tags: [...(mitigation.tags || []), 'mitigation', 'from-prediction'],
          });
        }
      }
    }

    return actions;
  }

  private prescribeFromAnomalies(
    anomalies: Anomaly[],
    state: ProjectState
  ): PrescriptiveAction[] {
    const actions: PrescriptiveAction[] = [];

    for (const anomaly of anomalies) {
      // Déterminer la priorité selon la sévérité
      let priority: 'P0' | 'P1' | 'P2' | 'P3' = 'P2';
      if (anomaly.severity === 'critical') priority = 'P0';
      else if (anomaly.severity === 'high') priority = 'P1';
      else if (anomaly.severity === 'low') priority = 'P3';

      // Action pour l'anomalie
      actions.push({
        id: `anomaly-action-${anomaly.id}`,
        action: `Investiguer l'anomalie: ${anomaly.metric}`,
        rationale: `${anomaly.description}. ${anomaly.possibleCauses[0] || 'Cause à déterminer'}`,
        expectedOutcome: 'Identification et correction de la cause racine',
        costOfInaction: anomaly.isEscalating
          ? 'Risque d\'aggravation si non traité'
          : 'Anomalie persistante',
        priority,
        effort: anomaly.severity === 'critical' ? 'high' : 'medium',
        confidence: {
          value: 70,
          level: 'high',
          factors: [`Détecté par: ${anomaly.detectionMethod}`],
          dataQuality: 75,
        },
        targetModule: this.inferModuleFromMetric(anomaly.metric),
        tags: ['anomalie', anomaly.severity, anomaly.isEscalating ? 'escalade' : 'stable'],
      });

      // Actions prescrites par le détecteur
      if (anomaly.prescribedActions) {
        for (const prescribed of anomaly.prescribedActions) {
          actions.push({
            ...prescribed,
            tags: [...(prescribed.tags || []), 'from-anomaly'],
          });
        }
      }
    }

    return actions;
  }

  private prescribeFromCascades(
    cascades: CascadeEffect[],
    state: ProjectState
  ): PrescriptiveAction[] {
    const actions: PrescriptiveAction[] = [];

    // Grouper les cascades par module source
    const cascadesBySource = new Map<string, CascadeEffect[]>();
    for (const cascade of cascades) {
      const existing = cascadesBySource.get(cascade.sourceModule) || [];
      existing.push(cascade);
      cascadesBySource.set(cascade.sourceModule, existing);
    }

    for (const [sourceModule, moduleCascades] of cascadesBySource) {
      // Calculer l'impact total
      const totalImpact = moduleCascades.reduce(
        (sum, c) => sum + c.propagatedImpact,
        0
      );
      const avgImpact = totalImpact / moduleCascades.length;

      // Déterminer la priorité
      let priority: 'P0' | 'P1' | 'P2' | 'P3' = 'P2';
      if (avgImpact > 50) priority = 'P0';
      else if (avgImpact > 30) priority = 'P1';
      else if (avgImpact < 15) priority = 'P3';

      actions.push({
        id: `cascade-action-${sourceModule}-${Date.now()}`,
        action: `Contenir les effets cascade depuis ${sourceModule}`,
        rationale: `${moduleCascades.length} effets cascade détectés avec impact moyen de ${avgImpact.toFixed(0)}%`,
        expectedOutcome: 'Isolation des impacts et stabilisation',
        costOfInaction: `Propagation vers ${new Set(moduleCascades.map(c => c.targetModule)).size} modules`,
        priority,
        effort: avgImpact > 40 ? 'high' : 'medium',
        confidence: {
          value: 80,
          level: 'high',
          factors: ['Analyse de corrélation cross-module'],
          dataQuality: 75,
        },
        targetModule: sourceModule,
        tags: ['cascade', 'cross-module', 'propagation'],
      });
    }

    return actions;
  }

  private prescribeFromSimulations(
    simulations: SimulationResult[],
    state: ProjectState
  ): PrescriptiveAction[] {
    const actions: PrescriptiveAction[] = [];

    for (const simulation of simulations) {
      // Ne prescrire que pour les simulations à risque élevé
      if (simulation.riskScore < 60) continue;

      // Vérifier si les mitigations proposées sont suffisantes
      const mitigationsExist = simulation.recommendations &&
        simulation.recommendations.length > 0;

      if (mitigationsExist) {
        // Ajouter les recommandations de la simulation
        for (const rec of simulation.recommendations!) {
          actions.push({
            ...rec,
            tags: [...(rec.tags || []), 'from-simulation', simulation.scenario.id],
          });
        }
      } else {
        // Créer une action générique
        actions.push({
          id: `simulation-action-${simulation.scenario.id}-${Date.now()}`,
          action: `Préparer un plan de contingence pour: ${simulation.scenario.name}`,
          rationale: simulation.narrative,
          expectedOutcome: 'Plan de contingence validé et prêt',
          costOfInaction: `Risque matérialisé: score ${simulation.riskScore}/100`,
          priority: simulation.riskScore > 80 ? 'P1' : 'P2',
          effort: 'medium',
          confidence: simulation.confidence,
          targetModule: 'risques',
          tags: ['contingence', 'simulation', simulation.scenario.category],
        });
      }
    }

    return actions;
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  private deduplicateAndMerge(actions: PrescriptiveAction[]): PrescriptiveAction[] {
    const actionMap = new Map<string, PrescriptiveAction>();

    for (const action of actions) {
      // Créer une clé de similarité
      const key = this.createSimilarityKey(action);
      const existing = actionMap.get(key);

      if (!existing) {
        actionMap.set(key, action);
      } else {
        // Fusionner: garder la priorité la plus haute
        const merged = this.mergeActions(existing, action);
        actionMap.set(key, merged);
      }
    }

    return Array.from(actionMap.values());
  }

  private createSimilarityKey(action: PrescriptiveAction): string {
    // Normaliser l'action pour trouver les doublons
    const normalizedAction = action.action
      .toLowerCase()
      .replace(/\d+/g, 'N') // Remplacer les nombres
      .replace(/\s+/g, ' ')
      .trim();

    return `${action.targetModule}:${normalizedAction}`;
  }

  private mergeActions(
    existing: PrescriptiveAction,
    incoming: PrescriptiveAction
  ): PrescriptiveAction {
    const priorities = ['P0', 'P1', 'P2', 'P3'];
    const higherPriority = priorities.indexOf(incoming.priority) <
      priorities.indexOf(existing.priority)
      ? incoming.priority
      : existing.priority;

    // Fusionner les tags
    const mergedTags = [...new Set([
      ...(existing.tags || []),
      ...(incoming.tags || []),
    ])];

    // Prendre la confiance la plus haute
    const higherConfidence =
      (incoming.confidence?.value || 0) > (existing.confidence?.value || 0)
        ? incoming.confidence
        : existing.confidence;

    return {
      ...existing,
      priority: higherPriority,
      tags: mergedTags,
      confidence: higherConfidence,
      rationale: existing.rationale.length > incoming.rationale.length
        ? existing.rationale
        : incoming.rationale,
    };
  }

  private generateSummary(
    actions: PrioritizedAction[],
    input: PrescriptionInput
  ): PrescriptionSummary {
    const byPriority = { P0: 0, P1: 0, P2: 0, P3: 0 };
    const byModule = new Map<string, number>();
    const estimatedEffort = { low: 0, medium: 0, high: 0 };

    for (const action of actions) {
      byPriority[action.priority]++;
      estimatedEffort[action.effort]++;

      const moduleCount = byModule.get(action.targetModule) || 0;
      byModule.set(action.targetModule, moduleCount + 1);
    }

    // Top modules
    const topModules = Array.from(byModule.entries())
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Calculer le score de risque global
    const riskFactors = [
      (byPriority.P0 * 100) / Math.max(1, actions.length),
      (byPriority.P1 * 70) / Math.max(1, actions.length),
      input.anomalies.filter(a => a.severity === 'critical').length * 10,
      input.cascades.length * 5,
    ];
    const overallRiskScore = Math.min(100, Math.round(
      riskFactors.reduce((a, b) => a + b, 0)
    ));

    // Déterminer le focus recommandé
    let recommendedFocus = 'Suivi standard';
    if (byPriority.P0 > 0) {
      recommendedFocus = `Priorité absolue: ${byPriority.P0} action(s) P0`;
    } else if (byPriority.P1 > 2) {
      recommendedFocus = `Attention requise: ${byPriority.P1} actions P1`;
    } else if (topModules.length > 0) {
      recommendedFocus = `Focus sur: ${topModules[0].module}`;
    }

    return {
      totalActions: actions.length,
      byPriority,
      topModules,
      estimatedEffort,
      overallRiskScore,
      recommendedFocus,
    };
  }

  private groupByModule(
    actions: PrioritizedAction[]
  ): Record<string, PrioritizedAction[]> {
    const groups: Record<string, PrioritizedAction[]> = {};

    for (const action of actions) {
      if (!groups[action.targetModule]) {
        groups[action.targetModule] = [];
      }
      groups[action.targetModule].push(action);
    }

    // Trier chaque groupe par rang
    for (const module of Object.keys(groups)) {
      groups[module].sort((a, b) => a.rank - b.rank);
    }

    return groups;
  }

  private inferModuleFromMetric(metric: string): string {
    const metricLower = metric.toLowerCase();

    if (metricLower.includes('budget') || metricLower.includes('cout') ||
        metricLower.includes('cost') || metricLower.includes('depense')) {
      return 'budget';
    }
    if (metricLower.includes('occupation') || metricLower.includes('commercial') ||
        metricLower.includes('loyer') || metricLower.includes('bail')) {
      return 'commercialisation';
    }
    if (metricLower.includes('retard') || metricLower.includes('planning') ||
        metricLower.includes('jalon') || metricLower.includes('action')) {
      return 'planning';
    }
    if (metricLower.includes('risque') || metricLower.includes('risk')) {
      return 'risques';
    }

    return 'général';
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default ActionPrescriber;
