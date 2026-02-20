import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Download,
  Calendar,
  BarChart2,
  AlertTriangle,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Copy,
  MoreVertical,
  FileSpreadsheet,
  PenTool,
  Database,
  Table,
  Gauge,
  TrendingUp,
  Link2,
  Mail,
  Globe,
  Clock,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Share2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Target,
  DollarSign,
  Shield,
  Presentation,
  Bot,
  Zap,
  Printer,
  Save,
  ArrowLeft,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Input,
  Textarea,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Select,
  SelectOption,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useDashboardKPIs,
  useActions,
  useJalons,
  useBudgetSynthese,
  useRisques,
  useReports,
  createReport,
  deleteReport,
  useCurrentSite,
} from '@/hooks';
import { useCatalogueData, searchDynamicCharts, searchDynamicTables, searchDynamicKPIs } from '@/hooks/useCatalogueData';
import { ReportStudio } from '@/components/rapports/ReportStudio';
import { EnhancedReportExport } from '@/components/rapports/EnhancedReportExport';
import { Exco } from '@/components/rapports/Exco';
import { ExcoLaunch } from '@/components/rapports/ExcoLaunch';
import { ExcoLancement } from '@/components/rapports/ExcoLancement';
import { ExcoMensuelV5 } from '@/components/rapports/ExcoMensuelV5';
import type { ExcoV5Handle } from '@/components/rapports/ExcoMensuelV5';
import { SendReportModal } from '@/components/rapports/ExcoMensuelV5/SendReportModal';
import { generateExcoPptx } from '@/components/rapports/ExcoMensuelV5/exportPptx';
import { ImportIA } from '@/components/rapports/ImportIA';
import { Journal } from '@/components/rapports/Journal';
import { WeeklyReport } from '@/components/reports/WeeklyReport';
import { MonthlyReport } from '@/components/reports/MonthlyReport';
import { MonthlyReportPage as RappelActionsReport } from '@/components/rapports/ManagerEmail';
import { ReportPeriodSelector, type ReportPeriod } from '@/components/rapports/ReportPeriodSelector';
import { ReportGenerator } from '@/components/rapports/ReportGenerator';
import {
  downloadReportHTML,
  openReportHTML,
  downloadReportPDF,
  downloadReportPPTX,
} from '@/services/reportExportService';
import type { GeneratedReport } from '@/types/reports.types';
import { DEFAULT_EXPORT_OPTIONS } from '@/types/reports.types';
import { createExco } from '@/hooks/useExcos';
import { mapV5DataToExco } from '@/lib/mapReportToExco';
import { sendReportShareEmail, openEmailClientForReport } from '@/services/emailService';
import { storeSharedReportSnapshot } from '@/services/firebaseRealtimeSync';
// Données du site récupérées via useCurrentSite()
import type { ReportType, ReportStatus, ChartCategory, TableCategory } from '@/types/reportStudio';
import {
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  CHART_CATEGORY_LABELS,
  CHART_CATEGORY_COLORS,
  TABLE_CATEGORY_LABELS,
  TABLE_CATEGORY_COLORS,
  CHART_CATEGORIES,
  TABLE_CATEGORIES,
} from '@/types/reportStudio';
import {
  REPORT_TEMPLATES,
} from '@/data/dataLibrary';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
} from 'recharts';
import { PROJET_CONFIG, FIREBASE_TTL } from '@/data/constants';
import { logger } from '@/lib/logger';

const rapportTypes = [
  {
    id: 'flash',
    title: 'Flash Hebdomadaire',
    description: 'Synthèse rapide sur 1 page',
    icon: FileText,
    color: 'bg-info-100 text-info-600',
  },
  {
    id: 'mensuel',
    title: 'Rapport Mensuel',
    description: 'Rapport détaillé complet',
    icon: Calendar,
    color: 'bg-success-100 text-success-600',
  },
  {
    id: 'budget',
    title: 'Rapport Budgétaire',
    description: 'Suivi financier et EVM',
    icon: BarChart2,
    color: 'bg-warning-100 text-warning-600',
  },
  {
    id: 'risques',
    title: 'Rapport Risques',
    description: 'Registre et matrice',
    icon: AlertTriangle,
    color: 'bg-error-100 text-error-600',
  },
];

const statusColors: Record<ReportStatus, string> = {
  draft: 'default',
  generating: 'warning',
  review: 'warning',
  approved: 'info',
  published: 'success',
  archived: 'default',
};

const CHART_COLORS = ['#1C3163', '#D4AF37', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type ViewMode = 'list' | 'studio' | 'catalogue' | 'exports' | 'html_reports' | 'exco' | 'import_ia' | 'journal' | 'auto_generation' | 'weekly_report' | 'monthly_report' | 'rappel_actions';

// Type pour les commentaires de section
interface ReportComment {
  section: 'synthese' | 'avancement' | 'actions' | 'risques' | 'budget';
  content: string;
  author: string;
  date: string;
}

// Type pour les rapports HTML partagés
interface SharedHtmlReport {
  id: string;
  reportId: number;
  reportTitle: string;
  reportType: ReportType;
  shareLink: string;
  createdAt: string;
  expiresAt: string | null;
  viewCount: number;
  isActive: boolean;
  sharedBy: string;
  recipients: string[];
  executiveSummary?: string;
  comments?: ReportComment[];
}

// Chart preview component for catalogue
function ChartPreview({ chart }: { chart: typeof CHART_TEMPLATES[0] }) {
  const data = chart.data.labels.map((label, i) => ({
    name: label,
    value: chart.data.datasets[0]?.data[i] || 0,
    value2: chart.data.datasets[1]?.data[i],
  }));

  const colors = chart.config.colors || CHART_COLORS;

  switch (chart.chartType) {
    case 'bar':
    case 'horizontal_bar':
    case 'stacked_bar':
      return (
        <ResponsiveContainer width="100%" height={100}>
          <RechartsBarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 8 }} hide />
            <YAxis hide />
            <Bar dataKey="value" fill={colors[0]} radius={[2, 2, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      );
    case 'line':
    case 'area':
      return (
        <ResponsiveContainer width="100%" height={100}>
          <RechartsLineChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 8 }} hide />
            <YAxis hide />
            <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={false} />
          </RechartsLineChart>
        </ResponsiveContainer>
      );
    case 'pie':
    case 'donut': {
      const pieData = data.map((d, i) => ({ ...d, fill: colors[i % colors.length] }));
      return (
        <ResponsiveContainer width="100%" height={100}>
          <RechartsPieChart>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={chart.chartType === 'donut' ? 20 : 0}
              outerRadius={40}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      );
    }
    default:
      return (
        <div className="h-[100px] flex items-center justify-center text-gray-400">
          <BarChart2 className="h-10 w-10" />
        </div>
      );
  }
}

export function RapportsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ReportType | ''>('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [newReportData, setNewReportData] = useState<{
    title: string;
    type: ReportType;
    templateIds: string[]; // Support multiple templates
    period: ReportPeriod | null;
  }>(() => {
    // Default period = current month with custom type for date range selection
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      title: '',
      type: 'RAPPORT_MENSUEL' as ReportType,
      templateIds: [], // Array for multiple selection
      period: {
        type: 'custom',
        label: 'Personnalisé',
        startDate: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        endDate: `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`,
        displayText: `Du 01/${String(month + 1).padStart(2, '0')}/${year} au ${lastDay}/${String(month + 1).padStart(2, '0')}/${year}`,
      },
    };
  });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Catalogue state
  const [catalogueTab, setCatalogueTab] = useState<'charts' | 'tables' | 'kpis'>('charts');
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [chartCategory, setChartCategory] = useState<ChartCategory | 'all'>('all');
  const [tableCategory, setTableCategory] = useState<TableCategory | 'all'>('all');

  // EXCO state
  const [excoTemplate, setExcoTemplate] = useState<'launch' | 'monthly'>('launch');
  const [presentationDate, setPresentationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedExcoId, setSelectedExcoId] = useState<number | null>(null);
  const [savingExco, setSavingExco] = useState(false);
  const v5Ref = useRef<ExcoV5Handle>(null);

  // ---- V5 export helpers ----
  const generateHtml = useCallback(() => {
    const el = v5Ref.current?.getAllSlidesEl();
    if (!el) return '';
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>EXCO Mensuel - ${PROJET_CONFIG.nom} - ${presentationDate}</title>
<style>
body{font-family:'Exo 2',Inter,system-ui,sans-serif;margin:0;padding:0;background:#f8f9fa;}
.html-toolbar{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:10px 24px;background:#1a2332;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.15);}
.html-toolbar span{font-size:14px;font-weight:600;letter-spacing:0.5px;}
.html-toolbar .btn-group{display:flex;gap:8px;}
.html-toolbar button{padding:7px 18px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;}
.html-toolbar .btn-print{background:#c8a951;color:#1a2332;}
.html-toolbar .btn-close{background:rgba(255,255,255,0.15);color:#fff;}
.html-toolbar .btn-close:hover{background:rgba(255,255,255,0.25);}
.html-content{padding:24px;}
.slide-page{margin-bottom:40px;padding:24px;background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);}
@media print{.html-toolbar{display:none!important;}.html-content{padding:0;}.slide-page{page-break-after:always;box-shadow:none;margin-bottom:0;}}
</style>
</head><body>
<div class="html-toolbar">
<span>${PROJET_CONFIG.nom} — EXCO Mensuel</span>
<div class="btn-group">
<button class="btn-print" onclick="window.print()">Imprimer / PDF</button>
<button class="btn-close" onclick="window.close()">Fermer</button>
</div>
</div>
<div class="html-content">${el.innerHTML}</div>
</body></html>`;
  }, [presentationDate]);

  const handleDownloadHtml = useCallback(() => {
    const html = generateHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EXCO-Mensuel-${presentationDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generateHtml, presentationDate]);

  const handleOpenHtmlPreview = useCallback(() => {
    const html = generateHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [generateHtml]);

  const handleExportPptx = useCallback(async () => {
    const data = v5Ref.current?.getData();
    if (!data) return;
    try {
      await generateExcoPptx(data, presentationDate);
    } catch (error) {
      logger.error('Erreur export PPTX:', error);
      alert('Erreur lors de l\'export PPTX');
    }
  }, [presentationDate]);

  // HTML Reports state - chargé depuis localStorage ou vide
  const [sharedReports, setSharedReports] = useState<SharedHtmlReport[]>(() => {
    // Charger les rapports partagés depuis localStorage
    const stored = localStorage.getItem('shared-reports-list');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Persister les rapports partagés dans localStorage
  useEffect(() => {
    localStorage.setItem('shared-reports-list', JSON.stringify(sharedReports));
  }, [sharedReports]);

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedReportForShare, setSelectedReportForShare] = useState<number | null>(null);
  const [sharePeriod, setSharePeriod] = useState<ReportPeriod | null>(() => {
    // Default period = current month with custom type for date range selection
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      type: 'custom',
      label: 'Personnalisé',
      startDate: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`,
      displayText: `Du 01/${String(month + 1).padStart(2, '0')}/${year} au ${lastDay}/${String(month + 1).padStart(2, '0')}/${year}`,
    };
  });
  const [shareSettings, setShareSettings] = useState({
    expirationDays: FIREBASE_TTL.SHARED_REPORTS,
    recipients: '',
    notifyByEmail: true,
  });
  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [reportComments, setReportComments] = useState({
    executiveSummary: '',
    avancement: '',
    actions: '',
    risques: '',
    budget: '',
  });

  const reports = useReports({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    search: searchQuery || undefined,
  });

  const kpis = useDashboardKPIs();
  const actions = useActions();
  const jalons = useJalons();
  const budget = useBudgetSynthese();
  const risques = useRisques();
  const currentSite = useCurrentSite();

  // Nom du présentateur pour les partages de rapport
  const presentateurNom = 'Pamela Atokouna';

  // Dynamic catalogue data from real project data
  const catalogueData = useCatalogueData();

  // Filtered catalogue data - using dynamic data
  const filteredCharts = useMemo(() => {
    let charts = catalogueSearch
      ? searchDynamicCharts(catalogueData.charts, catalogueSearch)
      : catalogueData.charts;
    if (chartCategory !== 'all') {
      charts = charts.filter((c) => c.category === chartCategory);
    }
    return charts;
  }, [catalogueSearch, chartCategory, catalogueData.charts]);

  const filteredTables = useMemo(() => {
    let tables = catalogueSearch
      ? searchDynamicTables(catalogueData.tables, catalogueSearch)
      : catalogueData.tables;
    if (tableCategory !== 'all') {
      tables = tables.filter((t) => t.category === tableCategory);
    }
    return tables;
  }, [catalogueSearch, tableCategory, catalogueData.tables]);

  const filteredKPIs = useMemo(() => {
    return catalogueSearch
      ? searchDynamicKPIs(catalogueData.kpis, catalogueSearch)
      : catalogueData.kpis;
  }, [catalogueSearch, catalogueData.kpis]);

  const handleCreateReport = async () => {
    if (!newReportData.title.trim()) return;

    // Récupérer tous les templates sélectionnés
    const selectedTemplates = newReportData.templateIds
      .map((id) => REPORT_TEMPLATES.find((t) => t.id === id))
      .filter(Boolean);

    // Fusionner les sections de tous les templates sélectionnés
    let mergedSections: typeof REPORT_TEMPLATES[0]['sections'] = [];
    let mergedDescription = '';

    if (selectedTemplates.length > 0) {
      // Combiner les sections de tous les templates
      selectedTemplates.forEach((template, index) => {
        if (template?.sections) {
          mergedSections = [...mergedSections, ...template.sections];
        }
        if (template?.description) {
          mergedDescription += (index > 0 ? ' | ' : '') + template.description;
        }
      });
    }

    // Utiliser les designSettings du premier template ou les valeurs par défaut
    const firstTemplate = selectedTemplates[0];
    const designSettings = firstTemplate?.designSettings || {
      page: { format: 'A4', orientation: 'portrait', margins: 'normal' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 12 },
      colors: {
        primary: '#1C3163',
        secondary: '#D4AF37',
        accent: '#10b981',
        text: '#1f2937',
        background: '#ffffff',
      },
      branding: { showPageNumbers: true },
      coverPage: { enabled: true, template: 'standard' },
      tableOfContents: { enabled: true, depth: 2, showPageNumbers: true },
    };

    const id = await createReport({
      centreId: 1,
      title: newReportData.title,
      description: mergedDescription || `Rapport combiné (${selectedTemplates.length} modèle${selectedTemplates.length > 1 ? 's' : ''})`,
      type: newReportData.type,
      status: 'draft',
      author: 'Utilisateur',
      contentTree: { sections: mergedSections },
      designSettings,
      // Période du rapport
      periodStart: newReportData.period?.startDate,
      periodEnd: newReportData.period?.endDate,
      periodLabel: newReportData.period?.displayText,
    });

    setShowNewReportModal(false);
    // Reset avec période par défaut (plage de dates du mois courant)
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const lastDay = new Date(year, month + 1, 0).getDate();
    setNewReportData({
      title: '',
      type: 'RAPPORT_MENSUEL',
      templateIds: [],
      period: {
        type: 'custom',
        label: 'Personnalisé',
        startDate: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        endDate: `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`,
        displayText: `Du 01/${String(month + 1).padStart(2, '0')}/${year} au ${lastDay}/${String(month + 1).padStart(2, '0')}/${year}`,
      },
    });
    setEditingReportId(id);
    setViewMode('studio');
  };

  const handleDeleteReport = async (id: number) => {
    await deleteReport(id);
    setDeleteConfirm(null);
  };

  const handleDuplicateReport = async (report: NonNullable<typeof reports>[number]) => {
    await createReport({
      centreId: report.centreId,
      title: `${report.title} (copie)`,
      description: report.description,
      type: report.type,
      status: 'draft',
      author: 'Utilisateur',
      contentTree: report.contentTree,
      designSettings: report.designSettings,
    });
  };

  const generatePDF = async (type: string) => {
    setGenerating(type);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(PROJET_CONFIG.nom, pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Rapport ${rapportTypes.find((r) => r.id === type)?.title}`, pageWidth / 2, 30, {
        align: 'center',
      });
      doc.setFontSize(10);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 38, {
        align: 'center',
      });

      if (type === 'flash' || type === 'mensuel') {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Indicateurs clés', 14, 55);

        autoTable(doc, {
          startY: 60,
          head: [['Indicateur', 'Valeur']],
          body: [
            ["Taux d'occupation", `${Math.round(kpis.tauxOccupation)}%`],
            ['Budget consommé', `${Math.round((budget.realise / budget.prevu) * 100)}%`],
            ['Jalons atteints', `${kpis.jalonsAtteints}/${kpis.jalonsTotal}`],
            ['Équipe', `${kpis.equipeTaille} membres`],
          ],
        });

        const currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Résumé des actions', 14, currentY);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Statut', 'Nombre']],
          body: [
            ['À faire', actions.filter((a) => a.statut === 'a_faire').length.toString()],
            ['En cours', actions.filter((a) => a.statut === 'en_cours').length.toString()],
            ['Terminées', actions.filter((a) => a.statut === 'termine').length.toString()],
            ['Bloquées', actions.filter((a) => a.statut === 'bloque').length.toString()],
          ],
        });
      }

      if (type === 'budget') {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Synthèse budgétaire', 14, 55);

        autoTable(doc, {
          startY: 60,
          head: [['Poste', 'Montant (FCFA)']],
          body: [
            ['Budget prévu', budget.prevu.toLocaleString('fr-FR')],
            ['Engagé', budget.engage.toLocaleString('fr-FR')],
            ['Réalisé', budget.realise.toLocaleString('fr-FR')],
            ['Écart', (budget.prevu - budget.realise).toLocaleString('fr-FR')],
          ],
        });
      }

      if (type === 'risques') {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Registre des risques', 14, 55);

        autoTable(doc, {
          startY: 60,
          head: [['Risque', 'Catégorie', 'Score', 'Statut']],
          body: risques.slice(0, 10).map((r) => [
            r.titre.substring(0, 40),
            r.categorie,
            r.score?.toString() || '-',
            r.status,
          ]),
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} sur ${pageCount} - ${PROJET_CONFIG.nom} Cockpit`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`rapport-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      logger.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(null);
    }
  };

  const exportExcel = async (type: string) => {
    setGenerating(type);

    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      if (type === 'actions') {
        const ws = XLSX.utils.json_to_sheet(
          actions.map((a) => ({
            Titre: a.titre,
            Axe: a.axe,
            Statut: a.statut,
            Priorité: a.priorite,
            Avancement: `${a.avancement}%`,
            'Date début': a.date_debut_prevue,
            'Date fin': a.date_fin_prevue,
          }))
        );
        XLSX.utils.book_append_sheet(wb, ws, 'Actions');
      }

      XLSX.writeFile(wb, `export-${type}-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      logger.error('Error exporting Excel:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setGenerating(null);
    }
  };

  // If editing a report, show the Studio
  if (viewMode === 'studio' && editingReportId) {
    return (
      <ReportStudio
        reportId={editingReportId}
        onClose={() => {
          setViewMode('list');
          setEditingReportId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Rapports</h2>
          <p className="text-sm text-primary-500">
            Gérez vos rapports, accédez au catalogue et exportez vos données
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowNewReportModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rapport
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <FileText className="h-4 w-4" />
            Mes rapports
            {reports && reports.length > 0 && (
              <Badge variant="secondary">{reports.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="catalogue" className="gap-2">
            <Database className="h-4 w-4" />
            Catalogue
          </TabsTrigger>
          <TabsTrigger value="exports" className="gap-2">
            <Download className="h-4 w-4" />
            Exports rapides
          </TabsTrigger>
          <TabsTrigger value="html_reports" className="gap-2">
            <Globe className="h-4 w-4" />
            Partage HTML
            {sharedReports.filter(r => r.isActive).length > 0 && (
              <Badge variant="secondary">{sharedReports.filter(r => r.isActive).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="auto_generation" className="gap-2">
            <Zap className="h-4 w-4" />
            Génération Auto
          </TabsTrigger>
          <TabsTrigger value="weekly_report" className="gap-2">
            <Calendar className="h-4 w-4" />
            Rapport Hebdo
          </TabsTrigger>
          <TabsTrigger value="monthly_report" className="gap-2">
            <BarChart2 className="h-4 w-4" />
            Rapport Mensuel
          </TabsTrigger>
          <TabsTrigger value="rappel_actions" className="gap-2">
            <Mail className="h-4 w-4" />
            Rappel Actions
          </TabsTrigger>
          <TabsTrigger value="exco" className="gap-2">
            <Presentation className="h-4 w-4" />
            EXCO
          </TabsTrigger>
          <TabsTrigger value="import_ia" className="gap-2">
            <Bot className="h-4 w-4" />
            Import IA
          </TabsTrigger>
          <TabsTrigger value="journal" className="gap-2">
            <FileText className="h-4 w-4" />
            Journal
          </TabsTrigger>
        </TabsList>

        {/* Reports List */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card padding="md">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                  <Input
                    placeholder="Rechercher un rapport..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
                className="w-40"
              >
                <SelectOption value="">Tous les statuts</SelectOption>
                {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => (
                  <SelectOption key={value} value={value}>
                    {label}
                  </SelectOption>
                ))}
              </Select>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ReportType | '')}
                className="w-40"
              >
                <SelectOption value="">Tous les types</SelectOption>
                {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                  <SelectOption key={value} value={value}>
                    {label}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </Card>

          {/* Reports Grid */}
          {!reports || reports.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="py-12">
                <PenTool className="h-16 w-16 text-primary-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  Aucun rapport
                </h3>
                <p className="text-primary-500 mb-6">
                  Créez votre premier rapport professionnel avec Report Studio
                </p>
                <Button variant="primary" onClick={() => setShowNewReportModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un rapport
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <Card key={report.id} padding="md" className="card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[report.status] as 'default' | 'success' | 'warning' | 'info'}>
                        {REPORT_STATUS_LABELS[report.status]}
                      </Badge>
                      <Badge variant="default">{REPORT_TYPE_LABELS[report.type]}</Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingReportId(report.id!);
                            setViewMode('studio');
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateReport(report)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-error-600"
                          onClick={() => setDeleteConfirm(report.id!)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h4 className="font-semibold text-primary-900 mb-1 line-clamp-1">
                    {report.title}
                  </h4>
                  {report.description && (
                    <p className="text-sm text-primary-500 mb-3 line-clamp-2">
                      {report.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-primary-400 mb-4">
                    <span>{report.author}</span>
                    <span>
                      Modifié le {new Date(report.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingReportId(report.id!);
                        setViewMode('studio');
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Ouvrir
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Catalogue */}
        <TabsContent value="catalogue" className="space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                <Input
                  placeholder="Rechercher dans le catalogue..."
                  value={catalogueSearch}
                  onChange={(e) => setCatalogueSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={catalogueTab} onValueChange={(v) => setCatalogueTab(v as 'charts' | 'tables' | 'kpis')}>
              <TabsList>
                <TabsTrigger value="charts" className="gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Graphiques
                  <Badge variant="secondary">{filteredCharts.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="tables" className="gap-2">
                  <Table className="h-4 w-4" />
                  Tableaux
                  <Badge variant="secondary">{filteredTables.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="kpis" className="gap-2">
                  <Gauge className="h-4 w-4" />
                  KPIs
                  <Badge variant="secondary">{filteredKPIs.length}</Badge>
                </TabsTrigger>
              </TabsList>

              {/* Charts */}
              <TabsContent value="charts" className="mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-primary-500">Catégorie:</span>
                  <Select
                    value={chartCategory}
                    onChange={(e) => setChartCategory(e.target.value as ChartCategory | 'all')}
                    className="w-48"
                  >
                    <SelectOption value="all">Toutes les catégories</SelectOption>
                    {CHART_CATEGORIES.map((cat) => (
                      <SelectOption key={cat} value={cat}>
                        {CHART_CATEGORY_LABELS[cat]}
                      </SelectOption>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCharts.map((chart) => (
                    <Card key={chart.id} padding="sm" className="card-hover">
                      <div className="bg-gray-50 rounded-lg p-2 mb-3">
                        <ChartPreview chart={chart} />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-primary-900 truncate">
                            {chart.name}
                          </h4>
                          <p className="text-xs text-primary-500 truncate">
                            {chart.description}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-xs"
                          style={{
                            backgroundColor: `${CHART_CATEGORY_COLORS[chart.category]}20`,
                            color: CHART_CATEGORY_COLORS[chart.category],
                          }}
                        >
                          {CHART_CATEGORY_LABELS[chart.category]}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredCharts.length === 0 && (
                  <div className="text-center py-12">
                    <BarChart2 className="h-12 w-12 text-primary-300 mx-auto mb-3" />
                    <p className="text-primary-500">Aucun graphique trouvé</p>
                  </div>
                )}
              </TabsContent>

              {/* Tables */}
              <TabsContent value="tables" className="mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-primary-500">Catégorie:</span>
                  <Select
                    value={tableCategory}
                    onChange={(e) => setTableCategory(e.target.value as TableCategory | 'all')}
                    className="w-48"
                  >
                    <SelectOption value="all">Toutes les catégories</SelectOption>
                    {TABLE_CATEGORIES.map((cat) => (
                      <SelectOption key={cat} value={cat}>
                        {TABLE_CATEGORY_LABELS[cat]}
                      </SelectOption>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTables.map((table) => (
                    <Card key={table.id} padding="sm" className="card-hover">
                      <div className="bg-gray-50 rounded-lg p-2 mb-3 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              {table.headers.slice(0, 3).map((h) => (
                                <th key={h.key} className="px-2 py-1 text-left font-medium truncate">
                                  {h.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.slice(0, 2).map((row, i) => (
                              <tr key={i} className="border-t border-gray-200">
                                {table.headers.slice(0, 3).map((h) => (
                                  <td key={h.key} className="px-2 py-1 truncate">
                                    {String(row[h.key] ?? '-')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-primary-900 truncate">
                            {table.name}
                          </h4>
                          <p className="text-xs text-primary-500 truncate">
                            {table.description}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-xs"
                          style={{
                            backgroundColor: `${TABLE_CATEGORY_COLORS[table.category]}20`,
                            color: TABLE_CATEGORY_COLORS[table.category],
                          }}
                        >
                          {TABLE_CATEGORY_LABELS[table.category]}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredTables.length === 0 && (
                  <div className="text-center py-12">
                    <Table className="h-12 w-12 text-primary-300 mx-auto mb-3" />
                    <p className="text-primary-500">Aucun tableau trouvé</p>
                  </div>
                )}
              </TabsContent>

              {/* KPIs */}
              <TabsContent value="kpis" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredKPIs.map((kpi) => (
                    <Card key={kpi.id} padding="md" className="card-hover">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-primary-900 truncate">
                            {kpi.name}
                          </h4>
                          <p className="text-xs text-primary-400">{kpi.code}</p>
                        </div>
                      </div>
                      <p className="text-xs text-primary-500 line-clamp-2 mb-2">
                        {kpi.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-primary-400">Unité: {kpi.unit}</span>
                        <Badge variant="secondary">{kpi.axe}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredKPIs.length === 0 && (
                  <div className="text-center py-12">
                    <Gauge className="h-12 w-12 text-primary-300 mx-auto mb-3" />
                    <p className="text-primary-500">Aucun KPI trouvé</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </TabsContent>

        {/* Quick Exports */}
        <TabsContent value="exports" className="space-y-6">
          {/* Enhanced Report Export */}
          <EnhancedReportExport />

          {/* Simple PDF Reports */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Rapports PDF simples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {rapportTypes.map((rapport) => (
                <Card key={rapport.id} className="card-hover" padding="md">
                  <div className={`rounded-lg p-3 w-fit ${rapport.color.split(' ')[0]}`}>
                    <rapport.icon className={`h-6 w-6 ${rapport.color.split(' ')[1]}`} />
                  </div>
                  <h4 className="font-semibold text-primary-900 mt-4">{rapport.title}</h4>
                  <p className="text-sm text-primary-500 mt-1">{rapport.description}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => generatePDF(rapport.id)}
                    disabled={generating === rapport.id}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {generating === rapport.id ? 'Génération...' : 'Télécharger'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          {/* Excel Exports */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Exports Excel</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card padding="md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg p-2 bg-success-100">
                    <FileSpreadsheet className="h-5 w-5 text-success-600" />
                  </div>
                  <h4 className="font-semibold text-primary-900">Actions</h4>
                </div>
                <p className="text-sm text-primary-500 mb-4">
                  Export complet des actions avec filtres
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => exportExcel('actions')}
                  disabled={generating === 'actions'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </Card>

              <Card padding="md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg p-2 bg-warning-100">
                    <FileSpreadsheet className="h-5 w-5 text-warning-600" />
                  </div>
                  <h4 className="font-semibold text-primary-900">Budget</h4>
                </div>
                <p className="text-sm text-primary-500 mb-4">Détail budgétaire par poste</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => exportExcel('budget')}
                  disabled={generating === 'budget'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </Card>

              <Card padding="md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg p-2 bg-error-100">
                    <FileSpreadsheet className="h-5 w-5 text-error-600" />
                  </div>
                  <h4 className="font-semibold text-primary-900">Risques</h4>
                </div>
                <p className="text-sm text-primary-500 mb-4">Registre complet des risques</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => exportExcel('risques')}
                  disabled={generating === 'risques'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* HTML Reports / Partage */}
        <TabsContent value="html_reports" className="space-y-6">
          {/* Header avec bouton de partage */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary-900">Rapports HTML Partagés</h3>
              <p className="text-sm text-primary-500">
                Partagez vos rapports via un lien HTML accessible par email
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedReportForShare(null);
                setShowShareModal(true);
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partager un rapport
            </Button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-info-100">
                  <Link2 className="h-5 w-5 text-info-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-900">
                    {sharedReports.filter(r => r.isActive).length}
                  </p>
                  <p className="text-sm text-primary-500">Liens actifs</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-success-100">
                  <Eye className="h-5 w-5 text-success-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-900">
                    {sharedReports.reduce((sum, r) => sum + r.viewCount, 0)}
                  </p>
                  <p className="text-sm text-primary-500">Vues totales</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-warning-100">
                  <Clock className="h-5 w-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-900">
                    {sharedReports.filter(r => r.expiresAt && new Date(r.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && r.isActive).length}
                  </p>
                  <p className="text-sm text-primary-500">Expirent bientôt</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-primary-100">
                  <Mail className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-900">
                    {sharedReports.reduce((sum, r) => sum + r.recipients.length, 0)}
                  </p>
                  <p className="text-sm text-primary-500">Destinataires</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Liste des rapports partagés */}
          <Card padding="md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-primary-700">Rapport</th>
                    <th className="text-left py-3 px-4 font-medium text-primary-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-primary-700">Lien</th>
                    <th className="text-center py-3 px-4 font-medium text-primary-700">Vues</th>
                    <th className="text-left py-3 px-4 font-medium text-primary-700">Créé le</th>
                    <th className="text-left py-3 px-4 font-medium text-primary-700">Expire le</th>
                    <th className="text-center py-3 px-4 font-medium text-primary-700">Statut</th>
                    <th className="text-right py-3 px-4 font-medium text-primary-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedReports.map((share) => (
                    <tr key={share.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-primary-900">{share.reportTitle}</p>
                          <p className="text-xs text-primary-400">Par {share.sharedBy}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="default">{REPORT_TYPE_LABELS[share.reportType]}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[150px]">
                            {share.shareLink.split('/').pop()}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(share.shareLink);
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium">{share.viewCount}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-primary-600">
                        {new Date(share.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {share.expiresAt ? (
                          <span className={new Date(share.expiresAt) < new Date() ? 'text-error-600' : 'text-primary-600'}>
                            {new Date(share.expiresAt).toLocaleDateString('fr-FR')}
                          </span>
                        ) : (
                          <span className="text-primary-400">Jamais</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {share.isActive ? (
                          <Badge variant="success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="default">Expiré</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => window.open(share.shareLink, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              // Envoyer par email
                              const subject = encodeURIComponent(`Rapport: ${share.reportTitle}`);
                              const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-dessous le lien vers le rapport "${share.reportTitle}":\n\n${share.shareLink}\n\nCordialement`);
                              window.open(`mailto:?subject=${subject}&body=${body}`);
                            }}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          {share.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSharedReports(prev =>
                                  prev.map(r =>
                                    r.id === share.id
                                      ? { ...r, shareLink: r.shareLink.replace(/[^/]+$/, Math.random().toString(36).substring(7)) }
                                      : r
                                  )
                                );
                              }}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-error-600 hover:text-error-700"
                            onClick={() => {
                              setSharedReports(prev => prev.filter(r => r.id !== share.id));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sharedReports.length === 0 && (
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 text-primary-300 mx-auto mb-3" />
                  <h4 className="font-semibold text-primary-900 mb-2">Aucun rapport partagé</h4>
                  <p className="text-primary-500 mb-4">
                    Partagez vos rapports via un lien HTML pour les rendre accessibles par email
                  </p>
                  <Button variant="primary" onClick={() => setShowShareModal(true)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager un rapport
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Info sur le fonctionnement */}
          <Card padding="md" className="bg-info-50 border-info-200">
            <div className="flex gap-4">
              <div className="rounded-lg p-2 bg-info-100 h-fit">
                <Globe className="h-5 w-5 text-info-600" />
              </div>
              <div>
                <h4 className="font-semibold text-info-900 mb-2">Comment ça marche ?</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                    <span className="w-6 h-6 rounded-full bg-info-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                    <span className="text-sm text-info-800">Créez un rapport</span>
                  </div>
                  <div className="text-info-400">→</div>
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                    <span className="w-6 h-6 rounded-full bg-info-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                    <span className="text-sm text-info-800">Cliquez sur <Mail className="inline h-4 w-4" /></span>
                  </div>
                  <div className="text-info-400">→</div>
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                    <span className="w-6 h-6 rounded-full bg-info-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                    <span className="text-sm text-info-800">Email envoyé au destinataire</span>
                  </div>
                  <div className="text-info-400">→</div>
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                    <span className="w-6 h-6 rounded-full bg-info-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                    <span className="text-sm text-info-800">Clic sur "Voir le rapport"</span>
                  </div>
                  <div className="text-info-400">→</div>
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                    <span className="w-6 h-6 rounded-full bg-success-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                    <span className="text-sm text-info-800">Rapport affiché</span>
                  </div>
                </div>
                <p className="text-xs text-info-600">
                  L'email contient un bouton "Voir le rapport" qui ouvre directement la page du rapport dans le navigateur.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Auto Generation */}
        <TabsContent value="auto_generation">
          <ReportGenerator
            onExport={(report: GeneratedReport, format: 'pdf' | 'html' | 'pptx') => {
              const options = DEFAULT_EXPORT_OPTIONS;
              if (format === 'pdf') {
                downloadReportPDF(report, options);
              } else if (format === 'html') {
                openReportHTML(report, options);
              } else if (format === 'pptx') {
                downloadReportPPTX(report, options);
              }
            }}
            onSend={(report: GeneratedReport) => {
              // Créer un partage HTML et rediriger vers l'onglet partage
              const shareId = Math.random().toString(36).substring(2, 10);
              const now = new Date().toISOString();
              const expiresAt = new Date(Date.now() + FIREBASE_TTL.SHARED_REPORTS * 24 * 60 * 60 * 1000).toISOString();
              const newShare: SharedHtmlReport = {
                id: `share-${Date.now()}`,
                reportId: Date.now(),
                reportTitle: report.titre,
                reportType: 'RAPPORT_MENSUEL',
                shareLink: `${window.location.origin}/reports/share/${shareId}`,
                createdAt: now,
                expiresAt,
                viewCount: 0,
                isActive: true,
                sharedBy: 'Utilisateur',
                recipients: report.destinataires.map(d => d.email).filter(e => e),
              };
              setSharedReports(prev => [newShare, ...prev]);

              // Stocker snapshot dans Firebase pour accès externe
              const periodText = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
              storeSharedReportSnapshot(shareId, {
                reportTitle: report.titre,
                reportType: 'RAPPORT_MENSUEL',
                author: 'Utilisateur',
                createdAt: now,
                expiresAt,
                period: periodText,
                snapshot: {
                  actions: (actions || []).map(a => ({ statut: a.statut, axe: a.axe, titre: a.titre, avancement: a.avancement })),
                  jalons: (jalons || []).slice(0, 20).map(j => ({
                    titre: j.titre, statut: j.statut, date_prevue: j.date_prevue, avancement_prealables: j.avancement_prealables,
                  })),
                  risques: (risques || []).map(r => ({ titre: r.titre, categorie: r.categorie, score: r.score, status: r.status })),
                  budget: { prevu: budget?.prevu || 0, engage: budget?.engage || 0, realise: budget?.realise || 0 },
                  kpis: {
                    jalonsAtteints: kpis?.jalonsAtteints || 0, jalonsTotal: kpis?.jalonsTotal || 0,
                    actionsTerminees: kpis?.actionsTerminees || 0, totalActions: kpis?.totalActions || actions?.length || 0,
                    totalRisques: kpis?.totalRisques || risques?.length || 0, budgetTotal: kpis?.budgetTotal || budget?.prevu || 0,
                    budgetConsomme: kpis?.budgetConsomme || budget?.realise || 0, tauxOccupation: kpis?.tauxOccupation || 0,
                    equipeTaille: kpis?.equipeTaille || 0, projectName: kpis?.projectName || '',
                  },
                },
              }).catch(() => { /* Non-blocking */ });

              // Aussi en localStorage (fallback interne)
              localStorage.setItem(`shared-report-${shareId}`, JSON.stringify({
                reportTitle: report.titre, reportType: 'RAPPORT_MENSUEL',
                author: 'Utilisateur', createdAt: now, period: periodText,
              }));

              setViewMode('html_reports');
            }}
          />
        </TabsContent>

        {/* Weekly Report */}
        <TabsContent value="weekly_report">
          <WeeklyReport />
        </TabsContent>

        {/* Monthly Report */}
        <TabsContent value="monthly_report">
          <MonthlyReport />
        </TabsContent>

        {/* Rappel des Actions */}
        <TabsContent value="rappel_actions">
          <RappelActionsReport />
        </TabsContent>

        {/* EXCO */}
        <TabsContent value="exco">
          <div className="space-y-6">
            {/* Template selector */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <span className="text-sm font-medium text-primary-700">Type de présentation:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setExcoTemplate('launch')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    excoTemplate === 'launch'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white border border-primary-200 text-primary-700 hover:border-primary-400'
                  }`}
                >
                  <Presentation className="h-4 w-4" />
                  <div className="text-left">
                    <div>EXCO Lancement</div>
                    <div className="text-xs opacity-75">Validation Stratégique | 9 slides</div>
                  </div>
                </button>
                <button
                  onClick={() => setExcoTemplate('monthly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    excoTemplate === 'monthly'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white border border-primary-200 text-primary-700 hover:border-primary-400'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <div className="text-left">
                    <div>EXCO Mensuel</div>
                    <div className="text-xs opacity-75">~1h35 | 20 slides</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Toolbar EXCO Mensuel */}
            {excoTemplate === 'monthly' && (
              <div className="flex flex-wrap items-center gap-2 py-3 px-4 bg-white rounded-lg border border-primary-200 shadow-sm">
                {/* Back to live / saved indicator */}
                {selectedExcoId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExcoId(null)}
                    className="gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Retour aux données live
                  </Button>
                ) : (
                  <>
                    {/* Date picker */}
                    <div className="flex items-center gap-1.5 mr-2">
                      <Calendar className="h-4 w-4 text-primary-400" />
                      <input
                        type="date"
                        value={presentationDate}
                        onChange={(e) => setPresentationDate(e.target.value)}
                        className="text-xs px-2 py-1.5 border border-primary-200 rounded-md bg-white text-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                    </div>
                  </>
                )}

                <div className="h-6 w-px bg-primary-200 mx-1" />

                {/* Action buttons */}
                <Button variant="outline" size="sm" onClick={handleOpenHtmlPreview} className="gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => { const html = generateHtml(); if (!html) return; const blob = new Blob([html], { type: 'text/html' }); window.open(URL.createObjectURL(blob), '_blank'); }} className="gap-1.5 text-xs">
                  <Globe className="h-3.5 w-3.5" /> Voir HTML
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadHtml} className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Télécharger HTML
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs">
                  <Printer className="h-3.5 w-3.5" /> Imprimer
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPptx} className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Exporter PPTX
                </Button>

                <div className="h-6 w-px bg-primary-200 mx-1" />

                {/* Save to Journal button (live mode only) */}
                {!selectedExcoId && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={savingExco}
                    onClick={async () => {
                      const data = v5Ref.current?.getData();
                      if (!data) return;
                      setSavingExco(true);
                      try {
                        const siteName = currentSite?.nom || PROJET_CONFIG.nom;
                        const titre = `EXCO Mensuel — ${data.moisCourant}`;
                        const excoRecord = mapV5DataToExco(data, titre, siteName);
                        await createExco(excoRecord);
                        alert('EXCO sauvegardé dans le Journal !');
                      } catch (err) {
                        logger.error('Erreur sauvegarde EXCO:', err);
                        alert('Erreur lors de la sauvegarde');
                      } finally {
                        setSavingExco(false);
                      }
                    }}
                    className="gap-1.5 text-xs"
                  >
                    <Save className="h-3.5 w-3.5" /> {savingExco ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                )}

                <Button size="sm" onClick={() => setShowSendModal(true)} className="gap-1.5 text-xs bg-primary-600 text-white hover:bg-primary-700">
                  <Share2 className="h-3.5 w-3.5" /> Envoyer
                </Button>
              </div>
            )}

            {/* Selected template */}
            {excoTemplate === 'launch' ? <ExcoLancement /> : <ExcoMensuelV5 ref={v5Ref} savedExcoId={selectedExcoId} />}

            {/* Send Report Modal */}
            <SendReportModal
              isOpen={showSendModal}
              onClose={() => setShowSendModal(false)}
              presentationDate={presentationDate}
              generateHtml={generateHtml}
              getData={() => v5Ref.current?.getData()}
              reportTitle="EXCO Mensuel"
            />
          </div>
        </TabsContent>

        {/* Import IA */}
        <TabsContent value="import_ia">
          <ImportIA />
        </TabsContent>

        {/* Journal */}
        <TabsContent value="journal">
          <Journal
            onOpenExco={(id) => {
              setSelectedExcoId(id);
              setExcoTemplate('monthly');
              setViewMode('exco');
            }}
          />
        </TabsContent>
      </Tabs>

      {/* New Report Modal */}
      <Dialog open={showNewReportModal} onOpenChange={setShowNewReportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau rapport</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Titre du rapport
              </label>
              <Input
                placeholder="Ex: Rapport mensuel - Janvier 2025"
                value={newReportData.title}
                onChange={(e) =>
                  setNewReportData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Type de rapport
              </label>
              <Select
                value={newReportData.type}
                onChange={(e) =>
                  setNewReportData((prev) => ({
                    ...prev,
                    type: e.target.value as ReportType,
                  }))
                }
              >
                {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                  <SelectOption key={value} value={value}>
                    {label}
                  </SelectOption>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Modèles (sélection multiple)
              </label>
              <p className="text-xs text-primary-500 mb-3">
                Sélectionnez un ou plusieurs modèles à combiner dans votre rapport
              </p>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {/* Option document vierge */}
                <label
                  className={`flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-primary-50 transition-colors ${
                    newReportData.templateIds.length === 0 ? 'bg-primary-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={newReportData.templateIds.length === 0}
                    onChange={() => setNewReportData((prev) => ({ ...prev, templateIds: [] }))}
                    className="h-4 w-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-primary-900">Document vierge</span>
                    <p className="text-xs text-primary-500">Commencer avec un rapport vide</p>
                  </div>
                </label>

                {/* Templates disponibles */}
                {REPORT_TEMPLATES.map((template) => {
                  const isSelected = newReportData.templateIds.includes(template.id);
                  return (
                    <label
                      key={template.id}
                      className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-primary-50 transition-colors ${
                        isSelected ? 'bg-primary-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          setNewReportData((prev) => ({
                            ...prev,
                            templateIds: e.target.checked
                              ? [...prev.templateIds, template.id]
                              : prev.templateIds.filter((id) => id !== template.id),
                          }));
                        }}
                        className="h-4 w-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-primary-900">{template.name}</span>
                        {template.description && (
                          <p className="text-xs text-primary-500 line-clamp-1">{template.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {template.sections?.length || 0} sections
                      </Badge>
                    </label>
                  );
                })}
              </div>

              {/* Résumé de la sélection */}
              {newReportData.templateIds.length > 0 && (
                <div className="mt-3 p-3 bg-success-50 rounded-lg border border-success-200">
                  <div className="flex items-center gap-2 text-success-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {newReportData.templateIds.length} modèle{newReportData.templateIds.length > 1 ? 's' : ''} sélectionné{newReportData.templateIds.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-success-600 mt-1">
                    Les sections seront combinées dans l'ordre de sélection
                  </p>
                </div>
              )}
            </div>

            {/* Période du rapport */}
            <ReportPeriodSelector
              value={newReportData.period}
              onChange={(period) => setNewReportData((prev) => ({ ...prev, period }))}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewReportModal(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateReport}
              disabled={!newReportData.title.trim()}
            >
              Créer le rapport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le rapport ?</DialogTitle>
          </DialogHeader>
          <p className="text-primary-600 py-4">
            Cette action est irréversible. Le rapport et toutes ses versions seront
            définitivement supprimés.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              className="bg-error-600 hover:bg-error-700"
              onClick={() => deleteConfirm && handleDeleteReport(deleteConfirm)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share HTML Report Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Partager un rapport en HTML
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Sélection du rapport */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Sélectionner un rapport
              </label>
              <Select
                value={selectedReportForShare?.toString() || ''}
                onChange={(e) => setSelectedReportForShare(e.target.value ? Number(e.target.value) : null)}
              >
                <SelectOption value="">Choisir un rapport...</SelectOption>
                {reports?.map((report) => (
                  <SelectOption key={report.id} value={report.id!.toString()}>
                    {report.title}
                  </SelectOption>
                ))}
              </Select>
            </div>

            {/* Période du rapport */}
            <ReportPeriodSelector
              value={sharePeriod}
              onChange={setSharePeriod}
            />

            {/* Section Commentaires */}
            {selectedReportForShare && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowCommentsSection(!showCommentsSection)}
                >
                  <span className="flex items-center gap-2 font-medium text-primary-700">
                    <MessageSquare className="h-4 w-4" />
                    Ajouter des commentaires éditoriaux
                  </span>
                  {showCommentsSection ? (
                    <ChevronUp className="h-4 w-4 text-primary-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-primary-500" />
                  )}
                </button>

                {showCommentsSection && (
                  <div className="p-4 space-y-4 border-t">
                    {/* Synthèse Executive */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-primary-700 mb-2">
                        <FileText className="h-4 w-4 text-primary-500" />
                        Synthèse Executive
                      </label>
                      <Textarea
                        placeholder="Rédigez une introduction narrative pour contextualiser le rapport... Vous pouvez utiliser **texte** pour mettre en gras."
                        value={reportComments.executiveSummary}
                        onChange={(e) =>
                          setReportComments((prev) => ({
                            ...prev,
                            executiveSummary: e.target.value,
                          }))
                        }
                        rows={4}
                        className="text-sm"
                      />
                      <p className="text-xs text-primary-400 mt-1">
                        Cette synthèse apparaîtra en haut du rapport pour donner le contexte général.
                      </p>
                    </div>

                    {/* Commentaire Avancement */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-primary-700 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary-500" />
                        Commentaire sur l'Avancement
                      </label>
                      <Textarea
                        placeholder="Analysez les progrès réalisés, les axes qui performent bien ou nécessitent attention..."
                        value={reportComments.avancement}
                        onChange={(e) =>
                          setReportComments((prev) => ({
                            ...prev,
                            avancement: e.target.value,
                          }))
                        }
                        rows={3}
                        className="text-sm"
                      />
                    </div>

                    {/* Commentaire Actions */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-primary-700 mb-2">
                        <Target className="h-4 w-4 text-primary-500" />
                        Commentaire sur les Actions
                      </label>
                      <Textarea
                        placeholder="Détaillez l'état des actions, les blocages éventuels et les mesures prises..."
                        value={reportComments.actions}
                        onChange={(e) =>
                          setReportComments((prev) => ({
                            ...prev,
                            actions: e.target.value,
                          }))
                        }
                        rows={3}
                        className="text-sm"
                      />
                    </div>

                    {/* Commentaire Risques */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-primary-700 mb-2">
                        <Shield className="h-4 w-4 text-primary-500" />
                        Commentaire sur les Risques
                      </label>
                      <Textarea
                        placeholder="Expliquez les risques majeurs, leur évolution et les plans de mitigation..."
                        value={reportComments.risques}
                        onChange={(e) =>
                          setReportComments((prev) => ({
                            ...prev,
                            risques: e.target.value,
                          }))
                        }
                        rows={3}
                        className="text-sm"
                      />
                    </div>

                    {/* Commentaire Budget */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-primary-700 mb-2">
                        <DollarSign className="h-4 w-4 text-primary-500" />
                        Commentaire sur le Budget
                      </label>
                      <Textarea
                        placeholder="Commentez l'exécution budgétaire, les écarts et les prévisions..."
                        value={reportComments.budget}
                        onChange={(e) =>
                          setReportComments((prev) => ({
                            ...prev,
                            budget: e.target.value,
                          }))
                        }
                        rows={3}
                        className="text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-info-50 rounded-lg text-sm text-info-700">
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span>
                        Les commentaires apparaîtront sous chaque section correspondante dans le rapport HTML partagé.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Destinataires */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Destinataires (emails séparés par des virgules)
              </label>
              <Input
                placeholder="email1@example.com, email2@example.com"
                value={shareSettings.recipients}
                onChange={(e) =>
                  setShareSettings((prev) => ({ ...prev, recipients: e.target.value }))
                }
              />
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Expiration du lien
              </label>
              <Select
                value={shareSettings.expirationDays.toString()}
                onChange={(e) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    expirationDays: Number(e.target.value),
                  }))
                }
              >
                <SelectOption value="7">7 jours</SelectOption>
                <SelectOption value="14">14 jours</SelectOption>
                <SelectOption value="30">30 jours</SelectOption>
                <SelectOption value="90">90 jours</SelectOption>
                <SelectOption value="0">Jamais</SelectOption>
              </Select>
            </div>

            {/* Notification email */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="notifyByEmail"
                checked={shareSettings.notifyByEmail}
                onChange={(e) =>
                  setShareSettings((prev) => ({ ...prev, notifyByEmail: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="notifyByEmail" className="text-sm text-primary-700">
                Envoyer une notification par email aux destinataires
              </label>
            </div>

            {/* Aperçu du lien */}
            {selectedReportForShare && (
              <div className="p-3 bg-info-50 rounded-lg border border-info-200">
                <p className="text-sm text-info-700">
                  <strong>Aperçu du lien :</strong>
                </p>
                <code className="text-xs text-info-600 block mt-1 break-all">
                  {window.location.origin}/reports/share/{Math.random().toString(36).substring(2, 10)}
                </code>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowShareModal(false);
              setShowCommentsSection(false);
              setReportComments({
                executiveSummary: '',
                avancement: '',
                actions: '',
                risques: '',
                budget: '',
              });
            }}>
              Annuler
            </Button>
            <Button
              variant="primary"
              disabled={!selectedReportForShare}
              onClick={() => {
                if (selectedReportForShare) {
                  const report = reports?.find((r) => r.id === selectedReportForShare);
                  if (report) {
                    const now = new Date().toISOString();
                    const comments: ReportComment[] = [];

                    if (reportComments.avancement.trim()) {
                      comments.push({
                        section: 'avancement',
                        content: reportComments.avancement,
                        author: 'Utilisateur',
                        date: now,
                      });
                    }
                    if (reportComments.actions.trim()) {
                      comments.push({
                        section: 'actions',
                        content: reportComments.actions,
                        author: 'Utilisateur',
                        date: now,
                      });
                    }
                    if (reportComments.risques.trim()) {
                      comments.push({
                        section: 'risques',
                        content: reportComments.risques,
                        author: 'Utilisateur',
                        date: now,
                      });
                    }
                    if (reportComments.budget.trim()) {
                      comments.push({
                        section: 'budget',
                        content: reportComments.budget,
                        author: 'Utilisateur',
                        date: now,
                      });
                    }

                    const shareId = Math.random().toString(36).substring(2, 10);
                    const newShare: SharedHtmlReport = {
                      id: `share-${Date.now()}`,
                      reportId: report.id!,
                      reportTitle: report.title,
                      reportType: report.type,
                      shareLink: `${window.location.origin}/reports/share/${shareId}`,
                      createdAt: now,
                      expiresAt:
                        shareSettings.expirationDays > 0
                          ? new Date(Date.now() + shareSettings.expirationDays * 24 * 60 * 60 * 1000).toISOString()
                          : null,
                      viewCount: 0,
                      isActive: true,
                      sharedBy: 'Utilisateur',
                      recipients: shareSettings.recipients
                        .split(',')
                        .map((e) => e.trim())
                        .filter((e) => e),
                      executiveSummary: reportComments.executiveSummary.trim() || undefined,
                      comments: comments.length > 0 ? comments : undefined,
                    };

                    // Stocker les commentaires dans localStorage pour la page partagée (fallback interne)
                    const periodText = sharePeriod?.displayText || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    const shareData = {
                      reportTitle: report.title,
                      reportType: report.type,
                      author: 'Utilisateur',
                      createdAt: now,
                      period: periodText,
                      executiveSummary: reportComments.executiveSummary.trim() || undefined,
                      comments: comments,
                    };
                    localStorage.setItem(`shared-report-${shareId}`, JSON.stringify(shareData));

                    // Stocker le snapshot complet dans Firebase pour accès externe
                    const snapshotData = {
                      reportTitle: report.title,
                      reportType: report.type,
                      author: 'Utilisateur',
                      createdAt: now,
                      expiresAt: shareSettings.expirationDays > 0
                        ? new Date(Date.now() + shareSettings.expirationDays * 24 * 60 * 60 * 1000).toISOString()
                        : null,
                      period: periodText,
                      executiveSummary: reportComments.executiveSummary.trim() || undefined,
                      comments: comments.length > 0 ? comments : undefined,
                      snapshot: {
                        actions: (actions || []).map(a => ({
                          statut: a.statut,
                          axe: a.axe,
                          titre: a.titre,
                        })),
                        jalons: (jalons || []).slice(0, 20).map(j => ({
                          titre: j.titre,
                          statut: j.statut,
                          date_prevue: j.date_prevue,
                          avancement_prealables: j.avancement_prealables,
                        })),
                        risques: (risques || []).map(r => ({
                          titre: r.titre,
                          categorie: r.categorie,
                          score: r.score,
                          status: r.status,
                        })),
                        budget: {
                          prevu: budget?.prevu || 0,
                          engage: budget?.engage || 0,
                          realise: budget?.realise || 0,
                        },
                        kpis: {
                          jalonsAtteints: kpis?.jalonsAtteints || 0,
                          jalonsTotal: kpis?.jalonsTotal || 0,
                          actionsTerminees: kpis?.actionsTerminees || 0,
                          totalActions: kpis?.totalActions || actions?.length || 0,
                          totalRisques: kpis?.totalRisques || risques?.length || 0,
                          budgetTotal: kpis?.budgetTotal || budget?.prevu || 0,
                          budgetConsomme: kpis?.budgetConsomme || budget?.realise || 0,
                          tauxOccupation: kpis?.tauxOccupation || 0,
                          equipeTaille: kpis?.equipeTaille || 0,
                          projectName: kpis?.projectName || '',
                        },
                      },
                    };
                    storeSharedReportSnapshot(shareId, snapshotData).catch(() => {
                      // Non-blocking: le localStorage reste en fallback
                    });

                    setSharedReports((prev) => [newShare, ...prev]);

                    // Envoyer les emails de notification si activé
                    if (shareSettings.notifyByEmail && shareSettings.recipients.trim()) {
                      const recipients = shareSettings.recipients
                        .split(',')
                        .map((e) => e.trim())
                        .filter((e) => e);

                      // Calculer les stats
                      const stats = {
                        totalActions: actions?.length || 0,
                        totalJalons: kpis?.jalonsByStatus?.total || 0,
                        totalRisques: risques?.length || 0,
                        avancementGlobal: Math.round(kpis?.progress?.planGlobal || 0),
                      };

                      // Envoyer un email à chaque destinataire
                      for (const recipient of recipients) {
                        const emailParams = {
                          recipientEmail: recipient,
                          recipientName: recipient.split('@')[0],
                          senderName: presentateurNom,
                          reportLink: newShare.shareLink,
                          reportPeriod: sharePeriod?.displayText || 'Période en cours',
                          stats,
                        };

                        // Essayer d'envoyer via le service email (EmailJS si configuré)
                        sendReportShareEmail(emailParams).then((result) => {
                          if (!result.success) {
                            // Fallback: ouvrir le client email local
                            openEmailClientForReport(emailParams);
                          }
                        });
                      }
                    }

                    setShowShareModal(false);
                    setSelectedReportForShare(null);
                    setShareSettings({ expirationDays: FIREBASE_TTL.SHARED_REPORTS, recipients: '', notifyByEmail: true });
                    setShowCommentsSection(false);
                    setReportComments({
                      executiveSummary: '',
                      avancement: '',
                      actions: '',
                      risques: '',
                      budget: '',
                    });
                    // Passer à l'onglet des rapports HTML
                    setViewMode('html_reports');
                  }
                }
              }}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Générer le lien
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
