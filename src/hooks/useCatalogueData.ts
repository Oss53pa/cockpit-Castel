// ============================================================================
// CATALOGUE DYNAMIQUE - Hook pour générer les graphiques et tableaux
// basés sur les données réelles du projet Cosmos Angré
// ============================================================================

import { useMemo } from 'react';
import {
  useDashboardKPIs,
  useActions,
  useJalons,
  useBudget,
  useBudgetSynthese,
  useBudgetParAxe,
  useBudgetParCategorie,
  useRisques,
  useAlertes,
} from '@/hooks';
import { useSync } from '@/hooks/useSync';
import {
  AXE_LABELS,
  ACTION_STATUS_LABELS,
  PRIORITE_LABELS,
  JALON_STATUS_LABELS,
  RISQUE_CATEGORY_LABELS,
  BUDGET_CATEGORY_LABELS,
} from '@/types';
import type { ChartTemplate, TableTemplate, KPIDefinition, ChartCategory, TableCategory } from '@/types/reportStudio';

// ============================================================================
// COULEURS DU THEME
// ============================================================================

const THEME_COLORS = {
  primary: '#1C3163',
  secondary: '#D4AF37',
  accent: '#10b981',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899',
  gray: '#6b7280',
};

const CHART_COLORS = [
  '#1C3163', '#D4AF37', '#10b981', '#8b5cf6', '#f97316',
  '#ec4899', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
];

const AXE_COLORS: Record<string, string> = {
  axe1_rh: '#EF4444',
  axe2_commercial: '#3B82F6',
  axe3_technique: '#8B5CF6',
  axe4_budget: '#F59E0B',
  axe5_marketing: '#EC4899',
  axe6_exploitation: '#10B981',
};

// ============================================================================
// TYPES
// ============================================================================

export interface CatalogueData {
  charts: ChartTemplate[];
  tables: TableTemplate[];
  kpis: KPIDefinition[];
  isLoading: boolean;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useCatalogueData(): CatalogueData {
  const kpis = useDashboardKPIs();
  const actions = useActions();
  const jalons = useJalons();
  const budgetItems = useBudget();
  const budgetSynthese = useBudgetSynthese();
  const budgetParAxe = useBudgetParAxe();
  const budgetParCategorie = useBudgetParCategorie();
  const risques = useRisques();
  const alertes = useAlertes();
  const syncData = useSync(1, 'cosmos-angre');

  // ============================================================================
  // GRAPHIQUES DYNAMIQUES
  // ============================================================================

  const charts = useMemo((): ChartTemplate[] => {
    const result: ChartTemplate[] = [];

    // 1. Actions par statut (Pie)
    const actionsByStatus = {
      'À faire': actions.filter(a => a.statut === 'a_faire').length,
      'En cours': actions.filter(a => a.statut === 'en_cours').length,
      'Terminées': actions.filter(a => a.statut === 'termine').length,
      'Bloquées': actions.filter(a => a.statut === 'bloque').length,
    };

    result.push({
      id: 'chart-actions-statut',
      name: 'Actions par Statut',
      description: `Répartition des ${actions.length} actions par statut`,
      category: 'projet' as ChartCategory,
      chartType: 'pie',
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'FLASH_PROJET', 'AVANCEMENT_PROJET'],
      dataSource: { type: 'computed', refreshable: true },
      data: {
        labels: Object.keys(actionsByStatus),
        datasets: [{
          label: 'Actions',
          data: Object.values(actionsByStatus),
          backgroundColor: [THEME_COLORS.info, THEME_COLORS.warning, THEME_COLORS.success, THEME_COLORS.error],
        }],
      },
      config: {
        title: 'Répartition des Actions',
        subtitle: `Total: ${actions.length} actions`,
        legend: { show: true, position: 'right' },
        showGrid: false,
      },
    });

    // 2. Actions par axe (Bar)
    const axes = [...new Set(actions.map(a => a.axe))];
    const actionsByAxe = axes.map(axe => ({
      axe,
      label: AXE_LABELS[axe] || axe,
      total: actions.filter(a => a.axe === axe).length,
      terminees: actions.filter(a => a.axe === axe && a.statut === 'termine').length,
    }));

    result.push({
      id: 'chart-actions-axe',
      name: 'Actions par Axe',
      description: 'Avancement des actions par axe stratégique',
      category: 'projet' as ChartCategory,
      chartType: 'bar',
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'AVANCEMENT_PROJET'],
      dataSource: { type: 'computed', refreshable: true },
      data: {
        labels: actionsByAxe.map(a => a.label),
        datasets: [
          {
            label: 'Total',
            data: actionsByAxe.map(a => a.total),
            backgroundColor: THEME_COLORS.gray,
          },
          {
            label: 'Terminées',
            data: actionsByAxe.map(a => a.terminees),
            backgroundColor: THEME_COLORS.success,
          },
        ],
      },
      config: {
        title: 'Actions par Axe Stratégique',
        subtitle: 'Total vs Terminées',
        legend: { show: true, position: 'top' },
        xAxis: { label: 'Axe' },
        yAxis: { label: 'Nombre' },
        showGrid: true,
      },
    });

    // 3. Avancement moyen par axe (Horizontal Bar)
    const avgProgressByAxe = axes.map(axe => {
      const axeActions = actions.filter(a => a.axe === axe);
      const avg = axeActions.length > 0
        ? Math.round(axeActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / axeActions.length)
        : 0;
      return { axe, label: AXE_LABELS[axe] || axe, avancement: avg };
    });

    result.push({
      id: 'chart-avancement-axe',
      name: 'Avancement par Axe',
      description: 'Progression moyenne des actions par axe',
      category: 'projet' as ChartCategory,
      chartType: 'horizontal_bar',
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'AVANCEMENT_PROJET', 'FLASH_PROJET'],
      dataSource: { type: 'computed', refreshable: true },
      data: {
        labels: avgProgressByAxe.map(a => a.label),
        datasets: [{
          label: 'Avancement (%)',
          data: avgProgressByAxe.map(a => a.avancement),
          backgroundColor: avgProgressByAxe.map(a => AXE_COLORS[a.axe] || THEME_COLORS.primary),
        }],
      },
      config: {
        title: 'Avancement Moyen par Axe',
        subtitle: 'Progression en %',
        showGrid: true,
      },
    });

    // 4. Jalons par statut (Donut)
    const jalonsByStatus = {
      'Atteints': jalons.filter(j => j.statut === 'atteint').length,
      'En cours': jalons.filter(j => j.statut === 'en_cours').length,
      'En danger': jalons.filter(j => j.statut === 'en_danger').length,
      'Dépassés': jalons.filter(j => j.statut === 'depasse').length,
      'À venir': jalons.filter(j => j.statut === 'a_venir' || j.statut === 'planifie').length,
    };

    result.push({
      id: 'chart-jalons-statut',
      name: 'Jalons par Statut',
      description: `État des ${jalons.length} jalons du projet`,
      category: 'projet' as ChartCategory,
      chartType: 'donut',
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'FLASH_PROJET', 'AVANCEMENT_PROJET'],
      dataSource: { type: 'computed', refreshable: true },
      data: {
        labels: Object.keys(jalonsByStatus),
        datasets: [{
          label: 'Jalons',
          data: Object.values(jalonsByStatus),
          backgroundColor: [THEME_COLORS.success, THEME_COLORS.info, THEME_COLORS.warning, THEME_COLORS.error, THEME_COLORS.gray],
        }],
      },
      config: {
        title: 'Statut des Jalons',
        subtitle: `Total: ${jalons.length} jalons`,
        legend: { show: true, position: 'right' },
        showGrid: false,
      },
    });

    // 5. Budget par catégorie (Pie)
    const budgetByCat = Object.entries(budgetParCategorie).map(([cat, values]) => ({
      categorie: BUDGET_CATEGORY_LABELS[cat as keyof typeof BUDGET_CATEGORY_LABELS] || cat,
      prevu: values.prevu,
      realise: values.realise,
    })).filter(b => b.prevu > 0);

    if (budgetByCat.length > 0) {
      result.push({
        id: 'chart-budget-categorie',
        name: 'Budget par Catégorie',
        description: 'Répartition du budget prévu par catégorie',
        category: 'financier' as ChartCategory,
        chartType: 'pie',
        compatibleReportTypes: ['RAPPORT_MENSUEL', 'BUDGET_PROJET', 'BUDGET_VS_REEL'],
        dataSource: { type: 'computed', refreshable: true },
        data: {
          labels: budgetByCat.map(b => b.categorie),
          datasets: [{
            label: 'Budget prévu',
            data: budgetByCat.map(b => b.prevu),
            backgroundColor: CHART_COLORS.slice(0, budgetByCat.length),
          }],
        },
        config: {
          title: 'Répartition Budget par Catégorie',
          subtitle: `Total: ${(budgetSynthese.prevu / 1000000).toFixed(1)}M FCFA`,
          legend: { show: true, position: 'right' },
          showGrid: false,
        },
      });
    }

    // 6. Budget Prévu vs Réalisé par Axe (Bar)
    const budgetByAxeData = Object.entries(budgetParAxe).map(([axe, values]) => ({
      axe,
      label: AXE_LABELS[axe] || axe,
      prevu: values.prevu / 1000000,
      realise: values.realise / 1000000,
    })).filter(b => b.prevu > 0);

    if (budgetByAxeData.length > 0) {
      result.push({
        id: 'chart-budget-axe',
        name: 'Budget par Axe',
        description: 'Comparaison prévu vs réalisé par axe stratégique',
        category: 'financier' as ChartCategory,
        chartType: 'bar',
        compatibleReportTypes: ['RAPPORT_MENSUEL', 'BUDGET_PROJET', 'BUDGET_VS_REEL'],
        dataSource: { type: 'computed', refreshable: true },
        data: {
          labels: budgetByAxeData.map(b => b.label),
          datasets: [
            {
              label: 'Prévu (M FCFA)',
              data: budgetByAxeData.map(b => Math.round(b.prevu * 10) / 10),
              backgroundColor: THEME_COLORS.gray,
            },
            {
              label: 'Réalisé (M FCFA)',
              data: budgetByAxeData.map(b => Math.round(b.realise * 10) / 10),
              backgroundColor: THEME_COLORS.primary,
            },
          ],
        },
        config: {
          title: 'Budget Prévu vs Réalisé',
          subtitle: 'Par axe stratégique (en M FCFA)',
          legend: { show: true, position: 'top' },
          xAxis: { label: 'Axe' },
          yAxis: { label: 'Montant (M FCFA)' },
          showGrid: true,
        },
      });
    }

    // 7. Taux de réalisation budget (Gauge)
    result.push({
      id: 'chart-jauge-budget',
      name: 'Taux Réalisation Budget',
      description: 'Consommation budgétaire globale',
      category: 'financier' as ChartCategory,
      chartType: 'gauge',
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'FLASH_PROJET', 'BUDGET_PROJET'],
      dataSource: { type: 'computed', refreshable: true },
      data: {
        labels: ['Réalisation'],
        datasets: [{
          label: 'Taux',
          data: [Math.round(budgetSynthese.tauxRealisation)],
          backgroundColor: [budgetSynthese.tauxRealisation > 100 ? THEME_COLORS.error : THEME_COLORS.success],
        }],
      },
      config: {
        title: 'Taux de Réalisation Budget',
        subtitle: `${(budgetSynthese.realise / 1000000).toFixed(1)}M / ${(budgetSynthese.prevu / 1000000).toFixed(1)}M FCFA`,
        showGrid: false,
      },
    });

    // 8. Risques par niveau (Bar)
    const risquesByNiveau = {
      'Critique (≥12)': risques.filter(r => r.score >= 12).length,
      'Élevé (8-11)': risques.filter(r => r.score >= 8 && r.score < 12).length,
      'Modéré (4-7)': risques.filter(r => r.score >= 4 && r.score < 8).length,
      'Faible (<4)': risques.filter(r => r.score < 4).length,
    };

    result.push({
      id: 'chart-risques-niveau',
      name: 'Risques par Niveau',
      description: `Distribution des ${risques.length} risques par criticité`,
      category: 'risques' as ChartCategory,
      chartType: 'bar',
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'ANALYSE_RISQUES', 'FLASH_PROJET'],
      dataSource: { type: 'computed', refreshable: true },
      data: {
        labels: Object.keys(risquesByNiveau),
        datasets: [{
          label: 'Nombre de risques',
          data: Object.values(risquesByNiveau),
          backgroundColor: [THEME_COLORS.error, THEME_COLORS.orange, THEME_COLORS.warning, THEME_COLORS.success],
        }],
      },
      config: {
        title: 'Distribution des Risques',
        subtitle: `Total: ${risques.length} risques identifiés`,
        legend: { show: false },
        xAxis: { label: 'Niveau' },
        yAxis: { label: 'Nombre' },
        showGrid: true,
      },
    });

    // 9. Risques par catégorie (Donut)
    const risquesByCat: Record<string, number> = {};
    risques.forEach(r => {
      const cat = RISQUE_CATEGORY_LABELS[r.categorie] || r.categorie;
      risquesByCat[cat] = (risquesByCat[cat] || 0) + 1;
    });

    result.push({
      id: 'chart-risques-categorie',
      name: 'Risques par Catégorie',
      description: 'Répartition par type de risque',
      category: 'risques' as ChartCategory,
      chartType: 'donut',
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'ANALYSE_RISQUES'],
      dataSource: { type: 'computed', refreshable: true },
      data: {
        labels: Object.keys(risquesByCat),
        datasets: [{
          label: 'Risques',
          data: Object.values(risquesByCat),
          backgroundColor: CHART_COLORS.slice(0, Object.keys(risquesByCat).length),
        }],
      },
      config: {
        title: 'Risques par Catégorie',
        subtitle: 'Répartition par type',
        legend: { show: true, position: 'right' },
        showGrid: false,
      },
    });

    // 10. Synchronisation Projet vs Mobilisation (Bar comparatif)
    if (syncData.syncStatus) {
      result.push({
        id: 'chart-sync-global',
        name: 'Synchronisation Globale',
        description: 'Équilibre Projet Construction vs Mobilisation',
        category: 'projet' as ChartCategory,
        chartType: 'bar',
        compatibleReportTypes: ['RAPPORT_MENSUEL', 'AVANCEMENT_PROJET', 'FLASH_PROJET'],
        dataSource: { type: 'computed', refreshable: true },
        data: {
          labels: ['Avancement Global'],
          datasets: [
            {
              label: 'Projet (Construction)',
              data: [Math.round(syncData.syncStatus.projectProgress)],
              backgroundColor: THEME_COLORS.primary,
            },
            {
              label: 'Mobilisation (5 axes)',
              data: [Math.round(syncData.syncStatus.mobilizationProgress)],
              backgroundColor: THEME_COLORS.secondary,
            },
          ],
        },
        config: {
          title: 'Synchronisation Projet',
          subtitle: `Écart: ${Math.abs(Math.round(syncData.syncStatus.gap))}%`,
          legend: { show: true, position: 'top' },
          yAxis: { label: 'Avancement (%)' },
          showGrid: true,
        },
      });
    }

    // 11. Alertes par criticité (Pie)
    const alertesByCriticite = {
      'Critique': alertes.filter(a => a.criticite === 'critical' && !a.traitee).length,
      'Haute': alertes.filter(a => a.criticite === 'high' && !a.traitee).length,
      'Moyenne': alertes.filter(a => a.criticite === 'medium' && !a.traitee).length,
      'Basse': alertes.filter(a => a.criticite === 'low' && !a.traitee).length,
    };

    const alertesActives = alertes.filter(a => !a.traitee).length;
    if (alertesActives > 0) {
      result.push({
        id: 'chart-alertes-criticite',
        name: 'Alertes Actives',
        description: `${alertesActives} alertes non traitées par criticité`,
        category: 'projet' as ChartCategory,
        chartType: 'pie',
        compatibleReportTypes: ['RAPPORT_MENSUEL', 'FLASH_PROJET'],
        dataSource: { type: 'computed', refreshable: true },
        data: {
          labels: Object.keys(alertesByCriticite).filter(k => alertesByCriticite[k as keyof typeof alertesByCriticite] > 0),
          datasets: [{
            label: 'Alertes',
            data: Object.values(alertesByCriticite).filter(v => v > 0),
            backgroundColor: [THEME_COLORS.error, THEME_COLORS.orange, THEME_COLORS.warning, THEME_COLORS.info],
          }],
        },
        config: {
          title: 'Alertes par Criticité',
          subtitle: `${alertesActives} alertes actives`,
          legend: { show: true, position: 'right' },
          showGrid: false,
        },
      });
    }

    return result;
  }, [actions, jalons, budgetSynthese, budgetParAxe, budgetParCategorie, risques, alertes, syncData]);

  // ============================================================================
  // TABLEAUX DYNAMIQUES
  // ============================================================================

  const tables = useMemo((): TableTemplate[] => {
    const result: TableTemplate[] = [];

    // 1. Tableau des actions prioritaires
    const actionsPrioritaires = actions
      .filter(a => a.statut !== 'termine' && a.statut !== 'annule')
      .sort((a, b) => {
        const priorityOrder = ['critique', 'haute', 'moyenne', 'basse'];
        return priorityOrder.indexOf(a.priorite || 'moyenne') - priorityOrder.indexOf(b.priorite || 'moyenne');
      })
      .slice(0, 15);

    result.push({
      id: 'table-actions-prioritaires',
      name: 'Actions Prioritaires',
      description: `Top ${actionsPrioritaires.length} actions à traiter`,
      category: 'projet' as TableCategory,
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'AVANCEMENT_PROJET', 'FLASH_PROJET'],
      dataSource: { type: 'entity', entityType: 'actions', refreshable: true },
      headers: [
        { key: 'id', label: 'ID', align: 'left' },
        { key: 'titre', label: 'Action', align: 'left' },
        { key: 'axe', label: 'Axe', align: 'left' },
        { key: 'statut', label: 'Statut', align: 'center' },
        { key: 'priorite', label: 'Priorité', align: 'center' },
        { key: 'avancement', label: '%', align: 'right', format: 'percent' },
        { key: 'responsable', label: 'Responsable', align: 'left' },
        { key: 'echeance', label: 'Échéance', align: 'center', format: 'date' },
      ],
      rows: actionsPrioritaires.map(a => ({
        id: a.id_action || String(a.id),
        titre: a.titre,
        axe: AXE_LABELS[a.axe] || a.axe,
        statut: ACTION_STATUS_LABELS[a.statut] || a.statut,
        priorite: PRIORITE_LABELS[a.priorite] || a.priorite,
        avancement: a.avancement,
        responsable: a.responsable || '-',
        echeance: a.date_fin_prevue || '-',
      })),
      config: { striped: true, bordered: true, compact: false, showTotals: false },
    });

    // 2. Tableau des jalons J-30
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const jalonsJ30 = jalons
      .filter(j => {
        if (!j.date_prevue || j.statut === 'atteint') return false;
        const date = new Date(j.date_prevue);
        return date >= today && date <= in30Days;
      })
      .sort((a, b) => new Date(a.date_prevue!).getTime() - new Date(b.date_prevue!).getTime());

    result.push({
      id: 'table-jalons-j30',
      name: 'Jalons J-30',
      description: `${jalonsJ30.length} jalons dans les 30 prochains jours`,
      category: 'projet' as TableCategory,
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'AVANCEMENT_PROJET', 'FLASH_PROJET'],
      dataSource: { type: 'entity', entityType: 'jalons', refreshable: true },
      headers: [
        { key: 'id', label: 'ID', align: 'left' },
        { key: 'titre', label: 'Jalon', align: 'left' },
        { key: 'axe', label: 'Axe', align: 'left' },
        { key: 'date', label: 'Date Prévue', align: 'center', format: 'date' },
        { key: 'jours', label: 'J-X', align: 'center' },
        { key: 'statut', label: 'Statut', align: 'center' },
        { key: 'responsable', label: 'Responsable', align: 'left' },
      ],
      rows: jalonsJ30.map(j => {
        const days = Math.ceil((new Date(j.date_prevue!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: j.id_jalon || j.code || String(j.id),
          titre: j.titre,
          axe: AXE_LABELS[j.axe] || j.axe,
          date: j.date_prevue,
          jours: `J-${days}`,
          statut: JALON_STATUS_LABELS[j.statut] || j.statut,
          responsable: j.responsable || '-',
        };
      }),
      config: { striped: true, bordered: true, compact: false, showTotals: false },
    });

    // 3. Top 10 Risques
    const top10Risques = [...risques]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    result.push({
      id: 'table-top-risques',
      name: 'Top 10 Risques',
      description: 'Les 10 risques les plus critiques',
      category: 'risques' as TableCategory,
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'ANALYSE_RISQUES', 'FLASH_PROJET'],
      dataSource: { type: 'entity', entityType: 'risques', refreshable: true },
      headers: [
        { key: 'rang', label: '#', align: 'center' },
        { key: 'id', label: 'ID', align: 'left' },
        { key: 'titre', label: 'Risque', align: 'left' },
        { key: 'categorie', label: 'Catégorie', align: 'left' },
        { key: 'prob', label: 'P', align: 'center' },
        { key: 'impact', label: 'I', align: 'center' },
        { key: 'score', label: 'Score', align: 'center' },
        { key: 'proprietaire', label: 'Propriétaire', align: 'left' },
      ],
      rows: top10Risques.map((r, idx) => ({
        rang: idx + 1,
        id: r.id_risque || String(r.id),
        titre: r.titre,
        categorie: RISQUE_CATEGORY_LABELS[r.categorie] || r.categorie,
        prob: r.probabilite_actuelle || '-',
        impact: r.impact_actuel || '-',
        score: r.score,
        proprietaire: r.proprietaire || '-',
      })),
      config: { striped: true, bordered: true, compact: false, showTotals: false },
    });

    // 4. Synthèse Budget par Axe
    const budgetAxeData = Object.entries(budgetParAxe)
      .filter(([_, values]) => values.prevu > 0)
      .map(([axe, values]) => ({
        axe: AXE_LABELS[axe] || axe,
        prevu: values.prevu,
        engage: values.engage,
        realise: values.realise,
        ecart: values.prevu - values.realise,
        taux: values.prevu > 0 ? Math.round((values.realise / values.prevu) * 100) : 0,
      }));

    result.push({
      id: 'table-budget-axe',
      name: 'Budget par Axe',
      description: 'Synthèse budgétaire par axe stratégique',
      category: 'financier' as TableCategory,
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'BUDGET_PROJET', 'BUDGET_VS_REEL'],
      dataSource: { type: 'computed', refreshable: true },
      headers: [
        { key: 'axe', label: 'Axe', align: 'left' },
        { key: 'prevu', label: 'Prévu (FCFA)', align: 'right', format: 'currency' },
        { key: 'engage', label: 'Engagé (FCFA)', align: 'right', format: 'currency' },
        { key: 'realise', label: 'Réalisé (FCFA)', align: 'right', format: 'currency' },
        { key: 'ecart', label: 'Écart (FCFA)', align: 'right', format: 'currency' },
        { key: 'taux', label: 'Taux (%)', align: 'right', format: 'percent' },
      ],
      rows: budgetAxeData,
      config: { striped: true, bordered: true, compact: false, showTotals: true },
    });

    // 5. Actions par statut et axe (matrice)
    const axesList = [...new Set(actions.map(a => a.axe))];
    const actionsMatrix = axesList.map(axe => {
      const axeActions = actions.filter(a => a.axe === axe);
      return {
        axe: AXE_LABELS[axe] || axe,
        total: axeActions.length,
        a_faire: axeActions.filter(a => a.statut === 'a_faire').length,
        en_cours: axeActions.filter(a => a.statut === 'en_cours').length,
        termine: axeActions.filter(a => a.statut === 'termine').length,
        bloque: axeActions.filter(a => a.statut === 'bloque').length,
        avancement: axeActions.length > 0
          ? Math.round(axeActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / axeActions.length)
          : 0,
      };
    });

    result.push({
      id: 'table-actions-matrice',
      name: 'Matrice Actions',
      description: 'Vue croisée actions par axe et statut',
      category: 'projet' as TableCategory,
      compatibleReportTypes: ['RAPPORT_MENSUEL', 'AVANCEMENT_PROJET'],
      dataSource: { type: 'computed', refreshable: true },
      headers: [
        { key: 'axe', label: 'Axe', align: 'left' },
        { key: 'total', label: 'Total', align: 'center' },
        { key: 'a_faire', label: 'À faire', align: 'center' },
        { key: 'en_cours', label: 'En cours', align: 'center' },
        { key: 'termine', label: 'Terminé', align: 'center' },
        { key: 'bloque', label: 'Bloqué', align: 'center' },
        { key: 'avancement', label: 'Avg %', align: 'right', format: 'percent' },
      ],
      rows: actionsMatrix,
      config: { striped: true, bordered: true, compact: false, showTotals: true },
    });

    // 6. Alertes actives
    const alertesActives = alertes
      .filter(a => !a.traitee)
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.criticite as keyof typeof order] || 3) - (order[b.criticite as keyof typeof order] || 3);
      })
      .slice(0, 10);

    if (alertesActives.length > 0) {
      result.push({
        id: 'table-alertes-actives',
        name: 'Alertes Actives',
        description: `${alertesActives.length} alertes non traitées`,
        category: 'projet' as TableCategory,
        compatibleReportTypes: ['RAPPORT_MENSUEL', 'FLASH_PROJET'],
        dataSource: { type: 'entity', entityType: 'alertes', refreshable: true },
        headers: [
          { key: 'date', label: 'Date', align: 'center', format: 'date' },
          { key: 'type', label: 'Type', align: 'left' },
          { key: 'titre', label: 'Titre', align: 'left' },
          { key: 'criticite', label: 'Criticité', align: 'center' },
        ],
        rows: alertesActives.map(a => ({
          date: a.createdAt,
          type: a.type,
          titre: a.titre,
          criticite: a.criticite === 'critical' ? 'Critique' :
                     a.criticite === 'high' ? 'Haute' :
                     a.criticite === 'medium' ? 'Moyenne' : 'Basse',
        })),
        config: { striped: true, bordered: true, compact: true, showTotals: false },
      });
    }

    // 7. Détail postes budgétaires
    const budgetDetail = budgetItems
      .sort((a, b) => b.montantPrevu - a.montantPrevu)
      .slice(0, 20);

    result.push({
      id: 'table-budget-detail',
      name: 'Détail Postes Budget',
      description: `Top ${budgetDetail.length} postes budgétaires`,
      category: 'financier' as TableCategory,
      compatibleReportTypes: ['BUDGET_PROJET', 'BUDGET_VS_REEL', 'RAPPORT_MENSUEL'],
      dataSource: { type: 'entity', entityType: 'budget', refreshable: true },
      headers: [
        { key: 'libelle', label: 'Libellé', align: 'left' },
        { key: 'categorie', label: 'Catégorie', align: 'left' },
        { key: 'axe', label: 'Axe', align: 'left' },
        { key: 'prevu', label: 'Prévu', align: 'right', format: 'currency' },
        { key: 'realise', label: 'Réalisé', align: 'right', format: 'currency' },
        { key: 'taux', label: '%', align: 'right', format: 'percent' },
      ],
      rows: budgetDetail.map(b => ({
        libelle: b.libelle,
        categorie: BUDGET_CATEGORY_LABELS[b.categorie as keyof typeof BUDGET_CATEGORY_LABELS] || b.categorie,
        axe: AXE_LABELS[b.axe as keyof typeof AXE_LABELS] || b.axe,
        prevu: b.montantPrevu,
        realise: b.montantRealise,
        taux: b.montantPrevu > 0 ? Math.round((b.montantRealise / b.montantPrevu) * 100) : 0,
      })),
      config: { striped: true, bordered: true, compact: false, showTotals: true },
    });

    return result;
  }, [actions, jalons, risques, budgetItems, budgetParAxe, alertes]);

  // ============================================================================
  // KPIs DYNAMIQUES
  // ============================================================================

  const kpiDefinitions = useMemo((): KPIDefinition[] => {
    const result: KPIDefinition[] = [];

    // KPIs Projet
    result.push({
      id: 'kpi-avancement-global',
      code: 'AVG_GLOBAL',
      name: 'Avancement Global',
      description: 'Progression moyenne de toutes les actions',
      category: 'projet',
      unit: '%',
      format: 'percent',
      target: 100,
      currentValue: actions.length > 0
        ? Math.round(actions.reduce((sum, a) => sum + (a.avancement || 0), 0) / actions.length)
        : 0,
      axe: 'Transverse',
    });

    result.push({
      id: 'kpi-actions-terminees',
      code: 'ACT_TERM',
      name: 'Actions Terminées',
      description: 'Nombre d\'actions complétées',
      category: 'projet',
      unit: '',
      format: 'number',
      target: actions.length,
      currentValue: actions.filter(a => a.statut === 'termine').length,
      axe: 'Transverse',
    });

    result.push({
      id: 'kpi-jalons-atteints',
      code: 'JAL_ATT',
      name: 'Jalons Atteints',
      description: 'Nombre de jalons réalisés',
      category: 'projet',
      unit: '',
      format: 'number',
      target: jalons.length,
      currentValue: jalons.filter(j => j.statut === 'atteint').length,
      axe: 'Transverse',
    });

    result.push({
      id: 'kpi-actions-bloquees',
      code: 'ACT_BLOQ',
      name: 'Actions Bloquées',
      description: 'Nombre d\'actions en blocage',
      category: 'projet',
      unit: '',
      format: 'number',
      target: 0,
      currentValue: actions.filter(a => a.statut === 'bloque').length,
      axe: 'Transverse',
    });

    // KPIs Budget
    result.push({
      id: 'kpi-budget-prevu',
      code: 'BUD_PREV',
      name: 'Budget Prévu',
      description: 'Budget total prévu du projet',
      category: 'financier',
      unit: 'FCFA',
      format: 'currency',
      currentValue: budgetSynthese.prevu,
      axe: 'Budget',
    });

    result.push({
      id: 'kpi-budget-realise',
      code: 'BUD_REAL',
      name: 'Budget Réalisé',
      description: 'Dépenses réelles effectuées',
      category: 'financier',
      unit: 'FCFA',
      format: 'currency',
      target: budgetSynthese.prevu,
      currentValue: budgetSynthese.realise,
      axe: 'Budget',
    });

    result.push({
      id: 'kpi-taux-realisation',
      code: 'TAUX_REAL',
      name: 'Taux Réalisation',
      description: 'Pourcentage du budget consommé',
      category: 'financier',
      unit: '%',
      format: 'percent',
      target: 100,
      currentValue: Math.round(budgetSynthese.tauxRealisation),
      axe: 'Budget',
    });

    result.push({
      id: 'kpi-ecart-budget',
      code: 'ECART_BUD',
      name: 'Écart Budgétaire',
      description: 'Différence prévu - réalisé',
      category: 'financier',
      unit: 'FCFA',
      format: 'currency',
      currentValue: budgetSynthese.prevu - budgetSynthese.realise,
      axe: 'Budget',
    });

    // KPIs Risques
    result.push({
      id: 'kpi-risques-total',
      code: 'RSK_TOT',
      name: 'Total Risques',
      description: 'Nombre total de risques identifiés',
      category: 'risques',
      unit: '',
      format: 'number',
      currentValue: risques.length,
      axe: 'Transverse',
    });

    result.push({
      id: 'kpi-risques-critiques',
      code: 'RSK_CRIT',
      name: 'Risques Critiques',
      description: 'Risques avec score ≥ 12',
      category: 'risques',
      unit: '',
      format: 'number',
      target: 0,
      currentValue: risques.filter(r => r.score >= 12).length,
      axe: 'Transverse',
    });

    result.push({
      id: 'kpi-score-risque-moyen',
      code: 'RSK_AVG',
      name: 'Score Risque Moyen',
      description: 'Score moyen des risques actifs',
      category: 'risques',
      unit: '',
      format: 'number',
      currentValue: risques.length > 0
        ? Math.round(risques.reduce((sum, r) => sum + r.score, 0) / risques.length)
        : 0,
      axe: 'Transverse',
    });

    // KPIs Sync
    if (syncData.syncStatus) {
      result.push({
        id: 'kpi-sync-projet',
        code: 'SYNC_PROJ',
        name: 'Avancement Projet',
        description: 'Progression Construction',
        category: 'projet',
        unit: '%',
        format: 'percent',
        target: 100,
        currentValue: Math.round(syncData.syncStatus.projectProgress),
        axe: 'Projet',
      });

      result.push({
        id: 'kpi-sync-mob',
        code: 'SYNC_MOB',
        name: 'Avancement Mobilisation',
        description: 'Progression 5 axes Mobilisation',
        category: 'projet',
        unit: '%',
        format: 'percent',
        target: 100,
        currentValue: Math.round(syncData.syncStatus.mobilizationProgress),
        axe: 'Mobilisation',
      });

      result.push({
        id: 'kpi-sync-ecart',
        code: 'SYNC_GAP',
        name: 'Écart Synchronisation',
        description: 'Différence Projet - Mobilisation',
        category: 'projet',
        unit: '%',
        format: 'percent',
        target: 0,
        currentValue: Math.round(Math.abs(syncData.syncStatus.gap)),
        axe: 'Transverse',
      });
    }

    // KPIs Alertes
    result.push({
      id: 'kpi-alertes-actives',
      code: 'ALR_ACT',
      name: 'Alertes Actives',
      description: 'Alertes non traitées',
      category: 'projet',
      unit: '',
      format: 'number',
      target: 0,
      currentValue: alertes.filter(a => !a.traitee).length,
      axe: 'Transverse',
    });

    return result;
  }, [actions, jalons, budgetSynthese, risques, alertes, syncData]);

  return {
    charts,
    tables,
    kpis: kpiDefinitions,
    isLoading: false,
  };
}

// ============================================================================
// FONCTIONS DE RECHERCHE
// ============================================================================

export function searchDynamicCharts(charts: ChartTemplate[], query: string): ChartTemplate[] {
  const lowerQuery = query.toLowerCase();
  return charts.filter(
    chart =>
      chart.name.toLowerCase().includes(lowerQuery) ||
      chart.description.toLowerCase().includes(lowerQuery)
  );
}

export function searchDynamicTables(tables: TableTemplate[], query: string): TableTemplate[] {
  const lowerQuery = query.toLowerCase();
  return tables.filter(
    table =>
      table.name.toLowerCase().includes(lowerQuery) ||
      table.description.toLowerCase().includes(lowerQuery)
  );
}

export function searchDynamicKPIs(kpis: KPIDefinition[], query: string): KPIDefinition[] {
  const lowerQuery = query.toLowerCase();
  return kpis.filter(
    kpi =>
      kpi.name.toLowerCase().includes(lowerQuery) ||
      kpi.description.toLowerCase().includes(lowerQuery) ||
      kpi.code.toLowerCase().includes(lowerQuery)
  );
}
