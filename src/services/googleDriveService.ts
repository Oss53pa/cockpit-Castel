// ============================================================================
// SERVICE GOOGLE DRIVE - Synchronisation des données
// ============================================================================

import { db } from '@/db';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FOLDER_NAME = 'Cockpit-Cosmos-Backups';
const BACKUP_FILE_PREFIX = 'cockpit-backup-';

interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

interface BackupMetadata {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  size: string;
}

interface BackupData {
  version: string;
  exportedAt: string;
  metadata: {
    actionsCount: number;
    jalonsCount: number;
    risquesCount: number;
    budgetCount: number;
    usersCount: number;
  };
  data: {
    users: unknown[];
    actions: unknown[];
    jalons: unknown[];
    risques: unknown[];
    budget: unknown[];
    projectSettings: unknown[];
    alertes: unknown[];
  };
}

// State
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;
let currentUser: GoogleUser | null = null;
let backupFolderId: string | null = null;

// ============================================================================
// INITIALISATION
// ============================================================================

/**
 * Charge le SDK Google Identity Services
 */
export function loadGoogleSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Charge l'API Google Drive
 */
export function loadGoogleDriveAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.gapi?.client) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({});
          await window.gapi.client.load('drive', 'v3');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google API'));
    document.head.appendChild(script);
  });
}

/**
 * Initialise le client d'authentification
 */
export async function initializeGoogleAuth(): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID non configuré');
  }

  await loadGoogleSDK();
  await loadGoogleDriveAPI();

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error) {
        console.error('[GoogleDrive] Auth error:', response.error);
        return;
      }
      accessToken = response.access_token;
      // Stocker le token dans localStorage pour persistance
      localStorage.setItem('google_access_token', accessToken);
      localStorage.setItem('google_token_expiry', String(Date.now() + 3600000)); // 1 heure
    },
  });

  // Restaurer le token s'il existe et n'est pas expiré
  const savedToken = localStorage.getItem('google_access_token');
  const tokenExpiry = localStorage.getItem('google_token_expiry');

  if (savedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
    accessToken = savedToken;
    window.gapi.client.setToken({ access_token: accessToken });
    await fetchUserInfo();
  }
}

// ============================================================================
// AUTHENTIFICATION
// ============================================================================

/**
 * Connexion à Google
 */
export function signIn(): Promise<GoogleUser> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Auth non initialisé'));
      return;
    }

    const originalCallback = tokenClient.callback;
    tokenClient.callback = async (response) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }

      accessToken = response.access_token;
      localStorage.setItem('google_access_token', accessToken);
      localStorage.setItem('google_token_expiry', String(Date.now() + 3600000));
      window.gapi.client.setToken({ access_token: accessToken });

      try {
        const user = await fetchUserInfo();
        resolve(user);
      } catch (error) {
        reject(error);
      }
    };

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Déconnexion de Google
 */
export function signOut(): void {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {
      console.log('[GoogleDrive] Token révoqué');
    });
  }

  accessToken = null;
  currentUser = null;
  backupFolderId = null;
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_token_expiry');
  localStorage.removeItem('google_user');
}

/**
 * Récupère les informations de l'utilisateur connecté
 */
async function fetchUserInfo(): Promise<GoogleUser> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const data = await response.json();
  currentUser = {
    email: data.email,
    name: data.name,
    picture: data.picture,
  };

  localStorage.setItem('google_user', JSON.stringify(currentUser));
  return currentUser;
}

/**
 * Vérifie si l'utilisateur est connecté
 */
export function isSignedIn(): boolean {
  return !!accessToken && !!currentUser;
}

/**
 * Retourne l'utilisateur actuel
 */
export function getCurrentUser(): GoogleUser | null {
  if (currentUser) return currentUser;

  const savedUser = localStorage.getItem('google_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    return currentUser;
  }

  return null;
}

// ============================================================================
// GESTION DES FICHIERS
// ============================================================================

/**
 * Obtient ou crée le dossier de backup
 */
async function getOrCreateBackupFolder(): Promise<string> {
  if (backupFolderId) return backupFolderId;

  // Chercher le dossier existant
  const searchResponse = await window.gapi.client.drive.files.list({
    q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  const folders = searchResponse.result.files || [];

  if (folders.length > 0) {
    backupFolderId = folders[0].id;
    return backupFolderId!;
  }

  // Créer le dossier
  const createResponse = await window.gapi.client.drive.files.create({
    resource: {
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  backupFolderId = createResponse.result.id;
  return backupFolderId!;
}

/**
 * Liste les backups disponibles
 */
export async function listBackups(): Promise<BackupMetadata[]> {
  if (!accessToken) {
    throw new Error('Non connecté à Google');
  }

  const folderId = await getOrCreateBackupFolder();

  const response = await window.gapi.client.drive.files.list({
    q: `'${folderId}' in parents and name contains '${BACKUP_FILE_PREFIX}' and trashed=false`,
    fields: 'files(id, name, createdTime, modifiedTime, size)',
    orderBy: 'createdTime desc',
    pageSize: 20,
  });

  return (response.result.files || []).map((file: { id?: string; name?: string; createdTime?: string; modifiedTime?: string; size?: string }) => ({
    id: file.id || '',
    name: file.name || '',
    createdTime: file.createdTime || '',
    modifiedTime: file.modifiedTime || '',
    size: file.size || '0',
  }));
}

/**
 * Crée un backup des données
 */
export async function createBackup(): Promise<string> {
  if (!accessToken) {
    throw new Error('Non connecté à Google');
  }

  const folderId = await getOrCreateBackupFolder();

  // Collecter toutes les données
  const [users, actions, jalons, risques, budget, projectSettings, alertes] = await Promise.all([
    db.users.toArray(),
    db.actions.toArray(),
    db.jalons.toArray(),
    db.risques.toArray(),
    db.budget.toArray(),
    db.projectSettings.toArray(),
    db.alertes.toArray(),
  ]);

  const backupData: BackupData = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    metadata: {
      actionsCount: actions.length,
      jalonsCount: jalons.length,
      risquesCount: risques.length,
      budgetCount: budget.length,
      usersCount: users.length,
    },
    data: {
      users,
      actions,
      jalons,
      risques,
      budget,
      projectSettings,
      alertes,
    },
  };

  const fileName = `${BACKUP_FILE_PREFIX}${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const fileContent = JSON.stringify(backupData, null, 2);
  const blob = new Blob([fileContent], { type: 'application/json' });

  // Créer le fichier avec l'API multipart
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la création du backup');
  }

  const result = await response.json();
  console.log('[GoogleDrive] Backup créé:', result.name);

  return result.id;
}

/**
 * Restaure un backup
 */
export async function restoreBackup(fileId: string): Promise<BackupData> {
  if (!accessToken) {
    throw new Error('Non connecté à Google');
  }

  // Télécharger le fichier
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du backup');
  }

  const backupData: BackupData = await response.json();

  // Valider la structure
  if (!backupData.version || !backupData.data) {
    throw new Error('Format de backup invalide');
  }

  // Restaurer les données dans IndexedDB
  await db.transaction('rw',
    [db.users, db.actions, db.jalons, db.risques, db.budget, db.projectSettings, db.alertes],
    async () => {
      // Effacer les données existantes
      await Promise.all([
        db.users.clear(),
        db.actions.clear(),
        db.jalons.clear(),
        db.risques.clear(),
        db.budget.clear(),
        db.projectSettings.clear(),
        db.alertes.clear(),
      ]);

      // Restaurer les données
      if (backupData.data.users?.length) {
        await db.users.bulkAdd(backupData.data.users as Parameters<typeof db.users.bulkAdd>[0]);
      }
      if (backupData.data.actions?.length) {
        await db.actions.bulkAdd(backupData.data.actions as Parameters<typeof db.actions.bulkAdd>[0]);
      }
      if (backupData.data.jalons?.length) {
        await db.jalons.bulkAdd(backupData.data.jalons as Parameters<typeof db.jalons.bulkAdd>[0]);
      }
      if (backupData.data.risques?.length) {
        await db.risques.bulkAdd(backupData.data.risques as Parameters<typeof db.risques.bulkAdd>[0]);
      }
      if (backupData.data.budget?.length) {
        await db.budget.bulkAdd(backupData.data.budget as Parameters<typeof db.budget.bulkAdd>[0]);
      }
      if (backupData.data.projectSettings?.length) {
        await db.projectSettings.bulkAdd(backupData.data.projectSettings as Parameters<typeof db.projectSettings.bulkAdd>[0]);
      }
      if (backupData.data.alertes?.length) {
        await db.alertes.bulkAdd(backupData.data.alertes as Parameters<typeof db.alertes.bulkAdd>[0]);
      }
    }
  );

  console.log('[GoogleDrive] Backup restauré:', backupData.metadata);
  return backupData;
}

/**
 * Supprime un backup
 */
export async function deleteBackup(fileId: string): Promise<void> {
  if (!accessToken) {
    throw new Error('Non connecté à Google');
  }

  await window.gapi.client.drive.files.delete({
    fileId,
  });

  console.log('[GoogleDrive] Backup supprimé:', fileId);
}

// ============================================================================
// TYPES POUR TYPESCRIPT
// ============================================================================

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { error?: string; access_token: string }) => void;
          }) => google.accounts.oauth2.TokenClient;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: object) => Promise<void>;
        load: (api: string, version: string) => Promise<void>;
        setToken: (token: { access_token: string }) => void;
        drive: {
          files: {
            list: (params: object) => Promise<{ result: { files?: Array<{ id?: string; name?: string; createdTime?: string; modifiedTime?: string; size?: string }> } }>;
            create: (params: object) => Promise<{ result: { id: string } }>;
            delete: (params: { fileId: string }) => Promise<void>;
          };
        };
      };
    };
  }

  namespace google.accounts.oauth2 {
    interface TokenClient {
      callback: (response: { error?: string; access_token: string }) => void;
      requestAccessToken: (config: { prompt?: string }) => void;
    }
  }
}

export type { GoogleUser, BackupMetadata, BackupData };
