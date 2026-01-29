import { useState } from 'react';
import {
  Building2,
  Wallet,
  Flag,
  Users,
  LayoutDashboard,
  Calendar,
  MapPin,
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useDashboardKPIs, useAvancementGlobal } from '@/hooks';
import { useSync } from '@/hooks/useSync';
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

// Helper to get status color and icon based on progress
function getProgressStatus(value: number) {
  if (value >= 80) return { color: 'text-success-600', bg: 'bg-success-100', icon: CheckCircle, label: 'En bonne voie' };
  if (value >= 50) return { color: 'text-warning-600', bg: 'bg-warning-100', icon: Clock, label: 'En cours' };
  if (value >= 25) return { color: 'text-orange-600', bg: 'bg-orange-100', icon: TrendingUp, label: 'Démarrage' };
  return { color: 'text-primary-600', bg: 'bg-primary-100', icon: Target, label: 'Phase initiale' };
}

export function DashboardPage() {
  const [view, setView] = useState<DashboardView>('operationnel');
  const kpis = useDashboardKPIs();
  const avancementGlobal = useAvancementGlobal();
  const syncData = useSync(1, 'cosmos-angre');

  const budgetPercent =
    kpis.budgetTotal > 0
      ? (kpis.budgetConsomme / kpis.budgetTotal) * 100
      : 0;

  const jalonsPercent =
    kpis.jalonsTotal > 0
      ? (kpis.jalonsAtteints / kpis.jalonsTotal) * 100
      : 0;

  // Calculate days until opening
  const openingDate = new Date('2026-11-15');
  const today = new Date();
  const daysUntilOpening = Math.ceil((openingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Get status based on progress
  const progressStatus = getProgressStatus(avancementGlobal);

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
          {/* Project header - Enhanced */}
          <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left: Project Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Building2 className="h-6 w-6 text-secondary-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      {kpis.projectName}
                    </h2>
                    <p className="text-primary-200 text-sm">
                      Centre commercial premium
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-primary-200">
                    <MapPin className="h-4 w-4" />
                    <span>Angré, Abidjan</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary-200">
                    <Calendar className="h-4 w-4" />
                    <span>Ouverture nov. 2026</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-secondary-400" />
                    <span className="text-secondary-400 font-medium">J-{daysUntilOpening}</span>
                  </div>
                </div>
              </div>

              {/* Center: Main Progress */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <CircularProgress
                    value={avancementGlobal}
                    size={100}
                    strokeWidth={8}
                    variant={
                      avancementGlobal >= 80
                        ? 'success'
                        : avancementGlobal >= 50
                        ? 'warning'
                        : 'default'
                    }
                    className="[&_text]:text-white [&_span]:text-white"
                  />
                </div>
                <div>
                  <p className="text-primary-300 text-xs uppercase tracking-wider mb-1">
                    Avancement Global
                  </p>
                  <p className="text-3xl font-bold">
                    {Math.round(avancementGlobal)}%
                  </p>
                  <div className={cn(
                    'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    progressStatus.bg, progressStatus.color
                  )}>
                    <progressStatus.icon className="h-3 w-3" />
                    {progressStatus.label}
                  </div>
                </div>
              </div>

              {/* Right: Key Metrics */}
              <div className="flex gap-4 lg:gap-6">
                <div className="text-center px-4 py-2 bg-white/5 rounded-lg backdrop-blur-sm">
                  <p className="text-2xl font-bold text-secondary-400">
                    {syncData.syncStatus ? Math.round(syncData.syncStatus.projectProgress) : 0}%
                  </p>
                  <p className="text-xs text-primary-300">Construction</p>
                </div>
                <div className="text-center px-4 py-2 bg-white/5 rounded-lg backdrop-blur-sm">
                  <p className="text-2xl font-bold text-secondary-400">
                    {syncData.syncStatus ? Math.round(syncData.syncStatus.mobilizationProgress) : 0}%
                  </p>
                  <p className="text-xs text-primary-300">Mobilisation</p>
                </div>
                <div className="text-center px-4 py-2 bg-white/5 rounded-lg backdrop-blur-sm">
                  <p className="text-2xl font-bold text-white">
                    {kpis.jalonsAtteints}/{kpis.jalonsTotal}
                  </p>
                  <p className="text-xs text-primary-300">Jalons</p>
                </div>
              </div>
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
