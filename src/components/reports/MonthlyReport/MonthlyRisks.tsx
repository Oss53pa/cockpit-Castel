/**
 * MonthlyRisks - Analyse des risques du mois
 */

import { useMemo } from 'react';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Target,
  User,
  Calendar,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useRisques, useCOPILTrends } from '@/hooks';
import { useSiteStore } from '@/stores/siteStore';
import { AXES_CONFIG_FULL } from '@/data/constants';

const axesList = Object.values(AXES_CONFIG_FULL);
import { Risque } from '@/types';

interface MonthlyRisksProps {
  className?: string;
}

export function MonthlyRisks({ className }: MonthlyRisksProps) {
  const { currentSiteId } = useSiteStore();
  const siteId = currentSiteId || 1;

  const risques = useRisques();
  const trends = useCOPILTrends(siteId);

  // Analyse des risques
  const riskAnalysis = useMemo(() => {
    const activeRisques = risques.filter(r => r.status !== 'ferme');

    // Catégorisation par score
    const critiques = activeRisques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 12;
    });

    const eleves = activeRisques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 8 && score < 12;
    });

    const moderes = activeRisques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 4 && score < 8;
    });

    const faibles = activeRisques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score < 4;
    });

    // Risques fermés ce mois
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthStart = thisMonth.toISOString().split('T')[0];

    const fermesCeMois = risques.filter(r => {
      if (r.status !== 'ferme') return false;
      const closedDate = r.updatedAt?.split('T')[0] || r.date_derniere_evaluation;
      return closedDate && closedDate >= monthStart;
    });

    // Score moyen
    const avgScore = activeRisques.length > 0
      ? activeRisques.reduce((sum, r) => sum + (r.score || (r.probabilite || 0) * (r.impact || 0)), 0) / activeRisques.length
      : 0;

    return {
      total: activeRisques.length,
      critiques,
      eleves,
      moderes,
      faibles,
      fermesCeMois,
      avgScore: Math.round(avgScore * 10) / 10,
      trend: trends?.risques,
    };
  }, [risques, trends]);

  const getAxeName = (axeId: string | number | undefined): string => {
    if (!axeId) return 'Non assigné';
    const axe = axesList.find(a => a.code === axeId);
    return axe?.label || axe?.labelCourt || String(axeId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 12) return { bg: 'bg-error-100', text: 'text-error-700', badge: 'error' as const };
    if (score >= 8) return { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'warning' as const };
    if (score >= 4) return { bg: 'bg-warning-100', text: 'text-warning-700', badge: 'warning' as const };
    return { bg: 'bg-success-100', text: 'text-success-700', badge: 'success' as const };
  };

  const RiskCard = ({ risque }: { risque: Risque }) => {
    const score = risque.score || (risque.probabilite || 0) * (risque.impact || 0);
    const colors = getScoreColor(score);

    return (
      <div className={cn(
        'p-4 rounded-lg border',
        colors.bg,
        score >= 12 ? 'border-error-200' : score >= 8 ? 'border-orange-200' : 'border-warning-200'
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={colors.badge} size="sm">Score: {score}</Badge>
              <span className="text-xs text-gray-500">
                P{risque.probabilite || '-'} × I{risque.impact || '-'}
              </span>
            </div>
            <p className="font-medium text-gray-900 mb-1">{risque.titre || 'Risque sans titre'}</p>
            {risque.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{risque.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {getAxeName(risque.axe_id)}
              </span>
              {risque.proprietaire && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {risque.proprietaire}
                </span>
              )}
            </div>
          </div>
        </div>

        {risque.plan_mitigation && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-1">Plan d'atténuation:</p>
            <p className="text-sm text-gray-700">{risque.plan_mitigation}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total actifs */}
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Shield className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{riskAnalysis.total}</p>
              <p className="text-xs text-gray-500">Risques actifs</p>
            </div>
          </div>
        </Card>

        {/* Critiques */}
        <Card padding="md" className={riskAnalysis.critiques.length > 0 ? 'border-error-200 bg-error-50' : ''}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              riskAnalysis.critiques.length > 0 ? 'bg-error-100' : 'bg-gray-100'
            )}>
              <AlertTriangle className={cn(
                'h-5 w-5',
                riskAnalysis.critiques.length > 0 ? 'text-error-600' : 'text-gray-400'
              )} />
            </div>
            <div>
              <p className={cn(
                'text-2xl font-bold',
                riskAnalysis.critiques.length > 0 ? 'text-error-700' : 'text-gray-500'
              )}>{riskAnalysis.critiques.length}</p>
              <p className="text-xs text-gray-500">Critiques (≥12)</p>
            </div>
          </div>
        </Card>

        {/* Score moyen */}
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100">
              <Target className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{riskAnalysis.avgScore}</p>
              <p className="text-xs text-gray-500">Score moyen</p>
            </div>
          </div>
          {riskAnalysis.trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs',
              riskAnalysis.trend.direction === 'up' ? 'text-error-600' :
              riskAnalysis.trend.direction === 'down' ? 'text-success-600' : 'text-gray-500'
            )}>
              {riskAnalysis.trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : riskAnalysis.trend.direction === 'down' ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              <span>vs M-1</span>
            </div>
          )}
        </Card>

        {/* Fermés ce mois */}
        <Card padding="md" className="border-success-200 bg-success-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-100">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success-700">{riskAnalysis.fermesCeMois.length}</p>
              <p className="text-xs text-gray-500">Fermés ce mois</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Matrice de répartition */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Répartition par Niveau de Risque</h3>

        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-center">
            <p className="text-2xl font-bold text-error-700">{riskAnalysis.critiques.length}</p>
            <p className="text-xs text-error-600">Critique</p>
            <p className="text-xs text-gray-500">(Score ≥12)</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-center">
            <p className="text-2xl font-bold text-orange-700">{riskAnalysis.eleves.length}</p>
            <p className="text-xs text-orange-600">Élevé</p>
            <p className="text-xs text-gray-500">(Score 8-11)</p>
          </div>
          <div className="p-3 rounded-lg bg-warning-50 border border-warning-200 text-center">
            <p className="text-2xl font-bold text-warning-700">{riskAnalysis.moderes.length}</p>
            <p className="text-xs text-warning-600">Modéré</p>
            <p className="text-xs text-gray-500">(Score 4-7)</p>
          </div>
          <div className="p-3 rounded-lg bg-success-50 border border-success-200 text-center">
            <p className="text-2xl font-bold text-success-700">{riskAnalysis.faibles.length}</p>
            <p className="text-xs text-success-600">Faible</p>
            <p className="text-xs text-gray-500">(Score &lt;4)</p>
          </div>
        </div>
      </Card>

      {/* Risques critiques */}
      {riskAnalysis.critiques.length > 0 && (
        <Card className="border-error-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-error-600" />
            <h3 className="font-semibold text-error-700">Risques Critiques</h3>
            <Badge variant="error">{riskAnalysis.critiques.length}</Badge>
          </div>

          <div className="space-y-3">
            {riskAnalysis.critiques.map(risque => (
              <RiskCard key={risque.id} risque={risque} />
            ))}
          </div>
        </Card>
      )}

      {/* Risques élevés */}
      {riskAnalysis.eleves.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Risques Élevés</h3>
            <Badge variant="warning">{riskAnalysis.eleves.length}</Badge>
          </div>

          <div className="space-y-3">
            {riskAnalysis.eleves.slice(0, 5).map(risque => (
              <RiskCard key={risque.id} risque={risque} />
            ))}
            {riskAnalysis.eleves.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                +{riskAnalysis.eleves.length - 5} autres risques élevés
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Pas de risques critiques */}
      {riskAnalysis.critiques.length === 0 && riskAnalysis.eleves.length === 0 && (
        <Card className="border-success-200 bg-success-50">
          <div className="flex items-center gap-3 justify-center py-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
            <div>
              <p className="font-semibold text-success-700">Aucun risque critique ou élevé</p>
              <p className="text-sm text-success-600">
                Tous les risques actifs sont à un niveau modéré ou faible.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default MonthlyRisks;
