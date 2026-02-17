/**
 * useFirebaseCleanup — Nettoyage automatique des documents Firebase expirés
 *
 * Exécuté une seule fois par session (24h minimum entre deux exécutions).
 * Lit les documents où expiresAt < now, supprime par batch (max 50).
 * Collections nettoyées : updateLinks, shared-reports.
 */

import { useEffect } from 'react';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { getRealtimeFirestore, initRealtimeSync } from '@/services/firebaseRealtimeSync';
import { logger } from '@/lib/logger';

const CLEANUP_STORAGE_KEY = 'firebase_last_cleanup';
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
const CLEANUP_BATCH_SIZE = 50;

const COLLECTIONS_TO_CLEAN = ['updateLinks', 'shared-reports'] as const;

async function runCleanup(): Promise<void> {
  // Vérifier la garde 24h
  const lastCleanup = localStorage.getItem(CLEANUP_STORAGE_KEY);
  if (lastCleanup) {
    const elapsed = Date.now() - new Date(lastCleanup).getTime();
    if (elapsed < CLEANUP_INTERVAL_MS) {
      return;
    }
  }

  let db = getRealtimeFirestore();
  if (!db) {
    const initialized = await initRealtimeSync();
    if (!initialized) return;
    db = getRealtimeFirestore();
    if (!db) return;
  }

  const now = new Date().toISOString();
  let totalDeleted = 0;

  for (const collectionName of COLLECTIONS_TO_CLEAN) {
    try {
      const q = query(
        collection(db, collectionName),
        where('expiresAt', '<', now),
        limit(CLEANUP_BATCH_SIZE)
      );

      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        try {
          await deleteDoc(docSnap.ref);
          totalDeleted++;
        } catch (e) {
          logger.warn(`[Cleanup] Erreur suppression ${collectionName}/${docSnap.id}:`, e);
        }
      }

      if (snapshot.size > 0) {
        logger.info(`[Cleanup] ${snapshot.size} documents expirés supprimés de ${collectionName}`);
      }
    } catch (e) {
      logger.warn(`[Cleanup] Erreur lecture ${collectionName}:`, e);
    }
  }

  // Mettre à jour la date de dernier nettoyage
  localStorage.setItem(CLEANUP_STORAGE_KEY, new Date().toISOString());

  if (totalDeleted > 0) {
    logger.info(`[Cleanup] Total: ${totalDeleted} documents expirés supprimés`);
  }
}

export function useFirebaseCleanup(): void {
  useEffect(() => {
    // Lancer le nettoyage en arrière-plan (non-bloquant)
    const timer = setTimeout(() => {
      runCleanup().catch((e) => {
        logger.warn('[Cleanup] Erreur nettoyage Firebase:', e);
      });
    }, 5000); // Délai de 5s pour ne pas impacter le chargement initial

    return () => clearTimeout(timer);
  }, []);
}
