import React, { useMemo } from 'react';
import {
  Calendar,
  Building2,
  Users,
  ShoppingBag,
  Wrench,
  Wallet,
  Megaphone,
  Settings2,
  AlertTriangle,
  ArrowDown,
  Target,
  Flag,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useActions, useJalons, useProjectConfig, useRisques } from '@/hooks';
import type { Axe } from '@/types';
import { PROJET_CONFIG, AXES_CONFIG_FULL } from '@/data/constants';

// ============================================================================
// TYPES
// ============================================================================

interface TimelinePhase {
  id: string;
  nom: string;
  code: string;
  debut: number; // mois (1-12)
  fin: number;   // mois (1-12)
  avancement: number;
  isJalon?: boolean;
}

interface AxeTimeline {
  axe: Axe;
  nom: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  phases: TimelinePhase[];
}

interface JalonCritique {
  code: string;
  nom: string;
  mois: number;
  type: 'construction' | 'mobilisation';
  linkedTo?: string;
}

interface RisqueVigilance {
  risque: string;
  probabilite: 'faible' | 'moyenne' | 'elevee';
  impact: 'modere' | 'fort' | 'critique';
  mitigation: string;
  responsable: string;
}

// ============================================================================
// DATA - Timeline COSMOS ANGRÉ (Calculée dynamiquement)
// ============================================================================

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// Configuration visuelle des axes (ne contient que du style, pas de données)
const AXE_VISUAL_CONFIG: Record<Axe, { icon: React.ElementType; color: string; bgColor: string }> = {
  axe1_rh: { icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-500' },
  axe2_commercial: { icon: ShoppingBag, color: 'text-emerald-600', bgColor: 'bg-emerald-500' },
  axe3_technique: { icon: Wrench, color: 'text-orange-600', bgColor: 'bg-orange-500' },
  axe4_budget: { icon: Wallet, color: 'text-violet-600', bgColor: 'bg-violet-500' },
  axe5_marketing: { icon: Megaphone, color: 'text-pink-600', bgColor: 'bg-pink-500' },
  axe6_exploitation: { icon: Settings2, color: 'text-cyan-600', bgColor: 'bg-cyan-500' },
  axe7_construction: { icon: Building2, color: 'text-red-600', bgColor: 'bg-red-500' },
};

// Helper: Convertir une date en mois (1-12)
function dateToMonth(dateStr: string): number {
  const date = new Date(dateStr);
  return date.getMonth() + 1;
}

// Helper: Calculer l'année de référence du projet
function getProjectYear(): number {
  const startYear = new Date(PROJET_CONFIG.dateDebut).getFullYear();
  return startYear;
}

// ============================================================================
// COMPONENT: TimelineBar
// ============================================================================

interface TimelineBarProps {
  phase: TimelinePhase;
  color: string;
  currentMonth: number;
}

function TimelineBar({ phase, color, currentMonth }: TimelineBarProps) {
  const startPercent = ((phase.debut - 1) / 12) * 100;
  const widthPercent = ((phase.fin - phase.debut + 1) / 12) * 100;
  const isPast = phase.fin < currentMonth;
  const isCurrent = phase.debut <= currentMonth && phase.fin >= currentMonth;

  return (
    <div className="relative h-6 flex items-center">
      {/* Phase name on left */}
      <div className="w-32 pr-2 text-xs text-neutral-600 truncate text-right">
        {phase.nom}
      </div>

      {/* Timeline bar container */}
      <div className="flex-1 relative h-full">
        {/* Bar */}
        <div
          className={cn(
            'absolute h-5 rounded transition-all',
            phase.isJalon ? 'h-5 flex items-center justify-center' : '',
            isPast ? 'opacity-70' : '',
            isCurrent ? 'ring-2 ring-offset-1 ring-yellow-400' : ''
          )}
          style={{
            left: `${startPercent}%`,
            width: phase.isJalon ? '20px' : `${widthPercent}%`,
            backgroundColor: phase.isJalon ? 'transparent' : color,
          }}
        >
          {phase.isJalon ? (
            <div
              className="w-4 h-4 rotate-45 border-2"
              style={{ borderColor: color, backgroundColor: phase.avancement >= 100 ? color : 'white' }}
            />
          ) : (
            <>
              {/* Progress inside bar */}
              {phase.avancement > 0 && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/30 rounded-l"
                  style={{ width: `${phase.avancement}%` }}
                />
              )}
              {/* Code label */}
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                {phase.code}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: MonthHeader
// ============================================================================

function MonthHeader({ currentMonth }: { currentMonth: number }) {
  return (
    <div className="flex items-center mb-2">
      <div className="w-32" /> {/* Spacer for phase names */}
      <div className="flex-1 flex">
        {MOIS.map((mois, index) => (
          <div
            key={mois}
            className={cn(
              'flex-1 text-center text-xs font-medium py-1 border-r border-neutral-200 last:border-r-0',
              index + 1 === currentMonth
                ? 'bg-yellow-100 text-yellow-800'
                : index + 1 < currentMonth
                ? 'text-neutral-400'
                : 'text-neutral-600'
            )}
          >
            {mois}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: AxeTimelineSection
// ============================================================================

interface AxeTimelineSectionProps {
  axeData: AxeTimeline;
  currentMonth: number;
}

function AxeTimelineSection({ axeData, currentMonth }: AxeTimelineSectionProps) {
  const Icon = axeData.icon;

  return (
    <div className="border-b border-neutral-200 pb-4 last:border-b-0">
      {/* Axe Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('p-1.5 rounded-lg', axeData.bgColor)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h4 className={cn('font-semibold text-sm', axeData.color)}>{axeData.nom}</h4>
      </div>

      {/* Timeline Grid */}
      <div className="relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex pointer-events-none" style={{ left: '128px' }}>
          {MOIS.map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex-1 border-r border-neutral-100',
                index + 1 === currentMonth && 'bg-yellow-50/50'
              )}
            />
          ))}
        </div>

        {/* Phases */}
        <div className="relative space-y-1">
          {axeData.phases.map((phase) => (
            <TimelineBar
              key={phase.id}
              phase={phase}
              color={axeData.bgColor.replace('bg-', '').includes('500')
                ? `var(--${axeData.bgColor.replace('bg-', '').replace('-500', '')})`
                : axeData.bgColor === 'bg-blue-500' ? '#3B82F6'
                : axeData.bgColor === 'bg-emerald-500' ? '#10B981'
                : axeData.bgColor === 'bg-orange-500' ? '#F97316'
                : axeData.bgColor === 'bg-violet-500' ? '#8B5CF6'
                : axeData.bgColor === 'bg-pink-500' ? '#EC4899'
                : axeData.bgColor === 'bg-cyan-500' ? '#06B6D4'
                : '#6B7280'
              }
              currentMonth={currentMonth}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: JalonsCritiquesSection
// ============================================================================

interface JalonsCritiquesSectionProps {
  currentMonth: number;
  jalonsCritiques: JalonCritique[];
}

function JalonsCritiquesSection({ currentMonth, jalonsCritiques }: JalonsCritiquesSectionProps) {
  return (
    <Card padding="md" className="mt-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-red-500" />
        Jalons Critiques (Points de Synchronisation)
      </h3>

      {/* Timeline header */}
      <div className="flex items-center mb-2">
        <div className="w-4" />
        <div className="flex-1 flex">
          {MOIS.map((mois, index) => (
            <div
              key={mois}
              className={cn(
                'flex-1 text-center text-xs py-1',
                index + 1 === currentMonth ? 'font-bold text-yellow-700' : 'text-neutral-400'
              )}
            >
              {mois}
            </div>
          ))}
        </div>
      </div>

      {/* Jalons */}
      <div className="relative h-24">
        {/* Grid */}
        <div className="absolute inset-0 flex" style={{ left: '16px' }}>
          {MOIS.map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex-1 border-r border-dashed border-neutral-200',
                index + 1 === currentMonth && 'bg-yellow-50'
              )}
            />
          ))}
        </div>

        {/* Jalon markers */}
        <div className="absolute inset-0" style={{ left: '16px' }}>
          {jalonsCritiques.map((jalon, index) => {
            const leftPercent = ((jalon.mois - 0.5) / 12) * 100;
            const isConstruction = jalon.type === 'construction';
            const isPast = jalon.mois < currentMonth;

            return (
              <div
                key={jalon.code}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${leftPercent}%`,
                  top: isConstruction ? '0' : '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Marker */}
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold border-2',
                    isConstruction
                      ? isPast
                        ? 'bg-red-500 border-red-600 text-white'
                        : 'bg-white border-red-500 text-red-500'
                      : isPast
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-blue-500 text-blue-500'
                  )}
                >
                  {jalon.code.substring(0, 2)}
                </div>

                {/* Link arrow */}
                {jalon.linkedTo && (
                  <ArrowDown
                    className={cn(
                      'w-3 h-3 my-0.5',
                      isConstruction ? 'text-red-400' : 'text-blue-400'
                    )}
                  />
                )}

                {/* Label */}
                <span
                  className={cn(
                    'text-[8px] whitespace-nowrap mt-0.5',
                    isPast ? 'text-neutral-400' : 'text-neutral-600'
                  )}
                >
                  {jalon.code}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span className="text-neutral-600">Construction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className="text-neutral-600">Mobilisation</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowDown className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-600">Point de synchronisation (déclenche)</span>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// COMPONENT: SyntheseTable
// ============================================================================

interface SyntheseTableProps {
  data: Array<{ axe: string; poids: string; jalons: number; actions: string; objectif: string }>;
  softOpeningDate: string;
}

function SyntheseTable({ data, softOpeningDate }: SyntheseTableProps) {
  const totalJalons = data.reduce((sum, row) => sum + row.jalons, 0);
  const totalActions = data.reduce((sum, row) => sum + parseInt(row.actions) || 0, 0);

  return (
    <Card padding="md" className="mt-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
        <Flag className="w-5 h-5 text-indigo-500" />
        Synthèse Complète
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="text-left px-3 py-2 font-semibold text-neutral-700">Axe</th>
              <th className="text-center px-3 py-2 font-semibold text-neutral-700">Poids</th>
              <th className="text-center px-3 py-2 font-semibold text-neutral-700">Jalons</th>
              <th className="text-center px-3 py-2 font-semibold text-neutral-700">Actions</th>
              <th className="text-left px-3 py-2 font-semibold text-neutral-700">Objectif Phare</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.axe} className={cn(index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50')}>
                <td className="px-3 py-2 font-medium text-neutral-800">{row.axe}</td>
                <td className="px-3 py-2 text-center">
                  <Badge variant={row.poids === 'Suivi' ? 'secondary' : 'info'}>{row.poids}</Badge>
                </td>
                <td className="px-3 py-2 text-center font-medium">{row.jalons}</td>
                <td className="px-3 py-2 text-center">{row.actions}</td>
                <td className="px-3 py-2 text-neutral-600">{row.objectif}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50 font-semibold">
              <td className="px-3 py-2 text-indigo-800">TOTAL</td>
              <td className="px-3 py-2 text-center text-indigo-800">100%</td>
              <td className="px-3 py-2 text-center text-indigo-800">{totalJalons}</td>
              <td className="px-3 py-2 text-center text-indigo-800">{totalActions}</td>
              <td className="px-3 py-2 text-indigo-800">Soft Opening {softOpeningDate || '-'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

// ============================================================================
// COMPONENT: RisquesVigilanceSection
// ============================================================================

interface RisquesVigilanceSectionProps {
  risques: RisqueVigilance[];
}

function RisquesVigilanceSection({ risques }: RisquesVigilanceSectionProps) {
  const getProbabiliteColor = (p: string) => {
    switch (p) {
      case 'faible': return 'text-green-600 bg-green-100';
      case 'moyenne': return 'text-yellow-700 bg-yellow-100';
      case 'elevee': return 'text-red-600 bg-red-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getImpactColor = (i: string) => {
    switch (i) {
      case 'modere': return 'text-blue-600 bg-blue-100';
      case 'fort': return 'text-orange-600 bg-orange-100';
      case 'critique': return 'text-red-600 bg-red-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  if (risques.length === 0) {
    return (
      <Card padding="md" className="mt-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Points de Vigilance
        </h3>
        <p className="text-neutral-500 text-center py-4">Aucun risque majeur identifié</p>
      </Card>
    );
  }

  return (
    <Card padding="md" className="mt-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        Points de Vigilance
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="text-left px-3 py-2 font-semibold text-neutral-700">Risque</th>
              <th className="text-left px-3 py-2 font-semibold text-neutral-700">Responsable</th>
              <th className="text-center px-3 py-2 font-semibold text-neutral-700">Probabilité</th>
              <th className="text-center px-3 py-2 font-semibold text-neutral-700">Impact</th>
              <th className="text-left px-3 py-2 font-semibold text-neutral-700">Mitigation</th>
            </tr>
          </thead>
          <tbody>
            {risques.map((risque, index) => (
              <tr key={risque.risque} className={cn(index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50')}>
                <td className="px-3 py-2 font-medium text-neutral-800">{risque.risque}</td>
                <td className="px-3 py-2 text-neutral-700 font-medium">{risque.responsable}</td>
                <td className="px-3 py-2 text-center">
                  <span className={cn('px-2 py-1 rounded text-xs font-medium', getProbabiliteColor(risque.probabilite))}>
                    {risque.probabilite === 'faible' ? '🟢 Faible' : risque.probabilite === 'moyenne' ? '🟡 Moyenne' : '🔴 Élevée'}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={cn('px-2 py-1 rounded text-xs font-medium', getImpactColor(risque.impact))}>
                    {risque.impact === 'modere' ? '🔵 Modéré' : risque.impact === 'fort' ? '🟠 Fort' : '🔴 Critique'}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-600">{risque.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT: TimelineSynchronisee
// ============================================================================

export function TimelineSynchronisee() {
  // Hooks pour données réelles
  const allActions = useActions();
  const allJalons = useJalons();
  const allRisques = useRisques();
  const projectConfig = useProjectConfig();

  // Année de référence du projet
  const projectYear = getProjectYear();

  // Current month
  const currentMonth = useMemo(() => {
    const now = new Date();
    // Si on est dans l'année du projet, utiliser le mois actuel
    return now.getFullYear() === projectYear ? now.getMonth() + 1 : 1;
  }, [projectYear]);

  // ══════════════════════════════════════════════════════════════════════════
  // GÉNÉRATION DES PHASES DE CONSTRUCTION À PARTIR DES DONNÉES RÉELLES
  // ══════════════════════════════════════════════════════════════════════════
  const constructionPhases = useMemo((): TimelinePhase[] => {
    const constructionActions = allActions.filter(a => a.axe === 'axe7_construction');

    if (constructionActions.length === 0) {
      // Données par défaut si aucune action
      return [
        { id: 'go', nom: 'Gros œuvre', code: 'GO', debut: 1, fin: 3, avancement: 0 },
        { id: 'so', nom: 'Second œuvre', code: 'SO', debut: 3, fin: 6, avancement: 0 },
        { id: 'lt', nom: 'Lots techniques', code: 'LT', debut: 5, fin: 9, avancement: 0 },
        { id: 'ae', nom: 'Aménagements ext.', code: 'AE', debut: 7, fin: 10, avancement: 0 },
        { id: 'rp', nom: 'Réception prov.', code: 'REC', debut: 11, fin: 11, avancement: 0, isJalon: true },
      ];
    }

    // Grouper les actions par catégorie/phase
    const phaseMap = new Map<string, typeof constructionActions>();
    constructionActions.forEach(action => {
      const phaseCode = action.code_wbs?.split('-')[1] || 'AUTRE';
      if (!phaseMap.has(phaseCode)) {
        phaseMap.set(phaseCode, []);
      }
      phaseMap.get(phaseCode)!.push(action);
    });

    return Array.from(phaseMap.entries()).map(([code, actions]) => {
      const avancement = Math.round(actions.reduce((sum, a) => sum + a.avancement, 0) / actions.length);
      const dates = actions.map(a => ({
        debut: dateToMonth(a.date_debut_prevue),
        fin: dateToMonth(a.date_fin_prevue),
      }));
      const debut = Math.min(...dates.map(d => d.debut));
      const fin = Math.max(...dates.map(d => d.fin));

      return {
        id: code.toLowerCase(),
        nom: actions[0]?.titre?.substring(0, 20) || code,
        code,
        debut,
        fin,
        avancement,
        isJalon: debut === fin,
      };
    });
  }, [allActions]);

  // ══════════════════════════════════════════════════════════════════════════
  // GÉNÉRATION DES AXES DE MOBILISATION À PARTIR DES DONNÉES RÉELLES
  // ══════════════════════════════════════════════════════════════════════════
  const axesTimeline = useMemo((): AxeTimeline[] => {
    const mobilisationAxes: Axe[] = ['axe1_rh', 'axe2_commercial', 'axe3_technique', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'];

    return mobilisationAxes.map(axe => {
      const axeConfig = AXES_CONFIG_FULL[axe.replace('axe1_', '').replace('axe2_', '').replace('axe3_', '').replace('axe4_', '').replace('axe5_', '').replace('axe6_', '') as keyof typeof AXES_CONFIG_FULL] || {};
      const visualConfig = AXE_VISUAL_CONFIG[axe];
      const axeJalons = allJalons.filter(j => j.axe === axe);
      const axeActions = allActions.filter(a => a.axe === axe);

      // Créer les phases à partir des jalons et actions
      const phases: TimelinePhase[] = [];

      // Ajouter les jalons comme phases ponctuelles
      axeJalons.forEach(jalon => {
        const mois = dateToMonth(jalon.date_prevue);
        phases.push({
          id: jalon.id_jalon || `j-${jalon.id}`,
          nom: jalon.titre.substring(0, 15),
          code: jalon.id_jalon?.replace('J-', '').substring(0, 4) || `J${jalon.id}`,
          debut: mois,
          fin: mois,
          avancement: jalon.avancement_prealables || 0,
          isJalon: true,
        });
      });

      // Ajouter les actions groupées par période
      if (axeActions.length > 0 && phases.length === 0) {
        // Si pas de jalons, créer une phase globale
        const dates = axeActions.map(a => ({
          debut: dateToMonth(a.date_debut_prevue),
          fin: dateToMonth(a.date_fin_prevue),
        }));
        const avgAvancement = Math.round(axeActions.reduce((sum, a) => sum + a.avancement, 0) / axeActions.length);
        phases.push({
          id: `${axe}-global`,
          nom: 'Actions',
          code: axeConfig?.labelCourt || axe.substring(4, 7).toUpperCase(),
          debut: Math.min(...dates.map(d => d.debut)),
          fin: Math.max(...dates.map(d => d.fin)),
          avancement: avgAvancement,
        });
      }

      // Trier les phases par date de début
      phases.sort((a, b) => a.debut - b.debut);

      return {
        axe,
        nom: axeConfig?.label || axe,
        icon: visualConfig.icon,
        color: visualConfig.color,
        bgColor: visualConfig.bgColor,
        phases,
      };
    });
  }, [allJalons, allActions]);

  // ══════════════════════════════════════════════════════════════════════════
  // JALONS CRITIQUES À PARTIR DES JALONS AVEC NIVEAU_IMPORTANCE = 'critique'
  // ══════════════════════════════════════════════════════════════════════════
  const jalonsCritiques = useMemo((): JalonCritique[] => {
    return allJalons
      .filter(j => j.niveau_importance === 'critique' || j.niveau_importance === 'majeur')
      .map(j => ({
        code: j.id_jalon?.substring(0, 4) || `J${j.id}`,
        nom: j.titre.substring(0, 15),
        mois: dateToMonth(j.date_prevue),
        type: j.axe === 'axe7_construction' ? 'construction' as const : 'mobilisation' as const,
      }));
  }, [allJalons]);

  // ══════════════════════════════════════════════════════════════════════════
  // RISQUES DE VIGILANCE À PARTIR DES RISQUES OUVERTS
  // ══════════════════════════════════════════════════════════════════════════
  const risquesVigilance = useMemo((): RisqueVigilance[] => {
    return allRisques
      .filter(r => r.statut === 'ouvert' || r.statut === 'en_analyse')
      .slice(0, 5)
      .map(r => ({
        risque: r.titre.substring(0, 30),
        probabilite: (r.probabilite_actuelle ?? r.probabilite ?? 2) <= 2 ? 'faible' as const : (r.probabilite_actuelle ?? r.probabilite) === 3 ? 'moyenne' as const : 'elevee' as const,
        impact: (r.impact_actuel ?? r.impact ?? 2) <= 2 ? 'modere' as const : (r.impact_actuel ?? r.impact) === 3 ? 'fort' as const : 'critique' as const,
        mitigation: r.plan_mitigation?.substring(0, 30) || 'À définir',
        responsable: r.proprietaire || 'Non assigné',
      }));
  }, [allRisques]);

  // ══════════════════════════════════════════════════════════════════════════
  // SYNTHÈSE CALCULÉE À PARTIR DES DONNÉES RÉELLES
  // ══════════════════════════════════════════════════════════════════════════
  const syntheseData = useMemo(() => {
    const axes = [
      { code: 'axe1_rh', label: 'RH & Organisation', poids: '20%', objectif: 'Équipe 100% opérationnelle' },
      { code: 'axe2_commercial', label: 'Commercial & Leasing', poids: '25%', objectif: 'Occupation ≥85%' },
      { code: 'axe3_technique', label: 'Technique & Handover', poids: '20%', objectif: 'PV réception signé' },
      { code: 'axe4_budget', label: 'Budget & Pilotage', poids: '15%', objectif: 'Écart ≤5%' },
      { code: 'axe5_marketing', label: 'Marketing & Comm.', poids: '15%', objectif: 'Inauguration réussie' },
      { code: 'axe6_exploitation', label: 'Exploitation & Systèmes', poids: '5%', objectif: 'Centre prêt à opérer' },
      { code: 'axe7_construction', label: 'Construction', poids: 'Suivi', objectif: 'Réception définitive' },
    ];

    return axes.map(axe => ({
      axe: axe.label,
      poids: axe.poids,
      jalons: allJalons.filter(j => j.axe === axe.code).length,
      actions: allActions.filter(a => a.axe === axe.code).length.toString(),
      objectif: axe.objectif,
    }));
  }, [allJalons, allActions]);

  // Date du Soft Opening formatée
  const softOpeningDate = useMemo(() => {
    const date = projectConfig?.dateSoftOpening || PROJET_CONFIG.jalonsClés.softOpening;
    if (!date) return '';
    try {
      const d = new Date(date.length === 7 ? `${date}-01` : date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return date;
    }
  }, [projectConfig]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
            <Calendar className="w-7 h-7 text-indigo-500" />
            Timeline Synchronisée 2026
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Vue consolidée de la construction et des 5 axes de mobilisation — COSMOS ANGRÉ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-base px-3 py-1.5">
            Mois actuel: {MOIS[currentMonth - 1]} 2026
          </Badge>
        </div>
      </div>

      {/* Construction Timeline */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-red-500">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-red-700">CONSTRUCTION</h3>
        </div>

        <MonthHeader currentMonth={currentMonth} />

        <div className="relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex pointer-events-none" style={{ left: '128px' }}>
            {MOIS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'flex-1 border-r border-neutral-100',
                  index + 1 === currentMonth && 'bg-yellow-50/50'
                )}
              />
            ))}
          </div>

          <div className="relative space-y-1">
            {constructionPhases.map((phase) => (
              <TimelineBar
                key={phase.id}
                phase={phase}
                color="#EF4444"
                currentMonth={currentMonth}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Mobilisation Axes */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-500">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-indigo-700">MOBILISATION (5 Axes)</h3>
        </div>

        <MonthHeader currentMonth={currentMonth} />

        <div className="space-y-6">
          {axesTimeline.map((axeData) => (
            <AxeTimelineSection
              key={axeData.axe}
              axeData={axeData}
              currentMonth={currentMonth}
            />
          ))}
        </div>
      </Card>

      {/* Jalons Critiques */}
      <JalonsCritiquesSection currentMonth={currentMonth} jalonsCritiques={jalonsCritiques} />

      {/* Synthèse */}
      <SyntheseTable data={syntheseData} softOpeningDate={softOpeningDate} />

      {/* Risques */}
      <RisquesVigilanceSection risques={risquesVigilance} />

      {/* Legend */}
      <Card padding="sm" className="bg-neutral-50">
        <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-gradient-to-r from-red-500 to-red-400 rounded" />
            <span>Phase en cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-gradient-to-r from-red-500/70 to-red-400/70 rounded" />
            <span>Phase passée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rotate-45 border-2 border-red-500 bg-white" />
            <span>Jalon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rotate-45 border-2 border-red-500 bg-red-500" />
            <span>Jalon atteint</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-yellow-100 border border-yellow-300 rounded" />
            <span>Mois actuel</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default TimelineSynchronisee;
