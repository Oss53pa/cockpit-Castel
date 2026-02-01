/**
 * Hook React pour PROPH3T Proactive
 * Gère les insights proactifs et les scans automatiques
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Proph3tProactive,
  type ProactiveInsight,
  type ProactiveConfig,
} from '@/services/proph3tProactive';

// ============================================================================
// HOOK: useProph3tProactive
// ============================================================================

interface UseProph3tProactiveReturn {
  // Insights
  insights: ProactiveInsight[];
  criticalCount: number;
  warningCount: number;

  // État
  isScanning: boolean;
  lastScanTime: Date | null;

  // Actions
  runScan: () => Promise<void>;
  dismissInsight: (id: string) => void;
  clearAll: () => void;

  // Configuration
  config: ProactiveConfig;
  updateConfig: (config: Partial<ProactiveConfig>) => void;
}

export function useProph3tProactive(): UseProph3tProactiveReturn {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [config, setConfig] = useState<ProactiveConfig>(() => Proph3tProactive.getConfig());

  // Charger les insights au montage
  useEffect(() => {
    const stored = Proph3tProactive.getInsights();
    setInsights(stored.filter(i => !i.isDismissed));
    setLastScanTime(Proph3tProactive.getLastScanTime());
  }, []);

  // Démarrer le scan automatique si activé
  useEffect(() => {
    if (config.enabled) {
      Proph3tProactive.startAutoScan();
    } else {
      Proph3tProactive.stopAutoScan();
    }

    return () => {
      Proph3tProactive.stopAutoScan();
    };
  }, [config.enabled, config.scanIntervalMinutes]);

  // Actualiser les insights périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = Proph3tProactive.getInsights();
      setInsights(stored.filter(i => !i.isDismissed));
      setLastScanTime(Proph3tProactive.getLastScanTime());
    }, 10000); // Vérifier toutes les 10 secondes

    return () => clearInterval(interval);
  }, []);

  const runScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const newInsights = await Proph3tProactive.runScan();
      setInsights(newInsights.filter(i => !i.isDismissed));
      setLastScanTime(new Date());
    } finally {
      setIsScanning(false);
    }
  }, []);

  const dismissInsight = useCallback((id: string) => {
    Proph3tProactive.dismissInsight(id);
    setInsights(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    Proph3tProactive.clearInsights();
    setInsights([]);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<ProactiveConfig>) => {
    Proph3tProactive.saveConfig(newConfig);
    setConfig(Proph3tProactive.getConfig());
  }, []);

  // Compteurs
  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;

  return {
    insights,
    criticalCount,
    warningCount,
    isScanning,
    lastScanTime,
    runScan,
    dismissInsight,
    clearAll,
    config,
    updateConfig,
  };
}

// ============================================================================
// HOOK: useProph3tNotifications
// Pour afficher des notifications toast
// ============================================================================

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
}

export function useProph3tNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { insights, criticalCount } = useProph3tProactive();

  // Générer des notifications pour les nouveaux insights critiques
  useEffect(() => {
    const criticalInsights = insights.filter(i => i.severity === 'critical');

    criticalInsights.forEach(insight => {
      const existingNotif = notifications.find(n => n.id === insight.id);
      if (!existingNotif) {
        setNotifications(prev => [
          {
            id: insight.id,
            type: 'critical',
            title: insight.title,
            message: insight.description,
            timestamp: new Date(insight.timestamp),
          },
          ...prev,
        ].slice(0, 10)); // Garder max 10 notifications
      }
    });
  }, [insights]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    criticalCount,
    dismissNotification,
    clearNotifications,
  };
}

export default useProph3tProactive;
