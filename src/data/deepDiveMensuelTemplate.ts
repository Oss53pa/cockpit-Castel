// ============================================================================
// DEEP DIVE MENSUEL V2 - TEMPLATE DES SECTIONS
// Structure conforme au format COPIL avec 6 sections principales
// ============================================================================

import type { DeepDiveMensuelSection, DeepDiveMensuelSlide, AxeType } from '@/types/deepDive';

// ============================================================================
// CONFIGURATION DES 6 AXES
// ============================================================================

export const AXES_MENSUEL_CONFIG: Record<AxeType, {
  label: string;
  labelCourt: string;
  color: string;
  numero: number;
}> = {
  rh: { label: 'RH & Organisation', labelCourt: 'RH', color: '#EF4444', numero: 1 },
  commercialisation: { label: 'Commercial & Leasing', labelCourt: 'COM', color: '#3B82F6', numero: 2 },
  technique: { label: 'Technique & Handover', labelCourt: 'TECH', color: '#8B5CF6', numero: 3 },
  budget: { label: 'Budget & Finances', labelCourt: 'BUD', color: '#F59E0B', numero: 4 },
  marketing: { label: 'Marketing & Communication', labelCourt: 'MKT', color: '#EC4899', numero: 5 },
  exploitation: { label: 'Exploitation & Juridique', labelCourt: 'EXP', color: '#10B981', numero: 6 },
  general: { label: 'Général / Transverse', labelCourt: 'GEN', color: '#6B7280', numero: 0 },
};

// ============================================================================
// SLIDES PAR SECTION
// ============================================================================

// Section 1 - Synthèse Exécutive
const SECTION_1_SLIDES: Omit<DeepDiveMensuelSlide, 'sectionId'>[] = [
  {
    id: 'slide_1_1',
    numero: '1.1',
    titre: 'Météo Globale du Mois',
    description: 'Vue synthétique avec KPIs principaux et indicateur météo global',
    type: 'meteo_globale',
    included: true,
  },
  {
    id: 'slide_1_2',
    numero: '1.2',
    titre: 'Faits Marquants du Mois',
    description: 'Réalisations clés, Points d\'attention et Alertes critiques',
    type: 'faits_marquants',
    included: true,
  },
];

// Section 2 - Analyse par Axe
const generateAxeSlides = (axe: AxeType, axeNumero: number): Omit<DeepDiveMensuelSlide, 'sectionId'>[] => {
  const config = AXES_MENSUEL_CONFIG[axe];
  return [
    {
      id: `slide_2_${axeNumero + 1}`,
      numero: `2.${axeNumero + 1}`,
      titre: `AXE ${axeNumero} — ${config.label}`,
      description: `Détail de l'avancement, jalons, actions et risques pour l'axe ${config.labelCourt}`,
      type: 'detail_axe',
      included: true,
      axe,
    },
  ];
};

const SECTION_2_SLIDES: Omit<DeepDiveMensuelSlide, 'sectionId'>[] = [
  {
    id: 'slide_2_1',
    numero: '2.1',
    titre: 'Tableau de Bord Axes',
    description: 'Synthèse visuelle des 6 axes avec météo, avancement et alertes',
    type: 'tableau_bord_axes',
    included: true,
  },
  ...generateAxeSlides('rh', 1),
  ...generateAxeSlides('commercialisation', 2),
  ...generateAxeSlides('technique', 3),
  ...generateAxeSlides('budget', 4),
  ...generateAxeSlides('marketing', 5),
  ...generateAxeSlides('exploitation', 6),
];

// Section 3 - Suivi des Risques
const SECTION_3_SLIDES: Omit<DeepDiveMensuelSlide, 'sectionId'>[] = [
  {
    id: 'slide_3_1',
    numero: '3.1',
    titre: 'Top 5 Risques Actifs',
    description: 'Risques majeurs avec score, évolution et statut des mitigations',
    type: 'top_risques',
    included: true,
  },
  {
    id: 'slide_3_2',
    numero: '3.2',
    titre: 'Risques Nouveaux / Fermés',
    description: 'Évolution du registre des risques sur le mois',
    type: 'risques_evolution',
    included: true,
  },
];

// Section 4 - Décisions & Arbitrages
const SECTION_4_SLIDES: Omit<DeepDiveMensuelSlide, 'sectionId'>[] = [
  {
    id: 'slide_4_1',
    numero: '4',
    titre: 'Décisions & Arbitrages Requis',
    description: 'Points en attente de validation avec options et recommandations',
    type: 'decisions_table',
    included: true,
  },
];

// Section 5 - Plan d'Action M+1
const SECTION_5_SLIDES: Omit<DeepDiveMensuelSlide, 'sectionId'>[] = [
  {
    id: 'slide_5_1',
    numero: '5.1',
    titre: 'Actions Prioritaires',
    description: 'Top 10 actions à réaliser le mois prochain',
    type: 'actions_prioritaires',
    included: true,
  },
  {
    id: 'slide_5_2',
    numero: '5.2',
    titre: 'Jalons à Atteindre M+1',
    description: 'Jalons critiques du mois à venir avec critères de succès',
    type: 'jalons_m1',
    included: true,
  },
];

// Section 6 - Annexes
const SECTION_6_SLIDES: Omit<DeepDiveMensuelSlide, 'sectionId'>[] = [
  {
    id: 'slide_6_1',
    numero: '6.1',
    titre: 'Planning Jalons (Gantt simplifié)',
    description: 'Vue timeline des jalons avec chemin critique',
    type: 'gantt_simplifie',
    included: true,
  },
  {
    id: 'slide_6_2',
    numero: '6.2',
    titre: 'Courbe en S — Budget',
    description: 'Évolution budget prévu vs réalisé avec indicateurs EVM',
    type: 'courbe_s',
    included: true,
  },
];

// ============================================================================
// TEMPLATE DES 6 SECTIONS
// ============================================================================

export const DEEP_DIVE_MENSUEL_SECTIONS: DeepDiveMensuelSection[] = [
  {
    id: 'section_1',
    numero: '1',
    titre: 'SYNTHÈSE EXÉCUTIVE',
    type: 'synthese',
    slides: SECTION_1_SLIDES.map(s => ({ ...s, sectionId: 'section_1' })),
    expanded: true,
  },
  {
    id: 'section_2',
    numero: '2',
    titre: 'ANALYSE PAR AXE — MÉTÉO DÉTAILLÉE',
    type: 'analyse_axe',
    slides: SECTION_2_SLIDES.map(s => ({ ...s, sectionId: 'section_2' })),
    expanded: true,
  },
  {
    id: 'section_3',
    numero: '3',
    titre: 'SUIVI DES RISQUES',
    type: 'risques',
    slides: SECTION_3_SLIDES.map(s => ({ ...s, sectionId: 'section_3' })),
    expanded: true,
  },
  {
    id: 'section_4',
    numero: '4',
    titre: 'DÉCISIONS & ARBITRAGES REQUIS',
    type: 'decisions',
    slides: SECTION_4_SLIDES.map(s => ({ ...s, sectionId: 'section_4' })),
    expanded: true,
  },
  {
    id: 'section_5',
    numero: '5',
    titre: 'PLAN D\'ACTION M+1',
    type: 'plan_action',
    slides: SECTION_5_SLIDES.map(s => ({ ...s, sectionId: 'section_5' })),
    expanded: true,
  },
  {
    id: 'section_6',
    numero: '6',
    titre: 'ANNEXES',
    type: 'annexes',
    slides: SECTION_6_SLIDES.map(s => ({ ...s, sectionId: 'section_6' })),
    expanded: false,
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export function getAllSlides(): DeepDiveMensuelSlide[] {
  return DEEP_DIVE_MENSUEL_SECTIONS.flatMap(section => section.slides);
}

export function getActiveSlides(): DeepDiveMensuelSlide[] {
  return getAllSlides().filter(slide => slide.included);
}

export function getSlidesBySection(sectionId: string): DeepDiveMensuelSlide[] {
  const section = DEEP_DIVE_MENSUEL_SECTIONS.find(s => s.id === sectionId);
  return section?.slides || [];
}

export function getSlideById(slideId: string): DeepDiveMensuelSlide | undefined {
  return getAllSlides().find(slide => slide.id === slideId);
}

export function getSectionById(sectionId: string): DeepDiveMensuelSection | undefined {
  return DEEP_DIVE_MENSUEL_SECTIONS.find(s => s.id === sectionId);
}

export function toggleSlideInclusion(sections: DeepDiveMensuelSection[], slideId: string): DeepDiveMensuelSection[] {
  return sections.map(section => ({
    ...section,
    slides: section.slides.map(slide =>
      slide.id === slideId ? { ...slide, included: !slide.included } : slide
    ),
  }));
}

export function updateSlideComment(sections: DeepDiveMensuelSection[], slideId: string, comment: string): DeepDiveMensuelSection[] {
  return sections.map(section => ({
    ...section,
    slides: section.slides.map(slide =>
      slide.id === slideId ? { ...slide, comment } : slide
    ),
  }));
}

export function toggleSectionExpanded(sections: DeepDiveMensuelSection[], sectionId: string): DeepDiveMensuelSection[] {
  return sections.map(section =>
    section.id === sectionId ? { ...section, expanded: !section.expanded } : section
  );
}

// Compte le nombre total de slides actives
export function countActiveSlides(sections: DeepDiveMensuelSection[]): number {
  return sections.reduce((total, section) =>
    total + section.slides.filter(s => s.included).length, 0
  );
}

// Réordonne les slides dans une section
export function reorderSlidesInSection(
  sections: DeepDiveMensuelSection[],
  sectionId: string,
  fromIndex: number,
  toIndex: number
): DeepDiveMensuelSection[] {
  return sections.map(section => {
    if (section.id !== sectionId) return section;

    const newSlides = [...section.slides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);

    return { ...section, slides: newSlides };
  });
}
