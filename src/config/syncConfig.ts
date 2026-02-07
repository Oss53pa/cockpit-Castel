// ============================================================================
// SYNCHRONISATION PROJET vs MOBILISATION - Configuration
// ============================================================================

export const SYNC_CONFIG = {
  // Seuils d'alerte (en % d'écart)
  // P2 AUDIT: Seuil RED abaissé de 25 à 15 pour la phase pré-ouverture Cosmos Angré
  thresholds: {
    green: 5,      // Écart ≤ 5% = Synchronisé
    orange: 10,    // Écart 5-10% = Attention
    red: 15,       // Écart > 10% = Critique (abaissé pour pré-ouverture)
  },

  // Durée estimée du projet (en jours) pour calcul des jours d'écart
  projectDurationDays: 540, // 18 mois

  // Couleurs principales
  colors: {
    project: '#3B82F6',       // Bleu
    mobilization: '#10B981',  // Vert
    sync: '#22C55E',          // Vert vif
    warning: '#F59E0B',       // Orange
    critical: '#EF4444',      // Rouge
  },

  // Labels
  labels: {
    PROJECT: 'Projet de Construction',
    MOBILIZATION: 'Mobilisation Opérationnelle',
  },

  // Styles par niveau d'alerte
  alertStyles: {
    GREEN: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      color: '#22C55E',
    },
    ORANGE: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-300',
      color: '#F59E0B',
    },
    RED: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      color: '#EF4444',
    },
  },

  // Styles par statut
  statusStyles: {
    SYNC: {
      label: 'Synchronisé',
      icon: '🟢',
      bg: 'bg-green-100',
      text: 'text-green-800',
    },
    PROJECT_AHEAD: {
      label: 'Projet en avance',
      icon: '🟠',
      bg: 'bg-orange-100',
      text: 'text-orange-800',
    },
    MOBILIZATION_AHEAD: {
      label: 'Mobilisation en avance',
      icon: '🟠',
      bg: 'bg-orange-100',
      text: 'text-orange-800',
    },
    CRITICAL: {
      label: 'Critique',
      icon: '🔴',
      bg: 'bg-red-100',
      text: 'text-red-800',
    },
  },

  // Styles par statut d'item
  itemStatusStyles: {
    NOT_STARTED: {
      label: 'Non démarré',
      bg: 'bg-gray-100',
      text: 'text-gray-600',
    },
    IN_PROGRESS: {
      label: 'En cours',
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    COMPLETED: {
      label: 'Terminé',
      bg: 'bg-green-100',
      text: 'text-green-600',
    },
    DELAYED: {
      label: 'En retard',
      bg: 'bg-orange-100',
      text: 'text-orange-600',
    },
    BLOCKED: {
      label: 'Bloqué',
      bg: 'bg-red-100',
      text: 'text-red-600',
    },
  },

  // Styles par priorité d'action
  priorityStyles: {
    LOW: {
      label: 'Basse',
      bg: 'bg-gray-100',
      text: 'text-gray-600',
    },
    MEDIUM: {
      label: 'Moyenne',
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    HIGH: {
      label: 'Haute',
      bg: 'bg-orange-100',
      text: 'text-orange-600',
    },
    URGENT: {
      label: 'Urgente',
      bg: 'bg-red-100',
      text: 'text-red-600',
    },
  },

  // Types d'action corrective
  actionTypeLabels: {
    ACCELERATE: 'Accélérer',
    DELAY: 'Reporter',
    REINFORCE: 'Renforcer',
    OPTIMIZE: 'Optimiser',
    MONITOR: 'Surveiller',
  },
} as const;

export type SyncConfig = typeof SYNC_CONFIG;
