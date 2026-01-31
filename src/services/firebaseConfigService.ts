/**
 * Firebase Configuration Service
 * Gère la configuration dynamique de Firebase depuis l'interface utilisateur
 */

import { initializeApp, getApps, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  type Firestore,
} from 'firebase/firestore';
import { db } from '@/db';
import { getAllUpdateLinks } from '@/services/emailService';

// ============================================================================
// TYPES
// ============================================================================

export interface FirebaseConfig {
  enabled: boolean;
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

interface SyncStats {
  totalLinks: number;
  syncedLinks: number;
  pendingLinks: number;
  lastSync: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONFIG_KEY = 'firebase_config';
const SYNC_STATS_KEY = 'firebase_sync_stats';
const UPDATE_LINKS_COLLECTION = 'updateLinks';
const UPDATE_RESPONSES_COLLECTION = 'updateResponses';

// Default config (values from existing firebase.ts for backward compatibility)
// Firebase est activé par défaut pour la synchronisation temps réel
const DEFAULT_CONFIG: FirebaseConfig = {
  enabled: true,
  apiKey: 'AIzaSyDyKoEfaHikYC7FyxfNuo6L1jQOEC5Y9l0',
  authDomain: 'cockpit-project-management.firebaseapp.com',
  projectId: 'cockpit-project-management',
  storageBucket: 'cockpit-project-management.firebasestorage.app',
  messagingSenderId: '525943959593',
  appId: '1:525943959593:web:2f69e6d45c76ddf5846c38',
  measurementId: 'G-43WJ8SGNCH',
};

// ============================================================================
// STATE
// ============================================================================

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let configCache: FirebaseConfig | null = null;

// ============================================================================
// CONFIGURATION FUNCTIONS
// ============================================================================

/**
 * Récupère la configuration Firebase
 */
export function getFirebaseConfig(): FirebaseConfig {
  if (configCache) {
    return configCache;
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      configCache = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      return configCache;
    }
  } catch (e) {
    console.error('Error loading Firebase config:', e);
  }

  return DEFAULT_CONFIG;
}

/**
 * Récupère la configuration de manière asynchrone (depuis IndexedDB)
 */
export async function getFirebaseConfigAsync(): Promise<FirebaseConfig> {
  try {
    const stored = await db.secureConfigs.where('key').equals(CONFIG_KEY).first();
    if (stored) {
      configCache = { ...DEFAULT_CONFIG, ...JSON.parse(stored.value) };
      return configCache;
    }
  } catch (e) {
    console.error('Error loading Firebase config from IndexedDB:', e);
  }

  // Fallback to localStorage
  return getFirebaseConfig();
}

/**
 * Sauvegarde la configuration Firebase
 */
export async function saveFirebaseConfig(config: Partial<FirebaseConfig>): Promise<void> {
  try {
    const current = await getFirebaseConfigAsync();
    const updated = { ...current, ...config };

    const now = new Date().toISOString();

    // Save to IndexedDB
    const existing = await db.secureConfigs.where('key').equals(CONFIG_KEY).first();
    if (existing) {
      await db.secureConfigs.update(existing.id!, {
        value: JSON.stringify(updated),
        updatedAt: now,
      });
    } else {
      await db.secureConfigs.add({
        key: CONFIG_KEY,
        value: JSON.stringify(updated),
        isEncrypted: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Also save to localStorage for sync access
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));

    // Update cache
    configCache = updated;

    // Reinitialize Firebase if config changed
    if (updated.enabled) {
      await initializeFirebaseApp();
    } else {
      await disconnectFirebase();
    }
  } catch (e) {
    console.error('Error saving Firebase config:', e);
    throw e;
  }
}

/**
 * Vérifie si Firebase est correctement configuré
 */
export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return !!(config.apiKey && config.projectId && config.enabled);
}

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

/**
 * Initialise l'application Firebase avec la configuration actuelle
 */
export async function initializeFirebaseApp(): Promise<FirebaseApp | null> {
  const config = getFirebaseConfig();

  if (!config.enabled || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    // Disconnect existing app if any
    await disconnectFirebase();

    // Create new app
    const firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      measurementId: config.measurementId,
    };

    firebaseApp = initializeApp(firebaseConfig, 'cockpit-dynamic');
    firestoreDb = getFirestore(firebaseApp);

    console.info('Firebase initialized successfully');
    return firebaseApp;
  } catch (e) {
    console.error('Error initializing Firebase:', e);
    return null;
  }
}

/**
 * Déconnecte Firebase
 */
export async function disconnectFirebase(): Promise<void> {
  try {
    if (firebaseApp) {
      await deleteApp(firebaseApp);
      firebaseApp = null;
      firestoreDb = null;
    }
  } catch (e) {
    console.error('Error disconnecting Firebase:', e);
  }
}

/**
 * Récupère l'instance Firestore
 */
export function getFirestoreInstance(): Firestore | null {
  return firestoreDb;
}

// ============================================================================
// CONNECTION TEST
// ============================================================================

/**
 * Teste la connexion Firebase
 */
export async function testFirebaseConnection(
  config?: FirebaseConfig
): Promise<{ success: boolean; message: string }> {
  const testConfig = config || getFirebaseConfig();

  if (!testConfig.apiKey || !testConfig.projectId) {
    return { success: false, message: 'API Key et Project ID requis' };
  }

  try {
    // Create temporary app for testing
    const existingApps = getApps();
    const testAppName = 'cockpit-test-' + Date.now();

    const testApp = initializeApp(
      {
        apiKey: testConfig.apiKey,
        authDomain: testConfig.authDomain,
        projectId: testConfig.projectId,
        storageBucket: testConfig.storageBucket,
        messagingSenderId: testConfig.messagingSenderId,
        appId: testConfig.appId,
      },
      testAppName
    );

    const testDb = getFirestore(testApp);

    // Try to read a document to verify connection
    const testQuery = query(
      collection(testDb, '_connection_test'),
      limit(1)
    );

    await getDocs(testQuery);

    // Cleanup test app
    await deleteApp(testApp);

    return { success: true, message: 'Connexion reussie!' };
  } catch (e: any) {
    console.error('Firebase connection test failed:', e);

    // Parse error for user-friendly message
    if (e.code === 'permission-denied') {
      return {
        success: true,
        message: 'Connexion reussie! (regles Firestore a configurer)',
      };
    }

    if (e.message?.includes('invalid-api-key')) {
      return { success: false, message: 'API Key invalide' };
    }

    if (e.message?.includes('network')) {
      return { success: false, message: 'Erreur reseau - verifiez votre connexion' };
    }

    return { success: false, message: e.message || 'Erreur de connexion' };
  }
}

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

/**
 * Synchronise les liens de mise à jour vers Firebase
 */
export async function syncUpdateLinksToFirebase(): Promise<{
  success: boolean;
  synced: number;
  error?: string;
}> {
  if (!isFirebaseConfigured()) {
    return { success: false, synced: 0, error: 'Firebase non configure' };
  }

  // Initialize Firebase if needed
  if (!firestoreDb) {
    await initializeFirebaseApp();
  }

  if (!firestoreDb) {
    return { success: false, synced: 0, error: 'Impossible d\'initialiser Firebase' };
  }

  try {
    const localLinks = await getAllUpdateLinks();
    let synced = 0;

    for (const link of localLinks) {
      const docRef = doc(firestoreDb, UPDATE_LINKS_COLLECTION, link.token);

      await setDoc(docRef, {
        token: link.token,
        entityType: link.entityType,
        entityId: link.entityId,
        recipientEmail: link.recipientEmail,
        recipientName: link.recipientName,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        isUsed: link.isUsed,
        isExpired: link.isExpired,
        accessedAt: link.accessedAt || null,
        updatedAt: link.updatedAt || null,
        syncedAt: new Date().toISOString(),
      });

      synced++;
    }

    // Update sync stats
    await updateSyncStats(localLinks.length, synced);

    return { success: true, synced };
  } catch (e: any) {
    console.error('Error syncing to Firebase:', e);
    return { success: false, synced: 0, error: e.message };
  }
}

/**
 * Synchronise un seul lien vers Firebase (appelé automatiquement lors de l'envoi)
 */
export async function syncSingleLinkToFirebase(link: {
  token: string;
  entityType: string;
  entityId: number;
  recipientEmail: string;
  recipientName: string;
  createdAt: string;
  expiresAt: string;
  entityData?: any;
}): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    return false;
  }

  // Initialize Firebase if needed
  if (!firestoreDb) {
    await initializeFirebaseApp();
  }

  if (!firestoreDb) {
    return false;
  }

  try {
    const docRef = doc(firestoreDb, UPDATE_LINKS_COLLECTION, link.token);

    await setDoc(docRef, {
      ...link,
      isUsed: false,
      isExpired: false,
      syncedAt: new Date().toISOString(),
    });

    return true;
  } catch (e) {
    console.error('Error syncing single link to Firebase:', e);
    return false;
  }
}

/**
 * Récupère les réponses depuis Firebase
 */
export async function fetchResponsesFromFirebase(): Promise<any[]> {
  if (!isFirebaseConfigured() || !firestoreDb) {
    return [];
  }

  try {
    const responsesRef = collection(firestoreDb, UPDATE_RESPONSES_COLLECTION);
    const q = query(responsesRef, orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (e) {
    console.error('Error fetching responses from Firebase:', e);
    return [];
  }
}

// ============================================================================
// STATS FUNCTIONS
// ============================================================================

/**
 * Met à jour les statistiques de synchronisation
 */
async function updateSyncStats(total: number, synced: number): Promise<void> {
  const stats = {
    totalLinks: total,
    syncedLinks: synced,
    pendingLinks: total - synced,
    lastSync: new Date().toISOString(),
  };

  localStorage.setItem(SYNC_STATS_KEY, JSON.stringify(stats));
}

/**
 * Récupère les statistiques de synchronisation
 */
export async function getFirebaseSyncStats(): Promise<SyncStats> {
  try {
    // Get stored stats
    const stored = localStorage.getItem(SYNC_STATS_KEY);
    const storedStats = stored ? JSON.parse(stored) : null;

    // Get current link count
    const links = await getAllUpdateLinks();

    return {
      totalLinks: links.length,
      syncedLinks: storedStats?.syncedLinks || 0,
      pendingLinks: links.length - (storedStats?.syncedLinks || 0),
      lastSync: storedStats?.lastSync || null,
    };
  } catch (e) {
    console.error('Error getting sync stats:', e);
    return {
      totalLinks: 0,
      syncedLinks: 0,
      pendingLinks: 0,
      lastSync: null,
    };
  }
}

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

/**
 * Initialise Firebase au démarrage si configuré
 */
export async function initFirebaseOnStartup(): Promise<void> {
  const config = getFirebaseConfig();
  if (config.enabled && config.apiKey && config.projectId) {
    await initializeFirebaseApp();
  }
}
