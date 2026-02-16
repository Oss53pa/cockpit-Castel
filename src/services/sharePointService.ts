/**
 * SharePoint Sync Service
 * Synchronise les Actions, Jalons et Risques avec SharePoint
 *
 * Architecture:
 * - Utilise Microsoft Graph API via MSAL.js
 * - Stocke les données dans des listes SharePoint
 * - Synchronisation bidirectionnelle possible
 */

import { db } from '@/db';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface SharePointConfig {
  clientId: string;           // Azure AD App Client ID
  tenantId: string;           // Azure AD Tenant ID
  siteUrl: string;            // SharePoint site URL (ex: https://contoso.sharepoint.com/sites/cosmos)
  actionsListName: string;    // Nom de la liste pour les Actions
  jalonsListName: string;     // Nom de la liste pour les Jalons
  risquesListName: string;    // Nom de la liste pour les Risques
  autoSync: boolean;          // Sync automatique activée
  syncInterval: number;       // Intervalle en minutes
  lastSyncAt?: string;        // Dernière synchronisation
}

export interface SharePointSyncResult {
  success: boolean;
  entityType: 'action' | 'jalon' | 'risque';
  created: number;
  updated: number;
  errors: string[];
  timestamp: string;
}

export interface SharePointAuthState {
  isAuthenticated: boolean;
  accessToken?: string;
  expiresAt?: string;
  userName?: string;
  userEmail?: string;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: SharePointConfig = {
  clientId: '',
  tenantId: '',
  siteUrl: '',
  actionsListName: 'Actions',
  jalonsListName: 'Jalons',
  risquesListName: 'Risques',
  autoSync: false,
  syncInterval: 30,
};

const CONFIG_KEY = 'cockpit_sharepoint_config';
const AUTH_KEY = 'cockpit_sharepoint_auth';

// ============================================================================
// CONFIG MANAGEMENT
// ============================================================================

export function getSharePointConfig(): SharePointConfig {
  const stored = localStorage.getItem(CONFIG_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

export function saveSharePointConfig(config: Partial<SharePointConfig>): void {
  const current = getSharePointConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
}

export function getSharePointAuth(): SharePointAuthState {
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      const auth = JSON.parse(stored);
      // Vérifier si le token est expiré
      if (auth.expiresAt && new Date(auth.expiresAt) < new Date()) {
        return { isAuthenticated: false };
      }
      return auth;
    } catch {
      return { isAuthenticated: false };
    }
  }
  return { isAuthenticated: false };
}

function saveSharePointAuth(auth: SharePointAuthState): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

// ============================================================================
// MSAL AUTHENTICATION
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let msalInstance: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function initMSAL(): Promise<any> {
  if (msalInstance) return msalInstance;

  const config = getSharePointConfig();
  if (!config.clientId || !config.tenantId) {
    throw new Error('Configuration SharePoint incomplète. Veuillez configurer Client ID et Tenant ID.');
  }

  // Dynamic import de MSAL
  const msal = await import('@azure/msal-browser');

  const msalConfig = {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  };

  msalInstance = new msal.PublicClientApplication(msalConfig);
  await msalInstance.initialize();

  return msalInstance;
}

export async function loginSharePoint(): Promise<SharePointAuthState> {
  try {
    const msal = await initMSAL();

    const loginRequest = {
      scopes: ['Sites.ReadWrite.All', 'User.Read'],
    };

    const response = await msal.loginPopup(loginRequest);

    const auth: SharePointAuthState = {
      isAuthenticated: true,
      accessToken: response.accessToken,
      expiresAt: response.expiresOn?.toISOString(),
      userName: response.account?.name,
      userEmail: response.account?.username,
    };

    saveSharePointAuth(auth);
    return auth;
  } catch (_error: unknown) {
    const error = _error as Error;
    logger.error('Erreur login SharePoint:', error);
    throw new Error(`Échec de l'authentification: ${error.message}`);
  }
}

export async function logoutSharePoint(): Promise<void> {
  try {
    const msal = await initMSAL();
    await msal.logoutPopup();
  } catch (error) {
    logger.error('Erreur logout SharePoint:', error);
  }
  localStorage.removeItem(AUTH_KEY);
  msalInstance = null;
}

async function getAccessToken(): Promise<string> {
  const auth = getSharePointAuth();

  if (auth.isAuthenticated && auth.accessToken && auth.expiresAt) {
    if (new Date(auth.expiresAt) > new Date()) {
      return auth.accessToken;
    }
  }

  // Token expiré, essayer de le renouveler silencieusement
  try {
    const msal = await initMSAL();
    const accounts = msal.getAllAccounts();

    if (accounts.length > 0) {
      const silentRequest = {
        scopes: ['Sites.ReadWrite.All', 'User.Read'],
        account: accounts[0],
      };

      const response = await msal.acquireTokenSilent(silentRequest);

      const newAuth: SharePointAuthState = {
        isAuthenticated: true,
        accessToken: response.accessToken,
        expiresAt: response.expiresOn?.toISOString(),
        userName: response.account?.name,
        userEmail: response.account?.username,
      };

      saveSharePointAuth(newAuth);
      return response.accessToken;
    }
  } catch (error) {
    logger.error('Erreur renouvellement token:', error);
  }

  throw new Error('Non authentifié. Veuillez vous connecter à SharePoint.');
}

// ============================================================================
// GRAPH API HELPERS
// ============================================================================

async function graphRequest(endpoint: string, options: RequestInit = {}): Promise<unknown> {
  const token = await getAccessToken();

  const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Erreur API Graph: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function getSiteId(): Promise<string> {
  const config = getSharePointConfig();
  if (!config.siteUrl) {
    throw new Error('URL du site SharePoint non configurée');
  }

  // Extraire le hostname et le path du site
  const url = new URL(config.siteUrl);
  const hostname = url.hostname;
  const sitePath = url.pathname;

  const site = await graphRequest(`/sites/${hostname}:${sitePath}`) as { id: string };
  return site.id;
}

async function getOrCreateList(siteId: string, listName: string, columns: Array<{ name: string; text?: object; choice?: { choices: string[] }; number?: { minimum: number; maximum: number }; dateTime?: object }>): Promise<string> {
  // Vérifier si la liste existe
  try {
    const lists = await graphRequest(`/sites/${siteId}/lists?$filter=displayName eq '${listName}'`) as { value?: Array<{ id: string }> };
    if (lists.value && lists.value.length > 0) {
      return lists.value[0].id;
    }
  } catch (_error) {
    // Liste non trouvée, création...
  }

  // Créer la liste
  const newList = await graphRequest(`/sites/${siteId}/lists`, {
    method: 'POST',
    body: JSON.stringify({
      displayName: listName,
      columns: columns,
      list: {
        template: 'genericList',
      },
    }),
  }) as { id: string };

  return newList.id;
}

// ============================================================================
// SYNC ACTIONS
// ============================================================================

const ACTION_COLUMNS = [
  { name: 'CockpitId', text: {} },
  { name: 'Titre', text: {} },
  { name: 'Description', text: { allowMultipleLines: true } },
  { name: 'Axe', choice: { choices: ['axe1_commercialisation', 'axe2_technique', 'axe3_exploitation', 'axe4_juridique', 'axe5_communication'] } },
  { name: 'Statut', choice: { choices: ['a_faire', 'en_cours', 'termine', 'valide', 'bloque', 'annule'] } },
  { name: 'Priorite', choice: { choices: ['critique', 'haute', 'moyenne', 'basse'] } },
  { name: 'Avancement', number: { minimum: 0, maximum: 100 } },
  { name: 'DateDebut', dateTime: {} },
  { name: 'DateFin', dateTime: {} },
  { name: 'Responsable', text: {} },
];

export async function syncActionsToSharePoint(): Promise<SharePointSyncResult> {
  const result: SharePointSyncResult = {
    success: false,
    entityType: 'action',
    created: 0,
    updated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    const siteId = await getSiteId();
    const config = getSharePointConfig();
    const listId = await getOrCreateList(siteId, config.actionsListName, ACTION_COLUMNS);

    // Récupérer les actions depuis IndexedDB
    const actions = await db.actions.toArray();

    // Récupérer les items existants dans SharePoint
    const existingItems = await graphRequest(`/sites/${siteId}/lists/${listId}/items?$expand=fields`);
    const existingMap = new Map<string, string>();
    (existingItems as { value?: Array<{ id: string; fields?: { CockpitId?: string } }> }).value?.forEach((item) => {
      if (item.fields?.CockpitId) {
        existingMap.set(item.fields.CockpitId, item.id);
      }
    });

    // Sync chaque action
    for (const action of actions) {
      try {
        const fields = {
          Title: action.titre,
          CockpitId: action.id?.toString(),
          Titre: action.titre,
          Description: action.description || '',
          Axe: action.axe,
          Statut: action.statut,
          Priorite: action.priorite,
          Avancement: action.avancement,
          DateDebut: action.date_debut_prevue || null,
          DateFin: action.date_fin_prevue || null,
        };

        const existingId = existingMap.get(action.id?.toString() || '');

        if (existingId) {
          // Update
          await graphRequest(`/sites/${siteId}/lists/${listId}/items/${existingId}/fields`, {
            method: 'PATCH',
            body: JSON.stringify(fields),
          });
          result.updated++;
        } else {
          // Create
          await graphRequest(`/sites/${siteId}/lists/${listId}/items`, {
            method: 'POST',
            body: JSON.stringify({ fields }),
          });
          result.created++;
        }
      } catch (_error: unknown) {
        const error = _error as Error;
        result.errors.push(`Action ${action.id}: ${error.message}`);
      }
    }

    result.success = result.errors.length === 0;
  } catch (_error: unknown) {
    const error = _error as Error;
    result.errors.push(error.message);
  }

  return result;
}

// ============================================================================
// SYNC JALONS
// ============================================================================

const JALON_COLUMNS = [
  { name: 'CockpitId', text: {} },
  { name: 'Titre', text: {} },
  { name: 'Description', text: { allowMultipleLines: true } },
  { name: 'Axe', choice: { choices: ['axe1_commercialisation', 'axe2_technique', 'axe3_exploitation', 'axe4_juridique', 'axe5_communication'] } },
  { name: 'Statut', choice: { choices: ['a_venir', 'en_approche', 'en_danger', 'atteint', 'depasse', 'annule'] } },
  { name: 'DatePrevue', dateTime: {} },
  { name: 'DateReelle', dateTime: {} },
  { name: 'Avancement', number: { minimum: 0, maximum: 100 } },
  { name: 'Livrables', text: { allowMultipleLines: true } },
];

export async function syncJalonsToSharePoint(): Promise<SharePointSyncResult> {
  const result: SharePointSyncResult = {
    success: false,
    entityType: 'jalon',
    created: 0,
    updated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    const siteId = await getSiteId();
    const config = getSharePointConfig();
    const listId = await getOrCreateList(siteId, config.jalonsListName, JALON_COLUMNS);

    const jalons = await db.jalons.toArray();

    const existingItems = await graphRequest(`/sites/${siteId}/lists/${listId}/items?$expand=fields`);
    const existingMap = new Map<string, string>();
    (existingItems as { value?: Array<{ id: string; fields?: { CockpitId?: string } }> }).value?.forEach((item) => {
      if (item.fields?.CockpitId) {
        existingMap.set(item.fields.CockpitId, item.id);
      }
    });

    for (const jalon of jalons) {
      try {
        const fields = {
          Title: jalon.titre,
          CockpitId: jalon.id?.toString(),
          Titre: jalon.titre,
          Description: jalon.description || '',
          Axe: jalon.axe,
          Statut: jalon.statut,
          DatePrevue: jalon.date_prevue || null,
          DateReelle: jalon.date_reelle || null,
          Avancement: jalon.avancement || 0,
          Livrables: jalon.livrables || '',
        };

        const existingId = existingMap.get(jalon.id?.toString() || '');

        if (existingId) {
          await graphRequest(`/sites/${siteId}/lists/${listId}/items/${existingId}/fields`, {
            method: 'PATCH',
            body: JSON.stringify(fields),
          });
          result.updated++;
        } else {
          await graphRequest(`/sites/${siteId}/lists/${listId}/items`, {
            method: 'POST',
            body: JSON.stringify({ fields }),
          });
          result.created++;
        }
      } catch (_error: unknown) {
        const error = _error as Error;
        result.errors.push(`Jalon ${jalon.id}: ${error.message}`);
      }
    }

    result.success = result.errors.length === 0;
  } catch (_error: unknown) {
    const error = _error as Error;
    result.errors.push(error.message);
  }

  return result;
}

// ============================================================================
// SYNC RISQUES
// ============================================================================

const RISQUE_COLUMNS = [
  { name: 'CockpitId', text: {} },
  { name: 'Titre', text: {} },
  { name: 'Description', text: { allowMultipleLines: true } },
  { name: 'Categorie', choice: { choices: ['technique', 'financier', 'planning', 'juridique', 'commercial', 'organisationnel', 'externe'] } },
  { name: 'Statut', choice: { choices: ['open', 'mitigated', 'closed', 'occurred'] } },
  { name: 'Probabilite', number: { minimum: 1, maximum: 4 } },
  { name: 'Impact', number: { minimum: 1, maximum: 4 } },
  { name: 'Score', number: { minimum: 1, maximum: 16 } },
  { name: 'PlanMitigation', text: { allowMultipleLines: true } },
];

export async function syncRisquesToSharePoint(): Promise<SharePointSyncResult> {
  const result: SharePointSyncResult = {
    success: false,
    entityType: 'risque',
    created: 0,
    updated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    const siteId = await getSiteId();
    const config = getSharePointConfig();
    const listId = await getOrCreateList(siteId, config.risquesListName, RISQUE_COLUMNS);

    const risques = await db.risques.toArray();

    const existingItems = await graphRequest(`/sites/${siteId}/lists/${listId}/items?$expand=fields`);
    const existingMap = new Map<string, string>();
    (existingItems as { value?: Array<{ id: string; fields?: { CockpitId?: string } }> }).value?.forEach((item) => {
      if (item.fields?.CockpitId) {
        existingMap.set(item.fields.CockpitId, item.id);
      }
    });

    for (const risque of risques) {
      try {
        const prob = risque.probabilite_actuelle || risque.probabilite || 1;
        const imp = risque.impact_actuel || risque.impact || 1;
        const score = risque.score_actuel || risque.score || (prob * imp);

        const fields = {
          Title: risque.titre,
          CockpitId: risque.id?.toString(),
          Titre: risque.titre,
          Description: risque.description || '',
          Categorie: risque.categorie,
          Statut: risque.status || risque.statut,
          Probabilite: prob,
          Impact: imp,
          Score: score,
          PlanMitigation: risque.plan_mitigation || '',
        };

        const existingId = existingMap.get(risque.id?.toString() || '');

        if (existingId) {
          await graphRequest(`/sites/${siteId}/lists/${listId}/items/${existingId}/fields`, {
            method: 'PATCH',
            body: JSON.stringify(fields),
          });
          result.updated++;
        } else {
          await graphRequest(`/sites/${siteId}/lists/${listId}/items`, {
            method: 'POST',
            body: JSON.stringify({ fields }),
          });
          result.created++;
        }
      } catch (_error: unknown) {
        const error = _error as Error;
        result.errors.push(`Risque ${risque.id}: ${error.message}`);
      }
    }

    result.success = result.errors.length === 0;
  } catch (_error: unknown) {
    const error = _error as Error;
    result.errors.push(error.message);
  }

  return result;
}

// ============================================================================
// SYNC ALL
// ============================================================================

export async function syncAllToSharePoint(): Promise<{
  actions: SharePointSyncResult;
  jalons: SharePointSyncResult;
  risques: SharePointSyncResult;
}> {
  const [actions, jalons, risques] = await Promise.all([
    syncActionsToSharePoint(),
    syncJalonsToSharePoint(),
    syncRisquesToSharePoint(),
  ]);

  // Mettre à jour la date de dernière sync
  saveSharePointConfig({ lastSyncAt: new Date().toISOString() });

  return { actions, jalons, risques };
}

// ============================================================================
// AUTO SYNC
// ============================================================================

let autoSyncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(): void {
  const config = getSharePointConfig();

  if (!config.autoSync || !config.clientId) return;

  stopAutoSync();

  autoSyncInterval = setInterval(async () => {
    try {
      const auth = getSharePointAuth();
      if (auth.isAuthenticated) {
        await syncAllToSharePoint();
      }
    } catch (error) {
      logger.error('[SharePoint] Erreur auto-sync:', error);
    }
  }, config.syncInterval * 60 * 1000);
}

export function stopAutoSync(): void {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

// ============================================================================
// TEST CONNECTION
// ============================================================================

export async function testSharePointConnection(): Promise<{ success: boolean; message: string; siteInfo?: { name: string; url: string; id: string } }> {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Non authentifié' };
    }

    const siteId = await getSiteId();
    const site = await graphRequest(`/sites/${siteId}`) as { displayName: string; webUrl: string; id: string };

    return {
      success: true,
      message: `Connecté au site: ${site.displayName}`,
      siteInfo: {
        name: site.displayName,
        url: site.webUrl,
        id: site.id,
      },
    };
  } catch (_error: unknown) {
    const error = _error as Error;
    return {
      success: false,
      message: error.message,
    };
  }
}

export default {
  getSharePointConfig,
  saveSharePointConfig,
  getSharePointAuth,
  loginSharePoint,
  logoutSharePoint,
  syncActionsToSharePoint,
  syncJalonsToSharePoint,
  syncRisquesToSharePoint,
  syncAllToSharePoint,
  testSharePointConnection,
  startAutoSync,
  stopAutoSync,
};
