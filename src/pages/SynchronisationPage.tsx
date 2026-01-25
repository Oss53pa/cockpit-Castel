import { useState, useMemo } from 'react';
import {
  Building2,
  ShoppingBag,
  Link2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Calendar,
  Clock,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Trash2,
  Play,
  Pause,
  Info,
  Zap,
  BarChart3,
  GitBranch,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { SyncDashboard } from '@/components/sync';
import { cn } from '@/lib/utils';
import {
  Card,
  Badge,
  Button,
  Progress,
  Input,
  Select,
  SelectOption,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui';
import {
  useSynchronisationMetrics,
  useSynchronisationDetails,
  useLiensSync,
  useActions,
  createLienSync,
  deleteLienSync,
  updateLienSync,
  calculerPropagationRetard,
  appliquerPropagationRetard,
  analyzeAutoLinkSuggestions,
  autoLinkActions,
  resetAndAutoLink,
  type AutoLinkSuggestion,
} from '@/hooks';
import {
  SYNC_STATUS_LABELS,
  SYNC_STATUS_STYLES,
  type SyncStatus,
  type Action,
  type PropagationRetard,
} from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
} from 'recharts';

// ============================================================================
// COMPONENTS
// ============================================================================

interface SyncStatusBadgeProps {
  status: SyncStatus;
  size?: 'sm' | 'md' | 'lg';
}

function SyncStatusBadge({ status, size = 'md' }: SyncStatusBadgeProps) {
  const styles = SYNC_STATUS_STYLES[status];
  const label = SYNC_STATUS_LABELS[status];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        styles.bg,
        styles.text,
        styles.border,
        sizeClasses[size]
      )}
    >
      {status === 'en_phase' && <CheckCircle className="w-4 h-4" />}
      {status === 'critique' && <XCircle className="w-4 h-4" />}
      {(status === 'en_avance' || status === 'en_retard') && <AlertTriangle className="w-4 h-4" />}
      {label}
    </span>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Building2;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}) {
  return (
    <Card padding="md" className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-xl', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend && (
        <div className="absolute bottom-2 right-2">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-primary-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-primary-500" />}
          {trend === 'stable' && <Minus className="w-4 h-4 text-neutral-400" />}
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export function SynchronisationPage() {
  // Mode: 'projet' = nouveau dashboard Projet vs Mobilisation, 'actions' = ancien module liens/propagation
  const [viewMode, setViewMode] = useState<'projet' | 'actions'>('projet');
  const [activeTab, setActiveTab] = useState<'overview' | 'liens' | 'propagation' | 'timeline' | 'config'>('overview');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showPropagationModal, setShowPropagationModal] = useState(false);
  const [selectedActionTechnique, setSelectedActionTechnique] = useState<string>('');
  const [selectedActionMobilisation, setSelectedActionMobilisation] = useState<string>('');
  const [propagationData, setPropagationData] = useState<PropagationRetard | null>(null);
  const [searchTechnique, setSearchTechnique] = useState('');
  const [searchMobilisation, setSearchMobilisation] = useState('');
  const [expandedLien, setExpandedLien] = useState<number | null>(null);
  const [showAutoLinkModal, setShowAutoLinkModal] = useState(false);
  const [autoLinkSuggestions, setAutoLinkSuggestions] = useState<AutoLinkSuggestion[]>([]);
  const [autoLinkLoading, setAutoLinkLoading] = useState(false);
  const [autoLinkMinScore, setAutoLinkMinScore] = useState(40);

  // Hooks
  const metrics = useSynchronisationMetrics();
  const details = useSynchronisationDetails();
  const liens = useLiensSync();
  const allActions = useActions();

  // Actions filtrées par type
  const actionsTechniques = useMemo(
    () => allActions.filter((a) => a.axe === 'axe3_technique'),
    [allActions]
  );
  const actionsMobilisation = useMemo(
    () => allActions.filter((a) => a.axe === 'axe2_commercial'),
    [allActions]
  );

  // Actions en retard
  const today = new Date().toISOString().split('T')[0];
  const actionsTechniquesEnRetard = actionsTechniques.filter(
    (a) => a.statut !== 'termine' && a.date_fin_prevue < today
  );

  // Données pour les graphiques
  const comparisonChartData = [
    {
      name: 'Technique (Chantier)',
      avancement: details.technique.avancement,
      terminees: details.technique.terminees,
      enRetard: details.technique.enRetard,
      total: details.technique.total,
    },
    {
      name: 'Mobilisation',
      avancement: details.mobilisation.avancement,
      terminees: details.mobilisation.terminees,
      enRetard: details.mobilisation.enRetard,
      total: details.mobilisation.total,
    },
  ];

  // Timeline data (simulation)
  const timelineData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months.map((month, index) => ({
      month,
      technique: Math.min(100, (index + 1) * 8 + Math.random() * 5),
      mobilisation: Math.min(100, (index + 1) * 8 + Math.random() * 5 + (metrics.ecart_points / 2)),
    }));
  }, [metrics.ecart_points]);

  // Handlers
  const handleCreateLink = async () => {
    if (selectedActionTechnique && selectedActionMobilisation) {
      await createLienSync(selectedActionTechnique, selectedActionMobilisation, true);
      setShowLinkModal(false);
      setSelectedActionTechnique('');
      setSelectedActionMobilisation('');
    }
  };

  const handleDeleteLink = async (id: number) => {
    await deleteLienSync(id);
  };

  const handleTogglePropagation = async (id: number, current: boolean) => {
    await updateLienSync(id, !current);
  };

  const handleCheckPropagation = async (actionId: string) => {
    const action = actionsTechniquesEnRetard.find((a) => a.id_action === actionId);
    if (action) {
      const dateFin = new Date(action.date_fin_prevue);
      const retardJours = Math.ceil((new Date().getTime() - dateFin.getTime()) / (1000 * 60 * 60 * 24));
      const propagation = await calculerPropagationRetard(actionId, retardJours);
      if (propagation) {
        setPropagationData(propagation);
        setShowPropagationModal(true);
      }
    }
  };

  const handleApplyPropagation = async () => {
    if (propagationData) {
      await appliquerPropagationRetard(propagationData);
      setShowPropagationModal(false);
      setPropagationData(null);
    }
  };

  // Auto-linking handlers
  const handleAnalyzeAutoLink = async () => {
    setAutoLinkLoading(true);
    try {
      const suggestions = await analyzeAutoLinkSuggestions();
      setAutoLinkSuggestions(suggestions);
      setShowAutoLinkModal(true);
    } finally {
      setAutoLinkLoading(false);
    }
  };

  const handleApplyAutoLink = async () => {
    setAutoLinkLoading(true);
    try {
      await autoLinkActions(autoLinkMinScore);
      setShowAutoLinkModal(false);
      setAutoLinkSuggestions([]);
    } finally {
      setAutoLinkLoading(false);
    }
  };

  const handleResetAndAutoLink = async () => {
    setAutoLinkLoading(true);
    try {
      await resetAndAutoLink(autoLinkMinScore);
      setShowAutoLinkModal(false);
      setAutoLinkSuggestions([]);
    } finally {
      setAutoLinkLoading(false);
    }
  };

  // Filtrer les actions liées
  const getLinkedActions = (actionId: string, type: 'technique' | 'mobilisation') => {
    if (type === 'technique') {
      return liens
        .filter((l) => l.action_technique_id === actionId)
        .map((l) => actionsMobilisation.find((a) => a.id_action === l.action_mobilisation_id))
        .filter(Boolean) as Action[];
    } else {
      return liens
        .filter((l) => l.action_mobilisation_id === actionId)
        .map((l) => actionsTechniques.find((a) => a.id_action === l.action_technique_id))
        .filter(Boolean) as Action[];
    }
  };

  // Si mode "projet", afficher le nouveau SyncDashboard
  if (viewMode === 'projet') {
    return (
      <div className="space-y-6">
        {/* Header avec toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Synchronisation Projet / Mobilisation
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Suivez l'alignement entre l'avancement du projet de construction et la mobilisation opérationnelle
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle entre les deux modes */}
            <div className="flex items-center bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('projet')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'projet'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Layers className="w-4 h-4" />
                Projet vs Mobilisation
              </button>
              <button
                onClick={() => setViewMode('actions')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'actions'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Link2 className="w-4 h-4" />
                Liens Actions
              </button>
            </div>
          </div>
        </div>

        {/* Nouveau SyncDashboard */}
        <SyncDashboard projectId="cosmos-angre" />
      </div>
    );
  }

  // Mode "actions" : ancien module de synchronisation des liens
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">
            Synchronisation Chantier / Mobilisation
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Alignez l'avancement du chantier avec les actions de mobilisation pour optimiser les ressources
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle entre les deux modes */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('projet')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                viewMode === 'projet'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <Layers className="w-4 h-4" />
              Projet vs Mobilisation
            </button>
            <button
              onClick={() => setViewMode('actions')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                viewMode === 'actions'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <Link2 className="w-4 h-4" />
              Liens Actions
            </button>
          </div>
          <SyncStatusBadge status={metrics.sync_status} size="lg" />
        </div>
      </div>

      {/* Alertes de risque */}
      {(metrics.risque_gaspillage || metrics.risque_retard_ouverture) && (
        <Card
          padding="md"
          className={cn(
            'border-l-4',
            metrics.risque_retard_ouverture
              ? 'border-l-red-500 bg-red-50'
              : 'border-l-orange-500 bg-orange-50'
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'p-2 rounded-lg',
                metrics.risque_retard_ouverture ? 'bg-red-100' : 'bg-orange-100'
              )}
            >
              <AlertTriangle
                className={cn(
                  'w-6 h-6',
                  metrics.risque_retard_ouverture ? 'text-red-600' : 'text-orange-600'
                )}
              />
            </div>
            <div className="flex-1">
              <h3
                className={cn(
                  'font-semibold text-lg',
                  metrics.risque_retard_ouverture ? 'text-red-800' : 'text-orange-800'
                )}
              >
                {metrics.risque_retard_ouverture
                  ? 'Risque de retard ouverture'
                  : 'Risque de gaspillage de ressources'}
              </h3>
              <p
                className={cn(
                  'mt-1',
                  metrics.risque_retard_ouverture ? 'text-red-700' : 'text-orange-700'
                )}
              >
                {metrics.risque_retard_ouverture
                  ? `Le chantier technique est en retard de ${Math.abs(metrics.ecart_points)} points par rapport à la mobilisation. Recommandation: décaler les actions de mobilisation.`
                  : `La mobilisation est en avance de ${metrics.ecart_points} points sur le chantier. Recommandation: ralentir la mobilisation pour éviter des coûts prématurés.`}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className={cn(
                    metrics.risque_retard_ouverture
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  )}
                  onClick={() => setActiveTab('propagation')}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Voir les actions à décaler
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('liens')}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Gérer les liens
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard
          title="Avancement Technique"
          value={`${Math.round(metrics.avancement_technique)}%`}
          subtitle="Chantier (AXE 3)"
          icon={Building2}
          color="bg-blue-500"
        />
        <KPICard
          title="Avancement Mobilisation"
          value={`${Math.round(metrics.avancement_mobilisation)}%`}
          subtitle="Commercial (AXE 2)"
          icon={ShoppingBag}
          color="bg-purple-500"
        />
        <KPICard
          title="Écart"
          value={`${metrics.ecart_points > 0 ? '+' : ''}${Math.round(metrics.ecart_points)} pts`}
          subtitle="Mobilisation - Technique"
          icon={metrics.ecart_points > 0 ? TrendingUp : metrics.ecart_points < 0 ? TrendingDown : Minus}
          color={
            Math.abs(metrics.ecart_points) > 15
              ? 'bg-red-500'
              : Math.abs(metrics.ecart_points) > 10
              ? 'bg-orange-500'
              : 'bg-green-500'
          }
        />
        <KPICard
          title="Liens actifs"
          value={details.liens.total}
          subtitle={`${details.liens.avecPropagation} avec propagation`}
          icon={Link2}
          color="bg-indigo-500"
        />
        <KPICard
          title="Actions en retard"
          value={details.technique.enRetard + details.mobilisation.enRetard}
          subtitle={`${details.technique.enRetard} tech. / ${details.mobilisation.enRetard} mob.`}
          icon={Clock}
          color="bg-red-500"
        />
        <KPICard
          title="Actions terminées"
          value={details.technique.terminees + details.mobilisation.terminees}
          subtitle={`sur ${details.technique.total + details.mobilisation.total}`}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="liens" className="gap-2">
            <Link2 className="w-4 h-4" />
            Liens
            {details.liens.total > 0 && (
              <Badge variant="secondary">{details.liens.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="propagation" className="gap-2">
            <GitBranch className="w-4 h-4" />
            Propagation
            {actionsTechniquesEnRetard.length > 0 && (
              <Badge variant="warning">{actionsTechniquesEnRetard.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Tab: Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique comparatif */}
            <Card padding="md">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Comparaison des avancements
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonChartData} layout="vertical" barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${Math.round(value)}%`, 'Avancement']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="avancement" radius={[0, 4, 4, 0]} maxBarSize={40}>
                      <Cell fill="#3b82f6" />
                      <Cell fill="#a855f7" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Statistiques détaillées */}
            <Card padding="md">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Statistiques détaillées
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Technique */}
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-primary-600" />
                      <span className="font-medium text-blue-900">Technique</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Total actions</span>
                        <span className="font-semibold text-blue-900">{details.technique.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Terminées</span>
                        <span className="font-semibold text-green-600">{details.technique.terminees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">En retard</span>
                        <span className="font-semibold text-red-600">{details.technique.enRetard}</span>
                      </div>
                      <Progress
                        value={details.technique.avancement}
                        variant="default"
                        size="md"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Mobilisation */}
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingBag className="w-5 h-5 text-primary-600" />
                      <span className="font-medium text-purple-900">Mobilisation</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Total actions</span>
                        <span className="font-semibold text-purple-900">{details.mobilisation.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Terminées</span>
                        <span className="font-semibold text-green-600">{details.mobilisation.terminees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">En retard</span>
                        <span className="font-semibold text-red-600">{details.mobilisation.enRetard}</span>
                      </div>
                      <Progress
                        value={details.mobilisation.avancement}
                        variant="default"
                        size="md"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Jauge d'écart */}
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-neutral-700">Écart de synchronisation</span>
                    <span
                      className={cn(
                        'font-bold',
                        Math.abs(metrics.ecart_points) > 15
                          ? 'text-red-600'
                          : Math.abs(metrics.ecart_points) > 10
                          ? 'text-orange-600'
                          : 'text-green-600'
                      )}
                    >
                      {metrics.ecart_points > 0 ? '+' : ''}{Math.round(metrics.ecart_points)} points
                    </span>
                  </div>
                  <div className="relative h-6 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-neutral-400 z-10" />
                    <div
                      className={cn(
                        'absolute inset-y-0 transition-all',
                        metrics.ecart_points >= 0 ? 'left-1/2' : 'right-1/2',
                        Math.abs(metrics.ecart_points) > 15
                          ? 'bg-red-500'
                          : Math.abs(metrics.ecart_points) > 10
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      )}
                      style={{
                        width: `${Math.min(Math.abs(metrics.ecart_points), 50)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-neutral-500">
                    <span>-50 pts (Retard mob.)</span>
                    <span>0</span>
                    <span>+50 pts (Avance mob.)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Timeline prévisionnelle */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Projection des avancements
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(value: number) => [`${Math.round(value)}%`]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="technique"
                    name="Technique"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="mobilisation"
                    name="Mobilisation"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Liens */}
        <TabsContent value="liens" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Gestion des liens</h3>
              <p className="text-sm text-neutral-500">
                Liez les actions techniques aux actions de mobilisation pour propager automatiquement les retards
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleAnalyzeAutoLink}
                disabled={autoLinkLoading}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 border-0"
              >
                {autoLinkLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Auto-lier par IA
              </Button>
              <Button variant="primary" onClick={() => setShowLinkModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un lien
              </Button>
            </div>
          </div>

          {liens.length === 0 ? (
            <Card padding="lg" className="text-center">
              <Link2 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h4 className="font-semibold text-neutral-900 mb-2">Aucun lien configuré</h4>
              <p className="text-neutral-500 mb-6">
                Créez des liens entre les actions du chantier et celles de mobilisation pour activer la propagation automatique des retards
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  onClick={handleAnalyzeAutoLink}
                  disabled={autoLinkLoading}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 border-0"
                >
                  {autoLinkLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Créer automatiquement par IA
                </Button>
                <span className="text-neutral-400">ou</span>
                <Button variant="primary" onClick={() => setShowLinkModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer manuellement
                </Button>
              </div>
            </Card>
          ) : (
            <Card padding="none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Action Technique</TableHead>
                    <TableHead className="w-12 text-center">
                      <ArrowRight className="w-4 h-4 mx-auto" />
                    </TableHead>
                    <TableHead>Action Mobilisation</TableHead>
                    <TableHead className="text-center">Propagation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liens.map((lien) => {
                    const actionTech = actionsTechniques.find(
                      (a) => a.id_action === lien.action_technique_id
                    );
                    const actionMob = actionsMobilisation.find(
                      (a) => a.id_action === lien.action_mobilisation_id
                    );

                    return (
                      <TableRow key={lien.id}>
                        <TableCell>
                          <button
                            onClick={() => setExpandedLien(expandedLien === lien.id ? null : lien.id!)}
                            className="p-1 hover:bg-neutral-100 rounded"
                          >
                            {expandedLien === lien.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-neutral-900">{actionTech?.titre || 'Action supprimée'}</p>
                            <p className="text-xs text-neutral-500">{actionTech?.id_action}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link2 className="w-4 h-4 text-neutral-400 mx-auto" />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-neutral-900">{actionMob?.titre || 'Action supprimée'}</p>
                            <p className="text-xs text-neutral-500">{actionMob?.id_action}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant={lien.propagation_retard ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => handleTogglePropagation(lien.id!, lien.propagation_retard)}
                          >
                            {lien.propagation_retard ? (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <Pause className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteLink(lien.id!)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Propagation */}
        <TabsContent value="propagation" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Propagation des retards</h3>
            <p className="text-sm text-neutral-500">
              Actions techniques en retard pouvant impacter les actions de mobilisation liées
            </p>
          </div>

          {actionsTechniquesEnRetard.length === 0 ? (
            <Card padding="lg" className="text-center">
              <CheckCircle className="w-16 h-16 text-primary-300 mx-auto mb-4" />
              <h4 className="font-semibold text-neutral-900 mb-2">Aucune action en retard</h4>
              <p className="text-neutral-500">
                Toutes les actions techniques sont dans les temps
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {actionsTechniquesEnRetard.map((action) => {
                const dateFin = new Date(action.date_fin_prevue);
                const retardJours = Math.ceil(
                  (new Date().getTime() - dateFin.getTime()) / (1000 * 60 * 60 * 24)
                );
                const linkedActions = getLinkedActions(action.id_action, 'technique');

                return (
                  <Card key={action.id_action} padding="md" className="border-l-4 border-l-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="error">Retard: {retardJours} jour(s)</Badge>
                          <span className="text-xs text-neutral-500">{action.id_action}</span>
                        </div>
                        <h4 className="font-semibold text-neutral-900">{action.titre}</h4>
                        <p className="text-sm text-neutral-500 mt-1">
                          Date fin prévue: {new Date(action.date_fin_prevue).toLocaleDateString('fr-FR')}
                        </p>

                        {linkedActions.length > 0 && (
                          <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm font-medium text-orange-800 mb-2">
                              {linkedActions.length} action(s) de mobilisation liée(s) :
                            </p>
                            <ul className="space-y-1">
                              {linkedActions.map((a) => (
                                <li key={a.id_action} className="text-sm text-orange-700 flex items-center gap-2">
                                  <ArrowRight className="w-3 h-3" />
                                  {a.titre}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleCheckPropagation(action.id_action)}
                        disabled={linkedActions.length === 0}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Propager le retard
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Timeline */}
        <TabsContent value="timeline" className="space-y-6">
          <Card padding="md">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Évolution comparative
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(value: number) => [`${Math.round(value)}%`]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="technique"
                    name="Technique (Chantier)"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mobilisation"
                    name="Mobilisation"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ fill: '#a855f7', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="p-4 bg-blue-50 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Comment lire ce graphique ?</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Les courbes doivent idéalement être proches l'une de l'autre</li>
                <li>Si la courbe Mobilisation est au-dessus, vous risquez de gaspiller des ressources</li>
                <li>Si la courbe Technique est au-dessus, vous risquez de ne pas être prêt pour l'ouverture</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Configuration */}
        <TabsContent value="config" className="space-y-6">
          <Card padding="md">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Seuils d'alerte
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Seuil "En avance" (points)
                  </label>
                  <Input type="number" defaultValue={10} min={0} max={50} />
                  <p className="text-xs text-neutral-500 mt-1">
                    Écart à partir duquel la mobilisation est considérée en avance
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Seuil "En retard" (points)
                  </label>
                  <Input type="number" defaultValue={10} min={0} max={50} />
                  <p className="text-xs text-neutral-500 mt-1">
                    Écart à partir duquel la mobilisation est considérée en retard
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Seuil "Critique" (points)
                  </label>
                  <Input type="number" defaultValue={20} min={0} max={50} />
                  <p className="text-xs text-neutral-500 mt-1">
                    Écart à partir duquel la situation est critique
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Seuil gaspillage (points)
                  </label>
                  <Input type="number" defaultValue={15} min={0} max={50} />
                  <p className="text-xs text-neutral-500 mt-1">
                    Écart déclenchant l'alerte de risque de gaspillage
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-end">
                <Button variant="primary">
                  Enregistrer les seuils
                </Button>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Propagation automatique
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900">Propagation automatique des retards</p>
                  <p className="text-sm text-neutral-500">
                    Décaler automatiquement les actions de mobilisation liées quand une action technique est en retard
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 rounded border-neutral-300"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900">Notification par email</p>
                  <p className="text-sm text-neutral-500">
                    Envoyer un email lors d'une propagation de retard
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 rounded border-neutral-300"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900">Créer une alerte automatique</p>
                  <p className="text-sm text-neutral-500">
                    Créer une alerte dans le système lors d'une désynchronisation
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 rounded border-neutral-300"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Créer un lien */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Créer un lien de synchronisation
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Action technique */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Action Technique (Chantier)
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTechnique}
                  onChange={(e) => setSearchTechnique(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {actionsTechniques
                  .filter((a) =>
                    a.titre.toLowerCase().includes(searchTechnique.toLowerCase()) ||
                    a.id_action.toLowerCase().includes(searchTechnique.toLowerCase())
                  )
                  .map((action) => (
                    <button
                      key={action.id_action}
                      className={cn(
                        'w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-neutral-50',
                        selectedActionTechnique === action.id_action && 'bg-blue-50'
                      )}
                      onClick={() => setSelectedActionTechnique(action.id_action)}
                    >
                      <p className="font-medium text-sm text-neutral-900 truncate">{action.titre}</p>
                      <p className="text-xs text-neutral-500">{action.id_action}</p>
                    </button>
                  ))}
              </div>
            </div>

            {/* Action mobilisation */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Action Mobilisation
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchMobilisation}
                  onChange={(e) => setSearchMobilisation(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {actionsMobilisation
                  .filter((a) =>
                    a.titre.toLowerCase().includes(searchMobilisation.toLowerCase()) ||
                    a.id_action.toLowerCase().includes(searchMobilisation.toLowerCase())
                  )
                  .map((action) => (
                    <button
                      key={action.id_action}
                      className={cn(
                        'w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-neutral-50',
                        selectedActionMobilisation === action.id_action && 'bg-purple-50'
                      )}
                      onClick={() => setSelectedActionMobilisation(action.id_action)}
                    >
                      <p className="font-medium text-sm text-neutral-900 truncate">{action.titre}</p>
                      <p className="text-xs text-neutral-500">{action.id_action}</p>
                    </button>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLinkModal(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateLink}
              disabled={!selectedActionTechnique || !selectedActionMobilisation}
            >
              <Link2 className="w-4 h-4 mr-2" />
              Créer le lien
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Propagation */}
      <Dialog open={showPropagationModal} onOpenChange={setShowPropagationModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary-600" />
              Propagation du retard
            </DialogTitle>
          </DialogHeader>
          {propagationData && (
            <div className="py-4">
              <div className="p-4 bg-orange-50 rounded-lg mb-4">
                <p className="font-medium text-orange-800">
                  Action source: {propagationData.action_source_titre}
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  Retard de {propagationData.retard_jours} jour(s)
                </p>
              </div>

              <h4 className="font-medium text-neutral-900 mb-3">
                Actions impactées ({propagationData.actions_impactees.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {propagationData.actions_impactees.map((action) => (
                  <div key={action.id} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm text-neutral-900">{action.titre}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-neutral-500">Nouvelle date fin:</span>
                      <span className="font-medium text-orange-600">
                        {new Date(action.nouvelle_date_fin).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="text-neutral-400">
                        (+{action.decalage_jours} jour(s))
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPropagationModal(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleApplyPropagation}
            >
              <Zap className="w-4 h-4 mr-2" />
              Appliquer la propagation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Auto-linking IA */}
      <Dialog open={showAutoLinkModal} onOpenChange={setShowAutoLinkModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span>Auto-linking intelligent par IA</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 flex-1 overflow-hidden flex flex-col">
            {/* Configuration */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Score minimum
                  </label>
                  <Select
                    value={autoLinkMinScore.toString()}
                    onChange={(e) => setAutoLinkMinScore(parseInt(e.target.value))}
                    className="w-32"
                  >
                    <SelectOption value="30">30 (Souple)</SelectOption>
                    <SelectOption value="40">40 (Normal)</SelectOption>
                    <SelectOption value="50">50 (Strict)</SelectOption>
                    <SelectOption value="60">60 (Très strict)</SelectOption>
                  </Select>
                </div>
                <div className="text-sm text-neutral-600">
                  <p className="font-medium">Critères d'analyse :</p>
                  <p className="text-xs text-neutral-500">
                    Phase, Jalon, Dates, Similarité titres, Mots-clés métier, Catégorie
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">
                  {autoLinkSuggestions.filter((s) => s.score >= autoLinkMinScore).length}
                </p>
                <p className="text-xs text-neutral-500">liens suggérés</p>
              </div>
            </div>

            {/* Liste des suggestions */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {autoLinkSuggestions.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">
                    Aucune correspondance trouvée entre les actions techniques et de mobilisation.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Score</TableHead>
                      <TableHead>Action Technique</TableHead>
                      <TableHead className="w-12 text-center">
                        <Link2 className="w-4 h-4 mx-auto" />
                      </TableHead>
                      <TableHead>Action Mobilisation</TableHead>
                      <TableHead>Raisons</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {autoLinkSuggestions.map((suggestion, index) => {
                      const isAboveThreshold = suggestion.score >= autoLinkMinScore;
                      return (
                        <TableRow
                          key={index}
                          className={cn(
                            !isAboveThreshold && 'opacity-40 bg-neutral-50'
                          )}
                        >
                          <TableCell>
                            <Badge
                              variant={
                                suggestion.score >= 60
                                  ? 'success'
                                  : suggestion.score >= 40
                                  ? 'info'
                                  : 'secondary'
                              }
                            >
                              {suggestion.score}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm text-neutral-900 truncate max-w-[200px]">
                                {suggestion.actionTechnique.titre}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {suggestion.actionTechnique.id_action}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <ArrowRight className="w-4 h-4 text-primary-400 mx-auto" />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm text-neutral-900 truncate max-w-[200px]">
                                {suggestion.actionMobilisation.titre}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {suggestion.actionMobilisation.id_action}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {suggestion.raisons.slice(0, 3).map((raison, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded"
                                >
                                  {raison}
                                </span>
                              ))}
                              {suggestion.raisons.length > 3 && (
                                <span className="text-xs text-neutral-400">
                                  +{suggestion.raisons.length - 3}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p>
                  L'algorithme analyse plusieurs critères pour détecter les correspondances :
                  même phase, même jalon, chevauchement des dates, similarité des titres,
                  mots-clés métier communs. Seuls les liens avec un score ≥ {autoLinkMinScore} seront créés.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setShowAutoLinkModal(false)}>
              Annuler
            </Button>
            {liens.length > 0 && (
              <Button
                variant="secondary"
                onClick={handleResetAndAutoLink}
                disabled={autoLinkLoading || autoLinkSuggestions.filter((s) => s.score >= autoLinkMinScore).length === 0}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réinitialiser et recréer
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleApplyAutoLink}
              disabled={autoLinkLoading || autoLinkSuggestions.filter((s) => s.score >= autoLinkMinScore).length === 0}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              {autoLinkLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Créer {autoLinkSuggestions.filter((s) => s.score >= autoLinkMinScore).length} lien(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
