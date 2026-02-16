/**
 * Data Library Service - Récupération des données réelles pour le catalogue
 *
 * Ce service connecte les templates de la catalogue de données aux données
 * réelles stockées dans IndexedDB (actions, jalons, risques, etc.)
 */

import { db } from '@/db';
import {
  ACTION_STATUS_LABELS,
  JALON_STATUS_LABELS,
  RISQUE_CATEGORY_LABELS,
  getRisqueStatusLabel,
  PRIORITE_LABELS,
  AXE_LABELS,
  type Priorite,
  type RisqueCategory,
} from '@/types';
import { THEME_COLORS, CHART_COLORS } from '@/data/dataLibrary';
import type { ChartTemplate, TableTemplate } from '@/types/reportStudio';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

type EntityType = 'actions' | 'jalons' | 'risques' | 'budget' | 'lots' | 'locataires' | 'prospects' | 'baux';

interface DataSource {
  type: 'entity' | 'kpi' | 'computed';
  entityType?: EntityType;
  kpiCodes?: string[];
  refreshable?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

export interface TableData {
  headers: { key: string; label: string; align?: 'left' | 'center' | 'right' }[];
  rows: Record<string, unknown>[];
}

// ============================================================================
// Actions Data Fetchers
// ============================================================================

async function fetchActionsParStatut(): Promise<ChartData> {
  const actions = await db.actions.toArray();

  // Grouper par statut simplifié pour le graphique
  const statusGroups = {
    termine: 0,
    en_cours: 0,
    a_faire: 0,
    bloque: 0,
    en_retard: 0,
  };

  const today = new Date().toISOString().split('T')[0];

  for (const action of actions) {
    if (action.statut === 'termine') {
      statusGroups.termine++;
    } else if (action.statut === 'bloque') {
      statusGroups.bloque++;
    } else if (action.statut === 'en_cours' || action.statut === 'en_validation') {
      statusGroups.en_cours++;
    } else if (action.date_fin_prevue < today && action.statut !== 'annule') {
      statusGroups.en_retard++;
    } else if (['a_planifier', 'planifie', 'a_faire'].includes(action.statut)) {
      statusGroups.a_faire++;
    }
  }

  return {
    labels: ['Terminées', 'En cours', 'À faire', 'Bloquées', 'En retard'],
    datasets: [
      {
        label: 'Actions',
        data: [
          statusGroups.termine,
          statusGroups.en_cours,
          statusGroups.a_faire,
          statusGroups.bloque,
          statusGroups.en_retard,
        ],
        backgroundColor: [
          THEME_COLORS.success,
          THEME_COLORS.primary,
          THEME_COLORS.info,
          THEME_COLORS.error,
          THEME_COLORS.warning,
        ],
      },
    ],
  };
}

async function fetchActionsParPriorite(): Promise<ChartData> {
  const actions = await db.actions.toArray();
  const activeActions = actions.filter((a) => a.statut !== 'termine' && a.statut !== 'annule');

  const prioriteGroups: Record<Priorite, number> = {
    critique: 0,
    haute: 0,
    moyenne: 0,
    basse: 0,
  };

  for (const action of activeActions) {
    if (action.priorite && prioriteGroups[action.priorite] !== undefined) {
      prioriteGroups[action.priorite]++;
    }
  }

  return {
    labels: ['Critique', 'Haute', 'Moyenne', 'Basse'],
    datasets: [
      {
        label: 'Actions par priorité',
        data: [prioriteGroups.critique, prioriteGroups.haute, prioriteGroups.moyenne, prioriteGroups.basse],
        backgroundColor: [THEME_COLORS.error, THEME_COLORS.warning, THEME_COLORS.info, THEME_COLORS.success],
      },
    ],
  };
}

async function fetchActionsTable(): Promise<TableData> {
  const actions = await db.actions.toArray();
  const users = await db.users.toArray();

  const userMap = new Map(users.map((u) => [u.id, `${u.prenom} ${u.nom}`]));

  // Sort by priority then by date
  const sortedActions = actions
    .filter((a) => a.statut !== 'annule')
    .sort((a, b) => {
      const priorityOrder: Record<Priorite, number> = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
      const priorityDiff =
        (priorityOrder[a.priorite] ?? 4) - (priorityOrder[b.priorite] ?? 4);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.date_fin_prevue).getTime() - new Date(b.date_fin_prevue).getTime();
    })
    .slice(0, 20); // Limit to 20 for readability

  return {
    headers: [
      { key: 'titre', label: 'Action', align: 'left' },
      { key: 'axe', label: 'Axe', align: 'left' },
      { key: 'statut', label: 'Statut', align: 'center' },
      { key: 'priorite', label: 'Priorité', align: 'center' },
      { key: 'responsable', label: 'Responsable', align: 'left' },
      { key: 'avancement', label: 'Avancement', align: 'center' },
      { key: 'echeance', label: 'Échéance', align: 'center' },
    ],
    rows: sortedActions.map((action) => ({
      titre: action.titre,
      axe: AXE_LABELS[action.axe]?.replace('AXE ', '').split(' - ')[1] || action.axe,
      statut: ACTION_STATUS_LABELS[action.statut] || action.statut,
      priorite: PRIORITE_LABELS[action.priorite] || action.priorite,
      responsable: userMap.get(action.responsableId) || '-',
      avancement: `${action.avancement}%`,
      echeance: formatDateFR(action.date_fin_prevue),
    })),
  };
}

// ============================================================================
// Jalons Data Fetchers
// ============================================================================

async function fetchJalonsChronologie(): Promise<ChartData> {
  const jalons = await db.jalons.toArray();

  // Sort by date and take first 10
  const sortedJalons = jalons
    .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())
    .slice(0, 10);

  const colors = sortedJalons.map((j) => {
    switch (j.statut) {
      case 'atteint':
        return THEME_COLORS.success;
      case 'depasse':
        return THEME_COLORS.error;
      case 'en_danger':
        return THEME_COLORS.warning;
      case 'en_approche':
        return THEME_COLORS.info;
      default:
        return THEME_COLORS.gray;
    }
  });

  return {
    labels: sortedJalons.map((j) => j.titre.substring(0, 20)),
    datasets: [
      {
        label: 'Avancement',
        data: sortedJalons.map((j) => j.avancement_prealables || 0),
        backgroundColor: colors,
      },
    ],
  };
}

// ============================================================================
// Budget Data Fetchers
// ============================================================================

async function fetchBudgetParCategorie(): Promise<ChartData> {
  const budgetItems = await db.budget.toArray();

  // Group by category
  const categoryTotals: Record<string, { budget: number; reel: number }> = {};

  for (const item of budgetItems) {
    const cat = item.categorie || 'Autres';
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { budget: 0, reel: 0 };
    }
    categoryTotals[cat].budget += item.budget_initial || 0;
    categoryTotals[cat].reel += item.realise || 0;
  }

  const categories = Object.keys(categoryTotals);

  return {
    labels: categories,
    datasets: [
      {
        label: 'Budget (M€)',
        data: categories.map((c) => Math.round(categoryTotals[c].budget / 1000000)),
        backgroundColor: THEME_COLORS.primary,
      },
      {
        label: 'Réalisé (M€)',
        data: categories.map((c) => Math.round(categoryTotals[c].reel / 1000000)),
        backgroundColor: THEME_COLORS.secondary,
      },
    ],
  };
}

async function fetchBudgetTable(): Promise<TableData> {
  const budgetItems = await db.budget.toArray();

  // Group by category
  const categoryData: Record<string, { budget: number; reel: number; items: typeof budgetItems }> = {};

  for (const item of budgetItems) {
    const cat = item.categorie || 'Autres';
    if (!categoryData[cat]) {
      categoryData[cat] = { budget: 0, reel: 0, items: [] };
    }
    categoryData[cat].budget += item.budget_initial || 0;
    categoryData[cat].reel += item.realise || 0;
    categoryData[cat].items.push(item);
  }

  const rows = Object.entries(categoryData).map(([categorie, data]) => {
    const tauxConso = data.budget > 0 ? (data.reel / data.budget) * 100 : 0;
    return {
      poste: categorie,
      budgetAnnuel: Math.round(data.budget / 1000000),
      consomme: Math.round(data.reel / 1000000),
      reste: Math.round((data.budget - data.reel) / 1000000),
      tauxConso: Math.round(tauxConso),
    };
  });

  // Add total row
  const totalBudget = Object.values(categoryData).reduce((sum, d) => sum + d.budget, 0);
  const totalReel = Object.values(categoryData).reduce((sum, d) => sum + d.reel, 0);
  rows.push({
    poste: 'TOTAL',
    budgetAnnuel: Math.round(totalBudget / 1000000),
    consomme: Math.round(totalReel / 1000000),
    reste: Math.round((totalBudget - totalReel) / 1000000),
    tauxConso: totalBudget > 0 ? Math.round((totalReel / totalBudget) * 100) : 0,
  });

  return {
    headers: [
      { key: 'poste', label: 'Poste budgétaire', align: 'left' },
      { key: 'budgetAnnuel', label: 'Budget (M€)', align: 'right' },
      { key: 'consomme', label: 'Réalisé (M€)', align: 'right' },
      { key: 'reste', label: 'Reste (M€)', align: 'right' },
      { key: 'tauxConso', label: 'Taux conso. (%)', align: 'right' },
    ],
    rows,
  };
}

async function fetchJalonsTable(): Promise<TableData> {
  const jalons = await db.jalons.toArray();

  const sortedJalons = jalons
    .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())
    .slice(0, 15);

  return {
    headers: [
      { key: 'jalon', label: 'Jalon', align: 'left' },
      { key: 'description', label: 'Description', align: 'left' },
      { key: 'date_prevue', label: 'Date prévue', align: 'center' },
      { key: 'statut', label: 'Statut', align: 'center' },
      { key: 'avancement', label: 'Avancement', align: 'center' },
    ],
    rows: sortedJalons.map((jalon) => ({
      jalon: jalon.titre,
      description: jalon.description?.substring(0, 50) || '-',
      date_prevue: formatDateFR(jalon.date_prevue),
      statut: JALON_STATUS_LABELS[jalon.statut] || jalon.statut,
      avancement: `${jalon.avancement_prealables || 0}%`,
    })),
  };
}

// ============================================================================
// Risques Data Fetchers
// ============================================================================

async function fetchRisquesParCategorie(): Promise<ChartData> {
  const risques = await db.risques.toArray();
  const activeRisques = risques.filter((r) => r.status !== 'closed');

  const categorieGroups: Record<string, number> = {};

  for (const risque of activeRisques) {
    const cat = risque.categorie || 'autre';
    categorieGroups[cat] = (categorieGroups[cat] || 0) + 1;
  }

  const sortedCategories = Object.entries(categorieGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return {
    labels: sortedCategories.map(([cat]) => RISQUE_CATEGORY_LABELS[cat as RisqueCategory] || cat),
    datasets: [
      {
        label: 'Risques par catégorie',
        data: sortedCategories.map(([, count]) => count),
        backgroundColor: CHART_COLORS.slice(0, sortedCategories.length),
      },
    ],
  };
}

async function fetchRisquesMatrice(): Promise<ChartData> {
  const risques = await db.risques.toArray();
  const activeRisques = risques.filter((r) => r.status !== 'closed').slice(0, 10);

  return {
    labels: activeRisques.map((r) => r.titre?.substring(0, 10) || `R${r.id}`),
    datasets: [
      {
        label: 'Score (Probabilité × Impact)',
        data: activeRisques.map((r) => r.score || (r.probabilite * r.impact)),
        backgroundColor: activeRisques.map((r) => {
          const score = r.score || (r.probabilite * r.impact);
          if (score >= 12) return THEME_COLORS.error;
          if (score >= 9) return THEME_COLORS.warning;
          if (score >= 5) return THEME_COLORS.info;
          return THEME_COLORS.success;
        }),
      },
    ],
  };
}

async function fetchRisquesTable(): Promise<TableData> {
  const risques = await db.risques.toArray();

  const sortedRisques = risques
    .filter((r) => r.status !== 'closed')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 15);

  return {
    headers: [
      { key: 'risque', label: 'Risque', align: 'left' },
      { key: 'categorie', label: 'Catégorie', align: 'left' },
      { key: 'probabilite', label: 'P', align: 'center' },
      { key: 'impact', label: 'I', align: 'center' },
      { key: 'score', label: 'Score', align: 'center' },
      { key: 'statut', label: 'Statut', align: 'center' },
    ],
    rows: sortedRisques.map((risque) => ({
      risque: risque.titre,
      categorie: RISQUE_CATEGORY_LABELS[risque.categorie] || risque.categorie,
      probabilite: risque.probabilite,
      impact: risque.impact,
      score: risque.score || (risque.probabilite * risque.impact),
      statut: getRisqueStatusLabel(risque.status),
    })),
  };
}

async function fetchTopRisques(): Promise<TableData> {
  const risques = await db.risques.toArray();

  const topRisques = risques
    .filter((r) => r.status !== 'closed')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  return {
    headers: [
      { key: 'rang', label: '#', align: 'center' },
      { key: 'risque', label: 'Risque', align: 'left' },
      { key: 'score', label: 'Score', align: 'center' },
      { key: 'categorie', label: 'Catégorie', align: 'left' },
      { key: 'mitigation', label: 'Mitigation', align: 'left' },
    ],
    rows: topRisques.map((risque, idx) => ({
      rang: idx + 1,
      risque: risque.titre,
      score: risque.score || (risque.probabilite * risque.impact),
      categorie: RISQUE_CATEGORY_LABELS[risque.categorie] || risque.categorie,
      mitigation: risque.mesures_attenuation?.substring(0, 50) || '-',
    })),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDateFR(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ============================================================================
// Main Data Fetching Functions
// ============================================================================

/**
 * Récupère les données réelles pour un template de graphique
 */
export async function fetchChartData(template: ChartTemplate): Promise<ChartData | null> {
  const dataSource = template.dataSource as DataSource;

  if (!dataSource || dataSource.type !== 'entity') {
    return null; // Use static template data
  }

  try {
    switch (dataSource.entityType) {
      case 'actions':
        // Determine which chart type based on template ID or config
        if (template.id.includes('priorite') || template.name.toLowerCase().includes('priorit')) {
          return await fetchActionsParPriorite();
        }
        return await fetchActionsParStatut();

      case 'jalons':
        return await fetchJalonsChronologie();

      case 'risques':
        if (template.chartType === 'scatter' || template.id.includes('matrice')) {
          return await fetchRisquesMatrice();
        }
        return await fetchRisquesParCategorie();

      case 'budget':
        return await fetchBudgetParCategorie();

      default:
        return null;
    }
  } catch (error) {
    logger.error('Erreur récupération données graphique:', error);
    return null;
  }
}

/**
 * Récupère les données réelles pour un template de tableau
 */
export async function fetchTableData(template: TableTemplate): Promise<TableData | null> {
  const dataSource = template.dataSource as DataSource;

  if (!dataSource || dataSource.type !== 'entity') {
    return null; // Use static template data
  }

  try {
    switch (dataSource.entityType) {
      case 'actions':
        return await fetchActionsTable();

      case 'jalons':
        return await fetchJalonsTable();

      case 'risques':
        if (template.id.includes('top') || template.name.toLowerCase().includes('top')) {
          return await fetchTopRisques();
        }
        return await fetchRisquesTable();

      case 'budget':
        return await fetchBudgetTable();

      default:
        return null;
    }
  } catch (error) {
    logger.error('Erreur récupération données tableau:', error);
    return null;
  }
}

/**
 * Crée un template de graphique avec les données réelles
 */
export async function createChartWithLiveData(template: ChartTemplate): Promise<ChartTemplate> {
  const liveData = await fetchChartData(template);

  if (liveData) {
    return {
      ...template,
      data: liveData,
      config: {
        ...template.config,
        subtitle: `${template.config.subtitle || ''} (Données en temps réel)`.trim(),
      },
    };
  }

  return template;
}

/**
 * Crée un template de tableau avec les données réelles
 */
export async function createTableWithLiveData(template: TableTemplate): Promise<TableTemplate> {
  const liveData = await fetchTableData(template);

  if (liveData) {
    return {
      ...template,
      headers: liveData.headers,
      rows: liveData.rows,
    };
  }

  return template;
}
