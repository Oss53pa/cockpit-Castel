/**
 * MonthlyBudget - Suivi budgétaire détaillé
 * Utilise les vraies données de la base IndexedDB
 */

import { useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart2,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useBudgetSynthese, useBudgetParCategorie, useBudget } from '@/hooks';

interface MonthlyBudgetProps {
  className?: string;
}

// Labels lisibles pour les catégories (correspond aux BudgetCategory dans la DB)
const CATEGORIE_LABELS: Record<string, string> = {
  'etudes': 'Études',
  'travaux': 'Travaux',
  'equipements': 'Équipements',
  'honoraires': 'Honoraires',
  'assurances': 'Assurances',
  'divers': 'Divers',
};

export function MonthlyBudget({ className }: MonthlyBudgetProps) {
  // Utiliser les vrais hooks de la base de données
  const synthese = useBudgetSynthese();
  const budgetParCategorie = useBudgetParCategorie();
  const budgetItems = useBudget();

  // Données budgétaires consolidées depuis les vraies données
  const budgetData = useMemo(() => {
    const total = synthese.prevu || 0;
    const realise = synthese.realise || 0;
    const engage = synthese.engage || 0;
    const consomme = synthese.tauxRealisation || 0;
    const reste = 100 - consomme;

    // Variance = écart entre réalisé et prévu (en %)
    const variance = total > 0 ? ((realise - total) / total) * 100 : 0;

    // Convertir le budget par catégorie en tableau
    const categories = Object.entries(budgetParCategorie).map(([cat, data]) => ({
      categorie: CATEGORIE_LABELS[cat] || cat,
      prevu: data.prevu,
      reel: data.realise,
      engage: data.engage,
    }));

    return {
      total,
      realise,
      engage,
      consomme: Math.round(consomme),
      reste: Math.round(reste),
      variance: Math.round(variance * 10) / 10,
      categories,
      isOverBudget: variance > 0,
      status: variance <= 0 ? 'good' : variance <= 10 ? 'warning' : 'critical',
    };
  }, [synthese, budgetParCategorie]);

  // Budget par phase (mobilisation vs exploitation)
  const operationalBudget = useMemo(() => {
    const mobilisation = budgetItems.filter(b => b.projectPhase === 'mobilisation');
    const exploitation = budgetItems.filter(b => b.projectPhase === 'exploitation');

    const mobTotal = mobilisation.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
    const mobReel = mobilisation.reduce((sum, b) => sum + (b.montantRealise || 0), 0);

    const expTotal = exploitation.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
    const expReel = exploitation.reduce((sum, b) => sum + (b.montantRealise || 0), 0);

    return {
      mobilisation: {
        prevu: mobTotal,
        reel: mobReel,
        percent: mobTotal > 0 ? Math.round((mobReel / mobTotal) * 100) : 0,
      },
      exploitation: {
        prevu: expTotal,
        reel: expReel,
        percent: expTotal > 0 ? Math.round((expReel / expTotal) * 100) : 0,
      },
    };
  }, [budgetItems]);

  // Formatter en FCFA (XOF) avec séparateur de milliers
  const formatCurrency = (value: number) => {
    if (value === 0 || value === null || value === undefined) {
      return '0 FCFA';
    }
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' FCFA';
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'good':
        return { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', icon: 'text-success-600' };
      case 'warning':
        return { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700', icon: 'text-warning-600' };
      case 'critical':
        return { bg: 'bg-error-50', border: 'border-error-200', text: 'text-error-700', icon: 'text-error-600' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-600' };
    }
  };

  const colors = getStatusColors(budgetData.status);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Budget Total */}
        <Card padding="lg" className={cn(colors.bg, colors.border)}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(budgetData.total)}
              </p>
            </div>
            <div className={cn('p-3 rounded-full', colors.bg)}>
              <DollarSign className={cn('h-6 w-6', colors.icon)} />
            </div>
          </div>
        </Card>

        {/* Consommé */}
        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consommé</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {budgetData.consomme}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(budgetData.total * budgetData.consomme / 100)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary-50">
              <BarChart2 className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                budgetData.consomme <= 80 ? 'bg-success-500' :
                budgetData.consomme <= 100 ? 'bg-warning-500' : 'bg-error-500'
              )}
              style={{ width: `${Math.min(budgetData.consomme, 100)}%` }}
            />
          </div>
        </Card>

        {/* Variance */}
        <Card padding="lg" className={budgetData.isOverBudget ? 'border-error-200' : 'border-success-200'}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Variance</p>
              <p className={cn(
                'text-3xl font-bold mt-1',
                budgetData.isOverBudget ? 'text-error-600' : 'text-success-600'
              )}>
                {budgetData.variance > 0 ? '+' : ''}{budgetData.variance}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {budgetData.isOverBudget ? 'Dépassement' : 'Économie'}
              </p>
            </div>
            <div className={cn(
              'p-3 rounded-full',
              budgetData.isOverBudget ? 'bg-error-50' : 'bg-success-50'
            )}>
              {budgetData.isOverBudget ? (
                <TrendingUp className="h-6 w-6 text-error-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-success-600" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Budget par catégorie */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Répartition par Catégorie</h3>
        </div>

        {budgetData.categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune donnée budgétaire disponible</p>
        ) : (
          <div className="space-y-4">
            {budgetData.categories.map((cat, index) => {
              const percent = cat.prevu > 0 ? Math.round((cat.reel / cat.prevu) * 100) : 0;
              const isOver = percent > 100;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{cat.categorie}</span>
                      {isOver && (
                        <Badge variant="error" size="sm">+{percent - 100}%</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(cat.reel)} / {formatCurrency(cat.prevu)}
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        percent <= 80 ? 'bg-success-500' :
                        percent <= 100 ? 'bg-warning-500' : 'bg-error-500'
                      )}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Budget Mobilisation vs Exploitation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mobilisation */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Budget Mobilisation</h3>
            <Badge variant={operationalBudget.mobilisation.percent <= 100 ? 'success' : 'error'}>
              {operationalBudget.mobilisation.percent}%
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Prévu</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(operationalBudget.mobilisation.prevu)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Réalisé</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(operationalBudget.mobilisation.reel)}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full bg-primary-500 transition-all'
                )}
                style={{ width: `${Math.min(operationalBudget.mobilisation.percent, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Exploitation */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Budget Exploitation</h3>
            <Badge variant={operationalBudget.exploitation.percent <= 100 ? 'success' : 'error'}>
              {operationalBudget.exploitation.percent}%
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Prévu</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(operationalBudget.exploitation.prevu)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Réalisé</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(operationalBudget.exploitation.reel)}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full bg-info-500 transition-all'
                )}
                style={{ width: `${Math.min(operationalBudget.exploitation.percent, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Alertes budgétaires */}
      {budgetData.isOverBudget && (
        <Card className="border-error-200 bg-error-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-error-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-error-700">Alerte Dépassement Budgétaire</h4>
              <p className="text-sm text-error-600 mt-1">
                Le budget est dépassé de {budgetData.variance}%.
                Une révision du plan de dépenses est recommandée.
              </p>
            </div>
          </div>
        </Card>
      )}

      {!budgetData.isOverBudget && budgetData.consomme < 50 && (
        <Card className="border-info-200 bg-info-50">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-info-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-info-700">Budget Maîtrisé</h4>
              <p className="text-sm text-info-600 mt-1">
                La consommation budgétaire est en ligne avec les prévisions.
                Marge disponible : {budgetData.reste}%.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default MonthlyBudget;
