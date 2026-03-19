// ============================================================================
// MOTEUR D'ÉVALUATION AUTOMATIQUE DES RISQUES
// Évalue et matérialise les risques selon 6 règles métier
// ============================================================================

import { db } from '@/db';
import { withWriteContext } from '@/db/writeContext';
import { createAlerte } from '@/hooks/useAlertes';
import { DEFAULT_SEUILS_RISK_TRIGGER } from '@/data/constants';
import type { Risque, Action, Axe } from '@/types';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface RiskEvaluationResult {
  evaluated: number;
  materialized: number;
  alertsCreated: number;
  skipped: number;
}

interface SyncMetrics {
  avancementConstruction: number;
  avancementMobilisation: number;
  ecart: number;
}

// ============================================================================
// MÉTRIQUES SYNC (Construction vs Mobilisation)
// ============================================================================

async function computeSyncMetrics(): Promise<SyncMetrics> {
  const actions = await db.actions.toArray();

  const actionsConstruction = actions.filter(a => a.axe === 'axe7_construction');
  const avancementConstruction = actionsConstruction.length > 0
    ? actionsConstruction.reduce((sum, a) => sum + a.avancement, 0) / actionsConstruction.length
    : 0;

  const axesMobilisation: Axe[] = ['axe1_rh', 'axe2_commercial', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'];
  const actionsMobilisation = actions.filter(a => axesMobilisation.includes(a.axe));
  const avancementMobilisation = actionsMobilisation.length > 0
    ? actionsMobilisation.reduce((sum, a) => sum + a.avancement, 0) / actionsMobilisation.length
    : 0;

  return {
    avancementConstruction,
    avancementMobilisation,
    ecart: avancementMobilisation - avancementConstruction,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getLinkedActions(risque: Risque, allActions: Action[]): Action[] {
  if (!risque.actions_liees || risque.actions_liees.length === 0) return [];
  const linkedIds = new Set(risque.actions_liees);
  return allActions.filter(a => linkedIds.has(a.id_action));
}

function daysUntilSoftOpening(): number {
  const softOpening = new Date('2026-10-16');
  const now = new Date();
  return Math.ceil((softOpening.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(action: Action): boolean {
  if (!action.date_fin_prevue || action.statut === 'termine') return false;
  return new Date(action.date_fin_prevue) < new Date();
}

// ============================================================================
// RÈGLES D'ÉVALUATION
// ============================================================================

interface EvalResult {
  shouldMaterialize: boolean;
  newProbabilite: 1 | 2 | 3 | 4 | 5;
  reason: string;
}

function evaluateRule1_Commercial(
  risque: Risque,
  syncMetrics: SyncMetrics,
  seuils: typeof DEFAULT_SEUILS_RISK_TRIGGER
): EvalResult | null {
  if (risque.categorie !== 'commercial') return null;

  // Mobilisation < Construction - seuil → risque commercial matérialisé
  const gap = syncMetrics.avancementConstruction - syncMetrics.avancementMobilisation;
  if (gap > seuils.syncGapPercent) {
    return {
      shouldMaterialize: true,
      newProbabilite: gap > seuils.syncGapPercent * 2 ? 5 : 4,
      reason: `Mobilisation en retard de ${Math.round(gap)}% vs Construction (seuil: ${seuils.syncGapPercent}%)`,
    };
  }
  return null;
}

function evaluateRule2_TechniquePlanning(
  risque: Risque,
  syncMetrics: SyncMetrics,
  seuils: typeof DEFAULT_SEUILS_RISK_TRIGGER
): EvalResult | null {
  if (risque.categorie !== 'technique' && risque.categorie !== 'planning') return null;

  // Construction < Mobilisation - seuil → risque technique matérialisé
  const gap = syncMetrics.avancementMobilisation - syncMetrics.avancementConstruction;
  if (gap > seuils.syncGapPercent) {
    return {
      shouldMaterialize: true,
      newProbabilite: gap > seuils.syncGapPercent * 2 ? 5 : 4,
      reason: `Construction en retard de ${Math.round(gap)}% vs Mobilisation (seuil: ${seuils.syncGapPercent}%)`,
    };
  }
  return null;
}

function evaluateRule3_RH(
  risque: Risque,
  linkedActions: Action[],
  seuils: typeof DEFAULT_SEUILS_RISK_TRIGGER
): EvalResult | null {
  if (risque.categorie !== 'rh') return null;
  if (linkedActions.length === 0) return null;

  const avgProgress = linkedActions.reduce((sum, a) => sum + a.avancement, 0) / linkedActions.length;
  const daysLeft = daysUntilSoftOpening();

  if (avgProgress < seuils.progressMinPercent && daysLeft < seuils.daysRemainingRH) {
    return {
      shouldMaterialize: true,
      newProbabilite: daysLeft < 30 ? 5 : 4,
      reason: `Avancement actions RH: ${Math.round(avgProgress)}% (< ${seuils.progressMinPercent}%) à ${daysLeft}j du Soft Opening`,
    };
  }
  return null;
}

function evaluateRule4_Financier(
  risque: Risque,
  linkedActions: Action[],
  seuils: typeof DEFAULT_SEUILS_RISK_TRIGGER
): EvalResult | null {
  if (risque.categorie !== 'financier') return null;
  if (linkedActions.length === 0) return null;

  // Calculer le ratio budget consommé
  let totalPrevu = 0;
  let totalRealise = 0;
  for (const action of linkedActions) {
    totalPrevu += action.budget_prevu || 0;
    totalRealise += action.budget_realise || 0;
  }

  if (totalPrevu > 0) {
    const ratio = (totalRealise / totalPrevu) * 100;
    if (ratio > seuils.budgetMaxPercent) {
      return {
        shouldMaterialize: true,
        newProbabilite: ratio > seuils.budgetMaxPercent + 20 ? 5 : 4,
        reason: `Budget consommé: ${Math.round(ratio)}% (seuil: ${seuils.budgetMaxPercent}%)`,
      };
    }
  }
  return null;
}

function evaluateRule5_AllBlocked(
  risque: Risque,
  linkedActions: Action[],
  seuils: typeof DEFAULT_SEUILS_RISK_TRIGGER
): EvalResult | null {
  if (linkedActions.length === 0) return null;

  // Toutes les actions liées bloquées
  const allBlocked = linkedActions.every(a => a.statut === 'bloque');
  if (allBlocked) {
    return {
      shouldMaterialize: true,
      newProbabilite: 5,
      reason: `Toutes les ${linkedActions.length} actions liées sont bloquées`,
    };
  }

  // Avancement très faible avec peu de temps restant
  const avgProgress = linkedActions.reduce((sum, a) => sum + a.avancement, 0) / linkedActions.length;
  const daysLeft = daysUntilSoftOpening();

  if (avgProgress < seuils.genericProgressMin && daysLeft < seuils.daysRemainingGeneric) {
    return {
      shouldMaterialize: true,
      newProbabilite: daysLeft < 30 ? 5 : 4,
      reason: `Avancement actions: ${Math.round(avgProgress)}% (< ${seuils.genericProgressMin}%) à ${daysLeft}j du Soft Opening`,
    };
  }
  return null;
}

function evaluateRule6_MultipleOverdue(
  risque: Risque,
  linkedActions: Action[],
  seuils: typeof DEFAULT_SEUILS_RISK_TRIGGER
): EvalResult | null {
  if (linkedActions.length === 0) return null;

  const overdueActions = linkedActions.filter(a => isOverdue(a));
  if (overdueActions.length >= seuils.overdueActionsMin) {
    return {
      shouldMaterialize: true,
      newProbabilite: overdueActions.length >= 4 ? 5 : 4,
      reason: `${overdueActions.length} actions liées en retard (seuil: ${seuils.overdueActionsMin})`,
    };
  }
  return null;
}

// ============================================================================
// ÉVALUATION PRINCIPALE
// ============================================================================

/**
 * Évalue tous les risques non-fermés et matérialise ceux qui remplissent les conditions.
 * - Ne touche JAMAIS les risques fermés
 * - Met à jour probabilite_actuelle, score_actuel, statut
 * - Crée une alerte risque_critique pour chaque nouveau risque matérialisé
 * - Utilise withWriteContext({ source: 'system' }) pour l'audit
 */
export async function evaluateAllRisks(): Promise<RiskEvaluationResult> {
  const result: RiskEvaluationResult = { evaluated: 0, materialized: 0, alertsCreated: 0, skipped: 0 };

  const seuils = DEFAULT_SEUILS_RISK_TRIGGER;
  const risques = await db.risques.toArray();
  const actions = await db.actions.toArray();
  const syncMetrics = await computeSyncMetrics();

  await withWriteContext({ source: 'system', description: 'Évaluation automatique des risques' }, async () => {
    for (const risque of risques) {
      if (!risque.id) continue;

      // Ne jamais toucher les risques fermés
      if (risque.statut === 'ferme' || risque.status === 'closed' || risque.status === 'ferme') {
        result.skipped++;
        continue;
      }

      // Ne pas réévaluer les risques déjà matérialisés
      if (risque.statut === 'materialise') {
        result.skipped++;
        continue;
      }

      const linkedActions = getLinkedActions(risque, actions);

      // Appliquer les 6 règles (la première qui match gagne)
      const evalResult =
        evaluateRule1_Commercial(risque, syncMetrics, seuils) ??
        evaluateRule2_TechniquePlanning(risque, syncMetrics, seuils) ??
        evaluateRule3_RH(risque, linkedActions, seuils) ??
        evaluateRule4_Financier(risque, linkedActions, seuils) ??
        evaluateRule5_AllBlocked(risque, linkedActions, seuils) ??
        evaluateRule6_MultipleOverdue(risque, linkedActions, seuils);

      result.evaluated++;

      if (evalResult?.shouldMaterialize) {
        const newScore = evalResult.newProbabilite * risque.impact_actuel;
        const now = new Date().toISOString();

        // Mettre à jour le risque
        await db.risques.update(risque.id, {
          statut: 'materialise',
          probabilite_actuelle: evalResult.newProbabilite,
          score_actuel: newScore,
          score: newScore,
          probabilite: evalResult.newProbabilite,
          tendance_risque: 'augmentation',
          date_derniere_evaluation: now,
          derniere_modification: now,
          modifie_par: 'Système',
          historique: [
            ...(risque.historique || []),
            {
              date: now,
              probabilite: evalResult.newProbabilite,
              impact: risque.impact_actuel,
              score: newScore,
              commentaire: `[Auto] Matérialisé — ${evalResult.reason}`,
              auteur: 'Système',
            },
          ],
        });

        result.materialized++;

        // Créer une alerte si le score est critique
        if (newScore >= 12) {
          const existingAlert = await db.alertes
            .filter(a => a.type === 'risque_critique' && a.entiteId === risque.id && !a.traitee)
            .first();

          if (!existingAlert) {
            await createAlerte({
              type: 'risque_critique',
              titre: `Risque matérialisé : ${risque.titre}`,
              message: `Le risque "${risque.titre}" a été matérialisé automatiquement. ${evalResult.reason}`,
              criticite: 'critical',
              entiteType: 'risque',
              entiteId: risque.id,
              lu: false,
              traitee: false,
              emailEnvoye: false,
            });
            result.alertsCreated++;
          }
        }
      }
    }
  });

  if (result.materialized > 0) {
    logger.info(
      `[RiskEngine] ${result.evaluated} évalués, ${result.materialized} matérialisés, ${result.alertsCreated} alertes créées`
    );
  }

  return result;
}
