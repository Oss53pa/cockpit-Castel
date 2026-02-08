// ============================================================================
// PROPH3T V2 — ALERT PANEL
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  Check,
  Clock,
  ArrowUp,
  Filter,
  X,
  ChevronRight,
} from 'lucide-react';
import type {
  Alert,
  AlertLevel,
  AlertStatus,
  AlertSummary,
} from '../../hooks/useProph3tDashboard';

// ============================================================================
// TYPES
// ============================================================================

interface AlertPanelProps {
  alerts: Alert[];
  summary: AlertSummary;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  onEscalate: (alertId: string, reason: string) => void;
  onAlertClick?: (alert: Alert) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getLevelConfig = (level: AlertLevel) => {
  const configs = {
    emergency: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      color: 'text-red-500',
      bg: 'bg-red-50/50',
      border: 'border-red-100',
      pulse: 'animate-pulse',
      label: 'Urgence',
    },
    critical: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      color: 'text-red-400',
      bg: 'bg-red-50/50',
      border: 'border-red-100',
      pulse: '',
      label: 'Critique',
    },
    warning: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: 'text-amber-500',
      bg: 'bg-amber-50/50',
      border: 'border-amber-100',
      pulse: '',
      label: 'Attention',
    },
    info: {
      icon: <Info className="w-3.5 h-3.5" />,
      color: 'text-blue-400',
      bg: 'bg-blue-50/50',
      border: 'border-blue-100',
      pulse: '',
      label: 'Information',
    },
  };
  return configs[level];
};

const getStatusBadge = (status: AlertStatus) => {
  const configs = {
    active: { bg: 'bg-red-50', text: 'text-red-500', label: 'Active' },
    acknowledged: { bg: 'bg-amber-50', text: 'text-amber-500', label: 'Acquittée' },
    resolved: { bg: 'bg-green-50', text: 'text-green-500', label: 'Résolue' },
    escalated: { bg: 'bg-purple-50', text: 'text-purple-500', label: 'Escaladée' },
  };
  return configs[status];
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  summary,
  onAcknowledge,
  onResolve,
  onEscalate,
  onAlertClick,
}) => {
  const [filterLevel, setFilterLevel] = useState<AlertLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filterLevel !== 'all' && alert.level !== filterLevel) return false;
      if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => {
      const levelOrder = { emergency: 0, critical: 1, warning: 2, info: 3 };
      const levelDiff = levelOrder[a.level] - levelOrder[b.level];
      if (levelDiff !== 0) return levelDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [alerts, filterLevel, filterStatus]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header avec résumé */}
      <div className="px-5 py-3 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-gray-400" />
            <div>
              <h2 className="text-sm font-medium text-gray-700">
                Centre d'Alertes
              </h2>
              <p className="text-xs text-gray-400">
                {summary.unresolvedCount} alerte(s) non résolue(s)
              </p>
            </div>
          </div>

          {/* Compteurs rapides */}
          <div className="flex items-center gap-3">
            {summary.criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-400 rounded-full">
                <AlertCircle className="w-3 h-3" />
                <span className="text-xs">
                  {summary.criticalCount} critique(s)
                </span>
              </div>
            )}
            <div className="text-xs text-gray-400">
              Total : {summary.total}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-300" />
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value as AlertLevel | 'all')}
              className="text-xs border border-gray-100 rounded-lg px-2 py-1 text-gray-500"
            >
              <option value="all">Tous niveaux</option>
              <option value="emergency">Urgence</option>
              <option value="critical">Critique</option>
              <option value="warning">Attention</option>
              <option value="info">Information</option>
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as AlertStatus | 'all')}
            className="text-xs border border-gray-100 rounded-lg px-2 py-1 text-gray-500"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actives</option>
            <option value="acknowledged">Acquittées</option>
            <option value="escalated">Escaladées</option>
            <option value="resolved">Résolues</option>
          </select>
        </div>
      </div>

      {/* Stats par niveau */}
      <div className="px-5 py-2.5 border-b border-gray-50 grid grid-cols-4 gap-3">
        {(['emergency', 'critical', 'warning', 'info'] as const).map(level => (
          <button
            key={level}
            onClick={() => setFilterLevel(filterLevel === level ? 'all' : level)}
            className={`px-2 py-1.5 rounded-lg text-center transition-colors ${
              filterLevel === level ? getLevelConfig(level).bg : 'hover:bg-gray-50/50'
            }`}
          >
            <div className={`text-sm font-medium ${getLevelConfig(level).color}`}>
              {summary.byLevel[level]}
            </div>
            <div className="text-[10px] text-gray-400">{getLevelConfig(level).label}</div>
          </button>
        ))}
      </div>

      {/* Liste des alertes */}
      <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Aucune alerte correspondant aux filtres</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={onAcknowledge}
              onResolve={onResolve}
              onEscalate={onEscalate}
              onClick={() => {
                setSelectedAlert(alert);
                onAlertClick?.(alert);
              }}
            />
          ))
        )}
      </div>

      {/* Modal détail */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={onAcknowledge}
          onResolve={onResolve}
          onEscalate={onEscalate}
        />
      )}
    </div>
  );
};

// ============================================================================
// ALERT CARD
// ============================================================================

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onEscalate: (id: string, reason: string) => void;
  onClick: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onResolve,
  onEscalate: _onEscalate,
  onClick,
}) => {
  const levelConfig = getLevelConfig(alert.level);
  const statusConfig = getStatusBadge(alert.status);

  return (
    <div
      className={`px-5 py-2.5 hover:bg-gray-50/50 cursor-pointer transition-colors ${levelConfig.pulse}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-1.5 rounded-lg ${levelConfig.bg}`}>
          <span className={levelConfig.color}>{levelConfig.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs font-medium text-gray-600">{alert.title}</h4>
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
            <span className="text-[10px] text-gray-300">{alert.module}</span>
          </div>

          <p className="mt-0.5 text-[11px] text-gray-400 line-clamp-2">{alert.message}</p>

          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[10px] text-gray-300">
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {formatDate(alert.timestamp)}
              </span>
              {alert.escalationHistory.length > 0 && (
                <span className="flex items-center gap-1 text-purple-400">
                  <ArrowUp className="w-2.5 h-2.5" />
                  Escaladée {alert.escalationHistory.length}x
                </span>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              {alert.status === 'active' && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-500 rounded hover:bg-amber-100"
                >
                  Acquitter
                </button>
              )}
              {(alert.status === 'active' || alert.status === 'acknowledged') && (
                <button
                  onClick={() => onResolve(alert.id)}
                  className="px-2 py-0.5 text-[10px] bg-green-50 text-green-500 rounded hover:bg-green-100"
                >
                  Résoudre
                </button>
              )}
            </div>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
      </div>
    </div>
  );
};

// ============================================================================
// ALERT DETAIL MODAL
// ============================================================================

interface AlertDetailModalProps {
  alert: Alert;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onEscalate: (id: string, reason: string) => void;
}

const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  onClose,
  onAcknowledge,
  onResolve,
  onEscalate,
}) => {
  const [escalateReason, setEscalateReason] = useState('');
  const levelConfig = getLevelConfig(alert.level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-3 ${levelConfig.bg} border-b ${levelConfig.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={levelConfig.color}>{levelConfig.icon}</span>
              <h3 className={`text-xs font-medium ${levelConfig.color}`}>
                {levelConfig.label}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/50 rounded">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 overflow-y-auto">
          <div>
            <h4 className="text-sm font-medium text-gray-600">{alert.title}</h4>
            <p className="mt-1 text-xs text-gray-400">{alert.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400">Module :</span>
              <span className="ml-1.5 text-gray-600">{alert.module}</span>
            </div>
            <div>
              <span className="text-gray-400">Source :</span>
              <span className="ml-1.5 text-gray-600">{alert.source}</span>
            </div>
            <div>
              <span className="text-gray-400">Créée le :</span>
              <span className="ml-1.5 text-gray-600">{formatDate(alert.timestamp)}</span>
            </div>
            {alert.acknowledgedAt && (
              <div>
                <span className="text-gray-400">Acquittée le :</span>
                <span className="ml-1.5 text-gray-600">{formatDate(alert.acknowledgedAt)}</span>
              </div>
            )}
          </div>

          {/* Actions suggérées */}
          {alert.suggestedActions.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-500 mb-1.5">Actions suggérées</h5>
              <ul className="space-y-1">
                {alert.suggestedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                    <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Historique d'escalade */}
          {alert.escalationHistory.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-500 mb-1.5">Historique d'escalade</h5>
              <div className="space-y-1.5">
                {alert.escalationHistory.map((event, i) => (
                  <div key={i} className="text-xs p-2 bg-gray-50/50 rounded">
                    <div className="flex items-center gap-1.5">
                      <ArrowUp className="w-2.5 h-2.5 text-purple-400" />
                      <span className="text-gray-500">
                        {event.fromLevel} → {event.toLevel}
                      </span>
                      <span className="text-gray-300">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-400 mt-0.5">{event.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escalade */}
          {alert.status !== 'resolved' && (
            <div className="pt-3 border-t border-gray-50">
              <h5 className="text-xs font-medium text-gray-500 mb-1.5">Escalader</h5>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Raison de l'escalade..."
                  value={escalateReason}
                  onChange={e => setEscalateReason(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs text-gray-500"
                />
                <button
                  onClick={() => {
                    if (escalateReason.trim()) {
                      onEscalate(alert.id, escalateReason);
                      setEscalateReason('');
                    }
                  }}
                  disabled={!escalateReason.trim()}
                  className="px-2.5 py-1.5 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600 disabled:opacity-50"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            Fermer
          </button>
          {alert.status === 'active' && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-3 py-1.5 text-xs bg-amber-50 text-amber-500 rounded-lg hover:bg-amber-100"
            >
              Acquitter
            </button>
          )}
          {alert.status !== 'resolved' && (
            <button
              onClick={() => onResolve(alert.id)}
              className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Marquer résolu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertPanel;
