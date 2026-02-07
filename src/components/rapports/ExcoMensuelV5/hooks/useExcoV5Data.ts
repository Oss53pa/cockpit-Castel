/**
 * Master data aggregation hook for EXCO Mensuel V5
 * Composes existing hooks + computed fields + localStorage editable state
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useActions } from '@/hooks/useActions';
import { useJalons } from '@/hooks/useJalons';
import { useRisques } from '@/hooks/useRisques';
import { useDashboardKPIs, useAvancementParAxe, useMeteoProjet, useComparaisonAxes } from '@/hooks/useDashboard';
import { useBudgetSynthese } from '@/hooks/useBudget';
import { useConfidenceScore } from '@/hooks/useConfidenceScore';
import { useCriticalPath } from '@/hooks/useCriticalPath';
import { useUsers } from '@/hooks/useUsers';
import { useCurrentSite } from '@/hooks/useSites';
import { useSyncStatus } from '@/hooks/useSync';
import { useProjectConfig } from '@/hooks/useProjectConfig';
import { getSnapshotHistoryV2 } from '@/services/syncServiceV2';
import { PROJET_CONFIG, SEUILS_METEO_REPORT, SEUILS_RISQUES, DEFAULT_CONFIG_PROPAGATION, DEFAULT_CONFIG_SCENARIOS } from '@/data/constants';
import {
  calculerImpactActions,
  calculerImpactJalons,
  analyserCascades,
  type ImpactActions,
  type ImpactJalons,
  type CascadeAnalysis,
} from '@/lib/scenarios/impactOperationnel';
import { buildDependencyGraph } from '@/lib/interdependency/graphBuilder';
import { calculateCriticalPath } from '@/lib/interdependency/criticalPath';
import { AXES_V5, LS_KEYS, type MeteoLevel } from '../constants';
import type { Action, Jalon, Risque } from '@/types';
import { db } from '@/db';
import type { ExcoV5Snapshot } from '@/lib/mapReportToExco';

// ============================================================================
// EDITABLE TYPES
// ============================================================================

export interface ExecSummaryMessage {
  type: 'alerte' | 'blocage' | 'levier';
  title: string;
  text: string;
}

export interface HighlightsData {
  realisations: string[];
  blocages: string[];
  alertes: string[];
}

export interface AxeAnalysis {
  soWhat: string;
  recommendation: string;
}

export interface DecisionItem {
  id: string;
  titre: string;
  urgence: 'critique' | 'haute' | 'moyenne';
  responsable: string;
  impact: string;
  echeance: string;
}

export interface PendingDecision {
  id: string;
  sujet: string;
  dateCreation: string;
  actionTitre: string;
  actionId: string;
  axe: string;
  responsable: string;
}

export interface ScenarioData {
  titre: string;
  siMaintenant: string[];   // 3 bullet points
  siReport: string[];       // 3 bullet points
}

// ============================================================================
// AXE DATA (computed per axis)
// ============================================================================

export interface AxeData {
  id: string;
  dbCode: string;
  label: string;
  labelCourt: string;
  icon: string;
  color: string;
  avancement: number;
  prevu: number;
  tendance: 'up' | 'down' | 'stable';
  actionsTotal: number;
  actionsTerminees: number;
  actionsEnRetard: number;
  jalonsTotal: number;
  jalonsAtteints: number;
  jalonsEnDanger: number;
  risquesActifs: number;
  risquesCritiques: number;
  topRisques: Risque[];
  topActions: Action[];
  prochainJalon: Jalon | null;
  meteo: MeteoLevel;
}

// ============================================================================
// FULL V5 DATA
// ============================================================================

export interface ExcoV5Data {
  // Loading
  isLoading: boolean;

  // Project info
  projectName: string;
  openingDate: string;
  joursRestants: number;
  pourcentageTempsEcoule: number;
  moisCourant: string;

  // KPIs
  kpis: ReturnType<typeof useDashboardKPIs>;
  avancementGlobal: number;
  projectionLineaire: number;

  // Health & Confidence
  confidenceScore: ReturnType<typeof useConfidenceScore>;
  meteoGlobale: MeteoLevel;

  // Critical path
  criticalPath: ReturnType<typeof useCriticalPath>;

  // Budget
  budgetSynthese: ReturnType<typeof useBudgetSynthese>;

  // Sync
  comparaisonAxes: ReturnType<typeof useComparaisonAxes>;
  syncStatus: { projectProgress: number; mobilizationProgress: number; gap: number; status: string; alertLevel: string } | null;
  syncSnapshots: Array<{ date: string; cc: number; mob: number }>;

  // Jalons clés (critiques + majeurs, positionnés sur axe temps)
  jalonsCles: Array<{ label: string; pctTemps: number; atteint: boolean }>;

  // Per-axis data
  axesData: AxeData[];

  // Risques top 5
  topRisques: Risque[];

  // Décisions attendues non transmises (auto depuis actions)
  pendingDecisions: PendingDecision[];

  // Raw data
  allActions: Action[];
  allJalons: Jalon[];
  allRisques: Risque[];

  // Editable state
  execSummary: ExecSummaryMessage[];
  setExecSummary: (v: ExecSummaryMessage[]) => void;
  highlights: HighlightsData;
  setHighlights: (v: HighlightsData) => void;
  axeAnalyses: Record<string, AxeAnalysis>;
  setAxeAnalysis: (axeId: string, v: AxeAnalysis) => void;
  decisions: DecisionItem[];
  setDecisions: (v: DecisionItem[]) => void;
  scenarios: ScenarioData[];
  scoreRisque: ScenarioRiskScore;
  scenariosInputs: ScenarioInputs;
  criticalPathNotes: string;
  setCriticalPathNotes: (v: string) => void;
}

// ============================================================================
// LOCALSTORAGE HELPERS
// ============================================================================

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silent
  }
}

// ============================================================================
// HELPER: derive météo from axis avancement vs prevu
// ============================================================================

function deriveAxeMeteo(avancement: number, prevu: number, risquesCritiques: number): MeteoLevel {
  const ecart = avancement - prevu;
  if (risquesCritiques >= SEUILS_METEO_REPORT.axeRouge.risquesCritiques || ecart < SEUILS_METEO_REPORT.axeRouge.ecart) return 'rouge';
  if (risquesCritiques >= SEUILS_METEO_REPORT.axeOrange.risquesCritiques || ecart < SEUILS_METEO_REPORT.axeOrange.ecart) return 'orange';
  if (ecart >= SEUILS_METEO_REPORT.axeBleu.ecart) return 'bleu';
  return 'vert';
}

function deriveGlobalMeteo(meteoProjet: string, score: number | undefined): MeteoLevel {
  if (meteoProjet === 'rouge' || (score !== undefined && score < SEUILS_METEO_REPORT.globalRouge)) return 'rouge';
  if (meteoProjet === 'jaune' || (score !== undefined && score < SEUILS_METEO_REPORT.globalOrange)) return 'orange';
  if (score !== undefined && score >= SEUILS_METEO_REPORT.globalBleu) return 'bleu';
  return 'vert';
}

// ============================================================================
// AUTO GENERATE EXEC SUMMARY
// ============================================================================

function generateExecSummary(
  score: number | undefined,
  avancement: number,
  tempsEcoule: number,
  criticalCount: number,
  topRisque: Risque | undefined,
  decisionsCount: number,
): ExecSummaryMessage[] {
  const ecartTemps = avancement - tempsEcoule;
  const msgs: ExecSummaryMessage[] = [];

  // Message 1: Health score
  if (score !== undefined && score < SEUILS_METEO_REPORT.scoreAlerte) {
    msgs.push({
      type: 'alerte',
      title: 'Score de confiance en zone critique',
      text: `Le score de confiance est à ${score}/100 avec un écart avancement/temps de ${ecartTemps > 0 ? '+' : ''}${Math.round(ecartTemps)} pts. Actions correctives nécessaires.`,
    });
  } else {
    msgs.push({
      type: 'levier',
      title: 'Projet en trajectoire maîtrisée',
      text: `Score de confiance: ${score ?? '-'}/100. Écart avancement/temps: ${ecartTemps > 0 ? '+' : ''}${Math.round(ecartTemps)} pts.`,
    });
  }

  // Message 2: Critical path
  if (criticalCount > 0 || topRisque) {
    msgs.push({
      type: 'blocage',
      title: `${criticalCount} action${criticalCount > 1 ? 's' : ''} critique${criticalCount > 1 ? 's' : ''} sans marge`,
      text: topRisque
        ? `Risque principal: ${topRisque.titre} (score ${topRisque.score}).`
        : `${criticalCount} actions sur le chemin critique nécessitent un déblocage immédiat.`,
    });
  } else {
    msgs.push({
      type: 'levier',
      title: 'Chemin critique dégagé',
      text: 'Aucune action critique identifiée sur le chemin d\'ouverture.',
    });
  }

  // Message 3: Decisions
  if (decisionsCount > 0) {
    msgs.push({
      type: 'alerte',
      title: `${decisionsCount} décision${decisionsCount > 1 ? 's' : ''} urgente${decisionsCount > 1 ? 's' : ''} requise${decisionsCount > 1 ? 's' : ''}`,
      text: `Des décisions Exco sont en attente et bloquent la progression de certains axes.`,
    });
  } else {
    msgs.push({
      type: 'levier',
      title: 'Aucune décision bloquante en attente',
      text: 'Les décisions courantes sont à jour.',
    });
  }

  return msgs;
}

// ============================================================================
// SCÉNARIOS D'IMPACT V2 — CONSTANTES CONFIGURABLES
// ============================================================================

const SOFT_OPENING_OFFSET_JOURS = PROJET_CONFIG.softOpeningOffsetJours;
const COUT_PORTAGE_MENSUEL = PROJET_CONFIG.coutsReportMensuels.portage;
const REVENU_MENSUEL_SOFT_OPENING = PROJET_CONFIG.coutsReportMensuels.revenuSoftOpening;
const SEUIL_SOFT_OPENING = PROJET_CONFIG.seuilSoftOpening;
const CIBLE_GRAND_OPENING = PROJET_CONFIG.occupationCible;
export const HORIZONS_REPORT = PROJET_CONFIG.horizonsReport;

// ============================================================================
// SCÉNARIOS V2 — INTERFACES
// ============================================================================

export type ScenarioRiskLevel = 'vert' | 'orange' | 'rouge';
export type ImpactRiskLevel = 'faible' | 'moyen' | 'élevé' | 'critique';

export interface ImpactItem { text: string; chiffre?: string }

export interface ImpactSide {
  headline: string;
  items: ImpactItem[];
  impact: string;
}

export interface ImpactSiReport extends ImpactSide {
  coutFinancier: number;
  semainesPerdues: number;
  risqueLevel: ImpactRiskLevel;
}

export interface ImpactAxe {
  axe: string;
  code: string;
  label: string;
  icon: string;
  color: string;
  siMaintenant: ImpactSide;
  siReport: ImpactSiReport;
  operationnel?: {
    actions: ImpactActions;
    jalons: ImpactJalons;
    cascades: CascadeAnalysis;
  };
  recommandation?: {
    actions_prioritaires: Array<{ titre: string; gain_jours: number }>;
  };
}

export interface ScenarioSynthese {
  titre: string;
  siMaintenant: string[];
  siReport: string[];
}

export interface ScenarioRiskScore {
  score: number;
  level: ScenarioRiskLevel;
  label: string;
  details: string[];
  facteurs: { text: string; points: number }[];
}

export interface ScenariosOutput {
  moisReport: number;
  horizonsDisponibles: readonly number[];
  impactsParAxe: ImpactAxe[];
  syntheseBudget: ScenarioSynthese;
  synthesePlanningMOE: ScenarioSynthese;
  syntheseGOCommercial: ScenarioSynthese;
  scoreRisque: ScenarioRiskScore;
  coutTotalReport: number;
  semainesPerduesTotal: number;
  axesCritiques: number;
  totaux_operationnels: {
    actions_en_retard_total: number;
    jalons_inatteignables_total: number;
    taux_completion_global: number;
    axes_critiques: string[];
  };
}

// ============================================================================
// CONFIGURATION DES SCÉNARIOS — COEFFICIENTS DOCUMENTÉS
// ============================================================================

/**
 * Configuration des coefficients pour les scénarios d'impact.
 * Ces valeurs ont été calibrées pour le projet COSMOS ANGRÉ.
 *
 * JUSTIFICATION DES COEFFICIENTS:
 * - dureeFactor_coeff (0.3): Escalade de 30% par mois de retard supplémentaire.
 *   Rationale: effet cumulatif des retards sur les équipes et les coûts.
 * - ecartProj_monthly (5): +5 points d'écart sync par mois de retard.
 *   Rationale: la désynchronisation s'aggrave linéairement avec le temps.
 * - semTech_monthly (4): 4 semaines de chemin critique perdues par mois.
 *   Rationale: correspond à un glissement calendaire standard.
 * - semCon_monthly (4): idem pour construction.
 * - semMkt_monthly (2): 2 semaines marketing par mois (impact moindre).
 * - tauxOccup_bonus (5): optimisation potentielle de +5% occupation.
 *   Rationale: marge d'amélioration réaliste avec actions commerciales.
 * - rampup_q1_factor (0.5): Q1 à 50% du CA cible (ramp-up).
 * - rampup_q234_months (9): 9 mois restants à taux projeté.
 * - Pertes An1: calculées proportionnellement aux mois perdus après report
 *   (chaque mois de report = 1 mois de revenus An1 en moins)
 */
/** @deprecated local config replaced by DEFAULT_CONFIG_SCENARIOS from DB params */
const SCENARIO_CONFIG = DEFAULT_CONFIG_SCENARIOS;

// ============================================================================
// FACTEUR D'ACCÉLÉRATION NON-LINÉAIRE
// ============================================================================

function facteurAcceleration(moisReport: number, moisRestants: number): number {
  // Facteur de proximité: plus on est proche de l'ouverture, plus l'impact est fort
  // Varie de 1.0 (12+ mois) à 2.0 (0 mois)
  const proximiteFactor = 1 + Math.max(0, (12 - moisRestants) / 12);
  // Facteur de durée: chaque mois de retard augmente l'impact de 30%
  const dureeFactor = 1 + (moisReport - 1) * SCENARIO_CONFIG.dureeFactor_coeff;
  return proximiteFactor * dureeFactor;
}

function riskLevelFromScore(score: number): ImpactRiskLevel {
  if (score >= 75) return 'critique';
  if (score >= 50) return 'élevé';
  if (score >= 25) return 'moyen';
  return 'faible';
}

// ============================================================================
// INPUTS
// ============================================================================

interface ScenarioInputs {
  budgetSynthese: { prevu: number; engage: number; realise: number; tauxEngagement: number; tauxRealisation: number; ecartEngagement: number; ecartRealisation: number };
  comparaisonAxes: { commercial: { avancement: number; actionsTotal: number; actionsTerminees: number }; technique: { avancement: number; actionsTotal: number; actionsTerminees: number }; ecart: number; estSynchronise: boolean };
  criticalPath: { actionsNoMargin: number; actionsLowMargin: number; daysToOpening: number; totalCriticalActions: number } | null;
  joursRestants: number;
  kpis: { tauxOccupation: number; jalonsAtteints: number; jalonsTotal: number; totalActions: number; actionsTerminees: number; budgetTotal: number; budgetConsomme: number; totalRisques: number };
  axesData: AxeData[];
  allActions?: Action[];
  allJalons?: Jalon[];
}

// ============================================================================
// GENERATE SCENARIOS V2 — 8 AXES + 3 SYNTHÈSES + SCORE
// ============================================================================

export function generateScenariosV2(inputs: ScenarioInputs, moisReport: number): ScenariosOutput {
  const { budgetSynthese: bs, comparaisonAxes: ca, criticalPath: cp, joursRestants, kpis, axesData } = inputs;

  const joursAvantSoftOpening = joursRestants - SOFT_OPENING_OFFSET_JOURS;
  const moisAvantSoftOpening = Math.max(0, joursAvantSoftOpening / 30);
  const moisAvantGrandOpening = Math.max(1, joursRestants / 30);
  const fa = facteurAcceleration(moisReport, moisAvantGrandOpening);
  const nbCritiques = cp?.actionsNoMargin ?? 0;

  // Helper: get axe data by id
  const getAxe = (id: string) => axesData.find(a => a.id === id);
  const fmtM = (v: number) => `${Math.round(v / 1e6)}M`;

  // ====================================================================
  // PER-AXE IMPACTS
  // ====================================================================
  const impactsParAxe: ImpactAxe[] = [];

  // ---- RH & Organisation ----
  const rh = getAxe('rh');
  if (rh) {
    const actionsRest = rh.actionsTotal - rh.actionsTerminees;
    const moisOnboardingDispo = Math.max(0, moisAvantSoftOpening - moisReport - 2);
    const onboardingCompromis = moisOnboardingDispo < 0;
    const coutRH = Math.round(moisReport * PROJET_CONFIG.coutsReportMensuels.rh * fa);
    const semRH = Math.round(moisReport * 4 * (fa * 0.5));
    const scoreRH = actionsRest > 5 ? 60 : actionsRest > 2 ? 40 : 15;
    impactsParAxe.push({
      axe: 'rh', code: 'RH', label: 'RH & Organisation', icon: '○', color: rh.color,
      siMaintenant: {
        headline: `${rh.actionsTerminees}/${rh.actionsTotal} actions RH terminées`,
        items: [
          { text: `${actionsRest} recrutements/actions en cours` },
          { text: `${Math.round(moisAvantSoftOpening)} mois pour onboarding avant soft` },
          { text: `Avancement ${Math.round(rh.avancement)}%`, chiffre: `${Math.round(rh.avancement)}%` },
        ],
        impact: actionsRest > 5 ? 'Plan de recrutement à accélérer' : 'Cadre RH en bonne voie',
      },
      siReport: {
        headline: onboardingCompromis ? 'Onboarding compromis' : `Fenêtre onboarding réduite à ${Math.round(moisOnboardingDispo)} mois`,
        items: [
          { text: `Recrutements décalés de ${moisReport} mois`, chiffre: `−${moisReport} mois` },
          { text: onboardingCompromis ? 'Équipes non prêtes au soft opening' : `${Math.round(moisOnboardingDispo)} mois onboarding restants` },
          { text: `Surcoût intérim/remplacement`, chiffre: fmtM(coutRH) },
        ],
        impact: onboardingCompromis ? 'Ouverture avec équipes incomplètes' : 'Qualité de service dégradée au lancement',
        coutFinancier: coutRH, semainesPerdues: semRH,
        risqueLevel: riskLevelFromScore(Math.round(scoreRH * fa)),
      },
    });
  }

  // ---- Commercial & Leasing ----
  const com = getAxe('commercial');
  if (com) {
    const occupation = kpis.tauxOccupation;
    const moisDispoSoft = Math.max(0, moisAvantSoftOpening - moisReport);
    const risqueDesengagement = moisReport >= 3 ? 'élevé' : moisReport >= 2 ? 'moyen' : 'faible';
    const revenuPerdu = Math.round(REVENU_MENSUEL_SOFT_OPENING * moisReport * fa);
    const semCOM = Math.round(moisReport * 3 * fa);
    const scoreCOM = occupation < SEUIL_SOFT_OPENING ? 70 : occupation < CIBLE_GRAND_OPENING ? 40 : 15;
    impactsParAxe.push({
      axe: 'commercial', code: 'COM', label: 'Commercial & Leasing', icon: '○', color: com.color,
      siMaintenant: {
        headline: `Occupation ${occupation}% — Cible soft ${SEUIL_SOFT_OPENING}%`,
        items: [
          { text: `${Math.round(moisAvantSoftOpening)} mois pour atteindre seuil soft opening`, chiffre: `${Math.round(moisAvantSoftOpening)} mois` },
          { text: `${Math.round(moisAvantGrandOpening)} mois pour cible ${CIBLE_GRAND_OPENING}%` },
          { text: `${com.actionsTerminees}/${com.actionsTotal} actions COM terminées` },
        ],
        impact: occupation < SEUIL_SOFT_OPENING ? `${SEUIL_SOFT_OPENING - occupation} pts à gagner avant soft` : 'Soft opening sécurisé',
      },
      siReport: {
        headline: `${Math.round(moisDispoSoft)} mois restants pour soft opening`,
        items: [
          { text: `Risque désengagement locataires : ${risqueDesengagement}`, chiffre: risqueDesengagement },
          { text: `Revenus manqués`, chiffre: fmtM(revenuPerdu) },
          { text: moisReport >= 3 ? 'Renégociation BEFA probable' : 'Tensions calendrier locataires' },
        ],
        impact: moisDispoSoft < 4 ? 'Soft opening compromis' : 'Ramp-up commercial dégradé',
        coutFinancier: revenuPerdu, semainesPerdues: semCOM,
        risqueLevel: riskLevelFromScore(Math.round(scoreCOM * fa)),
      },
    });
  }

  // ---- Technique & Handover ----
  const tech = getAxe('technique');
  if (tech) {
    const handoverCompromis = moisAvantSoftOpening - moisReport < 4;
    const ecartProj = Math.round(Math.abs(ca.ecart) + moisReport * 5 * fa);
    const coutTech = Math.round(moisReport * PROJET_CONFIG.coutsReportMensuels.technique * fa);
    const semTech = Math.round(moisReport * 4 * fa);
    const scoreTech = tech.avancement < 30 ? 65 : tech.avancement < 60 ? 40 : 15;
    impactsParAxe.push({
      axe: 'technique', code: 'TECH', label: 'Technique & Handover', icon: '○', color: tech.color,
      siMaintenant: {
        headline: `Avancement technique ${Math.round(tech.avancement)}%`,
        items: [
          { text: `${tech.jalonsTotal - tech.jalonsAtteints} jalons techniques restants` },
          { text: `${tech.actionsTerminees}/${tech.actionsTotal} actions réalisées` },
          { text: handoverCompromis ? 'Fenêtre handover déjà serrée' : 'Handover planifiable' },
        ],
        impact: tech.avancement < 30 ? 'Accélération technique nécessaire' : 'Trajectoire technique tenable',
      },
      siReport: {
        headline: handoverCompromis ? 'Handover compromis (< 4 mois)' : `Handover serré — ${Math.round(moisAvantSoftOpening - moisReport)} mois`,
        items: [
          { text: `Écart sync projeté`, chiffre: `${ecartProj} pts` },
          { text: handoverCompromis ? 'SOCOTEC non planifiable dans les délais' : 'SOCOTEC replanification nécessaire' },
          { text: `Surcoûts reprises/retouches`, chiffre: fmtM(coutTech) },
        ],
        impact: handoverCompromis ? 'Réception technique impossible avant soft' : 'Qualité technique sous pression',
        coutFinancier: coutTech, semainesPerdues: semTech,
        risqueLevel: riskLevelFromScore(Math.round(scoreTech * fa)),
      },
    });
  }

  // ---- Construction ----
  const con = getAxe('construction');
  if (con) {
    const desyncActuel = Math.abs(ca.ecart);
    const desyncProjection = Math.round(desyncActuel + moisReport * 8 * fa);
    const coutRetard = Math.round(moisReport * PROJET_CONFIG.coutsReportMensuels.construction * fa);
    const semCon = Math.round(moisReport * 4 * fa);
    const scoreCon = con.avancement < 10 ? 80 : con.avancement < 40 ? 55 : 25;
    impactsParAxe.push({
      axe: 'construction', code: 'CON', label: 'Construction', icon: '○', color: con.color,
      siMaintenant: {
        headline: `Avancement CC ${Math.round(con.avancement)}%`,
        items: [
          { text: `${con.actionsTerminees}/${con.actionsTotal} actions réalisées` },
          { text: `Désync actuelle : ${desyncActuel} pts vs mobilisation` },
          { text: `${con.jalonsTotal - con.jalonsAtteints} jalons chantier restants` },
        ],
        impact: con.avancement < 10 ? 'Démarrage chantier urgent' : 'Chantier en progression',
      },
      siReport: {
        headline: `Désync projetée ${desyncProjection} pts`,
        items: [
          { text: `Retard chantier supplémentaire`, chiffre: `+${moisReport} mois` },
          { text: `Coût retard estimé`, chiffre: fmtM(coutRetard) },
          { text: 'Cascade sur handover et soft opening' },
        ],
        impact: `Livraison repoussée — impact domino sur tous les axes`,
        coutFinancier: coutRetard, semainesPerdues: semCon,
        risqueLevel: riskLevelFromScore(Math.round(scoreCon * fa)),
      },
    });
  }

  // ---- Budget & Finances ----
  const bud = getAxe('budget');
  if (bud) {
    const tauxEng = Math.round(bs.tauxEngagement);
    const resteAEngager = Math.max(0, bs.prevu - bs.engage);
    const coutPortage = Math.round(COUT_PORTAGE_MENSUEL * moisReport * fa);
    const revenuManque = Math.round(REVENU_MENSUEL_SOFT_OPENING * moisReport * fa);
    const coutTotal = coutPortage + revenuManque;
    const semBud = Math.round(moisReport * 4 * (0.3 + (1 - Math.min(moisAvantGrandOpening, 12) / 12) * 0.2));
    const scoreBud = tauxEng < 50 ? 60 : tauxEng < 70 ? 35 : 10;
    impactsParAxe.push({
      axe: 'budget', code: 'BUD', label: 'Budget & Finances', icon: '◇', color: bud.color,
      siMaintenant: {
        headline: `${tauxEng}% engagé — ${fmtM(resteAEngager)} restant`,
        items: [
          { text: `Rythme mensuel requis : ${fmtM(Math.round(resteAEngager / Math.max(1, moisAvantSoftOpening)))}/mois` },
          { text: `Portage estimé : ${fmtM(Math.round(moisAvantSoftOpening * COUT_PORTAGE_MENSUEL))}` },
          { text: `${bud.actionsTerminees}/${bud.actionsTotal} actions budget terminées` },
        ],
        impact: tauxEng < 50 ? 'Accélérer les engagements' : 'Cadre budgétaire maîtrisé',
      },
      siReport: {
        headline: `+${fmtM(coutTotal)} (portage + revenus manqués)`,
        items: [
          { text: `Portage supplémentaire`, chiffre: fmtM(coutPortage) },
          { text: `Revenus manqués`, chiffre: fmtM(revenuManque) },
          { text: `−${semBud} sem. sur chemin critique` },
        ],
        impact: joursAvantSoftOpening < 180 ? 'Soft opening compromis → cascade grand opening' : 'Surcoûts significatifs mais absorbables',
        coutFinancier: coutTotal, semainesPerdues: semBud,
        risqueLevel: riskLevelFromScore(Math.round(scoreBud * fa)),
      },
    });
  }

  // ---- Marketing & Communication ----
  const mkt = getAxe('marketing');
  if (mkt) {
    const moisCampagne = Math.max(0, moisAvantSoftOpening - moisReport - 1);
    const campagneCompromise = moisCampagne < 3;
    const coutMkt = Math.round(moisReport * PROJET_CONFIG.coutsReportMensuels.marketing * fa);
    const semMkt = Math.round(moisReport * 2 * fa);
    const scoreMkt = mkt.avancement < 10 ? 50 : mkt.avancement < 30 ? 30 : 10;
    impactsParAxe.push({
      axe: 'marketing', code: 'MKT', label: 'Marketing & Communication', icon: '○', color: mkt.color,
      siMaintenant: {
        headline: `${Math.round(moisAvantSoftOpening)} mois pour campagne pré-ouverture`,
        items: [
          { text: `Avancement marketing ${Math.round(mkt.avancement)}%`, chiffre: `${Math.round(mkt.avancement)}%` },
          { text: `${mkt.actionsTerminees}/${mkt.actionsTotal} actions MKT réalisées` },
          { text: 'Fenêtre buzz building disponible' },
        ],
        impact: mkt.avancement < 10 ? 'Campagne à lancer en urgence' : 'Notoriété en construction',
      },
      siReport: {
        headline: campagneCompromise ? 'Campagne pré-ouverture compromise' : `${Math.round(moisCampagne)} mois pour campagne`,
        items: [
          { text: campagneCompromise ? 'Moins de 3 mois = buzz insuffisant' : 'Délai campagne serré' },
          { text: moisReport >= 3 ? 'Signal négatif marché Abidjan' : 'Retard campagne absorbable' },
          { text: `Dépenses pré-campagne perdues`, chiffre: fmtM(coutMkt) },
        ],
        impact: campagneCompromise ? 'Ouverture sans visibilité marché' : 'Notoriété réduite au lancement',
        coutFinancier: coutMkt, semainesPerdues: semMkt,
        risqueLevel: riskLevelFromScore(Math.round(scoreMkt * fa)),
      },
    });
  }

  // ---- Exploitation & Juridique ----
  const exp = getAxe('exploitation');
  if (exp) {
    const actionsRest = exp.actionsTotal - exp.actionsTerminees;
    const risqueConformite = moisReport >= 2;
    const coutExp = Math.round(moisReport * PROJET_CONFIG.coutsReportMensuels.exploitation * fa);
    const semExp = Math.round(moisReport * 3 * fa);
    const scoreExp = actionsRest > 10 ? 55 : actionsRest > 3 ? 30 : 10;
    impactsParAxe.push({
      axe: 'exploitation', code: 'EXP', label: 'Exploitation & Juridique', icon: '○', color: exp.color,
      siMaintenant: {
        headline: `${exp.actionsTerminees}/${exp.actionsTotal} actions EXP terminées`,
        items: [
          { text: `${actionsRest} contrats/conformités en cours` },
          { text: `${exp.jalonsTotal - exp.jalonsAtteints} jalons réglementaires restants` },
          { text: `Avancement ${Math.round(exp.avancement)}%` },
        ],
        impact: actionsRest > 10 ? 'Accélérer la mise en conformité' : 'Conformité en bonne voie',
      },
      siReport: {
        headline: risqueConformite ? 'Autorisations d\'exploitation à risque' : 'Retard absorbable sur conformité',
        items: [
          { text: `${Math.min(actionsRest, Math.round(actionsRest * moisReport / Math.max(1, moisAvantSoftOpening)))} contrats exposés au report` },
          { text: risqueConformite ? 'Autorisations d\'ouverture compromises' : 'Replanification contrats nécessaire' },
          { text: `Pénalités/surcoûts juridiques`, chiffre: fmtM(coutExp) },
        ],
        impact: risqueConformite ? 'Ouverture sans autorisations = blocage total' : 'Calendrier juridique sous tension',
        coutFinancier: coutExp, semainesPerdues: semExp,
        risqueLevel: riskLevelFromScore(Math.round(scoreExp * fa)),
      },
    });
  }

  // ---- Divers & Transverse ----
  const div = getAxe('divers');
  if (div) {
    const coutDiv = Math.round(moisReport * PROJET_CONFIG.coutsReportMensuels.divers * fa);
    const semDiv = Math.round(moisReport * 2 * fa);
    const scoreDiv = div.actionsTotal > 0 && div.avancement < 20 ? 35 : 10;
    impactsParAxe.push({
      axe: 'divers', code: 'DIV', label: 'Divers & Transverse', icon: '○', color: div.color,
      siMaintenant: {
        headline: `${div.actionsTerminees}/${div.actionsTotal} actions transverses`,
        items: [
          { text: `Avancement ${Math.round(div.avancement)}%`, chiffre: `${Math.round(div.avancement)}%` },
          { text: 'Coordination inter-axes active' },
          { text: `${div.jalonsTotal - div.jalonsAtteints} jalons transverses restants` },
        ],
        impact: 'Coordination nominale',
      },
      siReport: {
        headline: 'Impact cascade sur coordination',
        items: [
          { text: `Report décale ${Math.round(impactsParAxe.length)} axes simultanément` },
          { text: 'Replanification globale nécessaire' },
          { text: `Surcoûts coordination`, chiffre: fmtM(coutDiv) },
        ],
        impact: moisReport >= 3 ? 'Coordination inter-axes fragilisée' : 'Ajustements transverses requis',
        coutFinancier: coutDiv, semainesPerdues: semDiv,
        risqueLevel: riskLevelFromScore(Math.round(scoreDiv * fa)),
      },
    });
  }

  // Trier par risque décroissant
  const riskOrder: Record<ImpactRiskLevel, number> = { critique: 4, 'élevé': 3, moyen: 2, faible: 1 };
  impactsParAxe.sort((a, b) => riskOrder[b.siReport.risqueLevel] - riskOrder[a.siReport.risqueLevel]);

  // ====================================================================
  // 3 SYNTHÈSES TRANSVERSALES (alimentées par les 8 axes)
  // ====================================================================
  const totalCout = impactsParAxe.reduce((s, a) => s + a.siReport.coutFinancier, 0);
  const maxSemaines = Math.max(0, ...impactsParAxe.map(a => a.siReport.semainesPerdues));

  const syntheseBudget: ScenarioSynthese = {
    titre: `Budget — Report ${moisReport} mois`,
    siMaintenant: [
      `${Math.round(bs.tauxEngagement)}% engagé — ${fmtM(Math.max(0, bs.prevu - bs.engage))} restant`,
      `Rythme mensuel : ${fmtM(Math.round(Math.max(0, bs.prevu - bs.engage) / Math.max(1, moisAvantSoftOpening)))}/mois`,
      `Portage estimé : ${fmtM(Math.round(moisAvantSoftOpening * COUT_PORTAGE_MENSUEL))}`,
    ],
    siReport: [
      `Surcoût total : +${fmtM(totalCout)}`,
      `−${maxSemaines} sem. sur chemin critique`,
      joursAvantSoftOpening < 180 ? 'Soft opening compromis → cascade grand opening' : 'Surcoûts cumulés significatifs',
    ],
  };

  const ecart = ca.ecart;
  const absEcart = Math.abs(ecart);
  const ecartProjete = Math.round(absEcart + moisReport * 10 * (1 + Math.max(0, (180 - joursAvantSoftOpening) / 180)));
  const synthesePlanningMOE: ScenarioSynthese = {
    titre: `Planning MOE — Report ${moisReport} mois`,
    siMaintenant: [
      ca.estSynchronise ? 'Synchronisation soft opening tenable' : `Rattrapage écart ${absEcart} pts nécessaire`,
      nbCritiques > 0 ? `Déblocage ${nbCritiques} actions critiques` : 'Chemin critique dégagé',
      'Locataires rassurés sur calendrier',
    ],
    siReport: [
      moisAvantSoftOpening - moisReport < 3 ? 'Soft opening compromis → domino grand opening' : `Désync projetée ${ecartProjete} pts`,
      nbCritiques > 0 ? `${nbCritiques} actions critiques non débloquées` : 'Nouvelles actions deviennent critiques',
      ecart > 0 ? 'Espaces non prêts pour locataires' : 'Mobilisation commerciale bloquée',
    ],
  };

  const occupation = kpis.tauxOccupation;
  const moisDispoSoft = Math.max(0, moisAvantSoftOpening - moisReport);
  const revenuMensuelCible = REVENU_MENSUEL_SOFT_OPENING * (CIBLE_GRAND_OPENING / 100);
  const revenuAn1Cible = revenuMensuelCible * 12;
  const tauxOccupProj = Math.min(occupation + SCENARIO_CONFIG.tauxOccup_bonus, CIBLE_GRAND_OPENING - 10);

  // PERTE DYNAMIQUE PROPORTIONNELLE AU REPORT
  // Chaque mois de report = 1 mois de revenus An1 perdus (en plus du ramp-up dégradé)
  const moisAn1Effectifs = Math.max(0, 12 - moisReport);
  // Q1 ramp-up (3 mois max, réduit si report important)
  const moisQ1Effectifs = Math.min(3, moisAn1Effectifs);
  // Mois restants au taux projeté nominal
  const moisQ234Effectifs = Math.max(0, moisAn1Effectifs - moisQ1Effectifs);

  // Revenus An1 réels = Q1 à 50% + Q2-Q4 au taux projeté (proportionnel aux mois effectifs)
  const revenuAn1Reel = (revenuMensuelCible * SCENARIO_CONFIG.rampup_q1_factor * moisQ1Effectifs) +
                        (revenuMensuelCible * (tauxOccupProj / 100) * moisQ234Effectifs);

  // Perte = revenus cible - revenus réels après report
  const pertePctAn1 = revenuAn1Cible > 0 ? Math.min(100, Math.round((1 - revenuAn1Reel / revenuAn1Cible) * 100)) : 0;
  const syntheseGOCommercial: ScenarioSynthese = {
    titre: `GO Commercial — Report ${moisReport} mois`,
    siMaintenant: [
      occupation < SEUIL_SOFT_OPENING ? `${Math.round(moisAvantSoftOpening)} mois pour sécuriser soft (${SEUIL_SOFT_OPENING}%)` : `Soft sécurisé (${occupation}% > ${SEUIL_SOFT_OPENING}%)`,
      `${Math.round(moisAvantGrandOpening)} mois pour cible ${CIBLE_GRAND_OPENING}%`,
      `${ca.commercial.actionsTerminees}/${ca.commercial.actionsTotal} actions COM terminées`,
    ],
    siReport: [
      moisDispoSoft < 4 ? `Soft opening à risque — ${Math.round(moisDispoSoft)} mois restants` : `${Math.round(moisDispoSoft)} mois pour soft`,
      occupation < SEUIL_SOFT_OPENING ? 'Locataires pourraient se désengager' : `Risque ouverture sous ${CIBLE_GRAND_OPENING}%`,
      `Revenus −${pertePctAn1}% an 1 (ramp-up dégradé)`,
    ],
  };

  // ====================================================================
  // SCORE DE RISQUE GLOBAL V2 (intègre 8 axes + horizon)
  // ====================================================================
  let score = 0;
  const facteurs: { text: string; points: number }[] = [];

  if (moisAvantSoftOpening - moisReport < 4) {
    const pts = 25;
    score += pts;
    facteurs.push({ text: `Soft opening dans < 4 mois après report`, points: pts });
  } else if (moisAvantSoftOpening - moisReport < 6) {
    const pts = 12;
    score += pts;
    facteurs.push({ text: `Soft opening dans < 6 mois après report`, points: pts });
  }

  if (bs.tauxEngagement < 50) {
    const pts = 15;
    score += pts;
    facteurs.push({ text: `Engagement budget ${Math.round(bs.tauxEngagement)}% < 50%`, points: pts });
  }

  if (!ca.estSynchronise) {
    const pts = 12;
    score += pts;
    facteurs.push({ text: 'CC/Mobilisation désynchronisés', points: pts });
  }

  if (occupation < SEUIL_SOFT_OPENING) {
    const pts = 15;
    score += pts;
    facteurs.push({ text: `Occupation ${occupation}% < seuil soft ${SEUIL_SOFT_OPENING}%`, points: pts });
  }

  if (nbCritiques > 3) {
    const pts = 10;
    score += pts;
    facteurs.push({ text: `${nbCritiques} actions critiques sans marge`, points: pts });
  }

  const axesCritiques = impactsParAxe.filter(a => a.siReport.risqueLevel === 'critique').length;
  const axesEleves = impactsParAxe.filter(a => a.siReport.risqueLevel === 'élevé').length;
  if (axesCritiques > 0) {
    const pts = axesCritiques * 5;
    score += pts;
    facteurs.push({ text: `${axesCritiques} axe(s) en risque critique`, points: pts });
  }
  if (axesEleves > 0) {
    const pts = axesEleves * 3;
    score += pts;
    facteurs.push({ text: `${axesEleves} axe(s) en risque élevé`, points: pts });
  }

  // Appliquer accélération non-linéaire
  score = Math.min(100, Math.round(score * fa));

  let level: ScenarioRiskLevel;
  let label: string;
  if (score <= 30) { level = 'vert'; label = 'Situation maîtrisée'; }
  else if (score <= 60) { level = 'orange'; label = 'Vigilance requise'; }
  else { level = 'rouge'; label = 'Action immédiate nécessaire'; }

  const scoreRisque: ScenarioRiskScore = { score, level, label, details: facteurs.map(f => `${f.text} (+${f.points})`), facteurs };

  // ====================================================================
  // IMPACT OPÉRATIONNEL — Enrichissement par axe
  // ====================================================================
  const allActions = inputs.allActions || [];
  const allJalons = inputs.allJalons || [];
  const configPropagation = DEFAULT_CONFIG_PROPAGATION;
  const softOpeningDate = PROJET_CONFIG.jalonsClés.softOpening;

  let totalActionsEnRetard = 0;
  let totalJalonsInatteignables = 0;
  let completionNumerator = 0;
  let completionDenominator = 0;
  const axesCritiquesOps: string[] = [];

  // Map short axe id to dbCode for filtering
  const axeIdToDbCode: Record<string, string> = {};
  for (const ad of axesData) {
    axeIdToDbCode[ad.id] = ad.dbCode;
  }

  for (const impact of impactsParAxe) {
    const dbCode = axeIdToDbCode[impact.axe] || impact.axe;
    const axeActions = allActions.filter(a => a.axe === dbCode);
    const axeJalons = allJalons.filter(j => j.axe === dbCode);

    if (axeActions.length === 0 && axeJalons.length === 0) continue;

    const impactActions = calculerImpactActions(axeActions, joursRestants, moisReport, configPropagation);
    const impactJalons = calculerImpactJalons(axeJalons, axeActions, joursRestants, moisReport, softOpeningDate);

    // Build CPM graph for this axe's actions
    let cascades: CascadeAnalysis = { profondeur_max: 0, elements_impactes_total: 0, axes_impactes: [], actions_marge_nulle: 0 };
    if (axeActions.length > 0) {
      try {
        const graph = buildDependencyGraph(axeActions);
        const cpmGraph = calculateCriticalPath(graph);
        cascades = analyserCascades(cpmGraph, moisReport);
      } catch {
        // CPM may fail on sparse data — continue with empty cascades
      }
    }

    impact.operationnel = { actions: impactActions, jalons: impactJalons, cascades };

    // Add operational bullets to siReport
    if (impactActions.actions_nouvellement_en_retard > 0) {
      impact.siReport.items.push({ text: `+${impactActions.actions_nouvellement_en_retard} actions en retard`, chiffre: `+${impactActions.actions_nouvellement_en_retard}` });
    }
    if (impactJalons.jalons_inatteignables > 0) {
      impact.siReport.items.push({ text: `${impactJalons.jalons_inatteignables} jalon(s) inatteignable(s)`, chiffre: `${impactJalons.jalons_inatteignables}` });
    }
    if (impactActions.ratio_acceleration > 2) {
      impact.siReport.items.push({ text: `Vélocité requise : x${impactActions.ratio_acceleration}`, chiffre: `x${impactActions.ratio_acceleration}` });
    }

    // Recommandations: top 3 actions bloquantes
    const actionsBloquantes = axeActions
      .filter(a => a.statut !== 'termine' && a.successeurs && a.successeurs.length > 0)
      .sort((a, b) => (b.successeurs?.length || 0) - (a.successeurs?.length || 0))
      .slice(0, 3);
    if (actionsBloquantes.length > 0) {
      impact.recommandation = {
        actions_prioritaires: actionsBloquantes.map(a => ({
          titre: a.titre,
          gain_jours: a.successeurs?.length || 0,
        })),
      };
    }

    // Aggregate totals
    totalActionsEnRetard += impactActions.actions_nouvellement_en_retard;
    totalJalonsInatteignables += impactJalons.jalons_inatteignables;
    completionNumerator += impactActions.taux_completion_projete * axeActions.length;
    completionDenominator += axeActions.length;
    if (impactJalons.jalons_inatteignables > 0 || impactActions.ratio_acceleration > 3) {
      axesCritiquesOps.push(impact.label);
    }
  }

  const totaux_operationnels = {
    actions_en_retard_total: totalActionsEnRetard,
    jalons_inatteignables_total: totalJalonsInatteignables,
    taux_completion_global: completionDenominator > 0 ? Math.round(completionNumerator / completionDenominator) : 100,
    axes_critiques: axesCritiquesOps,
  };

  return {
    moisReport,
    horizonsDisponibles: HORIZONS_REPORT,
    impactsParAxe,
    syntheseBudget,
    synthesePlanningMOE,
    syntheseGOCommercial,
    scoreRisque,
    coutTotalReport: totalCout,
    semainesPerduesTotal: maxSemaines,
    axesCritiques,
    totaux_operationnels,
  };
}

// Backward compat wrapper — generates default (1 month) for hook
function generateScenarios(inputs: ScenarioInputs): { scenarios: ScenarioData[]; scoreRisque: ScenarioRiskScore } {
  const out = generateScenariosV2(inputs, 1);
  const scenarios: ScenarioData[] = [
    { titre: out.syntheseBudget.titre, siMaintenant: out.syntheseBudget.siMaintenant, siReport: out.syntheseBudget.siReport },
    { titre: out.synthesePlanningMOE.titre, siMaintenant: out.synthesePlanningMOE.siMaintenant, siReport: out.synthesePlanningMOE.siReport },
    { titre: out.syntheseGOCommercial.titre, siMaintenant: out.syntheseGOCommercial.siMaintenant, siReport: out.syntheseGOCommercial.siReport },
  ];
  return { scenarios, scoreRisque: out.scoreRisque };
}

// ============================================================================
// SAVED EXCO LOADER — reads snapshot from DB
// ============================================================================

function useSavedExcoV5Data(savedExcoId?: number): ExcoV5Data | null {
  const exco = useLiveQuery(
    () => (savedExcoId ? db.excos.get(savedExcoId) : undefined),
    [savedExcoId]
  );

  return useMemo(() => {
    if (!savedExcoId || !exco?.v5DataSnapshot) return null;

    let snapshot: ExcoV5Snapshot;
    try {
      snapshot = JSON.parse(exco.v5DataSnapshot);
    } catch {
      return null;
    }

    // Build a read-only ExcoV5Data from the snapshot
    const noop = () => {};
    return {
      isLoading: false,
      projectName: snapshot.projectName,
      openingDate: snapshot.openingDate,
      joursRestants: snapshot.joursRestants,
      pourcentageTempsEcoule: snapshot.pourcentageTempsEcoule,
      moisCourant: snapshot.moisCourant,
      kpis: snapshot.kpis as ExcoV5Data['kpis'],
      avancementGlobal: snapshot.avancementGlobal,
      projectionLineaire: snapshot.projectionLineaire,
      confidenceScore: snapshot.confidenceScore as ExcoV5Data['confidenceScore'],
      meteoGlobale: snapshot.meteoGlobale as MeteoLevel,
      criticalPath: snapshot.criticalPath as ExcoV5Data['criticalPath'],
      budgetSynthese: snapshot.budgetSynthese as ExcoV5Data['budgetSynthese'],
      comparaisonAxes: snapshot.comparaisonAxes as ExcoV5Data['comparaisonAxes'],
      syncStatus: snapshot.syncStatus,
      syncSnapshots: snapshot.syncSnapshots,
      jalonsCles: snapshot.jalonsCles,
      axesData: snapshot.axesData,
      topRisques: snapshot.topRisques as ExcoV5Data['topRisques'],
      pendingDecisions: snapshot.pendingDecisions,
      allActions: [] as Action[],
      allJalons: [] as Jalon[],
      allRisques: [] as Risque[],
      execSummary: snapshot.execSummary,
      setExecSummary: noop as ExcoV5Data['setExecSummary'],
      highlights: snapshot.highlights,
      setHighlights: noop as ExcoV5Data['setHighlights'],
      axeAnalyses: snapshot.axeAnalyses,
      setAxeAnalysis: noop as ExcoV5Data['setAxeAnalysis'],
      decisions: snapshot.decisions,
      setDecisions: noop as ExcoV5Data['setDecisions'],
      scenarios: snapshot.scenarios,
      scoreRisque: snapshot.scoreRisque,
      scenariosInputs: {
        budgetSynthese: snapshot.budgetSynthese,
        comparaisonAxes: snapshot.comparaisonAxes,
        criticalPath: snapshot.criticalPath,
        joursRestants: snapshot.joursRestants,
        kpis: snapshot.kpis as ScenarioInputs['kpis'],
        axesData: snapshot.axesData,
      } as ScenarioInputs,
      criticalPathNotes: snapshot.criticalPathNotes,
      setCriticalPathNotes: noop as ExcoV5Data['setCriticalPathNotes'],
    };
  }, [savedExcoId, exco]);
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useExcoV5Data(savedExcoId?: number | null): ExcoV5Data {
  // If a saved EXCO ID is provided, load from DB snapshot instead of live data
  const savedData = useSavedExcoV5Data(savedExcoId ?? undefined);
  if (savedExcoId && savedData) return savedData;
  // Existing hooks
  const kpis = useDashboardKPIs();
  const avancementParAxe = useAvancementParAxe();
  const meteoProjet = useMeteoProjet();
  const comparaisonAxes = useComparaisonAxes();
  const budgetSynthese = useBudgetSynthese();
  const confidenceScore = useConfidenceScore();
  const criticalPath = useCriticalPath();
  const users = useUsers();
  const currentSite = useCurrentSite();

  const allActions = useActions() ?? [];
  const allJalons = useJalons() ?? [];
  const allRisques = useRisques() ?? [];

  // Sync Construction vs Mobilisation (données réelles)
  const siteId = currentSite?.id ?? 1;
  const syncStatus = useSyncStatus(siteId);
  const projectConfig = useProjectConfig();

  // Sync snapshots (real historical data)
  const syncSnapshots = useLiveQuery(async () => {
    const snaps = await getSnapshotHistoryV2(PROJET_CONFIG.projectId, 12);
    return snaps.reverse().map(s => ({
      date: s.snapshotDate,
      cc: Math.round(s.projectProgress),
      mob: Math.round(s.mobilizationProgress),
    }));
  }) ?? [];

  // Project info
  const projectName = kpis.projectName || currentSite?.nom || PROJET_CONFIG.nom;
  const openingDate = currentSite?.dateOuverture ?? PROJET_CONFIG.jalonsClés.softOpening;
  const today = new Date();
  const opening = new Date(openingDate);
  const joursRestants = Math.max(0, Math.ceil((opening.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Project duration: from dateDebutMobilisation (config) to opening
  const mobilisationStr = projectConfig?.dateDebutMobilisation ?? '2026-01';
  const projectStart = new Date(mobilisationStr + (mobilisationStr.length === 7 ? '-01' : ''));
  const totalDays = (opening.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = Math.max(0, (today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
  const pourcentageTempsEcoule = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;

  const moisCourant = today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Global avancement
  const avancementGlobal = allActions.length > 0
    ? allActions.reduce((s, a) => s + a.avancement, 0) / allActions.length
    : 0;

  // Linear projection
  const projectionLineaire = pourcentageTempsEcoule > 0
    ? (avancementGlobal / pourcentageTempsEcoule) * 100
    : 0;

  // Météo
  const meteoGlobale = deriveGlobalMeteo(meteoProjet, confidenceScore?.score);

  // Top 5 risques
  const topRisques = useMemo(() => {
    return [...allRisques]
      .filter(r => r.status !== 'closed')
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);
  }, [allRisques]);

  // Jalons clés (critiques + majeurs) positionnés sur l'axe temps
  const jalonsCles = useMemo(() => {
    const start = new Date((projectConfig?.dateDebutMobilisation ?? '2026-01') + '-01');
    const end = new Date(openingDate);
    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0) return [];

    const important = allJalons
      .filter(j => j.niveau_importance === 'critique' || j.niveau_importance === 'majeur')
      .filter(j => j.statut !== 'annule');

    if (important.length === 0) return [];

    return important
      .map(j => {
        const d = new Date(j.date_prevue);
        const pct = Math.max(0, Math.min(100, ((d.getTime() - start.getTime()) / totalMs) * 100));
        return { label: j.titre, pctTemps: Math.round(pct), atteint: j.statut === 'atteint' };
      })
      .sort((a, b) => a.pctTemps - b.pctTemps)
      .slice(0, 7);
  }, [allJalons, projectConfig, openingDate]);

  // Décisions attendues non transmises (extraites des actions)
  const pendingDecisions: PendingDecision[] = useMemo(() => {
    const result: PendingDecision[] = [];
    for (const action of allActions) {
      const da = (action as Record<string, unknown>).decisions_attendues as
        Array<{ id: string; sujet: string; dateCreation: string; transmis?: boolean }> | undefined;
      if (!da) continue;
      for (const d of da) {
        if (!d.transmis) {
          result.push({
            id: d.id,
            sujet: d.sujet,
            dateCreation: d.dateCreation,
            actionTitre: action.titre,
            actionId: action.id_action,
            axe: action.axe,
            responsable: action.responsable,
          });
        }
      }
    }
    return result.sort((a, b) => a.dateCreation.localeCompare(b.dateCreation));
  }, [allActions]);

  // Per-axis data
  const axesData: AxeData[] = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return AXES_V5.map(axeCfg => {
      const axeActions = allActions.filter(a => a.axe === axeCfg.dbCode);
      const axeJalons = allJalons.filter(j => j.axe === axeCfg.dbCode);
      const axeRisques = allRisques.filter(r => r.axe_impacte === axeCfg.dbCode && r.status !== 'closed');

      const avancement = axeActions.length > 0
        ? axeActions.reduce((s, a) => s + a.avancement, 0) / axeActions.length
        : 0;

      const avAxe = avancementParAxe.find(a => a.axe === axeCfg.dbCode);
      const prevu = avAxe?.prevu ?? pourcentageTempsEcoule;
      const tendance = avAxe?.tendance ?? 'stable';

      const actionsTerminees = axeActions.filter(a => a.statut === 'termine').length;
      const actionsEnRetard = axeActions.filter(a => a.statut !== 'termine' && a.date_fin_prevue < todayStr).length;

      const jalonsAtteints = axeJalons.filter(j => j.statut === 'atteint').length;
      const jalonsEnDanger = axeJalons.filter(j => j.statut === 'en_danger' || j.statut === 'depasse').length;

      const risquesCritiques = axeRisques.filter(r => (r.score ?? 0) >= SEUILS_RISQUES.critique).length;

      const topRisquesAxe = [...axeRisques].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3);

      // Actions les plus critiques (non terminées, triées par date)
      const topActionsAxe = [...axeActions]
        .filter(a => a.statut !== 'termine')
        .sort((a, b) => a.date_fin_prevue.localeCompare(b.date_fin_prevue))
        .slice(0, 5);

      // Prochain jalon
      const prochainJalon = axeJalons
        .filter(j => j.statut !== 'atteint' && j.statut !== 'annule')
        .sort((a, b) => a.date_prevue.localeCompare(b.date_prevue))[0] ?? null;

      const meteo = deriveAxeMeteo(avancement, prevu, risquesCritiques);

      return {
        id: axeCfg.id,
        dbCode: axeCfg.dbCode,
        label: axeCfg.label,
        labelCourt: axeCfg.labelCourt,
        icon: axeCfg.icon,
        color: axeCfg.color,
        avancement,
        prevu,
        tendance,
        actionsTotal: axeActions.length,
        actionsTerminees,
        actionsEnRetard,
        jalonsTotal: axeJalons.length,
        jalonsAtteints,
        jalonsEnDanger,
        risquesActifs: axeRisques.length,
        risquesCritiques,
        topRisques: topRisquesAxe,
        topActions: topActionsAxe,
        prochainJalon,
        meteo,
      };
    });
  }, [allActions, allJalons, allRisques, avancementParAxe, pourcentageTempsEcoule]);

  // ============================================================================
  // EDITABLE STATE (localStorage-backed)
  // ============================================================================

  // Exec summary
  const autoExecSummary = useMemo(() => generateExecSummary(
    confidenceScore?.score,
    avancementGlobal,
    pourcentageTempsEcoule,
    criticalPath?.actionsNoMargin ?? 0,
    topRisques[0],
    pendingDecisions.length,
  ), [confidenceScore?.score, avancementGlobal, pourcentageTempsEcoule, criticalPath?.actionsNoMargin, topRisques, pendingDecisions]);

  const [execSummary, setExecSummaryRaw] = useState<ExecSummaryMessage[]>(() =>
    loadLS(LS_KEYS.execSummaryMessages, [])
  );
  // Use auto-generated if user hasn't customized
  const effectiveExecSummary = execSummary.length > 0 ? execSummary : autoExecSummary;
  const setExecSummary = useCallback((v: ExecSummaryMessage[]) => {
    setExecSummaryRaw(v);
    saveLS(LS_KEYS.execSummaryMessages, v);
  }, []);

  // Highlights
  const [highlights, setHighlightsRaw] = useState<HighlightsData>(() =>
    loadLS(LS_KEYS.highlights, { realisations: [], blocages: [], alertes: [] })
  );
  const setHighlights = useCallback((v: HighlightsData) => {
    setHighlightsRaw(v);
    saveLS(LS_KEYS.highlights, v);
  }, []);

  // Axe analyses
  const [axeAnalyses, setAxeAnalysesRaw] = useState<Record<string, AxeAnalysis>>(() => {
    const result: Record<string, AxeAnalysis> = {};
    AXES_V5.forEach(axe => {
      result[axe.id] = loadLS(LS_KEYS.axeAnalysis(axe.id), { soWhat: '', recommendation: '' });
    });
    return result;
  });
  const setAxeAnalysis = useCallback((axeId: string, v: AxeAnalysis) => {
    setAxeAnalysesRaw(prev => ({ ...prev, [axeId]: v }));
    saveLS(LS_KEYS.axeAnalysis(axeId), v);
  }, []);

  // Decisions
  const [decisions, setDecisionsRaw] = useState<DecisionItem[]>(() =>
    loadLS(LS_KEYS.decisions, [])
  );
  const setDecisions = useCallback((v: DecisionItem[]) => {
    setDecisionsRaw(v);
    saveLS(LS_KEYS.decisions, v);
  }, []);

  // Scenarios inputs (exposed so ScenariosSlide can recalculate with different horizons)
  const scenariosInputs: ScenarioInputs = useMemo(() => ({
    budgetSynthese, comparaisonAxes, criticalPath, joursRestants, kpis, axesData,
    allActions, allJalons,
  }), [budgetSynthese, comparaisonAxes, criticalPath, joursRestants, kpis, axesData, allActions, allJalons]);

  // Scenarios (default 1 month for backward compat)
  const { scenarios, scoreRisque } = useMemo(() => generateScenarios(scenariosInputs), [scenariosInputs]);

  // Critical path notes
  const [criticalPathNotes, setCriticalPathNotesRaw] = useState<string>(() =>
    loadLS(LS_KEYS.criticalPathNotes, '')
  );
  const setCriticalPathNotes = useCallback((v: string) => {
    setCriticalPathNotesRaw(v);
    saveLS(LS_KEYS.criticalPathNotes, v);
  }, []);

  // Loading state
  const isLoading = !kpis.projectName && allActions.length === 0;

  return {
    isLoading,
    projectName,
    openingDate,
    joursRestants,
    pourcentageTempsEcoule,
    moisCourant,
    kpis,
    avancementGlobal,
    projectionLineaire,
    confidenceScore,
    meteoGlobale,
    criticalPath,
    budgetSynthese,
    comparaisonAxes,
    syncStatus,
    syncSnapshots,
    jalonsCles,
    axesData,
    topRisques,
    pendingDecisions,
    allActions,
    allJalons,
    allRisques,
    execSummary: effectiveExecSummary,
    setExecSummary,
    highlights,
    setHighlights,
    axeAnalyses,
    setAxeAnalysis,
    decisions,
    setDecisions,
    scenarios,
    scoreRisque,
    scenariosInputs,
    criticalPathNotes,
    setCriticalPathNotes,
  };
}
