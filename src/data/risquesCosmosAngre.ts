// ============================================================================
// COSMOS ANGRÉ - REGISTRE DES RISQUES COMPLET
// Version 2.0 - Aligné sur les 19 Jalons du Référentiel de Mobilisation
// 46 Risques | 10 Critiques | 12 Majeurs | 23 Modérés | 1 Faible
// ============================================================================

import { RESPONSABLES } from './cosmosAngreRef';
import type { ProjectPhase, RisqueCategory } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type RisqueNiveau = 'critique' | 'majeur' | 'modere' | 'faible';
export type RisqueTendance = 'stable' | 'augmentation' | 'diminution';

export interface ActionMitigationRisque {
  action: string;
  responsable: string;
  deadline: string;
  statut?: 'fait' | 'en_cours' | 'planifie';
}

export interface RisqueCosmosAngre {
  id: string;
  code: string; // R01, R02, etc.
  titre: string;
  description: string;
  categorie: RisqueCategory;
  probabilite: 1 | 2 | 3 | 4;
  impact: 1 | 2 | 3 | 4;
  score: number;
  niveau: RisqueNiveau;
  phase: 'phase1_preparation' | 'phase2_mobilisation' | 'phase3_lancement' | 'phase4_stabilisation';
  jalonsImpactes: string[];
  proprietaire: string;
  mitigations: ActionMitigationRisque[];
  indicateursDeclenchement?: string[];
  actionImmediate?: string;
  tendance?: RisqueTendance;
  axe?: string;
}

// ============================================================================
// MÉTHODOLOGIE - Matrice de Criticité
// ============================================================================

export const MATRICE_CRITICITE = {
  description: 'Score = Probabilité × Impact (1-16)',
  niveaux: [
    { min: 12, max: 16, niveau: 'critique' as RisqueNiveau, couleur: '🔴', action: 'Plan de mitigation immédiat + suivi hebdo' },
    { min: 8, max: 11, niveau: 'majeur' as RisqueNiveau, couleur: '🟠', action: 'Plan de mitigation + suivi bi-mensuel' },
    { min: 4, max: 7, niveau: 'modere' as RisqueNiveau, couleur: '🟡', action: 'Surveillance + plan si déclenchement' },
    { min: 1, max: 3, niveau: 'faible' as RisqueNiveau, couleur: '🟢', action: 'Surveillance passive' },
  ],
  matrice: [
    // Impact:      1   2   3   4
    /* P=4 */    [  4,  8, 12, 16 ],
    /* P=3 */    [  3,  6,  9, 12 ],
    /* P=2 */    [  2,  4,  6,  8 ],
    /* P=1 */    [  1,  2,  3,  4 ],
  ],
};

export const getNiveauRisque = (score: number): RisqueNiveau => {
  if (score >= 12) return 'critique';
  if (score >= 8) return 'majeur';
  if (score >= 4) return 'modere';
  return 'faible';
};

export const getCouleurNiveau = (niveau: RisqueNiveau): string => {
  switch (niveau) {
    case 'critique': return 'bg-error-500';
    case 'majeur': return 'bg-warning-500';
    case 'modere': return 'bg-info-500';
    case 'faible': return 'bg-success-500';
  }
};

// ============================================================================
// PHASE 1 : PRÉPARATION (Jan-Mars 2026)
// ============================================================================

// Risques liés au Jalon 1 - Cadrage Projet
export const RISQUES_JALON1: RisqueCosmosAngre[] = [
  {
    id: 'R01',
    code: 'R01',
    titre: 'Budget mobilisation sous-estimé',
    description: 'Le budget alloué à la phase de mobilisation pourrait être insuffisant pour couvrir tous les besoins réels du projet.',
    categorie: 'financier',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J1', 'Tous'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Inclure provision 10% dans le budget', responsable: RESPONSABLES.DGA, deadline: '2026-01-31', statut: 'fait' },
      { action: 'Revues budgétaires trimestrielles', responsable: RESPONSABLES.FINANCE, deadline: 'Continu', statut: 'en_cours' },
    ],
    indicateursDeclenchement: ['Écart > 5% sur un poste majeur', 'Cumul écarts > 3% budget total'],
    actionImmediate: 'Réunion crise + arbitrages',
  },
  {
    id: 'R02',
    code: 'R02',
    titre: 'Retard validation par actionnaires',
    description: 'Les décisions clés pourraient être retardées en raison de la disponibilité ou des divergences entre actionnaires.',
    categorie: 'operationnel',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J1'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Anticiper les réunions actionnaires', responsable: RESPONSABLES.DGA, deadline: '2026-01-15', statut: 'planifie' },
      { action: 'Préparer dossiers complets en amont', responsable: RESPONSABLES.DGA, deadline: 'Continu', statut: 'en_cours' },
    ],
  },
];

// Risques liés au Jalon 2 - Stratégie Commerciale
export const RISQUES_JALON2: RisqueCosmosAngre[] = [
  {
    id: 'R03',
    code: 'R03',
    titre: 'Grille de loyers non compétitive',
    description: 'La grille tarifaire pourrait être trop élevée par rapport au marché, freinant la commercialisation.',
    categorie: 'commercial',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J2', 'J5', 'J8'],
    proprietaire: RESPONSABLES.COMMERCIAL_MGR,
    mitigations: [
      { action: 'Benchmark concurrence approfondi', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: '2026-02-15', statut: 'en_cours' },
      { action: 'Flexibilité négociation selon profil', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'Continu', statut: 'planifie' },
    ],
  },
  {
    id: 'R04',
    code: 'R04',
    titre: 'Retard signatures BEFA Vague 1-2',
    description: 'Les premières vagues de signatures de baux pourraient accuser du retard, impactant le calendrier global.',
    categorie: 'commercial',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J2', 'J5'],
    proprietaire: RESPONSABLES.COMMERCIAL_MGR,
    mitigations: [
      { action: 'Relances hebdomadaires prospects chauds', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Incentives early-bird (mois gratuits)', responsable: RESPONSABLES.DGA, deadline: '2026-02-28', statut: 'planifie' },
    ],
    indicateursDeclenchement: ['< 50% signé à J-30 deadline'],
    actionImmediate: 'Task force commerciale',
  },
  {
    id: 'R05',
    code: 'R05',
    titre: 'Désistement locomotive (Carrefour)',
    description: 'Carrefour pourrait se retirer du projet ou ne pas confirmer son engagement.',
    categorie: 'commercial',
    probabilite: 2,
    impact: 4,
    score: 8,
    niveau: 'majeur',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J2', 'J5', 'J8'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Clause pénalités dans BEFA', responsable: RESPONSABLES.JURIDIQUE, deadline: '2026-02-15', statut: 'planifie' },
      { action: 'Plan B avec enseigne alternative', responsable: RESPONSABLES.DGA, deadline: '2026-02-28', statut: 'planifie' },
    ],
  },
];

// Risques liés au Jalon 3 - Planning Technique
export const RISQUES_JALON3: RisqueCosmosAngre[] = [
  {
    id: 'R06',
    code: 'R06',
    titre: 'Retard chantier constructeur',
    description: 'Le constructeur pourrait accuser du retard sur les livraisons prévues, impactant toute la chaîne de mobilisation.',
    categorie: 'technique',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J3', 'J7', 'J10', 'J14'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Réunions chantier hebdomadaires', responsable: RESPONSABLES.FM, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Pénalités contractuelles retard', responsable: RESPONSABLES.JURIDIQUE, deadline: 'Fait', statut: 'fait' },
    ],
    indicateursDeclenchement: ['> 2 semaines de retard sur planning'],
    actionImmediate: 'Réunion crise + pénalités',
    axe: 'AXE 3 - Technique & Handover',
  },
  {
    id: 'R07',
    code: 'R07',
    titre: 'Problème bassin de rétention non résolu',
    description: 'Les travaux du bassin de rétention pourraient rencontrer des difficultés techniques non anticipées.',
    categorie: 'technique',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J3', 'J7'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Suivi direct avec responsable Cheick', responsable: RESPONSABLES.DGA, deadline: 'Hebdo', statut: 'en_cours' },
      { action: 'Escalade immédiate si blocage', responsable: RESPONSABLES.DGA, deadline: 'Si nécessaire', statut: 'planifie' },
    ],
  },
  {
    id: 'R08',
    code: 'R08',
    titre: 'Planning constructeur non fiable',
    description: 'Les estimations de délais fournies par le constructeur pourraient ne pas être réalistes.',
    categorie: 'technique',
    probabilite: 3,
    impact: 3,
    score: 9,
    niveau: 'majeur',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J3'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Contre-expertise planning par bureau externe', responsable: RESPONSABLES.FM, deadline: '2026-02-28', statut: 'planifie' },
      { action: 'Définir jalons intermédiaires de contrôle', responsable: RESPONSABLES.FM, deadline: '2026-03-15', statut: 'planifie' },
    ],
  },
];

// Risques liés au Jalon 4 - Équipe Projet
export const RISQUES_JALON4: RisqueCosmosAngre[] = [
  {
    id: 'R09',
    code: 'R09',
    titre: 'Difficulté recrutement Facility Manager',
    description: 'Le profil de Facility Manager qualifié pourrait être difficile à trouver sur le marché local.',
    categorie: 'rh',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J4', 'J6', 'J7'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Sourcing anticipé multi-canaux', responsable: RESPONSABLES.DGA, deadline: '2026-01-31', statut: 'en_cours' },
      { action: 'Mandat cabinet chasseur de têtes', responsable: RESPONSABLES.DGA, deadline: '2026-02-15', statut: 'planifie' },
    ],
    indicateursDeclenchement: ['Pas de candidat final à J-15'],
    actionImmediate: 'Chasseur de têtes urgence',
    axe: 'AXE 1 - RH & Organisation',
  },
  {
    id: 'R10',
    code: 'R10',
    titre: 'Managers recrutés non performants',
    description: 'Les managers recrutés pourraient ne pas répondre aux attentes en termes de compétences ou de leadership.',
    categorie: 'rh',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J4', 'J6'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Période essai stricte avec objectifs', responsable: RESPONSABLES.DGA, deadline: 'Continu', statut: 'planifie' },
      { action: 'Backup possible depuis Cosmos Yopougon', responsable: RESPONSABLES.DGA, deadline: 'Plan B', statut: 'planifie' },
    ],
  },
  {
    id: 'R11',
    code: 'R11',
    titre: 'Retard signature contrat affichage (Cheick)',
    description: 'Le contrat de régie publicitaire pourrait être retardé, impactant les revenus complémentaires.',
    categorie: 'commercial',
    probabilite: 2,
    impact: 2,
    score: 4,
    niveau: 'modere',
    phase: 'phase1_preparation',
    jalonsImpactes: ['J4'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Négociation anticipée Cheick', responsable: RESPONSABLES.DGA, deadline: '2026-02-28', statut: 'en_cours' },
      { action: 'Identifier alternatives régies publicitaires', responsable: RESPONSABLES.MARKETING_MGR, deadline: '2026-03-15', statut: 'planifie' },
    ],
  },
];

// ============================================================================
// PHASE 2 : MOBILISATION (Avril-Sept 2026)
// ============================================================================

// Risques liés aux Jalons 5 & 8 - Commercialisation
export const RISQUES_JALONS_5_8: RisqueCosmosAngre[] = [
  {
    id: 'R12',
    code: 'R12',
    titre: 'Objectif 75% BEFA non atteint à J5',
    description: 'Le taux de commercialisation pourrait ne pas atteindre l\'objectif de 75% à la date cible du Jalon 5.',
    categorie: 'commercial',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J5', 'J8', 'J15'],
    proprietaire: RESPONSABLES.COMMERCIAL_MGR,
    mitigations: [
      { action: 'Intensifier prospection (task force)', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Ajuster conditions commerciales', responsable: RESPONSABLES.DGA, deadline: 'Si nécessaire', statut: 'planifie' },
    ],
    axe: 'AXE 2 - Commercialisation',
  },
  {
    id: 'R13',
    code: 'R13',
    titre: 'Objectif 100% BEFA non atteint à J8',
    description: 'La commercialisation complète pourrait ne pas être atteinte à la date prévue du Jalon 8.',
    categorie: 'commercial',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J8', 'J15'],
    proprietaire: RESPONSABLES.COMMERCIAL_MGR,
    mitigations: [
      { action: 'Accepter seuil minimum 80% occupation', responsable: RESPONSABLES.DGA, deadline: 'Décision T3', statut: 'planifie' },
      { action: 'Plan de rattrapage post-ouverture', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: '2026-09-30', statut: 'planifie' },
    ],
  },
  {
    id: 'R14',
    code: 'R14',
    titre: 'Preneurs signent mais ne valident pas plans',
    description: 'Les preneurs ayant signé pourraient tarder à valider leurs plans d\'aménagement, bloquant les fit-out.',
    categorie: 'commercial',
    probabilite: 3,
    impact: 3,
    score: 9,
    niveau: 'majeur',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J8', 'J15'],
    proprietaire: RESPONSABLES.COMMERCIAL_MGR,
    mitigations: [
      { action: 'Deadline contractuel validation plans', responsable: RESPONSABLES.JURIDIQUE, deadline: 'Dans BEFA', statut: 'planifie' },
      { action: 'Pénalités de retard validation', responsable: RESPONSABLES.JURIDIQUE, deadline: 'Dans BEFA', statut: 'planifie' },
    ],
  },
  {
    id: 'R15',
    code: 'R15',
    titre: 'Défaillance preneur majeur après signature',
    description: 'Un preneur important pourrait faire défaut après la signature du bail.',
    categorie: 'commercial',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J8', 'J15'],
    proprietaire: RESPONSABLES.COMMERCIAL_MGR,
    mitigations: [
      { action: 'Clause résolutoire dans les baux', responsable: RESPONSABLES.JURIDIQUE, deadline: 'Fait', statut: 'fait' },
      { action: 'Maintenir liste d\'attente par emplacement', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'Continu', statut: 'en_cours' },
    ],
  },
];

// Risques liés aux Jalons 6 & 11 - Équipe & Systèmes
export const RISQUES_JALONS_6_11: RisqueCosmosAngre[] = [
  {
    id: 'R16',
    code: 'R16',
    titre: 'Retard recrutement encadrement (Vague 2)',
    description: 'La deuxième vague de recrutement des superviseurs pourrait accuser du retard.',
    categorie: 'rh',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J6', 'J11'],
    proprietaire: RESPONSABLES.MANAGERS,
    mitigations: [
      { action: 'Anticiper sourcing 2 mois avant', responsable: RESPONSABLES.CENTER_MANAGER, deadline: '2026-04-30', statut: 'planifie' },
      { action: 'Mutualisation temporaire Yopougon', responsable: RESPONSABLES.DGA, deadline: 'Si nécessaire', statut: 'planifie' },
    ],
  },
  {
    id: 'R17',
    code: 'R17',
    titre: 'Équipe technique insuffisamment formée',
    description: 'L\'équipe technique pourrait ne pas être suffisamment préparée pour gérer les systèmes et équipements.',
    categorie: 'operationnel',
    probabilite: 3,
    impact: 3,
    score: 9,
    niveau: 'majeur',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J11', 'J14', 'J16'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Programme formation renforcé avec prestataires', responsable: RESPONSABLES.FM, deadline: '2026-08-31', statut: 'planifie' },
      { action: 'Accompagnement prestataires prolongé', responsable: RESPONSABLES.FM, deadline: '3 mois post-ouverture', statut: 'planifie' },
    ],
  },
  {
    id: 'R18',
    code: 'R18',
    titre: 'Retard paramétrage GMAO/ERP',
    description: 'Le paramétrage des systèmes de gestion pourrait prendre plus de temps que prévu.',
    categorie: 'technique',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J11'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Démarrer paramétrage dès M-6', responsable: RESPONSABLES.FM, deadline: '2026-05-15', statut: 'planifie' },
      { action: 'Prestataire dédié paramétrage', responsable: RESPONSABLES.FM, deadline: '2026-04-30', statut: 'planifie' },
    ],
  },
  {
    id: 'R19',
    code: 'R19',
    titre: 'Procédures non adaptées au contexte Angré',
    description: 'Les procédures copiées de Yopougon pourraient ne pas convenir aux spécificités de Cosmos Angré.',
    categorie: 'operationnel',
    probabilite: 2,
    impact: 2,
    score: 4,
    niveau: 'modere',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J11'],
    proprietaire: RESPONSABLES.MANAGERS,
    mitigations: [
      { action: 'Revue procédures avec équipe terrain', responsable: RESPONSABLES.CENTER_MANAGER, deadline: '2026-09-30', statut: 'planifie' },
      { action: 'Ajustements post-formation', responsable: RESPONSABLES.CENTER_MANAGER, deadline: '2026-10-31', statut: 'planifie' },
    ],
  },
];

// Risques liés aux Jalons 7, 9, 10 - Réceptions Techniques
export const RISQUES_JALONS_7_9_10: RisqueCosmosAngre[] = [
  {
    id: 'R20',
    code: 'R20',
    titre: 'Retard réception Centre Commercial',
    description: 'La réception du Centre Commercial pourrait être retardée par le constructeur.',
    categorie: 'technique',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J7', 'J8', 'J14', 'J16'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Suivi serré avancement chantier', responsable: RESPONSABLES.FM, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Réunions chantier 2x/semaine', responsable: RESPONSABLES.FM, deadline: 'Continu', statut: 'en_cours' },
    ],
    indicateursDeclenchement: ['> 3 semaines retard annoncé'],
    actionImmediate: 'Escalade PDG + constructeur',
  },
  {
    id: 'R21',
    code: 'R21',
    titre: 'Retard réception Big Box (impact Carrefour)',
    description: 'Le retard de livraison des Big Box pourrait impacter directement Carrefour et les autres enseignes majeures.',
    categorie: 'technique',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J9', 'J15', 'J16'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Prioriser BB1 pour Carrefour', responsable: RESPONSABLES.FM, deadline: 'Priorité 1', statut: 'en_cours' },
      { action: 'Coordination directe avec Carrefour', responsable: RESPONSABLES.DGA, deadline: 'Hebdo', statut: 'en_cours' },
    ],
  },
  {
    id: 'R22',
    code: 'R22',
    titre: 'Nombre réserves excessif à la réception',
    description: 'Le nombre de réserves à lever pourrait être trop important, retardant la mise en service.',
    categorie: 'technique',
    probabilite: 3,
    impact: 3,
    score: 9,
    niveau: 'majeur',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J7', 'J9', 'J10', 'J14'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'OPR anticipé (pré-réception)', responsable: RESPONSABLES.FM, deadline: 'M-2 chaque livraison', statut: 'planifie' },
      { action: 'Pression continue sur constructeur', responsable: RESPONSABLES.DGA, deadline: 'Continu', statut: 'en_cours' },
    ],
  },
  {
    id: 'R23',
    code: 'R23',
    titre: 'Mise en service électricité retardée',
    description: 'La CIE pourrait retarder la mise en service électrique définitive.',
    categorie: 'technique',
    probabilite: 2,
    impact: 4,
    score: 8,
    niveau: 'majeur',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J7', 'J9'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Coordination anticipée CIE', responsable: RESPONSABLES.FM, deadline: 'M-4', statut: 'planifie' },
      { action: 'Dossier technique complet en avance', responsable: RESPONSABLES.FM, deadline: 'M-3', statut: 'planifie' },
    ],
  },
  {
    id: 'R24',
    code: 'R24',
    titre: 'Problème mise en service CVC',
    description: 'Le système de climatisation/ventilation pourrait rencontrer des problèmes de mise en service.',
    categorie: 'technique',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J9', 'J14'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Tests anticipés systèmes CVC', responsable: RESPONSABLES.FM, deadline: 'M-2', statut: 'planifie' },
      { action: 'Contrat maintenance prêt à activer', responsable: RESPONSABLES.FM, deadline: 'M-1', statut: 'planifie' },
    ],
  },
  {
    id: 'R25',
    code: 'R25',
    titre: 'DOE incomplets ou non conformes',
    description: 'Les Dossiers des Ouvrages Exécutés pourraient être incomplets ou non conformes aux exigences.',
    categorie: 'technique',
    probabilite: 3,
    impact: 2,
    score: 6,
    niveau: 'modere',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J7', 'J14'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Checklist DOE stricte', responsable: RESPONSABLES.FM, deadline: 'Défini', statut: 'fait' },
      { action: 'Retenue sur paiement final constructeur', responsable: RESPONSABLES.JURIDIQUE, deadline: 'Dans contrat', statut: 'fait' },
    ],
  },
];

// Risques liés aux Jalons 12 & 13 - Marketing
export const RISQUES_JALONS_12_13: RisqueCosmosAngre[] = [
  {
    id: 'R26',
    code: 'R26',
    titre: 'Identité visuelle non validée à temps',
    description: 'La charte graphique et l\'identité visuelle pourraient ne pas être finalisées dans les délais.',
    categorie: 'operationnel',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J12', 'J13'],
    proprietaire: RESPONSABLES.MARKETING_MGR,
    mitigations: [
      { action: 'Démarrer création identité dès janvier', responsable: RESPONSABLES.MARKETING_MGR, deadline: '2026-01-15', statut: 'en_cours' },
      { action: 'Limiter nombre d\'itérations (max 3)', responsable: RESPONSABLES.DGA, deadline: 'Règle', statut: 'fait' },
    ],
  },
  {
    id: 'R27',
    code: 'R27',
    titre: 'Parcours client mal conçu',
    description: 'Le parcours client et la signalétique pourraient ne pas être optimaux pour l\'expérience visiteur.',
    categorie: 'operationnel',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J12', 'J16'],
    proprietaire: RESPONSABLES.MARKETING_MGR,
    mitigations: [
      { action: 'Benchmark centres de référence', responsable: RESPONSABLES.MARKETING_MGR, deadline: '2026-03-31', statut: 'planifie' },
      { action: 'Validation terrain avec équipe', responsable: RESPONSABLES.CENTER_MANAGER, deadline: '2026-08-31', statut: 'planifie' },
    ],
  },
  {
    id: 'R28',
    code: 'R28',
    titre: 'Retard livraison signalétique',
    description: 'La signalétique pourrait être livrée en retard par le fournisseur.',
    categorie: 'technique',
    probabilite: 3,
    impact: 3,
    score: 9,
    niveau: 'majeur',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J13', 'J16'],
    proprietaire: RESPONSABLES.MARKETING_MGR,
    mitigations: [
      { action: 'Commander signalétique avec marge', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'M-3', statut: 'planifie' },
      { action: 'Fournisseur backup identifié', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'M-4', statut: 'planifie' },
    ],
  },
  {
    id: 'R29',
    code: 'R29',
    titre: 'Site web non prêt',
    description: 'Le site web du centre pourrait ne pas être opérationnel pour le lancement.',
    categorie: 'technique',
    probabilite: 2,
    impact: 2,
    score: 4,
    niveau: 'modere',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J13'],
    proprietaire: RESPONSABLES.MARKETING_MGR,
    mitigations: [
      { action: 'Agence web avec deadline contractuel', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'M-2', statut: 'planifie' },
      { action: 'Pénalités de retard dans contrat', responsable: RESPONSABLES.JURIDIQUE, deadline: 'Fait', statut: 'fait' },
    ],
  },
  {
    id: 'R30',
    code: 'R30',
    titre: 'Campagne teasing inefficace',
    description: 'La campagne de teasing pourrait ne pas générer l\'engouement attendu.',
    categorie: 'operationnel',
    probabilite: 2,
    impact: 2,
    score: 4,
    niveau: 'modere',
    phase: 'phase2_mobilisation',
    jalonsImpactes: ['J13', 'J16'],
    proprietaire: RESPONSABLES.MARKETING_MGR,
    mitigations: [
      { action: 'A/B testing des messages', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'Continu', statut: 'planifie' },
      { action: 'Ajustement stratégie en cours de campagne', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'Agile', statut: 'planifie' },
    ],
  },
];

// ============================================================================
// PHASE 3 : LANCEMENT (Oct-Nov 2026)
// ============================================================================

// Risques liés aux Jalons 14 & 15 - Préparation Finale
export const RISQUES_JALONS_14_15: RisqueCosmosAngre[] = [
  {
    id: 'R31',
    code: 'R31',
    titre: 'Levée réserves <80% au 31/10',
    description: 'Le taux de levée des réserves pourrait être insuffisant avant le soft opening.',
    categorie: 'technique',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J14', 'J16'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Task force levée réserves', responsable: RESPONSABLES.FM, deadline: '2026-10-01', statut: 'planifie' },
      { action: 'Arbitrage DGA sur réserves critiques', responsable: RESPONSABLES.DGA, deadline: 'Continu', statut: 'planifie' },
    ],
  },
  {
    id: 'R32',
    code: 'R32',
    titre: 'Échec tests intégration systèmes',
    description: 'Les tests d\'intégration des systèmes (SSI, GMAO, parking) pourraient échouer.',
    categorie: 'technique',
    probabilite: 2,
    impact: 4,
    score: 8,
    niveau: 'majeur',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J14', 'J16'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Tests progressifs par système', responsable: RESPONSABLES.FM, deadline: 'M-3 à M-1', statut: 'planifie' },
      { action: 'Plan B procédures manuelles', responsable: RESPONSABLES.FM, deadline: '2026-10-15', statut: 'planifie' },
    ],
  },
  {
    id: 'R33',
    code: 'R33',
    titre: 'Fit-out preneurs non terminé',
    description: 'Certains preneurs pourraient ne pas avoir terminé leur aménagement à temps.',
    categorie: 'commercial',
    probabilite: 3,
    impact: 4,
    score: 12,
    niveau: 'critique',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J15', 'J16'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Suivi hebdo fit-out tous preneurs', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Pression et aide aux retardataires', responsable: RESPONSABLES.FM, deadline: 'M-1', statut: 'planifie' },
    ],
    indicateursDeclenchement: ['> 20% preneurs en retard à J-30'],
    actionImmediate: 'Réunion individuelle + ultimatum',
  },
  {
    id: 'R34',
    code: 'R34',
    titre: 'Fit-out Carrefour en retard',
    description: 'Carrefour pourrait ne pas avoir terminé son aménagement pour le soft opening.',
    categorie: 'commercial',
    probabilite: 2,
    impact: 4,
    score: 8,
    niveau: 'majeur',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J15', 'J16'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Coordination directe équipe Carrefour', responsable: RESPONSABLES.DGA, deadline: 'Hebdo', statut: 'en_cours' },
      { action: 'Escalade direction Carrefour si retard', responsable: RESPONSABLES.DGA, deadline: 'Si nécessaire', statut: 'planifie' },
    ],
  },
];

// Risques liés au Jalon 16 - SOFT OPENING
export const RISQUES_JALON16: RisqueCosmosAngre[] = [
  {
    id: 'R35',
    code: 'R35',
    titre: 'Avis défavorable commission sécurité',
    description: 'La commission de sécurité pourrait émettre un avis défavorable, bloquant l\'ouverture.',
    categorie: 'reglementaire',
    probabilite: 2,
    impact: 4,
    score: 8,
    niveau: 'majeur',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J16'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Pré-visite commission informelle', responsable: RESPONSABLES.DGA, deadline: 'M-2', statut: 'planifie' },
      { action: 'Conformité SSI totale vérifiée', responsable: RESPONSABLES.SECURITY_MGR, deadline: 'M-1', statut: 'planifie' },
    ],
    indicateursDeclenchement: ['Non-conformité identifiée à J-15'],
    actionImmediate: 'Travaux urgents 24/7',
    axe: 'AXE 6 - Exploitation',
  },
  {
    id: 'R36',
    code: 'R36',
    titre: 'Report Soft Opening',
    description: 'Le soft opening pourrait devoir être reporté pour diverses raisons.',
    categorie: 'operationnel',
    probabilite: 2,
    impact: 4,
    score: 8,
    niveau: 'majeur',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J16', 'J17'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Plan B date alternative (22/11)', responsable: RESPONSABLES.DGA, deadline: 'Prêt', statut: 'fait' },
      { action: 'Communication de crise préparée', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'M-1', statut: 'planifie' },
    ],
  },
  {
    id: 'R37',
    code: 'R37',
    titre: 'Équipe non prête le jour J',
    description: 'L\'équipe d\'exploitation pourrait ne pas être suffisamment préparée pour le jour de l\'ouverture.',
    categorie: 'rh',
    probabilite: 2,
    impact: 4,
    score: 8,
    niveau: 'majeur',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J16'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Simulation grandeur nature obligatoire', responsable: RESPONSABLES.CENTER_MANAGER, deadline: 'J-7', statut: 'planifie' },
      { action: 'Checklist pré-ouverture validée', responsable: RESPONSABLES.CENTER_MANAGER, deadline: 'J-3', statut: 'planifie' },
    ],
  },
  {
    id: 'R38',
    code: 'R38',
    titre: 'Signalétique non installée',
    description: 'La signalétique pourrait ne pas être entièrement installée pour l\'ouverture.',
    categorie: 'operationnel',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J16'],
    proprietaire: RESPONSABLES.MARKETING_MGR,
    mitigations: [
      { action: 'Installation commencée J-15', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'J-15', statut: 'planifie' },
      { action: 'Équipe dédiée installation', responsable: RESPONSABLES.FM, deadline: 'J-10', statut: 'planifie' },
    ],
  },
  {
    id: 'R39',
    code: 'R39',
    titre: 'Incident technique jour d\'ouverture',
    description: 'Un incident technique majeur pourrait survenir le jour de l\'ouverture.',
    categorie: 'technique',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J16'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Équipe technique renforcée J-Day', responsable: RESPONSABLES.FM, deadline: 'J-Day', statut: 'planifie' },
      { action: 'Astreinte prestataires confirmée', responsable: RESPONSABLES.FM, deadline: 'J-7', statut: 'planifie' },
    ],
  },
  {
    id: 'R40',
    code: 'R40',
    titre: 'Faible affluence à l\'ouverture',
    description: 'L\'affluence le jour de l\'ouverture pourrait être décevante.',
    categorie: 'operationnel',
    probabilite: 2,
    impact: 2,
    score: 4,
    niveau: 'modere',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J16'],
    proprietaire: RESPONSABLES.MARKETING_MGR,
    mitigations: [
      { action: 'Campagne lancement renforcée', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'J-14', statut: 'planifie' },
      { action: 'Événement attractif prévu', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'J-Day', statut: 'planifie' },
    ],
  },
];

// Risques liés au Jalon 17 - INAUGURATION
export const RISQUES_JALON17: RisqueCosmosAngre[] = [
  {
    id: 'R41',
    code: 'R41',
    titre: 'VIP indisponibles date prévue',
    description: 'Les personnalités invitées pourraient ne pas être disponibles à la date d\'inauguration.',
    categorie: 'operationnel',
    probabilite: 2,
    impact: 2,
    score: 4,
    niveau: 'modere',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J17'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Sonder disponibilités VIP tôt', responsable: RESPONSABLES.DGA, deadline: 'M-3', statut: 'planifie' },
      { action: 'Garder flexibilité sur la date', responsable: RESPONSABLES.DGA, deadline: 'Jusqu\'à M-2', statut: 'planifie' },
    ],
  },
  {
    id: 'R42',
    code: 'R42',
    titre: 'Incident lors de l\'inauguration',
    description: 'Un incident de sécurité ou technique pourrait survenir pendant la cérémonie d\'inauguration.',
    categorie: 'operationnel',
    probabilite: 1,
    impact: 3,
    score: 3,
    niveau: 'faible',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J17'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Plan sécurité renforcé événement', responsable: RESPONSABLES.SECURITY_MGR, deadline: 'J-7', statut: 'planifie' },
      { action: 'Répétition générale complète', responsable: RESPONSABLES.CENTER_MANAGER, deadline: 'J-2', statut: 'planifie' },
    ],
  },
  {
    id: 'R43',
    code: 'R43',
    titre: 'Couverture média insuffisante',
    description: 'La couverture médiatique de l\'inauguration pourrait être décevante.',
    categorie: 'operationnel',
    probabilite: 2,
    impact: 2,
    score: 4,
    niveau: 'modere',
    phase: 'phase3_lancement',
    jalonsImpactes: ['J17'],
    proprietaire: RESPONSABLES.MARKETING_MGR,
    mitigations: [
      { action: 'Relations presse anticipées', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'M-2', statut: 'planifie' },
      { action: 'Dossier presse attractif', responsable: RESPONSABLES.MARKETING_MGR, deadline: 'M-1', statut: 'planifie' },
    ],
  },
];

// ============================================================================
// PHASE 4 : STABILISATION (Déc 2026-Fév 2027)
// ============================================================================

// Risques liés aux Jalons 18 & 19 - Stabilisation
export const RISQUES_JALONS_18_19: RisqueCosmosAngre[] = [
  {
    id: 'R44',
    code: 'R44',
    titre: 'KPIs exploitation sous objectifs',
    description: 'Les indicateurs de performance d\'exploitation pourraient être en dessous des objectifs.',
    categorie: 'operationnel',
    probabilite: 3,
    impact: 3,
    score: 9,
    niveau: 'majeur',
    phase: 'phase4_stabilisation',
    jalonsImpactes: ['J18'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Analyse rapide des écarts', responsable: RESPONSABLES.CENTER_MANAGER, deadline: 'Hebdo', statut: 'planifie' },
      { action: 'Actions correctrices immédiates', responsable: RESPONSABLES.DGA, deadline: 'Continu', statut: 'planifie' },
    ],
  },
  {
    id: 'R45',
    code: 'R45',
    titre: 'Turnover équipe post-ouverture',
    description: 'Le turnover du personnel pourrait être élevé après l\'ouverture, fragilisant l\'exploitation.',
    categorie: 'rh',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase4_stabilisation',
    jalonsImpactes: ['J18'],
    proprietaire: RESPONSABLES.DGA,
    mitigations: [
      { action: 'Conditions attractives et reconnaissance', responsable: RESPONSABLES.DGA, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Suivi RH rapproché post-ouverture', responsable: RESPONSABLES.RH, deadline: '3 mois', statut: 'planifie' },
    ],
  },
  {
    id: 'R46',
    code: 'R46',
    titre: 'Preneurs en difficulté (fermetures)',
    description: 'Certains preneurs pourraient rencontrer des difficultés financières et risquer la fermeture.',
    categorie: 'commercial',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase4_stabilisation',
    jalonsImpactes: ['J18'],
    proprietaire: RESPONSABLES.COMMERCIAL_MGR,
    mitigations: [
      { action: 'Accompagnement preneurs fragiles', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'Continu', statut: 'planifie' },
      { action: 'Clause remplacement dans baux', responsable: RESPONSABLES.JURIDIQUE, deadline: 'Fait', statut: 'fait' },
    ],
  },
  {
    id: 'R47',
    code: 'R47',
    titre: 'Dépassement budget mobilisation',
    description: 'Le budget global de mobilisation pourrait dépasser l\'enveloppe initiale.',
    categorie: 'financier',
    probabilite: 2,
    impact: 3,
    score: 6,
    niveau: 'modere',
    phase: 'phase4_stabilisation',
    jalonsImpactes: ['J19'],
    proprietaire: RESPONSABLES.FINANCE,
    mitigations: [
      { action: 'Suivi budgétaire mensuel strict', responsable: RESPONSABLES.FINANCE, deadline: 'Mensuel', statut: 'en_cours' },
      { action: 'Arbitrages rapides si écart', responsable: RESPONSABLES.DGA, deadline: 'Si nécessaire', statut: 'planifie' },
    ],
  },
  {
    id: 'R48',
    code: 'R48',
    titre: 'Levée réserves 100% non atteinte',
    description: 'La levée totale des réserves constructeur pourrait ne pas être atteinte dans les délais.',
    categorie: 'technique',
    probabilite: 2,
    impact: 2,
    score: 4,
    niveau: 'modere',
    phase: 'phase4_stabilisation',
    jalonsImpactes: ['J19'],
    proprietaire: RESPONSABLES.FM,
    mitigations: [
      { action: 'Pression continue constructeur', responsable: RESPONSABLES.FM, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Retenue garantie maintenue', responsable: RESPONSABLES.JURIDIQUE, deadline: 'Jusqu\'à levée', statut: 'fait' },
    ],
  },
];

// ============================================================================
// REGISTRE COMPLET
// ============================================================================

export const REGISTRE_RISQUES_COSMOS_ANGRE: RisqueCosmosAngre[] = [
  // Phase 1
  ...RISQUES_JALON1,
  ...RISQUES_JALON2,
  ...RISQUES_JALON3,
  ...RISQUES_JALON4,
  // Phase 2
  ...RISQUES_JALONS_5_8,
  ...RISQUES_JALONS_6_11,
  ...RISQUES_JALONS_7_9_10,
  ...RISQUES_JALONS_12_13,
  // Phase 3
  ...RISQUES_JALONS_14_15,
  ...RISQUES_JALON16,
  ...RISQUES_JALON17,
  // Phase 4
  ...RISQUES_JALONS_18_19,
];

// ============================================================================
// SYNTHÈSE & STATISTIQUES
// ============================================================================

export const SYNTHESE_RISQUES = {
  total: 46,
  parNiveau: {
    critique: 10,
    majeur: 12,
    modere: 23,
    faible: 1,
  },
  parAxe: {
    technique: { risques: 15, critiques: 5 },
    commercial: { risques: 10, critiques: 4 },
    rh: { risques: 5, critiques: 1 },
    financier: { risques: 2, critiques: 1 },
    reglementaire: { risques: 1, critiques: 0 },
    operationnel: { risques: 13, critiques: 0 },
  },
  top10Critiques: ['R06', 'R07', 'R09', 'R04', 'R12', 'R13', 'R20', 'R21', 'R31', 'R33'],
  planSuivi: {
    hebdomadaire: 'Critiques (10 risques) - Responsable: DGA',
    biMensuel: 'Majeurs (12 risques) - Responsable: Managers concernés',
    mensuel: 'Modérés (23 risques) - Responsable: Revue COPIL',
    trimestriel: 'Faibles + Revue globale - Responsable: DGA + PDG',
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export const getRisqueById = (id: string): RisqueCosmosAngre | undefined =>
  REGISTRE_RISQUES_COSMOS_ANGRE.find(r => r.id === id);

export const getRisquesByPhase = (phase: ProjectPhase): RisqueCosmosAngre[] =>
  REGISTRE_RISQUES_COSMOS_ANGRE.filter(r => r.phase === phase);

export const getRisquesByNiveau = (niveau: RisqueNiveau): RisqueCosmosAngre[] =>
  REGISTRE_RISQUES_COSMOS_ANGRE.filter(r => r.niveau === niveau);

export const getRisquesByCategorie = (categorie: RisqueCategory): RisqueCosmosAngre[] =>
  REGISTRE_RISQUES_COSMOS_ANGRE.filter(r => r.categorie === categorie);

export const getRisquesByJalon = (jalonId: string): RisqueCosmosAngre[] =>
  REGISTRE_RISQUES_COSMOS_ANGRE.filter(r => r.jalonsImpactes.includes(jalonId));

export const getRisquesCritiques = (): RisqueCosmosAngre[] =>
  REGISTRE_RISQUES_COSMOS_ANGRE.filter(r => r.niveau === 'critique');

export const getTop10Risques = (): RisqueCosmosAngre[] =>
  [...REGISTRE_RISQUES_COSMOS_ANGRE]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
