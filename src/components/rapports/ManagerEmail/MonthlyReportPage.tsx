// ============================================================================
// PAGE - Rapport Mensuel Détaillé (Design Premium)
// URL: /rapport/mensuel/:mois-annee
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
  Calendar,
  Building2,
  Clock,
  Target,
  Users,
  AlertTriangle,
  CheckCircle2,
  Flag,
  ClipboardList,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Download,
} from 'lucide-react';
import { useMonthlyReport, MOIS_FR, AXE_LABELS } from './hooks/useMonthlyReport';
import { THEME_COLORS, AXES_CONFIG_FULL } from '@/data/constants';
import type { Action, Jalon } from '@/types';

// ============================================================================
// HELPERS
// ============================================================================

function parseMonthParam(param: string | undefined): { mois: number; annee: number } {
  if (!param) {
    const now = new Date();
    return { mois: now.getMonth(), annee: now.getFullYear() };
  }
  const parts = param.split('-');
  if (parts.length === 2) {
    const annee = parseInt(parts[0], 10);
    const mois = parseInt(parts[1], 10) - 1;
    if (!isNaN(annee) && !isNaN(mois) && mois >= 0 && mois <= 11) {
      return { mois, annee };
    }
  }
  const now = new Date();
  return { mois: now.getMonth(), annee: now.getFullYear() };
}

function formatMonthParam(mois: number, annee: number): string {
  return `${annee}-${String(mois + 1).padStart(2, '0')}`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

function getActionStatus(action: Action): { label: string; color: string; bg: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (action.statut === 'termine' || (action.avancement || 0) >= 100) {
    return { label: 'Terminée', color: 'text-emerald-700', bg: 'bg-emerald-50' };
  }
  if (action.date_fin_prevue && new Date(action.date_fin_prevue) < today) {
    return { label: 'En retard', color: 'text-red-700', bg: 'bg-red-50' };
  }
  return { label: 'En cours', color: 'text-blue-700', bg: 'bg-blue-50' };
}

// Couleurs alignées sur AXES_CONFIG_FULL
const AXE_COLORS: Record<string, { gradient: string; light: string; text: string; border: string }> = {
  'axe1_rh': { gradient: 'from-red-500 to-red-600', light: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },           // #EF4444
  'axe2_commercial': { gradient: 'from-blue-500 to-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },  // #3B82F6
  'axe3_technique': { gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' }, // #8B5CF6
  'axe4_budget': { gradient: 'from-amber-500 to-amber-600', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },  // #F59E0B
  'axe5_marketing': { gradient: 'from-pink-500 to-pink-600', light: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },    // #EC4899
  'axe6_exploitation': { gradient: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }, // #10B981
  'axe8_divers': { gradient: 'from-gray-500 to-gray-600', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },       // #6B7280
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function MonthlyReportPage() {
  const { mois: moisParam } = useParams<{ mois: string }>();
  const navigate = useNavigate();
  const { mois, annee } = parseMonthParam(moisParam);
  const data = useMonthlyReport(mois, annee);

  const [filtreAxe, setFiltreAxe] = useState<string>('');
  const [filtreResponsable, setFiltreResponsable] = useState<string>('');
  const [expandedAxes, setExpandedAxes] = useState<Set<string>>(new Set(Object.keys(AXE_LABELS)));

  const responsables = useMemo(() => {
    const set = new Set<string>();
    data.actionsduMois.forEach((a) => a.responsable && set.add(a.responsable));
    data.jalonsduMois.forEach((j) => j.responsable && set.add(j.responsable));
    return Array.from(set).sort();
  }, [data.actionsduMois, data.jalonsduMois]);

  const goToPreviousMonth = () => {
    let newMois = mois - 1, newAnnee = annee;
    if (newMois < 0) { newMois = 11; newAnnee -= 1; }
    navigate(`/rapport/mensuel/${formatMonthParam(newMois, newAnnee)}`);
  };

  const goToNextMonth = () => {
    let newMois = mois + 1, newAnnee = annee;
    if (newMois > 11) { newMois = 0; newAnnee += 1; }
    navigate(`/rapport/mensuel/${formatMonthParam(newMois, newAnnee)}`);
  };

  const toggleAxe = (axe: string) => {
    setExpandedAxes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(axe)) newSet.delete(axe);
      else newSet.add(axe);
      return newSet;
    });
  };

  if (data.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse" />
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-lg font-semibold text-slate-800">Chargement du rapport</p>
          <p className="text-slate-500 text-sm">{data.periodeLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* ====== HEADER ====== */}
      <header className="text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, #1a365d 50%, #2d5a8e 100%)` }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-7xl mx-auto px-6 py-10 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium tracking-wider uppercase mb-2" style={{ color: THEME_COLORS.secondary }}>
                COCKPIT — Cosmos Angré
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Rappel des Actions
              </h1>
              <div className="flex items-center gap-4 text-slate-300">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {data.projectName}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="font-semibold" style={{ color: THEME_COLORS.secondary }}>J-{data.joursRestants}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-white/10 backdrop-blur rounded-xl px-6 py-3 text-center">
                <p className="text-2xl font-bold">{data.periodeLabel}</p>
                <p className="text-xs text-slate-400">Période du rapport</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ====== NAVIGATION & FILTRES ====== */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Navigation mois */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button onClick={goToPreviousMonth} className="p-2 hover:bg-white rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <span className="px-4 font-semibold text-slate-800 min-w-[160px] text-center">
                {data.periodeLabel}
              </span>
              <button onClick={goToNextMonth} className="p-2 hover:bg-white rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Filtres */}
            <div className="flex items-center gap-3">
              <select
                value={filtreAxe}
                onChange={(e) => setFiltreAxe(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les axes</option>
                {Object.entries(AXE_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              <select
                value={filtreResponsable}
                onChange={(e) => setFiltreResponsable(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les responsables</option>
                {responsables.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {(filtreAxe || filtreResponsable) && (
                <button
                  onClick={() => { setFiltreAxe(''); setFiltreResponsable(''); }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====== CONTENU ====== */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* === KPIs === */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Actions du mois', value: data.stats.totalActions, icon: ClipboardList, color: THEME_COLORS.primary, light: 'bg-blue-50', iconColor: 'text-blue-700' },
            { label: 'Jalons du mois', value: data.stats.totalJalons, icon: Flag, color: THEME_COLORS.info, light: 'bg-blue-50', iconColor: 'text-blue-600' },
            { label: 'En retard', value: data.stats.actionsEnRetard, icon: AlertTriangle, color: data.stats.actionsEnRetard > 0 ? THEME_COLORS.danger : THEME_COLORS.accent, light: data.stats.actionsEnRetard > 0 ? 'bg-red-50' : 'bg-emerald-50', iconColor: data.stats.actionsEnRetard > 0 ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Terminées', value: data.stats.actionsTerminees, icon: CheckCircle2, color: THEME_COLORS.accent, light: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-1" style={{ background: kpi.color }} />
              <div className="p-5">
                <div className={`w-12 h-12 ${kpi.light} rounded-xl flex items-center justify-center mb-4`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-sm text-slate-500 mt-1">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* === ACTIONS PAR AXE === */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Actions par Axe
            </h2>
            <div className="flex gap-2 text-sm">
              <button onClick={() => setExpandedAxes(new Set(Object.keys(AXE_LABELS)))} className="text-blue-600 hover:text-blue-800">
                Tout déplier
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => setExpandedAxes(new Set())} className="text-blue-600 hover:text-blue-800">
                Tout replier
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(AXE_LABELS).map(([axeCode, axeLabel]) => {
              if (filtreAxe && filtreAxe !== axeCode) return null;
              const colors = AXE_COLORS[axeCode] || AXE_COLORS['axe6_exploitation'];
              const actions = (data.actionsByAxe[axeCode] || []).filter(a => !filtreResponsable || a.responsable === filtreResponsable);
              const isExpanded = expandedAxes.has(axeCode);

              return (
                <div key={axeCode} className={`bg-white rounded-2xl shadow-sm border ${colors.border} overflow-hidden`}>
                  <button
                    onClick={() => toggleAxe(axeCode)}
                    className={`w-full flex items-center justify-between p-4 ${colors.light} hover:opacity-90 transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                        {axeCode.charAt(3)}
                      </div>
                      <span className={`font-semibold ${colors.text}`}>{axeLabel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.light} ${colors.text} border ${colors.border}`}>
                        {actions.length} action{actions.length > 1 ? 's' : ''}
                      </span>
                      <ChevronDown className={`w-5 h-5 ${colors.text} transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && actions.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="text-left p-4 font-semibold">Action</th>
                            <th className="text-left p-4 font-semibold w-36">Responsable</th>
                            <th className="text-center p-4 font-semibold w-24">Échéance</th>
                            <th className="text-left p-4 font-semibold w-40">Avancement</th>
                            <th className="text-center p-4 font-semibold w-28">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {actions.map((action) => {
                            const status = getActionStatus(action);
                            const progress = action.avancement || 0;
                            return (
                              <tr key={action.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                  <span className="font-medium text-slate-900">{action.titre}</span>
                                  {action.code && <span className="ml-2 text-xs text-slate-400">({action.code})</span>}
                                </td>
                                <td className="p-4 text-sm text-slate-600">{action.responsable || '-'}</td>
                                <td className="p-4 text-center text-sm text-slate-600">{formatDate(action.date_fin_prevue)}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                        style={{ width: `${Math.min(100, progress)}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 w-10">{progress}%</span>
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                    {status.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {isExpanded && actions.length === 0 && (
                    <div className="p-8 text-center text-slate-400">Aucune action ce mois-ci</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* === JALONS === */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Flag className="w-5 h-5 text-purple-600" />
            Jalons du Mois
            <span className="text-sm font-normal text-slate-500">({data.jalonsduMois.length})</span>
          </h2>

          {data.jalonsduMois.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <Flag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">Aucun jalon prévu ce mois-ci</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="text-left p-4 font-semibold">Jalon</th>
                    <th className="text-left p-4 font-semibold w-36">Axe</th>
                    <th className="text-left p-4 font-semibold w-36">Responsable</th>
                    <th className="text-center p-4 font-semibold w-28">Date</th>
                    <th className="text-center p-4 font-semibold w-28">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.jalonsduMois
                    .filter(j => (!filtreAxe || j.axe === filtreAxe) && (!filtreResponsable || j.responsable === filtreResponsable))
                    .map((jalon) => {
                      const axeColors = AXE_COLORS[jalon.axe] || AXE_COLORS['axe6_exploitation'];
                      const isAtteint = jalon.statut === 'atteint';
                      const isEnRetard = !isAtteint && jalon.date_prevue && new Date(jalon.date_prevue) < new Date();
                      return (
                        <tr key={jalon.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg ${axeColors.light} flex items-center justify-center`}>
                                <Flag className={`w-4 h-4 ${axeColors.text}`} />
                              </div>
                              <span className="font-medium text-slate-900">{jalon.titre}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${axeColors.light} ${axeColors.text}`}>
                              {AXE_LABELS[jalon.axe]?.replace(/^AXE \d+ - /, '')}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-600">{jalon.responsable || '-'}</td>
                          <td className="p-4 text-center text-sm font-medium text-slate-700">{formatDate(jalon.date_prevue)}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              isAtteint ? 'bg-emerald-50 text-emerald-700' :
                              isEnRetard ? 'bg-red-50 text-red-700' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {isAtteint ? 'Atteint' : isEnRetard ? 'En retard' : 'À venir'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* === RÉCAP PAR RESPONSABLE === */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            Par Responsable
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left p-4 font-semibold">Responsable</th>
                  <th className="text-center p-4 font-semibold w-28">Actions</th>
                  <th className="text-center p-4 font-semibold w-28">En retard</th>
                  <th className="text-center p-4 font-semibold w-28">Jalons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recapParResponsable.map((resp) => (
                  <tr
                    key={resp.id}
                    onClick={() => setFiltreResponsable(filtreResponsable === resp.nom ? '' : resp.nom)}
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${filtreResponsable === resp.nom ? 'bg-blue-50' : ''}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          filtreResponsable === resp.nom ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {resp.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{resp.nom}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-semibold">
                        {resp.actions}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-semibold ${
                        resp.actionsEnRetard > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {resp.actionsEnRetard}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-semibold">
                        {resp.jalons}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="bg-slate-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold">COCKPIT Project Management</p>
              <p className="text-slate-400 text-sm">
                Rapport généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <p className="text-slate-500 text-sm">{data.projectName}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MonthlyReportPage;
