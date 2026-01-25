import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Risque, RisqueFilters, RisqueCategory } from '@/types';

export function useRisques(filters?: RisqueFilters) {
  const risques = useLiveQuery(async () => {
    let query = db.risques.toCollection();

    if (filters?.categorie) {
      query = db.risques.where('categorie').equals(filters.categorie);
    }

    let results = await query.toArray();

    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }
    if (filters?.scoreMin !== undefined) {
      results = results.filter((r) => r.score >= filters.scoreMin!);
    }
    if (filters?.scoreMax !== undefined) {
      results = results.filter((r) => r.score <= filters.scoreMax!);
    }
    if (filters?.buildingCode) {
      results = results.filter((r) => r.buildingCode === filters.buildingCode);
    }
    if (filters?.projectPhase) {
      results = results.filter((r) => r.projectPhase === filters.projectPhase);
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results;
  }, [filters]);

  return risques ?? [];
}

export function useRisque(id: number | undefined) {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    return db.risques.get(id);
  }, [id]);
}

export function useRisquesCritiques() {
  return useLiveQuery(async () => {
    const risques = await db.risques.toArray();
    return risques.filter((r) => r.score >= 12 && r.status === 'open');
  }) ?? [];
}

export function useRisquesByCategory(categorie: RisqueCategory) {
  return useLiveQuery(async () => {
    return db.risques.where('categorie').equals(categorie).toArray();
  }, [categorie]) ?? [];
}

export async function createRisque(
  risque: Omit<Risque, 'id' | 'score' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = new Date().toISOString();
  const score = risque.probabilite * risque.impact;

  return db.risques.add({
    ...risque,
    score,
    createdAt: now,
    updatedAt: now,
  } as Risque);
}

export async function updateRisque(
  id: number,
  updates: Partial<Risque>
): Promise<void> {
  const risque = await db.risques.get(id);
  if (!risque) return;

  // Recalculate score if probabilite or impact changed
  let score = risque.score;
  if (updates.probabilite !== undefined || updates.impact !== undefined) {
    const newProba = updates.probabilite ?? risque.probabilite;
    const newImpact = updates.impact ?? risque.impact;
    score = newProba * newImpact;
  }

  await db.risques.update(id, {
    ...updates,
    score,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteRisque(id: number): Promise<void> {
  await db.risques.delete(id);
}

export function getRisqueCriticiteLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 12) return 'critical';
  if (score >= 9) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

export function getRisqueCriticiteColor(score: number): string {
  if (score >= 12) return 'bg-error-500';
  if (score >= 9) return 'bg-warning-500';
  if (score >= 5) return 'bg-info-500';
  return 'bg-success-500';
}
