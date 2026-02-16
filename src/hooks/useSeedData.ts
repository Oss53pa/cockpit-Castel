// ============================================================================
// HOOK POUR SEED DES DONNÉES V2.0
// ============================================================================

import { useState, useCallback } from 'react';
import { seedDatabaseV2, resetAndSeedDatabase, seedBudgetOnly, PROJECT_METADATA } from '@/data/seedDataV2';
import { logger } from '@/lib/logger';

interface SeedResult {
  usersCreated: number;
  jalonsCreated: number;
  actionsCreated: number;
  budgetCreated: number;
}

interface BudgetSeedResult {
  budgetCreated: number;
  budgetSkipped: number;
}

interface UseSeedDataReturn {
  isSeeding: boolean;
  error: string | null;
  result: SeedResult | null;
  budgetResult: BudgetSeedResult | null;
  seedData: (clearExisting?: boolean) => Promise<void>;
  resetAndSeed: () => Promise<void>;
  seedBudget: () => Promise<void>;
  projectMetadata: typeof PROJECT_METADATA;
}

export function useSeedData(): UseSeedDataReturn {
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [budgetResult, setBudgetResult] = useState<BudgetSeedResult | null>(null);

  const seedData = useCallback(async (clearExisting: boolean = false) => {
    setIsSeeding(true);
    setError(null);
    setResult(null);

    try {
      const seedResult = await seedDatabaseV2(clearExisting);
      setResult(seedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du seed');
      logger.error('Seed error:', err);
    } finally {
      setIsSeeding(false);
    }
  }, []);

  const resetAndSeed = useCallback(async () => {
    setIsSeeding(true);
    setError(null);
    setResult(null);

    try {
      const seedResult = await resetAndSeedDatabase();
      setResult(seedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du reset et seed');
      logger.error('Reset and seed error:', err);
    } finally {
      setIsSeeding(false);
    }
  }, []);

  const seedBudget = useCallback(async () => {
    setIsSeeding(true);
    setError(null);
    setBudgetResult(null);

    try {
      const budgetSeedResult = await seedBudgetOnly();
      setBudgetResult(budgetSeedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du seed budget');
      logger.error('Budget seed error:', err);
    } finally {
      setIsSeeding(false);
    }
  }, []);

  return {
    isSeeding,
    error,
    result,
    budgetResult,
    seedData,
    resetAndSeed,
    seedBudget,
    projectMetadata: PROJECT_METADATA,
  };
}

export default useSeedData;
