// ============================================================================
// PROPH3T ENGINE V2 — DYNAMIC RETRO PLANNER
// Rétro-planning dynamique avec mise à jour automatique
// ============================================================================

import type { Action, Jalon } from '../../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface RetroplanItem {
  id: string;
  type: 'jalon' | 'action';
  name: string;
  originalDate: Date;
  currentDate: Date;
  suggestedDate?: Date;
  variance: number; // jours de décalage
  dependencies: string[];
  dependents: string[];
  isCriticalPath: boolean;
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  floatDays: number; // marge libre
}

export interface RetroPlan {
  id: string;
  name: string;
  targetDate: Date;
  items: RetroplanItem[];
  criticalPath: string[];
  totalFloat: number;
  healthScore: number; // 0-100
  lastUpdated: Date;
  version: number;
}

export interface PlanAdjustment {
  itemId: string;
  oldDate: Date;
  newDate: Date;
  reason: string;
  cascadeEffect: string[];
  approved: boolean;
}

export interface CriticalPathAnalysis {
  path: RetroplanItem[];
  totalDuration: number;
  bottlenecks: Array<{
    item: RetroplanItem;
    reason: string;
    impact: number;
  }>;
  recommendations: string[];
}

export interface PlanningScenario {
  name: string;
  description: string;
  adjustments: PlanAdjustment[];
  resultingEndDate: Date;
  healthScore: number;
  feasibility: 'high' | 'medium' | 'low';
}

// ============================================================================
// DYNAMIC RETRO PLANNER
// ============================================================================

export class DynamicRetroPlanner {
  private plan: RetroPlan | null = null;

  // ---------------------------------------------------------------------------
  // CRÉATION DU PLAN
  // ---------------------------------------------------------------------------

  /**
   * Crée un rétro-planning à partir des jalons et actions
   */
  createPlan(
    name: string,
    targetDate: Date,
    jalons: Jalon[],
    actions: Action[]
  ): RetroPlan {
    const items: RetroplanItem[] = [];

    // Convertir les jalons
    for (const jalon of jalons) {
      const originalDate = jalon.date_initiale
        ? new Date(jalon.date_initiale)
        : jalon.date_prevue
          ? new Date(jalon.date_prevue)
          : new Date();

      const currentDate = jalon.date_prevue ? new Date(jalon.date_prevue) : new Date();

      items.push({
        id: jalon.id_jalon,
        type: 'jalon',
        name: jalon.nom,
        originalDate,
        currentDate,
        variance: this.calculateVariance(originalDate, currentDate),
        dependencies: jalon.dependances || [],
        dependents: this.findDependents(jalon.id_jalon, jalons, actions),
        isCriticalPath: false,
        status: this.determineStatus(jalon.statut, currentDate),
        floatDays: 0,
      });
    }

    // Convertir les actions
    for (const action of actions) {
      if (!action.date_prevue) continue;

      const originalDate = action.date_prevue ? new Date(action.date_prevue) : new Date();
      const currentDate = new Date(action.date_prevue);

      items.push({
        id: action.id_action,
        type: 'action',
        name: action.nom,
        originalDate,
        currentDate,
        variance: 0,
        dependencies: action.dependances || [],
        dependents: this.findDependents(action.id_action, jalons, actions),
        isCriticalPath: false,
        status: this.determineStatus(action.statut, currentDate),
        floatDays: 0,
      });
    }

    // Calculer le chemin critique
    const criticalPath = this.calculateCriticalPath(items, targetDate);

    // Marquer les éléments du chemin critique
    for (const item of items) {
      item.isCriticalPath = criticalPath.includes(item.id);
    }

    // Calculer les marges
    this.calculateFloats(items, targetDate);

    // Score de santé
    const healthScore = this.calculateHealthScore(items);

    this.plan = {
      id: `plan-${Date.now()}`,
      name,
      targetDate,
      items,
      criticalPath,
      totalFloat: items.filter(i => !i.isCriticalPath).reduce((sum, i) => sum + i.floatDays, 0),
      healthScore,
      lastUpdated: new Date(),
      version: 1,
    };

    return this.plan;
  }

  private calculateVariance(original: Date, current: Date): number {
    return Math.ceil((current.getTime() - original.getTime()) / (1000 * 60 * 60 * 24));
  }

  private determineStatus(
    status: string | undefined,
    plannedDate: Date
  ): RetroplanItem['status'] {
    if (status === 'termine') return 'completed';
    if (status === 'bloque') return 'delayed';

    const now = new Date();
    const daysUntil = Math.ceil((plannedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'delayed';
    if (daysUntil <= 7) return 'at_risk';
    return 'on_track';
  }

  private findDependents(id: string, jalons: Jalon[], actions: Action[]): string[] {
    const dependents: string[] = [];

    for (const j of jalons) {
      if (j.dependances?.includes(id)) {
        dependents.push(j.id_jalon);
      }
    }

    for (const a of actions) {
      if (a.dependances?.includes(id)) {
        dependents.push(a.id_action);
      }
    }

    return dependents;
  }

  private calculateCriticalPath(items: RetroplanItem[], targetDate: Date): string[] {
    // Algorithme simplifié: trouver le chemin le plus long jusqu'à la date cible
    const sortedItems = [...items]
      .filter(i => i.status !== 'completed')
      .sort((a, b) => b.currentDate.getTime() - a.currentDate.getTime());

    const criticalPath: string[] = [];

    // Prendre les éléments les plus proches de la date cible avec des dépendants
    for (const item of sortedItems) {
      if (item.dependents.length > 0 || item.type === 'jalon') {
        criticalPath.push(item.id);
        if (criticalPath.length >= 10) break;
      }
    }

    return criticalPath;
  }

  private calculateFloats(items: RetroplanItem[], targetDate: Date): void {
    for (const item of items) {
      if (item.isCriticalPath) {
        item.floatDays = 0;
        continue;
      }

      // Trouver la date la plus proche des dépendants
      let latestDependentDate = targetDate;
      for (const depId of item.dependents) {
        const dep = items.find(i => i.id === depId);
        if (dep && new Date(dep.currentDate) < latestDependentDate) {
          latestDependentDate = new Date(dep.currentDate);
        }
      }

      item.floatDays = Math.max(0, Math.ceil(
        (latestDependentDate.getTime() - item.currentDate.getTime()) / (1000 * 60 * 60 * 24)
      ));
    }
  }

  private calculateHealthScore(items: RetroplanItem[]): number {
    if (items.length === 0) return 100;

    let score = 100;

    // Pénalités
    const delayed = items.filter(i => i.status === 'delayed').length;
    const atRisk = items.filter(i => i.status === 'at_risk').length;
    const totalVariance = items.reduce((sum, i) => sum + Math.max(0, i.variance), 0);

    score -= delayed * 10;
    score -= atRisk * 5;
    score -= Math.min(30, totalVariance);

    // Bonus pour éléments complétés
    const completed = items.filter(i => i.status === 'completed').length;
    score += (completed / items.length) * 20;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ---------------------------------------------------------------------------
  // ANALYSE DU CHEMIN CRITIQUE
  // ---------------------------------------------------------------------------

  analyzeCriticalPath(): CriticalPathAnalysis | null {
    if (!this.plan) return null;

    const criticalItems = this.plan.items.filter(i => i.isCriticalPath);
    const sortedPath = criticalItems.sort((a, b) =>
      a.currentDate.getTime() - b.currentDate.getTime()
    );

    // Durée totale
    const totalDuration = sortedPath.length > 0
      ? Math.ceil(
        (this.plan.targetDate.getTime() - sortedPath[0].currentDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      : 0;

    // Identifier les goulots d'étranglement
    const bottlenecks = sortedPath
      .filter(item => item.status === 'delayed' || item.status === 'at_risk')
      .map(item => ({
        item,
        reason: item.status === 'delayed' ? 'En retard' : 'À risque',
        impact: item.dependents.length * 5,
      }));

    // Recommandations
    const recommendations: string[] = [];
    if (bottlenecks.length > 0) {
      recommendations.push('Prioriser la résolution des goulots d\'étranglement sur le chemin critique');
    }
    if (sortedPath.some(i => i.variance > 7)) {
      recommendations.push('Plusieurs jalons critiques accusent un retard significatif - revoir les estimations');
    }
    if (sortedPath.length > 15) {
      recommendations.push('Chemin critique long - envisager la parallélisation de certaines tâches');
    }

    return {
      path: sortedPath,
      totalDuration,
      bottlenecks,
      recommendations,
    };
  }

  // ---------------------------------------------------------------------------
  // AJUSTEMENTS
  // ---------------------------------------------------------------------------

  /**
   * Propose un ajustement de date avec analyse d'impact
   */
  proposeAdjustment(itemId: string, newDate: Date, reason: string): PlanAdjustment | null {
    if (!this.plan) return null;

    const item = this.plan.items.find(i => i.id === itemId);
    if (!item) return null;

    const cascadeEffect: string[] = [];

    // Analyser l'impact en cascade
    const shift = Math.ceil((newDate.getTime() - item.currentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (shift > 0) {
      this.findCascadeEffect(itemId, shift, cascadeEffect);
    }

    return {
      itemId,
      oldDate: item.currentDate,
      newDate,
      reason,
      cascadeEffect,
      approved: false,
    };
  }

  private findCascadeEffect(itemId: string, shift: number, affected: string[]): void {
    if (!this.plan) return;

    const item = this.plan.items.find(i => i.id === itemId);
    if (!item) return;

    for (const depId of item.dependents) {
      const dep = this.plan.items.find(i => i.id === depId);
      if (dep && dep.floatDays < shift) {
        affected.push(depId);
        this.findCascadeEffect(depId, shift - dep.floatDays, affected);
      }
    }
  }

  /**
   * Applique un ajustement au plan
   */
  applyAdjustment(adjustment: PlanAdjustment): RetroPlan | null {
    if (!this.plan) return null;

    const item = this.plan.items.find(i => i.id === adjustment.itemId);
    if (!item) return null;

    const shift = Math.ceil(
      (adjustment.newDate.getTime() - item.currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Mettre à jour l'élément principal
    item.currentDate = adjustment.newDate;
    item.variance = this.calculateVariance(item.originalDate, adjustment.newDate);
    item.suggestedDate = undefined;

    // Mettre à jour les éléments affectés
    for (const affectedId of adjustment.cascadeEffect) {
      const affected = this.plan.items.find(i => i.id === affectedId);
      if (affected) {
        const newDate = new Date(affected.currentDate);
        newDate.setDate(newDate.getDate() + Math.max(0, shift - affected.floatDays));
        affected.currentDate = newDate;
        affected.variance = this.calculateVariance(affected.originalDate, newDate);
      }
    }

    // Recalculer
    this.plan.criticalPath = this.calculateCriticalPath(this.plan.items, this.plan.targetDate);
    this.calculateFloats(this.plan.items, this.plan.targetDate);
    this.plan.healthScore = this.calculateHealthScore(this.plan.items);
    this.plan.lastUpdated = new Date();
    this.plan.version++;

    return this.plan;
  }

  // ---------------------------------------------------------------------------
  // SCÉNARIOS
  // ---------------------------------------------------------------------------

  /**
   * Génère des scénarios de planning alternatifs
   */
  generateScenarios(): PlanningScenario[] {
    if (!this.plan) return [];

    const scenarios: PlanningScenario[] = [];
    const delayedItems = this.plan.items.filter(i => i.status === 'delayed' && i.isCriticalPath);

    // Scénario 1: Rattrapage agressif
    if (delayedItems.length > 0) {
      const adjustments: PlanAdjustment[] = delayedItems.map(item => ({
        itemId: item.id,
        oldDate: item.currentDate,
        newDate: item.originalDate,
        reason: 'Rattrapage des retards',
        cascadeEffect: [],
        approved: false,
      }));

      scenarios.push({
        name: 'Rattrapage agressif',
        description: 'Revenir aux dates initiales pour tous les éléments en retard',
        adjustments,
        resultingEndDate: this.plan.targetDate,
        healthScore: 85,
        feasibility: 'low',
      });
    }

    // Scénario 2: Report contrôlé
    const maxDelay = Math.max(...this.plan.items.map(i => i.variance), 0);
    if (maxDelay > 0) {
      const newEndDate = new Date(this.plan.targetDate);
      newEndDate.setDate(newEndDate.getDate() + Math.ceil(maxDelay / 2));

      scenarios.push({
        name: 'Report contrôlé',
        description: `Décaler la date cible de ${Math.ceil(maxDelay / 2)} jours`,
        adjustments: [],
        resultingEndDate: newEndDate,
        healthScore: 75,
        feasibility: 'high',
      });
    }

    // Scénario 3: Réduction de scope
    const nonCriticalDelayed = this.plan.items.filter(
      i => i.status === 'delayed' && !i.isCriticalPath
    );
    if (nonCriticalDelayed.length > 0) {
      scenarios.push({
        name: 'Réduction de scope',
        description: `Reporter ${nonCriticalDelayed.length} éléments non-critiques`,
        adjustments: nonCriticalDelayed.map(item => ({
          itemId: item.id,
          oldDate: item.currentDate,
          newDate: new Date(this.plan!.targetDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          reason: 'Report post-projet',
          cascadeEffect: [],
          approved: false,
        })),
        resultingEndDate: this.plan.targetDate,
        healthScore: 90,
        feasibility: 'medium',
      });
    }

    return scenarios;
  }

  // ---------------------------------------------------------------------------
  // UTILITAIRES
  // ---------------------------------------------------------------------------

  getPlan(): RetroPlan | null {
    return this.plan;
  }

  getItem(id: string): RetroplanItem | undefined {
    return this.plan?.items.find(i => i.id === id);
  }

  /**
   * Met à jour le plan avec de nouvelles données
   */
  refresh(jalons: Jalon[], actions: Action[]): RetroPlan | null {
    if (!this.plan) return null;

    return this.createPlan(
      this.plan.name,
      this.plan.targetDate,
      jalons,
      actions
    );
  }
}

export default DynamicRetroPlanner;
