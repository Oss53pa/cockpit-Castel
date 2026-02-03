/**
 * Vue Construction - Centre Commercial ↔ Mobilisation
 * Affiche le Gantt complet avec synchronisation entre phases CC et axes Mobilisation
 * Spécifications v2.0 COMPLÈTES
 * Updated: 2026-01-31
 *
 * NOTE: Cette vue utilise les vraies données de la base de données
 * - Phases CC: Calculées à partir des actions axe7_construction
 * - Jalons Mobilisation: Proviennent de useJalons
 * - Bâtiments: Configurés via BATIMENTS_CONFIG
 * - Événements: Proviennent de useProjectConfig
 */

import { useState, useMemo } from 'react';
import {
  Building2,
  ArrowRight,
  Download,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Users,
  Briefcase,
  Wrench,
  Wallet,
  Megaphone,
  Settings,
  Calendar,
  Zap,
  Target,
} from 'lucide-react';
import { format, eachMonthOfInterval, differenceInDays, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Badge, Button, ScrollArea, Tooltip, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useJalons, useActions, useProjectConfig } from '@/hooks';
import { PHASES_CONSTRUCTION, AXES, AXE_SHORT_LABELS, BATIMENTS_CONFIG, BUILDING_CODES, type Axe, type BuildingCode } from '@/types';
import { SEUILS_SYNC, PROJET_CONFIG } from '@/data/constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface PhaseCC {
  code: string;
  nom: string;
  ordre: number;
  avancement: number;
  dateDebut: string;
  dateFin: string;
  couleur: string;
}

interface AutreBatiment {
  code: string;
  nom: string;
  avancement: number;
  dateDebut: string;
  dateFin: string;
}

interface JalonMob {
  id: string;
  axe: Axe;
  titre: string;
  dateDebut: string;
  dateFin: string;
  avancement: number;
  declencheurCC?: string; // Code de la phase CC qui déclenche
}

// Axes de mobilisation (tous sauf construction)
const AXES_MOBILISATION: Axe[] = [
  'axe1_rh',
  'axe2_commercial',
  'axe3_technique',
  'axe4_budget',
  'axe5_marketing',
  'axe6_exploitation',
];

// Configuration des axes avec icônes
const AXE_CONFIG: Record<Axe, { icon: typeof Users; color: string; bgLight: string; bgDark: string }> = {
  axe1_rh: { icon: Users, color: 'text-blue-700', bgLight: 'bg-blue-100', bgDark: 'bg-blue-500' },
  axe2_commercial: { icon: Briefcase, color: 'text-emerald-700', bgLight: 'bg-emerald-100', bgDark: 'bg-emerald-500' },
  axe3_technique: { icon: Wrench, color: 'text-orange-700', bgLight: 'bg-orange-100', bgDark: 'bg-orange-500' },
  axe4_budget: { icon: Wallet, color: 'text-purple-700', bgLight: 'bg-purple-100', bgDark: 'bg-purple-500' },
  axe5_marketing: { icon: Megaphone, color: 'text-pink-700', bgLight: 'bg-pink-100', bgDark: 'bg-pink-500' },
  axe6_exploitation: { icon: Settings, color: 'text-cyan-700', bgLight: 'bg-cyan-100', bgDark: 'bg-cyan-500' },
  axe7_construction: { icon: Building2, color: 'text-amber-700', bgLight: 'bg-amber-100', bgDark: 'bg-amber-500' },
};

// Safe helper to get axe config with fallback
const getAxeConfig = (axe: string) => {
  return AXE_CONFIG[axe as Axe] || AXE_CONFIG.axe1_rh;
};

// Couleurs des phases CC
const PHASE_COLORS: Record<string, string> = {
  GO: 'bg-red-500',
  SO: 'bg-orange-500',
  LT: 'bg-amber-500',
  AE: 'bg-yellow-500',
  PR: 'bg-lime-500',
  RP: 'bg-green-500',
  RD: 'bg-emerald-500',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Dates par défaut pour les phases de construction
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Retourne les dates par défaut pour une phase de construction
 * basées sur la configuration projet
 */
function getDefaultPhaseDates(phaseCode: string): { dateDebut: string; dateFin: string } {
  // Durées typiques des phases (en mois)
  const phaseDurations: Record<string, { startOffset: number; duration: number }> = {
    GO: { startOffset: 0, duration: 6 },    // Gros œuvre: mois 0-6
    SO: { startOffset: 3, duration: 6 },    // Second œuvre: mois 3-9
    LT: { startOffset: 5, duration: 7 },    // Lots techniques: mois 5-12
    AE: { startOffset: 8, duration: 6 },    // Aménagements extérieurs: mois 8-14
    PR: { startOffset: 12, duration: 3 },   // Pré-réception: mois 12-15
    RP: { startOffset: 15, duration: 2 },   // Réception provisoire: mois 15-17
    RD: { startOffset: 17, duration: 2 },   // Réception définitive: mois 17-19
  };

  const phase = phaseDurations[phaseCode] || { startOffset: 0, duration: 3 };
  const baseDate = new Date(PROJET_CONFIG.dateDebut);

  const debut = addMonths(baseDate, phase.startOffset);
  const fin = addMonths(debut, phase.duration);

  return {
    dateDebut: debut.toISOString().split('T')[0],
    dateFin: fin.toISOString().split('T')[0],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Détection des déclencheurs CC basée sur les SEUILS_SYNC
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Trouve le déclencheur CC pour un jalon basé sur les seuils de synchronisation
 */
function findDeclencheurCC(jalonId: string, axe: Axe): string | undefined {
  // Mapper les axes vers les codes utilisés dans SEUILS_SYNC
  const axeToCode: Record<string, string> = {
    axe1_rh: 'RH',
    axe2_commercial: 'COM',
    axe3_technique: 'TECH',
    axe4_budget: 'BUD',
    axe5_marketing: 'MKT',
    axe6_exploitation: 'EXP',
  };

  const axeCode = axeToCode[axe];
  if (!axeCode) return undefined;

  // Chercher un seuil correspondant
  const seuil = SEUILS_SYNC.find(s =>
    s.axeCible === axeCode &&
    s.actionCode?.includes(jalonId.replace('J', '').split('-')[0])
  );

  return seuil?.phaseCode;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function ConstructionCCView() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['cc', 'autres', 'axe1_rh', 'axe2_commercial', 'axe3_technique', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'])
  );
  const [zoomLevel, setZoomLevel] = useState<'month' | 'quarter'>('month');

  // ══════════════════════════════════════════════════════════════════════════
  // DONNÉES RÉELLES DE LA BASE DE DONNÉES
  // ══════════════════════════════════════════════════════════════════════════

  // Configuration projet
  const projectConfig = useProjectConfig();

  // Actions pour calculer les avancements
  const allActions = useActions();

  // Jalons pour les axes de mobilisation
  const allJalons = useJalons();

  // ══════════════════════════════════════════════════════════════════════════
  // CALCUL DES PHASES CC À PARTIR DES ACTIONS AXE7_CONSTRUCTION
  // ══════════════════════════════════════════════════════════════════════════

  const phasesCC = useMemo((): PhaseCC[] => {
    // Actions du Centre Commercial (CC)
    const actionsCC = allActions.filter(a => a.axe === 'axe7_construction' && a.buildingCode === 'CC');

    // Phases de construction avec calcul d'avancement
    return PHASES_CONSTRUCTION.map(phase => {
      // Filtrer les actions de cette phase (basé sur la période ou le code WBS)
      const actionsPhase = actionsCC.filter(a => {
        // Matcher par code dans le code_wbs ou id_action
        const code = a.code_wbs || a.id_action || '';
        return code.includes(phase.code) || code.includes(`-${phase.code}-`);
      });

      // Calculer l'avancement moyen
      const avancement = actionsPhase.length > 0
        ? Math.round(actionsPhase.reduce((sum, a) => sum + a.avancement, 0) / actionsPhase.length)
        : 0;

      // Calculer les dates à partir des actions ou utiliser des dates par défaut
      const dates = actionsPhase.length > 0
        ? {
            dateDebut: actionsPhase.reduce((min, a) =>
              a.date_debut_prevue < min ? a.date_debut_prevue : min, actionsPhase[0].date_debut_prevue),
            dateFin: actionsPhase.reduce((max, a) =>
              a.date_fin_prevue > max ? a.date_fin_prevue : max, actionsPhase[0].date_fin_prevue),
          }
        : getDefaultPhaseDates(phase.code);

      return {
        code: phase.code,
        nom: phase.nom,
        ordre: phase.ordre,
        avancement,
        dateDebut: dates.dateDebut,
        dateFin: dates.dateFin,
        couleur: PHASE_COLORS[phase.code] || 'bg-neutral-500',
      };
    });
  }, [allActions]);

  // ══════════════════════════════════════════════════════════════════════════
  // CALCUL DES AUTRES BÂTIMENTS À PARTIR DES ACTIONS
  // ══════════════════════════════════════════════════════════════════════════

  const autresBatiments = useMemo((): AutreBatiment[] => {
    const codes: BuildingCode[] = ['MKT', 'BB1', 'BB2', 'BB3', 'BB4'];

    return codes.map(code => {
      const config = BATIMENTS_CONFIG[code];
      const actionsBat = allActions.filter(a => a.buildingCode === code);

      const avancement = actionsBat.length > 0
        ? Math.round(actionsBat.reduce((sum, a) => sum + a.avancement, 0) / actionsBat.length)
        : 0;

      const dates = actionsBat.length > 0
        ? {
            dateDebut: actionsBat.reduce((min, a) =>
              a.date_debut_prevue < min ? a.date_debut_prevue : min, actionsBat[0].date_debut_prevue),
            dateFin: actionsBat.reduce((max, a) =>
              a.date_fin_prevue > max ? a.date_fin_prevue : max, actionsBat[0].date_fin_prevue),
          }
        : { dateDebut: PROJET_CONFIG.dateDebut, dateFin: PROJET_CONFIG.dateFin };

      return {
        code,
        nom: config?.nom || code,
        avancement,
        dateDebut: dates.dateDebut,
        dateFin: dates.dateFin,
      };
    });
  }, [allActions]);

  // ══════════════════════════════════════════════════════════════════════════
  // JALONS DE MOBILISATION À PARTIR DE LA BASE DE DONNÉES
  // ══════════════════════════════════════════════════════════════════════════

  const jalonsMobilisation = useMemo((): JalonMob[] => {
    // Filtrer les jalons des axes de mobilisation (pas construction)
    const jalonsMob = allJalons.filter(j => AXES_MOBILISATION.includes(j.axe));

    return jalonsMob.map(j => ({
      id: j.id_jalon || `J-${j.id}`,
      axe: j.axe,
      titre: j.titre,
      dateDebut: j.date_prevue, // Utiliser date_prevue comme début (jalons sont ponctuels)
      dateFin: j.date_prevue,
      avancement: j.avancement_prealables || 0,
      declencheurCC: findDeclencheurCC(j.id_jalon, j.axe),
    }));
  }, [allJalons]);

  // ══════════════════════════════════════════════════════════════════════════
  // ÉVÉNEMENTS À PARTIR DE LA CONFIGURATION PROJET
  // ══════════════════════════════════════════════════════════════════════════

  const evenements = useMemo(() => {
    const events: Array<{ id: string; titre: string; date: string; declencheurCC?: string }> = [];

    // Soft Opening
    const softOpeningDate = projectConfig?.dateSoftOpening
      || PROJET_CONFIG.jalonsClés.softOpening;
    if (softOpeningDate) {
      events.push({
        id: 'EVT-1',
        titre: 'Soft Opening',
        date: softOpeningDate.length === 7 ? `${softOpeningDate}-15` : softOpeningDate,
        declencheurCC: 'RP',
      });
    }

    // Inauguration
    const inaugurationDate = PROJET_CONFIG.jalonsClés.inauguration;
    if (inaugurationDate) {
      events.push({
        id: 'EVT-2',
        titre: 'Inauguration',
        date: inaugurationDate,
        declencheurCC: 'RD',
      });
    }

    return events;
  }, [projectConfig]);

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION TIMELINE DYNAMIQUE
  // ══════════════════════════════════════════════════════════════════════════

  // Calculer les dates de la timeline à partir des données réelles
  const { startDate, endDate, months, totalDays } = useMemo(() => {
    // Date de début: 3 mois avant la première action/jalon ou date projet
    const allDates = [
      ...allActions.map(a => a.date_debut_prevue),
      ...allJalons.map(j => j.date_prevue),
      PROJET_CONFIG.dateDebut,
    ].filter(Boolean);

    const minDate = allDates.length > 0
      ? new Date(allDates.reduce((min, d) => d < min ? d : min))
      : new Date(PROJET_CONFIG.dateDebut);

    // Date de fin: 2 mois après la dernière action/jalon ou date projet
    const maxDate = allDates.length > 0
      ? new Date(allDates.reduce((max, d) => d > max ? d : max))
      : new Date(PROJET_CONFIG.dateFin);

    // Ajouter des marges
    const start = new Date(minDate);
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);

    const end = new Date(maxDate);
    end.setMonth(end.getMonth() + 2);

    const monthsInterval = eachMonthOfInterval({ start, end });
    const days = differenceInDays(end, start);

    return {
      startDate: start,
      endDate: end,
      months: monthsInterval,
      totalDays: days,
    };
  }, [allActions, allJalons]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(['cc', 'autres', ...AXES]));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  // Calculer la position d'une date sur la timeline
  const getPosition = (dateStr: string) => {
    const date = parseISO(dateStr);
    const days = differenceInDays(date, startDate);
    return Math.max(0, Math.min(100, (days / totalDays) * 100));
  };

  // Calculer la largeur d'une barre
  const getBarWidth = (dateDebutStr: string, dateFinStr: string) => {
    const start = getPosition(dateDebutStr);
    const end = getPosition(dateFinStr);
    return Math.max(2, end - start);
  };

  // Rendu d'une barre de progression
  const renderBar = (
    dateDebut: string,
    dateFin: string,
    avancement: number,
    couleur: string,
    label?: string,
    declencheurCC?: string
  ) => {
    const left = getPosition(dateDebut);
    const width = getBarWidth(dateDebut, dateFin);

    return (
      <div className="relative h-7 flex items-center">
        {/* Barre de fond */}
        <div
          className={cn('absolute h-5 rounded-md opacity-30', couleur)}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        {/* Barre de progression */}
        <div
          className={cn('absolute h-5 rounded-md', couleur)}
          style={{
            left: `${left}%`,
            width: `${(width * avancement) / 100}%`,
          }}
        />
        {/* Label */}
        {label && (
          <span
            className="absolute text-[10px] font-medium text-white truncate px-1"
            style={{
              left: `${left + 0.5}%`,
              maxWidth: `${width - 1}%`,
            }}
          >
            {label}
          </span>
        )}
        {/* Indicateur de déclencheur */}
        {declencheurCC && (
          <Tooltip content={`Déclenché par ${declencheurCC}`}>
            <div
              className="absolute -top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow cursor-help"
              style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
            >
              <Zap className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
            </div>
          </Tooltip>
        )}
      </div>
    );
  };

  // Ligne de synchro entre CC et Mobilisation
  const renderSyncLine = (phaseCode: string, targetLeft: number) => {
    const phaseCC = phasesCC.find(p => p.code === phaseCode);
    if (!phaseCC) return null;

    const ccEndPos = getPosition(phaseCC.dateFin);

    return (
      <svg
        className="absolute inset-0 pointer-events-none z-10"
        style={{ overflow: 'visible' }}
      >
        <line
          x1={`${ccEndPos}%`}
          y1="0"
          x2={`${targetLeft}%`}
          y2="100%"
          stroke="#ef4444"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.5"
        />
      </svg>
    );
  };

  // Avancement global CC
  const avancementGlobalCC = useMemo(() => {
    if (phasesCC.length === 0) return 0;
    return Math.round(phasesCC.reduce((sum, p) => sum + p.avancement, 0) / phasesCC.length);
  }, [phasesCC]);

  // Soft Opening formaté pour l'affichage
  const softOpeningLabel = useMemo(() => {
    const evt = evenements.find(e => e.titre === 'Soft Opening');
    if (!evt?.date) return '';
    try {
      return format(parseISO(evt.date), 'dd/MM/yyyy');
    } catch {
      return evt.date;
    }
  }, [evenements]);

  // Aujourd'hui
  const today = new Date();
  const todayPos = getPosition(today.toISOString().split('T')[0]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-red-500 to-amber-500 rounded-xl shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Construction ↔ Mobilisation
            </h2>
            <p className="text-sm text-neutral-500">
              Synchronisation temps réel{softOpeningLabel && ` • Soft Opening : ${softOpeningLabel}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="w-4 h-4 mr-1" />
            Tout déplier
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronUp className="w-4 h-4 mr-1" />
            Tout replier
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <Card padding="sm" className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-700">{avancementGlobalCC}%</p>
            <p className="text-xs text-red-600">CC Global</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-900">
              {phasesCC.filter(p => p.avancement >= 100).length}/{phasesCC.length}
            </p>
            <p className="text-xs text-neutral-500">Phases CC</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {jalonsMobilisation.filter(j => j.avancement >= 100).length}/{jalonsMobilisation.length}
            </p>
            <p className="text-xs text-neutral-500">Jalons Mob.</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {jalonsMobilisation.filter(j => j.declencheurCC).length}
            </p>
            <p className="text-xs text-neutral-500">Syncs actives</p>
          </div>
        </Card>
        <Card padding="sm" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <p className="text-lg font-bold text-green-700">{softOpeningLabel || '-'}</p>
            <p className="text-xs text-green-600">Soft Opening</p>
          </div>
        </Card>
      </div>

      {/* Gantt View */}
      <Card padding="none" className="overflow-hidden">
        <div className="flex max-h-[calc(100vh-320px)]">
          {/* Left Panel - Labels */}
          <div className="w-64 shrink-0 border-r bg-neutral-50 flex flex-col">
            {/* Header */}
            <div className="h-10 border-b bg-neutral-100 px-3 flex items-center font-semibold text-sm text-neutral-700 shrink-0">
              Structure
            </div>

            <ScrollArea className="flex-1">
              {/* SECTION: CENTRE COMMERCIAL */}
              <div
                className="flex items-center gap-2 px-3 py-2 bg-red-100 border-b cursor-pointer hover:bg-red-200"
                onClick={() => toggleSection('cc')}
              >
                {expandedSections.has('cc') ? (
                  <ChevronDown className="w-4 h-4 text-red-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-red-600" />
                )}
                <Building2 className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-red-700 text-sm">CENTRE COMMERCIAL</span>
              </div>
              {expandedSections.has('cc') &&
                phasesCC.map((phase) => (
                  <div
                    key={phase.code}
                    className="flex items-center gap-2 px-3 py-1.5 pl-8 border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <div className={cn('w-2 h-2 rounded-full', phase.couleur)} />
                    <span className="text-xs text-neutral-700 truncate flex-1">{phase.nom}</span>
                    <span className="text-xs font-semibold text-neutral-500">{phase.avancement}%</span>
                  </div>
                ))}

              {/* SECTION: AUTRES BÂTIMENTS */}
              <div
                className="flex items-center gap-2 px-3 py-2 bg-neutral-200 border-b cursor-pointer hover:bg-neutral-300"
                onClick={() => toggleSection('autres')}
              >
                {expandedSections.has('autres') ? (
                  <ChevronDown className="w-4 h-4 text-neutral-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-neutral-600" />
                )}
                <Building2 className="w-4 h-4 text-neutral-600" />
                <span className="font-semibold text-neutral-700 text-sm">AUTRES BÂTIMENTS</span>
              </div>
              {expandedSections.has('autres') &&
                autresBatiments.map((bat) => (
                  <div
                    key={bat.code}
                    className="flex items-center gap-2 px-3 py-1.5 pl-8 border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <div className="w-2 h-2 rounded-full bg-neutral-400" />
                    <span className="text-xs text-neutral-700 truncate flex-1">{bat.nom}</span>
                    <span className="text-xs font-semibold text-neutral-500">{bat.avancement}%</span>
                  </div>
                ))}

              {/* Séparateur MOBILISATION */}
              <div className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm">
                MOBILISATION
              </div>

              {/* SECTIONS PAR AXE */}
              {AXES.filter(a => a !== 'axe7_construction').map((axe) => {
                const config = getAxeConfig(axe);
                const Icon = config.icon;
                const jalonsPourAxe = jalonsMobilisation.filter((j) => j.axe === axe);

                return (
                  <div key={axe}>
                    <div
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 border-b cursor-pointer',
                        config.bgLight,
                        'hover:opacity-80'
                      )}
                      onClick={() => toggleSection(axe)}
                    >
                      {expandedSections.has(axe) ? (
                        <ChevronDown className={cn('w-4 h-4', config.color)} />
                      ) : (
                        <ChevronRight className={cn('w-4 h-4', config.color)} />
                      )}
                      <Icon className={cn('w-4 h-4', config.color)} />
                      <span className={cn('font-semibold text-xs truncate', config.color)}>
                        {AXE_SHORT_LABELS[axe]}
                      </span>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {jalonsPourAxe.length}
                      </Badge>
                    </div>
                    {expandedSections.has(axe) &&
                      jalonsPourAxe.map((jalon) => (
                        <div
                          key={jalon.id}
                          className="flex items-center gap-2 px-3 py-1.5 pl-8 border-b border-neutral-100 hover:bg-neutral-50"
                        >
                          {jalon.declencheurCC && (
                            <Tooltip content={`← ${jalon.declencheurCC}`}>
                              <ArrowRight className="w-3 h-3 text-red-500" />
                            </Tooltip>
                          )}
                          <span className="text-xs text-neutral-700 truncate flex-1">{jalon.titre}</span>
                          <span className="text-xs font-semibold text-neutral-500">{jalon.avancement}%</span>
                        </div>
                      ))}
                  </div>
                );
              })}

              {/* ÉVÉNEMENTS */}
              <div className="px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm">
                ÉVÉNEMENTS
              </div>
              {evenements.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-2 px-3 py-1.5 pl-6 border-b border-neutral-100 hover:bg-green-50"
                >
                  <Target className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-neutral-700 truncate flex-1">{evt.titre}</span>
                  <span className="text-xs font-semibold text-green-600">{format(parseISO(evt.date), 'dd/MM/yy')}</span>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Right Panel - Timeline */}
          <ScrollArea className="flex-1">
            <div style={{ minWidth: `${months.length * 80}px` }}>
              {/* Timeline Header */}
              <div className="h-10 border-b bg-neutral-100 flex sticky top-0 z-20">
                {months.map((month, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'border-r flex items-center justify-center text-xs font-medium',
                      month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear()
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-neutral-600'
                    )}
                    style={{ width: '80px' }}
                  >
                    {format(month, 'MMM yy', { locale: fr })}
                  </div>
                ))}
              </div>

              {/* Timeline Content */}
              <div className="relative">
                {/* Today Line */}
                {todayPos > 0 && todayPos < 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-30"
                    style={{ left: `${todayPos}%` }}
                  >
                    <div className="absolute -top-6 -translate-x-1/2 bg-blue-500 text-white text-[9px] px-1 rounded">
                      Aujourd'hui
                    </div>
                  </div>
                )}

                {/* Grid */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {months.map((_, idx) => (
                    <div key={idx} className="border-r border-neutral-100" style={{ width: '80px' }} />
                  ))}
                </div>

                {/* CENTRE COMMERCIAL Header */}
                <div className="h-8 bg-red-100 border-b flex items-center px-2">
                  <span className="text-xs font-semibold text-red-700">
                    {expandedSections.has('cc') ? '' : `CC: ${avancementGlobalCC}%`}
                  </span>
                </div>

                {/* Phases CC */}
                {expandedSections.has('cc') &&
                  phasesCC.map((phase) => (
                    <div key={phase.code} className="h-7 border-b border-neutral-100 relative">
                      {renderBar(phase.dateDebut, phase.dateFin, phase.avancement, phase.couleur)}
                    </div>
                  ))}

                {/* AUTRES BÂTIMENTS Header */}
                <div className="h-8 bg-neutral-200 border-b flex items-center px-2">
                  <span className="text-xs font-semibold text-neutral-700">
                    {expandedSections.has('autres') ? '' : 'Non synchronisés'}
                  </span>
                </div>

                {/* Autres bâtiments */}
                {expandedSections.has('autres') &&
                  autresBatiments.map((bat) => (
                    <div key={bat.code} className="h-7 border-b border-neutral-100 relative">
                      {renderBar(bat.dateDebut, bat.dateFin, bat.avancement, 'bg-neutral-400')}
                    </div>
                  ))}

                {/* MOBILISATION Header */}
                <div className="h-8 bg-gradient-to-r from-indigo-600 to-purple-600 border-b" />

                {/* Axes Mobilisation */}
                {AXES.filter(a => a !== 'axe7_construction').map((axe) => {
                  const config = getAxeConfig(axe);
                  const jalonsPourAxe = jalonsMobilisation.filter((j) => j.axe === axe);

                  return (
                    <div key={axe}>
                      {/* Axe Header */}
                      <div className={cn('h-8 border-b', config.bgLight)} />

                      {/* Jalons */}
                      {expandedSections.has(axe) &&
                        jalonsPourAxe.map((jalon) => (
                          <div key={jalon.id} className="h-7 border-b border-neutral-100 relative">
                            {renderBar(
                              jalon.dateDebut,
                              jalon.dateFin,
                              jalon.avancement,
                              config.bgDark,
                              undefined,
                              jalon.declencheurCC
                            )}
                          </div>
                        ))}
                    </div>
                  );
                })}

                {/* ÉVÉNEMENTS Header */}
                <div className="h-8 bg-gradient-to-r from-green-600 to-emerald-600 border-b" />

                {/* Événements */}
                {evenements.map((evt) => (
                  <div key={evt.id} className="h-7 border-b border-neutral-100 relative">
                    <Tooltip content={`${evt.titre} - ${format(parseISO(evt.date), 'dd MMMM yyyy', { locale: fr })}`}>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        style={{ left: `${getPosition(evt.date)}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        <Target className="w-3 h-3 text-white" />
                      </div>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Légende */}
        <div className="p-3 border-t bg-neutral-50 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-neutral-600">Légende:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-red-500 rounded" />
            <span>CC</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-neutral-400 rounded" />
            <span>Autres bât.</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-red-500" />
            <span>Déclenché par CC</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3 text-green-500" />
            <span>Événement</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-blue-500" />
            <span>Aujourd'hui</span>
          </div>
          <div className="border-l pl-4 ml-2 flex items-center gap-3">
            {AXES.filter(a => a !== 'axe7_construction').map((axe) => {
              const config = getAxeConfig(axe);
              return (
                <div key={axe} className="flex items-center gap-1">
                  <div className={cn('w-3 h-3 rounded', config.bgDark)} />
                  <span>{AXE_SHORT_LABELS[axe].replace('Axe ', '').substring(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Synthèse avec onglets */}
      <Card padding="md">
        <Tabs defaultValue="sync">
          <TabsList className="mb-4">
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Points de synchronisation actifs
            </TabsTrigger>
            <TabsTrigger value="echeances" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-500" />
              Prochaines échéances clés
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sync">
            <div className="space-y-2">
              {jalonsMobilisation.filter((j) => j.declencheurCC).map((jalon) => (
                <div
                  key={jalon.id}
                  className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <Badge className={AXE_CONFIG[jalon.axe].bgLight + ' ' + AXE_CONFIG[jalon.axe].color}>
                    {AXE_SHORT_LABELS[jalon.axe].replace('Axe ', '').substring(0, 4)}
                  </Badge>
                  <span className="text-sm text-neutral-700 flex-1 truncate">{jalon.titre}</span>
                  <ArrowRight className="w-3 h-3 text-red-500" />
                  <Badge variant="error" className="text-xs">
                    {jalon.declencheurCC}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="echeances">
            <div className="space-y-2">
              {evenements.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200"
                >
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-neutral-700">{evt.titre}</span>
                  <span className="text-sm text-green-600 ml-auto">
                    {format(parseISO(evt.date), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              ))}
              {phasesCC.filter((p) => p.avancement < 100)
                .slice(0, 3)
                .map((phase) => (
                  <div
                    key={phase.code}
                    className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200"
                  >
                    <Building2 className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-neutral-700">{phase.nom}</span>
                    <span className="text-sm text-red-600 ml-auto">
                      {format(parseISO(phase.dateFin), 'dd/MM/yyyy')}
                    </span>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

export default ConstructionCCView;
