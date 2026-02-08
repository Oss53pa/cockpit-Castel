// ============================================================================
// PROPH3T ENGINE V2 — DECISION ANALYZER
// Analyse et aide à la prise de décision
// ============================================================================

import type { Action, Jalon, Risque } from '../../../types';

// ============================================================================
// TYPES
// ============================================================================

export type DecisionCategory = 'schedule' | 'budget' | 'scope' | 'resource' | 'risk' | 'quality';
export type DecisionUrgency = 'immediate' | 'this_week' | 'this_month' | 'when_possible';

export interface DecisionContext {
  category: DecisionCategory;
  question: string;
  background: string;
  urgency: DecisionUrgency;
  stakeholders: string[];
  constraints: string[];
  objectives: string[];
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  risks: string[];
  estimatedCost: number;
  estimatedDuration: number; // jours
  feasibility: 'high' | 'medium' | 'low';
  alignment: number; // 0-100, alignement avec les objectifs
}

export interface DecisionAnalysis {
  context: DecisionContext;
  options: DecisionOption[];
  recommendation: {
    optionId: string;
    confidence: number;
    rationale: string;
  };
  tradeoffs: Array<{
    factor: string;
    optionA: string;
    optionB: string;
    winner: string;
  }>;
  nextSteps: string[];
  deadline?: Date;
}

export interface SensitivityResult {
  factor: string;
  currentValue: number;
  threshold: number;
  impact: string;
  recommendation: string;
}

// ============================================================================
// DECISION ANALYZER
// ============================================================================

export class DecisionAnalyzer {
  // ---------------------------------------------------------------------------
  // ANALYSE DE DÉCISION
  // ---------------------------------------------------------------------------

  /**
   * Analyse une situation et génère des options de décision
   */
  analyze(context: DecisionContext, projectData: {
    actions: Action[];
    jalons: Jalon[];
    risques: Risque[];
    budget?: { total: number; consumed: number };
  }): DecisionAnalysis {
    // Générer les options selon la catégorie
    const options = this.generateOptions(context, projectData);

    // Évaluer chaque option
    const evaluatedOptions = options.map(opt => this.evaluateOption(opt, context, projectData));

    // Déterminer la recommandation
    const recommendation = this.determineRecommendation(evaluatedOptions, context);

    // Analyser les compromis
    const tradeoffs = this.analyzeTradeoffs(evaluatedOptions);

    // Définir les prochaines étapes
    const nextSteps = this.defineNextSteps(context, recommendation);

    return {
      context,
      options: evaluatedOptions,
      recommendation,
      tradeoffs,
      nextSteps,
      deadline: this.calculateDeadline(context),
    };
  }

  private generateOptions(
    context: DecisionContext,
    data: { actions: Action[]; jalons: Jalon[]; risques: Risque[]; budget?: { total: number; consumed: number } }
  ): DecisionOption[] {
    const options: DecisionOption[] = [];

    switch (context.category) {
      case 'schedule':
        options.push(
          {
            id: 'opt-schedule-1',
            name: 'Maintenir le planning',
            description: 'Conserver les dates prévues et intensifier les efforts',
            pros: ['Pas de décalage visible', 'Respect des engagements'],
            cons: ['Risque de surcharge équipe', 'Possible baisse de qualité'],
            risks: ['Burnout équipe', 'Défauts non détectés'],
            estimatedCost: 0,
            estimatedDuration: 0,
            feasibility: 'medium',
            alignment: 0,
          },
          {
            id: 'opt-schedule-2',
            name: 'Décaler les dates',
            description: 'Reporter les échéances pour absorber le retard',
            pros: ['Réalisme', 'Préservation de la qualité'],
            cons: ['Impact sur les parties prenantes', 'Coûts indirects'],
            risks: ['Perte de confiance', 'Effet domino'],
            estimatedCost: 0,
            estimatedDuration: 14,
            feasibility: 'high',
            alignment: 0,
          },
          {
            id: 'opt-schedule-3',
            name: 'Réduire le périmètre',
            description: 'Reporter certaines fonctionnalités non critiques',
            pros: ['Maintien des dates clés', 'Focus sur l\'essentiel'],
            cons: ['Fonctionnalités manquantes', 'Frustration utilisateurs'],
            risks: ['Découpage difficile', 'Dette technique'],
            estimatedCost: 0,
            estimatedDuration: 0,
            feasibility: 'medium',
            alignment: 0,
          }
        );
        break;

      case 'budget':
        const remaining = data.budget ? data.budget.total - data.budget.consumed : 0;
        options.push(
          {
            id: 'opt-budget-1',
            name: 'Demander un budget additionnel',
            description: 'Solliciter une rallonge budgétaire',
            pros: ['Couvre les besoins', 'Maintien du périmètre'],
            cons: ['Processus d\'approbation', 'Image négative'],
            risks: ['Refus', 'Délais d\'obtention'],
            estimatedCost: Math.round(remaining * -0.2),
            estimatedDuration: 14,
            feasibility: 'medium',
            alignment: 0,
          },
          {
            id: 'opt-budget-2',
            name: 'Optimiser les coûts',
            description: 'Identifier et réduire les dépenses non essentielles',
            pros: ['Autonomie', 'Discipline financière'],
            cons: ['Efforts d\'analyse', 'Choix difficiles'],
            risks: ['Impact sur la qualité', 'Mécontentement'],
            estimatedCost: 0,
            estimatedDuration: 7,
            feasibility: 'high',
            alignment: 0,
          },
          {
            id: 'opt-budget-3',
            name: 'Réduire le scope',
            description: 'Ajuster le périmètre au budget disponible',
            pros: ['Respect du budget', 'Réalisme'],
            cons: ['Livrables réduits', 'Renégociation'],
            risks: ['Insatisfaction', 'Perte de valeur'],
            estimatedCost: 0,
            estimatedDuration: 0,
            feasibility: 'medium',
            alignment: 0,
          }
        );
        break;

      case 'risk':
        options.push(
          {
            id: 'opt-risk-1',
            name: 'Mitiger le risque',
            description: 'Mettre en place des actions préventives',
            pros: ['Réduit la probabilité', 'Proactif'],
            cons: ['Coût des actions', 'Temps requis'],
            risks: ['Efficacité incertaine'],
            estimatedCost: 5000,
            estimatedDuration: 7,
            feasibility: 'high',
            alignment: 0,
          },
          {
            id: 'opt-risk-2',
            name: 'Transférer le risque',
            description: 'Assurance ou sous-traitance',
            pros: ['Externalise le risque', 'Expertise externe'],
            cons: ['Coût du transfert', 'Perte de contrôle'],
            risks: ['Qualité du transfert'],
            estimatedCost: 10000,
            estimatedDuration: 14,
            feasibility: 'medium',
            alignment: 0,
          },
          {
            id: 'opt-risk-3',
            name: 'Accepter le risque',
            description: 'Surveiller et préparer un plan de contingence',
            pros: ['Pas de coût immédiat', 'Simple'],
            cons: ['Exposition maintenue', 'Impact potentiel'],
            risks: ['Matérialisation du risque'],
            estimatedCost: 0,
            estimatedDuration: 0,
            feasibility: 'high',
            alignment: 0,
          }
        );
        break;

      default:
        options.push(
          {
            id: 'opt-default-1',
            name: 'Option A',
            description: 'Première option à évaluer',
            pros: [],
            cons: [],
            risks: [],
            estimatedCost: 0,
            estimatedDuration: 0,
            feasibility: 'medium',
            alignment: 0,
          },
          {
            id: 'opt-default-2',
            name: 'Option B',
            description: 'Seconde option à évaluer',
            pros: [],
            cons: [],
            risks: [],
            estimatedCost: 0,
            estimatedDuration: 0,
            feasibility: 'medium',
            alignment: 0,
          }
        );
    }

    return options;
  }

  private evaluateOption(
    option: DecisionOption,
    context: DecisionContext,
    data: any
  ): DecisionOption {
    // Calculer l'alignement avec les objectifs
    let alignmentScore = 50; // Base

    // Bonus si faisabilité haute
    if (option.feasibility === 'high') alignmentScore += 20;
    else if (option.feasibility === 'low') alignmentScore -= 20;

    // Bonus si peu de risques
    alignmentScore -= option.risks.length * 5;

    // Bonus si plus de pros que de cons
    alignmentScore += (option.pros.length - option.cons.length) * 5;

    // Ajuster selon l'urgence
    if (context.urgency === 'immediate' && option.estimatedDuration > 7) {
      alignmentScore -= 15;
    }

    return {
      ...option,
      alignment: Math.max(0, Math.min(100, alignmentScore)),
    };
  }

  private determineRecommendation(
    options: DecisionOption[],
    context: DecisionContext
  ): { optionId: string; confidence: number; rationale: string } {
    // Trier par alignement
    const sorted = [...options].sort((a, b) => b.alignment - a.alignment);
    const best = sorted[0];

    if (!best) {
      return {
        optionId: '',
        confidence: 0,
        rationale: 'Pas assez de données pour recommander',
      };
    }

    // Calculer la confiance
    const gap = sorted.length > 1 ? best.alignment - sorted[1].alignment : 30;
    const confidence = Math.min(90, 50 + gap);

    // Générer le rationale
    let rationale = `"${best.name}" est recommandée car elle `;
    if (best.feasibility === 'high') rationale += 'est hautement faisable, ';
    if (best.pros.length > best.cons.length) rationale += 'présente plus d\'avantages que d\'inconvénients, ';
    if (best.risks.length < 2) rationale += 'comporte peu de risques';
    else rationale += 'offre le meilleur équilibre';
    rationale += '.';

    return {
      optionId: best.id,
      confidence,
      rationale,
    };
  }

  private analyzeTradeoffs(options: DecisionOption[]): Array<{
    factor: string;
    optionA: string;
    optionB: string;
    winner: string;
  }> {
    if (options.length < 2) return [];

    const tradeoffs: Array<{
      factor: string;
      optionA: string;
      optionB: string;
      winner: string;
    }> = [];

    const factors = ['Coût', 'Délai', 'Faisabilité', 'Risques'];

    for (const factor of factors) {
      const optA = options[0];
      const optB = options[1];

      let winner: string;
      switch (factor) {
        case 'Coût':
          winner = optA.estimatedCost <= optB.estimatedCost ? optA.name : optB.name;
          break;
        case 'Délai':
          winner = optA.estimatedDuration <= optB.estimatedDuration ? optA.name : optB.name;
          break;
        case 'Faisabilité':
          const feasOrder = { high: 3, medium: 2, low: 1 };
          winner = feasOrder[optA.feasibility] >= feasOrder[optB.feasibility] ? optA.name : optB.name;
          break;
        case 'Risques':
          winner = optA.risks.length <= optB.risks.length ? optA.name : optB.name;
          break;
        default:
          winner = optA.name;
      }

      tradeoffs.push({
        factor,
        optionA: optA.name,
        optionB: optB.name,
        winner,
      });
    }

    return tradeoffs;
  }

  private defineNextSteps(
    context: DecisionContext,
    recommendation: { optionId: string; confidence: number; rationale: string }
  ): string[] {
    const steps: string[] = [];

    if (recommendation.confidence < 60) {
      steps.push('Collecter des informations supplémentaires pour affiner l\'analyse');
    }

    if (context.stakeholders.length > 0) {
      steps.push(`Consulter les parties prenantes: ${context.stakeholders.join(', ')}`);
    }

    if (context.urgency === 'immediate') {
      steps.push('Organiser une réunion de décision dans les 24h');
    } else {
      steps.push('Planifier une revue de décision');
    }

    steps.push('Documenter la décision et le rationale');
    steps.push('Communiquer la décision aux équipes concernées');

    return steps;
  }

  private calculateDeadline(context: DecisionContext): Date {
    const deadline = new Date();

    switch (context.urgency) {
      case 'immediate':
        deadline.setDate(deadline.getDate() + 1);
        break;
      case 'this_week':
        deadline.setDate(deadline.getDate() + 7);
        break;
      case 'this_month':
        deadline.setDate(deadline.getDate() + 30);
        break;
      default:
        deadline.setDate(deadline.getDate() + 60);
    }

    return deadline;
  }

  // ---------------------------------------------------------------------------
  // ANALYSE DE SENSIBILITÉ
  // ---------------------------------------------------------------------------

  /**
   * Analyse la sensibilité d'une décision aux différents facteurs
   */
  analyzeSensitivity(
    analysis: DecisionAnalysis,
    factors: string[]
  ): SensitivityResult[] {
    const results: SensitivityResult[] = [];

    for (const factor of factors) {
      const result = this.evaluateSensitivity(analysis, factor);
      results.push(result);
    }

    return results.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact as keyof typeof impactOrder] - impactOrder[b.impact as keyof typeof impactOrder];
    });
  }

  private evaluateSensitivity(analysis: DecisionAnalysis, factor: string): SensitivityResult {
    // Simplification: évaluation basique de la sensibilité
    const recommended = analysis.options.find(o => o.id === analysis.recommendation.optionId);

    let currentValue = 0;
    let threshold = 0;
    let impact = 'low';
    let recommendation = '';

    switch (factor.toLowerCase()) {
      case 'coût':
      case 'cost':
        currentValue = recommended?.estimatedCost || 0;
        threshold = currentValue * 1.5;
        impact = currentValue > 10000 ? 'high' : 'medium';
        recommendation = impact === 'high'
          ? 'Surveiller de près les dépassements de coûts'
          : 'Marge de manoeuvre acceptable';
        break;

      case 'délai':
      case 'duration':
        currentValue = recommended?.estimatedDuration || 0;
        threshold = currentValue * 1.3;
        impact = currentValue > 14 ? 'high' : 'medium';
        recommendation = impact === 'high'
          ? 'Préparer un plan de contingence calendaire'
          : 'Délai gérable';
        break;

      default:
        currentValue = 50;
        threshold = 70;
        impact = 'low';
        recommendation = 'Facteur secondaire';
    }

    return {
      factor,
      currentValue,
      threshold,
      impact,
      recommendation,
    };
  }
}

export default DecisionAnalyzer;
