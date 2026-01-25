import {
  AlertTriangle,
  Building2,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useSynchronisationMetrics, useSynchronisationDetails } from '@/hooks';
import {
  SYNC_STATUS_LABELS,
  SYNC_STATUS_STYLES,
  type SyncStatus,
} from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SyncIndicatorProps {
  label: string;
  value: number;
  icon: typeof Building2;
  color: string;
}

function SyncIndicator({ label, value, icon: Icon, color }: SyncIndicatorProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
      <div className={cn('p-3 rounded-lg', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="text-2xl font-bold text-neutral-900">{Math.round(value)}%</p>
      </div>
    </div>
  );
}

interface SyncStatusBadgeProps {
  status: SyncStatus;
}

function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const styles = SYNC_STATUS_STYLES[status];
  const label = SYNC_STATUS_LABELS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border',
        styles.bg,
        styles.text,
        styles.border
      )}
    >
      {status === 'en_phase' && <CheckCircle className="w-4 h-4" />}
      {status === 'critique' && <XCircle className="w-4 h-4" />}
      {(status === 'en_avance' || status === 'en_retard') && <AlertTriangle className="w-4 h-4" />}
      {label}
    </span>
  );
}

export function SynchronisationDashboard() {
  const metrics = useSynchronisationMetrics();
  const details = useSynchronisationDetails();

  const chartData = [
    {
      name: 'Technique (AXE 3)',
      avancement: details.technique.avancement,
      terminees: details.technique.terminees,
      enRetard: details.technique.enRetard,
    },
    {
      name: 'Mobilisation (AXE 2)',
      avancement: details.mobilisation.avancement,
      terminees: details.mobilisation.terminees,
      enRetard: details.mobilisation.enRetard,
    },
  ];

  const ecartIcon =
    metrics.ecart_points > 5 ? TrendingUp : metrics.ecart_points < -5 ? TrendingDown : Minus;

  const EcartIcon = ecartIcon;

  return (
    <Card padding="md" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            Synchronisation Chantier / Mobilisation
          </h3>
          <p className="text-sm text-neutral-500">
            Comparaison de l'avancement technique vs commercial
          </p>
        </div>
        <SyncStatusBadge status={metrics.sync_status} />
      </div>

      {/* Indicateurs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SyncIndicator
          label="Avancement Technique"
          value={metrics.avancement_technique}
          icon={Building2}
          color="bg-blue-500"
        />
        <SyncIndicator
          label="Avancement Mobilisation"
          value={metrics.avancement_mobilisation}
          icon={ShoppingBag}
          color="bg-purple-500"
        />
        <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
          <div
            className={cn(
              'p-3 rounded-lg',
              metrics.ecart_points > 10
                ? 'bg-orange-500'
                : metrics.ecart_points < -10
                ? 'bg-red-500'
                : 'bg-green-500'
            )}
          >
            <EcartIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Ecart</p>
            <p className="text-2xl font-bold text-neutral-900">
              {metrics.ecart_points > 0 ? '+' : ''}
              {metrics.ecart_points} pts
            </p>
          </div>
        </div>
      </div>

      {/* Graphique comparatif */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" barGap={8}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [`${Math.round(value)}%`, 'Avancement']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="avancement" radius={[0, 4, 4, 0]} maxBarSize={32}>
              <Cell fill="#3b82f6" />
              <Cell fill="#a855f7" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-2">Technique (Chantier)</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Actions totales</span>
              <span className="font-medium">{details.technique.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Terminées</span>
              <span className="font-medium text-green-600">{details.technique.terminees}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">En retard</span>
              <span className="font-medium text-red-600">{details.technique.enRetard}</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-2">Mobilisation (Commercial)</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Actions totales</span>
              <span className="font-medium">{details.mobilisation.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Terminées</span>
              <span className="font-medium text-green-600">{details.mobilisation.terminees}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">En retard</span>
              <span className="font-medium text-red-600">{details.mobilisation.enRetard}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes de risque */}
      {(metrics.risque_gaspillage || metrics.risque_retard_ouverture) && (
        <div
          className={cn(
            'p-4 rounded-xl flex items-start gap-3',
            metrics.risque_retard_ouverture ? 'bg-red-50' : 'bg-orange-50'
          )}
        >
          <AlertTriangle
            className={cn(
              'w-5 h-5 mt-0.5',
              metrics.risque_retard_ouverture ? 'text-red-600' : 'text-orange-600'
            )}
          />
          <div>
            <p
              className={cn(
                'font-medium',
                metrics.risque_retard_ouverture ? 'text-red-800' : 'text-orange-800'
              )}
            >
              {metrics.risque_retard_ouverture
                ? 'Risque de retard ouverture'
                : 'Risque de gaspillage de ressources'}
            </p>
            <p
              className={cn(
                'text-sm mt-1',
                metrics.risque_retard_ouverture ? 'text-red-700' : 'text-orange-700'
              )}
            >
              {metrics.risque_retard_ouverture
                ? `Le chantier technique est en retard de ${Math.abs(metrics.ecart_points)} points par rapport à la mobilisation commerciale. Il est recommandé de décaler les actions de mobilisation pour éviter des coûts inutiles.`
                : `La mobilisation commerciale est en avance de ${metrics.ecart_points} points sur le chantier. Il est recommandé de ralentir la commercialisation pour éviter le gaspillage de ressources.`}
            </p>
          </div>
        </div>
      )}

      {/* Liens de synchronisation */}
      {details.liens.total > 0 && (
        <div className="pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Actions liées</span>
            <span className="font-medium">
              {details.liens.total} liens ({details.liens.avecPropagation} avec propagation auto)
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
