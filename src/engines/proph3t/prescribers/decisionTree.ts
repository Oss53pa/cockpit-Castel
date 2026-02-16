// ============================================================================
// PROPH3T ENGINE V2 — ARBRE DE DÉCISION
// ============================================================================
// Logique de décision contextuelle pour recommandations intelligentes
// ============================================================================

import type {
  PrescriptiveAction,
  Prediction,
  ProjectState,
  ConfidenceScore,
} from '../core/types';
import { getConfidenceLevel } from '../core/constants';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface DecisionNode {
  id: string;
  condition: (context: DecisionContext) => boolean;
  trueNode?: DecisionNode | DecisionLeaf;
  falseNode?: DecisionNode | DecisionLeaf;
}

export interface DecisionLeaf {
  id: string;
  actionTemplate: ActionTemplate;
}

export interface ActionTemplate {
  action: string;
  rationale: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  effort: 'low' | 'medium' | 'high';
  targetModule: string;
  tags: string[];
  dynamicFields?: (context: DecisionContext) => Partial<PrescriptiveAction>;
}

export interface DecisionContext {
  prediction: Prediction;
  state: ProjectState;
  historicalPredictions?: Prediction[];
  recentActions?: PrescriptiveAction[];
}

export interface DecisionPath {
  nodes: string[];
  leaf: string;
  confidence: number;
}

// ============================================================================
// ARBRES DE DÉCISION PRÉDÉFINIS
// ============================================================================

const BUDGET_OVERRUN_TREE: DecisionNode = {
  id: 'budget-root',
  condition: (ctx) => {
    const overrunPct = extractOverrunPercentage(ctx.prediction);
    return overrunPct > 15;
  },
  trueNode: {
    id: 'budget-critical',
    condition: (ctx) => ctx.state.currentMetrics.avancementGlobal < 50,
    trueNode: {
      id: 'budget-critical-early',
      actionTemplate: {
        action: 'Audit budgétaire d\'urgence et gel des engagements non critiques',
        rationale: 'Dépassement critique détecté tôt - opportunité de correction',
        priority: 'P0',
        effort: 'high',
        targetModule: 'budget',
        tags: ['budget', 'urgence', 'audit'],
        dynamicFields: (ctx) => ({
          expectedOutcome: `Réduction du dépassement de ${Math.round(extractOverrunPercentage(ctx.prediction) / 2)}%`,
          costOfInaction: `Dépassement final estimé: +${extractOverrunPercentage(ctx.prediction)}%`,
        }),
      },
    },
    falseNode: {
      id: 'budget-critical-late',
      actionTemplate: {
        action: 'Négociation de réduction de scope ou budget additionnel',
        rationale: 'Dépassement avancé - correction limitée possible',
        priority: 'P0',
        effort: 'high',
        targetModule: 'budget',
        tags: ['budget', 'négociation', 'scope'],
        dynamicFields: (ctx) => ({
          expectedOutcome: 'Arbitrage scope/budget validé par la direction',
          costOfInaction: 'Budget hors contrôle',
        }),
      },
    },
  },
  falseNode: {
    id: 'budget-moderate',
    condition: (ctx) => extractOverrunPercentage(ctx.prediction) > 5,
    trueNode: {
      id: 'budget-moderate-action',
      actionTemplate: {
        action: 'Revue des engagements restants et optimisation',
        rationale: 'Dépassement modéré - correction possible sans mesures drastiques',
        priority: 'P1',
        effort: 'medium',
        targetModule: 'budget',
        tags: ['budget', 'optimisation'],
      },
    },
    falseNode: {
      id: 'budget-minor',
      actionTemplate: {
        action: 'Surveillance renforcée des indicateurs budgétaires',
        rationale: 'Légère dérive - monitoring suffisant',
        priority: 'P2',
        effort: 'low',
        targetModule: 'budget',
        tags: ['budget', 'monitoring'],
      },
    },
  },
};

const SCHEDULE_DELAY_TREE: DecisionNode = {
  id: 'schedule-root',
  condition: (ctx) => ctx.state.currentMetrics.joursRestants < 90,
  trueNode: {
    id: 'schedule-critical-window',
    condition: (ctx) => {
      const delay = extractDelayDays(ctx.prediction);
      return delay > 14;
    },
    trueNode: {
      id: 'schedule-red-zone',
      actionTemplate: {
        action: 'Plan de rattrapage d\'urgence avec ressources supplémentaires',
        rationale: 'Retard critique dans la dernière ligne droite',
        priority: 'P0',
        effort: 'high',
        targetModule: 'planning',
        tags: ['planning', 'urgence', 'rattrapage'],
        dynamicFields: (ctx) => ({
          expectedOutcome: `Récupération de ${Math.min(extractDelayDays(ctx.prediction), 10)} jours`,
          costOfInaction: 'Report de l\'ouverture quasi certain',
        }),
      },
    },
    falseNode: {
      id: 'schedule-warning-zone',
      actionTemplate: {
        action: 'Accélération ciblée sur chemin critique',
        rationale: 'Retard modéré mais fenêtre courte',
        priority: 'P1',
        effort: 'medium',
        targetModule: 'planning',
        tags: ['planning', 'accélération', 'critique'],
      },
    },
  },
  falseNode: {
    id: 'schedule-comfortable-window',
    condition: (ctx) => extractDelayDays(ctx.prediction) > 30,
    trueNode: {
      id: 'schedule-major-delay',
      actionTemplate: {
        action: 'Révision du macro-planning et replanification',
        rationale: 'Retard important mais temps disponible pour correction',
        priority: 'P1',
        effort: 'high',
        targetModule: 'planning',
        tags: ['planning', 'replanification'],
      },
    },
    falseNode: {
      id: 'schedule-minor-delay',
      actionTemplate: {
        action: 'Optimisation du séquencement des tâches',
        rationale: 'Retard limité - optimisation sans urgence',
        priority: 'P2',
        effort: 'medium',
        targetModule: 'planning',
        tags: ['planning', 'optimisation'],
      },
    },
  },
};

const OCCUPANCY_RISK_TREE: DecisionNode = {
  id: 'occupancy-root',
  condition: (ctx) => !ctx.state.anchorTenant?.signed,
  trueNode: {
    id: 'occupancy-no-anchor',
    condition: (ctx) => ctx.state.currentMetrics.joursRestants < 180,
    trueNode: {
      id: 'occupancy-anchor-critical',
      actionTemplate: {
        action: 'Focus absolu sur signature du locataire ancre',
        rationale: 'Ancre non signé à moins de 6 mois - situation critique',
        priority: 'P0',
        effort: 'high',
        targetModule: 'commercialisation',
        tags: ['commercial', 'ancre', 'urgence'],
        dynamicFields: (ctx) => ({
          expectedOutcome: 'Signature bail ancre sous 30 jours',
          costOfInaction: 'Ouverture sans ancre = échec commercial probable',
        }),
      },
    },
    falseNode: {
      id: 'occupancy-anchor-warning',
      actionTemplate: {
        action: 'Accélération négociation ancre + identification alternatives',
        rationale: 'Fenêtre de négociation encore disponible',
        priority: 'P1',
        effort: 'high',
        targetModule: 'commercialisation',
        tags: ['commercial', 'ancre'],
      },
    },
  },
  falseNode: {
    id: 'occupancy-anchor-ok',
    condition: (ctx) => ctx.state.currentMetrics.tauxOccupation < 60,
    trueNode: {
      id: 'occupancy-low-rate',
      actionTemplate: {
        action: 'Campagne commerciale intensive',
        rationale: 'Ancre signé mais occupation insuffisante',
        priority: 'P1',
        effort: 'high',
        targetModule: 'commercialisation',
        tags: ['commercial', 'campagne'],
      },
    },
    falseNode: {
      id: 'occupancy-acceptable',
      actionTemplate: {
        action: 'Maintenir le rythme de commercialisation',
        rationale: 'Situation commerciale sous contrôle',
        priority: 'P2',
        effort: 'medium',
        targetModule: 'commercialisation',
        tags: ['commercial', 'suivi'],
      },
    },
  },
};

const RISK_ESCALATION_TREE: DecisionNode = {
  id: 'risk-root',
  condition: (ctx) => ctx.prediction.probability > 70,
  trueNode: {
    id: 'risk-high-prob',
    condition: (ctx) => ctx.prediction.impact === 'critical',
    trueNode: {
      id: 'risk-critical',
      actionTemplate: {
        action: 'Escalade immédiate à la direction + plan de contingence',
        rationale: 'Risque à haute probabilité et impact critique',
        priority: 'P0',
        effort: 'high',
        targetModule: 'risques',
        tags: ['risque', 'escalade', 'contingence'],
      },
    },
    falseNode: {
      id: 'risk-high-prob-medium-impact',
      actionTemplate: {
        action: 'Plan de mitigation actif',
        rationale: 'Risque probable mais impact gérable',
        priority: 'P1',
        effort: 'medium',
        targetModule: 'risques',
        tags: ['risque', 'mitigation'],
      },
    },
  },
  falseNode: {
    id: 'risk-moderate-prob',
    condition: (ctx) => ctx.prediction.impact === 'critical',
    trueNode: {
      id: 'risk-low-prob-critical',
      actionTemplate: {
        action: 'Plan de contingence préparé (mode veille)',
        rationale: 'Impact critique mais probabilité modérée - préparation',
        priority: 'P2',
        effort: 'low',
        targetModule: 'risques',
        tags: ['risque', 'contingence', 'veille'],
      },
    },
    falseNode: {
      id: 'risk-low',
      actionTemplate: {
        action: 'Surveillance standard',
        rationale: 'Risque acceptable - monitoring',
        priority: 'P3',
        effort: 'low',
        targetModule: 'risques',
        tags: ['risque', 'monitoring'],
      },
    },
  },
};

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class DecisionTree {
  private trees: Map<string, DecisionNode> = new Map([
    ['cost', BUDGET_OVERRUN_TREE],
    ['schedule', SCHEDULE_DELAY_TREE],
    ['revenue', OCCUPANCY_RISK_TREE],
    ['risk', RISK_ESCALATION_TREE],
  ]);

  /**
   * Évalue une prédiction et retourne l'action recommandée
   */
  public evaluate(context: DecisionContext): PrescriptiveAction | null {
    const tree = this.trees.get(context.prediction.type);
    if (!tree) return null;

    const { leaf, path } = this.traverse(tree, context);
    if (!leaf) return null;

    return this.buildAction(leaf.actionTemplate, context, path);
  }

  /**
   * Évalue plusieurs prédictions
   */
  public evaluateMany(
    predictions: Prediction[],
    state: ProjectState
  ): PrescriptiveAction[] {
    const actions: PrescriptiveAction[] = [];

    for (const prediction of predictions) {
      const context: DecisionContext = { prediction, state };
      const action = this.evaluate(context);
      if (action) {
        actions.push(action);
      }
    }

    return this.deduplicateActions(actions);
  }

  /**
   * Retourne le chemin de décision pour debug/explication
   */
  public getDecisionPath(context: DecisionContext): DecisionPath | null {
    const tree = this.trees.get(context.prediction.type);
    if (!tree) return null;

    const { path, confidence } = this.traverse(tree, context);
    const leafId = path[path.length - 1];

    return {
      nodes: path.slice(0, -1),
      leaf: leafId,
      confidence,
    };
  }

  /**
   * Ajoute ou remplace un arbre de décision
   */
  public registerTree(type: string, tree: DecisionNode): void {
    this.trees.set(type, tree);
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private traverse(
    node: DecisionNode | DecisionLeaf,
    context: DecisionContext,
    path: string[] = [],
    confidence = 100
  ): { leaf: DecisionLeaf | null; path: string[]; confidence: number } {
    path.push(node.id);

    // Si c'est une feuille
    if ('actionTemplate' in node) {
      return { leaf: node, path, confidence };
    }

    // Évaluer la condition
    try {
      const result = node.condition(context);
      // Réduire légèrement la confiance à chaque branchement
      const nextConfidence = confidence * 0.95;

      if (result && node.trueNode) {
        return this.traverse(node.trueNode, context, path, nextConfidence);
      } else if (!result && node.falseNode) {
        return this.traverse(node.falseNode, context, path, nextConfidence);
      }
    } catch (error) {
      logger.warn(`Decision tree condition error at ${node.id}:`, error);
    }

    return { leaf: null, path, confidence: 0 };
  }

  private buildAction(
    template: ActionTemplate,
    context: DecisionContext,
    path: string[]
  ): PrescriptiveAction {
    const dynamicFields = template.dynamicFields?.(context) ?? {};

    const confidence: ConfidenceScore = {
      value: 75,
      level: 'high',
      factors: [
        `Chemin de décision: ${path.join(' → ')}`,
        `Basé sur: ${context.prediction.title}`,
      ],
      dataQuality: context.prediction.confidence?.dataQuality ?? 70,
    };

    return {
      id: `action-${context.prediction.type}-${Date.now()}`,
      action: template.action,
      rationale: template.rationale,
      expectedOutcome: dynamicFields.expectedOutcome ?? 'Amélioration de la situation',
      costOfInaction: dynamicFields.costOfInaction ?? 'Risque de dégradation',
      priority: template.priority,
      effort: template.effort,
      confidence,
      targetModule: template.targetModule,
      tags: template.tags,
    };
  }

  private deduplicateActions(actions: PrescriptiveAction[]): PrescriptiveAction[] {
    const seen = new Map<string, PrescriptiveAction>();

    for (const action of actions) {
      const key = `${action.targetModule}-${action.action}`;
      const existing = seen.get(key);

      if (!existing) {
        seen.set(key, action);
      } else {
        // Garder la priorité la plus haute
        const priorities = ['P0', 'P1', 'P2', 'P3'];
        if (priorities.indexOf(action.priority) < priorities.indexOf(existing.priority)) {
          seen.set(key, action);
        }
      }
    }

    return Array.from(seen.values());
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function extractOverrunPercentage(prediction: Prediction): number {
  const match = prediction.title.match(/[+]?(\d+(?:[.,]\d+)?)\s*%/);
  return match ? parseFloat(match[1].replace(',', '.')) : 0;
}

function extractDelayDays(prediction: Prediction): number {
  const match = prediction.title.match(/(\d+)\s*jours?/i);
  return match ? parseInt(match[1], 10) : 0;
}

// ============================================================================
// EXPORT
// ============================================================================

export default DecisionTree;
