import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActions } from '@/hooks';
import { Button } from '@/components/ui';
import type { Action, ActionFilters } from '@/types';

interface ActionsCalendarProps {
  filters: ActionFilters;
  onEdit: (action: Action) => void;
  onView: (action: Action) => void;
}

const statusColors: Record<string, string> = {
  a_planifier: 'bg-gray-200 text-gray-700',
  planifie: 'bg-primary-100 text-primary-700',
  a_faire: 'bg-primary-200 text-primary-700',
  en_cours: 'bg-info-200 text-info-700',
  en_attente: 'bg-warning-200 text-warning-700',
  bloque: 'bg-error-200 text-error-700',
  en_validation: 'bg-purple-200 text-purple-700',
  termine: 'bg-success-200 text-success-700',
  annule: 'bg-gray-300 text-gray-600',
  reporte: 'bg-orange-200 text-orange-700',
};

const defaultStatusColor = 'bg-gray-200 text-gray-700';

export function ActionsCalendar({ filters, onView }: ActionsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const actions = useActions(filters);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getActionsForDay = (day: Date) =>
    actions.filter((action) => {
      if (!action.date_fin_prevue) return false;
      const actionEnd = parseISO(action.date_fin_prevue);
      return isSameDay(actionEnd, day);
    });

  return (
    <div className="rounded-lg border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-primary-500 border-r last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayActions = getActionsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[100px] p-2 border-b border-r',
                idx % 7 === 6 && 'border-r-0',
                !isCurrentMonth && 'bg-primary-50'
              )}
            >
              <div
                className={cn(
                  'text-sm font-medium mb-1',
                  !isCurrentMonth && 'text-primary-300',
                  isToday &&
                    'bg-primary-900 text-white w-6 h-6 rounded-full flex items-center justify-center'
                )}
              >
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayActions.slice(0, 3).map((action) => (
                  <div
                    key={action.id}
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity',
                      statusColors[action.statut] || defaultStatusColor
                    )}
                    onClick={() => onView(action)}
                    title={action.titre}
                  >
                    {action.titre}
                  </div>
                ))}
                {dayActions.length > 3 && (
                  <div className="text-[10px] text-primary-400 px-1">
                    +{dayActions.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
