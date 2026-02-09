// ============================================================================
// AUDIT MIDDLEWARE DEXIE — Directive CRMC Règle 3 (Traçabilité)
// Intercepte toutes les écritures sur les tables métier et historise les diffs
// ============================================================================

import type Dexie from 'dexie';
import type { DBCore, DBCoreMutateRequest, DBCoreMutateResponse } from 'dexie';
import { getCurrentWriteContext } from './writeContext';

// Tables métier à auditer
const AUDITED_TABLES = new Set([
  'actions',
  'jalons',
  'risques',
  'budget',
  'alertes',
  'budgetExploitation',
]);

// Mapping table → entiteType pour l'historique
const TABLE_TO_ENTITY_TYPE: Record<string, string> = {
  actions: 'action',
  jalons: 'jalon',
  risques: 'risque',
  budget: 'budget',
  alertes: 'alerte',
  budgetExploitation: 'budget',
};

// Champs à ignorer dans le diff (méta-données qui changent toujours)
const IGNORED_FIELDS = new Set([
  'updatedAt',
  'updated_at',
  'createdAt',
  'created_at',
]);

/**
 * Calcule le diff entre deux objets, retourne les champs modifiés.
 */
function computeDiff(
  oldObj: Record<string, unknown> | undefined,
  newObj: Record<string, unknown>
): Array<{ champ: string; ancien: string; nouveau: string }> {
  if (!oldObj) return [];

  const diffs: Array<{ champ: string; ancien: string; nouveau: string }> = [];

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  for (const key of allKeys) {
    if (IGNORED_FIELDS.has(key)) continue;

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    const oldStr = JSON.stringify(oldVal);
    const newStr = JSON.stringify(newVal);

    if (oldStr !== newStr) {
      diffs.push({
        champ: key,
        ancien: oldStr ?? 'undefined',
        nouveau: newStr ?? 'undefined',
      });
    }
  }

  return diffs;
}

/**
 * Installe le middleware d'audit sur une instance Dexie.
 * À appeler une fois après la construction de la DB.
 */
export function installAuditMiddleware(database: Dexie): void {
  database.use({
    stack: 'dbcore',
    name: 'AuditMiddleware',
    create(downlevelDatabase: DBCore): DBCore {
      return {
        ...downlevelDatabase,
        table(tableName: string) {
          const downlevelTable = downlevelDatabase.table(tableName);

          if (!AUDITED_TABLES.has(tableName)) {
            return downlevelTable;
          }

          return {
            ...downlevelTable,
            async mutate(req: DBCoreMutateRequest): Promise<DBCoreMutateResponse> {
              // Capturer le contexte AVANT l'écriture
              const writeCtx = getCurrentWriteContext();
              const entiteType = TABLE_TO_ENTITY_TYPE[tableName] || tableName;
              const now = new Date().toISOString();

              try {
                if (req.type === 'add') {
                  // Pour add: exécuter d'abord, puis logger
                  const res = await downlevelTable.mutate(req);

                  // Logger les créations (fire-and-forget, ne bloque pas)
                  const values = req.values as Record<string, unknown>[];
                  const historiqueEntries: Array<Record<string, unknown>> = [];

                  for (let i = 0; i < values.length; i++) {
                    const entityId = res.results?.[i] ?? values[i].id;
                    historiqueEntries.push({
                      timestamp: now,
                      entiteType,
                      entiteId: entityId,
                      champModifie: '_creation',
                      ancienneValeur: '',
                      nouvelleValeur: `Création (${writeCtx?.source || 'system'})`,
                      auteurId: writeCtx?.auteurId ?? 0,
                      source: writeCtx?.source || 'system',
                    });
                  }

                  if (historiqueEntries.length > 0) {
                    // Écrire en asynchrone sans bloquer le résultat
                    downlevelDatabase.table('historique').mutate({
                      type: 'add',
                      trans: req.trans,
                      values: historiqueEntries,
                    }).catch(() => {
                      // Silently ignore audit errors
                    });
                  }

                  return res;
                }

                if (req.type === 'put') {
                  // Pour put: capturer les anciennes valeurs d'abord
                  const values = req.values as Record<string, unknown>[];
                  const keys = req.keys as (number | undefined)[] | undefined;

                  const primaryKeys: (number | undefined)[] = [];
                  if (keys) {
                    primaryKeys.push(...keys);
                  } else {
                    for (const val of values) {
                      primaryKeys.push(val.id as number | undefined);
                    }
                  }

                  // Récupérer les anciennes valeurs
                  const oldValues = await Promise.all(
                    primaryKeys.map(k =>
                      k !== undefined
                        ? downlevelTable.get({ trans: req.trans, key: k })
                        : Promise.resolve(undefined)
                    )
                  );

                  // Exécuter la mutation
                  const res = await downlevelTable.mutate(req);

                  // Calculer les diffs et historiser
                  const historiqueEntries: Array<Record<string, unknown>> = [];

                  for (let i = 0; i < values.length; i++) {
                    const newVal = values[i];
                    const oldVal = oldValues[i] as Record<string, unknown> | undefined;
                    const entityId = (res.results?.[i] ?? primaryKeys[i] ?? newVal.id) as number;

                    const diffs = computeDiff(oldVal, newVal);
                    for (const diff of diffs) {
                      historiqueEntries.push({
                        timestamp: now,
                        entiteType,
                        entiteId: entityId,
                        champModifie: diff.champ,
                        ancienneValeur: diff.ancien,
                        nouvelleValeur: diff.nouveau,
                        auteurId: writeCtx?.auteurId ?? 0,
                        source: writeCtx?.source || 'system',
                      });
                    }
                  }

                  if (historiqueEntries.length > 0) {
                    downlevelDatabase.table('historique').mutate({
                      type: 'add',
                      trans: req.trans,
                      values: historiqueEntries,
                    }).catch(() => {
                      // Silently ignore audit errors
                    });
                  }

                  return res;
                }

                if (req.type === 'delete') {
                  // Pour delete: capturer avant suppression
                  const range = req.range;

                  // Extraire les clés selon la structure
                  let keysToDelete: number[] = [];
                  if ((req as unknown as { keys: number[] }).keys) {
                    keysToDelete = (req as unknown as { keys: number[] }).keys;
                  } else if (range && typeof range.lower !== 'undefined' && range.lower === range.upper) {
                    // Single key delete
                    keysToDelete = [range.lower as number];
                  }
                  // Pour les range deletes complexes, on skip l'audit

                  let oldValues: unknown[] = [];
                  if (keysToDelete.length > 0) {
                    try {
                      oldValues = await downlevelTable.getMany({
                        trans: req.trans,
                        keys: keysToDelete,
                      });
                    } catch {
                      // Si getMany échoue, on continue sans audit
                      oldValues = [];
                    }
                  }

                  // Exécuter la suppression
                  const res = await downlevelTable.mutate(req);

                  // Logger les suppressions
                  const historiqueEntries: Array<Record<string, unknown>> = [];
                  for (const oldVal of oldValues) {
                    if (!oldVal) continue;
                    const entityId = (oldVal as Record<string, unknown>).id as number;
                    historiqueEntries.push({
                      timestamp: now,
                      entiteType,
                      entiteId: entityId,
                      champModifie: '_suppression',
                      ancienneValeur: JSON.stringify(oldVal),
                      nouvelleValeur: '',
                      auteurId: writeCtx?.auteurId ?? 0,
                      source: writeCtx?.source || 'system',
                    });
                  }

                  if (historiqueEntries.length > 0) {
                    downlevelDatabase.table('historique').mutate({
                      type: 'add',
                      trans: req.trans,
                      values: historiqueEntries,
                    }).catch(() => {
                      // Silently ignore audit errors
                    });
                  }

                  return res;
                }

                // Autres types de mutation (deleteRange, etc.)
                return downlevelTable.mutate(req);

              } catch (error) {
                // Si une erreur survient, on la propage sans bloquer
                throw error;
              }
            },
          };
        },
      };
    },
  });
}
