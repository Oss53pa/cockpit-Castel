/**
 * Firebase Realtime Sync Service
 *
 * Gère la synchronisation bidirectionnelle entre Firebase et IndexedDB:
 * - Écriture des liens de mise à jour vers Firebase
 * - Réception des réponses externes en temps réel
 * - Synchronisation vers IndexedDB local
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/db';
import { getFirebaseConfig, isFirebaseConfigured } from '@/services/firebaseConfigService';
import type { Action, Jalon, Risque } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ExternalUpdateData {
  id?: string;
  token: string;
  entityType: 'action' | 'jalon' | 'risque';
  entityId: number;

  // Données de l'entité (snapshot au moment de l'envoi)
  entitySnapshot: {
    titre: string;
    statut: string;
    avancement?: number;
    date_prevue?: string;
    date_fin_prevue?: string;
    probabilite?: number;
    impact?: number;
    score?: number;
    description?: string;
  };

  // Destinataire
  recipientEmail: string;
  recipientName: string;

  // Dates
  createdAt: string;
  expiresAt: string;
  accessedAt?: string;

  // Réponse de l'utilisateur externe
  response?: {
    submittedAt: string;
    submittedBy: {
      name?: string;
      email?: string;
    };
    changes: {
      statut?: string;
      avancement?: number;
      probabilite?: number;
      impact?: number;
      score?: number;
      notes?: string;
      commentaires?: string;
    };
    liens?: Array<{ id: string; title: string; url: string }>;
    comments?: Array<{ id: string; text: string; createdAt: string }>;
  };

  // Statut
  isUsed: boolean;
  isExpired: boolean;
  isSynced: boolean; // Synchronisé vers IndexedDB local du propriétaire
  syncedAt?: string;
}

export interface RealtimeSyncCallbacks {
  onUpdateReceived?: (update: ExternalUpdateData) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLLECTION_UPDATE_LINKS = 'cockpit_update_links';
const APP_NAME = 'cockpit-realtime';

// ============================================================================
// STATE
// ============================================================================

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let unsubscribeListener: Unsubscribe | null = null;
let isListening = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialise Firebase pour la synchronisation temps réel
 */
export async function initRealtimeSync(): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, skipping realtime sync init');
    return false;
  }

  const config = getFirebaseConfig();

  if (!config.enabled || !config.apiKey || !config.projectId) {
    return false;
  }

  try {
    // Check if app already exists
    const existingApps = getApps();
    const existingApp = existingApps.find(app => app.name === APP_NAME);

    if (existingApp) {
      firebaseApp = existingApp;
    } else {
      firebaseApp = initializeApp(
        {
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
        },
        APP_NAME
      );
    }

    firestoreDb = getFirestore(firebaseApp);
    console.log('Firebase realtime sync initialized');
    return true;
  } catch (e) {
    console.error('Error initializing Firebase realtime sync:', e);
    return false;
  }
}

/**
 * Récupère l'instance Firestore
 */
export function getRealtimeFirestore(): Firestore | null {
  return firestoreDb;
}

// ============================================================================
// LINK MANAGEMENT (Envoi vers Firebase)
// ============================================================================

/**
 * Crée un lien de mise à jour dans Firebase
 * Appelé quand on envoie un email de relance
 */
export async function createUpdateLinkInFirebase(
  token: string,
  entityType: 'action' | 'jalon' | 'risque',
  entityId: number,
  entity: Action | Jalon | Risque,
  recipientEmail: string,
  recipientName: string,
  expiresAt: string
): Promise<boolean> {
  if (!firestoreDb) {
    const initialized = await initRealtimeSync();
    if (!initialized || !firestoreDb) {
      console.warn('Firebase not available, link will be local only');
      return false;
    }
  }

  try {
    const docRef = doc(firestoreDb, COLLECTION_UPDATE_LINKS, token);

    // Préparer le snapshot de l'entité
    const entitySnapshot: ExternalUpdateData['entitySnapshot'] = {
      titre: entity.titre || '',
      statut: (entity as any).statut || (entity as any).status || '',
      description: entity.description || '',
    };

    if (entityType === 'action') {
      const action = entity as Action;
      entitySnapshot.avancement = action.avancement;
      entitySnapshot.date_fin_prevue = action.date_fin_prevue;
    } else if (entityType === 'jalon') {
      const jalon = entity as Jalon;
      entitySnapshot.avancement = jalon.avancement;
      entitySnapshot.date_prevue = jalon.date_prevue;
    } else if (entityType === 'risque') {
      const risque = entity as Risque;
      entitySnapshot.probabilite = risque.probabilite;
      entitySnapshot.impact = risque.impact;
      entitySnapshot.score = risque.score;
    }

    const updateData: ExternalUpdateData = {
      token,
      entityType,
      entityId,
      entitySnapshot,
      recipientEmail,
      recipientName,
      createdAt: new Date().toISOString(),
      expiresAt,
      isUsed: false,
      isExpired: false,
      isSynced: false,
    };

    await setDoc(docRef, updateData);
    console.log('Update link created in Firebase:', token);
    return true;
  } catch (e) {
    console.error('Error creating update link in Firebase:', e);
    return false;
  }
}

/**
 * Récupère un lien depuis Firebase (pour la page externe)
 */
export async function getUpdateLinkFromFirebase(token: string): Promise<ExternalUpdateData | null> {
  if (!firestoreDb) {
    const initialized = await initRealtimeSync();
    if (!initialized || !firestoreDb) {
      return null;
    }
  }

  try {
    const docRef = doc(firestoreDb, COLLECTION_UPDATE_LINKS, token);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as ExternalUpdateData;

    // Vérifier expiration
    if (new Date(data.expiresAt) < new Date() && !data.isExpired) {
      await updateDoc(docRef, { isExpired: true });
      return { ...data, isExpired: true };
    }

    return data;
  } catch (e) {
    console.error('Error getting update link from Firebase:', e);
    return null;
  }
}

/**
 * Marque un lien comme accédé
 */
export async function markLinkAccessedInFirebase(token: string): Promise<void> {
  if (!firestoreDb) return;

  try {
    const docRef = doc(firestoreDb, COLLECTION_UPDATE_LINKS, token);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && !docSnap.data().accessedAt) {
      await updateDoc(docRef, {
        accessedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error('Error marking link accessed:', e);
  }
}

/**
 * Soumet une réponse externe (appelé depuis la page externe)
 */
export async function submitExternalResponse(
  token: string,
  response: ExternalUpdateData['response']
): Promise<boolean> {
  if (!firestoreDb) {
    const initialized = await initRealtimeSync();
    if (!initialized || !firestoreDb) {
      return false;
    }
  }

  try {
    const docRef = doc(firestoreDb, COLLECTION_UPDATE_LINKS, token);

    await updateDoc(docRef, {
      response,
      isUsed: true,
      isSynced: false, // Marquer comme non synchronisé pour déclencher la sync
    });

    console.log('External response submitted to Firebase:', token);
    return true;
  } catch (e) {
    console.error('Error submitting external response:', e);
    return false;
  }
}

// ============================================================================
// REALTIME LISTENER (Réception des mises à jour)
// ============================================================================

/**
 * Démarre l'écoute des mises à jour en temps réel
 */
export function startRealtimeListener(callbacks: RealtimeSyncCallbacks): boolean {
  if (!firestoreDb) {
    console.warn('Firebase not initialized, cannot start listener');
    return false;
  }

  if (isListening) {
    console.log('Realtime listener already active');
    return true;
  }

  try {
    // Écouter les liens avec des réponses non synchronisées
    const q = query(
      collection(firestoreDb, COLLECTION_UPDATE_LINKS),
      where('isUsed', '==', true),
      where('isSynced', '==', false)
    );

    unsubscribeListener = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data() as ExternalUpdateData;
            data.id = change.doc.id;

            console.log('Received update from Firebase:', data.token);

            if (callbacks.onUpdateReceived) {
              callbacks.onUpdateReceived(data);
            }
          }
        });
      },
      (error) => {
        console.error('Realtime listener error:', error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      }
    );

    isListening = true;
    console.log('Realtime listener started');

    if (callbacks.onConnectionChange) {
      callbacks.onConnectionChange(true);
    }

    return true;
  } catch (e) {
    console.error('Error starting realtime listener:', e);
    return false;
  }
}

/**
 * Arrête l'écoute en temps réel
 */
export function stopRealtimeListener(): void {
  if (unsubscribeListener) {
    unsubscribeListener();
    unsubscribeListener = null;
  }
  isListening = false;
  console.log('Realtime listener stopped');
}

/**
 * Vérifie si le listener est actif
 */
export function isRealtimeListenerActive(): boolean {
  return isListening;
}

// ============================================================================
// SYNC TO LOCAL (Synchronisation vers IndexedDB)
// ============================================================================

/**
 * Synchronise une mise à jour externe vers IndexedDB local
 */
export async function syncUpdateToLocal(update: ExternalUpdateData): Promise<boolean> {
  if (!update.response) {
    console.warn('No response to sync for:', update.token);
    return false;
  }

  try {
    const { entityType, entityId, response } = update;
    const changes = response.changes;

    // Préparer les données de mise à jour
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      derniere_mise_a_jour_externe: response.submittedAt,
    };

    // Appliquer les changements selon le type
    if (changes.statut) updateData.statut = changes.statut;
    if (changes.notes) updateData.notes_mise_a_jour = changes.notes;

    if (entityType === 'action') {
      if (changes.avancement !== undefined) updateData.avancement = changes.avancement;
      await db.actions.update(entityId, updateData);
    } else if (entityType === 'jalon') {
      if (changes.avancement !== undefined) updateData.avancement = changes.avancement;
      await db.jalons.update(entityId, updateData);
    } else if (entityType === 'risque') {
      if (changes.probabilite !== undefined) updateData.probabilite = changes.probabilite;
      if (changes.impact !== undefined) updateData.impact = changes.impact;
      if (changes.score !== undefined) updateData.score = changes.score;
      await db.risques.update(entityId, updateData);
    }

    // Ajouter à l'historique
    await db.historique.add({
      timestamp: new Date().toISOString(),
      entiteType: entityType,
      entiteId: entityId,
      champModifie: 'update_externe_firebase',
      ancienneValeur: '',
      nouvelleValeur: `Mise à jour reçue de ${response.submittedBy?.name || update.recipientName} via Firebase`,
      auteurId: 0,
    });

    // Créer une alerte
    const entityTypeLabel = entityType === 'action' ? 'Action' : entityType === 'jalon' ? 'Jalon' : 'Risque';
    await db.alertes.add({
      type: 'info',
      titre: `Mise à jour reçue de ${response.submittedBy?.name || update.recipientName}`,
      message: `${entityTypeLabel} "${update.entitySnapshot.titre}" a été mis(e) à jour. ${
        changes.statut ? `Nouveau statut: ${changes.statut}` : ''
      } ${changes.avancement !== undefined ? `Avancement: ${changes.avancement}%` : ''}`.trim(),
      criticite: 'medium',
      entiteType: entityType,
      entiteId: entityId,
      lu: false,
      traitee: false,
      createdAt: new Date().toISOString(),
    });

    // Marquer comme synchronisé dans Firebase
    await markUpdateAsSynced(update.token);

    console.log('Update synced to local IndexedDB:', update.token);
    return true;
  } catch (e) {
    console.error('Error syncing update to local:', e);
    return false;
  }
}

/**
 * Marque une mise à jour comme synchronisée dans Firebase
 */
async function markUpdateAsSynced(token: string): Promise<void> {
  if (!firestoreDb) return;

  try {
    const docRef = doc(firestoreDb, COLLECTION_UPDATE_LINKS, token);
    await updateDoc(docRef, {
      isSynced: true,
      syncedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Error marking update as synced:', e);
  }
}

// ============================================================================
// FETCH PENDING UPDATES (Pour sync manuelle)
// ============================================================================

/**
 * Récupère toutes les mises à jour en attente de synchronisation
 */
export async function fetchPendingUpdates(): Promise<ExternalUpdateData[]> {
  if (!firestoreDb) {
    const initialized = await initRealtimeSync();
    if (!initialized || !firestoreDb) {
      return [];
    }
  }

  try {
    const q = query(
      collection(firestoreDb, COLLECTION_UPDATE_LINKS),
      where('isUsed', '==', true),
      where('isSynced', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ExternalUpdateData));
  } catch (e) {
    console.error('Error fetching pending updates:', e);
    return [];
  }
}

/**
 * Synchronise toutes les mises à jour en attente
 */
export async function syncAllPendingUpdates(): Promise<{ synced: number; errors: number }> {
  const pending = await fetchPendingUpdates();
  let synced = 0;
  let errors = 0;

  for (const update of pending) {
    const success = await syncUpdateToLocal(update);
    if (success) {
      synced++;
    } else {
      errors++;
    }
  }

  return { synced, errors };
}
