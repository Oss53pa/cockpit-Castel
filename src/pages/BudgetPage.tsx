import { useState } from 'react';
import { Rocket, Building2, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BudgetMobilisation, BudgetOperationnel, BudgetPhaseDetail } from '@/components/budget';

type BudgetType = 'mobilisation' | 'operationnel' | 'estimatif';

export function BudgetPage() {
  const [budgetType, setBudgetType] = useState<BudgetType>('mobilisation');

  return (
    <div className="space-y-6">
      {/* Sélecteur de type de budget */}
      <div className="flex gap-4">
        <button
          onClick={() => setBudgetType('mobilisation')}
          className={cn(
            'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all',
            budgetType === 'mobilisation'
              ? 'border-primary-600 bg-primary-50 shadow-md'
              : 'border-primary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
          )}
        >
          <div
            className={cn(
              'p-2 rounded-lg',
              budgetType === 'mobilisation' ? 'bg-primary-600' : 'bg-primary-100'
            )}
          >
            <Rocket
              className={cn(
                'h-5 w-5',
                budgetType === 'mobilisation' ? 'text-white' : 'text-primary-600'
              )}
            />
          </div>
          <div className="text-left">
            <p
              className={cn(
                'font-semibold',
                budgetType === 'mobilisation' ? 'text-primary-900' : 'text-primary-700'
              )}
            >
              Budget Mobilisation
            </p>
            <p className="text-xs text-primary-500">Lancement et démarrage</p>
          </div>
        </button>

        <button
          onClick={() => setBudgetType('operationnel')}
          className={cn(
            'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all',
            budgetType === 'operationnel'
              ? 'border-primary-600 bg-primary-50 shadow-md'
              : 'border-primary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
          )}
        >
          <div
            className={cn(
              'p-2 rounded-lg',
              budgetType === 'operationnel' ? 'bg-primary-600' : 'bg-primary-100'
            )}
          >
            <Building2
              className={cn(
                'h-5 w-5',
                budgetType === 'operationnel' ? 'text-white' : 'text-primary-600'
              )}
            />
          </div>
          <div className="text-left">
            <p
              className={cn(
                'font-semibold',
                budgetType === 'operationnel' ? 'text-primary-900' : 'text-primary-700'
              )}
            >
              Budget Opérationnel
            </p>
            <p className="text-xs text-primary-500">Fonctionnement annuel</p>
          </div>
        </button>

        <button
          onClick={() => setBudgetType('estimatif')}
          className={cn(
            'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all',
            budgetType === 'estimatif'
              ? 'border-primary-600 bg-primary-50 shadow-md'
              : 'border-primary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
          )}
        >
          <div
            className={cn(
              'p-2 rounded-lg',
              budgetType === 'estimatif' ? 'bg-primary-600' : 'bg-primary-100'
            )}
          >
            <Calculator
              className={cn(
                'h-5 w-5',
                budgetType === 'estimatif' ? 'text-white' : 'text-primary-600'
              )}
            />
          </div>
          <div className="text-left">
            <p
              className={cn(
                'font-semibold',
                budgetType === 'estimatif' ? 'text-primary-900' : 'text-primary-700'
              )}
            >
              Budget Estimatif
            </p>
            <p className="text-xs text-primary-500">1,85 Mds FCFA par phase</p>
          </div>
        </button>
      </div>

      {/* Contenu du budget sélectionné */}
      {budgetType === 'mobilisation' ? (
        <BudgetMobilisation />
      ) : budgetType === 'operationnel' ? (
        <BudgetOperationnel />
      ) : (
        <BudgetPhaseDetail />
      )}
    </div>
  );
}
