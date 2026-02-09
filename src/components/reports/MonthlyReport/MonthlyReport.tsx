/**
 * MonthlyReport - Rapport mensuel PREMIUM
 * Design épuré et élégant - Standards Linear/Stripe/Notion
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ChevronRight,
  Clock,
  BarChart3,
  PieChart,
  FileText,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useActions,
  useJalons,
  useRisques,
  useDashboardKPIs,
  useCOPILTrends,
  useSync,
  useBudgetSynthese,
} from '@/hooks';
import { useSiteStore } from '@/stores/siteStore';
import { AXES_CONFIG_FULL, THEME_COLORS, SEUILS_RISQUES, SEUILS_SYNC_REPORT, SEUILS_UI } from '@/data/constants';

const axesList = Object.values(AXES_CONFIG_FULL);

interface MonthlyReportProps {
  className?: string;
}

// Animated counter
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const start = Date.now();
    const animate = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}</>;
}

// Donut chart
function DonutChart({ value, size = 80, strokeWidth = 8, color = THEME_COLORS.primary }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-slate-900">{Math.round(value)}%</span>
      </div>
    </div>
  );
}

// Sparkline
function Sparkline({ data, color = THEME_COLORS.primary, height = 32 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-24" style={{ height }} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function MonthlyReport({ className }: MonthlyReportProps) {
  const { currentSiteId } = useSiteStore();
  const siteId = currentSiteId || 1;

  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();
  const kpis = useDashboardKPIs();
  const trends = useCOPILTrends(siteId);
  const syncData = useSync(siteId, 'cosmos-angre');
  const budgetSynthese = useBudgetSynthese();

  const today = new Date();
  const currentMonth = today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const todayStr = today.toISOString().split('T')[0];

  // Notes manuelles
  const notesKey = `monthly-report-notes-${siteId}-${today.getFullYear()}-${today.getMonth() + 1}`;
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    const savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) setNotes(savedNotes);
  }, [notesKey]);

  const handleSaveNotes = useCallback(() => {
    localStorage.setItem(notesKey, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }, [notesKey, notes]);

  // Metrics
  const metrics = useMemo(() => {
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStart = thisMonth.toISOString().split('T')[0];

    const actionsTerminees = actions.filter(a => a.statut === 'termine').length;
    const actionsEnCours = actions.filter(a => a.statut === 'en_cours').length;
    const actionsEnRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < todayStr
    ).length;
    const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
    const risquesCritiques = risques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= SEUILS_RISQUES.critique && r.status !== 'ferme';
    }).length;
    const avancement = actions.length > 0
      ? Math.round(actions.reduce((sum, a) => sum + (a.avancement || 0), 0) / actions.length)
      : 0;

    // Calcul du pourcentage de budget consommé
    const budgetPct = budgetSynthese.prevu > 0
      ? Math.round((budgetSynthese.realise / budgetSynthese.prevu) * 100)
      : 0;

    return {
      actionsTerminees, actionsEnCours, actionsEnRetard, jalonsAtteints, risquesCritiques, avancement,
      total: actions.length, jalonsTotal: jalons.length, risquesTotal: risques.filter(r => r.status !== 'ferme').length,
      occupation: kpis.tauxOccupation || 0, budgetConsomme: budgetPct
    };
  }, [actions, jalons, risques, kpis, budgetSynthese, today, todayStr]);

  // Top risques
  const topRisques = useMemo(() => {
    return risques
      .filter(r => r.status !== 'ferme')
      .sort((a, b) => {
        const scoreA = a.score || (a.probabilite || 0) * (a.impact || 0);
        const scoreB = b.score || (b.probabilite || 0) * (b.impact || 0);
        return scoreB - scoreA;
      })
      .slice(0, SEUILS_UI.topRisques);
  }, [risques]);

  // Actions prioritaires M+1
  const actionsPrioritaires = useMemo(() => {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const priorityOrder: Record<string, number> = { critique: 1, haute: 2, moyenne: 3, basse: 4 };

    return actions
      .filter(a => {
        if (a.statut === 'termine' || a.statut === 'annule') return false;
        if (!a.date_fin_prevue) return false;
        const date = new Date(a.date_fin_prevue);
        return date >= nextMonth && date <= endNextMonth;
      })
      .sort((a, b) => (priorityOrder[a.priorite] || 5) - (priorityOrder[b.priorite] || 5))
      .slice(0, 6);
  }, [actions, today]);

  // Avancement par axe (tous les 8 axes)
  const axeStats = useMemo(() => {
    return axesList.map(axe => {
      const axeActions = actions.filter(a => a.axe === axe.code);
      const termine = axeActions.filter(a => a.statut === 'termine').length;
      const total = axeActions.length;
      // Utiliser l'avancement moyen au lieu du pourcentage terminé
      const avancementMoyen = axeActions.length > 0
        ? Math.round(axeActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / axeActions.length)
        : 0;
      return { axe, termine, total, pct: avancementMoyen };
    });
  }, [actions]);

  // Sync - utiliser les vraies données de syncStatus
  const projectProgress = syncData?.syncStatus?.projectProgress ?? metrics.avancement;
  const mobilizationProgress = syncData?.syncStatus?.mobilizationProgress ?? Math.max(0, metrics.avancement - 5);
  const syncGap = projectProgress - mobilizationProgress;

  const trendVariation = trends?.avancementProjet?.variation || 0;

  // Budget formatter (used by both PDF export and render)
  const formatBudget = (amount: number) => {
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(1)} Mds`;
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(0)} M`;
    return amount.toLocaleString('fr-FR');
  };

  // ---- Export PDF (plain function — no useCallback to avoid stale closures) ----
  const handleExportPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const navy = [28, 49, 99]; // #1C3163 - Cosmos Blue
      const gray = [100, 116, 139];
      const dark = [15, 23, 42];
      const getY = () => (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

      const sectionTitle = (title: string, y: number) => {
        if (y > 245) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...dark);
        doc.text(title, 14, y);
        return y + 6;
      };

      const tableOpts = {
        theme: 'grid' as const,
        headStyles: { fillColor: navy, fontStyle: 'bold' as const, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      };

      // =============================================
      // HEADER (bandeau bleu)
      // =============================================
      doc.setFillColor(...navy);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Rapport Mensuel', 14, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`COPIL — ${currentMonth}`, 14, 22);
      doc.setFontSize(9);
      doc.text(todayStr, pageW - 14, 14, { align: 'right' });

      // =============================================
      // 1. INDICATEURS CLÉS  (mêmes 5 KPIs que les cards)
      // =============================================
      let y = sectionTitle('Indicateurs clés', 36);
      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Valeur', 'Détail']],
        body: [
          ['Avancement', `${metrics.avancement}%`, trendVariation !== 0 ? `${trendVariation > 0 ? '+' : ''}${trendVariation.toFixed(1)}%` : '—'],
          ['Actions', `${metrics.actionsTerminees}`, `sur ${metrics.total} (${metrics.total > 0 ? Math.round((metrics.actionsTerminees / metrics.total) * 100) : 0}%)`],
          ['Jalons', `${metrics.jalonsAtteints}`, `sur ${metrics.jalonsTotal} (${metrics.jalonsTotal > 0 ? Math.round((metrics.jalonsAtteints / metrics.jalonsTotal) * 100) : 0}%)`],
          ['Occupation', `${metrics.occupation}%`, ''],
          ['Budget', `${metrics.budgetConsomme}%`, ''],
        ],
        ...tableOpts,
      });

      // =============================================
      // 2. SYNCHRONISATION PROJET / MOBILISATION
      // =============================================
      y = sectionTitle('Synchronisation Projet / Mobilisation', getY() + 10);
      const syncLabel = Math.abs(syncGap) <= SEUILS_SYNC_REPORT.synchronise ? 'Synchronisé' : Math.abs(syncGap) <= SEUILS_SYNC_REPORT.attention ? 'Attention' : 'Écart critique';
      autoTable(doc, {
        startY: y,
        head: [['Construction', 'Mobilisation', 'Écart', 'Statut']],
        body: [[
          `${Math.round(projectProgress)}%`,
          `${Math.round(mobilizationProgress)}%`,
          `${syncGap > 0 ? '+' : ''}${Math.round(syncGap)}%  (~${Math.abs(Math.round(syncGap * SEUILS_SYNC_REPORT.joursConversion))} jours)`,
          syncLabel,
        ]],
        ...tableOpts,
      });

      // =============================================
      // 3. POINTS D'ATTENTION
      // =============================================
      y = sectionTitle('Points d\'attention', getY() + 10);
      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Valeur']],
        body: [
          ['Actions en retard', String(metrics.actionsEnRetard)],
          ['Risques critiques', String(metrics.risquesCritiques)],
          ['Budget consommé', `${metrics.budgetConsomme}%`],
        ],
        ...tableOpts,
      });

      // =============================================
      // 4. AVANCEMENT PAR AXE STRATÉGIQUE
      // =============================================
      y = sectionTitle('Avancement par axe stratégique', getY() + 10);
      autoTable(doc, {
        startY: y,
        head: [['Axe', 'Avancement', 'Actions terminées']],
        body: axeStats.map(item => [
          item.axe.labelCourt || item.axe.label,
          `${item.pct}%`,
          `${item.termine}/${item.total}`,
        ]),
        ...tableOpts,
      });

      // =============================================
      // 5. RISQUES MAJEURS
      // =============================================
      if (topRisques.length > 0) {
        y = sectionTitle(`Risques majeurs (${metrics.risquesTotal} actifs)`, getY() + 10);
        autoTable(doc, {
          startY: y,
          head: [['Risque', 'Axe', 'P × I', 'Score']],
          body: topRisques.map(r => {
            const score = r.score || (r.probabilite || 0) * (r.impact || 0);
            const axe = axesList.find(a => a.code === r.axe);
            return [r.titre, axe?.labelCourt || '', `P${r.probabilite} × I${r.impact}`, String(score)];
          }),
          ...tableOpts,
          columnStyles: { 0: { cellWidth: 80 } },
        });
      }

      // =============================================
      // 6. PLAN D'ACTION M+1
      // =============================================
      if (actionsPrioritaires.length > 0) {
        y = sectionTitle(`Plan d'action M+1 (${actionsPrioritaires.length} prioritaires)`, getY() + 10);
        autoTable(doc, {
          startY: y,
          head: [['Action', 'Axe', 'Priorité', 'Échéance']],
          body: actionsPrioritaires.map(a => {
            const axe = axesList.find(ax => ax.code === a.axe);
            const d = a.date_fin_prevue ? new Date(a.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
            return [a.titre, axe?.labelCourt || '', a.priorite || '', d];
          }),
          ...tableOpts,
          columnStyles: { 0: { cellWidth: 75 } },
        });
      }

      // =============================================
      // 7. EXÉCUTION BUDGÉTAIRE
      // =============================================
      if (budgetSynthese.prevu > 0) {
        y = sectionTitle('Exécution budgétaire', getY() + 10);
        autoTable(doc, {
          startY: y,
          head: [['Poste', 'Montant']],
          body: [
            ['Budget prévu', `${formatBudget(budgetSynthese.prevu)} FCFA`],
            ['Engagé', `${formatBudget(budgetSynthese.engage)} FCFA`],
            ['Réalisé', `${formatBudget(budgetSynthese.realise)} FCFA`],
            ['Reste à engager', `${formatBudget(budgetSynthese.ecartEngagement)} FCFA`],
            ['Taux réalisation', `${budgetSynthese.tauxRealisation.toFixed(0)}%`],
            ['Taux engagement', `${budgetSynthese.tauxEngagement.toFixed(0)}%`],
          ],
          ...tableOpts,
        });
      }

      // =============================================
      // 8. NOTES
      // =============================================
      if (notes.trim()) {
        y = sectionTitle('Notes & Commentaires COPIL', getY() + 10);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...dark);
        const lines = doc.splitTextToSize(notes, pageW - 28);
        doc.text(lines, 14, y);
      }

      // =============================================
      // FOOTER (chaque page)
      // =============================================
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...gray);
        doc.text(`Rapport Mensuel COPIL — ${currentMonth}`, 14, pageH - 10);
        doc.text(`Page ${i}/${pageCount}`, pageW - 14, pageH - 10, { align: 'right' });
      }

      doc.save(`Rapport-Mensuel-${todayStr}.pdf`);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de la génération du PDF. Vérifiez la console (F12).');
    }
  };

  return (
    <div className={cn('min-h-screen bg-slate-50/50', className)}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)` }}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: THEME_COLORS.primary }}>Rapport Mensuel</h1>
                <p className="text-sm text-slate-500 capitalize">{currentMonth}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-white px-3 py-1.5 rounded-full" style={{ background: THEME_COLORS.secondary }}>COPIL</span>
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
                style={{ background: THEME_COLORS.primary }}
              >
                <Download className="w-4 h-4" />
                Exporter PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Executive Summary */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Avancement', value: metrics.avancement, suffix: '%', trend: trendVariation, color: THEME_COLORS.primary },
            { label: 'Actions', value: metrics.actionsTerminees, total: metrics.total, color: THEME_COLORS.secondary },
            { label: 'Jalons', value: metrics.jalonsAtteints, total: metrics.jalonsTotal, color: THEME_COLORS.info },
            { label: 'Occupation', value: metrics.occupation, suffix: '%', color: THEME_COLORS.accent },
            { label: 'Budget', value: metrics.budgetConsomme, suffix: '%', color: THEME_COLORS.warning },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: item.color }}>{item.label}</span>
                {item.trend !== undefined && item.trend !== 0 && (
                  <span className={cn(
                    'flex items-center gap-0.5 text-xs font-medium',
                    item.trend > 0 ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {item.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(item.trend).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-semibold text-slate-900">
                    <AnimatedNumber value={item.value} />
                  </span>
                  {item.suffix && <span className="text-lg text-slate-400">{item.suffix}</span>}
                  {item.total && <span className="text-sm text-slate-400 ml-1">/{item.total}</span>}
                </div>
                <DonutChart value={item.total ? (item.value / item.total) * 100 : item.value} size={48} strokeWidth={5} color={item.color} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Synchronisation */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold" style={{ color: THEME_COLORS.primary }}>Synchronisation Projet / Mobilisation</h2>
              <span className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full',
                Math.abs(syncGap) <= SEUILS_SYNC_REPORT.synchronise ? 'bg-emerald-50 text-emerald-600' :
                Math.abs(syncGap) <= SEUILS_SYNC_REPORT.attention ? 'bg-amber-50 text-amber-600' :
                'bg-rose-50 text-rose-600'
              )}>
                {Math.abs(syncGap) <= SEUILS_SYNC_REPORT.synchronise ? 'Synchronisé' : Math.abs(syncGap) <= SEUILS_SYNC_REPORT.attention ? 'Attention' : 'Écart critique'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6 items-center">
              <div className="text-center">
                <DonutChart value={projectProgress} size={100} strokeWidth={10} color={THEME_COLORS.primary} />
                <p className="text-sm font-medium text-slate-600 mt-3">Construction</p>
              </div>

              <div className="flex flex-col items-center">
                <div className={cn(
                  'text-3xl font-bold',
                  Math.abs(syncGap) <= SEUILS_SYNC_REPORT.synchronise ? 'text-emerald-600' :
                  Math.abs(syncGap) <= SEUILS_SYNC_REPORT.attention ? 'text-amber-600' : 'text-rose-600'
                )}>
                  {syncGap > 0 ? '+' : ''}{syncGap}%
                </div>
                <p className="text-sm text-slate-400 mt-1">Écart</p>
                <p className="text-xs text-slate-400 mt-2">~{Math.abs(Math.round(syncGap * SEUILS_SYNC_REPORT.joursConversion))} jours</p>
              </div>

              <div className="text-center">
                <DonutChart value={mobilizationProgress} size={100} strokeWidth={10} color={THEME_COLORS.secondary} />
                <p className="text-sm font-medium text-slate-600 mt-3">Mobilisation</p>
              </div>
            </div>
          </div>

          {/* Alertes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold mb-5" style={{ color: THEME_COLORS.primary }}>Points d'attention</h2>
            <div className="space-y-4">
              {[
                { label: 'Actions en retard', value: metrics.actionsEnRetard, max: SEUILS_UI.topActions },
                { label: 'Risques critiques', value: metrics.risquesCritiques, max: SEUILS_UI.topRisques },
                { label: 'Budget consommé', value: metrics.budgetConsomme, max: 100, suffix: '%' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {item.value}{item.suffix}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        item.value / item.max > 0.8 ? 'bg-rose-500' :
                        item.value / item.max > 0.5 ? 'bg-amber-500' : ''
                      )}
                      style={item.value / item.max <= 0.5 ? { background: THEME_COLORS.primary } : undefined}
                      style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avancement par axe */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold mb-6" style={{ color: THEME_COLORS.primary }}>Avancement par axe stratégique</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {axeStats.map((item, idx) => (
              <div key={idx} className="text-center">
                <DonutChart value={item.pct} size={72} strokeWidth={6} color={item.axe.color} />
                <p className="text-sm font-medium mt-3" style={{ color: item.axe.color }}>{item.axe.labelCourt || item.axe.label}</p>
                <p className="text-xs text-slate-400">{item.termine}/{item.total} actions</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risques + Plan M+1 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Risques */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: THEME_COLORS.danger }}>Risques majeurs</h2>
              <span className="text-xs text-slate-400">{metrics.risquesTotal} actifs</span>
            </div>
            <div className="space-y-3">
              {topRisques.length > 0 ? topRisques.map((risque, idx) => {
                const score = risque.score || (risque.probabilite || 0) * (risque.impact || 0);
                const axe = axesList.find(a => a.code === risque.axe);

                return (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                      score >= SEUILS_RISQUES.critique ? 'bg-rose-100 text-rose-700' :
                      score >= SEUILS_RISQUES.majeur ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-200 text-slate-600'
                    )}>
                      {score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{risque.titre}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{axe?.labelCourt} • P{risque.probabilite} × I{risque.impact}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-sm text-slate-400">
                  Aucun risque majeur
                </div>
              )}
            </div>
          </div>

          {/* Plan M+1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: THEME_COLORS.primary }}>Plan d'action M+1</h2>
              <span className="text-xs text-slate-400">{actionsPrioritaires.length} prioritaires</span>
            </div>
            <div className="space-y-3">
              {actionsPrioritaires.length > 0 ? actionsPrioritaires.map((action, idx) => {
                const axe = axesList.find(a => a.code === action.axe);
                const priorityDot = action.priorite === 'critique' ? 'bg-rose-400' :
                  action.priorite === 'haute' ? 'bg-amber-400' : 'bg-blue-400';

                return (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', priorityDot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{action.titre}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span>{axe?.labelCourt}</span>
                        <span>•</span>
                        <span>{action.date_fin_prevue && new Date(action.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                        {action.responsable && (
                          <>
                            <span>•</span>
                            <span>{action.responsable}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-sm text-slate-400">
                  Aucune action prioritaire planifiée
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Budget Section */}
        {budgetSynthese.prevu > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold mb-6" style={{ color: THEME_COLORS.primary }}>Exécution budgétaire</h2>
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Budget prévu', value: budgetSynthese.prevu, color: THEME_COLORS.primary },
                { label: 'Engagé', value: budgetSynthese.engage, color: THEME_COLORS.secondary },
                { label: 'Réalisé', value: budgetSynthese.realise, color: THEME_COLORS.accent },
                { label: 'Reste à engager', value: budgetSynthese.ecartEngagement, color: THEME_COLORS.warning },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm text-slate-500">{item.label}</span>
                  </div>
                  <p className="text-xl font-semibold text-slate-900">{formatBudget(item.value)} <span className="text-sm text-slate-400">FCFA</span></p>
                </div>
              ))}
            </div>
            <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full" style={{ width: `${budgetSynthese.tauxRealisation}%`, background: THEME_COLORS.accent }} />
              <div className="h-full" style={{ width: `${Math.max(0, budgetSynthese.tauxEngagement - budgetSynthese.tauxRealisation)}%`, background: THEME_COLORS.secondary }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
              <span>0%</span>
              <span>Réalisé {budgetSynthese.tauxRealisation.toFixed(0)}% • Engagé {budgetSynthese.tauxEngagement.toFixed(0)}%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Notes manuelles */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-semibold" style={{ color: THEME_COLORS.primary }}>Notes & Commentaires COPIL</h2>
            </div>
            <button
              onClick={handleSaveNotes}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
                notesSaved
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Save className="w-4 h-4" />
              {notesSaved ? 'Enregistré' : 'Enregistrer'}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ajoutez vos notes, décisions prises, points de vigilance ou commentaires pour ce COPIL..."
            className="w-full h-40 p-4 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400"
            style={{ '--tw-ring-color': THEME_COLORS.primary } as React.CSSProperties}
          />
        </div>

        {/* Footer */}
        <div className="pt-4 border-t-2" style={{ borderColor: THEME_COLORS.primary }}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <p>Généré le {today.toLocaleDateString('fr-FR')} à {today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p style={{ color: THEME_COLORS.primary, fontWeight: 600 }}>COCKPIT v2.0 — Cosmos Angré</p>
            <p>CRMC / New Heaven SA • Format COPIL</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyReport;
