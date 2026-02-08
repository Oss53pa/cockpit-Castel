// ============================================================================
// PROPH3T V2 — COMMITMENT DASHBOARD
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  Filter,
  TrendingUp,
  TrendingDown,
  User,
  Calendar,
  Bell,
} from 'lucide-react';
// Types locaux (alignés sur les données construites par le hook)
type CommitmentStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
type CommitmentPriority = 'critical' | 'high' | 'medium' | 'low';

interface CommitmentReminder {
  id: string;
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  channel: 'in_app' | 'email';
}

export interface Commitment {
  id: string;
  title: string;
  description: string;
  owner: string;
  dueDate: Date;
  completedAt?: Date;
  status: CommitmentStatus;
  priority: CommitmentPriority;
  reminders: CommitmentReminder[];
}

export interface CommitmentStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
  avgCompletionTime: number;
}

export interface CommitmentByOwner {
  owner: string;
  stats: {
    total: number;
    completed: number;
    overdue: number;
    reliabilityScore: number;
  };
}

interface ReliabilityScore {
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// TYPES
// ============================================================================

interface CommitmentDashboardProps {
  commitments: Commitment[];
  stats: CommitmentStats;
  byOwner: CommitmentByOwner[];
  reliabilityScores?: Record<string, ReliabilityScore>;
  onCreateCommitment?: () => void;
  onSelectCommitment?: (commitment: Commitment) => void;
  onStatusChange?: (id: string, status: CommitmentStatus) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getStatusConfig = (status: CommitmentStatus) => {
  const configs = {
    pending: {
      icon: <Clock className="w-4 h-4" />,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      label: 'En attente',
    },
    in_progress: {
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      label: 'En cours',
    },
    completed: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-green-600',
      bg: 'bg-green-100',
      label: 'Terminé',
    },
    overdue: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-red-600',
      bg: 'bg-red-100',
      label: 'En retard',
    },
    cancelled: {
      icon: <XCircle className="w-4 h-4" />,
      color: 'text-gray-400',
      bg: 'bg-gray-50',
      label: 'Annulé',
    },
  };
  return configs[status];
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
};

const getDaysUntil = (date: Date): number => {
  const now = new Date();
  return Math.ceil((new Date(date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const CommitmentDashboard: React.FC<CommitmentDashboardProps> = ({
  commitments,
  stats,
  byOwner,
  reliabilityScores,
  onCreateCommitment,
  onSelectCommitment,
  onStatusChange,
}) => {
  const [filter, setFilter] = useState<CommitmentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'owner'>('dueDate');

  const filteredCommitments = useMemo(() => {
    let filtered = [...commitments];

    if (filter !== 'all') {
      filtered = filtered.filter(c => c.status === filter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'owner':
          return a.owner.localeCompare(b.owner);
        default:
          return 0;
      }
    });

    return filtered;
  }, [commitments, filter, sortBy]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Suivi des Engagements
              </h2>
              <p className="text-sm text-gray-500">
                {stats.total} engagement(s) - {(stats.completionRate ?? 0).toFixed(0)}% de complétion
              </p>
            </div>
          </div>

          {onCreateCommitment && (
            <button
              onClick={onCreateCommitment}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nouvel engagement
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 p-6 border-b border-gray-100">
        <StatCard
          label="En attente"
          value={stats.pending}
          icon={<Clock className="w-5 h-5" />}
          color="gray"
        />
        <StatCard
          label="En cours"
          value={stats.inProgress}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Terminés"
          value={stats.completed}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="En retard"
          value={stats.overdue}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          label="Temps moyen"
          value={`${(stats.avgCompletionTime ?? 0).toFixed(1)}j`}
          icon={<Calendar className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as CommitmentStatus | 'all')}
            className="text-sm border-0 bg-transparent focus:ring-0"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminés</option>
            <option value="overdue">En retard</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Trier par:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'dueDate' | 'priority' | 'owner')}
            className="text-sm border-0 bg-transparent focus:ring-0"
          >
            <option value="dueDate">Date d'échéance</option>
            <option value="priority">Priorité</option>
            <option value="owner">Responsable</option>
          </select>
        </div>
      </div>

      {/* Liste des engagements */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {filteredCommitments.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Aucun engagement trouvé
          </div>
        ) : (
          filteredCommitments.map(commitment => (
            <CommitmentRow
              key={commitment.id}
              commitment={commitment}
              onSelect={onSelectCommitment}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>

      {/* Reliability by Owner */}
      {byOwner.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Fiabilité par responsable</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {byOwner.slice(0, 4).map(owner => (
              <OwnerReliabilityCard
                key={owner.owner}
                owner={owner}
                score={reliabilityScores?.[owner.owner]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'gray' | 'blue' | 'green' | 'red' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colors = {
    gray: 'bg-gray-50 text-gray-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
};

interface CommitmentRowProps {
  commitment: Commitment;
  onSelect?: (commitment: Commitment) => void;
  onStatusChange?: (id: string, status: CommitmentStatus) => void;
}

const CommitmentRow: React.FC<CommitmentRowProps> = ({
  commitment,
  onSelect,
  onStatusChange,
}) => {
  const config = getStatusConfig(commitment.status);
  const daysUntil = getDaysUntil(commitment.dueDate);
  const priorityColors = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-gray-600 bg-gray-50',
  };

  return (
    <div
      className="px-6 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-4"
      onClick={() => onSelect?.(commitment)}
    >
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <span className={config.color}>{config.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 truncate">{commitment.title}</h4>
          <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[commitment.priority]}`}>
            {commitment.priority}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {commitment.owner}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(commitment.dueDate)}
            {daysUntil < 0 && commitment.status !== 'completed' && (
              <span className="text-red-600 ml-1">({Math.abs(daysUntil)}j de retard)</span>
            )}
            {daysUntil >= 0 && daysUntil <= 3 && commitment.status !== 'completed' && (
              <span className="text-orange-600 ml-1">(J-{daysUntil})</span>
            )}
          </span>
        </div>
      </div>

      {commitment.reminders.some(r => !r.sent) && (
        <Bell className="w-4 h-4 text-yellow-500" />
      )}

      {onStatusChange && commitment.status !== 'completed' && commitment.status !== 'cancelled' && (
        <button
          onClick={e => {
            e.stopPropagation();
            onStatusChange(commitment.id, 'completed');
          }}
          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
          title="Marquer comme terminé"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

interface OwnerReliabilityCardProps {
  owner: CommitmentByOwner;
  score?: ReliabilityScore;
}

const OwnerReliabilityCard: React.FC<OwnerReliabilityCardProps> = ({ owner, score }) => {
  const reliabilityScore = score?.overallScore ?? owner.stats.reliabilityScore;
  const trend = score?.trend ?? 'stable';

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 truncate">{owner.owner}</span>
        {trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-500" />}
        {trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-500" />}
      </div>
      <div className={`text-xl font-bold ${getScoreColor(reliabilityScore)}`}>
        {reliabilityScore.toFixed(0)}%
      </div>
      <p className="text-xs text-gray-500">
        {owner.stats.completed}/{owner.stats.total} terminés
      </p>
    </div>
  );
};

export default CommitmentDashboard;
