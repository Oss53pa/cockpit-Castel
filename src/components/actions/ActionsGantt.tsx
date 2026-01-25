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
  ZoomIn,
  ZoomOut,
  GanttChart,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActions } from '@/hooks';
import { Badge, Button, ScrollArea, Tooltip } from '@/components/ui';
import {
  AXE_LABELS,
  ACTION_STATUS_LABELS,
  type Action,
  type ActionStatus,
  type ActionFilters,
} from '@/types';

type ZoomLevel = 'day' | 'week' | 'month';

const statusColors: Record<ActionStatus, string> = {
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

const defaultStatusColor = 'bg-gray-400';

interface ActionsGanttProps {
  filters: ActionFilters;
  onEdit: (action: Action) => void;
  onView: (action: Action) => void;
}

export function ActionsGantt({ filters, onView }: ActionsGanttProps) {
  const actions = useActions(filters);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [centerDate, setCenterDate] = useState(new Date());

  // Calculate date range based on actions
  const { startDate, endDate, timeUnits, unitWidth } = useMemo(() => {
    const now = new Date();
    let minDate = now;
    let maxDate = addMonths(now, 6);

    if (actions.length > 0) {
      const allDates = actions.flatMap(a => {
        const dates: Date[] = [];
        if (a.date_debut_prevue) {
          try {
            const d = parseISO(a.date_debut_prevue);
            if (!isNaN(d.getTime())) dates.push(d);
          } catch { /* ignore invalid dates */ }
        }
        if (a.date_fin_prevue) {
          try {
            const d = parseISO(a.date_fin_prevue);
            if (!isNaN(d.getTime())) dates.push(d);
          } catch { /* ignore invalid dates */ }
        }
        return dates;
      });

      if (allDates.length > 0) {
        minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
      }
    }

    // Add padding
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

    return {
      startDate: start,
      endDate: end,
      timeUnits: units,
      unitWidth: width,
    };
  }, [actions, zoomLevel]);

  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Safe parseISO helper
  const safeParse = (dateStr: string | null | undefined, fallback: Date): Date => {
    if (!dateStr || typeof dateStr !== 'string') return fallback;
    try {
      const parsed = parseISO(dateStr);
      return isNaN(parsed.getTime()) ? fallback : parsed;
    } catch {
      return fallback;
    }
  };

  // Get position and width for an action
  const getBarStyle = (action: Action) => {
    const actionStart = safeParse(action.date_debut_prevue, startDate);
    const actionEnd = safeParse(action.date_fin_prevue, actionStart);

    const startOffset = Math.max(0, differenceInDays(actionStart, startDate));
    const duration = Math.max(1, differenceInDays(actionEnd, actionStart) + 1);

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: `${left}%`,
      width: `${Math.max(width, 0.5)}%`,
    };
  };

  // Today position
  const todayPosition = useMemo(() => {
    const dayOffset = differenceInDays(new Date(), startDate);
    return (dayOffset / totalDays) * 100;
  }, [startDate, totalDays]);

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

  // Sort actions by start date
  const sortedActions = [...actions].sort((a, b) => {
    const dateA = a.date_debut_prevue ? new Date(a.date_debut_prevue).getTime() : 0;
    const dateB = b.date_debut_prevue ? new Date(b.date_debut_prevue).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-primary-50">
        <div className="flex items-center gap-2">
          <GanttChart className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-primary-900">Diagramme de Gantt - Actions</h3>
          <Badge variant="secondary" className="ml-2">{actions.length} actions</Badge>
        </div>

        <div className="flex items-center gap-2">
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
      <div className="flex max-h-[calc(100vh-280px)] overflow-hidden">
        {/* Left panel - Action names */}
        <div className="w-80 shrink-0 border-r bg-white flex flex-col">
          <div className="h-12 border-b bg-primary-50 px-3 flex items-center shrink-0">
            <span className="text-sm font-medium text-primary-700">Actions</span>
          </div>
          <div className="divide-y overflow-y-auto flex-1">
            {sortedActions.map((action) => (
              <div
                key={action.id}
                className="h-14 px-3 flex items-center gap-2 hover:bg-primary-50 cursor-pointer shrink-0"
                onClick={() => onView(action)}
              >
                <div
                  className={cn(
                    'w-1 h-8 rounded-full',
                    statusColors[action.statut] || defaultStatusColor
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-900 truncate">{action.titre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {AXE_LABELS[action.axe]}
                    </Badge>
                    {action.responsable && (
                      <span className="text-[10px] text-primary-400 flex items-center gap-0.5">
                        <User className="h-3 w-3" />
                        {action.responsable}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {actions.length === 0 && (
              <div className="h-32 flex items-center justify-center text-primary-400 text-sm">
                Aucune action
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Timeline */}
        <ScrollArea className="flex-1 h-full" ref={scrollRef}>
          <div style={{ width: `${timeUnits.length * unitWidth}px`, minWidth: '100%' }}>
            {/* Time header */}
            <div className="h-12 border-b bg-primary-50 flex sticky top-0 z-10">
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
                      isCurrentUnit ? 'bg-primary-100 text-primary-700 font-medium' : 'text-primary-500'
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

              {/* Action rows */}
              {sortedActions.map((action) => {
                const barStyle = getBarStyle(action);
                const color = statusColors[action.statut] || defaultStatusColor;

                return (
                  <div
                    key={action.id}
                    className="h-14 relative border-b border-primary-50"
                  >
                    <Tooltip
                      content={
                        <div className="text-xs">
                          <p className="font-medium">{action.titre}</p>
                          <p className="text-primary-300">
                            {action.date_debut_prevue ? format(safeParse(action.date_debut_prevue, new Date()), 'dd/MM/yy', { locale: fr }) : '-'}
                            {' → '}
                            {action.date_fin_prevue ? format(safeParse(action.date_fin_prevue, new Date()), 'dd/MM/yy', { locale: fr }) : '-'}
                          </p>
                          <p>Avancement: {action.avancement}%</p>
                        </div>
                      }
                    >
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 h-7 rounded-full cursor-pointer transition-all hover:h-9 hover:shadow-lg',
                          color
                        )}
                        style={barStyle}
                        onClick={() => onView(action)}
                      >
                        {/* Progress overlay */}
                        <div
                          className="absolute inset-y-0 left-0 bg-white/30 rounded-l-full"
                          style={{ width: `${action.avancement}%` }}
                        />
                        {/* Label */}
                        <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                          <span className="text-[10px] text-white font-medium truncate">
                            {action.avancement}%
                          </span>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Legend */}
      <div className="p-3 border-t bg-primary-50 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-primary-600 font-medium">Légende:</span>
        {Object.entries(statusColors).slice(0, 6).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('w-4 h-2 rounded-full', color)} />
            <span>{ACTION_STATUS_LABELS[status as ActionStatus]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          <div className="w-4 h-0.5 bg-error-500" />
          <span>Aujourd'hui</span>
        </div>
      </div>
    </div>
  );
}
