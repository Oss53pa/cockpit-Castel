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
import type { LigneBudgetExploitation } from '@/types/budgetExploitation.types';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ExternalUpdateData {
  id?: string;
  token: string;
  entityType: 'action' | 'jalon' | 'risque' | 'budget';
  entityId: number;

  // Liste des utilisateurs (pour sélection responsable en externe)
  users?: Array<{
    id: number;
    nom: string;
    prenom: string;
  }>;

  // Données de l'entité (snapshot au moment de l'envoi)
  entitySnapshot: {
    titre: string;
    statut: string;
    description?: string;

    // Action
    avancement?: number;
    date_debut_prevue?: string;
    date_fin_prevue?: string;
    sous_taches?: Array<{
      id: string;
      libelle: string;
      responsableId?: number | null;
      echeance?: string | null;
      fait: boolean;
    }>;
    documents?: Array<{
      id: string;
      nom: string;
      type: string;
      url: string;
      dateAjout: string;
    }>;
    commentaires?: Array<{
      id: string;
      texte: string;
      auteur: string;
      date: string;
    }>;
    points_attention?: Array<{
      id: string;
      sujet: string;
      responsableId?: number | null;
      responsableNom?: string;
      dateCreation: string;
    }>;
    decisions_attendues?: Array<{
      id: string;
      sujet: string;
      dateCreation: string;
    }>;
    livrables?: Array<{
      id: string;
      nom: string;
      statut: string;
    }>;

    // Jalon
    date_prevue?: string;
    niveau_importance?: string;
    date_validation?: string | null;

    // Risque
    probabilite?: number;
    impact?: number;
    score?: number;
    plan_mitigation?: string;

    // Budget
    poste?: string;
    categorie?: string;
    montantPrevu?: number;
    montantEngage?: number;
    montantConsomme?: number;
    note?: string;
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
      // Commun à tous
      statut?: string;
      notes?: string;              // notes_mise_a_jour
      commentaires?: string;       // commentaires_externes (JSON string)

      // Action
      avancement?: number;
      date_debut_prevue?: string;
      date_fin_prevue?: string;
      sousTaches?: Array<{
        id: string;
        libelle: string;
        responsableId?: number | null;
        echeance?: string | null;
        fait: boolean;
      }>;
      preuves?: Array<{
        id: string;
        type: 'fichier' | 'lien';
        nom: string;
        url?: string;
        dateAjout: string;
      }>;
      liens_documents?: string;    // JSON string des preuves
      pointsAttention?: Array<{
        id: string;
        sujet: string;
        responsableId?: number | null;
        responsableNom?: string;
        dateCreation: string;
      }>;
      decisionsAttendues?: Array<{
        id: string;
        sujet: string;
        dateCreation: string;
      }>;
      livrables?: Array<{
        id: string;
        nom: string;
        statut: string;
      }>;

      // Jalon
      date_debut_prevue?: string;
      date_prevue?: string;
      niveau_importance?: string;
      date_validation?: string | null;

      // Risque
      probabilite?: number;
      impact?: number;
      score?: number;
      plan_mitigation?: string;

      // Budget
      montantEngage?: number;
      montantConsomme?: number;
      note?: string;
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

const COLLECTION_UPDATE_LINKS = 'updateLinks';
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
    logger.info('Firebase not configured, skipping realtime sync init');
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
    logger.info('Firebase realtime sync initialized');
    return true;
  } catch (e) {
    logger.error('Error initializing Firebase realtime sync:', e);
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
  entityType: 'action' | 'jalon' | 'risque' | 'budget',
  entityId: number,
  entity: Action | Jalon | Risque | LigneBudgetExploitation,
  recipientEmail: string,
  recipientName: string,
  expiresAt: string,
  users?: Array<{ id: number; nom: string; prenom: string }>
): Promise<boolean> {
  logger.info('[Firebase] Création du lien:', token, 'type:', entityType);

  if (!firestoreDb) {
    logger.info('[Firebase] Firestore non initialisé, tentative d\'initialisation...');
    const initialized = await initRealtimeSync();

    if (!initialized || !firestoreDb) {
      logger.warn('[Firebase] Échec init, tentative fallback...');

      // Fallback: essayer d'initialiser directement
      try {
        const existingApps = getApps();
        const fallbackAppName = 'cockpit-fallback';
        let fallbackApp = existingApps.find(app => app.name === fallbackAppName);

        if (!fallbackApp) {
          fallbackApp = initializeApp({
            apiKey: 'AIzaSyDyKoEfaHikYC7FyxfNuo6L1jQOEC5Y9l0',
            authDomain: 'cockpit-project-management.firebaseapp.com',
            projectId: 'cockpit-project-management',
            storageBucket: 'cockpit-project-management.firebasestorage.app',
            messagingSenderId: '525943959593',
            appId: '1:525943959593:web:2f69e6d45c76ddf5846c38',
          }, fallbackAppName);
        }

        firestoreDb = getFirestore(fallbackApp);
        logger.info('[Firebase] Fallback réussi pour création');
      } catch (fallbackError) {
        logger.error('[Firebase] Échec du fallback:', fallbackError);
        return false;
      }
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
      entitySnapshot.date_debut_prevue = action.date_debut_prevue;
      entitySnapshot.date_fin_prevue = action.date_fin_prevue;
      // Inclure les sous-tâches si présentes
      if ((action as any).sous_taches) {
        entitySnapshot.sous_taches = (action as any).sous_taches;
      }
      // Inclure les documents/preuves
      if (action.documents) {
        entitySnapshot.documents = action.documents;
      }
      // Inclure les commentaires
      if ((action as any).commentaires) {
        entitySnapshot.commentaires = (action as any).commentaires;
      }
      // Inclure les points d'attention
      if ((action as any).points_attention) {
        entitySnapshot.points_attention = (action as any).points_attention;
      }
      // Inclure les décisions attendues
      if ((action as any).decisions_attendues) {
        entitySnapshot.decisions_attendues = (action as any).decisions_attendues;
      }
      // Inclure les livrables
      if (action.livrables) {
        entitySnapshot.livrables = action.livrables.map(l => ({
          id: l.id, nom: l.nom, statut: l.statut,
        }));
      }
    } else if (entityType === 'jalon') {
      const jalon = entity as Jalon;
      entitySnapshot.date_debut_prevue = jalon.date_debut_prevue;
      entitySnapshot.date_prevue = jalon.date_prevue;
      entitySnapshot.niveau_importance = jalon.niveau_importance;
      entitySnapshot.date_validation = (jalon as any).date_validation;
      // Inclure les commentaires
      if ((jalon as any).commentaires) {
        entitySnapshot.commentaires = (jalon as any).commentaires;
      }
    } else if (entityType === 'risque') {
      const risque = entity as Risque;
      entitySnapshot.probabilite = risque.probabilite;
      entitySnapshot.impact = risque.impact;
      entitySnapshot.score = risque.score;
      entitySnapshot.plan_mitigation = (risque as any).plan_mitigation;
      // Inclure les commentaires
      if ((risque as any).commentaires) {
        entitySnapshot.commentaires = (risque as any).commentaires;
      }
    } else if (entityType === 'budget') {
      const budget = entity as LigneBudgetExploitation;
      entitySnapshot.titre = budget.poste;
      entitySnapshot.poste = budget.poste;
      entitySnapshot.categorie = budget.categorie;
      entitySnapshot.montantPrevu = budget.montantPrevu;
      entitySnapshot.montantEngage = budget.montantEngage;
      entitySnapshot.montantConsomme = budget.montantConsomme;
      entitySnapshot.note = budget.note;
      entitySnapshot.description = budget.description;
    }

    const updateData: ExternalUpdateData = {
      token,
      entityType,
      entityId,
      entitySnapshot,
      users, // Liste des utilisateurs pour sélection en externe
      recipientEmail,
      recipientName,
      createdAt: new Date().toISOString(),
      expiresAt,
      isUsed: false,
      isExpired: false,
      isSynced: false,
    };

    await setDoc(docRef, updateData);
    logger.info('[Firebase] Lien créé avec succès dans Firestore:', token);
    return true;
  } catch (e) {
    logger.error('[Firebase] Erreur lors de la création du lien:', e);
    return false;
  }
}

/**
 * Récupère un lien depuis Firebase (pour la page externe)
 * Utilise la config par défaut si nécessaire pour les appareils externes
 */
export async function getUpdateLinkFromFirebase(token: string): Promise<ExternalUpdateData | null> {
  logger.info('[Firebase] Tentative de récupération du lien:', token);

  // Forcer l'initialisation si pas encore fait
  if (!firestoreDb) {
    logger.info('[Firebase] Firestore non initialisé, tentative d\'initialisation...');
    const initialized = await initRealtimeSync();
    logger.info('[Firebase] Résultat initialisation:', initialized);

    if (!initialized || !firestoreDb) {
      logger.error('[Firebase] Échec de l\'initialisation de Firestore');

      // Fallback: essayer d'initialiser directement avec la config par défaut
      try {
        logger.info('[Firebase] Tentative de fallback avec config par défaut...');
        const existingApps = getApps();
        const fallbackAppName = 'cockpit-fallback';
        let fallbackApp = existingApps.find(app => app.name === fallbackAppName);

        if (!fallbackApp) {
          // Config par défaut hardcodée pour les appareils externes
          fallbackApp = initializeApp({
            apiKey: 'AIzaSyDyKoEfaHikYC7FyxfNuo6L1jQOEC5Y9l0',
            authDomain: 'cockpit-project-management.firebaseapp.com',
            projectId: 'cockpit-project-management',
            storageBucket: 'cockpit-project-management.firebasestorage.app',
            messagingSenderId: '525943959593',
            appId: '1:525943959593:web:2f69e6d45c76ddf5846c38',
          }, fallbackAppName);
        }

        firestoreDb = getFirestore(fallbackApp);
        logger.info('[Firebase] Fallback réussi, Firestore initialisé');
      } catch (fallbackError) {
        logger.error('[Firebase] Échec du fallback:', fallbackError);
        return null;
      }
    }
  }

  try {
    logger.info('[Firebase] Lecture du document:', COLLECTION_UPDATE_LINKS, '/', token);
    const docRef = doc(firestoreDb, COLLECTION_UPDATE_LINKS, token);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      logger.info('[Firebase] Document non trouvé pour le token:', token);
      return null;
    }

    const data = docSnap.data() as ExternalUpdateData;
    logger.info('[Firebase] Document trouvé:', { token: data.token, entityType: data.entityType, entityId: data.entityId });

    // Vérifier expiration
    if (new Date(data.expiresAt) < new Date() && !data.isExpired) {
      await updateDoc(docRef, { isExpired: true });
      return { ...data, isExpired: true };
    }

    return data;
  } catch (e) {
    logger.error('[Firebase] Erreur lors de la récupération du lien:', e);
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
    logger.error('Error marking link accessed:', e);
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

    logger.info('External response submitted to Firebase:', token);
    return true;
  } catch (e) {
    logger.error('Error submitting external response:', e);
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
    logger.warn('Firebase not initialized, cannot start listener');
    return false;
  }

  if (isListening) {
    logger.info('Realtime listener already active');
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

            logger.info('Received update from Firebase:', data.token);

            if (callbacks.onUpdateReceived) {
              callbacks.onUpdateReceived(data);
            }
          }
        });
      },
      (error) => {
        logger.error('Realtime listener error:', error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      }
    );

    isListening = true;
    logger.info('Realtime listener started');

    if (callbacks.onConnectionChange) {
      callbacks.onConnectionChange(true);
    }

    return true;
  } catch (e) {
    logger.error('Error starting realtime listener:', e);
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
  logger.info('Realtime listener stopped');
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
    logger.warn('[SyncToLocal] No response to sync for:', update.token);
    return false;
  }

  // Directive CRMC Règle 2 & 3 : Protection des verrous + traçabilité
  const { withWriteContext } = await import('@/db/writeContext');

  return withWriteContext({ source: 'sync-firebase', auteurId: 0, description: `Sync Firebase ${update.token}` }, async () => {
    try {
      const { entityType, entityId, response } = update;
      const changes = response.changes;

      logger.info('[SyncToLocal] Synchronisation pour:', entityType, entityId);

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
        derniere_mise_a_jour_externe: response.submittedAt,
      };

      // Appliquer les changements communs
      if (changes.statut) updateData.statut = changes.statut;
      if (changes.notes) updateData.notes_mise_a_jour = changes.notes;
      if (changes.commentaires) updateData.commentaires_externes = changes.commentaires;

      if (entityType === 'action') {
        // Directive CRMC Règle 2 : Vérifier le verrouillage manuel avant de modifier les dates
        const currentAction = await db.actions.get(entityId);
        const isLocked = currentAction?.date_verrouillage_manuel;

        if (changes.avancement !== undefined) updateData.avancement = changes.avancement;

        // Ne pas écraser les dates si l'entité est verrouillée
        if (!isLocked) {
          if (changes.date_debut_prevue !== undefined) updateData.date_debut_prevue = changes.date_debut_prevue;
          if (changes.date_fin_prevue !== undefined) updateData.date_fin_prevue = changes.date_fin_prevue;
        } else {
          logger.info('[SyncToLocal] Action verrouillée — dates ignorées');
        }

        // Merger les sous-tâches par ID au lieu de remplacer
        if (changes.sousTaches !== undefined && currentAction?.sous_taches) {
          const existingMap = new Map(
            (currentAction.sous_taches as Array<{ id: string; [k: string]: unknown }>)
              .filter(st => st.id)
              .map(st => [st.id, st])
          );
          for (const incoming of changes.sousTaches) {
            if (incoming.id) existingMap.set(incoming.id, incoming);
            else existingMap.set(crypto.randomUUID(), incoming);
          }
          updateData.sous_taches = Array.from(existingMap.values());
        } else if (changes.sousTaches !== undefined) {
          updateData.sous_taches = changes.sousTaches;
        }

        // Merger les documents/preuves par ID
        if (changes.preuves !== undefined && currentAction?.documents) {
          const existingDocs = new Map(
            (currentAction.documents as Array<{ id: string; [k: string]: unknown }>)
              .filter(d => d.id)
              .map(d => [d.id, d])
          );
          for (const p of changes.preuves) {
            existingDocs.set(p.id, {
              id: p.id,
              nom: p.nom,
              type: p.type,
              url: p.url || '',
              dateAjout: p.dateAjout,
            });
          }
          updateData.documents = Array.from(existingDocs.values());
        } else if (changes.preuves !== undefined) {
          updateData.documents = changes.preuves.map(p => ({
            id: p.id,
            nom: p.nom,
            type: p.type,
            url: p.url || '',
            dateAjout: p.dateAjout,
          }));
        }

        if (changes.liens_documents) updateData.liens_documents = changes.liens_documents;
        if (changes.pointsAttention !== undefined) updateData.points_attention = changes.pointsAttention;
        if (changes.decisionsAttendues !== undefined) updateData.decisions_attendues = changes.decisionsAttendues;
        if (changes.livrables !== undefined) {
          updateData.livrables = changes.livrables.map(l => ({
            id: l.id,
            nom: l.nom,
            description: null,
            statut: l.statut || 'en_attente',
            obligatoire: false,
            date_prevue: null,
            date_livraison: l.statut === 'valide' ? new Date().toISOString().split('T')[0] : null,
            validateur: null,
          }));
        }

        await db.actions.update(entityId, updateData);
      } else if (entityType === 'jalon') {
        // Directive CRMC Règle 2 : Vérifier le verrouillage avant dates
        const currentJalon = await db.jalons.get(entityId);
        const isLocked = currentJalon?.date_verrouillage_manuel;

        if (changes.niveau_importance !== undefined) updateData.niveau_importance = changes.niveau_importance;
        if (changes.date_debut_prevue !== undefined && !isLocked) {
          updateData.date_debut_prevue = changes.date_debut_prevue;
        }
        if (changes.date_prevue !== undefined && !isLocked) {
          updateData.date_prevue = changes.date_prevue;
        }
        if (changes.date_validation !== undefined && !isLocked) {
          updateData.date_validation = changes.date_validation;
        } else if (isLocked && (changes.date_debut_prevue || changes.date_prevue || changes.date_validation)) {
          logger.info('[SyncToLocal] Jalon verrouillé — dates ignorées');
        }

        await db.jalons.update(entityId, updateData);
      } else if (entityType === 'risque') {
        if (changes.probabilite !== undefined) updateData.probabilite = changes.probabilite;
        if (changes.impact !== undefined) updateData.impact = changes.impact;
        if (changes.score !== undefined) updateData.score = changes.score;
        if (changes.plan_mitigation !== undefined) updateData.plan_mitigation = changes.plan_mitigation;

        await db.risques.update(entityId, updateData);
      } else if (entityType === 'budget') {
        const budgetUpdate: Record<string, any> = {
          updatedAt: new Date().toISOString(),
        };
        if (changes.montantEngage !== undefined) budgetUpdate.montantEngage = changes.montantEngage;
        if (changes.montantConsomme !== undefined) budgetUpdate.montantConsomme = changes.montantConsomme;
        if (changes.note !== undefined) budgetUpdate.note = changes.note;
        if (changes.commentaires) budgetUpdate.commentaires_externes = changes.commentaires;

        await db.budgetExploitation.update(entityId, budgetUpdate);
      }

      // L'historique est maintenant géré automatiquement par le middleware d'audit (Directive CRMC Règle 3)
      // On ajoute quand même un résumé lisible pour la notification
      await db.historique.add({
        timestamp: new Date().toISOString(),
        entiteType: entityType,
        entiteId: entityId,
        champModifie: 'update_externe_firebase',
        ancienneValeur: '',
        nouvelleValeur: `Mise à jour reçue de ${response.submittedBy?.name || update.recipientName} via Firebase`,
        auteurId: 0,
        source: 'sync-firebase',
      });

      // Créer une alerte
      const entityTypeLabel = entityType === 'action' ? 'Action' : entityType === 'jalon' ? 'Jalon' : entityType === 'budget' ? 'Budget' : 'Risque';
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

      await markUpdateAsSynced(update.token);

      logger.info('Update synced to local IndexedDB:', update.token);
      return true;
    } catch (e) {
      logger.error('Error syncing update to local:', e);
      return false;
    }
  });
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
    logger.error('Error marking update as synced:', e);
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
    logger.error('Error fetching pending updates:', e);
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

// ============================================================================
// SHARED REPORTS (Stockage HTML rapport dans Firestore)
// ============================================================================

// Use the same collection as updateLinks to reuse existing Firestore rules
const COLLECTION_SHARED_REPORTS = 'updateLinks';

// Max size per Firestore document field (~900KB to stay safe under 1MB limit)
const MAX_CHUNK_SIZE = 900_000;

/**
 * Stocke le HTML d'un rapport dans Firebase.
 * Si le HTML est petit (< 900KB), il est stocké inline dans Firestore.
 * Si le HTML est gros, il est découpé en chunks dans des sous-documents.
 */
export async function storeReportInFirebase(
  token: string,
  html: string,
  metadata: {
    title: string;
    period: string;
    senderName: string;
    expiresAt: string;
  }
): Promise<boolean> {
  if (!firestoreDb) {
    const initialized = await initRealtimeSync();
    if (!initialized || !firestoreDb) {
      logger.error('[Firebase] Impossible d\'initialiser Firestore pour le rapport');
      return false;
    }
  }

  try {
    const htmlBytes = new Blob([html]).size;
    const docRef = doc(firestoreDb, COLLECTION_SHARED_REPORTS, token);

    if (htmlBytes <= MAX_CHUNK_SIZE) {
      // Small enough — store inline
      await setDoc(docRef, {
        type: 'report',
        html,
        title: metadata.title,
        period: metadata.period,
        senderName: metadata.senderName,
        expiresAt: metadata.expiresAt,
        createdAt: serverTimestamp(),
        viewCount: 0,
      });
    } else {
      // Too big — split into chunks stored in sub-collection
      const totalChunks = Math.ceil(html.length / MAX_CHUNK_SIZE);
      await setDoc(docRef, {
        type: 'report',
        title: metadata.title,
        period: metadata.period,
        senderName: metadata.senderName,
        expiresAt: metadata.expiresAt,
        createdAt: serverTimestamp(),
        viewCount: 0,
        chunked: true,
        totalChunks,
      });

      // Store each chunk as a sub-document
      for (let i = 0; i < totalChunks; i++) {
        const chunk = html.slice(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE);
        const chunkRef = doc(firestoreDb, COLLECTION_SHARED_REPORTS, token, 'chunks', String(i));
        await setDoc(chunkRef, { data: chunk, index: i });
      }
      logger.info(`[Firebase] Rapport stocké en ${totalChunks} chunks:`, token);
    }

    logger.info('[Firebase] Rapport stocké:', token);
    return true;
  } catch (error) {
    logger.error('[Firebase] Erreur stockage rapport:', error);
    return false;
  }
}

/**
 * Récupère le HTML d'un rapport partagé depuis Firebase.
 * Supporte à la fois le HTML inline et le HTML chunked.
 */
export async function getReportFromFirebase(
  token: string
): Promise<{ html: string; title: string; period: string; expiresAt: string } | null> {
  if (!firestoreDb) {
    const initialized = await initRealtimeSync();
    if (!initialized || !firestoreDb) {
      logger.error('[Firebase] Impossible d\'initialiser Firestore pour lire le rapport');
      return null;
    }
  }

  try {
    const docRef = doc(firestoreDb, COLLECTION_SHARED_REPORTS, token);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      logger.warn('[Firebase] Rapport non trouvé:', token);
      return null;
    }

    const data = docSnap.data();

    // Vérifier l'expiration
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      logger.warn('[Firebase] Rapport expiré:', token);
      return null;
    }

    // Incrémenter le compteur de vues (non-blocking)
    try {
      await updateDoc(docRef, { viewCount: (data.viewCount || 0) + 1 });
    } catch {
      // ignore
    }

    // Retrieve HTML
    let html: string | null = null;

    if (data.chunked && data.totalChunks) {
      // Reassemble from chunks
      const chunksCol = collection(firestoreDb, COLLECTION_SHARED_REPORTS, token, 'chunks');
      const chunksSnap = await getDocs(chunksCol);
      const chunks: { index: number; data: string }[] = [];
      chunksSnap.forEach(d => chunks.push(d.data() as { index: number; data: string }));
      chunks.sort((a, b) => a.index - b.index);
      html = chunks.map(c => c.data).join('');
    } else if (data.html) {
      html = data.html;
    }

    if (!html) {
      logger.warn('[Firebase] Aucun HTML trouvé pour le rapport:', token);
      return null;
    }

    return {
      html,
      title: data.title,
      period: data.period,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    logger.error('[Firebase] Erreur lecture rapport:', error);
    return null;
  }
}

// ============================================================================
// SHARED REPORT SNAPSHOTS (données complètes pour /reports/share/:shareId)
// ============================================================================

const COLLECTION_SHARED_SNAPSHOTS = 'shared-reports';

export interface SharedReportSnapshot {
  reportTitle: string;
  reportType: string;
  author: string;
  createdAt: string;
  expiresAt: string | null;
  period: string;
  executiveSummary?: string;
  comments?: Array<{ section: string; content: string; author: string; date: string }>;
  // Snapshot complet des données projet au moment du partage
  snapshot: {
    actions: Array<{ statut: string; axe?: string; titre?: string }>;
    jalons: Array<{ titre: string; statut: string; date_prevue?: string; avancement_prealables?: number }>;
    risques: Array<{ titre: string; categorie?: string; score?: number; status?: string }>;
    budget: { prevu: number; engage: number; realise: number };
    kpis: {
      jalonsAtteints: number;
      jalonsTotal: number;
      actionsTerminees: number;
      totalActions: number;
      totalRisques: number;
      budgetTotal: number;
      budgetConsomme: number;
      tauxOccupation: number;
      equipeTaille: number;
      projectName: string;
    };
  };
}

/**
 * Stocke un snapshot complet de rapport dans Firebase pour accès externe.
 * Collection: shared-reports/{shareId}
 */
export async function storeSharedReportSnapshot(
  shareId: string,
  data: SharedReportSnapshot
): Promise<boolean> {
  if (!firestoreDb) {
    const initialized = await initRealtimeSync();
    if (!initialized || !firestoreDb) {
      logger.error('[Firebase] Impossible d\'initialiser Firestore pour le snapshot');
      return false;
    }
  }

  try {
    const docRef = doc(firestoreDb, COLLECTION_SHARED_SNAPSHOTS, shareId);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      viewCount: 0,
    });
    logger.info('[Firebase] Snapshot rapport partagé stocké:', shareId);
    return true;
  } catch (error) {
    logger.error('[Firebase] Erreur stockage snapshot:', error);
    return false;
  }
}

/**
 * Récupère un snapshot de rapport partagé depuis Firebase.
 * Vérifie l'expiration et incrémente le compteur de vues.
 */
export async function getSharedReportSnapshot(
  shareId: string
): Promise<SharedReportSnapshot | null> {
  if (!firestoreDb) {
    const initialized = await initRealtimeSync();
    if (!initialized || !firestoreDb) {
      logger.error('[Firebase] Impossible d\'initialiser Firestore pour lire le snapshot');
      return null;
    }
  }

  try {
    const docRef = doc(firestoreDb, COLLECTION_SHARED_SNAPSHOTS, shareId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      logger.warn('[Firebase] Snapshot rapport non trouvé:', shareId);
      return null;
    }

    const data = docSnap.data() as SharedReportSnapshot & { viewCount?: number };

    // Vérifier l'expiration
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      logger.warn('[Firebase] Snapshot rapport expiré:', shareId);
      return null;
    }

    // Incrémenter le compteur de vues (non-blocking)
    try {
      await updateDoc(docRef, { viewCount: (data.viewCount || 0) + 1 });
    } catch {
      // ignore
    }

    return data;
  } catch (error) {
    logger.error('[Firebase] Erreur lecture snapshot:', error);
    return null;
  }
}
