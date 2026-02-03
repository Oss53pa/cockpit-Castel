import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type { SyncAction, SyncActionStatus } from '@/types/sync.types';

// Helper to safely get priority style with fallback
const getPriorityStyle = (priority: string) => {
  return SYNC_CONFIG.priorityStyles[priority as keyof typeof SYNC_CONFIG.priorityStyles] || SYNC_CONFIG.priorityStyles.MEDIUM;
};

interface SyncActionListProps {
  actions: SyncAction[];
  projectId: string;
  onUpdateStatus?: (actionId: number, status: SyncActionStatus) => void;
  onDeleteAction?: (actionId: number) => void;
}

export const SyncActionList: React.FC<SyncActionListProps> = ({
  actions,
  onUpdateStatus,
}: SyncActionListProps) => {
  const getStatusIcon = (status: SyncActionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-primary-500" />;
      case 'IN_PROGRESS':
        return <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-primary-500" />;
    }
  };

  const pendingActions = actions.filter((a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
  const completedActions = actions.filter((a) => a.status === 'COMPLETED');

  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Actions Correctives</h3>
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Aucune action corrective définie</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Actions Correctives</h3>
          <span className="text-sm text-gray-500">
            {pendingActions.length} en cours / {completedActions.length} terminées
          </span>
        </div>
      </div>

      <div className="divide-y">
        {actions.map((action) => (
          <div
            key={action.id}
            className={`p-4 hover:bg-gray-50 transition-colors ${
              action.status === 'COMPLETED' || action.status === 'CANCELLED' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(action.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{action.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      getPriorityStyle(action.priority).bg
                    } ${getPriorityStyle(action.priority).text}`}
                  >
                    {getPriorityStyle(action.priority).label}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      action.dimension === 'PROJECT' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {action.dimension === 'PROJECT' ? 'Projet' : 'Mobilisation'}
                  </span>
                </div>
                {action.description && (
                  <p className="mt-1 text-sm text-gray-500">{action.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  {action.responsible && <span>Resp: {action.responsible}</span>}
                  {action.dueDate && (
                    <span>
                      Échéance: {new Date(action.dueDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>

              {onUpdateStatus && action.id && (
                <div className="flex items-center gap-1">
                  {action.status === 'PENDING' && (
                    <button
                      onClick={() => onUpdateStatus(action.id!, 'IN_PROGRESS')}
                      className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Démarrer
                    </button>
                  )}
                  {action.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => onUpdateStatus(action.id!, 'COMPLETED')}
                      className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      Terminer
                    </button>
                  )}
                  {(action.status === 'PENDING' || action.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => onUpdateStatus(action.id!, 'CANCELLED')}
                      className="px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyncActionList;
