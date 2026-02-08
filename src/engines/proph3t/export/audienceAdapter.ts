// ============================================================================
// PROPH3T ENGINE V2 — AUDIENCE ADAPTER
// Adapte le contenu selon l'audience cible
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export type AudienceType =
  | 'executive'      // Direction générale
  | 'sponsor'        // Sponsor projet
  | 'steering'       // Comité de pilotage
  | 'project_manager' // Chef de projet
  | 'team_lead'      // Responsable d'équipe
  | 'team_member'    // Membre d'équipe
  | 'technical'      // Équipe technique
  | 'stakeholder'    // Parties prenantes externes
  | 'client';        // Client final

export interface AudienceProfile {
  type: AudienceType;
  name: string;
  characteristics: {
    detailLevel: 'minimal' | 'summary' | 'detailed' | 'comprehensive';
    technicalLevel: 'none' | 'basic' | 'intermediate' | 'expert';
    focusAreas: string[];
    avoidTopics: string[];
    preferredFormat: 'bullet_points' | 'narrative' | 'visual' | 'data_heavy';
    timeConstraint: 'very_short' | 'short' | 'medium' | 'long';
  };
  communicationStyle: {
    tone: 'formal' | 'professional' | 'casual';
    language: 'business' | 'technical' | 'plain';
    emphasis: 'results' | 'process' | 'risks' | 'costs';
  };
}

export interface AdaptedContent<T> {
  originalContent: T;
  adaptedContent: T;
  audience: AudienceType;
  adaptations: string[];
  warnings?: string[];
}

export interface ContentSection {
  title: string;
  content: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  dataPoints?: Array<{ label: string; value: string | number }>;
}

export interface AdaptationConfig {
  preserveNumbers: boolean;
  translateTechnicalTerms: boolean;
  addContext: boolean;
  maxSections?: number;
  maxLength?: number;
}

// ============================================================================
// AUDIENCE PROFILES
// ============================================================================

const AUDIENCE_PROFILES: Record<AudienceType, AudienceProfile> = {
  executive: {
    type: 'executive',
    name: 'Direction Générale',
    characteristics: {
      detailLevel: 'minimal',
      technicalLevel: 'none',
      focusAreas: ['roi', 'risks', 'timeline', 'strategic_impact'],
      avoidTopics: ['technical_details', 'operational_issues', 'team_dynamics'],
      preferredFormat: 'bullet_points',
      timeConstraint: 'very_short',
    },
    communicationStyle: {
      tone: 'formal',
      language: 'business',
      emphasis: 'results',
    },
  },
  sponsor: {
    type: 'sponsor',
    name: 'Sponsor Projet',
    characteristics: {
      detailLevel: 'summary',
      technicalLevel: 'basic',
      focusAreas: ['budget', 'timeline', 'risks', 'decisions', 'blockers'],
      avoidTopics: ['implementation_details'],
      preferredFormat: 'narrative',
      timeConstraint: 'short',
    },
    communicationStyle: {
      tone: 'professional',
      language: 'business',
      emphasis: 'costs',
    },
  },
  steering: {
    type: 'steering',
    name: 'Comité de Pilotage',
    characteristics: {
      detailLevel: 'summary',
      technicalLevel: 'basic',
      focusAreas: ['progress', 'risks', 'decisions', 'resources', 'timeline'],
      avoidTopics: ['code_details', 'minor_issues'],
      preferredFormat: 'visual',
      timeConstraint: 'medium',
    },
    communicationStyle: {
      tone: 'professional',
      language: 'business',
      emphasis: 'risks',
    },
  },
  project_manager: {
    type: 'project_manager',
    name: 'Chef de Projet',
    characteristics: {
      detailLevel: 'detailed',
      technicalLevel: 'intermediate',
      focusAreas: ['all'],
      avoidTopics: [],
      preferredFormat: 'data_heavy',
      timeConstraint: 'long',
    },
    communicationStyle: {
      tone: 'professional',
      language: 'business',
      emphasis: 'process',
    },
  },
  team_lead: {
    type: 'team_lead',
    name: 'Responsable d\'Équipe',
    characteristics: {
      detailLevel: 'detailed',
      technicalLevel: 'intermediate',
      focusAreas: ['tasks', 'blockers', 'resources', 'deadlines'],
      avoidTopics: ['strategic_decisions', 'budget_details'],
      preferredFormat: 'bullet_points',
      timeConstraint: 'medium',
    },
    communicationStyle: {
      tone: 'professional',
      language: 'plain',
      emphasis: 'process',
    },
  },
  team_member: {
    type: 'team_member',
    name: 'Membre d\'Équipe',
    characteristics: {
      detailLevel: 'detailed',
      technicalLevel: 'expert',
      focusAreas: ['tasks', 'technical_requirements', 'deadlines'],
      avoidTopics: ['budget', 'strategic_decisions'],
      preferredFormat: 'bullet_points',
      timeConstraint: 'short',
    },
    communicationStyle: {
      tone: 'casual',
      language: 'technical',
      emphasis: 'process',
    },
  },
  technical: {
    type: 'technical',
    name: 'Équipe Technique',
    characteristics: {
      detailLevel: 'comprehensive',
      technicalLevel: 'expert',
      focusAreas: ['technical_issues', 'architecture', 'dependencies', 'quality'],
      avoidTopics: ['budget_details', 'stakeholder_politics'],
      preferredFormat: 'data_heavy',
      timeConstraint: 'medium',
    },
    communicationStyle: {
      tone: 'casual',
      language: 'technical',
      emphasis: 'process',
    },
  },
  stakeholder: {
    type: 'stakeholder',
    name: 'Parties Prenantes',
    characteristics: {
      detailLevel: 'summary',
      technicalLevel: 'none',
      focusAreas: ['timeline', 'deliverables', 'impact', 'communication'],
      avoidTopics: ['internal_issues', 'technical_details', 'budget_breakdown'],
      preferredFormat: 'visual',
      timeConstraint: 'short',
    },
    communicationStyle: {
      tone: 'formal',
      language: 'plain',
      emphasis: 'results',
    },
  },
  client: {
    type: 'client',
    name: 'Client',
    characteristics: {
      detailLevel: 'summary',
      technicalLevel: 'basic',
      focusAreas: ['deliverables', 'timeline', 'quality', 'value'],
      avoidTopics: ['internal_issues', 'budget_breakdown', 'team_dynamics'],
      preferredFormat: 'visual',
      timeConstraint: 'short',
    },
    communicationStyle: {
      tone: 'professional',
      language: 'plain',
      emphasis: 'results',
    },
  },
};

// ============================================================================
// AUDIENCE ADAPTER
// ============================================================================

export class AudienceAdapter {
  private config: AdaptationConfig;

  constructor(config: Partial<AdaptationConfig> = {}) {
    this.config = {
      preserveNumbers: true,
      translateTechnicalTerms: true,
      addContext: true,
      ...config,
    };
  }

  // ---------------------------------------------------------------------------
  // ADAPTATION DE CONTENU
  // ---------------------------------------------------------------------------

  /**
   * Adapte des sections de contenu pour une audience cible
   */
  adaptContent(
    sections: ContentSection[],
    targetAudience: AudienceType
  ): AdaptedContent<ContentSection[]> {
    const profile = AUDIENCE_PROFILES[targetAudience];
    const adaptations: string[] = [];
    const warnings: string[] = [];

    // Filtrer les sections selon l'audience
    let adaptedSections = this.filterSections(sections, profile, adaptations);

    // Limiter le nombre de sections si nécessaire
    if (this.config.maxSections && adaptedSections.length > this.config.maxSections) {
      adaptedSections = adaptedSections.slice(0, this.config.maxSections);
      adaptations.push(`Limité à ${this.config.maxSections} sections`);
    }

    // Adapter le contenu de chaque section
    adaptedSections = adaptedSections.map(section =>
      this.adaptSection(section, profile, adaptations)
    );

    // Ajouter des avertissements si du contenu critique a été retiré
    const removedCritical = sections.filter(s =>
      s.importance === 'critical' &&
      !adaptedSections.find(as => as.title === s.title)
    );
    if (removedCritical.length > 0) {
      warnings.push(`${removedCritical.length} section(s) critique(s) retirée(s) pour cette audience`);
    }

    return {
      originalContent: sections,
      adaptedContent: adaptedSections,
      audience: targetAudience,
      adaptations,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private filterSections(
    sections: ContentSection[],
    profile: AudienceProfile,
    adaptations: string[]
  ): ContentSection[] {
    const filtered = sections.filter(section => {
      // Toujours garder les sections critiques
      if (section.importance === 'critical') return true;

      // Filtrer selon le niveau de détail
      if (profile.characteristics.detailLevel === 'minimal' && section.importance === 'low') {
        return false;
      }

      // Filtrer les sujets à éviter
      const titleLower = section.title.toLowerCase();
      for (const avoid of profile.characteristics.avoidTopics) {
        if (titleLower.includes(avoid.replace('_', ' '))) {
          adaptations.push(`Section "${section.title}" retirée (sujet non pertinent)`);
          return false;
        }
      }

      return true;
    });

    // Trier par importance
    return filtered.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.importance] - order[b.importance];
    });
  }

  private adaptSection(
    section: ContentSection,
    profile: AudienceProfile,
    adaptations: string[]
  ): ContentSection {
    let adaptedContent = section.content;

    // Adapter le niveau technique
    if (profile.characteristics.technicalLevel === 'none' && this.config.translateTechnicalTerms) {
      adaptedContent = this.simplifyTechnicalTerms(adaptedContent);
      adaptations.push('Termes techniques simplifiés');
    }

    // Adapter la longueur selon la contrainte de temps
    if (profile.characteristics.timeConstraint === 'very_short') {
      adaptedContent = this.summarize(adaptedContent, 100);
    } else if (profile.characteristics.timeConstraint === 'short') {
      adaptedContent = this.summarize(adaptedContent, 200);
    }

    // Adapter le format
    if (profile.characteristics.preferredFormat === 'bullet_points') {
      adaptedContent = this.toBulletPoints(adaptedContent);
    }

    // Adapter les data points
    let dataPoints = section.dataPoints;
    if (dataPoints && profile.characteristics.detailLevel === 'minimal') {
      dataPoints = dataPoints.slice(0, 3);
    }

    return {
      ...section,
      content: adaptedContent,
      dataPoints,
    };
  }

  private simplifyTechnicalTerms(content: string): string {
    const replacements: Record<string, string> = {
      'CPI': 'indice de performance coûts',
      'SPI': 'indice de performance planning',
      'EVM': 'valeur acquise',
      'milestone': 'jalon',
      'sprint': 'cycle',
      'backlog': 'liste des tâches',
      'burndown': 'suivi d\'avancement',
      'buffer': 'marge de sécurité',
      'WBS': 'structure de découpage',
      'critical path': 'chemin critique',
      'dependencies': 'dépendances',
      'stakeholder': 'partie prenante',
    };

    let simplified = content;
    for (const [technical, simple] of Object.entries(replacements)) {
      const regex = new RegExp(technical, 'gi');
      simplified = simplified.replace(regex, simple);
    }

    return simplified;
  }

  private summarize(content: string, maxWords: number): string {
    const words = content.split(/\s+/);
    if (words.length <= maxWords) return content;

    return words.slice(0, maxWords).join(' ') + '...';
  }

  private toBulletPoints(content: string): string {
    // Diviser en phrases et convertir en points
    const sentences = content.split(/\.\s+/).filter(s => s.trim());

    if (sentences.length <= 1) return content;

    return sentences.map(s => `• ${s.trim()}`).join('\n');
  }

  // ---------------------------------------------------------------------------
  // PROFILS
  // ---------------------------------------------------------------------------

  getProfile(audience: AudienceType): AudienceProfile {
    return AUDIENCE_PROFILES[audience];
  }

  getAllProfiles(): AudienceProfile[] {
    return Object.values(AUDIENCE_PROFILES);
  }

  /**
   * Recommande une audience basée sur le contexte
   */
  recommendAudience(context: {
    meetingType?: string;
    documentType?: string;
    recipients?: string[];
  }): AudienceType {
    // Logique de recommandation simplifiée
    if (context.meetingType === 'exco' || context.documentType === 'executive_summary') {
      return 'executive';
    }
    if (context.meetingType === 'comite_pilotage') {
      return 'steering';
    }
    if (context.meetingType === 'revue_technique') {
      return 'technical';
    }
    if (context.documentType === 'client_report') {
      return 'client';
    }

    return 'project_manager'; // Par défaut
  }

  // ---------------------------------------------------------------------------
  // MULTI-AUDIENCE
  // ---------------------------------------------------------------------------

  /**
   * Adapte le contenu pour plusieurs audiences simultanément
   */
  adaptForMultipleAudiences(
    sections: ContentSection[],
    audiences: AudienceType[]
  ): Map<AudienceType, AdaptedContent<ContentSection[]>> {
    const results = new Map<AudienceType, AdaptedContent<ContentSection[]>>();

    for (const audience of audiences) {
      results.set(audience, this.adaptContent(sections, audience));
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------

  setConfig(config: Partial<AdaptationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AdaptationConfig {
    return { ...this.config };
  }
}

export default AudienceAdapter;
