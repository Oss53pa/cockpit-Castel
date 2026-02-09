// ============================================================================
// COSMOS ANGRÉ - RÉFÉRENTIEL UNIFIÉ COMPLET V2.0
// Données supplémentaires: Métadonnées, Phases, Vagues recrutement,
// Systèmes, Contrats, Gouvernance, Checklists, Gestion de crise, Calendrier
// ============================================================================

import { RESPONSABLES } from './cosmosAngreRef';
import type { Priorite } from '@/types';

// ============================================================================
// 1. MÉTADONNÉES PROJET
// ============================================================================
export const PROJECT_METADATA = {
  nom: 'COSMOS ANGRÉ',
  localisation: 'Angré, Cocody, Abidjan',
  proprietaire: 'New Heaven SA',
  gla: 17172, // m²
  nombreBoutiques: { min: 55, max: 60 },
  nombreBatiments: 8,
  placesParking: 523,
  emploisCrees: { directs: 1050, indirects: 2100, total: 3150 },
  investissement: '> 2 milliards FCFA',
  certification: 'EDGE Advanced (SFI/Banque Mondiale)',
  distinction: "Premier centre commercial EDGE Advanced d'Afrique de l'Ouest",
  objectifsOccupation: {
    softOpening: { date: '2026-10-16', tauxCible: 70 },
    inauguration: { date: '2026-11-15', tauxCible: 85 },
    moisPlus6: { date: '2027-06-15', tauxCible: 90 },
  },
};

// ============================================================================
// 2. BÂTIMENTS DÉTAILLÉS
// ============================================================================
export const BUILDINGS_DETAIL = [
  { code: 'CC', nom: 'Centre Commercial', surface: 10000, vocation: 'Mall principal, boutiques, Food Court', preneursTarget: '50-55 enseignes, Carrefour (ancre)' },
  { code: 'BB1', nom: 'Big Box 1', surface: 1500, vocation: 'Grande surface alimentaire', preneursTarget: 'Supermarché complémentaire' },
  { code: 'BB2', nom: 'Big Box 2', surface: 1500, vocation: 'Ameublement / Décoration', preneursTarget: 'Enseignes maison' },
  { code: 'BB3', nom: 'Big Box 3', surface: 1500, vocation: 'Électronique / High-Tech', preneursTarget: 'Enseignes tech' },
  { code: 'BB4', nom: 'Big Box 4', surface: 1500, vocation: 'Sport / Loisirs', preneursTarget: 'Enseignes sport' },
  { code: 'ZE', nom: 'Zone Expo', surface: 800, vocation: 'Événementiel, salons, expositions', preneursTarget: 'Location événementielle' },
  { code: 'MA', nom: 'Marché Artisanal', surface: 600, vocation: 'Artisanat local, produits terroir', preneursTarget: '~50 artisans sélectionnés' },
  { code: 'PK', nom: 'Parking', surface: null, vocation: 'Stationnement', preneursTarget: 'Clients, staff, livraisons', places: 523 },
];

// ============================================================================
// 3. AXES STRATÉGIQUES AVEC POIDS
// ============================================================================
export const AXES_STRATEGIQUES = [
  { code: 'axe1_rh', nom: 'RH & Organisation', poids: 20, responsable: RESPONSABLES.DGA, perimetre: 'Recrutement, formation, mobilisation équipes' },
  { code: 'axe2_commercial', nom: 'Commercialisation', poids: 25, responsable: RESPONSABLES.COMMERCIAL_MGR, perimetre: 'BEFA, occupation, mix commercial' },
  { code: 'axe3_technique', nom: 'Technique & Handover', poids: 20, responsable: RESPONSABLES.FM, perimetre: 'Réceptions, fit-out, équipements' },
  { code: 'axe4_budget', nom: 'Budget & Pilotage', poids: 15, responsable: RESPONSABLES.DGA, perimetre: 'Budget, trésorerie, reporting' },
  { code: 'axe5_marketing', nom: 'Marketing & Communication', poids: 15, responsable: RESPONSABLES.MARKETING_MGR, perimetre: 'Campagnes, événements, signalétique' },
  { code: 'axe6_exploitation', nom: 'Exploitation & Systèmes', poids: 5, responsable: RESPONSABLES.CENTER_MANAGER, perimetre: 'Procédures, contrats, systèmes' },
];

// ============================================================================
// 4. PHASES DU PROJET
// ============================================================================
export const PHASES_PROJET = [
  {
    id: 'phase1',
    nom: 'Préparation',
    periode: 'T4 2025 – T1 2026',
    dateDebut: '2025-10-01',
    dateFin: '2026-03-31',
    objectif: 'Analyse, audit, stratégie, équipe projet',
    livrables: ['Audits techniques', 'Budget consolidé', 'Plan commercialisation', 'Équipe projet constituée'],
  },
  {
    id: 'phase2',
    nom: 'Mobilisation',
    periode: 'T1 – T3 2026',
    dateDebut: '2026-01-01',
    dateFin: '2026-09-30',
    objectif: 'Recrutement, handover, commercialisation',
    livrables: ['Équipe complète', '70% BEFA signés', 'DOE réceptionné', 'Systèmes déployés'],
  },
  {
    id: 'phase3',
    nom: 'Lancement',
    periode: 'T4 2026',
    dateDebut: '2026-10-01',
    dateFin: '2026-12-31',
    objectif: 'Soft opening & inauguration',
    livrables: ['Ouverture réussie', 'Inauguration officielle'],
  },
  {
    id: 'phase4',
    nom: 'Stabilisation',
    periode: 'T4 2026 – T1 2027',
    dateDebut: '2026-10-01',
    dateFin: '2027-03-31',
    objectif: 'Optimisation & montée en puissance',
    livrables: ['90% occupation', 'KPIs cibles atteints'],
  },
];

// ============================================================================
// 5. VAGUES DE RECRUTEMENT
// ============================================================================
export const VAGUES_RECRUTEMENT = [
  {
    vague: 1,
    nom: 'Direction',
    periode: 'T1 2026 (Janvier – Mars)',
    effectif: { min: 4, max: 5 },
    postes: [
      { poste: 'Center Manager', dateEntree: '2026-02-28', priorite: 'critique' as Priorite, rattachement: RESPONSABLES.DGA },
      { poste: 'Commercial Manager', dateEntree: '2026-03-15', priorite: 'critique' as Priorite, rattachement: RESPONSABLES.DGA },
      { poste: 'Facility Manager', dateEntree: '2026-03-31', priorite: 'critique' as Priorite, rattachement: RESPONSABLES.DGA },
      { poste: 'Security Manager', dateEntree: '2026-03-31', priorite: 'critique' as Priorite, rattachement: RESPONSABLES.DGA },
      { poste: 'Marketing Manager', dateEntree: '2026-04-15', priorite: 'haute' as Priorite, rattachement: RESPONSABLES.DGA },
    ],
  },
  {
    vague: 2,
    nom: 'Encadrement',
    periode: 'T2 2026 (Avril – Juin)',
    effectif: { min: 8, max: 10 },
    postes: [
      { poste: 'Senior Maintenance Officer', dateEntree: '2026-04-30', rattachement: RESPONSABLES.FM },
      { poste: 'Security Team Lead', dateEntree: '2026-04-30', rattachement: RESPONSABLES.SECURITY_MGR },
      { poste: 'Admin & Finance Team Lead', dateEntree: '2026-05-31', rattachement: RESPONSABLES.CENTER_MANAGER },
      { poste: 'Marketing Supervisor', dateEntree: '2026-05-31', rattachement: RESPONSABLES.MARKETING_MGR },
      { poste: 'Marketing Digital Officer', dateEntree: '2026-06-30', rattachement: RESPONSABLES.MARKETING_MGR },
      { poste: 'Marketing Operational Officer', dateEntree: '2026-06-30', rattachement: RESPONSABLES.MARKETING_MGR },
      { poste: 'Commercial Officer', dateEntree: '2026-06-30', rattachement: RESPONSABLES.COMMERCIAL_MGR },
    ],
  },
  {
    vague: 3,
    nom: 'Opérationnel',
    periode: 'T3 2026 (Juillet – Septembre)',
    effectif: { min: 15, max: 20 },
    postes: [
      { poste: 'Technical Assistants', dateEntree: '2026-07-31', effectif: { min: 2, max: 3 }, rattachement: RESPONSABLES.FM },
      { poste: 'HSE/HSSE Assistant', dateEntree: '2026-07-31', effectif: 1, rattachement: RESPONSABLES.FM },
      { poste: 'Receptionist & Admin Assistant', dateEntree: '2026-08-31', effectif: 2, rattachement: RESPONSABLES.CENTER_MANAGER },
      { poste: 'Marketing Assistant', dateEntree: '2026-08-31', effectif: 1, rattachement: RESPONSABLES.MARKETING_MGR },
      { poste: 'Cleaning Supervisor', dateEntree: '2026-09-30', effectif: 1, rattachement: RESPONSABLES.FM },
      { poste: 'Parking Attendants', dateEntree: '2026-09-30', effectif: { min: 2, max: 3 }, rattachement: RESPONSABLES.FM },
    ],
  },
  {
    vague: 4,
    nom: 'Renforts',
    periode: 'T4 2026 (Octobre)',
    effectif: { min: 5, max: 10 },
    postes: [
      { poste: 'Security Officers (si interne)', dateEntree: '2026-10-31', effectif: { min: 4, max: 6 }, rattachement: RESPONSABLES.SECURITY_MGR, justification: 'Couverture 24/7' },
      { poste: 'Technical Assistants supplémentaires', dateEntree: '2026-10-31', effectif: { min: 1, max: 2 }, rattachement: RESPONSABLES.FM, justification: 'Renfort maintenance' },
      { poste: 'Customer Service Agents', dateEntree: '2026-10-31', effectif: { min: 2, max: 3 }, rattachement: RESPONSABLES.CENTER_MANAGER, justification: 'Accueil clients' },
    ],
  },
];

// ============================================================================
// 6. SYSTÈMES À DÉPLOYER
// ============================================================================
export const SYSTEMES_A_DEPLOYER = [
  { systeme: 'ERP/Logiciel de gestion', fonction: 'Comptabilité, facturation, reporting', deadline: '2026-06-30', responsable: RESPONSABLES.CENTER_MANAGER },
  { systeme: 'GMAO', fonction: 'Gestion maintenance assistée', deadline: '2026-07-31', responsable: RESPONSABLES.FM },
  { systeme: 'CRM Locataires', fonction: 'Suivi relations locataires', deadline: '2026-06-30', responsable: RESPONSABLES.COMMERCIAL_MGR },
  { systeme: 'GTC/BMS', fonction: 'Supervision technique bâtiment', deadline: '2026-09-30', responsable: RESPONSABLES.FM, note: 'Livraison chantier' },
  { systeme: 'Système parking', fonction: 'Gestion accès, paiement', deadline: '2026-09-30', responsable: RESPONSABLES.FM },
  { systeme: 'CCTV & Contrôle d\'accès', fonction: 'Sécurité', deadline: '2026-09-30', responsable: RESPONSABLES.SECURITY_MGR, note: 'Livraison chantier' },
];

// ============================================================================
// 7. PROCÉDURES D'EXPLOITATION À FORMALISER
// ============================================================================
export const PROCEDURES_EXPLOITATION = [
  { domaine: 'Gestion quotidienne', procedures: ['Ouverture/fermeture', 'Rondes', 'Permanences'], deadline: '2026-08-31' },
  { domaine: 'Maintenance', procedures: ['Préventive', 'Curative', 'Astreintes'], deadline: '2026-08-31' },
  { domaine: 'Sécurité', procedures: ['Rondes', 'Incidents', 'Évacuation', 'Intrusion'], deadline: '2026-08-31' },
  { domaine: 'Locataires', procedures: ['Demandes', 'Réclamations', 'Travaux', 'Livraisons'], deadline: '2026-09-30' },
  { domaine: 'Incidents', procedures: ['Gestion de crise', 'Escalade', 'Communication'], deadline: '2026-09-30' },
  { domaine: 'Reporting', procedures: ['Quotidien', 'Hebdomadaire', 'Mensuel'], deadline: '2026-09-30' },
];

// ============================================================================
// 8. CONTRATS D'EXPLOITATION
// ============================================================================
export const CONTRATS_EXPLOITATION = [
  { prestation: 'Sécurité/Gardiennage', mode: 'Externe', deadlineContrat: '2026-06-30', deadlineDemarrage: '2026-10-01' },
  { prestation: 'Nettoyage', mode: 'Externe', deadlineContrat: '2026-06-30', deadlineDemarrage: '2026-10-01' },
  { prestation: 'Gestion des déchets', mode: 'Externe', deadlineContrat: '2026-08-31', deadlineDemarrage: '2026-11-01' },
  { prestation: 'Espaces verts', mode: 'Externe', deadlineContrat: '2026-08-31', deadlineDemarrage: '2026-11-01' },
  { prestation: 'Maintenance ascenseurs', mode: 'Externe (fabricant)', deadlineContrat: '2026-07-31', deadlineDemarrage: 'Réception' },
  { prestation: 'Maintenance CVC', mode: 'Externe', deadlineContrat: '2026-08-31', deadlineDemarrage: '2026-11-01' },
  { prestation: 'Maintenance électrique', mode: 'Externe ou Interne', deadlineContrat: '2026-08-31', deadlineDemarrage: '2026-11-01' },
  { prestation: 'Parking (si externalisé)', mode: 'Externe', deadlineContrat: '2026-06-30', deadlineDemarrage: '2026-11-01' },
  { prestation: 'Assurances', mode: 'Externe', deadlineContrat: '2026-09-30', deadlineDemarrage: 'Réception' },
];

// ============================================================================
// 9. GOUVERNANCE - INSTANCES DE PILOTAGE
// ============================================================================
export const INSTANCES_PILOTAGE = [
  { instance: 'COPIL Projet', frequence: 'Mensuel', participants: ['DGA', 'PDG', 'Investisseurs'], objet: 'Décisions stratégiques' },
  { instance: 'EXCO', frequence: 'Mensuel', participants: ['DGA', 'Managers'], objet: 'Revue détaillée par axe' },
  { instance: 'Réunion projet', frequence: 'Hebdomadaire', participants: ['DGA', 'Managers'], objet: 'Suivi avancement' },
  { instance: 'Point chantier', frequence: 'Hebdomadaire', participants: ['DGA', 'FM', 'Constructeur'], objet: 'Travaux, réserves' },
  { instance: 'Point commercialisation', frequence: 'Hebdomadaire', participants: ['DGA', 'Commercial'], objet: 'Pipeline, négociations' },
];

// ============================================================================
// 10. STRUCTURE DE REPORTING
// ============================================================================
export const STRUCTURE_REPORTING = [
  { rapport: 'Flash projet', frequence: 'Hebdomadaire', destinataires: ['PDG'], responsable: RESPONSABLES.DGA },
  { rapport: 'Dashboard opérationnel', frequence: 'Hebdomadaire', destinataires: ['Direction'], responsable: RESPONSABLES.CENTER_MANAGER },
  { rapport: 'Rapport de gestion', frequence: 'Mensuel', destinataires: ['Investisseurs'], responsable: RESPONSABLES.CENTER_MANAGER },
  { rapport: 'Analyse marketing', frequence: 'Mensuel', destinataires: ['Direction'], responsable: RESPONSABLES.MARKETING_MGR },
  { rapport: 'Revue commerciale', frequence: 'Mensuel', destinataires: ['Direction'], responsable: RESPONSABLES.COMMERCIAL_MGR },
  { rapport: 'Rapport technique', frequence: 'Mensuel', destinataires: ['Direction'], responsable: RESPONSABLES.FM },
  { rapport: 'Rapport consolidé', frequence: 'Trimestriel', destinataires: ['Conseil d\'administration'], responsable: RESPONSABLES.DGA },
];

// ============================================================================
// 11. HANDOVER - PHASES
// ============================================================================
export const HANDOVER_PHASES = [
  {
    phase: 'A',
    nom: 'Pré-handover',
    periode: 'Avril – Juin 2026',
    equipe: ['DGA', 'Center Manager', 'Facility Manager', 'Senior Maintenance Officer'],
    activites: [
      { activite: 'Réunions de chantier', frequence: 'Hebdomadaire', objectif: 'Suivi avancement, anticipation' },
      { activite: 'Revue des plans d\'exécution', frequence: 'Continue', objectif: 'Validation technique' },
      { activite: 'Préparation liste DOE', frequence: 'Continue', objectif: 'Checklist documents à recevoir' },
      { activite: 'Identification besoins formation', frequence: 'Ponctuel', objectif: 'Planning formations fournisseurs' },
    ],
  },
  {
    phase: 'B',
    nom: 'Handover opérationnel',
    periode: 'Juillet – Septembre 2026',
    activites: ['Tests et réceptions techniques', 'Programme de formations', 'Gestion des réserves'],
  },
  {
    phase: 'C',
    nom: 'Handover final',
    periode: 'Octobre 2026',
    actions: [
      { action: 'Levée réserves bloquantes', deadline: '2026-10-31', responsable: 'Chef projet construction' },
      { action: 'Essais en conditions réelles', deadline: '2026-10-15', responsable: RESPONSABLES.FM },
      { action: 'Test parcours client complet', deadline: '2026-10-31', responsable: 'Équipe exploitation' },
      { action: 'Formation équipe complète', deadline: '2026-10-31', responsable: 'Tous managers' },
      { action: 'Signature PV de réception', deadline: '2026-10-31', responsable: 'Direction + Construction' },
      { action: 'Remise des clés et codes', deadline: '2026-10-31', responsable: 'Chef projet construction' },
    ],
  },
];

// ============================================================================
// 12. TESTS ET RÉCEPTIONS TECHNIQUES
// ============================================================================
export const TESTS_RECEPTIONS = [
  { systeme: 'SSI (incendie)', responsable: 'Bureau de contrôle', criteres: 'PV conforme, test complet', deadline: '2026-08-31' },
  { systeme: 'Sprinklers', responsable: 'Installateur + BC', criteres: 'Test pression réussi', deadline: '2026-08-31' },
  { systeme: 'Électricité HT/BT', responsable: 'CONSUEL + BC', criteres: 'Certificat obtenu', deadline: '2026-08-31' },
  { systeme: 'CVC/HVAC', responsable: 'Installateur', criteres: 'Températures et débits conformes', deadline: '2026-08-31' },
  { systeme: 'Ascenseurs', responsable: 'Organisme agréé', criteres: 'Certification CE', deadline: '2026-09-30' },
  { systeme: 'Escalators', responsable: 'Organisme agréé', criteres: 'Certification CE', deadline: '2026-09-30' },
  { systeme: 'CCTV', responsable: 'Intégrateur', criteres: 'Couverture 100%, stockage OK', deadline: '2026-09-30' },
  { systeme: 'Contrôle d\'accès', responsable: 'Intégrateur', criteres: 'Tous accès fonctionnels', deadline: '2026-09-30' },
  { systeme: 'GTC/BMS', responsable: 'Intégrateur', criteres: 'Supervision opérationnelle', deadline: '2026-09-30' },
  { systeme: 'Groupes électrogènes', responsable: 'Installateur', criteres: 'Test en charge réelle', deadline: '2026-09-30' },
  { systeme: 'Parking (barrières, paiement)', responsable: 'Installateur', criteres: 'Circuit complet fonctionnel', deadline: '2026-09-30' },
];

// ============================================================================
// 13. PROGRAMME DE FORMATIONS
// ============================================================================
export const PROGRAMME_FORMATIONS = [
  { formation: 'GTC/BMS', public: 'Équipe maintenance', duree: '3 jours', formateur: 'Intégrateur', periode: '2026-08' },
  { formation: 'Systèmes CVC', public: 'Techniciens', duree: '2 jours', formateur: 'Installateur', periode: '2026-08' },
  { formation: 'SSI & procédures incendie', public: 'Tous', duree: '1 jour', formateur: 'Bureau sécurité', periode: '2026-08' },
  { formation: 'Ascenseurs/Escalators', public: 'Maintenance + Sécurité', duree: '1 jour', formateur: 'Fabricant', periode: '2026-09' },
  { formation: 'CCTV & contrôle d\'accès', public: 'Sécurité', duree: '2 jours', formateur: 'Intégrateur', periode: '2026-09' },
  { formation: 'ERP/GMAO', public: 'Utilisateurs concernés', duree: '2 jours', formateur: 'Éditeur', periode: '2026-09' },
];

// ============================================================================
// 14. GESTION DES RÉSERVES
// ============================================================================
export const CLASSIFICATION_RESERVES = [
  { classification: 'Bloquante', couleur: 'rouge', definition: 'Empêche l\'ouverture ou met en danger', objectifLevee: '100% avant soft opening' },
  { classification: 'Majeure', couleur: 'orange', definition: 'Impact significatif sur l\'exploitation', objectifLevee: '90% avant soft opening' },
  { classification: 'Mineure', couleur: 'jaune', definition: 'Confort, esthétique', objectifLevee: '80% sous 3 mois post-ouverture' },
];

// ============================================================================
// 15. SOFT OPENING - SUIVI INTENSIF
// ============================================================================
export const SUIVI_SOFT_OPENING = {
  principe: 'Ouverture au public avec communication limitée pour tester les opérations en conditions réelles',
  communication: 'Limitée aux réseaux sociaux, pas de campagne média',
  indicateurs: [
    { indicateur: 'Fréquentation', frequence: 'Quotidien', responsable: RESPONSABLES.MARKETING_MGR },
    { indicateur: 'Incidents techniques', frequence: 'Quotidien', responsable: RESPONSABLES.FM },
    { indicateur: 'Incidents sécurité', frequence: 'Quotidien', responsable: RESPONSABLES.SECURITY_MGR },
    { indicateur: 'Retours clients', frequence: 'Quotidien', responsable: RESPONSABLES.CENTER_MANAGER },
    { indicateur: 'Performance locataires', frequence: 'Hebdomadaire', responsable: RESPONSABLES.COMMERCIAL_MGR },
  ],
  reunions: [
    { type: 'Débriefing quotidien', frequence: 'J+1 à J+14', participants: 'Tous managers' },
    { type: 'Point hebdomadaire', frequence: 'Semaines 2-4', participants: 'Tous managers + Direction' },
    { type: 'Comité de pilotage', frequence: 'Bi-mensuel', participants: 'Direction + Investisseurs' },
  ],
};

// ============================================================================
// 16. INAUGURATION - PROGRAMME TYPE
// ============================================================================
export const PROGRAMME_INAUGURATION = {
  date: '2026-11-15',
  programme: [
    { horaire: '10h00', evenement: 'Accueil VIP, café', public: 'Invités' },
    { horaire: '10h30', evenement: 'Visite guidée', public: 'VIP' },
    { horaire: '11h30', evenement: 'Cérémonie officielle, discours', public: 'Tous' },
    { horaire: '12h00', evenement: 'Cocktail déjeunatoire', public: 'VIP' },
    { horaire: '12h00', evenement: 'Ouverture animations publiques', public: 'Grand public' },
    { horaire: '14h-20h', evenement: 'Animations, spectacles, promotions', public: 'Grand public' },
  ],
  invites: [
    { categorie: 'Autorités', exemples: 'Maire Cocody, Préfet, Ministres, Élus' },
    { categorie: 'Investisseurs', exemples: 'New Heaven SA, partenaires' },
    { categorie: 'Partenaires', exemples: 'Banques, prestataires clés' },
    { categorie: 'Enseignes', exemples: 'Directeurs boutiques (Carrefour, etc.)' },
    { categorie: 'Médias', exemples: 'Presse locale, TV, radio, influenceurs' },
    { categorie: 'Communauté', exemples: 'Associations locales, leaders d\'opinion' },
  ],
};

// ============================================================================
// 17. KPIs POST-OUVERTURE
// ============================================================================
export const KPIS_POST_OUVERTURE = [
  { kpi: 'Fréquentation', cibleM1: 'Baseline', cibleM3: '+10%', cibleM6: '+20%', frequence: 'Quotidien' },
  { kpi: 'Taux d\'occupation', cibleM1: '70%', cibleM3: '80%', cibleM6: '90%', frequence: 'Mensuel' },
  { kpi: 'Satisfaction client', cibleM1: '>3.5/5', cibleM3: '>4/5', cibleM6: '>4.2/5', frequence: 'Mensuel' },
  { kpi: 'Taux d\'incidents', cibleM1: 'Baseline', cibleM3: '-20%', cibleM6: '-40%', frequence: 'Hebdomadaire' },
  { kpi: 'NPS locataires', cibleM1: 'Baseline', cibleM3: '+5pts', cibleM6: '+10pts', frequence: 'Trimestriel' },
];

// ============================================================================
// 18. CALENDRIER D'ANIMATIONS POST-OUVERTURE
// ============================================================================
export const CALENDRIER_ANIMATIONS = [
  { mois: 'Décembre 2026', evenement: 'Animations Noël, Père Noël', objectif: 'Capitaliser sur la période' },
  { mois: 'Janvier 2027', evenement: 'Soldes, jeux concours', objectif: 'Maintenir le trafic' },
  { mois: 'Février 2027', evenement: 'Saint-Valentin, kids corner', objectif: 'Diversifier cibles' },
  { mois: 'Mars 2027', evenement: 'Fête des mères, printemps', objectif: 'Renouveler intérêt' },
  { mois: 'Avril 2027', evenement: 'Animations Pâques', objectif: 'Familles' },
  { mois: 'Mai 2027', evenement: 'Anniversaire 6 mois', objectif: 'Bilan, fidélisation' },
];

// ============================================================================
// 19. GESTION DE CRISE
// ============================================================================
export const TYPES_CRISES = [
  { type: 'Technique', exemples: 'Panne électrique, incendie, effondrement', niveau: 'majeur' },
  { type: 'Sécurité', exemples: 'Agression, vol, intrusion, manifestation', niveau: 'majeur' },
  { type: 'Sanitaire', exemples: 'Intoxication, épidémie, accident', niveau: 'majeur' },
  { type: 'Commercial', exemples: 'Faillite locataire majeur, grève', niveau: 'modere' },
  { type: 'Médiatique', exemples: 'Bad buzz, plainte client virale', niveau: 'modere' },
  { type: 'Naturel', exemples: 'Inondation, tempête', niveau: 'majeur' },
];

export const CELLULE_CRISE = [
  { role: 'Directeur de crise', titulaire: RESPONSABLES.DGA, suppleant: RESPONSABLES.CENTER_MANAGER },
  { role: 'Coordination opérationnelle', titulaire: RESPONSABLES.CENTER_MANAGER, suppleant: RESPONSABLES.FM },
  { role: 'Porte-parole', titulaire: RESPONSABLES.DGA, suppleant: RESPONSABLES.MARKETING_MGR },
  { role: 'Communication', titulaire: RESPONSABLES.MARKETING_MGR, suppleant: 'Digital Officer' },
  { role: 'Sécurité', titulaire: RESPONSABLES.SECURITY_MGR, suppleant: 'Security Team Lead' },
  { role: 'Technique', titulaire: RESPONSABLES.FM, suppleant: 'Senior Maintenance' },
];

export const CONTACTS_URGENCE = [
  { service: 'Pompiers', numero: '180 / 118' },
  { service: 'Police', numero: '170 / 111' },
  { service: 'SAMU', numero: '185' },
  { service: 'CIE (électricité)', numero: 'À définir' },
  { service: 'SODECI (eau)', numero: 'À définir' },
];

export const NIVEAUX_ESCALADE = [
  { niveau: 1, description: 'Incident mineur', actions: ['Traitement par équipe sur site', 'Information N+1'] },
  { niveau: 2, description: 'Incident modéré', actions: ['Mobilisation manager concerné', 'Information Center Manager + DGA', 'Décision action corrective'] },
  { niveau: 3, description: 'Crise majeure', actions: ['Activation cellule de crise', 'Information PDG + Investisseurs', 'Communication externe si nécessaire'] },
];

// ============================================================================
// 20. CHECKLIST DOE (Dossier des Ouvrages Exécutés)
// ============================================================================
export const CHECKLIST_DOE = [
  { categorie: 'Architecture', documents: ['Plans as-built architecture', 'Plans as-built structure', 'Plans as-built façades'] },
  { categorie: 'Électricité', documents: ['Schémas unifilaires HT/BT', 'Plans d\'implantation', 'Certificat CONSUEL', 'Notes de calcul'] },
  { categorie: 'CVC', documents: ['Plans réseaux climatisation', 'Plans réseaux ventilation', 'Notices d\'exploitation', 'PV d\'essais et équilibrage'] },
  { categorie: 'Plomberie', documents: ['Plans réseaux EU/EV/EP', 'Plans réseaux eau froide/chaude'] },
  { categorie: 'Sécurité incendie', documents: ['Dossier SSI complet', 'Plans de zonage', 'PV de réception SSI', 'Plans d\'évacuation', 'Certificat sprinklers'] },
  { categorie: 'Ascenseurs/Escalators', documents: ['Certificats CE', 'Notices d\'utilisation', 'Contrats maintenance'] },
  { categorie: 'GTC/BMS', documents: ['Manuels d\'utilisation', 'Schémas d\'architecture', 'Codes d\'accès et licences'] },
  { categorie: 'Sécurité', documents: ['Plans CCTV', 'Plans contrôle d\'accès', 'Manuels d\'utilisation'] },
  { categorie: 'Groupe électrogène', documents: ['Notice d\'exploitation', 'PV d\'essais en charge'] },
  { categorie: 'Parking', documents: ['Plans système parking', 'Manuels barrières/caisses'] },
  { categorie: 'Garanties', documents: ['Attestations décennales', 'Garanties équipements', 'Contrats SAV'] },
];

// ============================================================================
// 21. CHECKLISTS PRÉ-OUVERTURE PAR DOMAINE
// ============================================================================
export const CHECKLIST_PRE_OUVERTURE = {
  technique: [
    { item: 'Électricité HT/BT opérationnelle', responsable: RESPONSABLES.FM },
    { item: 'Groupe électrogène testé en charge', responsable: RESPONSABLES.FM },
    { item: 'Climatisation opérationnelle tous bâtiments', responsable: RESPONSABLES.FM },
    { item: 'SSI complet et testé', responsable: RESPONSABLES.FM },
    { item: 'Sprinklers testés', responsable: RESPONSABLES.FM },
    { item: 'Ascenseurs certifiés et opérationnels', responsable: RESPONSABLES.FM },
    { item: 'Escalators certifiés et opérationnels', responsable: RESPONSABLES.FM },
    { item: 'GTC/BMS opérationnel', responsable: RESPONSABLES.FM },
    { item: 'Éclairage communs opérationnel', responsable: RESPONSABLES.FM },
    { item: 'Sanitaires opérationnels', responsable: RESPONSABLES.FM },
    { item: 'Parking système opérationnel', responsable: RESPONSABLES.FM },
    { item: 'Réserves bloquantes levées 100%', responsable: RESPONSABLES.FM },
  ],
  securite: [
    { item: 'CCTV opérationnel couverture 100%', responsable: RESPONSABLES.SECURITY_MGR },
    { item: 'Contrôle d\'accès opérationnel', responsable: RESPONSABLES.SECURITY_MGR },
    { item: 'PC sécurité équipé et opérationnel', responsable: RESPONSABLES.SECURITY_MGR },
    { item: 'Équipe sécurité recrutée et formée', responsable: RESPONSABLES.SECURITY_MGR },
    { item: 'Procédures d\'urgence validées', responsable: RESPONSABLES.SECURITY_MGR },
    { item: 'Exercice évacuation réalisé', responsable: RESPONSABLES.SECURITY_MGR },
    { item: 'Plan de sécurité validé', responsable: RESPONSABLES.SECURITY_MGR },
    { item: 'Commission sécurité - avis favorable', responsable: RESPONSABLES.DGA },
  ],
  commercial: [
    { item: '70% locataires BEFA signés', responsable: RESPONSABLES.COMMERCIAL_MGR },
    { item: '70% locataires prêts à ouvrir', responsable: RESPONSABLES.COMMERCIAL_MGR },
    { item: 'Carrefour prêt à ouvrir', responsable: RESPONSABLES.COMMERCIAL_MGR },
    { item: 'Big Box prêts à ouvrir', responsable: RESPONSABLES.COMMERCIAL_MGR },
    { item: 'Food court complet', responsable: RESPONSABLES.COMMERCIAL_MGR },
    { item: 'Marché artisanal prêt', responsable: RESPONSABLES.COMMERCIAL_MGR },
  ],
  marketing: [
    { item: 'Campagne teasing terminée', responsable: RESPONSABLES.MARKETING_MGR },
    { item: 'Campagne lancement lancée', responsable: RESPONSABLES.MARKETING_MGR },
    { item: 'Signalétique extérieure installée', responsable: RESPONSABLES.MARKETING_MGR },
    { item: 'Signalétique intérieure installée', responsable: RESPONSABLES.MARKETING_MGR },
    { item: 'Site web opérationnel', responsable: RESPONSABLES.MARKETING_MGR },
    { item: 'Réseaux sociaux actifs', responsable: RESPONSABLES.MARKETING_MGR },
    { item: 'Dossiers presse prêts', responsable: RESPONSABLES.MARKETING_MGR },
    { item: 'Inauguration planifiée', responsable: RESPONSABLES.MARKETING_MGR },
  ],
  rh: [
    { item: 'Équipe managériale complète', responsable: RESPONSABLES.DGA },
    { item: 'Équipe opérationnelle complète', responsable: RESPONSABLES.CENTER_MANAGER },
    { item: 'Toutes formations réalisées', responsable: RESPONSABLES.CENTER_MANAGER },
    { item: 'Planning équipes ouverture validé', responsable: RESPONSABLES.CENTER_MANAGER },
    { item: 'Uniformes/badges distribués', responsable: RESPONSABLES.CENTER_MANAGER },
  ],
  administratif: [
    { item: 'Toutes autorisations obtenues', responsable: RESPONSABLES.CENTER_MANAGER },
    { item: 'Assurances actives', responsable: RESPONSABLES.CENTER_MANAGER },
    { item: 'Contrats prestataires signés', responsable: RESPONSABLES.CENTER_MANAGER },
    { item: 'ERP/Logiciel gestion opérationnel', responsable: RESPONSABLES.CENTER_MANAGER },
    { item: 'Système de caisse opérationnel', responsable: RESPONSABLES.CENTER_MANAGER },
  ],
  proprete: [
    { item: 'Nettoyage complet réalisé', responsable: RESPONSABLES.FM },
    { item: 'Mobilier installé', responsable: RESPONSABLES.FM },
    { item: 'Plantes/décoration installées', responsable: RESPONSABLES.FM },
    { item: 'Poubelles installées', responsable: RESPONSABLES.FM },
  ],
};

// ============================================================================
// 22. SIMULATIONS PRÉ-OUVERTURE
// ============================================================================
export const SIMULATIONS_PRE_OUVERTURE = [
  { simulation: 'Exercice d\'évacuation', date: 'Mi-octobre', participants: 'Tous + locataires', objectif: 'Valider procédures' },
  { simulation: 'Dry run ouverture', date: 'Fin octobre', participants: 'Équipe complète', objectif: 'Tester parcours client' },
  { simulation: 'Simulation incident', date: 'Fin octobre', participants: 'Sécurité/maintenance', objectif: 'Tester réactivité' },
  { simulation: 'Test jour J', date: 'J-3', participants: 'Équipe complète', objectif: 'Répétition générale' },
];

// ============================================================================
// 23. CALENDRIER SYNTHÉTIQUE 2026
// ============================================================================
export const CALENDRIER_2026 = {
  janvier: [
    { date: '07/01', action: 'Présentation bassin rétention finalisée' },
    { date: '15/01', action: 'Draft contrat affichage envoyé' },
    { date: '20/01', action: 'Draft vidéo bassin soumis' },
    { date: '30/01', action: 'Vidéo bassin finale + dossier complet' },
    { date: '31/01', action: 'Organigramme cible validé' },
  ],
  fevrier: [
    { date: '09/02', action: 'KICK-OFF PROJET', critique: true },
    { date: '15/02', action: 'Budget consolidé validé' },
    { date: '15/02', action: '25% BEFA signés (Vague 1)' },
    { date: '28/02', action: 'Plan commercialisation finalisé' },
    { date: '28/02', action: 'Center Manager recruté' },
    { date: '28/02', action: 'Mission Yvan finalisée' },
  ],
  mars: [
    { date: '15/03', action: 'Commercial Manager recruté' },
    { date: '15/03', action: 'Stratégie communication validée' },
    { date: '15/03', action: '25% BEFA supplémentaires (Vague 2)' },
    { date: '31/03', action: 'CARREFOUR SIGNÉ', critique: true },
    { date: '31/03', action: 'FM + Security Manager recrutés' },
    { date: '31/03', action: 'Identité visuelle finalisée' },
  ],
  avril: [
    { date: '15/04', action: 'Marketing Manager recruté' },
    { date: '15/04', action: '25% BEFA supplémentaires (Vague 3)' },
    { date: '15/04', action: 'Revue budgétaire T1' },
    { date: '30/04', action: 'Réception gros œuvre complet' },
    { date: '30/04', action: 'Site web + réseaux sociaux actifs' },
  ],
  mai: [
    { date: 'Mai', action: 'Recrutement encadrement (Vague 2)' },
    { date: 'Mai', action: '50% preneurs - Plans validés' },
    { date: 'Mai', action: 'Démarrage fit-out premiers preneurs' },
  ],
  juin: [
    { date: '30/06', action: 'Réception second œuvre Centre Commercial' },
    { date: '30/06', action: 'Mise en service électricité' },
    { date: '30/06', action: 'Livraison local Carrefour' },
    { date: '30/06', action: '50% occupation atteinte' },
    { date: '30/06', action: 'Contrats sécurité + nettoyage signés' },
    { date: '30/06', action: '100% BEFA signés (Vague 4)' },
  ],
  juillet: [
    { date: '15/07', action: 'Revue budgétaire T2' },
    { date: '31/07', action: 'Réception Big Box 1-2' },
    { date: '31/07', action: 'Procédures exploitation rédigées' },
    { date: 'Juillet', action: 'Recrutement opérationnel (Vague 3)' },
  ],
  aout: [
    { date: '31/08', action: 'Réception Big Box 3-4 + Parking' },
    { date: '31/08', action: 'Mise en service climatisation' },
    { date: '31/08', action: 'Mise en service système parking' },
    { date: 'Août', action: 'Formations techniques (GTC, CVC, SSI)' },
  ],
  septembre: [
    { date: '01/09', action: 'CAMPAGNE TEASING LANCÉE', critique: true },
    { date: '15/09', action: 'OPR Centre Commercial' },
    { date: '15/09', action: 'Mise en service SSI' },
    { date: '30/09', action: '75% occupation atteinte' },
    { date: '30/09', action: 'Réception Zone Expo + Marché' },
    { date: '30/09', action: 'Logiciel gestion paramétré' },
  ],
  octobre: [
    { date: '15/10', action: 'OPR tous bâtiments' },
    { date: '15/10', action: 'Revue budgétaire T3' },
    { date: '31/10', action: 'Levée réserves ≥80%' },
    { date: '31/10', action: 'Fit-out Carrefour terminé' },
    { date: '31/10', action: '100% fit-out preneurs terminé' },
    { date: '31/10', action: 'Tests intégration systèmes' },
    { date: '31/10', action: 'Formation équipes complète' },
    { date: 'Octobre', action: 'Recrutement renforts (Vague 4)' },
    { date: 'Octobre', action: 'Simulations pré-ouverture' },
  ],
  novembre: [
    { date: '01/11', action: 'Signalétique extérieure installée' },
    { date: '01/11', action: 'Campagne lancement lancée' },
    { date: '01/11', action: 'Équipe opérationnelle mobilisée' },
    { date: '10/11', action: 'Événement presse' },
    { date: '10/11', action: 'Signalétique intérieure installée' },
    { date: '10/11', action: 'Test exploitation grandeur nature' },
    { date: '10/11', action: 'COMMISSION SÉCURITÉ - AVIS FAVORABLE', critique: true },
    { date: '15/11', action: 'SOFT OPENING', critique: true },
    { date: '30/11', action: 'Levée réserves ≥95%' },
    { date: '30/11', action: 'Budget exploitation 2027 validé' },
  ],
  decembre: [
    { date: '15/12', action: 'INAUGURATION OFFICIELLE', critique: true },
    { date: 'Décembre', action: 'Animations Noël' },
    { date: 'Décembre', action: 'Stabilisation opérations' },
  ],
};

// ============================================================================
// 24. ACTIONS SUPPLÉMENTAIRES AXE 1 (A1-014 à A1-029)
// ============================================================================
export const ACTIONS_AXE1_SUPPLEMENTAIRES = [
  { id: 'A1-014', titre: 'Recruter HSE Assistant', dateDebut: '2026-07-01', dateFin: '2026-07-31', responsable: RESPONSABLES.FM, priorite: 'haute' as Priorite },
  { id: 'A1-015', titre: 'Recruter Admin Assistants (2)', dateDebut: '2026-08-01', dateFin: '2026-08-31', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'moyenne' as Priorite },
  { id: 'A1-016', titre: 'Recruter Marketing Assistant', dateDebut: '2026-08-01', dateFin: '2026-08-31', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'moyenne' as Priorite },
  { id: 'A1-017', titre: 'Recruter Cleaning Supervisor', dateDebut: '2026-09-01', dateFin: '2026-09-30', responsable: RESPONSABLES.FM, priorite: 'haute' as Priorite },
  { id: 'A1-018', titre: 'Recruter Parking Attendants (2-3)', dateDebut: '2026-09-01', dateFin: '2026-09-30', responsable: RESPONSABLES.FM, priorite: 'haute' as Priorite },
  { id: 'A1-019', titre: 'Recruter Security Officers (4-6)', dateDebut: '2026-10-01', dateFin: '2026-10-31', responsable: RESPONSABLES.SECURITY_MGR, priorite: 'haute' as Priorite },
  { id: 'A1-020', titre: 'Recruter Customer Service Agents (2-3)', dateDebut: '2026-10-01', dateFin: '2026-10-31', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'haute' as Priorite },
  { id: 'A1-021', titre: 'Définir plan de formation global', dateDebut: '2026-04-01', dateFin: '2026-04-30', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'haute' as Priorite },
  { id: 'A1-022', titre: 'Organiser formation GTC/BMS', dateDebut: '2026-08-01', dateFin: '2026-08-15', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A1-023', titre: 'Organiser formation CVC', dateDebut: '2026-08-15', dateFin: '2026-08-31', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A1-024', titre: 'Organiser formation SSI', dateDebut: '2026-08-15', dateFin: '2026-08-31', responsable: RESPONSABLES.SECURITY_MGR, priorite: 'critique' as Priorite },
  { id: 'A1-025', titre: 'Organiser formation ascenseurs', dateDebut: '2026-09-01', dateFin: '2026-09-15', responsable: RESPONSABLES.FM, priorite: 'critique' as Priorite },
  { id: 'A1-026', titre: 'Organiser formation CCTV/contrôle accès', dateDebut: '2026-09-01', dateFin: '2026-09-15', responsable: RESPONSABLES.SECURITY_MGR, priorite: 'critique' as Priorite },
  { id: 'A1-027', titre: 'Organiser formation ERP/GMAO', dateDebut: '2026-09-15', dateFin: '2026-09-30', responsable: RESPONSABLES.IT, priorite: 'critique' as Priorite },
  { id: 'A1-028', titre: 'Finaliser planning équipes ouverture', dateDebut: '2026-10-15', dateFin: '2026-10-31', responsable: RESPONSABLES.CENTER_MANAGER, priorite: 'critique' as Priorite },
  { id: 'A1-029', titre: 'Organiser team building pré-ouverture', dateDebut: '2026-11-01', dateFin: '2026-11-10', responsable: RESPONSABLES.MARKETING_MGR, priorite: 'moyenne' as Priorite },
];

// ============================================================================
// 25. JALONS CRITIQUES CHEMIN CRITIQUE (Section 8.1)
// ============================================================================
export const JALONS_CRITIQUES_CHEMIN_CRITIQUE = [
  { rang: 1, id: 'J-001', jalon: 'Kick-off projet', date: '2026-02-09', axe: 'Tous', criticite: 'critique' },
  { rang: 2, id: 'J4-001', jalon: 'Budget consolidé validé', date: '2026-02-15', axe: 'AXE 4', criticite: 'critique' },
  { rang: 3, id: 'J2-003', jalon: '25% BEFA signés', date: '2026-02-15', axe: 'AXE 2', criticite: 'critique' },
  { rang: 4, id: 'J2-001', jalon: 'Plan commercialisation finalisé', date: '2026-02-28', axe: 'AXE 2', criticite: 'critique' },
  { rang: 5, id: 'J1-002', jalon: 'Center Manager recruté', date: '2026-02-28', axe: 'AXE 1', criticite: 'critique' },
  { rang: 6, id: 'J2-006', jalon: 'Carrefour signé', date: '2026-03-31', axe: 'AXE 2', criticite: 'critique' },
  { rang: 7, id: 'J1-MGMT', jalon: 'Équipe managériale complète', date: '2026-03-31', axe: 'AXE 1', criticite: 'critique' },
  { rang: 8, id: 'J2-004', jalon: '50% BEFA signés', date: '2026-04-15', axe: 'AXE 2', criticite: 'critique' },
  { rang: 9, id: 'J3-001', jalon: 'Réception gros œuvre', date: '2026-04-30', axe: 'AXE 3', criticite: 'critique' },
  { rang: 10, id: 'J5-WEB', jalon: 'Site web + réseaux sociaux actifs', date: '2026-04-30', axe: 'AXE 5', criticite: 'haute' },
  { rang: 11, id: 'J3-FO-007', jalon: 'Livraison local Carrefour', date: '2026-06-30', axe: 'AXE 3', criticite: 'critique' },
  { rang: 12, id: 'J3-EQ-001', jalon: 'Mise en service électricité', date: '2026-06-30', axe: 'AXE 3', criticite: 'critique' },
  { rang: 13, id: 'J2-007', jalon: '50% occupation atteinte', date: '2026-06-30', axe: 'AXE 2', criticite: 'critique' },
  { rang: 14, id: 'J6-CONTRATS', jalon: 'Contrats sécurité + nettoyage signés', date: '2026-06-30', axe: 'AXE 6', criticite: 'critique' },
  { rang: 15, id: 'J3-002', jalon: 'Réception second œuvre Centre Commercial', date: '2026-06-30', axe: 'AXE 3', criticite: 'critique' },
  { rang: 16, id: 'J6-001', jalon: 'Procédures exploitation rédigées', date: '2026-07-31', axe: 'AXE 6', criticite: 'critique' },
  { rang: 17, id: 'J3-BB-PK', jalon: 'Réception Big Box + Parking', date: '2026-08-31', axe: 'AXE 3', criticite: 'critique' },
  { rang: 18, id: 'J3-EQ-003', jalon: 'Mise en service climatisation', date: '2026-08-31', axe: 'AXE 3', criticite: 'critique' },
  { rang: 19, id: 'J5-005', jalon: 'Campagne teasing lancée', date: '2026-09-01', axe: 'AXE 5', criticite: 'critique' },
  { rang: 20, id: 'J3-008', jalon: 'OPR Centre Commercial', date: '2026-09-15', axe: 'AXE 3', criticite: 'critique' },
  { rang: 21, id: 'J3-EQ-004', jalon: 'Mise en service SSI', date: '2026-09-15', axe: 'AXE 3', criticite: 'critique' },
  { rang: 22, id: 'J2-008', jalon: '75% occupation atteinte', date: '2026-09-30', axe: 'AXE 2', criticite: 'critique' },
  { rang: 23, id: 'J6-007', jalon: 'Logiciel gestion paramétré', date: '2026-09-30', axe: 'AXE 6', criticite: 'critique' },
  { rang: 24, id: 'J3-009', jalon: 'OPR tous bâtiments', date: '2026-10-15', axe: 'AXE 3', criticite: 'critique' },
  { rang: 25, id: 'J3-010', jalon: 'Levée réserves ≥80%', date: '2026-10-31', axe: 'AXE 3', criticite: 'critique' },
  { rang: 26, id: 'J3-FO-006', jalon: 'Fit-out preneurs terminé', date: '2026-10-31', axe: 'AXE 3', criticite: 'critique' },
  { rang: 27, id: 'J1-009', jalon: 'Formation équipes complète', date: '2026-10-31', axe: 'AXE 1', criticite: 'critique' },
  { rang: 28, id: 'J3-EQ-009', jalon: 'Tests intégration systèmes', date: '2026-10-31', axe: 'AXE 3', criticite: 'critique' },
  { rang: 29, id: 'J5-009', jalon: 'Signalétique installée', date: '2026-11-10', axe: 'AXE 5', criticite: 'critique' },
  { rang: 30, id: 'J6-011', jalon: 'Commission sécurité favorable', date: '2026-11-10', axe: 'AXE 6', criticite: 'critique' },
  { rang: 31, id: 'J-006', jalon: 'SOFT OPENING', date: '2026-10-16', axe: 'Tous', criticite: 'critique' },
  { rang: 32, id: 'J3-011', jalon: 'Levée réserves ≥95%', date: '2026-11-30', axe: 'AXE 3', criticite: 'critique' },
  { rang: 33, id: 'J4-007', jalon: 'Budget exploitation 2027 validé', date: '2026-11-30', axe: 'AXE 4', criticite: 'critique' },
  { rang: 34, id: 'J-007', jalon: 'INAUGURATION OFFICIELLE', date: '2026-11-15', axe: 'Tous', criticite: 'critique' },
];

// ============================================================================
// 26. COMPTEURS SYNTHÈSE
// ============================================================================
export const COMPTEURS_SYNTHESE = {
  jalonsTotal: 120,
  actionsTotal: 180,
  risquesIdentifies: 70,
  risquesCritiques: 15,
  batimentsCouverts: 8,
  axesStrategiques: 6,
  phasesProjet: 4,
  vaguesRecrutement: 4,
  effectifCible: { min: 35, max: 45 },
};
