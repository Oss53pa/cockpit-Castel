import { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  Link as LinkIcon,
  Activity,
  Database,
  ExternalLink,
} from 'lucide-react';
import { Card, Button, Input, Badge } from '@/components/ui';
import {
  getFirebaseConfig,
  saveFirebaseConfig,
  testFirebaseConnection,
  isFirebaseConfigured,
  syncUpdateLinksToFirebase,
  getFirebaseSyncStats,
  type FirebaseConfig,
} from '@/services/firebaseConfigService';

export function FirebaseSyncSettings() {
  const [config, setConfig] = useState<FirebaseConfig>(getFirebaseConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncStats, setSyncStats] = useState<{
    totalLinks: number;
    syncedLinks: number;
    pendingLinks: number;
    lastSync: string | null;
  } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const stats = await getFirebaseSyncStats();
    setSyncStats(stats);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      await saveFirebaseConfig(config);
      await loadStats();
      setTestResult({ success: true, message: 'Configuration sauvegardee!' });
    } catch (error) {
      setTestResult({ success: false, message: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testFirebaseConnection(config);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: 'Erreur de connexion' });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const result = await syncUpdateLinksToFirebase();
      await loadStats();
      setTestResult({
        success: result.success,
        message: result.success
          ? `${result.synced} lien(s) synchronise(s)`
          : result.error || 'Erreur de synchronisation',
      });
    } catch (error) {
      setTestResult({ success: false, message: 'Erreur de synchronisation' });
    } finally {
      setSyncing(false);
    }
  };

  const configured = isFirebaseConfigured();

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${config.enabled && configured ? 'bg-success-100' : 'bg-gray-100'}`}>
              {config.enabled && configured ? (
                <Cloud className="h-6 w-6 text-success-600" />
              ) : (
                <CloudOff className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-primary-900">Synchronisation Firebase</h4>
              <p className="text-sm text-primary-500">
                {config.enabled && configured
                  ? 'Les mises a jour externes sont synchronisees en temps reel'
                  : 'Synchronisation desactivee - les donnees restent locales'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.enabled && configured && <Badge variant="success">Active</Badge>}
            {config.enabled && !configured && <Badge variant="warning">Non configure</Badge>}
            {!config.enabled && <Badge variant="secondary">Desactive</Badge>}
          </div>
        </div>

        {/* Stats */}
        {syncStats && config.enabled && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-700">{syncStats.totalLinks}</p>
              <p className="text-xs text-primary-500">Total liens</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success-600">{syncStats.syncedLinks}</p>
              <p className="text-xs text-primary-500">Synchronises</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning-600">{syncStats.pendingLinks}</p>
              <p className="text-xs text-primary-500">En attente</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-primary-700">
                {syncStats.lastSync
                  ? new Date(syncStats.lastSync).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Jamais'}
              </p>
              <p className="text-xs text-primary-500">Derniere sync</p>
            </div>
          </div>
        )}
      </Card>

      {/* Enable/Disable Toggle */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className={`h-5 w-5 ${config.enabled ? 'text-primary-600' : 'text-gray-400'}`} />
            <div>
              <h4 className="font-medium text-primary-900">Activer la synchronisation automatique</h4>
              <p className="text-sm text-primary-500">
                Synchronise les liens de mise a jour et les reponses via Firebase
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={e => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </Card>

      {/* Configuration */}
      {config.enabled && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-900">Configuration Firebase</h3>
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <ExternalLink className="h-4 w-4" />
              Console Firebase
            </a>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <h4 className="font-medium text-blue-800 mb-2">Comment obtenir les identifiants ?</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Allez sur <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">console.firebase.google.com</a></li>
              <li>Creez un projet ou selectionnez un projet existant</li>
              <li>Allez dans Parametres du projet &gt; General</li>
              <li>Dans "Vos applications", ajoutez une application Web</li>
              <li>Copiez les valeurs de firebaseConfig</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-primary-700 mb-1">
                API Key <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={config.apiKey || ''}
                  onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Project ID <span className="text-error-500">*</span>
              </label>
              <Input
                placeholder="mon-projet-12345"
                value={config.projectId || ''}
                onChange={e => setConfig({ ...config, projectId: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Auth Domain
              </label>
              <Input
                placeholder="mon-projet.firebaseapp.com"
                value={config.authDomain || ''}
                onChange={e => setConfig({ ...config, authDomain: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Storage Bucket
              </label>
              <Input
                placeholder="mon-projet.appspot.com"
                value={config.storageBucket || ''}
                onChange={e => setConfig({ ...config, storageBucket: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Messaging Sender ID
              </label>
              <Input
                placeholder="123456789012"
                value={config.messagingSenderId || ''}
                onChange={e => setConfig({ ...config, messagingSenderId: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                App ID
              </label>
              <Input
                placeholder="1:123456789012:web:abc123..."
                value={config.appId || ''}
                onChange={e => setConfig({ ...config, appId: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Measurement ID
              </label>
              <Input
                placeholder="G-XXXXXXXXXX"
                value={config.measurementId || ''}
                onChange={e => setConfig({ ...config, measurementId: e.target.value })}
              />
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                testResult.success
                  ? 'bg-success-50 border border-success-200'
                  : 'bg-error-50 border border-error-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-success-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-error-600" />
              )}
              <span className={testResult.success ? 'text-success-700' : 'text-error-700'}>
                {testResult.message}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder
            </Button>
            <Button variant="secondary" onClick={handleTestConnection} disabled={testing}>
              {testing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Tester la connexion
            </Button>
          </div>
        </Card>
      )}

      {/* Sync Actions */}
      {config.enabled && configured && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Actions de synchronisation</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <LinkIcon className="h-5 w-5 text-primary-600" />
                <div>
                  <h4 className="font-medium text-primary-900">Synchroniser les liens</h4>
                  <p className="text-sm text-primary-500">
                    Envoyer tous les liens de mise a jour vers Firebase
                  </p>
                </div>
              </div>
              <Button variant="secondary" onClick={handleSyncNow} disabled={syncing}>
                {syncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Cloud className="h-4 w-4 mr-2" />
                )}
                Synchroniser
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-gray-600" />
                <div>
                  <h4 className="font-medium text-primary-900">Mode de synchronisation</h4>
                  <p className="text-sm text-primary-500">
                    Synchronisation automatique a chaque envoi d'email
                  </p>
                </div>
              </div>
              <Badge variant="info">Automatique</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Info about benefits */}
      {!config.enabled && (
        <Card padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Pourquoi activer Firebase ?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Synchronisation temps reel</strong> - Recevez les mises a jour des
                collaborateurs instantanement
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Pas de backend requis</strong> - Firebase gere tout cote client
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Gratuit</strong> - Le plan gratuit de Firebase suffit largement
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Multi-appareils</strong> - Accedez aux donnees depuis n'importe quel poste
              </span>
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
}
