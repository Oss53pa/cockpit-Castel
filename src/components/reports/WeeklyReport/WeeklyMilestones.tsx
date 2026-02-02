/**
 * WeeklyMilestones - Jalons des 7 prochains jours
 */

import { useMemo } from 'react';
import {
  Flag,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useJalons } from '@/hooks';
import { AXES_CONFIG_FULL } from '@/data/constants';
import { Jalon } from '@/types';

const axesList = Object.values(AXES_CONFIG_FULL);

interface WeeklyMilestonesProps {
  className?: string;
}

export function WeeklyMilestones({ className }: WeeklyMilestonesProps) {
  const jalons = useJalons();

  const today = new Date();
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const todayStr = formatDate(today);
  const in7DaysStr = formatDate(in7Days);

  // Jalons à venir dans les 7 prochains jours et jalons en retard
  const { upcomingMilestones, overdueMilestones, recentlyCompleted } = useMemo(() => {
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = formatDate(sevenDaysAgo);

    // Jalons des 7 prochains jours (non terminés)
    const upcoming = jalons.filter(j => {
      if (j.statut === 'atteint') return false;
      return j.date_prevue && j.date_prevue >= todayStr && j.date_prevue <= in7DaysStr;
    }).sort((a, b) => (a.date_prevue || '').localeCompare(b.date_prevue || ''));

    // Jalons en retard
    const overdue = jalons.filter(j =>
      j.statut !== 'atteint' && j.date_prevue && j.date_prevue < todayStr
    ).sort((a, b) => (a.date_prevue || '').localeCompare(b.date_prevue || ''));

    // Jalons récemment atteints (7 derniers jours)
    const completed = jalons.filter(j => {
      if (j.statut !== 'atteint') return false;
      const completedDate = j.date_reelle || j.updatedAt?.split('T')[0];
      return completedDate && completedDate >= sevenDaysAgoStr && completedDate <= todayStr;
    });

    return {
      upcomingMilestones: upcoming,
      overdueMilestones: overdue,
      recentlyCompleted: completed,
    };
  }, [jalons, todayStr, in7DaysStr, today]);

  const getAxeName = (axeId: string | number | undefined): string => {
    if (!axeId) return 'Non assigné';
    const axe = axesList.find(a => a.code === axeId);
    return axe?.label || axe?.labelCourt || String(axeId);
  };

  const getDaysUntil = (dateStr: string): number => {
    const date = new Date(dateStr);
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysOverdue = (dateStr: string): number => {
    const date = new Date(dateStr);
    const diffTime = today.getTime() - date.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const MilestoneItem = ({ jalon, type }: { jalon: Jalon; type: 'upcoming' | 'overdue' | 'completed' }) => {
    const daysInfo = type === 'upcoming' && jalon.date_prevue
      ? getDaysUntil(jalon.date_prevue)
      : type === 'overdue' && jalon.date_prevue
      ? getDaysOverdue(jalon.date_prevue)
      : 0;

    return (
      <div className={cn(
        'p-3 rounded-lg border flex items-start gap-3',
        type === 'overdue' && 'bg-error-50 border-error-200',
        type === 'upcoming' && 'bg-white',
        type === 'completed' && 'bg-success-50 border-success-200'
      )}>
        <div className={cn(
          'p-2 rounded-lg',
          type === 'overdue' && 'bg-error-100',
          type === 'upcoming' && 'bg-primary-100',
          type === 'completed' && 'bg-success-100'
        )}>
          {type === 'completed' ? (
            <CheckCircle className="h-5 w-5 text-success-600" />
          ) : type === 'overdue' ? (
            <AlertTriangle className="h-5 w-5 text-error-600" />
          ) : (
            <Flag className="h-5 w-5 text-primary-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium truncate',
            type === 'overdue' ? 'text-error-900' : type === 'completed' ? 'text-success-900' : 'text-gray-900'
          )}>
            {jalon.titre || jalon.nom}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {getAxeName(jalon.axe_id)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {jalon.date_prevue && new Date(jalon.date_prevue).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        <div className="text-right">
          {type === 'upcoming' && (
            <Badge variant={daysInfo <= 2 ? 'warning' : 'info'} size="sm">
              J-{daysInfo}
            </Badge>
          )}
          {type === 'overdue' && (
            <Badge variant="error" size="sm">
              +{daysInfo}j
            </Badge>
          )}
          {type === 'completed' && (
            <Badge variant="success" size="sm">
              Atteint
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm" className="bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <Flag className="h-8 w-8 text-primary-600" />
            <div>
              <p className="text-2xl font-bold text-primary-700">{upcomingMilestones.length}</p>
              <p className="text-xs text-primary-600">À venir (J+7)</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className={cn(
          overdueMilestones.length > 0 ? 'bg-error-50 border-error-200' : 'bg-gray-50 border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn(
              'h-8 w-8',
              overdueMilestones.length > 0 ? 'text-error-600' : 'text-gray-400'
            )} />
            <div>
              <p className={cn(
                'text-2xl font-bold',
                overdueMilestones.length > 0 ? 'text-error-700' : 'text-gray-500'
              )}>{overdueMilestones.length}</p>
              <p className={cn(
                'text-xs',
                overdueMilestones.length > 0 ? 'text-error-600' : 'text-gray-500'
              )}>En retard</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-success-50 border-success-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success-600" />
            <div>
              <p className="text-2xl font-bold text-success-700">{recentlyCompleted.length}</p>
              <p className="text-xs text-success-600">Atteints (7j)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Jalons en retard (prioritaire) */}
      {overdueMilestones.length > 0 && (
        <Card className="border-error-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-error-600" />
            <h3 className="font-semibold text-error-700">Jalons en retard</h3>
            <Badge variant="error">{overdueMilestones.length}</Badge>
          </div>

          <div className="space-y-2">
            {overdueMilestones.map(jalon => (
              <MilestoneItem key={jalon.id} jalon={jalon} type="overdue" />
            ))}
          </div>
        </Card>
      )}

      {/* Jalons à venir */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Jalons des 7 prochains jours</h3>
          <Badge variant="primary">{upcomingMilestones.length}</Badge>
        </div>

        {upcomingMilestones.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Aucun jalon prévu dans les 7 prochains jours</p>
        ) : (
          <div className="space-y-2">
            {upcomingMilestones.map(jalon => (
              <MilestoneItem key={jalon.id} jalon={jalon} type="upcoming" />
            ))}
          </div>
        )}
      </Card>

      {/* Jalons récemment atteints */}
      {recentlyCompleted.length > 0 && (
        <Card className="border-success-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-success-600" />
            <h3 className="font-semibold text-success-700">Jalons atteints cette semaine</h3>
            <Badge variant="success">{recentlyCompleted.length}</Badge>
          </div>

          <div className="space-y-2">
            {recentlyCompleted.map(jalon => (
              <MilestoneItem key={jalon.id} jalon={jalon} type="completed" />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default WeeklyMilestones;
