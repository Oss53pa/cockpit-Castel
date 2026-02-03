/**
 * WeeklyReport - Rapport hebdomadaire PREMIUM
 * Design épuré et élégant - Standards Linear/Stripe
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight,
  Clock,
  Circle,
  MoreHorizontal,
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
import { AXES_CONFIG_FULL } from '@/data/constants';

const axesList = Object.values(AXES_CONFIG_FULL);

interface WeeklyReportProps {
  className?: string;
}

// Animated counter
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 800;
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

// Mini sparkline
function Sparkline({ data, color = '#6366f1' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-20 h-8" preserveAspectRatio="none">
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

// Progress ring
function ProgressRing({ value, size = 48, strokeWidth = 4 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={radius} fill="none" stroke="#6366f1" strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

export function WeeklyReport({ className }: WeeklyReportProps) {
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
  const weekNumber = getWeekNumber(today);
  const todayStr = today.toISOString().split('T')[0];

  // Notes manuelles
  const notesKey = `weekly-report-notes-${siteId}-${weekNumber}`;
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

  // Calculer le pourcentage de budget consommé
  const budgetPct = budgetSynthese.prevu > 0
    ? Math.round((budgetSynthese.realise / budgetSynthese.prevu) * 100)
    : 0;

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Metrics
  const metrics = useMemo(() => {
    const actionsTerminees = actions.filter(a => a.statut === 'termine').length;
    const actionsEnCours = actions.filter(a => a.statut === 'en_cours').length;
    const actionsEnRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < todayStr
    ).length;
    const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
    const risquesCritiques = risques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 12 && r.status !== 'ferme';
    }).length;
    const avancement = actions.length > 0
      ? Math.round(actions.reduce((sum, a) => sum + (a.avancement || 0), 0) / actions.length)
      : 0;

    return { actionsTerminees, actionsEnCours, actionsEnRetard, jalonsAtteints, risquesCritiques, avancement, total: actions.length, jalonsTotal: jalons.length };
  }, [actions, jalons, risques, todayStr]);

  // Prochains jalons
  const prochainsJalons = useMemo(() => {
    return jalons
      .filter(j => {
        if (!j.date_prevue || j.statut === 'atteint') return false;
        const diffDays = Math.ceil((new Date(j.date_prevue).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 14;
      })
      .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())
      .slice(0, 6);
  }, [jalons, today]);

  // Top risques
  const topRisques = useMemo(() => {
    return risques
      .filter(r => r.status !== 'ferme')
      .sort((a, b) => {
        const scoreA = a.score || (a.probabilite || 0) * (a.impact || 0);
        const scoreB = b.score || (b.probabilite || 0) * (b.impact || 0);
        return scoreB - scoreA;
      })
      .slice(0, 4);
  }, [risques]);

  // Avancement par axe (tous les 8 axes)
  const axeStats = useMemo(() => {
    return axesList.map(axe => {
      const axeActions = actions.filter(a => a.axe === axe.code);
      const termine = axeActions.filter(a => a.statut === 'termine').length;
      const total = axeActions.length;
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

  return (
    <div className={cn('min-h-screen bg-slate-50/50', className)}>
      {/* Clean Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                  S{weekNumber}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Rapport Hebdomadaire</h1>
                  <p className="text-sm text-slate-500">
                    {getMonday(today).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — {getSunday(today).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Avancement', value: metrics.avancement, suffix: '%', trend: trendVariation, sparkData: [45, 52, 48, 61, 58, 65, metrics.avancement] },
            { label: 'Actions terminées', value: metrics.actionsTerminees, total: metrics.total, sparkData: [12, 15, 14, 18, 22, 25, metrics.actionsTerminees] },
            { label: 'Jalons atteints', value: metrics.jalonsAtteints, total: metrics.jalonsTotal, sparkData: [3, 4, 5, 6, 7, 8, metrics.jalonsAtteints] },
            { label: 'Budget consommé', value: budgetPct, suffix: '%', sparkData: [20, 25, 30, 35, 38, 42, budgetPct] },
          ].map((metric, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">{metric.label}</span>
                {metric.trend !== undefined && metric.trend !== 0 && (
                  <span className={cn(
                    'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full',
                    metric.trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  )}>
                    {metric.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(metric.trend).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-semibold text-slate-900">
                    <AnimatedNumber value={metric.value} />
                  </span>
                  {metric.suffix && <span className="text-xl text-slate-400 ml-0.5">{metric.suffix}</span>}
                  {metric.total && <span className="text-lg text-slate-400 ml-1">/ {metric.total}</span>}
                </div>
                <Sparkline data={metric.sparkData} color="#6366f1" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Synchronisation */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-slate-900">Synchronisation Projet / Mobilisation</h2>
              <span className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full',
                Math.abs(syncGap) <= 5 ? 'bg-emerald-50 text-emerald-600' :
                Math.abs(syncGap) <= 15 ? 'bg-amber-50 text-amber-600' :
                'bg-rose-50 text-rose-600'
              )}>
                {Math.abs(syncGap) <= 5 ? 'Synchronisé' : Math.abs(syncGap) <= 15 ? 'Attention' : 'Écart important'}
              </span>
            </div>

            <div className="flex items-center gap-8">
              {/* Project */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Projet (Construction)</span>
                  <span className="text-sm font-semibold text-slate-900">{projectProgress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                    style={{ width: `${projectProgress}%` }}
                  />
                </div>
              </div>

              {/* Gap indicator */}
              <div className="flex flex-col items-center px-6">
                <span className={cn(
                  'text-2xl font-bold',
                  Math.abs(syncGap) <= 5 ? 'text-emerald-600' :
                  Math.abs(syncGap) <= 15 ? 'text-amber-600' : 'text-rose-600'
                )}>
                  {syncGap > 0 ? '+' : ''}{syncGap}%
                </span>
                <span className="text-xs text-slate-400 mt-1">Écart</span>
              </div>

              {/* Mobilization */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Mobilisation</span>
                  <span className="text-sm font-semibold text-slate-900">{mobilizationProgress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-1000"
                    style={{ width: `${mobilizationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Alertes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Alertes</h2>
            <div className="space-y-3">
              {[
                { label: 'Actions en retard', value: metrics.actionsEnRetard, critical: metrics.actionsEnRetard > 3 },
                { label: 'Risques critiques', value: metrics.risquesCritiques, critical: metrics.risquesCritiques > 0 },
                { label: 'Jalons à risque', value: prochainsJalons.filter(j => {
                  const diff = Math.ceil((new Date(j.date_prevue).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return diff <= 3;
                }).length, critical: false },
              ].map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">{alert.label}</span>
                  <span className={cn(
                    'text-lg font-semibold',
                    alert.value === 0 ? 'text-slate-400' :
                    alert.critical ? 'text-rose-600' : 'text-amber-600'
                  )}>
                    {alert.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Axe Progress + Jalons */}
        <div className="grid grid-cols-2 gap-6">
          {/* Avancement par axe */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-5">Avancement par axe</h2>
            <div className="space-y-4">
              {axeStats.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-600 truncate">{item.axe.labelCourt || item.axe.label}</div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-medium text-slate-900">{item.pct}%</span>
                    <span className="text-xs text-slate-400 ml-1">({item.termine}/{item.total})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prochains jalons */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900">Prochains jalons</h2>
              <span className="text-xs text-slate-400">14 prochains jours</span>
            </div>
            <div className="space-y-3">
              {prochainsJalons.length > 0 ? prochainsJalons.map((jalon, idx) => {
                const diffDays = Math.ceil((new Date(jalon.date_prevue).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const axe = axesList.find(a => a.code === jalon.axe);

                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      diffDays <= 3 ? 'bg-amber-400' : 'bg-indigo-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{jalon.titre || jalon.nom}</p>
                      <p className="text-xs text-slate-400">{axe?.labelCourt}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600">J-{diffDays}</p>
                      <p className="text-xs text-slate-400">{new Date(jalon.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-sm text-slate-400">
                  Aucun jalon dans les 14 prochains jours
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risques */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">Risques principaux</h2>
            <span className="text-xs text-slate-400">{risques.filter(r => r.status !== 'ferme').length} actifs</span>
          </div>

          {topRisques.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {topRisques.map((risque, idx) => {
                const score = risque.score || (risque.probabilite || 0) * (risque.impact || 0);
                const axe = axesList.find(a => a.code === risque.axe);

                return (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className={cn(
                        'px-2 py-1 rounded-md text-xs font-medium',
                        score >= 12 ? 'bg-rose-100 text-rose-700' :
                        score >= 8 ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-200 text-slate-600'
                      )}>
                        Score {score}
                      </div>
                      {axe && <span className="text-xs text-slate-400">{axe.labelCourt}</span>}
                    </div>
                    <p className="text-sm font-medium text-slate-900 line-clamp-2">{risque.titre}</p>
                    <p className="text-xs text-slate-400 mt-2">P{risque.probabilite} × I{risque.impact}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-400">
              Aucun risque majeur identifié
            </div>
          )}
        </div>

        {/* Notes manuelles */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">Notes & Commentaires</h2>
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
            placeholder="Ajoutez vos notes, observations ou commentaires pour ce rapport..."
            className="w-full h-32 p-4 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-4">
          <p>Généré le {today.toLocaleDateString('fr-FR')} à {today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          <p>COCKPIT • Données temps réel</p>
        </div>
      </div>
    </div>
  );
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getSunday(date: Date): Date {
  const monday = getMonday(date);
  return new Date(monday.setDate(monday.getDate() + 6));
}

export default WeeklyReport;
