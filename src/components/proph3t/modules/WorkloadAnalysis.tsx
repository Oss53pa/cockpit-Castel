/**
 * Module Analyse de Charge par Responsable
 * Affiche le tableau des charges avec alertes
 */

import {
  Users,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { useWorkloadAnalysis, type ResponsableWorkload, type WorkloadAlert } from '@/hooks/useWorkloadAnalysis';

// Badge de statut de charge
function StatusBadge({ status }: { status: ResponsableWorkload['status'] }) {
  const configs = {
    surcharge: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Surcharge' },
    elevee: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Élevée' },
    normale: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Normale' },
    faible: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Faible' },
  };

  const config = configs[status];

  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border', config.color)}>
      {config.label}
    </span>
  );
}

// Barre de score de charge
function ChargeBar({ score, status }: { score: number; status: ResponsableWorkload['status'] }) {
  const colors = {
    surcharge: 'bg-red-500',
    elevee: 'bg-orange-500',
    normale: 'bg-green-500',
    faible: 'bg-blue-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colors[status])}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-neutral-600 w-8">{score}</span>
    </div>
  );
}

// Ligne de responsable
function ResponsableRow({ data }: { data: ResponsableWorkload }) {
  return (
    <tr className={cn(
      'hover:bg-neutral-50 transition-colors',
      data.status === 'surcharge' && 'bg-red-50/50'
    )}>
      <td className="py-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center">
            <User className="w-3 h-3 text-neutral-500" />
          </div>
          <span className="text-xs font-medium text-neutral-900 truncate max-w-[100px]">
            {data.fullName}
          </span>
        </div>
      </td>
      <td className="py-2 px-2 text-center">
        <span className="text-xs font-semibold text-neutral-700">{data.totalActions}</span>
      </td>
      <td className="py-2 px-2 text-center">
        <span className="text-xs text-neutral-600">{data.enCours}</span>
      </td>
      <td className="py-2 px-2 text-center">
        {data.critiques > 0 ? (
          <span className="text-xs font-medium text-red-600">{data.critiques}</span>
        ) : (
          <span className="text-xs text-neutral-400">-</span>
        )}
      </td>
      <td className="py-2 px-2 text-center">
        {data.enRetard > 0 ? (
          <span className="text-xs font-medium text-orange-600">{data.enRetard}</span>
        ) : (
          <span className="text-xs text-neutral-400">-</span>
        )}
      </td>
      <td className="py-2 px-2">
        <ChargeBar score={data.chargeScore} status={data.status} />
      </td>
      <td className="py-2 px-2">
        <StatusBadge status={data.status} />
      </td>
    </tr>
  );
}

// Carte d'alerte
function AlertCard({ alert }: { alert: WorkloadAlert }) {
  const configs = {
    critical: {
      bg: 'bg-red-50 border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      textColor: 'text-red-800',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      textColor: 'text-amber-800',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: Info,
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800',
    },
  };

  const config = configs[alert.severity];
  const Icon = config.icon;

  return (
    <div className={cn('p-2 rounded-lg border', config.bg)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.iconColor)} />
        <p className={cn('text-xs', config.textColor)}>{alert.message}</p>
      </div>
    </div>
  );
}

export function WorkloadAnalysis() {
  const data = useWorkloadAnalysis();

  if (!data) {
    return (
      <div className="flex items-center justify-center py-8 text-neutral-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm">Analyse de la charge...</span>
      </div>
    );
  }

  if (data.responsables.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
        <p className="text-neutral-500 font-medium">Aucune donnée de charge</p>
        <p className="text-sm text-neutral-400">Assignez des responsables aux actions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats résumé */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 bg-neutral-50 rounded-lg text-center">
          <div className="text-lg font-bold text-neutral-700">{data.responsables.length}</div>
          <div className="text-[10px] text-neutral-500">Responsables</div>
        </div>
        <div className="p-2 bg-red-50 rounded-lg text-center">
          <div className="text-lg font-bold text-red-600">{data.overloadedCount}</div>
          <div className="text-[10px] text-red-500">Surchargés</div>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg text-center">
          <div className="text-lg font-bold text-blue-600">{data.totalActions}</div>
          <div className="text-[10px] text-blue-500">Actions actives</div>
        </div>
        <div className="p-2 bg-amber-50 rounded-lg text-center">
          <div className="text-lg font-bold text-amber-600">{data.actionsNonAssignees}</div>
          <div className="text-[10px] text-amber-500">Non assignées</div>
        </div>
      </div>

      {/* Alertes */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Alertes ({data.alerts.length})
          </h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {data.alerts.slice(0, 5).map((alert, i) => (
              <AlertCard key={i} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Tableau des responsables */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          Charge par responsable
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="py-1.5 px-2 text-[10px] font-medium text-neutral-400 uppercase">Nom</th>
                <th className="py-1.5 px-2 text-[10px] font-medium text-neutral-400 uppercase text-center">Total</th>
                <th className="py-1.5 px-2 text-[10px] font-medium text-neutral-400 uppercase text-center">Cours</th>
                <th className="py-1.5 px-2 text-[10px] font-medium text-neutral-400 uppercase text-center">Crit.</th>
                <th className="py-1.5 px-2 text-[10px] font-medium text-neutral-400 uppercase text-center">Retard</th>
                <th className="py-1.5 px-2 text-[10px] font-medium text-neutral-400 uppercase">Score</th>
                <th className="py-1.5 px-2 text-[10px] font-medium text-neutral-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {data.responsables.slice(0, 10).map(resp => (
                <ResponsableRow key={resp.userId} data={resp} />
              ))}
            </tbody>
          </table>
        </div>
        {data.responsables.length > 10 && (
          <p className="text-xs text-neutral-400 text-center">
            +{data.responsables.length - 10} autres responsables
          </p>
        )}
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-3 pt-2 text-[10px] text-neutral-400 border-t border-neutral-100">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Surcharge (80+)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          Élevée (60-79)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Normale (30-59)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Faible (-30)
        </span>
      </div>
    </div>
  );
}

export default WorkloadAnalysis;
