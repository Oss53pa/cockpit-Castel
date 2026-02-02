/**
 * WeeklyActions - Actions de la semaine (terminées S, prévues S+1)
 */

import { useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Target,
  User,
  Calendar,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useActions } from '@/hooks';
import { AXES_CONFIG_FULL } from '@/data/constants';
import { Action } from '@/types';

// Convertir la config des axes en tableau
const axesList = Object.values(AXES_CONFIG_FULL);

interface WeeklyActionsProps {
  className?: string;
}

export function WeeklyActions({ className }: WeeklyActionsProps) {
  const actions = useActions();

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche

  const startOfNextWeek = new Date(endOfWeek);
  startOfNextWeek.setDate(endOfWeek.getDate() + 1);
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Actions terminées cette semaine et prévues semaine prochaine
  const { completedThisWeek, plannedNextWeek, overdueActions } = useMemo(() => {
    const weekStart = formatDate(startOfWeek);
    const weekEnd = formatDate(endOfWeek);
    const nextWeekStart = formatDate(startOfNextWeek);
    const nextWeekEnd = formatDate(endOfNextWeek);
    const todayStr = formatDate(today);

    // Actions terminées cette semaine
    const completed = actions.filter(a => {
      if (a.statut !== 'termine') return false;
      const completedDate = a.date_fin_reelle || a.updatedAt?.split('T')[0];
      return completedDate && completedDate >= weekStart && completedDate <= weekEnd;
    });

    // Actions prévues pour S+1
    const planned = actions.filter(a => {
      if (a.statut === 'termine') return false;
      return a.date_fin_prevue && a.date_fin_prevue >= nextWeekStart && a.date_fin_prevue <= nextWeekEnd;
    });

    // Actions en retard
    const overdue = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < todayStr
    );

    return {
      completedThisWeek: completed,
      plannedNextWeek: planned,
      overdueActions: overdue,
    };
  }, [actions, startOfWeek, endOfWeek, startOfNextWeek, endOfNextWeek, today]);

  const getAxeName = (axeId: string | number | undefined): string => {
    if (!axeId) return 'Non assigné';
    const axe = axesList.find(a => a.code === axeId);
    return axe?.label || axe?.labelCourt || String(axeId);
  };

  const getAxeColor = (axeId: string | number | undefined): string => {
    if (!axeId) return 'gray';
    const axe = axesList.find(a => a.code === axeId);
    return axe?.color || 'gray';
  };

  const getPriorityBadge = (priorite?: string) => {
    switch (priorite) {
      case 'haute':
      case 'high':
        return <Badge variant="error" size="sm">Haute</Badge>;
      case 'moyenne':
      case 'medium':
        return <Badge variant="warning" size="sm">Moyenne</Badge>;
      case 'basse':
      case 'low':
        return <Badge variant="info" size="sm">Basse</Badge>;
      default:
        return null;
    }
  };

  const ActionItem = ({ action, showStatus = false }: { action: Action; showStatus?: boolean }) => {
    const axeColor = getAxeColor(action.axe_id);

    return (
      <div className={cn(
        'p-3 rounded-lg border-l-4 bg-white border',
        `border-l-${axeColor}-500`
      )} style={{ borderLeftColor: `var(--${axeColor}-500, #6b7280)` }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 truncate">{action.titre}</span>
              {getPriorityBadge(action.priorite)}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {getAxeName(action.axe_id)}
              </span>
              {action.responsable && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {action.responsable}
                </span>
              )}
              {action.date_fin_prevue && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(action.date_fin_prevue).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
          {showStatus && (
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-600">{action.avancement || 0}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* En-tête avec résumé */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm" className="bg-success-50 border-success-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success-600" />
            <div>
              <p className="text-2xl font-bold text-success-700">{completedThisWeek.length}</p>
              <p className="text-xs text-success-600">Terminées cette semaine</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary-600" />
            <div>
              <p className="text-2xl font-bold text-primary-700">{plannedNextWeek.length}</p>
              <p className="text-xs text-primary-600">Prévues S+1</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className={cn(
          overdueActions.length > 0 ? 'bg-error-50 border-error-200' : 'bg-gray-50 border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn(
              'h-8 w-8',
              overdueActions.length > 0 ? 'text-error-600' : 'text-gray-400'
            )} />
            <div>
              <p className={cn(
                'text-2xl font-bold',
                overdueActions.length > 0 ? 'text-error-700' : 'text-gray-500'
              )}>{overdueActions.length}</p>
              <p className={cn(
                'text-xs',
                overdueActions.length > 0 ? 'text-error-600' : 'text-gray-500'
              )}>En retard</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions terminées cette semaine */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-success-600" />
          <h3 className="font-semibold text-gray-900">Actions terminées cette semaine</h3>
          <Badge variant="success">{completedThisWeek.length}</Badge>
        </div>

        {completedThisWeek.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Aucune action terminée cette semaine</p>
        ) : (
          <div className="space-y-2">
            {completedThisWeek.slice(0, 5).map(action => (
              <ActionItem key={action.id} action={action} />
            ))}
            {completedThisWeek.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                +{completedThisWeek.length - 5} autres actions terminées
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Actions prévues S+1 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ArrowRight className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Actions prévues pour la semaine prochaine</h3>
          <Badge variant="primary">{plannedNextWeek.length}</Badge>
        </div>

        {plannedNextWeek.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Aucune action prévue pour S+1</p>
        ) : (
          <div className="space-y-2">
            {plannedNextWeek.slice(0, 8).map(action => (
              <ActionItem key={action.id} action={action} showStatus />
            ))}
            {plannedNextWeek.length > 8 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                +{plannedNextWeek.length - 8} autres actions prévues
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Actions en retard (si présentes) */}
      {overdueActions.length > 0 && (
        <Card className="border-error-200 bg-error-50">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-error-600" />
            <h3 className="font-semibold text-error-700">Actions en retard à traiter</h3>
            <Badge variant="error">{overdueActions.length}</Badge>
          </div>

          <div className="space-y-2">
            {overdueActions.slice(0, 5).map(action => (
              <ActionItem key={action.id} action={action} showStatus />
            ))}
            {overdueActions.length > 5 && (
              <p className="text-sm text-error-600 text-center pt-2">
                +{overdueActions.length - 5} autres actions en retard
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default WeeklyActions;
