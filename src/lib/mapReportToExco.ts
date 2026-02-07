/**
 * Mapping functions: GeneratedReport / ExcoV5Data → Exco DB record
 * Used to save EXCO snapshots into the Journal (db.excos)
 */

import type { Exco, ProjectWeather } from '@/types/exco';
import type { ExcoV5Data } from '@/components/rapports/ExcoMensuelV5/hooks/useExcoV5Data';
import type { GeneratedReport } from '@/types/reports.types';

// ============================================================================
// SERIALIZABLE SNAPSHOT — strip functions & React hook return types
// ============================================================================

export interface ExcoV5Snapshot {
  projectName: string;
  openingDate: string;
  joursRestants: number;
  pourcentageTempsEcoule: number;
  moisCourant: string;
  avancementGlobal: number;
  projectionLineaire: number;
  meteoGlobale: string;
  jalonsCles: ExcoV5Data['jalonsCles'];
  axesData: ExcoV5Data['axesData'];
  topRisques: ExcoV5Data['topRisques'];
  pendingDecisions: ExcoV5Data['pendingDecisions'];
  execSummary: ExcoV5Data['execSummary'];
  highlights: ExcoV5Data['highlights'];
  axeAnalyses: ExcoV5Data['axeAnalyses'];
  decisions: ExcoV5Data['decisions'];
  scenarios: ExcoV5Data['scenarios'];
  scoreRisque: ExcoV5Data['scoreRisque'];
  criticalPathNotes: string;
  syncSnapshots: ExcoV5Data['syncSnapshots'];
  // Serializable subsets of hook returns
  kpis: {
    projectName: string;
    tauxOccupation: number;
    jalonsAtteints: number;
    jalonsTotal: number;
    totalActions: number;
    actionsTerminees: number;
    budgetTotal: number;
    budgetConsomme: number;
    totalRisques: number;
  };
  budgetSynthese: {
    prevu: number;
    engage: number;
    realise: number;
    tauxEngagement: number;
    tauxRealisation: number;
    ecartEngagement: number;
    ecartRealisation: number;
  };
  confidenceScore: { score: number; level: string } | null;
  criticalPath: {
    actionsNoMargin: number;
    actionsLowMargin: number;
    daysToOpening: number;
    totalCriticalActions: number;
  } | null;
  comparaisonAxes: {
    commercial: { avancement: number; actionsTotal: number; actionsTerminees: number };
    technique: { avancement: number; actionsTotal: number; actionsTerminees: number };
    ecart: number;
    estSynchronise: boolean;
  };
  syncStatus: ExcoV5Data['syncStatus'];
}

/**
 * Extract serializable snapshot from live ExcoV5Data
 */
export function extractV5Snapshot(data: ExcoV5Data): ExcoV5Snapshot {
  return {
    projectName: data.projectName,
    openingDate: data.openingDate,
    joursRestants: data.joursRestants,
    pourcentageTempsEcoule: data.pourcentageTempsEcoule,
    moisCourant: data.moisCourant,
    avancementGlobal: data.avancementGlobal,
    projectionLineaire: data.projectionLineaire,
    meteoGlobale: data.meteoGlobale,
    jalonsCles: data.jalonsCles,
    axesData: data.axesData.map(a => ({
      ...a,
      // Strip Risque/Action/Jalon full objects — keep only IDs and essential fields
      topRisques: a.topRisques.map(r => ({ ...r })),
      topActions: a.topActions.map(ac => ({ ...ac })),
      prochainJalon: a.prochainJalon ? { ...a.prochainJalon } : null,
    })),
    topRisques: data.topRisques.map(r => ({ ...r })),
    pendingDecisions: [...data.pendingDecisions],
    execSummary: [...data.execSummary],
    highlights: { ...data.highlights },
    axeAnalyses: { ...data.axeAnalyses },
    decisions: [...data.decisions],
    scenarios: [...data.scenarios],
    scoreRisque: { ...data.scoreRisque },
    criticalPathNotes: data.criticalPathNotes,
    syncSnapshots: [...data.syncSnapshots],
    kpis: {
      projectName: data.kpis.projectName,
      tauxOccupation: data.kpis.tauxOccupation,
      jalonsAtteints: data.kpis.jalonsAtteints,
      jalonsTotal: data.kpis.jalonsTotal,
      totalActions: data.kpis.totalActions,
      actionsTerminees: data.kpis.actionsTerminees,
      budgetTotal: data.kpis.budgetTotal,
      budgetConsomme: data.kpis.budgetConsomme,
      totalRisques: data.kpis.totalRisques,
    },
    budgetSynthese: {
      prevu: data.budgetSynthese.prevu,
      engage: data.budgetSynthese.engage,
      realise: data.budgetSynthese.realise,
      tauxEngagement: data.budgetSynthese.tauxEngagement,
      tauxRealisation: data.budgetSynthese.tauxRealisation,
      ecartEngagement: data.budgetSynthese.ecartEngagement,
      ecartRealisation: data.budgetSynthese.ecartRealisation,
    },
    confidenceScore: data.confidenceScore
      ? { score: data.confidenceScore.score, level: data.confidenceScore.level }
      : null,
    criticalPath: data.criticalPath
      ? {
          actionsNoMargin: data.criticalPath.actionsNoMargin,
          actionsLowMargin: data.criticalPath.actionsLowMargin,
          daysToOpening: data.criticalPath.daysToOpening,
          totalCriticalActions: data.criticalPath.totalCriticalActions,
        }
      : null,
    comparaisonAxes: {
      commercial: { ...data.comparaisonAxes.commercial },
      technique: { ...data.comparaisonAxes.technique },
      ecart: data.comparaisonAxes.ecart,
      estSynchronise: data.comparaisonAxes.estSynchronise,
    },
    syncStatus: data.syncStatus ? { ...data.syncStatus } : null,
  };
}

// ============================================================================
// MAP: météo V5 level → ProjectWeather
// ============================================================================

function meteoToWeather(meteo: string): ProjectWeather {
  switch (meteo) {
    case 'bleu':
    case 'vert':
      return 'green';
    case 'orange':
      return 'orange';
    case 'rouge':
      return 'red';
    default:
      return 'yellow';
  }
}

// ============================================================================
// MAP: GeneratedReport + V5Data → Exco DB record
// ============================================================================

export function mapGeneratedReportToExco(
  report: GeneratedReport,
  v5Data: ExcoV5Data,
  siteName: string,
): Omit<Exco, 'id'> {
  const now = new Date().toISOString();
  const snapshot = extractV5Snapshot(v5Data);
  const weather = meteoToWeather(v5Data.meteoGlobale);

  return {
    titre: report.titre,
    description: `Rapport EXCO généré le ${new Date(report.dateGeneration).toLocaleDateString('fr-FR')}`,
    projectName: v5Data.projectName,
    templateType: 'monthly',
    weather,
    kpis: {
      tauxOccupation: v5Data.kpis.tauxOccupation,
      budgetConsomme: v5Data.kpis.budgetConsomme,
      budgetTotal: v5Data.kpis.budgetTotal,
      jalonsAtteints: v5Data.kpis.jalonsAtteints,
      jalonsTotal: v5Data.kpis.jalonsTotal,
      avancementGlobal: v5Data.avancementGlobal,
    },
    designSettings: {
      primaryColor: '#1C3163',
      accentColor: '#D4AF37',
      fontFamily: 'Exo 2',
      logoPosition: 'left',
      showSlideNumbers: true,
      showDate: true,
      backgroundStyle: 'solid',
      headerStyle: 'full',
    },
    slides: [],
    decisionPoints: [],
    axesData: v5Data.axesData.map(a => ({
      axe: a.dbCode as Exco['axesData'][0]['axe'],
      actions: a.actionsTotal,
      actionsTerminees: a.actionsTerminees,
      actionsEnCours: a.actionsTotal - a.actionsTerminees - a.actionsEnRetard,
      actionsEnRetard: a.actionsEnRetard,
      jalons: a.jalonsTotal,
      jalonsAtteints: a.jalonsAtteints,
      risques: a.risquesActifs,
      risquesCritiques: a.risquesCritiques,
      budgetPrevu: 0,
      budgetRealise: 0,
      avancement: a.avancement,
    })),
    topRisks: v5Data.topRisques.map(r => ({
      id: String(r.id),
      titre: r.titre,
      description: r.description || '',
      score: r.score ?? 0,
      probabilite: r.probabilite ?? 0,
      impact: r.impact ?? 0,
      axe: (r.axe_impacte || 'general') as Exco['topRisks'][0]['axe'],
      statut: r.status,
    })),
    upcomingJalons: [],
    createdAt: now,
    updatedAt: now,
    createdBy: report.genereePar || 'Système',
    status: 'draft',

    // Journal fields
    periode: v5Data.moisCourant,
    meteoGlobale: weather,
    projet: siteName,
    auteur: report.genereePar || 'Système',

    // Snapshot & source
    v5DataSnapshot: JSON.stringify(snapshot),
    source: 'generator',
    generatedReportId: report.id,
  };
}

// ============================================================================
// MAP: V5Data → Exco DB record (save from EXCO tab directly)
// ============================================================================

export function mapV5DataToExco(
  v5Data: ExcoV5Data,
  titre: string,
  siteName: string,
): Omit<Exco, 'id'> {
  const now = new Date().toISOString();
  const snapshot = extractV5Snapshot(v5Data);
  const weather = meteoToWeather(v5Data.meteoGlobale);

  return {
    titre,
    description: `Snapshot EXCO du ${new Date().toLocaleDateString('fr-FR')}`,
    projectName: v5Data.projectName,
    templateType: 'monthly',
    weather,
    kpis: {
      tauxOccupation: v5Data.kpis.tauxOccupation,
      budgetConsomme: v5Data.kpis.budgetConsomme,
      budgetTotal: v5Data.kpis.budgetTotal,
      jalonsAtteints: v5Data.kpis.jalonsAtteints,
      jalonsTotal: v5Data.kpis.jalonsTotal,
      avancementGlobal: v5Data.avancementGlobal,
    },
    designSettings: {
      primaryColor: '#1C3163',
      accentColor: '#D4AF37',
      fontFamily: 'Exo 2',
      logoPosition: 'left',
      showSlideNumbers: true,
      showDate: true,
      backgroundStyle: 'solid',
      headerStyle: 'full',
    },
    slides: [],
    decisionPoints: [],
    axesData: v5Data.axesData.map(a => ({
      axe: a.dbCode as Exco['axesData'][0]['axe'],
      actions: a.actionsTotal,
      actionsTerminees: a.actionsTerminees,
      actionsEnCours: a.actionsTotal - a.actionsTerminees - a.actionsEnRetard,
      actionsEnRetard: a.actionsEnRetard,
      jalons: a.jalonsTotal,
      jalonsAtteints: a.jalonsAtteints,
      risques: a.risquesActifs,
      risquesCritiques: a.risquesCritiques,
      budgetPrevu: 0,
      budgetRealise: 0,
      avancement: a.avancement,
    })),
    topRisks: v5Data.topRisques.map(r => ({
      id: String(r.id),
      titre: r.titre,
      description: r.description || '',
      score: r.score ?? 0,
      probabilite: r.probabilite ?? 0,
      impact: r.impact ?? 0,
      axe: (r.axe_impacte || 'general') as Exco['topRisks'][0]['axe'],
      statut: r.status,
    })),
    upcomingJalons: [],
    createdAt: now,
    updatedAt: now,
    createdBy: 'Utilisateur',
    status: 'draft',

    // Journal fields
    periode: v5Data.moisCourant,
    meteoGlobale: weather,
    projet: siteName,
    auteur: 'Utilisateur',

    // Snapshot & source
    v5DataSnapshot: JSON.stringify(snapshot),
    source: 'exco_tab',
  };
}
