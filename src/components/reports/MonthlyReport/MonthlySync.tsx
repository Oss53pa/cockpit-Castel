/**
 * MonthlySync - Évolution de la synchronisation sur le mois
 *
 * Affiche:
 * - Évolution de la synchronisation sur le mois
 * - Courbe comparative Construction vs Mobilisation
 * - Actions correctives recommandées
 */

import { useMemo } from 'react';
import {
  GitBranch,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight,
  Building2,
  Briefcase,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSync, usePendingSyncActions } from '@/hooks/useSync';
import { useSiteStore } from '@/stores/siteStore';
import type { SyncSnapshot, SyncAction } from '@/types/sync.types';

interface MonthlySyncProps {
  month?: number; // 0-11, défaut mois courant
  year?: number;
  className?: string;
}

export function MonthlySync({ month, year, className }: MonthlySyncProps) {
  const { currentSiteId } = useSiteStore();
  const siteId = currentSiteId || 1;

  const now = new Date();
  const selectedMonth = month ?? now.getMonth();
  const selectedYear = year ?? now.getFullYear();

  const {
    syncStatus,
    projectCategories,
    mobilizationCategories,
    snapshots,
    alerts,
    loading,
    initialized,
  } = useSync(siteId, 'cosmos-angre');

  const pendingActions = usePendingSyncActions('cosmos-angre');

  // Filtrer les snapshots du mois sélectionné
  const monthlySnapshots = useMemo(() => {
    return snapshots.filter(s => {
      const date = new Date(s.snapshotDate);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    }).sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
  }, [snapshots, selectedMonth, selectedYear]);

  // Calculer l'évolution sur le mois
  const monthlyEvolution = useMemo(() => {
    if (monthlySnapshots.length < 2) {
      return {
        constructionStart: syncStatus?.projectProgress || 0,
        constructionEnd: syncStatus?.projectProgress || 0,
        constructionDelta: 0,
        mobilizationStart: syncStatus?.mobilizationProgress || 0,
        mobilizationEnd: syncStatus?.mobilizationProgress || 0,
        mobilizationDelta: 0,
        gapStart: syncStatus?.gap || 0,
        gapEnd: syncStatus?.gap || 0,
        gapDelta: 0,
      };
    }

    const firstSnapshot = monthlySnapshots[0];
    const lastSnapshot = monthlySnapshots[monthlySnapshots.length - 1];

    return {
      constructionStart: firstSnapshot.projectProgress || 0,
      constructionEnd: lastSnapshot.projectProgress || 0,
      constructionDelta: (lastSnapshot.projectProgress || 0) - (firstSnapshot.projectProgress || 0),
      mobilizationStart: firstSnapshot.mobilizationProgress || 0,
      mobilizationEnd: lastSnapshot.mobilizationProgress || 0,
      mobilizationDelta: (lastSnapshot.mobilizationProgress || 0) - (firstSnapshot.mobilizationProgress || 0),
      gapStart: firstSnapshot.gap || 0,
      gapEnd: lastSnapshot.gap || 0,
      gapDelta: Math.abs(lastSnapshot.gap || 0) - Math.abs(firstSnapshot.gap || 0),
    };
  }, [monthlySnapshots, syncStatus]);

  // Générer des recommandations basées sur les données
  const recommendations = useMemo(() => {
    const recs: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }> = [];

    const currentGap = Math.abs(syncStatus?.gap || 0);

    if (currentGap > 20) {
      recs.push({
        title: 'Réunion de crise synchronisation',
        description: 'Organiser une réunion d\'urgence entre les équipes Construction et Mobilisation pour aligner les plannings.',
        priority: 'high',
      });
    }

    if (currentGap > 15) {
      recs.push({
        title: 'Accélération des travaux',
        description: syncStatus?.gap && syncStatus.gap < 0
          ? 'La mobilisation est en retard. Renforcer les équipes et accélérer les processus de mobilisation.'
          : 'La construction est en retard. Vérifier les blocages chantier et les ressources.',
        priority: 'high',
      });
    }

    if (monthlyEvolution.gapDelta > 5) {
      recs.push({
        title: 'Analyse de la dégradation',
        description: `L'écart s'est creusé de ${monthlyEvolution.gapDelta.toFixed(1)}% ce mois. Identifier les causes et mettre en place des actions correctives.`,
        priority: 'high',
      });
    }

    if (currentGap > 10 && currentGap <= 15) {
      recs.push({
        title: 'Plan de rattrapage',
        description: 'Définir un plan de rattrapage avec des jalons intermédiaires pour réduire l\'écart progressivement.',
        priority: 'medium',
      });
    }

    // Vérifier les catégories en retard
    const laggingConstruction = projectCategories.filter(c => c.progress < 30);
    const laggingMobilization = mobilizationCategories.filter(c => c.progress < 30);

    if (laggingConstruction.length > 0) {
      recs.push({
        title: `Phases construction critiques (${laggingConstruction.length})`,
        description: `Les phases suivantes sont en retard: ${laggingConstruction.map(c => c.categoryName).join(', ')}`,
        priority: 'medium',
      });
    }

    if (laggingMobilization.length > 0) {
      recs.push({
        title: `Catégories mobilisation critiques (${laggingMobilization.length})`,
        description: `Les catégories suivantes sont en retard: ${laggingMobilization.map(c => c.categoryName).join(', ')}`,
        priority: 'medium',
      });
    }

    if (currentGap <= 10) {
      recs.push({
        title: 'Maintenir le rythme',
        description: 'La synchronisation est bonne. Continuer le suivi régulier et anticiper les prochaines échéances.',
        priority: 'low',
      });
    }

    return recs;
  }, [syncStatus, monthlyEvolution, projectCategories, mobilizationCategories]);

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  if (loading && !initialized) {
    return (
      <Card padding="md" className={className}>
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary-500" />
          <span className="text-sm font-medium">Chargement des données de synchronisation...</span>
        </div>
      </Card>
    );
  }

  const currentGap = Math.abs(syncStatus?.gap || 0);
  const isAlert = currentGap > 15;
  const isWarning = currentGap > 10;

  return (
    <Card padding="lg" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-primary-900">
            Synchronisation Construction / Mobilisation
          </h3>
        </div>
        <Badge variant="secondary">
          <Calendar className="h-3 w-3 mr-1" />
          {monthNames[selectedMonth]} {selectedYear}
        </Badge>
      </div>

      {/* KPIs d'évolution */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Construction */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Construction CC</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-blue-900">
              {(syncStatus?.projectProgress || 0).toFixed(0)}%
            </span>
            <span className={cn(
              'text-sm font-medium mb-1',
              monthlyEvolution.constructionDelta >= 0 ? 'text-success-600' : 'text-error-600'
            )}>
              {monthlyEvolution.constructionDelta >= 0 ? '+' : ''}
              {monthlyEvolution.constructionDelta.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {monthlyEvolution.constructionStart.toFixed(0)}% → {monthlyEvolution.constructionEnd.toFixed(0)}%
          </p>
        </div>

        {/* Mobilisation */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Mobilisation</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-purple-900">
              {(syncStatus?.mobilizationProgress || 0).toFixed(0)}%
            </span>
            <span className={cn(
              'text-sm font-medium mb-1',
              monthlyEvolution.mobilizationDelta >= 0 ? 'text-success-600' : 'text-error-600'
            )}>
              {monthlyEvolution.mobilizationDelta >= 0 ? '+' : ''}
              {monthlyEvolution.mobilizationDelta.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-purple-600 mt-1">
            {monthlyEvolution.mobilizationStart.toFixed(0)}% → {monthlyEvolution.mobilizationEnd.toFixed(0)}%
          </p>
        </div>

        {/* Écart */}
        <div className={cn(
          'p-4 rounded-lg border',
          isAlert ? 'bg-error-50 border-error-200' :
          isWarning ? 'bg-warning-50 border-warning-200' :
          'bg-success-50 border-success-200'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {isAlert ? (
              <AlertTriangle className="h-4 w-4 text-error-600" />
            ) : isWarning ? (
              <AlertTriangle className="h-4 w-4 text-warning-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-success-600" />
            )}
            <span className={cn(
              'text-sm font-medium',
              isAlert ? 'text-error-700' :
              isWarning ? 'text-warning-700' :
              'text-success-700'
            )}>Écart Sync</span>
          </div>
          <div className="flex items-end gap-2">
            <span className={cn(
              'text-2xl font-bold',
              isAlert ? 'text-error-900' :
              isWarning ? 'text-warning-900' :
              'text-success-900'
            )}>
              {(syncStatus?.gap || 0) >= 0 ? '+' : ''}{(syncStatus?.gap || 0).toFixed(1)}%
            </span>
            <span className={cn(
              'text-sm font-medium mb-1',
              monthlyEvolution.gapDelta <= 0 ? 'text-success-600' : 'text-error-600'
            )}>
              {monthlyEvolution.gapDelta > 0 ? '+' : ''}{monthlyEvolution.gapDelta.toFixed(1)}%
            </span>
          </div>
          <p className={cn(
            'text-xs mt-1',
            isAlert ? 'text-error-600' :
            isWarning ? 'text-warning-600' :
            'text-success-600'
          )}>
            {monthlyEvolution.gapDelta <= 0 ? 'Amélioration' : 'Dégradation'} ce mois
          </p>
        </div>
      </div>

      {/* Graphique simplifié - Courbe comparative */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">
          Évolution sur le mois ({monthlySnapshots.length} points)
        </h4>

        {monthlySnapshots.length >= 2 ? (
          <div className="space-y-4">
            {/* Timeline visuelle simplifiée */}
            <div className="relative h-32">
              {/* Axe Y */}
              <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
              </div>

              {/* Graphique */}
              <div className="ml-10 h-full relative">
                {/* Grille */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  <div className="border-b border-dashed border-gray-300" />
                  <div className="border-b border-dashed border-gray-300" />
                  <div className="border-b border-gray-300" />
                </div>

                {/* Points Construction */}
                <div className="absolute inset-0 flex items-end justify-between">
                  {monthlySnapshots.slice(0, 5).map((snap, i) => (
                    <div key={`c-${i}`} className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full bg-blue-500 relative"
                        style={{ marginBottom: `${(snap.projectProgress || 0) * 1.2}px` }}
                        title={`Construction: ${snap.projectProgress?.toFixed(0)}%`}
                      />
                    </div>
                  ))}
                </div>

                {/* Points Mobilisation */}
                <div className="absolute inset-0 flex items-end justify-between">
                  {monthlySnapshots.slice(0, 5).map((snap, i) => (
                    <div key={`m-${i}`} className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full bg-purple-500 relative"
                        style={{ marginBottom: `${(snap.mobilizationProgress || 0) * 1.2}px` }}
                        title={`Mobilisation: ${snap.mobilizationProgress?.toFixed(0)}%`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Légende */}
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-600">Construction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-gray-600">Mobilisation</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">
            Données insuffisantes pour afficher l'évolution
          </p>
        )}
      </div>

      {/* Actions correctives recommandées */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning-600" />
          Actions correctives recommandées ({recommendations.length})
        </h4>

        <div className="space-y-2">
          {recommendations.slice(0, 4).map((rec, i) => (
            <div
              key={i}
              className={cn(
                'p-3 rounded-lg border',
                rec.priority === 'high' ? 'bg-error-50 border-error-200' :
                rec.priority === 'medium' ? 'bg-warning-50 border-warning-200' :
                'bg-info-50 border-info-200'
              )}
            >
              <div className="flex items-start gap-2">
                <ArrowRight className={cn(
                  'h-4 w-4 mt-0.5',
                  rec.priority === 'high' ? 'text-error-600' :
                  rec.priority === 'medium' ? 'text-warning-600' :
                  'text-info-600'
                )} />
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    rec.priority === 'high' ? 'text-error-700' :
                    rec.priority === 'medium' ? 'text-warning-700' :
                    'text-info-700'
                  )}>
                    {rec.title}
                  </p>
                  <p className={cn(
                    'text-xs mt-1',
                    rec.priority === 'high' ? 'text-error-600' :
                    rec.priority === 'medium' ? 'text-warning-600' :
                    'text-info-600'
                  )}>
                    {rec.description}
                  </p>
                </div>
                <Badge
                  variant={
                    rec.priority === 'high' ? 'error' :
                    rec.priority === 'medium' ? 'warning' :
                    'info'
                  }
                  className="ml-auto text-xs"
                >
                  {rec.priority === 'high' ? 'Urgent' :
                   rec.priority === 'medium' ? 'Important' :
                   'Info'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions en cours */}
      {pendingActions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Actions de synchronisation en cours ({pendingActions.length})
          </h4>
          <div className="space-y-2">
            {pendingActions.slice(0, 3).map((action, i) => (
              <div key={action.id || i} className="p-2 bg-gray-100 rounded flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{action.title}</p>
                  <p className="text-xs text-gray-500">
                    {action.responsible} • Échéance: {action.dueDate
                      ? new Date(action.dueDate).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                </div>
                <Badge variant={
                  action.status === 'IN_PROGRESS' ? 'primary' :
                  action.status === 'PENDING' ? 'secondary' :
                  'success'
                }>
                  {action.status === 'IN_PROGRESS' ? 'En cours' :
                   action.status === 'PENDING' ? 'En attente' :
                   'Terminée'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default MonthlySync;
