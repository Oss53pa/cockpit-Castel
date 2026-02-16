import { useEffect, useState, useCallback } from 'react';
import { db } from '@/db';
import {
  subscribeToExternalUpdates,
  getPendingExternalUpdates,
  markUpdateSynced,
  countPendingUpdates,
  type ExternalUpdate,
} from '@/services/firebase';
import { logger } from '@/lib/logger';

interface SyncResult {
  success: boolean;
  entityType: string;
  entityId: number;
  recipientName: string;
}

export function useFirebaseSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);

  // Compter les mises à jour en attente
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await countPendingUpdates();
      setPendingCount(count);
    } catch (error) {
      logger.error('Erreur lors du comptage des mises à jour:', error);
    }
  }, []);

  // Synchroniser une mise à jour spécifique
  const syncUpdate = useCallback(async (update: ExternalUpdate): Promise<boolean> => {
    try {
      const { entityType, entityId, updates, recipientName, recipientEmail } = update;

      // Préparer les données de mise à jour
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        derniere_mise_a_jour_externe: new Date().toISOString(),
      };

      if (updates.statut) updateData.statut = updates.statut;
      if (updates.avancement !== undefined) updateData.avancement = updates.avancement;
      if (updates.probabilite !== undefined) updateData.probabilite = updates.probabilite;
      if (updates.impact !== undefined) updateData.impact = updates.impact;
      if (updates.score !== undefined) updateData.score = updates.score;
      if (updates.notes_mise_a_jour) updateData.notes_mise_a_jour = updates.notes_mise_a_jour;
      if (updates.liens_documents) updateData.liens_documents = updates.liens_documents;
      if (updates.commentaires_externes) updateData.commentaires_externes = updates.commentaires_externes;

      // Mettre à jour l'entité dans IndexedDB
      if (entityType === 'action') {
        await db.actions.update(entityId, updateData);
      } else if (entityType === 'jalon') {
        await db.jalons.update(entityId, updateData);
      } else if (entityType === 'risque') {
        await db.risques.update(entityId, updateData);
      }

      // Ajouter à l'historique
      await db.historique.add({
        timestamp: new Date().toISOString(),
        entiteType: entityType,
        entiteId: entityId,
        champModifie: 'update_externe',
        ancienneValeur: '',
        nouvelleValeur: `Mise à jour externe par ${recipientName} (${recipientEmail})`,
        auteurId: 0,
      });

      // Créer une alerte
      const entityTypeLabel = entityType === 'action' ? 'Action' : entityType === 'jalon' ? 'Jalon' : 'Risque';

      // Récupérer le titre de l'entité
      let entityTitle = 'Inconnu';
      if (entityType === 'action') {
        const action = await db.actions.get(entityId);
        entityTitle = action?.titre || 'Inconnu';
      } else if (entityType === 'jalon') {
        const jalon = await db.jalons.get(entityId);
        entityTitle = jalon?.titre || 'Inconnu';
      } else if (entityType === 'risque') {
        const risque = await db.risques.get(entityId);
        entityTitle = risque?.titre || 'Inconnu';
      }

      await db.alertes.add({
        type: 'info' as const,
        titre: `Mise à jour reçue de ${recipientName}`,
        message: `${entityTypeLabel} "${entityTitle}" a été mis(e) à jour par ${recipientName} (${recipientEmail}). Statut: ${updates.statut || 'N/A'}${entityType === 'action' ? `, Avancement: ${updates.avancement || 0}%` : ''}`,
        criticite: 'medium',
        entiteType: entityType,
        entiteId: entityId,
        lu: false,
        traitee: false,
        createdAt: new Date().toISOString(),
      });

      // Marquer comme synchronisé dans Firebase
      if (update.id) {
        await markUpdateSynced(update.id);
      }

      return true;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation:', error);
      return false;
    }
  }, []);

  // Synchroniser toutes les mises à jour en attente
  const syncAllPending = useCallback(async () => {
    setIsSyncing(true);
    const results: SyncResult[] = [];

    try {
      const pendingUpdates = await getPendingExternalUpdates();

      for (const update of pendingUpdates) {
        const success = await syncUpdate(update);
        results.push({
          success,
          entityType: update.entityType,
          entityId: update.entityId,
          recipientName: update.recipientName,
        });
      }

      setSyncResults(results);
      setLastSync(new Date());
      await refreshPendingCount();
    } catch (error) {
      logger.error('Erreur lors de la synchronisation:', error);
    } finally {
      setIsSyncing(false);
    }

    return results;
  }, [syncUpdate, refreshPendingCount]);

  // Écouter les nouvelles mises à jour en temps réel
  useEffect(() => {
    // Charger le compteur initial
    refreshPendingCount();

    // S'abonner aux mises à jour en temps réel
    const unsubscribe = subscribeToExternalUpdates((updates) => {
      setPendingCount(updates.length);

      // Notification si nouvelles mises à jour
      if (updates.length > 0) {
        logger.info(`${updates.length} mise(s) à jour en attente de synchronisation`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshPendingCount]);

  return {
    pendingCount,
    isSyncing,
    lastSync,
    syncResults,
    syncAllPending,
    refreshPendingCount,
  };
}
