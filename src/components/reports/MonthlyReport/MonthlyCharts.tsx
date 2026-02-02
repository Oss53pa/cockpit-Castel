/**
 * MonthlyCharts - Graphiques du rapport mensuel
 * Graphiques visuels pour l'évolution et la répartition
 */

import { useMemo } from 'react';
import {
  BarChart2,
  PieChart,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useActions, useJalons, useRisques } from '@/hooks';
import { AXES_CONFIG_FULL } from '@/data/constants';

const axesList = Object.values(AXES_CONFIG_FULL);

interface MonthlyChartsProps {
  className?: string;
}

export function MonthlyCharts({ className }: MonthlyChartsProps) {
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();

  const today = new Date().toISOString().split('T')[0];

  // Répartition des actions par statut
  const actionsByStatus = useMemo(() => {
    const termine = actions.filter(a => a.statut === 'termine').length;
    const enCours = actions.filter(a => a.statut === 'en_cours').length;
    const enRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
    ).length;
    const aPlanifier = actions.filter(a => a.statut === 'a_faire' || a.statut === 'planifie').length;
    const bloque = actions.filter(a => a.statut === 'bloque').length;
    const total = actions.length || 1;

    return [
      { label: 'Terminées', value: termine, percent: Math.round((termine / total) * 100), color: 'bg-success-500' },
      { label: 'En cours', value: enCours, percent: Math.round((enCours / total) * 100), color: 'bg-primary-500' },
      { label: 'En retard', value: enRetard, percent: Math.round((enRetard / total) * 100), color: 'bg-error-500' },
      { label: 'À planifier', value: aPlanifier, percent: Math.round((aPlanifier / total) * 100), color: 'bg-gray-400' },
      { label: 'Bloquées', value: bloque, percent: Math.round((bloque / total) * 100), color: 'bg-warning-500' },
    ];
  }, [actions, today]);

  // Répartition par axe
  const actionsByAxe = useMemo(() => {
    const axeDefinitions = [
      { code: 'axe1_rh', name: 'RH', color: 'bg-blue-500' },
      { code: 'axe2_commercial', name: 'Commercial', color: 'bg-green-500' },
      { code: 'axe3_technique', name: 'Technique', color: 'bg-purple-500' },
      { code: 'axe4_budget', name: 'Budget', color: 'bg-yellow-500' },
      { code: 'axe5_marketing', name: 'Marketing', color: 'bg-pink-500' },
      { code: 'axe6_exploitation', name: 'Exploitation', color: 'bg-orange-500' },
    ];

    const total = actions.length || 1;

    return axeDefinitions.map(axeDef => {
      const count = actions.filter(a =>
        a.axe_id === axeDef.code || a.axe === axeDef.code
      ).length;

      const terminated = actions.filter(a =>
        (a.axe_id === axeDef.code || a.axe === axeDef.code) &&
        a.statut === 'termine'
      ).length;

      return {
        name: axeDef.name,
        code: axeDef.code,
        total: count,
        terminated,
        percent: Math.round((count / total) * 100),
        completion: count > 0 ? Math.round((terminated / count) * 100) : 0,
        color: axeDef.color,
      };
    });
  }, [actions]);

  // Risques par niveau
  const risksByLevel = useMemo(() => {
    const activeRisques = risques.filter(r => r.status !== 'ferme');

    const critique = activeRisques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 12;
    }).length;

    const eleve = activeRisques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 8 && score < 12;
    }).length;

    const modere = activeRisques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 4 && score < 8;
    }).length;

    const faible = activeRisques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score < 4;
    }).length;

    const total = activeRisques.length || 1;

    return [
      { label: 'Critique (≥12)', value: critique, percent: Math.round((critique / total) * 100), color: 'bg-error-500' },
      { label: 'Élevé (8-11)', value: eleve, percent: Math.round((eleve / total) * 100), color: 'bg-orange-500' },
      { label: 'Modéré (4-7)', value: modere, percent: Math.round((modere / total) * 100), color: 'bg-warning-500' },
      { label: 'Faible (<4)', value: faible, percent: Math.round((faible / total) * 100), color: 'bg-success-500' },
    ];
  }, [risques]);

  // Jalons par mois (prochains 3 mois)
  const milestonesByMonth = useMemo(() => {
    const months: { month: string; total: number; atteints: number }[] = [];
    const now = new Date();

    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStart = monthDate.toISOString().split('T')[0];
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const monthEnd = new Date(nextMonth.getTime() - 1).toISOString().split('T')[0];

      const monthJalons = jalons.filter(j =>
        j.date_prevue && j.date_prevue >= monthStart && j.date_prevue <= monthEnd
      );

      months.push({
        month: monthDate.toLocaleDateString('fr-FR', { month: 'short' }),
        total: monthJalons.length,
        atteints: monthJalons.filter(j => j.statut === 'atteint').length,
      });
    }

    return months;
  }, [jalons]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Répartition des actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Par statut */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Actions par Statut</h3>
          </div>

          {/* Barre de progression empilée */}
          <div className="h-8 rounded-lg overflow-hidden flex mb-4">
            {actionsByStatus.filter(s => s.value > 0).map((status, index) => (
              <div
                key={index}
                className={cn(status.color, 'transition-all')}
                style={{ width: `${status.percent}%` }}
                title={`${status.label}: ${status.value} (${status.percent}%)`}
              />
            ))}
          </div>

          {/* Légende */}
          <div className="grid grid-cols-2 gap-2">
            {actionsByStatus.map((status, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className={cn('w-3 h-3 rounded', status.color)} />
                <span className="text-gray-600">{status.label}</span>
                <span className="font-medium text-gray-900">{status.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Par axe */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Actions par Axe</h3>
          </div>

          <div className="space-y-3">
            {actionsByAxe.map((axe, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{axe.name}</span>
                  <span className="text-gray-900 font-medium">
                    {axe.terminated}/{axe.total}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(axe.color, 'h-full rounded-full transition-all')}
                    style={{ width: `${axe.completion}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Risques et Jalons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risques par niveau */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-error-600" />
            <h3 className="font-semibold text-gray-900">Risques par Niveau</h3>
          </div>

          <div className="space-y-3">
            {risksByLevel.map((level, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={cn('w-4 h-4 rounded', level.color)} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{level.label}</span>
                    <span className="text-sm font-medium text-gray-900">{level.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={cn(level.color, 'h-full rounded-full')}
                      style={{ width: `${level.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {risksByLevel.every(l => l.value === 0) && (
            <p className="text-sm text-gray-500 italic text-center py-4">
              Aucun risque actif
            </p>
          )}
        </Card>

        {/* Jalons à venir */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-info-600" />
            <h3 className="font-semibold text-gray-900">Jalons - Prochains Mois</h3>
          </div>

          <div className="flex items-end justify-around h-32">
            {milestonesByMonth.map((month, index) => {
              const maxHeight = Math.max(...milestonesByMonth.map(m => m.total), 1);
              const height = (month.total / maxHeight) * 100;
              const completedHeight = month.total > 0 ? (month.atteints / month.total) * height : 0;

              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="relative h-24 w-12 flex items-end">
                    {/* Barre totale */}
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gray-200 rounded-t transition-all"
                      style={{ height: `${height}%` }}
                    />
                    {/* Barre atteints */}
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-success-500 rounded-t transition-all"
                      style={{ height: `${completedHeight}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-900">{month.total}</p>
                    <p className="text-xs text-gray-500">{month.month}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-success-500" /> Atteints
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-200" /> Prévus
            </span>
          </div>
        </Card>
      </div>

      {/* Vélocité des actions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-success-600" />
          <h3 className="font-semibold text-gray-900">Vélocité par Axe</h3>
          <Badge variant="info" size="sm">Avancement réel / attendu</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {actionsByAxe.map((axe, index) => {
            // Calcul simplifié de la vélocité
            const velocity = axe.completion;
            const velocityStatus = velocity >= 80 ? 'success' : velocity >= 50 ? 'warning' : 'error';

            return (
              <div
                key={index}
                className={cn(
                  'p-3 rounded-lg border text-center',
                  velocityStatus === 'success' && 'bg-success-50 border-success-200',
                  velocityStatus === 'warning' && 'bg-warning-50 border-warning-200',
                  velocityStatus === 'error' && 'bg-error-50 border-error-200'
                )}
              >
                <p className="text-xs text-gray-500 mb-1">{axe.name}</p>
                <p className={cn(
                  'text-xl font-bold',
                  velocityStatus === 'success' && 'text-success-700',
                  velocityStatus === 'warning' && 'text-warning-700',
                  velocityStatus === 'error' && 'text-error-700'
                )}>
                  {velocity}%
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default MonthlyCharts;
