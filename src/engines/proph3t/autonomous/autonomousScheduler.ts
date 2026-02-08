// ============================================================================
// PROPH3T ENGINE V2 — AUTONOMOUS SCHEDULER (ADDENDUM)
// ============================================================================
// Planificateur autonome pour scans et rapports automatiques
// ============================================================================

import type { ProjectState } from '../core/types';

// ============================================================================
// TYPES
// ============================================================================

export type TaskType =
  | 'analysis'
  | 'coherence_scan'
  | 'report_generation'
  | 'pattern_detection'
  | 'alert_check'
  // Addendum 2 types
  | 'commitment_check'
  | 'reminder_generation'
  | 'velocity_analysis'
  | 'burn_rate_update'
  | 'fatigue_detection'
  | 'momentum_tracking'
  | 'dependency_check'
  | 'buffer_analysis'
  | 'journal_update'
  | 'benchmark_comparison';
export type TaskFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on_demand';

export interface ScheduledTask {
  id: string;
  name: string;
  type: TaskType;
  frequency: TaskFrequency;
  enabled: boolean;
  cronExpression: string;
  lastRun?: Date;
  nextRun?: Date;
  lastResult?: TaskResult;
  config?: Record<string, unknown>;
  onComplete?: (result: TaskResult) => void;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  timestamp: Date;
  duration: number;
  data?: unknown;
  error?: string;
}

export interface SchedulerStatus {
  isRunning: boolean;
  activeTasks: number;
  completedToday: number;
  failedToday: number;
  nextScheduledTask?: { id: string; name: string; scheduledAt: Date };
  uptime: number;
}

export interface SchedulerConfig {
  checkIntervalMs: number;
  maxConcurrentTasks: number;
  retryOnFailure: boolean;
  maxRetries: number;
  notifyOnFailure: boolean;
}

// ============================================================================
// TÂCHES PRÉDÉFINIES
// ============================================================================

const DEFAULT_TASKS: Omit<ScheduledTask, 'id'>[] = [
  {
    name: 'Analyse quotidienne',
    type: 'analysis',
    frequency: 'daily',
    enabled: true,
    cronExpression: '0 8 * * *',
  },
  {
    name: 'Scan de cohérence',
    type: 'coherence_scan',
    frequency: 'daily',
    enabled: true,
    cronExpression: '0 7 * * *',
  },
  {
    name: 'Vérification alertes',
    type: 'alert_check',
    frequency: 'hourly',
    enabled: true,
    cronExpression: '0 * * * *',
  },
  {
    name: 'Détection patterns',
    type: 'pattern_detection',
    frequency: 'daily',
    enabled: true,
    cronExpression: '30 8 * * *',
  },
  {
    name: 'Rapport hebdo exécutif',
    type: 'report_generation',
    frequency: 'weekly',
    enabled: true,
    cronExpression: '0 9 * * 1',
    config: { reportType: 'executive_summary' },
  },
  {
    name: 'Rapport mensuel complet',
    type: 'report_generation',
    frequency: 'monthly',
    enabled: true,
    cronExpression: '0 9 1 * *',
    config: { reportType: 'full_monthly' },
  },
  // ============================================
  // Addendum 2 - Nouvelles tâches autonomes
  // ============================================
  {
    name: 'Vérification engagements',
    type: 'commitment_check',
    frequency: 'daily',
    enabled: true,
    cronExpression: '0 7 * * *',
  },
  {
    name: 'Génération rappels',
    type: 'reminder_generation',
    frequency: 'daily',
    enabled: true,
    cronExpression: '30 7 * * *',
  },
  {
    name: 'Analyse vélocité',
    type: 'velocity_analysis',
    frequency: 'weekly',
    enabled: true,
    cronExpression: '0 8 * * 1',
  },
  {
    name: 'Mise à jour burn rate',
    type: 'burn_rate_update',
    frequency: 'daily',
    enabled: true,
    cronExpression: '0 9 * * *',
  },
  {
    name: 'Détection fatigue équipe',
    type: 'fatigue_detection',
    frequency: 'weekly',
    enabled: true,
    cronExpression: '0 10 * * 5',
  },
  {
    name: 'Suivi momentum projet',
    type: 'momentum_tracking',
    frequency: 'daily',
    enabled: true,
    cronExpression: '0 18 * * *',
  },
  {
    name: 'Vérification dépendances',
    type: 'dependency_check',
    frequency: 'daily',
    enabled: true,
    cronExpression: '0 7 * * *',
  },
  {
    name: 'Analyse buffers CCPM',
    type: 'buffer_analysis',
    frequency: 'weekly',
    enabled: true,
    cronExpression: '0 9 * * 1',
  },
  {
    name: 'Mise à jour journal projet',
    type: 'journal_update',
    frequency: 'daily',
    enabled: true,
    cronExpression: '0 19 * * *',
  },
  {
    name: 'Comparaison benchmarks',
    type: 'benchmark_comparison',
    frequency: 'monthly',
    enabled: true,
    cronExpression: '0 10 1 * *',
  },
];

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class AutonomousScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private startTime: Date | null = null;
  private completedToday = 0;
  private failedToday = 0;
  private lastDayReset: number = new Date().getDate();

  private config: SchedulerConfig = {
    checkIntervalMs: 60000,
    maxConcurrentTasks: 3,
    retryOnFailure: true,
    maxRetries: 3,
    notifyOnFailure: true,
  };

  private executors: Map<TaskType, (task: ScheduledTask, state?: ProjectState) => Promise<unknown>> = new Map();

  constructor(config?: Partial<SchedulerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeDefaultTasks();
  }

  private initializeDefaultTasks(): void {
    for (const task of DEFAULT_TASKS) {
      const id = `task-${task.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      this.tasks.set(id, {
        ...task,
        id,
        nextRun: this.calculateNextRun(task.cronExpression),
      });
    }
  }

  public registerExecutor(
    type: TaskType,
    executor: (task: ScheduledTask, state?: ProjectState) => Promise<unknown>
  ): void {
    this.executors.set(type, executor);
  }

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = new Date();

    this.checkInterval = setInterval(() => {
      this.checkAndExecuteTasks();
    }, this.config.checkIntervalMs);

    console.log('[AutonomousScheduler] Démarré');
  }

  public stop(): void {
    if (!this.isRunning) return;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isRunning = false;
    console.log('[AutonomousScheduler] Arrêté');
  }

  public getStatus(): SchedulerStatus {
    this.resetDailyCountersIfNeeded();

    const activeTasks = Array.from(this.tasks.values()).filter(t => t.enabled).length;

    let nextTask: { id: string; name: string; scheduledAt: Date } | undefined;
    let earliestRun: Date | null = null;

    for (const task of this.tasks.values()) {
      if (task.enabled && task.nextRun) {
        if (!earliestRun || task.nextRun < earliestRun) {
          earliestRun = task.nextRun;
          nextTask = { id: task.id, name: task.name, scheduledAt: task.nextRun };
        }
      }
    }

    const uptime = this.startTime
      ? Math.floor((Date.now() - this.startTime.getTime()) / 1000)
      : 0;

    return {
      isRunning: this.isRunning,
      activeTasks,
      completedToday: this.completedToday,
      failedToday: this.failedToday,
      nextScheduledTask: nextTask,
      uptime,
    };
  }

  public addTask(task: Omit<ScheduledTask, 'id' | 'nextRun'>): ScheduledTask {
    const id = `task-${task.type}-${Date.now()}`;
    const fullTask: ScheduledTask = {
      ...task,
      id,
      nextRun: this.calculateNextRun(task.cronExpression),
    };

    this.tasks.set(id, fullTask);
    return fullTask;
  }

  public removeTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  public setTaskEnabled(id: string, enabled: boolean): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    task.enabled = enabled;
    if (enabled) {
      task.nextRun = this.calculateNextRun(task.cronExpression);
    }
    return true;
  }

  public listTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  public async runTaskNow(id: string, state?: ProjectState): Promise<TaskResult> {
    const task = this.tasks.get(id);
    if (!task) {
      return {
        taskId: id,
        success: false,
        timestamp: new Date(),
        duration: 0,
        error: 'Tâche non trouvée',
      };
    }

    return this.executeTask(task, state);
  }

  public getDueTasks(): ScheduledTask[] {
    const now = new Date();
    return Array.from(this.tasks.values())
      .filter(t => t.enabled && t.nextRun && t.nextRun <= now);
  }

  private async checkAndExecuteTasks(): Promise<void> {
    this.resetDailyCountersIfNeeded();

    const dueTasks = this.getDueTasks();
    const tasksToRun = dueTasks.slice(0, this.config.maxConcurrentTasks);

    for (const task of tasksToRun) {
      this.executeTask(task).catch(err => {
        console.error(`[Scheduler] Erreur tâche ${task.id}:`, err);
      });
    }
  }

  private async executeTask(task: ScheduledTask, state?: ProjectState): Promise<TaskResult> {
    const startTime = Date.now();
    let result: TaskResult;

    try {
      const executor = this.executors.get(task.type);
      let data: unknown;

      if (executor) {
        data = await executor(task, state);
      } else {
        console.log(`[Scheduler] Exécution: ${task.name}`);
        data = { simulated: true };
      }

      result = {
        taskId: task.id,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data,
      };

      this.completedToday++;

    } catch (error) {
      result = {
        taskId: task.id,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };

      this.failedToday++;

      if (this.config.notifyOnFailure) {
        console.error(`[Scheduler] Échec tâche ${task.name}:`, result.error);
      }
    }

    task.lastRun = result.timestamp;
    task.lastResult = result;
    task.nextRun = this.calculateNextRun(task.cronExpression);

    if (task.onComplete) {
      try {
        task.onComplete(result);
      } catch (e) {
        console.error(`[Scheduler] Erreur callback ${task.id}:`, e);
      }
    }

    return result;
  }

  private calculateNextRun(cronExpression: string): Date {
    const now = new Date();
    const parts = cronExpression.split(' ');

    if (parts.length !== 5) {
      return new Date(now.getTime() + 60 * 60 * 1000);
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const next = new Date(now);
    next.setSeconds(0, 0);

    if (hour !== '*') {
      next.setHours(parseInt(hour));
    }
    if (minute !== '*') {
      next.setMinutes(parseInt(minute));
    } else {
      next.setMinutes(0);
    }

    if (next <= now) {
      if (hour === '*') {
        next.setHours(next.getHours() + 1);
      } else if (dayOfWeek !== '*') {
        next.setDate(next.getDate() + 7);
      } else if (dayOfMonth !== '*') {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setDate(next.getDate() + 1);
      }
    }

    if (dayOfWeek !== '*') {
      const targetDay = parseInt(dayOfWeek);
      while (next.getDay() !== targetDay || next <= now) {
        next.setDate(next.getDate() + 1);
      }
    }

    if (dayOfMonth !== '*') {
      const targetDayOfMonth = parseInt(dayOfMonth);
      next.setDate(targetDayOfMonth);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
    }

    return next;
  }

  private resetDailyCountersIfNeeded(): void {
    const today = new Date().getDate();
    if (today !== this.lastDayReset) {
      this.completedToday = 0;
      this.failedToday = 0;
      this.lastDayReset = today;
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default AutonomousScheduler;
