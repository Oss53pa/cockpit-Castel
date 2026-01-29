// ============================================================================
// TABLEAU DE BORD COPIL - Comité de Pilotage
// Version améliorée avec tendances, faits marquants et exports
// ============================================================================

import { useMemo, useCallback } from 'react';
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  AlertTriangle,
  Flag,
  Wallet,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  Calendar,
  FileText,
  Presentation,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  User,
} from 'lucide-react';
import { Card, Badge, Progress, Button } from '@/components/ui';
import {
  useDashboardKPIs,
  useAvancementGlobal,
  useJalons,
  useRisques,
  useAlertes,
  useBudgetSynthese,
  useActions,
  useSync,
  useCOPILTrends,
} from '@/hooks';
import type { TrendDirection } from '@/hooks/useDashboard';
import { formatCurrency, cn } from '@/lib/utils';
import { AXE_LABELS, RISQUE_CATEGORY_LABELS } from '@/types';
import type { FaitMarquant } from '@/types/deepDive';
import { exportCOPILToPDF, exportCOPILToPPTX } from './copilExport';

// ============================================================================
// TYPES
// ============================================================================

interface MeteoItem {
  label: string;
  status: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  progress: number;
  trend?: TrendDirection;
  trendValue?: number;
}

interface DecisionItem {
  id: string;
  sujet: string;
  contexte: string;
  options: string[];
  urgence: 'haute' | 'moyenne' | 'basse';
  responsable: string;
  deadline?: string;
  sourceType?: 'action' | 'risque' | 'jalon';
  sourceId?: string | number;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

// Trend indicator arrow
function TrendIndicator({
  direction,
  value,
  inverse = false,
  size = 'sm',
}: {
  direction: TrendDirection;
  value?: number;
  inverse?: boolean; // For metrics where "down" is good (like risks)
  size?: 'sm' | 'md';
}) {
  const sizeClasses = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  // Determine if this change is positive or negative
  const isPositive = inverse ? direction === 'down' : direction === 'up';
  const isNegative = inverse ? direction === 'up' : direction === 'down';

  const colorClass = isPositive
    ? 'text-success-600'
    : isNegative
    ? 'text-error-600'
    : 'text-primary-400';

  const Icon =
    direction === 'up'
      ? ArrowUpRight
      : direction === 'down'
      ? ArrowDownRight
      : ArrowRight;

  return (
    <div className={cn('flex items-center gap-0.5', colorClass)}>
      <Icon className={sizeClasses} />
      {value !== undefined && Math.abs(value) > 0.1 && (
        <span className={cn('font-medium', textSize)}>
          {value > 0 ? '+' : ''}
          {value.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

// Météo icon component
function MeteoIcon({
  status,
  className,
}: {
  status: MeteoItem['status'];
  className?: string;
}) {
  const icons = {
    sunny: Sun,
    cloudy: CloudSun,
    rainy: Cloud,
    stormy: CloudRain,
  };
  const Icon = icons[status];
  const colors = {
    sunny: 'text-success-500',
    cloudy: 'text-warning-500',
    rainy: 'text-orange-500',
    stormy: 'text-error-500',
  };
  return <Icon className={cn(colors[status], className)} />;
}

// Météo badge
function MeteoBadge({ status }: { status: MeteoItem['status'] }) {
  const config = {
    sunny: { label: 'Favorable', className: 'bg-success-100 text-success-700' },
    cloudy: { label: 'Attention', className: 'bg-warning-100 text-warning-700' },
    rainy: { label: 'Vigilance', className: 'bg-orange-100 text-orange-700' },
    stormy: { label: 'Critique', className: 'bg-error-100 text-error-700' },
  };
  return <Badge className={config[status].className}>{config[status].label}</Badge>;
}

// ============================================================================
// SECTION: MÉTÉO PROJET (avec tendances)
// ============================================================================

function MeteoProjetSection() {
  const avancementGlobal = useAvancementGlobal();
  const syncData = useSync(1, 'cosmos-angre');
  const budgetSynthese = useBudgetSynthese();
  const risques = useRisques();
  const jalons = useJalons();
  const trends = useCOPILTrends(1);

  const criticalRisks = risques.filter(
    (r) => r.score >= 12 && r.status !== 'closed'
  ).length;
  const jalonsEnDanger = jalons.filter(
    (j) => j.statut === 'en_danger' || j.statut === 'depasse'
  ).length;

  const getMeteoStatus = (
    progress: number,
    hasIssues: boolean
  ): MeteoItem['status'] => {
    if (hasIssues) return 'stormy';
    if (progress >= 80) return 'sunny';
    if (progress >= 50) return 'cloudy';
    if (progress >= 25) return 'rainy';
    return 'stormy';
  };

  const globalMeteo = useMemo((): MeteoItem['status'] => {
    if (criticalRisks > 2 || jalonsEnDanger > 3) return 'stormy';
    if (criticalRisks > 0 || jalonsEnDanger > 1) return 'rainy';
    if (avancementGlobal >= 70) return 'sunny';
    if (avancementGlobal >= 40) return 'cloudy';
    return 'rainy';
  }, [avancementGlobal, criticalRisks, jalonsEnDanger]);

  const meteoAxes: MeteoItem[] = [
    {
      label: 'Avancement Projet',
      status: getMeteoStatus(syncData.syncStatus?.projectProgress || 0, false),
      progress: syncData.syncStatus?.projectProgress || 0,
      trend: trends?.avancementProjet.direction,
      trendValue: trends?.avancementProjet.variation,
    },
    {
      label: 'Avancement Mobilisation',
      status: getMeteoStatus(
        syncData.syncStatus?.mobilizationProgress || 0,
        false
      ),
      progress: syncData.syncStatus?.mobilizationProgress || 0,
      trend: trends?.avancementMobilisation.direction,
      trendValue: trends?.avancementMobilisation.variation,
    },
    {
      label: 'Budget',
      status:
        budgetSynthese.tauxRealisation > 100
          ? 'stormy'
          : budgetSynthese.tauxRealisation > 90
          ? 'rainy'
          : 'sunny',
      progress: Math.min(budgetSynthese.tauxRealisation, 100),
      trend: trends?.budget.direction,
      trendValue: trends?.budget.variation,
    },
    {
      label: 'Risques',
      status: criticalRisks > 2 ? 'stormy' : criticalRisks > 0 ? 'rainy' : 'sunny',
      progress: 100 - criticalRisks * 20,
      trend: trends?.risques.direction,
      trendValue: trends?.risques.variation,
    },
    {
      label: 'Jalons',
      status: jalonsEnDanger > 2 ? 'stormy' : jalonsEnDanger > 0 ? 'rainy' : 'sunny',
      progress:
        jalons.length > 0
          ? (jalons.filter((j) => j.statut === 'atteint').length / jalons.length) * 100
          : 0,
      trend: trends?.jalons.direction,
      trendValue: trends?.jalons.variation,
    },
  ];

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <Sun className="h-5 w-5 text-warning-500" />
          Météo Projet
        </h3>
        <div className="flex items-center gap-2">
          <MeteoIcon status={globalMeteo} className="h-8 w-8" />
          <MeteoBadge status={globalMeteo} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {meteoAxes.map((item) => (
          <div key={item.label} className="bg-primary-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-primary-700">
                {item.label}
              </span>
              <div className="flex items-center gap-1">
                {item.trend && (
                  <TrendIndicator
                    direction={item.trend}
                    value={item.trendValue}
                    inverse={item.label === 'Risques'}
                  />
                )}
                <MeteoIcon status={item.status} className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={item.progress} className="flex-1 h-2" />
              <span className="text-sm font-bold text-primary-900">
                {Math.round(item.progress)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// SECTION: FAITS MARQUANTS
// ============================================================================

function FaitsMarquantsCOPILSection() {
  const jalons = useJalons();
  const risques = useRisques();
  const actions = useActions();
  const budgetSynthese = useBudgetSynthese();

  // Generate faits marquants automatically
  const faitsMarquants = useMemo(() => {
    const realisations: FaitMarquant[] = [];
    const attentions: FaitMarquant[] = [];
    const alertes: FaitMarquant[] = [];

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // REALISATIONS: Jalons atteints ce mois
    const jalonsAtteintsCeMois = jalons.filter((j) => {
      if (j.statut !== 'atteint' || !j.date_reelle) return false;
      const dateReelle = new Date(j.date_reelle);
      return dateReelle >= oneMonthAgo;
    });
    jalonsAtteintsCeMois.slice(0, 3).forEach((j) => {
      realisations.push({
        id: `jalon-${j.id}`,
        type: 'realisation',
        titre: j.titre,
        description: `Jalon atteint le ${new Date(j.date_reelle!).toLocaleDateString('fr-FR')}`,
        axe: j.axe as FaitMarquant['axe'],
        date: j.date_reelle,
        impact: 'positif',
      });
    });

    // REALISATIONS: Actions importantes terminées
    const actionsTerminees = actions.filter((a) => {
      if (a.statut !== 'termine') return false;
      const dateModif = a.updated_at ? new Date(a.updated_at) : null;
      return dateModif && dateModif >= oneMonthAgo;
    });
    actionsTerminees.slice(0, 2).forEach((a) => {
      realisations.push({
        id: `action-${a.id}`,
        type: 'realisation',
        titre: a.titre,
        description: 'Action terminée avec succès',
        axe: a.axe?.replace('axe1_', '').replace('axe2_', '').replace('axe3_', '').replace('axe4_', '').replace('axe5_', '').replace('axe6_', '') as FaitMarquant['axe'],
        impact: 'positif',
      });
    });

    // ATTENTIONS: Risques nouveaux avec score >= 8
    const risquesAttention = risques.filter((r) => {
      const score = r.score;
      return score >= 8 && score < 12 && r.status !== 'closed';
    });
    risquesAttention.slice(0, 3).forEach((r) => {
      attentions.push({
        id: `risque-${r.id}`,
        type: 'attention',
        titre: r.titre,
        description: `Score: ${r.score} (P:${r.probabilite_actuelle} x I:${r.impact_actuel})`,
        impact: 'negatif',
      });
    });

    // ATTENTIONS: Jalons en approche (J-7)
    const jalonsEnApproche = jalons.filter((j) => {
      if (!j.date_prevue || j.statut === 'atteint') return false;
      const datePrevue = new Date(j.date_prevue);
      const daysRemaining = Math.ceil(
        (datePrevue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysRemaining > 0 && daysRemaining <= 7;
    });
    jalonsEnApproche.slice(0, 2).forEach((j) => {
      const daysRemaining = Math.ceil(
        (new Date(j.date_prevue!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      attentions.push({
        id: `jalon-proche-${j.id}`,
        type: 'attention',
        titre: j.titre,
        description: `Échéance dans ${daysRemaining} jour(s)`,
        axe: j.axe as FaitMarquant['axe'],
        date: j.date_prevue,
        impact: 'neutre',
      });
    });

    // ALERTES: Risques critiques (score >= 12)
    const risquesCritiques = risques.filter(
      (r) => r.score >= 12 && r.status !== 'closed'
    );
    risquesCritiques.slice(0, 2).forEach((r) => {
      alertes.push({
        id: `risque-critique-${r.id}`,
        type: 'alerte',
        titre: r.titre,
        description: `Score critique: ${r.score}`,
        impact: 'negatif',
      });
    });

    // ALERTES: Jalons dépassés
    const jalonsDepasses = jalons.filter((j) => j.statut === 'depasse');
    jalonsDepasses.slice(0, 2).forEach((j) => {
      alertes.push({
        id: `jalon-depasse-${j.id}`,
        type: 'alerte',
        titre: j.titre,
        description: `Date prévue dépassée: ${j.date_prevue ? new Date(j.date_prevue).toLocaleDateString('fr-FR') : 'N/A'}`,
        axe: j.axe as FaitMarquant['axe'],
        impact: 'negatif',
      });
    });

    // ALERTES: Budget > 100%
    if (budgetSynthese.tauxRealisation > 100) {
      alertes.push({
        id: 'budget-depassement',
        type: 'alerte',
        titre: 'Dépassement budgétaire',
        description: `Taux de réalisation: ${Math.round(budgetSynthese.tauxRealisation)}%`,
        impact: 'negatif',
      });
    }

    return { realisations, attentions, alertes };
  }, [jalons, risques, actions, budgetSynthese]);

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Faits Marquants
        </h3>
        <Badge variant="secondary">
          {faitsMarquants.realisations.length +
            faitsMarquants.attentions.length +
            faitsMarquants.alertes.length}{' '}
          éléments
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Réalisations */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-success-500">
            <CheckCircle2 className="h-4 w-4 text-success-500" />
            <span className="font-semibold text-success-700 text-sm">
              Réalisations
            </span>
            <Badge className="ml-auto bg-success-100 text-success-700 text-xs">
              {faitsMarquants.realisations.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {faitsMarquants.realisations.length === 0 ? (
              <p className="text-xs text-primary-400 italic text-center py-2">
                Aucune réalisation ce mois
              </p>
            ) : (
              faitsMarquants.realisations.map((fait) => (
                <div
                  key={fait.id}
                  className="p-2 bg-success-50 rounded border-l-2 border-success-500"
                >
                  <p className="text-sm font-medium text-primary-900 truncate">
                    {fait.titre}
                  </p>
                  <p className="text-xs text-primary-500 truncate">
                    {fait.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Points d'attention */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-warning-500">
            <AlertTriangle className="h-4 w-4 text-warning-500" />
            <span className="font-semibold text-warning-700 text-sm">
              Points d'attention
            </span>
            <Badge className="ml-auto bg-warning-100 text-warning-700 text-xs">
              {faitsMarquants.attentions.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {faitsMarquants.attentions.length === 0 ? (
              <p className="text-xs text-primary-400 italic text-center py-2">
                Aucun point d'attention
              </p>
            ) : (
              faitsMarquants.attentions.map((fait) => (
                <div
                  key={fait.id}
                  className="p-2 bg-warning-50 rounded border-l-2 border-warning-500"
                >
                  <p className="text-sm font-medium text-primary-900 truncate">
                    {fait.titre}
                  </p>
                  <p className="text-xs text-primary-500 truncate">
                    {fait.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertes */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-error-500">
            <AlertCircle className="h-4 w-4 text-error-500" />
            <span className="font-semibold text-error-700 text-sm">Alertes</span>
            <Badge className="ml-auto bg-error-100 text-error-700 text-xs">
              {faitsMarquants.alertes.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {faitsMarquants.alertes.length === 0 ? (
              <p className="text-xs text-primary-400 italic text-center py-2">
                Aucune alerte critique
              </p>
            ) : (
              faitsMarquants.alertes.map((fait) => (
                <div
                  key={fait.id}
                  className="p-2 bg-error-50 rounded border-l-2 border-error-500"
                >
                  <p className="text-sm font-medium text-primary-900 truncate">
                    {fait.titre}
                  </p>
                  <p className="text-xs text-primary-500 truncate">
                    {fait.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// SECTION: TOP 5 RISQUES (améliorée avec tendances)
// ============================================================================

function Top5RisquesSection() {
  const risques = useRisques();

  const top5 = useMemo(() => {
    return risques
      .filter((r) => r.status !== 'closed')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((r) => ({
        ...r,
        // Calculate trend from initial vs current score
        scoreTrend:
          r.score_initial !== undefined && r.score_initial > 0
            ? r.score > r.score_initial
              ? ('up' as const)
              : r.score < r.score_initial
              ? ('down' as const)
              : ('stable' as const)
            : ('stable' as const),
        isNew:
          r.created_at &&
          new Date(r.created_at).getTime() >
            Date.now() - 7 * 24 * 60 * 60 * 1000,
      }));
  }, [risques]);

  const getScoreColor = (score: number) => {
    if (score >= 12) return 'bg-error-500';
    if (score >= 8) return 'bg-warning-500';
    if (score >= 4) return 'bg-info-500';
    return 'bg-success-500';
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-error-500" />
          Top 5 Risques Actifs
        </h3>
        <Badge variant="error">
          {risques.filter((r) => r.status !== 'closed').length} actifs
        </Badge>
      </div>

      <div className="space-y-3">
        {top5.length === 0 ? (
          <p className="text-sm text-primary-500 text-center py-4">
            Aucun risque actif
          </p>
        ) : (
          top5.map((risque, index) => (
            <div
              key={risque.id}
              className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold relative',
                  getScoreColor(risque.score)
                )}
              >
                {risque.score}
                {risque.scoreTrend !== 'stable' && (
                  <div className="absolute -top-1 -right-1">
                    {risque.scoreTrend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-error-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-success-600" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary-500">#{index + 1}</span>
                  <Badge variant="secondary" className="text-xs">
                    {RISQUE_CATEGORY_LABELS[risque.categorie] || risque.categorie}
                  </Badge>
                  {risque.isNew && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      Nouveau
                    </Badge>
                  )}
                </div>
                <p className="font-medium text-primary-900 truncate">
                  {risque.titre}
                </p>
                <p className="text-xs text-primary-500">
                  P:{risque.probabilite_actuelle} × I:{risque.impact_actuel} •{' '}
                  {risque.proprietaire || 'Non assigné'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// SECTION: JALONS J-30 (améliorée avec responsables et axes)
// ============================================================================

function JalonsJ30Section() {
  const jalons = useJalons();

  const jalonsJ30 = useMemo(() => {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return jalons
      .filter((j) => {
        if (!j.date_prevue || j.statut === 'atteint') return false;
        const date = new Date(j.date_prevue);
        return date >= now && date <= in30Days;
      })
      .sort(
        (a, b) =>
          new Date(a.date_prevue!).getTime() - new Date(b.date_prevue!).getTime()
      )
      .slice(0, 6);
  }, [jalons]);

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return <Clock className="h-4 w-4 text-info-500" />;
      case 'en_danger':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'depasse':
        return <XCircle className="h-4 w-4 text-error-500" />;
      default:
        return <Target className="h-4 w-4 text-primary-500" />;
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  const getAxeColor = (axe: string) => {
    const colors: Record<string, string> = {
      axe1_rh: 'bg-red-100 text-red-700',
      axe2_commercial: 'bg-blue-100 text-blue-700',
      axe3_technique: 'bg-purple-100 text-purple-700',
      axe4_budget: 'bg-amber-100 text-amber-700',
      axe5_marketing: 'bg-pink-100 text-pink-700',
      axe6_exploitation: 'bg-green-100 text-green-700',
    };
    return colors[axe] || 'bg-primary-100 text-primary-700';
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <Flag className="h-5 w-5 text-info-500" />
          Jalons J-30
        </h3>
        <Badge variant="info">{jalonsJ30.length} à venir</Badge>
      </div>

      <div className="space-y-2">
        {jalonsJ30.length === 0 ? (
          <p className="text-sm text-primary-500 text-center py-4">
            Aucun jalon dans les 30 prochains jours
          </p>
        ) : (
          jalonsJ30.map((jalon) => {
            const days = getDaysRemaining(jalon.date_prevue!);
            return (
              <div
                key={jalon.id}
                className="flex items-center gap-3 p-2 bg-primary-50 rounded-lg"
              >
                {getStatusIcon(jalon.statut)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-primary-900 text-sm truncate">
                      {jalon.titre}
                    </p>
                    <Badge className={cn('text-xs', getAxeColor(jalon.axe))}>
                      {AXE_LABELS[jalon.axe]?.split(' ')[0] || jalon.axe}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-primary-500">
                    {jalon.responsable && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {jalon.responsable}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-sm font-bold',
                      days <= 7
                        ? 'text-error-600'
                        : days <= 14
                        ? 'text-warning-600'
                        : 'text-primary-600'
                    )}
                  >
                    J-{days}
                  </p>
                  <p className="text-xs text-primary-500">
                    {new Date(jalon.date_prevue!).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// SECTION: BUDGET (améliorée avec forecast)
// ============================================================================

function BudgetCOPILSection() {
  const budgetSynthese = useBudgetSynthese();
  const trends = useCOPILTrends(1);

  const budgetData = [
    { label: 'Budget prévu', value: budgetSynthese.prevu, color: 'bg-primary-500' },
    { label: 'Budget engagé', value: budgetSynthese.engage, color: 'bg-info-500' },
    { label: 'Budget réalisé', value: budgetSynthese.realise, color: 'bg-success-500' },
  ];

  const ecart = budgetSynthese.prevu - budgetSynthese.realise;
  const isOverBudget = ecart < 0;

  // Calculate simple forecast (linear projection)
  const avancementProjet = trends?.avancementProjet.currentValue || 50;
  const projectionFinProjet =
    avancementProjet > 0
      ? (budgetSynthese.realise / avancementProjet) * 100
      : budgetSynthese.prevu;
  const ecartProjection = budgetSynthese.prevu - projectionFinProjet;

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-success-500" />
          Budget
        </h3>
        <div className="flex items-center gap-2">
          {trends?.budget && (
            <TrendIndicator
              direction={trends.budget.direction}
              value={trends.budget.variation}
              inverse={true}
            />
          )}
          <Badge variant={isOverBudget ? 'error' : 'success'}>
            {isOverBudget ? (
              <>
                <TrendingDown className="h-3 w-3 mr-1" /> Dépassement
              </>
            ) : (
              <>
                <TrendingUp className="h-3 w-3 mr-1" /> Sous contrôle
              </>
            )}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {budgetData.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-primary-600">{item.label}</span>
              <span className="font-semibold text-primary-900">
                {formatCurrency(item.value)}
              </span>
            </div>
            <div className="h-3 bg-primary-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', item.color)}
                style={{
                  width: `${Math.min((item.value / budgetSynthese.prevu) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-primary-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-primary-600">Écart actuel</span>
            <span
              className={cn(
                'font-bold',
                isOverBudget ? 'text-error-600' : 'text-success-600'
              )}
            >
              {isOverBudget ? '-' : '+'}
              {formatCurrency(Math.abs(ecart))}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-primary-600">Taux de réalisation</span>
            <span className="font-bold text-primary-900">
              {Math.round(budgetSynthese.tauxRealisation)}%
            </span>
          </div>
          <div className="flex justify-between items-center bg-primary-50 p-2 rounded">
            <span className="text-sm text-primary-600">Projection fin projet</span>
            <span
              className={cn(
                'font-bold',
                ecartProjection < 0 ? 'text-error-600' : 'text-success-600'
              )}
            >
              {formatCurrency(projectionFinProjet)}
              <span className="text-xs font-normal ml-1">
                ({ecartProjection >= 0 ? '+' : ''}
                {formatCurrency(ecartProjection)})
              </span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// SECTION: ALERTES (améliorée avec compteur tendance)
// ============================================================================

function AlertesCOPILSection() {
  const alertes = useAlertes();
  const trends = useCOPILTrends(1);

  const alertesActives = useMemo(() => {
    return alertes
      .filter((a) => !a.traitee)
      .sort((a, b) => {
        const critOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (
          critOrder[a.criticite as keyof typeof critOrder] -
          critOrder[b.criticite as keyof typeof critOrder]
        );
      })
      .slice(0, 5);
  }, [alertes]);

  const getCriticiteColor = (criticite: string) => {
    switch (criticite) {
      case 'critical':
        return 'bg-error-100 text-error-700 border-error-200';
      case 'high':
        return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'medium':
        return 'bg-info-100 text-info-700 border-info-200';
      default:
        return 'bg-primary-100 text-primary-700 border-primary-200';
    }
  };

  const totalNonTraitees = alertes.filter((a) => !a.traitee).length;

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <Bell className="h-5 w-5 text-warning-500" />
          Alertes en cours
        </h3>
        <div className="flex items-center gap-2">
          {trends?.alertes && trends.alertes.direction !== 'stable' && (
            <TrendIndicator
              direction={trends.alertes.direction}
              inverse={true}
              size="sm"
            />
          )}
          <Badge variant="warning">{totalNonTraitees} non traitées</Badge>
        </div>
      </div>

      <div className="space-y-2">
        {alertesActives.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-4 text-success-600">
            <CheckCircle2 className="h-5 w-5" />
            <span>Aucune alerte en cours</span>
          </div>
        ) : (
          alertesActives.map((alerte) => (
            <div
              key={alerte.id}
              className={cn(
                'p-2 rounded-lg border',
                getCriticiteColor(alerte.criticite)
              )}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{alerte.titre}</p>
                  <p className="text-xs opacity-75 truncate">{alerte.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// SECTION: DÉCISIONS (améliorée avec deadline et catégorisation)
// ============================================================================

function DecisionsCOPILSection() {
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();

  const decisions = useMemo((): DecisionItem[] => {
    const items: DecisionItem[] = [];
    const now = new Date();

    // Actions bloquées
    const blockedActions = actions.filter((a) => a.statut === 'bloque').slice(0, 2);
    blockedActions.forEach((a) => {
      const deadline = a.date_fin_prevue
        ? new Date(a.date_fin_prevue)
        : undefined;
      items.push({
        id: `action-${a.id}`,
        sujet: `Déblocage: ${a.titre}`,
        contexte: `Action bloquée depuis ${
          a.date_debut_prevue
            ? new Date(a.date_debut_prevue).toLocaleDateString('fr-FR')
            : 'N/A'
        }`,
        options: ['Réaffecter les ressources', 'Modifier le périmètre', 'Escalader'],
        urgence: 'haute',
        responsable: a.responsable || 'Non assigné',
        deadline: deadline?.toISOString(),
        sourceType: 'action',
        sourceId: a.id,
      });
    });

    // Risques critiques
    const criticalRisks = risques
      .filter((r) => r.score >= 12 && r.status === 'active')
      .slice(0, 2);
    criticalRisks.forEach((r) => {
      items.push({
        id: `risque-${r.id}`,
        sujet: `Traitement risque: ${r.titre}`,
        contexte: `Score ${r.score} - Impact potentiel majeur`,
        options: ['Accepter', 'Mitiger', 'Transférer', 'Éviter'],
        urgence: 'haute',
        responsable: r.proprietaire || 'Non assigné',
        sourceType: 'risque',
        sourceId: r.id,
      });
    });

    // Jalons en danger
    const dangerJalons = jalons.filter((j) => j.statut === 'en_danger').slice(0, 1);
    dangerJalons.forEach((j) => {
      items.push({
        id: `jalon-${j.id}`,
        sujet: `Jalon en danger: ${j.titre}`,
        contexte: `Date prévue: ${
          j.date_prevue
            ? new Date(j.date_prevue).toLocaleDateString('fr-FR')
            : 'N/A'
        }`,
        options: [
          'Renforcer les ressources',
          'Revoir le planning',
          'Alerter les parties prenantes',
        ],
        urgence: 'moyenne',
        responsable: j.responsable || 'Non assigné',
        deadline: j.date_prevue,
        sourceType: 'jalon',
        sourceId: j.id,
      });
    });

    return items.slice(0, 4);
  }, [actions, jalons, risques]);

  const getUrgenceConfig = (urgence: DecisionItem['urgence']) => {
    switch (urgence) {
      case 'haute':
        return { className: 'bg-error-100 text-error-700', label: 'Bloquant' };
      case 'moyenne':
        return { className: 'bg-warning-100 text-warning-700', label: 'Important' };
      default:
        return { className: 'bg-info-100 text-info-700', label: 'À planifier' };
    }
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Décisions à prendre
        </h3>
        <Badge variant="secondary">{decisions.length} en attente</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {decisions.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center gap-2 py-4 text-success-600">
            <CheckCircle2 className="h-5 w-5" />
            <span>Aucune décision urgente</span>
          </div>
        ) : (
          decisions.map((decision) => {
            const urgenceConfig = getUrgenceConfig(decision.urgence);
            const daysUntil = getDaysUntilDeadline(decision.deadline);
            return (
              <div
                key={decision.id}
                className="p-3 bg-primary-50 rounded-lg border border-primary-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-primary-900 text-sm flex-1">
                    {decision.sujet}
                  </p>
                  <Badge className={cn('text-xs ml-2', urgenceConfig.className)}>
                    {urgenceConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-primary-500 mb-2">{decision.contexte}</p>

                {daysUntil !== null && (
                  <div
                    className={cn(
                      'text-xs font-medium mb-2',
                      daysUntil <= 3
                        ? 'text-error-600'
                        : daysUntil <= 7
                        ? 'text-warning-600'
                        : 'text-primary-600'
                    )}
                  >
                    <Clock className="h-3 w-3 inline mr-1" />
                    {daysUntil > 0 ? `J-${daysUntil}` : daysUntil === 0 ? "Aujourd'hui" : `J+${Math.abs(daysUntil)}`}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mb-2">
                  {decision.options.slice(0, 3).map((opt, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {opt}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-primary-400 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {decision.responsable}
                </p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function COPILDashboard() {
  const kpis = useDashboardKPIs();
  const jalons = useJalons();
  const risques = useRisques();
  const alertes = useAlertes();
  const actions = useActions();
  const budgetSynthese = useBudgetSynthese();
  const syncData = useSync(1, 'cosmos-angre');

  // Prepare data for export
  const getExportData = useCallback(() => {
    return {
      projectName: kpis.projectName,
      date: new Date().toISOString(),
      meteo: {
        avancementProjet: syncData.syncStatus?.projectProgress || 0,
        avancementMobilisation: syncData.syncStatus?.mobilizationProgress || 0,
        budget: budgetSynthese.tauxRealisation,
        risques: risques.filter((r) => r.score >= 12 && r.status !== 'closed').length,
        jalons:
          jalons.length > 0
            ? (jalons.filter((j) => j.statut === 'atteint').length / jalons.length) * 100
            : 0,
      },
      risques: risques
        .filter((r) => r.status !== 'closed')
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
      jalons: jalons.filter((j) => {
        if (!j.date_prevue || j.statut === 'atteint') return false;
        const date = new Date(j.date_prevue);
        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return date >= now && date <= in30Days;
      }),
      budget: budgetSynthese,
      alertes: alertes.filter((a) => !a.traitee).slice(0, 5),
      decisions: actions.filter((a) => a.statut === 'bloque').slice(0, 4),
    };
  }, [kpis, jalons, risques, alertes, actions, budgetSynthese, syncData]);

  const handleExportPDF = useCallback(() => {
    const data = getExportData();
    exportCOPILToPDF(data);
  }, [getExportData]);

  const handleExportPPTX = useCallback(async () => {
    const data = getExportData();
    await exportCOPILToPPTX(data);
  }, [getExportData]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary-900 flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            Tableau de Bord COPIL
          </h2>
          <p className="text-sm text-primary-500 mt-1">
            {kpis.projectName} — Vue de synthèse pour le Comité de Pilotage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-primary-500">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPPTX}>
              <Presentation className="h-4 w-4 mr-1" />
              PPTX
            </Button>
          </div>
        </div>
      </div>

      {/* Météo Projet */}
      <MeteoProjetSection />

      {/* Faits Marquants */}
      <FaitsMarquantsCOPILSection />

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Risques */}
        <Top5RisquesSection />

        {/* Jalons J-30 */}
        <JalonsJ30Section />

        {/* Budget */}
        <BudgetCOPILSection />

        {/* Alertes */}
        <AlertesCOPILSection />
      </div>

      {/* Décisions à prendre (pleine largeur) */}
      <DecisionsCOPILSection />
    </div>
  );
}

export default COPILDashboard;
