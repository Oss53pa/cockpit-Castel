// ============================================================================
// PROPH3T ENGINE V2 — CRITICAL CHAIN MANAGER
// Gestion de la chaîne critique (CCPM)
// ============================================================================

import type { Action, Jalon } from '../../../types';
import type { Buffer } from '../dependencies/bufferCalculator';

// ============================================================================
// TYPES
// ============================================================================

export interface ChainTask {
  id: string;
  name: string;
  duration: number; // jours
  aggressiveDuration: number; // durée sans marge de sécurité
  startDate: Date;
  endDate: Date;
  resourceId?: string;
  predecessors: string[];
  successors: string[];
  isOnCriticalChain: boolean;
  completionPercent: number;
}

export interface CriticalChain {
  id: string;
  name: string;
  tasks: ChainTask[];
  totalDuration: number;
  projectBuffer: Buffer;
  feedingBuffers: Buffer[];
  startDate: Date;
  endDate: Date;
}

export interface ChainStatus {
  projectBufferConsumption: number; // %
  chainProgress: number; // %
  status: 'green' | 'yellow' | 'red';
  feverChartPosition: { x: number; y: number };
  trend: 'improving' | 'stable' | 'degrading';
}

export interface FeverChartData {
  points: Array<{
    date: Date;
    chainCompletion: number;
    bufferConsumption: number;
    zone: 'green' | 'yellow' | 'red';
  }>;
  thresholds: {
    greenYellow: number;
    yellowRed: number;
  };
}

export interface ResourceConflict {
  resourceId: string;
  taskIds: string[];
  conflictDates: Date[];
  severity: 'high' | 'medium' | 'low';
  resolution?: string;
}

// ============================================================================
// CRITICAL CHAIN MANAGER
// ============================================================================

export class CriticalChainManager {
  private chain: CriticalChain | null = null;
  private statusHistory: ChainStatus[] = [];

  // ---------------------------------------------------------------------------
  // CONSTRUCTION DE LA CHAÎNE
  // ---------------------------------------------------------------------------

  /**
   * Construit la chaîne critique à partir des actions et jalons
   */
  buildChain(
    name: string,
    actions: Action[],
    jalons: Jalon[],
    projectEndDate: Date
  ): CriticalChain {
    // Convertir les actions en tâches
    const tasks: ChainTask[] = actions
      .filter(a => a.date_prevue && a.statut !== 'annule')
      .map(a => this.actionToTask(a));

    // Identifier la chaîne critique (chemin le plus long)
    const criticalPath = this.identifyCriticalPath(tasks, projectEndDate);

    // Marquer les tâches sur la chaîne critique
    for (const task of tasks) {
      task.isOnCriticalChain = criticalPath.includes(task.id);
    }

    // Calculer les buffers
    const chainTasks = tasks.filter(t => t.isOnCriticalChain);
    const totalDuration = chainTasks.reduce((sum, t) => sum + t.aggressiveDuration, 0);

    // Buffer projet = 50% de la somme des marges retirées
    const safetyMargin = chainTasks.reduce((sum, t) => sum + (t.duration - t.aggressiveDuration), 0);
    const projectBuffer: Buffer = {
      id: 'pb-main',
      type: 'project',
      name: 'Buffer Projet Principal',
      originalDays: Math.round(safetyMargin * 0.5),
      consumedDays: 0,
      remainingDays: Math.round(safetyMargin * 0.5),
      consumptionRate: 0,
      linkedEntities: criticalPath,
      status: 'healthy',
    };

    // Buffers d'alimentation pour les chaînes non-critiques
    const feedingBuffers = this.calculateFeedingBuffers(tasks, criticalPath);

    // Dates
    const startDate = tasks.length > 0
      ? new Date(Math.min(...tasks.map(t => t.startDate.getTime())))
      : new Date();

    this.chain = {
      id: `chain-${Date.now()}`,
      name,
      tasks,
      totalDuration,
      projectBuffer,
      feedingBuffers,
      startDate,
      endDate: projectEndDate,
    };

    return this.chain;
  }

  private actionToTask(action: Action): ChainTask {
    const startDate = action.date_debut_reelle
      ? new Date(action.date_debut_reelle)
      : new Date();
    const endDate = action.date_prevue ? new Date(action.date_prevue) : new Date();

    const duration = Math.max(1, Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Durée agressive = durée sans la marge de sécurité (typiquement 50%)
    const aggressiveDuration = Math.ceil(duration * 0.5);

    return {
      id: action.id_action,
      name: action.nom,
      duration,
      aggressiveDuration,
      startDate,
      endDate,
      resourceId: action.responsable || undefined,
      predecessors: action.dependances || [],
      successors: [],
      isOnCriticalChain: false,
      completionPercent: action.statut === 'termine' ? 100 : (action.avancement || 0),
    };
  }

  private identifyCriticalPath(tasks: ChainTask[], endDate: Date): string[] {
    // Algorithme simplifié: chemin le plus long en backward pass
    const sortedTasks = [...tasks].sort((a, b) =>
      b.endDate.getTime() - a.endDate.getTime()
    );

    const path: string[] = [];
    let currentDate = endDate;

    for (const task of sortedTasks) {
      if (task.endDate <= currentDate && task.completionPercent < 100) {
        path.push(task.id);
        currentDate = task.startDate;
      }
    }

    return path.reverse();
  }

  private calculateFeedingBuffers(tasks: ChainTask[], criticalPath: string[]): Buffer[] {
    const buffers: Buffer[] = [];

    // Grouper les tâches non-critiques par point d'entrée dans la chaîne critique
    const nonCriticalTasks = tasks.filter(t => !criticalPath.includes(t.id));

    for (const task of nonCriticalTasks) {
      // Vérifier si cette tâche alimente la chaîne critique
      const feedsIntoCritical = task.successors?.some(s => criticalPath.includes(s));

      if (feedsIntoCritical) {
        const safetyMargin = task.duration - task.aggressiveDuration;
        buffers.push({
          id: `fb-${task.id}`,
          type: 'feeding',
          name: `Buffer: ${task.name}`,
          originalDays: Math.max(1, Math.round(safetyMargin * 0.5)),
          consumedDays: 0,
          remainingDays: Math.max(1, Math.round(safetyMargin * 0.5)),
          consumptionRate: 0,
          linkedEntities: [task.id],
          status: 'healthy',
        });
      }
    }

    return buffers;
  }

  // ---------------------------------------------------------------------------
  // SUIVI DE STATUT
  // ---------------------------------------------------------------------------

  /**
   * Calcule le statut actuel de la chaîne critique
   */
  calculateStatus(): ChainStatus | null {
    if (!this.chain) return null;

    const criticalTasks = this.chain.tasks.filter(t => t.isOnCriticalChain);

    // Progression de la chaîne
    const totalWeight = criticalTasks.reduce((sum, t) => sum + t.aggressiveDuration, 0);
    const completedWeight = criticalTasks.reduce((sum, t) =>
      sum + (t.aggressiveDuration * t.completionPercent / 100), 0
    );
    const chainProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    // Consommation du buffer
    const bufferConsumption = this.chain.projectBuffer.originalDays > 0
      ? (this.chain.projectBuffer.consumedDays / this.chain.projectBuffer.originalDays) * 100
      : 0;

    // Position sur le fever chart
    const feverChartPosition = {
      x: chainProgress,
      y: bufferConsumption,
    };

    // Déterminer la zone
    let status: 'green' | 'yellow' | 'red';
    const ratio = chainProgress > 0 ? bufferConsumption / chainProgress : 0;

    if (ratio < 0.5) {
      status = 'green';
    } else if (ratio < 1.0) {
      status = 'yellow';
    } else {
      status = 'red';
    }

    // Tendance
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (this.statusHistory.length >= 2) {
      const prev = this.statusHistory[this.statusHistory.length - 1];
      const prevRatio = prev.chainProgress > 0 ? prev.projectBufferConsumption / prev.chainProgress : 0;
      if (ratio < prevRatio - 0.1) trend = 'improving';
      else if (ratio > prevRatio + 0.1) trend = 'degrading';
    }

    const currentStatus: ChainStatus = {
      projectBufferConsumption: Math.round(bufferConsumption),
      chainProgress: Math.round(chainProgress),
      status,
      feverChartPosition,
      trend,
    };

    this.statusHistory.push(currentStatus);

    return currentStatus;
  }

  /**
   * Génère les données pour le fever chart
   */
  generateFeverChartData(): FeverChartData | null {
    if (!this.chain) return null;

    const points = this.statusHistory.map(s => ({
      date: new Date(),
      chainCompletion: s.chainProgress,
      bufferConsumption: s.projectBufferConsumption,
      zone: s.status,
    }));

    return {
      points,
      thresholds: {
        greenYellow: 50,
        yellowRed: 100,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // GESTION DES CONFLITS DE RESSOURCES
  // ---------------------------------------------------------------------------

  /**
   * Détecte les conflits de ressources
   */
  detectResourceConflicts(): ResourceConflict[] {
    if (!this.chain) return [];

    const conflicts: ResourceConflict[] = [];
    const resourceTasks = new Map<string, ChainTask[]>();

    // Grouper par ressource
    for (const task of this.chain.tasks) {
      if (task.resourceId && task.completionPercent < 100) {
        const existing = resourceTasks.get(task.resourceId) || [];
        resourceTasks.set(task.resourceId, [...existing, task]);
      }
    }

    // Détecter les chevauchements
    for (const [resourceId, tasks] of resourceTasks) {
      for (let i = 0; i < tasks.length; i++) {
        for (let j = i + 1; j < tasks.length; j++) {
          const taskA = tasks[i];
          const taskB = tasks[j];

          // Vérifier le chevauchement
          if (taskA.startDate < taskB.endDate && taskA.endDate > taskB.startDate) {
            const conflictDates: Date[] = [];
            const start = new Date(Math.max(taskA.startDate.getTime(), taskB.startDate.getTime()));
            const end = new Date(Math.min(taskA.endDate.getTime(), taskB.endDate.getTime()));

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              conflictDates.push(new Date(d));
            }

            conflicts.push({
              resourceId,
              taskIds: [taskA.id, taskB.id],
              conflictDates,
              severity: taskA.isOnCriticalChain || taskB.isOnCriticalChain ? 'high' : 'medium',
              resolution: this.suggestResolution(taskA, taskB),
            });
          }
        }
      }
    }

    return conflicts;
  }

  private suggestResolution(taskA: ChainTask, taskB: ChainTask): string {
    if (taskA.isOnCriticalChain && !taskB.isOnCriticalChain) {
      return `Reporter "${taskB.name}" après "${taskA.name}"`;
    }
    if (taskB.isOnCriticalChain && !taskA.isOnCriticalChain) {
      return `Reporter "${taskA.name}" après "${taskB.name}"`;
    }
    return 'Affecter une ressource supplémentaire ou séquencer les tâches';
  }

  // ---------------------------------------------------------------------------
  // MISE À JOUR
  // ---------------------------------------------------------------------------

  /**
   * Met à jour la progression d'une tâche
   */
  updateTaskProgress(taskId: string, completionPercent: number): ChainTask | null {
    if (!this.chain) return null;

    const task = this.chain.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const previousPercent = task.completionPercent;
    task.completionPercent = Math.min(100, Math.max(0, completionPercent));

    // Si la tâche est sur la chaîne critique et en retard, consommer le buffer
    if (task.isOnCriticalChain && task.completionPercent < 100) {
      const now = new Date();
      if (now > task.endDate) {
        const delay = Math.ceil((now.getTime() - task.endDate.getTime()) / (1000 * 60 * 60 * 24));
        this.chain.projectBuffer.consumedDays = Math.min(
          this.chain.projectBuffer.originalDays,
          this.chain.projectBuffer.consumedDays + delay
        );
        this.chain.projectBuffer.remainingDays = this.chain.projectBuffer.originalDays - this.chain.projectBuffer.consumedDays;
      }
    }

    return task;
  }

  // ---------------------------------------------------------------------------
  // UTILITAIRES
  // ---------------------------------------------------------------------------

  getChain(): CriticalChain | null {
    return this.chain;
  }

  getTask(id: string): ChainTask | undefined {
    return this.chain?.tasks.find(t => t.id === id);
  }

  getStatusHistory(): ChainStatus[] {
    return [...this.statusHistory];
  }

  clearHistory(): void {
    this.statusHistory = [];
  }
}

export default CriticalChainManager;
