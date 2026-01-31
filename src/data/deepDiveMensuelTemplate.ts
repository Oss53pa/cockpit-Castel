// ============================================================================
// DEEP DIVE MENSUEL V2 - TEMPLATE DES SECTIONS
// Structure conforme au format COPIL avec 14 slides + Annexes
// ============================================================================

import type { DeepDiveMensuelSection, DeepDiveMensuelSlide, AxeType } from '@/types/deepDive';
import { PROJET_CONFIG } from '@/data/constants';

// ============================================================================
// CONFIGURATION DES 6 AXES
// ============================================================================

export const AXES_MENSUEL_CONFIG: Record<AxeType, {
  label: string;
  labelCourt: string;
  color: string;
  numero: number;
  poids: number; // Pondération pour l'avancement global
}> = {
  rh: { label: 'RH & Organisation', labelCourt: 'RH', color: '#EF4444', numero: 1, poids: 20 },
  commercialisation: { label: 'Commercial & Leasing', labelCourt: 'COM', color: '#3B82F6', numero: 2, poids: 25 },
  technique: { label: 'Technique & Handover', labelCourt: 'TECH', color: '#8B5CF6', numero: 3, poids: 20 },
  budget: { label: 'Budget & Pilotage', labelCourt: 'BUD', color: '#F59E0B', numero: 4, poids: 15 },
  marketing: { label: 'Marketing & Communication', labelCourt: 'MKT', color: '#EC4899', numero: 5, poids: 15 },
  exploitation: { label: 'Exploitation & Systèmes', labelCourt: 'EXP', color: '#10B981', numero: 6, poids: 5 },
  general: { label: 'Général / Transverse', labelCourt: 'GEN', color: '#6B7280', numero: 0, poids: 0 },
};

// ============================================================================
// CONFIGURATION DE L'AGENDA
// ============================================================================

export const AGENDA_CONFIG = [
  { numero: 1, section: 'Synthèse Exécutive & Météo', duree: '10 min' },
  { numero: 2, section: 'Avancement par Axe', duree: '15 min' },
  { numero: 3, section: 'Focus Axe 1 : RH & Organisation', duree: '10 min' },
  { numero: 4, section: 'Focus Axe 2 : Commercial & Leasing', duree: '15 min' },
  { numero: 5, section: 'Focus Axe 3 : Technique & Handover', duree: '15 min' },
  { numero: 6, section: 'Focus Axe 4 : Budget & Pilotage', duree: '10 min' },
  { numero: 7, section: 'Focus Axe 5 : Marketing & Communication', duree: '10 min' },
  { numero: 8, section: 'Focus Axe 6 : Exploitation & Systèmes', duree: '5 min' },
  { numero: 9, section: 'Risques Consolidés', duree: '10 min' },
  { numero: 10, section: 'Points DG — Décisions Requises', duree: '10 min' },
  { numero: 11, section: 'Plan d\'Actions M+1', duree: '5 min' },
  { numero: 12, section: 'Synthèse & Clôture', duree: '5 min' },
];

// ============================================================================
// SLIDES INDIVIDUELLES
// ============================================================================

// Slide 1 - Page de Garde
const SLIDE_PAGE_GARDE: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_1',
  numero: '1',
  titre: 'Page de Garde',
  description: 'Page de titre avec nom du projet, mois, date et présentateur',
  type: 'page_garde',
  included: true,
};

// Slide 2 - Agenda
const SLIDE_AGENDA: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_2',
  numero: '2',
  titre: 'Agenda',
  description: 'Ordre du jour avec sections et durées estimées (2h00 total)',
  type: 'agenda',
  included: true,
};

// Slide 3 - Synthèse Exécutive
const SLIDE_SYNTHESE_EXECUTIVE: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_3',
  numero: '3',
  titre: 'Synthèse Exécutive',
  description: 'Compte à Rebours, Météo Globale, KPIs Clés et Faits Marquants du Mois',
  type: 'synthese_executive',
  included: true,
};

// Slide 4 - Avancement par Axe
const SLIDE_AVANCEMENT_AXES: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_4',
  numero: '4',
  titre: 'Avancement par Axe',
  description: 'Synthèse des 6 axes avec poids, avancement, météo et tendance',
  type: 'tableau_bord_axes',
  included: true,
};

// Slides 5-10 - Détails des Axes
const generateAxeSlide = (axe: AxeType, slideNumero: number): Omit<DeepDiveMensuelSlide, 'sectionId'> => {
  const config = AXES_MENSUEL_CONFIG[axe];
  return {
    id: `slide_${slideNumero}`,
    numero: `${slideNumero}`,
    titre: `AXE ${config.numero} : ${config.label.toUpperCase()}`,
    description: `Jalons, Actions du Mois, Effectif/Pipeline/Budget détaillé pour ${config.label}`,
    type: 'detail_axe',
    included: true,
    axe,
  };
};

const SLIDE_AXE_RH = generateAxeSlide('rh', 5);
const SLIDE_AXE_COMMERCIAL = generateAxeSlide('commercialisation', 6);
const SLIDE_AXE_TECHNIQUE = generateAxeSlide('technique', 7);
const SLIDE_AXE_BUDGET = generateAxeSlide('budget', 8);
const SLIDE_AXE_MARKETING = generateAxeSlide('marketing', 9);
const SLIDE_AXE_EXPLOITATION = generateAxeSlide('exploitation', 10);

// Slide 11 - Risques Consolidés
const SLIDE_RISQUES_CONSOLIDES: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_11',
  numero: '11',
  titre: 'Risques Consolidés',
  description: 'Top 5 Risques Actifs, Matrice des Risques, Évolution (Nouveaux/Fermés)',
  type: 'risques_consolides',
  included: true,
};

// Slide 12 - Points DG : Décisions Requises
const SLIDE_DECISIONS: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_12',
  numero: '12',
  titre: 'Points DG : Décisions Requises',
  description: 'Arbitrages en Attente avec montant, urgence, deadline et recommandation DGA',
  type: 'decisions_table',
  included: true,
};

// Slide 13 - Plan d'Actions M+1
const SLIDE_PLAN_ACTIONS: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_13',
  numero: '13',
  titre: 'Plan d\'Actions M+1',
  description: 'Actions Prioritaires et Jalons à Atteindre pour le mois suivant',
  type: 'plan_actions_m1',
  included: true,
};

// Slide 14 - Synthèse & Clôture
const SLIDE_SYNTHESE_CLOTURE: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_14',
  numero: '14',
  titre: 'Synthèse & Clôture',
  description: 'Ce qui va bien, Points de vigilance, Décisions du jour, Prochain Deep Dive',
  type: 'synthese_cloture',
  included: true,
};

// Annexes
const SLIDE_ANNEXE_GANTT: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_A1',
  numero: 'A1',
  titre: 'Planning Gantt',
  description: 'Vue Gantt des jalons et du chemin critique (capture COCKPIT)',
  type: 'gantt_simplifie',
  included: false,
};

const SLIDE_ANNEXE_COURBE_S: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_A2',
  numero: 'A2',
  titre: 'Courbe en S Budget',
  description: 'Évolution budget prévu vs réalisé avec indicateurs EVM (SPI, CPI, EAC)',
  type: 'courbe_s',
  included: false,
};

const SLIDE_ANNEXE_LISTE_ACTIONS: Omit<DeepDiveMensuelSlide, 'sectionId'> = {
  id: 'slide_A3',
  numero: 'A3',
  titre: 'Liste complète des Actions',
  description: 'Export complet des actions depuis COCKPIT',
  type: 'liste_actions_complete',
  included: false,
};

// ============================================================================
// TEMPLATE DES SECTIONS
// ============================================================================

export const DEEP_DIVE_MENSUEL_SECTIONS: DeepDiveMensuelSection[] = [
  {
    id: 'section_intro',
    numero: '0',
    titre: 'INTRODUCTION',
    type: 'synthese',
    slides: [
      { ...SLIDE_PAGE_GARDE, sectionId: 'section_intro' },
      { ...SLIDE_AGENDA, sectionId: 'section_intro' },
    ],
    expanded: true,
  },
  {
    id: 'section_synthese',
    numero: '1',
    titre: 'SYNTHÈSE EXÉCUTIVE',
    type: 'synthese',
    slides: [
      { ...SLIDE_SYNTHESE_EXECUTIVE, sectionId: 'section_synthese' },
    ],
    expanded: true,
  },
  {
    id: 'section_avancement',
    numero: '2',
    titre: 'AVANCEMENT PAR AXE',
    type: 'analyse_axe',
    slides: [
      { ...SLIDE_AVANCEMENT_AXES, sectionId: 'section_avancement' },
      { ...SLIDE_AXE_RH, sectionId: 'section_avancement' },
      { ...SLIDE_AXE_COMMERCIAL, sectionId: 'section_avancement' },
      { ...SLIDE_AXE_TECHNIQUE, sectionId: 'section_avancement' },
      { ...SLIDE_AXE_BUDGET, sectionId: 'section_avancement' },
      { ...SLIDE_AXE_MARKETING, sectionId: 'section_avancement' },
      { ...SLIDE_AXE_EXPLOITATION, sectionId: 'section_avancement' },
    ],
    expanded: true,
  },
  {
    id: 'section_risques',
    numero: '3',
    titre: 'RISQUES CONSOLIDÉS',
    type: 'risques',
    slides: [
      { ...SLIDE_RISQUES_CONSOLIDES, sectionId: 'section_risques' },
    ],
    expanded: true,
  },
  {
    id: 'section_decisions',
    numero: '4',
    titre: 'DÉCISIONS & ARBITRAGES',
    type: 'decisions',
    slides: [
      { ...SLIDE_DECISIONS, sectionId: 'section_decisions' },
    ],
    expanded: true,
  },
  {
    id: 'section_plan_action',
    numero: '5',
    titre: 'PLAN D\'ACTION M+1',
    type: 'plan_action',
    slides: [
      { ...SLIDE_PLAN_ACTIONS, sectionId: 'section_plan_action' },
    ],
    expanded: true,
  },
  {
    id: 'section_cloture',
    numero: '6',
    titre: 'SYNTHÈSE & CLÔTURE',
    type: 'synthese',
    slides: [
      { ...SLIDE_SYNTHESE_CLOTURE, sectionId: 'section_cloture' },
    ],
    expanded: true,
  },
  {
    id: 'section_annexes',
    numero: 'A',
    titre: 'ANNEXES',
    type: 'annexes',
    slides: [
      { ...SLIDE_ANNEXE_GANTT, sectionId: 'section_annexes' },
      { ...SLIDE_ANNEXE_COURBE_S, sectionId: 'section_annexes' },
      { ...SLIDE_ANNEXE_LISTE_ACTIONS, sectionId: 'section_annexes' },
    ],
    expanded: false,
  },
];

// ============================================================================
// COMPTE À REBOURS CONFIG
// ============================================================================

// Jalons clés pour le compte à rebours - utilise PROJET_CONFIG comme source unique
export const JALONS_CLES_COMPTE_REBOURS = [
  { code: 'SOFT_OPENING', label: 'Soft Opening', date: PROJET_CONFIG.jalonsClés.softOpening },
  { code: 'INAUGURATION', label: 'Inauguration', date: PROJET_CONFIG.jalonsClés.inauguration },
];

// ============================================================================
// MÉTÉO CONFIG
// ============================================================================

export const METEO_LABELS = {
  excellent: { emoji: '☀️', label: 'VERT' },
  bon: { emoji: '🌤️', label: 'JAUNE' },
  attention: { emoji: '⛅', label: 'ORANGE' },
  alerte: { emoji: '🌧️', label: 'ROUGE' },
  critique: { emoji: '⛈️', label: 'CRITIQUE' },
};

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

// Calcule les jours restants jusqu'à une date
export function getJoursRestants(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Formate J-XX ou J+XX
export function formatCompteRebours(jours: number): string {
  if (jours > 0) return `J-${jours}`;
  if (jours < 0) return `J+${Math.abs(jours)}`;
  return 'J-0';
}
