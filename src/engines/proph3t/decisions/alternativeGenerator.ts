// ============================================================================
// PROPH3T ENGINE V2 — ALTERNATIVE GENERATOR
// Génère des alternatives créatives aux décisions
// ============================================================================

import type { Action, Jalon, Risque } from '../../../types';
import type { DecisionContext, DecisionOption } from './decisionAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface AlternativeStrategy {
  id: string;
  name: string;
  description: string;
  applicableCategories: string[];
  generator: (context: DecisionContext, data: any) => AlternativeOption[];
}

export interface AlternativeOption extends DecisionOption {
  creativity: 'conventional' | 'innovative' | 'radical';
  precedent?: string;
  implementation: string[];
  dependencies: string[];
  reversibility: 'easy' | 'moderate' | 'difficult';
}

export interface AlternativeSet {
  context: DecisionContext;
  conventional: AlternativeOption[];
  innovative: AlternativeOption[];
  radical: AlternativeOption[];
  hybridOptions: AlternativeOption[];
}

// ============================================================================
// ALTERNATIVE GENERATOR
// ============================================================================

export class AlternativeGenerator {
  private strategies: AlternativeStrategy[] = [
    // Stratégie: Décomposition
    {
      id: 'decomposition',
      name: 'Décomposition',
      description: 'Diviser le problème en sous-problèmes',
      applicableCategories: ['schedule', 'scope', 'resource'],
      generator: this.generateDecompositionAlternatives.bind(this),
    },
    // Stratégie: Inversion
    {
      id: 'inversion',
      name: 'Inversion',
      description: 'Inverser l\'approche du problème',
      applicableCategories: ['budget', 'risk', 'quality'],
      generator: this.generateInversionAlternatives.bind(this),
    },
    // Stratégie: Analogie
    {
      id: 'analogy',
      name: 'Analogie',
      description: 'S\'inspirer de solutions similaires',
      applicableCategories: ['schedule', 'budget', 'scope', 'resource', 'risk', 'quality'],
      generator: this.generateAnalogyAlternatives.bind(this),
    },
    // Stratégie: Combinaison
    {
      id: 'combination',
      name: 'Combinaison',
      description: 'Combiner plusieurs approches',
      applicableCategories: ['schedule', 'budget', 'scope', 'resource', 'risk', 'quality'],
      generator: this.generateCombinationAlternatives.bind(this),
    },
  ];

  // ---------------------------------------------------------------------------
  // GÉNÉRATION D'ALTERNATIVES
  // ---------------------------------------------------------------------------

  /**
   * Génère un ensemble complet d'alternatives pour une décision
   */
  generateAlternatives(
    context: DecisionContext,
    projectData: {
      actions: Action[];
      jalons: Jalon[];
      risques: Risque[];
    }
  ): AlternativeSet {
    const allAlternatives: AlternativeOption[] = [];

    // Appliquer chaque stratégie applicable
    for (const strategy of this.strategies) {
      if (strategy.applicableCategories.includes(context.category)) {
        const options = strategy.generator(context, projectData);
        allAlternatives.push(...options);
      }
    }

    // Classer par niveau de créativité
    const conventional = allAlternatives.filter(a => a.creativity === 'conventional');
    const innovative = allAlternatives.filter(a => a.creativity === 'innovative');
    const radical = allAlternatives.filter(a => a.creativity === 'radical');

    // Générer des options hybrides
    const hybridOptions = this.generateHybridOptions(conventional, innovative);

    return {
      context,
      conventional,
      innovative,
      radical,
      hybridOptions,
    };
  }

  private generateDecompositionAlternatives(context: DecisionContext, data: any): AlternativeOption[] {
    const options: AlternativeOption[] = [];

    if (context.category === 'schedule') {
      options.push({
        id: 'decomp-phase',
        name: 'Livraison par phases',
        description: 'Diviser le projet en phases distinctes avec des livrables intermédiaires',
        pros: ['Valeur précoce', 'Feedback rapide', 'Risques réduits'],
        cons: ['Complexité de gestion', 'Overhead de coordination'],
        risks: ['Incohérence entre phases'],
        estimatedCost: 0,
        estimatedDuration: 0,
        feasibility: 'high',
        alignment: 70,
        creativity: 'conventional',
        implementation: [
          'Identifier les composants autonomes',
          'Définir les livrables par phase',
          'Établir les dépendances inter-phases',
        ],
        dependencies: [],
        reversibility: 'moderate',
      });

      options.push({
        id: 'decomp-parallel',
        name: 'Parallélisation maximale',
        description: 'Identifier toutes les tâches parallélisables et les exécuter simultanément',
        pros: ['Gain de temps significatif', 'Utilisation optimale des ressources'],
        cons: ['Coordination complexe', 'Risques de conflits'],
        risks: ['Goulots d\'étranglement', 'Qualité'],
        estimatedCost: 1000,
        estimatedDuration: -7,
        feasibility: 'medium',
        alignment: 65,
        creativity: 'innovative',
        implementation: [
          'Analyser le graphe de dépendances',
          'Identifier les tâches sans prédécesseurs communs',
          'Allouer les ressources nécessaires',
        ],
        dependencies: ['Ressources disponibles'],
        reversibility: 'easy',
      });
    }

    if (context.category === 'scope') {
      options.push({
        id: 'decomp-mvp',
        name: 'MVP + Incréments',
        description: 'Définir un MVP minimal puis des incréments de valeur',
        pros: ['Time to market rapide', 'Validation précoce'],
        cons: ['Périmètre initial limité', 'Attentes à gérer'],
        risks: ['MVP insuffisant', 'Incréments non livrés'],
        estimatedCost: 0,
        estimatedDuration: -14,
        feasibility: 'high',
        alignment: 75,
        creativity: 'conventional',
        implementation: [
          'Définir les fonctionnalités essentielles',
          'Prioriser par valeur business',
          'Planifier les releases',
        ],
        dependencies: [],
        reversibility: 'easy',
      });
    }

    return options;
  }

  private generateInversionAlternatives(context: DecisionContext, data: any): AlternativeOption[] {
    const options: AlternativeOption[] = [];

    if (context.category === 'budget') {
      options.push({
        id: 'invert-value',
        name: 'Budgétisation par la valeur',
        description: 'Au lieu de réduire les coûts, maximiser la valeur par euro dépensé',
        pros: ['Focus sur la valeur', 'Justification claire'],
        cons: ['Mesure de la valeur complexe'],
        risks: ['Subjectivité de la valeur'],
        estimatedCost: 0,
        estimatedDuration: 3,
        feasibility: 'medium',
        alignment: 60,
        creativity: 'innovative',
        implementation: [
          'Définir les métriques de valeur',
          'Évaluer chaque poste budgétaire',
          'Réallouer vers la valeur maximale',
        ],
        dependencies: ['Accord sur les métriques'],
        reversibility: 'easy',
      });
    }

    if (context.category === 'risk') {
      options.push({
        id: 'invert-opportunity',
        name: 'Risque comme opportunité',
        description: 'Transformer le risque en avantage compétitif',
        pros: ['Différenciation', 'Innovation forcée'],
        cons: ['Exposition maintenue', 'Pari audacieux'],
        risks: ['Échec du pivot'],
        estimatedCost: 2000,
        estimatedDuration: 14,
        feasibility: 'low',
        alignment: 40,
        creativity: 'radical',
        implementation: [
          'Analyser les aspects positifs du risque',
          'Identifier les opportunités cachées',
          'Développer une stratégie offensive',
        ],
        dependencies: ['Appétit au risque de l\'organisation'],
        reversibility: 'difficult',
      });
    }

    return options;
  }

  private generateAnalogyAlternatives(context: DecisionContext, data: any): AlternativeOption[] {
    const options: AlternativeOption[] = [];

    // Analogies génériques
    options.push({
      id: 'analog-industry',
      name: 'Best practice sectorielle',
      description: 'Appliquer une solution éprouvée dans le secteur',
      pros: ['Validée', 'Documentation disponible', 'Benchmarks existants'],
      cons: ['Peut ne pas être adaptée', 'Manque d\'originalité'],
      risks: ['Copie sans compréhension'],
      estimatedCost: 1000,
      estimatedDuration: 7,
      feasibility: 'high',
      alignment: 70,
      creativity: 'conventional',
      precedent: 'Standard de l\'industrie',
      implementation: [
        'Rechercher les cas similaires',
        'Analyser les facteurs de succès',
        'Adapter au contexte',
      ],
      dependencies: [],
      reversibility: 'easy',
    });

    options.push({
      id: 'analog-cross',
      name: 'Inspiration cross-industrie',
      description: 'S\'inspirer d\'un autre secteur pour innover',
      pros: ['Innovation', 'Différenciation', 'Perspectives fraîches'],
      cons: ['Adaptation nécessaire', 'Risque d\'inadaptation'],
      risks: ['Incompatibilité culturelle'],
      estimatedCost: 3000,
      estimatedDuration: 14,
      feasibility: 'medium',
      alignment: 55,
      creativity: 'innovative',
      precedent: 'Exemple: Toyota Production System appliqué à la santé',
      implementation: [
        'Identifier les secteurs leaders',
        'Extraire les principes transférables',
        'Prototyper et tester',
      ],
      dependencies: ['Ouverture au changement'],
      reversibility: 'moderate',
    });

    return options;
  }

  private generateCombinationAlternatives(context: DecisionContext, data: any): AlternativeOption[] {
    const options: AlternativeOption[] = [];

    options.push({
      id: 'combo-sequential',
      name: 'Approche séquentielle',
      description: 'Combiner plusieurs solutions en séquence',
      pros: ['Flexibilité', 'Apprentissage progressif'],
      cons: ['Durée totale plus longue'],
      risks: ['Fatigue du changement'],
      estimatedCost: 2000,
      estimatedDuration: 21,
      feasibility: 'high',
      alignment: 65,
      creativity: 'conventional',
      implementation: [
        'Définir l\'ordre optimal',
        'Planifier les transitions',
        'Mesurer l\'efficacité à chaque étape',
      ],
      dependencies: [],
      reversibility: 'moderate',
    });

    options.push({
      id: 'combo-hybrid',
      name: 'Solution hybride personnalisée',
      description: 'Créer une solution sur-mesure combinant les meilleurs éléments',
      pros: ['Optimisée pour le contexte', 'Best of breed'],
      cons: ['Complexité', 'Temps de conception'],
      risks: ['Frankenstein solution'],
      estimatedCost: 5000,
      estimatedDuration: 14,
      feasibility: 'medium',
      alignment: 75,
      creativity: 'innovative',
      implementation: [
        'Lister les forces de chaque option',
        'Identifier les synergies',
        'Concevoir l\'architecture combinée',
        'Tester les interfaces',
      ],
      dependencies: ['Expertise technique'],
      reversibility: 'difficult',
    });

    return options;
  }

  private generateHybridOptions(
    conventional: AlternativeOption[],
    innovative: AlternativeOption[]
  ): AlternativeOption[] {
    if (conventional.length === 0 || innovative.length === 0) {
      return [];
    }

    // Créer une option hybride à partir de la meilleure conventionnelle et innovante
    const bestConv = conventional.sort((a, b) => b.alignment - a.alignment)[0];
    const bestInnov = innovative.sort((a, b) => b.alignment - a.alignment)[0];

    return [{
      id: `hybrid-${bestConv.id}-${bestInnov.id}`,
      name: `${bestConv.name} + ${bestInnov.name}`,
      description: `Combinaison: ${bestConv.description} avec ${bestInnov.description.toLowerCase()}`,
      pros: [...bestConv.pros.slice(0, 2), ...bestInnov.pros.slice(0, 2)],
      cons: ['Complexité de mise en oeuvre', 'Coordination nécessaire'],
      risks: ['Conflits potentiels entre approches'],
      estimatedCost: bestConv.estimatedCost + bestInnov.estimatedCost,
      estimatedDuration: Math.max(bestConv.estimatedDuration, bestInnov.estimatedDuration),
      feasibility: 'medium',
      alignment: Math.round((bestConv.alignment + bestInnov.alignment) / 2 + 5),
      creativity: 'innovative',
      implementation: [
        'Définir les interfaces entre les deux approches',
        ...bestConv.implementation.slice(0, 2),
        ...bestInnov.implementation.slice(0, 2),
      ],
      dependencies: [...(bestConv.dependencies || []), ...(bestInnov.dependencies || [])],
      reversibility: 'moderate',
    }];
  }

  // ---------------------------------------------------------------------------
  // UTILITAIRES
  // ---------------------------------------------------------------------------

  /**
   * Filtre les alternatives par critères
   */
  filterAlternatives(
    alternatives: AlternativeOption[],
    criteria: {
      maxCost?: number;
      maxDuration?: number;
      minFeasibility?: 'high' | 'medium' | 'low';
      creativity?: 'conventional' | 'innovative' | 'radical';
    }
  ): AlternativeOption[] {
    return alternatives.filter(alt => {
      if (criteria.maxCost !== undefined && alt.estimatedCost > criteria.maxCost) return false;
      if (criteria.maxDuration !== undefined && alt.estimatedDuration > criteria.maxDuration) return false;
      if (criteria.creativity && alt.creativity !== criteria.creativity) return false;

      if (criteria.minFeasibility) {
        const order = { high: 3, medium: 2, low: 1 };
        if (order[alt.feasibility] < order[criteria.minFeasibility]) return false;
      }

      return true;
    });
  }

  /**
   * Classe les alternatives par score composite
   */
  rankAlternatives(alternatives: AlternativeOption[]): AlternativeOption[] {
    return [...alternatives].sort((a, b) => {
      // Score composite: alignment + feasibility bonus - cost/duration penalty
      const feasBonus = { high: 20, medium: 10, low: 0 };
      const scoreA = a.alignment + feasBonus[a.feasibility] - (a.estimatedCost / 1000) - (a.estimatedDuration / 7);
      const scoreB = b.alignment + feasBonus[b.feasibility] - (b.estimatedCost / 1000) - (b.estimatedDuration / 7);
      return scoreB - scoreA;
    });
  }
}

export default AlternativeGenerator;
