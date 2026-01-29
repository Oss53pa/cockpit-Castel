/**
 * SyncGanttHierarchical - Gantt Chart avec 3 niveaux de hiérarchie
 * Niveau 1: AXE
 * Niveau 2: JALONS (sous chaque axe)
 * Niveau 3: ACTIONS (sous chaque jalon)
 */

import { useState, useMemo, useRef } from 'react';
import {
  format,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  parseISO,
  addMonths,
  subMonths,
  isToday,
  isSameMonth,
  isSameWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Layers,
  Diamond,
  CheckSquare,
  Target,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJalons, useActions } from '@/hooks';
import { Badge, Button, ScrollArea, Tooltip, Progress } from '@/components/ui';
import {
  AXES,
  AXE_LABELS,
  AXE_SHORT_LABELS,
  JALON_STATUS_LABELS,
  ACTION_STATUS_LABELS,
  type Axe,
  type Jalon,
  type Action,
  type JalonStatus,
  type ActionStatus,
} from '@/types';

type ZoomLevel = 'day' | 'week' | 'month';

// Couleurs par axe
const axeColors: Record<Axe, { bg: string; border: string; text: string; light: string }> = {
  axe1_rh: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-blue-700', light: 'bg-blue-100' },
  axe2_commercial: { bg: 'bg-emerald-600', border: 'border-emerald-700', text: 'text-emerald-700', light: 'bg-emerald-100' },
  axe3_technique: { bg: 'bg-orange-600', border: 'border-orange-700', text: 'text-orange-700', light: 'bg-orange-100' },
  axe4_budget: { bg: 'bg-purple-600', border: 'border-purple-700', text: 'text-purple-700', light: 'bg-purple-100' },
  axe5_marketing: { bg: 'bg-pink-600', border: 'border-pink-700', text: 'text-pink-700', light: 'bg-pink-100' },
  axe6_exploitation: { bg: 'bg-cyan-600', border: 'border-cyan-700', text: 'text-cyan-700', light: 'bg-cyan-100' },
};

const jalonStatusColors: Record<JalonStatus, { bg: string; border: string }> = {
  a_venir: { bg: 'bg-primary-500', border: 'border-primary-600' },
  en_approche: { bg: 'bg-warning-500', border: 'border-warning-600' },
  en_danger: { bg: 'bg-error-500', border: 'border-error-600' },
  atteint: { bg: 'bg-success-500', border: 'border-success-600' },
  depasse: { bg: 'bg-primary-800', border: 'border-primary-900' },
  annule: { bg: 'bg-gray-400', border: 'border-gray-500' },
};

const actionStatusColors: Record<ActionStatus, string> = {
  a_planifier: 'bg-gray-400',
  planifie: 'bg-primary-400',
  a_faire: 'bg-primary-500',
  en_cours: 'bg-info-500',
  en_attente: 'bg-warning-500',
  bloque: 'bg-error-500',
  en_validation: 'bg-purple-500',
  termine: 'bg-success-500',
  annule: 'bg-gray-500',
  reporte: 'bg-orange-500',
};

interface SyncGanttHierarchicalProps {
  projectId: string;
}

interface ExpandedState {
  axes: Set<Axe>;
  jalons: Set<number>;
}

export function SyncGanttHierarchical({ projectId: _projectId }: SyncGanttHierarchicalProps) {
  const jalons = useJalons({});
  const actions = useActions({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');
  const [centerDate, setCenterDate] = useState(new Date());
  const [expanded, setExpanded] = useState<ExpandedState>({
    axes: new Set(AXES),
    jalons: new Set(),
  });

  // Toggle axe expansion
  const toggleAxe = (axe: Axe) => {
    const newAxes = new Set(expanded.axes);
    if (newAxes.has(axe)) {
      newAxes.delete(axe);
    } else {
      newAxes.add(axe);
    }
    setExpanded({ ...expanded, axes: newAxes });
  };

  // Toggle jalon expansion
  const toggleJalon = (jalonId: number) => {
    const newJalons = new Set(expanded.jalons);
    if (newJalons.has(jalonId)) {
      newJalons.delete(jalonId);
    } else {
      newJalons.add(jalonId);
    }
    setExpanded({ ...expanded, jalons: newJalons });
  };

  // Expand all
  const expandAll = () => {
    setExpanded({
      axes: new Set(AXES),
      jalons: new Set(jalons.map(j => j.id!).filter(Boolean)),
    });
  };

  // Collapse all
  const collapseAll = () => {
    setExpanded({
      axes: new Set(),
      jalons: new Set(),
    });
  };

  // Group jalons by axe
  const jalonsByAxe = useMemo(() => {
    const map = new Map<Axe, Jalon[]>();
    AXES.forEach(axe => map.set(axe, []));

    jalons.forEach(jalon => {
      const axeJalons = map.get(jalon.axe) || [];
      axeJalons.push(jalon);
      map.set(jalon.axe, axeJalons);
    });

    // Sort jalons by date within each axe
    map.forEach((axeJalons, axe) => {
      map.set(axe, axeJalons.sort((a, b) => {
        const dateA = a.date_prevue ? new Date(a.date_prevue).getTime() : 0;
        const dateB = b.date_prevue ? new Date(b.date_prevue).getTime() : 0;
        return dateA - dateB;
      }));
    });

    return map;
  }, [jalons]);

  // Group actions by jalon
  const actionsByJalon = useMemo(() => {
    const map = new Map<number, Action[]>();

    actions.forEach(action => {
      if (action.jalonId) {
        const jalonActions = map.get(action.jalonId) || [];
        jalonActions.push(action);
        map.set(action.jalonId, jalonActions);
      }
    });

    // Sort actions by start date
    map.forEach((jalonActions, jalonId) => {
      map.set(jalonId, jalonActions.sort((a, b) => {
        const dateA = a.date_debut_prevue ? new Date(a.date_debut_prevue).getTime() : 0;
        const dateB = b.date_debut_prevue ? new Date(b.date_debut_prevue).getTime() : 0;
        return dateA - dateB;
      }));
    });

    return map;
  }, [actions]);

  // Actions without jalon (grouped by axe)
  const actionsWithoutJalon = useMemo(() => {
    const map = new Map<Axe, Action[]>();
    AXES.forEach(axe => map.set(axe, []));

    actions.forEach(action => {
      if (!action.jalonId) {
        const axeActions = map.get(action.axe) || [];
        axeActions.push(action);
        map.set(action.axe, axeActions);
      }
    });

    return map;
  }, [actions]);

  // Calculate date range
  const { startDate, endDate, timeUnits, unitWidth } = useMemo(() => {
    const now = new Date();
    let minDate = now;
    let maxDate = addMonths(now, 12);

    // Get all dates from jalons
    const jalonDates = jalons
      .filter(j => j.date_prevue)
      .map(j => parseISO(j.date_prevue));

    // Get all dates from actions
    const actionDates = actions.flatMap(a => {
      const dates: Date[] = [];
      if (a.date_debut_prevue) {
        try {
          const d = parseISO(a.date_debut_prevue);
          if (!isNaN(d.getTime())) dates.push(d);
        } catch { /* ignore */ }
      }
      if (a.date_fin_prevue) {
        try {
          const d = parseISO(a.date_fin_prevue);
          if (!isNaN(d.getTime())) dates.push(d);
        } catch { /* ignore */ }
      }
      return dates;
    });

    const allDates = [...jalonDates, ...actionDates];
    if (allDates.length > 0) {
      minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    }

    const start = startOfMonth(subMonths(minDate, 1));
    const end = endOfMonth(addMonths(maxDate, 2));

    let units: Date[] = [];
    let width = 40;

    switch (zoomLevel) {
      case 'day':
        units = eachDayOfInterval({ start, end });
        width = 30;
        break;
      case 'week':
        units = eachWeekOfInterval({ start, end }, { locale: fr });
        width = 80;
        break;
      case 'month':
        units = eachMonthOfInterval({ start, end });
        width = 120;
        break;
    }

    return { startDate: start, endDate: end, timeUnits: units, unitWidth: width };
  }, [jalons, actions, zoomLevel]);

  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Get position for a date (percentage)
  const getPosition = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const dayOffset = differenceInDays(d, startDate);
    return (dayOffset / totalDays) * 100;
  };

  // Get bar style for an action
  const getActionBarStyle = (action: Action) => {
    const actionStart = action.date_debut_prevue ? parseISO(action.date_debut_prevue) : startDate;
    const actionEnd = action.date_fin_prevue ? parseISO(action.date_fin_prevue) : actionStart;

    const startOffset = Math.max(0, differenceInDays(actionStart, startDate));
    const duration = Math.max(1, differenceInDays(actionEnd, actionStart) + 1);

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: `${left}%`,
      width: `${Math.max(width, 0.5)}%`,
    };
  };

  // Calculate axe date range
  const getAxeDateRange = (axe: Axe) => {
    const axeJalons = jalonsByAxe.get(axe) || [];
    const axeActions = actionsWithoutJalon.get(axe) || [];

    const allDates: Date[] = [];

    axeJalons.forEach(j => {
      if (j.date_prevue) allDates.push(parseISO(j.date_prevue));
      const jActions = actionsByJalon.get(j.id!) || [];
      jActions.forEach(a => {
        if (a.date_debut_prevue) allDates.push(parseISO(a.date_debut_prevue));
        if (a.date_fin_prevue) allDates.push(parseISO(a.date_fin_prevue));
      });
    });

    axeActions.forEach(a => {
      if (a.date_debut_prevue) allDates.push(parseISO(a.date_debut_prevue));
      if (a.date_fin_prevue) allDates.push(parseISO(a.date_fin_prevue));
    });

    if (allDates.length === 0) return null;

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    return { start: minDate, end: maxDate };
  };

  // Calculate jalon period
  const getJalonPeriod = (jalon: Jalon) => {
    const endDate = jalon.date_prevue ? parseISO(jalon.date_prevue) : new Date();
    const jalonActions = actionsByJalon.get(jalon.id!) || [];

    let startDate = endDate;
    if (jalonActions.length > 0) {
      const actionStarts = jalonActions
        .filter(a => a.date_debut_prevue)
        .map(a => parseISO(a.date_debut_prevue!));
      if (actionStarts.length > 0) {
        startDate = new Date(Math.min(...actionStarts.map(d => d.getTime())));
      }
    }

    const progress = jalonActions.length > 0
      ? Math.round(jalonActions.reduce((sum, a) => sum + a.avancement, 0) / jalonActions.length)
      : jalon.statut === 'atteint' ? 100 : 0;

    return { start: startDate, end: endDate, progress, actionsCount: jalonActions.length };
  };

  // Calculate axe progress
  const getAxeProgress = (axe: Axe) => {
    const axeJalons = jalonsByAxe.get(axe) || [];
    const axeActions = actionsWithoutJalon.get(axe) || [];

    let totalProgress = 0;
    let count = 0;

    axeJalons.forEach(jalon => {
      const jalonActions = actionsByJalon.get(jalon.id!) || [];
      jalonActions.forEach(a => {
        totalProgress += a.avancement;
        count++;
      });
    });

    axeActions.forEach(a => {
      totalProgress += a.avancement;
      count++;
    });

    return count > 0 ? Math.round(totalProgress / count) : 0;
  };

  // Today position
  const todayPosition = getPosition(new Date());

  // Navigate timeline
  const navigateTimeline = (direction: 'prev' | 'next') => {
    const months = direction === 'prev' ? -1 : 1;
    setCenterDate(addMonths(centerDate, months));
  };

  // Zoom controls
  const handleZoom = (direction: 'in' | 'out') => {
    const levels: ZoomLevel[] = ['month', 'week', 'day'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (direction === 'in' && currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1]);
    } else if (direction === 'out' && currentIndex > 0) {
      setZoomLevel(levels[currentIndex - 1]);
    }
  };

  // Build visible rows
  const visibleRows: Array<{
    type: 'axe' | 'jalon' | 'action';
    data: Axe | Jalon | Action;
    level: number;
    axe: Axe;
  }> = useMemo(() => {
    const rows: Array<{ type: 'axe' | 'jalon' | 'action'; data: Axe | Jalon | Action; level: number; axe: Axe }> = [];

    AXES.forEach(axe => {
      const axeJalons = jalonsByAxe.get(axe) || [];
      const axeActionsNoJalon = actionsWithoutJalon.get(axe) || [];

      // Only show axe if it has jalons or actions
      if (axeJalons.length === 0 && axeActionsNoJalon.length === 0) return;

      // Add axe row
      rows.push({ type: 'axe', data: axe, level: 0, axe });

      if (expanded.axes.has(axe)) {
        // Add jalons for this axe
        axeJalons.forEach(jalon => {
          rows.push({ type: 'jalon', data: jalon, level: 1, axe });

          if (expanded.jalons.has(jalon.id!)) {
            // Add actions for this jalon
            const jalonActions = actionsByJalon.get(jalon.id!) || [];
            jalonActions.forEach(action => {
              rows.push({ type: 'action', data: action, level: 2, axe });
            });
          }
        });

        // Add actions without jalon
        if (axeActionsNoJalon.length > 0) {
          axeActionsNoJalon.forEach(action => {
            rows.push({ type: 'action', data: action, level: 1, axe });
          });
        }
      }
    });

    return rows;
  }, [expanded, jalonsByAxe, actionsByJalon, actionsWithoutJalon]);

  // Row height based on type - AUGMENTÉ pour meilleure lisibilité
  const getRowHeight = (type: 'axe' | 'jalon' | 'action') => {
    switch (type) {
      case 'axe': return 64;
      case 'jalon': return 56;
      case 'action': return 48;
    }
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Layers className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-900">Gantt Hiérarchique</h3>
            <p className="text-xs text-primary-500">
              {AXES.filter(a => (jalonsByAxe.get(a)?.length || 0) > 0 || (actionsWithoutJalon.get(a)?.length || 0) > 0).length} axes • {jalons.length} jalons • {actions.length} actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Expand/Collapse */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={expandAll}>
              <ChevronDown className="h-4 w-4 mr-1" />
              Tout déplier
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              <ChevronUp className="h-4 w-4 mr-1" />
              Tout replier
            </Button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border rounded-lg bg-white px-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleZoom('out')}
              disabled={zoomLevel === 'month'}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-primary-600 px-2 min-w-[60px] text-center">
              {zoomLevel === 'day' ? 'Jour' : zoomLevel === 'week' ? 'Semaine' : 'Mois'}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleZoom('in')}
              disabled={zoomLevel === 'day'}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 border rounded-lg bg-white">
            <Button variant="ghost" size="icon-sm" onClick={() => navigateTimeline('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCenterDate(new Date())}
              className="text-xs"
            >
              Aujourd'hui
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => navigateTimeline('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gantt content */}
      <div className="flex max-h-[calc(100vh-300px)] overflow-hidden">
        {/* Left panel - Row labels - ÉLARGI pour meilleure lisibilité */}
        <div className="w-96 shrink-0 border-r bg-gray-50 flex flex-col">
          <div className="h-12 border-b bg-primary-100 px-3 flex items-center shrink-0">
            <span className="text-sm font-semibold text-primary-800">Structure du projet</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {visibleRows.map((row, index) => {
              const paddingLeft = 12 + row.level * 20;

              if (row.type === 'axe') {
                const axe = row.data as Axe;
                const axeColor = axeColors[axe];
                const isExpanded = expanded.axes.has(axe);
                const progress = getAxeProgress(axe);
                const jalonCount = jalonsByAxe.get(axe)?.length || 0;

                return (
                  <div
                    key={`axe-${axe}`}
                    className={cn(
                      'flex items-center gap-3 cursor-pointer hover:bg-primary-50 border-b',
                      axeColor.light
                    )}
                    style={{ height: getRowHeight('axe'), paddingLeft }}
                    onClick={() => toggleAxe(axe)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-primary-500 shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-primary-500 shrink-0" />
                    )}
                    <div className={cn('w-2 h-10 rounded-full shrink-0', axeColor.bg)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-base font-bold truncate', axeColor.text)}>
                        {AXE_SHORT_LABELS[axe]}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-primary-600 font-medium">{jalonCount} jalons</span>
                        <Progress value={progress} size="sm" className="w-20 h-2" />
                        <span className="text-sm font-semibold text-primary-700">{progress}%</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (row.type === 'jalon') {
                const jalon = row.data as Jalon;
                const isExpanded = expanded.jalons.has(jalon.id!);
                const actionsCount = actionsByJalon.get(jalon.id!)?.length || 0;
                const statusColor = jalonStatusColors[jalon.statut] || jalonStatusColors.a_venir;

                return (
                  <div
                    key={`jalon-${jalon.id}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-primary-50 border-b bg-white"
                    style={{ height: getRowHeight('jalon'), paddingLeft }}
                    onClick={() => toggleJalon(jalon.id!)}
                  >
                    {actionsCount > 0 ? (
                      isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-primary-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-primary-400 shrink-0" />
                      )
                    ) : (
                      <div className="w-5 shrink-0" />
                    )}
                    <Diamond className={cn('h-5 w-5 shrink-0', statusColor.bg.replace('bg-', 'text-'))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary-800 truncate">{jalon.titre}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {JALON_STATUS_LABELS[jalon.statut]}
                        </Badge>
                        {actionsCount > 0 && (
                          <span className="text-sm text-primary-500">{actionsCount} actions</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (row.type === 'action') {
                const action = row.data as Action;
                const statusColor = actionStatusColors[action.statut] || 'bg-gray-400';

                return (
                  <div
                    key={`action-${action.id}`}
                    className="flex items-center gap-3 hover:bg-primary-50 border-b bg-gray-50"
                    style={{ height: getRowHeight('action'), paddingLeft }}
                  >
                    <CheckSquare className="h-4 w-4 text-primary-400 shrink-0" />
                    <div className={cn('w-1.5 h-7 rounded-full shrink-0', statusColor)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary-700 truncate font-medium">{action.titre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-primary-500 font-semibold">{action.avancement}%</span>
                        <span className="text-xs text-primary-400">{ACTION_STATUS_LABELS[action.statut]}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
            {visibleRows.length === 0 && (
              <div className="h-32 flex items-center justify-center text-primary-400 text-sm">
                Aucune donnée
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Timeline */}
        <ScrollArea className="flex-1 h-full" ref={scrollRef}>
          <div style={{ width: `${timeUnits.length * unitWidth}px`, minWidth: '100%' }}>
            {/* Time header */}
            <div className="h-12 border-b bg-primary-100 flex sticky top-0 z-10">
              {timeUnits.map((unit, index) => {
                const isCurrentUnit =
                  (zoomLevel === 'day' && isToday(unit)) ||
                  (zoomLevel === 'week' && isSameWeek(unit, new Date(), { locale: fr })) ||
                  (zoomLevel === 'month' && isSameMonth(unit, new Date()));

                return (
                  <div
                    key={index}
                    className={cn(
                      'border-r flex items-center justify-center text-xs',
                      isCurrentUnit ? 'bg-primary-200 text-primary-800 font-semibold' : 'text-primary-600'
                    )}
                    style={{ width: `${unitWidth}px` }}
                  >
                    {zoomLevel === 'day' && format(unit, 'd', { locale: fr })}
                    {zoomLevel === 'week' && format(unit, "'S'w", { locale: fr })}
                    {zoomLevel === 'month' && format(unit, 'MMM yy', { locale: fr })}
                  </div>
                );
              })}
            </div>

            {/* Gantt rows */}
            <div className="relative">
              {/* Today line */}
              {todayPosition >= 0 && todayPosition <= 100 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-error-500 z-20"
                  style={{ left: `${todayPosition}%` }}
                >
                  <div className="absolute -top-6 -translate-x-1/2 bg-error-500 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                    Aujourd'hui
                  </div>
                </div>
              )}

              {/* Grid lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {timeUnits.map((_, index) => (
                  <div
                    key={index}
                    className="border-r border-primary-100"
                    style={{ width: `${unitWidth}px` }}
                  />
                ))}
              </div>

              {/* Render rows */}
              {visibleRows.map((row, _index) => {
                const height = getRowHeight(row.type);
                const axeColor = axeColors[row.axe];

                if (row.type === 'axe') {
                  const axe = row.data as Axe;
                  const dateRange = getAxeDateRange(axe);

                  return (
                    <div
                      key={`axe-${axe}`}
                      className={cn('relative border-b', axeColor.light)}
                      style={{ height }}
                    >
                      {dateRange && (
                        <div
                          className={cn('absolute top-1/2 -translate-y-1/2 h-10 rounded-lg opacity-40', axeColor.bg)}
                          style={{
                            left: `${getPosition(dateRange.start)}%`,
                            width: `${Math.max(2, getPosition(dateRange.end) - getPosition(dateRange.start))}%`,
                          }}
                        />
                      )}
                    </div>
                  );
                }

                if (row.type === 'jalon') {
                  const jalon = row.data as Jalon;
                  const period = getJalonPeriod(jalon);
                  const startPos = getPosition(period.start);
                  const endPos = getPosition(period.end);
                  const barWidth = Math.max(2, endPos - startPos);
                  const statusColor = jalonStatusColors[jalon.statut] || jalonStatusColors.a_venir;

                  const JalonIcon = jalon.statut === 'atteint' ? CheckCircle2 :
                    jalon.statut === 'en_danger' || jalon.statut === 'depasse' ? AlertTriangle :
                    Target;

                  return (
                    <div
                      key={`jalon-${jalon.id}`}
                      className="relative border-b bg-white"
                      style={{ height }}
                    >
                      {/* Period bar */}
                      {barWidth > 0 && (
                        <Tooltip content={
                          <div className="text-sm space-y-1 p-1">
                            <p className="font-semibold text-base">{jalon.titre}</p>
                            <p className="text-primary-300">
                              {format(period.start, 'dd MMM', { locale: fr })} → {format(period.end, 'dd MMM yyyy', { locale: fr })}
                            </p>
                            <p>Avancement: {period.progress}%</p>
                            <p>{period.actionsCount} action(s) liée(s)</p>
                          </div>
                        }>
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-l-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            style={{
                              left: `${startPos}%`,
                              width: `${barWidth}%`,
                              minWidth: '50px',
                            }}
                          >
                            <div className={cn('absolute inset-0 opacity-25', statusColor.bg)} />
                            <div
                              className={cn('absolute inset-y-0 left-0', statusColor.bg)}
                              style={{ width: `${period.progress}%`, opacity: 0.6 }}
                            />
                            <div className={cn('absolute inset-0 border-2 rounded-l-md', statusColor.border)} style={{ borderRightWidth: 0 }} />
                          </div>
                        </Tooltip>
                      )}

                      {/* Milestone marker - AGRANDI */}
                      <Tooltip content={
                        <div className="text-sm p-1">
                          <p className="font-semibold text-base">{jalon.titre}</p>
                          <p className="text-primary-300">
                            Échéance: {format(parseISO(jalon.date_prevue || new Date().toISOString()), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                          <p>{JALON_STATUS_LABELS[jalon.statut]}</p>
                        </div>
                      }>
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-transform hover:scale-125 z-10"
                          style={{ left: `${endPos}%` }}
                        >
                          <div className={cn(
                            'w-8 h-8 rotate-45 rounded-sm shadow-lg flex items-center justify-center',
                            statusColor.bg,
                            'border-2 border-white'
                          )}>
                            <JalonIcon className="h-4 w-4 text-white -rotate-45" />
                          </div>
                        </div>
                      </Tooltip>
                    </div>
                  );
                }

                if (row.type === 'action') {
                  const action = row.data as Action;
                  const barStyle = getActionBarStyle(action);
                  const color = actionStatusColors[action.statut] || 'bg-gray-400';

                  return (
                    <div
                      key={`action-${action.id}`}
                      className="relative border-b bg-gray-50"
                      style={{ height }}
                    >
                      <Tooltip content={
                        <div className="text-sm p-1">
                          <p className="font-semibold">{action.titre}</p>
                          <p className="text-primary-300">
                            {action.date_debut_prevue ? format(parseISO(action.date_debut_prevue), 'dd/MM/yy', { locale: fr }) : '-'}
                            {' → '}
                            {action.date_fin_prevue ? format(parseISO(action.date_fin_prevue), 'dd/MM/yy', { locale: fr }) : '-'}
                          </p>
                          <p>Avancement: {action.avancement}%</p>
                          <p>{ACTION_STATUS_LABELS[action.statut]}</p>
                        </div>
                      }>
                        <div
                          className={cn(
                            'absolute top-1/2 -translate-y-1/2 h-7 rounded-full cursor-pointer transition-all hover:h-8 hover:shadow-md',
                            color
                          )}
                          style={{...barStyle, minWidth: '40px'}}
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-white/30 rounded-l-full"
                            style={{ width: `${action.avancement}%` }}
                          />
                          {/* Label sur la barre si assez large */}
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white truncate px-2">
                            {action.avancement}%
                          </span>
                        </div>
                      </Tooltip>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Legend */}
      <div className="p-3 border-t bg-primary-50 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-primary-600 font-medium">Légende:</span>
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-primary-500" />
          <span>Axe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rotate-45 rounded-sm bg-primary-500" />
          <span>Jalon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2 rounded-full bg-info-500" />
          <span>Action</span>
        </div>
        <div className="border-l pl-4 ml-2 border-primary-200 flex items-center gap-4">
          {Object.entries(jalonStatusColors).slice(0, 4).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rotate-45 rounded-sm', colors.bg)} />
              <span>{JALON_STATUS_LABELS[status as JalonStatus]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-4">
          <div className="w-4 h-0.5 bg-error-500" />
          <span>Aujourd'hui</span>
        </div>
      </div>
    </div>
  );
}

export default SyncGanttHierarchical;
