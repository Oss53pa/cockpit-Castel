import { useState, useMemo, useRef } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  Users,
  Building2,
  Wrench,
  DollarSign,
  Megaphone,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Calendar,
  Shield,
  Target,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Printer,
  RefreshCw,
  Eye,
  Globe,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Copy,
  Share2,
  CircleDot,
  Loader2,
  Link2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';

// Hooks pour données réelles
import {
  useDashboardKPIs,
  useActions,
  useJalons,
  useBudgetSynthese,
  useBudgetParAxe,
  useRisques,
  useSyncStatus,
  useSyncStats,
  useCurrentSiteId,
  useCurrentSite,
  useSites,
  useAvancementParAxe,
  useUsers,
} from '@/hooks';

// Types et utilitaires uniquement (pas de données)
import { AXE_LABELS, AXE_SHORT_LABELS, JALON_STATUS_LABELS } from '@/types';
import type { Action, Jalon, Risque } from '@/types';

// Utilitaires de formatage
function formatMontantFCFA(montant: number): string {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Md`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(0)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toLocaleString('fr-FR');
}

function getStatutIcon(statut: string): string {
  switch (statut) {
    case 'a_venir': case 'planifie': return '📅';
    case 'en_cours': case 'en_approche': return '🔄';
    case 'termine': case 'atteint': return '✅';
    case 'en_retard': case 'en_danger': case 'depasse': return '⚠️';
    case 'bloque': return '🚫';
    default: return '📋';
  }
}

// Import constantes centralisées
import { AXES_CONFIG_FULL, PROJET_CONFIG } from '@/data/constants';
import { BATIMENTS_CONFIG, TOTAL_GLA } from '@/types';

// Types
type MeteoType = 'soleil' | 'soleil_nuage' | 'nuage' | 'pluie';
type AxeType = 'rh' | 'commercial' | 'technique' | 'budget' | 'marketing' | 'exploitation' | 'construction' | 'divers';

// Icônes locales pour les axes (UI-specific)
const AXES_ICONS: Record<AxeType, React.ElementType> = {
  rh: Users,
  commercial: Building2,
  technique: Wrench,
  budget: DollarSign,
  marketing: Megaphone,
  exploitation: Settings,
  construction: Building2,
  divers: Target,
};

// Génère AXES_CONFIG à partir de AXES_CONFIG_FULL + icônes locales
const AXES_CONFIG: Record<AxeType, { label: string; icon: React.ElementType; color: string; bgColor: string; dbCode: string }> = {
  rh: { label: AXES_CONFIG_FULL.rh.label, icon: AXES_ICONS.rh, color: 'text-slate-700', bgColor: 'bg-slate-100', dbCode: AXES_CONFIG_FULL.rh.code },
  commercial: { label: AXES_CONFIG_FULL.commercialisation.label, icon: AXES_ICONS.commercial, color: 'text-slate-700', bgColor: 'bg-slate-100', dbCode: AXES_CONFIG_FULL.commercialisation.code },
  technique: { label: AXES_CONFIG_FULL.technique.label, icon: AXES_ICONS.technique, color: 'text-slate-700', bgColor: 'bg-slate-100', dbCode: AXES_CONFIG_FULL.technique.code },
  budget: { label: AXES_CONFIG_FULL.budget.label, icon: AXES_ICONS.budget, color: 'text-slate-700', bgColor: 'bg-slate-100', dbCode: AXES_CONFIG_FULL.budget.code },
  marketing: { label: AXES_CONFIG_FULL.marketing.label, icon: AXES_ICONS.marketing, color: 'text-slate-700', bgColor: 'bg-slate-100', dbCode: AXES_CONFIG_FULL.marketing.code },
  exploitation: { label: AXES_CONFIG_FULL.exploitation.label, icon: AXES_ICONS.exploitation, color: 'text-slate-700', bgColor: 'bg-slate-100', dbCode: AXES_CONFIG_FULL.exploitation.code },
  construction: { label: 'Construction', icon: AXES_ICONS.construction, color: 'text-slate-700', bgColor: 'bg-slate-100', dbCode: 'axe7_construction' },
  divers: { label: AXES_CONFIG_FULL.divers.label, icon: AXES_ICONS.divers, color: 'text-slate-600', bgColor: 'bg-slate-50', dbCode: AXES_CONFIG_FULL.divers.code },
};

// Mapping axe vers code DB (utilise dbCode de AXES_CONFIG)
const axeToDbCode: Record<AxeType, string> = Object.fromEntries(
  Object.entries(AXES_CONFIG).map(([key, val]) => [key, val.dbCode])
) as Record<AxeType, string>;

// Configuration météo - Design Premium (monochrome subtil)
const METEO_CONFIG: Record<MeteoType, { icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  soleil: { icon: Sun, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  soleil_nuage: { icon: CloudSun, color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
  nuage: { icon: Cloud, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  pluie: { icon: CloudRain, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
};

// Composant Section Header - Design Premium
function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
      <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h3>
    </div>
  );
}

// Composant Météo Badge - Design Premium
function MeteoBadge({ meteo, statut }: { meteo: MeteoType; statut: string }) {
  const config = METEO_CONFIG[meteo];
  const Icon = config.icon;
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full border', config.bgColor, config.borderColor)}>
      <Icon className={cn('h-4 w-4', config.color)} />
      <span className={cn('text-sm font-medium', config.color)}>{statut}</span>
    </div>
  );
}

// Composant Météo Axe Dynamique - Design Premium avec barre de progression
function AxeMeteoBadge({ actions, jalons }: { actions: any[]; jalons: any[] }) {
  const meteoData = useMemo(() => {
    if (actions.length === 0 && jalons.length === 0) {
      return { meteo: 'soleil_nuage' as MeteoType, statut: 'À démarrer', progress: 0 };
    }

    const actionsTerminees = actions.filter(a => a.statut === 'termine').length;
    const actionsBloquees = actions.filter(a => a.statut === 'bloque').length;
    const actionsEnRetard = actions.filter(a => {
      if (a.statut === 'termine') return false;
      return a.date_fin_prevue && new Date(a.date_fin_prevue) < new Date();
    }).length;
    const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
    const jalonsEnDanger = jalons.filter(j => j.statut === 'en_danger' || j.statut === 'depasse').length;

    const tauxCompletion = actions.length > 0 ? (actionsTerminees / actions.length) * 100 : 0;
    const tauxJalons = jalons.length > 0 ? (jalonsAtteints / jalons.length) * 100 : 0;

    if (actionsBloquees > 0 || actionsEnRetard > 2 || jalonsEnDanger > 1) {
      return { meteo: 'pluie' as MeteoType, statut: `${actionsBloquees > 0 ? `${actionsBloquees} bloquée(s)` : `${actionsEnRetard} en retard`}`, progress: tauxCompletion };
    } else if (tauxCompletion < 30 || actionsEnRetard > 0 || jalonsEnDanger > 0) {
      return { meteo: 'nuage' as MeteoType, statut: `${Math.round(tauxCompletion)}% complété`, progress: tauxCompletion };
    } else if (tauxCompletion < 70 || tauxJalons < 50) {
      return { meteo: 'soleil_nuage' as MeteoType, statut: `${Math.round(tauxCompletion)}% complété`, progress: tauxCompletion };
    } else {
      return { meteo: 'soleil' as MeteoType, statut: `${Math.round(tauxCompletion)}% complété`, progress: tauxCompletion };
    }
  }, [actions, jalons]);

  const config = METEO_CONFIG[meteoData.meteo];
  const Icon = config.icon;

  return (
    <div className={cn('p-4 rounded-xl border bg-white', config.borderColor)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', config.color)} />
          <span className="text-sm font-medium text-slate-700">{meteoData.statut}</span>
        </div>
        <span className="text-lg font-semibold text-slate-900">{Math.round(meteoData.progress)}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all',
            meteoData.meteo === 'soleil' ? 'bg-emerald-500' :
            meteoData.meteo === 'soleil_nuage' ? 'bg-indigo-500' :
            meteoData.meteo === 'nuage' ? 'bg-amber-500' : 'bg-rose-500'
          )}
          style={{ width: `${meteoData.progress}%` }}
        />
      </div>
    </div>
  );
}

// Types pour Points d'Attention et Décisions Attendues
interface PointAttention {
  id: string;
  sujet: string;
  responsableId: number | null;
  responsableNom?: string;
  dateCreation: string;
  transmis?: boolean;
}

interface DecisionAttendue {
  id: string;
  sujet: string;
  dateCreation: string;
  transmis?: boolean;
}

// Composant Points d'Attention consolidés par axe
function PointsAttentionConsolides({ actions }: { actions: any[] }) {
  const pointsAttention = useMemo(() => {
    const points: (PointAttention & { actionTitre: string })[] = [];
    actions.forEach(action => {
      const pa = action.points_attention || [];
      pa.forEach((p: PointAttention) => {
        if (!p.transmis) { // Seulement les non-transmis
          points.push({ ...p, actionTitre: action.titre });
        }
      });
    });
    return points.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, [actions]);

  if (pointsAttention.length === 0) return null;

  return (
    <Card padding="md" className="border-amber-200 bg-amber-50/30">
      <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Points d'Attention ({pointsAttention.length})
      </h4>
      <div className="space-y-2">
        {pointsAttention.slice(0, 5).map((pa) => (
          <div key={pa.id} className="p-2 bg-white rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-slate-800">{pa.sujet}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-500 truncate max-w-[150px]" title={pa.actionTitre}>
                {pa.actionTitre}
              </span>
              {pa.responsableNom && (
                <span className="text-xs text-amber-600">{pa.responsableNom}</span>
              )}
            </div>
          </div>
        ))}
        {pointsAttention.length > 5 && (
          <p className="text-xs text-amber-600 text-center">+{pointsAttention.length - 5} autres points</p>
        )}
      </div>
    </Card>
  );
}

// Composant Décisions Attendues consolidées par axe
function DecisionsAttenduesConsolidees({ actions }: { actions: any[] }) {
  const decisionsAttendues = useMemo(() => {
    const decisions: (DecisionAttendue & { actionTitre: string })[] = [];
    actions.forEach(action => {
      const da = action.decisions_attendues || [];
      da.forEach((d: DecisionAttendue) => {
        if (!d.transmis) { // Seulement les non-transmises
          decisions.push({ ...d, actionTitre: action.titre });
        }
      });
    });
    return decisions.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, [actions]);

  if (decisionsAttendues.length === 0) return null;

  return (
    <Card padding="md" className="border-indigo-200 bg-indigo-50/30">
      <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        Décisions Attendues ({decisionsAttendues.length})
      </h4>
      <div className="space-y-2">
        {decisionsAttendues.slice(0, 5).map((da) => (
          <div key={da.id} className="p-2 bg-white rounded-lg border border-indigo-200">
            <p className="text-sm font-medium text-slate-800">{da.sujet}</p>
            <span className="text-xs text-slate-500 truncate block max-w-full" title={da.actionTitre}>
              {da.actionTitre}
            </span>
          </div>
        ))}
        {decisionsAttendues.length > 5 && (
          <p className="text-xs text-indigo-600 text-center">+{decisionsAttendues.length - 5} autres décisions</p>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// SLIDE 1 - RAPPEL PROJET & MÉTÉO GLOBALE
// ============================================================================
function SlideRappelProjet() {
  // Données réelles de la base de données
  const kpis = useDashboardKPIs();
  const jalons = useJalons();
  const actions = useActions();
  const currentSite = useCurrentSite();
  const allSites = useSites();

  // IMPORTANT: Utiliser les mêmes données que le dashboard pour l'avancement
  const avancementParAxe = useAvancementParAxe();

  // Données du site - TOUJOURS utiliser BATIMENTS_CONFIG comme source de vérité
  const siteData = useMemo(() => {
    const siteFromDb = allSites.find(s => s.actif && s.id === currentSite?.id)
                    || allSites.find(s => s.actif)
                    || allSites[0];

    // IMPORTANT: Nombre de bâtiments = TOUJOURS depuis BATIMENTS_CONFIG (source de vérité cockpit)
    const nombreBatiments = Object.keys(BATIMENTS_CONFIG).length; // = 6

    return {
      surfaceGLA: siteFromDb?.surface || TOTAL_GLA,
      nombreBatiments: nombreBatiments, // TOUJOURS 6 depuis BATIMENTS_CONFIG
      softOpening: siteFromDb?.dateOuverture ?? '',
      inauguration: siteFromDb?.dateInauguration ?? '',
      occupationCible: siteFromDb?.occupationCible ?? 85,
      nom: siteFromDb?.nom ?? 'Site non configuré',
    };
  }, [currentSite, allSites]);

  // Calcul des jalons atteints
  const jalonsAtteints = useMemo(() => {
    if (!jalons) return 0;
    return jalons.filter(j => j.statut === 'atteint').length;
  }, [jalons]);

  const jalonsTotal = jalons?.length || 0;

  // Calcul dynamique de la météo par axe basé sur les données du DASHBOARD
  const meteoParAxe = useMemo(() => {
    if (!actions || !jalons) return [];

    const axes: { code: string; key: AxeType; label: string }[] = [
      { code: 'axe1_rh', key: 'rh', label: 'RH & Organisation' },
      { code: 'axe2_commercial', key: 'commercial', label: 'Commercial & Leasing' },
      { code: 'axe3_technique', key: 'technique', label: 'Technique & Handover' },
      { code: 'axe4_budget', key: 'budget', label: 'Budget & Finances' },
      { code: 'axe5_marketing', key: 'marketing', label: 'Marketing & Communication' },
      { code: 'axe6_exploitation', key: 'exploitation', label: 'Exploitation & Juridique' },
    ];

    // Mapping des avancements depuis le dashboard (même source que le cockpit)
    const avancementMap: Record<string, number> = {};
    avancementParAxe.forEach(a => {
      avancementMap[a.axe] = Math.round(a.avancement);
    });

    return axes.map(axe => {
      const axeActions = actions!.filter(a => a.axe === axe.code);
      const axeJalons = jalons!.filter(j => j.axe === axe.code);

      const actionsTerminees = axeActions.filter(a => a.statut === 'termine').length;
      const actionsBloquees = axeActions.filter(a => a.statut === 'bloque').length;
      const actionsEnRetard = axeActions.filter(a => {
        if (a.statut === 'termine') return false;
        return a.date_fin_prevue && new Date(a.date_fin_prevue) < new Date();
      }).length;
      const jalonsEnDanger = axeJalons.filter(j => j.statut === 'en_danger' || j.statut === 'depasse').length;

      // IMPORTANT: Utiliser l'avancement moyen du dashboard (pas le % d'actions terminées)
      const avancement = avancementMap[axe.code] ?? 0;

      let meteo: MeteoType;
      let statut: string;

      if (axeActions.length === 0 && axeJalons.length === 0) {
        meteo = 'soleil_nuage';
        statut = 'À démarrer';
      } else if (actionsBloquees > 0 || actionsEnRetard > 2 || jalonsEnDanger > 1) {
        meteo = 'pluie';
        statut = actionsBloquees > 0 ? `${actionsBloquees} bloquée(s)` : `${actionsEnRetard} en retard`;
      } else if (avancement < 30 || actionsEnRetard > 0 || jalonsEnDanger > 0) {
        meteo = 'nuage';
        statut = actionsEnRetard > 0 ? `${actionsEnRetard} en retard` : `${avancement}% avancement`;
      } else if (avancement < 70) {
        meteo = 'soleil_nuage';
        statut = `En cours - ${avancement}%`;
      } else {
        meteo = 'soleil';
        statut = `${avancement}% complété`;
      }

      return { axe: axe.code, key: axe.key, label: axe.label, meteo, statut };
    });
  }, [actions, jalons, avancementParAxe]);

  // Calcul effectif depuis les actions RH
  const effectifCible = useMemo(() => {
    if (!actions) return 25; // Valeur par défaut
    // Estimer l'effectif cible basé sur la surface du site
    return siteData.surfaceGLA > 40000 ? 25 : 15;
  }, [actions, siteData.surfaceGLA]);

  return (
    <div className="space-y-6">
      {/* Info Projet - Données réelles du site */}
      <Card padding="md">
        <h3 className="text-lg font-bold text-primary-900 mb-4">Le Projet</h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Surface GLA</TableCell>
              <TableCell className="text-right">{siteData.surfaceGLA.toLocaleString()} m²</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Bâtiments</TableCell>
              <TableCell className="text-right">{siteData.nombreBatiments} bâtiments</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Soft Opening</TableCell>
              <TableCell className="text-right">{new Date(siteData.softOpening).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Inauguration</TableCell>
              <TableCell className="text-right">{new Date(siteData.inauguration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Occupation cible</TableCell>
              <TableCell className="text-right">≥ {siteData.occupationCible}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Météo par Axe - Design Premium */}
      <Card padding="md" className="border-slate-200">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Météo par Axe</h3>
        <div className="space-y-2">
          {meteoParAxe.map((item) => {
            const config = AXES_CONFIG[item.key];
            const meteoConfig = METEO_CONFIG[item.meteo];
            return (
              <div key={item.axe} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <config.icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <span className="font-medium text-slate-700 text-sm">{item.label}</span>
                </div>
                <MeteoBadge meteo={item.meteo} statut={item.statut} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* KPIs en temps réel - Design Premium */}
      <Card padding="md" className="bg-slate-50/50 border-slate-200">
        <h3 className="text-base font-semibold text-slate-800 mb-4">KPIs Temps Réel</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{(kpis?.tauxOccupation || 0).toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-1">Occupation</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{jalonsAtteints}/{jalonsTotal}</p>
            <p className="text-xs text-slate-500 mt-1">Jalons atteints</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{actions?.length || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Actions totales</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{kpis?.equipeTaille || effectifCible}</p>
            <p className="text-xs text-slate-500 mt-1">Effectif cible</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// SLIDE 2 - AGENDA
// ============================================================================
function SlideAgenda() {
  const agendaItems = [
    { num: 1, titre: 'Agenda', icon: FileText },
    { num: 2, titre: 'Rappel Projet & Météo Globale', icon: Target },
    { num: 3, titre: 'AXE RH & Organisation', icon: Users },
    { num: 4, titre: 'AXE Commercial & Leasing', icon: Building2 },
    { num: 5, titre: 'AXE Technique & Handover', icon: Wrench },
    { num: 6, titre: 'AXE Budget & Finances', icon: DollarSign },
    { num: 7, titre: 'AXE Marketing & Communication', icon: Megaphone },
    { num: 8, titre: 'AXE Exploitation & Juridique', icon: Settings },
    { num: 9, titre: 'Risques Majeurs', icon: AlertTriangle },
    { num: 10, titre: "Points d'Attention", icon: AlertTriangle },
    { num: 11, titre: 'Décisions Attendues', icon: CheckCircle },
  ];

  const midPoint = Math.ceil(agendaItems.length / 2);
  const leftColumn = agendaItems.slice(0, midPoint);
  const rightColumn = agendaItems.slice(midPoint);

  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="AGENDA" icon={FileText} />

      <div className="flex-1 grid grid-cols-2 gap-4 mt-2">
        {/* Colonne gauche */}
        <div className="space-y-2">
          {leftColumn.map((item) => (
            <div key={item.num} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {item.num}
              </div>
              <item.icon className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <span className="font-medium text-slate-700 text-sm">{item.titre}</span>
            </div>
          ))}
        </div>

        {/* Colonne droite */}
        <div className="space-y-2">
          {rightColumn.map((item) => (
            <div key={item.num} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {item.num}
              </div>
              <item.icon className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <span className="font-medium text-slate-700 text-sm">{item.titre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE 3 - AXE RH & ORGANISATION
// ============================================================================
function SlideAxeRH() {
  const actions = useActions();
  const jalons = useJalons();

  // Données réelles pour l'axe RH
  const actionsRH = useMemo(() => {
    if (!actions) return [];
    return actions.filter(a => a.axe === 'axe1_rh');
  }, [actions]);

  const jalonsRH = useMemo(() => {
    if (!jalons) return [];
    return jalons.filter(j => j.axe === 'axe1_rh');
  }, [jalons]);

  const actionsTerminees = actionsRH.filter(a => a.statut === 'termine').length;
  const avancement = actionsRH.length > 0
    ? Math.round(actionsRH.reduce((sum, a) => sum + (a.avancement || 0), 0) / actionsRH.length)
    : 0;

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE RH & ORGANISATION" icon={Users} />

      {/* Météo dynamique */}
      <AxeMeteoBadge actions={actionsRH} jalons={jalonsRH} />

      {/* Avancement temps réel - Design Premium */}
      <Card padding="md" className="border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3">Avancement</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{actionsRH.length}</p>
            <p className="text-xs text-slate-500">Actions</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-emerald-600">{actionsTerminees}</p>
            <p className="text-xs text-slate-500">Terminées</p>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-xl border border-indigo-200">
            <p className="text-xl font-bold text-indigo-600">{avancement}%</p>
            <p className="text-xs text-slate-500">Avancement</p>
          </div>
        </div>
      </Card>

      {/* Actions RH - données réelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Actions RH</h4>
        {actionsRH.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionsRH.slice(0, 8).map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="font-medium">{action.titre}</TableCell>
                  <TableCell>{action.responsable || '-'}</TableCell>
                  <TableCell>{action.date_fin_prevue ? new Date(action.date_fin_prevue).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell className="text-center">{getStatutIcon(action.statut)} {action.avancement}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucune action RH définie</p>
        )}
      </Card>

      {/* Jalons RH - données réelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Jalons RH</h4>
        {jalonsRH.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jalon</TableHead>
                <TableHead>Date cible</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jalonsRH.slice(0, 5).map((jalon) => (
                <TableRow key={jalon.id}>
                  <TableCell className="font-medium">{jalon.titre}</TableCell>
                  <TableCell>{jalon.date_prevue ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell className="text-center">{getStatutIcon(jalon.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucun jalon RH défini</p>
        )}
      </Card>

      {/* Points d'Attention et Décisions Attendues consolidés */}
      <PointsAttentionConsolides actions={actionsRH} />
      <DecisionsAttenduesConsolidees actions={actionsRH} />
    </div>
  );
}

// ============================================================================
// SLIDE 3 - AXE COMMERCIAL & LEASING
// ============================================================================
function SlideAxeCommercial() {
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();
  const kpis = useDashboardKPIs();

  const actionsCommerciales = useMemo(() => {
    if (!actions) return [];
    return actions.filter(a => a.axe === 'axe2_commercial');
  }, [actions]);

  const jalonsCommerciaux = useMemo(() => {
    if (!jalons) return [];
    return jalons.filter(j => j.axe === 'axe2_commercial');
  }, [jalons]);

  const risquesCommerciaux = useMemo(() => {
    if (!risques.data) return [];
    return risques.data.filter(r => r.axe === 'axe2_commercial');
  }, [risques.data]);

  const actionsTerminees = actionsCommerciales.filter(a => a.statut === 'termine').length;
  const tauxOccupationReel = kpis?.tauxOccupation || 0;
  const tauxCible = 85;

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE COMMERCIAL & LEASING" icon={Building2} />

      {/* Météo dynamique */}
      <AxeMeteoBadge actions={actionsCommerciales} jalons={jalonsCommerciaux} />

      {/* Jalons Clés */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Jalons Clés</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jalon</TableHead>
              <TableHead>Date cible</TableHead>
              <TableHead className="text-center">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jalonsCommerciaux.length > 0 ? (
              jalonsCommerciaux.slice(0, 5).map((jalon) => (
                <TableRow key={jalon.id}>
                  <TableCell className="font-medium">{jalon.titre}</TableCell>
                  <TableCell>{jalon.date_prevue ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell className="text-center">{getStatutIcon(jalon.statut)} {jalon.statut.replace('_', ' ')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-400 italic">Aucun jalon défini</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Données Temps Réel - Design Premium */}
      <Card padding="md" className="border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3">Indicateurs</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{actionsCommerciales.length}</p>
            <p className="text-xs text-slate-500">Actions</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-emerald-600">{actionsTerminees}</p>
            <p className="text-xs text-slate-500">Terminées</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{jalonsCommerciaux.length}</p>
            <p className="text-xs text-slate-500">Jalons</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{risquesCommerciaux.length}</p>
            <p className="text-xs text-slate-500">Risques</p>
          </div>
        </div>
      </Card>

      {/* KPI Occupation */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Taux d'Occupation</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${tauxOccupationReel >= tauxCible ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(tauxOccupationReel, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${tauxOccupationReel >= tauxCible ? 'text-green-600' : 'text-amber-600'}`}>
              {tauxOccupationReel.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-400 ml-2">/ {tauxCible}% cible</span>
          </div>
        </div>
      </Card>

      {/* Points d'Attention - données réelles depuis Cockpit */}
      <PointsAttentionConsolides actions={actionsCommerciales} />
      <DecisionsAttenduesConsolidees actions={actionsCommerciales} />
    </div>
  );
}

// ============================================================================
// SLIDE 4 - AXE TECHNIQUE & HANDOVER
// ============================================================================
function SlideAxeTechnique() {
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();

  const actionsTechniques = useMemo(() => {
    if (!actions) return [];
    return actions.filter(a => a.axe === 'axe3_technique');
  }, [actions]);

  const jalonsTechniques = useMemo(() => {
    if (!jalons) return [];
    return jalons.filter(j => j.axe === 'axe3_technique');
  }, [jalons]);

  const risquesTechniques = useMemo(() => {
    if (!risques.data) return [];
    return risques.data.filter(r => r.axe === 'axe3_technique');
  }, [risques.data]);

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE TECHNIQUE & HANDOVER" icon={Wrench} />

      {/* Météo dynamique */}
      <AxeMeteoBadge actions={actionsTechniques} jalons={jalonsTechniques} />

      {/* Jalons Techniques - données réelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Jalons Techniques</h4>
        {jalonsTechniques.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jalon</TableHead>
                <TableHead>Date cible</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jalonsTechniques.slice(0, 8).map((jalon) => (
                <TableRow key={jalon.id}>
                  <TableCell className="font-medium">{jalon.titre}</TableCell>
                  <TableCell>{jalon.date_prevue ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell className="text-center">{getStatutIcon(jalon.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucun jalon technique défini</p>
        )}
      </Card>

      {/* KPIs Techniques - Design Premium */}
      <Card padding="md" className="border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3">Indicateurs</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{actionsTechniques.length}</p>
            <p className="text-xs text-slate-500">Actions</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{jalonsTechniques.length}</p>
            <p className="text-xs text-slate-500">Jalons</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{risquesTechniques.length}</p>
            <p className="text-xs text-slate-500">Risques</p>
          </div>
        </div>
      </Card>

      {/* Points d'Attention - Actions en cours ou bloquées */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Points d'Attention</h4>
        {actionsTechniques.filter(a => a.statut !== 'termine').length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sujet</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionsTechniques
                .filter(a => a.statut !== 'termine')
                .slice(0, 5)
                .map((action) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium">{action.titre}</TableCell>
                    <TableCell>{action.responsable || '-'}</TableCell>
                    <TableCell>{getStatutIcon(action.statut)} {action.avancement}%</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucun point d'attention</p>
        )}
      </Card>

      {/* Risque Principal - Premier risque technique par criticité */}
      {risquesTechniques.length > 0 && (
        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Risque principal</p>
              <p className="text-sm text-slate-600 mt-1">
                {risquesTechniques[0].titre} — {risquesTechniques[0].mitigation || 'Mitigation à définir'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Points d'Attention et Décisions Attendues consolidés */}
      <PointsAttentionConsolides actions={actionsTechniques} />
      <DecisionsAttenduesConsolidees actions={actionsTechniques} />
    </div>
  );
}

// ============================================================================
// SLIDE 5 - AXE BUDGET & FINANCES
// ============================================================================
function SlideAxeBudget() {
  const budget = useBudgetSynthese();
  const budgetParAxe = useBudgetParAxe();
  const actions = useActions();
  const jalons = useJalons();

  const actionsBudget = useMemo(() => {
    if (!actions) return [];
    return actions.filter(a => a.axe === 'axe4_budget');
  }, [actions]);

  const jalonsBudget = useMemo(() => {
    if (!jalons) return [];
    return jalons.filter(j => j.axe === 'axe4_budget');
  }, [jalons]);

  // Calcul du budget total réel
  const budgetTotalPrevu = budget?.prevu || 0;
  const budgetTotalRealise = budget?.realise || 0;
  const tauxConsommation = budgetTotalPrevu > 0 ? Math.round((budgetTotalRealise / budgetTotalPrevu) * 100) : 0;

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE BUDGET & FINANCES" icon={DollarSign} />

      {/* Météo dynamique */}
      <AxeMeteoBadge actions={actionsBudget} jalons={jalonsBudget} />

      {/* Vue Synthétique Budget - Design Premium */}
      <Card padding="md" className="border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-4">Synthèse Budgétaire</h4>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-lg font-bold text-slate-900">{formatMontantFCFA(budgetTotalPrevu)}</p>
            <p className="text-xs text-slate-500 mt-1">Budget Prévu</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-lg font-bold text-slate-900">{formatMontantFCFA(budget?.engage || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">Engagé</p>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <p className="text-lg font-bold text-indigo-600">{formatMontantFCFA(budgetTotalRealise)}</p>
            <p className="text-xs text-slate-500 mt-1">Réalisé ({tauxConsommation}%)</p>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div
            className="bg-indigo-500 h-2.5 rounded-full transition-all"
            style={{ width: `${Math.min(tauxConsommation, 100)}%` }}
          />
        </div>
      </Card>

      {/* Budget par Axe - données réelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Budget par Axe</h4>
        {budgetParAxe && budgetParAxe.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Axe</TableHead>
                <TableHead className="text-right">Prévu</TableHead>
                <TableHead className="text-right">Réalisé</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetParAxe.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{item.axe}</TableCell>
                  <TableCell className="text-right font-mono">{formatMontantFCFA(item.prevu)}</TableCell>
                  <TableCell className="text-right font-mono">{formatMontantFCFA(item.realise)}</TableCell>
                  <TableCell className="text-right">{item.prevu > 0 ? Math.round((item.realise / item.prevu) * 100) : 0}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucune donnée budget par axe</p>
        )}
      </Card>

      {/* Actions Budget - données réelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Actions Budget</h4>
        {actionsBudget.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionsBudget.slice(0, 5).map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="font-medium">{action.titre}</TableCell>
                  <TableCell>{action.responsable || '-'}</TableCell>
                  <TableCell className="text-center">{getStatutIcon(action.statut)} {action.avancement}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucune action budget définie</p>
        )}
      </Card>

      {/* Points d'Attention et Décisions Attendues consolidés */}
      <PointsAttentionConsolides actions={actionsBudget} />
      <DecisionsAttenduesConsolidees actions={actionsBudget} />
    </div>
  );
}

// ============================================================================
// SLIDE 6 - AXE MARKETING & COMMUNICATION
// ============================================================================
function SlideAxeMarketing() {
  const actions = useActions();
  const jalons = useJalons();

  const actionsMarketing = useMemo(() => {
    if (!actions) return [];
    return actions.filter(a => a.axe === 'axe5_marketing');
  }, [actions]);

  const jalonsMarketing = useMemo(() => {
    if (!jalons) return [];
    return jalons.filter(j => j.axe === 'axe5_marketing');
  }, [jalons]);

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE MARKETING & COMMUNICATION" icon={Megaphone} />

      {/* Météo dynamique */}
      <AxeMeteoBadge actions={actionsMarketing} jalons={jalonsMarketing} />

      {/* Jalons Marketing - données réelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Jalons Marketing</h4>
        {jalonsMarketing.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jalon</TableHead>
                <TableHead>Date cible</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jalonsMarketing.slice(0, 6).map((jalon) => (
                <TableRow key={jalon.id}>
                  <TableCell className="font-medium">{jalon.titre}</TableCell>
                  <TableCell>{jalon.date_prevue ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR') : 'À planifier'}</TableCell>
                  <TableCell className="text-center">{getStatutIcon(jalon.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucun jalon marketing défini</p>
        )}
      </Card>

      {/* Actions Marketing - données réelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Actions Marketing</h4>
        {actionsMarketing.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-center">Avancement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionsMarketing.slice(0, 6).map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="font-medium">{action.titre}</TableCell>
                  <TableCell>{action.responsable || '-'}</TableCell>
                  <TableCell className="text-center">{getStatutIcon(action.statut)} {action.avancement}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucune action marketing définie</p>
        )}
      </Card>

      {/* Données temps réel - Design Premium */}
      <Card padding="md" className="border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3">Indicateurs</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{actionsMarketing.length}</p>
            <p className="text-xs text-slate-500">Actions</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{jalonsMarketing.length}</p>
            <p className="text-xs text-slate-500">Jalons</p>
          </div>
        </div>
      </Card>

      {/* Points d'Attention et Décisions Attendues consolidés */}
      <PointsAttentionConsolides actions={actionsMarketing} />
      <DecisionsAttenduesConsolidees actions={actionsMarketing} />
    </div>
  );
}

// ============================================================================
// SLIDE 7 - AXE EXPLOITATION & JURIDIQUE
// ============================================================================
function SlideAxeExploitation() {
  const actions = useActions();
  const jalons = useJalons();

  const actionsExploitation = useMemo(() => {
    if (!actions) return [];
    return actions.filter(a => a.axe === 'axe6_exploitation');
  }, [actions]);

  const jalonsExploitation = useMemo(() => {
    if (!jalons) return [];
    return jalons.filter(j => j.axe === 'axe6_exploitation');
  }, [jalons]);

  // Catégoriser les actions par type de prestation
  const prestationsParType = useMemo(() => {
    const types = [
      { titre: 'Sécurité', mode: 'Externalisée', actions: actionsExploitation.filter(a => a.titre?.toLowerCase().includes('sécurité') || a.titre?.toLowerCase().includes('securite')) },
      { titre: 'Nettoyage', mode: 'Externalisée', actions: actionsExploitation.filter(a => a.titre?.toLowerCase().includes('nettoyage') || a.titre?.toLowerCase().includes('entretien')) },
      { titre: 'Maintenance', mode: 'Mixte', actions: actionsExploitation.filter(a => a.titre?.toLowerCase().includes('maintenance') || a.titre?.toLowerCase().includes('technique')) },
    ];
    return types.filter(t => t.actions.length > 0 || true); // Afficher tous les types
  }, [actionsExploitation]);

  // Documents juridiques basés sur les jalons exploitation
  const documentsJuridiques = useMemo(() => {
    return jalonsExploitation.map(j => ({
      document: j.titre,
      statut: j.statut === 'atteint' ? 'pret' : j.statut === 'en_cours' || j.statut === 'en_approche' ? 'en_cours' : 'a_lancer',
    }));
  }, [jalonsExploitation]);

  const actionsTerminees = actionsExploitation.filter(a => a.statut === 'termine').length;
  const avancement = actionsExploitation.length > 0
    ? Math.round(actionsExploitation.reduce((sum, a) => sum + (a.avancement || 0), 0) / actionsExploitation.length)
    : 0;

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE EXPLOITATION & JURIDIQUE" icon={Settings} />

      {/* Météo dynamique */}
      <AxeMeteoBadge actions={actionsExploitation} jalons={jalonsExploitation} />

      {/* Statistiques temps réel - Design Premium */}
      <Card padding="md" className="border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3">Avancement</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{actionsExploitation.length}</p>
            <p className="text-xs text-slate-500">Actions</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-emerald-600">{actionsTerminees}</p>
            <p className="text-xs text-slate-500">Terminées</p>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-xl border border-indigo-200">
            <p className="text-xl font-bold text-indigo-600">{avancement}%</p>
            <p className="text-xs text-slate-500">Avancement</p>
          </div>
        </div>
      </Card>

      {/* Actions Exploitation */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Actions Exploitation</h4>
        {actionsExploitation.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionsExploitation.slice(0, 8).map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="font-medium">{action.titre}</TableCell>
                  <TableCell>{action.responsable || '-'}</TableCell>
                  <TableCell>{action.date_fin_prevue ? new Date(action.date_fin_prevue).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell className="text-center">{getStatutIcon(action.statut)} {action.avancement}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucune action exploitation définie</p>
        )}
      </Card>

      {/* Jalons Exploitation */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Jalons Exploitation</h4>
        {jalonsExploitation.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jalon</TableHead>
                <TableHead>Date cible</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jalonsExploitation.slice(0, 5).map((jalon) => (
                <TableRow key={jalon.id}>
                  <TableCell className="font-medium">{jalon.titre}</TableCell>
                  <TableCell>{jalon.date_prevue ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell className="text-center">{getStatutIcon(jalon.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucun jalon exploitation défini</p>
        )}
      </Card>

      {/* Points d'Attention et Décisions Attendues consolidés */}
      <PointsAttentionConsolides actions={actionsExploitation} />
      <DecisionsAttenduesConsolidees actions={actionsExploitation} />
    </div>
  );
}

// ============================================================================
// SLIDE 8 - RISQUES MAJEURS
// ============================================================================
function SlideRisquesMajeurs() {
  const risques = useRisques();

  // Top 5 risques par score (données réelles de la base)
  const top5Risques = useMemo(() => {
    if (!risques.data) return [];
    return [...risques.data]
      .filter(r => r.status !== 'ferme')
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
  }, [risques.data]);

  const totalRisques = risques.data?.filter(r => r.status !== 'ferme').length || 0;
  const totalCritiques = risques.data?.filter(r => r.status !== 'ferme' && (r.score || 0) >= 12).length || 0;

  // Convertir score en probabilité/impact lisible
  const getProbabiliteFromScore = (probabilite: number): string => {
    if (probabilite >= 4) return '🔴';
    if (probabilite >= 3) return '🟠';
    if (probabilite >= 2) return '🟡';
    return '🟢';
  };

  const getImpactFromScore = (impact: number): string => {
    if (impact >= 4) return '🔴';
    if (impact >= 3) return '🟠';
    if (impact >= 2) return '🟡';
    return '🟢';
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="RISQUES MAJEURS" icon={AlertTriangle} />

      {/* Stats risques - Design Premium */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md" className="text-center border-slate-200">
          <p className="text-3xl font-bold text-slate-900">{totalRisques}</p>
          <p className="text-sm text-slate-500 mt-1">Risques ouverts</p>
        </Card>
        <Card padding="md" className="text-center border-rose-200 bg-rose-50/50">
          <p className="text-3xl font-bold text-rose-600">{totalCritiques}</p>
          <p className="text-sm text-slate-600 mt-1">Critiques (score ≥ 12)</p>
        </Card>
      </div>

      {/* Tableau des risques - Données réelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Top 5 Risques</h4>
        {top5Risques.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rang</TableHead>
                <TableHead>Risque</TableHead>
                <TableHead className="text-center">Prob.</TableHead>
                <TableHead className="text-center">Impact</TableHead>
                <TableHead>Mitigation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top5Risques.map((risque, idx) => (
                <TableRow key={risque.id || idx}>
                  <TableCell className="font-bold">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{risque.titre}</TableCell>
                  <TableCell className="text-center">
                    {getProbabiliteFromScore(risque.probabilite || 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getImpactFromScore(risque.impact || 0)}
                  </TableCell>
                  <TableCell className="text-sm">{risque.plan_mitigation || risque.description || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucun risque identifié</p>
        )}
      </Card>

      {/* Détails des risques critiques - Design Premium */}
      {top5Risques.filter(r => (r.score || 0) >= 12).length > 0 && (
        <Card padding="md" className="border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-3">Détails Risques Critiques</h4>
          <div className="space-y-2">
            {top5Risques.filter(r => (r.score || 0) >= 12).map((risque, idx) => (
              <div key={risque.id || idx} className="p-3 bg-slate-50 rounded-xl border-l-4 border-rose-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-slate-800">{risque.titre}</span>
                  <Badge className="bg-rose-100 text-rose-700 border border-rose-200">Score: {risque.score}</Badge>
                </div>
                {risque.plan_mitigation && (
                  <p className="text-sm text-slate-600">Mitigation: {risque.plan_mitigation}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SLIDE - POINTS D'ATTENTION
// ============================================================================
function SlidePointsAttention() {
  const actions = useActions();

  // Points d'attention = extraits du champ points_attention de chaque action (non cochés uniquement)
  const pointsAttention = useMemo(() => {
    if (!actions) return [];

    // Extraire les points d'attention NON TRANSMIS (non cochés) de toutes les actions non terminées
    const allPoints: { numero: number; sujet: string; responsable: string; responsablePoint?: string; actionTitre: string; axe?: string }[] = [];
    let idx = 0;

    actions
      .filter(a => a.statut !== 'termine' && a.statut !== 'annule')
      .forEach(action => {
        const points = (action as any).points_attention || [];
        points
          .filter((point: { transmis?: boolean }) => !point.transmis) // Seulement les non cochés
          .forEach((point: { id: string; sujet: string; responsableNom?: string; dateCreation: string; transmis?: boolean }) => {
            idx++;
            allPoints.push({
              numero: idx,
              sujet: point.sujet,
              responsable: action.responsable || '-',
              responsablePoint: point.responsableNom,
              actionTitre: action.titre,
              axe: action.axe,
            });
          });
      });

    return allPoints.slice(0, 15);
  }, [actions]);

  // État local pour toggle des points
  const [pointsState, setPointsState] = useState<Record<number, boolean>>({});

  const togglePoint = (numero: number) => {
    setPointsState(prev => ({ ...prev, [numero]: !prev[numero] }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="POINTS D'ATTENTION" icon={AlertTriangle} />

      {/* Liste des points d'attention */}
      <Card padding="md" className="border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Points Nécessitant Attention ({pointsAttention.length})
        </h4>
        {pointsAttention.length > 0 ? (
          <div className="space-y-2">
            {pointsAttention.map((point) => (
              <div
                key={point.numero}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                  pointsState[point.numero]
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/50'
                )}
                onClick={() => togglePoint(point.numero)}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                    pointsState[point.numero] ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  )}>
                    {pointsState[point.numero] ? '✓' : point.numero}
                  </span>
                  <div>
                    <span className="font-medium text-slate-800 text-sm">{point.sujet}</span>
                    <p className="text-xs text-slate-400 mt-0.5">Action: {point.actionTitre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {point.responsablePoint && (
                        <span className="text-xs text-amber-600">Resp. point: {point.responsablePoint}</span>
                      )}
                      {point.responsable && point.responsable !== '-' && (
                        <span className="text-xs text-slate-500">Resp. action: {point.responsable}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pointsState[point.numero] ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Traité</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">À traiter</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 italic py-4">Aucun point d'attention en attente</p>
        )}
      </Card>

      {/* Résumé par axe */}
      {pointsAttention.length > 0 && (
        <Card padding="md" className="border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-3">Répartition par Axe</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(
              pointsAttention.reduce((acc, p) => {
                const axeLabel = p.axe ? AXE_SHORT_LABELS[p.axe as keyof typeof AXE_SHORT_LABELS] || p.axe : 'Non défini';
                acc[axeLabel] = (acc[axeLabel] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([axe, count]) => (
              <div key={axe} className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-center">
                <p className="text-xs text-amber-600 truncate" title={axe}>{axe}</p>
                <p className="text-lg font-bold text-amber-700">{count}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SLIDE - DÉCISIONS ATTENDUES
// ============================================================================
function SlideDecisions() {
  const actions = useActions();
  const jalons = useJalons();

  // Décisions = extraites du champ decisions_attendues de chaque action (non cochées uniquement)
  const decisionsAttendues = useMemo(() => {
    if (!actions) return [];

    // Extraire les décisions attendues NON TRANSMISES (non cochées) de toutes les actions non terminées
    const allDecisions: { numero: number; element: string; statut: string; responsable: string; actionTitre: string }[] = [];
    let idx = 0;

    actions
      .filter(a => a.statut !== 'termine' && a.statut !== 'annule')
      .forEach(action => {
        const decisions = (action as any).decisions_attendues || [];
        decisions
          .filter((decision: { transmis?: boolean }) => !decision.transmis) // Seulement les non cochées
          .forEach((decision: { id: string; sujet: string; dateCreation: string; transmis?: boolean }) => {
            idx++;
            allDecisions.push({
              numero: idx,
              element: decision.sujet,
              statut: 'a_valider',
              responsable: action.responsable || '-',
              actionTitre: action.titre,
            });
          });
      });

    return allDecisions.slice(0, 10);
  }, [actions]);

  // Prochaines étapes = Top 5 actions les plus importantes du mois suivant
  const prochainesEtapes = useMemo(() => {
    if (!actions) return [];
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    // Ordre de priorité
    const priorityOrder: Record<string, number> = { critique: 1, haute: 2, moyenne: 3, basse: 4 };

    return actions
      .filter(a => {
        if (a.statut === 'termine' || a.statut === 'annule') return false;
        if (!a.date_fin_prevue) return false;
        const dateEcheance = new Date(a.date_fin_prevue);
        // Actions du mois suivant
        return dateEcheance >= nextMonth && dateEcheance <= endOfNextMonth;
      })
      .sort((a, b) => {
        // Trier par priorité (critique > haute > moyenne > basse)
        const prioA = priorityOrder[a.priorite] || 5;
        const prioB = priorityOrder[b.priorite] || 5;
        if (prioA !== prioB) return prioA - prioB;
        // Puis par date
        const dateA = new Date(a.date_fin_prevue!).getTime();
        const dateB = new Date(b.date_fin_prevue!).getTime();
        return dateA - dateB;
      })
      .slice(0, 5)
      .map(a => ({
        action: a.titre,
        responsable: a.responsable || '-',
        echeance: a.date_fin_prevue ? new Date(a.date_fin_prevue).toLocaleDateString('fr-FR') : 'À définir',
        priorite: a.priorite,
      }));
  }, [actions]);

  // État local pour toggle des décisions
  const [decisionsState, setDecisionsState] = useState<Record<number, boolean>>({});

  const toggleDecision = (numero: number) => {
    setDecisionsState(prev => ({ ...prev, [numero]: !prev[numero] }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="DÉCISIONS ATTENDUES" icon={CheckCircle} />

      {/* Checklist de Validation - Design Premium */}
      <Card padding="md" className="border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3">Actions Nécessitant Validation</h4>
        {decisionsAttendues.length > 0 ? (
          <div className="space-y-2">
            {decisionsAttendues.map((decision) => (
              <div
                key={decision.numero}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                  decisionsState[decision.numero]
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                )}
                onClick={() => toggleDecision(decision.numero)}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                    decisionsState[decision.numero] ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                  )}>
                    {decisionsState[decision.numero] ? '✓' : decision.numero}
                  </span>
                  <div>
                    <span className="font-medium text-slate-800 text-sm">{decision.element}</span>
                    {(decision as any).actionTitre && (
                      <p className="text-xs text-slate-400 mt-0.5">Action: {(decision as any).actionTitre}</p>
                    )}
                    {decision.responsable && decision.responsable !== '-' && (
                      <span className="text-xs text-slate-500">Responsable: {decision.responsable}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {decisionsState[decision.numero] ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Validé</Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-300 text-slate-600">À valider</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 italic py-4">Aucune décision en attente</p>
        )}
      </Card>

      {/* Prochaines Étapes - Données réelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Prochaines Étapes</h4>
        {prochainesEtapes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Échéance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prochainesEtapes.map((etape, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{etape.action}</TableCell>
                  <TableCell>{etape.responsable}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{etape.echeance}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400 italic py-4">Aucune action à venir</p>
        )}
      </Card>

    </div>
  );
}

// ============================================================================
// SLIDE 11 - SYNCHRONISATION CONSTRUCTION / MOBILISATION
// ============================================================================
function SlideSynchronisation() {
  const siteId = useCurrentSiteId() || 1;
  const syncStatus = useSyncStatus(siteId);
  const syncStats = useSyncStats(siteId);
  const actions = useActions();

  // Calculer les statistiques des actions liées à la synchronisation
  const syncActionsStats = useMemo(() => {
    if (!actions) return { total: 0, terminees: 0, enRetard: 0, enCours: 0 };

    const now = new Date();
    const terminees = actions.filter(a => a.statut === 'termine').length;
    const enRetard = actions.filter(a => {
      if (a.statut === 'termine') return false;
      return a.date_fin_prevue && new Date(a.date_fin_prevue) < now;
    }).length;
    const enCours = actions.filter(a => a.statut === 'en_cours').length;

    return {
      total: actions.length,
      terminees,
      enRetard,
      enCours,
    };
  }, [actions]);

  const constructionProgress = syncStatus?.projectProgress || 0;
  const mobilisationProgress = syncStatus?.mobilizationProgress || 0;
  const gap = syncStatus?.gap || 0;
  const alertLevel = syncStatus?.alertLevel || 'GREEN';

  // Configuration des couleurs selon le niveau d'alerte
  const getAlertConfig = () => {
    switch (alertLevel) {
      case 'GREEN':
        return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Synchronisé' };
      case 'ORANGE':
        return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Écart modéré' };
      case 'RED':
        return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Désynchronisé' };
      default:
        return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Non défini' };
    }
  };

  const alertConfig = getAlertConfig();

  // Composant pour la jauge circulaire
  const CircularGauge = ({ value, label, color }: { value: number; label: string; color: string }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <svg width="120" height="120" className="transform -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#E2E8F0"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: '35px' }}>
          <span className="text-2xl font-bold text-slate-900">{value.toFixed(0)}%</span>
        </div>
        <span className="mt-2 text-sm font-medium text-slate-600">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="SYNCHRONISATION CHANTIER / MOBILISATION" icon={Link2} />

      {/* Statut global de synchronisation */}
      <div className={cn('p-4 rounded-xl border', alertConfig.bg, alertConfig.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {alertLevel === 'GREEN' && <CheckCircle className={cn('h-6 w-6', alertConfig.color)} />}
            {alertLevel === 'ORANGE' && <AlertTriangle className={cn('h-6 w-6', alertConfig.color)} />}
            {alertLevel === 'RED' && <AlertTriangle className={cn('h-6 w-6', alertConfig.color)} />}
            <div>
              <p className={cn('font-semibold', alertConfig.color)}>{alertConfig.label}</p>
              <p className="text-sm text-slate-500">Écart de synchronisation: {gap > 0 ? '+' : ''}{gap.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {gap > 0 ? (
              <TrendingUp className="h-5 w-5 text-indigo-500" />
            ) : gap < 0 ? (
              <TrendingDown className="h-5 w-5 text-amber-500" />
            ) : (
              <Minus className="h-5 w-5 text-slate-400" />
            )}
            <span className="text-lg font-bold text-slate-700">{Math.abs(gap).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md" className="border-slate-200 text-center">
          <div className="p-2 rounded-xl bg-indigo-50 w-fit mx-auto mb-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{constructionProgress.toFixed(0)}%</p>
          <p className="text-xs text-slate-500 mt-1">Avancement Construction</p>
        </Card>
        <Card padding="md" className="border-slate-200 text-center">
          <div className="p-2 rounded-xl bg-emerald-50 w-fit mx-auto mb-2">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{mobilisationProgress.toFixed(0)}%</p>
          <p className="text-xs text-slate-500 mt-1">Avancement Mobilisation</p>
        </Card>
        <Card padding="md" className={cn('text-center', alertConfig.border)}>
          <div className={cn('p-2 rounded-xl w-fit mx-auto mb-2', alertConfig.bg)}>
            <Link2 className={cn('h-5 w-5', alertConfig.color)} />
          </div>
          <p className={cn('text-2xl font-bold', alertConfig.color)}>{gap > 0 ? '+' : ''}{gap.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-1">Écart</p>
        </Card>
      </div>

      {/* Jauges de comparaison */}
      <Card padding="md" className="border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-4 text-center">Comparaison Avancement</h4>
        <div className="flex items-center justify-around">
          <div className="relative">
            <CircularGauge value={constructionProgress} label="Construction" color="#4F46E5" />
          </div>
          <div className="flex flex-col items-center px-4">
            <div className={cn('p-3 rounded-full', alertConfig.bg)}>
              <Link2 className={cn('h-6 w-6', alertConfig.color)} />
            </div>
            <span className={cn('text-sm font-medium mt-2', alertConfig.color)}>
              {gap > 0 ? 'Avance' : gap < 0 ? 'Retard' : 'Sync'}
            </span>
          </div>
          <div className="relative">
            <CircularGauge value={mobilisationProgress} label="Mobilisation" color="#059669" />
          </div>
        </div>
      </Card>

      {/* Statistiques Actions */}
      <Card padding="md" className="border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3">Statistiques Actions</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{syncStats?.totalActions || syncActionsStats.total}</p>
            <p className="text-xs text-slate-500">Total Actions</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-xl font-bold text-emerald-600">{syncStats?.actionsTerminees || syncActionsStats.terminees}</p>
            <p className="text-xs text-slate-500">Terminées</p>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-xl border border-indigo-200">
            <p className="text-xl font-bold text-indigo-600">{syncActionsStats.enCours}</p>
            <p className="text-xs text-slate-500">En cours</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xl font-bold text-amber-600">{syncActionsStats.enRetard}</p>
            <p className="text-xs text-slate-500">En retard</p>
          </div>
        </div>
      </Card>

      {/* Barre de progression comparative */}
      <Card padding="md" className="border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-4">Progression Comparative</h4>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-500" /> Construction
              </span>
              <span className="text-sm font-bold text-indigo-600">{constructionProgress.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${constructionProgress}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" /> Mobilisation
              </span>
              <span className="text-sm font-bold text-emerald-600">{mobilisationProgress.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${mobilisationProgress}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export function DeepDiveLancement() {
  const [activeSlide, setActiveSlide] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [presentationDate, setPresentationDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const previewRef = useRef<HTMLDivElement>(null);

  // États pour le preview comme DeepDive normal
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ========== HOOKS DONNÉES RÉELLES ==========
  const kpis = useDashboardKPIs();
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();
  const budgetSynthese = useBudgetSynthese();
  const budgetParAxe = useBudgetParAxe();
  const currentSite = useCurrentSite();
  const allSites = useSites();
  const users = useUsers(); // Utilisateurs depuis la DB

  // Mapping des rôles vers titres professionnels
  const ROLE_TITRES: Record<string, string> = {
    admin: 'DGA',
    manager: 'Manager',
    viewer: 'Consultant',
  };

  // Données du site - TOUJOURS utiliser BATIMENTS_CONFIG comme source de vérité
  const siteData = useMemo(() => {
    const siteFromDb = allSites.find(s => s.actif && s.id === currentSite?.id)
                    || allSites.find(s => s.actif)
                    || allSites[0];

    // IMPORTANT: Nombre de bâtiments = TOUJOURS depuis BATIMENTS_CONFIG (source de vérité cockpit)
    const nombreBatiments = Object.keys(BATIMENTS_CONFIG).length; // = 6

    // Présentateur dynamique: premier admin ou premier utilisateur
    const adminUser = users.find(u => u.role === 'admin') || users[0];
    const presentateur = adminUser
      ? { nom: `${adminUser.prenom} ${adminUser.nom}`, titre: ROLE_TITRES[adminUser.role] || 'Manager' }
      : { nom: 'Non configuré', titre: '' };

    // Destinataires dynamiques: tous les admins/managers
    const destinataires = users
      .filter(u => u.role === 'admin' || u.role === 'manager')
      .map(u => `${u.prenom} ${u.nom}`)
      .slice(0, 3); // Limiter à 3 destinataires pour l'affichage

    return {
      surfaceGLA: siteFromDb?.surface || TOTAL_GLA,
      nombreBatiments: nombreBatiments, // TOUJOURS 6 depuis BATIMENTS_CONFIG
      softOpening: siteFromDb?.dateOuverture ?? '',
      inauguration: siteFromDb?.dateInauguration ?? '',
      occupationCible: siteFromDb?.occupationCible ?? 85,
      nom: siteFromDb?.nom ?? 'Site non configuré',
      code: siteFromDb?.code ?? '',
      societe: siteFromDb?.nom?.split(' ')[0] ?? 'Site', // Extraire nom société du site
      presentateur,
      destinataires: destinataires.length > 0 ? destinataires : ['Non configuré'],
    };
  }, [currentSite, allSites, users]);

  // Données calculées à partir des hooks
  const cockpitData = useMemo(() => {
    const actionsData = actions || [];
    const jalonsData = jalons || [];
    const risquesData = risques || [];

    // Actions par axe
    const actionsByAxe = (axeCode: string) => actionsData.filter(a => a.axe === axeCode);
    const jalonsByAxe = (axeCode: string) => jalonsData.filter(j => j.axe === axeCode);

    // Calcul météo par axe basé sur les données réelles
    const calculateAxeMeteo = (axeCode: string) => {
      const axeActions = actionsByAxe(axeCode);
      const axeJalons = jalonsByAxe(axeCode);

      if (axeActions.length === 0 && axeJalons.length === 0) return { meteo: 'soleil_nuage' as MeteoType, statut: 'À démarrer' };

      const actionsTerminees = axeActions.filter(a => a.statut === 'termine').length;
      const actionsBloquees = axeActions.filter(a => a.statut === 'bloque').length;
      const jalonsAtteints = axeJalons.filter(j => j.statut === 'atteint').length;

      const tauxCompletion = axeActions.length > 0 ? (actionsTerminees / axeActions.length) * 100 : 0;
      const tauxJalons = axeJalons.length > 0 ? (jalonsAtteints / axeJalons.length) * 100 : 0;

      if (actionsBloquees > 0 || tauxCompletion < 30) {
        return { meteo: 'pluie' as MeteoType, statut: 'En difficulté' };
      } else if (tauxCompletion < 60 || tauxJalons < 50) {
        return { meteo: 'nuage' as MeteoType, statut: 'À surveiller' };
      } else if (tauxCompletion < 80) {
        return { meteo: 'soleil_nuage' as MeteoType, statut: 'En cours' };
      }
      return { meteo: 'soleil' as MeteoType, statut: 'En bonne voie' };
    };

    // Top 5 risques
    const top5Risques = [...risquesData]
      .filter(r => r.status !== 'ferme')
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);

    // Jalons critiques (prochains 30 jours)
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const jalonsCritiques = jalonsData
      .filter(j => {
        const dateJalon = new Date(j.date_prevue);
        return dateJalon >= today && dateJalon <= in30Days && j.statut !== 'atteint';
      })
      .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())
      .slice(0, 5);

    return {
      tauxOccupation: kpis?.tauxOccupation || 0,
      jalonsTotal: jalonsData.length,
      jalonsAtteints: jalonsData.filter(j => j.statut === 'atteint').length,
      actionsTotal: actionsData.length,
      actionsTerminees: actionsData.filter(a => a.statut === 'termine').length,
      actionsEnCours: actionsData.filter(a => a.statut === 'en_cours').length,
      actionsBloquees: actionsData.filter(a => a.statut === 'bloque').length,
      risquesActifs: risquesData.filter(r => r.status !== 'ferme').length,
      top5Risques,
      jalonsCritiques,
      budgetPrevu: budgetSynthese?.prevu || 0,
      budgetRealise: budgetSynthese?.realise || 0,
      budgetEngage: budgetSynthese?.engage || 0,
      meteoAxes: {
        rh: calculateAxeMeteo('axe1_rh'),
        commercial: calculateAxeMeteo('axe2_commercial'),
        technique: calculateAxeMeteo('axe3_technique'),
        budget: calculateAxeMeteo('axe4_budget'),
        marketing: calculateAxeMeteo('axe5_marketing'),
        exploitation: calculateAxeMeteo('axe6_exploitation'),
      },
      actionsByAxe,
      jalonsByAxe,
    };
  }, [kpis, actions, jalons, risques, budgetSynthese]);

  const slides = [
    { numero: 1, titre: 'Agenda', component: SlideAgenda },
    { numero: 2, titre: 'Rappel Projet & Météo Globale', component: SlideRappelProjet },
    { numero: 3, titre: 'AXE RH & Organisation', component: SlideAxeRH },
    { numero: 4, titre: 'AXE Commercial & Leasing', component: SlideAxeCommercial },
    { numero: 5, titre: 'AXE Technique & Handover', component: SlideAxeTechnique },
    { numero: 6, titre: 'AXE Budget & Finances', component: SlideAxeBudget },
    { numero: 7, titre: 'AXE Marketing & Communication', component: SlideAxeMarketing },
    { numero: 8, titre: 'AXE Exploitation & Juridique', component: SlideAxeExploitation },
    { numero: 9, titre: 'Synchronisation Chantier / Mobilisation', component: SlideSynchronisation },
    { numero: 10, titre: 'Risques Majeurs', component: SlideRisquesMajeurs },
    { numero: 11, titre: "Points d'Attention", component: SlidePointsAttention },
    { numero: 12, titre: 'Décisions Attendues', component: SlideDecisions },
  ];

  // Navigation dans le preview
  const navigatePreview = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && previewSlideIndex > 0) {
      setPreviewSlideIndex(previewSlideIndex - 1);
    } else if (direction === 'next' && previewSlideIndex < slides.length - 1) {
      setPreviewSlideIndex(previewSlideIndex + 1);
    }
  };

  const ActiveSlideComponent = slides.find(s => s.numero === activeSlide)?.component || SlideRappelProjet;

  // Fonction pour générer le HTML complet avec données COCKPIT
  const generateHtmlContent = () => {
    const dateFormatted = new Date(presentationDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Helper météo emoji
    const getMeteoHtml = (meteo: MeteoType, statut: string) => {
      const config: Record<MeteoType, { emoji: string; class: string }> = {
        soleil: { emoji: '☀️', class: 'meteo-soleil' },
        soleil_nuage: { emoji: '⛅', class: 'meteo-soleil-nuage' },
        nuage: { emoji: '☁️', class: 'meteo-nuage' },
        pluie: { emoji: '🌧️', class: 'meteo-pluie' },
      };
      const c = config[meteo];
      return `<span class="${c.class} px-2 py-1 rounded text-xs">${c.emoji} ${statut}</span>`;
    };

    // Helper probabilité/impact
    const getProbImpactEmoji = (value: number) => {
      if (value >= 4) return '🔴';
      if (value >= 3) return '🟠';
      if (value >= 2) return '🟡';
      return '🟢';
    };

    // Helper statut jalon
    const getStatutJalonHtml = (statut: string) => {
      switch (statut) {
        case 'atteint': return '✅ Atteint';
        case 'en_cours': return '🟡 En cours';
        case 'en_retard': return '🔴 En retard';
        default: return '🔵 Planifié';
      }
    };

    // Générer les lignes risques depuis cockpitData
    const risquesHtml = cockpitData.top5Risques.length > 0
      ? cockpitData.top5Risques.map((r, i) => `
          <tr class="border-b">
            <td class="p-2 font-bold">${i + 1}</td>
            <td class="p-2">${r.titre}</td>
            <td class="p-2 text-center">${getProbImpactEmoji(r.probabilite || 2)}</td>
            <td class="p-2 text-center">${getProbImpactEmoji(r.impact || 3)}</td>
            <td class="p-2 text-sm">${r.strategie_reponse || 'À définir'}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="5" class="p-4 text-center text-gray-500">Aucun risque actif</td></tr>';

    // Générer les jalons techniques depuis cockpitData
    const jalonsTechniques = cockpitData.jalonsByAxe('axe3_technique').slice(0, 5);
    const jalonsTechHtml = jalonsTechniques.length > 0
      ? jalonsTechniques.map(j => `
          <tr class="border-b">
            <td class="p-2">${j.titre}</td>
            <td class="p-2 text-center">${new Date(j.date_prevue).toLocaleDateString('fr-FR')}</td>
            <td class="p-2 text-center">${getStatutJalonHtml(j.statut)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="3" class="p-4 text-center text-gray-500">Aucun jalon technique</td></tr>';

    // Jalons marketing
    const jalonsMarketing = cockpitData.jalonsByAxe('axe5_marketing').slice(0, 5);
    const jalonsMarketingHtml = jalonsMarketing.length > 0
      ? jalonsMarketing.map(j => `
          <li class="flex justify-between"><span>${j.titre}</span><span class="${j.statut === 'atteint' ? 'text-green-600' : 'text-orange-600'}">${j.statut === 'atteint' ? 'Fait' : j.statut === 'en_cours' ? 'En cours' : 'À planifier'}</span></li>
        `).join('')
      : '<li class="text-gray-500">Aucun jalon marketing défini</li>';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deep Dive Lancement - Cosmos Angré - ${dateFormatted}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print { .no-print { display: none !important; } .page-break { page-break-after: always; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .slide-header { border-bottom: 3px solid #1C3163; padding-bottom: 1rem; margin-bottom: 2rem; }
    .meteo-soleil { color: #16a34a; background: #dcfce7; }
    .meteo-nuage { color: #ea580c; background: #ffedd5; }
    .meteo-pluie { color: #dc2626; background: #fee2e2; }
    .meteo-soleil-nuage { color: #d97706; background: #fef3c7; }
  </style>
</head>
<body class="bg-gray-100">
  <div class="bg-gradient-to-r from-[#1C3163] to-[#2a4a8a] text-white p-8 no-print">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-2">DEEP DIVE LANCEMENT</h1>
      <p class="text-lg opacity-90">Projet Cosmos Angré - Validation Stratégique</p>
      <p class="text-sm opacity-75 mt-2">Date: ${dateFormatted}</p>
      <p class="text-sm opacity-75">Présenté par: ${siteData.presentateur.nom}, ${siteData.presentateur.titre} | Destinataires: ${siteData.destinataires.join(', ')}</p>
    </div>
  </div>

  <div class="bg-white shadow-sm sticky top-0 z-50 no-print">
    <div class="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
      ${slides.map(s => `<a href="#slide-${s.numero}" class="px-3 py-1 bg-gray-100 hover:bg-[#1C3163] hover:text-white rounded text-sm whitespace-nowrap transition-colors">${s.numero}. ${s.titre}</a>`).join('\n      ')}
    </div>
  </div>

  <div class="max-w-6xl mx-auto py-8 space-y-8">
    <!-- Slide 1: AGENDA -->
    <div id="slide-1" class="bg-white rounded-lg shadow-lg p-8 page-break">
      <div class="slide-header">
        <span class="text-sm text-[#D4AF37] font-semibold">SLIDE 1/10</span>
        <h2 class="text-2xl font-bold text-[#1C3163] mt-1">AGENDA</h2>
      </div>
      <div class="grid md:grid-cols-2 gap-6">
        ${slides.map((s, i) => `
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            <div class="w-8 h-8 rounded-full bg-[#1C3163] text-white flex items-center justify-center text-sm font-bold">${s.numero}</div>
            <span class="font-medium">${s.titre}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Slide 2: RAPPEL PROJET & MÉTÉO -->
    <div id="slide-2" class="bg-white rounded-lg shadow-lg p-8 page-break">
      <div class="slide-header">
        <span class="text-sm text-[#D4AF37] font-semibold">SLIDE 2/10</span>
        <h2 class="text-2xl font-bold text-[#1C3163] mt-1">RAPPEL PROJET & MÉTÉO GLOBALE</h2>
      </div>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="font-bold text-lg mb-4 text-[#1C3163]">Le Projet</h3>
          <table class="w-full text-sm">
            <tr class="border-b"><td class="py-2 font-medium">Surface GLA</td><td class="text-right">${siteData.surfaceGLA.toLocaleString()} m²</td></tr>
            <tr class="border-b"><td class="py-2 font-medium">Bâtiments</td><td class="text-right">${siteData.nombreBatiments}</td></tr>
            <tr class="border-b"><td class="py-2 font-medium">Soft Opening</td><td class="text-right">${new Date(siteData.softOpening).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td></tr>
            <tr class="border-b"><td class="py-2 font-medium">Inauguration</td><td class="text-right">${new Date(siteData.inauguration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td></tr>
            <tr><td class="py-2 font-medium">Occupation actuelle</td><td class="text-right font-bold ${cockpitData.tauxOccupation >= 85 ? 'text-green-600' : 'text-amber-600'}">${cockpitData.tauxOccupation.toFixed(1)}%</td></tr>
          </table>
        </div>
        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="font-bold text-lg mb-4 text-[#1C3163]">Météo par Axe (temps réel)</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center p-2 bg-white rounded"><span>RH & Organisation</span>${getMeteoHtml(cockpitData.meteoAxes.rh.meteo, cockpitData.meteoAxes.rh.statut)}</div>
            <div class="flex justify-between items-center p-2 bg-white rounded"><span>Commercial</span>${getMeteoHtml(cockpitData.meteoAxes.commercial.meteo, cockpitData.meteoAxes.commercial.statut)}</div>
            <div class="flex justify-between items-center p-2 bg-white rounded"><span>Technique</span>${getMeteoHtml(cockpitData.meteoAxes.technique.meteo, cockpitData.meteoAxes.technique.statut)}</div>
            <div class="flex justify-between items-center p-2 bg-white rounded"><span>Budget</span>${getMeteoHtml(cockpitData.meteoAxes.budget.meteo, cockpitData.meteoAxes.budget.statut)}</div>
            <div class="flex justify-between items-center p-2 bg-white rounded"><span>Marketing</span>${getMeteoHtml(cockpitData.meteoAxes.marketing.meteo, cockpitData.meteoAxes.marketing.statut)}</div>
            <div class="flex justify-between items-center p-2 bg-white rounded"><span>Exploitation</span>${getMeteoHtml(cockpitData.meteoAxes.exploitation.meteo, cockpitData.meteoAxes.exploitation.statut)}</div>
          </div>
        </div>
      </div>
      <div class="mt-6 grid grid-cols-4 gap-4 text-center">
        <div class="bg-blue-50 p-4 rounded-lg"><p class="text-2xl font-bold text-blue-700">${cockpitData.jalonsAtteints}/${cockpitData.jalonsTotal}</p><p class="text-xs text-blue-600">Jalons atteints</p></div>
        <div class="bg-green-50 p-4 rounded-lg"><p class="text-2xl font-bold text-green-700">${cockpitData.actionsTerminees}/${cockpitData.actionsTotal}</p><p class="text-xs text-green-600">Actions terminées</p></div>
        <div class="bg-amber-50 p-4 rounded-lg"><p class="text-2xl font-bold text-amber-700">${cockpitData.actionsBloquees}</p><p class="text-xs text-amber-600">Actions bloquées</p></div>
        <div class="bg-red-50 p-4 rounded-lg"><p class="text-2xl font-bold text-red-700">${cockpitData.risquesActifs}</p><p class="text-xs text-red-600">Risques actifs</p></div>
      </div>
    </div>

    <!-- Slide 3: AXE RH -->
    <div id="slide-3" class="bg-white rounded-lg shadow-lg p-8 page-break">
      <div class="slide-header">
        <span class="text-sm text-[#D4AF37] font-semibold">SLIDE 3/10</span>
        <h2 class="text-2xl font-bold text-[#1C3163] mt-1">AXE RH & ORGANISATION</h2>
      </div>
      <div class="p-3 ${cockpitData.meteoAxes.rh.meteo === 'soleil' ? 'bg-green-50 border-green-200' : cockpitData.meteoAxes.rh.meteo === 'pluie' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} border rounded-lg mb-6 flex items-center gap-2">
        ${getMeteoHtml(cockpitData.meteoAxes.rh.meteo, cockpitData.meteoAxes.rh.statut)}
      </div>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="font-bold mb-4">Actions RH (temps réel)</h3>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="bg-blue-50 p-3 rounded-lg"><p class="text-xl font-bold text-blue-700">${cockpitData.actionsByAxe('axe1_rh').length}</p><p class="text-xs">Total</p></div>
            <div class="bg-green-50 p-3 rounded-lg"><p class="text-xl font-bold text-green-700">${cockpitData.actionsByAxe('axe1_rh').filter(a => a.statut === 'termine').length}</p><p class="text-xs">Terminées</p></div>
            <div class="bg-amber-50 p-3 rounded-lg"><p class="text-xl font-bold text-amber-700">${cockpitData.actionsByAxe('axe1_rh').filter(a => a.statut === 'en_cours').length}</p><p class="text-xs">En cours</p></div>
          </div>
        </div>
        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="font-bold mb-4">Effectif Cible</h3>
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <p class="text-3xl font-bold text-blue-700">${siteData.surfaceGLA > 40000 ? 25 : 15}</p>
            <p class="text-sm text-blue-600">personnes</p>
            <p class="text-xs text-gray-500 mt-2">Effectif calculé selon surface GLA</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide 4: AXE Commercial -->
    <div id="slide-4" class="bg-white rounded-lg shadow-lg p-8 page-break">
      <div class="slide-header">
        <span class="text-sm text-[#D4AF37] font-semibold">SLIDE 4/10</span>
        <h2 class="text-2xl font-bold text-[#1C3163] mt-1">AXE COMMERCIAL & LEASING</h2>
      </div>
      <div class="p-3 ${cockpitData.meteoAxes.commercial.meteo === 'soleil' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} border rounded-lg mb-6 flex items-center gap-2">
        ${getMeteoHtml(cockpitData.meteoAxes.commercial.meteo, cockpitData.meteoAxes.commercial.statut)}
      </div>
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="font-bold mb-4">KPIs Commercial (temps réel)</h3>
        <div class="grid grid-cols-4 gap-4 text-center">
          <div class="bg-indigo-50 p-4 rounded-lg"><p class="text-2xl font-bold text-indigo-700">${cockpitData.tauxOccupation.toFixed(1)}%</p><p class="text-xs text-indigo-600">Occupation</p></div>
          <div class="bg-green-50 p-4 rounded-lg"><p class="text-2xl font-bold text-green-700">${cockpitData.actionsByAxe('axe2_commercial').filter(a => a.statut === 'termine').length}</p><p class="text-xs text-green-600">Actions faites</p></div>
          <div class="bg-blue-50 p-4 rounded-lg"><p class="text-2xl font-bold text-blue-700">${cockpitData.jalonsByAxe('axe2_commercial').filter(j => j.statut === 'atteint').length}/${cockpitData.jalonsByAxe('axe2_commercial').length}</p><p class="text-xs text-blue-600">Jalons</p></div>
          <div class="bg-purple-50 p-4 rounded-lg"><p class="text-2xl font-bold text-purple-700">${siteData.occupationCible}%</p><p class="text-xs text-purple-600">Cible</p></div>
        </div>
      </div>
    </div>

    <!-- Slide 5: AXE Technique -->
    <div id="slide-5" class="bg-white rounded-lg shadow-lg p-8 page-break">
      <div class="slide-header">
        <span class="text-sm text-[#D4AF37] font-semibold">SLIDE 5/10</span>
        <h2 class="text-2xl font-bold text-[#1C3163] mt-1">AXE TECHNIQUE & HANDOVER</h2>
      </div>
      <div class="p-3 ${cockpitData.meteoAxes.technique.meteo === 'soleil' ? 'bg-green-50 border-green-200' : cockpitData.meteoAxes.technique.meteo === 'pluie' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} border rounded-lg mb-6 flex items-center gap-2">
        ${getMeteoHtml(cockpitData.meteoAxes.technique.meteo, cockpitData.meteoAxes.technique.statut)}
      </div>
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="font-bold mb-4">Jalons Techniques (temps réel)</h3>
        <table class="w-full text-sm">
          <tr class="bg-gray-200"><th class="p-2 text-left">Jalon</th><th class="p-2">Date cible</th><th class="p-2">Statut</th></tr>
          ${jalonsTechHtml}
        </table>
      </div>
    </div>

    <!-- Slide 6: AXE Budget -->
    <div id="slide-6" class="bg-white rounded-lg shadow-lg p-8 page-break">
      <div class="slide-header">
        <span class="text-sm text-[#D4AF37] font-semibold">SLIDE 6/10</span>
        <h2 class="text-2xl font-bold text-[#1C3163] mt-1">AXE BUDGET & FINANCES</h2>
      </div>
      <div class="p-3 ${cockpitData.meteoAxes.budget.meteo === 'soleil' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} border rounded-lg mb-6 flex items-center gap-2">
        ${getMeteoHtml(cockpitData.meteoAxes.budget.meteo, cockpitData.meteoAxes.budget.statut)}
      </div>
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="font-bold mb-4">Exécution Budgétaire (temps réel)</h3>
        <table class="w-full text-sm">
          <tr class="bg-gray-200"><th class="p-2 text-left">Poste</th><th class="p-2 text-right">Montant</th><th class="p-2 text-right">%</th></tr>
          <tr class="border-b"><td class="p-2">Budget Prévu</td><td class="p-2 text-right font-mono">${formatNumber(cockpitData.budgetPrevu)} FCFA</td><td class="p-2 text-right">100%</td></tr>
          <tr class="border-b"><td class="p-2">Engagé</td><td class="p-2 text-right font-mono">${formatNumber(cockpitData.budgetEngage)} FCFA</td><td class="p-2 text-right">${cockpitData.budgetPrevu > 0 ? ((cockpitData.budgetEngage / cockpitData.budgetPrevu) * 100).toFixed(1) : 0}%</td></tr>
          <tr class="border-b"><td class="p-2">Réalisé</td><td class="p-2 text-right font-mono">${formatNumber(cockpitData.budgetRealise)} FCFA</td><td class="p-2 text-right">${cockpitData.budgetPrevu > 0 ? ((cockpitData.budgetRealise / cockpitData.budgetPrevu) * 100).toFixed(1) : 0}%</td></tr>
          <tr class="bg-[#1C3163] text-white"><td class="p-2 font-bold">Reste à engager</td><td class="p-2 text-right font-bold font-mono">${formatNumber(cockpitData.budgetPrevu - cockpitData.budgetEngage)} FCFA</td><td class="p-2 text-right font-bold">${cockpitData.budgetPrevu > 0 ? (((cockpitData.budgetPrevu - cockpitData.budgetEngage) / cockpitData.budgetPrevu) * 100).toFixed(1) : 0}%</td></tr>
        </table>
      </div>
    </div>

    <!-- Slide 7: AXE Marketing -->
    <div id="slide-7" class="bg-white rounded-lg shadow-lg p-8 page-break">
      <div class="slide-header">
        <span class="text-sm text-[#D4AF37] font-semibold">SLIDE 7/10</span>
        <h2 class="text-2xl font-bold text-[#1C3163] mt-1">AXE MARKETING & COMMUNICATION</h2>
      </div>
      <div class="p-3 ${cockpitData.meteoAxes.marketing.meteo === 'soleil' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} border rounded-lg mb-6 flex items-center gap-2">
        ${getMeteoHtml(cockpitData.meteoAxes.marketing.meteo, cockpitData.meteoAxes.marketing.statut)}
      </div>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="font-bold mb-4">Jalons Marketing (temps réel)</h3>
          <ul class="space-y-2 text-sm">${jalonsMarketingHtml}</ul>
        </div>
        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="font-bold mb-4">Avancement</h3>
          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="bg-pink-50 p-3 rounded-lg"><p class="text-xl font-bold text-pink-700">${cockpitData.actionsByAxe('axe5_marketing').filter(a => a.statut === 'termine').length}</p><p class="text-xs">Actions faites</p></div>
            <div class="bg-purple-50 p-3 rounded-lg"><p class="text-xl font-bold text-purple-700">${cockpitData.actionsByAxe('axe5_marketing').filter(a => a.statut === 'en_cours').length}</p><p class="text-xs">En cours</p></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide 8: AXE Exploitation -->
    <div id="slide-8" class="bg-white rounded-lg shadow-lg p-8 page-break">
      <div class="slide-header">
        <span class="text-sm text-[#D4AF37] font-semibold">SLIDE 8/10</span>
        <h2 class="text-2xl font-bold text-[#1C3163] mt-1">AXE EXPLOITATION & JURIDIQUE</h2>
      </div>
      <div class="p-3 ${cockpitData.meteoAxes.exploitation.meteo === 'soleil' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} border rounded-lg mb-6 flex items-center gap-2">
        ${getMeteoHtml(cockpitData.meteoAxes.exploitation.meteo, cockpitData.meteoAxes.exploitation.statut)}
      </div>
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="font-bold mb-4">Avancement Exploitation (temps réel)</h3>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="bg-green-50 p-4 rounded-lg"><p class="text-xl font-bold text-green-700">${cockpitData.actionsByAxe('axe6_exploitation').filter(a => a.statut === 'termine').length}</p><p class="text-xs">Actions terminées</p></div>
          <div class="bg-blue-50 p-4 rounded-lg"><p class="text-xl font-bold text-blue-700">${cockpitData.actionsByAxe('axe6_exploitation').filter(a => a.statut === 'en_cours').length}</p><p class="text-xs">En cours</p></div>
          <div class="bg-purple-50 p-4 rounded-lg"><p class="text-xl font-bold text-purple-700">${cockpitData.jalonsByAxe('axe6_exploitation').filter(j => j.statut === 'atteint').length}/${cockpitData.jalonsByAxe('axe6_exploitation').length}</p><p class="text-xs">Jalons</p></div>
        </div>
      </div>
    </div>

    <!-- Slide 9: Risques -->
    <div id="slide-9" class="bg-white rounded-lg shadow-lg p-8 page-break">
      <div class="slide-header">
        <span class="text-sm text-[#D4AF37] font-semibold">SLIDE 9/10</span>
        <h2 class="text-2xl font-bold text-[#1C3163] mt-1">RISQUES MAJEURS</h2>
      </div>
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="font-bold mb-4">Top 5 Risques (temps réel - ${cockpitData.risquesActifs} actifs)</h3>
        <table class="w-full text-sm">
          <tr class="bg-gray-200"><th class="p-2 w-12">#</th><th class="p-2 text-left">Risque</th><th class="p-2 text-center">Prob.</th><th class="p-2 text-center">Impact</th><th class="p-2">Mitigation</th></tr>
          ${risquesHtml}
        </table>
      </div>
    </div>

    <!-- Slide 10: Décisions -->
    <div id="slide-10" class="bg-white rounded-lg shadow-lg p-8 page-break">
      <div class="slide-header">
        <span class="text-sm text-[#D4AF37] font-semibold">SLIDE 10/10</span>
        <h2 class="text-2xl font-bold text-[#1C3163] mt-1">DÉCISIONS ATTENDUES</h2>
      </div>
      <div class="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 class="font-bold mb-4">Décisions Attendues (temps réel)</h3>
        <div class="space-y-3">
          ${(() => {
            const decisionsActions = actions
              ?.filter(a => (a.type_action === 'decision' || a.type_action === 'validation' || a.statut === 'en_validation') && a.statut !== 'termine' && a.statut !== 'annule')
              .slice(0, 6) || [];
            return decisionsActions.length > 0
              ? decisionsActions.map((a, i) => `
                <div class="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span>${i + 1}. ${a.titre}</span>
                  <span class="text-gray-400">☐ Validé  ☐ À modifier</span>
                </div>
              `).join('')
              : '<div class="text-center text-gray-500 p-4">Aucune décision en attente</div>';
          })()}
        </div>
      </div>
    </div>
  </div>

  <div class="bg-[#1C3163] text-white p-4 mt-8 no-print">
    <div class="max-w-6xl mx-auto text-center text-sm">
      <p>Deep Dive Lancement - Cosmos Angré - CRMC / New Heaven SA</p>
      <p class="opacity-75 mt-1">Document généré le ${new Date().toLocaleDateString('fr-FR')} via COCKPIT (données temps réel)</p>
    </div>
  </div>

  <script>document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); document.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth' }); }));</script>
</body>
</html>`;
  };

  // Ouvrir HTML dans une nouvelle fenêtre
  const openHtmlPreview = () => {
    const html = generateHtmlContent();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  // Télécharger le fichier HTML
  const downloadHtml = () => {
    const html = generateHtmlContent();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deep-dive-lancement-${presentationDate}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Générer PowerPoint (même qualité que Deep Dive Mensuel)
  const generatePowerPoint = async () => {
    setGenerating(true);

    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();

      const dateFormatted = new Date(presentationDate).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      pptx.author = 'Cockpit Cosmos Angré';
      pptx.title = `Deep Dive Lancement - Cosmos Angré - ${dateFormatted}`;
      pptx.subject = 'Validation Stratégique Direction Générale';
      pptx.company = 'Cosmos Angré / CRMC / New Heaven SA';

      // Design settings
      const primaryColor = '1C3163';
      const accentColor = 'D4AF37';
      const fontFamily = 'Arial';

      // Helper functions
      const addSlideHeader = (slide: InstanceType<typeof PptxGenJS>['Slide'], title: string, axeColor?: string) => {
        slide.addShape('rect', {
          x: 0,
          y: 0,
          w: '100%',
          h: 0.8,
          fill: { color: primaryColor },
        });

        if (axeColor) {
          slide.addShape('rect', {
            x: 0.3,
            y: 0.2,
            w: 0.4,
            h: 0.4,
            fill: { color: axeColor },
          });
        }

        slide.addText(title, {
          x: axeColor ? 0.9 : 0.5,
          y: 0.2,
          w: 7,
          h: 0.5,
          fontSize: 24,
          fontFace: fontFamily,
          color: 'FFFFFF',
          bold: true,
        });

        slide.addText('COSMOS ANGRÉ', {
          x: 7.5,
          y: 0.2,
          w: 2,
          h: 0.5,
          fontSize: 12,
          fontFace: fontFamily,
          color: accentColor,
          align: 'right',
        });
      };

      const addSlideFooter = (slide: InstanceType<typeof PptxGenJS>['Slide'], pageNum: number, total: number) => {
        slide.addText(
          `Deep Dive Lancement - ${dateFormatted}`,
          {
            x: 0.5,
            y: 5.2,
            w: 4,
            h: 0.3,
            fontSize: 8,
            fontFace: fontFamily,
            color: '666666',
          }
        );
        slide.addText(`${pageNum} / ${total}`, {
          x: 8.5,
          y: 5.2,
          w: 1,
          h: 0.3,
          fontSize: 8,
          fontFace: fontFamily,
          color: primaryColor,
          align: 'right',
        });
      };

      const totalSlides = slides.length + 2; // +2 pour page de garde et page de fin

      // ===== SLIDE 0: PAGE DE GARDE =====
      const coverSlide = pptx.addSlide();
      coverSlide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: primaryColor },
      });
      coverSlide.addText('DEEP DIVE LANCEMENT', {
        x: 0.5, y: 1.5, w: 9, h: 1,
        fontSize: 40, fontFace: fontFamily, color: 'FFFFFF', bold: true, align: 'center',
      });
      coverSlide.addText('COSMOS ANGRÉ', {
        x: 0.5, y: 2.5, w: 9, h: 0.6,
        fontSize: 28, fontFace: fontFamily, color: accentColor, bold: true, align: 'center',
      });
      coverSlide.addText('Validation Stratégique | Présentation Direction Générale', {
        x: 0.5, y: 3.3, w: 9, h: 0.4,
        fontSize: 14, fontFace: fontFamily, color: 'FFFFFF', align: 'center',
      });
      coverSlide.addText(dateFormatted, {
        x: 0.5, y: 4.2, w: 9, h: 0.4,
        fontSize: 16, fontFace: fontFamily, color: accentColor, align: 'center',
      });
      coverSlide.addText(`Présenté par : ${siteData.presentateur.nom}, ${siteData.presentateur.titre}`, {
        x: 0.5, y: 4.8, w: 9, h: 0.3,
        fontSize: 11, fontFace: fontFamily, color: 'CCCCCC', align: 'center',
      });

      // ===== SLIDES 1-10: CONTENU =====
      slides.forEach((slideInfo, index) => {
        const slide = pptx.addSlide();
        const pageNum = index + 2;

        // Couleur par axe
        const axeColors: Record<number, string> = {
          3: '3B82F6', // RH - blue
          4: '6366F1', // Commercial - indigo
          5: '8B5CF6', // Technique - purple
          6: 'F59E0B', // Budget - amber
          7: 'EC4899', // Marketing - pink
          8: '10B981', // Exploitation - green
          9: 'EF4444', // Risques - red
          10: 'F97316', // Décisions - orange
        };

        addSlideHeader(slide, slideInfo.titre, axeColors[slideInfo.numero]);
        addSlideFooter(slide, pageNum, totalSlides);

        // Contenu spécifique par slide
        if (slideInfo.numero === 1) {
          // Agenda
          const agendaItems = [
            '1. Rappel du projet & Météo globale',
            '2. AXE RH & Organisation',
            '3. AXE Commercial & Leasing',
            '4. AXE Technique & Handover',
            '5. AXE Budget & Finances',
            '6. AXE Marketing & Communication',
            '7. AXE Exploitation & Juridique',
            '8. Risques Majeurs',
            '9. Décisions Attendues',
          ];
          agendaItems.forEach((item, i) => {
            slide.addText(item, {
              x: 1, y: 1.2 + i * 0.4, w: 8, h: 0.35,
              fontSize: 14, fontFace: fontFamily, color: primaryColor,
              bullet: { type: 'number' },
            });
          });
        } else if (slideInfo.numero === 2) {
          // Rappel projet - données réelles du site
          const projetInfo = [
            ['Nom du projet', siteData.nom],
            ['Société', siteData.societe],
            ['Surface GLA', `${siteData.surfaceGLA.toLocaleString()} m²`],
            ['Occupation cible', `${siteData.occupationCible}%`],
            ['Soft Opening', new Date(siteData.softOpening).toLocaleDateString('fr-FR')],
            ['Inauguration', new Date(siteData.inauguration).toLocaleDateString('fr-FR')],
          ];
          projetInfo.forEach((row, i) => {
            slide.addText(row[0], { x: 0.5, y: 1.0 + i * 0.35, w: 2.5, h: 0.3, fontSize: 11, fontFace: fontFamily, color: '666666' });
            slide.addText(row[1], { x: 3, y: 1.0 + i * 0.35, w: 4, h: 0.3, fontSize: 11, fontFace: fontFamily, color: primaryColor, bold: true });
          });

          // Météo par axe
          slide.addText('Météo par axe stratégique', { x: 0.5, y: 3.2, w: 9, h: 0.3, fontSize: 14, fontFace: fontFamily, color: primaryColor, bold: true });
          const axes = ['RH', 'Commercial', 'Technique', 'Budget', 'Marketing', 'Exploitation'];
          axes.forEach((axe, i) => {
            slide.addText(`• ${axe}`, { x: 0.5 + (i % 3) * 3, y: 3.6 + Math.floor(i / 3) * 0.4, w: 2.8, h: 0.3, fontSize: 10, fontFace: fontFamily, color: '333333' });
          });
        } else {
          // Slides génériques pour les axes
          slide.addText('Contenu généré depuis les données Cockpit', {
            x: 0.5, y: 1.2, w: 9, h: 0.4,
            fontSize: 12, fontFace: fontFamily, color: '666666', italic: true,
          });

          // KPIs de l'axe
          const kpiBoxes = [
            { label: 'Actions', value: cockpitData.totalActions?.toString() || '-' },
            { label: 'Jalons', value: cockpitData.totalJalons?.toString() || '-' },
            { label: 'Risques', value: cockpitData.top5Risques?.length?.toString() || '-' },
            { label: 'Avancement', value: `${cockpitData.avancementGlobal || 0}%` },
          ];

          kpiBoxes.forEach((kpi, i) => {
            slide.addShape('rect', { x: 0.5 + i * 2.3, y: 1.8, w: 2.1, h: 1, fill: { color: 'F3F4F6' } });
            slide.addText(kpi.value, { x: 0.5 + i * 2.3, y: 1.9, w: 2.1, h: 0.5, fontSize: 24, fontFace: fontFamily, color: primaryColor, bold: true, align: 'center' });
            slide.addText(kpi.label, { x: 0.5 + i * 2.3, y: 2.4, w: 2.1, h: 0.3, fontSize: 10, fontFace: fontFamily, color: '666666', align: 'center' });
          });
        }
      });

      // ===== SLIDE FINALE: PAGE DE FIN =====
      const endSlide = pptx.addSlide();
      endSlide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: primaryColor },
      });
      endSlide.addText('Merci de votre attention', {
        x: 0.5, y: 2, w: 9, h: 0.8,
        fontSize: 32, fontFace: fontFamily, color: 'FFFFFF', bold: true, align: 'center',
      });
      endSlide.addText('Questions ?', {
        x: 0.5, y: 3, w: 9, h: 0.5,
        fontSize: 20, fontFace: fontFamily, color: accentColor, align: 'center',
      });
      endSlide.addText('COSMOS ANGRÉ - CRMC / New Heaven SA', {
        x: 0.5, y: 4.5, w: 9, h: 0.3,
        fontSize: 12, fontFace: fontFamily, color: 'CCCCCC', align: 'center',
      });

      // Sauvegarder
      await pptx.writeFile({ fileName: `DeepDive-Lancement-${presentationDate}.pptx` });

    } catch (error) {
      console.error('Erreur génération PPTX:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Copier le lien HTML
  const copyHtmlToClipboard = () => {
    const html = generateHtmlContent();
    navigator.clipboard.writeText(html).then(() => {
      alert('HTML copié dans le presse-papiers !');
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">DEEP DIVE LANCEMENT</h1>
          <p className="text-sm text-primary-500">
            Projet Cosmos Angré - Validation Stratégique
          </p>
          <p className="text-xs text-primary-400">
            Présenté par : {siteData.presentateur.nom}, {siteData.presentateur.titre} | Destinataires : {siteData.destinataires.join(', ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-400" />
            <input
              type="date"
              value={presentationDate}
              onChange={(e) => setPresentationDate(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={openHtmlPreview}>
            <Globe className="h-4 w-4 mr-2" />
            Voir HTML
          </Button>
          <Button variant="outline" size="sm" onClick={downloadHtml}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger HTML
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button size="sm" onClick={generatePowerPoint} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter PPTX
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Navigation des slides */}
      <Card padding="sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {slides.map((slide) => (
            <button
              key={slide.numero}
              onClick={() => setActiveSlide(slide.numero)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeSlide === slide.numero
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-primary-500 hover:bg-primary-50'
              )}
            >
              <span className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center text-xs font-bold">
                {slide.numero}
              </span>
              <span className="hidden md:inline">{slide.titre}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Contenu de la slide active */}
      <Card padding="lg">
        <div className="mb-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary-900">
              SLIDE {activeSlide} - {slides.find(s => s.numero === activeSlide)?.titre.toUpperCase()}
            </h2>
            <Badge variant="outline">
              {activeSlide} / {slides.length}
            </Badge>
          </div>
        </div>

        <ActiveSlideComponent />

        {/* Navigation bas */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setActiveSlide(Math.max(1, activeSlide - 1))}
            disabled={activeSlide === 1}
          >
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Précédent
          </Button>
          <span className="text-sm text-primary-500">
            Deep Dive Lancement - Cosmos Angré - CRMC / New Heaven SA
          </span>
          <Button
            variant="outline"
            onClick={() => setActiveSlide(Math.min(slides.length, activeSlide + 1))}
            disabled={activeSlide === slides.length}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Modal Preview - Une slide à la fois avec navigation */}
      <Dialog open={showPreview} onOpenChange={(open) => {
        setShowPreview(open);
        if (open) setPreviewSlideIndex(0);
      }}>
        <DialogContent className={cn(
          "overflow-hidden flex flex-col",
          isFullscreen ? "fixed inset-0 max-w-none max-h-none w-screen h-screen rounded-none" : "max-w-[95vw] max-h-[95vh] w-full h-[90vh]"
        )}>
          {/* Header du preview */}
          <DialogHeader className="flex-shrink-0 border-b pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-4">
                <h4 className="font-semibold text-primary-900">
                  Slide {previewSlideIndex + 1} / {slides.length}
                </h4>
                <span className="text-sm text-primary-500">
                  {slides[previewSlideIndex]?.titre}
                </span>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigatePreview('prev')} disabled={previewSlideIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigatePreview('next')} disabled={previewSlideIndex === slides.length - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={openHtmlPreview}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  HTML
                </Button>
                <Button variant="outline" size="sm" onClick={downloadHtml}>
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Contenu - Une seule slide à la fois */}
          <div className={cn("bg-gray-100 rounded-lg p-4 flex items-center justify-center", isFullscreen ? "flex-1" : "flex-1 min-h-0")}>
            <div
              className={cn(
                "bg-white shadow-lg overflow-hidden rounded-xl flex flex-col",
                isFullscreen ? "w-full h-full" : "w-full max-w-4xl"
              )}
              style={{ height: isFullscreen ? '100%' : 'calc(100% - 16px)' }}
            >
              {/* Header de slide */}
              <div className="flex-shrink-0 bg-gradient-to-r from-[#1C3163] to-[#2a4a8a] text-white px-6 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[#D4AF37] text-sm font-semibold">
                      SLIDE {previewSlideIndex + 1}/{slides.length}
                    </span>
                    <h3 className="text-lg font-bold mt-0.5">{slides[previewSlideIndex]?.titre.toUpperCase()}</h3>
                  </div>
                  <div className="text-right text-sm opacity-75">
                    <p>Cosmos Angré</p>
                    <p>Deep Dive Lancement</p>
                  </div>
                </div>
              </div>
              {/* Contenu de slide */}
              <div className="flex-1 min-h-0 p-6 overflow-y-auto">
                {slides[previewSlideIndex] && (() => {
                  const SlideComponent = slides[previewSlideIndex].component;
                  return <SlideComponent />;
                })()}
              </div>
              {/* Footer de slide */}
              <div className="flex-shrink-0 bg-gray-50 px-6 py-2 border-t flex items-center justify-between text-xs text-gray-500">
                <span>CRMC / New Heaven SA - Confidentiel</span>
                <span>Page {previewSlideIndex + 1}</span>
              </div>
            </div>
          </div>

          {/* Thumbnails des slides - seulement si pas en fullscreen */}
          {!isFullscreen && (
            <div className="flex-shrink-0 mt-4 flex gap-2 overflow-x-auto py-2 px-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.numero}
                  onClick={() => setPreviewSlideIndex(index)}
                  className={cn(
                    "flex-shrink-0 w-20 h-14 rounded border-2 overflow-hidden transition-all",
                    index === previewSlideIndex
                      ? "border-primary-500 ring-2 ring-primary-200"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">{index + 1}</span>
                    <span className="text-[8px] text-gray-400 text-center px-1 truncate w-full">
                      {slide.titre.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Footer du modal */}
          <div className="flex-shrink-0 border-t pt-4 flex items-center justify-between bg-white">
            <p className="text-sm text-primary-500">
              {slides.length} slides • {new Date(presentationDate).toLocaleDateString('fr-FR')}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyHtmlToClipboard}>
                <Copy className="h-4 w-4 mr-1" />
                Copier HTML
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" />
                Imprimer
              </Button>
              <Button size="sm" onClick={() => setShowPreview(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DeepDiveLancement;
