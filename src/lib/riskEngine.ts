import { db } from '@/db';
import { logger } from '@/lib/logger';

/**
 * Évalue automatiquement tous les risques actifs.
 * Recalcule le score (probabilité × impact) et met à jour le statut si nécessaire.
 */
export async function evaluateAllRisks(): Promise<{ evaluated: number; updated: number }> {
  try {
    const risques = await db.risques.toArray();
    let evaluated = 0;
    let updated = 0;

    for (const risque of risques) {
      if (risque.status === 'closed' || risque.status === 'ferme') continue;

      evaluated++;
      const probabilite = risque.probabilite ?? 1;
      const impact = risque.impact ?? 1;
      const newScore = probabilite * impact;

      if (newScore !== risque.score) {
        await db.risques.update(risque.id!, { score: newScore });
        updated++;
      }
    }

    logger.info(`[riskEngine] ${evaluated} risques évalués, ${updated} mis à jour`);
    return { evaluated, updated };
  } catch (error) {
    logger.warn('[riskEngine] Erreur évaluation:', error);
    return { evaluated: 0, updated: 0 };
  }
}
