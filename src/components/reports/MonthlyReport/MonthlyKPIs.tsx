/**
 * MonthlyKPIs - KPIs mensuels avec évolution M-1
 */

import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CheckCircle,
  AlertTriangle,
  Flag,
  DollarSign,
  Users,
  Clock,
  Shield,
  Activity,
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

interface MonthlyKPIsProps {
  className?: string;
}

interface KPIData {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: number;
  };
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray';
  status?: 'good' | 'warning' | 'bad';
}

export function MonthlyKPIs({ className }: MonthlyKPIsProps) {
  const { currentSiteId } = useSiteStore();
  const siteId = currentSiteId || 1;

  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();
  const { budget } = useBudget();
  const kpis = useDashboardKPIs();
  const trends = useCOPILTrends(siteId);

  const today = new Date().toISOString().split('T')[0];

  // Calcul des KPIs
  const kpiData = useMemo((): KPIData[] => {
    // Métriques de base
    const actionsTotal = actions.length;
    const actionsTerminees = actions.filter(a => a.statut === 'termine').length;
    const actionsEnCours = actions.filter(a => a.statut === 'en_cours').length;
    const actionsEnRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
    ).length;

    const jalonsTotal = jalons.length;
    const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
    const jalonsEnRetard = jalons.filter(j =>
      j.statut !== 'atteint' && j.date_prevue && j.date_prevue < today
    ).length;

    const risquesOuverts = risques.filter(r => r.status !== 'ferme').length;
    const risquesCritiques = risques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 12 && r.status !== 'ferme';
    }).length;

    const avancementGlobal = actionsTotal > 0
      ? Math.round(actions.reduce((sum, a) => sum + (a.avancement || 0), 0) / actionsTotal)
      : 0;

    const tauxCompletion = actionsTotal > 0
      ? Math.round((actionsTerminees / actionsTotal) * 100)
      : 0;

    const tauxJalons = jalonsTotal > 0
      ? Math.round((jalonsAtteints / jalonsTotal) * 100)
      : 0;

    const budgetConsomme = budget?.consomme || kpis.budgetConsomme || 0;

    return [
      {
        label: 'Avancement Global',
        value: `${avancementGlobal}%`,
        trend: trends?.avancementProjet ? {
          direction: trends.avancementProjet.direction as 'up' | 'down' | 'stable',
          value: trends.avancementProjet.variation || 0,
        } : undefined,
        icon: Activity,
        color: avancementGlobal >= 70 ? 'success' : avancementGlobal >= 40 ? 'warning' : 'error',
        status: avancementGlobal >= 70 ? 'good' : avancementGlobal >= 40 ? 'warning' : 'bad',
      },
      {
        label: 'Taux de Complétion',
        value: `${tauxCompletion}%`,
        subValue: `${actionsTerminees}/${actionsTotal} actions`,
        icon: CheckCircle,
        color: tauxCompletion >= 60 ? 'success' : tauxCompletion >= 30 ? 'warning' : 'error',
        status: tauxCompletion >= 60 ? 'good' : tauxCompletion >= 30 ? 'warning' : 'bad',
      },
      {
        label: 'Actions en Cours',
        value: actionsEnCours,
        subValue: actionsEnRetard > 0 ? `${actionsEnRetard} en retard` : 'À jour',
        icon: Target,
        color: actionsEnRetard === 0 ? 'primary' : actionsEnRetard <= 3 ? 'warning' : 'error',
        status: actionsEnRetard === 0 ? 'good' : actionsEnRetard <= 3 ? 'warning' : 'bad',
      },
      {
        label: 'Jalons Atteints',
        value: `${tauxJalons}%`,
        subValue: `${jalonsAtteints}/${jalonsTotal} jalons`,
        trend: trends?.jalons ? {
          direction: trends.jalons.direction as 'up' | 'down' | 'stable',
          value: trends.jalons.variation || 0,
        } : undefined,
        icon: Flag,
        color: jalonsEnRetard === 0 ? 'success' : jalonsEnRetard <= 2 ? 'warning' : 'error',
        status: jalonsEnRetard === 0 ? 'good' : jalonsEnRetard <= 2 ? 'warning' : 'bad',
      },
      {
        label: 'Risques Actifs',
        value: risquesOuverts,
        subValue: risquesCritiques > 0 ? `${risquesCritiques} critiques` : 'Aucun critique',
        trend: trends?.risques ? {
          direction: trends.risques.direction as 'up' | 'down' | 'stable',
          value: trends.risques.variation || 0,
        } : undefined,
        icon: Shield,
        color: risquesCritiques === 0 ? 'success' : risquesCritiques <= 2 ? 'warning' : 'error',
        status: risquesCritiques === 0 ? 'good' : risquesCritiques <= 2 ? 'warning' : 'bad',
      },
      {
        label: 'Budget Consommé',
        value: `${budgetConsomme}%`,
        trend: trends?.budget ? {
          direction: trends.budget.direction as 'up' | 'down' | 'stable',
          value: trends.budget.variation || 0,
        } : undefined,
        icon: DollarSign,
        color: budgetConsomme <= 80 ? 'success' : budgetConsomme <= 100 ? 'warning' : 'error',
        status: budgetConsomme <= 80 ? 'good' : budgetConsomme <= 100 ? 'warning' : 'bad',
      },
      {
        label: 'Actions en Retard',
        value: actionsEnRetard,
        subValue: actionsEnRetard > 0 ? 'À traiter' : 'Aucune',
        icon: Clock,
        color: actionsEnRetard === 0 ? 'success' : actionsEnRetard <= 3 ? 'warning' : 'error',
        status: actionsEnRetard === 0 ? 'good' : actionsEnRetard <= 3 ? 'warning' : 'bad',
      },
      {
        label: 'Jalons en Retard',
        value: jalonsEnRetard,
        subValue: jalonsEnRetard > 0 ? 'À rattraper' : 'Aucun',
        icon: AlertTriangle,
        color: jalonsEnRetard === 0 ? 'success' : jalonsEnRetard <= 2 ? 'warning' : 'error',
        status: jalonsEnRetard === 0 ? 'good' : jalonsEnRetard <= 2 ? 'warning' : 'bad',
      },
    ];
  }, [actions, jalons, risques, budget, kpis, trends, today]);

  const getColorClasses = (color: KPIData['color']) => {
    switch (color) {
      case 'success':
        return { bg: 'bg-success-50', border: 'border-success-200', icon: 'text-success-600', text: 'text-success-700' };
      case 'warning':
        return { bg: 'bg-warning-50', border: 'border-warning-200', icon: 'text-warning-600', text: 'text-warning-700' };
      case 'error':
        return { bg: 'bg-error-50', border: 'border-error-200', icon: 'text-error-600', text: 'text-error-700' };
      case 'info':
        return { bg: 'bg-info-50', border: 'border-info-200', icon: 'text-info-600', text: 'text-info-700' };
      case 'primary':
        return { bg: 'bg-primary-50', border: 'border-primary-200', icon: 'text-primary-600', text: 'text-primary-700' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-600', text: 'text-gray-700' };
    }
  };

  const getTrendIcon = (direction?: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (direction?: 'up' | 'down' | 'stable', isPositive = true) => {
    if (!direction || direction === 'stable') return 'text-gray-500';
    if (direction === 'up') return isPositive ? 'text-success-600' : 'text-error-600';
    return isPositive ? 'text-error-600' : 'text-success-600';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grille des KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const TrendIcon = getTrendIcon(kpi.trend?.direction);
          const colors = getColorClasses(kpi.color);

          return (
            <Card
              key={index}
              padding="md"
              className={cn(colors.bg, colors.border)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('p-1.5 rounded-lg', colors.bg)}>
                      <Icon className={cn('h-4 w-4', colors.icon)} />
                    </div>
                    <p className="text-xs font-medium text-gray-600">{kpi.label}</p>
                  </div>
                  <p className={cn('text-2xl font-bold', colors.text)}>
                    {kpi.value}
                  </p>
                  {kpi.subValue && (
                    <p className="text-xs text-gray-500 mt-1">{kpi.subValue}</p>
                  )}
                </div>

                {kpi.trend && (
                  <div className={cn(
                    'flex items-center gap-1 text-xs',
                    getTrendColor(kpi.trend.direction, kpi.label !== 'Actions en Retard' && kpi.label !== 'Jalons en Retard' && kpi.label !== 'Risques Actifs')
                  )}>
                    <TrendIcon className="h-3 w-3" />
                    <span>
                      {kpi.trend.value > 0 ? '+' : ''}
                      {kpi.trend.value.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-success-500" /> Bon
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-warning-500" /> Vigilance
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-error-500" /> Critique
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> vs M-1
        </span>
      </div>
    </div>
  );
}

export default MonthlyKPIs;
