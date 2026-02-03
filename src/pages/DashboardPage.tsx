import { useState, useEffect, useRef } from 'react';
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
  Clock,
  Sparkles,
  BarChart3,
  ListChecks,
  Heart,
  Rocket,
  Activity,
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
  MeteoParAxe,
  JalonsCritiques,
  VueAxe,
  DashboardSkeleton,
  ScoreSante,
} from '@/components/dashboard';
import { useCurrentSite } from '@/hooks/useSites';
import type { Axe } from '@/types';
import { CircularProgress, Tabs, TabsList, TabsTrigger, TabsContent, Card } from '@/components/ui';
import { Proph3tWidget } from '@/components/proph3t';
import { useProph3tHealth } from '@/hooks/useProph3t';

type DashboardView = 'operationnel' | 'copil';
type OperationnelTab = 'synthese' | 'avancement' | 'jalons-actions' | 'sante';

// Helper to get status color and icon based on progress
function getProgressStatus(value: number) {
  if (value >= 80)
    return {
      color: 'text-success-600',
      bg: 'bg-success-100',
      icon: CheckCircle,
      label: 'En bonne voie',
    };
  if (value >= 50)
    return {
      color: 'text-warning-600',
      bg: 'bg-warning-100',
      icon: Clock,
      label: 'En cours',
    };
  if (value >= 25)
    return {
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      icon: TrendingUp,
      label: 'Démarrage',
    };
  return {
    color: 'text-primary-600',
    bg: 'bg-primary-100',
    icon: Target,
    label: 'Phase initiale',
  };
}

// Compact header with all key info in one line
function CompactDashboardHeader({
  kpis,
  avancementGlobal,
  syncData,
  daysUntilOpening,
  isVisible,
  siteLocalisation,
  dateOuvertureFormatee,
  healthScore,
}: {
  kpis: ReturnType<typeof useDashboardKPIs>;
  avancementGlobal: number;
  syncData: ReturnType<typeof useSync>;
  daysUntilOpening: number;
  isVisible: boolean;
  siteLocalisation: string;
  dateOuvertureFormatee: string;
  healthScore: number;
}) {
  const progressStatus = getProgressStatus(avancementGlobal);
  const budgetPercent = kpis.budgetTotal > 0 ? (kpis.budgetConsomme / kpis.budgetTotal) * 100 : 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl shadow-lg flex-shrink-0',
        'opacity-0 translate-y-2',
        isVisible && 'animate-fade-slide-in'
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900" />

      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${20 + i * 30}%`,
              top: '20%',
              animationDelay: `${i * 0.7}s`,
              opacity: 0.03,
            }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        ))}
      </div>

      {/* Content - Single row layout */}
      <div className="relative z-10 px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-4">
          {/* Project name & location */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
              <Building2 className="h-5 w-5 text-secondary-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight truncate">{kpis.projectName}</h2>
              <div className="flex items-center gap-2 text-xs text-primary-300">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{siteLocalisation}</span>
              </div>
            </div>
          </div>

          {/* Countdown badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-secondary-500/30 to-secondary-600/30 rounded-lg border border-secondary-400/30 flex-shrink-0">
            <Rocket className="h-4 w-4 text-secondary-400" />
            <div className="text-center">
              <span className="text-xl font-bold text-white">J-{daysUntilOpening}</span>
              <p className="text-[10px] text-secondary-300 uppercase">Ouverture</p>
            </div>
          </div>

          {/* Main progress circle */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <CircularProgress
              value={avancementGlobal}
              size={56}
              strokeWidth={5}
              variant={avancementGlobal >= 80 ? 'success' : avancementGlobal >= 50 ? 'warning' : 'default'}
              className="[&_text]:text-white [&_span]:text-white [&_text]:text-sm"
            />
            <div>
              <p className="text-[10px] text-primary-300 uppercase tracking-wider">Avancement</p>
              <p className="text-xl font-bold">{Math.round(avancementGlobal)}%</p>
            </div>
          </div>

          {/* Key metrics row */}
          <div className="hidden xl:flex items-center gap-3 flex-shrink-0">
            <MetricBadge
              label="Construction"
              value={`${syncData.syncStatus ? Math.round(syncData.syncStatus.projectProgress) : 0}%`}
              color="secondary"
            />
            <MetricBadge
              label="Mobilisation"
              value={`${syncData.syncStatus ? Math.round(syncData.syncStatus.mobilizationProgress) : 0}%`}
              color="secondary"
            />
            <MetricBadge
              label="Jalons"
              value={`${kpis.jalonsAtteints}/${kpis.jalonsTotal}`}
              color="white"
            />
            <MetricBadge
              label="Budget"
              value={`${Math.round(budgetPercent)}%`}
              color={budgetPercent > 100 ? 'error' : budgetPercent > 90 ? 'warning' : 'success'}
            />
          </div>

          {/* Health score */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg flex-shrink-0">
            <Activity className={cn(
              'h-4 w-4',
              healthScore >= 70 ? 'text-green-400' : healthScore >= 50 ? 'text-amber-400' : 'text-red-400'
            )} />
            <div>
              <span className={cn(
                'text-lg font-bold',
                healthScore >= 70 ? 'text-green-400' : healthScore >= 50 ? 'text-amber-400' : 'text-red-400'
              )}>{healthScore}</span>
              <p className="text-[10px] text-primary-300 uppercase">Santé</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small metric badge component
function MetricBadge({
  label,
  value,
  color
}: {
  label: string;
  value: string;
  color: 'secondary' | 'white' | 'success' | 'warning' | 'error';
}) {
  const colorClasses = {
    secondary: 'text-secondary-400',
    white: 'text-white',
    success: 'text-green-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
  };

  return (
    <div className="text-center px-3 py-1 bg-white/5 rounded-lg border border-white/10">
      <p className={cn('text-sm font-bold', colorClasses[color])}>{value}</p>
      <p className="text-[10px] text-primary-300">{label}</p>
    </div>
  );
}

// View toggle component
function ViewToggle({
  view,
  setView,
  isVisible,
}: {
  view: DashboardView;
  setView: (view: DashboardView) => void;
  isVisible: boolean;
}) {
  return (
    <div
      className={cn(
        'flex gap-4 opacity-0',
        isVisible && 'animate-fade-slide-in'
      )}
    >
      <button
        onClick={() => setView('operationnel')}
        className={cn(
          'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-300 shimmer',
          view === 'operationnel'
            ? 'border-primary-600 bg-primary-50 shadow-lg shadow-primary/10'
            : 'border-primary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md'
        )}
      >
        <div
          className={cn(
            'p-2 rounded-lg transition-all duration-300',
            view === 'operationnel' ? 'bg-primary-600' : 'bg-primary-100'
          )}
        >
          <LayoutDashboard
            className={cn(
              'h-5 w-5 transition-all duration-300',
              view === 'operationnel' ? 'text-white' : 'text-primary-600'
            )}
          />
        </div>
        <div className="text-left">
          <p
            className={cn(
              'font-semibold transition-colors',
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
          'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-300 shimmer',
          view === 'copil'
            ? 'border-primary-600 bg-primary-50 shadow-lg shadow-primary/10'
            : 'border-primary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md'
        )}
      >
        <div
          className={cn(
            'p-2 rounded-lg transition-all duration-300',
            view === 'copil' ? 'bg-primary-600' : 'bg-primary-100'
          )}
        >
          <Users
            className={cn(
              'h-5 w-5 transition-all duration-300',
              view === 'copil' ? 'text-white' : 'text-primary-600'
            )}
          />
        </div>
        <div className="text-left">
          <p
            className={cn(
              'font-semibold transition-colors',
              view === 'copil' ? 'text-primary-900' : 'text-primary-700'
            )}
          >
            Vue COPIL
          </p>
          <p className="text-xs text-primary-500">Comité de Pilotage</p>
        </div>
      </button>
    </div>
  );
}

export function DashboardPage() {
  const [view, setView] = useState<DashboardView>('operationnel');
  const [operationnelTab, setOperationnelTab] = useState<OperationnelTab>('synthese');
  const [selectedAxe, setSelectedAxe] = useState<Axe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const kpis = useDashboardKPIs();
  const avancementGlobal = useAvancementGlobal();
  const syncData = useSync(1, 'cosmos-angre');
  const currentSite = useCurrentSite();

  // Simulate loading and trigger visibility
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setIsVisible(true), 50);
    }, 300);
    return () => clearTimeout(loadingTimeout);
  }, []);

  const budgetPercent =
    kpis.budgetTotal > 0 ? (kpis.budgetConsomme / kpis.budgetTotal) * 100 : 0;

  const jalonsPercent =
    kpis.jalonsTotal > 0 ? (kpis.jalonsAtteints / kpis.jalonsTotal) * 100 : 0;

  // Get opening date from site configuration (database)
  const dateOuverture = currentSite?.dateOuverture || '2026-11-15';
  const openingDate = new Date(dateOuverture);
  const today = new Date();
  const daysUntilOpening = Math.ceil(
    (openingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Format opening date for display
  const dateOuvertureFormatee = openingDate.toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  });

  // Get site location from database
  const siteLocalisation = currentSite?.localisation || 'Abidjan, Côte d\'Ivoire';

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* View Toggle */}
      <ViewToggle view={view} setView={setView} isVisible={isVisible} />

      {/* Content based on view */}
      {view === 'copil' ? (
        <COPILDashboard />
      ) : selectedAxe ? (
        <VueAxe axe={selectedAxe} onBack={() => setSelectedAxe(null)} />
      ) : (
        <>
          {/* Glassmorphism Header - toujours visible */}
          <GlassmorphismHeader
            kpis={kpis}
            avancementGlobal={avancementGlobal}
            syncData={syncData}
            daysUntilOpening={daysUntilOpening}
            isVisible={isVisible}
            siteLocalisation={siteLocalisation}
            dateOuvertureFormatee={dateOuvertureFormatee}
          />

          {/* Onglets du dashboard opérationnel */}
          <Tabs
            value={operationnelTab}
            onValueChange={(v) => setOperationnelTab(v as OperationnelTab)}
            className="space-y-4"
          >
            <TabsList className="w-full justify-start bg-white border border-primary-200 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="synthese" className="flex items-center gap-2 px-4 py-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Synthèse</span>
              </TabsTrigger>
              <TabsTrigger value="avancement" className="flex items-center gap-2 px-4 py-2">
                <BarChart3 className="h-4 w-4" />
                <span>Avancement</span>
              </TabsTrigger>
              <TabsTrigger value="jalons-actions" className="flex items-center gap-2 px-4 py-2">
                <ListChecks className="h-4 w-4" />
                <span>Jalons & Actions</span>
              </TabsTrigger>
              <TabsTrigger value="sante" className="flex items-center gap-2 px-4 py-2">
                <Heart className="h-4 w-4" />
                <span>Santé Projet</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Synthèse - KPIs principaux */}
            <TabsContent value="synthese" className="space-y-6">
              {/* KPIs Grid - Bento Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard
                  title="Taux d'occupation"
                  value={`${Math.round(kpis.tauxOccupation)}%`}
                  subtitle="Surface commerciale"
                  icon={Building2}
                  progress={kpis.tauxOccupation}
                  variant={kpis.tauxOccupation >= 70 ? 'success' : 'warning'}
                  animationDelay={0}
                />

                <KPICard
                  title="Budget consommé"
                  value={formatCurrency(kpis.budgetConsomme)}
                  subtitle={`sur ${formatCurrency(kpis.budgetTotal)}`}
                  icon={Wallet}
                  progress={budgetPercent}
                  variant={
                    budgetPercent > 100
                      ? 'error'
                      : budgetPercent > 90
                        ? 'warning'
                        : 'default'
                  }
                  animationDelay={50}
                />

                <KPICard
                  title="Jalons atteints"
                  value={`${kpis.jalonsAtteints}/${kpis.jalonsTotal}`}
                  subtitle={formatPercent(jalonsPercent)}
                  icon={Flag}
                  progress={jalonsPercent}
                  variant={jalonsPercent >= 80 ? 'success' : 'default'}
                  animationDelay={100}
                />

                <KPICard
                  title="Équipe projet"
                  value={kpis.equipeTaille}
                  subtitle="membres actifs"
                  icon={Users}
                  variant="default"
                  animationDelay={150}
                />

                <IndicateurSynchronisation />
              </div>

              {/* Compte à rebours */}
              <CompteARebours dateOuverture={dateOuverture} />

              {/* Météo Projet compact */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MeteoProjetCard />
                <ScoreSante />
              </div>
            </TabsContent>

            {/* Onglet Avancement - Progression par axe */}
            <TabsContent value="avancement" className="space-y-6">
              {/* Météo par Axe - cliquable */}
              <MeteoParAxe onAxeClick={setSelectedAxe} />

              {/* Avancement par Axe */}
              <AvancementAxes />
            </TabsContent>

            {/* Onglet Jalons & Actions */}
            <TabsContent value="jalons-actions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Jalons Critiques */}
                <JalonsCritiques />

                {/* Prochains Jalons */}
                <ProchainsJalons />
              </div>

              {/* Actions en retard */}
              <ActionsEnRetard />
            </TabsContent>

            {/* Onglet Santé Projet - Indicateurs et IA */}
            <TabsContent value="sante" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score de Santé */}
                <ScoreSante />

                {/* Météo Projet */}
                <MeteoProjetCard />
              </div>

              {/* Proph3t Widget */}
              <Proph3tWidget
                variant="card"
                showChat={true}
                showHealth={true}
                showRecommendations={true}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
