// ============================================================================
// ENTITY HISTORY VIEWER — Directive CRMC Règle 3
// Timeline des modifications groupées par timestamp, filtrables par source
// ============================================================================

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { History, Filter, User, Cpu, Cloud, Download, Wrench, Database } from 'lucide-react';
import { db } from '@/db';
import { Card, Badge } from '@/components/ui';
import type { Historique } from '@/types';
import type { WriteSource } from '@/db/writeContext';

interface EntityHistoryViewerProps {
  entiteType: Historique['entiteType'];
  entiteId: number;
  maxEntries?: number;
}

// Couleurs et labels par source
const SOURCE_CONFIG: Record<WriteSource | 'unknown', { label: string; color: string; icon: typeof User }> = {
  user: { label: 'Utilisateur', color: 'bg-blue-100 text-blue-700', icon: User },
  'auto-calc': { label: 'Calcul auto', color: 'bg-gray-100 text-gray-700', icon: Cpu },
  'sync-firebase': { label: 'Sync Firebase', color: 'bg-orange-100 text-orange-700', icon: Cloud },
  import: { label: 'Import', color: 'bg-purple-100 text-purple-700', icon: Download },
  migration: { label: 'Migration', color: 'bg-teal-100 text-teal-700', icon: Wrench },
  seed: { label: 'Seed', color: 'bg-emerald-100 text-emerald-700', icon: Database },
  system: { label: 'Système', color: 'bg-gray-100 text-gray-600', icon: Cpu },
  unknown: { label: 'Inconnu', color: 'bg-gray-100 text-gray-500', icon: Cpu },
};

export function EntityHistoryViewer({ entiteType, entiteId, maxEntries = 100 }: EntityHistoryViewerProps) {
  const [sourceFilter, setSourceFilter] = useState<WriteSource | 'all'>('all');

  const entries = useLiveQuery(
    () =>
      db.historique
        .where('[entiteType+entiteId]')
        .equals([entiteType, entiteId])
        .reverse()
        .limit(maxEntries)
        .toArray()
        .catch(() =>
          // Fallback si l'index composé n'existe pas
          db.historique
            .where('entiteType')
            .equals(entiteType)
            .filter((h) => h.entiteId === entiteId)
            .reverse()
            .limit(maxEntries)
            .toArray()
        ),
    [entiteType, entiteId, maxEntries]
  );

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (sourceFilter === 'all') return entries;
    return entries.filter((e) => {
      const src = (e as Historique & { source?: WriteSource }).source;
      return src === sourceFilter;
    });
  }, [entries, sourceFilter]);

  // Grouper par timestamp (même seconde)
  const grouped = useMemo(() => {
    const groups: Array<{ timestamp: string; source: WriteSource | 'unknown'; entries: typeof filteredEntries }> = [];
    let currentGroup: (typeof groups)[number] | null = null;

    for (const entry of filteredEntries) {
      const ts = entry.timestamp.slice(0, 19); // Tronquer aux secondes
      const src = (entry as Historique & { source?: WriteSource }).source || 'unknown';

      if (!currentGroup || currentGroup.timestamp !== ts) {
        currentGroup = { timestamp: ts, source: src, entries: [] };
        groups.push(currentGroup);
      }
      currentGroup.entries.push(entry);
    }

    return groups;
  }, [filteredEntries]);

  if (!entries) {
    return <div className="text-sm text-primary-400 py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Header avec filtres */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-medium text-primary-700">
            Historique ({filteredEntries.length} entrées)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3 w-3 text-primary-400" />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as WriteSource | 'all')}
            className="text-xs border border-primary-200 rounded px-2 py-1 bg-white"
          >
            <option value="all">Toutes sources</option>
            <option value="user">Utilisateur</option>
            <option value="auto-calc">Calcul auto</option>
            <option value="sync-firebase">Sync Firebase</option>
            <option value="import">Import</option>
            <option value="migration">Migration</option>
            <option value="seed">Seed</option>
            <option value="system">Système</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <p className="text-sm text-primary-400 py-4 text-center">
          Aucune modification enregistrée
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {grouped.map((group, idx) => {
            const config = SOURCE_CONFIG[group.source];
            const Icon = config.icon;
            const date = new Date(group.timestamp);

            return (
              <Card key={idx} padding="sm" className="border-l-4" style={{ borderLeftColor: group.source === 'user' ? '#3B82F6' : group.source === 'auto-calc' ? '#6B7280' : group.source === 'sync-firebase' ? '#F97316' : group.source === 'import' ? '#8B5CF6' : '#10B981' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-3 w-3" />
                  <Badge variant="default" className={`text-[10px] ${config.color}`}>
                    {config.label}
                  </Badge>
                  <span className="text-[10px] text-primary-400">
                    {date.toLocaleDateString('fr-FR')} {date.toLocaleTimeString('fr-FR')}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.entries.map((entry, entryIdx) => (
                    <div key={entryIdx} className="text-xs text-primary-600">
                      <span className="font-mono font-medium text-primary-800">
                        {entry.champModifie}
                      </span>
                      {entry.champModifie !== '_creation' && entry.champModifie !== '_suppression' && (
                        <>
                          {' '}
                          <span className="text-primary-400">:</span>{' '}
                          <span className="text-error-500 line-through">
                            {truncateValue(entry.ancienneValeur)}
                          </span>
                          {' → '}
                          <span className="text-success-600">
                            {truncateValue(entry.nouvelleValeur)}
                          </span>
                        </>
                      )}
                      {entry.champModifie === '_creation' && (
                        <span className="text-success-600"> {entry.nouvelleValeur}</span>
                      )}
                      {entry.champModifie === '_suppression' && (
                        <span className="text-error-500"> Entité supprimée</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function truncateValue(val: string, max = 60): string {
  if (!val) return '(vide)';
  // Essayer de parser JSON pour un affichage plus lisible
  try {
    const parsed = JSON.parse(val);
    if (typeof parsed === 'object' && parsed !== null) {
      const str = JSON.stringify(parsed);
      return str.length > max ? str.slice(0, max) + '...' : str;
    }
    return String(parsed);
  } catch {
    return val.length > max ? val.slice(0, max) + '...' : val;
  }
}
