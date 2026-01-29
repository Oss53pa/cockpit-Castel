// ============================================================================
// HOOK - Agrégation des données pour le Deep Dive Mensuel V2
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
} from '@/hooks';
import { useSync } from '@/hooks/useSync';
import { JALONS_V21, ACTIONS_V21 } from '@/data/cosmosAngreRefV21';
import { REGISTRE_RISQUES_COSMOS_ANGRE, getTop10Risques } from '@/data/risquesCosmosAngre';
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
} from '@/types/deepDive';
import { AXES_MENSUEL_CONFIG } from '@/data/deepDiveMensuelTemplate';

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

// ============================================================================
// HELPERS - Calcul de météo automatique
// ============================================================================

function calculateMeteo(avancement: number, objectif: number = 100, actionsEnRetard: number = 0): MeteoNiveau {
  const ratio = avancement / objectif;
  if (ratio >= 0.95 && actionsEnRetard === 0) return 'excellent';
  if (ratio >= 0.85 && actionsEnRetard <= 1) return 'bon';
  if (ratio >= 0.70 && actionsEnRetard <= 3) return 'attention';
  if (ratio >= 0.50) return 'alerte';
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

  if (avgScore >= 4.5) return 'excellent';
  if (avgScore >= 3.5) return 'bon';
  if (avgScore >= 2.5) return 'attention';
  if (avgScore >= 1.5) return 'alerte';
  return 'critique';
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export interface UseDeepDiveMensuelDataResult {
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

export function useDeepDiveMensuelData(periodeLabel: string = ''): UseDeepDiveMensuelDataResult {
  // Hooks de données existants
  const kpis = useDashboardKPIs();
  const actionsDb = useActions();
  const jalonsDb = useJalons();
  const budgetItems = useBudget();
  const budgetSynthese = useBudgetSynthese();
  const risquesDb = useRisques();
  const syncData = useSync('cosmos-angre');

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

      // Risques filtrés par axe
      const axeRisques = risquesDb.filter(r => r.axe_impacte === dbCode);
      const risquesCritiques = axeRisques.filter(r => (r.score_actuel || r.score_initial || 0) >= 12).length;

      // Budget filtré par axe
      const axeBudgetItems = budgetItems.filter(b => b.axe === dbCode);
      const budgetPrevu = axeBudgetItems.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
      const budgetRealise = axeBudgetItems.reduce((sum, b) => sum + (b.montantRealise || 0), 0);

      // Avancement calculé
      const avancement = axeActions.length > 0
        ? Math.round(axeActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / axeActions.length)
        : 0;

      // Météo calculée
      const meteo = calculateMeteo(avancement, 100, actionsEnRetard);

      // Alerte principale (risque le plus critique ou action la plus en retard)
      let alertePrincipale: string | undefined;
      if (risquesCritiques > 0) {
        const topRisque = axeRisques.sort((a, b) => (b.score_actuel || 0) - (a.score_actuel || 0))[0];
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
  }, [actionsDb, jalonsDb, risquesDb, budgetItems]);

  const detailsAxes = useMemo((): Record<AxeType, DetailAxeData> => {
    const axeTypes: AxeType[] = ['rh', 'commercialisation', 'technique', 'budget', 'marketing', 'exploitation', 'general'];
    const result = {} as Record<AxeType, DetailAxeData>;
    const today = new Date().toISOString().split('T')[0];

    axeTypes.forEach(axe => {
      const dbCode = axeToDbCode[axe];
      const config = AXES_MENSUEL_CONFIG[axe];

      // Actions
      const axeActions = actionsDb.filter(a => a.axe === dbCode);
      const actionsEnRetard = axeActions.filter(a =>
        a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
      ).length;

      const avancement = axeActions.length > 0
        ? Math.round(axeActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / axeActions.length)
        : 0;

      // Jalons
      const axeJalons = jalonsDb.filter(j => j.axe === dbCode);

      // Risques
      const axeRisques = risquesDb.filter(r => r.axe_impacte === dbCode);

      // Budget
      const axeBudgetItems = budgetItems.filter(b => b.axe === dbCode);
      const budgetPrevu = axeBudgetItems.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
      const budgetRealise = axeBudgetItems.reduce((sum, b) => sum + (b.montantRealise || 0), 0);

      const meteo = calculateMeteo(avancement, 100, actionsEnRetard);

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
          score: r.score_actuel || r.score_initial || 0,
          niveau: (r.score_actuel || 0) >= 12 ? 'critique' :
            (r.score_actuel || 0) >= 8 ? 'majeur' :
            (r.score_actuel || 0) >= 4 ? 'modere' : 'faible',
          tendance: 'stable',
        })),
        pointsCles: [],
        focusM1: [],
      };
    });

    return result;
  }, [actionsDb, jalonsDb, risquesDb, budgetItems]);

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
          meteo: kpis.tauxOccupation >= 75 ? 'bon' : kpis.tauxOccupation >= 50 ? 'attention' : 'alerte',
          tendance: 'hausse',
        },
        {
          id: 'jalons',
          label: 'Jalons Atteints',
          valeur: jalonsAtteints,
          cible: totalJalons,
          unite: `/ ${totalJalons}`,
          meteo: (jalonsAtteints / totalJalons) >= 0.8 ? 'bon' : (jalonsAtteints / totalJalons) >= 0.5 ? 'attention' : 'alerte',
          tendance: 'stable',
        },
        {
          id: 'actions',
          label: 'Actions Terminées',
          valeur: actionsTerminees,
          cible: totalActions,
          unite: `/ ${totalActions}`,
          meteo: (actionsTerminees / totalActions) >= 0.7 ? 'bon' : (actionsTerminees / totalActions) >= 0.4 ? 'attention' : 'alerte',
          tendance: 'hausse',
        },
        {
          id: 'budget',
          label: 'Budget Consommé',
          valeur: Math.round((budgetSynthese.realise / budgetSynthese.prevu) * 100) || 0,
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
    const risquesCritiques = risquesDb.filter(r => (r.score_actuel || r.score_initial || 0) >= 12);
    risquesCritiques.slice(0, 3).forEach((r, idx) => {
      alertes.push({
        id: `alert_${idx}`,
        type: 'alerte',
        titre: r.titre,
        description: r.description || 'Risque critique à traiter en priorité',
        axe: dbCodeToAxe[r.axe_impacte || ''] || 'general',
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
      .sort((a, b) => (b.score_actuel || b.score_initial || 0) - (a.score_actuel || a.score_initial || 0))
      .slice(0, 5);

    return {
      risques: sortedRisques.map(r => ({
        id: r.id?.toString() || '',
        code: r.code || r.id?.toString() || '',
        titre: r.titre,
        description: r.description || '',
        score: r.score_actuel || r.score_initial || 0,
        scoreEvolution: 0, // TODO: calculer avec historique
        probabilite: r.probabilite || 2,
        impact: r.impact || 2,
        niveau: (r.score_actuel || 0) >= 12 ? 'critique' :
          (r.score_actuel || 0) >= 8 ? 'majeur' :
          (r.score_actuel || 0) >= 4 ? 'modere' : 'faible',
        axe: dbCodeToAxe[r.axe_impacte || ''] || 'general',
        proprietaire: r.proprietaire || 'Non assigné',
        mitigationPrincipale: r.action_mitigation || 'À définir',
        statutMitigation: 'en_cours',
        tendance: 'stable',
      })),
      scoreGlobalRisques: risquesDb.reduce((sum, r) => sum + (r.score_actuel || r.score_initial || 0), 0),
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
        code: r.code || r.id_risque || '',
        titre: r.titre,
        score: r.score_actuel || r.score_initial || 0,
        axe: dbCodeToAxe[r.axe_impacte || ''] || 'general',
        dateIdentification: r.date_identification || '',
      }));

    // Risques fermés: statut = 'ferme' (ou évaluation récente avec statut fermé)
    const fermes = risquesDb
      .filter(r => r.statut === 'ferme')
      .map(r => ({
        id: r.id?.toString() || '',
        code: r.code || r.id_risque || '',
        titre: r.titre,
        scoreFinal: r.score_actuel || r.score_initial || 0,
        axe: dbCodeToAxe[r.axe_impacte || ''] || 'general',
        dateFermeture: r.date_derniere_evaluation || '',
        motif: 'Risque traité ou mitigé',
      }));

    // Comptage par niveau
    const risquesOuverts = risquesDb.filter(r => r.statut !== 'ferme');
    const critiques = risquesOuverts.filter(r => (r.score_actuel || 0) >= 12).length;
    const majeurs = risquesOuverts.filter(r => (r.score_actuel || 0) >= 8 && (r.score_actuel || 0) < 12).length;
    const moderes = risquesOuverts.filter(r => (r.score_actuel || 0) >= 4 && (r.score_actuel || 0) < 8).length;
    const faibles = risquesOuverts.filter(r => (r.score_actuel || 0) < 4).length;

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
    const allJalons = JALONS_V21; // Utiliser les jalons officiels V21

    return {
      jalons: allJalons.map(j => {
        // Trouver le statut dans la DB
        const jalonDb = jalonsDb.find(jdb =>
          jdb.code === j.id || jdb.titre === j.titre
        );

        return {
          id: j.id,
          titre: j.titre,
          dateDebut: j.date,
          dateFin: j.date,
          avancement: jalonDb?.statut === 'atteint' ? 100 : 0,
          axe: dbCodeToAxe[j.axe] || 'general',
          dependances: j.dependances || [],
          estCritique: j.niveau === 'critique',
          statut: jalonDb?.statut === 'atteint' ? 'atteint' :
            jalonDb?.statut === 'en_danger' ? 'en_danger' :
            new Date(j.date) <= new Date() ? 'en_cours' : 'a_venir',
        };
      }),
      dateDebut: '2026-01-01',
      dateFin: '2027-02-28',
      dateActuelle: new Date().toISOString().split('T')[0],
    };
  }, [jalonsDb]);

  const courbeS = useMemo((): CourbeSData => {
    const totalBudget = budgetSynthese.prevu || 597_500_000;
    const consumed = budgetSynthese.realise || 0;
    const engaged = budgetSynthese.engage || 0;

    // Générer des points mensuels de janvier 2026 à février 2027
    const points: CourbeSData['points'] = [];
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2027-02-28');
    const today = new Date();

    let currentDate = new Date(startDate);
    let monthIndex = 0;

    while (currentDate <= endDate) {
      const isPast = currentDate <= today;
      const monthProgress = monthIndex / 14; // 14 mois total

      points.push({
        date: currentDate.toISOString().split('T')[0],
        prevu: Math.round(totalBudget * monthProgress),
        realise: isPast ? Math.round(consumed * (monthProgress / (today.getTime() - startDate.getTime()) * (endDate.getTime() - startDate.getTime()))) : 0,
        engage: isPast ? Math.round(engaged * monthProgress) : 0,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
      monthIndex++;
    }

    // Indicateurs EVM simplifiés
    const spi = consumed > 0 ? (consumed / (totalBudget * 0.3)) : 1; // Simplifié
    const cpi = consumed > 0 ? 1.05 : 1; // Simplifié

    return {
      points,
      budgetTotal: totalBudget,
      budgetConsomme: consumed,
      budgetEngage: engaged,
      spi: Math.round(spi * 100) / 100,
      cpi: Math.round(cpi * 100) / 100,
      eac: Math.round(totalBudget / cpi),
      vac: Math.round(totalBudget - (totalBudget / cpi)),
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
    isLoading: false,
    periode,
  };
}
