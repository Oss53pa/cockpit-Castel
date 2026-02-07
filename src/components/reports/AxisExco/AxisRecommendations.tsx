/**
 * AxisRecommendations - Recommandations automatiques basées sur l'analyse des données
 */

import { useMemo } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  Target,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SEUILS_SANTE_AXE, SEUILS_RISQUES } from '@/data/constants';
import type { Action, Jalon, Risque } from '@/types';

interface AxisRecommendationsProps {
  axe: string;
  axeLabel: string;
  actions: Action[];
  jalons: Jalon[];
  risques: Risque[];
  avancementPrevu: number;
  avancementRealise: number;
  axeColor: string;
}

interface Recommendation {
  id: string;
  type: 'critique' | 'attention' | 'suggestion' | 'success';
  title: string;
  description: string;
  impact: string;
  actions: string[];
  icon: React.ElementType;
}

const typeConfig: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  critique: { color: 'text-error-700', bgColor: 'bg-error-50', borderColor: 'border-error-200' },
  attention: { color: 'text-warning-700', bgColor: 'bg-warning-50', borderColor: 'border-warning-200' },
  suggestion: { color: 'text-info-700', bgColor: 'bg-info-50', borderColor: 'border-info-200' },
  success: { color: 'text-success-700', bgColor: 'bg-success-50', borderColor: 'border-success-200' },
};

export function AxisRecommendations({
  axe,
  axeLabel,
  actions,
  jalons,
  risques,
  avancementPrevu,
  avancementRealise,
  axeColor,
}: AxisRecommendationsProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date();

  // Génération automatique des recommandations
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];

    // === ANALYSE DES ACTIONS ===
    const actionsEnRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
    );
    const actionsBloquees = actions.filter(a => a.statut === 'bloque');
    const actionsCritiques = actions.filter(a =>
      a.priorite === 'critique' && a.statut !== 'termine'
    );
    const actionsSansResponsable = actions.filter(a =>
      !a.responsableId && a.statut !== 'termine'
    );

    // Actions en retard
    if (actionsEnRetard.length >= SEUILS_SANTE_AXE.recommandations.actionsEnRetardCritique) {
      recs.push({
        id: 'actions-retard-critique',
        type: 'critique',
        title: `${actionsEnRetard.length} actions en retard critique`,
        description: `Le retard accumulé sur ${actionsEnRetard.length} actions risque de compromettre les jalons à venir.`,
        impact: 'Impact élevé sur le planning global',
        actions: [
          'Organiser une réunion de crise avec les responsables',
          'Prioriser les 3 actions les plus critiques',
          'Envisager le renforcement des ressources',
        ],
        icon: AlertTriangle,
      });
    } else if (actionsEnRetard.length > 0) {
      recs.push({
        id: 'actions-retard',
        type: 'attention',
        title: `${actionsEnRetard.length} action(s) en retard`,
        description: `Des actions n'ont pas respecté leur échéance prévue.`,
        impact: 'Risque de glissement du planning',
        actions: [
          'Identifier les causes du retard',
          'Replanifier avec des dates réalistes',
          'Mettre en place un suivi renforcé',
        ],
        icon: Clock,
      });
    }

    // Actions bloquées
    if (actionsBloquees.length > 0) {
      recs.push({
        id: 'actions-bloquees',
        type: 'critique',
        title: `${actionsBloquees.length} action(s) bloquée(s)`,
        description: `Des blocages non résolus impactent l'avancement de l'axe.`,
        impact: 'Arrêt total de certaines activités',
        actions: [
          'Identifier la cause racine de chaque blocage',
          'Escalader vers la direction si nécessaire',
          'Définir un plan de déblocage avec échéance',
        ],
        icon: AlertTriangle,
      });
    }

    // Actions sans responsable
    if (actionsSansResponsable.length > 0) {
      recs.push({
        id: 'actions-sans-resp',
        type: 'attention',
        title: `${actionsSansResponsable.length} action(s) sans responsable`,
        description: `Des actions n'ont pas de responsable désigné.`,
        impact: 'Risque de non-exécution',
        actions: [
          'Assigner un responsable à chaque action',
          'Clarifier les rôles et responsabilités',
        ],
        icon: Target,
      });
    }

    // === ANALYSE DES JALONS ===
    const jalonsEnRetard = jalons.filter(j =>
      j.statut !== 'atteint' && j.date_prevue && j.date_prevue < today
    );
    const jalonsProches = jalons.filter(j => {
      if (j.statut === 'atteint' || !j.date_prevue) return false;
      const datePrevue = new Date(j.date_prevue);
      const daysUntil = Math.ceil((datePrevue.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= SEUILS_SANTE_AXE.recommandations.jalonsProches;
    });

    if (jalonsEnRetard.length > 0) {
      recs.push({
        id: 'jalons-retard',
        type: 'critique',
        title: `${jalonsEnRetard.length} jalon(s) dépassé(s)`,
        description: `Des jalons n'ont pas été atteints à la date prévue.`,
        impact: 'Retard sur le calendrier du projet',
        actions: [
          'Analyser les causes du non-atteinte',
          'Définir un plan de rattrapage',
          'Communiquer sur le nouveau planning',
        ],
        icon: Target,
      });
    }

    if (jalonsProches.length > 0) {
      const jalonsEnDanger = jalonsProches.filter(j => {
        const actionsLiees = actions.filter(a => a.jalonId === j.id);
        const tauxCompletion = actionsLiees.length > 0
          ? actionsLiees.filter(a => a.statut === 'termine').length / actionsLiees.length
          : 1;
        return tauxCompletion < SEUILS_SANTE_AXE.recommandations.completionFaible;
      });

      if (jalonsEnDanger.length > 0) {
        recs.push({
          id: 'jalons-danger',
          type: 'attention',
          title: `${jalonsEnDanger.length} jalon(s) à risque dans les 2 semaines`,
          description: `Des jalons approchent avec un taux de complétion insuffisant.`,
          impact: 'Risque de non-atteinte des jalons',
          actions: [
            'Accélérer les actions liées aux jalons',
            'Prévoir un plan B si nécessaire',
            'Alerter les parties prenantes',
          ],
          icon: Clock,
        });
      }
    }

    // === ANALYSE DES RISQUES ===
    const risquesCritiques = risques.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= SEUILS_RISQUES.critique && r.status !== 'ferme';
    });
    const risquesSansPlan = risques.filter(r =>
      r.status !== 'ferme' && !r.plan_mitigation && !r.mesures_attenuation
    );

    if (risquesCritiques.length > 0) {
      recs.push({
        id: 'risques-critiques',
        type: 'critique',
        title: `${risquesCritiques.length} risque(s) critique(s) actif(s)`,
        description: `Des risques à score élevé (≥${SEUILS_RISQUES.critique}) menacent l'axe.`,
        impact: 'Potentiel impact majeur sur le projet',
        actions: [
          'Activer les plans de mitigation',
          'Escalader vers le COPIL',
          'Préparer des plans de contingence',
        ],
        icon: Shield,
      });
    }

    if (risquesSansPlan.length > SEUILS_SANTE_AXE.recommandations.risquesSansPlanMax) {
      recs.push({
        id: 'risques-sans-plan',
        type: 'attention',
        title: `${risquesSansPlan.length} risques sans plan de mitigation`,
        description: `Des risques identifiés n'ont pas de stratégie de traitement.`,
        impact: 'Exposition non maîtrisée',
        actions: [
          'Définir une stratégie pour chaque risque',
          'Assigner un propriétaire de risque',
          'Planifier une revue des risques',
        ],
        icon: Shield,
      });
    }

    // === ANALYSE DE L'AVANCEMENT ===
    const ecart = avancementRealise - avancementPrevu;
    const velocite = avancementPrevu > 0 ? (avancementRealise / avancementPrevu) * 100 : 100;

    if (ecart < SEUILS_SANTE_AXE.recommandations.ecartCritique) {
      recs.push({
        id: 'avancement-critique',
        type: 'critique',
        title: `Retard d'avancement de ${Math.abs(ecart).toFixed(0)}%`,
        description: `L'écart entre le prévu (${avancementPrevu}%) et le réalisé (${avancementRealise}%) est critique.`,
        impact: 'Objectifs d\'ouverture compromis',
        actions: [
          'Revoir le planning de manière réaliste',
          'Identifier les axes de rattrapage',
          'Mobiliser des ressources supplémentaires',
        ],
        icon: TrendingUp,
      });
    } else if (ecart < SEUILS_SANTE_AXE.recommandations.ecartAttention) {
      recs.push({
        id: 'avancement-attention',
        type: 'attention',
        title: `Retard d'avancement de ${Math.abs(ecart).toFixed(0)}%`,
        description: `L'avancement est inférieur aux prévisions.`,
        impact: 'Risque de dérive du planning',
        actions: [
          'Analyser les causes du retard',
          'Intensifier le suivi des actions',
        ],
        icon: TrendingUp,
      });
    }

    // === POINTS POSITIFS ===
    if (ecart >= 0 && actionsEnRetard.length === 0 && risquesCritiques.length === 0) {
      recs.push({
        id: 'bonne-performance',
        type: 'success',
        title: 'Performance conforme aux objectifs',
        description: `L'axe ${axeLabel} est en bonne voie avec un avancement de ${avancementRealise}%.`,
        impact: 'Contribution positive au projet',
        actions: [
          'Maintenir le rythme actuel',
          'Partager les bonnes pratiques',
          'Anticiper les prochaines échéances',
        ],
        icon: CheckCircle,
      });
    }

    const actionsTermineesRecemment = actions.filter(a => {
      if (a.statut !== 'termine' || !a.date_fin_reelle) return false;
      const dateReelle = new Date(a.date_fin_reelle);
      const daysAgo = new Date(todayDate.getTime() - SEUILS_SANTE_AXE.recommandations.activiteRecente.jours * 24 * 60 * 60 * 1000);
      return dateReelle >= daysAgo;
    });

    if (actionsTermineesRecemment.length >= SEUILS_SANTE_AXE.recommandations.activiteRecente.actionsMin) {
      recs.push({
        id: 'bonne-dynamique',
        type: 'success',
        title: `${actionsTermineesRecemment.length} actions terminées cette semaine`,
        description: `Bonne dynamique de livraison sur l'axe.`,
        impact: 'Progression satisfaisante',
        actions: [
          'Féliciter l\'équipe',
          'Capitaliser sur cette dynamique',
        ],
        icon: CheckCircle,
      });
    }

    return recs;
  }, [actions, jalons, risques, avancementPrevu, avancementRealise, axeLabel, today, todayDate]);

  // Tri par type (critique > attention > suggestion > success)
  const sortedRecs = useMemo(() => {
    const order = { critique: 0, attention: 1, suggestion: 2, success: 3 };
    return [...recommendations].sort((a, b) => order[a.type] - order[b.type]);
  }, [recommendations]);

  if (sortedRecs.length === 0) {
    return (
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5" style={{ color: axeColor }} />
          <h3 className="text-lg font-semibold text-primary-900">Recommandations</h3>
        </div>
        <p className="text-gray-500 text-center py-4">
          Aucune recommandation particulière pour cet axe.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" style={{ color: axeColor }} />
          <h3 className="text-lg font-semibold text-primary-900">
            Recommandations ({sortedRecs.length})
          </h3>
        </div>
        <div className="flex gap-2">
          {sortedRecs.filter(r => r.type === 'critique').length > 0 && (
            <Badge variant="error">
              {sortedRecs.filter(r => r.type === 'critique').length} critiques
            </Badge>
          )}
          {sortedRecs.filter(r => r.type === 'attention').length > 0 && (
            <Badge variant="warning">
              {sortedRecs.filter(r => r.type === 'attention').length} attentions
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {sortedRecs.map((rec) => {
          const config = typeConfig[rec.type];
          const Icon = rec.icon;

          return (
            <div
              key={rec.id}
              className={cn(
                'p-4 rounded-lg border',
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  rec.type === 'critique' ? 'bg-error-200' :
                  rec.type === 'attention' ? 'bg-warning-200' :
                  rec.type === 'success' ? 'bg-success-200' :
                  'bg-info-200'
                )}>
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn('font-semibold', config.color)}>
                      {rec.title}
                    </h4>
                    <Badge variant={
                      rec.type === 'critique' ? 'error' :
                      rec.type === 'attention' ? 'warning' :
                      rec.type === 'success' ? 'success' :
                      'info'
                    } className="text-xs">
                      {rec.type === 'critique' ? 'Critique' :
                       rec.type === 'attention' ? 'Attention' :
                       rec.type === 'success' ? 'Positif' :
                       'Suggestion'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    <strong>Impact:</strong> {rec.impact}
                  </p>

                  {rec.actions.length > 0 && (
                    <div className="pl-2 border-l-2 border-gray-300">
                      <p className="text-xs font-medium text-gray-700 mb-1">Actions recommandées:</p>
                      <ul className="space-y-1">
                        {rec.actions.map((action, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default AxisRecommendations;
