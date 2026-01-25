// ============================================================================
// REPORT STUDIO - TYPES
// Module Rapport Studio et Catalogue pour COCKPIT
// ============================================================================

// ============================================================================
// ENUMS & CONSTANTS - REPORT STATUS
// ============================================================================

export const REPORT_STATUSES = [
  'draft',
  'generating',
  'review',
  'approved',
  'published',
  'archived',
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: 'Brouillon',
  generating: 'En génération',
  review: 'En revue',
  approved: 'Approuvé',
  published: 'Publié',
  archived: 'Archivé',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  draft: '#6b7280',
  generating: '#f59e0b',
  review: '#8b5cf6',
  approved: '#10b981',
  published: '#1C3163',
  archived: '#9ca3af',
};

// ============================================================================
// ENUMS & CONSTANTS - REPORT TYPES
// ============================================================================

export const REPORT_TYPES = [
  'PERF_ACTIF',
  'ANALYSE_PORTEFEUILLE',
  'REPORTING_PROPRIETAIRE',
  'NOI_ANALYSIS',
  'COMPTE_RESULTAT',
  'ETAT_LOCATIF_REPORT',
  'TDB_CENTRE',
  'SUIVI_VACANCE',
  'SUIVI_BAUX',
  'MERCHANDISING_MIX',
  'PIPELINE_COMMERCIAL',
  'GESTION_CHARGES',
  'BUDGET_VS_REEL',
  'ANALYSE_FREQUENTATION',
  'ANALYSE_CA',
  'PERF_ENSEIGNES',
  'DUE_DILIGENCE',
  'VALORISATION_DCF',
  'BENCHMARK_LOYERS',
  'ANALYSE_CONCURRENTIELLE',
  'DASHBOARD_PROJET',
  'BUDGET_PROJET',
  'REPORTING_PROJET',
  'COMMERCIALISATION_PROJET',
  'RAPPORT_MENSUEL',
  'RAPPORT_TRIMESTRIEL',
  'RAPPORT_ANNUEL',
  // Projet Handover Angré
  'AVANCEMENT_PROJET',
  'SUIVI_ACTIONS',
  'SUIVI_JALONS',
  'ANALYSE_RISQUES',
  'BILAN_HANDOVER',
  'FLASH_PROJET',
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  PERF_ACTIF: 'Performance Actif',
  ANALYSE_PORTEFEUILLE: 'Analyse Portefeuille',
  REPORTING_PROPRIETAIRE: 'Reporting Propriétaire',
  NOI_ANALYSIS: 'Analyse NOI',
  COMPTE_RESULTAT: 'Compte de Résultat',
  ETAT_LOCATIF_REPORT: 'État Locatif',
  TDB_CENTRE: 'Tableau de Bord Centre',
  SUIVI_VACANCE: 'Suivi Vacance',
  SUIVI_BAUX: 'Suivi Baux',
  MERCHANDISING_MIX: 'Mix Commercial',
  PIPELINE_COMMERCIAL: 'Pipeline Commercial',
  GESTION_CHARGES: 'Gestion Charges',
  BUDGET_VS_REEL: 'Budget vs Réel',
  ANALYSE_FREQUENTATION: 'Analyse Fréquentation',
  ANALYSE_CA: 'Analyse CA',
  PERF_ENSEIGNES: 'Performance Enseignes',
  DUE_DILIGENCE: 'Due Diligence',
  VALORISATION_DCF: 'Valorisation DCF',
  BENCHMARK_LOYERS: 'Benchmark Loyers',
  ANALYSE_CONCURRENTIELLE: 'Analyse Concurrentielle',
  DASHBOARD_PROJET: 'Dashboard Projet',
  BUDGET_PROJET: 'Budget Projet',
  REPORTING_PROJET: 'Reporting Projet',
  COMMERCIALISATION_PROJET: 'Commercialisation Projet',
  RAPPORT_MENSUEL: 'Rapport Mensuel',
  RAPPORT_TRIMESTRIEL: 'Rapport Trimestriel',
  RAPPORT_ANNUEL: 'Rapport Annuel',
  // Projet Handover Angré
  AVANCEMENT_PROJET: 'Avancement Projet',
  SUIVI_ACTIONS: 'Suivi Actions',
  SUIVI_JALONS: 'Suivi Jalons',
  ANALYSE_RISQUES: 'Analyse Risques',
  BILAN_HANDOVER: 'Bilan Handover',
  FLASH_PROJET: 'Flash Projet',
};

// ============================================================================
// ENUMS & CONSTANTS - BLOCK TYPES
// ============================================================================

export const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'chart',
  'table',
  'image',
  'callout',
  'quote',
  'divider',
  'pagebreak',
  'list',
  'kpi_card',
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: 'Paragraphe',
  heading: 'Titre',
  chart: 'Graphique',
  table: 'Tableau',
  image: 'Image',
  callout: 'Encadré',
  quote: 'Citation',
  divider: 'Séparateur',
  pagebreak: 'Saut de page',
  list: 'Liste',
  kpi_card: 'Carte KPI',
};

// ============================================================================
// ENUMS & CONSTANTS - CHART TYPES
// ============================================================================

export const CHART_TYPES = [
  'line',
  'bar',
  'horizontal_bar',
  'stacked_bar',
  'pie',
  'donut',
  'area',
  'radar',
  'scatter',
  'gauge',
  'funnel',
  'treemap',
  'heatmap',
  'waterfall',
  'combo',
] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  line: 'Courbe',
  bar: 'Barres verticales',
  horizontal_bar: 'Barres horizontales',
  stacked_bar: 'Barres empilées',
  pie: 'Camembert',
  donut: 'Donut',
  area: 'Aire',
  radar: 'Radar',
  scatter: 'Nuage de points',
  gauge: 'Jauge',
  funnel: 'Entonnoir',
  treemap: 'Treemap',
  heatmap: 'Carte de chaleur',
  waterfall: 'Cascade',
  combo: 'Combiné',
};

// ============================================================================
// ENUMS & CONSTANTS - CALLOUT VARIANTS
// ============================================================================

export const CALLOUT_VARIANTS = ['info', 'warning', 'success', 'error', 'tip'] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

export const CALLOUT_VARIANT_LABELS: Record<CalloutVariant, string> = {
  info: 'Information',
  warning: 'Attention',
  success: 'Succès',
  error: 'Erreur',
  tip: 'Astuce',
};

export const CALLOUT_VARIANT_COLORS: Record<CalloutVariant, { bg: string; border: string; text: string }> = {
  info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
  success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
  error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  tip: { bg: '#faf5ff', border: '#a855f7', text: '#6b21a8' },
};

// ============================================================================
// ENUMS & CONSTANTS - CATALOGUE CATEGORIES
// ============================================================================

export const CHART_CATEGORIES = [
  'performance',
  'financier',
  'locatif',
  'frequentation',
  'commercial',
  'projet',
] as const;
export type ChartCategory = (typeof CHART_CATEGORIES)[number];

export const CHART_CATEGORY_LABELS: Record<ChartCategory, string> = {
  performance: 'Performance',
  financier: 'Financier',
  locatif: 'Locatif',
  frequentation: 'Fréquentation',
  commercial: 'Commercial',
  projet: 'Projet',
};

export const CHART_CATEGORY_COLORS: Record<ChartCategory, string> = {
  performance: '#1C3163',
  financier: '#ec4899',
  locatif: '#10b981',
  frequentation: '#8b5cf6',
  commercial: '#f97316',
  projet: '#3b82f6',
};

export const TABLE_CATEGORIES = ['locatif', 'baux', 'financier', 'kpis', 'budget', 'projet'] as const;
export type TableCategory = (typeof TABLE_CATEGORIES)[number];

export const TABLE_CATEGORY_LABELS: Record<TableCategory, string> = {
  locatif: 'Locatif',
  baux: 'Baux',
  financier: 'Financier',
  kpis: 'KPIs',
  budget: 'Budget',
  projet: 'Projet',
};

export const TABLE_CATEGORY_COLORS: Record<TableCategory, string> = {
  locatif: '#10b981',
  baux: '#D4AF37',
  financier: '#ec4899',
  kpis: '#1C3163',
  budget: '#f97316',
  projet: '#3b82f6',
};

// ============================================================================
// ENUMS & CONSTANTS - KPI AXES
// ============================================================================

export const KPI_AXES = [
  'AXE1_PERFORMANCE_FINANCIERE',
  'AXE2_EXCELLENCE_OPERATIONNELLE',
  'AXE3_GOUVERNANCE_CONFORMITE',
  'AXE4_DEVELOPPEMENT_COMMERCIAL',
  'AXE5_LEADERSHIP_CAPITAL_HUMAIN',
  'AXE6_RELATIONS_STAKEHOLDERS',
  'PROJET_HANDOVER',
] as const;
export type KPIAxe = (typeof KPI_AXES)[number];

export const KPI_AXE_LABELS: Record<KPIAxe, string> = {
  AXE1_PERFORMANCE_FINANCIERE: 'AXE 1 - Performance Financière',
  AXE2_EXCELLENCE_OPERATIONNELLE: 'AXE 2 - Excellence Opérationnelle',
  AXE3_GOUVERNANCE_CONFORMITE: 'AXE 3 - Gouvernance & Conformité',
  AXE4_DEVELOPPEMENT_COMMERCIAL: 'AXE 4 - Développement Commercial',
  AXE5_LEADERSHIP_CAPITAL_HUMAIN: 'AXE 5 - Leadership & Capital Humain',
  AXE6_RELATIONS_STAKEHOLDERS: 'AXE 6 - Relations Stakeholders',
  PROJET_HANDOVER: 'Projet Handover',
};

// ============================================================================
// ENUMS & CONSTANTS - EXPORT
// ============================================================================

export const EXPORT_FORMATS = ['pdf', 'docx', 'pptx', 'xlsx', 'html', 'md'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: 'PDF',
  docx: 'Word',
  pptx: 'PowerPoint',
  xlsx: 'Excel',
  html: 'HTML',
  md: 'Markdown',
};

export const EXPORT_QUALITIES = ['draft', 'standard', 'high'] as const;
export type ExportQuality = (typeof EXPORT_QUALITIES)[number];

export const EXPORT_QUALITY_LABELS: Record<ExportQuality, string> = {
  draft: 'Brouillon',
  standard: 'Standard',
  high: 'Haute qualité',
};

// ============================================================================
// ENUMS & CONSTANTS - PAGE SETTINGS
// ============================================================================

export const PAGE_FORMATS = ['A4', 'Letter', 'A3'] as const;
export type PageFormat = (typeof PAGE_FORMATS)[number];

export const PAGE_ORIENTATIONS = ['portrait', 'landscape'] as const;
export type PageOrientation = (typeof PAGE_ORIENTATIONS)[number];

export const PAGE_MARGINS = ['normal', 'narrow', 'wide'] as const;
export type PageMargin = (typeof PAGE_MARGINS)[number];

// ============================================================================
// ENUMS & CONSTANTS - AI PANEL
// ============================================================================

export const AI_TAB_TYPES = [
  'resume',
  'insights',
  'actions',
  'activity',
  'comments',
  'chat',
] as const;
export type AITabType = (typeof AI_TAB_TYPES)[number];

export const AI_TAB_LABELS: Record<AITabType, string> = {
  resume: 'Résumé',
  insights: 'Insights',
  actions: 'Actions',
  activity: 'Activité',
  comments: 'Commentaires',
  chat: 'Chat',
};

// ============================================================================
// CONTENT BLOCKS
// ============================================================================

export interface BaseBlock {
  id: string;
  type: BlockType;
  createdAt: string;
  updatedAt: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    highlight?: string;
    color?: string;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: number;
  };
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  fill?: boolean;
  type?: 'line' | 'bar';
}

export interface ChartBlock extends BaseBlock {
  type: 'chart';
  chartType: ChartType;
  title: string;
  subtitle?: string;
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  config: {
    showLegend?: boolean;
    legendPosition?: 'top' | 'bottom' | 'left' | 'right';
    xAxisLabel?: string;
    yAxisLabel?: string;
    showGrid?: boolean;
    stacked?: boolean;
    colors?: string[];
  };
  sourceTemplateId?: string;
}

export interface TableHeader {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date';
}

export interface TableRow {
  [key: string]: string | number | boolean | null;
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  title?: string;
  headers: TableHeader[];
  rows: TableRow[];
  config: {
    striped?: boolean;
    bordered?: boolean;
    compact?: boolean;
    showTotals?: boolean;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  };
  sourceTemplateId?: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  variant: CalloutVariant;
  title?: string;
  content: string;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: string;
  author?: string;
  source?: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  style: 'solid' | 'dashed' | 'dotted';
}

export interface PageBreakBlock extends BaseBlock {
  type: 'pagebreak';
}

export interface ListItem {
  id: string;
  content: string;
  children?: ListItem[];
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  listType: 'bullet' | 'numbered';
  items: ListItem[];
}

export interface KPICardBlock extends BaseBlock {
  type: 'kpi_card';
  label: string;
  value: number;
  unit?: string;
  format?: 'number' | 'currency' | 'percent';
  variation?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    isPositive: boolean;
  };
  sparklineData?: number[];
  targetValue?: number;
  thresholds?: {
    green: number;
    orange: number;
    red: number;
  };
}

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ChartBlock
  | TableBlock
  | ImageBlock
  | CalloutBlock
  | QuoteBlock
  | DividerBlock
  | PageBreakBlock
  | ListBlock
  | KPICardBlock;

// ============================================================================
// SECTIONS
// ============================================================================

export type SectionStatus = 'generated' | 'edited' | 'manual';
export type CompletionStatus = 'complete' | 'draft' | 'needs_review';

export interface Section {
  id: string;
  type: 'section';
  title: string;
  icon?: string;
  level: number;
  blocks: ContentBlock[];
  children: Section[];
  status: SectionStatus;
  isLocked: boolean;
  isCollapsed?: boolean;
  metadata?: {
    completionStatus?: CompletionStatus;
    hasComments?: boolean;
    aiConfidence?: number;
  };
}

export interface ContentTree {
  sections: Section[];
}

// ============================================================================
// DESIGN SETTINGS
// ============================================================================

export interface ReportDesignSettings {
  page: {
    format: PageFormat;
    orientation: PageOrientation;
    margins: PageMargin;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  branding: {
    logo?: string;
    headerText?: string;
    footerText?: string;
    showPageNumbers?: boolean;
  };
  header?: {
    enabled: boolean;
    leftText?: string;
    centerText?: string;
    rightText?: string;
    showDate?: boolean;
    showLogo?: boolean;
  };
  footer?: {
    enabled: boolean;
    leftText?: string;
    centerText?: string;
    rightText?: string;
    showPageNumbers?: boolean;
  };
  coverPage: {
    enabled: boolean;
    template: 'standard' | 'minimal' | 'modern';
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
  };
  tableOfContents: {
    enabled: boolean;
    depth: number;
    showPageNumbers: boolean;
  };
}

// ============================================================================
// REPORT ENTITY
// ============================================================================

export interface StudioReport {
  id?: number;
  centreId: string;
  title: string;
  description?: string;
  type: ReportType;
  status: ReportStatus;
  author: string;
  authorId?: number;

  // Période couverte
  periodStart?: string;
  periodEnd?: string;
  periodLabel?: string;

  // Contenu
  contentTree: ContentTree;

  // Métadonnées
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  // Design
  designSettings: ReportDesignSettings;

  // Tags et catégorisation
  tags?: string[];
}

// ============================================================================
// REPORT VERSION
// ============================================================================

export interface ReportVersion {
  id?: number;
  reportId: number;
  versionNumber: number;
  contentTree: ContentTree;
  designSettings: ReportDesignSettings;
  createdAt: string;
  createdBy: string;
  changeDescription?: string;
}

// ============================================================================
// COMMENTS
// ============================================================================

export interface ReportComment {
  id?: number;
  reportId: number;
  sectionId?: string;
  blockId?: string;
  authorId: number;
  authorName: string;
  content: string;
  isResolved: boolean;
  parentCommentId?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================

export interface ReportActivity {
  id?: number;
  reportId: number;
  type: 'created' | 'edited' | 'status_changed' | 'comment_added' | 'exported' | 'published';
  description: string;
  userId: number;
  userName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// AI FEATURES
// ============================================================================

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'comparison' | 'prediction';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  relatedSectionId?: string;
  relatedBlockId?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  actionable: boolean;
  suggestedAction?: string;
  createdAt: string;
}

// ============================================================================
// CATALOGUE - CHART TEMPLATES
// ============================================================================

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  category: ChartCategory;
  chartType: ChartType;
  compatibleReportTypes: ReportType[];
  dataSource?: {
    type: 'kpi' | 'api' | 'computed';
    endpoint?: string;
    kpiCodes?: string[];
    refreshable: boolean;
  };
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  config: {
    title: string;
    subtitle?: string;
    legend?: { show: boolean; position: 'top' | 'bottom' | 'left' | 'right' };
    xAxis?: { label?: string };
    yAxis?: { label?: string };
    showGrid?: boolean;
    colors?: string[];
  };
  thumbnail?: string;
}

// ============================================================================
// CATALOGUE - TABLE TEMPLATES
// ============================================================================

export interface TableTemplate {
  id: string;
  name: string;
  description: string;
  category: TableCategory;
  compatibleReportTypes: ReportType[];
  dataSource?: {
    type: 'entity' | 'api' | 'computed';
    endpoint?: string;
    entityType?: string;
    refreshable: boolean;
  };
  headers: TableHeader[];
  rows: TableRow[];
  config: {
    striped?: boolean;
    bordered?: boolean;
    compact?: boolean;
    showTotals?: boolean;
  };
  thumbnail?: string;
}

// ============================================================================
// CATALOGUE - KPI DEFINITIONS
// ============================================================================

export interface KPIDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  axe: KPIAxe;
  formula?: string;
  unit: string;
  format: 'number' | 'currency' | 'percent';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  thresholds: {
    green: { min?: number; max?: number };
    orange: { min?: number; max?: number };
    red: { min?: number; max?: number };
  };
  interpretation: {
    high: string;
    low: string;
  };
  dataSource?: {
    type: 'computed' | 'api' | 'manual';
    endpoint?: string;
  };
  historicalData?: {
    month: string;
    value: number;
  }[];
}

// ============================================================================
// REPORT TEMPLATES
// ============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'mensuel' | 'trimestriel' | 'annuel' | 'ponctuel' | 'projet';
  type: ReportType;
  sections: Omit<Section, 'id'>[];
  designSettings: ReportDesignSettings;
  thumbnail?: string;
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includeComments: boolean;
  sectionsToExport: 'all' | string[];
  watermark?: string;
  password?: string;
}

// ============================================================================
// FILTERS
// ============================================================================

export interface ReportFilters {
  status?: ReportStatus;
  type?: ReportType;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  tags?: string[];
}

export interface CatalogueFilters {
  category?: ChartCategory | TableCategory;
  search?: string;
  reportType?: ReportType;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_DESIGN_SETTINGS: ReportDesignSettings = {
  page: {
    format: 'A4',
    orientation: 'portrait',
    margins: 'normal',
  },
  typography: {
    headingFont: 'Exo 2',
    bodyFont: 'Inter',
    baseFontSize: 12,
  },
  colors: {
    primary: '#1C3163',
    secondary: '#D4AF37',
    accent: '#10b981',
    text: '#1f2937',
    background: '#ffffff',
  },
  branding: {
    showPageNumbers: true,
  },
  header: {
    enabled: true,
    leftText: 'Cockpit - Rapport',
    showDate: true,
    showLogo: false,
  },
  footer: {
    enabled: true,
    leftText: 'Confidentiel',
    showPageNumbers: true,
  },
  coverPage: {
    enabled: true,
    template: 'standard',
  },
  tableOfContents: {
    enabled: true,
    depth: 2,
    showPageNumbers: true,
  },
};

export const DEFAULT_CONTENT_TREE: ContentTree = {
  sections: [],
};
