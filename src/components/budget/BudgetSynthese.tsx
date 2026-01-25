import { Wallet, ArrowDownLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, Progress } from '@/components/ui';
import { useBudgetSynthese } from '@/hooks';
import { formatCurrency } from '@/lib/utils';

export function BudgetSynthese() {
  const synthese = useBudgetSynthese();

  const items = [
    {
      label: 'Budget prévu',
      value: synthese.prevu,
      icon: Wallet,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      label: 'Engagé',
      value: synthese.engage,
      icon: ArrowDownLeft,
      color: 'text-info-600',
      bgColor: 'bg-info-100',
      percent: synthese.tauxEngagement,
    },
    {
      label: 'Réalisé',
      value: synthese.realise,
      icon: CheckCircle,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
      percent: synthese.tauxRealisation,
    },
  ];

  const ecartEngagement = synthese.prevu - synthese.engage;
  const ecartRealisation = synthese.prevu - synthese.realise;

  return (
    <Card padding="md">
      <h3 className="text-lg font-semibold text-primary-900 mb-4">
        Synthèse budgétaire
      </h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className={cn('inline-flex rounded-lg p-2 mb-2', item.bgColor)}>
              <item.icon className={cn('h-5 w-5', item.color)} />
            </div>
            <p className="text-2xl font-bold text-primary-900">
              {formatCurrency(item.value)}
            </p>
            <p className="text-sm text-primary-500">{item.label}</p>
            {item.percent !== undefined && (
              <p className="text-xs text-primary-400 mt-1">
                {item.percent.toFixed(1)}%
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-primary-600">Taux d'engagement</span>
            <span className="font-medium">{synthese.tauxEngagement.toFixed(1)}%</span>
          </div>
          <Progress
            value={synthese.tauxEngagement}
            variant={synthese.tauxEngagement > 100 ? 'error' : 'default'}
            size="md"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-primary-600">Taux de réalisation</span>
            <span className="font-medium">{synthese.tauxRealisation.toFixed(1)}%</span>
          </div>
          <Progress
            value={synthese.tauxRealisation}
            variant={synthese.tauxRealisation > 100 ? 'error' : 'success'}
            size="md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
        <div className="text-center">
          <p className="text-xs text-primary-400">Écart engagement</p>
          <p
            className={cn(
              'text-lg font-semibold',
              ecartEngagement >= 0 ? 'text-success-600' : 'text-error-600'
            )}
          >
            {ecartEngagement >= 0 ? '+' : ''}
            {formatCurrency(ecartEngagement)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-primary-400">Écart réalisation</p>
          <p
            className={cn(
              'text-lg font-semibold',
              ecartRealisation >= 0 ? 'text-success-600' : 'text-error-600'
            )}
          >
            {ecartRealisation >= 0 ? '+' : ''}
            {formatCurrency(ecartRealisation)}
          </p>
        </div>
      </div>
    </Card>
  );
}
