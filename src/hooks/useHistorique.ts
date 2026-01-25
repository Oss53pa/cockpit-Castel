import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Historique } from '@/types';

export function useHistorique(limit = 50) {
  return useLiveQuery(async () => {
    const historique = await db.historique.toArray();

    return historique
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  }, [limit]) ?? [];
}

export function useHistoriqueByEntite(
  entiteType: Historique['entiteType'],
  entiteId: number
) {
  return useLiveQuery(async () => {
    const historique = await db.historique.toArray();

    return historique
      .filter(
        (h) => h.entiteType === entiteType && h.entiteId === entiteId
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [entiteType, entiteId]) ?? [];
}

export async function addHistorique(
  entry: Omit<Historique, 'id' | 'timestamp'>
): Promise<number> {
  return db.historique.add({
    ...entry,
    timestamp: new Date().toISOString(),
  } as Historique);
}

export async function trackChange<T extends Record<string, unknown>>(
  entiteType: Historique['entiteType'],
  entiteId: number,
  auteurId: number,
  oldData: T,
  newData: T,
  fields: (keyof T)[]
): Promise<void> {
  for (const field of fields) {
    const oldValue = oldData[field];
    const newValue = newData[field];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await addHistorique({
        entiteType,
        entiteId,
        auteurId,
        champModifie: String(field),
        ancienneValeur: JSON.stringify(oldValue),
        nouvelleValeur: JSON.stringify(newValue),
      });
    }
  }
}
