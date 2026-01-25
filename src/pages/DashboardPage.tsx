import { useState } from 'react';
import {
  Building2,
  Wallet,
  Flag,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import { useDashboardKPIs, useAvancementGlobal } from '@/hooks';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import {
  KPICard,
  MeteoProjetCard,
  AvancementAxes,
  ProchainsJalons,
  ActionsEnRetard,
  IndicateurSynchronisation,
  COPILDashboard,
} from '@/components/dashboard';
import { CircularProgress } from '@/components/ui';
import { Proph3tWidget } from '@/components/proph3t';

type DashboardView = 'operationnel' | 'copil';

export function DashboardPage() {
  const [view, setView] = useState<DashboardView>('operationnel');
  const kpis = useDashboardKPIs();
  const avancementGlobal = useAvancementGlobal();

  const budgetPercent =
    kpis.budgetTotal > 0
      ? (kpis.budgetConsomme / kpis.budgetTotal) * 100
      : 0;

  const jalonsPercent =
    kpis.jalonsTotal > 0
      ? (kpis.jalonsAtteints / kpis.jalonsTotal) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Sélecteur de vue */}
      <div className="flex gap-4">
        <button
          onClick={() => setView('operationnel')}
          className={cn(
            'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all',
            view === 'operationnel'
              ? 'border-primary-600 bg-primary-50 shadow-md'
              : 'border-primary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
          )}
        >
          <div
            className={cn(
              'p-2 rounded-lg',
              view === 'operationnel' ? 'bg-primary-600' : 'bg-primary-100'
            )}
          >
            <LayoutDashboard
              className={cn(
                'h-5 w-5',
                view === 'operationnel' ? 'text-white' : 'text-primary-600'
              )}
            />
          </div>
          <div className="text-left">
            <p
              className={cn(
                'font-semibold',
                view === 'operationnel' ? 'text-primary-900' : 'text-primary-700'
              )}
            >
              Vue Opérationnelle
            </p>
            <p className="text-xs text-primary-500">Suivi quotidien du projet</p>
          </div>
        </button>

        <button
          onClick={() => setView('copil')}
          className={cn(
            'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all',
            view === 'copil'
              ? 'border-primary-600 bg-primary-50 shadow-md'
              : 'border-primary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
          )}
        >
          <div
            className={cn(
              'p-2 rounded-lg',
              view === 'copil' ? 'bg-primary-600' : 'bg-primary-100'
            )}
          >
            <Users
              className={cn(
                'h-5 w-5',
                view === 'copil' ? 'text-white' : 'text-primary-600'
              )}
            />
          </div>
          <div className="text-left">
            <p
              className={cn(
                'font-semibold',
                view === 'copil' ? 'text-primary-900' : 'text-primary-700'
              )}
            >
              Vue COPIL
            </p>
            <p className="text-xs text-primary-500">Comité de Pilotage</p>
          </div>
        </button>
      </div>

      {/* Contenu selon la vue */}
      {view === 'copil' ? (
        <COPILDashboard />
      ) : (
        <>
          {/* Project header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary-900">
                {kpis.projectName}
              </h2>
              <p className="text-sm text-primary-500">
                Centre commercial — Ouverture prévue nov. 2026
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-primary-500">Avancement global</p>
                <p className="text-2xl font-bold text-primary-900">
                  {Math.round(avancementGlobal)}%
                </p>
              </div>
              <CircularProgress
                value={avancementGlobal}
                size={64}
                strokeWidth={6}
                variant={
                  avancementGlobal >= 80
                    ? 'success'
                    : avancementGlobal >= 50
                    ? 'warning'
                    : 'default'
                }
              />
            </div>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="Taux d'occupation"
              value={`${Math.round(kpis.tauxOccupation)}%`}
              subtitle="Surface commerciale"
              icon={Building2}
              progress={kpis.tauxOccupation}
              variant={kpis.tauxOccupation >= 70 ? 'success' : 'warning'}
            />

            <KPICard
              title="Budget consommé"
              value={formatCurrency(kpis.budgetConsomme)}
              subtitle={`sur ${formatCurrency(kpis.budgetTotal)}`}
              icon={Wallet}
              progress={budgetPercent}
              variant={budgetPercent > 100 ? 'error' : budgetPercent > 90 ? 'warning' : 'default'}
            />

            <KPICard
              title="Jalons atteints"
              value={`${kpis.jalonsAtteints}/${kpis.jalonsTotal}`}
              subtitle={formatPercent(jalonsPercent)}
              icon={Flag}
              progress={jalonsPercent}
              variant={jalonsPercent >= 80 ? 'success' : 'default'}
            />

            <KPICard
              title="Équipe projet"
              value={kpis.equipeTaille}
              subtitle="membres actifs"
              icon={Users}
              variant="default"
            />

            <IndicateurSynchronisation />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <AvancementAxes />
              <ActionsEnRetard />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <MeteoProjetCard />
              <Proph3tWidget variant="card" showChat={true} showHealth={true} showRecommendations={true} />
              <ProchainsJalons />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
