/**
 * Hook pour la synchronisation temps réel Firebase
 *
 * Ce hook:
 * - Initialise Firebase si configuré
 * - Écoute les mises à jour externes en temps réel
 * - Synchronise automatiquement les changements vers IndexedDB
 * - Affiche des notifications toast quand une mise à jour est reçue
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  initRealtimeSync,
  startRealtimeListener,
  stopRealtimeListener,
  syncUpdateToLocal,
  syncAllPendingUpdates,
  isRealtimeListenerActive,
  type ExternalUpdateData,
} from '@/services/firebaseRealtimeSync';
import { isFirebaseConfigured, getFirebaseConfig } from '@/services/firebaseConfigService';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/logger';

interface UseFirebaseRealtimeSyncReturn {
  isConnected: boolean;
  isListening: boolean;
  lastUpdate: ExternalUpdateData | null;
  pendingCount: number;
  syncPending: () => Promise<void>;
  reconnect: () => Promise<void>;
}

export function useFirebaseRealtimeSync(): UseFirebaseRealtimeSyncReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ExternalUpdateData | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const { addToast } = useToast();
  const initAttempted = useRef(false);

  // Callback quand une mise à jour est reçue
  const handleUpdateReceived = useCallback(
    async (update: ExternalUpdateData) => {
      logger.info('Update received from Firebase:', update);
      setLastUpdate(update);

      // Synchroniser vers IndexedDB local
      const synced = await syncUpdateToLocal(update);

      if (synced) {
        // Afficher une notification toast
        const entityType =
          update.entityType === 'action'
            ? 'Action'
            : update.entityType === 'jalon'
            ? 'Jalon'
            : 'Risque';

        addToast({
          type: 'success',
          title: `Mise à jour reçue`,
          message: `${update.response?.submittedBy?.name || update.recipientName} a mis à jour ${entityType.toLowerCase()} "${update.entitySnapshot.titre}"`,
          duration: 5000,
        });
      }
    },
    [addToast]
  );

  // Initialisation
  const initialize = useCallback(async () => {
    const config = getFirebaseConfig();

    if (!config.enabled || !isFirebaseConfigured()) {
      logger.info('Firebase not configured, skipping realtime sync');
      setIsConnected(false);
      setIsListening(false);
      return;
    }

    try {
      // Initialiser Firebase
      const initialized = await initRealtimeSync();
      setIsConnected(initialized);

      if (initialized) {
        // Démarrer le listener
        const listening = startRealtimeListener({
          onUpdateReceived: handleUpdateReceived,
          onError: error => {
            logger.error('Realtime sync error:', error);
            addToast({
              type: 'error',
              title: 'Erreur de synchronisation',
              message: 'La connexion temps réel a été interrompue',
              duration: 3000,
            });
          },
          onConnectionChange: connected => {
            setIsConnected(connected);
            if (!connected) {
              setIsListening(false);
            }
          },
        });

        setIsListening(listening);

        if (listening) {
          logger.info('Firebase realtime listener started');
        }

        // Synchroniser les mises à jour en attente
        const { synced, errors } = await syncAllPendingUpdates();
        if (synced > 0) {
          logger.info(`Synced ${synced} pending updates`);
          addToast({
            type: 'info',
            title: 'Synchronisation',
            message: `${synced} mise(s) à jour en attente synchronisée(s)`,
            duration: 3000,
          });
        }
        setPendingCount(errors);
      }
    } catch (error) {
      logger.error('Error initializing Firebase realtime sync:', error);
      setIsConnected(false);
      setIsListening(false);
    }
  }, [handleUpdateReceived, addToast]);

  // Synchroniser les mises à jour en attente
  const syncPending = useCallback(async () => {
    const { synced, errors } = await syncAllPendingUpdates();
    setPendingCount(errors);

    if (synced > 0) {
      addToast({
        type: 'success',
        title: 'Synchronisation terminée',
        message: `${synced} mise(s) à jour synchronisée(s)`,
        duration: 3000,
      });
    }
  }, [addToast]);

  // Reconnecter
  const reconnect = useCallback(async () => {
    stopRealtimeListener();
    setIsListening(false);
    await initialize();
  }, [initialize]);

  // Initialiser au montage
  useEffect(() => {
    if (!initAttempted.current) {
      initAttempted.current = true;
      initialize();
    }

    // Cleanup au démontage
    return () => {
      // Ne pas arrêter le listener au démontage car on veut qu'il reste actif
      // stopRealtimeListener();
    };
  }, [initialize]);

  // Vérifier périodiquement si le listener est toujours actif
  useEffect(() => {
    const interval = setInterval(() => {
      setIsListening(isRealtimeListenerActive());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    isListening,
    lastUpdate,
    pendingCount,
    syncPending,
    reconnect,
  };
}
