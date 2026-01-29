import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  Upload,
  HardDrive,
  Cloud,
  Clock,
  RefreshCw,
  FolderOpen,
  Play,
  Square,
  AlertTriangle,
  Check,
  Database,
  Archive,
  History,
  Settings2,
  Info,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { exportDatabase, importDatabase, db } from '@/db';
import { cn } from '@/lib/utils';

// IndexedDB pour stocker les FileSystemDirectoryHandle (qui ne peuvent pas être sérialisés dans localStorage)
const HANDLES_DB_NAME = 'cockpit-backup-handles';
const HANDLES_STORE_NAME = 'handles';

async function openHandlesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLES_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(HANDLES_STORE_NAME)) {
        db.createObjectStore(HANDLES_STORE_NAME);
      }
    };
  });
}

async function saveHandle(key: string, handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandlesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HANDLES_STORE_NAME);
    const request = store.put(handle, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    tx.oncomplete = () => db.close();
  });
}

async function getHandle(key: string): Promise<FileSystemDirectoryHandle | undefined> {
  const db = await openHandlesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLES_STORE_NAME, 'readonly');
    const store = tx.objectStore(HANDLES_STORE_NAME);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    tx.oncomplete = () => db.close();
  });
}

async function deleteHandle(key: string): Promise<void> {
  const db = await openHandlesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HANDLES_STORE_NAME);
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    tx.oncomplete = () => db.close();
  });
}

// Types
interface BackupConfig {
  localFolderName?: string;
  localFolderHandle?: FileSystemDirectoryHandle;
  onedriveFolderName?: string;
  onedriveFolderHandle?: FileSystemDirectoryHandle;
  autoBackupEnabled: boolean;
  autoBackupInterval: number; // minutes
  autoBackupDestination: 'local' | 'onedrive';
  lastBackupDate?: string;
  lastBackupSize?: number;
}

interface BackupHistoryEntry {
  id: string;
  date: string;
  size: number;
  destination: 'download' | 'local' | 'onedrive';
  filename: string;
  recordCount: number;
}

const INTERVALS = [
  { value: 15, label: 'Toutes les 15 minutes' },
  { value: 30, label: 'Toutes les 30 minutes' },
  { value: 60, label: 'Toutes les heures' },
  { value: 120, label: 'Toutes les 2 heures' },
  { value: 360, label: 'Toutes les 6 heures' },
  { value: 1440, label: 'Tous les jours' },
];

// Compress string to gzip
async function compressData(data: string): Promise<Blob> {
  const encoder = new TextEncoder();
  const stream = new Blob([encoder.encode(data)]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  return new Response(compressedStream).blob();
}

// Decompress gzip to string
async function decompressData(blob: Blob): Promise<string> {
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BackupManagement() {
  const [config, setConfig] = useState<BackupConfig>(() => {
    const saved = localStorage.getItem('cockpit-backup-config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        localFolderHandle: undefined,
        onedriveFolderHandle: undefined,
      };
    }
    return {
      autoBackupEnabled: false,
      autoBackupInterval: 30,
      autoBackupDestination: 'local',
    };
  });

  const [handlesRestored, setHandlesRestored] = useState(false);

  const [history, setHistory] = useState<BackupHistoryEntry[]>(() => {
    const saved = localStorage.getItem('cockpit-backup-history');
    return saved ? JSON.parse(saved) : [];
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [dbStats, setDbStats] = useState({ size: 0, records: 0 });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const autoBackupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restaurer les handles depuis IndexedDB au montage
  useEffect(() => {
    async function restoreHandles() {
      try {
        const localHandle = await getHandle('local');
        const onedriveHandle = await getHandle('onedrive');

        // Vérifier les permissions pour le handle local
        if (localHandle) {
          const permission = await localHandle.queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            setConfig((prev) => ({
              ...prev,
              localFolderHandle: localHandle,
              localFolderName: localHandle.name,
            }));
          } else {
            // Le handle existe mais les permissions ont expiré - garder le nom pour l'affichage
            setConfig((prev) => ({
              ...prev,
              localFolderName: localHandle.name,
            }));
          }
        }

        // Vérifier les permissions pour le handle OneDrive
        if (onedriveHandle) {
          const permission = await onedriveHandle.queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            setConfig((prev) => ({
              ...prev,
              onedriveFolderHandle: onedriveHandle,
              onedriveFolderName: onedriveHandle.name,
            }));
          } else {
            // Le handle existe mais les permissions ont expiré - garder le nom pour l'affichage
            setConfig((prev) => ({
              ...prev,
              onedriveFolderName: onedriveHandle.name,
            }));
          }
        }

        setHandlesRestored(true);
      } catch (error) {
        console.error('Erreur lors de la restauration des handles:', error);
        setHandlesRestored(true);
      }
    }

    restoreHandles();
  }, []);

  // Redémarrer la sauvegarde automatique si elle était activée et que les handles sont restaurés
  useEffect(() => {
    if (!handlesRestored) return;
    if (!config.autoBackupEnabled) return;

    const handle = config.autoBackupDestination === 'local'
      ? config.localFolderHandle
      : config.onedriveFolderHandle;

    if (handle && !autoRunning) {
      // Redémarrer automatiquement la sauvegarde
      startAutoBackupInternal(handle, config.autoBackupDestination, config.autoBackupInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlesRestored]);

  // Save config to localStorage
  useEffect(() => {
    const { localFolderHandle: _l, onedriveFolderHandle: _o, ...saveable } = config;
    localStorage.setItem('cockpit-backup-config', JSON.stringify(saveable));
  }, [config]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('cockpit-backup-history', JSON.stringify(history.slice(0, 10)));
  }, [history]);

  // Calculate DB stats
  useEffect(() => {
    async function calcStats() {
      try {
        let totalRecords = 0;
        for (const table of db.tables) {
          totalRecords += await table.count();
        }
        const data = await exportDatabase();
        setDbStats({ size: new Blob([data]).size, records: totalRecords });
      } catch {
        // ignore
      }
    }
    calcStats();
  }, []);

  // Show status message temporarily
  const showStatus = useCallback((type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  }, []);

  // Generate backup filename
  const getFilename = () => {
    const date = new Date().toISOString().replace(/[:.]/g, '-').split('T');
    return `cockpit-backup-${date[0]}_${date[1].substring(0, 8)}.json.gz`;
  };

  // Add to history
  const addToHistory = useCallback((entry: Omit<BackupHistoryEntry, 'id'>) => {
    const newEntry: BackupHistoryEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setHistory((prev) => [newEntry, ...prev].slice(0, 10));
    setConfig((prev) => ({
      ...prev,
      lastBackupDate: entry.date,
      lastBackupSize: entry.size,
    }));
  }, []);

  // Export and download
  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const data = await exportDatabase();
      const compressed = await compressData(data);
      const filename = getFilename();

      const url = URL.createObjectURL(compressed);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      let totalRecords = 0;
      for (const table of db.tables) {
        totalRecords += await table.count();
      }

      addToHistory({
        date: new Date().toISOString(),
        size: compressed.size,
        destination: 'download',
        filename,
        recordCount: totalRecords,
      });

      showStatus('success', 'Sauvegarde téléchargée avec succès');
    } catch (error) {
      console.error('Export error:', error);
      showStatus('error', 'Erreur lors de la sauvegarde');
    } finally {
      setIsExporting(false);
    }
  };

  // Pick folder (File System Access API)
  const handlePickFolder = async (type: 'local' | 'onedrive') => {
    try {
      if (!('showDirectoryPicker' in window)) {
        showStatus('error', 'Votre navigateur ne supporte pas cette fonctionnalité. Utilisez Chrome ou Edge.');
        return;
      }
      const handle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();

      // Sauvegarder le handle dans IndexedDB pour persistance
      await saveHandle(type, handle);

      if (type === 'local') {
        setConfig((prev) => ({
          ...prev,
          localFolderHandle: handle,
          localFolderName: handle.name,
        }));
      } else {
        setConfig((prev) => ({
          ...prev,
          onedriveFolderHandle: handle,
          onedriveFolderName: handle.name,
        }));
      }
      showStatus('success', `Dossier "${handle.name}" configuré`);
    } catch {
      // User cancelled
    }
  };

  // Save to folder
  const handleSaveToFolder = async (type: 'local' | 'onedrive') => {
    const handle = type === 'local' ? config.localFolderHandle : config.onedriveFolderHandle;
    if (!handle) {
      await handlePickFolder(type);
      return;
    }

    setIsExporting(true);
    try {
      // Verify permission
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        showStatus('error', 'Permission refusée pour écrire dans le dossier');
        setIsExporting(false);
        return;
      }

      const data = await exportDatabase();
      const compressed = await compressData(data);
      const filename = getFilename();

      const fileHandle = await handle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(compressed);
      await writable.close();

      let totalRecords = 0;
      for (const table of db.tables) {
        totalRecords += await table.count();
      }

      addToHistory({
        date: new Date().toISOString(),
        size: compressed.size,
        destination: type,
        filename,
        recordCount: totalRecords,
      });

      showStatus('success', `Sauvegarde enregistrée dans "${handle.name}/${filename}"`);
    } catch (error) {
      console.error('Save error:', error);
      showStatus('error', 'Erreur lors de la sauvegarde. Reconfigurez le dossier.');
      // Supprimer le handle invalide d'IndexedDB
      await deleteHandle(type).catch(() => {});
      if (type === 'local') {
        setConfig((prev) => ({ ...prev, localFolderHandle: undefined }));
      } else {
        setConfig((prev) => ({ ...prev, onedriveFolderHandle: undefined }));
      }
      // Arrêter la sauvegarde automatique si elle était en cours
      if (autoRunning) {
        stopAutoBackup();
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Restore from file
  const handleRestore = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.json.gz,.gz';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!confirm('Attention : La restauration remplacera toutes les données actuelles. Continuer ?')) {
        return;
      }

      setIsRestoring(true);
      try {
        let data: string;

        if (file.name.endsWith('.gz')) {
          data = await decompressData(file);
        } else {
          data = await file.text();
        }

        await importDatabase(data);
        showStatus('success', 'Données restaurées avec succès ! La page va se recharger.');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('Restore error:', error);
        showStatus('error', 'Erreur lors de la restauration. Vérifiez le fichier.');
      } finally {
        setIsRestoring(false);
      }
    };
    input.click();
  };

  // Fonction interne pour démarrer la sauvegarde automatique (utilisée au redémarrage et manuellement)
  const startAutoBackupInternal = useCallback((
    handle: FileSystemDirectoryHandle,
    destination: 'local' | 'onedrive',
    intervalMinutes: number
  ) => {
    if (autoBackupRef.current) {
      clearInterval(autoBackupRef.current);
    }

    setAutoRunning(true);

    // Run immediately
    handleSaveToFolder(destination);

    // Then at intervals
    autoBackupRef.current = setInterval(() => {
      handleSaveToFolder(destination);
    }, intervalMinutes * 60 * 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto backup (appelé manuellement par l'utilisateur)
  const startAutoBackup = () => {
    if (autoBackupRef.current) {
      clearInterval(autoBackupRef.current);
    }

    const handle = config.autoBackupDestination === 'local'
      ? config.localFolderHandle
      : config.onedriveFolderHandle;

    if (!handle) {
      showStatus('error', 'Configurez d\'abord un dossier de sauvegarde');
      return;
    }

    setConfig((prev) => ({ ...prev, autoBackupEnabled: true }));
    startAutoBackupInternal(handle, config.autoBackupDestination, config.autoBackupInterval);
    showStatus('success', 'Sauvegarde automatique démarrée');
  };

  const stopAutoBackup = () => {
    if (autoBackupRef.current) {
      clearInterval(autoBackupRef.current);
      autoBackupRef.current = null;
    }
    setAutoRunning(false);
    setConfig((prev) => ({ ...prev, autoBackupEnabled: false }));
    showStatus('success', 'Sauvegarde automatique arrêtée');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoBackupRef.current) {
        clearInterval(autoBackupRef.current);
      }
    };
  }, []);

  const destinationLabel = config.autoBackupDestination === 'local'
    ? config.localFolderName
      ? `Disque local (${config.localFolderName})`
      : 'Disque local (non configuré)'
    : config.onedriveFolderName
      ? `OneDrive (${config.onedriveFolderName})`
      : 'OneDrive (non configuré)';

  const canAutoBackup = config.autoBackupDestination === 'local'
    ? !!config.localFolderHandle
    : !!config.onedriveFolderHandle;

  return (
    <div className="space-y-6">
      {/* Status message */}
      {statusMessage && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg text-sm',
            statusMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          )}
        >
          {statusMessage.type === 'success' ? (
            <Check className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          )}
          {statusMessage.text}
        </div>
      )}

      {/* Warning banner when auto-backup was enabled but permissions expired */}
      {handlesRestored && config.autoBackupEnabled && !autoRunning && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Sauvegarde automatique interrompue</h3>
            <p className="text-sm text-amber-700 mt-1">
              La sauvegarde automatique était activée mais les permissions d'accès au dossier ont expiré.
              Cliquez sur le bouton ci-dessous pour redemander l'accès et reprendre la sauvegarde automatique.
            </p>
            <Button
              size="sm"
              className="mt-2"
              onClick={async () => {
                const type = config.autoBackupDestination;
                const handle = await getHandle(type);
                if (handle) {
                  const permission = await handle.requestPermission({ mode: 'readwrite' });
                  if (permission === 'granted') {
                    if (type === 'local') {
                      setConfig((prev) => ({ ...prev, localFolderHandle: handle }));
                    } else {
                      setConfig((prev) => ({ ...prev, onedriveFolderHandle: handle }));
                    }
                    startAutoBackupInternal(handle, type, config.autoBackupInterval);
                    showStatus('success', 'Sauvegarde automatique reprise');
                  } else {
                    showStatus('error', 'Permission refusée. Reconfigurez le dossier.');
                  }
                } else {
                  showStatus('error', 'Dossier non trouvé. Reconfigurez le dossier.');
                }
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Redemander les permissions
            </Button>
          </div>
        </div>
      )}

      {/* Recommendation banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-900">Sauvegarde recommandée</h3>
          <p className="text-sm text-blue-700 mt-1">
            Vos données sont stockées localement dans votre navigateur. Il est recommandé d'effectuer des sauvegardes régulières pour éviter toute perte de données.
          </p>
        </div>
      </div>

      {/* Local backup */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-primary-100 rounded-lg">
              <HardDrive className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900">Sauvegarde locale (Disque C:)</h3>
              <p className="text-sm text-primary-500 mt-1">
                Sauvegardez vos données directement sur votre disque local
              </p>
              {config.localFolderName && (
                <p className="text-xs text-primary-400 mt-1">
                  Dossier configuré : <strong>{config.localFolderName}</strong>
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleSaveToFolder('local')}
                  disabled={isExporting}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {config.localFolderHandle ? 'Sauvegarder' : 'Choisir et sauvegarder'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePickFolder('local')}
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configurer un dossier
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OneDrive backup */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Cloud className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900">Sauvegarde OneDrive</h3>
              <p className="text-sm text-primary-500 mt-1">
                Sauvegardez vos données dans votre dossier OneDrive (synchronisé automatiquement avec le cloud)
              </p>
              {config.onedriveFolderName && (
                <p className="text-xs text-primary-400 mt-1">
                  Dossier configuré : <strong>{config.onedriveFolderName}</strong>
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleSaveToFolder('onedrive')}
                  disabled={isExporting}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {config.onedriveFolderHandle ? 'Sauvegarder' : 'Choisir et sauvegarder'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePickFolder('onedrive')}
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configurer OneDrive
                </Button>
              </div>
              <p className="text-xs text-primary-400 mt-3 italic">
                Astuce : Sélectionnez votre dossier OneDrive (généralement C:\Users\VotreNom\OneDrive) pour une synchronisation automatique.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto backup */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900">Sauvegarde automatique</h3>
              <p className="text-sm text-primary-500 mt-1">
                Sauvegardez automatiquement vos données à intervalles réguliers
              </p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-medium text-primary-600 mb-1">Intervalle</label>
                  <select
                    value={config.autoBackupInterval}
                    onChange={(e) => setConfig((prev) => ({ ...prev, autoBackupInterval: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm bg-white"
                    disabled={autoRunning}
                  >
                    {INTERVALS.map((interval) => (
                      <option key={interval.value} value={interval.value}>
                        {interval.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary-600 mb-1">Destination</label>
                  <select
                    value={config.autoBackupDestination}
                    onChange={(e) => setConfig((prev) => ({ ...prev, autoBackupDestination: e.target.value as 'local' | 'onedrive' }))}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm bg-white"
                    disabled={autoRunning}
                  >
                    <option value="local">{config.localFolderName ? `Disque local (${config.localFolderName})` : 'Disque local (non configuré)'}</option>
                    <option value="onedrive">{config.onedriveFolderName ? `OneDrive (${config.onedriveFolderName})` : 'OneDrive (non configuré)'}</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                {autoRunning ? (
                  <Button size="sm" variant="danger" onClick={stopAutoBackup}>
                    <Square className="h-4 w-4 mr-2" />
                    Arrêter
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={startAutoBackup}
                    disabled={!canAutoBackup}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Démarrer
                  </Button>
                )}
                {!canAutoBackup && !autoRunning && (
                  <p className="text-xs text-amber-600 mt-2">
                    Configurez d'abord un dossier de sauvegarde (local ou OneDrive) ci-dessus.
                  </p>
                )}
              </div>
              <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-xs text-primary-600">
                  <strong>Note :</strong> La sauvegarde automatique reprend automatiquement au rechargement de la page si les permissions sont toujours valides.
                  Cependant, après une fermeture complète du navigateur, vous devrez cliquer sur "Redemander les permissions" pour reprendre la sauvegarde automatique (sécurité navigateur).
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-primary-200 text-center">
          <Database className="h-5 w-5 text-primary-400 mx-auto mb-1" />
          <p className="text-xs text-primary-500">Base de données</p>
          <p className="text-lg font-bold text-primary-900">{formatBytes(dbStats.size)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-primary-200 text-center">
          <Archive className="h-5 w-5 text-primary-400 mx-auto mb-1" />
          <p className="text-xs text-primary-500">Sauvegardes</p>
          <p className="text-lg font-bold text-primary-900">{history.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-primary-200 text-center">
          <Clock className="h-5 w-5 text-primary-400 mx-auto mb-1" />
          <p className="text-xs text-primary-500">Dernière sauvegarde</p>
          <p className="text-sm font-bold text-primary-900">
            {config.lastBackupDate ? formatDate(config.lastBackupDate) : 'Jamais'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-primary-200 text-center">
          <Database className="h-5 w-5 text-primary-400 mx-auto mb-1" />
          <p className="text-xs text-primary-500">Enregistrements</p>
          <p className="text-lg font-bold text-primary-900">{dbStats.records}</p>
        </div>
      </div>

      {/* Manual download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Créer une Sauvegarde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-primary-500 mb-4">
            Exportez vos données pour les conserver en lieu sûr
          </p>
          <Button onClick={handleDownload} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Export en cours...' : 'Télécharger (.json.gz)'}
          </Button>
          <p className="text-xs text-primary-400 mt-3">
            Les fichiers sont compressés et contiennent toutes vos données. Conservez-les dans un endroit sûr (cloud, disque externe).
          </p>
        </CardContent>
      </Card>

      {/* Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restaurer une Sauvegarde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-primary-500 mb-4">
            Récupérez vos données depuis un fichier de sauvegarde
          </p>
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="w-full p-6 border-2 border-dashed border-primary-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors text-center cursor-pointer"
          >
            <Upload className="h-8 w-8 text-primary-400 mx-auto mb-2" />
            <p className="text-sm text-primary-600">
              {isRestoring ? 'Restauration en cours...' : 'Cliquez pour sélectionner un fichier'}
            </p>
            <p className="text-xs text-primary-400 mt-1">.json ou .json.gz</p>
          </button>
          <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Attention : La restauration remplacera toutes les données actuelles. Créez une sauvegarde avant de restaurer.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des Sauvegardes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setHistory([]);
                localStorage.removeItem('cockpit-backup-history');
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
          </div>
          <p className="text-sm text-primary-500">Vos 10 dernières sauvegardes locales</p>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-primary-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {entry.destination === 'download' && <Download className="h-4 w-4 text-primary-500" />}
                    {entry.destination === 'local' && <HardDrive className="h-4 w-4 text-primary-500" />}
                    {entry.destination === 'onedrive' && <Cloud className="h-4 w-4 text-blue-500" />}
                    <div>
                      <p className="text-sm font-medium text-primary-900">{entry.filename}</p>
                      <p className="text-xs text-primary-500">
                        {formatDate(entry.date)} - {formatBytes(entry.size)} - {entry.recordCount} enregistrements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-primary-500">
              <Archive className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucune sauvegarde dans l'historique</p>
              <p className="text-xs text-primary-400 mt-1">Créez votre première sauvegarde</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
