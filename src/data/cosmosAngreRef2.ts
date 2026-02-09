// ============================================================================
// COSMOS ANGRÉ - RÉFÉRENTIEL OFFICIEL PARTIE 2
// Actions Axe 3-6, Actions spéciales, et tous les Risques
// ============================================================================

import { RESPONSABLES } from './cosmosAngreRef';
import type { Priorite } from '@/types';

// ============================================================================
// 2.3 ACTIONS AXE 3 : TECHNIQUE & HANDOVER
// ============================================================================

// 2.3.1 Actions suivi chantier (A3-001 à A3-005)
export const ACTIONS_AXE3_CHANTIER = [
  { id: 'A3-001', titre: 'Établir planning détaillé handover', dateDebut: '2026-02-01', dateFin: '2026-02-28', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A3-002', titre: 'Organiser réunions chantier hebdomadaires', dateDebut: '2026-01-01', dateFin: '2026-12-31', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A3-003', titre: 'Suivre avancement gros œuvre', dateDebut: '2026-01-01', dateFin: '2026-04-30', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A3-004', titre: 'Suivre avancement second œuvre', dateDebut: '2026-05-01', dateFin: '2026-09-30', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A3-005', titre: 'Coordonner avec constructeur sur réserves', dateDebut: '2026-01-01', dateFin: '2026-11-30', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
];

// 2.3.2 Actions réception par bâtiment (A3-010 à A3-019)
export const ACTIONS_AXE3_RECEPTION = [
  { id: 'A3-010', titre: 'Préparer checklist réception Centre Commercial', dateFin: '2026-05-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, buildingCode: 'CC' },
  { id: 'A3-011', titre: 'Préparer checklist réception Big Box 1-2', dateFin: '2026-06-30', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, buildingCode: 'BB1' },
  { id: 'A3-012', titre: 'Préparer checklist réception Big Box 3-4', dateFin: '2026-07-31', responsable: RESPONSABLES.FM, priorite: 'haute' as Priorite, buildingCode: 'BB3' },
  { id: 'A3-013', titre: 'Préparer checklist réception Zone Expo', dateFin: '2026-08-31', responsable: RESPONSABLES.FM, priorite: 'haute' as Priorite, buildingCode: 'ZE' },
  { id: 'A3-014', titre: 'Préparer checklist réception Marché Artisanal', dateFin: '2026-08-31', responsable: RESPONSABLES.FM, priorite: 'haute' as Priorite, buildingCode: 'MA' },
  { id: 'A3-015', titre: 'Préparer checklist réception Parking', dateFin: '2026-07-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, buildingCode: 'PK' },
  { id: 'A3-016', titre: 'Réaliser OPR Centre Commercial', dateFin: '2026-09-15', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, buildingCode: 'CC' },
  { id: 'A3-017', titre: 'Réaliser OPR Big Box 1-4', dateFin: '2026-09-30', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, buildingCode: 'BB1' },
  { id: 'A3-018', titre: 'Réaliser OPR Zone Expo + Marché', dateFin: '2026-10-15', responsable: RESPONSABLES.FM, priorite: 'haute' as Priorite, buildingCode: 'ZE' },
  { id: 'A3-019', titre: 'Réaliser OPR Parking', dateFin: '2026-09-30', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, buildingCode: 'PK' },
];

// 2.3.3 Actions fit-out preneurs (A3-030 à A3-035)
export const ACTIONS_AXE3_FITOUT = [
  { id: 'A3-030', titre: 'Rédiger cahier des charges fit-out standard', dateFin: '2026-01-31', responsable: RESPONSABLES.TECHNIQUE, priorite: 'critique' as Priorite },
  { id: 'A3-031', titre: 'Coordonner livraison locaux Carrefour', dateFin: '2026-06-30', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, buildingCode: 'CC' },
  { id: 'A3-032', titre: 'Superviser fit-out Carrefour', dateFin: '2026-10-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, buildingCode: 'CC' },
  { id: 'A3-033', titre: 'Coordonner fit-out Big Box', dateFin: '2026-10-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, buildingCode: 'BB1' },
  { id: 'A3-034', titre: 'Coordonner fit-out boutiques Mall', dateFin: '2026-10-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, buildingCode: 'CC' },
  { id: 'A3-035', titre: 'Valider conformité aménagements preneurs', dateFin: '2026-11-10', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
];

// 2.3.4 Actions équipements techniques (A3-040 à A3-049)
export const ACTIONS_AXE3_EQUIPEMENTS = [
  { id: 'A3-040', titre: 'Coordonner mise en service électricité', dateFin: '2026-06-30', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, systeme: 'Électricité' },
  { id: 'A3-041', titre: 'Coordonner mise en service groupe électrogène', dateFin: '2026-07-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, systeme: 'Électricité' },
  { id: 'A3-042', titre: 'Coordonner mise en service CVC', dateFin: '2026-08-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, systeme: 'Climatisation' },
  { id: 'A3-043', titre: 'Coordonner mise en service SSI', dateFin: '2026-09-15', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, systeme: 'Sécurité incendie' },
  { id: 'A3-044', titre: 'Coordonner mise en service contrôle accès', dateFin: '2026-09-30', responsable: RESPONSABLES.SECURITY_MGR, priorite: 'critique' as Priorite, systeme: 'Sécurité' },
  { id: 'A3-045', titre: 'Coordonner mise en service vidéosurveillance', dateFin: '2026-09-30', responsable: RESPONSABLES.SECURITY_MGR, priorite: 'critique' as Priorite, systeme: 'Sécurité' },
  { id: 'A3-046', titre: 'Coordonner mise en service ascenseurs/escalators', dateFin: '2026-10-15', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, systeme: 'Transport' },
  { id: 'A3-047', titre: 'Coordonner mise en service système parking', dateFin: '2026-08-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, systeme: 'Parking', buildingCode: 'PK' },
  { id: 'A3-048', titre: 'Réaliser tests intégration tous systèmes', dateFin: '2026-10-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, systeme: 'Tous' },
  { id: 'A3-049', titre: 'Collecter et vérifier DOE complet', dateFin: '2026-10-16', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite, systeme: 'Tous' },
];

// ============================================================================
// 2.4 ACTIONS AXE 4 : BUDGET & PILOTAGE (A4-001 à A4-010)
// ============================================================================
export const ACTIONS_AXE4 = [
  { id: 'A4-001', titre: 'Consolider budget projet global', dateDebut: '2026-02-01', dateFin: '2026-02-15', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A4-002', titre: 'Établir plan de trésorerie projet', dateDebut: '2026-02-15', dateFin: '2026-02-28', responsable: RESPONSABLES.FINANCE, priorite: 'critique' as Priorite },
  { id: 'A4-003', titre: 'Mettre en place reporting budgétaire mensuel', dateDebut: '2026-03-01', dateFin: '2026-12-31', responsable: RESPONSABLES.FINANCE, priorite: 'critique' as Priorite },
  { id: 'A4-004', titre: 'Suivre engagements vs budget', dateDebut: '2026-01-01', dateFin: '2026-12-31', responsable: RESPONSABLES.FINANCE, priorite: 'critique' as Priorite },
  { id: 'A4-005', titre: 'Préparer revue budgétaire T1', dateDebut: '2026-04-01', dateFin: '2026-04-15', responsable: RESPONSABLES.FINANCE, priorite: 'haute' as Priorite },
  { id: 'A4-006', titre: 'Préparer revue budgétaire T2', dateDebut: '2026-07-01', dateFin: '2026-07-15', responsable: RESPONSABLES.FINANCE, priorite: 'haute' as Priorite },
  { id: 'A4-007', titre: 'Préparer revue budgétaire T3', dateDebut: '2026-10-01', dateFin: '2026-10-15', responsable: RESPONSABLES.FINANCE, priorite: 'haute' as Priorite },
  { id: 'A4-008', titre: 'Négocier contrats prestataires majeurs', dateDebut: '2026-02-01', dateFin: '2026-03-31', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A4-009', titre: 'Élaborer budget exploitation 2027', dateDebut: '2026-10-01', dateFin: '2026-11-30', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A4-010', titre: 'Préparer bilan financier projet', dateDebut: '2027-01-01', dateFin: '2027-01-31', responsable: RESPONSABLES.FINANCE, priorite: 'haute' as Priorite },
];

// ============================================================================
// 2.5 ACTIONS AXE 5 : MARKETING & COMMUNICATION (A5-001 à A5-015)
// ============================================================================
export const ACTIONS_AXE5 = [
  { id: 'A5-001', titre: 'Finaliser stratégie communication', dateDebut: '2026-02-01', dateFin: '2026-03-15', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'critique' as Priorite },
  { id: 'A5-002', titre: 'Développer identité visuelle Cosmos Angré', dateDebut: '2026-03-01', dateFin: '2026-03-31', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'critique' as Priorite },
  { id: 'A5-003', titre: 'Créer charte graphique complète', dateDebut: '2026-04-01', dateFin: '2026-04-30', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'haute' as Priorite },
  { id: 'A5-004', titre: 'Développer site web', dateDebut: '2026-03-01', dateFin: '2026-04-30', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'haute' as Priorite },
  { id: 'A5-005', titre: 'Activer réseaux sociaux', dateDebut: '2026-04-15', dateFin: '2026-04-30', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'haute' as Priorite },
  { id: 'A5-006', titre: 'Produire contenu teasing', dateDebut: '2026-08-01', dateFin: '2026-08-31', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'critique' as Priorite },
  { id: 'A5-007', titre: 'Lancer campagne teasing', dateDebut: '2026-09-01', dateFin: '2026-10-31', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'critique' as Priorite },
  { id: 'A5-008', titre: 'Produire contenu campagne lancement', dateDebut: '2026-10-01', dateFin: '2026-10-31', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'critique' as Priorite },
  { id: 'A5-009', titre: 'Lancer campagne lancement', dateDebut: '2026-11-01', dateFin: '2026-11-15', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'critique' as Priorite },
  { id: 'A5-010', titre: 'Organiser événement presse', dateDebut: '2026-11-01', dateFin: '2026-11-10', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'haute' as Priorite },
  { id: 'A5-011', titre: 'Coordonner installation signalétique extérieure', dateDebut: '2026-10-15', dateFin: '2026-11-01', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'critique' as Priorite },
  { id: 'A5-012', titre: 'Coordonner installation signalétique intérieure', dateDebut: '2026-11-01', dateFin: '2026-11-10', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'critique' as Priorite },
  { id: 'A5-013', titre: 'Organiser Soft Opening', dateDebut: '2026-10-01', dateFin: '2026-10-16', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A5-014', titre: 'Organiser Inauguration officielle', dateDebut: '2026-11-01', dateFin: '2026-11-15', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A5-015', titre: 'Finaliser mission Yvan (parcours client, branding)', dateDebut: '2026-02-01', dateFin: '2026-02-28', responsable: RESPONSABLES.DGA, priorite: 'haute' as Priorite },
];

// ============================================================================
// 2.6 ACTIONS AXE 6 : EXPLOITATION & SYSTÈMES (A6-001 à A6-018)
// ============================================================================
export const ACTIONS_AXE6 = [
  { id: 'A6-001', titre: 'Rédiger procédures d\'exploitation', dateDebut: '2026-05-01', dateFin: '2026-07-31', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'critique' as Priorite },
  { id: 'A6-002', titre: 'Lancer appel d\'offres nettoyage', dateDebut: '2026-04-01', dateFin: '2026-05-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A6-003', titre: 'Signer contrat nettoyage', dateDebut: '2026-06-01', dateFin: '2026-06-30', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A6-004', titre: 'Lancer appel d\'offres sécurité/gardiennage', dateDebut: '2026-04-01', dateFin: '2026-05-31', responsable: RESPONSABLES.SECURITY_MGR, priorite: 'critique' as Priorite },
  { id: 'A6-005', titre: 'Signer contrat sécurité/gardiennage', dateDebut: '2026-06-01', dateFin: '2026-06-30', responsable: RESPONSABLES.SECURITY_MGR, priorite: 'critique' as Priorite },
  { id: 'A6-006', titre: 'Lancer appel d\'offres maintenance technique', dateDebut: '2026-05-01', dateFin: '2026-06-30', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A6-007', titre: 'Signer contrat maintenance technique', dateDebut: '2026-07-01', dateFin: '2026-07-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A6-008', titre: 'Lancer appel d\'offres espaces verts', dateDebut: '2026-06-01', dateFin: '2026-07-31', responsable: RESPONSABLES.FM, priorite: 'moyenne' as Priorite },
  { id: 'A6-009', titre: 'Signer contrat espaces verts', dateDebut: '2026-08-01', dateFin: '2026-08-31', responsable: RESPONSABLES.FM, priorite: 'moyenne' as Priorite },
  { id: 'A6-010', titre: 'Lancer appel d\'offres gestion déchets', dateDebut: '2026-06-01', dateFin: '2026-07-31', responsable: RESPONSABLES.FM, priorite: 'haute' as Priorite },
  { id: 'A6-011', titre: 'Signer contrat gestion déchets', dateDebut: '2026-08-01', dateFin: '2026-08-31', responsable: RESPONSABLES.FM, priorite: 'haute' as Priorite },
  { id: 'A6-012', titre: 'Sélectionner et paramétrer logiciel de gestion', dateDebut: '2026-07-01', dateFin: '2026-09-30', responsable: RESPONSABLES.IT, priorite: 'critique' as Priorite },
  { id: 'A6-013', titre: 'Sélectionner et paramétrer système de caisse', dateDebut: '2026-08-01', dateFin: '2026-10-31', responsable: RESPONSABLES.IT, priorite: 'critique' as Priorite },
  { id: 'A6-014', titre: 'Former équipes aux procédures', dateDebut: '2026-09-01', dateFin: '2026-10-31', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'critique' as Priorite },
  { id: 'A6-015', titre: 'Former équipes aux systèmes', dateDebut: '2026-10-01', dateFin: '2026-10-31', responsable: RESPONSABLES.IT, priorite: 'critique' as Priorite },
  { id: 'A6-016', titre: 'Organiser test exploitation grandeur nature', dateDebut: '2026-11-05', dateFin: '2026-11-10', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'critique' as Priorite },
  { id: 'A6-017', titre: 'Préparer dossier commission de sécurité', dateDebut: '2026-10-01', dateFin: '2026-10-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A6-018', titre: 'Obtenir avis favorable commission sécurité', dateDebut: '2026-11-01', dateFin: '2026-11-10', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
];

// ============================================================================
// 2.7 ACTIONS SPÉCIFIQUES AFFICHAGE (demande Cheick) (A-AFF-001 à A-AFF-003)
// ============================================================================
export const ACTIONS_AFFICHAGE = [
  { id: 'A-AFF-001', titre: 'Rédiger draft contrat affichage (base JC Decaux)', dateDebut: '2026-01-06', dateFin: '2026-01-10', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A-AFF-002', titre: 'Revue contrat par Jean Désiré', dateDebut: '2026-01-10', dateFin: '2026-01-14', responsable: RESPONSABLES.JURIDIQUE, priorite: 'critique' as Priorite },
  { id: 'A-AFF-003', titre: 'Envoyer draft final à Cheick', dateDebut: '2026-01-15', dateFin: '2026-01-15', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
];

// ============================================================================
// 2.8 ACTIONS BASSIN DE RÉTENTION (demande Cheick) (A-BR-001 à A-BR-004)
// ============================================================================
export const ACTIONS_BASSIN = [
  { id: 'A-BR-001', titre: 'Revu final présentation bassin', dateDebut: '2026-01-05', dateFin: '2026-01-07', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A-BR-002', titre: 'Soumission draft vidéo bassin', dateDebut: '2026-01-08', dateFin: '2026-01-20', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A-BR-003', titre: 'Soumission version finale vidéo', dateDebut: '2026-01-21', dateFin: '2026-01-30', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
  { id: 'A-BR-004', titre: 'Dossier complet Word + backup Dropbox', dateDebut: '2026-01-15', dateFin: '2026-01-30', responsable: RESPONSABLES.DGA, priorite: 'critique' as Priorite },
];

// ============================================================================
// PARTIE 3 : RISQUES
// ============================================================================

// 3.1 RISQUES GLOBAUX PROJET (R-001 à R-010)
export const RISQUES_GLOBAUX = [
  { id: 'R-001', titre: 'Retard livraison chantier', description: 'Retard dans la livraison globale du chantier', probabilite: 4, impact: 5, criticite: 20, axe: 'Technique', responsable: RESPONSABLES.DGA, mitigation: 'Suivi hebdo renforcé, pénalités contractuelles' },
  { id: 'R-002', titre: 'Dépassement budget projet', description: 'Dépassement significatif du budget prévisionnel', probabilite: 3, impact: 4, criticite: 12, axe: 'Budget', responsable: RESPONSABLES.FINANCE, mitigation: 'Revues mensuelles, provisions contingence' },
  { id: 'R-003', titre: 'Taux d\'occupation insuffisant à l\'ouverture', description: 'Moins de 85% de commercialisation au Soft Opening', probabilite: 3, impact: 5, criticite: 15, axe: 'Commercial', responsable: RESPONSABLES.COMMERCIAL_MGR, mitigation: 'Commercialisation anticipée, incentives' },
  { id: 'R-004', titre: 'Défaillance locomotive alimentaire', description: 'Carrefour ou équivalent ne signe pas', probabilite: 2, impact: 5, criticite: 10, axe: 'Commercial', responsable: RESPONSABLES.DGA, mitigation: 'Plan B avec alternatives identifiées' },
  { id: 'R-005', titre: 'Difficultés recrutement équipes clés', description: 'Impossibilité de recruter les managers clés', probabilite: 3, impact: 4, criticite: 12, axe: 'RH', responsable: RESPONSABLES.RH, mitigation: 'Chasseurs de têtes, packages attractifs' },
  { id: 'R-006', titre: 'Commission sécurité non favorable', description: 'Refus d\'avis favorable par la commission', probabilite: 2, impact: 5, criticite: 10, axe: 'Exploitation', responsable: RESPONSABLES.SECURITY_MGR, mitigation: 'Préparation rigoureuse, pré-visites' },
  { id: 'R-007', titre: 'Retards fit-out preneurs', description: 'Preneurs en retard dans leurs aménagements', probabilite: 4, impact: 4, criticite: 16, axe: 'Technique', responsable: RESPONSABLES.FM, mitigation: 'Planning serré, pénalités, coordination' },
  { id: 'R-008', titre: 'Problèmes techniques équipements', description: 'Défaillance des équipements techniques', probabilite: 3, impact: 4, criticite: 12, axe: 'Technique', responsable: RESPONSABLES.FM, mitigation: 'Tests précoces, maintenance préventive' },
  { id: 'R-009', titre: 'Contexte socio-économique défavorable', description: 'Conjoncture économique impactant le projet', probabilite: 3, impact: 3, criticite: 9, axe: 'Tous', responsable: RESPONSABLES.DGA, mitigation: 'Veille, plans contingence' },
  { id: 'R-010', titre: 'Mauvaise coordination inter-axes', description: 'Problèmes de communication entre équipes', probabilite: 3, impact: 4, criticite: 12, axe: 'Tous', responsable: RESPONSABLES.DGA, mitigation: 'Gouvernance projet renforcée' },
];

// 3.2 RISQUES AXE 1 : RH & ORGANISATION (R1-001 à R1-005)
export const RISQUES_AXE1 = [
  { id: 'R1-001', titre: 'Non-disponibilité profils managers', probabilite: 3, impact: 4, criticite: 12, mitigation: 'Chasseurs de têtes multiples, salaires compétitifs' },
  { id: 'R1-002', titre: 'Turnover précoce recrues', probabilite: 2, impact: 3, criticite: 6, mitigation: 'Onboarding soigné, conditions attractives' },
  { id: 'R1-003', titre: 'Délais recrutement agents trop longs', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Partenariats écoles, viviers candidats' },
  { id: 'R1-004', titre: 'Équipes non formées à temps', probabilite: 2, impact: 4, criticite: 8, mitigation: 'Planning formation anticipé, formateurs dédiés' },
  { id: 'R1-005', titre: 'Conflits syndicaux/sociaux', probabilite: 2, impact: 3, criticite: 6, mitigation: 'Dialogue social, conditions transparentes' },
];

// 3.3 RISQUES AXE 2 : COMMERCIALISATION (R2-001 à R2-010)
export const RISQUES_AXE2 = [
  { id: 'R2-001', titre: 'Carrefour ne signe pas', probabilite: 2, impact: 5, criticite: 10, mitigation: 'Alternatives (Auchan, Casino), négociation prioritaire' },
  { id: 'R2-002', titre: 'Taux occupation < 70% à l\'ouverture', probabilite: 3, impact: 5, criticite: 15, mitigation: 'Commercialisation aggressive, incentives preneurs' },
  { id: 'R2-003', titre: 'Mix commercial déséquilibré', probabilite: 3, impact: 4, criticite: 12, mitigation: 'Pilotage mix, refus stratégiques' },
  { id: 'R2-004', titre: 'Big Box non loués', probabilite: 3, impact: 4, criticite: 12, mitigation: 'Prospection internationale, flexibilité aménagement' },
  { id: 'R2-005', titre: 'Défaillance preneurs signés', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Due diligence, garanties bancaires' },
  { id: 'R2-006', titre: 'Marché artisanal non attractif', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Concept différenciant, sélection qualité' },
  { id: 'R2-007', titre: 'Zone Expo sans événements', probabilite: 3, impact: 2, criticite: 6, mitigation: 'Partenariats organisateurs, prix attractifs' },
  { id: 'R2-008', titre: 'Parking non rentable', probabilite: 2, impact: 2, criticite: 4, mitigation: 'Tarification adaptée, abonnements B2B' },
  { id: 'R2-009', titre: 'Concurrence centres commerciaux', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Positionnement différenciant, enseignes exclusives' },
  { id: 'R2-010', titre: 'Preneurs désistent avant ouverture', probabilite: 2, impact: 4, criticite: 8, mitigation: 'Clauses contractuelles, pénalités, backup list' },
];

// 3.4 RISQUES AXE 3 : TECHNIQUE & HANDOVER (R3-001 à R3-012)
export const RISQUES_AXE3 = [
  { id: 'R3-001', titre: 'Retard livraison gros œuvre', probabilite: 4, impact: 5, criticite: 20, batiment: 'Tous', mitigation: 'Pénalités, réunions chantier hebdo' },
  { id: 'R3-002', titre: 'Retard livraison second œuvre', probabilite: 4, impact: 4, criticite: 16, batiment: 'Tous', mitigation: 'Planning serré, suivi quotidien' },
  { id: 'R3-003', titre: 'Qualité travaux insuffisante', probabilite: 3, impact: 4, criticite: 12, batiment: 'Tous', mitigation: 'Contrôles qualité, bureau de contrôle' },
  { id: 'R3-004', titre: 'Réserves nombreuses non levées', probabilite: 4, impact: 4, criticite: 16, batiment: 'Tous', mitigation: 'Suivi rigoureux, relances, pénalités' },
  { id: 'R3-005', titre: 'DOE incomplet/tardif', probabilite: 3, impact: 4, criticite: 12, batiment: 'Tous', mitigation: 'Exigence contractuelle, jalons intermédiaires' },
  { id: 'R3-006', titre: 'Mise en service électricité retardée', probabilite: 3, impact: 5, criticite: 15, batiment: 'Tous', mitigation: 'Coordination CIE anticipée' },
  { id: 'R3-007', titre: 'Problèmes SSI à la réception', probabilite: 3, impact: 5, criticite: 15, batiment: 'Tous', mitigation: 'Tests précoces, bureau vérification' },
  { id: 'R3-008', titre: 'Ascenseurs/escalators non opérationnels', probabilite: 3, impact: 4, criticite: 12, batiment: 'Centre Commercial', mitigation: 'Réception anticipée, tests charge' },
  { id: 'R3-009', titre: 'Système parking défaillant', probabilite: 3, impact: 3, criticite: 9, batiment: 'Parking', mitigation: 'Tests intensifs, backup manuel' },
  { id: 'R3-010', titre: 'Fit-out Carrefour en retard', probabilite: 3, impact: 5, criticite: 15, batiment: 'Centre Commercial', mitigation: 'Coordination renforcée, jalons intermédiaires' },
  { id: 'R3-011', titre: 'Fit-out preneurs non conformes', probabilite: 3, impact: 3, criticite: 9, batiment: 'Tous', mitigation: 'Validation plans, contrôles SOCOTEC' },
  { id: 'R3-012', titre: 'Coordination chantier/fit-out défaillante', probabilite: 4, impact: 4, criticite: 16, batiment: 'Tous', mitigation: 'Planning intégré, réunions coordination' },
];

// 3.5 RISQUES AXE 4 : BUDGET & PILOTAGE (R4-001 à R4-006)
export const RISQUES_AXE4 = [
  { id: 'R4-001', titre: 'Dépassement budget construction', probabilite: 4, impact: 4, criticite: 16, mitigation: 'Provisions contingence 10%, suivi mensuel' },
  { id: 'R4-002', titre: 'Dépassement budget pré-exploitation', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Enveloppe plafonnée, arbitrages DGA' },
  { id: 'R4-003', titre: 'Coûts fit-out communs imprévus', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Budget dédié, récupération prorata' },
  { id: 'R4-004', titre: 'Problèmes trésorerie projet', probabilite: 2, impact: 4, criticite: 8, mitigation: 'Plan trésorerie, lignes crédit standby' },
  { id: 'R4-005', titre: 'Inflation matériaux/main d\'œuvre', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Clauses révision, achats anticipés' },
  { id: 'R4-006', titre: 'Retards paiements preneurs (garanties)', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Cautions bancaires exigées' },
];

// 3.6 RISQUES AXE 5 : MARKETING & COMMUNICATION (R5-001 à R5-007)
export const RISQUES_AXE5 = [
  { id: 'R5-001', titre: 'Campagne communication inefficace', probabilite: 3, impact: 4, criticite: 12, mitigation: 'Tests préalables, ajustements, multi-canaux' },
  { id: 'R5-002', titre: 'Retard signalétique', probabilite: 3, impact: 4, criticite: 12, mitigation: 'Commande anticipée, suivi fabrication' },
  { id: 'R5-003', titre: 'Budget marketing insuffisant', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Priorisation actions, partenariats médias' },
  { id: 'R5-004', titre: 'Soft Opening perturbé', probabilite: 2, impact: 4, criticite: 8, mitigation: 'Plans B, gestion de crise' },
  { id: 'R5-005', titre: 'Inauguration reportée', probabilite: 2, impact: 5, criticite: 10, mitigation: 'Marge calendrier, communication flexible' },
  { id: 'R5-006', titre: 'Mauvaise perception publique', probabilite: 2, impact: 4, criticite: 8, mitigation: 'RP proactives, gestion réputation' },
  { id: 'R5-007', titre: 'Mission Yvan en retard', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Relances, deadline ferme fin février' },
];

// 3.7 RISQUES AXE 6 : EXPLOITATION & SYSTÈMES (R6-001 à R6-008)
export const RISQUES_AXE6 = [
  { id: 'R6-001', titre: 'Commission sécurité défavorable', probabilite: 2, impact: 5, criticite: 10, mitigation: 'Préparation rigoureuse, pré-visites' },
  { id: 'R6-002', titre: 'Prestataires non performants', probabilite: 3, impact: 4, criticite: 12, mitigation: 'Sélection rigoureuse, clauses performance' },
  { id: 'R6-003', titre: 'Systèmes informatiques non prêts', probabilite: 3, impact: 4, criticite: 12, mitigation: 'Démarrage paramétrage anticipé, tests' },
  { id: 'R6-004', titre: 'Procédures non finalisées', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Deadline juillet, validation Center Manager' },
  { id: 'R6-005', titre: 'Équipes non formées', probabilite: 2, impact: 4, criticite: 8, mitigation: 'Planning formation rigoureux' },
  { id: 'R6-006', titre: 'Test grandeur nature révèle problèmes', probabilite: 3, impact: 3, criticite: 9, mitigation: 'Marge correction avant ouverture' },
  { id: 'R6-007', titre: 'Contrats exploitation non signés à temps', probabilite: 3, impact: 4, criticite: 12, mitigation: 'Négociations anticipées, backup' },
  { id: 'R6-008', titre: 'Gestion déchets non opérationnelle', probabilite: 2, impact: 3, criticite: 6, mitigation: 'Contrat signé août, tests avant ouverture' },
];

// 3.8 RISQUES PAR BÂTIMENT

// Centre Commercial (Mall)
export const RISQUES_CC = [
  { id: 'R-CC-001', titre: 'Food court incomplet à l\'ouverture', probabilite: 3, impact: 3, criticite: 9, buildingCode: 'CC' },
  { id: 'R-CC-002', titre: 'Escalators/ascenseurs non opérationnels', probabilite: 2, impact: 5, criticite: 10, buildingCode: 'CC' },
  { id: 'R-CC-003', titre: 'Climatisation défaillante', probabilite: 2, impact: 5, criticite: 10, buildingCode: 'CC' },
  { id: 'R-CC-004', titre: 'Boutiques vides visibles', probabilite: 3, impact: 4, criticite: 12, buildingCode: 'CC' },
];

// Big Box 1-4
export const RISQUES_BB = [
  { id: 'R-BB-001', titre: 'Big Box non tous loués', probabilite: 3, impact: 4, criticite: 12, buildingCode: 'BB1' },
  { id: 'R-BB-002', titre: 'Fit-out Big Box en retard', probabilite: 3, impact: 4, criticite: 12, buildingCode: 'BB1' },
  { id: 'R-BB-003', titre: 'Accès livraisons inadapté', probabilite: 2, impact: 3, criticite: 6, buildingCode: 'BB1' },
];

// Zone Expo
export const RISQUES_ZE = [
  { id: 'R-ZE-001', titre: 'Concept exploitation non défini', probabilite: 3, impact: 3, criticite: 9, buildingCode: 'ZE' },
  { id: 'R-ZE-002', titre: 'Pas d\'événement à l\'ouverture', probabilite: 3, impact: 2, criticite: 6, buildingCode: 'ZE' },
  { id: 'R-ZE-003', titre: 'Équipements techniques insuffisants', probabilite: 2, impact: 3, criticite: 6, buildingCode: 'ZE' },
];

// Marché Artisanal
export const RISQUES_MA = [
  { id: 'R-MA-001', titre: 'Artisans insuffisants/non qualifiés', probabilite: 3, impact: 3, criticite: 9, buildingCode: 'MA' },
  { id: 'R-MA-002', titre: 'Concept non attractif', probabilite: 3, impact: 3, criticite: 9, buildingCode: 'MA' },
  { id: 'R-MA-003', titre: 'Conflits entre artisans', probabilite: 2, impact: 2, criticite: 4, buildingCode: 'MA' },
];

// Parking
export const RISQUES_PK = [
  { id: 'R-PK-001', titre: 'Système parking défaillant', probabilite: 3, impact: 4, criticite: 12, buildingCode: 'PK' },
  { id: 'R-PK-002', titre: 'Capacité insuffisante', probabilite: 2, impact: 3, criticite: 6, buildingCode: 'PK' },
  { id: 'R-PK-003', titre: 'Sécurité parking insuffisante', probabilite: 2, impact: 4, criticite: 8, buildingCode: 'PK' },
  { id: 'R-PK-004', titre: 'Éclairage/ventilation défaillants', probabilite: 2, impact: 3, criticite: 6, buildingCode: 'PK' },
];
