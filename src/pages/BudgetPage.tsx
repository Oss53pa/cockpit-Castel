import { useState } from 'react';
import {
  Rocket,
  Building2,
  Calculator,
  Wallet,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BudgetMobilisation, BudgetOperationnel, BudgetPhaseDetail, BudgetExploitation2027 } from '@/components/budget';
import { PROJET_CONFIG } from '@/data/constants';

type BudgetType = 'mobilisation' | 'operationnel' | 'exploitation2027' | 'estimatif';

export function BudgetPage() {
  const [budgetType, setBudgetType] = useState<BudgetType>('mobilisation');

  return (
    <div className="space-y-6">
      {/* Header avec titre */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Wallet className="h-6 w-6 text-primary-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Gestion du Budget</h1>
          <p className="text-sm text-primary-500">
            {`Suivi budgetaire et financier du projet ${PROJET_CONFIG.nom}`}
          </p>
        </div>
      </div>

      {/* Selecteur de type de budget */}
      <div className="flex gap-4">
        <button
          onClick={() => setBudgetType('mobilisation')}
          className={cn(
            'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all flex-1',
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
            <p className="text-xs text-primary-500">Lancement et demarrage</p>
          </div>
        </button>

        <button
          onClick={() => setBudgetType('operationnel')}
          className={cn(
            'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all flex-1',
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
              Budget Operationnel
            </p>
            <p className="text-xs text-primary-500">Fonctionnement annuel</p>
          </div>
        </button>

        <button
          onClick={() => setBudgetType('exploitation2027')}
          className={cn(
            'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all flex-1',
            budgetType === 'exploitation2027'
              ? 'border-amber-600 bg-amber-50 shadow-md'
              : 'border-primary-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
          )}
        >
          <div
            className={cn(
              'p-2 rounded-lg',
              budgetType === 'exploitation2027' ? 'bg-amber-600' : 'bg-amber-100'
            )}
          >
            <Calendar
              className={cn(
                'h-5 w-5',
                budgetType === 'exploitation2027' ? 'text-white' : 'text-amber-600'
              )}
            />
          </div>
          <div className="text-left">
            <p
              className={cn(
                'font-semibold',
                budgetType === 'exploitation2027' ? 'text-amber-900' : 'text-amber-700'
              )}
            >
              Exploitation 2027
            </p>
            <p className="text-xs text-amber-500">761 M FCFA annuel</p>
          </div>
        </button>

        <button
          onClick={() => setBudgetType('estimatif')}
          className={cn(
            'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all flex-1',
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

      {/* Contenu du budget selectionne */}
      {budgetType === 'mobilisation' ? (
        <BudgetMobilisation />
      ) : budgetType === 'operationnel' ? (
        <BudgetOperationnel />
      ) : budgetType === 'exploitation2027' ? (
        <BudgetExploitation2027 />
      ) : (
        <BudgetPhaseDetail />
      )}
    </div>
  );
}
