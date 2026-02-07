// ============================================================================
// WRITE CONTEXT — Directive CRMC Règle 3 (Traçabilité)
// Pile de contexte pour identifier la source de chaque écriture DB
// ============================================================================

export type WriteSource = 'user' | 'auto-calc' | 'sync-firebase' | 'import' | 'migration' | 'seed' | 'system';

export interface WriteContext {
  source: WriteSource;
  auteurId?: number;
  description?: string;
}

// Pile de contextes (supporte les appels imbriqués)
const contextStack: WriteContext[] = [];

/**
 * Exécute une fonction dans un contexte d'écriture identifié.
 * Le middleware Dexie lit ce contexte pour taguer les entrées d'historique.
 */
export async function withWriteContext<T>(
  ctx: WriteContext,
  fn: () => Promise<T>
): Promise<T> {
  contextStack.push(ctx);
  try {
    return await fn();
  } finally {
    contextStack.pop();
  }
}

/**
 * Retourne le contexte d'écriture actuel (le plus récent dans la pile).
 * Retourne undefined si aucun contexte n'est défini.
 */
export function getCurrentWriteContext(): WriteContext | undefined {
  return contextStack.length > 0 ? contextStack[contextStack.length - 1] : undefined;
}
