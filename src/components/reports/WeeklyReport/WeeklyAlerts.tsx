/**
 * WeeklyAlerts - Top alertes de la semaine
 */

import { useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  TrendingDown,
  Shield,
  Target,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAlertes, useActions, useJalons, useRisques } from '@/hooks';
import { AXES_CONFIG_FULL } from '@/data/constants';

const axesList = Object.values(AXES_CONFIG_FULL);

interface WeeklyAlertsProps {
  className?: string;
  maxAlerts?: number;
}

interface Alert {
  id: string;
  type: 'action_retard' | 'jalon_retard' | 'risque_critique' | 'sync_ecart' | 'alerte_systeme';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  axe?: string;
  date?: string;
  value?: number;
}

export function WeeklyAlerts({ className, maxAlerts = 10 }: WeeklyAlertsProps) {
  const alertes = useAlertes();
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();

  const today = new Date().toISOString().split('T')[0];

  const getAxeName = (axeId: string | number | undefined): string => {
    if (!axeId) return '';
    const axe = axesList.find(a => a.code === axeId);
    return axe?.label || axe?.labelCourt || '';
  };

  // Génération des alertes consolidées
  const consolidatedAlerts = useMemo(() => {
    const alerts: Alert[] = [];

    // 1. Actions en retard
    const actionsEnRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
    );

    actionsEnRetard.forEach(action => {
      const daysOverdue = Math.ceil(
        (new Date(today).getTime() - new Date(action.date_fin_prevue!).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `action-${action.id}`,
        type: 'action_retard',
        severity: daysOverdue > 14 ? 'critical' : daysOverdue > 7 ? 'high' : 'medium',
        title: action.titre || 'Action sans titre',
        description: `Retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`,
        axe: getAxeName(action.axe_id),
        date: action.date_fin_prevue,
        value: daysOverdue,
      });
    });

    // 2. Jalons en retard
    const jalonsEnRetard = jalons.filter(j =>
      j.statut !== 'atteint' && j.date_prevue && j.date_prevue < today
    );

    jalonsEnRetard.forEach(jalon => {
      const daysOverdue = Math.ceil(
        (new Date(today).getTime() - new Date(jalon.date_prevue!).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `jalon-${jalon.id}`,
        type: 'jalon_retard',
        severity: daysOverdue > 7 ? 'critical' : daysOverdue > 3 ? 'high' : 'medium',
        title: jalon.titre || jalon.nom || 'Jalon sans titre',
        description: `Jalon dépassé de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`,
        axe: getAxeName(jalon.axe_id),
        date: jalon.date_prevue,
        value: daysOverdue,
      });
    });

    // 3. Risques critiques (score >= 12)
    const risquesCritiques = risques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 12 && r.status !== 'ferme';
    });

    risquesCritiques.forEach(risque => {
      const score = risque.score || (risque.probabilite || 0) * (risque.impact || 0);
      alerts.push({
        id: `risque-${risque.id}`,
        type: 'risque_critique',
        severity: score >= 16 ? 'critical' : 'high',
        title: risque.titre || 'Risque sans titre',
        description: `Score de risque: ${score}`,
        axe: getAxeName(risque.axe_id),
        value: score,
      });
    });

    // 4. Alertes système existantes
    alertes.forEach(alerte => {
      if (alerte.statut !== 'resolue') {
        alerts.push({
          id: `alerte-${alerte.id}`,
          type: 'alerte_systeme',
          severity: alerte.severite === 'critique' ? 'critical' : alerte.severite === 'haute' ? 'high' : 'medium',
          title: alerte.titre || 'Alerte système',
          description: alerte.description || '',
          date: alerte.created_at,
        });
      }
    });

    // Tri par sévérité puis par valeur
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return (b.value || 0) - (a.value || 0);
    }).slice(0, maxAlerts);
  }, [actions, jalons, risques, alertes, today, maxAlerts]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'action_retard':
        return Clock;
      case 'jalon_retard':
        return Target;
      case 'risque_critique':
        return Shield;
      case 'sync_ecart':
        return TrendingDown;
      default:
        return AlertCircle;
    }
  };

  const getAlertColors = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-error-50',
          border: 'border-error-200',
          icon: 'bg-error-100 text-error-600',
          text: 'text-error-900',
          badge: 'error' as const,
        };
      case 'high':
        return {
          bg: 'bg-warning-50',
          border: 'border-warning-200',
          icon: 'bg-warning-100 text-warning-600',
          text: 'text-warning-900',
          badge: 'warning' as const,
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'bg-gray-100 text-gray-600',
          text: 'text-gray-900',
          badge: 'default' as const,
        };
    }
  };

  const getSeverityLabel = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'Critique';
      case 'high': return 'Élevée';
      default: return 'Moyenne';
    }
  };

  const getTypeLabel = (type: Alert['type']) => {
    switch (type) {
      case 'action_retard': return 'Action';
      case 'jalon_retard': return 'Jalon';
      case 'risque_critique': return 'Risque';
      case 'sync_ecart': return 'Sync';
      default: return 'Alerte';
    }
  };

  // Statistiques par sévérité
  const stats = useMemo(() => ({
    critical: consolidatedAlerts.filter(a => a.severity === 'critical').length,
    high: consolidatedAlerts.filter(a => a.severity === 'high').length,
    medium: consolidatedAlerts.filter(a => a.severity === 'medium').length,
  }), [consolidatedAlerts]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Résumé des alertes */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm" className={cn(
          stats.critical > 0 ? 'bg-error-50 border-error-200' : 'bg-gray-50 border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn(
              'h-6 w-6',
              stats.critical > 0 ? 'text-error-600' : 'text-gray-400'
            )} />
            <div>
              <p className={cn(
                'text-xl font-bold',
                stats.critical > 0 ? 'text-error-700' : 'text-gray-500'
              )}>{stats.critical}</p>
              <p className="text-xs text-gray-500">Critiques</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className={cn(
          stats.high > 0 ? 'bg-warning-50 border-warning-200' : 'bg-gray-50 border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <AlertCircle className={cn(
              'h-6 w-6',
              stats.high > 0 ? 'text-warning-600' : 'text-gray-400'
            )} />
            <div>
              <p className={cn(
                'text-xl font-bold',
                stats.high > 0 ? 'text-warning-700' : 'text-gray-500'
              )}>{stats.high}</p>
              <p className="text-xs text-gray-500">Élevées</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-gray-50 border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-gray-500" />
            <div>
              <p className="text-xl font-bold text-gray-700">{stats.medium}</p>
              <p className="text-xs text-gray-500">Moyennes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des alertes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-error-600" />
            <h3 className="font-semibold text-gray-900">Top Alertes</h3>
          </div>
          <Badge variant="default">{consolidatedAlerts.length} alertes</Badge>
        </div>

        {consolidatedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success-100 mb-3">
              <Shield className="h-6 w-6 text-success-600" />
            </div>
            <p className="text-sm text-gray-600">Aucune alerte active</p>
            <p className="text-xs text-gray-400 mt-1">Tous les indicateurs sont dans les normes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {consolidatedAlerts.map(alert => {
              const Icon = getAlertIcon(alert.type);
              const colors = getAlertColors(alert.severity);

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-lg border flex items-start gap-3',
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className={cn('p-2 rounded-lg', colors.icon)}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('font-medium truncate', colors.text)}>
                        {alert.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{alert.description}</p>
                    {alert.axe && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Target className="h-3 w-3" />
                        {alert.axe}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={colors.badge} size="sm">
                      {getSeverityLabel(alert.severity)}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {getTypeLabel(alert.type)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default WeeklyAlerts;
