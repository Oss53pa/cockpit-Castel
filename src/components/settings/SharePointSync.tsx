/**
 * SharePoint Sync Component
 * Interface de configuration et synchronisation SharePoint
 */

import { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogIn,
  LogOut,
  Link2,
  Calendar,
  Shield,
  Target,
  Info,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  SelectOption,
} from '@/components/ui';
import {
  getSharePointConfig,
  saveSharePointConfig,
  getSharePointAuth,
  loginSharePoint,
  logoutSharePoint,
  syncAllToSharePoint,
  syncActionsToSharePoint,
  syncJalonsToSharePoint,
  syncRisquesToSharePoint,
  testSharePointConnection,
  startAutoSync,
  stopAutoSync,
  type SharePointConfig,
  type SharePointAuthState,
  type SharePointSyncResult,
} from '@/services/sharePointService';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

export function SharePointSync() {
  const [config, setConfig] = useState<SharePointConfig>(getSharePointConfig());
  const [auth, setAuth] = useState<SharePointAuthState>(getSharePointAuth());
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    actions?: SharePointSyncResult;
    jalons?: SharePointSyncResult;
    risques?: SharePointSyncResult;
  } | null>(null);
  const [connectionTest, setConnectionTest] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // Vérifier l'auth au chargement
    setAuth(getSharePointAuth());
  }, []);

  useEffect(() => {
    // Gérer l'auto-sync
    if (config.autoSync && auth.isAuthenticated) {
      startAutoSync();
    } else {
      stopAutoSync();
    }
    return () => stopAutoSync();
  }, [config.autoSync, auth.isAuthenticated]);

  const handleSaveConfig = () => {
    saveSharePointConfig(config);
    setShowConfig(false);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const newAuth = await loginSharePoint();
      setAuth(newAuth);
    } catch (_error: unknown) {
      const error = _error as Error;
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutSharePoint();
      setAuth({ isAuthenticated: false });
    } catch (_error: unknown) {
      logger.error('Erreur logout:', _error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setConnectionTest(null);
    try {
      const result = await testSharePointConnection();
      setConnectionTest(result);
    } catch (_error: unknown) {
      const error = _error as Error;
      setConnectionTest({ success: false, message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncResults(null);
    try {
      const results = await syncAllToSharePoint();
      setSyncResults(results);
      setConfig(getSharePointConfig()); // Refresh config pour lastSyncAt
    } catch (_error: unknown) {
      const error = _error as Error;
      alert(`Erreur synchronisation: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncEntity = async (type: 'actions' | 'jalons' | 'risques') => {
    setIsSyncing(true);
    try {
      let result: SharePointSyncResult;
      switch (type) {
        case 'actions':
          result = await syncActionsToSharePoint();
          break;
        case 'jalons':
          result = await syncJalonsToSharePoint();
          break;
        case 'risques':
          result = await syncRisquesToSharePoint();
          break;
      }
      setSyncResults((prev) => ({ ...prev, [type]: result }));
    } catch (_error: unknown) {
      const error = _error as Error;
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const isConfigured = config.clientId && config.tenantId && config.siteUrl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'p-3 rounded-xl',
              auth.isAuthenticated ? 'bg-success-100' : 'bg-gray-100'
            )}>
              {auth.isAuthenticated ? (
                <Cloud className="h-6 w-6 text-success-600" />
              ) : (
                <CloudOff className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-900">
                Synchronisation SharePoint
              </h3>
              <p className="text-sm text-primary-500">
                {auth.isAuthenticated
                  ? `Connecté en tant que ${auth.userName || auth.userEmail}`
                  : 'Non connecté'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {auth.isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfig(!showConfig)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleLogin}
                disabled={isLoading || !isConfigured}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                Se connecter
              </Button>
            )}
          </div>
        </div>

        {/* Last sync info */}
        {config.lastSyncAt && (
          <div className="mt-4 pt-4 border-t border-primary-100 flex items-center gap-2 text-sm text-primary-500">
            <RefreshCw className="h-4 w-4" />
            Dernière synchronisation: {new Date(config.lastSyncAt).toLocaleString('fr-FR')}
          </div>
        )}
      </Card>

      {/* Configuration Panel */}
      {(showConfig || !isConfigured) && (
        <Card padding="md">
          <h4 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Azure AD / SharePoint
          </h4>

          <div className="space-y-4">
            {/* Info box */}
            <div className="p-4 bg-info-50 rounded-lg border border-info-200">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-info-700">
                  <p className="font-medium mb-1">Configuration requise dans Azure Portal:</p>
                  <ol className="list-decimal list-inside space-y-1 text-info-600">
                    <li>Créez une application dans Azure AD</li>
                    <li>Ajoutez les permissions: <code className="bg-info-100 px-1 rounded">Sites.ReadWrite.All</code></li>
                    <li>Configurez le redirect URI: <code className="bg-info-100 px-1 rounded">{window.location.origin}</code></li>
                    <li>Copiez le Client ID et Tenant ID ci-dessous</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Client ID (Application ID)
                </label>
                <Input
                  value={config.clientId}
                  onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Tenant ID (Directory ID)
                </label>
                <Input
                  value={config.tenantId}
                  onChange={(e) => setConfig({ ...config, tenantId: e.target.value })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                URL du site SharePoint
              </label>
              <Input
                value={config.siteUrl}
                onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
                placeholder="https://contoso.sharepoint.com/sites/cosmos-angre"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Nom liste Actions
                </label>
                <Input
                  value={config.actionsListName}
                  onChange={(e) => setConfig({ ...config, actionsListName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Nom liste Jalons
                </label>
                <Input
                  value={config.jalonsListName}
                  onChange={(e) => setConfig({ ...config, jalonsListName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Nom liste Risques
                </label>
                <Input
                  value={config.risquesListName}
                  onChange={(e) => setConfig({ ...config, risquesListName: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSync}
                    onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-primary-700">Synchronisation automatique</span>
                </label>
                {config.autoSync && (
                  <Select
                    value={config.syncInterval.toString()}
                    onChange={(e) => setConfig({ ...config, syncInterval: Number(e.target.value) })}
                    className="w-32"
                  >
                    <SelectOption value="5">5 min</SelectOption>
                    <SelectOption value="15">15 min</SelectOption>
                    <SelectOption value="30">30 min</SelectOption>
                    <SelectOption value="60">1 heure</SelectOption>
                  </Select>
                )}
              </div>
              <Button variant="primary" onClick={handleSaveConfig}>
                Enregistrer
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Test Connection */}
      {auth.isAuthenticated && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-primary-900 flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Test de connexion
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Tester
            </Button>
          </div>

          {connectionTest && (
            <div className={cn(
              'p-4 rounded-lg flex items-start gap-3',
              connectionTest.success ? 'bg-success-50' : 'bg-error-50'
            )}>
              {connectionTest.success ? (
                <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0" />
              )}
              <div>
                <p className={cn(
                  'font-medium',
                  connectionTest.success ? 'text-success-700' : 'text-error-700'
                )}>
                  {connectionTest.message}
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Sync Panel */}
      {auth.isAuthenticated && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-semibold text-primary-900 flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Synchronisation
            </h4>
            <Button
              variant="primary"
              onClick={handleSyncAll}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Synchroniser tout
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Actions */}
            <SyncEntityCard
              title="Actions"
              icon={Target}
              listName={config.actionsListName}
              result={syncResults?.actions}
              onSync={() => handleSyncEntity('actions')}
              isSyncing={isSyncing}
            />

            {/* Jalons */}
            <SyncEntityCard
              title="Jalons"
              icon={Calendar}
              listName={config.jalonsListName}
              result={syncResults?.jalons}
              onSync={() => handleSyncEntity('jalons')}
              isSyncing={isSyncing}
            />

            {/* Risques */}
            <SyncEntityCard
              title="Risques"
              icon={Shield}
              listName={config.risquesListName}
              result={syncResults?.risques}
              onSync={() => handleSyncEntity('risques')}
              isSyncing={isSyncing}
            />
          </div>
        </Card>
      )}

      {/* Auto-sync status */}
      {config.autoSync && auth.isAuthenticated && (
        <div className="flex items-center gap-2 text-sm text-primary-500">
          <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
          Synchronisation automatique active (toutes les {config.syncInterval} minutes)
        </div>
      )}
    </div>
  );
}

// Sub-component for each entity type
function SyncEntityCard({
  title,
  icon: Icon,
  listName,
  result,
  onSync,
  isSyncing,
}: {
  title: string;
  icon: typeof Target;
  listName: string;
  result?: SharePointSyncResult;
  onSync: () => void;
  isSyncing: boolean;
}) {
  return (
    <div className="p-4 bg-primary-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary-600" />
          <span className="font-medium text-primary-900">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSync}
          disabled={isSyncing}
        >
          <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
        </Button>
      </div>

      <p className="text-xs text-primary-500 mb-3">
        Liste: <code className="bg-white px-1 rounded">{listName}</code>
      </p>

      {result && (
        <div className={cn(
          'p-2 rounded text-xs',
          result.success ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
        )}>
          {result.success ? (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>{result.created} créés, {result.updated} mis à jour</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>{result.errors.length} erreur(s)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SharePointSync;
