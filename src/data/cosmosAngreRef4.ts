// ============================================================================
// COSMOS ANGRÉ - RÉFÉRENTIEL V2.0 COMPLÉMENTAIRE
// RACI | Budget Détaillé | Fiches Risques Enrichies
// ============================================================================

import { RESPONSABLES } from './cosmosAngreRef';
import type { ProjectPhase } from '@/types';

// ============================================================================
// 1. MATRICE RACI
// ============================================================================

export type RACIRole = 'R' | 'A' | 'C' | 'I' | '';

export interface RACIEntry {
  livrable: string;
  phase: ProjectPhase;
  categorie: 'preparation' | 'mobilisation' | 'lancement' | 'gouvernance';
  PDG: RACIRole;
  DGA: RACIRole;
  CenterMgr: RACIRole;
  CommercialMgr: RACIRole;
  FM: RACIRole;
  SecurityMgr: RACIRole;
  MarketingMgr: RACIRole;
  Finance: RACIRole;
}

export const RACI_LEGEND = {
  R: { label: 'Responsible', description: 'Réalise le travail' },
  A: { label: 'Accountable', description: 'Responsable final (1 seul par ligne)' },
  C: { label: 'Consulted', description: 'Donne un avis avant décision' },
  I: { label: 'Informed', description: 'Informé après décision' },
} as const;

// RACI Phase Préparation
export const RACI_PREPARATION: RACIEntry[] = [
  { livrable: 'Budget projet consolidé', phase: 'phase1_preparation', categorie: 'preparation', PDG: 'A', DGA: 'R', CenterMgr: 'C', CommercialMgr: 'C', FM: 'C', SecurityMgr: 'C', MarketingMgr: 'C', Finance: 'R' },
  { livrable: 'Plan commercialisation', phase: 'phase1_preparation', categorie: 'preparation', PDG: 'I', DGA: 'A', CenterMgr: 'C', CommercialMgr: 'R', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'C', Finance: 'C' },
  { livrable: 'Organigramme cible', phase: 'phase1_preparation', categorie: 'preparation', PDG: 'A', DGA: 'R', CenterMgr: 'C', CommercialMgr: 'I', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'I' },
  { livrable: 'Stratégie communication', phase: 'phase1_preparation', categorie: 'preparation', PDG: 'I', DGA: 'A', CenterMgr: 'C', CommercialMgr: 'C', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'R', Finance: 'I' },
  { livrable: 'Audit technique', phase: 'phase1_preparation', categorie: 'preparation', PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'C', MarketingMgr: 'I', Finance: 'I' },
  { livrable: 'Grille tarifaire', phase: 'phase1_preparation', categorie: 'preparation', PDG: 'A', DGA: 'R', CenterMgr: 'I', CommercialMgr: 'R', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'C' },
  { livrable: 'Étude de marché', phase: 'phase1_preparation', categorie: 'preparation', PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'R', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'C', Finance: 'I' },
];

// RACI Phase Mobilisation
export const RACI_MOBILISATION: RACIEntry[] = [
  { livrable: 'Recrutement managers', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'A', DGA: 'R', CenterMgr: 'I', CommercialMgr: 'I', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'I' },
  { livrable: 'Recrutement équipes', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'I' },
  { livrable: 'Signatures BEFA 70%', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'R', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'C' },
  { livrable: 'Signature Carrefour', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'A', DGA: 'R', CenterMgr: 'I', CommercialMgr: 'R', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'C' },
  { livrable: 'Handover technique', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'C', MarketingMgr: 'I', Finance: 'I' },
  { livrable: 'Réception OPR', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'C', MarketingMgr: 'I', Finance: 'I' },
  { livrable: 'Levée réserves', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'I' },
  { livrable: 'Contrats exploitation', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'I', Finance: 'C' },
  { livrable: 'Procédures exploitation', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'I', Finance: 'I' },
  { livrable: 'Systèmes (ERP, GMAO)', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'R' },
  { livrable: 'Campagne teasing', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'I', DGA: 'A', CenterMgr: 'C', CommercialMgr: 'C', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'R', Finance: 'C' },
  { livrable: 'Site web', phase: 'phase2_mobilisation', categorie: 'mobilisation', PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'C', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'R', Finance: 'I' },
];

// RACI Phase Lancement
export const RACI_LANCEMENT: RACIEntry[] = [
  { livrable: 'Commission sécurité', phase: 'phase3_lancement', categorie: 'lancement', PDG: 'C', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'I', Finance: 'I' },
  { livrable: 'Soft Opening', phase: 'phase3_lancement', categorie: 'lancement', PDG: 'A', DGA: 'R', CenterMgr: 'R', CommercialMgr: 'R', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'R', Finance: 'I' },
  { livrable: 'Inauguration', phase: 'phase3_lancement', categorie: 'lancement', PDG: 'A', DGA: 'R', CenterMgr: 'R', CommercialMgr: 'C', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'R', Finance: 'C' },
  { livrable: 'Campagne lancement', phase: 'phase3_lancement', categorie: 'lancement', PDG: 'I', DGA: 'A', CenterMgr: 'C', CommercialMgr: 'C', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'R', Finance: 'C' },
  { livrable: 'Formation équipes', phase: 'phase3_lancement', categorie: 'lancement', PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'I', Finance: 'I' },
  { livrable: 'Test grandeur nature', phase: 'phase3_lancement', categorie: 'lancement', PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'I', Finance: 'I' },
];

// RACI Gouvernance & Reporting
export const RACI_GOUVERNANCE: RACIEntry[] = [
  { livrable: 'Flash hebdo', phase: 'phase2_mobilisation', categorie: 'gouvernance', PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'C', FM: 'C', SecurityMgr: 'C', MarketingMgr: 'C', Finance: 'C' },
  { livrable: 'Rapport mensuel investisseurs', phase: 'phase2_mobilisation', categorie: 'gouvernance', PDG: 'A', DGA: 'R', CenterMgr: 'C', CommercialMgr: 'C', FM: 'C', SecurityMgr: 'C', MarketingMgr: 'C', Finance: 'R' },
  { livrable: 'EXCO mensuel', phase: 'phase2_mobilisation', categorie: 'gouvernance', PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'R', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'R', Finance: 'R' },
  { livrable: 'COPIL projet', phase: 'phase2_mobilisation', categorie: 'gouvernance', PDG: 'A', DGA: 'R', CenterMgr: 'C', CommercialMgr: 'I', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'C' },
  { livrable: 'Arbitrages budget', phase: 'phase2_mobilisation', categorie: 'gouvernance', PDG: 'A', DGA: 'R', CenterMgr: 'C', CommercialMgr: 'C', FM: 'C', SecurityMgr: 'C', MarketingMgr: 'C', Finance: 'R' },
];

// Toutes les entrées RACI
export const RACI_COMPLETE = [
  ...RACI_PREPARATION,
  ...RACI_MOBILISATION,
  ...RACI_LANCEMENT,
  ...RACI_GOUVERNANCE,
];

// ============================================================================
// 2. BUDGET DÉTAILLÉ PAR PHASE
// ============================================================================

export interface BudgetPhase {
  phase: ProjectPhase;
  label: string;
  periode: string;
  montantTotal: number;
  pourcentage: number;
  categories: BudgetCategorie[];
}

export interface BudgetCategorie {
  code: string;
  label: string;
  montant: number;
  postes: BudgetPoste[];
}

export interface BudgetPoste {
  id: string;
  label: string;
  montant: number;
  commentaire?: string;
  effectif?: number;
  salaireMensuel?: number;
  mois?: number;
}

// Phase 1 : Préparation - 150M FCFA
export const BUDGET_PHASE1: BudgetPhase = {
  phase: 'phase1_preparation',
  label: 'Phase 1 : Préparation',
  periode: 'T4 2025 – T1 2026',
  montantTotal: 150_000_000,
  pourcentage: 8,
  categories: [
    {
      code: 'P1-ETUDES',
      label: 'Études & Audits',
      montant: 50_000_000,
      postes: [
        { id: 'P1-001', label: 'Études de marché', montant: 25_000_000, commentaire: 'Cabinet spécialisé' },
        { id: 'P1-002', label: 'Audit technique', montant: 15_000_000, commentaire: 'Bureau de contrôle' },
        { id: 'P1-003', label: 'Audit juridique', montant: 10_000_000, commentaire: 'Cabinet avocat' },
      ],
    },
    {
      code: 'P1-CONSEIL',
      label: 'Consultants',
      montant: 35_000_000,
      postes: [
        { id: 'P1-004', label: 'Consultant commercial', montant: 20_000_000, commentaire: '4 mois mission' },
        { id: 'P1-005', label: 'Consultant facility', montant: 15_000_000, commentaire: '4 mois mission' },
      ],
    },
    {
      code: 'P1-RECRUTEMENT',
      label: 'Recrutement managers',
      montant: 30_000_000,
      postes: [
        { id: 'P1-006', label: 'Frais agence recrutement (managers)', montant: 30_000_000, commentaire: '5 postes × 6M' },
      ],
    },
    {
      code: 'P1-COMM',
      label: 'Communication',
      montant: 25_000_000,
      postes: [
        { id: 'P1-007', label: 'Identité visuelle (agence)', montant: 25_000_000, commentaire: 'Création charte complète' },
      ],
    },
    {
      code: 'P1-IMPREVUS',
      label: 'Provisions',
      montant: 10_000_000,
      postes: [
        { id: 'P1-008', label: 'Frais divers & imprévus', montant: 10_000_000, commentaire: '7%' },
      ],
    },
  ],
};

// Phase 2 : Mobilisation - 1,200M FCFA
export const BUDGET_PHASE2: BudgetPhase = {
  phase: 'phase2_mobilisation',
  label: 'Phase 2 : Mobilisation',
  periode: 'T1 – T3 2026',
  montantTotal: 1_200_000_000,
  pourcentage: 65,
  categories: [
    {
      code: 'P2-RH',
      label: 'Recrutement & Masse salariale pré-ouverture',
      montant: 287_000_000,
      postes: [
        { id: 'P2-001', label: 'Center Manager', montant: 36_000_000, effectif: 1, salaireMensuel: 4_000_000, mois: 9 },
        { id: 'P2-002', label: 'Commercial Manager', montant: 24_000_000, effectif: 1, salaireMensuel: 3_000_000, mois: 8 },
        { id: 'P2-003', label: 'Facility Manager', montant: 24_000_000, effectif: 1, salaireMensuel: 3_000_000, mois: 8 },
        { id: 'P2-004', label: 'Security Manager', montant: 20_000_000, effectif: 1, salaireMensuel: 2_500_000, mois: 8 },
        { id: 'P2-005', label: 'Marketing Manager', montant: 17_500_000, effectif: 1, salaireMensuel: 2_500_000, mois: 7 },
        { id: 'P2-006', label: 'Encadrement (Vague 2)', montant: 52_500_000, effectif: 7, salaireMensuel: 1_500_000, mois: 5 },
        { id: 'P2-007', label: 'Opérationnels (Vague 3)', montant: 28_800_000, effectif: 12, salaireMensuel: 800_000, mois: 3 },
        { id: 'P2-008', label: 'Renforts (Vague 4)', montant: 9_600_000, effectif: 8, salaireMensuel: 600_000, mois: 2 },
        { id: 'P2-009', label: 'Charges sociales (35%)', montant: 74_540_000, commentaire: '35% masse salariale' },
      ],
    },
    {
      code: 'P2-TRAVAUX',
      label: 'Travaux & Aménagements',
      montant: 480_000_000,
      postes: [
        { id: 'P2-010', label: 'Travaux mise en conformité', montant: 200_000_000, commentaire: 'Selon audit' },
        { id: 'P2-011', label: 'Aménagement espaces communs', montant: 150_000_000, commentaire: 'Mobilier, décoration' },
        { id: 'P2-012', label: 'Signalétique intérieure', montant: 50_000_000, commentaire: 'Directionnel + enseignes' },
        { id: 'P2-013', label: 'Signalétique extérieure', montant: 40_000_000, commentaire: 'Totems, façades' },
        { id: 'P2-014', label: 'Aménagement PC sécurité', montant: 25_000_000, commentaire: 'Équipements' },
        { id: 'P2-015', label: 'Aménagement locaux techniques', montant: 15_000_000 },
      ],
    },
    {
      code: 'P2-EQUIPEMENTS',
      label: 'Équipements & Systèmes',
      montant: 130_000_000,
      postes: [
        { id: 'P2-016', label: 'ERP / Logiciel gestion', montant: 30_000_000, commentaire: 'Licence + paramétrage' },
        { id: 'P2-017', label: 'GMAO', montant: 15_000_000, commentaire: 'Licence + paramétrage' },
        { id: 'P2-018', label: 'Système de caisse', montant: 20_000_000, commentaire: 'Hardware + software' },
        { id: 'P2-019', label: 'Équipements IT (PC, imprimantes)', montant: 25_000_000, commentaire: '30 postes' },
        { id: 'P2-020', label: 'Radios / Talkies-walkies', montant: 8_000_000, commentaire: '40 unités' },
        { id: 'P2-021', label: 'Uniformes staff', montant: 12_000_000, commentaire: '50 personnes' },
        { id: 'P2-022', label: 'Mobilier bureaux', montant: 20_000_000 },
      ],
    },
    {
      code: 'P2-COMMERCIAL',
      label: 'Commercialisation',
      montant: 173_000_000,
      postes: [
        { id: 'P2-023', label: 'Plaquette commerciale', montant: 10_000_000, commentaire: 'Design + impression' },
        { id: 'P2-024', label: 'Site web commercialisation', montant: 8_000_000, commentaire: 'Développement' },
        { id: 'P2-025', label: 'Honoraires agents commerciaux', montant: 50_000_000, commentaire: 'Commissions' },
        { id: 'P2-026', label: 'Incentives preneurs', montant: 80_000_000, commentaire: 'Mois gratuits, aménagements' },
        { id: 'P2-027', label: 'Frais juridiques (baux)', montant: 25_000_000, commentaire: 'Notaire, avocats' },
      ],
    },
    {
      code: 'P2-COMM',
      label: 'Communication pré-ouverture',
      montant: 115_000_000,
      postes: [
        { id: 'P2-028', label: 'Campagne teasing digital', montant: 30_000_000, commentaire: '3 mois' },
        { id: 'P2-029', label: 'Affichage OOH', montant: 40_000_000, commentaire: 'Panneaux Abidjan' },
        { id: 'P2-030', label: 'Relations presse', montant: 15_000_000, commentaire: 'Agence RP' },
        { id: 'P2-031', label: 'Shootings photo/vidéo', montant: 20_000_000, commentaire: '2 sessions' },
        { id: 'P2-032', label: 'Community management', montant: 10_000_000, commentaire: '6 mois' },
      ],
    },
    {
      code: 'P2-IMPREVUS',
      label: 'Provisions',
      montant: 115_000_000,
      postes: [
        { id: 'P2-033', label: 'Imprévus (10%)', montant: 115_000_000, commentaire: 'Contingence' },
      ],
    },
  ],
};

// Phase 3 : Lancement - 350M FCFA
export const BUDGET_PHASE3: BudgetPhase = {
  phase: 'phase3_lancement',
  label: 'Phase 3 : Lancement',
  periode: 'T4 2026',
  montantTotal: 350_000_000,
  pourcentage: 19,
  categories: [
    {
      code: 'P3-SOFT',
      label: 'Soft Opening',
      montant: 60_000_000,
      postes: [
        { id: 'P3-001', label: 'Animations soft opening', montant: 25_000_000, commentaire: '2 semaines' },
        { id: 'P3-002', label: 'Renforts personnel temporaire', montant: 15_000_000, commentaire: 'Extras' },
        { id: 'P3-003', label: 'Communication soft opening', montant: 20_000_000, commentaire: 'Digital + RP' },
      ],
    },
    {
      code: 'P3-INAUG',
      label: 'Inauguration',
      montant: 230_000_000,
      postes: [
        { id: 'P3-004', label: 'Location matériel événementiel', montant: 30_000_000, commentaire: 'Sono, éclairage, scène' },
        { id: 'P3-005', label: 'Traiteur / Cocktail VIP', montant: 40_000_000, commentaire: '500 invités' },
        { id: 'P3-006', label: 'Animations grand public', montant: 50_000_000, commentaire: 'Spectacles, artistes' },
        { id: 'P3-007', label: 'Décoration événementielle', montant: 25_000_000 },
        { id: 'P3-008', label: 'Sécurité renforcée', montant: 15_000_000, commentaire: 'Agents supplémentaires' },
        { id: 'P3-009', label: 'Goodies / Cadeaux', montant: 20_000_000 },
        { id: 'P3-010', label: 'Communication inauguration', montant: 50_000_000, commentaire: 'Campagne massive' },
      ],
    },
    {
      code: 'P3-CAMPAGNE',
      label: 'Campagne lancement',
      montant: 80_000_000,
      postes: [
        { id: 'P3-011', label: 'Campagne média', montant: 50_000_000, commentaire: 'TV, radio, digital' },
        { id: 'P3-012', label: 'Affichage', montant: 30_000_000, commentaire: 'OOH Abidjan' },
      ],
    },
    {
      code: 'P3-IMPREVUS',
      label: 'Provisions',
      montant: 35_000_000,
      postes: [
        { id: 'P3-013', label: 'Imprévus (10%)', montant: 35_000_000 },
      ],
    },
  ],
};

// Phase 4 : Stabilisation - 150M FCFA
export const BUDGET_PHASE4: BudgetPhase = {
  phase: 'phase4_stabilisation',
  label: 'Phase 4 : Stabilisation',
  periode: 'T4 2026 – T1 2027',
  montantTotal: 150_000_000,
  pourcentage: 8,
  categories: [
    {
      code: 'P4-OPS',
      label: 'Opérations',
      montant: 150_000_000,
      postes: [
        { id: 'P4-001', label: 'Animations mensuelles (6 mois)', montant: 60_000_000, commentaire: '10M/mois' },
        { id: 'P4-002', label: 'Programme fidélité (mise en place)', montant: 25_000_000, commentaire: 'Cartes, app mobile' },
        { id: 'P4-003', label: 'Communication continue', montant: 30_000_000, commentaire: '5M/mois' },
        { id: 'P4-004', label: 'Ajustements/optimisations', montant: 25_000_000, commentaire: 'Signalétique, mobilier' },
        { id: 'P4-005', label: 'Imprévus', montant: 10_000_000 },
      ],
    },
  ],
};

// Budget total projet
export const BUDGET_PROJET_TOTAL = {
  montant: 1_850_000_000,
  devise: 'FCFA',
  phases: [BUDGET_PHASE1, BUDGET_PHASE2, BUDGET_PHASE3, BUDGET_PHASE4],
};

// Plan de trésorerie mensuel 2026
export const PLAN_TRESORERIE_2026 = [
  { mois: 'Janvier', depenses: 50_000_000, cumul: 50_000_000, pourcentage: 3 },
  { mois: 'Février', depenses: 80_000_000, cumul: 130_000_000, pourcentage: 7 },
  { mois: 'Mars', depenses: 100_000_000, cumul: 230_000_000, pourcentage: 12 },
  { mois: 'Avril', depenses: 120_000_000, cumul: 350_000_000, pourcentage: 19 },
  { mois: 'Mai', depenses: 150_000_000, cumul: 500_000_000, pourcentage: 27 },
  { mois: 'Juin', depenses: 180_000_000, cumul: 680_000_000, pourcentage: 37 },
  { mois: 'Juillet', depenses: 200_000_000, cumul: 880_000_000, pourcentage: 48 },
  { mois: 'Août', depenses: 180_000_000, cumul: 1_060_000_000, pourcentage: 57 },
  { mois: 'Septembre', depenses: 150_000_000, cumul: 1_210_000_000, pourcentage: 65 },
  { mois: 'Octobre', depenses: 200_000_000, cumul: 1_410_000_000, pourcentage: 76 },
  { mois: 'Novembre', depenses: 250_000_000, cumul: 1_660_000_000, pourcentage: 90 },
  { mois: 'Décembre', depenses: 190_000_000, cumul: 1_850_000_000, pourcentage: 100 },
];

// ============================================================================
// 3. FICHES RISQUES ENRICHIES TOP 10
// ============================================================================

export interface ActionMitigation {
  action: string;
  responsable: string;
  deadline: string;
  statut?: 'fait' | 'en_cours' | 'planifie';
}

export interface FicheRisque {
  id: string;
  titre: string;
  categorie: 'technique' | 'commercial' | 'rh' | 'financier' | 'reglementaire' | 'operationnel';
  probabilite: number;
  impact: number;
  score: number;
  axe: string;
  responsableSuivi: string;
  causesPotentielles: string[];
  consequences: string[];
  planMitigation: ActionMitigation[];
  planContingence: string[];
  indicateursAlerte: string[];
  seuilEscalade: string;
}

export const FICHES_RISQUES_TOP10: FicheRisque[] = [
  {
    id: 'R-001',
    titre: 'Retard livraison chantier',
    categorie: 'technique',
    probabilite: 4,
    impact: 5,
    score: 20,
    axe: 'AXE 3 - Technique & Handover',
    responsableSuivi: RESPONSABLES.FM,
    causesPotentielles: [
      'Retards approvisionnement matériaux',
      'Difficultés main d\'œuvre qualifiée',
      'Intempéries exceptionnelles',
      'Problèmes financiers constructeur',
      'Modifications demandées en cours de chantier',
    ],
    consequences: [
      'Report soft opening / inauguration',
      'Pénalités envers les preneurs (BEFA)',
      'Surcoûts équipe mobilisée sans activité',
      'Impact réputation / communication',
      'Perte de preneurs (désistements)',
    ],
    planMitigation: [
      { action: 'Réunions chantier hebdomadaires obligatoires', responsable: RESPONSABLES.DGA, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Clause pénalités retard dans contrat constructeur', responsable: 'Juridique', deadline: 'Fait', statut: 'fait' },
      { action: 'Identification anticipée des lots critiques', responsable: RESPONSABLES.FM, deadline: '2026-02-28', statut: 'planifie' },
      { action: 'Plan de rattrapage pré-établi', responsable: RESPONSABLES.FM, deadline: '2026-03-31', statut: 'planifie' },
      { action: 'Suivi météo et planning intempéries', responsable: RESPONSABLES.FM, deadline: 'Continu', statut: 'en_cours' },
    ],
    planContingence: [
      'Décaler soft opening de 2-4 semaines maximum',
      'Communication transparente aux preneurs',
      'Négociation compensations preneurs',
      'Réorganisation équipes (mise en standby partielle)',
    ],
    indicateursAlerte: [
      'Retard constaté > 2 semaines sur planning',
      'Plus de 3 lots en retard simultanément',
      'Constructeur ne répond plus aux convocations',
    ],
    seuilEscalade: 'DGA → PDG si retard > 1 mois',
  },
  {
    id: 'R-002',
    titre: 'Coordination chantier/fit-out défaillante',
    categorie: 'technique',
    probabilite: 4,
    impact: 4,
    score: 16,
    axe: 'AXE 3',
    responsableSuivi: RESPONSABLES.FM,
    causesPotentielles: [
      'Planning non intégré chantier/fit-out',
      'Communication défaillante constructeur/preneurs',
      'Accès chantier non sécurisés pour travaux simultanés',
      'Interférences entre corps de métier',
    ],
    consequences: [
      'Retards fit-out preneurs',
      'Boutiques non prêtes à l\'ouverture',
      'Conflits juridiques avec preneurs',
      'Accidents de chantier',
    ],
    planMitigation: [
      { action: 'Planning intégré unique chantier + fit-out', responsable: RESPONSABLES.FM, deadline: '2026-03-31', statut: 'planifie' },
      { action: 'Réunion coordination hebdo avec preneurs', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'À partir de M-5', statut: 'planifie' },
      { action: 'Zones fit-out livrées par phases définies', responsable: RESPONSABLES.FM, deadline: 'Planning validé', statut: 'planifie' },
      { action: 'Assurance tous risques chantier étendue', responsable: 'Admin', deadline: 'Avant fit-out', statut: 'planifie' },
    ],
    planContingence: [
      'Accélérer certains lots pour libérer les zones',
      'Travaux de nuit si nécessaire',
      'Compensation financière preneurs retardés',
    ],
    indicateursAlerte: [
      'Preneur ne peut pas accéder à son local à la date prévue',
      'Plus de 2 conflits de planning par semaine',
    ],
    seuilEscalade: 'FM → DGA si blocage > 1 semaine',
  },
  {
    id: 'R-003',
    titre: 'Taux d\'occupation < 70% à l\'ouverture',
    categorie: 'commercial',
    probabilite: 3,
    impact: 5,
    score: 15,
    axe: 'AXE 2 - Commercialisation',
    responsableSuivi: RESPONSABLES.COMMERCIAL_MGR,
    causesPotentielles: [
      'Conjoncture économique défavorable',
      'Concurrence agressive (autres centres)',
      'Loyers trop élevés vs marché',
      'Manque d\'attractivité du projet',
      'Locomotive (Carrefour) ne signe pas',
    ],
    consequences: [
      'Image négative à l\'ouverture (boutiques vides)',
      'Revenus insuffisants pour couvrir charges',
      'Spirale négative (preneurs hésitent si peu de voisins)',
      'Pression sur la trésorerie',
    ],
    planMitigation: [
      { action: 'Signer Carrefour en priorité absolue', responsable: RESPONSABLES.DGA, deadline: '2026-03-31', statut: 'en_cours' },
      { action: 'Objectifs commercialisation mensuels stricts', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Incentives preneurs (mois gratuits, fit-out)', responsable: RESPONSABLES.DGA, deadline: 'Si nécessaire', statut: 'planifie' },
      { action: 'Grille tarifaire flexible selon timing', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'Validé', statut: 'fait' },
      { action: 'Pipeline de backup pour chaque emplacement', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'Continu', statut: 'en_cours' },
    ],
    planContingence: [
      'Pop-up stores temporaires dans cellules vides',
      'Habillage des vitrines vides (coming soon)',
      'Report inauguration (soft opening maintenu)',
      'Révision à la baisse des loyers ciblée',
    ],
    indicateursAlerte: [
      '< 50% BEFA signés au 30/06',
      '< 60% occupation confirmée au 30/09',
      'Carrefour non signé au 31/03',
    ],
    seuilEscalade: 'Commercial Mgr → DGA → PDG si < 50% à M-3',
  },
  {
    id: 'R-004',
    titre: 'Défaillance locomotive Carrefour',
    categorie: 'commercial',
    probabilite: 2,
    impact: 5,
    score: 10,
    axe: 'AXE 2',
    responsableSuivi: RESPONSABLES.DGA,
    causesPotentielles: [
      'Stratégie groupe Carrefour change',
      'Conditions commerciales non acceptables',
      'Retards chantier inacceptables pour eux',
      'Concurrent propose meilleur deal',
    ],
    consequences: [
      'Perte d\'attractivité majeure du centre',
      'Autres preneurs se retirent',
      'Repositionnement complet nécessaire',
      'Retard ouverture probable',
    ],
    planMitigation: [
      { action: 'Négociation prioritaire et dédiée', responsable: RESPONSABLES.DGA, deadline: 'T1 2026', statut: 'en_cours' },
      { action: 'Conditions préférentielles (loyer, fit-out)', responsable: RESPONSABLES.DGA, deadline: 'Négociation', statut: 'en_cours' },
      { action: 'Identification alternatives (Auchan, Casino, Prosuma)', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: '2026-02-28', statut: 'planifie' },
      { action: 'LOI signée rapidement pour engagement', responsable: RESPONSABLES.DGA, deadline: '2026-02-28', statut: 'en_cours' },
    ],
    planContingence: [
      'Approcher immédiatement alternative #1',
      'Revoir le concept (plusieurs moyennes surfaces vs 1 grande)',
      'Adapter la communication',
    ],
    indicateursAlerte: [
      'Carrefour demande report > 2 mois',
      'Carrefour refuse conditions révisées',
      'Concurrent annonce deal avec Carrefour',
    ],
    seuilEscalade: 'DGA → PDG immédiatement si risque de retrait',
  },
  {
    id: 'R-005',
    titre: 'Commission de sécurité défavorable',
    categorie: 'reglementaire',
    probabilite: 2,
    impact: 5,
    score: 10,
    axe: 'AXE 6 - Exploitation',
    responsableSuivi: RESPONSABLES.SECURITY_MGR,
    causesPotentielles: [
      'SSI non conforme ou non opérationnel',
      'Issues de secours insuffisantes ou bloquées',
      'Documentation incomplète',
      'Formation personnel insuffisante',
      'Non-conformités fit-out preneurs',
    ],
    consequences: [
      'INTERDICTION D\'OUVRIR',
      'Report indéterminé de l\'ouverture',
      'Coûts de mise en conformité',
      'Catastrophe réputationnelle',
    ],
    planMitigation: [
      { action: 'Pré-visite commission (informelle)', responsable: RESPONSABLES.DGA, deadline: '2026-09-30', statut: 'planifie' },
      { action: 'Bureau de contrôle agréé pour validation', responsable: RESPONSABLES.FM, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Exercice évacuation avant commission', responsable: RESPONSABLES.SECURITY_MGR, deadline: '2026-10-31', statut: 'planifie' },
      { action: 'Dossier sécurité complet préparé', responsable: RESPONSABLES.SECURITY_MGR, deadline: '2026-10-31', statut: 'planifie' },
      { action: 'Vérification conformité fit-out preneurs', responsable: RESPONSABLES.FM, deadline: '2026-10-31', statut: 'planifie' },
    ],
    planContingence: [
      'Travaux correctifs en urgence',
      'Report ouverture 2-4 semaines',
      'Nouvelle demande de passage commission',
    ],
    indicateursAlerte: [
      'Remarques négatives bureau de contrôle',
      'SSI non opérationnel à M-1',
      'Preneurs non conformes à M-1',
    ],
    seuilEscalade: 'Security Mgr → DGA → PDG immédiatement si avis défavorable',
  },
  {
    id: 'R-006',
    titre: 'Fit-out Carrefour en retard',
    categorie: 'technique',
    probabilite: 3,
    impact: 5,
    score: 15,
    axe: 'AXE 3',
    responsableSuivi: RESPONSABLES.FM,
    causesPotentielles: [
      'Livraison local retardée',
      'Problèmes internes Carrefour',
      'Équipements importés en retard',
      'Sous-traitants Carrefour défaillants',
    ],
    consequences: [
      'Locomotive absente au soft opening',
      'Impact majeur sur fréquentation',
      'Image dégradée',
      'Autres preneurs mécontents',
    ],
    planMitigation: [
      { action: 'Livraison local Carrefour prioritaire', responsable: RESPONSABLES.FM, deadline: '2026-06-30', statut: 'planifie' },
      { action: 'Réunions hebdo dédiées Carrefour', responsable: RESPONSABLES.COMMERCIAL_MGR, deadline: 'À partir de M-6', statut: 'planifie' },
      { action: 'Jalons intermédiaires contractuels', responsable: 'Juridique', deadline: 'Dans BEFA', statut: 'planifie' },
      { action: 'Accès chantier privilégié', responsable: RESPONSABLES.FM, deadline: 'Dès livraison local', statut: 'planifie' },
    ],
    planContingence: [
      'Ouverture partielle Carrefour (zone par zone)',
      'Communication adaptée',
      'Renforcement autres enseignes alimentaires',
    ],
    indicateursAlerte: [
      'Retard > 2 semaines sur jalons Carrefour',
      'Carrefour ne mobilise pas ses équipes',
    ],
    seuilEscalade: 'FM → DGA si retard > 3 semaines',
  },
  {
    id: 'R-007',
    titre: 'Difficultés recrutement managers',
    categorie: 'rh',
    probabilite: 3,
    impact: 4,
    score: 12,
    axe: 'AXE 1',
    responsableSuivi: RESPONSABLES.DGA,
    causesPotentielles: [
      'Profils rares sur le marché ivoirien',
      'Packages non compétitifs',
      'Image employeur insuffisante',
      'Délais trop courts',
    ],
    consequences: [
      'Retard mise en place organisation',
      'Surcharge DGA/Center Manager',
      'Qualité opérations dégradée',
      'Retard formations équipes',
    ],
    planMitigation: [
      { action: 'Mandat 2-3 cabinets de recrutement', responsable: RESPONSABLES.DGA, deadline: '2026-01-31', statut: 'en_cours' },
      { action: 'Packages salariaux compétitifs', responsable: RESPONSABLES.DGA, deadline: 'Validé', statut: 'fait' },
      { action: 'Recherche régionale (Ghana, Sénégal)', responsable: RESPONSABLES.DGA, deadline: 'Si nécessaire', statut: 'planifie' },
      { action: 'Backup : promotion interne Cosmos Yopougon', responsable: RESPONSABLES.DGA, deadline: 'Plan B', statut: 'planifie' },
    ],
    planContingence: [
      'Intérim de managers expérimentés',
      'Consultant externe temporaire',
      'Répartition tâches sur équipe existante',
    ],
    indicateursAlerte: [
      'Aucun candidat finaliste après 6 semaines',
      'Candidat retenu décline offre',
    ],
    seuilEscalade: 'DGA → PDG si poste clé vacant à M-4',
  },
  {
    id: 'R-008',
    titre: 'Dépassement budget projet',
    categorie: 'financier',
    probabilite: 4,
    impact: 4,
    score: 16,
    axe: 'AXE 4',
    responsableSuivi: RESPONSABLES.FINANCE,
    causesPotentielles: [
      'Travaux imprévus',
      'Inflation matériaux',
      'Retards générant surcoûts',
      'Scope creep (demandes additionnelles)',
      'Mauvaises estimations initiales',
    ],
    consequences: [
      'Tension trésorerie',
      'Arbitrages difficiles',
      'Qualité dégradée si coupes',
      'Relation investisseurs tendue',
    ],
    planMitigation: [
      { action: 'Provisions imprévus 10% intégrées', responsable: RESPONSABLES.FINANCE, deadline: 'Fait', statut: 'fait' },
      { action: 'Revue budgétaire mensuelle', responsable: RESPONSABLES.FINANCE, deadline: 'Continu', statut: 'en_cours' },
      { action: 'Validation DGA pour tout dépassement > 5M', responsable: RESPONSABLES.DGA, deadline: 'Règle', statut: 'fait' },
      { action: 'Arbitrages trimestriels formalisés', responsable: RESPONSABLES.DGA, deadline: 'T1, T2, T3', statut: 'planifie' },
    ],
    planContingence: [
      'Priorisation des dépenses critiques',
      'Report dépenses non essentielles',
      'Renégociation contrats fournisseurs',
      'Demande budget complémentaire (cas extrême)',
    ],
    indicateursAlerte: [
      'Écart > 5% sur un poste majeur',
      'Cumul écarts > 3% budget total',
      'Engagement non budgété > 10M',
    ],
    seuilEscalade: 'Finance → DGA → PDG si dépassement > 5%',
  },
  {
    id: 'R-009',
    titre: 'Prestataires exploitation non performants',
    categorie: 'operationnel',
    probabilite: 3,
    impact: 4,
    score: 12,
    axe: 'AXE 6',
    responsableSuivi: RESPONSABLES.CENTER_MANAGER,
    causesPotentielles: [
      'Mauvaise sélection prestataires',
      'Cahier des charges flou',
      'Sous-effectif prestataires',
      'Formation insuffisante',
    ],
    consequences: [
      'Qualité service dégradée',
      'Plaintes visiteurs/preneurs',
      'Image centre ternie',
      'Surcharge équipes internes',
    ],
    planMitigation: [
      { action: 'Appel d\'offres avec critères stricts', responsable: RESPONSABLES.FM, deadline: '2026-04-30', statut: 'planifie' },
      { action: 'Visite références obligatoire', responsable: RESPONSABLES.FM, deadline: 'Sélection', statut: 'planifie' },
      { action: 'Période d\'essai contractuelle (3 mois)', responsable: 'Juridique', deadline: 'Dans contrats', statut: 'planifie' },
      { action: 'KPIs et pénalités dans contrats', responsable: 'Juridique', deadline: 'Dans contrats', statut: 'planifie' },
      { action: 'Backup prestataire identifié', responsable: RESPONSABLES.FM, deadline: 'Avant signature', statut: 'planifie' },
    ],
    planContingence: [
      'Activation prestataire backup',
      'Renfort équipes internes temporaire',
      'Résiliation anticipée si clause activable',
    ],
    indicateursAlerte: [
      '> 3 incidents qualité par semaine',
      'NPS prestataire < 6/10',
      'Prestataire ne respecte pas effectifs',
    ],
    seuilEscalade: 'FM → Center Mgr → DGA si persistance > 2 semaines',
  },
  {
    id: 'R-010',
    titre: 'Systèmes informatiques non prêts',
    categorie: 'technique',
    probabilite: 3,
    impact: 4,
    score: 12,
    axe: 'AXE 6',
    responsableSuivi: RESPONSABLES.CENTER_MANAGER,
    causesPotentielles: [
      'Retard sélection éditeurs',
      'Paramétrage complexe',
      'Intégrations défaillantes',
      'Formation utilisateurs insuffisante',
    ],
    consequences: [
      'Gestion dégradée à l\'ouverture',
      'Perte données/traçabilité',
      'Facturation manuelle (erreurs)',
      'Surcharge administrative',
    ],
    planMitigation: [
      { action: 'Sélection éditeurs dès T1', responsable: 'Admin', deadline: '2026-03-31', statut: 'planifie' },
      { action: 'Paramétrage démarré M-5', responsable: 'Admin', deadline: '2026-06-30', statut: 'planifie' },
      { action: 'Tests complets M-2', responsable: 'Admin', deadline: '2026-09-30', statut: 'planifie' },
      { action: 'Formation utilisateurs M-1', responsable: 'Admin', deadline: '2026-10-31', statut: 'planifie' },
      { action: 'Procédures dégradées (papier) prévues', responsable: 'Admin', deadline: '2026-10-31', statut: 'planifie' },
    ],
    planContingence: [
      'Activation procédures papier',
      'Support éditeur renforcé',
      'Saisie rattrapage post-ouverture',
    ],
    indicateursAlerte: [
      'Éditeur non sélectionné à M-6',
      'Paramétrage < 50% à M-3',
      'Tests échoués à M-2',
    ],
    seuilEscalade: 'Admin → Center Mgr → DGA si système non opérationnel M-1',
  },
];

// ============================================================================
// 4. KPIs DE SUIVI
// ============================================================================

export interface KPI {
  id: string;
  categorie: 'commercial' | 'technique' | 'budget' | 'rh';
  nom: string;
  formule: string;
  cibles: {
    M3?: string;
    M6?: string;
    M9?: string;
    ouverture?: string;
    seuil_alerte?: string;
  };
}

export const KPIS_SUIVI: KPI[] = [
  // KPIs Commercialisation
  { id: 'KPI-COM-001', categorie: 'commercial', nom: 'Taux BEFA signés', formule: 'BEFA signés / Total lots', cibles: { M3: '25%', M6: '50%', M9: '85%', ouverture: '95%' } },
  { id: 'KPI-COM-002', categorie: 'commercial', nom: 'Taux occupation confirmée', formule: 'm² confirmés / GLA', cibles: { M3: '20%', M6: '45%', M9: '70%', ouverture: '85%' } },
  { id: 'KPI-COM-003', categorie: 'commercial', nom: 'Pipeline qualifié', formule: 'Prospects chauds', cibles: { M3: '30', M6: '40', M9: '20', ouverture: '10' } },
  { id: 'KPI-COM-004', categorie: 'commercial', nom: 'Taux conversion', formule: 'Signatures / Propositions', cibles: { M3: '30%', M6: '35%', M9: '40%', ouverture: '40%' } },
  // KPIs Technique
  { id: 'KPI-TECH-001', categorie: 'technique', nom: 'Avancement chantier', formule: '% travaux réalisés', cibles: { ouverture: 'Selon planning' } },
  { id: 'KPI-TECH-002', categorie: 'technique', nom: 'Réserves bloquantes', formule: 'Nb réserves bloquantes', cibles: { ouverture: '0 à M-1' } },
  { id: 'KPI-TECH-003', categorie: 'technique', nom: 'Taux levée réserves', formule: 'Levées / Total', cibles: { M9: '80%', ouverture: '95%' } },
  { id: 'KPI-TECH-004', categorie: 'technique', nom: 'Systèmes opérationnels', formule: 'Nb systèmes OK / Total', cibles: { ouverture: '100% à M-1' } },
  // KPIs Budget
  { id: 'KPI-BUD-001', categorie: 'budget', nom: 'Écart budget', formule: '(Réalisé - Budget) / Budget', cibles: { seuil_alerte: '> 5%' } },
  { id: 'KPI-BUD-002', categorie: 'budget', nom: 'Taux engagement', formule: 'Engagé / Budget', cibles: { ouverture: 'Selon planning' } },
  { id: 'KPI-BUD-003', categorie: 'budget', nom: 'Taux décaissement', formule: 'Décaissé / Engagé', cibles: { seuil_alerte: '> 80%' } },
  // KPIs RH
  { id: 'KPI-RH-001', categorie: 'rh', nom: 'Taux recrutement', formule: 'Recrutés / Cible', cibles: { ouverture: '100% par vague' } },
  { id: 'KPI-RH-002', categorie: 'rh', nom: 'Taux formation', formule: 'Formés / Effectif', cibles: { ouverture: '100% à M-1' } },
  { id: 'KPI-RH-003', categorie: 'rh', nom: 'Turnover', formule: 'Départs / Effectif', cibles: { seuil_alerte: '< 5%' } },
];

// ============================================================================
// 5. DÉPENDANCES CHEMIN CRITIQUE
// ============================================================================

export interface DependanceCritique {
  tache: string;
  dependDe: string;
  impactSiRetard: string;
}

export const DEPENDANCES_CHEMIN_CRITIQUE: DependanceCritique[] = [
  { tache: 'Recrutement équipes', dependDe: 'Managers recrutés', impactSiRetard: 'Retard formation' },
  { tache: 'Fit-out preneurs', dependDe: 'Réception second œuvre', impactSiRetard: 'Boutiques non prêtes' },
  { tache: 'Fit-out Carrefour', dependDe: 'Livraison local', impactSiRetard: 'Locomotive absente' },
  { tache: 'Mise en service SSI', dependDe: 'Réception électricité', impactSiRetard: 'Commission bloquée' },
  { tache: 'Commission sécurité', dependDe: 'SSI + Formation + OPR', impactSiRetard: 'OUVERTURE IMPOSSIBLE' },
  { tache: 'Soft Opening', dependDe: 'Commission favorable', impactSiRetard: 'Report' },
  { tache: 'Inauguration', dependDe: 'Soft Opening réussi', impactSiRetard: 'Report' },
];

// ============================================================================
// EXPORTS
// ============================================================================

export const getAllRACIEntries = () => RACI_COMPLETE;
export const getBudgetByPhase = (phase: ProjectPhase) =>
  BUDGET_PROJET_TOTAL.phases.find(p => p.phase === phase);
export const getFicheRisque = (id: string) =>
  FICHES_RISQUES_TOP10.find(r => r.id === id);
export const getKPIsByCategorie = (categorie: KPI['categorie']) =>
  KPIS_SUIVI.filter(k => k.categorie === categorie);
