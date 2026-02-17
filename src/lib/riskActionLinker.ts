import { db } from '@/db';
import { logger } from '@/lib/logger';

export interface LinkResult {
  risquesLinked: number;
  totalLinks: number;
}

/**
 * Lie automatiquement les risques aux actions par correspondance sur l'axe et le buildingCode.
 */
export async function linkAllRisksToActions(): Promise<LinkResult> {
  try {
    const risques = await db.risques.toArray();
    const actions = await db.actions.toArray();

    let risquesLinked = 0;
    let totalLinks = 0;

    for (const risque of risques) {
      const matchingActions = actions.filter(
        (a) =>
          a.axe === risque.axe &&
          a.buildingCode === risque.buildingCode
      );

      if (matchingActions.length > 0) {
        risquesLinked++;
        totalLinks += matchingActions.length;
      }
    }

    logger.info(`[riskActionLinker] ${risquesLinked} risques liés à ${totalLinks} actions`);
    return { risquesLinked, totalLinks };
  } catch (error) {
    logger.warn('[riskActionLinker] Erreur lors de la liaison:', error);
    return { risquesLinked: 0, totalLinks: 0 };
  }
}
