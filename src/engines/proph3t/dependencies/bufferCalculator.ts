// ============================================================================
// PROPH3T ENGINE V2 — BUFFER CALCULATOR
// Calcule et optimise les buffers de sécurité
// ============================================================================

import type { Action, Jalon } from '../../../types';
import type { ExternalDependency } from './externalDependencyMap';

// ============================================================================
// TYPES
// ============================================================================

export type BufferType = 'project' | 'feeding' | 'resource' | 'dependency';

export interface Buffer {
  id: string;
  type: BufferType;
  name: string;
  originalDays: number;
  consumedDays: number;
  remainingDays: number;
  consumptionRate: number; // jours/semaine
  linkedEntities: string[];
  status: 'healthy' | 'warning' | 'critical' | 'depleted';
  projectedDepletionDate?: Date;
}

export interface BufferAnalysis {
  buffers: Buffer[];
  totalOriginal: number;
  totalConsumed: number;
  totalRemaining: number;
  overallHealth: 'healthy' | 'warning' | 'critical';
  recommendations: BufferRecommendation[];
}

export interface BufferRecommendation {
  bufferId: string;
  type: 'increase' | 'decrease' | 'reallocate' | 'alert';
  currentValue: number;
  recommendedValue: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BufferAllocation {
  entityId: string;
  entityType: 'action' | 'jalon' | 'dependency';
  allocatedDays: number;
  rationale: string;
}

export interface BufferConfig {
  defaultProjectBuffer: number; // % du chemin critique
  defaultFeedingBuffer: number; // % de la chaîne alimentante
  defaultResourceBuffer: number; // % pour les ressources
  minBufferDays: number;
  maxBufferDays: number;
  criticalThreshold: number; // % restant pour alerte critique
  warningThreshold: number; // % restant pour warning
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: BufferConfig = {
  defaultProjectBuffer: 25,
  defaultFeedingBuffer: 50,
  defaultResourceBuffer: 15,
  minBufferDays: 3,
  maxBufferDays: 60,
  criticalThreshold: 20,
  warningThreshold: 50,
};

// ============================================================================
// BUFFER CALCULATOR
// ============================================================================

export class BufferCalculator {
  private config: BufferConfig;
  private buffers: Map<string, Buffer> = new Map();

  constructor(config: Partial<BufferConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // CALCUL DE BUFFERS
  // ---------------------------------------------------------------------------

  /**
   * Calcule le buffer recommandé pour un projet basé sur son chemin critique
   */
  calculateProjectBuffer(
    jalons: Jalon[],
    actions: Action[],
    projectEndDate: Date
  ): Buffer {
    // Identifier le chemin critique (simplifié)
    const criticalJalons = jalons.filter(j =>
      j.statut !== 'termine' && j.date_prevue
    ).sort((a, b) =>
      new Date(a.date_prevue!).getTime() - new Date(b.date_prevue!).getTime()
    );

    // Durée totale du chemin critique
    const now = new Date();
    const totalDays = Math.ceil(
      (projectEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Buffer = % du chemin critique
    const originalDays = Math.min(
      Math.max(
        Math.round(totalDays * (this.config.defaultProjectBuffer / 100)),
        this.config.minBufferDays
      ),
      this.config.maxBufferDays
    );

    // Calcul de la consommation (basé sur les retards actuels)
    const overdueJalons = criticalJalons.filter(j =>
      j.date_prevue && new Date(j.date_prevue) < now
    );
    const consumedDays = overdueJalons.reduce((sum, j) => {
      const delay = Math.ceil((now.getTime() - new Date(j.date_prevue!).getTime()) / (1000 * 60 * 60 * 24));
      return sum + delay;
    }, 0);

    const buffer: Buffer = {
      id: 'buffer-project',
      type: 'project',
      name: 'Buffer Projet',
      originalDays,
      consumedDays: Math.min(consumedDays, originalDays),
      remainingDays: Math.max(0, originalDays - consumedDays),
      consumptionRate: this.calculateConsumptionRate(consumedDays, 30), // 30 derniers jours
      linkedEntities: criticalJalons.map(j => j.id_jalon),
      status: 'healthy',
    };

    buffer.status = this.determineBufferStatus(buffer);
    buffer.projectedDepletionDate = this.projectDepletion(buffer);

    this.buffers.set(buffer.id, buffer);
    return buffer;
  }

  /**
   * Calcule les buffers pour les dépendances externes
   */
  calculateDependencyBuffers(dependencies: ExternalDependency[]): Buffer[] {
    const buffers: Buffer[] = [];

    for (const dep of dependencies) {
      if (dep.status === 'resolved') continue;

      const originalDays = dep.buffer;
      const now = new Date();
      const expectedDate = new Date(dep.expectedDate);

      let consumedDays = 0;
      if (expectedDate < now) {
        consumedDays = Math.ceil((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      const buffer: Buffer = {
        id: `buffer-dep-${dep.id}`,
        type: 'dependency',
        name: `Buffer: ${dep.name}`,
        originalDays,
        consumedDays: Math.min(consumedDays, originalDays),
        remainingDays: Math.max(0, originalDays - consumedDays),
        consumptionRate: 0,
        linkedEntities: [dep.id],
        status: 'healthy',
      };

      buffer.status = this.determineBufferStatus(buffer);
      buffer.projectedDepletionDate = this.projectDepletion(buffer);

      this.buffers.set(buffer.id, buffer);
      buffers.push(buffer);
    }

    return buffers;
  }

  /**
   * Calcule les buffers d'alimentation (feeding buffers) pour les chaînes non-critiques
   */
  calculateFeedingBuffers(actions: Action[]): Buffer[] {
    const buffers: Buffer[] = [];

    // Grouper par responsable/équipe
    const owners = [...new Set(actions.map(a => a.responsable).filter(Boolean))];

    for (const owner of owners) {
      const ownerActions = actions.filter(a =>
        a.responsable === owner && a.statut !== 'termine'
      );

      if (ownerActions.length === 0) continue;

      // Calculer la durée totale des actions
      const totalDays = ownerActions.reduce((sum, a) => {
        if (a.date_prevue && a.date_debut_reelle) {
          const duration = Math.ceil(
            (new Date(a.date_prevue).getTime() - new Date(a.date_debut_reelle).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + Math.max(0, duration);
        }
        return sum + 5; // Durée par défaut
      }, 0);

      const originalDays = Math.min(
        Math.max(
          Math.round(totalDays * (this.config.defaultFeedingBuffer / 100)),
          this.config.minBufferDays
        ),
        this.config.maxBufferDays / 2
      );

      // Calcul consommation
      const now = new Date();
      const overdueCount = ownerActions.filter(a =>
        a.date_prevue && new Date(a.date_prevue) < now
      ).length;
      const consumedDays = overdueCount * 2; // 2 jours par action en retard

      const buffer: Buffer = {
        id: `buffer-feeding-${owner}`,
        type: 'feeding',
        name: `Buffer: ${owner}`,
        originalDays,
        consumedDays: Math.min(consumedDays, originalDays),
        remainingDays: Math.max(0, originalDays - consumedDays),
        consumptionRate: this.calculateConsumptionRate(consumedDays, 14),
        linkedEntities: ownerActions.map(a => a.id_action),
        status: 'healthy',
      };

      buffer.status = this.determineBufferStatus(buffer);
      buffer.projectedDepletionDate = this.projectDepletion(buffer);

      this.buffers.set(buffer.id, buffer);
      buffers.push(buffer);
    }

    return buffers;
  }

  private calculateConsumptionRate(consumedDays: number, periodDays: number): number {
    // Jours consommés par semaine
    return Math.round((consumedDays / periodDays) * 7 * 10) / 10;
  }

  private determineBufferStatus(buffer: Buffer): Buffer['status'] {
    const remainingPercent = (buffer.remainingDays / buffer.originalDays) * 100;

    if (remainingPercent <= 0) return 'depleted';
    if (remainingPercent <= this.config.criticalThreshold) return 'critical';
    if (remainingPercent <= this.config.warningThreshold) return 'warning';
    return 'healthy';
  }

  private projectDepletion(buffer: Buffer): Date | undefined {
    if (buffer.consumptionRate <= 0 || buffer.remainingDays <= 0) {
      return buffer.remainingDays <= 0 ? new Date() : undefined;
    }

    const weeksToDepletion = buffer.remainingDays / buffer.consumptionRate;
    const depletionDate = new Date();
    depletionDate.setDate(depletionDate.getDate() + Math.ceil(weeksToDepletion * 7));
    return depletionDate;
  }

  // ---------------------------------------------------------------------------
  // ANALYSE
  // ---------------------------------------------------------------------------

  analyzeBuffers(): BufferAnalysis {
    const all = Array.from(this.buffers.values());

    const totalOriginal = all.reduce((sum, b) => sum + b.originalDays, 0);
    const totalConsumed = all.reduce((sum, b) => sum + b.consumedDays, 0);
    const totalRemaining = all.reduce((sum, b) => sum + b.remainingDays, 0);

    // Santé globale
    let overallHealth: 'healthy' | 'warning' | 'critical';
    const criticalCount = all.filter(b => b.status === 'critical' || b.status === 'depleted').length;
    const warningCount = all.filter(b => b.status === 'warning').length;

    if (criticalCount > 0) {
      overallHealth = 'critical';
    } else if (warningCount > all.length / 2) {
      overallHealth = 'warning';
    } else {
      overallHealth = 'healthy';
    }

    // Recommandations
    const recommendations = this.generateRecommendations(all);

    return {
      buffers: all,
      totalOriginal,
      totalConsumed,
      totalRemaining,
      overallHealth,
      recommendations,
    };
  }

  private generateRecommendations(buffers: Buffer[]): BufferRecommendation[] {
    const recs: BufferRecommendation[] = [];

    for (const buffer of buffers) {
      // Buffer critique ou épuisé
      if (buffer.status === 'critical' || buffer.status === 'depleted') {
        recs.push({
          bufferId: buffer.id,
          type: 'increase',
          currentValue: buffer.originalDays,
          recommendedValue: Math.ceil(buffer.originalDays * 1.5),
          reason: `Buffer ${buffer.status === 'depleted' ? 'épuisé' : 'critique'} - augmentation recommandée`,
          priority: 'high',
        });
      }
      // Buffer sous-utilisé
      else if (buffer.remainingDays > buffer.originalDays * 0.9 && buffer.originalDays > 10) {
        recs.push({
          bufferId: buffer.id,
          type: 'reallocate',
          currentValue: buffer.originalDays,
          recommendedValue: Math.ceil(buffer.originalDays * 0.75),
          reason: 'Buffer peu consommé - possibilité de réallocation',
          priority: 'low',
        });
      }
      // Taux de consommation élevé
      else if (buffer.consumptionRate > 3) {
        recs.push({
          bufferId: buffer.id,
          type: 'alert',
          currentValue: buffer.consumptionRate,
          recommendedValue: 1,
          reason: `Consommation rapide (${buffer.consumptionRate}j/semaine) - surveiller de près`,
          priority: 'medium',
        });
      }
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // ---------------------------------------------------------------------------
  // ALLOCATION
  // ---------------------------------------------------------------------------

  /**
   * Propose une allocation optimale des buffers
   */
  proposeAllocation(
    totalBufferDays: number,
    actions: Action[],
    jalons: Jalon[]
  ): BufferAllocation[] {
    const allocations: BufferAllocation[] = [];

    // Identifier les éléments critiques
    const criticalJalons = jalons.filter(j =>
      j.statut !== 'termine' && j.criticite && j.criticite >= 4
    );
    const criticalActions = actions.filter(a =>
      a.priorite && a.priorite >= 4
    );

    // Répartir: 40% projet, 30% jalons critiques, 30% actions critiques
    const projectBuffer = Math.round(totalBufferDays * 0.4);
    const jalonBuffer = Math.round(totalBufferDays * 0.3);
    const actionBuffer = Math.round(totalBufferDays * 0.3);

    // Allocation projet
    allocations.push({
      entityId: 'project',
      entityType: 'jalon',
      allocatedDays: projectBuffer,
      rationale: 'Buffer projet global pour le chemin critique',
    });

    // Allocation jalons critiques
    if (criticalJalons.length > 0) {
      const perJalon = Math.round(jalonBuffer / criticalJalons.length);
      for (const j of criticalJalons) {
        allocations.push({
          entityId: j.id_jalon,
          entityType: 'jalon',
          allocatedDays: perJalon,
          rationale: `Buffer pour jalon critique: ${j.nom}`,
        });
      }
    }

    // Allocation actions critiques
    if (criticalActions.length > 0) {
      const perAction = Math.round(actionBuffer / criticalActions.length);
      for (const a of criticalActions) {
        allocations.push({
          entityId: a.id_action,
          entityType: 'action',
          allocatedDays: perAction,
          rationale: `Buffer pour action prioritaire: ${a.nom}`,
        });
      }
    }

    return allocations;
  }

  // ---------------------------------------------------------------------------
  // UTILITAIRES
  // ---------------------------------------------------------------------------

  getBuffer(id: string): Buffer | undefined {
    return this.buffers.get(id);
  }

  getAllBuffers(): Buffer[] {
    return Array.from(this.buffers.values());
  }

  clearBuffers(): void {
    this.buffers.clear();
  }

  updateConfig(config: Partial<BufferConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export default BufferCalculator;
