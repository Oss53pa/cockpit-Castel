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
  subDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Diamond,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJalons, useActionsByJalon, useActions } from '@/hooks';
import { Badge, Button, Progress, ScrollArea, Tooltip } from '@/components/ui';
import {
  AXE_LABELS,
  JALON_STATUS_LABELS,
  type Jalon,
  type JalonStatus,
  type JalonFilters,
} from '@/types';

type ZoomLevel = 'day' | 'week' | 'month';

const statusColors: Record<JalonStatus, { bg: string; border: string; text: string }> = {
  a_venir: { bg: 'bg-primary-500', border: 'border-primary-600', text: 'text-primary-700' },
  en_approche: { bg: 'bg-warning-500', border: 'border-warning-600', text: 'text-warning-700' },
  en_danger: { bg: 'bg-error-500', border: 'border-error-600', text: 'text-error-700' },
  atteint: { bg: 'bg-success-500', border: 'border-success-600', text: 'text-success-700' },
  depasse: { bg: 'bg-primary-800', border: 'border-primary-900', text: 'text-primary-900' },
  annule: { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-gray-600' },
};

interface JalonsGanttProps {
  filters: JalonFilters;
  onEdit: (jalon: Jalon) => void;
  onView: (jalon: Jalon) => void;
}

function JalonProgress({ jalonId }: { jalonId?: number }) {
  const actions = useActionsByJalon(jalonId);
  if (actions.length === 0) return null;
  const avancement = Math.round(actions.reduce((sum, a) => sum + a.avancement, 0) / actions.length);
  return (
    <div className="flex items-center gap-1">
      <Progress value={avancement} size="sm" className="w-12 h-1.5" />
      <span className="text-[10px] text-primary-500">{avancement}%</span>
    </div>
  );
}

export function JalonsGantt({ filters, onView }: JalonsGanttProps) {
  const jalons = useJalons(filters);
  const allActions = useActions();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [centerDate, setCenterDate] = useState(new Date());

  // Get actions for a specific jalon
  const getJalonActions = (jalonId?: number) => {
    if (!jalonId) return [];
    return allActions.filter(a => a.jalon_id === jalonId);
  };

  // Calculate period start date for a jalon (from associated actions or default)
  const getJalonPeriod = (jalon: Jalon, prevJalonDate?: Date) => {
    const endDate = jalon.date_prevue ? parseISO(jalon.date_prevue) : new Date();
    const actions = getJalonActions(jalon.id);

    let startDate: Date;

    // If there are associated actions, use the earliest action start date
    if (actions.length > 0) {
      const actionStarts = actions
        .filter(a => a.date_debut_prevue)
        .map(a => parseISO(a.date_debut_prevue!));
      if (actionStarts.length > 0) {
        startDate = new Date(Math.min(...actionStarts.map(d => d.getTime())));
      } else {
        // Default: 30 days before the jalon
        startDate = subDays(endDate, 30);
      }
    } else if (prevJalonDate) {
      // Use previous jalon date as start
      startDate = prevJalonDate;
    } else {
      // Default: 30 days before the jalon
      startDate = subDays(endDate, 30);
    }

    // Calculate progress from associated actions
    const progress = actions.length > 0
      ? Math.round(actions.reduce((sum, a) => sum + a.avancement, 0) / actions.length)
      : jalon.statut === 'atteint' ? 100 : jalon.statut === 'depasse' ? 100 : 0;

    return { startDate, endDate, progress, actionsCount: actions.length };
  };

  // Calculate date range based on jalons
  const { startDate, endDate, timeUnits, unitWidth } = useMemo(() => {
    const now = new Date();
    let minDate = now;
    let maxDate = addMonths(now, 6);

    if (jalons.length > 0) {
      const dates = jalons
        .filter(j => j.date_prevue)
        .map(j => parseISO(j.date_prevue));

      if (dates.length > 0) {
        minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
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
  }, [jalons, zoomLevel]);

  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Get position for a date
  const getPosition = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const dayOffset = differenceInDays(d, startDate);
    return (dayOffset / totalDays) * 100;
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

  // Sort jalons by date
  const sortedJalons = [...jalons].sort((a, b) => {
    const dateA = a.date_prevue ? new Date(a.date_prevue).getTime() : 0;
    const dateB = b.date_prevue ? new Date(b.date_prevue).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-primary-50">
        <div className="flex items-center gap-2">
          <Diamond className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-primary-900">Diagramme de Gantt - Jalons</h3>
          <Badge variant="secondary" className="ml-2">{jalons.length} jalons</Badge>
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
        {/* Left panel - Jalon names */}
        <div className="w-72 shrink-0 border-r bg-white flex flex-col">
          <div className="h-12 border-b bg-primary-50 px-3 flex items-center shrink-0">
            <span className="text-sm font-medium text-primary-700">Jalons</span>
          </div>
          <div className="divide-y overflow-y-auto flex-1">
            {sortedJalons.map((jalon) => {
              const colors = statusColors[jalon.statut] || statusColors.a_venir;
              return (
                <div
                  key={jalon.id}
                  className="h-16 px-3 flex items-center gap-2 hover:bg-primary-50 cursor-pointer shrink-0"
                  onClick={() => onView(jalon)}
                >
                  <div className={cn('w-1 h-10 rounded-full', colors.bg)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900 truncate">{jalon.titre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {AXE_LABELS[jalon.axe]}
                      </Badge>
                      <JalonProgress jalonId={jalon.id} />
                    </div>
                  </div>
                </div>
              );
            })}
            {jalons.length === 0 && (
              <div className="h-32 flex items-center justify-center text-primary-400 text-sm">
                Aucun jalon
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

              {/* Jalon rows */}
              {sortedJalons.map((jalon, rowIndex) => {
                const colors = statusColors[jalon.statut] || statusColors.a_venir;
                const endPosition = jalon.date_prevue ? getPosition(jalon.date_prevue) : 50;

                // Get previous jalon date for period calculation
                const prevJalonInAxe = sortedJalons
                  .slice(0, rowIndex)
                  .filter(j => j.axe === jalon.axe)
                  .pop();
                const prevJalonDate = prevJalonInAxe?.date_prevue
                  ? parseISO(prevJalonInAxe.date_prevue)
                  : undefined;

                // Calculate the jalon period
                const period = getJalonPeriod(jalon, prevJalonDate);
                const startPosition = getPosition(period.startDate);
                const barWidth = Math.max(2, endPosition - startPosition);

                const Icon = jalon.statut === 'atteint' ? CheckCircle2 :
                            jalon.statut === 'en_danger' || jalon.statut === 'depasse' ? AlertTriangle :
                            Target;

                // Background color with opacity
                const _bgColorClass = colors.bg.replace('bg-', '');

                return (
                  <div
                    key={jalon.id}
                    className="h-16 relative border-b border-primary-50"
                  >
                    {/* Dependency line to previous jalon in same axe */}
                    {prevJalonInAxe && (
                      <svg
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{ zIndex: 5 }}
                      >
                        <line
                          x1={`${getPosition(prevJalonInAxe.date_prevue)}%`}
                          y1="0"
                          x2={`${startPosition}%`}
                          y2="50%"
                          stroke="#CBD5E1"
                          strokeWidth="1"
                          strokeDasharray="4 2"
                        />
                      </svg>
                    )}

                    {/* Period bar */}
                    {barWidth > 0 && (
                      <Tooltip content={
                        <div className="text-xs space-y-1">
                          <p className="font-semibold">{jalon.titre}</p>
                          <p className="text-primary-300">
                            Période: {format(period.startDate, 'dd MMM', { locale: fr })} → {format(period.endDate, 'dd MMM yyyy', { locale: fr })}
                          </p>
                          <p className="text-primary-300">
                            Durée: {differenceInDays(period.endDate, period.startDate)} jours
                          </p>
                          {period.actionsCount > 0 && (
                            <p className="text-primary-300">
                              {period.actionsCount} action(s) liée(s) - Avancement: {period.progress}%
                            </p>
                          )}
                          <p className={colors.text}>{JALON_STATUS_LABELS[jalon.statut]}</p>
                        </div>
                      }>
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-7 rounded-l-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                          style={{
                            left: `${startPosition}%`,
                            width: `${barWidth}%`,
                            minWidth: '40px',
                          }}
                          onClick={() => onView(jalon)}
                        >
                          {/* Bar background */}
                          <div
                            className={cn('absolute inset-0 opacity-25', colors.bg)}
                          />
                          {/* Progress fill */}
                          <div
                            className={cn('absolute inset-y-0 left-0', colors.bg)}
                            style={{ width: `${period.progress}%`, opacity: 0.7 }}
                          />
                          {/* Bar border */}
                          <div
                            className={cn('absolute inset-0 border rounded-l-lg', colors.border)}
                            style={{ borderRightWidth: 0 }}
                          />
                          {/* Code label inside bar */}
                          {barWidth > 8 && (
                            <div className="absolute inset-0 flex items-center px-2">
                              <span className="text-[10px] font-medium text-primary-800 truncate">
                                {jalon.id_jalon}
                              </span>
                            </div>
                          )}
                        </div>
                      </Tooltip>
                    )}

                    {/* Milestone marker at end */}
                    <Tooltip content={
                      <div className="text-xs">
                        <p className="font-medium">{jalon.titre}</p>
                        <p className="text-primary-300">Échéance: {format(parseISO(jalon.date_prevue || new Date().toISOString()), 'dd MMMM yyyy', { locale: fr })}</p>
                        <p className={colors.text}>{JALON_STATUS_LABELS[jalon.statut]}</p>
                      </div>
                    }>
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-transform hover:scale-125 z-10',
                        )}
                        style={{ left: `${endPosition}%` }}
                        onClick={() => onView(jalon)}
                      >
                        <div className={cn(
                          'w-6 h-6 rotate-45 rounded-sm shadow-lg flex items-center justify-center',
                          colors.bg,
                          'border-2 border-white'
                        )}>
                          <Icon className="h-3 w-3 text-white -rotate-45" />
                        </div>
                      </div>
                    </Tooltip>

                    {/* Date label */}
                    <div
                      className="absolute top-1/2 translate-y-4 -translate-x-1/2 text-[10px] text-primary-500 whitespace-nowrap"
                      style={{ left: `${endPosition}%` }}
                    >
                      {format(parseISO(jalon.date_prevue || new Date().toISOString()), 'dd/MM', { locale: fr })}
                    </div>
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
        {Object.entries(statusColors).filter(([status]) => status !== 'annule').map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rotate-45 rounded-sm', colors.bg)} />
            <span>{JALON_STATUS_LABELS[status as JalonStatus]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4 border-l pl-4 border-primary-200">
          <div className="w-8 h-3 bg-primary-200 rounded-l border border-primary-400" style={{ borderRightWidth: 0 }} />
          <span>Période de préparation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-error-500" />
          <span>Aujourd'hui</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0 border-t border-dashed border-primary-400" />
          <span>Dépendance</span>
        </div>
      </div>
    </div>
  );
}
