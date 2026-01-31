import { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useFirebaseSync } from '@/hooks/useFirebaseSync';

export function FirebaseSyncIndicator() {
  const { pendingCount, isSyncing, lastSync, syncAllPending, syncResults } = useFirebaseSync();
  const [showDetails, setShowDetails] = useState(false);

  const handleSync = async () => {
    await syncAllPending();
  };

  if (pendingCount === 0 && !isSyncing) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100"
        onClick={() => setShowDetails(!showDetails)}
        title="Synchronisation Firebase"
      >
        <Cloud className="w-4 h-4" />
        <span className="hidden md:inline">Synchronisé</span>
        {lastSync && (
          <span className="text-xs text-green-500 hidden lg:inline">
            {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
          isSyncing
            ? 'bg-blue-100 text-blue-600'
            : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
        }`}
        title={`${pendingCount} mise(s) à jour en attente`}
      >
        {isSyncing ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <CloudOff className="w-4 h-4" />
        )}
        <span className="hidden md:inline">
          {isSyncing ? 'Synchronisation...' : `${pendingCount} en attente`}
        </span>
        {!isSyncing && pendingCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full md:hidden">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Badge notification mobile */}
      {!isSyncing && pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full md:hidden">
          {pendingCount}
        </span>
      )}

      {/* Détails des résultats */}
      {showDetails && syncResults.length > 0 && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border p-3 z-50">
          <h4 className="text-sm font-semibold mb-2">Dernière synchronisation</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {syncResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-xs p-2 rounded ${
                  result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {result.success ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>
                  {result.entityType} #{result.entityId} - {result.recipientName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
