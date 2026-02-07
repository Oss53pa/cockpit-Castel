import { useState } from 'react';
import {
  FileText,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Target,
  DollarSign,
  AlertTriangle,
  Users,
  TrendingUp,
  Loader2,
  Bell,
  History,
  PieChart,
  Package,
  GitBranch,
} from 'lucide-react';
import type { jsPDF } from 'jspdf';

// Type for jsPDF with autotable plugin
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

import { Card, Button, Badge, Label, Input } from '@/components/ui';
import { ReportPeriodSelector, type ReportPeriod } from './ReportPeriodSelector';
import {
  useDashboardKPIs,
  useActions,
  useJalons,
  useBudget,
  useBudgetSynthese,
  useBudgetParCategorie,
  useBudgetParAxe,
  useEVMIndicators,
  useRisques,
  useUsers,
  useTeams,
  useAlertes,
  useHistorique,
  useSync,
  useCurrentSite,
} from '@/hooks';
import {
  AXE_LABELS,
  ACTION_STATUS_LABELS,
  PRIORITE_LABELS,
  JALON_STATUS_LABELS,
  getRisqueStatusLabel,
  RISQUE_CATEGORY_LABELS,
  BUDGET_CATEGORY_LABELS,
  ALERTE_TYPE_LABELS,
  CRITICITE_LABELS,
  STATUT_LIVRABLE_LABELS,
} from '@/types';
import {
  COLORS,
  drawProgressBar as _drawProgressBar,
  drawProgressList,
  drawKPIText as _drawKPIText,
  drawKPIRow,
  drawInfoBox,
  drawSeparator,
  drawSubtitle,
  drawStatsTable,
  drawSectionHeader,
  drawRiskMatrix,
  drawBarChart,
} from '@/services/pdfChartService';
import {
  analyzeActions,
  analyzeJalons,
  analyzeBudget,
  analyzeRisques,
  analyzeSync,
  analyzeAlertes,
  generateExecutiveSummary,
  generateSectionComment,
} from '@/services/reportAnalysisService';
import { PROJET_CONFIG } from '@/data/constants';
// Données du site récupérées via useCurrentSite()

interface ReportSection {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const REPORT_SECTIONS: ReportSection[] = [
  {
    id: 'copil',
    label: 'Dashboard COPIL',
    description: 'Meteo projet, top 5 risques, jalons J-30, budget, alertes, decisions',
    icon: Users,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'summary',
    label: 'Synthese executive',
    description: 'Resume visuel, KPIs, alertes prioritaires et recommandations',
    icon: TrendingUp,
    color: 'bg-primary-100 text-primary-600',
  },
  {
    id: 'actions',
    label: 'Actions',
    description: 'Tableau de bord actions, graphiques d\'avancement et analyse',
    icon: CheckSquare,
    color: 'bg-success-100 text-success-600',
  },
  {
    id: 'jalons',
    label: 'Jalons',
    description: 'Timeline jalons, taux de reussite et points d\'attention',
    icon: Target,
    color: 'bg-info-100 text-info-600',
  },
  {
    id: 'synchronisation',
    label: 'Synchronisation',
    description: 'Equilibre Projet/Mobilisation, jauges comparatives et ecarts',
    icon: GitBranch,
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    id: 'budget',
    label: 'Budget & EVM',
    description: 'Courbes EVM, indicateurs financiers et projections',
    icon: DollarSign,
    color: 'bg-warning-100 text-warning-600',
  },
  {
    id: 'budget_details',
    label: 'Budget detaille',
    description: 'Ventilation par categorie et axe avec graphiques',
    icon: PieChart,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'risques',
    label: 'Risques',
    description: 'Matrice des risques, top risques et plans de mitigation',
    icon: AlertTriangle,
    color: 'bg-error-100 text-error-600',
  },
  {
    id: 'equipe',
    label: 'Equipe',
    description: 'Composition, charge et repartition',
    icon: Users,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'alertes',
    label: 'Alertes',
    description: 'Alertes actives, historique et tendances',
    icon: Bell,
    color: 'bg-red-100 text-red-600',
  },
  {
    id: 'historique',
    label: 'Journal d\'activite',
    description: 'Historique des modifications et audit trail',
    icon: History,
    color: 'bg-slate-100 text-slate-600',
  },
  {
    id: 'livrables',
    label: 'Livrables',
    description: 'Tous les livrables avec statut et validation',
    icon: Package,
    color: 'bg-teal-100 text-teal-600',
  },
];

export function EnhancedReportExport() {
  // All data hooks
  const _kpis = useDashboardKPIs();
  const actions = useActions();
  const jalons = useJalons();
  const budgetItems = useBudget();
  const budgetSynthese = useBudgetSynthese();
  const budgetParCategorie = useBudgetParCategorie();
  const budgetParAxe = useBudgetParAxe();
  const evmIndicators = useEVMIndicators();
  const risques = useRisques();
  const users = useUsers();
  const teams = useTeams();
  const alertes = useAlertes();
  const historique = useHistorique(100);
  const syncData = useSync(1, 'cosmos-angre');
  const currentSite = useCurrentSite();

  // Nom du site depuis la DB
  const siteName = currentSite?.nom || PROJET_CONFIG.nom;

  const [selectedSections, setSelectedSections] = useState<string[]>([
    'copil',
    'summary',
    'actions',
    'jalons',
    'synchronisation',
    'budget',
    'risques',
  ]);
  const [reportTitle, setReportTitle] = useState(`Rapport de projet ${siteName}`);
  const [generating, setGenerating] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod | null>(() => {
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

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const selectAll = () => {
    setSelectedSections(REPORT_SECTIONS.map((s) => s.id));
  };

  const deselectAll = () => {
    setSelectedSections([]);
  };

  // Extract all livrables from actions and jalons
  const getAllLivrables = () => {
    const livrables: Array<{
      source: string;
      sourceId: number | undefined;
      sourceTitre: string;
      livrable: {
        nom: string;
        description: string | null;
        statut: string;
        obligatoire: boolean;
        date_prevue: string | null;
        date_livraison: string | null;
      };
    }> = [];

    actions.forEach((action) => {
      if (action.livrables && action.livrables.length > 0) {
        action.livrables.forEach((l) => {
          livrables.push({
            source: 'Action',
            sourceId: action.id,
            sourceTitre: action.titre,
            livrable: l,
          });
        });
      }
    });

    jalons.forEach((jalon) => {
      if (jalon.livrables && jalon.livrables.length > 0) {
        jalon.livrables.forEach((l) => {
          livrables.push({
            source: 'Jalon',
            sourceId: jalon.id,
            sourceTitre: jalon.titre,
            livrable: l,
          });
        });
      }
    });

    return livrables;
  };

  // ============================================================================
  // GENERATION PDF PROFESSIONNELLE ET SOBRE
  // ============================================================================
  const generateCompletePDF = async () => {
    if (selectedSections.length === 0) {
      alert('Veuillez selectionner au moins une section');
      return;
    }

    setGenerating('pdf');

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = 20;

      // Helper function for page breaks
      const checkPageBreak = (neededSpace: number): boolean => {
        if (currentY + neededSpace > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
          return true;
        }
        return false;
      };

      // Generate analyses
      const actionsAnalysis = analyzeActions(actions);
      const jalonsAnalysis = analyzeJalons(jalons);
      const budgetAnalysis = analyzeBudget(budgetSynthese, evmIndicators);
      const risquesAnalysis = analyzeRisques(risques);
      const syncAnalysis = analyzeSync(
        syncData.syncStatus,
        syncData.projectCategories,
        syncData.mobilizationCategories,
        syncData.alerts,
        syncData.actions
      );
      const alertesAnalysis = analyzeAlertes(alertes);

      // Calculate key metrics
      const actionsCompleted = actions.filter(a => a.statut === 'termine').length;
      const actionsTotal = actions.filter(a => a.statut !== 'annule').length;
      const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
      const criticalRisks = risques.filter(r => r.score >= 12 && r.status !== 'closed').length;

      const executiveSummary = generateExecutiveSummary(
        {
          actions: actionsAnalysis,
          jalons: jalonsAnalysis,
          budget: budgetAnalysis,
          risques: risquesAnalysis,
          sync: syncAnalysis,
          alertes: alertesAnalysis,
        },
        {
          projectProgress: syncData.syncStatus?.projectProgress || 0,
          mobilizationProgress: syncData.syncStatus?.mobilizationProgress || 0,
          budgetRealization: budgetSynthese.tauxRealisation,
          jalonsAtteints,
          jalonsTotal: jalons.length,
          actionsCompleted,
          actionsTotal,
          criticalRisks,
          spi: evmIndicators.SPI,
          cpi: evmIndicators.CPI,
        }
      );

      const today = new Date();
      const dateStr = today.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // ==================== PAGE DE GARDE ====================
      // En-tete sobre
      doc.setFillColor(...COLORS.primary);
      doc.rect(0, 0, pageWidth, 50, 'F');

      // Titre
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(siteName, pageWidth / 2, 25, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Cockpit de Pilotage de Projet', pageWidth / 2, 38, { align: 'center' });

      // Titre du rapport
      doc.setTextColor(...COLORS.text);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(reportTitle.toUpperCase(), pageWidth / 2, 70, { align: 'center' });

      // Periode
      if (reportPeriod) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.secondary);
        doc.text(reportPeriod.displayText, pageWidth / 2, 82, { align: 'center' });
      }

      // Date de generation
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textLight);
      doc.text(`Document genere le ${dateStr}`, pageWidth / 2, 95, { align: 'center' });

      // Statut global
      currentY = 115;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text('STATUT GLOBAL DU PROJET', margin, currentY);
      currentY += 8;

      const statusColor = executiveSummary.overallStatus === 'good' ? COLORS.success :
        executiveSummary.overallStatus === 'warning' ? COLORS.warning : COLORS.error;
      const statusText = executiveSummary.overallStatus === 'good' ? 'Sous controle' :
        executiveSummary.overallStatus === 'warning' ? 'Vigilance requise' : 'Attention critique';

      doc.setFillColor(...statusColor);
      doc.circle(margin + 3, currentY + 2, 3, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...statusColor);
      doc.text(statusText, margin + 10, currentY + 4);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.secondary);
      const statusLines = doc.splitTextToSize(executiveSummary.statusMessage, contentWidth - 10);
      doc.text(statusLines, margin + 10, currentY + 12);
      currentY += 12 + statusLines.length * 4 + 10;

      // KPIs principaux
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text('INDICATEURS CLES', margin, currentY);
      currentY += 8;

      // Ligne de KPIs
      currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
        { label: 'Avancement Projet', value: `${Math.round(syncData.syncStatus?.projectProgress || 0)}%`, status: (syncData.syncStatus?.projectProgress || 0) >= 50 ? 'good' : 'warning' },
        { label: 'Avancement Mobilisation', value: `${Math.round(syncData.syncStatus?.mobilizationProgress || 0)}%`, status: (syncData.syncStatus?.mobilizationProgress || 0) >= 50 ? 'good' : 'warning' },
        { label: 'SPI', value: evmIndicators.SPI.toFixed(2), status: evmIndicators.SPI >= 1 ? 'good' : evmIndicators.SPI >= 0.9 ? 'warning' : 'bad' },
        { label: 'CPI', value: evmIndicators.CPI.toFixed(2), status: evmIndicators.CPI >= 1 ? 'good' : evmIndicators.CPI >= 0.9 ? 'warning' : 'bad' },
      ]);

      currentY += 5;

      currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
        { label: 'Actions terminees', value: `${actionsCompleted}/${actionsTotal}`, status: actionsCompleted >= actionsTotal * 0.7 ? 'good' : 'warning' },
        { label: 'Jalons atteints', value: `${jalonsAtteints}/${jalons.length}`, status: jalonsAtteints >= jalons.length * 0.7 ? 'good' : 'warning' },
        { label: 'Risques critiques', value: criticalRisks.toString(), status: criticalRisks === 0 ? 'good' : 'bad' },
        { label: 'Budget realise', value: `${Math.round(budgetSynthese.tauxRealisation)}%`, status: budgetSynthese.ecartRealisation >= 0 ? 'good' : 'bad' },
      ]);

      currentY += 10;

      // Resume des donnees
      currentY = drawSeparator(doc, margin, currentY, contentWidth);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textLight);
      const statsLine = `Ce rapport contient: ${actions.length} actions | ${jalons.length} jalons | ${risques.length} risques | ${budgetItems.length} postes budget | ${syncData.categories?.length || 0} categories sync`;
      doc.text(statsLine, pageWidth / 2, currentY, { align: 'center' });

      // Pied de page
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textLight);
      doc.text(`Document confidentiel - ${siteName}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

      // ==================== DASHBOARD COPIL ====================
      if (selectedSections.includes('copil')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Dashboard COPIL', pageWidth);

        // Météo projet
        currentY = drawSubtitle(doc, margin, currentY, 'Meteo Projet');

        const meteoGlobal = criticalRisks > 2 ? 'Critique' : criticalRisks > 0 ? 'Vigilance' : 'Sous controle';
        const _meteoColor = criticalRisks > 2 ? COLORS.error : criticalRisks > 0 ? COLORS.warning : COLORS.success;

        currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
          { label: 'Statut global', value: meteoGlobal, status: criticalRisks > 2 ? 'bad' : criticalRisks > 0 ? 'warning' : 'good' },
          { label: 'Avancement Projet', value: `${Math.round(syncData.syncStatus?.projectProgress || 0)}%`, status: (syncData.syncStatus?.projectProgress || 0) >= 50 ? 'good' : 'warning' },
          { label: 'Avancement Mobilisation', value: `${Math.round(syncData.syncStatus?.mobilizationProgress || 0)}%`, status: (syncData.syncStatus?.mobilizationProgress || 0) >= 50 ? 'good' : 'warning' },
          { label: 'Risques critiques', value: criticalRisks.toString(), status: criticalRisks === 0 ? 'good' : 'bad' },
        ]);

        currentY += 5;

        // Top 5 Risques
        checkPageBreak(60);
        currentY = drawSubtitle(doc, margin, currentY, 'Top 5 Risques Actifs');

        const top5Risques = risques
          .filter(r => r.status !== 'closed')
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        if (top5Risques.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [['#', 'Titre', 'Categorie', 'Score', 'Proprietaire']],
            body: top5Risques.map((r, i) => [
              (i + 1).toString(),
              r.titre.substring(0, 35) + (r.titre.length > 35 ? '...' : ''),
              r.categorie,
              r.score.toString(),
              r.proprietaire || '-',
            ]),
            theme: 'plain',
            headStyles: { fillColor: COLORS.error, textColor: [255, 255, 255], fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: COLORS.bgLight },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 3) {
                const score = parseInt(data.cell.raw as string);
                if (score >= 12) {
                  data.cell.styles.fillColor = [254, 226, 226];
                  data.cell.styles.fontStyle = 'bold';
                } else if (score >= 8) {
                  data.cell.styles.fillColor = [254, 243, 199];
                }
              }
            },
          });
          currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8;
        } else {
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.textLight);
          doc.text('Aucun risque actif', margin, currentY);
          currentY += 8;
        }

        // Jalons J-30
        checkPageBreak(60);
        currentY = drawSubtitle(doc, margin, currentY, 'Jalons J-30');

        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const jalonsJ30 = jalons
          .filter(j => {
            if (!j.date_prevue || j.statut === 'atteint') return false;
            const date = new Date(j.date_prevue);
            return date >= now && date <= in30Days;
          })
          .sort((a, b) => new Date(a.date_prevue!).getTime() - new Date(b.date_prevue!).getTime())
          .slice(0, 6);

        if (jalonsJ30.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [['Jalon', 'Date', 'J-X', 'Statut', 'Axe']],
            body: jalonsJ30.map(j => {
              const days = Math.ceil((new Date(j.date_prevue!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return [
                j.titre.substring(0, 30) + (j.titre.length > 30 ? '...' : ''),
                new Date(j.date_prevue!).toLocaleDateString('fr-FR'),
                `J-${days}`,
                JALON_STATUS_LABELS[j.statut] || j.statut,
                AXE_LABELS[j.axe] || j.axe,
              ];
            }),
            theme: 'plain',
            headStyles: { fillColor: COLORS.info, textColor: [255, 255, 255], fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: COLORS.bgLight },
          });
          currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8;
        } else {
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.textLight);
          doc.text('Aucun jalon dans les 30 prochains jours', margin, currentY);
          currentY += 8;
        }

        // Budget
        checkPageBreak(40);
        currentY = drawSubtitle(doc, margin, currentY, 'Budget: Consomme vs Prevu');

        const ecartBudget = budgetSynthese.prevu - budgetSynthese.realise;
        currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
          { label: 'Budget prevu', value: `${(budgetSynthese.prevu / 1000000).toFixed(1)}M`, status: 'neutral' },
          { label: 'Budget engage', value: `${(budgetSynthese.engage / 1000000).toFixed(1)}M`, status: budgetSynthese.tauxEngagement > 100 ? 'warning' : 'neutral' },
          { label: 'Budget realise', value: `${(budgetSynthese.realise / 1000000).toFixed(1)}M`, status: budgetSynthese.tauxRealisation > 100 ? 'bad' : 'good' },
          { label: 'Ecart', value: `${ecartBudget >= 0 ? '+' : ''}${(ecartBudget / 1000000).toFixed(1)}M`, status: ecartBudget >= 0 ? 'good' : 'bad' },
        ]);

        currentY += 5;

        // Alertes en cours
        checkPageBreak(50);
        currentY = drawSubtitle(doc, margin, currentY, 'Alertes en cours');

        const alertesActives = alertes.filter(a => !a.traitee).slice(0, 5);
        if (alertesActives.length > 0) {
          alertesActives.forEach(alerte => {
            const alertType = alerte.criticite === 'critical' ? 'error' : alerte.criticite === 'high' ? 'warning' : 'info';
            currentY = drawInfoBox(doc, margin, currentY, contentWidth, `${alerte.titre}: ${alerte.message}`, alertType);
          });
        } else {
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.success);
          doc.text('Aucune alerte en cours', margin, currentY);
          currentY += 8;
        }

        currentY += 5;

        // Décisions à prendre
        checkPageBreak(50);
        currentY = drawSubtitle(doc, margin, currentY, 'Decisions a prendre');

        const blockedActions = actions.filter(a => a.statut === 'bloque').slice(0, 2);
        const criticalRisksItems = risques.filter(r => r.score >= 12 && r.status === 'active').slice(0, 2);

        if (blockedActions.length > 0 || criticalRisksItems.length > 0) {
          blockedActions.forEach(a => {
            currentY = drawInfoBox(doc, margin, currentY, contentWidth, `Deblocage requis: ${a.titre} (Responsable: ${a.responsable || 'Non assigne'})`, 'warning');
          });
          criticalRisksItems.forEach(r => {
            currentY = drawInfoBox(doc, margin, currentY, contentWidth, `Traitement risque critique: ${r.titre} (Score: ${r.score})`, 'error');
          });
        } else {
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.success);
          doc.text('Aucune decision urgente requise', margin, currentY);
          currentY += 8;
        }
      }

      // ==================== SYNTHESE EXECUTIVE ====================
      if (selectedSections.includes('summary')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Synthese Executive', pageWidth);

        // Analyse globale
        const globalComment = generateSectionComment('summary', {
          overallStatus: executiveSummary.overallStatus,
        });
        currentY = drawInfoBox(doc, margin, currentY, contentWidth, globalComment, 'info');
        currentY += 5;

        // Priorites immediates
        if (executiveSummary.topPriorities.length > 0) {
          currentY = drawSubtitle(doc, margin, currentY, 'Points d\'attention prioritaires');

          executiveSummary.topPriorities.slice(0, 4).forEach((priority) => {
            const alertType = priority.type === 'critical' ? 'error' : 'warning';
            currentY = drawInfoBox(doc, margin, currentY, contentWidth, `${priority.title}: ${priority.recommendation || priority.message}`, alertType);
          });
          currentY += 5;
        }

        // Repartition actions par statut
        checkPageBreak(60);
        currentY = drawSubtitle(doc, margin, currentY, 'Repartition des actions');

        const actionsByStatus = [
          { label: 'Terminees', value: actions.filter(a => a.statut === 'termine').length },
          { label: 'En cours', value: actions.filter(a => a.statut === 'en_cours').length },
          { label: 'A faire', value: actions.filter(a => a.statut === 'a_faire').length },
          { label: 'Bloquees', value: actions.filter(a => a.statut === 'bloque').length },
        ];

        currentY = drawBarChart(doc, margin, currentY, contentWidth / 2 - 5, 50, actionsByStatus, { title: '' });

        // Repartition jalons
        const jalonsByStatus = [
          { label: 'Atteints', value: jalons.filter(j => j.statut === 'atteint').length, color: COLORS.success },
          { label: 'En cours', value: jalons.filter(j => j.statut === 'en_cours').length, color: COLORS.info },
          { label: 'En danger', value: jalons.filter(j => j.statut === 'en_danger').length, color: COLORS.warning },
          { label: 'Depasses', value: jalons.filter(j => j.statut === 'depasse').length, color: COLORS.error },
        ];

        drawBarChart(doc, margin + contentWidth / 2 + 5, currentY - 50, contentWidth / 2 - 5, 50, jalonsByStatus, { title: 'Statut des jalons' });

        currentY += 10;

        // Tableau des indicateurs budget
        checkPageBreak(50);
        currentY = drawSubtitle(doc, margin, currentY, 'Indicateurs financiers');

        currentY = drawStatsTable(doc, margin, currentY, [
          { label: 'Budget prevu (BAC)', value: `${(evmIndicators.BAC / 1000000).toFixed(1)} M FCFA` },
          { label: 'Valeur acquise (EV)', value: `${(evmIndicators.EV / 1000000).toFixed(1)} M FCFA` },
          { label: 'Cout reel (AC)', value: `${(evmIndicators.AC / 1000000).toFixed(1)} M FCFA` },
          { label: 'Ecart cout (CV)', value: `${(evmIndicators.CV / 1000000).toFixed(1)} M FCFA`, highlight: evmIndicators.CV < 0 },
          { label: 'Estimation finale (EAC)', value: `${(evmIndicators.EAC / 1000000).toFixed(1)} M FCFA`, highlight: evmIndicators.EAC > evmIndicators.BAC },
        ]);

        // Tableau risques (a droite)
        drawStatsTable(doc, margin + 100, currentY - 37, [
          { label: 'Risques critiques', value: criticalRisks.toString(), highlight: criticalRisks > 0 },
          { label: 'Risques eleves', value: risques.filter(r => r.score >= 8 && r.score < 12 && r.status !== 'closed').length.toString() },
          { label: 'Risques materialises', value: risques.filter(r => r.status === 'materialized').length.toString(), highlight: risques.filter(r => r.status === 'materialized').length > 0 },
          { label: 'Risques fermes', value: risques.filter(r => r.status === 'closed').length.toString() },
          { label: 'Total actifs', value: risques.filter(r => r.status !== 'closed').length.toString() },
        ]);
      }

      // ==================== ACTIONS ====================
      if (selectedSections.includes('actions')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Plan d\'Actions', pageWidth);

        // Commentaire d'analyse
        const actionsComment = generateSectionComment('actions', {
          completionRate: actionsTotal > 0 ? (actionsCompleted / actionsTotal) * 100 : 0,
        });
        currentY = drawInfoBox(doc, margin, currentY, contentWidth, actionsComment, 'info');
        currentY += 5;

        // Statistiques rapides
        currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
          { label: 'Total', value: actionsTotal.toString(), status: 'neutral' },
          { label: 'Terminees', value: actionsCompleted.toString(), status: 'good' },
          { label: 'En cours', value: actions.filter(a => a.statut === 'en_cours').length.toString(), status: 'neutral' },
          { label: 'Bloquees', value: actions.filter(a => a.statut === 'bloque').length.toString(), status: actions.filter(a => a.statut === 'bloque').length > 0 ? 'bad' : 'good' },
        ]);

        currentY += 5;

        // Avancement par axe
        currentY = drawSubtitle(doc, margin, currentY, 'Avancement par axe strategique');

        const axes = [...new Set(actions.map(a => a.axe))];
        const axeProgressData = axes.map(axe => {
          const axeActions = actions.filter(a => a.axe === axe);
          const avgProgress = axeActions.reduce((sum, a) => sum + a.avancement, 0) / (axeActions.length || 1);
          return {
            label: AXE_LABELS[axe] || axe,
            value: Math.round(avgProgress),
          };
        });

        currentY = drawProgressList(doc, margin, currentY, contentWidth, axeProgressData, { barHeight: 6 });
        currentY += 5;

        // Alertes critiques
        const criticalActions = actionsAnalysis.filter(a => a.type === 'critical');
        if (criticalActions.length > 0) {
          checkPageBreak(30);
          currentY = drawSubtitle(doc, margin, currentY, 'Points critiques');
          criticalActions.slice(0, 3).forEach(alert => {
            currentY = drawInfoBox(doc, margin, currentY, contentWidth, `${alert.title}: ${alert.message}`, 'error');
          });
          currentY += 5;
        }

        // Tableau des actions par axe
        for (const axe of axes) {
          checkPageBreak(40);

          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...COLORS.text);
          doc.text(AXE_LABELS[axe] || axe, margin, currentY);
          currentY += 4;

          const axeActions = actions.filter(a => a.axe === axe);

          autoTable(doc, {
            startY: currentY,
            head: [['ID', 'Titre', 'Statut', 'Priorite', '%', 'Responsable', 'Echeance']],
            body: axeActions.map(a => [
              a.id_action || String(a.id || ''),
              a.titre.substring(0, 30) + (a.titre.length > 30 ? '...' : ''),
              ACTION_STATUS_LABELS[a.statut] || a.statut,
              PRIORITE_LABELS[a.priorite] || a.priorite,
              `${a.avancement}%`,
              a.responsable?.substring(0, 12) || '-',
              a.date_fin_prevue ? new Date(a.date_fin_prevue).toLocaleDateString('fr-FR') : '-',
            ]),
            theme: 'plain',
            headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
            styles: { fontSize: 7, cellPadding: 2 },
            alternateRowStyles: { fillColor: COLORS.bgLight },
            columnStyles: {
              0: { cellWidth: 12 },
              1: { cellWidth: 50 },
              2: { cellWidth: 20 },
              3: { cellWidth: 18 },
              4: { cellWidth: 12 },
              5: { cellWidth: 25 },
              6: { cellWidth: 22 },
            },
          });

          currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8;
        }
      }

      // ==================== JALONS ====================
      if (selectedSections.includes('jalons')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Jalons du Projet', pageWidth);

        // Commentaire d'analyse
        const jalonsComment = generateSectionComment('jalons', {
          completionRate: jalons.length > 0 ? (jalonsAtteints / jalons.length) * 100 : 0,
        });
        currentY = drawInfoBox(doc, margin, currentY, contentWidth, jalonsComment, 'info');
        currentY += 5;

        // Statistiques
        currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
          { label: 'Total', value: jalons.length.toString(), status: 'neutral' },
          { label: 'Atteints', value: jalonsAtteints.toString(), status: 'good' },
          { label: 'En danger', value: jalons.filter(j => j.statut === 'en_danger').length.toString(), status: jalons.filter(j => j.statut === 'en_danger').length > 0 ? 'warning' : 'good' },
          { label: 'Depasses', value: jalons.filter(j => j.statut === 'depasse').length.toString(), status: jalons.filter(j => j.statut === 'depasse').length > 0 ? 'bad' : 'good' },
        ]);

        currentY += 5;

        // Alertes
        const criticalJalons = jalonsAnalysis.filter(a => a.type === 'critical' || a.type === 'warning');
        if (criticalJalons.length > 0) {
          currentY = drawSubtitle(doc, margin, currentY, 'Points d\'attention');
          criticalJalons.slice(0, 3).forEach(alert => {
            const alertType = alert.type === 'critical' ? 'error' : 'warning';
            currentY = drawInfoBox(doc, margin, currentY, contentWidth, alert.message, alertType);
          });
          currentY += 5;
        }

        // Tableau des jalons
        checkPageBreak(50);
        autoTable(doc, {
          startY: currentY,
          head: [['ID', 'Titre', 'Date prevue', 'Statut', 'Type', 'Axe']],
          body: jalons.map(j => [
            j.id_jalon || String(j.id || ''),
            j.titre.substring(0, 35) + (j.titre.length > 35 ? '...' : ''),
            j.date_prevue ? new Date(j.date_prevue).toLocaleDateString('fr-FR') : '-',
            JALON_STATUS_LABELS[j.statut] || j.statut,
            j.type_jalon || '-',
            AXE_LABELS[j.axe] || j.axe,
          ]),
          theme: 'plain',
          headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 2 },
          alternateRowStyles: { fillColor: COLORS.bgLight },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
              const statut = data.cell.raw as string;
              if (statut === 'Depasse') {
                data.cell.styles.textColor = COLORS.error;
                data.cell.styles.fontStyle = 'bold';
              } else if (statut === 'En danger') {
                data.cell.styles.textColor = COLORS.warning;
              }
            }
          },
        });

        currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
      }

      // ==================== SYNCHRONISATION ====================
      if (selectedSections.includes('synchronisation')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Synchronisation Projet / Mobilisation', pageWidth);

        // Commentaire d'analyse
        const syncComment = generateSectionComment('sync', {});
        currentY = drawInfoBox(doc, margin, currentY, contentWidth, syncComment, 'info');
        currentY += 5;

        // Indicateurs principaux
        const gap = syncData.syncStatus?.gap || 0;
        currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
          { label: 'Avancement Projet', value: `${Math.round(syncData.syncStatus?.projectProgress || 0)}%`, status: 'neutral' },
          { label: 'Avancement Mobilisation', value: `${Math.round(syncData.syncStatus?.mobilizationProgress || 0)}%`, status: 'neutral' },
          { label: 'Ecart', value: `${Math.round(Math.abs(gap))}%`, status: Math.abs(gap) <= 5 ? 'good' : Math.abs(gap) <= 15 ? 'warning' : 'bad' },
          { label: 'Statut sync', value: Math.abs(gap) <= 5 ? 'Aligne' : gap > 0 ? 'Projet avance' : 'Mob. avance', status: Math.abs(gap) <= 5 ? 'good' : 'warning' },
        ]);

        currentY += 5;

        // Alertes sync
        const criticalSync = syncAnalysis.filter(a => a.type === 'critical' || a.type === 'warning');
        if (criticalSync.length > 0) {
          criticalSync.slice(0, 2).forEach(alert => {
            const alertType = alert.type === 'critical' ? 'error' : 'warning';
            currentY = drawInfoBox(doc, margin, currentY, contentWidth, `${alert.title}: ${alert.recommendation || alert.message}`, alertType);
          });
          currentY += 5;
        }

        // Avancement Projet par categorie
        if (syncData.projectCategories.length > 0) {
          currentY = drawSubtitle(doc, margin, currentY, 'Avancement Projet (Construction)');
          const projData = syncData.projectCategories.map(cat => ({
            label: cat.categoryName,
            value: Math.round(cat.progress),
          }));
          currentY = drawProgressList(doc, margin, currentY, contentWidth, projData, { barHeight: 6 });
          currentY += 5;
        }

        // Avancement Mobilisation par categorie
        if (syncData.mobilizationCategories.length > 0) {
          checkPageBreak(50);
          currentY = drawSubtitle(doc, margin, currentY, 'Avancement Mobilisation (6 categories)');
          const mobData = syncData.mobilizationCategories.map(cat => ({
            label: cat.categoryName,
            value: Math.round(cat.progress),
          }));
          currentY = drawProgressList(doc, margin, currentY, contentWidth, mobData, { barHeight: 6 });
        }
      }

      // ==================== BUDGET & EVM ====================
      if (selectedSections.includes('budget')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Budget et Indicateurs EVM', pageWidth);

        // Commentaire d'analyse
        const budgetComment = generateSectionComment('budget', {
          keyFigures: [
            { label: 'SPI', value: evmIndicators.SPI },
            { label: 'CPI', value: evmIndicators.CPI },
          ],
        });
        currentY = drawInfoBox(doc, margin, currentY, contentWidth, budgetComment, 'info');
        currentY += 5;

        // KPIs EVM
        currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
          { label: 'BAC (Budget)', value: `${(evmIndicators.BAC / 1000000).toFixed(1)}M`, status: 'neutral' },
          { label: 'EAC (Estimation)', value: `${(evmIndicators.EAC / 1000000).toFixed(1)}M`, status: evmIndicators.EAC <= evmIndicators.BAC ? 'good' : 'bad' },
          { label: 'SPI', value: evmIndicators.SPI.toFixed(2), status: evmIndicators.SPI >= 1 ? 'good' : evmIndicators.SPI >= 0.9 ? 'warning' : 'bad' },
          { label: 'CPI', value: evmIndicators.CPI.toFixed(2), status: evmIndicators.CPI >= 1 ? 'good' : evmIndicators.CPI >= 0.9 ? 'warning' : 'bad' },
        ]);

        currentY += 5;

        // Alertes budget
        const criticalBudget = budgetAnalysis.filter(a => a.type === 'critical' || a.type === 'warning');
        if (criticalBudget.length > 0) {
          criticalBudget.slice(0, 2).forEach(alert => {
            const alertType = alert.type === 'critical' ? 'error' : 'warning';
            currentY = drawInfoBox(doc, margin, currentY, contentWidth, `${alert.title}: ${alert.recommendation || alert.message}`, alertType);
          });
          currentY += 5;
        }

        // Tableau synthese budget
        checkPageBreak(60);
        currentY = drawSubtitle(doc, margin, currentY, 'Synthese budgetaire');

        autoTable(doc, {
          startY: currentY,
          head: [['Indicateur', 'Valeur (FCFA)', 'Taux', 'Interpretation']],
          body: [
            ['Budget prevu (BAC)', budgetSynthese.prevu.toLocaleString('fr-FR'), '100%', 'Reference'],
            ['Budget engage', budgetSynthese.engage.toLocaleString('fr-FR'), `${Math.round(budgetSynthese.tauxEngagement)}%`, budgetSynthese.tauxEngagement > 100 ? 'Attention' : 'Normal'],
            ['Budget realise (AC)', budgetSynthese.realise.toLocaleString('fr-FR'), `${Math.round(budgetSynthese.tauxRealisation)}%`, budgetSynthese.ecartRealisation >= 0 ? 'Sous controle' : 'Depassement'],
            ['Valeur acquise (EV)', Math.round(evmIndicators.EV).toLocaleString('fr-FR'), '-', evmIndicators.SPI >= 1 ? 'En avance' : 'En retard'],
            ['Ecart planning (SV)', Math.round(evmIndicators.SV).toLocaleString('fr-FR'), '-', evmIndicators.SV >= 0 ? 'Positif' : 'Negatif'],
            ['Ecart cout (CV)', Math.round(evmIndicators.CV).toLocaleString('fr-FR'), '-', evmIndicators.CV >= 0 ? 'Economie' : 'Surcout'],
            ['Estimation finale (EAC)', Math.round(evmIndicators.EAC).toLocaleString('fr-FR'), '-', evmIndicators.VAC >= 0 ? 'Sous BAC' : 'Depassement'],
          ],
          theme: 'plain',
          headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 2 },
          alternateRowStyles: { fillColor: COLORS.bgLight },
        });

        currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
      }

      // ==================== BUDGET DETAILLE ====================
      if (selectedSections.includes('budget_details')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Budget Detaille', pageWidth);

        // Repartition par categorie
        currentY = drawSubtitle(doc, margin, currentY, 'Taux de realisation par categorie');

        const catData = Object.entries(budgetParCategorie).map(([cat, values]) => ({
          label: BUDGET_CATEGORY_LABELS[cat as keyof typeof BUDGET_CATEGORY_LABELS] || cat,
          value: values.prevu > 0 ? Math.round((values.realise / values.prevu) * 100) : 0,
          color: values.realise <= values.prevu ? COLORS.success : COLORS.error,
        }));

        if (catData.length > 0) {
          currentY = drawProgressList(doc, margin, currentY, contentWidth, catData, { barHeight: 8 });
          currentY += 10;
        }

        // Repartition par axe
        checkPageBreak(60);
        currentY = drawSubtitle(doc, margin, currentY, 'Taux de realisation par axe strategique');

        const axeData = Object.entries(budgetParAxe).map(([axe, values]) => ({
          label: AXE_LABELS[axe as keyof typeof AXE_LABELS] || axe,
          value: values.prevu > 0 ? Math.round((values.realise / values.prevu) * 100) : 0,
          color: values.realise <= values.prevu ? COLORS.success : COLORS.error,
        }));

        if (axeData.length > 0) {
          currentY = drawProgressList(doc, margin, currentY, contentWidth, axeData, { barHeight: 8 });
          currentY += 10;
        }

        // Tableau detaille
        checkPageBreak(50);
        currentY = drawSubtitle(doc, margin, currentY, 'Detail des postes budgetaires');

        autoTable(doc, {
          startY: currentY,
          head: [['Libelle', 'Categorie', 'Prevu', 'Engage', 'Realise', 'Ecart']],
          body: budgetItems.map(item => [
            item.libelle.substring(0, 30) + (item.libelle.length > 30 ? '...' : ''),
            BUDGET_CATEGORY_LABELS[item.categorie as keyof typeof BUDGET_CATEGORY_LABELS] || item.categorie,
            item.montantPrevu.toLocaleString('fr-FR'),
            item.montantEngage.toLocaleString('fr-FR'),
            item.montantRealise.toLocaleString('fr-FR'),
            (item.montantPrevu - item.montantRealise).toLocaleString('fr-FR'),
          ]),
          theme: 'plain',
          headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 7 },
          styles: { fontSize: 7, cellPadding: 2 },
          alternateRowStyles: { fillColor: COLORS.bgLight },
        });

        currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
      }

      // ==================== RISQUES ====================
      if (selectedSections.includes('risques')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Gestion des Risques', pageWidth);

        // Commentaire d'analyse
        const risquesComment = generateSectionComment('risques', {
          issues: risquesAnalysis.filter(a => a.type === 'critical').map(a => a.message),
        });
        currentY = drawInfoBox(doc, margin, currentY, contentWidth, risquesComment, 'info');
        currentY += 5;

        // KPIs risques
        currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
          { label: 'Total actifs', value: risques.filter(r => r.status !== 'closed').length.toString(), status: 'neutral' },
          { label: 'Critiques', value: criticalRisks.toString(), status: criticalRisks === 0 ? 'good' : 'bad' },
          { label: 'Eleves', value: risques.filter(r => r.score >= 8 && r.score < 12 && r.status !== 'closed').length.toString(), status: 'warning' },
          { label: 'Fermes', value: risques.filter(r => r.status === 'closed').length.toString(), status: 'good' },
        ]);

        currentY += 5;

        // Matrice des risques
        checkPageBreak(80);
        currentY = drawSubtitle(doc, margin, currentY, 'Matrice des risques');

        const riskMatrixData = risques
          .filter(r => r.status !== 'closed')
          .map(r => ({
            probability: r.probabilite_actuelle ?? r.probabilite ?? 1,
            impact: r.impact_actuel ?? r.impact ?? 1,
          }));

        currentY = drawRiskMatrix(doc, margin, currentY, 60, riskMatrixData);

        // Legende matrice
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.textLight);
        doc.text('Vert: Risque faible | Jaune: Risque modere | Rouge: Risque eleve', margin + 70, currentY - 40);
        currentY += 10;

        // Alertes risques critiques
        const criticalRisksItems = risquesAnalysis.filter(a => a.type === 'critical');
        if (criticalRisksItems.length > 0) {
          currentY = drawSubtitle(doc, margin, currentY, 'Risques critiques - Action immediate');
          criticalRisksItems.slice(0, 3).forEach(alert => {
            currentY = drawInfoBox(doc, margin, currentY, contentWidth, `${alert.message} - ${alert.recommendation || ''}`, 'error');
          });
          currentY += 5;
        }

        // Tableau des risques
        checkPageBreak(50);
        currentY = drawSubtitle(doc, margin, currentY, 'Liste des risques');

        autoTable(doc, {
          startY: currentY,
          head: [['ID', 'Titre', 'Categorie', 'P', 'I', 'Score', 'Statut', 'Proprietaire']],
          body: risques.map(r => [
            r.id_risque || String(r.id || ''),
            r.titre.substring(0, 25) + (r.titre.length > 25 ? '...' : ''),
            RISQUE_CATEGORY_LABELS[r.categorie] || r.categorie,
            (r.probabilite_actuelle ?? r.probabilite)?.toString() || '-',
            (r.impact_actuel ?? r.impact)?.toString() || '-',
            r.score?.toString() || '-',
            getRisqueStatusLabel(r.status),
            r.proprietaire?.substring(0, 10) || '-',
          ]),
          theme: 'plain',
          headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 7 },
          styles: { fontSize: 7, cellPadding: 2 },
          alternateRowStyles: { fillColor: COLORS.bgLight },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 5) {
              const score = parseInt(data.cell.raw as string);
              if (score >= 12) {
                data.cell.styles.fillColor = [254, 226, 226];
                data.cell.styles.fontStyle = 'bold';
              } else if (score >= 8) {
                data.cell.styles.fillColor = [254, 243, 199];
              }
            }
          },
        });

        currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
      }

      // ==================== EQUIPE ====================
      if (selectedSections.includes('equipe')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Equipe Projet', pageWidth);

        // KPIs equipe
        currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
          { label: 'Membres', value: users.length.toString(), status: 'neutral' },
          { label: 'Equipes', value: teams.length.toString(), status: 'neutral' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length.toString(), status: 'neutral' },
          { label: 'Managers', value: users.filter(u => u.role === 'manager').length.toString(), status: 'neutral' },
        ]);

        currentY += 5;

        // Tableau utilisateurs
        autoTable(doc, {
          startY: currentY,
          head: [['Nom', 'Prenom', 'Email', 'Role']],
          body: users.map(u => [
            u.nom,
            u.prenom,
            u.email,
            u.role === 'admin' ? 'Administrateur' : u.role === 'manager' ? 'Manager' : 'Lecteur',
          ]),
          theme: 'plain',
          headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 2 },
          alternateRowStyles: { fillColor: COLORS.bgLight },
        });

        currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;

        // Equipes
        if (teams.length > 0) {
          checkPageBreak(40);
          currentY = drawSubtitle(doc, margin, currentY, 'Equipes');

          autoTable(doc, {
            startY: currentY,
            head: [['Equipe', 'Description', 'Membres', 'Responsable', 'Statut']],
            body: teams.map(t => {
              const resp = users.find(u => u.id === t.responsableId);
              return [
                t.nom,
                t.description?.substring(0, 35) || '-',
                t.membres.length.toString(),
                resp ? `${resp.prenom} ${resp.nom}` : '-',
                t.actif ? 'Actif' : 'Inactif',
              ];
            }),
            theme: 'plain',
            headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: COLORS.bgLight },
          });

          currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
        }
      }

      // ==================== ALERTES ====================
      if (selectedSections.includes('alertes')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Alertes', pageWidth);

        // KPIs alertes
        currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
          { label: 'Total', value: alertes.length.toString(), status: 'neutral' },
          { label: 'Non traitees', value: alertes.filter(a => !a.traitee).length.toString(), status: alertes.filter(a => !a.traitee).length > 5 ? 'warning' : 'neutral' },
          { label: 'Critiques', value: alertes.filter(a => a.criticite === 'critical' && !a.traitee).length.toString(), status: alertes.filter(a => a.criticite === 'critical' && !a.traitee).length > 0 ? 'bad' : 'good' },
          { label: 'Traitees', value: alertes.filter(a => a.traitee).length.toString(), status: 'good' },
        ]);

        currentY += 5;

        // Alertes critiques
        const criticalAlertes = alertesAnalysis.filter(a => a.type === 'critical');
        if (criticalAlertes.length > 0) {
          criticalAlertes.slice(0, 3).forEach(alert => {
            currentY = drawInfoBox(doc, margin, currentY, contentWidth, alert.message, 'error');
          });
          currentY += 5;
        }

        // Tableau alertes
        checkPageBreak(50);
        if (alertes.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'Type', 'Titre', 'Criticite', 'Traitee']],
            body: alertes.slice(0, 50).map(a => [
              new Date(a.createdAt).toLocaleDateString('fr-FR'),
              ALERTE_TYPE_LABELS[a.type] || a.type,
              a.titre.substring(0, 45) + (a.titre.length > 45 ? '...' : ''),
              CRITICITE_LABELS[a.criticite] || a.criticite,
              a.traitee ? 'Oui' : 'Non',
            ]),
            theme: 'plain',
            headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: COLORS.bgLight },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 3) {
                const criticite = data.cell.raw as string;
                if (criticite === 'Critique') {
                  data.cell.styles.textColor = COLORS.error;
                  data.cell.styles.fontStyle = 'bold';
                } else if (criticite === 'Haute') {
                  data.cell.styles.textColor = COLORS.warning;
                }
              }
            },
          });

          currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
        }
      }

      // ==================== HISTORIQUE ====================
      if (selectedSections.includes('historique')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Journal d\'Activite', pageWidth);

        if (historique.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'Type', 'Entite', 'Champ', 'Ancienne valeur', 'Nouvelle valeur']],
            body: historique.slice(0, 50).map(h => [
              new Date(h.timestamp).toLocaleString('fr-FR'),
              h.entiteType,
              String(h.entiteId),
              h.champModifie,
              h.ancienneValeur?.substring(0, 15) || '-',
              h.nouvelleValeur?.substring(0, 15) || '-',
            ]),
            theme: 'plain',
            headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 7 },
            styles: { fontSize: 7, cellPadding: 2 },
            alternateRowStyles: { fillColor: COLORS.bgLight },
          });
        } else {
          doc.setFontSize(10);
          doc.setTextColor(...COLORS.textLight);
          doc.text('Aucune activite enregistree.', margin, currentY);
        }
      }

      // ==================== LIVRABLES ====================
      if (selectedSections.includes('livrables')) {
        doc.addPage();
        currentY = drawSectionHeader(doc, 'Livrables', pageWidth);

        const allLivrables = getAllLivrables();

        if (allLivrables.length > 0) {
          // KPIs livrables
          currentY = drawKPIRow(doc, margin, currentY, contentWidth, [
            { label: 'Total', value: allLivrables.length.toString(), status: 'neutral' },
            { label: 'Valides', value: allLivrables.filter(l => l.livrable.statut === 'valide').length.toString(), status: 'good' },
            { label: 'En cours', value: allLivrables.filter(l => l.livrable.statut === 'en_cours').length.toString(), status: 'neutral' },
            { label: 'En attente', value: allLivrables.filter(l => l.livrable.statut === 'en_attente').length.toString(), status: 'warning' },
          ]);

          currentY += 5;

          // Tableau livrables
          autoTable(doc, {
            startY: currentY,
            head: [['Nom', 'Source', 'Element', 'Statut', 'Obligatoire', 'Date prevue']],
            body: allLivrables.map(l => [
              l.livrable.nom.substring(0, 28) + (l.livrable.nom.length > 28 ? '...' : ''),
              l.source,
              l.sourceTitre.substring(0, 22) + (l.sourceTitre.length > 22 ? '...' : ''),
              STATUT_LIVRABLE_LABELS[l.livrable.statut as keyof typeof STATUT_LIVRABLE_LABELS] || l.livrable.statut,
              l.livrable.obligatoire ? 'Oui' : 'Non',
              l.livrable.date_prevue ? new Date(l.livrable.date_prevue).toLocaleDateString('fr-FR') : '-',
            ]),
            theme: 'plain',
            headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 7 },
            styles: { fontSize: 7, cellPadding: 2 },
            alternateRowStyles: { fillColor: COLORS.bgLight },
          });
        } else {
          doc.setFontSize(10);
          doc.setTextColor(...COLORS.textLight);
          doc.text('Aucun livrable enregistre.', margin, currentY);
        }
      }

      // ==================== NUMEROTATION DES PAGES ====================
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.textLight);
        doc.text(
          `Page ${i}/${pageCount} - ${siteName} - ${today.toLocaleDateString('fr-FR')}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      // Sauvegarde
      doc.save(`rapport-${siteName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la generation du PDF');
    } finally {
      setGenerating(null);
    }
  };

  // ============================================================================
  // GENERATION EXCEL
  // ============================================================================
  const generateCompleteExcel = async () => {
    if (selectedSections.length === 0) {
      alert('Veuillez selectionner au moins une section');
      return;
    }

    setGenerating('excel');

    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Summary sheet
      if (selectedSections.includes('summary')) {
        const summaryData = [
          [`RAPPORT DE PROJET - ${siteName}`],
          [''],
          ['Date de generation', new Date().toLocaleDateString('fr-FR')],
          [''],
          ['INDICATEURS CLES'],
          ['Avancement Projet', `${Math.round(syncData.syncStatus?.projectProgress || 0)}%`],
          ['Avancement Mobilisation', `${Math.round(syncData.syncStatus?.mobilizationProgress || 0)}%`],
          ['Ecart synchronisation', `${Math.round(syncData.syncStatus?.gap || 0)}%`],
          ['Budget prevu', budgetSynthese.prevu],
          ['Budget engage', budgetSynthese.engage],
          ['Budget realise', budgetSynthese.realise],
          ['Taux realisation', `${Math.round(budgetSynthese.tauxRealisation)}%`],
          ['Jalons atteints', `${jalons.filter(j => j.statut === 'atteint').length}/${jalons.length}`],
          [''],
          ['INDICATEURS EVM'],
          ['BAC', evmIndicators.BAC],
          ['PV', evmIndicators.PV],
          ['EV', evmIndicators.EV],
          ['AC', evmIndicators.AC],
          ['SPI', evmIndicators.SPI],
          ['CPI', evmIndicators.CPI],
          ['SV', evmIndicators.SV],
          ['CV', evmIndicators.CV],
          ['EAC', evmIndicators.EAC],
          ['VAC', evmIndicators.VAC],
          [''],
          ['STATISTIQUES'],
          ['Actions totales', actions.length],
          ['Actions terminees', actions.filter(a => a.statut === 'termine').length],
          ['Actions bloquees', actions.filter(a => a.statut === 'bloque').length],
          ['Jalons totaux', jalons.length],
          ['Risques critiques', risques.filter(r => r.score >= 12 && r.status !== 'closed').length],
          ['Alertes non traitees', alertes.filter(a => !a.traitee).length],
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Synthese');
      }

      // Actions sheet
      if (selectedSections.includes('actions')) {
        const wsActions = XLSX.utils.json_to_sheet(
          actions.map(a => ({
            'ID': a.id_action || a.id,
            'Titre': a.titre,
            'Description': a.description,
            'Axe': AXE_LABELS[a.axe] || a.axe,
            'Statut': ACTION_STATUS_LABELS[a.statut] || a.statut,
            'Priorite': PRIORITE_LABELS[a.priorite] || a.priorite,
            'Avancement (%)': a.avancement,
            'Responsable': a.responsable,
            'Date debut prevue': a.date_debut_prevue,
            'Date fin prevue': a.date_fin_prevue,
            'Date debut reelle': a.date_debut_reelle || '',
            'Date fin reelle': a.date_fin_reelle || '',
            'Sante': a.sante,
            'Budget prevu': a.budget_prevu || 0,
            'Budget consomme': a.budget_consomme || 0,
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsActions, 'Actions');
      }

      // Jalons sheet
      if (selectedSections.includes('jalons')) {
        const wsJalons = XLSX.utils.json_to_sheet(
          jalons.map(j => ({
            'ID': j.id_jalon || j.id,
            'Titre': j.titre,
            'Description': j.description,
            'Axe': AXE_LABELS[j.axe] || j.axe,
            'Statut': JALON_STATUS_LABELS[j.statut] || j.statut,
            'Type': j.type_jalon || '',
            'Date prevue': j.date_prevue,
            'Date reelle': j.date_reelle || '',
            'Importance': j.niveau_importance,
            'Responsable': j.responsable,
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsJalons, 'Jalons');
      }

      // Synchronisation sheets
      if (selectedSections.includes('synchronisation')) {
        if (syncData.categories && syncData.categories.length > 0) {
          const wsSyncCategories = XLSX.utils.json_to_sheet(
            syncData.categories.map(cat => ({
              'ID': cat.id,
              'Nom': cat.name,
              'Dimension': cat.dimension === 'PROJECT' ? 'Projet' : 'Mobilisation',
              'Avancement (%)': cat.progress || 0,
              'Poids': cat.weight || 1,
            }))
          );
          XLSX.utils.book_append_sheet(wb, wsSyncCategories, 'Sync-Categories');
        }
      }

      // Budget sheet
      if (selectedSections.includes('budget') || selectedSections.includes('budget_details')) {
        const wsBudget = XLSX.utils.json_to_sheet(
          budgetItems.map(item => ({
            'Libelle': item.libelle,
            'Categorie': BUDGET_CATEGORY_LABELS[item.categorie as keyof typeof BUDGET_CATEGORY_LABELS] || item.categorie,
            'Axe': AXE_LABELS[item.axe as keyof typeof AXE_LABELS] || item.axe,
            'Montant prevu': item.montantPrevu,
            'Montant engage': item.montantEngage,
            'Montant realise': item.montantRealise,
            'Ecart': item.montantPrevu - item.montantRealise,
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsBudget, 'Budget');
      }

      // Risques sheet
      if (selectedSections.includes('risques')) {
        const wsRisques = XLSX.utils.json_to_sheet(
          risques.map(r => ({
            'ID': r.id_risque || r.id,
            'Titre': r.titre,
            'Description': r.description,
            'Categorie': RISQUE_CATEGORY_LABELS[r.categorie] || r.categorie,
            'Statut': getRisqueStatusLabel(r.status),
            'Probabilite': r.probabilite_actuelle ?? r.probabilite,
            'Impact': r.impact_actuel ?? r.impact,
            'Score': r.score,
            'Proprietaire': r.proprietaire,
            'Plan mitigation': r.plan_mitigation || '',
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsRisques, 'Risques');
      }

      // Equipe sheet
      if (selectedSections.includes('equipe')) {
        const wsEquipe = XLSX.utils.json_to_sheet(
          users.map(u => ({
            'Nom': u.nom,
            'Prenom': u.prenom,
            'Email': u.email,
            'Role': u.role === 'admin' ? 'Administrateur' : u.role === 'manager' ? 'Manager' : 'Lecteur',
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsEquipe, 'Equipe');
      }

      // Alertes sheet
      if (selectedSections.includes('alertes')) {
        const wsAlertes = XLSX.utils.json_to_sheet(
          alertes.map(a => ({
            'Date': a.createdAt,
            'Type': ALERTE_TYPE_LABELS[a.type] || a.type,
            'Titre': a.titre,
            'Message': a.message,
            'Criticite': CRITICITE_LABELS[a.criticite] || a.criticite,
            'Traitee': a.traitee ? 'Oui' : 'Non',
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsAlertes, 'Alertes');
      }

      // Livrables sheet
      if (selectedSections.includes('livrables')) {
        const allLivrables = getAllLivrables();
        if (allLivrables.length > 0) {
          const wsLivrables = XLSX.utils.json_to_sheet(
            allLivrables.map(l => ({
              'Nom': l.livrable.nom,
              'Source': l.source,
              'Element': l.sourceTitre,
              'Statut': STATUT_LIVRABLE_LABELS[l.livrable.statut as keyof typeof STATUT_LIVRABLE_LABELS] || l.livrable.statut,
              'Obligatoire': l.livrable.obligatoire ? 'Oui' : 'Non',
              'Date prevue': l.livrable.date_prevue || '',
            }))
          );
          XLSX.utils.book_append_sheet(wb, wsLivrables, 'Livrables');
        }
      }

      XLSX.writeFile(wb, `export-${siteName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Erreur lors de la generation Excel');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <Card padding="md">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              Rapport complet avec analyses
            </h3>
            <p className="text-sm text-primary-500">
              Graphiques, commentaires automatiques et recommandations - toutes les donnees connectees
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Tout selectionner
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              Tout deselectionner
            </Button>
          </div>
        </div>

        {/* Data Stats */}
        <div className="flex flex-wrap gap-2 p-3 bg-primary-50 rounded-lg">
          <Badge variant="info">{actions.length} actions</Badge>
          <Badge variant="info">{jalons.length} jalons</Badge>
          <Badge variant="info">{syncData?.categories?.length || 0} cat. sync</Badge>
          <Badge variant="warning">{risques.length} risques</Badge>
          <Badge variant="success">{budgetItems.length} postes budget</Badge>
          <Badge variant="secondary">{users.length} utilisateurs</Badge>
          <Badge variant="secondary">{teams.length} equipes</Badge>
          <Badge variant="error">{alertes.filter(a => !a.traitee).length} alertes actives</Badge>
        </div>

        {/* Report Title */}
        <div>
          <Label htmlFor="reportTitle">Titre du rapport</Label>
          <Input
            id="reportTitle"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Titre du rapport"
            className="mt-1"
          />
        </div>

        {/* Report Period */}
        <ReportPeriodSelector
          value={reportPeriod}
          onChange={setReportPeriod}
        />

        {/* Section Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {REPORT_SECTIONS.map((section) => {
            const isSelected = selectedSections.includes(section.id);
            return (
              <div
                key={section.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-primary-200 hover:border-primary-300'
                }`}
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-start gap-2">
                  <div className={`p-1.5 rounded-lg ${section.color}`}>
                    <section.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary-500 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-primary-300 shrink-0" />
                      )}
                      <span className="font-medium text-sm text-primary-900 truncate">{section.label}</span>
                    </div>
                    <p className="text-xs text-primary-500 mt-0.5 line-clamp-2">{section.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Count */}
        <div className="flex items-center gap-2 text-sm text-primary-600">
          <Badge variant="info">{selectedSections.length}</Badge>
          <span>section(s) selectionnee(s) sur {REPORT_SECTIONS.length}</span>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-4 pt-4 border-t">
          <Button
            onClick={generateCompletePDF}
            disabled={generating !== null || selectedSections.length === 0}
            className="flex-1 min-w-[200px]"
          >
            {generating === 'pdf' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {generating === 'pdf' ? 'Generation en cours...' : 'Generer rapport PDF'}
          </Button>
          <Button
            variant="secondary"
            onClick={generateCompleteExcel}
            disabled={generating !== null || selectedSections.length === 0}
            className="flex-1 min-w-[200px]"
          >
            {generating === 'excel' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            {generating === 'excel' ? 'Generation...' : 'Exporter donnees Excel'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
