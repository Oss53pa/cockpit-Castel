// ============================================================================
// DATA LIBRARY - CATALOGUE DE DONNEES PRE-DEFINIES
// Module Rapport Studio et Catalogue pour COCKPIT
// ============================================================================

import type {
  ChartTemplate,
  TableTemplate,
  KPIDefinition,
  ReportTemplate,
  ReportType,
} from '@/types/reportStudio';

// ============================================================================
// COULEURS DU THEME
// ============================================================================

export const THEME_COLORS = {
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

export const CHART_COLORS = [
  '#1C3163',
  '#D4AF37',
  '#10b981',
  '#8b5cf6',
  '#f97316',
  '#ec4899',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
];

// ============================================================================
// GRAPHIQUES PRE-DEFINIS
// ============================================================================

export const CHART_TEMPLATES: ChartTemplate[] = [
  // ============================================================================
  // CATEGORIE: PERFORMANCE
  // ============================================================================
  {
    id: 'chart-evolution-noi',
    name: 'Évolution du NOI',
    description: 'Évolution du Net Operating Income sur 12 mois',
    category: 'performance',
    chartType: 'line',
    compatibleReportTypes: ['PERF_ACTIF', 'ANALYSE_PORTEFEUILLE', 'REPORTING_PROPRIETAIRE', 'NOI_ANALYSIS', 'RAPPORT_MENSUEL', 'RAPPORT_TRIMESTRIEL'],
    dataSource: {
      type: 'kpi',
      kpiCodes: ['NOI'],
      refreshable: true,
    },
    data: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: [
        {
          label: 'NOI (k€)',
          data: [850, 920, 880, 950, 1020, 980, 1050, 1100, 1080, 1150, 1200, 1180],
          borderColor: THEME_COLORS.primary,
          backgroundColor: `${THEME_COLORS.primary}20`,
          fill: true,
        },
        {
          label: 'Budget (k€)',
          data: [900, 900, 900, 950, 950, 950, 1000, 1000, 1000, 1100, 1100, 1100],
          borderColor: THEME_COLORS.secondary,
          backgroundColor: 'transparent',
          fill: false,
        },
      ],
    },
    config: {
      title: 'Évolution du NOI',
      subtitle: 'Réel vs Budget',
      legend: { show: true, position: 'top' },
      xAxis: { label: 'Mois' },
      yAxis: { label: 'NOI (k€)' },
      showGrid: true,
    },
  },
  {
    id: 'chart-comparaison-yields',
    name: 'Comparaison des Yields',
    description: 'Yields brut et net par période',
    category: 'performance',
    chartType: 'bar',
    compatibleReportTypes: ['PERF_ACTIF', 'ANALYSE_PORTEFEUILLE', 'REPORTING_PROPRIETAIRE', 'VALORISATION_DCF'],
    dataSource: {
      type: 'kpi',
      kpiCodes: ['YIELD_BRUT', 'YIELD_NET'],
      refreshable: true,
    },
    data: {
      labels: ['T1 2025', 'T2 2025', 'T3 2025', 'T4 2025'],
      datasets: [
        {
          label: 'Yield Brut (%)',
          data: [6.2, 6.4, 6.5, 6.8],
          backgroundColor: THEME_COLORS.primary,
        },
        {
          label: 'Yield Net (%)',
          data: [5.1, 5.3, 5.4, 5.6],
          backgroundColor: THEME_COLORS.secondary,
        },
      ],
    },
    config: {
      title: 'Comparaison des Yields',
      subtitle: 'Évolution trimestrielle',
      legend: { show: true, position: 'top' },
      xAxis: { label: 'Trimestre' },
      yAxis: { label: 'Yield (%)' },
      showGrid: true,
    },
  },
  {
    id: 'chart-jauge-occupation',
    name: 'Jauge Taux d\'Occupation',
    description: 'Taux d\'occupation physique actuel',
    category: 'performance',
    chartType: 'gauge',
    compatibleReportTypes: ['PERF_ACTIF', 'TDB_CENTRE', 'ETAT_LOCATIF_REPORT', 'SUIVI_VACANCE', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'kpi',
      kpiCodes: ['TAUX_OCCUPATION_PHYSIQUE'],
      refreshable: true,
    },
    data: {
      labels: ['Occupation'],
      datasets: [
        {
          label: 'Taux d\'occupation',
          data: [94.5],
          backgroundColor: [THEME_COLORS.success],
        },
      ],
    },
    config: {
      title: 'Taux d\'Occupation',
      subtitle: 'Physique',
      showGrid: false,
    },
  },

  // ============================================================================
  // CATEGORIE: FINANCIER
  // ============================================================================
  {
    id: 'chart-revenus-charges',
    name: 'Revenus vs Charges',
    description: 'Comparaison mensuelle des revenus et charges',
    category: 'financier',
    chartType: 'bar',
    compatibleReportTypes: ['COMPTE_RESULTAT', 'BUDGET_VS_REEL', 'GESTION_CHARGES', 'RAPPORT_MENSUEL', 'RAPPORT_TRIMESTRIEL'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Revenus (k€)',
          data: [1200, 1250, 1180, 1300, 1350, 1280],
          backgroundColor: THEME_COLORS.success,
        },
        {
          label: 'Charges (k€)',
          data: [350, 330, 380, 350, 330, 300],
          backgroundColor: THEME_COLORS.error,
        },
      ],
    },
    config: {
      title: 'Revenus vs Charges',
      subtitle: 'Évolution mensuelle',
      legend: { show: true, position: 'top' },
      xAxis: { label: 'Mois' },
      yAxis: { label: 'Montant (k€)' },
      showGrid: true,
    },
  },
  {
    id: 'chart-repartition-charges',
    name: 'Répartition des Charges',
    description: 'Répartition par catégorie de charges',
    category: 'financier',
    chartType: 'donut',
    compatibleReportTypes: ['COMPTE_RESULTAT', 'GESTION_CHARGES', 'BUDGET_VS_REEL', 'RAPPORT_TRIMESTRIEL'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Personnel', 'Maintenance', 'Énergie', 'Sécurité', 'Marketing', 'Autres'],
      datasets: [
        {
          label: 'Charges',
          data: [35, 25, 18, 12, 6, 4],
          backgroundColor: CHART_COLORS,
        },
      ],
    },
    config: {
      title: 'Répartition des Charges',
      subtitle: 'Par catégorie',
      legend: { show: true, position: 'right' },
      showGrid: false,
    },
  },
  {
    id: 'chart-budget-vs-reel',
    name: 'Budget vs Réel',
    description: 'Écarts budget vs réalisé par poste',
    category: 'financier',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['BUDGET_VS_REEL', 'COMPTE_RESULTAT', 'BUDGET_PROJET', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Loyers', 'Charges Récup.', 'Charges Locatives', 'Marketing', 'Maintenance', 'Divers'],
      datasets: [
        {
          label: 'Budget (k€)',
          data: [1500, 450, 380, 120, 200, 80],
          backgroundColor: THEME_COLORS.gray,
        },
        {
          label: 'Réel (k€)',
          data: [1580, 420, 395, 95, 185, 75],
          backgroundColor: THEME_COLORS.primary,
        },
      ],
    },
    config: {
      title: 'Budget vs Réel',
      subtitle: 'Par poste budgétaire',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-waterfall-ecarts',
    name: 'Analyse des Écarts',
    description: 'Cascade des écarts budgétaires',
    category: 'financier',
    chartType: 'waterfall',
    compatibleReportTypes: ['BUDGET_VS_REEL', 'COMPTE_RESULTAT', 'NOI_ANALYSIS'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Budget Initial', 'Loyers +', 'Charges -', 'Marketing +', 'Maintenance -', 'Résultat'],
      datasets: [
        {
          label: 'Écarts',
          data: [1000, 80, -15, 25, -15, 1075],
          backgroundColor: [THEME_COLORS.gray, THEME_COLORS.success, THEME_COLORS.error, THEME_COLORS.success, THEME_COLORS.error, THEME_COLORS.primary],
        },
      ],
    },
    config: {
      title: 'Analyse des Écarts',
      subtitle: 'Du budget au réalisé',
      showGrid: true,
    },
  },

  // ============================================================================
  // CATEGORIE: LOCATIF
  // ============================================================================
  {
    id: 'chart-mix-commercial',
    name: 'Mix Commercial',
    description: 'Répartition par activité commerciale',
    category: 'locatif',
    chartType: 'pie',
    compatibleReportTypes: ['ETAT_LOCATIF_REPORT', 'MERCHANDISING_MIX', 'PERF_ACTIF', 'ANALYSE_PORTEFEUILLE'],
    dataSource: {
      type: 'entity',
      entityType: 'lots',
      refreshable: true,
    },
    data: {
      labels: ['Mode', 'Restauration', 'Services', 'Beauté/Santé', 'Culture/Loisirs', 'Alimentaire'],
      datasets: [
        {
          label: 'Surface (m²)',
          data: [35, 20, 15, 12, 10, 8],
          backgroundColor: CHART_COLORS,
        },
      ],
    },
    config: {
      title: 'Mix Commercial',
      subtitle: 'Répartition par activité',
      legend: { show: true, position: 'right' },
      showGrid: false,
    },
  },
  {
    id: 'chart-evolution-wault',
    name: 'Évolution du WAULT',
    description: 'Durée moyenne pondérée des baux',
    category: 'locatif',
    chartType: 'area',
    compatibleReportTypes: ['ETAT_LOCATIF_REPORT', 'SUIVI_BAUX', 'PERF_ACTIF', 'REPORTING_PROPRIETAIRE'],
    dataSource: {
      type: 'kpi',
      kpiCodes: ['WAULT'],
      refreshable: true,
    },
    data: {
      labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
      datasets: [
        {
          label: 'WAULT (années)',
          data: [5.2, 4.8, 4.5, 4.2, 3.9, 4.1],
          borderColor: THEME_COLORS.accent,
          backgroundColor: `${THEME_COLORS.accent}30`,
          fill: true,
        },
      ],
    },
    config: {
      title: 'Évolution du WAULT',
      subtitle: 'Durée moyenne pondérée des baux',
      legend: { show: false, position: 'top' },
      xAxis: { label: 'Année' },
      yAxis: { label: 'WAULT (années)' },
      showGrid: true,
    },
  },
  {
    id: 'chart-loyers-activite',
    name: 'Loyers par Activité',
    description: 'Répartition des loyers par type d\'activité',
    category: 'locatif',
    chartType: 'treemap',
    compatibleReportTypes: ['ETAT_LOCATIF_REPORT', 'MERCHANDISING_MIX', 'BENCHMARK_LOYERS'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Mode', 'Restauration', 'Services', 'Beauté/Santé', 'Culture', 'Alimentaire'],
      datasets: [
        {
          label: 'Loyers (k€)',
          data: [450, 320, 180, 150, 120, 100],
          backgroundColor: CHART_COLORS,
        },
      ],
    },
    config: {
      title: 'Loyers par Activité',
      subtitle: 'Répartition annuelle',
      showGrid: false,
    },
  },

  // ============================================================================
  // CATEGORIE: FREQUENTATION
  // ============================================================================
  {
    id: 'chart-frequentation-mensuelle',
    name: 'Fréquentation Mensuelle',
    description: 'Évolution de la fréquentation sur 12 mois',
    category: 'frequentation',
    chartType: 'combo',
    compatibleReportTypes: ['ANALYSE_FREQUENTATION', 'TDB_CENTRE', 'PERF_ACTIF', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'kpi',
      kpiCodes: ['FREQUENTATION'],
      refreshable: true,
    },
    data: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: [
        {
          label: 'Visiteurs (k)',
          data: [180, 165, 195, 210, 225, 200, 185, 170, 205, 230, 280, 310],
          backgroundColor: THEME_COLORS.purple,
          type: 'bar',
        },
        {
          label: 'N-1 (k)',
          data: [175, 160, 185, 200, 215, 195, 180, 165, 195, 220, 265, 295],
          borderColor: THEME_COLORS.gray,
          backgroundColor: 'transparent',
          type: 'line',
          fill: false,
        },
      ],
    },
    config: {
      title: 'Fréquentation Mensuelle',
      subtitle: 'Année courante vs N-1',
      legend: { show: true, position: 'top' },
      xAxis: { label: 'Mois' },
      yAxis: { label: 'Visiteurs (milliers)' },
      showGrid: true,
    },
  },
  {
    id: 'chart-frequentation-semaine',
    name: 'Répartition Hebdomadaire',
    description: 'Fréquentation par jour de la semaine',
    category: 'frequentation',
    chartType: 'radar',
    compatibleReportTypes: ['ANALYSE_FREQUENTATION', 'TDB_CENTRE'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
      datasets: [
        {
          label: 'Fréquentation (%)',
          data: [8, 9, 12, 11, 15, 28, 17],
          backgroundColor: `${THEME_COLORS.purple}40`,
          borderColor: THEME_COLORS.purple,
        },
      ],
    },
    config: {
      title: 'Répartition Hebdomadaire',
      subtitle: 'Part de fréquentation par jour',
      legend: { show: false, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-heatmap-horaires',
    name: 'Carte de Chaleur Horaires',
    description: 'Affluence par jour et heure',
    category: 'frequentation',
    chartType: 'heatmap',
    compatibleReportTypes: ['ANALYSE_FREQUENTATION'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h'],
      datasets: [
        {
          label: 'Lun-Ven',
          data: [20, 35, 55, 60, 45, 50, 65, 80, 75, 40],
          backgroundColor: CHART_COLORS,
        },
        {
          label: 'Sam',
          data: [45, 65, 80, 90, 85, 95, 100, 95, 80, 55],
          backgroundColor: CHART_COLORS,
        },
        {
          label: 'Dim',
          data: [30, 45, 60, 65, 55, 50, 45, 35, 25, 15],
          backgroundColor: CHART_COLORS,
        },
      ],
    },
    config: {
      title: 'Affluence par Horaire',
      subtitle: 'Indice de fréquentation',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },

  // ============================================================================
  // CATEGORIE: COMMERCIAL
  // ============================================================================
  {
    id: 'chart-evolution-ca',
    name: 'Évolution du CA',
    description: 'Chiffre d\'affaires mensuel des enseignes',
    category: 'commercial',
    chartType: 'area',
    compatibleReportTypes: ['ANALYSE_CA', 'PERF_ENSEIGNES', 'TDB_CENTRE', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'kpi',
      kpiCodes: ['CA_TOTAL'],
      refreshable: true,
    },
    data: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: [
        {
          label: 'CA 2025 (M€)',
          data: [4.2, 3.8, 4.5, 4.8, 5.2, 4.6, 4.3, 3.9, 4.7, 5.4, 6.8, 7.5],
          borderColor: THEME_COLORS.orange,
          backgroundColor: `${THEME_COLORS.orange}30`,
          fill: true,
        },
        {
          label: 'CA 2024 (M€)',
          data: [4.0, 3.6, 4.2, 4.5, 4.9, 4.3, 4.1, 3.7, 4.4, 5.1, 6.4, 7.1],
          borderColor: THEME_COLORS.gray,
          backgroundColor: 'transparent',
          fill: false,
        },
      ],
    },
    config: {
      title: 'Évolution du Chiffre d\'Affaires',
      subtitle: 'Comparaison N vs N-1',
      legend: { show: true, position: 'top' },
      xAxis: { label: 'Mois' },
      yAxis: { label: 'CA (M€)' },
      showGrid: true,
    },
  },
  {
    id: 'chart-top-enseignes',
    name: 'Top 10 Enseignes',
    description: 'Classement des enseignes par CA',
    category: 'commercial',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['PERF_ENSEIGNES', 'ANALYSE_CA', 'TDB_CENTRE'],
    dataSource: {
      type: 'entity',
      entityType: 'locataires',
      refreshable: true,
    },
    data: {
      labels: ['Zara', 'H&M', 'McDonald\'s', 'Fnac', 'Sephora', 'Nike', 'Apple', 'Starbucks', 'Mango', 'Carrefour'],
      datasets: [
        {
          label: 'CA (k€)',
          data: [850, 720, 580, 520, 480, 450, 420, 380, 350, 320],
          backgroundColor: THEME_COLORS.orange,
        },
      ],
    },
    config: {
      title: 'Top 10 Enseignes',
      subtitle: 'Par chiffre d\'affaires',
      legend: { show: false, position: 'top' },
      xAxis: { label: 'CA (k€)' },
      showGrid: true,
    },
  },
  {
    id: 'chart-funnel-commercial',
    name: 'Pipeline Commercial',
    description: 'Entonnoir des négociations commerciales',
    category: 'commercial',
    chartType: 'funnel',
    compatibleReportTypes: ['PIPELINE_COMMERCIAL', 'COMMERCIALISATION_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'prospects',
      refreshable: true,
    },
    data: {
      labels: ['Contacts', 'Qualifiés', 'Offres envoyées', 'Négociation', 'Signés'],
      datasets: [
        {
          label: 'Prospects',
          data: [150, 85, 42, 18, 8],
          backgroundColor: CHART_COLORS,
        },
      ],
    },
    config: {
      title: 'Pipeline Commercial',
      subtitle: 'État des négociations',
      showGrid: false,
    },
  },

  // ============================================================================
  // CATEGORIE: PROJET HANDOVER
  // ============================================================================
  {
    id: 'chart-avancement-global-projet',
    name: 'Avancement Global du Projet',
    description: 'Taux d\'avancement global du projet de handover Angré',
    category: 'projet',
    chartType: 'gauge',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'REPORTING_PROJET', 'BILAN_HANDOVER', 'FLASH_PROJET', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Avancement'],
      datasets: [
        {
          label: 'Avancement global',
          data: [68],
          backgroundColor: [THEME_COLORS.primary],
        },
      ],
    },
    config: {
      title: 'Avancement Global',
      subtitle: 'Projet Handover Angré',
      showGrid: false,
    },
  },
  {
    id: 'chart-avancement-par-axe',
    name: 'Avancement par Axe Stratégique',
    description: 'Progression du projet par axe de la feuille de route',
    category: 'projet',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'REPORTING_PROJET', 'BILAN_HANDOVER', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: [
        'AXE 1 - Performance Financière',
        'AXE 2 - Excellence Opérationnelle',
        'AXE 3 - Gouvernance',
        'AXE 4 - Développement Commercial',
        'AXE 5 - Capital Humain',
        'AXE 6 - Relations Stakeholders',
      ],
      datasets: [
        {
          label: 'Avancement (%)',
          data: [75, 62, 80, 55, 70, 65],
          backgroundColor: THEME_COLORS.primary,
        },
        {
          label: 'Objectif (%)',
          data: [80, 70, 85, 60, 75, 70],
          backgroundColor: THEME_COLORS.gray,
        },
      ],
    },
    config: {
      title: 'Avancement par Axe',
      subtitle: 'Réel vs Objectif',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-actions-par-statut',
    name: 'Actions par Statut',
    description: 'Répartition des actions selon leur statut',
    category: 'projet',
    chartType: 'donut',
    compatibleReportTypes: ['SUIVI_ACTIONS', 'AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'FLASH_PROJET', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'entity',
      entityType: 'actions',
      refreshable: true,
    },
    data: {
      labels: ['Terminées', 'En cours', 'À faire', 'Bloquées', 'En retard'],
      datasets: [
        {
          label: 'Actions',
          data: [45, 28, 15, 5, 7],
          backgroundColor: [THEME_COLORS.success, THEME_COLORS.info, THEME_COLORS.gray, THEME_COLORS.error, THEME_COLORS.warning],
        },
      ],
    },
    config: {
      title: 'Répartition des Actions',
      subtitle: 'Par statut',
      legend: { show: true, position: 'right' },
      showGrid: false,
    },
  },
  {
    id: 'chart-actions-par-priorite',
    name: 'Actions par Priorité',
    description: 'Distribution des actions par niveau de priorité',
    category: 'projet',
    chartType: 'bar',
    compatibleReportTypes: ['SUIVI_ACTIONS', 'AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'FLASH_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'actions',
      refreshable: true,
    },
    data: {
      labels: ['Critique', 'Haute', 'Moyenne', 'Basse'],
      datasets: [
        {
          label: 'Terminées',
          data: [8, 15, 18, 4],
          backgroundColor: THEME_COLORS.success,
        },
        {
          label: 'En cours',
          data: [3, 10, 12, 3],
          backgroundColor: THEME_COLORS.info,
        },
        {
          label: 'À faire',
          data: [2, 5, 6, 2],
          backgroundColor: THEME_COLORS.gray,
        },
      ],
    },
    config: {
      title: 'Actions par Priorité',
      subtitle: 'Répartition par statut',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-burndown-actions',
    name: 'Burndown Actions',
    description: 'Évolution du nombre d\'actions restantes dans le temps',
    category: 'projet',
    chartType: 'area',
    compatibleReportTypes: ['SUIVI_ACTIONS', 'AVANCEMENT_PROJET', 'REPORTING_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12'],
      datasets: [
        {
          label: 'Actions restantes',
          data: [100, 95, 88, 82, 75, 68, 60, 52, 45, 38, 30, 22],
          borderColor: THEME_COLORS.primary,
          backgroundColor: `${THEME_COLORS.primary}30`,
          fill: true,
        },
        {
          label: 'Tendance idéale',
          data: [100, 92, 84, 76, 68, 60, 52, 44, 36, 28, 20, 12],
          borderColor: THEME_COLORS.gray,
          backgroundColor: 'transparent',
          fill: false,
        },
      ],
    },
    config: {
      title: 'Burndown des Actions',
      subtitle: 'Progression sur 12 semaines',
      legend: { show: true, position: 'top' },
      xAxis: { label: 'Semaine' },
      yAxis: { label: 'Actions restantes' },
      showGrid: true,
    },
  },
  {
    id: 'chart-jalons-timeline',
    name: 'Timeline des Jalons',
    description: 'Chronologie des jalons du projet avec leur statut',
    category: 'projet',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['SUIVI_JALONS', 'AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'jalons',
      refreshable: true,
    },
    data: {
      labels: [
        'J1 - Audit initial',
        'J2 - Plan de transition',
        'J3 - Formation équipes',
        'J4 - Mise en place SI',
        'J5 - Transfert opérations',
        'J6 - Validation propriétaire',
        'J7 - Clôture handover',
      ],
      datasets: [
        {
          label: 'Avancement (%)',
          data: [100, 100, 85, 70, 45, 20, 0],
          backgroundColor: [
            THEME_COLORS.success,
            THEME_COLORS.success,
            THEME_COLORS.info,
            THEME_COLORS.info,
            THEME_COLORS.warning,
            THEME_COLORS.gray,
            THEME_COLORS.gray,
          ],
        },
      ],
    },
    config: {
      title: 'État des Jalons',
      subtitle: 'Projet Handover Angré',
      legend: { show: false, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-jalons-atteints',
    name: 'Jalons Atteints vs Planifiés',
    description: 'Comparaison des jalons atteints par rapport au planning',
    category: 'projet',
    chartType: 'bar',
    compatibleReportTypes: ['SUIVI_JALONS', 'AVANCEMENT_PROJET', 'FLASH_PROJET', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Jalons atteints',
          data: [2, 3, 2, 4, 3, 2],
          backgroundColor: THEME_COLORS.success,
        },
        {
          label: 'Jalons planifiés',
          data: [2, 3, 3, 4, 4, 3],
          backgroundColor: THEME_COLORS.gray,
        },
      ],
    },
    config: {
      title: 'Jalons Atteints vs Planifiés',
      subtitle: 'Suivi mensuel',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-risques-par-categorie',
    name: 'Risques par Catégorie',
    description: 'Distribution des risques par catégorie',
    category: 'projet',
    chartType: 'pie',
    compatibleReportTypes: ['ANALYSE_RISQUES', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'risques',
      refreshable: true,
    },
    data: {
      labels: ['Technique', 'Financier', 'Organisationnel', 'Juridique', 'RH', 'Externe'],
      datasets: [
        {
          label: 'Risques',
          data: [8, 5, 12, 3, 6, 4],
          backgroundColor: CHART_COLORS,
        },
      ],
    },
    config: {
      title: 'Risques par Catégorie',
      subtitle: 'Répartition',
      legend: { show: true, position: 'right' },
      showGrid: false,
    },
  },
  {
    id: 'chart-risques-matrice',
    name: 'Matrice des Risques',
    description: 'Positionnement des risques selon probabilité et impact',
    category: 'projet',
    chartType: 'scatter',
    compatibleReportTypes: ['ANALYSE_RISQUES', 'DASHBOARD_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'entity',
      entityType: 'risques',
      refreshable: true,
    },
    data: {
      labels: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'],
      datasets: [
        {
          label: 'Risques critiques',
          data: [85, 90, 75],
          backgroundColor: THEME_COLORS.error,
        },
        {
          label: 'Risques majeurs',
          data: [60, 70, 55, 65],
          backgroundColor: THEME_COLORS.warning,
        },
        {
          label: 'Risques modérés',
          data: [35, 40, 30],
          backgroundColor: THEME_COLORS.info,
        },
      ],
    },
    config: {
      title: 'Matrice des Risques',
      subtitle: 'Probabilité × Impact',
      legend: { show: true, position: 'top' },
      xAxis: { label: 'Probabilité' },
      yAxis: { label: 'Impact' },
      showGrid: true,
    },
  },
  {
    id: 'chart-risques-evolution',
    name: 'Évolution des Risques',
    description: 'Évolution du nombre de risques actifs dans le temps',
    category: 'projet',
    chartType: 'line',
    compatibleReportTypes: ['ANALYSE_RISQUES', 'REPORTING_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Risques critiques',
          data: [5, 4, 3, 3, 2, 2],
          borderColor: THEME_COLORS.error,
          backgroundColor: 'transparent',
        },
        {
          label: 'Risques majeurs',
          data: [8, 9, 7, 6, 5, 4],
          borderColor: THEME_COLORS.warning,
          backgroundColor: 'transparent',
        },
        {
          label: 'Risques modérés',
          data: [12, 10, 11, 9, 8, 7],
          borderColor: THEME_COLORS.info,
          backgroundColor: 'transparent',
        },
      ],
    },
    config: {
      title: 'Évolution des Risques',
      subtitle: 'Par niveau de criticité',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-budget-projet',
    name: 'Budget Projet Handover',
    description: 'Suivi budgétaire du projet de handover',
    category: 'projet',
    chartType: 'bar',
    compatibleReportTypes: ['BUDGET_PROJET', 'AVANCEMENT_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Études', 'Travaux', 'Équipements', 'Formation', 'Conseil', 'Divers'],
      datasets: [
        {
          label: 'Budget (k€)',
          data: [150, 450, 200, 80, 120, 50],
          backgroundColor: THEME_COLORS.gray,
        },
        {
          label: 'Consommé (k€)',
          data: [145, 320, 180, 45, 95, 30],
          backgroundColor: THEME_COLORS.primary,
        },
      ],
    },
    config: {
      title: 'Budget Projet Handover',
      subtitle: 'Prévu vs Consommé',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-equipe-charge',
    name: 'Charge Équipe Projet',
    description: 'Répartition de la charge de travail de l\'équipe projet',
    category: 'projet',
    chartType: 'stacked_bar',
    compatibleReportTypes: ['DASHBOARD_PROJET', 'REPORTING_PROJET', 'FLASH_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Directeur', 'Chef projet', 'Resp. Tech.', 'Resp. Fin.', 'Coord. RH'],
      datasets: [
        {
          label: 'Actions terminées',
          data: [12, 25, 18, 15, 10],
          backgroundColor: THEME_COLORS.success,
        },
        {
          label: 'Actions en cours',
          data: [3, 8, 6, 4, 5],
          backgroundColor: THEME_COLORS.info,
        },
        {
          label: 'Actions à venir',
          data: [2, 5, 4, 3, 3],
          backgroundColor: THEME_COLORS.gray,
        },
      ],
    },
    config: {
      title: 'Charge Équipe Projet',
      subtitle: 'Actions par membre',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },

  // ============================================================================
  // CATEGORIE: DEEPDIVE - PRESENTATIONS DG
  // ============================================================================
  {
    id: 'chart-deepdive-weather-history',
    name: 'Historique Météo Projet',
    description: 'Évolution de la météo du projet au fil des DeepDives',
    category: 'projet',
    chartType: 'line',
    compatibleReportTypes: ['FLASH_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['DeepDive 1', 'DeepDive 2', 'DeepDive 3', 'DeepDive 4', 'DeepDive 5', 'DeepDive 6'],
      datasets: [
        {
          label: 'Score Santé (0-100)',
          data: [45, 55, 60, 72, 68, 78],
          borderColor: THEME_COLORS.primary,
          backgroundColor: `${THEME_COLORS.primary}20`,
          fill: true,
        },
      ],
    },
    config: {
      title: 'Évolution Santé Projet',
      subtitle: 'Score agrégé par DeepDive',
      legend: { show: false, position: 'top' },
      xAxis: { label: 'Présentation' },
      yAxis: { label: 'Score (0-100)' },
      showGrid: true,
    },
  },
  {
    id: 'chart-deepdive-decisions-urgency',
    name: 'Points de Décision par Urgence',
    description: 'Répartition des décisions attendues par niveau d\'urgence',
    category: 'projet',
    chartType: 'donut',
    compatibleReportTypes: ['FLASH_PROJET', 'DASHBOARD_PROJET', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Critique', 'Haute', 'Moyenne', 'Basse'],
      datasets: [
        {
          label: 'Décisions',
          data: [3, 5, 8, 4],
          backgroundColor: [THEME_COLORS.error, THEME_COLORS.warning, THEME_COLORS.info, THEME_COLORS.success],
        },
      ],
    },
    config: {
      title: 'Points de Décision DG',
      subtitle: 'Par niveau d\'urgence',
      legend: { show: true, position: 'right' },
      showGrid: false,
    },
  },
  {
    id: 'chart-deepdive-budget-consumption',
    name: 'Consommation Budget Globale',
    description: 'Taux de consommation du budget par axe stratégique',
    category: 'projet',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['FLASH_PROJET', 'BUDGET_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['AXE 1 - Finance', 'AXE 2 - Opérations', 'AXE 3 - Gouvernance', 'AXE 4 - Commercial', 'AXE 5 - RH', 'AXE 6 - Stakeholders'],
      datasets: [
        {
          label: 'Budget alloué (k€)',
          data: [250, 180, 120, 200, 150, 100],
          backgroundColor: THEME_COLORS.gray,
        },
        {
          label: 'Consommé (k€)',
          data: [185, 145, 95, 120, 110, 65],
          backgroundColor: THEME_COLORS.primary,
        },
      ],
    },
    config: {
      title: 'Consommation Budget',
      subtitle: 'Par axe stratégique',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-deepdive-kpi-radar',
    name: 'Radar KPIs Clés',
    description: 'Vue synthétique des KPIs principaux du projet',
    category: 'projet',
    chartType: 'radar',
    compatibleReportTypes: ['FLASH_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Avancement', 'Budget', 'Qualité', 'Délais', 'Risques', 'Satisfaction'],
      datasets: [
        {
          label: 'Actuel',
          data: [75, 82, 68, 65, 70, 78],
          borderColor: THEME_COLORS.primary,
          backgroundColor: `${THEME_COLORS.primary}30`,
        },
        {
          label: 'Objectif',
          data: [80, 85, 75, 80, 80, 85],
          borderColor: THEME_COLORS.secondary,
          backgroundColor: `${THEME_COLORS.secondary}20`,
        },
      ],
    },
    config: {
      title: 'KPIs Clés du Projet',
      subtitle: 'Actuel vs Objectif',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-deepdive-axes-comparison',
    name: 'Comparaison Axes Stratégiques',
    description: 'Performance comparée des 6 axes du projet',
    category: 'projet',
    chartType: 'bar',
    compatibleReportTypes: ['FLASH_PROJET', 'DASHBOARD_PROJET', 'AVANCEMENT_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['AXE 1', 'AXE 2', 'AXE 3', 'AXE 4', 'AXE 5', 'AXE 6'],
      datasets: [
        {
          label: 'Actions terminées',
          data: [14, 14, 12, 11, 11, 8],
          backgroundColor: THEME_COLORS.success,
        },
        {
          label: 'Actions en cours',
          data: [3, 6, 2, 6, 4, 3],
          backgroundColor: THEME_COLORS.info,
        },
        {
          label: 'Actions en retard',
          data: [1, 2, 1, 3, 1, 1],
          backgroundColor: THEME_COLORS.error,
        },
      ],
    },
    config: {
      title: 'Performance par Axe',
      subtitle: 'État des actions',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-deepdive-timeline-milestones',
    name: 'Timeline Jalons Clés',
    description: 'Chronologie des jalons majeurs avec statut',
    category: 'projet',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['FLASH_PROJET', 'SUIVI_JALONS', 'DASHBOARD_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'entity',
      entityType: 'jalons',
      refreshable: true,
    },
    data: {
      labels: ['Audit initial', 'Plan transition', 'Formation', 'Mise en place SI', 'Transfert ops', 'Clôture'],
      datasets: [
        {
          label: 'Réalisé (%)',
          data: [100, 100, 85, 70, 45, 0],
          backgroundColor: [THEME_COLORS.success, THEME_COLORS.success, THEME_COLORS.info, THEME_COLORS.info, THEME_COLORS.warning, THEME_COLORS.gray],
        },
      ],
    },
    config: {
      title: 'Avancement Jalons Majeurs',
      subtitle: 'Progression vers les objectifs',
      legend: { show: false, position: 'top' },
      showGrid: true,
    },
  },

  // ============================================================================
  // CATEGORIE: BATIMENTS ANGRÉ (Vues par structure)
  // ============================================================================
  {
    id: 'chart-avancement-par-batiment',
    name: 'Avancement par Bâtiment',
    description: 'Progression du projet par structure (CC, Big Box, ZE, MA, PK)',
    category: 'projet',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'REPORTING_PROJET', 'BILAN_HANDOVER', 'FLASH_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'buildings',
      refreshable: true,
    },
    data: {
      labels: ['Centre Commercial', 'Big Box 1', 'Big Box 2', 'Big Box 3', 'Big Box 4', 'Zone Exposition', 'Marché Artisanal', 'Parking'],
      datasets: [
        {
          label: 'Avancement (%)',
          data: [45, 30, 25, 20, 15, 35, 40, 35],
          backgroundColor: [THEME_COLORS.primary, THEME_COLORS.secondary, THEME_COLORS.secondary, THEME_COLORS.secondary, THEME_COLORS.secondary, THEME_COLORS.accent, THEME_COLORS.purple, THEME_COLORS.info],
        },
      ],
    },
    config: {
      title: 'Avancement par Structure',
      subtitle: 'Progression globale des 8 structures du projet',
      legend: { show: false, position: 'top' },
      xAxis: { label: 'Avancement (%)' },
      showGrid: true,
    },
  },
  {
    id: 'chart-actions-par-batiment',
    name: 'Actions par Bâtiment',
    description: 'Répartition des actions par structure du projet',
    category: 'projet',
    chartType: 'stacked_bar',
    compatibleReportTypes: ['SUIVI_ACTIONS', 'AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'FLASH_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'actions',
      refreshable: true,
    },
    data: {
      labels: ['CC', 'BB1', 'BB2', 'BB3', 'BB4', 'ZE', 'MA', 'PK'],
      datasets: [
        {
          label: 'Terminées',
          data: [12, 5, 4, 3, 2, 6, 8, 5],
          backgroundColor: THEME_COLORS.success,
        },
        {
          label: 'En cours',
          data: [8, 4, 5, 4, 3, 4, 5, 4],
          backgroundColor: THEME_COLORS.info,
        },
        {
          label: 'En retard',
          data: [2, 1, 1, 2, 1, 1, 1, 1],
          backgroundColor: THEME_COLORS.error,
        },
        {
          label: 'À faire',
          data: [5, 3, 4, 5, 6, 3, 2, 3],
          backgroundColor: THEME_COLORS.gray,
        },
      ],
    },
    config: {
      title: 'Actions par Bâtiment',
      subtitle: 'Distribution des actions par structure et statut',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-risques-par-batiment',
    name: 'Risques par Bâtiment',
    description: 'Distribution des risques par structure du projet',
    category: 'projet',
    chartType: 'bar',
    compatibleReportTypes: ['ANALYSE_RISQUES', 'DASHBOARD_PROJET', 'FLASH_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'entity',
      entityType: 'risques',
      refreshable: true,
    },
    data: {
      labels: ['CC', 'BB1', 'BB2', 'BB3', 'BB4', 'ZE', 'MA', 'PK'],
      datasets: [
        {
          label: 'Risques critiques',
          data: [3, 1, 1, 1, 0, 1, 0, 1],
          backgroundColor: THEME_COLORS.error,
        },
        {
          label: 'Risques modérés',
          data: [5, 2, 2, 2, 2, 2, 3, 2],
          backgroundColor: THEME_COLORS.warning,
        },
        {
          label: 'Risques faibles',
          data: [4, 2, 3, 2, 3, 2, 2, 3],
          backgroundColor: THEME_COLORS.success,
        },
      ],
    },
    config: {
      title: 'Risques par Structure',
      subtitle: 'Criticité des risques par bâtiment',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-jalons-par-batiment',
    name: 'Jalons par Bâtiment',
    description: 'État des jalons par structure du projet',
    category: 'projet',
    chartType: 'stacked_bar',
    compatibleReportTypes: ['SUIVI_JALONS', 'AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'entity',
      entityType: 'jalons',
      refreshable: true,
    },
    data: {
      labels: ['CC', 'BB1', 'BB2', 'BB3', 'BB4', 'ZE', 'MA', 'PK'],
      datasets: [
        {
          label: 'Atteints',
          data: [4, 2, 1, 1, 1, 2, 3, 2],
          backgroundColor: THEME_COLORS.success,
        },
        {
          label: 'En cours',
          data: [2, 2, 2, 2, 1, 1, 1, 1],
          backgroundColor: THEME_COLORS.info,
        },
        {
          label: 'À venir',
          data: [3, 4, 5, 5, 6, 3, 2, 3],
          backgroundColor: THEME_COLORS.gray,
        },
      ],
    },
    config: {
      title: 'Jalons par Structure',
      subtitle: 'Progression des jalons par bâtiment',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-comparatif-batiments',
    name: 'Comparatif Avancement Bâtiments',
    description: 'Radar comparatif multi-critères des 8 structures',
    category: 'projet',
    chartType: 'radar',
    compatibleReportTypes: ['DASHBOARD_PROJET', 'FLASH_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Avancement', 'Actions terminées', 'Jalons atteints', 'Risques maîtrisés', 'Budget consommé'],
      datasets: [
        {
          label: 'Centre Commercial',
          data: [45, 60, 55, 70, 50],
          borderColor: THEME_COLORS.primary,
          backgroundColor: `${THEME_COLORS.primary}30`,
        },
        {
          label: 'Big Box (moyenne)',
          data: [22, 40, 35, 65, 25],
          borderColor: THEME_COLORS.secondary,
          backgroundColor: `${THEME_COLORS.secondary}30`,
        },
        {
          label: 'Autres structures',
          data: [37, 55, 50, 75, 40],
          borderColor: THEME_COLORS.accent,
          backgroundColor: `${THEME_COLORS.accent}30`,
        },
      ],
    },
    config: {
      title: 'Comparatif Multi-critères',
      subtitle: 'Performance relative des structures',
      legend: { show: true, position: 'bottom' },
      showGrid: true,
    },
  },

  // ============================================================================
  // CATEGORIE: OPR / LEVÉE DE RÉSERVES
  // ============================================================================
  {
    id: 'chart-reserves-par-batiment',
    name: 'Réserves par Bâtiment',
    description: 'État des réserves OPR par structure',
    category: 'projet',
    chartType: 'stacked_bar',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'FLASH_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['CC', 'BB1', 'BB2', 'BB3', 'BB4', 'ZE', 'MA', 'PK'],
      datasets: [
        {
          label: 'Levées',
          data: [45, 12, 8, 5, 3, 18, 25, 15],
          backgroundColor: THEME_COLORS.success,
        },
        {
          label: 'En cours',
          data: [25, 8, 10, 8, 5, 10, 12, 8],
          backgroundColor: THEME_COLORS.warning,
        },
        {
          label: 'Ouvertes',
          data: [15, 5, 7, 10, 12, 5, 3, 5],
          backgroundColor: THEME_COLORS.error,
        },
      ],
    },
    config: {
      title: 'Réserves OPR par Structure',
      subtitle: 'État de levée des réserves',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-taux-levee-reserves',
    name: 'Taux de Levée des Réserves',
    description: 'Pourcentage de réserves levées par bâtiment',
    category: 'projet',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Centre Commercial', 'Big Box 1', 'Big Box 2', 'Big Box 3', 'Big Box 4', 'Zone Exposition', 'Marché Artisanal', 'Parking'],
      datasets: [
        {
          label: 'Taux de levée (%)',
          data: [53, 48, 32, 22, 15, 55, 63, 54],
          backgroundColor: [THEME_COLORS.success, THEME_COLORS.warning, THEME_COLORS.warning, THEME_COLORS.error, THEME_COLORS.error, THEME_COLORS.success, THEME_COLORS.success, THEME_COLORS.success],
        },
      ],
    },
    config: {
      title: 'Taux de Levée des Réserves',
      subtitle: 'Progression par structure',
      legend: { show: false, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-evolution-reserves',
    name: 'Évolution des Réserves',
    description: 'Évolution du nombre de réserves dans le temps',
    category: 'projet',
    chartType: 'area',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
      datasets: [
        {
          label: 'Ouvertes',
          data: [120, 145, 160, 155, 140, 125, 95, 62],
          borderColor: THEME_COLORS.error,
          backgroundColor: `${THEME_COLORS.error}30`,
          fill: true,
        },
        {
          label: 'Levées (cumulé)',
          data: [0, 15, 35, 60, 95, 135, 180, 230],
          borderColor: THEME_COLORS.success,
          backgroundColor: `${THEME_COLORS.success}30`,
          fill: true,
        },
      ],
    },
    config: {
      title: 'Évolution des Réserves',
      subtitle: 'Tendance hebdomadaire',
      legend: { show: true, position: 'top' },
      xAxis: { label: 'Semaine' },
      yAxis: { label: 'Nombre de réserves' },
      showGrid: true,
    },
  },
  {
    id: 'chart-reserves-par-categorie',
    name: 'Réserves par Catégorie',
    description: 'Distribution des réserves par type',
    category: 'projet',
    chartType: 'donut',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'FLASH_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Technique', 'Finitions', 'Électricité', 'Plomberie', 'CVC', 'Sécurité', 'Autres'],
      datasets: [
        {
          label: 'Réserves',
          data: [35, 25, 15, 10, 8, 4, 3],
          backgroundColor: CHART_COLORS,
        },
      ],
    },
    config: {
      title: 'Réserves par Catégorie',
      subtitle: 'Distribution par type de réserve',
      legend: { show: true, position: 'right' },
      showGrid: false,
    },
  },

  // ============================================================================
  // CATEGORIE: COMMERCIALISATION
  // ============================================================================
  {
    id: 'chart-commercialisation-par-batiment',
    name: 'Commercialisation par Bâtiment',
    description: 'Taux de pré-commercialisation par structure',
    category: 'projet',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'COMMERCIALISATION_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Centre Commercial', 'Big Box 1', 'Big Box 2', 'Big Box 3', 'Big Box 4', 'Zone Exposition', 'Marché Artisanal', 'Parking'],
      datasets: [
        {
          label: 'Commercialisé (%)',
          data: [78, 100, 85, 60, 45, 70, 90, 100],
          backgroundColor: [THEME_COLORS.success, THEME_COLORS.success, THEME_COLORS.success, THEME_COLORS.warning, THEME_COLORS.warning, THEME_COLORS.success, THEME_COLORS.success, THEME_COLORS.success],
        },
      ],
    },
    config: {
      title: 'Pré-commercialisation',
      subtitle: 'Taux par structure',
      legend: { show: false, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-surfaces-commerciales',
    name: 'Surfaces Commercialisées vs Libres',
    description: 'Répartition des surfaces par état de commercialisation',
    category: 'projet',
    chartType: 'stacked_bar',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'COMMERCIALISATION_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['CC', 'BB1', 'BB2', 'BB3', 'BB4', 'ZE', 'MA', 'PK'],
      datasets: [
        {
          label: 'Loué (m²)',
          data: [19500, 6000, 5100, 3600, 2700, 2800, 2700, 8000],
          backgroundColor: THEME_COLORS.success,
        },
        {
          label: 'En négociation (m²)',
          data: [2500, 0, 600, 1200, 1500, 700, 200, 0],
          backgroundColor: THEME_COLORS.warning,
        },
        {
          label: 'Libre (m²)',
          data: [3000, 0, 300, 1200, 1800, 500, 100, 0],
          backgroundColor: THEME_COLORS.gray,
        },
      ],
    },
    config: {
      title: 'Surfaces par État',
      subtitle: 'Commercialisation par structure',
      legend: { show: true, position: 'top' },
      yAxis: { label: 'Surface (m²)' },
      showGrid: true,
    },
  },
  {
    id: 'chart-pipeline-commercial',
    name: 'Pipeline Commercial Global',
    description: 'Funnel de prospection commerciale',
    category: 'projet',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['COMMERCIALISATION_PROJET', 'DASHBOARD_PROJET', 'FLASH_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Prospects identifiés', 'Premier contact', 'Visite effectuée', 'Offre envoyée', 'Négociation', 'Signé'],
      datasets: [
        {
          label: 'Nombre de prospects',
          data: [85, 62, 45, 28, 18, 12],
          backgroundColor: [THEME_COLORS.gray, THEME_COLORS.info, THEME_COLORS.info, THEME_COLORS.warning, THEME_COLORS.warning, THEME_COLORS.success],
        },
      ],
    },
    config: {
      title: 'Pipeline Commercial',
      subtitle: 'Entonnoir de conversion',
      legend: { show: false, position: 'top' },
      showGrid: true,
    },
  },

  // ============================================================================
  // CATEGORIE: PHASES DE CONSTRUCTION
  // ============================================================================
  {
    id: 'chart-phases-par-batiment',
    name: 'Phases par Bâtiment',
    description: 'Avancement des phases de construction par structure',
    category: 'projet',
    chartType: 'stacked_bar',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['CC', 'BB1', 'BB2', 'BB3', 'BB4', 'ZE', 'MA', 'PK'],
      datasets: [
        {
          label: 'Études',
          data: [100, 100, 100, 100, 100, 100, 100, 100],
          backgroundColor: THEME_COLORS.success,
        },
        {
          label: 'Travaux',
          data: [85, 65, 55, 45, 35, 70, 80, 75],
          backgroundColor: THEME_COLORS.info,
        },
        {
          label: 'Mise en service',
          data: [25, 10, 5, 0, 0, 15, 20, 15],
          backgroundColor: THEME_COLORS.purple,
        },
      ],
    },
    config: {
      title: 'Phases par Structure',
      subtitle: 'Etudes > Travaux > Mise en service',
      legend: { show: true, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-timeline-phases',
    name: 'Timeline des Phases',
    description: 'Chronologie des phases de construction',
    category: 'projet',
    chartType: 'horizontal_bar',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Études CC', 'Travaux CC', 'Mise en service CC', 'Études BB', 'Travaux BB', 'Mise en service BB', 'Études Autres', 'Travaux Autres', 'Mise en service Autres'],
      datasets: [
        {
          label: 'Avancement (%)',
          data: [100, 85, 25, 100, 50, 5, 100, 75, 15],
          backgroundColor: [
            THEME_COLORS.success, THEME_COLORS.info, THEME_COLORS.warning,
            THEME_COLORS.success, THEME_COLORS.info, THEME_COLORS.warning,
            THEME_COLORS.success, THEME_COLORS.info, THEME_COLORS.warning,
          ],
        },
      ],
    },
    config: {
      title: 'Avancement des Phases',
      subtitle: 'Par groupe de structures',
      legend: { show: false, position: 'top' },
      showGrid: true,
    },
  },
  {
    id: 'chart-jauge-mise-en-service',
    name: 'Jauge Mise en Service Globale',
    description: 'Progression globale vers la mise en service',
    category: 'projet',
    chartType: 'gauge',
    compatibleReportTypes: ['DASHBOARD_PROJET', 'FLASH_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    data: {
      labels: ['Mise en service'],
      datasets: [
        {
          label: 'Progression',
          data: [42],
          backgroundColor: [THEME_COLORS.info],
        },
      ],
    },
    config: {
      title: 'Mise en Service Globale',
      subtitle: 'Progression vers l\'ouverture',
      showGrid: false,
    },
  },
];

// ============================================================================
// TABLEAUX PRE-DEFINIS
// ============================================================================

export const TABLE_TEMPLATES: TableTemplate[] = [
  // ============================================================================
  // CATEGORIE: LOCATIF
  // ============================================================================
  {
    id: 'table-etat-locatif',
    name: 'État Locatif Synthétique',
    description: 'Vue synthétique de l\'état locatif',
    category: 'locatif',
    compatibleReportTypes: ['ETAT_LOCATIF_REPORT', 'PERF_ACTIF', 'REPORTING_PROPRIETAIRE'],
    dataSource: {
      type: 'entity',
      entityType: 'lots',
      refreshable: true,
    },
    headers: [
      { key: 'locataire', label: 'Locataire', align: 'left' },
      { key: 'lot', label: 'Lot', align: 'left' },
      { key: 'surface', label: 'Surface (m²)', align: 'right', format: 'number' },
      { key: 'loyer', label: 'Loyer annuel (€)', align: 'right', format: 'currency' },
      { key: 'charges', label: 'Charges (€)', align: 'right', format: 'currency' },
      { key: 'finBail', label: 'Fin de bail', align: 'center', format: 'date' },
      { key: 'occupation', label: 'Occupation', align: 'center' },
    ],
    rows: [
      { locataire: 'Zara', lot: 'A-101', surface: 850, loyer: 125000, charges: 28500, finBail: '2027-06-30', occupation: 'Occupé' },
      { locataire: 'H&M', lot: 'A-102', surface: 720, loyer: 108000, charges: 24300, finBail: '2026-12-31', occupation: 'Occupé' },
      { locataire: 'McDonald\'s', lot: 'B-201', surface: 380, loyer: 95000, charges: 12800, finBail: '2028-03-15', occupation: 'Occupé' },
      { locataire: 'Fnac', lot: 'A-201', surface: 1200, loyer: 180000, charges: 40500, finBail: '2025-09-30', occupation: 'Occupé' },
      { locataire: '-', lot: 'B-105', surface: 180, loyer: 0, charges: 0, finBail: '-', occupation: 'Vacant' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
      showTotals: true,
    },
  },
  {
    id: 'table-lots-vacants',
    name: 'Lots Vacants',
    description: 'Liste des lots vacants avec caractéristiques',
    category: 'locatif',
    compatibleReportTypes: ['SUIVI_VACANCE', 'ETAT_LOCATIF_REPORT', 'PIPELINE_COMMERCIAL'],
    dataSource: {
      type: 'entity',
      entityType: 'lots',
      refreshable: true,
    },
    headers: [
      { key: 'lot', label: 'Lot', align: 'left' },
      { key: 'niveau', label: 'Niveau', align: 'center' },
      { key: 'surface', label: 'Surface (m²)', align: 'right', format: 'number' },
      { key: 'loyerCible', label: 'Loyer cible (€/m²)', align: 'right', format: 'currency' },
      { key: 'vacantDepuis', label: 'Vacant depuis', align: 'center', format: 'date' },
      { key: 'statut', label: 'Statut', align: 'center' },
    ],
    rows: [
      { lot: 'B-105', niveau: 'RDC', surface: 180, loyerCible: 450, vacantDepuis: '2025-01-15', statut: 'En négociation' },
      { lot: 'C-302', niveau: 'R+2', surface: 95, loyerCible: 380, vacantDepuis: '2024-11-01', statut: 'Disponible' },
      { lot: 'A-405', niveau: 'R+3', surface: 120, loyerCible: 350, vacantDepuis: '2024-09-15', statut: 'Travaux' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: true,
    },
  },

  // ============================================================================
  // CATEGORIE: BAUX
  // ============================================================================
  {
    id: 'table-echeances-baux',
    name: 'Échéances des Baux',
    description: 'Prochaines échéances de baux',
    category: 'baux',
    compatibleReportTypes: ['SUIVI_BAUX', 'ETAT_LOCATIF_REPORT', 'REPORTING_PROPRIETAIRE'],
    dataSource: {
      type: 'entity',
      entityType: 'baux',
      refreshable: true,
    },
    headers: [
      { key: 'locataire', label: 'Locataire', align: 'left' },
      { key: 'dateEcheance', label: 'Date échéance', align: 'center', format: 'date' },
      { key: 'typeEcheance', label: 'Type', align: 'center' },
      { key: 'loyer', label: 'Loyer actuel (€)', align: 'right', format: 'currency' },
      { key: 'surface', label: 'Surface (m²)', align: 'right', format: 'number' },
      { key: 'action', label: 'Action prévue', align: 'left' },
    ],
    rows: [
      { locataire: 'Fnac', dateEcheance: '2025-09-30', typeEcheance: 'Fin de bail', loyer: 180000, surface: 1200, action: 'Renouvellement en cours' },
      { locataire: 'Sephora', dateEcheance: '2025-12-31', typeEcheance: 'Option sortie', loyer: 95000, surface: 320, action: 'À surveiller' },
      { locataire: 'H&M', dateEcheance: '2026-12-31', typeEcheance: 'Fin de bail', loyer: 108000, surface: 720, action: 'Contact prévu T3' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },

  // ============================================================================
  // CATEGORIE: FINANCIER
  // ============================================================================
  {
    id: 'table-compte-resultat',
    name: 'Compte de Résultat Simplifié',
    description: 'P&L synthétique',
    category: 'financier',
    compatibleReportTypes: ['COMPTE_RESULTAT', 'NOI_ANALYSIS', 'RAPPORT_TRIMESTRIEL', 'RAPPORT_ANNUEL'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'poste', label: 'Poste', align: 'left' },
      { key: 'budget', label: 'Budget (k€)', align: 'right', format: 'currency' },
      { key: 'reel', label: 'Réel (k€)', align: 'right', format: 'currency' },
      { key: 'ecart', label: 'Écart (k€)', align: 'right', format: 'currency' },
      { key: 'ecartPct', label: 'Écart (%)', align: 'right', format: 'percent' },
    ],
    rows: [
      { poste: 'Loyers', budget: 1500, reel: 1580, ecart: 80, ecartPct: 5.3 },
      { poste: 'Charges récupérables', budget: 450, reel: 420, ecart: -30, ecartPct: -6.7 },
      { poste: 'Autres revenus', budget: 50, reel: 55, ecart: 5, ecartPct: 10.0 },
      { poste: 'Total Revenus', budget: 2000, reel: 2055, ecart: 55, ecartPct: 2.8 },
      { poste: 'Charges d\'exploitation', budget: -380, reel: -395, ecart: -15, ecartPct: 3.9 },
      { poste: 'Charges non récupérables', budget: -120, reel: -110, ecart: 10, ecartPct: -8.3 },
      { poste: 'Total Charges', budget: -500, reel: -505, ecart: -5, ecartPct: 1.0 },
      { poste: 'NOI', budget: 1500, reel: 1550, ecart: 50, ecartPct: 3.3 },
    ],
    config: {
      striped: false,
      bordered: true,
      compact: false,
      showTotals: false,
    },
  },

  // ============================================================================
  // CATEGORIE: KPIs
  // ============================================================================
  {
    id: 'table-synthese-kpis',
    name: 'Synthèse KPIs',
    description: 'Tableau de bord des indicateurs clés',
    category: 'kpis',
    compatibleReportTypes: ['TDB_CENTRE', 'PERF_ACTIF', 'RAPPORT_MENSUEL', 'REPORTING_PROPRIETAIRE'],
    dataSource: {
      type: 'kpi',
      refreshable: true,
    },
    headers: [
      { key: 'indicateur', label: 'Indicateur', align: 'left' },
      { key: 'valeur', label: 'Valeur actuelle', align: 'right' },
      { key: 'objectif', label: 'Objectif', align: 'right' },
      { key: 'variation', label: 'Variation', align: 'right' },
      { key: 'statut', label: 'Statut', align: 'center' },
    ],
    rows: [
      { indicateur: 'Taux d\'occupation physique', valeur: '94.5%', objectif: '95%', variation: '+1.2%', statut: 'OK' },
      { indicateur: 'Taux d\'occupation financiere', valeur: '96.2%', objectif: '95%', variation: '+0.8%', statut: 'OK' },
      { indicateur: 'NOI', valeur: '1 550 k EUR', objectif: '1 500 k EUR', variation: '+3.3%', statut: 'OK' },
      { indicateur: 'WAULT', valeur: '4.1 ans', objectif: '4.5 ans', variation: '-0.2 an', statut: 'ATTENTION' },
      { indicateur: 'Frequentation', valeur: '2.8 M', objectif: '2.7 M', variation: '+5.2%', statut: 'OK' },
      { indicateur: 'CA enseignes', valeur: '58 M EUR', objectif: '55 M EUR', variation: '+4.8%', statut: 'OK' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },

  // ============================================================================
  // CATEGORIE: BUDGET
  // ============================================================================
  {
    id: 'table-budget-detaille',
    name: 'Budget Détaillé Cosmos Angré',
    description: 'Suivi budgétaire par poste du projet',
    category: 'projet',
    compatibleReportTypes: ['BUDGET_VS_REEL', 'BUDGET_PROJET', 'GESTION_CHARGES', 'DASHBOARD_PROJET', 'FLASH_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'budget',
      refreshable: true,
    },
    headers: [
      { key: 'poste', label: 'Poste budgétaire', align: 'left' },
      { key: 'budgetAnnuel', label: 'Budget annuel (k€)', align: 'right', format: 'currency' },
      { key: 'consomme', label: 'Consommé (k€)', align: 'right', format: 'currency' },
      { key: 'reste', label: 'Reste (k€)', align: 'right', format: 'currency' },
      { key: 'tauxConso', label: 'Taux conso.', align: 'right', format: 'percent' },
    ],
    rows: [
      { poste: 'Études', budgetAnnuel: 150, consomme: 85, reste: 65, tauxConso: 56.7 },
      { poste: 'Travaux', budgetAnnuel: 800, consomme: 420, reste: 380, tauxConso: 52.5 },
      { poste: 'Équipements', budgetAnnuel: 200, consomme: 180, reste: 20, tauxConso: 90.0 },
      { poste: 'Honoraires', budgetAnnuel: 120, consomme: 65, reste: 55, tauxConso: 54.2 },
      { poste: 'Assurances', budgetAnnuel: 45, consomme: 45, reste: 0, tauxConso: 100.0 },
      { poste: 'Divers', budgetAnnuel: 50, consomme: 25, reste: 25, tauxConso: 50.0 },
      { poste: 'TOTAL', budgetAnnuel: 1365, consomme: 820, reste: 545, tauxConso: 60.1 },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
      showTotals: false,
    },
  },

  // ============================================================================
  // CATEGORIE: PROJET HANDOVER
  // ============================================================================
  {
    id: 'table-actions-projet',
    name: 'Liste des Actions Projet',
    description: 'Actions du projet de handover avec statut et responsable',
    category: 'projet',
    compatibleReportTypes: ['SUIVI_ACTIONS', 'AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'FLASH_PROJET', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'entity',
      entityType: 'actions',
      refreshable: true,
    },
    headers: [
      { key: 'titre', label: 'Action', align: 'left' },
      { key: 'axe', label: 'Axe', align: 'left' },
      { key: 'responsable', label: 'Responsable', align: 'left' },
      { key: 'priorite', label: 'Priorité', align: 'center' },
      { key: 'avancement', label: 'Avancement', align: 'right', format: 'percent' },
      { key: 'echeance', label: 'Échéance', align: 'center', format: 'date' },
      { key: 'statut', label: 'Statut', align: 'center' },
    ],
    rows: [
      { titre: 'Audit des contrats existants', axe: 'AXE 3', responsable: 'J. Martin', priorite: 'Haute', avancement: 100, echeance: '2025-01-15', statut: 'Terminé' },
      { titre: 'Migration système comptable', axe: 'AXE 1', responsable: 'S. Dupont', priorite: 'Critique', avancement: 75, echeance: '2025-02-28', statut: 'En cours' },
      { titre: 'Formation équipe technique', axe: 'AXE 5', responsable: 'M. Bernard', priorite: 'Haute', avancement: 60, echeance: '2025-03-15', statut: 'En cours' },
      { titre: 'Négociation bail anchor', axe: 'AXE 4', responsable: 'A. Dubois', priorite: 'Moyenne', avancement: 30, echeance: '2025-04-30', statut: 'En cours' },
      { titre: 'Mise à jour procédures sécurité', axe: 'AXE 2', responsable: 'P. Moreau', priorite: 'Haute', avancement: 0, echeance: '2025-05-15', statut: 'À faire' },
      { titre: 'Rapport due diligence final', axe: 'AXE 3', responsable: 'J. Martin', priorite: 'Critique', avancement: 0, echeance: '2025-06-30', statut: 'À faire' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },
  {
    id: 'table-jalons-projet',
    name: 'Jalons du Projet',
    description: 'Liste des jalons clés du projet de handover',
    category: 'projet',
    compatibleReportTypes: ['SUIVI_JALONS', 'AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'jalons',
      refreshable: true,
    },
    headers: [
      { key: 'jalon', label: 'Jalon', align: 'left' },
      { key: 'description', label: 'Description', align: 'left' },
      { key: 'date_prevue', label: 'Date prévue', align: 'center', format: 'date' },
      { key: 'date_reelle', label: 'Date réelle', align: 'center', format: 'date' },
      { key: 'avancement', label: 'Avancement', align: 'right', format: 'percent' },
      { key: 'statut', label: 'Statut', align: 'center' },
    ],
    rows: [
      { jalon: 'J1 - Audit initial', description: 'Audit complet de l\'état de l\'actif', date_prevue: '2024-12-15', date_reelle: '2024-12-10', avancement: 100, statut: 'Atteint' },
      { jalon: 'J2 - Plan de transition', description: 'Validation du plan de transition', date_prevue: '2025-01-31', date_reelle: '2025-01-28', avancement: 100, statut: 'Atteint' },
      { jalon: 'J3 - Formation équipes', description: 'Formation des équipes opérationnelles', date_prevue: '2025-03-31', date_reelle: '-', avancement: 85, statut: 'En cours' },
      { jalon: 'J4 - Mise en place SI', description: 'Déploiement des systèmes d\'information', date_prevue: '2025-04-30', date_reelle: '-', avancement: 70, statut: 'En cours' },
      { jalon: 'J5 - Transfert opérations', description: 'Transfert effectif des opérations', date_prevue: '2025-06-30', date_reelle: '-', avancement: 45, statut: 'En cours' },
      { jalon: 'J6 - Validation propriétaire', description: 'Validation finale par le propriétaire', date_prevue: '2025-07-31', date_reelle: '-', avancement: 20, statut: 'Planifié' },
      { jalon: 'J7 - Clôture handover', description: 'Clôture officielle du projet', date_prevue: '2025-08-31', date_reelle: '-', avancement: 0, statut: 'Planifié' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },
  {
    id: 'table-risques-projet',
    name: 'Registre des Risques Projet',
    description: 'Liste des risques identifiés du projet de handover',
    category: 'projet',
    compatibleReportTypes: ['ANALYSE_RISQUES', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'risques',
      refreshable: true,
    },
    headers: [
      { key: 'risque', label: 'Risque', align: 'left' },
      { key: 'categorie', label: 'Catégorie', align: 'left' },
      { key: 'probabilite', label: 'Prob.', align: 'center' },
      { key: 'impact', label: 'Impact', align: 'center' },
      { key: 'score', label: 'Score', align: 'center', format: 'number' },
      { key: 'mitigation', label: 'Plan de mitigation', align: 'left' },
      { key: 'responsable', label: 'Resp.', align: 'left' },
      { key: 'statut', label: 'Statut', align: 'center' },
    ],
    rows: [
      { risque: 'Retard migration SI', categorie: 'Technique', probabilite: 'Élevée', impact: 'Majeur', score: 16, mitigation: 'Plan de backup avec ancien système', responsable: 'S. Dupont', statut: 'Actif' },
      { risque: 'Départ collaborateur clé', categorie: 'RH', probabilite: 'Moyenne', impact: 'Majeur', score: 12, mitigation: 'Documentation et formation croisée', responsable: 'M. Bernard', statut: 'Actif' },
      { risque: 'Dépassement budget', categorie: 'Financier', probabilite: 'Faible', impact: 'Modéré', score: 6, mitigation: 'Réserve de contingence 10%', responsable: 'A. Dubois', statut: 'Surveillé' },
      { risque: 'Non-conformité réglementaire', categorie: 'Juridique', probabilite: 'Faible', impact: 'Critique', score: 8, mitigation: 'Audit juridique externe', responsable: 'J. Martin', statut: 'Actif' },
      { risque: 'Résistance au changement', categorie: 'Organisationnel', probabilite: 'Élevée', impact: 'Modéré', score: 12, mitigation: 'Communication et accompagnement', responsable: 'P. Moreau', statut: 'Actif' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: true,
    },
  },
  {
    id: 'table-livrables-projet',
    name: 'Livrables du Projet',
    description: 'Liste des livrables attendus du projet de handover',
    category: 'projet',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'livrable', label: 'Livrable', align: 'left' },
      { key: 'phase', label: 'Phase', align: 'left' },
      { key: 'responsable', label: 'Responsable', align: 'left' },
      { key: 'datePrevu', label: 'Date prévue', align: 'center', format: 'date' },
      { key: 'statut', label: 'Statut', align: 'center' },
    ],
    rows: [
      { livrable: 'Rapport d\'audit initial', phase: 'Phase 1', responsable: 'J. Martin', datePrevu: '2024-12-15', statut: 'Livré' },
      { livrable: 'Plan de transition détaillé', phase: 'Phase 1', responsable: 'Chef de projet', datePrevu: '2025-01-31', statut: 'Livré' },
      { livrable: 'Manuel des procédures opérationnelles', phase: 'Phase 2', responsable: 'P. Moreau', datePrevu: '2025-03-15', statut: 'En cours' },
      { livrable: 'Documentation technique SI', phase: 'Phase 2', responsable: 'S. Dupont', datePrevu: '2025-04-15', statut: 'En cours' },
      { livrable: 'Rapport de formation équipes', phase: 'Phase 2', responsable: 'M. Bernard', datePrevu: '2025-04-30', statut: 'Planifié' },
      { livrable: 'Plan de gestion des risques', phase: 'Phase 2', responsable: 'J. Martin', datePrevu: '2025-05-15', statut: 'Planifié' },
      { livrable: 'Rapport de clôture handover', phase: 'Phase 3', responsable: 'Chef de projet', datePrevu: '2025-08-31', statut: 'Planifié' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },
  {
    id: 'table-synthese-avancement',
    name: 'Synthèse Avancement par Axe',
    description: 'Résumé de l\'avancement du projet par axe stratégique',
    category: 'projet',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'FLASH_PROJET', 'RAPPORT_MENSUEL', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'axe', label: 'Axe stratégique', align: 'left' },
      { key: 'actionsTotal', label: 'Actions', align: 'center', format: 'number' },
      { key: 'actionsTerminees', label: 'Terminées', align: 'center', format: 'number' },
      { key: 'avancement', label: 'Avancement', align: 'right', format: 'percent' },
      { key: 'tendance', label: 'Tendance', align: 'center' },
      { key: 'risques', label: 'Risques actifs', align: 'center', format: 'number' },
    ],
    rows: [
      { axe: 'AXE 1 - Performance Financière', actionsTotal: 18, actionsTerminees: 14, avancement: 75, tendance: 'HAUSSE', risques: 2 },
      { axe: 'AXE 2 - Excellence Opérationnelle', actionsTotal: 22, actionsTerminees: 14, avancement: 62, tendance: 'STABLE', risques: 3 },
      { axe: 'AXE 3 - Gouvernance & Conformité', actionsTotal: 15, actionsTerminees: 12, avancement: 80, tendance: 'HAUSSE', risques: 1 },
      { axe: 'AXE 4 - Développement Commercial', actionsTotal: 20, actionsTerminees: 11, avancement: 55, tendance: 'BAISSE', risques: 4 },
      { axe: 'AXE 5 - Leadership & Capital Humain', actionsTotal: 16, actionsTerminees: 11, avancement: 70, tendance: 'HAUSSE', risques: 2 },
      { axe: 'AXE 6 - Relations Stakeholders', actionsTotal: 12, actionsTerminees: 8, avancement: 65, tendance: 'STABLE', risques: 1 },
      { axe: 'TOTAL', actionsTotal: 103, actionsTerminees: 70, avancement: 68, tendance: 'HAUSSE', risques: 13 },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
      showTotals: false,
    },
  },

  // ============================================================================
  // CATEGORIE: DEEPDIVE - PRESENTATIONS DG
  // ============================================================================
  {
    id: 'table-deepdive-decisions-dg',
    name: 'Points de Décision DG',
    description: 'Décisions attendues de la Direction Générale',
    category: 'projet',
    compatibleReportTypes: ['FLASH_PROJET', 'DASHBOARD_PROJET', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'sujet', label: 'Sujet', align: 'left' },
      { key: 'axe', label: 'Axe', align: 'left' },
      { key: 'montant', label: 'Montant', align: 'right', format: 'currency' },
      { key: 'urgence', label: 'Urgence', align: 'center' },
      { key: 'echeance', label: 'Échéance', align: 'center', format: 'date' },
      { key: 'recommandation', label: 'Recommandation', align: 'left' },
    ],
    rows: [
      { sujet: 'Validation budget formation SI', axe: 'AXE 2', montant: 45000, urgence: 'Critique', echeance: '2025-02-15', recommandation: 'Approuver pour maintenir planning' },
      { sujet: 'Recrutement chef de projet adjoint', axe: 'AXE 5', montant: 65000, urgence: 'Haute', echeance: '2025-02-28', recommandation: 'Lancer le recrutement' },
      { sujet: 'Contrat maintenance préventive', axe: 'AXE 2', montant: 120000, urgence: 'Moyenne', echeance: '2025-03-31', recommandation: 'Négocier avec 2 prestataires' },
      { sujet: 'Audit juridique complémentaire', axe: 'AXE 3', montant: 25000, urgence: 'Haute', echeance: '2025-02-20', recommandation: 'Valider pour sécuriser conformité' },
      { sujet: 'Extension périmètre commercialisation', axe: 'AXE 4', montant: 0, urgence: 'Moyenne', echeance: '2025-04-15', recommandation: 'À discuter avec propriétaire' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },
  {
    id: 'table-deepdive-kpis-summary',
    name: 'Synthèse KPIs DeepDive',
    description: 'Résumé des indicateurs clés pour la présentation DG',
    category: 'projet',
    compatibleReportTypes: ['FLASH_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'RAPPORT_MENSUEL'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'kpi', label: 'KPI', align: 'left' },
      { key: 'valeur', label: 'Valeur actuelle', align: 'right' },
      { key: 'objectif', label: 'Objectif', align: 'right' },
      { key: 'ecart', label: 'Écart', align: 'right', format: 'percent' },
      { key: 'tendance', label: 'Tendance', align: 'center' },
      { key: 'meteo', label: 'Météo', align: 'center' },
    ],
    rows: [
      { kpi: 'Taux d\'occupation', valeur: '94.5%', objectif: '95%', ecart: -0.5, tendance: 'HAUSSE', meteo: 'VERT' },
      { kpi: 'Avancement global', valeur: '68%', objectif: '70%', ecart: -2.9, tendance: 'HAUSSE', meteo: 'JAUNE' },
      { kpi: 'Budget consommé', valeur: '815 k€', objectif: '850 k€', ecart: -4.1, tendance: 'STABLE', meteo: 'VERT' },
      { kpi: 'Risques critiques actifs', valeur: '2', objectif: '0', ecart: 0, tendance: 'BAISSE', meteo: 'ORANGE' },
      { kpi: 'Jalons atteints', valeur: '2/7', objectif: '3/7', ecart: -33.3, tendance: 'STABLE', meteo: 'JAUNE' },
      { kpi: 'Actions en retard', valeur: '9', objectif: '5', ecart: 80, tendance: 'BAISSE', meteo: 'ORANGE' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },
  {
    id: 'table-deepdive-top-risques',
    name: 'Top 5 Risques à Surveiller',
    description: 'Les risques les plus critiques à présenter en DeepDive',
    category: 'projet',
    compatibleReportTypes: ['FLASH_PROJET', 'ANALYSE_RISQUES', 'DASHBOARD_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'risques',
      refreshable: true,
    },
    headers: [
      { key: 'rang', label: '#', align: 'center' },
      { key: 'risque', label: 'Risque', align: 'left' },
      { key: 'score', label: 'Score', align: 'center', format: 'number' },
      { key: 'impact', label: 'Impact potentiel', align: 'left' },
      { key: 'action', label: 'Action immédiate', align: 'left' },
      { key: 'responsable', label: 'Pilote', align: 'left' },
    ],
    rows: [
      { rang: 1, risque: 'Retard migration SI', score: 16, impact: 'Blocage opérations 2 semaines', action: 'Activer plan de backup', responsable: 'S. Dupont' },
      { rang: 2, risque: 'Départ collaborateur clé', score: 12, impact: 'Perte connaissance métier', action: 'Finaliser documentation', responsable: 'M. Bernard' },
      { rang: 3, risque: 'Résistance au changement', score: 12, impact: 'Retard adoption nouvelles procédures', action: 'Sessions communication', responsable: 'P. Moreau' },
      { rang: 4, risque: 'Non-conformité réglementaire', score: 8, impact: 'Sanctions potentielles', action: 'Accélérer audit juridique', responsable: 'J. Martin' },
      { rang: 5, risque: 'Dépassement budget', score: 6, impact: 'Réduction périmètre projet', action: 'Revue mensuelle dépenses', responsable: 'A. Dubois' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: true,
    },
  },
  {
    id: 'table-deepdive-prochaines-etapes',
    name: 'Prochaines Étapes Clés',
    description: 'Actions et jalons prioritaires pour les 30 prochains jours',
    category: 'projet',
    compatibleReportTypes: ['FLASH_PROJET', 'DASHBOARD_PROJET', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'etape', label: 'Étape', align: 'left' },
      { key: 'type', label: 'Type', align: 'center' },
      { key: 'axe', label: 'Axe', align: 'left' },
      { key: 'echeance', label: 'Échéance', align: 'center', format: 'date' },
      { key: 'prerequis', label: 'Prérequis', align: 'left' },
      { key: 'risque', label: 'Risque délai', align: 'center' },
    ],
    rows: [
      { etape: 'Go-live module comptable', type: 'Jalon', axe: 'AXE 1', echeance: '2025-02-28', prerequis: 'Tests UAT validés', risque: 'Moyen' },
      { etape: 'Formation équipe technique Phase 2', type: 'Action', axe: 'AXE 5', echeance: '2025-02-15', prerequis: 'Supports finalisés', risque: 'Faible' },
      { etape: 'Signature avenant bail anchor', type: 'Action', axe: 'AXE 4', echeance: '2025-03-15', prerequis: 'Validation juridique', risque: 'Élevé' },
      { etape: 'Audit sécurité bâtiment', type: 'Action', axe: 'AXE 2', echeance: '2025-02-20', prerequis: 'Disponibilité prestataire', risque: 'Faible' },
      { etape: 'Revue mi-parcours propriétaire', type: 'Jalon', axe: 'AXE 6', echeance: '2025-03-01', prerequis: 'Rapport consolidé', risque: 'Moyen' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },
  {
    id: 'table-deepdive-historique',
    name: 'Historique des DeepDives',
    description: 'Récapitulatif des présentations DeepDive passées',
    category: 'projet',
    compatibleReportTypes: ['BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'numero', label: '#', align: 'center' },
      { key: 'date', label: 'Date', align: 'center', format: 'date' },
      { key: 'meteo', label: 'Météo', align: 'center' },
      { key: 'avancement', label: 'Avancement', align: 'right', format: 'percent' },
      { key: 'decisionsPreses', label: 'Décisions prises', align: 'center', format: 'number' },
      { key: 'participants', label: 'Participants', align: 'left' },
    ],
    rows: [
      { numero: 1, date: '2024-11-15', meteo: 'ROUGE', avancement: 15, decisionsPreses: 8, participants: 'DG, DAF, DRH' },
      { numero: 2, date: '2024-12-13', meteo: 'ORANGE', avancement: 32, decisionsPreses: 5, participants: 'DG, DAF, DOps' },
      { numero: 3, date: '2025-01-10', meteo: 'JAUNE', avancement: 48, decisionsPreses: 4, participants: 'DG, DAF, DRH, DOps' },
      { numero: 4, date: '2025-01-31', meteo: 'JAUNE', avancement: 58, decisionsPreses: 3, participants: 'DG, DAF' },
      { numero: 5, date: '2025-02-14', meteo: 'VERT', avancement: 68, decisionsPreses: 2, participants: 'DG, DAF, DRH, DOps' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },

  // ============================================================================
  // CATEGORIE: BATIMENTS ANGRÉ (Tableaux par structure)
  // ============================================================================
  {
    id: 'table-synthese-batiments',
    name: 'Synthèse par Bâtiment',
    description: 'Vue consolidée de l\'avancement par structure',
    category: 'projet',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'FLASH_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'buildings',
      refreshable: true,
    },
    headers: [
      { key: 'batiment', label: 'Bâtiment', align: 'left' },
      { key: 'surface', label: 'Surface (m²)', align: 'right', format: 'number' },
      { key: 'avancement', label: 'Avancement', align: 'right', format: 'percent' },
      { key: 'actionsTerminees', label: 'Actions terminées', align: 'center' },
      { key: 'risquesActifs', label: 'Risques actifs', align: 'center' },
      { key: 'reservesOuvertes', label: 'Réserves ouvertes', align: 'center' },
      { key: 'commercialisation', label: 'Commercialisation', align: 'right', format: 'percent' },
    ],
    rows: [
      { batiment: 'Centre Commercial', surface: 25000, avancement: 45, actionsTerminees: '12/27', risquesActifs: 8, reservesOuvertes: 15, commercialisation: 78 },
      { batiment: 'Big Box 1', surface: 6000, avancement: 30, actionsTerminees: '5/13', risquesActifs: 3, reservesOuvertes: 5, commercialisation: 100 },
      { batiment: 'Big Box 2', surface: 6000, avancement: 25, actionsTerminees: '4/14', risquesActifs: 4, reservesOuvertes: 7, commercialisation: 85 },
      { batiment: 'Big Box 3', surface: 6000, avancement: 20, actionsTerminees: '3/14', risquesActifs: 4, reservesOuvertes: 10, commercialisation: 60 },
      { batiment: 'Big Box 4', surface: 6000, avancement: 15, actionsTerminees: '2/12', risquesActifs: 3, reservesOuvertes: 12, commercialisation: 45 },
      { batiment: 'Zone Exposition', surface: 4000, avancement: 35, actionsTerminees: '6/14', risquesActifs: 3, reservesOuvertes: 5, commercialisation: 70 },
      { batiment: 'Marché Artisanal', surface: 3000, avancement: 40, actionsTerminees: '8/16', risquesActifs: 4, reservesOuvertes: 3, commercialisation: 90 },
      { batiment: 'Parking', surface: 8000, avancement: 35, actionsTerminees: '5/13', risquesActifs: 4, reservesOuvertes: 5, commercialisation: 100 },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
      highlightColumn: 'avancement',
    },
  },
  {
    id: 'table-actions-par-batiment',
    name: 'Actions par Bâtiment',
    description: 'Liste des actions filtrées par structure',
    category: 'projet',
    compatibleReportTypes: ['SUIVI_ACTIONS', 'AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'FLASH_PROJET'],
    dataSource: {
      type: 'entity',
      entityType: 'actions',
      refreshable: true,
    },
    headers: [
      { key: 'batiment', label: 'Bâtiment', align: 'left' },
      { key: 'id', label: 'ID', align: 'left' },
      { key: 'titre', label: 'Action', align: 'left' },
      { key: 'statut', label: 'Statut', align: 'center' },
      { key: 'priorite', label: 'Priorité', align: 'center' },
      { key: 'responsable', label: 'Responsable', align: 'left' },
      { key: 'echeance', label: 'Échéance', align: 'center', format: 'date' },
    ],
    rows: [
      { batiment: 'CC', id: 'CC.T.01', titre: 'Audit technique global', statut: 'Termine', priorite: 'Haute', responsable: 'M. Koné', echeance: '2025-02-15' },
      { batiment: 'CC', id: 'CC.T.02', titre: 'Formation équipes', statut: 'En cours', priorite: 'Moyenne', responsable: 'Mme Diabaté', echeance: '2025-03-01' },
      { batiment: 'BB1', id: 'BB1.T.01', titre: 'Réception travaux', statut: 'En cours', priorite: 'Haute', responsable: 'M. Touré', echeance: '2025-02-28' },
      { batiment: 'ZE', id: 'ZE.T.01', titre: 'Aménagement zones', statut: 'A faire', priorite: 'Moyenne', responsable: 'M. Coulibaly', echeance: '2025-03-15' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: true,
    },
  },

  // ============================================================================
  // CATEGORIE: OPR / LEVÉE DE RÉSERVES
  // ============================================================================
  {
    id: 'table-reserves-synthese',
    name: 'Synthèse Réserves OPR',
    description: 'État global des réserves par bâtiment',
    category: 'projet',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'FLASH_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'batiment', label: 'Bâtiment', align: 'left' },
      { key: 'total', label: 'Total', align: 'center', format: 'number' },
      { key: 'levees', label: 'Levées', align: 'center', format: 'number' },
      { key: 'enCours', label: 'En cours', align: 'center', format: 'number' },
      { key: 'ouvertes', label: 'Ouvertes', align: 'center', format: 'number' },
      { key: 'tauxLevee', label: 'Taux levée', align: 'right', format: 'percent' },
      { key: 'tendance', label: 'Tendance', align: 'center' },
    ],
    rows: [
      { batiment: 'Centre Commercial', total: 85, levees: 45, enCours: 25, ouvertes: 15, tauxLevee: 53, tendance: 'HAUSSE' },
      { batiment: 'Big Box 1', total: 25, levees: 12, enCours: 8, ouvertes: 5, tauxLevee: 48, tendance: 'STABLE' },
      { batiment: 'Big Box 2', total: 25, levees: 8, enCours: 10, ouvertes: 7, tauxLevee: 32, tendance: 'HAUSSE' },
      { batiment: 'Big Box 3', total: 23, levees: 5, enCours: 8, ouvertes: 10, tauxLevee: 22, tendance: 'STABLE' },
      { batiment: 'Big Box 4', total: 20, levees: 3, enCours: 5, ouvertes: 12, tauxLevee: 15, tendance: 'BAISSE' },
      { batiment: 'Zone Exposition', total: 33, levees: 18, enCours: 10, ouvertes: 5, tauxLevee: 55, tendance: 'HAUSSE' },
      { batiment: 'Marché Artisanal', total: 40, levees: 25, enCours: 12, ouvertes: 3, tauxLevee: 63, tendance: 'HAUSSE' },
      { batiment: 'Parking', total: 28, levees: 15, enCours: 8, ouvertes: 5, tauxLevee: 54, tendance: 'STABLE' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
      highlightColumn: 'tauxLevee',
    },
  },
  {
    id: 'table-reserves-detail',
    name: 'Détail des Réserves Ouvertes',
    description: 'Liste détaillée des réserves non levées',
    category: 'projet',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'batiment', label: 'Bâtiment', align: 'left' },
      { key: 'zone', label: 'Zone', align: 'left' },
      { key: 'categorie', label: 'Catégorie', align: 'left' },
      { key: 'description', label: 'Description', align: 'left' },
      { key: 'priorite', label: 'Priorité', align: 'center' },
      { key: 'dateOuverture', label: 'Ouverte le', align: 'center', format: 'date' },
      { key: 'responsable', label: 'Responsable', align: 'left' },
    ],
    rows: [
      { batiment: 'CC', zone: 'Hall principal', categorie: 'Finitions', description: 'Joints de carrelage incomplets', priorite: 'Moyenne', dateOuverture: '2025-01-15', responsable: 'Entrep. A' },
      { batiment: 'CC', zone: 'Galerie Est', categorie: 'Électricité', description: 'Éclairage défectueux zone 3', priorite: 'Haute', dateOuverture: '2025-01-20', responsable: 'Entrep. B' },
      { batiment: 'BB1', zone: 'Accès livraison', categorie: 'Technique', description: 'Porte sectionnelle bloquée', priorite: 'Haute', dateOuverture: '2025-01-18', responsable: 'Entrep. C' },
      { batiment: 'BB4', zone: 'Toiture', categorie: 'Étanchéité', description: 'Infiltration angle Nord', priorite: 'Haute', dateOuverture: '2025-01-22', responsable: 'Entrep. D' },
      { batiment: 'ZE', zone: 'Stand 12', categorie: 'Finitions', description: 'Peinture murale à reprendre', priorite: 'Basse', dateOuverture: '2025-01-25', responsable: 'Entrep. A' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: true,
    },
  },
  {
    id: 'table-reserves-par-entreprise',
    name: 'Réserves par Entreprise',
    description: 'Suivi des réserves par entreprise responsable',
    category: 'projet',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'BILAN_HANDOVER'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'entreprise', label: 'Entreprise', align: 'left' },
      { key: 'lot', label: 'Lot', align: 'left' },
      { key: 'total', label: 'Total', align: 'center', format: 'number' },
      { key: 'levees', label: 'Levées', align: 'center', format: 'number' },
      { key: 'enRetard', label: 'En retard', align: 'center', format: 'number' },
      { key: 'tauxLevee', label: 'Taux', align: 'right', format: 'percent' },
      { key: 'performance', label: 'Performance', align: 'center' },
    ],
    rows: [
      { entreprise: 'Entrep. Gros Œuvre', lot: 'GO', total: 45, levees: 38, enRetard: 2, tauxLevee: 84, performance: 'OK' },
      { entreprise: 'Entrep. Électricité', lot: 'ELEC', total: 35, levees: 22, enRetard: 5, tauxLevee: 63, performance: 'ATTENTION' },
      { entreprise: 'Entrep. Plomberie', lot: 'PLB', total: 28, levees: 20, enRetard: 3, tauxLevee: 71, performance: 'OK' },
      { entreprise: 'Entrep. CVC', lot: 'CVC', total: 32, levees: 18, enRetard: 8, tauxLevee: 56, performance: 'CRITIQUE' },
      { entreprise: 'Entrep. Finitions', lot: 'FIN', total: 55, levees: 35, enRetard: 4, tauxLevee: 64, performance: 'ATTENTION' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },

  // ============================================================================
  // CATEGORIE: COMMERCIALISATION
  // ============================================================================
  {
    id: 'table-commercialisation-batiments',
    name: 'Commercialisation par Structure',
    description: 'État de la commercialisation par bâtiment',
    category: 'projet',
    compatibleReportTypes: ['COMMERCIALISATION_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'FLASH_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'batiment', label: 'Bâtiment', align: 'left' },
      { key: 'surfaceTotale', label: 'Surface totale (m²)', align: 'right', format: 'number' },
      { key: 'surfaceLouee', label: 'Louée (m²)', align: 'right', format: 'number' },
      { key: 'surfaceNego', label: 'En négo (m²)', align: 'right', format: 'number' },
      { key: 'surfaceLibre', label: 'Libre (m²)', align: 'right', format: 'number' },
      { key: 'tauxCommercialisation', label: 'Taux', align: 'right', format: 'percent' },
      { key: 'nbLocataires', label: 'Locataires', align: 'center', format: 'number' },
    ],
    rows: [
      { batiment: 'Centre Commercial', surfaceTotale: 25000, surfaceLouee: 19500, surfaceNego: 2500, surfaceLibre: 3000, tauxCommercialisation: 78, nbLocataires: 85 },
      { batiment: 'Big Box 1', surfaceTotale: 6000, surfaceLouee: 6000, surfaceNego: 0, surfaceLibre: 0, tauxCommercialisation: 100, nbLocataires: 1 },
      { batiment: 'Big Box 2', surfaceTotale: 6000, surfaceLouee: 5100, surfaceNego: 600, surfaceLibre: 300, tauxCommercialisation: 85, nbLocataires: 1 },
      { batiment: 'Big Box 3', surfaceTotale: 6000, surfaceLouee: 3600, surfaceNego: 1200, surfaceLibre: 1200, tauxCommercialisation: 60, nbLocataires: 0 },
      { batiment: 'Big Box 4', surfaceTotale: 6000, surfaceLouee: 2700, surfaceNego: 1500, surfaceLibre: 1800, tauxCommercialisation: 45, nbLocataires: 0 },
      { batiment: 'Zone Exposition', surfaceTotale: 4000, surfaceLouee: 2800, surfaceNego: 700, surfaceLibre: 500, tauxCommercialisation: 70, nbLocataires: 12 },
      { batiment: 'Marché Artisanal', surfaceTotale: 3000, surfaceLouee: 2700, surfaceNego: 200, surfaceLibre: 100, tauxCommercialisation: 90, nbLocataires: 45 },
      { batiment: 'Parking', surfaceTotale: 8000, surfaceLouee: 8000, surfaceNego: 0, surfaceLibre: 0, tauxCommercialisation: 100, nbLocataires: 1 },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
      highlightColumn: 'tauxCommercialisation',
    },
  },
  {
    id: 'table-prospects-actifs',
    name: 'Prospects Actifs',
    description: 'Liste des prospects en cours de négociation',
    category: 'projet',
    compatibleReportTypes: ['COMMERCIALISATION_PROJET', 'DASHBOARD_PROJET', 'FLASH_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'prospect', label: 'Prospect', align: 'left' },
      { key: 'activite', label: 'Activité', align: 'left' },
      { key: 'batimentCible', label: 'Bâtiment cible', align: 'left' },
      { key: 'surfaceDemandee', label: 'Surface (m²)', align: 'right', format: 'number' },
      { key: 'stade', label: 'Stade', align: 'center' },
      { key: 'proba', label: 'Probabilité', align: 'center' },
      { key: 'contact', label: 'Commercial', align: 'left' },
    ],
    rows: [
      { prospect: 'Enseigne Mode A', activite: 'Prêt-à-porter', batimentCible: 'CC', surfaceDemandee: 450, stade: 'Négociation', proba: '80%', contact: 'M. Diallo' },
      { prospect: 'Restaurant B', activite: 'Restauration', batimentCible: 'CC', surfaceDemandee: 280, stade: 'Offre envoyée', proba: '60%', contact: 'Mme Traoré' },
      { prospect: 'Enseigne Tech C', activite: 'Électronique', batimentCible: 'BB3', surfaceDemandee: 6000, stade: 'Visite', proba: '40%', contact: 'M. Koné' },
      { prospect: 'Supermarché D', activite: 'Alimentaire', batimentCible: 'BB4', surfaceDemandee: 6000, stade: 'Premier contact', proba: '20%', contact: 'Mme Bamba' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: true,
    },
  },

  // ============================================================================
  // CATEGORIE: PHASES DE CONSTRUCTION
  // ============================================================================
  {
    id: 'table-phases-batiments',
    name: 'Phases par Bâtiment',
    description: 'État d\'avancement des phases par structure',
    category: 'projet',
    compatibleReportTypes: ['AVANCEMENT_PROJET', 'DASHBOARD_PROJET', 'BILAN_HANDOVER', 'REPORTING_PROJET'],
    dataSource: {
      type: 'computed',
      refreshable: true,
    },
    headers: [
      { key: 'batiment', label: 'Bâtiment', align: 'left' },
      { key: 'etudes', label: 'Études', align: 'center' },
      { key: 'travaux', label: 'Travaux', align: 'center' },
      { key: 'miseEnService', label: 'Mise en service', align: 'center' },
      { key: 'dateLivraison', label: 'Livraison prévue', align: 'center', format: 'date' },
      { key: 'statutGlobal', label: 'Statut', align: 'center' },
    ],
    rows: [
      { batiment: 'Centre Commercial', etudes: '100%', travaux: '85%', miseEnService: '25%', dateLivraison: '2025-06-15', statutGlobal: 'JAUNE' },
      { batiment: 'Big Box 1', etudes: '100%', travaux: '65%', miseEnService: '10%', dateLivraison: '2025-07-01', statutGlobal: 'JAUNE' },
      { batiment: 'Big Box 2', etudes: '100%', travaux: '55%', miseEnService: '5%', dateLivraison: '2025-07-15', statutGlobal: 'JAUNE' },
      { batiment: 'Big Box 3', etudes: '100%', travaux: '45%', miseEnService: '0%', dateLivraison: '2025-08-01', statutGlobal: 'ORANGE' },
      { batiment: 'Big Box 4', etudes: '100%', travaux: '35%', miseEnService: '0%', dateLivraison: '2025-08-15', statutGlobal: 'ORANGE' },
      { batiment: 'Zone Exposition', etudes: '100%', travaux: '70%', miseEnService: '15%', dateLivraison: '2025-06-01', statutGlobal: 'VERT' },
      { batiment: 'Marché Artisanal', etudes: '100%', travaux: '80%', miseEnService: '20%', dateLivraison: '2025-05-15', statutGlobal: 'VERT' },
      { batiment: 'Parking', etudes: '100%', travaux: '75%', miseEnService: '15%', dateLivraison: '2025-06-01', statutGlobal: 'VERT' },
    ],
    config: {
      striped: true,
      bordered: true,
      compact: false,
    },
  },
];

// ============================================================================
// KPIs DEFINITIONS
// ============================================================================

export const KPI_DEFINITIONS: KPIDefinition[] = [
  // ============================================================================
  // AXE 1 - PERFORMANCE FINANCIERE
  // ============================================================================
  {
    id: 'kpi-ca-total',
    code: 'CA_TOTAL',
    name: 'Chiffre d\'Affaires Total',
    description: 'Chiffre d\'affaires annuel des enseignes du centre',
    axe: 'AXE1_PERFORMANCE_FINANCIERE',
    formula: 'Somme des CA déclarés par les locataires',
    unit: '€',
    format: 'currency',
    frequency: 'monthly',
    thresholds: {
      green: { min: 95 },
      orange: { min: 85, max: 95 },
      red: { max: 85 },
    },
    interpretation: {
      high: 'Performance commerciale excellente',
      low: 'Activité commerciale en dessous des attentes',
    },
    historicalData: [
      { month: '2025-01', value: 4200000 },
      { month: '2025-02', value: 3800000 },
      { month: '2025-03', value: 4500000 },
      { month: '2025-04', value: 4800000 },
      { month: '2025-05', value: 5200000 },
      { month: '2025-06', value: 4600000 },
    ],
  },
  {
    id: 'kpi-noi',
    code: 'NOI',
    name: 'Net Operating Income',
    description: 'Résultat net d\'exploitation',
    axe: 'AXE1_PERFORMANCE_FINANCIERE',
    formula: 'Revenus totaux - Charges d\'exploitation',
    unit: '€',
    format: 'currency',
    frequency: 'monthly',
    thresholds: {
      green: { min: 100 },
      orange: { min: 90, max: 100 },
      red: { max: 90 },
    },
    interpretation: {
      high: 'Rentabilité opérationnelle forte',
      low: 'Marge opérationnelle insuffisante',
    },
    historicalData: [
      { month: '2025-01', value: 850000 },
      { month: '2025-02', value: 920000 },
      { month: '2025-03', value: 880000 },
      { month: '2025-04', value: 950000 },
      { month: '2025-05', value: 1020000 },
      { month: '2025-06', value: 980000 },
    ],
  },
  {
    id: 'kpi-yield-net',
    code: 'YIELD_NET',
    name: 'Yield Net',
    description: 'Rendement net de l\'actif',
    axe: 'AXE1_PERFORMANCE_FINANCIERE',
    formula: 'NOI / Valeur de l\'actif × 100',
    unit: '%',
    format: 'percent',
    frequency: 'quarterly',
    thresholds: {
      green: { min: 5 },
      orange: { min: 4, max: 5 },
      red: { max: 4 },
    },
    interpretation: {
      high: 'Rendement attractif pour les investisseurs',
      low: 'Rendement en dessous du marché',
    },
    historicalData: [
      { month: '2024-Q1', value: 5.1 },
      { month: '2024-Q2', value: 5.3 },
      { month: '2024-Q3', value: 5.4 },
      { month: '2024-Q4', value: 5.6 },
    ],
  },
  {
    id: 'kpi-yield-brut',
    code: 'YIELD_BRUT',
    name: 'Yield Brut',
    description: 'Rendement brut de l\'actif',
    axe: 'AXE1_PERFORMANCE_FINANCIERE',
    formula: 'Loyers bruts / Valeur de l\'actif × 100',
    unit: '%',
    format: 'percent',
    frequency: 'quarterly',
    thresholds: {
      green: { min: 6 },
      orange: { min: 5, max: 6 },
      red: { max: 5 },
    },
    interpretation: {
      high: 'Rendement brut élevé',
      low: 'Rendement brut faible',
    },
    historicalData: [
      { month: '2024-Q1', value: 6.2 },
      { month: '2024-Q2', value: 6.4 },
      { month: '2024-Q3', value: 6.5 },
      { month: '2024-Q4', value: 6.8 },
    ],
  },

  // ============================================================================
  // AXE 2 - EXCELLENCE OPERATIONNELLE
  // ============================================================================
  {
    id: 'kpi-disponibilite',
    code: 'DISPONIBILITE',
    name: 'Taux de Disponibilité',
    description: 'Disponibilité des équipements et services',
    axe: 'AXE2_EXCELLENCE_OPERATIONNELLE',
    formula: 'Heures de fonctionnement / Heures d\'ouverture × 100',
    unit: '%',
    format: 'percent',
    frequency: 'weekly',
    thresholds: {
      green: { min: 98 },
      orange: { min: 95, max: 98 },
      red: { max: 95 },
    },
    interpretation: {
      high: 'Équipements disponibles et fiables',
      low: 'Trop de pannes ou interruptions',
    },
  },
  {
    id: 'kpi-maintenance',
    code: 'MAINTENANCE',
    name: 'Taux de Résolution Maintenance',
    description: 'Interventions résolues dans les délais',
    axe: 'AXE2_EXCELLENCE_OPERATIONNELLE',
    formula: 'Interventions résolues à temps / Total interventions × 100',
    unit: '%',
    format: 'percent',
    frequency: 'weekly',
    thresholds: {
      green: { min: 90 },
      orange: { min: 80, max: 90 },
      red: { max: 80 },
    },
    interpretation: {
      high: 'Maintenance réactive et efficace',
      low: 'Délais de maintenance trop longs',
    },
  },

  // ============================================================================
  // AXE 4 - DEVELOPPEMENT COMMERCIAL
  // ============================================================================
  {
    id: 'kpi-occupation-physique',
    code: 'TAUX_OCCUPATION_PHYSIQUE',
    name: 'Taux d\'Occupation Physique',
    description: 'Surface occupée / Surface totale commercialisable',
    axe: 'AXE4_DEVELOPPEMENT_COMMERCIAL',
    formula: 'Surfaces louées / Surfaces totales × 100',
    unit: '%',
    format: 'percent',
    frequency: 'monthly',
    thresholds: {
      green: { min: 95 },
      orange: { min: 90, max: 95 },
      red: { max: 90 },
    },
    interpretation: {
      high: 'Centre bien rempli, faible vacance',
      low: 'Vacance importante à traiter',
    },
    historicalData: [
      { month: '2025-01', value: 93.2 },
      { month: '2025-02', value: 93.5 },
      { month: '2025-03', value: 94.0 },
      { month: '2025-04', value: 94.2 },
      { month: '2025-05', value: 94.5 },
      { month: '2025-06', value: 94.5 },
    ],
  },
  {
    id: 'kpi-occupation-financiere',
    code: 'TAUX_OCCUPATION_FINANCIERE',
    name: 'Taux d\'Occupation Financière',
    description: 'Loyers perçus / Loyers potentiels',
    axe: 'AXE4_DEVELOPPEMENT_COMMERCIAL',
    formula: 'Loyers perçus / Loyers théoriques × 100',
    unit: '%',
    format: 'percent',
    frequency: 'monthly',
    thresholds: {
      green: { min: 95 },
      orange: { min: 90, max: 95 },
      red: { max: 90 },
    },
    interpretation: {
      high: 'Revenus locatifs optimisés',
      low: 'Pertes financières dues à la vacance',
    },
    historicalData: [
      { month: '2025-01', value: 95.5 },
      { month: '2025-02', value: 95.8 },
      { month: '2025-03', value: 96.0 },
      { month: '2025-04', value: 96.2 },
      { month: '2025-05', value: 96.2 },
      { month: '2025-06', value: 96.2 },
    ],
  },
  {
    id: 'kpi-wault',
    code: 'WAULT',
    name: 'WAULT',
    description: 'Weighted Average Unexpired Lease Term - Durée moyenne pondérée des baux',
    axe: 'AXE4_DEVELOPPEMENT_COMMERCIAL',
    formula: 'Σ (Loyer × Durée restante) / Σ Loyers',
    unit: 'années',
    format: 'number',
    frequency: 'quarterly',
    thresholds: {
      green: { min: 4 },
      orange: { min: 3, max: 4 },
      red: { max: 3 },
    },
    interpretation: {
      high: 'Bonne visibilité sur les revenus futurs',
      low: 'Risque de renouvellement important à court terme',
    },
    historicalData: [
      { month: '2024-Q1', value: 4.5 },
      { month: '2024-Q2', value: 4.3 },
      { month: '2024-Q3', value: 4.2 },
      { month: '2024-Q4', value: 4.1 },
    ],
  },
  {
    id: 'kpi-frequentation',
    code: 'FREQUENTATION',
    name: 'Fréquentation',
    description: 'Nombre de visiteurs',
    axe: 'AXE4_DEVELOPPEMENT_COMMERCIAL',
    formula: 'Comptage des entrées',
    unit: 'visiteurs',
    format: 'number',
    frequency: 'daily',
    thresholds: {
      green: { min: 100 },
      orange: { min: 90, max: 100 },
      red: { max: 90 },
    },
    interpretation: {
      high: 'Forte attractivité du centre',
      low: 'Fréquentation en baisse, actions à mener',
    },
    historicalData: [
      { month: '2025-01', value: 180000 },
      { month: '2025-02', value: 165000 },
      { month: '2025-03', value: 195000 },
      { month: '2025-04', value: 210000 },
      { month: '2025-05', value: 225000 },
      { month: '2025-06', value: 200000 },
    ],
  },

  // ============================================================================
  // AXE 6 - RELATIONS STAKEHOLDERS
  // ============================================================================
  {
    id: 'kpi-satisfaction-locataires',
    code: 'SATISFACTION_LOCATAIRES',
    name: 'Satisfaction Locataires',
    description: 'Indice de satisfaction des locataires',
    axe: 'AXE6_RELATIONS_STAKEHOLDERS',
    formula: 'Score moyen des enquêtes de satisfaction',
    unit: '/10',
    format: 'number',
    frequency: 'quarterly',
    thresholds: {
      green: { min: 8 },
      orange: { min: 7, max: 8 },
      red: { max: 7 },
    },
    interpretation: {
      high: 'Locataires satisfaits, relation de confiance',
      low: 'Points d\'amélioration à identifier',
    },
  },
  {
    id: 'kpi-nps-visiteurs',
    code: 'NPS_VISITEURS',
    name: 'NPS Visiteurs',
    description: 'Net Promoter Score des visiteurs',
    axe: 'AXE6_RELATIONS_STAKEHOLDERS',
    formula: '% Promoteurs - % Détracteurs',
    unit: 'pts',
    format: 'number',
    frequency: 'quarterly',
    thresholds: {
      green: { min: 30 },
      orange: { min: 10, max: 30 },
      red: { max: 10 },
    },
    interpretation: {
      high: 'Visiteurs ambassadeurs du centre',
      low: 'Expérience visiteur à améliorer',
    },
  },

  // ============================================================================
  // PROJET HANDOVER ANGRÉ
  // ============================================================================
  {
    id: 'kpi-avancement-global',
    code: 'AVANCEMENT_GLOBAL',
    name: 'Avancement Global Projet',
    description: 'Taux d\'avancement global du projet de handover Angré',
    axe: 'PROJET_HANDOVER',
    formula: 'Somme pondérée des avancements par axe',
    unit: '%',
    format: 'percent',
    frequency: 'weekly',
    thresholds: {
      green: { min: 90 },
      orange: { min: 70, max: 90 },
      red: { max: 70 },
    },
    interpretation: {
      high: 'Projet en avance ou dans les temps',
      low: 'Retard significatif à traiter',
    },
    historicalData: [
      { month: '2025-01', value: 45 },
      { month: '2025-02', value: 52 },
      { month: '2025-03', value: 58 },
      { month: '2025-04', value: 63 },
      { month: '2025-05', value: 68 },
      { month: '2025-06', value: 72 },
    ],
  },
  {
    id: 'kpi-actions-terminees',
    code: 'ACTIONS_TERMINEES',
    name: 'Actions Terminées',
    description: 'Pourcentage d\'actions terminées sur le total',
    axe: 'PROJET_HANDOVER',
    formula: 'Actions terminées / Total actions × 100',
    unit: '%',
    format: 'percent',
    frequency: 'weekly',
    thresholds: {
      green: { min: 80 },
      orange: { min: 60, max: 80 },
      red: { max: 60 },
    },
    interpretation: {
      high: 'Bonne progression des actions',
      low: 'Actions en retard',
    },
    historicalData: [
      { month: '2025-01', value: 35 },
      { month: '2025-02', value: 42 },
      { month: '2025-03', value: 50 },
      { month: '2025-04', value: 58 },
      { month: '2025-05', value: 65 },
      { month: '2025-06', value: 70 },
    ],
  },
  {
    id: 'kpi-jalons-atteints',
    code: 'JALONS_ATTEINTS',
    name: 'Jalons Atteints',
    description: 'Nombre de jalons atteints par rapport au total planifié',
    axe: 'PROJET_HANDOVER',
    formula: 'Jalons atteints / Jalons planifiés',
    unit: '',
    format: 'number',
    frequency: 'monthly',
    thresholds: {
      green: { min: 100 },
      orange: { min: 80, max: 100 },
      red: { max: 80 },
    },
    interpretation: {
      high: 'Jalons respectés',
      low: 'Jalons en retard ou non atteints',
    },
    historicalData: [
      { month: '2025-01', value: 100 },
      { month: '2025-02', value: 100 },
      { month: '2025-03', value: 85 },
      { month: '2025-04', value: 90 },
      { month: '2025-05', value: 88 },
      { month: '2025-06', value: 92 },
    ],
  },
  {
    id: 'kpi-risques-critiques',
    code: 'RISQUES_CRITIQUES',
    name: 'Risques Critiques Actifs',
    description: 'Nombre de risques critiques non résolus',
    axe: 'PROJET_HANDOVER',
    formula: 'Comptage risques avec score > 15',
    unit: '',
    format: 'number',
    frequency: 'weekly',
    thresholds: {
      green: { max: 2 },
      orange: { min: 2, max: 5 },
      red: { min: 5 },
    },
    interpretation: {
      high: 'Trop de risques critiques actifs',
      low: 'Risques sous contrôle',
    },
    historicalData: [
      { month: '2025-01', value: 5 },
      { month: '2025-02', value: 4 },
      { month: '2025-03', value: 3 },
      { month: '2025-04', value: 3 },
      { month: '2025-05', value: 2 },
      { month: '2025-06', value: 2 },
    ],
  },
  {
    id: 'kpi-budget-projet-consomme',
    code: 'BUDGET_PROJET_CONSOMME',
    name: 'Budget Projet Consommé',
    description: 'Taux de consommation du budget projet',
    axe: 'PROJET_HANDOVER',
    formula: 'Budget consommé / Budget total × 100',
    unit: '%',
    format: 'percent',
    frequency: 'monthly',
    thresholds: {
      green: { min: 85, max: 105 },
      orange: { min: 70, max: 85 },
      red: { max: 70 },
    },
    interpretation: {
      high: 'Budget bien utilisé ou dépassement à surveiller',
      low: 'Sous-consommation, possible retard',
    },
    historicalData: [
      { month: '2025-01', value: 15 },
      { month: '2025-02', value: 28 },
      { month: '2025-03', value: 42 },
      { month: '2025-04', value: 55 },
      { month: '2025-05', value: 65 },
      { month: '2025-06', value: 78 },
    ],
  },
  {
    id: 'kpi-actions-en-retard',
    code: 'ACTIONS_EN_RETARD',
    name: 'Actions en Retard',
    description: 'Nombre d\'actions dépassant leur date d\'échéance',
    axe: 'PROJET_HANDOVER',
    formula: 'Comptage actions avec date fin < aujourd\'hui et statut ≠ terminé',
    unit: '',
    format: 'number',
    frequency: 'weekly',
    thresholds: {
      green: { max: 3 },
      orange: { min: 3, max: 8 },
      red: { min: 8 },
    },
    interpretation: {
      high: 'Trop d\'actions en retard, risque sur le planning',
      low: 'Planning respecté',
    },
    historicalData: [
      { month: '2025-01', value: 2 },
      { month: '2025-02', value: 4 },
      { month: '2025-03', value: 5 },
      { month: '2025-04', value: 7 },
      { month: '2025-05', value: 6 },
      { month: '2025-06', value: 4 },
    ],
  },
  {
    id: 'kpi-satisfaction-equipe',
    code: 'SATISFACTION_EQUIPE_PROJET',
    name: 'Satisfaction Équipe Projet',
    description: 'Indice de satisfaction de l\'équipe projet',
    axe: 'PROJET_HANDOVER',
    formula: 'Score moyen enquête équipe',
    unit: '/10',
    format: 'number',
    frequency: 'monthly',
    thresholds: {
      green: { min: 8 },
      orange: { min: 6, max: 8 },
      red: { max: 6 },
    },
    interpretation: {
      high: 'Équipe motivée et engagée',
      low: 'Moral de l\'équipe à surveiller',
    },
    historicalData: [
      { month: '2025-01', value: 7.5 },
      { month: '2025-02', value: 7.8 },
      { month: '2025-03', value: 7.6 },
      { month: '2025-04', value: 8.0 },
      { month: '2025-05', value: 8.2 },
      { month: '2025-06', value: 8.1 },
    ],
  },
  {
    id: 'kpi-livrables-valides',
    code: 'LIVRABLES_VALIDES',
    name: 'Livrables Validés',
    description: 'Pourcentage de livrables validés sur le total prévu',
    axe: 'PROJET_HANDOVER',
    formula: 'Livrables validés / Total livrables × 100',
    unit: '%',
    format: 'percent',
    frequency: 'monthly',
    thresholds: {
      green: { min: 90 },
      orange: { min: 70, max: 90 },
      red: { max: 70 },
    },
    interpretation: {
      high: 'Livrables conformes et validés',
      low: 'Livrables en attente de validation',
    },
    historicalData: [
      { month: '2025-01', value: 25 },
      { month: '2025-02', value: 35 },
      { month: '2025-03', value: 45 },
      { month: '2025-04', value: 55 },
      { month: '2025-05', value: 62 },
      { month: '2025-06', value: 70 },
    ],
  },

  // ============================================================================
  // OPR / LEVÉE DE RÉSERVES
  // ============================================================================
  {
    id: 'kpi-reserves-totales',
    code: 'RESERVES_TOTALES',
    name: 'Total Réserves OPR',
    description: 'Nombre total de réserves identifiées sur le projet',
    axe: 'PROJET_HANDOVER',
    formula: 'Comptage de toutes les réserves',
    unit: '',
    format: 'number',
    frequency: 'weekly',
    thresholds: {
      green: { max: 100 },
      orange: { min: 100, max: 200 },
      red: { min: 200 },
    },
    interpretation: {
      high: 'Nombre important de réserves à gérer',
      low: 'Nombre de réserves sous contrôle',
    },
    historicalData: [
      { month: '2025-01', value: 280 },
      { month: '2025-02', value: 265 },
      { month: '2025-03', value: 220 },
      { month: '2025-04', value: 180 },
      { month: '2025-05', value: 145 },
      { month: '2025-06', value: 110 },
    ],
  },
  {
    id: 'kpi-taux-levee-reserves',
    code: 'TAUX_LEVEE_RESERVES',
    name: 'Taux de Levée des Réserves',
    description: 'Pourcentage de réserves levées sur le total',
    axe: 'PROJET_HANDOVER',
    formula: 'Réserves levées / Total réserves × 100',
    unit: '%',
    format: 'percent',
    frequency: 'weekly',
    thresholds: {
      green: { min: 80 },
      orange: { min: 60, max: 80 },
      red: { max: 60 },
    },
    interpretation: {
      high: 'Bonne progression de la levée des réserves',
      low: 'Retard dans la levée des réserves',
    },
    historicalData: [
      { month: '2025-01', value: 25 },
      { month: '2025-02', value: 38 },
      { month: '2025-03', value: 48 },
      { month: '2025-04', value: 58 },
      { month: '2025-05', value: 68 },
      { month: '2025-06', value: 78 },
    ],
  },
  {
    id: 'kpi-reserves-critiques',
    code: 'RESERVES_CRITIQUES',
    name: 'Réserves Critiques',
    description: 'Nombre de réserves bloquantes pour la réception',
    axe: 'PROJET_HANDOVER',
    formula: 'Comptage réserves avec priorité haute',
    unit: '',
    format: 'number',
    frequency: 'weekly',
    thresholds: {
      green: { max: 5 },
      orange: { min: 5, max: 15 },
      red: { min: 15 },
    },
    interpretation: {
      high: 'Réserves critiques bloquant la réception',
      low: 'Peu de réserves bloquantes',
    },
    historicalData: [
      { month: '2025-01', value: 22 },
      { month: '2025-02', value: 18 },
      { month: '2025-03', value: 14 },
      { month: '2025-04', value: 10 },
      { month: '2025-05', value: 6 },
      { month: '2025-06', value: 4 },
    ],
  },
  {
    id: 'kpi-delai-moyen-levee',
    code: 'DELAI_MOYEN_LEVEE',
    name: 'Délai Moyen de Levée',
    description: 'Durée moyenne pour lever une réserve (en jours)',
    axe: 'PROJET_HANDOVER',
    formula: 'Moyenne (date levée - date ouverture)',
    unit: 'jours',
    format: 'number',
    frequency: 'weekly',
    thresholds: {
      green: { max: 7 },
      orange: { min: 7, max: 14 },
      red: { min: 14 },
    },
    interpretation: {
      high: 'Délais de levée trop longs',
      low: 'Réactivité satisfaisante',
    },
    historicalData: [
      { month: '2025-01', value: 12 },
      { month: '2025-02', value: 10 },
      { month: '2025-03', value: 9 },
      { month: '2025-04', value: 8 },
      { month: '2025-05', value: 7 },
      { month: '2025-06', value: 6 },
    ],
  },

  // ============================================================================
  // COMMERCIALISATION
  // ============================================================================
  {
    id: 'kpi-taux-commercialisation',
    code: 'TAUX_COMMERCIALISATION',
    name: 'Taux de Commercialisation Global',
    description: 'Pourcentage de surfaces commercialisées',
    axe: 'PROJET_HANDOVER',
    formula: 'Surfaces louées / Surfaces totales × 100',
    unit: '%',
    format: 'percent',
    frequency: 'monthly',
    thresholds: {
      green: { min: 85 },
      orange: { min: 70, max: 85 },
      red: { max: 70 },
    },
    interpretation: {
      high: 'Commercialisation avancée',
      low: 'Efforts commerciaux à intensifier',
    },
    historicalData: [
      { month: '2025-01', value: 62 },
      { month: '2025-02', value: 68 },
      { month: '2025-03', value: 72 },
      { month: '2025-04', value: 76 },
      { month: '2025-05', value: 79 },
      { month: '2025-06', value: 82 },
    ],
  },
  {
    id: 'kpi-surface-commercialisee',
    code: 'SURFACE_COMMERCIALISEE',
    name: 'Surface Commercialisée',
    description: 'Surface totale sous bail (m²)',
    axe: 'PROJET_HANDOVER',
    formula: 'Somme des surfaces louées',
    unit: 'm²',
    format: 'number',
    frequency: 'monthly',
    thresholds: {
      green: { min: 55000 },
      orange: { min: 45000, max: 55000 },
      red: { max: 45000 },
    },
    interpretation: {
      high: 'Bonne absorption commerciale',
      low: 'Vacance importante',
    },
    historicalData: [
      { month: '2025-01', value: 40200 },
      { month: '2025-02', value: 44100 },
      { month: '2025-03', value: 46700 },
      { month: '2025-04', value: 49300 },
      { month: '2025-05', value: 51200 },
      { month: '2025-06', value: 53200 },
    ],
  },
  {
    id: 'kpi-prospects-pipeline',
    code: 'PROSPECTS_PIPELINE',
    name: 'Prospects en Pipeline',
    description: 'Nombre de prospects en négociation active',
    axe: 'PROJET_HANDOVER',
    formula: 'Comptage prospects stade > visite',
    unit: '',
    format: 'number',
    frequency: 'weekly',
    thresholds: {
      green: { min: 20 },
      orange: { min: 10, max: 20 },
      red: { max: 10 },
    },
    interpretation: {
      high: 'Pipeline commercial sain',
      low: 'Pipeline insuffisant pour atteindre les objectifs',
    },
    historicalData: [
      { month: '2025-01', value: 28 },
      { month: '2025-02', value: 32 },
      { month: '2025-03', value: 35 },
      { month: '2025-04', value: 30 },
      { month: '2025-05', value: 25 },
      { month: '2025-06', value: 22 },
    ],
  },

  // ============================================================================
  // PHASES DE CONSTRUCTION
  // ============================================================================
  {
    id: 'kpi-avancement-travaux',
    code: 'AVANCEMENT_TRAVAUX',
    name: 'Avancement Travaux Global',
    description: 'Progression globale des travaux',
    axe: 'PROJET_HANDOVER',
    formula: 'Moyenne pondérée avancement travaux par bâtiment',
    unit: '%',
    format: 'percent',
    frequency: 'weekly',
    thresholds: {
      green: { min: 80 },
      orange: { min: 60, max: 80 },
      red: { max: 60 },
    },
    interpretation: {
      high: 'Travaux bien avancés',
      low: 'Retard travaux',
    },
    historicalData: [
      { month: '2025-01', value: 45 },
      { month: '2025-02', value: 52 },
      { month: '2025-03', value: 58 },
      { month: '2025-04', value: 64 },
      { month: '2025-05', value: 70 },
      { month: '2025-06', value: 75 },
    ],
  },
  {
    id: 'kpi-mise-en-service',
    code: 'MISE_EN_SERVICE',
    name: 'Progression Mise en Service',
    description: 'Avancement global de la mise en service',
    axe: 'PROJET_HANDOVER',
    formula: 'Moyenne pondérée mise en service par bâtiment',
    unit: '%',
    format: 'percent',
    frequency: 'weekly',
    thresholds: {
      green: { min: 70 },
      orange: { min: 50, max: 70 },
      red: { max: 50 },
    },
    interpretation: {
      high: 'Mise en service en bonne voie',
      low: 'Retard sur la mise en service',
    },
    historicalData: [
      { month: '2025-01', value: 5 },
      { month: '2025-02', value: 10 },
      { month: '2025-03', value: 18 },
      { month: '2025-04', value: 28 },
      { month: '2025-05', value: 38 },
      { month: '2025-06', value: 48 },
    ],
  },
  {
    id: 'kpi-batiments-livres',
    code: 'BATIMENTS_LIVRES',
    name: 'Bâtiments Livrés',
    description: 'Nombre de structures livrées / Total',
    axe: 'PROJET_HANDOVER',
    formula: 'Comptage bâtiments avec statut = livré',
    unit: '',
    format: 'number',
    frequency: 'monthly',
    thresholds: {
      green: { min: 6 },
      orange: { min: 3, max: 6 },
      red: { max: 3 },
    },
    interpretation: {
      high: 'Majorité des structures livrées',
      low: 'Peu de structures livrées',
    },
    historicalData: [
      { month: '2025-01', value: 0 },
      { month: '2025-02', value: 0 },
      { month: '2025-03', value: 1 },
      { month: '2025-04', value: 2 },
      { month: '2025-05', value: 3 },
      { month: '2025-06', value: 4 },
    ],
  },
];

// ============================================================================
// TEMPLATES DE RAPPORT
// ============================================================================

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'template-rapport-mensuel',
    name: 'Rapport Mensuel Centre',
    description: 'Rapport mensuel de performance du centre commercial',
    category: 'mensuel',
    type: 'RAPPORT_MENSUEL',
    sections: [
      {
        type: 'section',
        title: 'Synthèse Exécutive',
        icon: 'FileText',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Performance Financière',
        icon: 'TrendingUp',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'NOI & Revenus',
            icon: 'DollarSign',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Budget vs Réel',
            icon: 'BarChart2',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Activité Commerciale',
        icon: 'ShoppingBag',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'Fréquentation',
            icon: 'Users',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Chiffre d\'Affaires',
            icon: 'TrendingUp',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Situation Locative',
        icon: 'Building',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Actions & Recommandations',
        icon: 'CheckSquare',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
    ],
    designSettings: {
      page: { format: 'A4', orientation: 'portrait', margins: 'normal' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 11 },
      colors: { primary: '#1C3163', secondary: '#D4AF37', accent: '#10b981', text: '#1f2937', background: '#ffffff' },
      branding: { showPageNumbers: true },
      coverPage: { enabled: true, template: 'standard' },
      tableOfContents: { enabled: true, depth: 2, showPageNumbers: true },
    },
  },
  {
    id: 'template-performance-actif',
    name: 'Performance Actif',
    description: 'Rapport trimestriel de performance de l\'actif',
    category: 'trimestriel',
    type: 'PERF_ACTIF',
    sections: [
      {
        type: 'section',
        title: 'Vue d\'ensemble',
        icon: 'LayoutDashboard',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Indicateurs Clés',
        icon: 'BarChart2',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'NOI & Rendement',
            icon: 'TrendingUp',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Occupation',
            icon: 'Building',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'WAULT',
            icon: 'Clock',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Analyse Détaillée',
        icon: 'FileSearch',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Perspectives',
        icon: 'Target',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
    ],
    designSettings: {
      page: { format: 'A4', orientation: 'portrait', margins: 'normal' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 11 },
      colors: { primary: '#1C3163', secondary: '#D4AF37', accent: '#10b981', text: '#1f2937', background: '#ffffff' },
      branding: { showPageNumbers: true },
      coverPage: { enabled: true, template: 'modern' },
      tableOfContents: { enabled: true, depth: 2, showPageNumbers: true },
    },
  },
  {
    id: 'template-etat-locatif',
    name: 'État Locatif',
    description: 'État locatif détaillé du centre',
    category: 'ponctuel',
    type: 'ETAT_LOCATIF_REPORT',
    sections: [
      {
        type: 'section',
        title: 'Synthèse',
        icon: 'FileText',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'État Locatif Détaillé',
        icon: 'Table',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Vacance',
        icon: 'AlertCircle',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Échéances Baux',
        icon: 'Calendar',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Mix Commercial',
        icon: 'PieChart',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
    ],
    designSettings: {
      page: { format: 'A4', orientation: 'landscape', margins: 'narrow' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 10 },
      colors: { primary: '#1C3163', secondary: '#D4AF37', accent: '#10b981', text: '#1f2937', background: '#ffffff' },
      branding: { showPageNumbers: true },
      coverPage: { enabled: false, template: 'minimal' },
      tableOfContents: { enabled: true, depth: 1, showPageNumbers: true },
    },
  },
  {
    id: 'template-reporting-proprietaire',
    name: 'Reporting Propriétaire',
    description: 'Rapport trimestriel pour les investisseurs',
    category: 'trimestriel',
    type: 'REPORTING_PROPRIETAIRE',
    sections: [
      {
        type: 'section',
        title: 'Message du Directeur',
        icon: 'MessageSquare',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Performance Financière',
        icon: 'TrendingUp',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'Compte de Résultat',
            icon: 'FileText',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Rendement',
            icon: 'Percent',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Situation Locative',
        icon: 'Building',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Risques & Opportunités',
        icon: 'AlertTriangle',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Valorisation',
        icon: 'DollarSign',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Plan d\'Action',
        icon: 'CheckSquare',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
    ],
    designSettings: {
      page: { format: 'A4', orientation: 'portrait', margins: 'normal' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 11 },
      colors: { primary: '#1C3163', secondary: '#D4AF37', accent: '#10b981', text: '#1f2937', background: '#ffffff' },
      branding: { showPageNumbers: true },
      coverPage: { enabled: true, template: 'modern' },
      tableOfContents: { enabled: true, depth: 2, showPageNumbers: true },
    },
  },

  // ============================================================================
  // TEMPLATES PROJET HANDOVER ANGRÉ
  // ============================================================================
  {
    id: 'template-avancement-projet',
    name: 'Rapport d\'Avancement Projet Handover',
    description: 'Rapport complet sur l\'état d\'avancement du projet de handover Angré',
    category: 'projet',
    type: 'AVANCEMENT_PROJET',
    sections: [
      {
        type: 'section',
        title: 'Résumé Exécutif',
        icon: 'FileText',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Indicateurs Clés du Projet',
        icon: 'BarChart2',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'Avancement Global',
            icon: 'TrendingUp',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Avancement par Axe',
            icon: 'Target',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Suivi des Actions',
        icon: 'CheckSquare',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'Actions par Statut',
            icon: 'PieChart',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Actions Prioritaires',
            icon: 'AlertCircle',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Jalons du Projet',
        icon: 'Flag',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Gestion des Risques',
        icon: 'AlertTriangle',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Budget Projet',
        icon: 'DollarSign',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Points d\'Attention & Décisions',
        icon: 'AlertCircle',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Prochaines Étapes',
        icon: 'ArrowRight',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
    ],
    designSettings: {
      page: { format: 'A4', orientation: 'portrait', margins: 'normal' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 11 },
      colors: { primary: '#1C3163', secondary: '#D4AF37', accent: '#3b82f6', text: '#1f2937', background: '#ffffff' },
      branding: { showPageNumbers: true },
      coverPage: { enabled: true, template: 'modern' },
      tableOfContents: { enabled: true, depth: 2, showPageNumbers: true },
    },
  },
  {
    id: 'template-flash-projet',
    name: 'Flash Hebdomadaire Projet',
    description: 'Synthèse hebdomadaire rapide du projet de handover (1-2 pages)',
    category: 'projet',
    type: 'FLASH_PROJET',
    sections: [
      {
        type: 'section',
        title: 'Météo du Projet',
        icon: 'Sun',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Indicateurs Flash',
        icon: 'BarChart2',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Faits Marquants de la Semaine',
        icon: 'Star',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Actions Terminées',
        icon: 'CheckCircle',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Alertes & Blocages',
        icon: 'AlertTriangle',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Focus Semaine Suivante',
        icon: 'Target',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
    ],
    designSettings: {
      page: { format: 'A4', orientation: 'portrait', margins: 'narrow' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 10 },
      colors: { primary: '#1C3163', secondary: '#D4AF37', accent: '#3b82f6', text: '#1f2937', background: '#ffffff' },
      branding: { showPageNumbers: true },
      coverPage: { enabled: false, template: 'minimal' },
      tableOfContents: { enabled: false, depth: 1, showPageNumbers: false },
    },
  },
  {
    id: 'template-bilan-handover',
    name: 'Bilan de Handover',
    description: 'Rapport de bilan complet du projet de handover Angré',
    category: 'projet',
    type: 'BILAN_HANDOVER',
    sections: [
      {
        type: 'section',
        title: 'Introduction & Contexte',
        icon: 'FileText',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Synthèse du Projet',
        icon: 'LayoutDashboard',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'Objectifs vs Réalisations',
            icon: 'Target',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Timeline du Projet',
            icon: 'Calendar',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Bilan par Axe Stratégique',
        icon: 'BarChart2',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'AXE 1 - Performance Financière',
            icon: 'DollarSign',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'AXE 2 - Excellence Opérationnelle',
            icon: 'Settings',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'AXE 3 - Gouvernance & Conformité',
            icon: 'Shield',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'AXE 4 - Développement Commercial',
            icon: 'ShoppingBag',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'AXE 5 - Capital Humain',
            icon: 'Users',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'AXE 6 - Relations Stakeholders',
            icon: 'Handshake',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Bilan Financier',
        icon: 'TrendingUp',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'Budget Consommé',
            icon: 'Receipt',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Écarts & Justifications',
            icon: 'FileQuestion',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Bilan Risques',
        icon: 'AlertTriangle',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Leçons Apprises',
        icon: 'Lightbulb',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Recommandations',
        icon: 'MessageSquare',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Annexes',
        icon: 'Paperclip',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
    ],
    designSettings: {
      page: { format: 'A4', orientation: 'portrait', margins: 'normal' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 11 },
      colors: { primary: '#1C3163', secondary: '#D4AF37', accent: '#3b82f6', text: '#1f2937', background: '#ffffff' },
      branding: { showPageNumbers: true },
      coverPage: { enabled: true, template: 'modern' },
      tableOfContents: { enabled: true, depth: 3, showPageNumbers: true },
    },
  },
  {
    id: 'template-suivi-actions',
    name: 'Suivi des Actions Projet',
    description: 'Rapport détaillé de suivi des actions du projet de handover',
    category: 'projet',
    type: 'SUIVI_ACTIONS',
    sections: [
      {
        type: 'section',
        title: 'Vue d\'Ensemble',
        icon: 'LayoutDashboard',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Actions par Statut',
        icon: 'PieChart',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'Actions Terminées',
            icon: 'CheckCircle',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Actions En Cours',
            icon: 'Clock',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Actions En Retard',
            icon: 'AlertCircle',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Actions Bloquées',
            icon: 'XCircle',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Actions par Axe',
        icon: 'Layers',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Actions par Responsable',
        icon: 'Users',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Analyse Burndown',
        icon: 'TrendingDown',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Liste Complète des Actions',
        icon: 'List',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
    ],
    designSettings: {
      page: { format: 'A4', orientation: 'landscape', margins: 'narrow' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 10 },
      colors: { primary: '#1C3163', secondary: '#D4AF37', accent: '#3b82f6', text: '#1f2937', background: '#ffffff' },
      branding: { showPageNumbers: true },
      coverPage: { enabled: false, template: 'minimal' },
      tableOfContents: { enabled: true, depth: 2, showPageNumbers: true },
    },
  },
  {
    id: 'template-analyse-risques',
    name: 'Analyse des Risques Projet',
    description: 'Rapport d\'analyse des risques du projet de handover',
    category: 'projet',
    type: 'ANALYSE_RISQUES',
    sections: [
      {
        type: 'section',
        title: 'Synthèse des Risques',
        icon: 'AlertTriangle',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Matrice des Risques',
        icon: 'Grid',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Risques Critiques',
        icon: 'AlertOctagon',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Risques par Catégorie',
        icon: 'FolderTree',
        level: 1,
        blocks: [],
        children: [
          {
            type: 'section',
            title: 'Risques Techniques',
            icon: 'Cpu',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Risques Financiers',
            icon: 'DollarSign',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Risques Organisationnels',
            icon: 'Building',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
          {
            type: 'section',
            title: 'Risques RH',
            icon: 'Users',
            level: 2,
            blocks: [],
            children: [],
            status: 'manual',
            isLocked: false,
          },
        ],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Plans de Mitigation',
        icon: 'Shield',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Évolution des Risques',
        icon: 'TrendingUp',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
      {
        type: 'section',
        title: 'Registre Complet des Risques',
        icon: 'Table',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      },
    ],
    designSettings: {
      page: { format: 'A4', orientation: 'portrait', margins: 'normal' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 11 },
      colors: { primary: '#1C3163', secondary: '#D4AF37', accent: '#ef4444', text: '#1f2937', background: '#ffffff' },
      branding: { showPageNumbers: true },
      coverPage: { enabled: true, template: 'standard' },
      tableOfContents: { enabled: true, depth: 2, showPageNumbers: true },
    },
  },
];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

export const getChartsByCategory = (category: ChartCategory): ChartTemplate[] => {
  return CHART_TEMPLATES.filter((chart) => chart.category === category);
};

export const getTablesByCategory = (category: TableCategory): TableTemplate[] => {
  return TABLE_TEMPLATES.filter((table) => table.category === category);
};

export const getKPIsByAxe = (axe: string): KPIDefinition[] => {
  return KPI_DEFINITIONS.filter((kpi) => kpi.axe === axe);
};

export const getCompatibleCharts = (reportType: string): ChartTemplate[] => {
  return CHART_TEMPLATES.filter((chart) => chart.compatibleReportTypes.includes(reportType as ReportType));
};

export const getCompatibleTables = (reportType: string): TableTemplate[] => {
  return TABLE_TEMPLATES.filter((table) => table.compatibleReportTypes.includes(reportType as ReportType));
};

export const getChartById = (id: string): ChartTemplate | undefined => {
  return CHART_TEMPLATES.find((chart) => chart.id === id);
};

export const getTableById = (id: string): TableTemplate | undefined => {
  return TABLE_TEMPLATES.find((table) => table.id === id);
};

export const getKPIById = (id: string): KPIDefinition | undefined => {
  return KPI_DEFINITIONS.find((kpi) => kpi.id === id);
};

export const getReportTemplateById = (id: string): ReportTemplate | undefined => {
  return REPORT_TEMPLATES.find((template) => template.id === id);
};

export const searchCharts = (query: string): ChartTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return CHART_TEMPLATES.filter(
    (chart) =>
      chart.name.toLowerCase().includes(lowerQuery) ||
      chart.description.toLowerCase().includes(lowerQuery)
  );
};

export const searchTables = (query: string): TableTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return TABLE_TEMPLATES.filter(
    (table) =>
      table.name.toLowerCase().includes(lowerQuery) ||
      table.description.toLowerCase().includes(lowerQuery)
  );
};

export const searchKPIs = (query: string): KPIDefinition[] => {
  const lowerQuery = query.toLowerCase();
  return KPI_DEFINITIONS.filter(
    (kpi) =>
      kpi.name.toLowerCase().includes(lowerQuery) ||
      kpi.description.toLowerCase().includes(lowerQuery) ||
      kpi.code.toLowerCase().includes(lowerQuery)
  );
};

// Aliases for backward compatibility
export const reportTemplates = REPORT_TEMPLATES;
