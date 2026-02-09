// ============================================================================
// COSMOS ANGRÉ - RÉFÉRENTIEL OFFICIEL COMPLET
// Version 1.0 - Janvier 2026
// Ouverture cible: Q4 2026 (Mi-Décembre)
// 8 Bâtiments | 6 Axes | 95+ Jalons | 120+ Actions | 70+ Risques
// ============================================================================

import type { Priorite } from '@/types';

// Responsables selon le référentiel officiel
export const RESPONSABLES = {
  DGA: 'DGA',
  CENTER_MANAGER: 'Center Manager',
  FM: 'FM',
  COMMERCIAL_MGR: 'Commercial Mgr',
  SECURITY_MGR: 'Security Mgr',
  MARKETING_MGR: 'Marketing Mgr',
  IT: 'IT',
  FINANCE: 'Finance',
  JURIDIQUE: 'Juridique',
  RH: 'RH',
  TECHNIQUE: 'Technique',
  MANAGERS: 'Managers',
} as const;

// ============================================================================
// PARTIE 1 : JALONS (MILESTONES)
// ============================================================================

// 1.1 JALONS GLOBAUX PROJET (J-001 à J-007)
export const JALONS_GLOBAUX = [
  { id: 'J-001', titre: 'Kick-off projet Cosmos Angré', date: '2026-02-09', responsable: RESPONSABLES.DGA, axe: 'global', critique: true, dependances: [] },
  { id: 'J-002', titre: 'Validation organigramme cible', date: '2026-01-31', responsable: RESPONSABLES.DGA, axe: 'axe1_rh', critique: true, dependances: ['J-001'] },
  { id: 'J-003', titre: 'Plan de commercialisation validé', date: '2026-02-28', responsable: RESPONSABLES.DGA, axe: 'axe2_commercial', critique: true, dependances: ['J-002'] },
  { id: 'J-004', titre: 'Budget projet consolidé approuvé', date: '2026-02-15', responsable: RESPONSABLES.DGA, axe: 'axe4_budget', critique: true, dependances: ['J-001'] },
  { id: 'J-005', titre: 'Stratégie communication validée', date: '2026-03-15', responsable: RESPONSABLES.DGA, axe: 'axe5_marketing', critique: false, dependances: ['J-003'] },
  { id: 'J-006', titre: 'Soft Opening', date: '2026-10-16', responsable: RESPONSABLES.DGA, axe: 'global', critique: true, dependances: ['all'] },
  { id: 'J-007', titre: 'Inauguration officielle', date: '2026-11-15', responsable: RESPONSABLES.DGA, axe: 'global', critique: true, dependances: ['J-006'] },
];

// 1.2 JALONS AXE 1 : RH & ORGANISATION (J1-001 à J1-010)
export const JALONS_AXE1 = [
  { id: 'J1-001', titre: 'Organigramme cible validé', date: '2026-01-31', responsable: RESPONSABLES.DGA, axe: 'axe1_rh', critique: true, livrables: 'Organigramme, fiches de poste' },
  { id: 'J1-002', titre: 'Center Manager recruté', date: '2026-02-28', responsable: RESPONSABLES.DGA, axe: 'axe1_rh', critique: true, livrables: 'Contrat signé' },
  { id: 'J1-003', titre: 'Commercial Manager recruté', date: '2026-03-15', responsable: RESPONSABLES.DGA, axe: 'axe1_rh', critique: true, livrables: 'Contrat signé' },
  { id: 'J1-004', titre: 'Facility Manager recruté', date: '2026-03-31', responsable: RESPONSABLES.DGA, axe: 'axe1_rh', critique: true, livrables: 'Contrat signé' },
  { id: 'J1-005', titre: 'Security Manager recruté', date: '2026-03-31', responsable: RESPONSABLES.DGA, axe: 'axe1_rh', critique: true, livrables: 'Contrat signé' },
  { id: 'J1-006', titre: 'Marketing Manager recruté', date: '2026-04-15', responsable: RESPONSABLES.DGA, axe: 'axe1_rh', critique: false, livrables: 'Contrat signé' },
  { id: 'J1-007', titre: 'Équipe superviseurs recrutée (8)', date: '2026-06-30', responsable: RESPONSABLES.CENTER_MANAGER, axe: 'axe1_rh', critique: false, livrables: '8 contrats signés' },
  { id: 'J1-008', titre: 'Équipe agents recrutée (40+)', date: '2026-08-31', responsable: RESPONSABLES.CENTER_MANAGER, axe: 'axe1_rh', critique: false, livrables: 'Contrats signés' },
  { id: 'J1-009', titre: 'Formation équipe complète', date: '2026-10-31', responsable: RESPONSABLES.CENTER_MANAGER, axe: 'axe1_rh', critique: true, livrables: 'Attestations formation' },
  { id: 'J1-010', titre: 'Équipe opérationnelle mobilisée', date: '2026-11-01', responsable: RESPONSABLES.CENTER_MANAGER, axe: 'axe1_rh', critique: true, livrables: 'Planning équipes validé' },
];

// 1.3 JALONS AXE 2 : COMMERCIALISATION
// 1.3.1 Jalons globaux commercialisation (J2-001 à J2-010)
export const JALONS_AXE2_GLOBAL = [
  { id: 'J2-001', titre: 'Plan de commercialisation finalisé', date: '2026-02-28', responsable: RESPONSABLES.DGA, axe: 'axe2_commercial', critique: true },
  { id: 'J2-002', titre: 'Grille tarifaire validée', date: '2026-02-15', responsable: RESPONSABLES.DGA, axe: 'axe2_commercial', critique: true },
  { id: 'J2-003', titre: '25% preneurs sous BEFA', date: '2026-02-15', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', critique: true, cible: '14 lots' },
  { id: 'J2-004', titre: '50% preneurs sous BEFA', date: '2026-04-15', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', critique: true, cible: '28 lots' },
  { id: 'J2-005', titre: '75% preneurs sous BEFA', date: '2026-06-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', critique: false, cible: '42 lots' },
  { id: 'J2-006', titre: 'Locomotive alimentaire signée', date: '2026-03-31', responsable: RESPONSABLES.DGA, axe: 'axe2_commercial', critique: true, cible: 'Carrefour' },
  { id: 'J2-007', titre: '50% occupation atteinte', date: '2026-06-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', critique: true, cible: '50% GLA' },
  { id: 'J2-008', titre: '75% occupation atteinte', date: '2026-09-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', critique: true, cible: '75% GLA' },
  { id: 'J2-009', titre: '85% occupation atteinte', date: '2026-10-16', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', critique: true, cible: '85% GLA' },
  { id: 'J2-010', titre: '100% BEFA signés', date: '2026-09-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', critique: false, cible: '55-60 lots' },
];

// 1.3.2 Jalons par bâtiment - CENTRE COMMERCIAL
export const JALONS_AXE2_CC = [
  { id: 'J2-CC-001', titre: '30% boutiques Mall signées', date: '2026-04-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'CC', detail: '~18 boutiques' },
  { id: 'J2-CC-002', titre: '60% boutiques Mall signées', date: '2026-07-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'CC', detail: '~36 boutiques' },
  { id: 'J2-CC-003', titre: '90% boutiques Mall signées', date: '2026-10-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'CC', detail: '~54 boutiques' },
  { id: 'J2-CC-004', titre: 'Anchor tenant alimentaire confirmé', date: '2026-03-31', responsable: RESPONSABLES.DGA, axe: 'axe2_commercial', buildingCode: 'CC', detail: 'Carrefour' },
  { id: 'J2-CC-005', titre: 'Food court complet', date: '2026-08-31', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'CC', detail: '6-8 concepts F&B' },
];

// 1.3.2 Jalons par bâtiment - BIG BOX 1-4
export const JALONS_AXE2_BB = [
  { id: 'J2-BB1-001', titre: 'Big Box 1 - LOI signée', date: '2026-02-28', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'BB1', detail: 'Grande surface' },
  { id: 'J2-BB2-001', titre: 'Big Box 2 - LOI signée', date: '2026-03-31', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'BB2', detail: 'Ameublement/Déco' },
  { id: 'J2-BB3-001', titre: 'Big Box 3 - LOI signée', date: '2026-04-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'BB3', detail: 'Électronique/Tech' },
  { id: 'J2-BB4-001', titre: 'Big Box 4 - LOI signée', date: '2026-05-31', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'BB4', detail: 'Sport/Loisirs' },
  { id: 'J2-BB-002', titre: '4 Big Box sous BEFA', date: '2026-06-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'BB1', detail: '100% Big Box' },
];

// 1.3.2 Jalons par bâtiment - ZONE EXPO
export const JALONS_AXE2_ZE = [
  { id: 'J2-ZE-001', titre: 'Concept Zone Expo validé', date: '2026-03-31', responsable: RESPONSABLES.DGA, axe: 'axe2_commercial', buildingCode: 'ZE', detail: 'Plan exploitation' },
  { id: 'J2-ZE-002', titre: '1er événement planifié', date: '2026-09-30', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe2_commercial', buildingCode: 'ZE', detail: 'Inauguration' },
  { id: 'J2-ZE-003', titre: 'Planning événements 2027', date: '2026-11-30', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe2_commercial', buildingCode: 'ZE', detail: '12 événements min' },
];

// 1.3.2 Jalons par bâtiment - MARCHÉ ARTISANAL
export const JALONS_AXE2_MA = [
  { id: 'J2-MA-001', titre: 'Concept marché validé', date: '2026-02-28', responsable: RESPONSABLES.DGA, axe: 'axe2_commercial', buildingCode: 'MA', detail: 'Cahier des charges' },
  { id: 'J2-MA-002', titre: '50% stands attribués', date: '2026-06-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'MA', detail: '~25 artisans' },
  { id: 'J2-MA-003', titre: '80% stands attribués', date: '2026-09-30', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'MA', detail: '~40 artisans' },
  { id: 'J2-MA-004', titre: 'Règlement intérieur validé', date: '2026-07-31', responsable: RESPONSABLES.JURIDIQUE, axe: 'axe2_commercial', buildingCode: 'MA', detail: 'Charte qualité' },
];

// 1.3.2 Jalons par bâtiment - PARKING
export const JALONS_AXE2_PK = [
  { id: 'J2-PK-001', titre: 'Politique tarifaire parking validée', date: '2026-03-31', responsable: RESPONSABLES.DGA, axe: 'axe2_commercial', buildingCode: 'PK', detail: 'Grille tarifs' },
  { id: 'J2-PK-002', titre: 'Contrat exploitation parking signé', date: '2026-06-30', responsable: RESPONSABLES.DGA, axe: 'axe2_commercial', buildingCode: 'PK', detail: 'Opérateur ou interne' },
  { id: 'J2-PK-003', titre: 'Abonnements entreprises lancés', date: '2026-10-01', responsable: RESPONSABLES.COMMERCIAL_MGR, axe: 'axe2_commercial', buildingCode: 'PK', detail: 'Offre B2B' },
];

// 1.4 JALONS AXE 3 : TECHNIQUE & HANDOVER
// 1.4.1 Jalons réception travaux (J3-001 à J3-012)
export const JALONS_AXE3_RECEPTION = [
  { id: 'J3-001', titre: 'Réception gros œuvre complet', date: '2026-04-30', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: true, buildingCode: undefined },
  { id: 'J3-002', titre: 'Réception second œuvre Centre Commercial', date: '2026-06-30', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: true, buildingCode: 'CC' },
  { id: 'J3-003', titre: 'Réception second œuvre Big Box 1-2', date: '2026-07-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: true, buildingCode: 'BB1' },
  { id: 'J3-004', titre: 'Réception second œuvre Big Box 3-4', date: '2026-08-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: false, buildingCode: 'BB3' },
  { id: 'J3-005', titre: 'Réception Zone Expo', date: '2026-09-30', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: false, buildingCode: 'ZE' },
  { id: 'J3-006', titre: 'Réception Marché Artisanal', date: '2026-09-30', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: false, buildingCode: 'MA' },
  { id: 'J3-007', titre: 'Réception Parking', date: '2026-08-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: true, buildingCode: 'PK' },
  { id: 'J3-008', titre: 'OPR Centre Commercial', date: '2026-09-15', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: true, buildingCode: 'CC' },
  { id: 'J3-009', titre: 'OPR tous bâtiments', date: '2026-10-15', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: true, buildingCode: undefined },
  { id: 'J3-010', titre: 'Levée réserves ≥80%', date: '2026-10-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: true, buildingCode: undefined },
  { id: 'J3-011', titre: 'Levée réserves ≥95%', date: '2026-11-30', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: true, buildingCode: undefined },
  { id: 'J3-012', titre: 'DOE complet reçu', date: '2026-10-16', responsable: RESPONSABLES.FM, axe: 'axe3_technique', critique: true, buildingCode: undefined },
];

// 1.4.2 Jalons fit-out preneurs (J3-FO-001 à J3-FO-008)
export const JALONS_AXE3_FITOUT = [
  { id: 'J3-FO-001', titre: '25% preneurs - Contrat Pilote B signé', date: '2026-02-15', responsable: RESPONSABLES.FM, axe: 'axe3_technique', detail: '14 preneurs' },
  { id: 'J3-FO-002', titre: '25% preneurs - Contrat SOCOTEC signé', date: '2026-02-15', responsable: RESPONSABLES.FM, axe: 'axe3_technique', detail: '14 preneurs' },
  { id: 'J3-FO-003', titre: '50% preneurs - Plans validés', date: '2026-04-15', responsable: RESPONSABLES.FM, axe: 'axe3_technique', detail: '28 preneurs' },
  { id: 'J3-FO-004', titre: '50% preneurs - Fit-out démarré', date: '2026-05-30', responsable: RESPONSABLES.FM, axe: 'axe3_technique', detail: '28 preneurs' },
  { id: 'J3-FO-005', titre: '75% preneurs - Fit-out en cours', date: '2026-07-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', detail: '42 preneurs' },
  { id: 'J3-FO-006', titre: '100% preneurs - Fit-out terminé', date: '2026-10-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', detail: 'Tous preneurs' },
  { id: 'J3-FO-007', titre: 'Carrefour - Livraison local', date: '2026-06-30', responsable: RESPONSABLES.FM, axe: 'axe3_technique', detail: 'Locomotive', buildingCode: 'CC' },
  { id: 'J3-FO-008', titre: 'Carrefour - Fit-out terminé', date: '2026-10-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', detail: 'Locomotive', buildingCode: 'CC' },
];

// 1.4.3 Jalons équipements techniques (J3-EQ-001 à J3-EQ-009)
export const JALONS_AXE3_EQUIPEMENTS = [
  { id: 'J3-EQ-001', titre: 'Mise en service électricité HT/BT', date: '2026-06-30', responsable: RESPONSABLES.FM, axe: 'axe3_technique', systeme: 'Électricité' },
  { id: 'J3-EQ-002', titre: 'Mise en service groupe électrogène', date: '2026-07-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', systeme: 'Électricité' },
  { id: 'J3-EQ-003', titre: 'Mise en service climatisation', date: '2026-08-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', systeme: 'CVC' },
  { id: 'J3-EQ-004', titre: 'Mise en service SSI', date: '2026-09-15', responsable: RESPONSABLES.FM, axe: 'axe3_technique', systeme: 'Sécurité incendie' },
  { id: 'J3-EQ-005', titre: 'Mise en service contrôle d\'accès', date: '2026-09-30', responsable: RESPONSABLES.SECURITY_MGR, axe: 'axe3_technique', systeme: 'Sécurité' },
  { id: 'J3-EQ-006', titre: 'Mise en service vidéosurveillance', date: '2026-09-30', responsable: RESPONSABLES.SECURITY_MGR, axe: 'axe3_technique', systeme: 'Sécurité' },
  { id: 'J3-EQ-007', titre: 'Mise en service ascenseurs/escalators', date: '2026-10-15', responsable: RESPONSABLES.FM, axe: 'axe3_technique', systeme: 'Transport vertical' },
  { id: 'J3-EQ-008', titre: 'Mise en service système parking', date: '2026-08-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', systeme: 'Parking', buildingCode: 'PK' },
  { id: 'J3-EQ-009', titre: 'Tests intégration tous systèmes', date: '2026-10-31', responsable: RESPONSABLES.FM, axe: 'axe3_technique', systeme: 'Tous' },
];

// 1.5 JALONS AXE 4 : BUDGET & PILOTAGE (J4-001 à J4-008)
export const JALONS_AXE4 = [
  { id: 'J4-001', titre: 'Budget projet consolidé validé', date: '2026-02-15', responsable: RESPONSABLES.DGA, axe: 'axe4_budget', critique: true },
  { id: 'J4-002', titre: 'Plan de trésorerie validé', date: '2026-02-28', responsable: RESPONSABLES.FINANCE, axe: 'axe4_budget', critique: true },
  { id: 'J4-003', titre: 'Contrats prestataires principaux signés', date: '2026-03-31', responsable: RESPONSABLES.DGA, axe: 'axe4_budget', critique: true },
  { id: 'J4-004', titre: 'Revue budgétaire T1', date: '2026-04-15', responsable: RESPONSABLES.FINANCE, axe: 'axe4_budget', critique: false },
  { id: 'J4-005', titre: 'Revue budgétaire T2', date: '2026-07-15', responsable: RESPONSABLES.FINANCE, axe: 'axe4_budget', critique: false },
  { id: 'J4-006', titre: 'Revue budgétaire T3', date: '2026-10-15', responsable: RESPONSABLES.FINANCE, axe: 'axe4_budget', critique: false },
  { id: 'J4-007', titre: 'Budget exploitation 2027 validé', date: '2026-11-30', responsable: RESPONSABLES.DGA, axe: 'axe4_budget', critique: true },
  { id: 'J4-008', titre: 'Clôture projet - bilan financier', date: '2027-01-31', responsable: RESPONSABLES.FINANCE, axe: 'axe4_budget', critique: true },
];

// 1.6 JALONS AXE 5 : MARKETING & COMMUNICATION (J5-001 à J5-011)
export const JALONS_AXE5 = [
  { id: 'J5-001', titre: 'Stratégie communication validée', date: '2026-03-15', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe5_marketing', critique: true },
  { id: 'J5-002', titre: 'Identité visuelle Cosmos Angré finalisée', date: '2026-03-31', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe5_marketing', critique: true },
  { id: 'J5-003', titre: 'Site web en ligne', date: '2026-04-30', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe5_marketing', critique: false },
  { id: 'J5-004', titre: 'Réseaux sociaux activés', date: '2026-04-30', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe5_marketing', critique: false },
  { id: 'J5-005', titre: 'Campagne teasing lancée', date: '2026-09-01', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe5_marketing', critique: true },
  { id: 'J5-006', titre: 'Campagne lancement lancée', date: '2026-11-01', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe5_marketing', critique: true },
  { id: 'J5-007', titre: 'Événement presse organisé', date: '2026-11-10', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe5_marketing', critique: false },
  { id: 'J5-008', titre: 'Signalétique extérieure installée', date: '2026-11-01', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe5_marketing', critique: true },
  { id: 'J5-009', titre: 'Signalétique intérieure installée', date: '2026-11-10', responsable: RESPONSABLES.MARKETING_MGR, axe: 'axe5_marketing', critique: true },
  { id: 'J5-010', titre: 'Soft Opening réussi', date: '2026-10-16', responsable: RESPONSABLES.DGA, axe: 'axe5_marketing', critique: true },
  { id: 'J5-011', titre: 'Inauguration officielle réussie', date: '2026-11-15', responsable: RESPONSABLES.DGA, axe: 'axe5_marketing', critique: true },
];

// 1.7 JALONS AXE 6 : EXPLOITATION & SYSTÈMES (J6-001 à J6-011)
export const JALONS_AXE6 = [
  { id: 'J6-001', titre: 'Procédures d\'exploitation rédigées', date: '2026-07-31', responsable: RESPONSABLES.CENTER_MANAGER, axe: 'axe6_exploitation', critique: true },
  { id: 'J6-002', titre: 'Contrat nettoyage signé', date: '2026-06-30', responsable: RESPONSABLES.FM, axe: 'axe6_exploitation', critique: true },
  { id: 'J6-003', titre: 'Contrat sécurité/gardiennage signé', date: '2026-06-30', responsable: RESPONSABLES.SECURITY_MGR, axe: 'axe6_exploitation', critique: true },
  { id: 'J6-004', titre: 'Contrat maintenance technique signé', date: '2026-07-31', responsable: RESPONSABLES.FM, axe: 'axe6_exploitation', critique: true },
  { id: 'J6-005', titre: 'Contrat espaces verts signé', date: '2026-08-31', responsable: RESPONSABLES.FM, axe: 'axe6_exploitation', critique: false },
  { id: 'J6-006', titre: 'Contrat gestion déchets signé', date: '2026-08-31', responsable: RESPONSABLES.FM, axe: 'axe6_exploitation', critique: false },
  { id: 'J6-007', titre: 'Logiciel de gestion paramétré', date: '2026-09-30', responsable: RESPONSABLES.IT, axe: 'axe6_exploitation', critique: true },
  { id: 'J6-008', titre: 'Système de caisse paramétré', date: '2026-10-31', responsable: RESPONSABLES.IT, axe: 'axe6_exploitation', critique: true },
  { id: 'J6-009', titre: 'Formation équipes exploitation', date: '2026-10-31', responsable: RESPONSABLES.CENTER_MANAGER, axe: 'axe6_exploitation', critique: true },
  { id: 'J6-010', titre: 'Test exploitation grandeur nature', date: '2026-11-10', responsable: RESPONSABLES.CENTER_MANAGER, axe: 'axe6_exploitation', critique: true },
  { id: 'J6-011', titre: 'Commission de sécurité - Avis favorable', date: '2026-11-10', responsable: RESPONSABLES.DGA, axe: 'axe6_exploitation', critique: true },
];

// ============================================================================
// PARTIE 2 : ACTIONS
// ============================================================================

// 2.1 ACTIONS AXE 1 : RH & ORGANISATION (A1-001 à A1-013)
export const ACTIONS_AXE1 = [
  { id: 'A1-001', titre: 'Finaliser organigramme cible Cosmos Angré', dateDebut: '2026-01-15', dateFin: '2026-01-31', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite, statut: 'a_faire' },
  { id: 'A1-002', titre: 'Valider fiches de poste managers', dateDebut: '2026-01-20', dateFin: '2026-02-05', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite, statut: 'a_faire' },
  { id: 'A1-003', titre: 'Lancer recrutement Center Manager', dateDebut: '2026-02-01', dateFin: '2026-02-28', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite, statut: 'a_faire' },
  { id: 'A1-004', titre: 'Lancer recrutement Commercial Manager', dateDebut: '2026-02-15', dateFin: '2026-03-15', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite, statut: 'a_faire' },
  { id: 'A1-005', titre: 'Lancer recrutement Facility Manager', dateDebut: '2026-03-01', dateFin: '2026-03-31', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite, statut: 'a_faire' },
  { id: 'A1-006', titre: 'Lancer recrutement Security Manager', dateDebut: '2026-03-01', dateFin: '2026-03-31', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite, statut: 'a_faire' },
  { id: 'A1-007', titre: 'Lancer recrutement Marketing Manager', dateDebut: '2026-03-15', dateFin: '2026-04-15', responsable: RESPONSABLES.DGA, priorite: 'haute' as Priorite, statut: 'a_faire' },
  { id: 'A1-008', titre: 'Définir plan de formation équipes', dateDebut: '2026-04-01', dateFin: '2026-04-30', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'haute' as Priorite, statut: 'a_faire' },
  { id: 'A1-009', titre: 'Recruter superviseurs (8 postes)', dateDebut: '2026-05-01', dateFin: '2026-06-30', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'haute' as Priorite, statut: 'a_faire' },
  { id: 'A1-010', titre: 'Recruter agents opérationnels (40+)', dateDebut: '2026-07-01', dateFin: '2026-08-31', responsable: RESPONSABLES.MANAGERS, priorite: 'haute' as Priorite, statut: 'a_faire' },
  { id: 'A1-011', titre: 'Organiser sessions de formation', dateDebut: '2026-09-01', dateFin: '2026-10-31', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'critique' as Priorite, statut: 'a_faire' },
  { id: 'A1-012', titre: 'Finaliser planning équipes ouverture', dateDebut: '2026-10-15', dateFin: '2026-10-31', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'critique' as Priorite, statut: 'a_faire' },
  { id: 'A1-013', titre: 'Organiser team building pré-ouverture', dateDebut: '2026-11-01', dateFin: '2026-11-10', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'moyenne' as Priorite, statut: 'a_faire' },
];

// 2.2 ACTIONS AXE 2 : COMMERCIALISATION
// 2.2.1 Actions stratégiques (A2-001 à A2-005)
export const ACTIONS_AXE2_STRATEGIQUES = [
  { id: 'A2-001', titre: 'Finaliser plan de commercialisation', dateDebut: '2026-02-01', dateFin: '2026-02-28', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A2-002', titre: 'Valider grille tarifaire par zone', dateDebut: '2026-02-01', dateFin: '2026-02-15', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A2-003', titre: 'Définir mix commercial cible', dateDebut: '2026-02-15', dateFin: '2026-02-28', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'critique' as Priorite },
  { id: 'A2-004', titre: 'Identifier et contacter locomotives', dateDebut: '2026-02-01', dateFin: '2026-03-31', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'critique' as Priorite },
  { id: 'A2-005', titre: 'Négocier avec Carrefour', dateDebut: '2026-02-01', dateFin: '2026-03-31', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
];

// 2.2.2 Actions BEFA et suivi preneurs (A2-010 à A2-016)
export const ACTIONS_AXE2_BEFA = [
  { id: 'A2-010', titre: 'Préparer template BEFA standard', dateDebut: '2026-01-15', dateFin: '2026-01-31', responsable: RESPONSABLES.JURIDIQUE, priorite: 'critique' as Priorite },
  { id: 'A2-011', titre: 'Coordonner signatures BEFA vague 1 (25%)', dateDebut: '2026-02-01', dateFin: '2026-02-15', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'critique' as Priorite },
  { id: 'A2-012', titre: 'Coordonner signatures BEFA vague 2 (25%)', dateDebut: '2026-02-16', dateFin: '2026-03-15', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'critique' as Priorite },
  { id: 'A2-013', titre: 'Coordonner signatures BEFA vague 3 (50%)', dateDebut: '2026-03-16', dateFin: '2026-04-15', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'critique' as Priorite },
  { id: 'A2-014', titre: 'Mettre en place suivi Pilote B par preneur', dateDebut: '2026-02-01', dateFin: '2026-12-31', responsable: RESPONSABLES.TECHNIQUE, priorite: 'critique' as Priorite },
  { id: 'A2-015', titre: 'Coordonner contrats SOCOTEC preneurs', dateDebut: '2026-02-01', dateFin: '2026-12-31', responsable: RESPONSABLES.TECHNIQUE, priorite: 'critique' as Priorite },
  { id: 'A2-016', titre: 'Valider plans aménagement preneurs', dateDebut: '2026-03-01', dateFin: '2026-12-31', responsable: RESPONSABLES.TECHNIQUE, priorite: 'haute' as Priorite },
];

// 2.2.3 Actions par bâtiment - Centre Commercial (A2-CC-001 à A2-CC-004)
export const ACTIONS_AXE2_CC = [
  { id: 'A2-CC-001', titre: 'Prospecter enseignes mode & accessoires', dateFin: '2026-04-30', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'haute' as Priorite, buildingCode: 'CC' },
  { id: 'A2-CC-002', titre: 'Prospecter concepts F&B food court', dateFin: '2026-06-30', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'haute' as Priorite, buildingCode: 'CC' },
  { id: 'A2-CC-003', titre: 'Négocier avec enseignes beauté/cosmétique', dateFin: '2026-05-31', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'haute' as Priorite, buildingCode: 'CC' },
  { id: 'A2-CC-004', titre: 'Prospecter services (banque, télécom, etc.)', dateFin: '2026-06-30', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'moyenne' as Priorite, buildingCode: 'CC' },
];

// 2.2.3 Actions par bâtiment - Big Box 1-4 (A2-BB-001 à A2-BB-004)
export const ACTIONS_AXE2_BB = [
  { id: 'A2-BB-001', titre: 'Identifier candidats Big Box 1 (alimentaire)', dateFin: '2026-02-28', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'critique' as Priorite, buildingCode: 'BB1' },
  { id: 'A2-BB-002', titre: 'Négocier LOI Big Box 2 (ameublement)', dateFin: '2026-03-31', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'haute' as Priorite, buildingCode: 'BB2' },
  { id: 'A2-BB-003', titre: 'Négocier LOI Big Box 3 (électronique)', dateFin: '2026-04-30', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'haute' as Priorite, buildingCode: 'BB3' },
  { id: 'A2-BB-004', titre: 'Négocier LOI Big Box 4 (sport/loisirs)', dateFin: '2026-05-31', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'haute' as Priorite, buildingCode: 'BB4' },
];

// 2.2.3 Actions par bâtiment - Zone Expo (A2-ZE-001 à A2-ZE-003)
export const ACTIONS_AXE2_ZE = [
  { id: 'A2-ZE-001', titre: 'Définir concept d\'exploitation Zone Expo', dateFin: '2026-03-31', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'haute' as Priorite, buildingCode: 'ZE' },
  { id: 'A2-ZE-002', titre: 'Établir grille tarifaire location événementielle', dateFin: '2026-04-30', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'haute' as Priorite, buildingCode: 'ZE' },
  { id: 'A2-ZE-003', titre: 'Prospecter organisateurs d\'événements', dateFin: '2026-09-30', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'moyenne' as Priorite, buildingCode: 'ZE' },
];

// 2.2.3 Actions par bâtiment - Marché Artisanal (A2-MA-001 à A2-MA-004)
export const ACTIONS_AXE2_MA = [
  { id: 'A2-MA-001', titre: 'Définir cahier des charges Marché Artisanal', dateFin: '2026-02-28', responsable: RESPONSABLES.DGA, priorite: 'haute' as Priorite, buildingCode: 'MA' },
  { id: 'A2-MA-002', titre: 'Identifier et sélectionner artisans', dateFin: '2026-06-30', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'haute' as Priorite, buildingCode: 'MA' },
  { id: 'A2-MA-003', titre: 'Établir règlement intérieur marché', dateFin: '2026-07-31', responsable: RESPONSABLES.JURIDIQUE, priorite: 'haute' as Priorite, buildingCode: 'MA' },
  { id: 'A2-MA-004', titre: 'Signer conventions avec artisans', dateFin: '2026-09-30', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'haute' as Priorite, buildingCode: 'MA' },
];

// 2.2.3 Actions par bâtiment - Parking (A2-PK-001 à A2-PK-004)
export const ACTIONS_AXE2_PK = [
  { id: 'A2-PK-001', titre: 'Définir politique tarifaire parking', dateFin: '2026-03-31', responsable: RESPONSABLES.DGA, priorite: 'haute' as Priorite, buildingCode: 'PK' },
  { id: 'A2-PK-002', titre: 'Évaluer options exploitation (interne/externe)', dateFin: '2026-04-30', responsable: RESPONSABLES.DGA, priorite: 'haute' as Priorite, buildingCode: 'PK' },
  { id: 'A2-PK-003', titre: 'Négocier contrat opérateur parking (si externe)', dateFin: '2026-06-30', responsable: RESPONSABLES.DGA, priorite: 'haute' as Priorite, buildingCode: 'PK' },
  { id: 'A2-PK-004', titre: 'Développer offre abonnements B2B', dateFin: '2026-09-30', responsable: RESPONSABLES.COMMERCIAL_MGR, priorite: 'moyenne' as Priorite, buildingCode: 'PK' },
];
