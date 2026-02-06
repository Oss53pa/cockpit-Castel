import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDyKoEfaHikYC7FyxfNuo6L1jQOEC5Y9l0",
  authDomain: "cockpit-project-management.firebaseapp.com",
  projectId: "cockpit-project-management",
  storageBucket: "cockpit-project-management.firebasestorage.app",
  messagingSenderId: "525943959593",
  appId: "1:525943959593:web:2f69e6d45c76ddf5846c38",
  measurementId: "G-43WJ8SGNCH"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Collections Firestore
const UPDATE_LINKS_COLLECTION = 'updateLinks';
const EXTERNAL_UPDATES_COLLECTION = 'externalUpdates';

export interface FirebaseUpdateLink {
  token: string;
  entityType: 'action' | 'jalon' | 'risque' | 'budget';
  entityId: number;
  recipientEmail: string;
  recipientName: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  isExpired: boolean;
  usedAt?: string;
  // Données de l'entité pour affichage (évite de dépendre de IndexedDB local)
  entityData?: {
    titre?: string;
    statut?: string;
    date_prevue?: string;
    date_fin_prevue?: string;
    avancement?: number;
    livrables?: string;
    categorie?: string;
    score?: number;
    probabilite?: number;
    impact?: number;
    // Budget
    poste?: string;
    montantPrevu?: number;
    montantEngage?: number;
    montantConsomme?: number;
  };
}

/**
 * Créer un lien de mise à jour dans Firestore
 */
export async function createFirebaseUpdateLink(link: FirebaseUpdateLink): Promise<void> {
  const docRef = doc(firestore, UPDATE_LINKS_COLLECTION, link.token);
  await setDoc(docRef, {
    ...link,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
  });
}

/**
 * Récupérer un lien par son token
 */
export async function getFirebaseUpdateLink(token: string): Promise<FirebaseUpdateLink | null> {
  const docRef = doc(firestore, UPDATE_LINKS_COLLECTION, token);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data() as FirebaseUpdateLink;

  // Vérifier si expiré
  if (new Date(data.expiresAt) < new Date() && !data.isExpired) {
    await updateDoc(docRef, { isExpired: true });
    return { ...data, isExpired: true };
  }

  return data;
}

/**
 * Marquer un lien comme utilisé
 */
export async function markFirebaseLinkUsed(token: string): Promise<void> {
  const docRef = doc(firestore, UPDATE_LINKS_COLLECTION, token);
  await updateDoc(docRef, {
    isUsed: true,
    usedAt: new Date().toISOString(),
  });
}

/**
 * Marquer un lien comme accédé (première visite)
 */
export async function markFirebaseLinkAccessed(token: string): Promise<void> {
  const docRef = doc(firestore, UPDATE_LINKS_COLLECTION, token);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    if (!data.accessedAt) {
      await updateDoc(docRef, {
        accessedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Récupérer tous les liens pour une entité
 */
export async function getFirebaseLinksByEntity(
  entityType: 'action' | 'jalon' | 'risque' | 'budget',
  entityId: number
): Promise<FirebaseUpdateLink[]> {
  const q = query(
    collection(firestore, UPDATE_LINKS_COLLECTION),
    where('entityType', '==', entityType),
    where('entityId', '==', entityId)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as FirebaseUpdateLink);
}

/**
 * Récupérer tous les liens envoyés (pour l'historique)
 */
export async function getAllFirebaseLinks(): Promise<FirebaseUpdateLink[]> {
  const querySnapshot = await getDocs(collection(firestore, UPDATE_LINKS_COLLECTION));
  return querySnapshot.docs.map(doc => doc.data() as FirebaseUpdateLink);
}

// ============================================
// MISES À JOUR EXTERNES (depuis le formulaire)
// ============================================

export interface ExternalUpdate {
  id?: string;
  token: string;
  entityType: 'action' | 'jalon' | 'risque' | 'budget';
  entityId: number;
  recipientEmail: string;
  recipientName: string;
  createdAt: string;
  // Données mises à jour
  updates: {
    statut?: string;
    avancement?: number;
    probabilite?: number;
    impact?: number;
    score?: number;
    notes_mise_a_jour?: string;
    liens_documents?: string;
    commentaires_externes?: string;
    // Budget
    montantEngage?: number;
    montantConsomme?: number;
    note?: string;
  };
  // Statut de synchronisation
  isSynced: boolean;
  syncedAt?: string;
}

/**
 * Sauvegarder une mise à jour externe dans Firebase
 */
export async function saveExternalUpdate(update: ExternalUpdate): Promise<string> {
  const updateId = `${update.entityType}_${update.entityId}_${Date.now()}`;
  const docRef = doc(firestore, EXTERNAL_UPDATES_COLLECTION, updateId);

  await setDoc(docRef, {
    ...update,
    id: updateId,
    createdAt: new Date().toISOString(),
    isSynced: false,
  });

  // Marquer le lien comme utilisé
  await markFirebaseLinkUsed(update.token);

  return updateId;
}

/**
 * Récupérer toutes les mises à jour non synchronisées
 */
export async function getPendingExternalUpdates(): Promise<ExternalUpdate[]> {
  const q = query(
    collection(firestore, EXTERNAL_UPDATES_COLLECTION),
    where('isSynced', '==', false),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as ExternalUpdate);
}

/**
 * Récupérer les mises à jour pour une entité spécifique
 */
export async function getExternalUpdatesByEntity(
  entityType: 'action' | 'jalon' | 'risque' | 'budget',
  entityId: number
): Promise<ExternalUpdate[]> {
  const q = query(
    collection(firestore, EXTERNAL_UPDATES_COLLECTION),
    where('entityType', '==', entityType),
    where('entityId', '==', entityId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as ExternalUpdate);
}

/**
 * Marquer une mise à jour comme synchronisée
 */
export async function markUpdateSynced(updateId: string): Promise<void> {
  const docRef = doc(firestore, EXTERNAL_UPDATES_COLLECTION, updateId);
  await updateDoc(docRef, {
    isSynced: true,
    syncedAt: new Date().toISOString(),
  });
}

/**
 * Écouter les nouvelles mises à jour en temps réel
 */
export function subscribeToExternalUpdates(
  callback: (updates: ExternalUpdate[]) => void
): Unsubscribe {
  const q = query(
    collection(firestore, EXTERNAL_UPDATES_COLLECTION),
    where('isSynced', '==', false),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const updates = snapshot.docs.map(doc => doc.data() as ExternalUpdate);
    callback(updates);
  });
}

/**
 * Compter les mises à jour en attente
 */
export async function countPendingUpdates(): Promise<number> {
  const updates = await getPendingExternalUpdates();
  return updates.length;
}

export { firestore };
