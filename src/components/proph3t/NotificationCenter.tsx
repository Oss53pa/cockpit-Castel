// ============================================================================
// PROPH3T V2 — NOTIFICATION CENTER
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock,
  Trash2,
} from 'lucide-react';
// Types locaux (alignés sur les données construites par le hook)
type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface NotificationAction {
  id: string;
  label: string;
  action: string;
  primary?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: Date;
  actions?: NotificationAction[];
}

// ============================================================================
// TYPES
// ============================================================================

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onActionClick?: (notificationId: string, actionId: string) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getPriorityIcon = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'high':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'normal':
      return <Info className="w-4 h-4 text-blue-500" />;
    case 'low':
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const getPriorityBadge = (priority: NotificationPriority) => {
  const colors = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    normal: 'bg-blue-100 text-blue-800 border-blue-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return colors[priority];
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return new Date(date).toLocaleDateString('fr-FR');
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onActionClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationPriority>('all');
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter(n => n.status !== 'read').length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (filter === 'unread') {
      filtered = filtered.filter(n => n.status !== 'read');
    } else if (['urgent', 'high', 'normal', 'low'].includes(filter)) {
      filtered = filtered.filter(n => n.priority === filter);
    }

    return filtered.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications, filter]);

  return (
    <div className="relative">
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 max-h-[80vh] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Tout marquer lu
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Filtres */}
              <div className="flex gap-1 mt-2">
                {(['all', 'unread', 'urgent', 'high'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'all' && 'Toutes'}
                    {f === 'unread' && `Non lues (${unreadCount})`}
                    {f === 'urgent' && 'Urgentes'}
                    {f === 'high' && 'Importantes'}
                  </button>
                ))}
              </div>
            </div>

            {/* Liste */}
            <div className="overflow-y-auto max-h-[60vh]">
              {filteredNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDismiss={onDismiss}
                    onActionClick={onActionClick}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// NOTIFICATION ITEM
// ============================================================================

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onActionClick?: (notificationId: string, actionId: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDismiss,
  onActionClick,
}) => {
  const isRead = notification.status === 'read';

  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        !isRead ? 'bg-blue-50/30' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getPriorityIcon(notification.priority)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${!isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            <span
              className={`flex-shrink-0 px-1.5 py-0.5 text-xs rounded border ${getPriorityBadge(
                notification.priority
              )}`}
            >
              {notification.priority === 'urgent' && 'Urgent'}
              {notification.priority === 'high' && 'Important'}
              {notification.priority === 'normal' && 'Normal'}
              {notification.priority === 'low' && 'Info'}
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
            {notification.message}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {formatTimeAgo(notification.createdAt)}
            </span>

            <div className="flex items-center gap-2">
              {/* Actions de la notification */}
              {notification.actions?.slice(0, 2).map(action => (
                <button
                  key={action.id}
                  onClick={() => onActionClick?.(notification.id, action.id)}
                  className={`text-xs px-2 py-1 rounded ${
                    action.primary
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {action.label}
                </button>
              ))}

              {/* Marquer comme lu */}
              {!isRead && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Marquer comme lu"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Supprimer */}
              <button
                onClick={() => onDismiss(notification.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
