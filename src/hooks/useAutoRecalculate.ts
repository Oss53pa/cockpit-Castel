/**
 * Hook pour le recalcul automatique périodique des statuts et alertes
 * Exécute runDailyAutoCalculations au montage et toutes les heures
 * Nettoie également les doublons de budget au démarrage
 */

import { useEffect, useRef, useCallback } from 'react';
import { runDailyAutoCalculations } from '@/services/autoCalculationService';
import { cleanupAllBudgetDuplicates } from '@/hooks/useBudgetExploitation';
import { logger } from '@/lib/logger';

// Intervalle de recalcul: 1 heure
const RECALCULATION_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Hook pour activer le recalcul automatique des statuts.
 * À utiliser dans le composant racine de l'application (App.tsx).
 *
 * Fonctionnalités:
 * - Exécute le recalcul au montage de l'application
 * - Relance le recalcul toutes les heures
 * - Nettoie l'intervalle au démontage
 */
export function useAutoRecalculate(): void {
  const hasRunInitial = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Éviter les exécutions multiples en mode strict de React
    if (hasRunInitial.current) return;
    hasRunInitial.current = true;

    // Différer le recalcul pour ne pas bloquer le rendu initial
    timeoutRef.current = setTimeout(() => {
      logger.info('[useAutoRecalculate] Démarrage du recalcul automatique initial...');

      // Nettoyer les doublons de budget d'abord
      cleanupAllBudgetDuplicates()
        .then(({ totalRemoved }) => {
          if (totalRemoved > 0) {
            logger.info(`[useAutoRecalculate] ${totalRemoved} doublons de budget supprimés`);
          }
        })
        .catch((error) => {
          logger.error('[useAutoRecalculate] Erreur nettoyage doublons budget:', error);
        });

      // Puis exécuter le recalcul des statuts
      runDailyAutoCalculations()
        .then(({ actionsUpdated, jalonsUpdated }) => {
          if (actionsUpdated > 0 || jalonsUpdated > 0) {
            logger.info(
              `[useAutoRecalculate] Recalcul initial terminé: ${actionsUpdated} actions, ${jalonsUpdated} jalons mis à jour`
            );
          }
        })
        .catch((error) => {
          logger.error('[useAutoRecalculate] Erreur lors du recalcul initial:', error);
        });
    }, 2000); // Attendre 2 secondes après le montage

    // Configurer l'intervalle pour les recalculs périodiques
    intervalRef.current = setInterval(() => {
      logger.info('[useAutoRecalculate] Exécution du recalcul périodique...');
      runDailyAutoCalculations()
        .then(({ actionsUpdated, jalonsUpdated }) => {
          if (actionsUpdated > 0 || jalonsUpdated > 0) {
            logger.info(
              `[useAutoRecalculate] Recalcul périodique terminé: ${actionsUpdated} actions, ${jalonsUpdated} jalons`
            );
          }
        })
        .catch((error) => {
          logger.error('[useAutoRecalculate] Erreur lors du recalcul périodique:', error);
        });
    }, RECALCULATION_INTERVAL_MS);

    // Cleanup au démontage
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}

/**
 * Hook pour déclencher manuellement un recalcul.
 * Retourne une fonction stable qui peut être appelée pour forcer le recalcul.
 */
export function useManualRecalculate(): () => Promise<{ actionsUpdated: number; jalonsUpdated: number }> {
  return useCallback(async () => {
    logger.info('[useManualRecalculate] Déclenchement du recalcul manuel...');
    try {
      const result = await runDailyAutoCalculations();
      logger.info(
        `[useManualRecalculate] Recalcul terminé: ${result.actionsUpdated} actions, ${result.jalonsUpdated} jalons`
      );
      return result;
    } catch (error) {
      logger.error('[useManualRecalculate] Erreur:', error);
      return { actionsUpdated: 0, jalonsUpdated: 0 };
    }
  }, []);
}
