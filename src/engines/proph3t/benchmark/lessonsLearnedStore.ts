// ============================================================================
// PROPH3T ENGINE V2 — LESSONS LEARNED STORE
// Capitalisation des leçons apprises
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export type LessonCategory =
  | 'planning'
  | 'execution'
  | 'risk_management'
  | 'stakeholder'
  | 'technical'
  | 'budget'
  | 'team'
  | 'communication'
  | 'process'
  | 'tools';

export type LessonType = 'success' | 'failure' | 'improvement' | 'observation';
export type LessonImpact = 'high' | 'medium' | 'low';

export interface LessonLearned {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  type: LessonType;
  impact: LessonImpact;
  context: string;
  rootCause?: string;
  recommendation: string;
  actionsTaken?: string[];
  projectId: string;
  projectName: string;
  recordedAt: Date;
  recordedBy?: string;
  tags: string[];
  applicableTo: string[]; // Types de projets
  usageCount: number;
  lastUsed?: Date;
  effectiveness?: 'proven' | 'promising' | 'untested';
}

export interface LessonSearch {
  categories?: LessonCategory[];
  types?: LessonType[];
  impact?: LessonImpact[];
  tags?: string[];
  searchText?: string;
  projectType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface LessonSummary {
  totalLessons: number;
  byCategory: Record<LessonCategory, number>;
  byType: Record<LessonType, number>;
  topTags: Array<{ tag: string; count: number }>;
  mostUsed: LessonLearned[];
  recentAdditions: LessonLearned[];
}

export interface LessonRecommendation {
  lesson: LessonLearned;
  relevanceScore: number;
  reason: string;
}

// ============================================================================
// LESSONS LEARNED STORE
// ============================================================================

export class LessonsLearnedStore {
  private lessons: Map<string, LessonLearned> = new Map();

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  addLesson(data: Omit<LessonLearned, 'id' | 'recordedAt' | 'usageCount'>): LessonLearned {
    const id = `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const lesson: LessonLearned = {
      ...data,
      id,
      recordedAt: new Date(),
      usageCount: 0,
    };

    this.lessons.set(id, lesson);
    return lesson;
  }

  updateLesson(id: string, updates: Partial<LessonLearned>): LessonLearned | null {
    const lesson = this.lessons.get(id);
    if (!lesson) return null;

    const updated = { ...lesson, ...updates };
    this.lessons.set(id, updated);
    return updated;
  }

  deleteLesson(id: string): boolean {
    return this.lessons.delete(id);
  }

  // ---------------------------------------------------------------------------
  // REQUÊTES
  // ---------------------------------------------------------------------------

  getLesson(id: string): LessonLearned | undefined {
    return this.lessons.get(id);
  }

  getAllLessons(): LessonLearned[] {
    return Array.from(this.lessons.values());
  }

  searchLessons(search: LessonSearch): LessonLearned[] {
    return this.getAllLessons().filter(lesson => {
      if (search.categories && !search.categories.includes(lesson.category)) return false;
      if (search.types && !search.types.includes(lesson.type)) return false;
      if (search.impact && !search.impact.includes(lesson.impact)) return false;
      if (search.tags && !search.tags.some(t => lesson.tags.includes(t))) return false;
      if (search.projectType && !lesson.applicableTo.includes(search.projectType)) return false;
      if (search.dateFrom && new Date(lesson.recordedAt) < search.dateFrom) return false;
      if (search.dateTo && new Date(lesson.recordedAt) > search.dateTo) return false;

      if (search.searchText) {
        const searchLower = search.searchText.toLowerCase();
        if (!lesson.title.toLowerCase().includes(searchLower) &&
            !lesson.description.toLowerCase().includes(searchLower) &&
            !lesson.recommendation.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }

  getLessonsByCategory(category: LessonCategory): LessonLearned[] {
    return this.getAllLessons().filter(l => l.category === category);
  }

  getLessonsByProject(projectId: string): LessonLearned[] {
    return this.getAllLessons().filter(l => l.projectId === projectId);
  }

  getMostUsedLessons(limit: number = 10): LessonLearned[] {
    return this.getAllLessons()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // ---------------------------------------------------------------------------
  // RECOMMANDATIONS
  // ---------------------------------------------------------------------------

  /**
   * Recommande des leçons pertinentes pour un contexte donné
   */
  recommendLessons(context: {
    projectType: string;
    currentPhase?: string;
    challenges?: string[];
    keywords?: string[];
  }): LessonRecommendation[] {
    const recommendations: LessonRecommendation[] = [];

    for (const lesson of this.getAllLessons()) {
      let relevanceScore = 0;
      const reasons: string[] = [];

      // Correspondance type de projet
      if (lesson.applicableTo.includes(context.projectType) || lesson.applicableTo.includes('all')) {
        relevanceScore += 30;
        reasons.push('Applicable à ce type de projet');
      }

      // Correspondance avec les défis
      if (context.challenges) {
        for (const challenge of context.challenges) {
          if (lesson.description.toLowerCase().includes(challenge.toLowerCase()) ||
              lesson.recommendation.toLowerCase().includes(challenge.toLowerCase())) {
            relevanceScore += 20;
            reasons.push(`Pertinent pour: ${challenge}`);
          }
        }
      }

      // Correspondance mots-clés
      if (context.keywords) {
        for (const keyword of context.keywords) {
          if (lesson.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase()))) {
            relevanceScore += 15;
          }
        }
      }

      // Bonus pour les leçons éprouvées
      if (lesson.effectiveness === 'proven') {
        relevanceScore += 20;
        reasons.push('Efficacité prouvée');
      }

      // Bonus pour usage fréquent
      if (lesson.usageCount > 5) {
        relevanceScore += 10;
        reasons.push('Fréquemment utilisée');
      }

      if (relevanceScore > 20) {
        recommendations.push({
          lesson,
          relevanceScore,
          reason: reasons.join('. '),
        });
      }
    }

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  /**
   * Marque une leçon comme utilisée
   */
  markAsUsed(id: string): LessonLearned | null {
    const lesson = this.lessons.get(id);
    if (!lesson) return null;

    lesson.usageCount++;
    lesson.lastUsed = new Date();
    this.lessons.set(id, lesson);
    return lesson;
  }

  // ---------------------------------------------------------------------------
  // STATISTIQUES
  // ---------------------------------------------------------------------------

  generateSummary(): LessonSummary {
    const all = this.getAllLessons();

    const byCategory: Record<LessonCategory, number> = {
      planning: 0,
      execution: 0,
      risk_management: 0,
      stakeholder: 0,
      technical: 0,
      budget: 0,
      team: 0,
      communication: 0,
      process: 0,
      tools: 0,
    };

    const byType: Record<LessonType, number> = {
      success: 0,
      failure: 0,
      improvement: 0,
      observation: 0,
    };

    const tagCounts = new Map<string, number>();

    for (const lesson of all) {
      byCategory[lesson.category]++;
      byType[lesson.type]++;

      for (const tag of lesson.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostUsed = all
      .filter(l => l.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    const recentAdditions = all
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
      .slice(0, 5);

    return {
      totalLessons: all.length,
      byCategory,
      byType,
      topTags,
      mostUsed,
      recentAdditions,
    };
  }

  // ---------------------------------------------------------------------------
  // EXPORT/IMPORT
  // ---------------------------------------------------------------------------

  exportData(): LessonLearned[] {
    return this.getAllLessons();
  }

  importData(lessons: LessonLearned[]): void {
    for (const lesson of lessons) {
      this.lessons.set(lesson.id, lesson);
    }
  }

  exportToMarkdown(): string {
    const lines: string[] = [];
    const all = this.getAllLessons();

    lines.push('# Base de Connaissances - Leçons Apprises');
    lines.push('');
    lines.push(`*${all.length} leçons documentées*`);
    lines.push('');

    // Grouper par catégorie
    const categories = [...new Set(all.map(l => l.category))];

    for (const category of categories) {
      const categoryLessons = all.filter(l => l.category === category);
      lines.push(`## ${this.formatCategory(category)}`);
      lines.push('');

      for (const lesson of categoryLessons) {
        lines.push(`### ${lesson.title}`);
        lines.push(`*Type: ${lesson.type} | Impact: ${lesson.impact} | Utilisations: ${lesson.usageCount}*`);
        lines.push('');
        lines.push(`**Contexte:** ${lesson.context}`);
        lines.push('');
        lines.push(`**Description:** ${lesson.description}`);
        lines.push('');
        if (lesson.rootCause) {
          lines.push(`**Cause racine:** ${lesson.rootCause}`);
          lines.push('');
        }
        lines.push(`**Recommandation:** ${lesson.recommendation}`);
        lines.push('');
        lines.push(`Tags: ${lesson.tags.join(', ')}`);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private formatCategory(category: LessonCategory): string {
    const labels: Record<LessonCategory, string> = {
      planning: 'Planification',
      execution: 'Exécution',
      risk_management: 'Gestion des Risques',
      stakeholder: 'Parties Prenantes',
      technical: 'Technique',
      budget: 'Budget',
      team: 'Équipe',
      communication: 'Communication',
      process: 'Processus',
      tools: 'Outils',
    };
    return labels[category];
  }
}

export default LessonsLearnedStore;
