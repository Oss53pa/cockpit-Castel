import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Action, ActionFilters, ActionStatus, Axe } from '@/types';

export function useActions(filters?: ActionFilters) {
  const actions = useLiveQuery(async () => {
    let query = db.actions.toCollection();

    if (filters?.axe) {
      query = db.actions.where('axe').equals(filters.axe);
    }

    let results = await query.toArray();

    // Apply additional filters
    if (filters?.phase) {
      results = results.filter((a) => a.phase === filters.phase);
    }
    if (filters?.status) {
      results = results.filter((a) => a.statut === filters.status);
    }
    if (filters?.priorite) {
      results = results.filter((a) => a.priorite === filters.priorite);
    }
    if (filters?.responsableId) {
      results = results.filter((a) => a.responsableId === filters.responsableId);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.titre.toLowerCase().includes(searchLower) ||
          a.description.toLowerCase().includes(searchLower)
      );
    }
    if (filters?.dateDebut) {
      results = results.filter((a) => a.date_debut_prevue >= filters.dateDebut!);
    }
    if (filters?.dateFin) {
      results = results.filter((a) => a.date_fin_prevue <= filters.dateFin!);
    }
    if (filters?.buildingCode) {
      results = results.filter((a) => a.buildingCode === filters.buildingCode);
    }

    return results;
  }, [filters]);

  return actions ?? [];
}

export function useAction(id: number | undefined) {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    return db.actions.get(id);
  }, [id]);
}

export function useActionsByJalon(jalonId: number | undefined) {
  return useLiveQuery(async () => {
    if (!jalonId) return [];
    return db.actions.where('jalonId').equals(jalonId).toArray();
  }, [jalonId]) ?? [];
}

export function useActionsByAxe(axe: Axe) {
  return useLiveQuery(async () => {
    return db.actions.where('axe').equals(axe).toArray();
  }, [axe]) ?? [];
}

export function useActionsEnRetard() {
  return useLiveQuery(async () => {
    const today = new Date().toISOString().split('T')[0];
    const actions = await db.actions.toArray();
    return actions.filter(
      (a) => a.statut !== 'termine' && a.date_fin_prevue < today
    );
  }) ?? [];
}

export async function createAction(
  action: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = new Date().toISOString();
  return db.actions.add({
    ...action,
    createdAt: now,
    updatedAt: now,
  } as Action);
}

export async function updateAction(
  id: number,
  updates: Partial<Action>
): Promise<void> {
  await db.actions.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteAction(id: number): Promise<void> {
  await db.actions.delete(id);
}

export async function updateActionStatus(
  id: number,
  status: ActionStatus
): Promise<void> {
  const updates: Partial<Action> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  // If completed, set avancement to 100%
  if (status === 'termine') {
    updates.avancement = 100;
  }

  await db.actions.update(id, updates);
}

export async function addCommentaire(
  actionId: number,
  auteurId: number,
  contenu: string
): Promise<void> {
  const action = await db.actions.get(actionId);
  if (!action) return;

  const newCommentaire = {
    id: crypto.randomUUID(),
    auteurId,
    contenu,
    timestamp: new Date().toISOString(),
  };

  await db.actions.update(actionId, {
    commentaires: [...action.commentaires, newCommentaire],
    updatedAt: new Date().toISOString(),
  });
}
