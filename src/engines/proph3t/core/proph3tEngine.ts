// ============================================================================
// PROPH3T ENGINE V2 — ORCHESTRATEUR PRINCIPAL
// ============================================================================
// Moteur d'intelligence prescriptive pour COCKPIT COSMOS
// ============================================================================

import type {
  Prediction,
  PrescriptiveAction,
  ProjectState,
  Anomaly,
  CascadeEffect,
  WhatIfScenario,
  SimulationResult,
  ConfidenceScore,
  ExcoReport,
  EngineStatus,
} from './types';

// Analyzers
import { AnomalyDetector } from '../analyzers/anomalyDetector';
import { CorrelationEngine } from '../analyzers/correlationEngine';

// Predictors
import { RiskPredictor } from '../predictors/riskPredictor';
import { CostPredictor, type EVMResult } from '../predictors/costPredictor';
import { SchedulePredictor } from '../predictors/schedulePredictor';
import { RevenuePredictor } from '../predictors/revenuePredictor';

// Simulators
import { WhatIfSimulator } from '../simulators/whatIfSimulator';

// Prescribers
import { ActionPrescriber, type PrescriptionOutput } from '../prescribers/actionPrescriber';
import { PriorityMatrix, type PrioritizedAction } from '../prescribers/priorityMatrix';

// Memory
import { ProjectMemory, type MemoryExport } from '../memory/projectMemory';
import type { PatternMatch } from '../memory/patternStore';
import type { LearningInsight, FeedbackStats } from '../memory/feedbackLoop';

// ============================================================================
// TYPES
// ============================================================================

export interface EngineConfig {
  enableMemory?: boolean;
  enablePatternDetection?: boolean;
  confidenceCalibration?: boolean;
  autoRecordEvents?: boolean;
  debugMode?: boolean;
}

export interface AnalysisResult {
  timestamp: Date;
  state: ProjectState;
  predictions: Prediction[];
  anomalies: Anomaly[];
  cascades: CascadeEffect[];
  patternMatches: PatternMatch[];
  prescription: PrescriptionOutput;
  evm: EVMResult;
  insights: LearningInsight[];
  executionTimeMs: number;
}

export interface QuickDiagnostic {
  overallHealth: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  topIssues: Array<{ title: string; severity: string; module: string }>;
  urgentActions: number;
  keyMetrics: {
    budgetStatus: string;
    scheduleStatus: string;
    commercialStatus: string;
  };
}

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class Proph3tEngine {
  private config: EngineConfig;

  // Modules
  private anomalyDetector: AnomalyDetector;
  private correlationEngine: CorrelationEngine;
  private riskPredictor: RiskPredictor;
  private costPredictor: CostPredictor;
  private schedulePredictor: SchedulePredictor;
  private revenuePredictor: RevenuePredictor;
  private whatIfSimulator: WhatIfSimulator;
  private actionPrescriber: ActionPrescriber;
  private priorityMatrix: PriorityMatrix;
  private projectMemory: ProjectMemory;

  // État interne
  private lastAnalysis: AnalysisResult | null = null;
  private isRunning = false;

  constructor(config: EngineConfig = {}) {
    this.config = {
      enableMemory: true,
      enablePatternDetection: true,
      confidenceCalibration: true,
      autoRecordEvents: true,
      debugMode: false,
      ...config,
    };

    // Initialiser les modules
    this.anomalyDetector = new AnomalyDetector();
    this.correlationEngine = new CorrelationEngine();
    this.riskPredictor = new RiskPredictor();
    this.costPredictor = new CostPredictor();
    this.schedulePredictor = new SchedulePredictor();
    this.revenuePredictor = new RevenuePredictor();
    this.whatIfSimulator = new WhatIfSimulator();
    this.actionPrescriber = new ActionPrescriber();
    this.priorityMatrix = new PriorityMatrix();
    this.projectMemory = new ProjectMemory();
  }

  // ============================================================================
  // ANALYSE PRINCIPALE
  // ============================================================================

  /**
   * Exécute une analyse complète du projet
   */
  public async analyze(state: ProjectState): Promise<AnalysisResult> {
    const startTime = Date.now();
    this.isRunning = true;

    try {
      // 1. Enregistrer le snapshot si mémoire activée
      if (this.config.enableMemory) {
        this.projectMemory.recordSnapshot(state);
      }

      // 2. Détecter les anomalies
      const anomalies = this.anomalyDetector.detect(state);

      // 3. Détecter les cascades via corrélation
      const cascades = this.correlationEngine.detectCascadeEffects(state, anomalies);

      // 4. Générer les prédictions (tous les predictors)
      let predictions = this.generateAllPredictions(state);

      // 5. Détecter les patterns (si activé)
      let patternMatches: PatternMatch[] = [];
      if (this.config.enablePatternDetection) {
        patternMatches = this.projectMemory.detectPatterns(
          this.stateToMetrics(state)
        );

        // Enregistrer les matches
        if (this.config.autoRecordEvents) {
          for (const match of patternMatches) {
            this.projectMemory.recordPatternMatch(match);
          }
        }
      }

      // 6. Calibrer les prédictions si activé
      if (this.config.confidenceCalibration) {
        predictions = this.projectMemory.calibratePredictions(predictions);
      }

      // 7. Générer les prescriptions
      const prescription = this.actionPrescriber.prescribe({
        predictions,
        anomalies,
        cascades,
        state,
      });

      // 8. Calculer EVM
      const evm = this.costPredictor.calculateEVM(state);

      // 9. Générer les insights
      const insights = this.projectMemory.getLearningInsights();

      // 10. Enregistrer les événements si activé
      if (this.config.autoRecordEvents) {
        for (const pred of predictions.slice(0, 5)) { // Top 5
          this.projectMemory.recordPrediction(pred);
        }
        for (const anomaly of anomalies.filter(a => a.severity !== 'low')) {
          this.projectMemory.recordAnomaly(anomaly);
        }
      }

      const result: AnalysisResult = {
        timestamp: new Date(),
        state,
        predictions,
        anomalies,
        cascades,
        patternMatches,
        prescription,
        evm,
        insights,
        executionTimeMs: Date.now() - startTime,
      };

      this.lastAnalysis = result;
      return result;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Diagnostic rapide sans analyse complète
   */
  public quickDiagnose(state: ProjectState): QuickDiagnostic {
    // Calculer un score de santé global
    let score = 100;
    const issues: QuickDiagnostic['topIssues'] = [];

    // Budget
    const evm = this.costPredictor.calculateEVM(state);
    if (evm.cpi < 0.9) {
      score -= 20;
      issues.push({
        title: `Dépassement budget (CPI: ${evm.cpi.toFixed(2)})`,
        severity: evm.cpi < 0.8 ? 'critical' : 'high',
        module: 'budget',
      });
    }

    // Planning
    const scheduleAnalysis = this.schedulePredictor.getStatus(state);
    if (scheduleAnalysis.delayAccumulated > 14) {
      score -= 15;
      issues.push({
        title: `Retard cumulé: ${scheduleAnalysis.delayAccumulated} jours`,
        severity: scheduleAnalysis.delayAccumulated > 30 ? 'critical' : 'high',
        module: 'planning',
      });
    }

    // Commercial
    const commercialAnalysis = this.revenuePredictor.getStatus(state);
    if (commercialAnalysis.occupancyRate < 60) {
      score -= 15;
      issues.push({
        title: `Occupation: ${commercialAnalysis.occupancyRate.toFixed(0)}%`,
        severity: commercialAnalysis.occupancyRate < 40 ? 'critical' : 'high',
        module: 'commercialisation',
      });
    }
    if (!commercialAnalysis.anchorSigned && state.currentMetrics.joursRestants < 180) {
      score -= 20;
      issues.push({
        title: 'Locataire ancre non signé',
        severity: 'critical',
        module: 'commercialisation',
      });
    }

    // Actions en retard
    const tauxRetard = state.currentMetrics.actionsEnRetard /
      Math.max(1, state.currentMetrics.actionsTotal);
    if (tauxRetard > 0.2) {
      score -= 10;
      issues.push({
        title: `${Math.round(tauxRetard * 100)}% des actions en retard`,
        severity: tauxRetard > 0.3 ? 'high' : 'medium',
        module: 'planning',
      });
    }

    score = Math.max(0, score);

    // Déterminer la santé globale
    let overallHealth: QuickDiagnostic['overallHealth'] = 'healthy';
    if (score < 50) overallHealth = 'critical';
    else if (score < 75) overallHealth = 'warning';

    return {
      overallHealth,
      score,
      topIssues: issues.slice(0, 5),
      urgentActions: this.lastAnalysis?.prescription.urgentActions.length ?? 0,
      keyMetrics: {
        budgetStatus: evm.cpi >= 1 ? 'OK' : evm.cpi >= 0.9 ? 'Attention' : 'Critique',
        scheduleStatus: scheduleAnalysis.delayAccumulated <= 7 ? 'OK' :
          scheduleAnalysis.delayAccumulated <= 14 ? 'Attention' : 'Critique',
        commercialStatus: commercialAnalysis.occupancyRate >= 70 ? 'OK' :
          commercialAnalysis.occupancyRate >= 50 ? 'Attention' : 'Critique',
      },
    };
  }

  // ============================================================================
  // SIMULATION WHAT-IF
  // ============================================================================

  /**
   * Exécute une simulation what-if
   */
  public simulate(scenario: WhatIfScenario, state: ProjectState): SimulationResult {
    return this.whatIfSimulator.simulate(scenario, state);
  }

  /**
   * Exécute une simulation Monte Carlo
   */
  public monteCarloSimulation(
    scenario: WhatIfScenario,
    state: ProjectState,
    iterations = 1000
  ): SimulationResult {
    return this.whatIfSimulator.monteCarloSimulation(scenario, state, iterations);
  }

  /**
   * Compare plusieurs scénarios
   */
  public compareScenarios(
    scenarios: WhatIfScenario[],
    state: ProjectState
  ): {
    results: SimulationResult[];
    ranking: string[];
    recommendation: string;
  } {
    return this.whatIfSimulator.compareScenarios(scenarios, state);
  }

  /**
   * Récupère les scénarios prédéfinis
   */
  public getPrebuiltScenarios(): WhatIfScenario[] {
    return this.whatIfSimulator.getPrebuiltScenarios();
  }

  // ============================================================================
  // PRESCRIPTIONS
  // ============================================================================

  /**
   * Récupère les actions prioritaires
   */
  public getPriorityActions(
    state: ProjectState,
    limit = 10
  ): PrioritizedAction[] {
    if (!this.lastAnalysis ||
        this.lastAnalysis.state !== state) {
      // Forcer une nouvelle analyse
      const predictions = this.generateAllPredictions(state);
      const anomalies = this.anomalyDetector.detect(state);
      const cascades = this.correlationEngine.detectCascadeEffects(state, anomalies);

      const prescription = this.actionPrescriber.prescribe({
        predictions,
        anomalies,
        cascades,
        state,
      });

      return prescription.actions.slice(0, limit);
    }

    return this.lastAnalysis.prescription.actions.slice(0, limit);
  }

  /**
   * Récupère les actions P0/P1 uniquement
   */
  public getUrgentActions(state: ProjectState): PrioritizedAction[] {
    const all = this.getPriorityActions(state, 50);
    return all.filter(a => a.priority === 'P0' || a.priority === 'P1');
  }

  // ============================================================================
  // FEEDBACK & LEARNING
  // ============================================================================

  /**
   * Enregistre un feedback utilisateur
   */
  public recordFeedback(
    targetId: string,
    targetType: 'prediction' | 'action' | 'pattern',
    rating: 'accurate' | 'partially_accurate' | 'inaccurate' | 'not_applicable',
    outcome?: {
      wasActionTaken: boolean;
      actualResult: string;
      impactObserved: 'positive' | 'negative' | 'neutral' | 'unknown';
      daysToResolve?: number;
    },
    comment?: string
  ): void {
    this.projectMemory.recordFeedback({
      targetId,
      targetType,
      rating,
      outcome,
      comment,
    });
  }

  /**
   * Récupère les statistiques de feedback
   */
  public getFeedbackStats(): FeedbackStats {
    return this.projectMemory.getFeedbackStats();
  }

  /**
   * Récupère les insights d'apprentissage
   */
  public getLearningInsights(): LearningInsight[] {
    return this.projectMemory.getLearningInsights();
  }

  // ============================================================================
  // MÉMOIRE & PERSISTANCE
  // ============================================================================

  /**
   * Exporte la mémoire pour persistance
   */
  public exportMemory(): MemoryExport {
    return this.projectMemory.export();
  }

  /**
   * Importe une mémoire sauvegardée
   */
  public importMemory(data: MemoryExport): void {
    this.projectMemory.import(data);
  }

  /**
   * Récupère le contexte pour un rapport
   */
  public getAnalysisContext(): ReturnType<ProjectMemory['getAnalysisContext']> {
    return this.projectMemory.getAnalysisContext();
  }

  /**
   * Récupère le timeline du projet
   */
  public getTimeline(): ReturnType<ProjectMemory['getTimeline']> {
    return this.projectMemory.getTimeline();
  }

  // ============================================================================
  // STATUS & DEBUG
  // ============================================================================

  /**
   * Récupère le statut du moteur
   */
  public getStatus(): EngineStatus {
    return {
      version: '2.0.0',
      isRunning: this.isRunning,
      lastAnalysisAt: this.lastAnalysis?.timestamp ?? null,
      modulesLoaded: [
        'AnomalyDetector',
        'CorrelationEngine',
        'RiskPredictor',
        'CostPredictor',
        'SchedulePredictor',
        'RevenuePredictor',
        'WhatIfSimulator',
        'ActionPrescriber',
        'ProjectMemory',
      ],
      config: this.config,
    };
  }

  /**
   * Récupère la dernière analyse
   */
  public getLastAnalysis(): AnalysisResult | null {
    return this.lastAnalysis;
  }

  /**
   * Reset complet du moteur
   */
  public reset(): void {
    this.lastAnalysis = null;
    this.projectMemory.clear();
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private generateAllPredictions(state: ProjectState): Prediction[] {
    const predictions: Prediction[] = [];

    // Risk predictions
    const riskPreds = this.riskPredictor.predict(state);
    predictions.push(...riskPreds);

    // Cost predictions
    const costPreds = this.costPredictor.predict(state);
    predictions.push(...costPreds);

    // Schedule predictions
    const schedulePreds = this.schedulePredictor.predict(state);
    predictions.push(...schedulePreds);

    // Revenue predictions
    const revenuePreds = this.revenuePredictor.predict(state);
    predictions.push(...revenuePreds);

    // Trier par impact et probabilité
    return predictions.sort((a, b) => {
      const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
      if (impactDiff !== 0) return impactDiff;
      return b.probability - a.probability;
    });
  }

  private stateToMetrics(state: ProjectState): Record<string, number> {
    return {
      avancementGlobal: state.currentMetrics.avancementGlobal,
      budgetTotal: state.currentMetrics.budgetTotal,
      budgetEngage: state.currentMetrics.budgetEngage,
      budgetRealise: state.currentMetrics.budgetRealise,
      tauxOccupation: state.currentMetrics.tauxOccupation,
      surfaceLouee: state.currentMetrics.surfaceLouee,
      surfaceTotale: state.currentMetrics.surfaceTotale,
      nombreBaux: state.currentMetrics.nombreBaux,
      nombreLots: state.currentMetrics.nombreLots,
      joursRestants: state.currentMetrics.joursRestants,
      actionsTotal: state.currentMetrics.actionsTotal,
      actionsTerminees: state.currentMetrics.actionsTerminees,
      actionsEnRetard: state.currentMetrics.actionsEnRetard,
      actionsCritiques: state.currentMetrics.actionsCritiques,
      anchorSigned: state.anchorTenant?.signed ? 1 : 0,
      month: new Date().getMonth() + 1,
      dayOfMonth: new Date().getDate(),
    };
  }
}

// ============================================================================
// INSTANCE SINGLETON (optionnel)
// ============================================================================

let engineInstance: Proph3tEngine | null = null;

export function getProph3tEngine(config?: EngineConfig): Proph3tEngine {
  if (!engineInstance) {
    engineInstance = new Proph3tEngine(config);
  }
  return engineInstance;
}

export function resetProph3tEngine(): void {
  if (engineInstance) {
    engineInstance.reset();
  }
  engineInstance = null;
}

// ============================================================================
// EXPORT
// ============================================================================

export default Proph3tEngine;
