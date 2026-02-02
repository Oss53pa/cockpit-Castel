/**
 * MonthlySummary - Synthèse exécutive du mois
 */

import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  Flag,
  Shield,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  useActions,
  useJalons,
  useRisques,
  useBudget,
  useDashboardKPIs,
  useCOPILTrends,
} from '@/hooks';
import { useSiteStore } from '@/stores/siteStore';

interface MonthlySummaryProps {
  className?: string;
}

type ProjectStatus = 'on_track' | 'at_risk' | 'delayed' | 'critical';

export function MonthlySummary({ className }: MonthlySummaryProps) {
  const { currentSiteId } = useSiteStore();
  const siteId = currentSiteId || 1;

  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();
  const { budget } = useBudget();
  const kpis = useDashboardKPIs();
  const trends = useCOPILTrends(siteId);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Calculs des métriques mensuelles
  const monthlyMetrics = useMemo(() => {
    // Actions
    const actionsTerminees = actions.filter(a => a.statut === 'termine').length;
    const actionsTotal = actions.length;
    const actionsEnRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
    ).length;

    // Jalons
    const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
    const jalonsTotal = jalons.length;
    const jalonsEnRetard = jalons.filter(j =>
      j.statut !== 'atteint' && j.date_prevue && j.date_prevue < today
    ).length;

    // Risques
    const risquesCritiques = risques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 12 && r.status !== 'ferme';
    }).length;
    const risquesTotal = risques.filter(r => r.status !== 'ferme').length;

    // Budget
    const budgetTotal = budget?.total || 0;
    const budgetConsomme = budget?.consomme || kpis.budgetConsomme || 0;
    const budgetVariance = budget?.variance || 0;

    // Avancement global
    const avancementGlobal = actionsTotal > 0
      ? Math.round(actions.reduce((sum, a) => sum + (a.avancement || 0), 0) / actionsTotal)
      : 0;

    // Statut du projet
    let projectStatus: ProjectStatus;
    if (jalonsEnRetard === 0 && actionsEnRetard <= 2 && risquesCritiques === 0) {
      projectStatus = 'on_track';
    } else if (jalonsEnRetard <= 2 && actionsEnRetard <= 5 && risquesCritiques <= 1) {
      projectStatus = 'at_risk';
    } else if (jalonsEnRetard <= 4 && actionsEnRetard <= 10 && risquesCritiques <= 2) {
      projectStatus = 'delayed';
    } else {
      projectStatus = 'critical';
    }

    return {
      actionsTerminees,
      actionsTotal,
      actionsEnRetard,
      jalonsAtteints,
      jalonsTotal,
      jalonsEnRetard,
      risquesCritiques,
      risquesTotal,
      budgetTotal,
      budgetConsomme,
      budgetVariance,
      avancementGlobal,
      projectStatus,
    };
  }, [actions, jalons, risques, budget, kpis, today]);

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case 'on_track':
        return {
          label: 'Dans les temps',
          color: 'success',
          bg: 'bg-success-50',
          border: 'border-success-200',
          text: 'text-success-700',
          icon: CheckCircle,
        };
      case 'at_risk':
        return {
          label: 'Sous vigilance',
          color: 'warning',
          bg: 'bg-warning-50',
          border: 'border-warning-200',
          text: 'text-warning-700',
          icon: AlertTriangle,
        };
      case 'delayed':
        return {
          label: 'En retard',
          color: 'orange',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          icon: AlertTriangle,
        };
      case 'critical':
        return {
          label: 'Critique',
          color: 'error',
          bg: 'bg-error-50',
          border: 'border-error-200',
          text: 'text-error-700',
          icon: AlertTriangle,
        };
    }
  };

  const statusConfig = getStatusConfig(monthlyMetrics.projectStatus);
  const StatusIcon = statusConfig.icon;

  // Tendances
  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (direction?: string, isPositive = true) => {
    if (!direction || direction === 'stable') return 'text-gray-500';
    if (direction === 'up') return isPositive ? 'text-success-600' : 'text-error-600';
    return isPositive ? 'text-error-600' : 'text-success-600';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statut global du projet */}
      <Card className={cn(statusConfig.bg, statusConfig.border, 'p-6')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-full', statusConfig.bg)}>
              <StatusIcon className={cn('h-10 w-10', statusConfig.text)} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Statut Projet - {currentMonth}</p>
              <p className={cn('text-3xl font-bold', statusConfig.text)}>
                {statusConfig.label}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Avancement Global</p>
            <p className="text-4xl font-bold text-gray-900">{monthlyMetrics.avancementGlobal}%</p>
            {trends?.avancementProjet && (
              <div className={cn(
                'flex items-center justify-end gap-1 mt-1 text-sm',
                getTrendColor(trends.avancementProjet.direction)
              )}>
                {(() => {
                  const Icon = getTrendIcon(trends.avancementProjet.direction);
                  return <Icon className="h-4 w-4" />;
                })()}
                <span>
                  {trends.avancementProjet.variation > 0 ? '+' : ''}
                  {trends.avancementProjet.variation?.toFixed(1)}% vs M-1
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Résumé en chiffres */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Actions */}
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Actions
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {monthlyMetrics.actionsTerminees}
                <span className="text-sm text-gray-400">/{monthlyMetrics.actionsTotal}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">terminées</p>
            </div>
            {monthlyMetrics.actionsEnRetard > 0 && (
              <Badge variant="error" size="sm">{monthlyMetrics.actionsEnRetard} retard</Badge>
            )}
          </div>
        </Card>

        {/* Jalons */}
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Flag className="h-3 w-3" />
                Jalons
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {monthlyMetrics.jalonsAtteints}
                <span className="text-sm text-gray-400">/{monthlyMetrics.jalonsTotal}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">atteints</p>
            </div>
            {monthlyMetrics.jalonsEnRetard > 0 && (
              <Badge variant="error" size="sm">{monthlyMetrics.jalonsEnRetard} retard</Badge>
            )}
          </div>
        </Card>

        {/* Risques */}
        <Card padding="md" className={monthlyMetrics.risquesCritiques > 0 ? 'border-error-200' : ''}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Risques
              </p>
              <p className={cn(
                'text-2xl font-bold mt-1',
                monthlyMetrics.risquesCritiques > 0 ? 'text-error-600' : 'text-gray-900'
              )}>
                {monthlyMetrics.risquesCritiques}
                <span className="text-sm text-gray-400">/{monthlyMetrics.risquesTotal}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">critiques</p>
            </div>
          </div>
        </Card>

        {/* Budget */}
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Budget
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {monthlyMetrics.budgetConsomme}%
              </p>
              <p className="text-xs text-gray-500 mt-1">consommé</p>
            </div>
            {monthlyMetrics.budgetVariance !== 0 && (
              <Badge
                variant={monthlyMetrics.budgetVariance > 0 ? 'error' : 'success'}
                size="sm"
              >
                {monthlyMetrics.budgetVariance > 0 ? '+' : ''}
                {monthlyMetrics.budgetVariance}%
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Points clés du mois */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Points Clés du Mois</h3>
        <div className="space-y-3">
          {/* Avancement */}
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              monthlyMetrics.avancementGlobal >= 50 ? 'bg-success-100' : 'bg-warning-100'
            )}>
              <Target className={cn(
                'h-4 w-4',
                monthlyMetrics.avancementGlobal >= 50 ? 'text-success-600' : 'text-warning-600'
              )} />
            </div>
            <div>
              <p className="font-medium text-gray-900">Avancement du projet</p>
              <p className="text-sm text-gray-600">
                {monthlyMetrics.avancementGlobal >= 80
                  ? 'Le projet avance conformément au planning avec un excellent taux d\'avancement.'
                  : monthlyMetrics.avancementGlobal >= 50
                  ? 'Le projet progresse mais nécessite une attention particulière sur certains axes.'
                  : 'Le projet nécessite une accélération significative pour atteindre les objectifs.'
                }
              </p>
            </div>
          </div>

          {/* Jalons */}
          {monthlyMetrics.jalonsEnRetard > 0 && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-error-100">
                <Flag className="h-4 w-4 text-error-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Jalons en retard</p>
                <p className="text-sm text-gray-600">
                  {monthlyMetrics.jalonsEnRetard} jalon{monthlyMetrics.jalonsEnRetard > 1 ? 's' : ''}
                  n'{monthlyMetrics.jalonsEnRetard > 1 ? 'ont' : 'a'} pas été atteint{monthlyMetrics.jalonsEnRetard > 1 ? 's' : ''}
                  à la date prévue. Action corrective requise.
                </p>
              </div>
            </div>
          )}

          {/* Risques */}
          {monthlyMetrics.risquesCritiques > 0 && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-error-100">
                <Shield className="h-4 w-4 text-error-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Risques critiques identifiés</p>
                <p className="text-sm text-gray-600">
                  {monthlyMetrics.risquesCritiques} risque{monthlyMetrics.risquesCritiques > 1 ? 's' : ''}
                  avec un score ≥12 nécessite{monthlyMetrics.risquesCritiques > 1 ? 'nt' : ''} une attention immédiate.
                </p>
              </div>
            </div>
          )}

          {/* Budget */}
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              monthlyMetrics.budgetVariance <= 0 ? 'bg-success-100' : 'bg-warning-100'
            )}>
              <DollarSign className={cn(
                'h-4 w-4',
                monthlyMetrics.budgetVariance <= 0 ? 'text-success-600' : 'text-warning-600'
              )} />
            </div>
            <div>
              <p className="font-medium text-gray-900">Suivi budgétaire</p>
              <p className="text-sm text-gray-600">
                {monthlyMetrics.budgetVariance <= 0
                  ? `Budget maîtrisé avec ${monthlyMetrics.budgetConsomme}% consommé.`
                  : `Dépassement budgétaire de ${monthlyMetrics.budgetVariance}% à surveiller.`
                }
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default MonthlySummary;
