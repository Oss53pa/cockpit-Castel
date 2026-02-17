import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Risque, RisqueFilters, RisqueCategory } from '@/types';
import { SEUILS_RISQUES } from '@/data/constants';
import { withWriteContext } from '@/db/writeContext';

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

    // Sort by score descending (null-safe)
    results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

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
    return risques.filter((r) => (r.score ?? 0) >= 16 && r.status !== 'closed' && r.status !== 'ferme');
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

  return withWriteContext({ source: 'user' }, () =>
    db.risques.add({
      ...risque,
      score,
      createdAt: now,
      updatedAt: now,
    } as Risque)
  );
}

export async function updateRisque(
  id: number,
  updates: Partial<Risque>
): Promise<void> {
  await withWriteContext({ source: 'user' }, async () => {
    const risque = await db.risques.get(id);
    if (!risque) return;

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
  });
}

export async function deleteRisque(id: number): Promise<void> {
  await withWriteContext({ source: 'user' }, () =>
    db.transaction('rw', [db.risques, db.alertes], async () => {
      await db.alertes.filter(a => a.entiteType === 'risque' && a.entiteId === id).delete();
      await db.risques.delete(id);
    })
  );
}

export function getRisqueCriticiteLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= SEUILS_RISQUES.critique) return 'critical';
  if (score >= SEUILS_RISQUES.majeur) return 'high';
  if (score >= SEUILS_RISQUES.modere) return 'medium';
  return 'low';
}

export function getRisqueCriticiteColor(score: number): string {
  if (score >= SEUILS_RISQUES.critique) return 'bg-error-500';
  if (score >= SEUILS_RISQUES.majeur) return 'bg-warning-500';
  if (score >= SEUILS_RISQUES.modere) return 'bg-info-500';
  return 'bg-success-500';
}
