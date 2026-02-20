// ============================================================================
// HOOK - Agrégation des données pour le EXCO Mensuel V2
// ============================================================================

import { useMemo } from 'react';
import {
  useDashboardKPIs,
  useActions,
  useJalons,
  useBudget,
  useBudgetSynthese,
  useBudgetParAxe,
  useRisques,
  useAvancementParAxe,
} from '@/hooks';
// Import seuils pour calculs météo (ces configurations ne changent pas)
import { SEUILS_METEO, SEUILS_UI, PROJET_CONFIG, SEUILS_RISQUES, SEUILS_KPI_REPORT } from '@/data/constants';

// Dates du projet depuis la configuration centralisée
const PROJECT_DATES = {
  dateDebut: PROJET_CONFIG.dateDebut,
  dateFin: PROJET_CONFIG.dateFin,
};
import type {
  AxeType,
  MeteoNiveau,
  TendanceType,
  MeteoGlobaleData,
  FaitsMarquantsData,
  FaitMarquant,
  TableauBordAxeRow,
  DetailAxeData,
  Top5RisquesData,
  RisquesEvolutionData,
  DecisionArbitrageData,
  PlanActionM1Data,
  GanttSimplifiedData,
  CourbeSData,
  RecrutementTableauData,
  PipelineTableauData,
  BatimentsTableauData,
} from '@/types/exco';
import { AXES_MENSUEL_CONFIG } from '@/data/excoMensuelTemplate';

// ============================================================================
// MAPPING AXES
// ============================================================================

const axeToDbCode: Record<AxeType, string> = {
  rh: 'axe1_rh',
  commercialisation: 'axe2_commercial',
  technique: 'axe3_technique',
  budget: 'axe4_budget',
  marketing: 'axe5_marketing',
  exploitation: 'axe6_exploitation',
  general: 'general',
};

const dbCodeToAxe: Record<string, AxeType> = {
  'axe1_rh': 'rh',
  'axe2_commercial': 'commercialisation',
  'axe3_technique': 'technique',
  'axe4_budget': 'budget',
  'axe5_marketing': 'marketing',
  'axe6_exploitation': 'exploitation',
  'general': 'general',
  'Gouvernance': 'general',
  'Commercial': 'commercialisation',
  'Technique': 'technique',
  'RH': 'rh',
  'Marketing': 'marketing',
  'Exploitation': 'exploitation',
  'Tous': 'general',
};

// Mapping des catégories de risques vers les axes
// Note: Les risques dans la DB de production utilisent "categorie" au lieu de "axe_impacte"
const risqueCategorieToDbCode: Record<string, string> = {
  'planning': 'axe3_technique',
  'financier': 'axe4_budget',
  'technique': 'axe3_technique',
  'securite': 'axe6_exploitation',
  'commercial': 'axe2_commercial',
  'rh': 'axe1_rh',
  'marketing': 'axe5_marketing',
  'exploitation': 'axe6_exploitation',
};

// Helper pour obtenir le code axe d'un risque
// Utilise axe_impacte si présent, sinon mappe la catégorie
function getRisqueAxeCode(risque: any): string {
  if (risque.axe_impacte) {
    return risque.axe_impacte;
  }
  if (risque.categorie) {
    return risqueCategorieToDbCode[risque.categorie] || 'general';
  }
  return 'general';
}

// ============================================================================
// HELPERS - Calcul de météo automatique
// ============================================================================

function calculateMeteo(avancement: number, objectif: number = 100, actionsEnRetard: number = 0): MeteoNiveau {
  const ratio = avancement / objectif;
  // Utilise les seuils configurés dans constants.ts
  if (ratio >= SEUILS_METEO.excellent.completion && actionsEnRetard <= SEUILS_METEO.excellent.actionsEnRetardMax) return 'excellent';
  if (ratio >= SEUILS_METEO.bon.completion && actionsEnRetard <= SEUILS_METEO.bon.actionsEnRetardMax) return 'bon';
  if (ratio >= SEUILS_METEO.attention.completion && actionsEnRetard <= SEUILS_METEO.attention.actionsEnRetardMax) return 'attention';
  if (ratio >= SEUILS_METEO.alerte.completion) return 'alerte';
  return 'critique';
}

function calculateTendance(currentValue: number, previousValue: number): TendanceType {
  const diff = currentValue - previousValue;
  if (diff > 2) return 'hausse';
  if (diff < -2) return 'baisse';
  return 'stable';
}

function calculateGlobalMeteo(axesMeteos: MeteoNiveau[]): MeteoNiveau {
  const scores: Record<MeteoNiveau, number> = {
    excellent: 5,
    bon: 4,
    attention: 3,
    alerte: 2,
    critique: 1,
  };
  const avgScore = axesMeteos.reduce((sum, m) => sum + scores[m], 0) / axesMeteos.length;

  if (avgScore >= SEUILS_KPI_REPORT.globalExcellent) return 'excellent';
  if (avgScore >= SEUILS_KPI_REPORT.globalBon) return 'bon';
  if (avgScore >= SEUILS_KPI_REPORT.globalAttention) return 'attention';
  if (avgScore >= SEUILS_KPI_REPORT.globalAlerte) return 'alerte';
  return 'critique';
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export interface UseExcoMensuelDataResult {
  // Section 1
  meteoGlobale: MeteoGlobaleData;
  faitsMarquants: FaitsMarquantsData;

  // Section 2
  tableauBordAxes: TableauBordAxeRow[];
  detailsAxes: Record<AxeType, DetailAxeData>;

  // Section 3
  top5Risques: Top5RisquesData;
  risquesEvolution: RisquesEvolutionData;

  // Section 5
  planActionM1: PlanActionM1Data;

  // Section 6
  gantt: GanttSimplifiedData;
  courbeS: CourbeSData;

  // Helpers
  isLoading: boolean;
  periode: string;
}

export function useExcoMensuelData(periodeLabel: string = ''): UseExcoMensuelDataResult {
  // Hooks de données existants
  // Note: useLiveQuery retourne undefined pendant le chargement initial
  const kpis = useDashboardKPIs();
  const actionsDb = useActions();
  const jalonsDb = useJalons();
  const budgetItems = useBudget();
  const budgetSynthese = useBudgetSynthese();
  const risquesDb = useRisques();

  // IMPORTANT: Utiliser les mêmes données que le dashboard pour l'avancement par axe
  const avancementParAxe = useAvancementParAxe();

  // Détection de l'état de chargement
  // Note: Les hooks utilisent ?? [] donc ils retournent toujours un tableau
  // On considère que les données ne sont pas prêtes si TOUS les tableaux sont vides
  // ET que les KPIs montrent des totaux à 0 (la base n'est pas encore initialisée)
  const hasNoData = actionsDb.length === 0 && jalonsDb.length === 0 && risquesDb.length === 0;
  const kpisNotReady = kpis.totalActions === 0 && kpis.totalJalons === 0 && kpis.totalRisques === 0;

  // isLoading est true seulement si on n'a aucune donnée ET les KPIs ne sont pas prêts
  // Cela évite d'afficher "chargement" si la base est simplement vide
  const isLoading = hasNoData && kpisNotReady && kpis.projectName === '';

  // Période actuelle
  const periode = useMemo(() => {
    if (periodeLabel) return periodeLabel;
    const now = new Date();
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  }, [periodeLabel]);

  // ============================================================================
  // SECTION 2 - Tableau de Bord des Axes + Détails
  // ============================================================================

  const tableauBordAxes = useMemo((): TableauBordAxeRow[] => {
    const axeTypes: AxeType[] = ['rh', 'commercialisation', 'technique', 'budget', 'marketing', 'exploitation'];
    const today = new Date().toISOString().split('T')[0];

    // Mapping des codes DB vers les données du dashboard
    const dbCodeToAvancement: Record<string, number> = {};
    avancementParAxe.forEach(a => {
      dbCodeToAvancement[a.axe] = Math.round(a.avancement);
    });

    return axeTypes.map(axe => {
      const dbCode = axeToDbCode[axe];
      const config = AXES_MENSUEL_CONFIG[axe];

      // Actions filtrées par axe
      const axeActions = actionsDb.filter(a => a.axe === dbCode);
      const actionsTerminees = axeActions.filter(a => a.statut === 'termine').length;
      const actionsEnCours = axeActions.filter(a => a.statut === 'en_cours').length;
      const actionsEnRetard = axeActions.filter(a =>
        a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
      ).length;

      // Jalons filtrés par axe
      const axeJalons = jalonsDb.filter(j => j.axe === dbCode);
      const jalonsAtteints = axeJalons.filter(j => j.statut === 'atteint').length;

      // Risques filtrés par axe (utilise axe_impacte ou categorie)
      const axeRisques = risquesDb.filter(r => getRisqueAxeCode(r) === dbCode);
      const risquesCritiques = axeRisques.filter(r => (r.score_actuel || r.score_initial || r.score || 0) >= SEUILS_RISQUES.critique).length;

      // Budget filtré par axe
      const axeBudgetItems = budgetItems.filter(b => b.axe === dbCode);
      const budgetPrevu = axeBudgetItems.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
      const budgetRealise = axeBudgetItems.reduce((sum, b) => sum + (b.montantRealise || 0), 0);

      // IMPORTANT: Utiliser l'avancement du dashboard (useAvancementParAxe) qui est correct
      const avancement = dbCodeToAvancement[dbCode] ?? 0;

      // Météo calculée
      const meteo = calculateMeteo(avancement, 100, actionsEnRetard);

      // Alerte principale (risque le plus critique ou action la plus en retard)
      let alertePrincipale: string | undefined;
      if (risquesCritiques > 0) {
        const topRisque = axeRisques.sort((a, b) => (b.score_actuel || b.score || 0) - (a.score_actuel || a.score || 0))[0];
        if (topRisque) alertePrincipale = topRisque.titre;
      } else if (actionsEnRetard > 0) {
        alertePrincipale = `${actionsEnRetard} action(s) en retard`;
      }

      return {
        axe,
        label: config.label,
        color: config.color,
        meteo,
        avancement,
        jalonsAtteints,
        jalonsTotal: axeJalons.length,
        actionsEnCours,
        actionsEnRetard,
        risquesCritiques,
        budgetConsomme: budgetRealise,
        budgetPrevu,
        tendance: 'stable' as TendanceType, // TODO: calculer avec données historiques
        alertePrincipale,
      };
    });
  }, [actionsDb, jalonsDb, risquesDb, budgetItems, avancementParAxe]);

  const detailsAxes = useMemo((): Record<AxeType, DetailAxeData> => {
    const axeTypes: AxeType[] = ['rh', 'commercialisation', 'technique', 'budget', 'marketing', 'exploitation', 'general'];
    const result = {} as Record<AxeType, DetailAxeData>;
    const today = new Date().toISOString().split('T')[0];

    // Mapping des codes DB vers les données du dashboard
    const dbCodeToAvancement: Record<string, number> = {};
    avancementParAxe.forEach(a => {
      dbCodeToAvancement[a.axe] = Math.round(a.avancement);
    });

    axeTypes.forEach(axe => {
      const dbCode = axeToDbCode[axe];
      const config = AXES_MENSUEL_CONFIG[axe];

      // Actions
      const axeActions = actionsDb.filter(a => a.axe === dbCode);
      const actionsEnRetard = axeActions.filter(a =>
        a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
      ).length;

      // IMPORTANT: Utiliser l'avancement du dashboard
      const avancement = dbCodeToAvancement[dbCode] ?? 0;

      // Jalons
      const axeJalons = jalonsDb.filter(j => j.axe === dbCode);

      // Risques (utilise axe_impacte ou categorie)
      const axeRisques = risquesDb.filter(r => getRisqueAxeCode(r) === dbCode);

      // Budget
      const axeBudgetItems = budgetItems.filter(b => b.axe === dbCode);
      const budgetPrevu = axeBudgetItems.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
      const budgetRealise = axeBudgetItems.reduce((sum, b) => sum + (b.montantRealise || 0), 0);

      const meteo = calculateMeteo(avancement, 100, actionsEnRetard);

      // Consolider les points d'attention des actions de cet axe
      const consolidatedPointsAttention = axeActions
        .filter(a => (a as any).points_attention && (a as any).points_attention.length > 0)
        .flatMap(a => ((a as any).points_attention || []).map((pa: any) => ({
          id: pa.id,
          sujet: pa.sujet,
          responsableNom: pa.responsableNoms?.join(', ') || pa.responsableNom || '',
          actionTitre: a.titre,
          actionId: a.id?.toString() || '',
          dateCreation: pa.dateCreation,
        })));

      // Consolider les décisions attendues des actions de cet axe
      const consolidatedDecisionsAttendues = axeActions
        .filter(a => (a as any).decisions_attendues && (a as any).decisions_attendues.length > 0)
        .flatMap(a => ((a as any).decisions_attendues || []).map((da: any) => ({
          id: da.id,
          sujet: da.sujet,
          actionTitre: a.titre,
          actionId: a.id?.toString() || '',
          dateCreation: da.dateCreation,
        })));

      result[axe] = {
        axe,
        label: config.label,
        color: config.color,
        meteo,
        avancement,
        tendance: 'stable',
        jalons: axeJalons.map(j => ({
          id: j.id?.toString() || '',
          titre: j.titre,
          date: j.date_prevue,
          statut: j.statut as 'atteint' | 'en_cours' | 'a_venir' | 'en_danger' | 'depasse',
          responsable: j.responsable,
        })),
        actions: axeActions.map(a => ({
          id: a.id?.toString() || '',
          titre: a.titre,
          statut: (a.statut === 'termine' ? 'termine' :
            a.statut === 'en_cours' ? 'en_cours' :
            a.date_fin_prevue && a.date_fin_prevue < today ? 'en_retard' : 'planifie') as 'termine' | 'en_cours' | 'planifie' | 'en_retard',
          avancement: a.avancement || 0,
          dateFin: a.date_fin_prevue || '',
          responsable: a.responsable,
        })),
        budget: {
          prevu: budgetPrevu,
          realise: budgetRealise,
          ecart: budgetPrevu - budgetRealise,
          pourcentage: budgetPrevu > 0 ? Math.round((budgetRealise / budgetPrevu) * 100) : 0,
        },
        risques: axeRisques.map(r => ({
          id: r.id?.toString() || '',
          titre: r.titre,
          score: r.score_actuel || r.score_initial || r.score || 0,
          niveau: (r.score_actuel || r.score || 0) >= SEUILS_RISQUES.critique ? 'critique' :
            (r.score_actuel || r.score || 0) >= SEUILS_RISQUES.majeur ? 'majeur' :
            (r.score_actuel || r.score || 0) >= SEUILS_RISQUES.modere ? 'modere' : 'faible',
          tendance: 'stable',
        })),
        pointsCles: [],
        focusM1: [],
        pointsAttention: consolidatedPointsAttention,
        decisionsAttendues: consolidatedDecisionsAttendues,
      };
    });

    return result;
  }, [actionsDb, jalonsDb, risquesDb, budgetItems, avancementParAxe]);

  // ============================================================================
  // SECTION 1 - Météo Globale + Faits Marquants
  // ============================================================================

  const meteoGlobale = useMemo((): MeteoGlobaleData => {
    const axesMeteos = tableauBordAxes.map(a => a.meteo);
    const globalMeteo = calculateGlobalMeteo(axesMeteos);

    const totalJalons = jalonsDb.length;
    const jalonsAtteints = jalonsDb.filter(j => j.statut === 'atteint').length;
    const totalActions = actionsDb.length;
    const actionsTerminees = actionsDb.filter(a => a.statut === 'termine').length;

    return {
      meteoGlobale: globalMeteo,
      kpis: [
        {
          id: 'occupation',
          label: 'Taux Commercialisation',
          valeur: kpis.tauxOccupation || 0,
          cible: 75,
          unite: '%',
          meteo: kpis.tauxOccupation >= SEUILS_KPI_REPORT.occupationBon ? 'bon' : kpis.tauxOccupation >= SEUILS_KPI_REPORT.occupationAttention ? 'attention' : 'alerte',
          tendance: 'hausse',
        },
        {
          id: 'jalons',
          label: 'Jalons Atteints',
          valeur: jalonsAtteints,
          cible: totalJalons,
          unite: `/ ${totalJalons}`,
          meteo: (jalonsAtteints / totalJalons) >= SEUILS_KPI_REPORT.jalonsBonRatio ? 'bon' : (jalonsAtteints / totalJalons) >= SEUILS_KPI_REPORT.jalonsAttentionRatio ? 'attention' : 'alerte',
          tendance: 'stable',
        },
        {
          id: 'actions',
          label: 'Actions Terminées',
          valeur: actionsTerminees,
          cible: totalActions,
          unite: `/ ${totalActions}`,
          meteo: (actionsTerminees / totalActions) >= SEUILS_KPI_REPORT.actionsBonRatio ? 'bon' : (actionsTerminees / totalActions) >= SEUILS_KPI_REPORT.actionsAttentionRatio ? 'attention' : 'alerte',
          tendance: 'hausse',
        },
        {
          id: 'budget',
          label: 'Budget Consommé',
          valeur: budgetSynthese.prevu > 0 ? Math.min(Math.round((budgetSynthese.realise / budgetSynthese.prevu) * 100), 200) : 0,
          cible: 100,
          unite: '%',
          meteo: 'bon',
          tendance: 'stable',
        },
      ],
      resumeExecutif: `Période ${periode}: Le projet avance avec ${jalonsAtteints}/${totalJalons} jalons atteints et ${actionsTerminees}/${totalActions} actions terminées.`,
      periode,
    };
  }, [tableauBordAxes, kpis, jalonsDb, actionsDb, budgetSynthese, periode]);

  const faitsMarquants = useMemo((): FaitsMarquantsData => {
    const realisations: FaitMarquant[] = [];
    const attentions: FaitMarquant[] = [];
    const alertes: FaitMarquant[] = [];

    // Jalons atteints récemment → Réalisations
    const jalonsAtteints = jalonsDb.filter(j => j.statut === 'atteint');
    jalonsAtteints.slice(0, 3).forEach((j, idx) => {
      realisations.push({
        id: `real_${idx}`,
        type: 'realisation',
        titre: `Jalon atteint: ${j.titre}`,
        description: `Le jalon "${j.titre}" a été atteint dans les délais.`,
        axe: dbCodeToAxe[j.axe] || 'general',
        date: j.date_prevue,
        impact: 'positif',
      });
    });

    // Jalons en approche → Attentions
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const jalonsEnApproche = jalonsDb.filter(j =>
      j.statut !== 'atteint' &&
      new Date(j.date_prevue) <= in30Days &&
      new Date(j.date_prevue) >= today
    );
    jalonsEnApproche.slice(0, 3).forEach((j, idx) => {
      attentions.push({
        id: `att_${idx}`,
        type: 'attention',
        titre: `Jalon à surveiller: ${j.titre}`,
        description: `Échéance le ${new Date(j.date_prevue).toLocaleDateString('fr-FR')}`,
        axe: dbCodeToAxe[j.axe] || 'general',
        date: j.date_prevue,
        impact: 'neutre',
      });
    });

    // Risques critiques → Alertes
    const risquesCritiques = risquesDb.filter(r => (r.score_actuel || r.score_initial || r.score || 0) >= 16);
    risquesCritiques.slice(0, 3).forEach((r, idx) => {
      alertes.push({
        id: `alert_${idx}`,
        type: 'alerte',
        titre: r.titre,
        description: r.description || 'Risque critique à traiter en priorité',
        axe: dbCodeToAxe[getRisqueAxeCode(r)] || 'general',
        impact: 'negatif',
      });
    });

    return {
      realisations,
      attentions,
      alertes,
      periode,
    };
  }, [jalonsDb, risquesDb, periode]);

  // ============================================================================
  // SECTION 3 - Risques
  // ============================================================================

  const top5Risques = useMemo((): Top5RisquesData => {
    // Utiliser les données temps réel de la DB
    const sortedRisques = [...risquesDb]
      .sort((a, b) => (b.score_actuel || b.score_initial || b.score || 0) - (a.score_actuel || a.score_initial || a.score || 0))
      .slice(0, 5);

    return {
      risques: sortedRisques.map(r => ({
        id: r.id?.toString() || '',
        code: r.id_risque || r.id?.toString() || '',
        titre: r.titre,
        description: r.description || '',
        score: r.score_actuel || r.score_initial || r.score || 0,
        scoreEvolution: 0, // TODO: calculer avec historique
        probabilite: r.probabilite || 2,
        impact: r.impact || 2,
        niveau: (r.score_actuel || r.score || 0) >= 16 ? 'critique' :
          (r.score_actuel || r.score || 0) >= 10 ? 'majeur' :
          (r.score_actuel || r.score || 0) >= 5 ? 'modere' : 'faible',
        axe: dbCodeToAxe[getRisqueAxeCode(r)] || 'general',
        proprietaire: r.proprietaire || 'Non assigné',
        mitigationPrincipale: r.action_mitigation || 'À définir',
        statutMitigation: 'en_cours',
        tendance: 'stable',
      })),
      scoreGlobalRisques: risquesDb.reduce((sum, r) => sum + (r.score_actuel || r.score_initial || r.score || 0), 0),
      tendanceGlobale: 'stable',
    };
  }, [risquesDb]);

  const risquesEvolution = useMemo((): RisquesEvolutionData => {
    // Période actuelle (mois en cours)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Risques nouveaux: identifiés ce mois
    const nouveaux = risquesDb
      .filter(r => {
        const dateIdent = r.date_identification ? new Date(r.date_identification) : null;
        return dateIdent && dateIdent >= startOfMonth && dateIdent <= endOfMonth;
      })
      .map(r => ({
        id: r.id?.toString() || '',
        code: r.id_risque || '',
        titre: r.titre,
        score: r.score_actuel || r.score_initial || r.score || 0,
        axe: dbCodeToAxe[getRisqueAxeCode(r)] || 'general',
        dateIdentification: r.date_identification || '',
      }));

    // Risques fermés: statut = 'ferme' (ou évaluation récente avec statut fermé)
    const fermes = risquesDb
      .filter(r => r.statut === 'ferme')
      .map(r => ({
        id: r.id?.toString() || '',
        code: r.id_risque || '',
        titre: r.titre,
        scoreFinal: r.score_actuel || r.score_initial || r.score || 0,
        axe: dbCodeToAxe[getRisqueAxeCode(r)] || 'general',
        dateFermeture: r.date_derniere_evaluation || '',
        motif: 'Risque traité ou mitigé',
      }));

    // Comptage par niveau
    const risquesOuverts = risquesDb.filter(r => r.statut !== 'ferme');
    const critiques = risquesOuverts.filter(r => (r.score_actuel || r.score || 0) >= SEUILS_RISQUES.critique).length;
    const majeurs = risquesOuverts.filter(r => (r.score_actuel || r.score || 0) >= 10 && (r.score_actuel || r.score || 0) < 16).length;
    const moderes = risquesOuverts.filter(r => (r.score_actuel || r.score || 0) >= 5 && (r.score_actuel || r.score || 0) < 10).length;
    const faibles = risquesOuverts.filter(r => (r.score_actuel || r.score || 0) < 5).length;

    return {
      nouveaux,
      fermes,
      evolutionParNiveau: [
        { niveau: 'critique', moisPrecedent: critiques, moisActuel: critiques, evolution: 0 },
        { niveau: 'majeur', moisPrecedent: majeurs, moisActuel: majeurs, evolution: 0 },
        { niveau: 'modere', moisPrecedent: moderes, moisActuel: moderes, evolution: 0 },
        { niveau: 'faible', moisPrecedent: faibles, moisActuel: faibles, evolution: 0 },
      ],
    };
  }, [risquesDb]);

  // ============================================================================
  // SECTION 5 - Plan Action M+1
  // ============================================================================

  const planActionM1 = useMemo((): PlanActionM1Data => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    // Actions prioritaires M+1
    const actionsM1 = actionsDb
      .filter(a =>
        a.statut !== 'termine' &&
        a.date_fin_prevue &&
        new Date(a.date_fin_prevue) <= endNextMonth
      )
      .sort((a, b) => {
        const priorityOrder = ['critique', 'haute', 'moyenne', 'basse'];
        return priorityOrder.indexOf(a.priorite || 'moyenne') - priorityOrder.indexOf(b.priorite || 'moyenne');
      })
      .slice(0, 10);

    // Jalons M+1
    const jalonsM1 = jalonsDb
      .filter(j =>
        j.statut !== 'atteint' &&
        new Date(j.date_prevue) >= nextMonth &&
        new Date(j.date_prevue) <= endNextMonth
      );

    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const periodeM1 = `${months[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;

    return {
      actionsPrioritaires: actionsM1.map((a, idx) => ({
        id: a.id?.toString() || '',
        numero: idx + 1,
        action: a.titre,
        axe: dbCodeToAxe[a.axe] || 'general',
        responsable: a.responsable || 'Non assigné',
        dateLimite: a.date_fin_prevue || '',
        priorite: (a.priorite === 'critique' || a.priorite === 'haute') ? a.priorite as 'critique' | 'haute' : 'moyenne',
        livrables: [],
      })),
      jalonsM1: jalonsM1.map(j => ({
        id: j.id?.toString() || '',
        jalonId: j.code || '',
        titre: j.titre,
        date: j.date_prevue,
        axe: dbCodeToAxe[j.axe] || 'general',
        responsable: j.responsable || 'Non assigné',
        criteres: [],
        statut: j.statut === 'en_danger' ? 'en_danger' : j.statut === 'en_approche' ? 'a_surveiller' : 'on_track',
        actionsRequises: [],
      })),
      focusStrategique: `Priorités ${periodeM1}: Atteindre les ${jalonsM1.length} jalons planifiés et compléter les ${actionsM1.length} actions prioritaires.`,
      periode: periodeM1,
    };
  }, [actionsDb, jalonsDb]);

  // ============================================================================
  // SECTION 6 - Annexes
  // ============================================================================

  const gantt = useMemo((): GanttSimplifiedData => {
    // Utilise les jalons de la base de données au lieu des données hardcodées
    return {
      jalons: jalonsDb.map(j => ({
        id: j.code || j.id?.toString() || '',
        titre: j.titre,
        dateDebut: j.date_debut_prevue || j.date_prevue || '',
        dateFin: j.date_prevue || '',
        avancement: j.statut === 'atteint' ? 100 : 0,
        axe: dbCodeToAxe[j.axe] || 'general',
        dependances: [],
        estCritique: j.criticite === 'critique',
        statut: j.statut === 'atteint' ? 'atteint' :
          j.statut === 'en_danger' || j.statut === 'depasse' ? 'en_danger' :
          j.statut === 'en_cours' || j.statut === 'en_approche' ? 'en_cours' : 'a_venir',
      })),
      // Dates depuis la configuration centralisée
      dateDebut: PROJECT_DATES.dateDebut,
      dateFin: PROJECT_DATES.dateFin,
      dateActuelle: new Date().toISOString().split('T')[0],
    };
  }, [jalonsDb]);

  const courbeS = useMemo((): CourbeSData => {
    // Utiliser le budget réel de la DB, sans fallback hardcodé
    const totalBudget = budgetSynthese.prevu || 0;
    const consumed = budgetSynthese.realise || 0;
    const engaged = budgetSynthese.engage || 0;

    // Générer des points mensuels depuis les dates de la configuration
    const points: CourbeSData['points'] = [];
    const startDate = new Date(PROJECT_DATES.dateDebut);
    const endDate = new Date(PROJECT_DATES.dateFin);
    const today = new Date();

    // Calculer le nombre total de mois
    const totalMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    const currentDate = new Date(startDate);
    let monthIndex = 0;

    while (currentDate <= endDate) {
      const isPast = currentDate <= today;
      const monthProgress = totalMonths > 0 ? monthIndex / totalMonths : 0;

      points.push({
        date: currentDate.toISOString().split('T')[0],
        prevu: Math.round(totalBudget * monthProgress),
        realise: isPast && totalBudget > 0 ? Math.round(consumed * monthProgress) : 0,
        engage: isPast && totalBudget > 0 ? Math.round(engaged * monthProgress) : 0,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
      monthIndex++;
    }

    // Indicateurs EVM calculés dynamiquement
    // SPI = Valeur Acquise / Valeur Planifiée (simplifié: réalisé / prévu à date)
    const plannedToDate = totalBudget > 0 ? totalBudget * (monthIndex / totalMonths) : 0;
    const spi = plannedToDate > 0 ? consumed / plannedToDate : 1;
    // CPI = Valeur Acquise / Coût Réel (simplifié: on suppose efficacité à 1 si pas de données)
    const cpi = consumed > 0 ? (engaged > 0 ? consumed / engaged : 1) : 1;

    return {
      points,
      budgetTotal: totalBudget,
      budgetConsomme: consumed,
      budgetEngage: engaged,
      spi: Math.round(spi * 100) / 100,
      cpi: Math.round(cpi * 100) / 100,
      eac: cpi > 0 ? Math.round(totalBudget / cpi) : totalBudget,
      vac: cpi > 0 ? Math.round(totalBudget - (totalBudget / cpi)) : 0,
    };
  }, [budgetSynthese]);

  return {
    meteoGlobale,
    faitsMarquants,
    tableauBordAxes,
    detailsAxes,
    top5Risques,
    risquesEvolution,
    planActionM1,
    gantt,
    courbeS,
    isLoading,
    periode,
  };
}
