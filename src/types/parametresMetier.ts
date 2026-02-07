// ============================================================================
// TYPES PARAMÈTRES MÉTIER — Directive CRMC Règle 1
// Types pour les paramètres externalisés en DB (table secureConfigs)
// ============================================================================

/** Sources de seuils de risques */
export interface SeuilsRisques {
  critique: number;
  majeur: number;
  modere: number;
}

/** Seuils chemin critique */
export interface SeuilsCheminCritique {
  margeCritique: number;
  margeFaible: number;
  seuilGoulot: number;
  topActions: number;
}

/** Seuils santé axe — AxisExco */
export interface SeuilsSanteAxe {
  poids: { avancement: number; actions: number; risques: number };
  penalites: { actionEnRetard: number; actionBloquee: number; risqueCritique: number };
  meteo: {
    pluie: { score: number; actionsEnRetard: number; risquesCritiques: number };
    nuage: { score: number; actionsEnRetard: number; risquesCritiques: number };
    soleilNuage: { score: number; actionsEnRetard: number; risquesCritiques: number };
  };
  velocite: { up: number; stable: number };
  jalons: { enDanger: number; enApproche: number };
  recommandations: {
    actionsEnRetardCritique: number;
    completionFaible: number;
    jalonsProches: number;
    risquesSansPlanMax: number;
    ecartCritique: number;
    ecartAttention: number;
    activiteRecente: { jours: number; actionsMin: number };
  };
}

/** Seuils météo dashboard */
export interface SeuilsMeteoDashboard {
  rouge: { alertesCritiques: number; actionsEnRetard: number; risquesCritiques: number; depassementsBudget: number };
  jaune: { alertesCritiques: number; alertesHautes: number; actionsEnRetard: number; risquesCritiques: number; depassementsBudget: number };
}

/** Seuils météo report V5 */
export interface SeuilsMeteoReport {
  axeRouge: { risquesCritiques: number; ecart: number };
  axeOrange: { risquesCritiques: number; ecart: number };
  axeBleu: { ecart: number };
  globalRouge: number;
  globalOrange: number;
  globalBleu: number;
  scoreAlerte: number;
}

/** Seuils météo COPIL */
export interface SeuilsMeteoCopil {
  stormy: { risquesCritiques: number; jalonsEnDanger: number };
  rainy: { risquesCritiques: number; jalonsEnDanger: number };
  sunny: { avancement: number };
  cloudy: { avancement: number };
}

/** Seuils météo axe dashboard */
export interface SeuilsMeteoAxeDashboard {
  soleil: number;
  nuageux: number;
}

/** Seuils sync report */
export interface SeuilsSyncReport {
  synchronise: number;
  attention: number;
  joursConversion: number;
  desyncAlerte: number;
}

/** Seuils KPI report */
export interface SeuilsKpiReport {
  jalonsPct: number;
  actionsPct: number;
  goodRatio: number;
  medRatio: number;
  deviationGood: number;
  deviationBad: number;
  occupationBon: number;
  occupationAttention: number;
  jalonsBonRatio: number;
  jalonsAttentionRatio: number;
  actionsBonRatio: number;
  actionsAttentionRatio: number;
  globalExcellent: number;
  globalBon: number;
  globalAttention: number;
  globalAlerte: number;
}

/** Seuils confidence */
export interface SeuilsConfidence {
  penaliteRisqueCritique: number;
  penaliteRisqueMajeur: number;
}

/** Seuils UI */
export interface SeuilsUi {
  compteARebours: { critique: number; attention: number };
  jalonsAVenir: number;
  topRisques: number;
  topActions: number;
  topJalons: number;
}

/** Config axe individuel */
export interface AxeConfigItem {
  code: string;
  label: string;
  labelCourt: string;
  color: string;
  numero: number;
  poids: number;
}

/** Axes config full */
export interface AxesConfig {
  rh: AxeConfigItem;
  commercialisation: AxeConfigItem;
  technique: AxeConfigItem;
  budget: AxeConfigItem;
  marketing: AxeConfigItem;
  exploitation: AxeConfigItem;
  divers: AxeConfigItem;
}

/** Config projet (valeurs numériques/chaînes modifiables) */
export interface ProjetConfig {
  projectId: string;
  nom: string;
  societe: string;
  surface: { gla: number; shon: number };
  nombreBatiments: number;
  occupationCible: number;
  dateDebut: string;
  dateFin: string;
  jalonsClés: { softOpening: string; inauguration: string; finStabilisation: string };
  phases: Array<{ code: string; label: string; dateDebut: string; dateFin: string }>;
  presentateur: { nom: string; titre: string };
  destinataires: string[];
  devise: string;
  baseUrl: string;
  confidentialite: string;
  emailExpediteur: { email: string; nom: string };
  seuilSoftOpening: number;
  softOpeningOffsetJours: number;
  coutsReportMensuels: Record<string, number>;
  horizonsReport: readonly number[];
  defaultLinkDuration: number;
}

/** Météo styles */
export interface MeteoStyleItem {
  label: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
  glowClass: string;
  progressColor: string;
  color: string;
}

export interface MeteoStyles {
  SOLEIL: MeteoStyleItem;
  NUAGEUX: MeteoStyleItem;
  ORAGEUX: MeteoStyleItem;
}

/** Config propagation des dates projetées */
export interface ConfigPropagation {
  jalon_buffer_jours: number;           // Buffer après max(dates prérequis), défaut: 5
  recalcul_auto: boolean;               // Recalcul auto à chaque modif action, défaut: true
  seuil_alerte_glissement_jours: number; // Alerte si glissement > X jours, défaut: 7
  velocite_fenetre_semaines: number;     // Fenêtre pour calcul vélocité, défaut: 4
}

/** Config scénarios d'impact opérationnel */
export interface ConfigScenarios {
  dureeFactor_coeff: number;      // 0.3
  ecartProj_monthly: number;      // 5
  semRH_monthly: number;          // 4
  semRH_scale: number;            // 0.5
  semCOM_monthly: number;         // 3
  semTech_monthly: number;        // 4
  semCon_monthly: number;         // 4
  semBud_base: number;            // 0.3
  semMkt_monthly: number;         // 2
  semExp_monthly: number;         // 3
  semDiv_monthly: number;         // 2
  tauxOccup_bonus: number;        // 5
  rampup_q1_factor: number;       // 0.5
  horizonsReport: number[];       // [1, 3, 6]
  facteur_acceleration_retard: number; // 1.3
}

// ============================================================================
// MAPPING DES CATÉGORIES
// ============================================================================

export interface ParametresMetierCategories {
  seuils_risques: SeuilsRisques;
  seuils_chemin_critique: SeuilsCheminCritique;
  seuils_sante_axe: SeuilsSanteAxe;
  seuils_meteo_dashboard: SeuilsMeteoDashboard;
  seuils_meteo_report: SeuilsMeteoReport;
  seuils_meteo_copil: SeuilsMeteoCopil;
  seuils_meteo_axe_dashboard: SeuilsMeteoAxeDashboard;
  seuils_sync_report: SeuilsSyncReport;
  seuils_kpi_report: SeuilsKpiReport;
  seuils_confidence: SeuilsConfidence;
  seuils_ui: SeuilsUi;
  axes_config: AxesConfig;
  projet_config: ProjetConfig;
  meteo_styles: MeteoStyles;
  config_propagation: ConfigPropagation;
  config_scenarios: ConfigScenarios;
}

export type ParametreMetierCategory = keyof ParametresMetierCategories;
