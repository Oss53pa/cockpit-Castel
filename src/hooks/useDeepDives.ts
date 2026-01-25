import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { DeepDive } from '@/types/deepDive';

// Get all DeepDives
export function useDeepDives() {
  return useLiveQuery(
    () => db.deepDives.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];
}

// Get a single DeepDive by ID
export function useDeepDive(id: number | undefined) {
  return useLiveQuery(
    () => (id ? db.deepDives.get(id) : undefined),
    [id]
  );
}

// Get DeepDives by status
export function useDeepDivesByStatus(status: DeepDive['status']) {
  return useLiveQuery(
    () => db.deepDives.where('status').equals(status).reverse().toArray(),
    [status]
  ) || [];
}

// Get recent DeepDives (last 30 days)
export function useRecentDeepDives(days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  return useLiveQuery(
    () => db.deepDives.where('createdAt').above(sinceStr).reverse().toArray(),
    [sinceStr]
  ) || [];
}

// Create a new DeepDive
export async function createDeepDive(deepDive: Omit<DeepDive, 'id'>): Promise<number> {
  const now = new Date().toISOString();
  return await db.deepDives.add({
    ...deepDive,
    createdAt: deepDive.createdAt || now,
    updatedAt: now,
  });
}

// Update an existing DeepDive
export async function updateDeepDive(id: number, updates: Partial<DeepDive>): Promise<number> {
  return await db.deepDives.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

// Delete a DeepDive
export async function deleteDeepDive(id: number): Promise<void> {
  await db.deepDives.delete(id);
}

// Mark DeepDive as presented
export async function markDeepDiveAsPresented(
  id: number,
  presentedTo: string
): Promise<number> {
  return await db.deepDives.update(id, {
    status: 'presented',
    presentedAt: new Date().toISOString(),
    presentedTo,
    updatedAt: new Date().toISOString(),
  });
}

// Archive a DeepDive
export async function archiveDeepDive(id: number): Promise<number> {
  return await db.deepDives.update(id, {
    status: 'archived',
    updatedAt: new Date().toISOString(),
  });
}

// Duplicate a DeepDive
export async function duplicateDeepDive(id: number): Promise<number> {
  const original = await db.deepDives.get(id);
  if (!original) throw new Error('DeepDive not found');

  const { id: _unusedId, ...rest } = original;
  void _unusedId;
  const now = new Date().toISOString();

  return await db.deepDives.add({
    ...rest,
    titre: `${original.titre} (copie)`,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    presentedAt: undefined,
    presentedTo: undefined,
  });
}

// Get DeepDive statistics
export function useDeepDiveStats() {
  return useLiveQuery(async () => {
    const all = await db.deepDives.toArray();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: all.length,
      drafts: all.filter(d => d.status === 'draft').length,
      finalized: all.filter(d => d.status === 'finalized').length,
      presented: all.filter(d => d.status === 'presented').length,
      archived: all.filter(d => d.status === 'archived').length,
      thisMonth: all.filter(d => new Date(d.createdAt) >= thirtyDaysAgo).length,
      byWeather: {
        green: all.filter(d => d.meteoGlobale === 'green').length,
        yellow: all.filter(d => d.meteoGlobale === 'yellow').length,
        orange: all.filter(d => d.meteoGlobale === 'orange').length,
        red: all.filter(d => d.meteoGlobale === 'red').length,
      },
    };
  }, []);
}
