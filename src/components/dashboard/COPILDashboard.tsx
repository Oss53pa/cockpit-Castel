// ============================================================================
// TABLEAU DE BORD COPIL - Comité de Pilotage
// ============================================================================

import { useMemo } from 'react';
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
  Users,
  Target,
  Calendar,
} from 'lucide-react';
import { Card, Badge, Progress } from '@/components/ui';
import {
  useDashboardKPIs,
  useAvancementGlobal,
  useJalons,
  useRisques,
  useAlertes,
  useBudgetSynthese,
  useActions,
  useSync,
} from '@/hooks';
import { formatCurrency, cn } from '@/lib/utils';
import { AXE_LABELS, RISQUE_CATEGORY_LABELS } from '@/types';

// Types
interface MeteoItem {
  label: string;
  status: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  progress: number;
  trend?: 'up' | 'down' | 'stable';
}

interface DecisionItem {
  id: string;
  sujet: string;
  contexte: string;
  options: string[];
  urgence: 'haute' | 'moyenne' | 'basse';
  responsable: string;
}

// Météo icon component
// Vert = sunny (☀️) | Jaune = cloudy (⛅) | Orange = rainy (☁️) | Rouge = stormy (🌧️)
function MeteoIcon({ status, className }: { status: MeteoItem['status']; className?: string }) {
  const icons = {
    sunny: Sun,        // ☀️ Vert - Favorable
    cloudy: CloudSun,  // ⛅ Jaune - Attention
    rainy: Cloud,      // ☁️ Orange - Vigilance
    stormy: CloudRain, // 🌧️ Rouge - Critique
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
// Labels cohérents avec MeteoProjet.tsx
function MeteoBadge({ status }: { status: MeteoItem['status'] }) {
  const config = {
    sunny: { label: 'Favorable', className: 'bg-success-100 text-success-700' },     // Vert
    cloudy: { label: 'Attention', className: 'bg-warning-100 text-warning-700' },    // Jaune
    rainy: { label: 'Vigilance', className: 'bg-orange-100 text-orange-700' },       // Orange
    stormy: { label: 'Critique', className: 'bg-error-100 text-error-700' },         // Rouge
  };
  return (
    <Badge className={config[status].className}>
      {config[status].label}
    </Badge>
  );
}

// Section: Météo Projet
function MeteoProjetSection() {
  const avancementGlobal = useAvancementGlobal();
  const syncData = useSync('cosmos-angre');
  const budgetSynthese = useBudgetSynthese();
  const risques = useRisques();
  const jalons = useJalons();

  const criticalRisks = risques.filter(r => r.score >= 12 && r.status !== 'closed').length;
  const jalonsEnDanger = jalons.filter(j => j.statut === 'en_danger' || j.statut === 'depasse').length;

  const getMeteoStatus = (progress: number, hasIssues: boolean): MeteoItem['status'] => {
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
    },
    {
      label: 'Avancement Mobilisation',
      status: getMeteoStatus(syncData.syncStatus?.mobilizationProgress || 0, false),
      progress: syncData.syncStatus?.mobilizationProgress || 0,
    },
    {
      label: 'Budget',
      status: budgetSynthese.tauxRealisation > 100 ? 'stormy' : budgetSynthese.tauxRealisation > 90 ? 'rainy' : 'sunny',
      progress: Math.min(budgetSynthese.tauxRealisation, 100),
    },
    {
      label: 'Risques',
      status: criticalRisks > 2 ? 'stormy' : criticalRisks > 0 ? 'rainy' : 'sunny',
      progress: 100 - (criticalRisks * 20),
    },
    {
      label: 'Jalons',
      status: jalonsEnDanger > 2 ? 'stormy' : jalonsEnDanger > 0 ? 'rainy' : 'sunny',
      progress: jalons.length > 0 ? (jalons.filter(j => j.statut === 'atteint').length / jalons.length) * 100 : 0,
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
              <span className="text-xs font-medium text-primary-700">{item.label}</span>
              <MeteoIcon status={item.status} className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <Progress value={item.progress} className="flex-1 h-2" />
              <span className="text-sm font-bold text-primary-900">{Math.round(item.progress)}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Section: Top 5 Risques
function Top5RisquesSection() {
  const risques = useRisques();

  const top5 = useMemo(() => {
    return risques
      .filter(r => r.status !== 'closed')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
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
        <Badge variant="error">{risques.filter(r => r.status !== 'closed').length} actifs</Badge>
      </div>

      <div className="space-y-3">
        {top5.length === 0 ? (
          <p className="text-sm text-primary-500 text-center py-4">Aucun risque actif</p>
        ) : (
          top5.map((risque, index) => (
            <div
              key={risque.id}
              className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg"
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold',
                getScoreColor(risque.score)
              )}>
                {risque.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary-500">#{index + 1}</span>
                  <Badge variant="secondary" className="text-xs">
                    {RISQUE_CATEGORY_LABELS[risque.categorie] || risque.categorie}
                  </Badge>
                </div>
                <p className="font-medium text-primary-900 truncate">{risque.titre}</p>
                <p className="text-xs text-primary-500">
                  P:{risque.probabilite_actuelle} × I:{risque.impact_actuel} • {risque.proprietaire || 'Non assigné'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// Section: Jalons J-30
function JalonsJ30Section() {
  const jalons = useJalons();

  const jalonsJ30 = useMemo(() => {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return jalons
      .filter(j => {
        if (!j.date_prevue || j.statut === 'atteint') return false;
        const date = new Date(j.date_prevue);
        return date >= now && date <= in30Days;
      })
      .sort((a, b) => new Date(a.date_prevue!).getTime() - new Date(b.date_prevue!).getTime())
      .slice(0, 6);
  }, [jalons]);

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'en_cours': return <Clock className="h-4 w-4 text-info-500" />;
      case 'en_danger': return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'depasse': return <XCircle className="h-4 w-4 text-error-500" />;
      default: return <Target className="h-4 w-4 text-primary-500" />;
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
          <p className="text-sm text-primary-500 text-center py-4">Aucun jalon dans les 30 prochains jours</p>
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
                  <p className="font-medium text-primary-900 text-sm truncate">{jalon.titre}</p>
                  <p className="text-xs text-primary-500">{AXE_LABELS[jalon.axe] || jalon.axe}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-bold',
                    days <= 7 ? 'text-error-600' : days <= 14 ? 'text-warning-600' : 'text-primary-600'
                  )}>
                    J-{days}
                  </p>
                  <p className="text-xs text-primary-500">
                    {new Date(jalon.date_prevue!).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
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

// Section: Budget Consommé vs Prévu
function BudgetCOPILSection() {
  const budgetSynthese = useBudgetSynthese();
  const _kpis = useDashboardKPIs();

  const budgetData = [
    { label: 'Budget prévu', value: budgetSynthese.prevu, color: 'bg-primary-500' },
    { label: 'Budget engagé', value: budgetSynthese.engage, color: 'bg-info-500' },
    { label: 'Budget réalisé', value: budgetSynthese.realise, color: 'bg-success-500' },
  ];

  const ecart = budgetSynthese.prevu - budgetSynthese.realise;
  const isOverBudget = ecart < 0;

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-success-500" />
          Budget
        </h3>
        <Badge variant={isOverBudget ? 'error' : 'success'}>
          {isOverBudget ? (
            <><TrendingDown className="h-3 w-3 mr-1" /> Dépassement</>
          ) : (
            <><TrendingUp className="h-3 w-3 mr-1" /> Sous contrôle</>
          )}
        </Badge>
      </div>

      <div className="space-y-4">
        {budgetData.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-primary-600">{item.label}</span>
              <span className="font-semibold text-primary-900">{formatCurrency(item.value)}</span>
            </div>
            <div className="h-3 bg-primary-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', item.color)}
                style={{ width: `${Math.min((item.value / budgetSynthese.prevu) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-primary-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-primary-600">Écart</span>
            <span className={cn(
              'font-bold',
              isOverBudget ? 'text-error-600' : 'text-success-600'
            )}>
              {isOverBudget ? '-' : '+'}{formatCurrency(Math.abs(ecart))}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-primary-600">Taux de réalisation</span>
            <span className="font-bold text-primary-900">{Math.round(budgetSynthese.tauxRealisation)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Section: Alertes en cours
function AlertesCOPILSection() {
  const alertes = useAlertes();

  const alertesActives = useMemo(() => {
    return alertes
      .filter(a => !a.traitee)
      .sort((a, b) => {
        const critOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return critOrder[a.criticite as keyof typeof critOrder] - critOrder[b.criticite as keyof typeof critOrder];
      })
      .slice(0, 5);
  }, [alertes]);

  const getCriticiteColor = (criticite: string) => {
    switch (criticite) {
      case 'critical': return 'bg-error-100 text-error-700 border-error-200';
      case 'high': return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'medium': return 'bg-info-100 text-info-700 border-info-200';
      default: return 'bg-primary-100 text-primary-700 border-primary-200';
    }
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <Bell className="h-5 w-5 text-warning-500" />
          Alertes en cours
        </h3>
        <Badge variant="warning">{alertes.filter(a => !a.traitee).length} non traitées</Badge>
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

// Section: Décisions à prendre
function DecisionsCOPILSection() {
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();

  // Generate decisions based on project state
  const decisions = useMemo((): DecisionItem[] => {
    const items: DecisionItem[] = [];

    // Actions bloquées nécessitant une décision
    const blockedActions = actions.filter(a => a.statut === 'bloque').slice(0, 2);
    blockedActions.forEach(a => {
      items.push({
        id: `action-${a.id}`,
        sujet: `Déblocage: ${a.titre}`,
        contexte: `Action bloquée depuis ${a.date_debut_prevue ? new Date(a.date_debut_prevue).toLocaleDateString('fr-FR') : 'N/A'}`,
        options: ['Réaffecter les ressources', 'Modifier le périmètre', 'Escalader'],
        urgence: 'haute',
        responsable: a.responsable || 'Non assigné',
      });
    });

    // Risques critiques nécessitant une décision
    const criticalRisks = risques.filter(r => r.score >= 12 && r.status === 'active').slice(0, 2);
    criticalRisks.forEach(r => {
      items.push({
        id: `risque-${r.id}`,
        sujet: `Traitement risque: ${r.titre}`,
        contexte: `Score ${r.score} - Impact potentiel majeur`,
        options: ['Accepter', 'Mitiger', 'Transférer', 'Éviter'],
        urgence: 'haute',
        responsable: r.proprietaire || 'Non assigné',
      });
    });

    // Jalons en danger
    const dangerJalons = jalons.filter(j => j.statut === 'en_danger').slice(0, 1);
    dangerJalons.forEach(j => {
      items.push({
        id: `jalon-${j.id}`,
        sujet: `Jalon en danger: ${j.titre}`,
        contexte: `Date prévue: ${j.date_prevue ? new Date(j.date_prevue).toLocaleDateString('fr-FR') : 'N/A'}`,
        options: ['Renforcer les ressources', 'Revoir le planning', 'Alerter les parties prenantes'],
        urgence: 'moyenne',
        responsable: j.responsable || 'Non assigné',
      });
    });

    return items.slice(0, 4);
  }, [actions, jalons, risques]);

  const getUrgenceColor = (urgence: DecisionItem['urgence']) => {
    switch (urgence) {
      case 'haute': return 'bg-error-100 text-error-700';
      case 'moyenne': return 'bg-warning-100 text-warning-700';
      default: return 'bg-info-100 text-info-700';
    }
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

      <div className="space-y-3">
        {decisions.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-4 text-success-600">
            <CheckCircle2 className="h-5 w-5" />
            <span>Aucune décision urgente</span>
          </div>
        ) : (
          decisions.map((decision) => (
            <div
              key={decision.id}
              className="p-3 bg-primary-50 rounded-lg border border-primary-200"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-primary-900 text-sm">{decision.sujet}</p>
                <Badge className={cn('text-xs', getUrgenceColor(decision.urgence))}>
                  {decision.urgence}
                </Badge>
              </div>
              <p className="text-xs text-primary-500 mb-2">{decision.contexte}</p>
              <div className="flex flex-wrap gap-1">
                {decision.options.map((opt, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {opt}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-primary-400 mt-2">
                Responsable: {decision.responsable}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// Composant principal
export function COPILDashboard() {
  const kpis = useDashboardKPIs();

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
        <div className="flex items-center gap-2 text-sm text-primary-500">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Météo Projet */}
      <MeteoProjetSection />

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
