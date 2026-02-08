// ============================================================================
// PROPH3T ENGINE V2 — EXTERNAL DEPENDENCY MAP
// Cartographie et gestion des dépendances externes
// ============================================================================

import type { Action, Jalon } from '../../../types';

// ============================================================================
// TYPES
// ============================================================================

export type DependencyType = 'supplier' | 'regulatory' | 'technical' | 'resource' | 'decision' | 'other';
export type DependencyStatus = 'on_track' | 'at_risk' | 'delayed' | 'blocked' | 'resolved';
export type DependencyPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ExternalDependency {
  id: string;
  name: string;
  description: string;
  type: DependencyType;
  status: DependencyStatus;
  priority: DependencyPriority;
  externalParty: string;
  contactPerson?: string;
  expectedDate: Date;
  actualDate?: Date;
  buffer: number; // jours de marge
  linkedActions: string[];
  linkedJalons: string[];
  notes: string[];
  lastUpdate: Date;
  history: DependencyHistoryEntry[];
}

export interface DependencyHistoryEntry {
  timestamp: Date;
  field: string;
  oldValue: string;
  newValue: string;
  updatedBy?: string;
}

export interface DependencyImpact {
  dependency: ExternalDependency;
  impactedActions: Action[];
  impactedJalons: Jalon[];
  totalDelayDays: number;
  cascadeEffect: number; // Nombre d'éléments affectés en cascade
  criticality: 'blocking' | 'major' | 'minor';
}

export interface DependencyStats {
  total: number;
  byType: Record<DependencyType, number>;
  byStatus: Record<DependencyStatus, number>;
  atRiskCount: number;
  avgBuffer: number;
  criticalPath: ExternalDependency[];
}

export interface DependencyChain {
  root: ExternalDependency;
  chain: Array<{
    dependency: ExternalDependency;
    level: number;
    delay: number;
  }>;
  totalDelay: number;
}

// ============================================================================
// EXTERNAL DEPENDENCY MAP
// ============================================================================

export class ExternalDependencyMap {
  private dependencies: Map<string, ExternalDependency> = new Map();

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  addDependency(data: Omit<ExternalDependency, 'id' | 'lastUpdate' | 'history'>): ExternalDependency {
    const id = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();

    const dependency: ExternalDependency = {
      ...data,
      id,
      lastUpdate: now,
      history: [{
        timestamp: now,
        field: 'creation',
        oldValue: '',
        newValue: data.name,
      }],
    };

    this.dependencies.set(id, dependency);
    return dependency;
  }

  updateDependency(id: string, updates: Partial<ExternalDependency>, updatedBy?: string): ExternalDependency | null {
    const dep = this.dependencies.get(id);
    if (!dep) return null;

    const now = new Date();
    const historyEntries: DependencyHistoryEntry[] = [];

    for (const [field, value] of Object.entries(updates)) {
      if (field !== 'history' && field !== 'lastUpdate') {
        const oldValue = String((dep as any)[field] || '');
        const newValue = String(value);
        if (oldValue !== newValue) {
          historyEntries.push({
            timestamp: now,
            field,
            oldValue,
            newValue,
            updatedBy,
          });
        }
      }
    }

    const updated: ExternalDependency = {
      ...dep,
      ...updates,
      lastUpdate: now,
      history: [...dep.history, ...historyEntries],
    };

    this.dependencies.set(id, updated);
    return updated;
  }

  deleteDependency(id: string): boolean {
    return this.dependencies.delete(id);
  }

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  getDependency(id: string): ExternalDependency | undefined {
    return this.dependencies.get(id);
  }

  getAllDependencies(): ExternalDependency[] {
    return Array.from(this.dependencies.values());
  }

  getDependenciesByType(type: DependencyType): ExternalDependency[] {
    return this.getAllDependencies().filter(d => d.type === type);
  }

  getDependenciesByStatus(status: DependencyStatus): ExternalDependency[] {
    return this.getAllDependencies().filter(d => d.status === status);
  }

  getAtRiskDependencies(): ExternalDependency[] {
    return this.getAllDependencies().filter(d =>
      d.status === 'at_risk' || d.status === 'delayed' || d.status === 'blocked'
    );
  }

  getCriticalDependencies(): ExternalDependency[] {
    return this.getAllDependencies().filter(d => d.priority === 'critical');
  }

  getUpcomingDependencies(days: number = 14): ExternalDependency[] {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.getAllDependencies().filter(d =>
      d.status !== 'resolved' && new Date(d.expectedDate) <= futureDate
    );
  }

  // ---------------------------------------------------------------------------
  // ANALYSE D'IMPACT
  // ---------------------------------------------------------------------------

  analyzeImpact(depId: string, actions: Action[], jalons: Jalon[]): DependencyImpact | null {
    const dep = this.dependencies.get(depId);
    if (!dep) return null;

    // Actions directement liées
    const impactedActions = actions.filter(a => dep.linkedActions.includes(a.id_action));

    // Jalons directement liés
    const impactedJalons = jalons.filter(j => dep.linkedJalons.includes(j.id_jalon));

    // Calcul du retard
    let totalDelayDays = 0;
    if (dep.status === 'delayed' || dep.status === 'blocked') {
      const expected = new Date(dep.expectedDate).getTime();
      const now = Date.now();
      totalDelayDays = Math.max(0, Math.ceil((now - expected) / (1000 * 60 * 60 * 24)));
    }

    // Effet cascade (actions/jalons dépendant des éléments impactés)
    let cascadeEffect = 0;
    for (const action of impactedActions) {
      // Compter les actions qui dépendent de celle-ci
      const dependents = actions.filter(a =>
        a.dependances?.includes(action.id_action)
      );
      cascadeEffect += dependents.length;
    }

    // Criticité
    let criticality: 'blocking' | 'major' | 'minor';
    if (dep.status === 'blocked' || (dep.priority === 'critical' && dep.status !== 'resolved')) {
      criticality = 'blocking';
    } else if (dep.status === 'delayed' || dep.priority === 'high') {
      criticality = 'major';
    } else {
      criticality = 'minor';
    }

    return {
      dependency: dep,
      impactedActions,
      impactedJalons,
      totalDelayDays,
      cascadeEffect,
      criticality,
    };
  }

  // ---------------------------------------------------------------------------
  // STATISTIQUES
  // ---------------------------------------------------------------------------

  calculateStats(): DependencyStats {
    const all = this.getAllDependencies();

    const byType: Record<DependencyType, number> = {
      supplier: 0,
      regulatory: 0,
      technical: 0,
      resource: 0,
      decision: 0,
      other: 0,
    };

    const byStatus: Record<DependencyStatus, number> = {
      on_track: 0,
      at_risk: 0,
      delayed: 0,
      blocked: 0,
      resolved: 0,
    };

    let totalBuffer = 0;

    for (const dep of all) {
      byType[dep.type]++;
      byStatus[dep.status]++;
      totalBuffer += dep.buffer;
    }

    // Chemin critique: dépendances critiques non résolues triées par date
    const criticalPath = all
      .filter(d => d.priority === 'critical' && d.status !== 'resolved')
      .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());

    return {
      total: all.length,
      byType,
      byStatus,
      atRiskCount: byStatus.at_risk + byStatus.delayed + byStatus.blocked,
      avgBuffer: all.length > 0 ? Math.round(totalBuffer / all.length) : 0,
      criticalPath,
    };
  }

  // ---------------------------------------------------------------------------
  // CHAÎNES DE DÉPENDANCES
  // ---------------------------------------------------------------------------

  /**
   * Analyse les chaînes de dépendances pour identifier les chemins critiques
   */
  analyzeDependencyChains(): DependencyChain[] {
    const chains: DependencyChain[] = [];
    const critical = this.getCriticalDependencies().filter(d => d.status !== 'resolved');

    for (const root of critical) {
      const chain: DependencyChain['chain'] = [];
      let currentDelay = 0;

      // Pour simplifier, on crée une chaîne linéaire basée sur les dates
      const linkedDeps = this.getAllDependencies()
        .filter(d =>
          d.id !== root.id &&
          d.status !== 'resolved' &&
          new Date(d.expectedDate) > new Date(root.expectedDate)
        )
        .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime())
        .slice(0, 5);

      let level = 1;
      for (const dep of linkedDeps) {
        const delay = dep.status === 'delayed' || dep.status === 'blocked'
          ? Math.ceil((Date.now() - new Date(dep.expectedDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        currentDelay += delay;

        chain.push({
          dependency: dep,
          level: level++,
          delay,
        });
      }

      if (chain.length > 0) {
        chains.push({
          root,
          chain,
          totalDelay: currentDelay,
        });
      }
    }

    return chains.sort((a, b) => b.totalDelay - a.totalDelay);
  }

  // ---------------------------------------------------------------------------
  // BUFFER MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Recalcule les buffers recommandés basés sur l'historique
   */
  recommendBuffers(): Array<{ depId: string; currentBuffer: number; recommendedBuffer: number; reason: string }> {
    const recommendations: Array<{ depId: string; currentBuffer: number; recommendedBuffer: number; reason: string }> = [];

    for (const dep of this.getAllDependencies()) {
      if (dep.status === 'resolved') continue;

      let recommendedBuffer = dep.buffer;
      let reason = '';

      // Augmenter le buffer pour les dépendances à risque
      if (dep.status === 'at_risk' || dep.status === 'delayed') {
        recommendedBuffer = Math.max(dep.buffer, dep.buffer * 1.5);
        reason = 'Dépendance à risque - buffer augmenté de 50%';
      }

      // Augmenter le buffer pour les dépendances critiques
      if (dep.priority === 'critical' && recommendedBuffer < 7) {
        recommendedBuffer = Math.max(recommendedBuffer, 7);
        reason = 'Dépendance critique - buffer minimum 7 jours';
      }

      // Vérifier l'historique de retards
      const delays = dep.history.filter(h =>
        h.field === 'status' && (h.newValue === 'delayed' || h.newValue === 'blocked')
      );
      if (delays.length > 1) {
        recommendedBuffer = Math.max(recommendedBuffer, dep.buffer * 2);
        reason = `${delays.length} retards précédents - buffer doublé`;
      }

      if (recommendedBuffer !== dep.buffer) {
        recommendations.push({
          depId: dep.id,
          currentBuffer: dep.buffer,
          recommendedBuffer: Math.round(recommendedBuffer),
          reason,
        });
      }
    }

    return recommendations;
  }

  // ---------------------------------------------------------------------------
  // ALERTS
  // ---------------------------------------------------------------------------

  /**
   * Génère des alertes pour les dépendances problématiques
   */
  generateAlerts(): Array<{
    depId: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }> {
    const alerts: Array<{
      depId: string;
      severity: 'critical' | 'warning' | 'info';
      message: string;
    }> = [];

    const now = new Date();

    for (const dep of this.getAllDependencies()) {
      if (dep.status === 'resolved') continue;

      const expectedDate = new Date(dep.expectedDate);
      const daysUntil = Math.ceil((expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Alerte bloqué
      if (dep.status === 'blocked') {
        alerts.push({
          depId: dep.id,
          severity: 'critical',
          message: `Dépendance "${dep.name}" bloquée - action immédiate requise`,
        });
      }
      // Alerte retard
      else if (dep.status === 'delayed') {
        alerts.push({
          depId: dep.id,
          severity: dep.priority === 'critical' ? 'critical' : 'warning',
          message: `Dépendance "${dep.name}" en retard de ${Math.abs(daysUntil)} jour(s)`,
        });
      }
      // Alerte échéance proche
      else if (daysUntil <= dep.buffer && daysUntil > 0) {
        alerts.push({
          depId: dep.id,
          severity: 'warning',
          message: `Dépendance "${dep.name}" arrive à échéance dans ${daysUntil} jour(s) (buffer: ${dep.buffer}j)`,
        });
      }
      // Alerte buffer insuffisant
      else if (dep.buffer < 3 && dep.priority === 'critical') {
        alerts.push({
          depId: dep.id,
          severity: 'info',
          message: `Dépendance critique "${dep.name}" avec buffer insuffisant (${dep.buffer}j)`,
        });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  // ---------------------------------------------------------------------------
  // IMPORT/EXPORT
  // ---------------------------------------------------------------------------

  exportData(): ExternalDependency[] {
    return this.getAllDependencies();
  }

  importData(dependencies: ExternalDependency[]): void {
    for (const dep of dependencies) {
      this.dependencies.set(dep.id, dep);
    }
  }
}

export default ExternalDependencyMap;
