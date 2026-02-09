/**
 * WeeklyKPIs - KPIs clés de la semaine avec évolution vs S-1
 */

import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Users,
  Calendar,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  useDashboardKPIs,
  useActions,
  useJalons,
  useRisques,
  useCOPILTrends,
  useAvancementGlobal,
} from '@/hooks';
import { useSiteStore } from '@/stores/siteStore';
import { KPICard } from '../shared/KPICard';

interface WeeklyKPIsProps {
  className?: string;
}

export function WeeklyKPIs({ className }: WeeklyKPIsProps) {
  const { currentSiteId } = useSiteStore();
  const siteId = currentSiteId || 1;

  // Données réelles
  const kpis = useDashboardKPIs();
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();
  const trends = useCOPILTrends(siteId);
  const avancementGlobalPondere = useAvancementGlobal();

  const today = new Date().toISOString().split('T')[0];

  // Calculs des métriques
  const metrics = useMemo(() => {
    // Actions
    const actionsTerminees = actions.filter(a => a.statut === 'termine').length;
    const actionsEnCours = actions.filter(a => a.statut === 'en_cours').length;
    const actionsEnRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
    ).length;
    const actionsBloquees = actions.filter(a => a.statut === 'bloque').length;

    // Jalons
    const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
    const jalonsEnRetard = jalons.filter(j =>
      j.statut !== 'atteint' && j.date_prevue && j.date_prevue < today
    ).length;

    // Risques critiques
    const risquesCritiques = risques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 12 && r.status !== 'ferme';
    }).length;

    // Avancement global — utilise le hook pondéré
    const avancementGlobal = Math.round(avancementGlobalPondere);

    return {
      actionsTotal: actions.length,
      actionsTerminees,
      actionsEnCours,
      actionsEnRetard,
      actionsBloquees,
      jalonsTotal: jalons.length,
      jalonsAtteints,
      jalonsEnRetard,
      risquesTotal: risques.length,
      risquesCritiques,
      avancementGlobal,
      occupation: kpis.tauxOccupation || 0,
      budgetConsomme: kpis.budgetConsomme || 0,
      equipeTaille: kpis.equipeTaille || 0,
    };
  }, [actions, jalons, risques, kpis, today]);

  // Tendances vs semaine précédente
  const trendData = useMemo(() => {
    if (!trends) {
      return {
        avancement: { direction: 'stable' as const, variation: 0 },
        budget: { direction: 'stable' as const, variation: 0 },
        risques: { direction: 'stable' as const, variation: 0 },
        jalons: { direction: 'stable' as const, variation: 0 },
      };
    }

    return {
      avancement: trends.avancementProjet || { direction: 'stable', variation: 0 },
      budget: trends.budget || { direction: 'stable', variation: 0 },
      risques: trends.risques || { direction: 'stable', variation: 0 },
      jalons: trends.jalons || { direction: 'stable', variation: 0 },
    };
  }, [trends]);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (direction: string, isPositive: boolean = true) => {
    if (direction === 'stable') return 'text-gray-500';
    if (direction === 'up') return isPositive ? 'text-success-600' : 'text-error-600';
    return isPositive ? 'text-error-600' : 'text-success-600';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Avancement Global */}
        <Card padding="md" className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-primary-600">Avancement Global</p>
              <p className="text-3xl font-bold text-primary-900 mt-1">
                {metrics.avancementGlobal}%
              </p>
            </div>
            <div className={cn(
              'flex items-center gap-1 text-sm',
              getTrendColor(trendData.avancement.direction)
            )}>
              {(() => {
                const Icon = getTrendIcon(trendData.avancement.direction);
                return <Icon className="h-4 w-4" />;
              })()}
              <span>{trendData.avancement.variation > 0 ? '+' : ''}{trendData.avancement.variation?.toFixed(1) || 0}%</span>
            </div>
          </div>
          <p className="text-xs text-primary-500 mt-2">vs semaine précédente</p>
        </Card>

        {/* Actions terminées */}
        <Card padding="md" className="bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-success-600">Actions terminées</p>
              <p className="text-3xl font-bold text-success-900 mt-1">
                {metrics.actionsTerminees}
                <span className="text-lg text-success-500">/{metrics.actionsTotal}</span>
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-success-400" />
          </div>
          <div className="mt-2 h-2 bg-success-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-success-500 rounded-full"
              style={{ width: `${(metrics.actionsTerminees / Math.max(1, metrics.actionsTotal)) * 100}%` }}
            />
          </div>
        </Card>

        {/* Jalons atteints */}
        <Card padding="md" className="bg-gradient-to-br from-info-50 to-info-100 border-info-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-info-600">Jalons atteints</p>
              <p className="text-3xl font-bold text-info-900 mt-1">
                {metrics.jalonsAtteints}
                <span className="text-lg text-info-500">/{metrics.jalonsTotal}</span>
              </p>
            </div>
            <Target className="h-8 w-8 text-info-400" />
          </div>
          {metrics.jalonsEnRetard > 0 && (
            <Badge variant="error" className="mt-2">
              {metrics.jalonsEnRetard} en retard
            </Badge>
          )}
        </Card>

        {/* Risques critiques */}
        <Card padding="md" className={cn(
          'bg-gradient-to-br border',
          metrics.risquesCritiques > 0
            ? 'from-error-50 to-error-100 border-error-200'
            : 'from-gray-50 to-gray-100 border-gray-200'
        )}>
          <div className="flex items-start justify-between">
            <div>
              <p className={cn(
                'text-xs font-medium',
                metrics.risquesCritiques > 0 ? 'text-error-600' : 'text-gray-600'
              )}>Risques critiques</p>
              <p className={cn(
                'text-3xl font-bold mt-1',
                metrics.risquesCritiques > 0 ? 'text-error-900' : 'text-gray-900'
              )}>
                {metrics.risquesCritiques}
              </p>
            </div>
            <AlertTriangle className={cn(
              'h-8 w-8',
              metrics.risquesCritiques > 0 ? 'text-error-400' : 'text-gray-300'
            )} />
          </div>
          <p className={cn(
            'text-xs mt-2',
            metrics.risquesCritiques > 0 ? 'text-error-500' : 'text-gray-500'
          )}>
            Score ≥ 12
          </p>
        </Card>
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Actions en cours */}
        <div className="p-3 bg-white rounded-lg border flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Target className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{metrics.actionsEnCours}</p>
            <p className="text-xs text-gray-500">Actions en cours</p>
          </div>
        </div>

        {/* Actions en retard */}
        <div className={cn(
          'p-3 rounded-lg border flex items-center gap-3',
          metrics.actionsEnRetard > 0 ? 'bg-error-50 border-error-200' : 'bg-white'
        )}>
          <div className={cn(
            'p-2 rounded-lg',
            metrics.actionsEnRetard > 0 ? 'bg-error-100' : 'bg-gray-100'
          )}>
            <AlertTriangle className={cn(
              'h-5 w-5',
              metrics.actionsEnRetard > 0 ? 'text-error-600' : 'text-gray-400'
            )} />
          </div>
          <div>
            <p className={cn(
              'text-lg font-bold',
              metrics.actionsEnRetard > 0 ? 'text-error-700' : 'text-gray-900'
            )}>{metrics.actionsEnRetard}</p>
            <p className="text-xs text-gray-500">En retard</p>
          </div>
        </div>

        {/* Occupation */}
        <div className="p-3 bg-white rounded-lg border flex items-center gap-3">
          <div className="p-2 bg-success-100 rounded-lg">
            <Users className="h-5 w-5 text-success-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{metrics.occupation}%</p>
            <p className="text-xs text-gray-500">Occupation</p>
          </div>
        </div>

        {/* Budget */}
        <div className="p-3 bg-white rounded-lg border flex items-center gap-3">
          <div className="p-2 bg-warning-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-warning-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{metrics.budgetConsomme}%</p>
            <p className="text-xs text-gray-500">Budget consommé</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyKPIs;
