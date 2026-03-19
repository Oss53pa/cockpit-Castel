// ============================================================================
// AUTO-LIAISON RISQUES ↔ ACTIONS
// Lie automatiquement les risques aux actions par correspondance sémantique
// ============================================================================

import { db } from '@/db';
import { withWriteContext } from '@/db/writeContext';
import type { Risque, Action, Axe, RisqueCategory } from '@/types';
import { logger } from '@/lib/logger';

// ============================================================================
// MAPPING CATÉGORIE RISQUE → AXES ASSOCIÉS
// ============================================================================

const CATEGORIE_AXES_MAPPING: Record<RisqueCategory, Axe[]> = {
  rh: ['axe1_rh'],
  commercial: ['axe2_commercial'],
  technique: ['axe3_technique', 'axe7_construction'],
  planning: ['axe3_technique', 'axe7_construction'],
  financier: ['axe4_budget'],
  contractuel: ['axe4_budget', 'axe2_commercial'],
  marketing: ['axe5_marketing'],
  operationnel: ['axe6_exploitation'],
  exploitation: ['axe6_exploitation'],
  securite: ['axe6_exploitation', 'axe7_construction'],
  reglementaire: ['axe6_exploitation', 'axe4_budget'],
  organisationnel: ['axe1_rh', 'axe8_divers'],
  externe: ['axe8_divers'],
  environnemental: ['axe7_construction', 'axe6_exploitation'],
  juridique: ['axe4_budget'],
  reputation: ['axe2_commercial', 'axe5_marketing'],
  strategique: ['axe2_commercial', 'axe4_budget'],
};

// ============================================================================
// SCORING
// ============================================================================

interface MatchScore {
  actionId: string;
  actionDbId: number;
  score: number;
}

function computeMatchScore(risque: Risque, action: Action): number {
  let score = 0;

  // 1. Correspondance axe (40 pts)
  const axesCibles = CATEGORIE_AXES_MAPPING[risque.categorie] || [];
  if (axesCibles.includes(action.axe)) {
    score += 40;
  }

  // 2. Correspondance buildingCode (25 pts)
  if (risque.buildingCode && action.buildingCode && risque.buildingCode === action.buildingCode) {
    score += 25;
  }

  // 3. Correspondance projectPhase (20 pts)
  if (risque.projectPhase && action.projectPhase && risque.projectPhase === action.projectPhase) {
    score += 20;
  }

  // 4. Mots-clés titre/description (15 pts max)
  const risqueWords = extractKeywords(risque.titre + ' ' + risque.description);
  const actionWords = extractKeywords(action.titre + ' ' + action.description);
  const commonWords = risqueWords.filter(w => actionWords.includes(w));
  if (commonWords.length > 0) {
    score += Math.min(commonWords.length * 5, 15);
  }

  return score;
}

/** Extrait les mots-clés significatifs (> 3 chars, sans mots courants) */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'pour', 'avec', 'dans', 'les', 'des', 'une', 'par', 'sur', 'qui', 'que',
    'est', 'son', 'aux', 'pas', 'plus', 'tout', 'tous', 'cette', 'être',
    'avoir', 'faire', 'comme', 'mais', 'aussi', 'entre', 'après', 'avant',
    'sans', 'sous', 'vers', 'chez', 'dont', 'leur', 'même', 'autre',
    'action', 'mise', 'place', 'projet', 'centre', 'commercial',
  ]);

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .split(/\W+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
}

// ============================================================================
// LIAISON PRINCIPALE
// ============================================================================

export interface LinkResult {
  risquesLinked: number;
  risquesSkipped: number;
  totalLinks: number;
}

/**
 * Lie automatiquement les risques aux actions par correspondance sémantique.
 * - Skip les risques qui ont déjà des actions liées (sauf forceUpdate)
 * - Skip les risques fermés
 * - Met à jour les deux côtés : risque.actions_liees + action.risques_associes
 * - Non-destructif : n'enlève jamais de liens existants
 */
export async function linkAllRisksToActions(
  options?: { forceUpdate?: boolean }
): Promise<LinkResult> {
  const result: LinkResult = { risquesLinked: 0, risquesSkipped: 0, totalLinks: 0 };

  const risques = await db.risques.toArray();
  const actions = await db.actions.toArray();

  if (actions.length === 0) return result;

  await withWriteContext({ source: 'system', description: 'Auto-liaison risques ↔ actions' }, async () => {
    for (const risque of risques) {
      if (!risque.id) continue;

      // Skip risques fermés
      if (risque.statut === 'ferme' || risque.status === 'closed' || risque.status === 'ferme') {
        result.risquesSkipped++;
        continue;
      }

      // Skip si déjà lié (sauf forceUpdate)
      if (risque.actions_liees?.length > 0 && !options?.forceUpdate) {
        result.risquesSkipped++;
        continue;
      }

      // Calculer les scores de matching
      const scores: MatchScore[] = [];
      for (const action of actions) {
        if (!action.id || !action.id_action) continue;
        const score = computeMatchScore(risque, action);
        if (score >= 40) {
          scores.push({ actionId: action.id_action, actionDbId: action.id, score });
        }
      }

      // Trier par score décroissant et limiter à 10
      scores.sort((a, b) => b.score - a.score);
      const topMatches = scores.slice(0, 10);

      if (topMatches.length === 0) {
        result.risquesSkipped++;
        continue;
      }

      // Fusionner avec les liens existants
      const existingLinks = new Set(risque.actions_liees || []);
      const newActionIds = topMatches.map(m => m.actionId);
      for (const id of newActionIds) {
        existingLinks.add(id);
      }

      // Mettre à jour le risque
      await db.risques.update(risque.id, {
        actions_liees: Array.from(existingLinks),
        derniere_modification: new Date().toISOString(),
        modifie_par: 'Système',
      });

      // Mettre à jour les actions (côté inverse)
      for (const match of topMatches) {
        const action = actions.find(a => a.id === match.actionDbId);
        if (!action || !action.id) continue;

        const existingRisques = new Set(action.risques_associes || []);
        if (!existingRisques.has(risque.id_risque)) {
          existingRisques.add(risque.id_risque);
          await db.actions.update(action.id, {
            risques_associes: Array.from(existingRisques),
          });
        }
      }

      result.risquesLinked++;
      result.totalLinks += topMatches.length;
    }
  });

  logger.info(`[RiskLinker] ${result.risquesLinked} risques liés, ${result.totalLinks} liens créés, ${result.risquesSkipped} skippés`);
  return result;
}
