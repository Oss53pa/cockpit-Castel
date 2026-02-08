// ============================================================================
// PROPH3T ENGINE V2 — PATTERN STORE
// ============================================================================
// Stockage et reconnaissance de patterns pour apprentissage continu
// ============================================================================

import type { ConfidenceScore } from '../core/types';
import { getConfidenceLevel } from '../core/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface Pattern {
  id: string;
  name: string;
  description: string;
  signature: PatternSignature;
  frequency: number; // Nombre d'occurrences
  lastSeen: Date;
  firstSeen: Date;
  outcomes: PatternOutcome[];
  confidence: ConfidenceScore;
  category: PatternCategory;
  tags: string[];
}

export interface PatternSignature {
  conditions: PatternCondition[];
  timeWindow: number; // En jours
  minOccurrences: number;
}

export interface PatternCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'change';
  value: number | [number, number]; // Simple value or range
  tolerance?: number; // Pour matching approximatif
}

export interface PatternOutcome {
  description: string;
  probability: number;
  impactType: 'positive' | 'negative' | 'neutral';
  observedCount: number;
  lastObserved: Date;
}

export type PatternCategory =
  | 'budget_deviation'
  | 'schedule_slip'
  | 'commercial_slowdown'
  | 'team_performance'
  | 'external_risk'
  | 'seasonal'
  | 'cascade_effect'
  | 'recovery'
  | 'custom';

export interface PatternMatch {
  pattern: Pattern;
  matchScore: number; // 0-100
  matchedConditions: string[];
  suggestedActions: string[];
  likelyOutcome: PatternOutcome | null;
}

export interface MetricSnapshot {
  timestamp: Date;
  metrics: Record<string, number>;
}

// ============================================================================
// PATTERNS PRÉDÉFINIS (BASÉS SUR L'EXPÉRIENCE CENTRES COMMERCIAUX)
// ============================================================================

const PREDEFINED_PATTERNS: Omit<Pattern, 'frequency' | 'lastSeen' | 'firstSeen' | 'outcomes'>[] = [
  {
    id: 'pattern-budget-creep',
    name: 'Dérive budgétaire progressive',
    description: 'Le budget engagé augmente de façon constante au-delà du prévu, typiquement 2-3% par mois',
    signature: {
      conditions: [
        { metric: 'budgetEngage', operator: 'change', value: 3, tolerance: 1 },
        { metric: 'cpi', operator: 'lt', value: 0.95 },
      ],
      timeWindow: 30,
      minOccurrences: 3,
    },
    confidence: { value: 75, level: 'high', factors: ['Pattern classique construction'], dataQuality: 80 },
    category: 'budget_deviation',
    tags: ['budget', 'progressif', 'alerte-précoce'],
  },
  {
    id: 'pattern-anchor-delay-cascade',
    name: 'Retard ancre → cascade commerciale',
    description: 'Le retard de signature du locataire ancre entraîne un ralentissement des autres négociations',
    signature: {
      conditions: [
        { metric: 'anchorSigned', operator: 'eq', value: 0 },
        { metric: 'tauxOccupation', operator: 'change', value: -5, tolerance: 2 },
      ],
      timeWindow: 60,
      minOccurrences: 1,
    },
    confidence: { value: 85, level: 'very_high', factors: ['Corrélation forte dans le retail'], dataQuality: 90 },
    category: 'cascade_effect',
    tags: ['commercial', 'ancre', 'cascade'],
  },
  {
    id: 'pattern-rainy-season-slowdown',
    name: 'Ralentissement saison des pluies',
    description: 'Baisse de productivité chantier de 20-30% pendant la saison des pluies (Afrique de l\'Ouest)',
    signature: {
      conditions: [
        { metric: 'actionsTerminees_weekly', operator: 'change', value: -25, tolerance: 10 },
        { metric: 'month', operator: 'between', value: [6, 9] }, // Juin-Septembre
      ],
      timeWindow: 14,
      minOccurrences: 2,
    },
    confidence: { value: 80, level: 'high', factors: ['Données météo historiques'], dataQuality: 85 },
    category: 'seasonal',
    tags: ['planning', 'saisonnier', 'météo'],
  },
  {
    id: 'pattern-velocity-recovery',
    name: 'Récupération de vélocité post-blocage',
    description: 'Après résolution d\'un blocage majeur, la vélocité augmente de 30-50%',
    signature: {
      conditions: [
        { metric: 'actionsTerminees_weekly', operator: 'change', value: 40, tolerance: 15 },
        { metric: 'actionsEnRetard', operator: 'change', value: -20, tolerance: 10 },
      ],
      timeWindow: 14,
      minOccurrences: 1,
    },
    confidence: { value: 70, level: 'high', factors: ['Effet rebond post-déblocage'], dataQuality: 75 },
    category: 'recovery',
    tags: ['planning', 'positif', 'vélocité'],
  },
  {
    id: 'pattern-end-month-rush',
    name: 'Rush de fin de mois',
    description: 'Pic d\'activité les 5 derniers jours du mois (reporting, clôtures)',
    signature: {
      conditions: [
        { metric: 'dayOfMonth', operator: 'gte', value: 26 },
        { metric: 'actionsTerminees_daily', operator: 'change', value: 50, tolerance: 20 },
      ],
      timeWindow: 5,
      minOccurrences: 2,
    },
    confidence: { value: 65, level: 'medium', factors: ['Pattern comportemental'], dataQuality: 70 },
    category: 'team_performance',
    tags: ['planning', 'comportement', 'cyclique'],
  },
  {
    id: 'pattern-budget-optimism-bias',
    name: 'Biais d\'optimisme budgétaire',
    description: 'Les premières estimations sous-évaluent systématiquement les coûts de 10-15%',
    signature: {
      conditions: [
        { metric: 'avancementGlobal', operator: 'between', value: [20, 40] },
        { metric: 'eac', operator: 'gt', value: 1.1 }, // EAC > 110% du BAC
      ],
      timeWindow: 30,
      minOccurrences: 1,
    },
    confidence: { value: 70, level: 'high', factors: ['Biais cognitif documenté'], dataQuality: 75 },
    category: 'budget_deviation',
    tags: ['budget', 'estimation', 'psychologie'],
  },
];

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class PatternStore {
  private patterns: Map<string, Pattern> = new Map();
  private recentSnapshots: MetricSnapshot[] = [];
  private maxSnapshots = 365; // 1 an de données

  constructor() {
    this.initializePredefinedPatterns();
  }

  /**
   * Initialise avec les patterns prédéfinis
   */
  private initializePredefinedPatterns(): void {
    const now = new Date();

    for (const predefined of PREDEFINED_PATTERNS) {
      const pattern: Pattern = {
        ...predefined,
        frequency: 0,
        lastSeen: now,
        firstSeen: now,
        outcomes: [],
      };
      this.patterns.set(pattern.id, pattern);
    }
  }

  /**
   * Enregistre un snapshot de métriques
   */
  public recordSnapshot(metrics: Record<string, number>): void {
    const snapshot: MetricSnapshot = {
      timestamp: new Date(),
      metrics: { ...metrics },
    };

    this.recentSnapshots.push(snapshot);

    // Limiter la taille
    if (this.recentSnapshots.length > this.maxSnapshots) {
      this.recentSnapshots.shift();
    }
  }

  /**
   * Détecte les patterns correspondant aux données actuelles
   */
  public detectPatterns(currentMetrics: Record<string, number>): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const pattern of this.patterns.values()) {
      const match = this.matchPattern(pattern, currentMetrics);
      if (match && match.matchScore >= 60) {
        matches.push(match);
      }
    }

    // Trier par score de match décroissant
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Apprend un nouveau pattern depuis les observations
   */
  public learnPattern(
    name: string,
    description: string,
    conditions: PatternCondition[],
    category: PatternCategory,
    tags: string[] = []
  ): Pattern {
    const id = `pattern-learned-${Date.now()}`;
    const now = new Date();

    const pattern: Pattern = {
      id,
      name,
      description,
      signature: {
        conditions,
        timeWindow: 30,
        minOccurrences: 1,
      },
      frequency: 1,
      lastSeen: now,
      firstSeen: now,
      outcomes: [],
      confidence: {
        value: 50,
        level: 'medium',
        factors: ['Pattern appris', 'À confirmer'],
        dataQuality: 50,
      },
      category,
      tags: [...tags, 'appris'],
    };

    this.patterns.set(id, pattern);
    return pattern;
  }

  /**
   * Enregistre un outcome observé pour un pattern
   */
  public recordOutcome(
    patternId: string,
    outcome: Omit<PatternOutcome, 'observedCount' | 'lastObserved'>
  ): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    const now = new Date();

    // Chercher un outcome similaire
    const existingIdx = pattern.outcomes.findIndex(o =>
      o.description === outcome.description
    );

    if (existingIdx >= 0) {
      // Mettre à jour l'existant
      pattern.outcomes[existingIdx].observedCount++;
      pattern.outcomes[existingIdx].lastObserved = now;
      // Ajuster la probabilité
      pattern.outcomes[existingIdx].probability = this.recalculateProbability(
        pattern.outcomes[existingIdx],
        pattern.frequency
      );
    } else {
      // Ajouter nouveau
      pattern.outcomes.push({
        ...outcome,
        observedCount: 1,
        lastObserved: now,
      });
    }

    // Mettre à jour le pattern
    pattern.frequency++;
    pattern.lastSeen = now;

    // Recalculer la confiance
    pattern.confidence = this.recalculateConfidence(pattern);
  }

  /**
   * Retourne tous les patterns par catégorie
   */
  public getPatternsByCategory(category: PatternCategory): Pattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.category === category);
  }

  /**
   * Retourne les patterns les plus fréquents
   */
  public getTopPatterns(limit = 10): Pattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Exporte les patterns pour persistance
   */
  public exportPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Importe des patterns sauvegardés
   */
  public importPatterns(patterns: Pattern[]): void {
    for (const pattern of patterns) {
      // Ne pas écraser les prédéfinis si moins fiables
      const existing = this.patterns.get(pattern.id);
      if (existing && existing.confidence.value > pattern.confidence.value) {
        continue;
      }
      this.patterns.set(pattern.id, pattern);
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private matchPattern(
    pattern: Pattern,
    currentMetrics: Record<string, number>
  ): PatternMatch | null {
    const matchedConditions: string[] = [];
    let totalScore = 0;
    const conditionCount = pattern.signature.conditions.length;

    for (const condition of pattern.signature.conditions) {
      const value = currentMetrics[condition.metric];
      if (value === undefined) continue;

      const isMatch = this.evaluateCondition(condition, value, currentMetrics);
      if (isMatch) {
        matchedConditions.push(condition.metric);
        totalScore += 100 / conditionCount;
      }
    }

    if (matchedConditions.length === 0) return null;

    // Trouver l'outcome le plus probable
    const likelyOutcome = pattern.outcomes.length > 0
      ? pattern.outcomes.reduce((a, b) => a.probability > b.probability ? a : b)
      : null;

    // Générer des suggestions d'actions
    const suggestedActions = this.generateSuggestedActions(pattern, likelyOutcome);

    return {
      pattern,
      matchScore: Math.round(totalScore),
      matchedConditions,
      suggestedActions,
      likelyOutcome,
    };
  }

  private evaluateCondition(
    condition: PatternCondition,
    currentValue: number,
    allMetrics: Record<string, number>
  ): boolean {
    const { operator, value, tolerance = 0 } = condition;

    switch (operator) {
      case 'gt':
        return currentValue > (value as number);
      case 'lt':
        return currentValue < (value as number);
      case 'eq':
        return Math.abs(currentValue - (value as number)) <= tolerance;
      case 'gte':
        return currentValue >= (value as number);
      case 'lte':
        return currentValue <= (value as number);
      case 'between':
        const [min, max] = value as [number, number];
        return currentValue >= min && currentValue <= max;
      case 'change':
        // Nécessite l'historique pour calculer le changement
        // Simplifié ici - retourne true si la valeur est significative
        return Math.abs(currentValue) >= Math.abs(value as number) - tolerance;
      default:
        return false;
    }
  }

  private recalculateProbability(
    outcome: PatternOutcome,
    patternFrequency: number
  ): number {
    // Formule bayésienne simplifiée
    return Math.min(95, Math.round(
      (outcome.observedCount / Math.max(1, patternFrequency)) * 100
    ));
  }

  private recalculateConfidence(pattern: Pattern): ConfidenceScore {
    let score = 50; // Base

    // Fréquence augmente la confiance
    if (pattern.frequency >= 10) score += 20;
    else if (pattern.frequency >= 5) score += 10;
    else if (pattern.frequency >= 3) score += 5;

    // Outcomes observés augmentent la confiance
    const totalOutcomes = pattern.outcomes.reduce(
      (sum, o) => sum + o.observedCount,
      0
    );
    if (totalOutcomes >= 10) score += 15;
    else if (totalOutcomes >= 5) score += 8;

    // Récence
    const daysSinceLastSeen = Math.floor(
      (Date.now() - pattern.lastSeen.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastSeen <= 7) score += 10;
    else if (daysSinceLastSeen > 90) score -= 10;

    score = Math.min(95, Math.max(30, score));

    return {
      value: score,
      level: getConfidenceLevel(score),
      factors: [
        `Fréquence: ${pattern.frequency}`,
        `Outcomes: ${totalOutcomes}`,
        `Dernière observation: ${daysSinceLastSeen}j`,
      ],
      dataQuality: Math.min(90, 50 + pattern.frequency * 2),
    };
  }

  private generateSuggestedActions(
    pattern: Pattern,
    outcome: PatternOutcome | null
  ): string[] {
    const actions: string[] = [];

    // Actions basées sur la catégorie
    switch (pattern.category) {
      case 'budget_deviation':
        actions.push('Revoir les engagements en cours');
        actions.push('Identifier les postes à optimiser');
        break;
      case 'schedule_slip':
        actions.push('Analyser le chemin critique');
        actions.push('Identifier les ressources supplémentaires');
        break;
      case 'commercial_slowdown':
        actions.push('Intensifier les actions commerciales');
        actions.push('Revoir la stratégie de pricing');
        break;
      case 'cascade_effect':
        actions.push('Isoler la cause racine');
        actions.push('Établir des pare-feu entre modules');
        break;
      case 'seasonal':
        actions.push('Ajuster le planning en conséquence');
        actions.push('Prévoir des marges de sécurité');
        break;
      case 'recovery':
        actions.push('Capitaliser sur l\'élan positif');
        actions.push('Consolider les gains');
        break;
      default:
        actions.push('Surveiller l\'évolution');
    }

    // Actions basées sur l'outcome probable
    if (outcome?.impactType === 'negative') {
      actions.unshift('Action préventive recommandée');
    }

    return actions;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default PatternStore;
