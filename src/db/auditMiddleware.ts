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
            mutate(req: DBCoreMutateRequest): Promise<DBCoreMutateResponse> {
              // Capturer le contexte AVANT l'écriture
              const writeCtx = getCurrentWriteContext();

              if (req.type === 'put' || req.type === 'add') {
                // Pour put: capturer les anciennes valeurs avant la mutation
                const values = req.values as Record<string, unknown>[];
                const keys = req.keys as (number | undefined)[] | undefined;

                // Obtenir les clés primaires
                const primaryKeys: (number | undefined)[] = [];
                if (keys) {
                  primaryKeys.push(...keys);
                } else {
                  for (const val of values) {
                    primaryKeys.push(val.id as number | undefined);
                  }
                }

                // Capturer les anciennes valeurs pour les puts (pas les adds)
                const oldValuesPromise = req.type === 'put'
                  ? Promise.all(
                      primaryKeys.map(k =>
                        k !== undefined
                          ? downlevelTable.get({ trans: req.trans, key: k })
                          : Promise.resolve(undefined)
                      )
                    )
                  : Promise.resolve(primaryKeys.map(() => undefined));

                return oldValuesPromise.then(oldValues => {
                  return downlevelTable.mutate(req).then(res => {
                    // Après écriture réussie : calculer les diffs et historiser
                    queueMicrotask(() => {
                      const entiteType = TABLE_TO_ENTITY_TYPE[tableName] || tableName;
                      const historiqueEntries: Array<Record<string, unknown>> = [];
                      const now = new Date().toISOString();

                      for (let i = 0; i < values.length; i++) {
                        const newVal = values[i];
                        const oldVal = oldValues[i] as Record<string, unknown> | undefined;
                        const entityId = (res.results?.[i] ?? primaryKeys[i] ?? newVal.id) as number;

                        if (req.type === 'add') {
                          // Pour les adds, juste logger la création
                          historiqueEntries.push({
                            timestamp: now,
                            entiteType,
                            entiteId: entityId,
                            champModifie: '_creation',
                            ancienneValeur: '',
                            nouvelleValeur: `Création (${writeCtx?.source || 'unknown'})`,
                            auteurId: writeCtx?.auteurId ?? 0,
                            source: writeCtx?.source || 'system',
                          });
                        } else {
                          // Pour les puts, calculer le diff
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
                      }

                      if (historiqueEntries.length > 0) {
                        // Écrire dans historique via le downlevel (bypass le middleware)
                        const historiqueTable = downlevelDatabase.table('historique');
                        historiqueTable
                          .mutate({
                            type: 'add',
                            trans: req.trans,
                            values: historiqueEntries,
                          })
                          .catch((err: unknown) => {
                            console.warn('[AuditMiddleware] Erreur écriture historique:', err);
                          });
                      }
                    });

                    return res;
                  });
                });
              }

              if (req.type === 'delete') {
                // Pour les deletes : capturer avant suppression
                const range = req.range;
                const entiteType = TABLE_TO_ENTITY_TYPE[tableName] || tableName;

                // Extraire les clés à supprimer selon la structure de la requête
                let keysToDelete: number[] = [];
                if (range && range.type === 'range') {
                  // Range delete - on ne peut pas facilement lister les clés
                  keysToDelete = [];
                } else if ((req as unknown as { keys: number[] }).keys) {
                  keysToDelete = (req as unknown as { keys: number[] }).keys;
                } else if (range && typeof range.lower !== 'undefined') {
                  // Single key delete via range.lower
                  keysToDelete = [range.lower as number];
                }

                // Capturer les anciennes valeurs
                return downlevelTable
                  .getMany({
                    trans: req.trans,
                    keys: keysToDelete,
                  })
                  .then(oldValues => {
                    return downlevelTable.mutate(req).then(res => {
                      queueMicrotask(() => {
                        const now = new Date().toISOString();
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
                          const historiqueTable = downlevelDatabase.table('historique');
                          historiqueTable
                            .mutate({
                              type: 'add',
                              trans: req.trans,
                              values: historiqueEntries,
                            })
                            .catch((err: unknown) => {
                              console.warn('[AuditMiddleware] Erreur écriture historique suppression:', err);
                            });
                        }
                      });

                      return res;
                    });
                  })
                  .catch(() => {
                    // Si getMany échoue (range delete), on passe quand même la mutation
                    return downlevelTable.mutate(req);
                  });
              }

              // deleteRange ou autres types non gérés
              return downlevelTable.mutate(req);
            },
          };
        },
      };
    },
  });
}
