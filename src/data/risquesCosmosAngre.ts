// ============================================================================
// COSMOS ANGRÉ - REGISTRE DES RISQUES COMPLET v2.0
// 68 Risques | 25 Critiques | 22 Majeurs | 18 Modérés | 3 Faibles
// Catégories et responsables corrigés — aligné sur les 200 actions réelles
// ============================================================================

import type { RisqueCategory } from '@/types';
import { SEUILS_RISQUES } from '@/data/constants';

// ============================================================================
// TYPES
// ============================================================================

export type RisqueNiveau = 'critique' | 'majeur' | 'modere' | 'faible';
export type RisqueTendance = 'stable' | 'augmentation' | 'diminution';

export interface RisqueCosmosAngre {
  id: string;
  code: string;
  titre: string;
  description: string;
  categorie: RisqueCategory;
  probabilite: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  score: number;
  niveau: RisqueNiveau;
  responsable: string; // Initiales: PA, DN, HT, YG, JA
  statut: 'Ouvert' | 'Atténué';
}

// ============================================================================
// RESPONSABLES
// ============================================================================

export const RESPONSABLES_RISQUES: Record<string, string> = {
  PA: 'Pamela ATOKOUNA',
  DN: 'Deborah NTUMY',
  HT: 'Hadja Timite',
  YG: 'Yvan Guehi',
  AA: 'Adele Affian',
  JA: 'Julien Assie',
  CS: 'Cheick Sanankoua',
};

// ============================================================================
// MÉTHODOLOGIE - Matrice de Criticité
// ============================================================================

export const MATRICE_CRITICITE = {
  description: 'Score = Probabilité × Impact (1-25)',
  niveaux: [
    { min: 12, max: 25, niveau: 'critique' as RisqueNiveau, couleur: '🔴', action: 'Plan de mitigation immédiat + suivi hebdo' },
    { min: 8, max: 11, niveau: 'majeur' as RisqueNiveau, couleur: '🟠', action: 'Plan de mitigation + suivi bi-mensuel' },
    { min: 4, max: 7, niveau: 'modere' as RisqueNiveau, couleur: '🟡', action: 'Surveillance + plan si déclenchement' },
    { min: 1, max: 3, niveau: 'faible' as RisqueNiveau, couleur: '🟢', action: 'Surveillance passive' },
  ],
};

export const getNiveauRisque = (score: number): RisqueNiveau => {
  if (score >= SEUILS_RISQUES.critique) return 'critique';
  if (score >= SEUILS_RISQUES.majeur) return 'majeur';
  if (score >= SEUILS_RISQUES.modere) return 'modere';
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
// REGISTRE COMPLET — 68 RISQUES
// ============================================================================

export const REGISTRE_RISQUES_COSMOS_ANGRE: RisqueCosmosAngre[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CRITIQUE (Score >= 12) — 25 risques
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'R01', code: 'R01', titre: "Taux d'occupation insuffisant à l'ouverture (<85%)", description: "Le taux d'occupation pourrait ne pas atteindre 85% au moment du Soft Opening.", categorie: 'commercial', probabilite: 3, impact: 5, score: 15, niveau: 'critique', responsable: 'HT', statut: 'Ouvert' },
  { id: 'R02', code: 'R02', titre: 'Mise en service électricité retardée', description: "La CIE pourrait retarder la mise en service électrique définitive.", categorie: 'technique', probabilite: 3, impact: 5, score: 15, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R03', code: 'R03', titre: 'Problèmes SSI à la réception', description: "Le système de sécurité incendie pourrait ne pas être conforme à la réception.", categorie: 'technique', probabilite: 3, impact: 5, score: 15, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R04', code: 'R04', titre: 'Fit-out Carrefour en retard', description: "Carrefour pourrait ne pas avoir terminé son aménagement pour le Soft Opening.", categorie: 'planning', probabilite: 3, impact: 5, score: 15, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R05', code: 'R05', titre: 'Retard livraison chantier', description: "Le constructeur pourrait accuser du retard sur les livraisons prévues.", categorie: 'technique', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R06', code: 'R06', titre: 'Dépassement budget projet', description: "Le budget global du projet pourrait dépasser l'enveloppe initiale.", categorie: 'financier', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'PA', statut: 'Ouvert' },
  { id: 'R07', code: 'R07', titre: 'Difficultés recrutement équipes clés', description: "Les profils qualifiés pour les postes clés pourraient être difficiles à trouver.", categorie: 'rh', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'PA', statut: 'Ouvert' },
  { id: 'R08', code: 'R08', titre: 'Non-disponibilité profils managers', description: "Les managers ciblés pourraient ne pas être disponibles aux dates prévues.", categorie: 'rh', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'PA', statut: 'Ouvert' },
  { id: 'R09', code: 'R09', titre: 'Retards fit-out preneurs', description: "Les preneurs pourraient accuser du retard dans leurs aménagements.", categorie: 'planning', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'HT', statut: 'Ouvert' },
  { id: 'R10', code: 'R10', titre: 'Problèmes techniques équipements', description: "Les équipements techniques pourraient présenter des dysfonctionnements.", categorie: 'technique', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R11', code: 'R11', titre: 'Mauvaise coordination inter-axes', description: "La coordination entre les différents axes du projet pourrait être défaillante.", categorie: 'organisationnel', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'PA', statut: 'Ouvert' },
  { id: 'R12', code: 'R12', titre: 'Mix commercial déséquilibré', description: "Le mix commercial pourrait ne pas correspondre aux attentes du marché.", categorie: 'commercial', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'HT', statut: 'Ouvert' },
  { id: 'R13', code: 'R13', titre: 'Big Box non loués', description: "Les Big Box pourraient ne pas trouver de preneurs avant l'ouverture.", categorie: 'commercial', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'HT', statut: 'Ouvert' },
  { id: 'R14', code: 'R14', titre: 'Retard livraison gros œuvre', description: "Le gros œuvre pourrait être livré en retard par le constructeur.", categorie: 'technique', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R15', code: 'R15', titre: 'Retard livraison second œuvre', description: "Le second œuvre pourrait être livré en retard.", categorie: 'technique', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R16', code: 'R16', titre: 'Qualité travaux insuffisante', description: "La qualité des travaux pourrait ne pas être au niveau attendu.", categorie: 'technique', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R17', code: 'R17', titre: 'Réserves nombreuses non levées', description: "Le nombre de réserves à lever pourrait être trop important.", categorie: 'technique', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R18', code: 'R18', titre: 'DOE incomplet/tardif', description: "Les Dossiers des Ouvrages Exécutés pourraient être incomplets ou tardifs.", categorie: 'technique', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R19', code: 'R19', titre: 'Ascenseurs/escalators non opérationnels', description: "Les ascenseurs et escalators pourraient ne pas être opérationnels à l'ouverture.", categorie: 'technique', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R20', code: 'R20', titre: 'Coordination chantier/fit-out défaillante', description: "La coordination entre le chantier et les fit-out preneurs pourrait être défaillante.", categorie: 'planning', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'DN', statut: 'Ouvert' },
  { id: 'R21', code: 'R21', titre: 'Dépassement budget construction', description: "Le budget construction pourrait dépasser les prévisions.", categorie: 'financier', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'PA', statut: 'Ouvert' },
  { id: 'R22', code: 'R22', titre: 'Campagne communication inefficace', description: "La campagne de communication pourrait ne pas atteindre ses objectifs.", categorie: 'marketing', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'YG', statut: 'Ouvert' },
  { id: 'R23', code: 'R23', titre: 'Retard signalétique', description: "La signalétique pourrait ne pas être prête pour l'ouverture.", categorie: 'marketing', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'YG', statut: 'Ouvert' },
  { id: 'R24', code: 'R24', titre: 'Prestataires non performants', description: "Les prestataires sélectionnés pourraient ne pas être performants.", categorie: 'contractuel', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'PA', statut: 'Ouvert' },
  { id: 'R25', code: 'R25', titre: 'Systèmes informatiques non prêts', description: "Les systèmes informatiques pourraient ne pas être opérationnels à temps.", categorie: 'technique', probabilite: 3, impact: 4, score: 12, niveau: 'critique', responsable: 'JA', statut: 'Ouvert' },

  // ═══════════════════════════════════════════════════════════════════════════
  // MAJEUR (Score 9-10) — 22 risques
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'R26', code: 'R26', titre: 'Défaillance locomotive alimentaire (Carrefour)', description: "Carrefour pourrait se retirer du projet ou ne pas confirmer son engagement.", categorie: 'commercial', probabilite: 2, impact: 5, score: 10, niveau: 'majeur', responsable: 'HT', statut: 'Atténué' },
  { id: 'R27', code: 'R27', titre: 'Commission sécurité non favorable', description: "La commission de sécurité pourrait émettre un avis défavorable.", categorie: 'securite', probabilite: 2, impact: 5, score: 10, niveau: 'majeur', responsable: 'DN', statut: 'Atténué' },
  { id: 'R28', code: 'R28', titre: 'Inauguration reportée', description: "L'inauguration pourrait devoir être reportée pour diverses raisons.", categorie: 'organisationnel', probabilite: 2, impact: 5, score: 10, niveau: 'majeur', responsable: 'PA', statut: 'Atténué' },
  { id: 'R29', code: 'R29', titre: 'Climatisation défaillante', description: "Le système de climatisation pourrait être défaillant à l'ouverture.", categorie: 'technique', probabilite: 2, impact: 5, score: 10, niveau: 'majeur', responsable: 'DN', statut: 'Atténué' },
  { id: 'R30', code: 'R30', titre: 'Boutiques vides visibles', description: "Des boutiques vides pourraient être visibles le jour de l'ouverture.", categorie: 'commercial', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'HT', statut: 'Atténué' },
  { id: 'R31', code: 'R31', titre: 'Fit-out Big Box en retard', description: "Les aménagements des Big Box pourraient accuser du retard.", categorie: 'planning', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'DN', statut: 'Atténué' },
  { id: 'R32', code: 'R32', titre: 'Système parking défaillant', description: "Le système de gestion du parking pourrait ne pas fonctionner correctement.", categorie: 'technique', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'DN', statut: 'Atténué' },
  { id: 'R33', code: 'R33', titre: 'Contexte socio-économique défavorable', description: "Le contexte économique pourrait impacter la fréquentation et les loyers.", categorie: 'externe', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'PA', statut: 'Atténué' },
  { id: 'R34', code: 'R34', titre: 'Délais recrutement agents trop longs', description: "Le recrutement des agents opérationnels pourrait prendre trop de temps.", categorie: 'rh', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'PA', statut: 'Atténué' },
  { id: 'R35', code: 'R35', titre: 'Défaillance preneurs signés', description: "Des preneurs ayant signé pourraient faire défaut avant l'ouverture.", categorie: 'commercial', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'HT', statut: 'Atténué' },
  { id: 'R36', code: 'R36', titre: 'Marché artisanal non attractif', description: "Le marché artisanal pourrait ne pas attirer suffisamment de visiteurs.", categorie: 'commercial', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'HT', statut: 'Atténué' },
  { id: 'R37', code: 'R37', titre: 'Concurrence centres commerciaux', description: "La concurrence des autres centres commerciaux pourrait impacter la fréquentation.", categorie: 'externe', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'PA', statut: 'Atténué' },
  { id: 'R38', code: 'R38', titre: 'Fit-out preneurs non conformes', description: "Les aménagements des preneurs pourraient ne pas respecter les normes.", categorie: 'planning', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'DN', statut: 'Atténué' },
  { id: 'R39', code: 'R39', titre: 'Dépassement budget pré-exploitation', description: "Le budget de pré-exploitation pourrait dépasser les prévisions.", categorie: 'financier', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'PA', statut: 'Atténué' },
  { id: 'R40', code: 'R40', titre: 'Coûts fit-out communs imprévus', description: "Des coûts imprévus pourraient survenir pour les aménagements des parties communes.", categorie: 'financier', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'PA', statut: 'Atténué' },
  { id: 'R41', code: 'R41', titre: "Inflation matériaux/main d'œuvre", description: "L'inflation pourrait impacter les coûts des matériaux et de la main d'œuvre.", categorie: 'externe', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'PA', statut: 'Atténué' },
  { id: 'R42', code: 'R42', titre: 'Retards paiements preneurs (garanties)', description: "Les preneurs pourraient retarder le paiement des garanties.", categorie: 'financier', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'HT', statut: 'Atténué' },
  { id: 'R43', code: 'R43', titre: 'Budget marketing insuffisant', description: "Le budget marketing pourrait être insuffisant pour les besoins.", categorie: 'financier', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'YG', statut: 'Atténué' },
  { id: 'R44', code: 'R44', titre: 'Mission Yvan en retard', description: "La mission marketing de Yvan pourrait accuser du retard.", categorie: 'marketing', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'YG', statut: 'Atténué' },
  { id: 'R45', code: 'R45', titre: 'Procédures non finalisées', description: "Les procédures d'exploitation pourraient ne pas être finalisées à temps.", categorie: 'organisationnel', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'HT', statut: 'Atténué' },
  { id: 'R46', code: 'R46', titre: 'Test grandeur nature révèle problèmes', description: "Le test grandeur nature pourrait révéler des problèmes majeurs.", categorie: 'organisationnel', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'DN', statut: 'Atténué' },
  { id: 'R47', code: 'R47', titre: "Food court incomplet à l'ouverture", description: "Le food court pourrait ne pas être complet au moment de l'ouverture.", categorie: 'commercial', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'HT', statut: 'Atténué' },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODÉRÉ (Score 6-8) — 18 risques
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'R48', code: 'R48', titre: 'Contrats exploitation non signés à temps', description: "Les contrats d'exploitation pourraient ne pas être signés dans les délais.", categorie: 'contractuel', probabilite: 2, impact: 4, score: 8, niveau: 'modere', responsable: 'PA', statut: 'Atténué' },
  { id: 'R49', code: 'R49', titre: 'Équipes non formées à temps', description: "Les équipes pourraient ne pas être suffisamment formées pour l'ouverture.", categorie: 'rh', probabilite: 2, impact: 4, score: 8, niveau: 'modere', responsable: 'PA', statut: 'Atténué' },
  { id: 'R50', code: 'R50', titre: 'Preneurs désistent avant ouverture', description: "Des preneurs pourraient se désister avant l'ouverture.", categorie: 'commercial', probabilite: 2, impact: 4, score: 8, niveau: 'modere', responsable: 'HT', statut: 'Atténué' },
  { id: 'R51', code: 'R51', titre: 'Problèmes trésorerie projet', description: "Le projet pourrait rencontrer des problèmes de trésorerie.", categorie: 'financier', probabilite: 2, impact: 4, score: 8, niveau: 'modere', responsable: 'PA', statut: 'Atténué' },
  { id: 'R52', code: 'R52', titre: 'Soft Opening perturbé', description: "Le Soft Opening pourrait être perturbé par divers problèmes.", categorie: 'organisationnel', probabilite: 2, impact: 4, score: 8, niveau: 'modere', responsable: 'PA', statut: 'Atténué' },
  { id: 'R53', code: 'R53', titre: 'Mauvaise perception publique', description: "La perception publique du centre pourrait être négative.", categorie: 'marketing', probabilite: 2, impact: 4, score: 8, niveau: 'modere', responsable: 'YG', statut: 'Atténué' },
  { id: 'R54', code: 'R54', titre: 'Sécurité parking insuffisante', description: "La sécurité du parking pourrait être insuffisante.", categorie: 'securite', probabilite: 2, impact: 4, score: 8, niveau: 'modere', responsable: 'DN', statut: 'Atténué' },
  { id: 'R55', code: 'R55', titre: 'Concept exploitation non défini', description: "Le concept d'exploitation pourrait ne pas être clairement défini.", categorie: 'organisationnel', probabilite: 3, impact: 3, score: 9, niveau: 'majeur', responsable: 'PA', statut: 'Atténué' },
  { id: 'R56', code: 'R56', titre: 'Artisans insuffisants/non qualifiés', description: "Les artisans du marché pourraient être insuffisants ou non qualifiés.", categorie: 'commercial', probabilite: 2, impact: 3, score: 6, niveau: 'modere', responsable: 'HT', statut: 'Atténué' },
  { id: 'R57', code: 'R57', titre: 'Concept non attractif', description: "Le concept commercial pourrait ne pas être attractif pour la clientèle.", categorie: 'marketing', probabilite: 2, impact: 3, score: 6, niveau: 'modere', responsable: 'YG', statut: 'Atténué' },
  { id: 'R58', code: 'R58', titre: 'Turnover précoce recrues', description: "Les recrues pourraient quitter prématurément le projet.", categorie: 'rh', probabilite: 2, impact: 3, score: 6, niveau: 'modere', responsable: 'PA', statut: 'Atténué' },
  { id: 'R59', code: 'R59', titre: 'Conflits syndicaux/sociaux', description: "Des conflits sociaux pourraient perturber les opérations.", categorie: 'rh', probabilite: 2, impact: 3, score: 6, niveau: 'modere', responsable: 'PA', statut: 'Atténué' },
  { id: 'R60', code: 'R60', titre: 'Zone Expo sans événements', description: "La zone d'exposition pourrait ne pas avoir d'événements programmés.", categorie: 'commercial', probabilite: 3, impact: 2, score: 6, niveau: 'modere', responsable: 'YG', statut: 'Atténué' },
  { id: 'R61', code: 'R61', titre: 'Gestion déchets non opérationnelle', description: "Le système de gestion des déchets pourrait ne pas être opérationnel.", categorie: 'exploitation', probabilite: 2, impact: 3, score: 6, niveau: 'modere', responsable: 'DN', statut: 'Atténué' },
  { id: 'R62', code: 'R62', titre: 'Accès livraisons inadapté', description: "Les accès pour les livraisons pourraient être inadaptés.", categorie: 'exploitation', probabilite: 2, impact: 3, score: 6, niveau: 'modere', responsable: 'DN', statut: 'Atténué' },
  { id: 'R63', code: 'R63', titre: "Pas d'événement à l'ouverture", description: "Aucun événement attractif ne pourrait être organisé pour l'ouverture.", categorie: 'marketing', probabilite: 3, impact: 2, score: 6, niveau: 'modere', responsable: 'YG', statut: 'Atténué' },
  { id: 'R64', code: 'R64', titre: 'Équipements techniques insuffisants', description: "Les équipements techniques pourraient être insuffisants pour les besoins.", categorie: 'technique', probabilite: 2, impact: 3, score: 6, niveau: 'modere', responsable: 'DN', statut: 'Atténué' },
  { id: 'R65', code: 'R65', titre: 'Capacité insuffisante', description: "La capacité d'accueil pourrait être insuffisante en période de pointe.", categorie: 'exploitation', probabilite: 2, impact: 3, score: 6, niveau: 'modere', responsable: 'DN', statut: 'Atténué' },

  // ═══════════════════════════════════════════════════════════════════════════
  // FAIBLE (Score <= 4) — 3 risques
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'R66', code: 'R66', titre: 'Éclairage/ventilation défaillants', description: "L'éclairage ou la ventilation pourraient être défaillants.", categorie: 'technique', probabilite: 2, impact: 3, score: 6, niveau: 'modere', responsable: 'DN', statut: 'Atténué' },
  { id: 'R67', code: 'R67', titre: 'Parking non rentable', description: "Le parking pourrait ne pas atteindre la rentabilité prévue.", categorie: 'financier', probabilite: 2, impact: 2, score: 4, niveau: 'modere', responsable: 'PA', statut: 'Atténué' },
  { id: 'R68', code: 'R68', titre: 'Conflits entre artisans', description: "Des conflits pourraient survenir entre les artisans du marché.", categorie: 'organisationnel', probabilite: 2, impact: 2, score: 4, niveau: 'modere', responsable: 'HT', statut: 'Atténué' },
];

// ============================================================================
// SYNTHÈSE & STATISTIQUES
// ============================================================================

export const SYNTHESE_RISQUES = {
  total: 68,
  parNiveau: {
    critique: 25,
    majeur: 22,
    modere: 18,
    faible: 3,
  },
  parResponsable: {
    PA: 21,
    DN: 19,
    HT: 14,
    YG: 9,
    JA: 1,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export const getRisqueById = (id: string): RisqueCosmosAngre | undefined =>
  REGISTRE_RISQUES_COSMOS_ANGRE.find(r => r.id === id);

export const getRisquesByNiveau = (niveau: RisqueNiveau): RisqueCosmosAngre[] =>
  REGISTRE_RISQUES_COSMOS_ANGRE.filter(r => r.niveau === niveau);

export const getRisquesByCategorie = (categorie: RisqueCategory): RisqueCosmosAngre[] =>
  REGISTRE_RISQUES_COSMOS_ANGRE.filter(r => r.categorie === categorie);

export const getRisquesCritiques = (): RisqueCosmosAngre[] =>
  REGISTRE_RISQUES_COSMOS_ANGRE.filter(r => r.niveau === 'critique');

export const getTop10Risques = (): RisqueCosmosAngre[] =>
  [...REGISTRE_RISQUES_COSMOS_ANGRE]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

export const getRisquesByResponsable = (initiales: string): RisqueCosmosAngre[] =>
  REGISTRE_RISQUES_COSMOS_ANGRE.filter(r => r.responsable === initiales);
