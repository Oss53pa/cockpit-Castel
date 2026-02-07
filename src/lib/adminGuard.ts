// ============================================================================
// ADMIN GUARD — Directive CRMC Règle 2 (Protection des données)
// Vérification double pour les opérations destructives
// ============================================================================

/**
 * Génère un code de confirmation aléatoire à 4 chiffres.
 */
function generateConfirmCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Requiert une double confirmation admin pour les opérations destructives.
 * 1. Affiche un avertissement avec description de l'action
 * 2. Demande de saisir un code aléatoire pour confirmer
 *
 * @returns true si l'admin confirme, false sinon
 */
export function requireAdminWithDoubleConfirm(
  actionLabel: string,
  warningMessage: string
): boolean {
  // Étape 1 : Premier confirm avec avertissement
  const step1 = window.confirm(
    `${warningMessage}\n\n` +
    `Action : ${actionLabel}\n\n` +
    'Voulez-vous continuer ?'
  );

  if (!step1) return false;

  // Étape 2 : Saisie du code de confirmation
  const code = generateConfirmCode();
  const userInput = window.prompt(
    `Pour confirmer "${actionLabel}", tapez le code suivant :\n\n` +
    `Code : ${code}\n\n` +
    '(Annuler pour abandonner)'
  );

  if (userInput !== code) {
    if (userInput !== null) {
      window.alert('Code incorrect. Opération annulée.');
    }
    return false;
  }

  return true;
}
