import { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  HardDrive,
  Clock,
  FileJson,
  LogOut,
} from 'lucide-react';
import { Button, Tooltip } from '@/components/ui';
import {
  initializeGoogleAuth,
  signIn,
  signOut,
  isSignedIn,
  getCurrentUser,
  listBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  type GoogleUser,
  type BackupMetadata,
} from '@/services/googleDriveService';
import { logger } from '@/lib/logger';

export function GoogleDriveSync() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialisation
  useEffect(() => {
    const init = async () => {
      try {
        await initializeGoogleAuth();
        setIsInitialized(true);

        if (isSignedIn()) {
          setIsConnected(true);
          setUser(getCurrentUser());
          await loadBackups();
        }
      } catch (err) {
        logger.error('[GoogleDrive] Init error:', err);
        setError('Erreur lors de l\'initialisation de Google Drive');
      }
    };

    init();
  }, []);

  // Charger les backups
  const loadBackups = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const list = await listBackups();
      setBackups(list);
    } catch (err) {
      logger.error('[GoogleDrive] List error:', err);
      setError('Erreur lors du chargement des backups');
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion
  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const connectedUser = await signIn();
      setUser(connectedUser);
      setIsConnected(true);
      await loadBackups();
      setSuccess('Connexion reussie!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('[GoogleDrive] Sign in error:', err);
      setError('Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // Deconnexion
  const handleDisconnect = () => {
    signOut();
    setIsConnected(false);
    setUser(null);
    setBackups([]);
  };

  // Creer un backup
  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setError(null);

    try {
      await createBackup();
      await loadBackups();
      setSuccess('Backup cree avec succes!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('[GoogleDrive] Backup error:', err);
      setError('Erreur lors de la creation du backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Restaurer un backup
  const handleRestore = async (backup: BackupMetadata) => {
    if (!confirm(`Restaurer le backup du ${formatDate(backup.createdTime)}?\n\nCette action remplacera toutes les donnees actuelles.`)) {
      return;
    }

    setIsRestoring(backup.id);
    setError(null);

    try {
      const data = await restoreBackup(backup.id);
      setSuccess(`Backup restaure: ${data.metadata.actionsCount} actions, ${data.metadata.jalonsCount} jalons`);
      setTimeout(() => {
        setSuccess(null);
        window.location.reload();
      }, 2000);
    } catch (err) {
      logger.error('[GoogleDrive] Restore error:', err);
      setError('Erreur lors de la restauration');
    } finally {
      setIsRestoring(null);
    }
  };

  // Supprimer un backup
  const handleDelete = async (backup: BackupMetadata) => {
    if (!confirm(`Supprimer le backup du ${formatDate(backup.createdTime)}?`)) {
      return;
    }

    try {
      await deleteBackup(backup.id);
      await loadBackups();
      setSuccess('Backup supprime');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('[GoogleDrive] Delete error:', err);
      setError('Erreur lors de la suppression');
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formater la taille
  const formatSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!isInitialized) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Initialisation de Google Drive...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <HardDrive className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Google Drive Sync</h3>
              <p className="text-sm text-gray-500">
                Sauvegardez vos donnees sur Google Drive
              </p>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                <Cloud className="h-4 w-4" />
                <span>Connecte</span>
              </div>
              <Tooltip content="Deconnecter">
                <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
              <CloudOff className="h-4 w-4" />
              <span>Non connecte</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Contenu */}
      <div className="p-4">
        {!isConnected ? (
          <div className="text-center py-8">
            <Cloud className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">
              Connectez votre compte Google pour sauvegarder vos donnees sur Drive
            </p>
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 mr-2" />
                  Se connecter avec Google
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* User info */}
            {user && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mb-6">
              <Button onClick={handleCreateBackup} disabled={isBackingUp}>
                {isBackingUp ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Creer un backup
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={loadBackups} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>

            {/* Liste des backups */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Backups disponibles</h4>

              {backups.length === 0 ? (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  <FileJson className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun backup disponible</p>
                  <p className="text-sm">Creez votre premier backup</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileJson className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {formatDate(backup.createdTime)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>Modifie: {formatDate(backup.modifiedTime)}</span>
                            <span>•</span>
                            <span>{formatSize(backup.size)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tooltip content="Restaurer ce backup">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(backup)}
                            disabled={isRestoring === backup.id}
                          >
                            {isRestoring === backup.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </Tooltip>

                        <Tooltip content="Supprimer">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(backup)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GoogleDriveSync;
