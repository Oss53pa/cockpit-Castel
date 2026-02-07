import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Exco } from '@/types/exco';

// Get all Excos
export function useExcos() {
  return useLiveQuery(
    () => db.excos.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];
}

// Get a single Exco by ID
export function useExco(id: number | undefined) {
  return useLiveQuery(
    () => (id ? db.excos.get(id) : undefined),
    [id]
  );
}

// Get Excos by status
export function useExcosByStatus(status: Exco['status']) {
  return useLiveQuery(
    () => db.excos.where('status').equals(status).reverse().toArray(),
    [status]
  ) || [];
}

// Get recent Excos (last 30 days)
export function useRecentExcos(days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  return useLiveQuery(
    () => db.excos.where('createdAt').above(sinceStr).reverse().toArray(),
    [sinceStr]
  ) || [];
}

// Create a new Exco
export async function createExco(exco: Omit<Exco, 'id'>): Promise<number> {
  const now = new Date().toISOString();
  return await db.excos.add({
    ...exco,
    createdAt: exco.createdAt || now,
    updatedAt: now,
  });
}

// Update an existing Exco
export async function updateExco(id: number, updates: Partial<Exco>): Promise<number> {
  return await db.excos.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

// Delete a Exco
export async function deleteExco(id: number): Promise<void> {
  await db.excos.delete(id);
}

// Mark Exco as presented
export async function markExcoAsPresented(
  id: number,
  presentedTo: string
): Promise<number> {
  return await db.excos.update(id, {
    status: 'presented',
    presentedAt: new Date().toISOString(),
    presentedTo,
    updatedAt: new Date().toISOString(),
  });
}

// Archive a Exco
export async function archiveExco(id: number): Promise<number> {
  return await db.excos.update(id, {
    status: 'archived',
    updatedAt: new Date().toISOString(),
  });
}

// Duplicate a Exco
export async function duplicateExco(id: number): Promise<number> {
  const original = await db.excos.get(id);
  if (!original) throw new Error('Exco not found');

  const { id: _unusedId, ...rest } = original;
  void _unusedId;
  const now = new Date().toISOString();

  return await db.excos.add({
    ...rest,
    titre: `${original.titre} (copie)`,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    presentedAt: undefined,
    presentedTo: undefined,
  });
}

// Get Exco statistics
export function useExcoStats() {
  return useLiveQuery(async () => {
    const all = await db.excos.toArray();
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
