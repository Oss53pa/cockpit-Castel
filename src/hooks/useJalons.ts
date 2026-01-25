import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Jalon, JalonFilters, JalonStatus, Axe } from '@/types';
import { getDaysUntil } from '@/lib/utils';

export function useJalons(filters?: JalonFilters) {
  const jalons = useLiveQuery(async () => {
    let query = db.jalons.toCollection();

    if (filters?.axe) {
      query = db.jalons.where('axe').equals(filters.axe);
    }

    let results = await query.toArray();

    if (filters?.status) {
      results = results.filter((j) => j.statut === filters.status);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(
        (j) =>
          j.titre.toLowerCase().includes(searchLower) ||
          j.description.toLowerCase().includes(searchLower)
      );
    }
    if (filters?.buildingCode) {
      results = results.filter((j) => j.buildingCode === filters.buildingCode);
    }
    if (filters?.projectPhase) {
      results = results.filter((j) => j.projectPhase === filters.projectPhase);
    }

    // Sort by date
    results.sort((a, b) =>
      new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime()
    );

    return results;
  }, [filters]);

  return jalons ?? [];
}

export function useJalon(id: number | undefined) {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    return db.jalons.get(id);
  }, [id]);
}

export function useJalonsByAxe(axe: Axe) {
  return useLiveQuery(async () => {
    return db.jalons.where('axe').equals(axe).toArray();
  }, [axe]) ?? [];
}

export function useProchainsJalons(limit = 5) {
  return useLiveQuery(async () => {
    const today = new Date().toISOString().split('T')[0];
    const jalons = await db.jalons.toArray();

    return jalons
      .filter((j) => j.date_prevue >= today && j.statut !== 'atteint')
      .sort((a, b) =>
        new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime()
      )
      .slice(0, limit);
  }, [limit]) ?? [];
}

export async function createJalon(
  jalon: Omit<Jalon, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = new Date().toISOString();
  return db.jalons.add({
    ...jalon,
    createdAt: now,
    updatedAt: now,
  } as Jalon);
}

export async function updateJalon(
  id: number,
  updates: Partial<Jalon>
): Promise<void> {
  await db.jalons.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteJalon(id: number): Promise<void> {
  // Also unlink actions
  const actions = await db.actions.where('jalonId').equals(id).toArray();
  for (const action of actions) {
    await db.actions.update(action.id!, { jalonId: undefined });
  }
  await db.jalons.delete(id);
}

export function calculateJalonStatus(
  jalon: Jalon,
  actionsLiees: { avancement: number }[]
): JalonStatus {
  const daysUntil = getDaysUntil(jalon.date_prevue);
  const avgAvancement =
    actionsLiees.length > 0
      ? actionsLiees.reduce((sum, a) => sum + a.avancement, 0) / actionsLiees.length
      : 0;

  // Already achieved
  if (jalon.date_reelle) {
    return 'atteint';
  }

  // Overdue
  if (daysUntil < 0) {
    return 'depasse';
  }

  // At risk: less than 15 days and progress < 80%
  if (daysUntil < 15 && avgAvancement < 80) {
    return 'en_danger';
  }

  // Approaching: less than 30 days
  if (daysUntil < 30) {
    return 'en_approche';
  }

  // Upcoming
  return 'a_venir';
}

export async function recalculateJalonStatuses(): Promise<void> {
  const jalons = await db.jalons.toArray();

  for (const jalon of jalons) {
    const actions = await db.actions
      .where('jalonId')
      .equals(jalon.id!)
      .toArray();

    const newStatus = calculateJalonStatus(jalon, actions);

    if (newStatus !== jalon.statut) {
      await db.jalons.update(jalon.id!, { statut: newStatus });
    }
  }
}
