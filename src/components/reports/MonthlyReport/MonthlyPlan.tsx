/**
 * MonthlyPlan - Plan d'action M+1
 */

import { useMemo } from 'react';
import {
  Calendar,
  Target,
  Flag,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Shield,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useActions, useJalons, useRisques } from '@/hooks';
import { AXES_CONFIG_FULL } from '@/data/constants';
import { Action, Jalon } from '@/types';

const axesList = Object.values(AXES_CONFIG_FULL);

interface MonthlyPlanProps {
  className?: string;
}

export function MonthlyPlan({ className }: MonthlyPlanProps) {
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();

  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const nextMonthStart = formatDate(nextMonth);
  const nextMonthEnd = formatDate(endOfNextMonth);
  const todayStr = formatDate(today);

  const nextMonthName = nextMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Plan d'action M+1
  const plan = useMemo(() => {
    // Actions prévues pour M+1
    const actionsM1 = actions.filter(a => {
      if (a.statut === 'termine') return false;
      return a.date_fin_prevue && a.date_fin_prevue >= nextMonthStart && a.date_fin_prevue <= nextMonthEnd;
    }).sort((a, b) => (a.date_fin_prevue || '').localeCompare(b.date_fin_prevue || ''));

    // Jalons prévus pour M+1
    const jalonsM1 = jalons.filter(j => {
      if (j.statut === 'atteint') return false;
      return j.date_prevue && j.date_prevue >= nextMonthStart && j.date_prevue <= nextMonthEnd;
    }).sort((a, b) => (a.date_prevue || '').localeCompare(b.date_prevue || ''));

    // Actions en retard à rattraper
    const actionsEnRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < todayStr
    ).sort((a, b) => (a.date_fin_prevue || '').localeCompare(b.date_fin_prevue || ''));

    // Risques à traiter
    const risquesATraiter = risques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 8 && r.status !== 'ferme';
    });

    // Priorités par axe
    const prioritesByAxe: Record<string, { actions: Action[]; jalons: Jalon[] }> = {};

    const axeDefinitions = [
      { code: 'axe1_rh', name: 'RH' },
      { code: 'axe2_commercial', name: 'Commercial' },
      { code: 'axe3_technique', name: 'Technique' },
      { code: 'axe4_budget', name: 'Budget' },
      { code: 'axe5_marketing', name: 'Marketing' },
      { code: 'axe6_exploitation', name: 'Exploitation' },
    ];

    axeDefinitions.forEach(axeDef => {
      const axeActions = actionsM1.filter(a =>
        a.axe_id === axeDef.code || a.axe === axeDef.code
      );

      const axeJalons = jalonsM1.filter(j =>
        j.axe_id === axeDef.code || j.axe === axeDef.code
      );

      if (axeActions.length > 0 || axeJalons.length > 0) {
        prioritesByAxe[axeDef.name] = { actions: axeActions, jalons: axeJalons };
      }
    });

    return {
      actionsM1,
      jalonsM1,
      actionsEnRetard,
      risquesATraiter,
      prioritesByAxe,
    };
  }, [actions, jalons, risques, nextMonthStart, nextMonthEnd, todayStr]);

  const getAxeName = (axeId: string | number | undefined): string => {
    if (!axeId) return 'Non assigné';
    const axe = axesList.find(a => a.code === axeId);
    return axe?.label || axe?.labelCourt || String(axeId);
  };

  const getPriorityBadge = (priorite?: string) => {
    switch (priorite) {
      case 'haute':
      case 'high':
        return <Badge variant="error" size="sm">Haute</Badge>;
      case 'moyenne':
      case 'medium':
        return <Badge variant="warning" size="sm">Moyenne</Badge>;
      default:
        return <Badge variant="default" size="sm">Normale</Badge>;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* En-tête */}
      <Card className="bg-primary-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary-100">
              <Calendar className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-900">
                Plan d'Action - {nextMonthName}
              </h2>
              <p className="text-sm text-primary-600">
                Objectifs et priorités du mois à venir
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-primary-700">
                <Target className="h-4 w-4" />
                {plan.actionsM1.length} actions
              </span>
              <span className="flex items-center gap-1 text-primary-700">
                <Flag className="h-4 w-4" />
                {plan.jalonsM1.length} jalons
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Résumé des objectifs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md" className="bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary-600" />
            <div>
              <p className="text-xl font-bold text-primary-700">{plan.actionsM1.length}</p>
              <p className="text-xs text-gray-600">Actions prévues</p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="bg-info-50 border-info-200">
          <div className="flex items-center gap-3">
            <Flag className="h-6 w-6 text-info-600" />
            <div>
              <p className="text-xl font-bold text-info-700">{plan.jalonsM1.length}</p>
              <p className="text-xs text-gray-600">Jalons à atteindre</p>
            </div>
          </div>
        </Card>

        <Card padding="md" className={cn(
          plan.actionsEnRetard.length > 0 ? 'bg-error-50 border-error-200' : 'bg-gray-50 border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn(
              'h-6 w-6',
              plan.actionsEnRetard.length > 0 ? 'text-error-600' : 'text-gray-400'
            )} />
            <div>
              <p className={cn(
                'text-xl font-bold',
                plan.actionsEnRetard.length > 0 ? 'text-error-700' : 'text-gray-500'
              )}>{plan.actionsEnRetard.length}</p>
              <p className="text-xs text-gray-600">À rattraper</p>
            </div>
          </div>
        </Card>

        <Card padding="md" className={cn(
          plan.risquesATraiter.length > 0 ? 'bg-warning-50 border-warning-200' : 'bg-gray-50 border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <Shield className={cn(
              'h-6 w-6',
              plan.risquesATraiter.length > 0 ? 'text-warning-600' : 'text-gray-400'
            )} />
            <div>
              <p className={cn(
                'text-xl font-bold',
                plan.risquesATraiter.length > 0 ? 'text-warning-700' : 'text-gray-500'
              )}>{plan.risquesATraiter.length}</p>
              <p className="text-xs text-gray-600">Risques à traiter</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions en retard à rattraper (priorité haute) */}
      {plan.actionsEnRetard.length > 0 && (
        <Card className="border-error-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-error-600" />
            <h3 className="font-semibold text-error-700">Actions en Retard à Rattraper</h3>
            <Badge variant="error">{plan.actionsEnRetard.length}</Badge>
          </div>

          <div className="space-y-2">
            {plan.actionsEnRetard.slice(0, 5).map(action => (
              <div key={action.id} className="p-3 bg-error-50 rounded-lg border border-error-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{action.titre}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
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
                      <span className="flex items-center gap-1 text-error-600">
                        <Clock className="h-3 w-3" />
                        Prévu: {action.date_fin_prevue && new Date(action.date_fin_prevue).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  {getPriorityBadge(action.priorite)}
                </div>
              </div>
            ))}
            {plan.actionsEnRetard.length > 5 && (
              <p className="text-sm text-error-600 text-center">
                +{plan.actionsEnRetard.length - 5} autres actions en retard
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Jalons du mois */}
      {plan.jalonsM1.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Flag className="h-5 w-5 text-info-600" />
            <h3 className="font-semibold text-gray-900">Jalons à Atteindre</h3>
            <Badge variant="info">{plan.jalonsM1.length}</Badge>
          </div>

          <div className="space-y-2">
            {plan.jalonsM1.map(jalon => (
              <div key={jalon.id} className="p-3 bg-info-50 rounded-lg border border-info-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{jalon.titre || jalon.nom}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
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
                  <Badge variant="info" size="sm">
                    J-{Math.ceil((new Date(jalon.date_prevue!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Priorités par axe */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ArrowRight className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Priorités par Axe</h3>
        </div>

        {Object.keys(plan.prioritesByAxe).length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4">
            Aucune action planifiée pour {nextMonthName}
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(plan.prioritesByAxe).map(([axeName, data]) => (
              <div key={axeName} className="border-l-4 border-primary-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">{axeName}</h4>
                <div className="space-y-1 text-sm">
                  {data.actions.slice(0, 3).map(action => (
                    <div key={action.id} className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-gray-400" />
                        {action.titre}
                      </span>
                      <span className="text-xs text-gray-400">
                        {action.date_fin_prevue && new Date(action.date_fin_prevue).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))}
                  {data.actions.length > 3 && (
                    <p className="text-xs text-gray-400">+{data.actions.length - 3} autres actions</p>
                  )}
                  {data.jalons.map(jalon => (
                    <div key={jalon.id} className="flex items-center justify-between text-info-600">
                      <span className="flex items-center gap-2">
                        <Flag className="h-3 w-3" />
                        {jalon.titre || jalon.nom}
                      </span>
                      <Badge variant="info" size="sm">Jalon</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default MonthlyPlan;
