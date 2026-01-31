// ============================================================================
// SERVICE D'ALERTES EMAIL - Envoi automatique avec historique
// ============================================================================

import { db } from '@/db';
import type { Alerte, AlerteEmailHistorique, User } from '@/types';
import { getEmailConfig, sendEmail } from './emailService';

// ============================================================================
// TYPES
// ============================================================================

export interface AlerteEmailOptions {
  alerte: Alerte;
  destinataire: {
    email: string;
    nom: string;
  };
  type: 'initial' | 'relance' | 'escalade';
  lienAction?: string;
}

export interface AlerteEmailResult {
  success: boolean;
  historyId?: number;
  error?: string;
}

// ============================================================================
// TEMPLATES HTML
// ============================================================================

const CRITICITE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: '#22C55E', text: '#FFFFFF', label: 'Faible' },
  medium: { bg: '#3B82F6', text: '#FFFFFF', label: 'Moyenne' },
  high: { bg: '#F59E0B', text: '#000000', label: 'Haute' },
  critical: { bg: '#EF4444', text: '#FFFFFF', label: 'Critique' },
};

const TYPE_LABELS: Record<string, string> = {
  echeance_action: 'Échéance Action',
  jalon_approche: 'Jalon en Approche',
  action_bloquee: 'Action Bloquée',
  depassement_budget: 'Dépassement Budget',
  risque_critique: 'Risque Critique',
  desynchronisation_chantier_mobilisation: 'Désynchronisation',
};

function generateAlertEmailHtml(options: AlerteEmailOptions): string {
  const { alerte, destinataire, type, lienAction } = options;
  const criticiteConfig = CRITICITE_COLORS[alerte.criticite] || CRITICITE_COLORS.medium;
  const typeLabel = TYPE_LABELS[alerte.type] || alerte.type;

  const typePrefix = type === 'relance' ? '🔔 RELANCE - ' : type === 'escalade' ? '⚠️ ESCALADE - ' : '';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cockpit.cosmos-angre.com';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${typePrefix}Alerte Cockpit</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F3F4F6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%); padding: 30px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">🚨 COCKPIT ALERTE</h1>
        <p style="color: #94A3B8; margin: 10px 0 0 0; font-size: 14px;">COSMOS ANGRÉ - Système d'alertes automatiques</p>
      </td>
    </tr>

    <!-- Badge Criticité -->
    <tr>
      <td style="padding: 20px; text-align: center;">
        <span style="display: inline-block; background-color: ${criticiteConfig.bg}; color: ${criticiteConfig.text}; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase;">
          ${criticiteConfig.label}
        </span>
        ${type !== 'initial' ? `
        <span style="display: inline-block; background-color: #FEF3C7; color: #92400E; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-left: 10px;">
          ${type === 'relance' ? '🔔 RELANCE' : '⚠️ ESCALADE'}
        </span>
        ` : ''}
      </td>
    </tr>

    <!-- Salutation -->
    <tr>
      <td style="padding: 0 30px;">
        <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
          Bonjour <strong>${destinataire.nom}</strong>,
        </p>
        <p style="color: #6B7280; font-size: 14px; margin: 0 0 20px 0;">
          ${type === 'initial'
            ? 'Une nouvelle alerte requiert votre attention :'
            : type === 'relance'
              ? 'Cette alerte n\'a pas encore été traitée. Merci d\'y donner suite rapidement :'
              : 'Cette alerte critique nécessite une action immédiate :'
          }
        </p>
      </td>
    </tr>

    <!-- Contenu Alerte -->
    <tr>
      <td style="padding: 0 30px;">
        <table width="100%" style="background-color: #F9FAFB; border-radius: 12px; border-left: 4px solid ${criticiteConfig.bg};">
          <tr>
            <td style="padding: 20px;">
              <p style="color: #6B7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">
                ${typeLabel}
              </p>
              <h2 style="color: #111827; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">
                ${alerte.titre}
              </h2>
              <p style="color: #4B5563; font-size: 14px; margin: 0; line-height: 1.6;">
                ${alerte.message}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Informations -->
    <tr>
      <td style="padding: 20px 30px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding: 10px; background-color: #F3F4F6; border-radius: 8px;">
              <p style="color: #6B7280; font-size: 12px; margin: 0;">Type d'entité</p>
              <p style="color: #111827; font-size: 14px; margin: 5px 0 0 0; font-weight: 600; text-transform: capitalize;">
                ${alerte.entiteType}
              </p>
            </td>
            <td width="10px"></td>
            <td width="50%" style="padding: 10px; background-color: #F3F4F6; border-radius: 8px;">
              <p style="color: #6B7280; font-size: 12px; margin: 0;">Date de création</p>
              <p style="color: #111827; font-size: 14px; margin: 5px 0 0 0; font-weight: 600;">
                ${new Date(alerte.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Bouton Action -->
    <tr>
      <td style="padding: 10px 30px 30px 30px; text-align: center;">
        <a href="${lienAction || `${baseUrl}/alertes`}"
           style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #FFFFFF; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Voir et traiter l'alerte →
        </a>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="padding: 0 30px;">
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 0;">
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 30px; text-align: center;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 10px 0;">
          Cet email a été envoyé automatiquement par le Cockpit COSMOS ANGRÉ.
        </p>
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          Pour désactiver ces notifications, rendez-vous dans les paramètres du Cockpit.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Envoie un email d'alerte et enregistre dans l'historique
 */
export async function sendAlerteEmail(options: AlerteEmailOptions): Promise<AlerteEmailResult> {
  const { alerte, destinataire, type } = options;

  try {
    // Vérifier la configuration email
    const emailConfig = await getEmailConfig();
    if (!emailConfig) {
      return { success: false, error: 'Configuration email non définie' };
    }

    // Générer le contenu HTML
    const contenuHtml = generateAlertEmailHtml(options);
    const criticiteConfig = CRITICITE_COLORS[alerte.criticite] || CRITICITE_COLORS.medium;
    const typePrefix = type === 'relance' ? '🔔 RELANCE - ' : type === 'escalade' ? '⚠️ ESCALADE - ' : '';
    const sujet = `${typePrefix}[${criticiteConfig.label.toUpperCase()}] ${alerte.titre}`;

    // Envoyer l'email
    const result = await sendEmail({
      to: destinataire.email,
      subject: sujet,
      html: contenuHtml,
    });

    // Enregistrer dans l'historique
    const historyEntry: Omit<AlerteEmailHistorique, 'id'> = {
      alerteId: alerte.id!,
      type,
      destinataireEmail: destinataire.email,
      destinataireNom: destinataire.nom,
      sujet,
      contenuHtml,
      envoyeAt: new Date().toISOString(),
      statut: result.success ? 'envoye' : 'echec',
      erreur: result.error,
    };

    const historyId = await db.alerteEmailHistorique.add(historyEntry);

    // Mettre à jour l'alerte
    if (result.success && alerte.id) {
      const updates: Partial<Alerte> = {
        emailEnvoye: true,
        emailEnvoyeAt: new Date().toISOString(),
      };

      if (type === 'relance') {
        updates.emailRelanceCount = (alerte.emailRelanceCount || 0) + 1;
        updates.dernierRelanceAt = new Date().toISOString();
      }

      await db.alertes.update(alerte.id, updates);
    }

    return { success: result.success, historyId, error: result.error };
  } catch (error) {
    console.error('Erreur envoi email alerte:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Récupère le responsable d'une alerte selon le type d'entité
 */
export async function getAlerteResponsable(alerte: Alerte): Promise<User | null> {
  try {
    let responsableId: number | undefined;

    switch (alerte.entiteType) {
      case 'action':
        const action = await db.actions.get(alerte.entiteId);
        responsableId = action?.responsableId;
        break;
      case 'jalon':
        const jalon = await db.jalons.get(alerte.entiteId);
        responsableId = jalon?.responsableId;
        break;
      case 'risque':
        const risque = await db.risques.get(alerte.entiteId);
        responsableId = risque?.responsableId;
        break;
      case 'budget':
        // Budget n'a pas de responsable direct, utiliser le premier admin
        const admins = await db.users.where('role').equals('admin').toArray();
        return admins[0] || null;
    }

    if (responsableId) {
      return await db.users.get(responsableId) || null;
    }

    return null;
  } catch (error) {
    console.error('Erreur récupération responsable:', error);
    return null;
  }
}

/**
 * Envoie automatiquement les alertes non envoyées aux responsables
 */
export async function envoyerAlertesAutomatiques(): Promise<{ envoyees: number; erreurs: number }> {
  let envoyees = 0;
  let erreurs = 0;

  try {
    // Récupérer les alertes non traitées et non envoyées
    const alertes = await db.alertes
      .filter(a => !a.traitee && !a.emailEnvoye)
      .toArray();

    for (const alerte of alertes) {
      // Récupérer le responsable
      const responsable = await getAlerteResponsable(alerte);

      if (responsable && responsable.email) {
        // Mettre à jour l'alerte avec le responsable
        await db.alertes.update(alerte.id!, {
          responsableId: responsable.id,
          responsableNom: `${responsable.prenom} ${responsable.nom}`,
          responsableEmail: responsable.email,
        });

        // Envoyer l'email
        const result = await sendAlerteEmail({
          alerte: { ...alerte, responsableId: responsable.id },
          destinataire: {
            email: responsable.email,
            nom: `${responsable.prenom} ${responsable.nom}`,
          },
          type: 'initial',
        });

        if (result.success) {
          envoyees++;
        } else {
          erreurs++;
        }
      }
    }
  } catch (error) {
    console.error('Erreur envoi alertes automatiques:', error);
  }

  return { envoyees, erreurs };
}

/**
 * Envoie des relances pour les alertes non traitées après X jours
 */
export async function envoyerRelances(joursDepuisCreation: number = 3): Promise<{ envoyees: number; erreurs: number }> {
  let envoyees = 0;
  let erreurs = 0;

  try {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - joursDepuisCreation);

    // Alertes non traitées, email envoyé, créées il y a plus de X jours
    const alertes = await db.alertes
      .filter(a =>
        !a.traitee &&
        a.emailEnvoye &&
        new Date(a.createdAt) < dateLimit &&
        (a.emailRelanceCount || 0) < 3 // Max 3 relances
      )
      .toArray();

    for (const alerte of alertes) {
      if (alerte.responsableEmail) {
        const result = await sendAlerteEmail({
          alerte,
          destinataire: {
            email: alerte.responsableEmail,
            nom: alerte.responsableNom || 'Responsable',
          },
          type: 'relance',
        });

        if (result.success) {
          envoyees++;
        } else {
          erreurs++;
        }
      }
    }
  } catch (error) {
    console.error('Erreur envoi relances:', error);
  }

  return { envoyees, erreurs };
}

/**
 * Récupère l'historique des emails pour une alerte
 */
export async function getAlerteEmailHistorique(alerteId: number): Promise<AlerteEmailHistorique[]> {
  return await db.alerteEmailHistorique
    .where('alerteId')
    .equals(alerteId)
    .reverse()
    .sortBy('envoyeAt');
}

/**
 * Récupère tout l'historique des emails d'alertes
 */
export async function getAllAlerteEmailHistorique(limit: number = 100): Promise<AlerteEmailHistorique[]> {
  return await db.alerteEmailHistorique
    .orderBy('envoyeAt')
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Marque une alerte comme traitée et met à jour le statut automatiquement
 */
export async function traiterAlerte(
  alerteId: number,
  traiteeParId: number,
  traiteeParNom: string
): Promise<void> {
  await db.alertes.update(alerteId, {
    traitee: true,
    traiteeAt: new Date().toISOString(),
    traiteeParId,
    traiteeParNom,
  });

  // Enregistrer dans l'historique
  await db.historique.add({
    timestamp: new Date().toISOString(),
    entiteType: 'alerte',
    entiteId: alerteId,
    champModifie: 'traitee',
    ancienneValeur: 'false',
    nouvelleValeur: 'true',
    auteurId: traiteeParId,
  });
}

/**
 * Met à jour le statut d'ouverture d'un email (tracking)
 */
export async function markEmailOuvert(historyId: number): Promise<void> {
  await db.alerteEmailHistorique.update(historyId, {
    statut: 'ouvert',
    ouvertAt: new Date().toISOString(),
  });
}

/**
 * Met à jour le statut de clic d'un email (tracking)
 */
export async function markEmailClique(historyId: number): Promise<void> {
  await db.alerteEmailHistorique.update(historyId, {
    statut: 'clique',
    cliqueAt: new Date().toISOString(),
  });
}

// ============================================================================
// FONCTIONS WRAPPER SIMPLIFIÉES (pour useAlertes.ts)
// ============================================================================

/**
 * Envoie un email pour une alerte (wrapper simplifié)
 */
export async function sendAlerteEmailSimple(
  alerte: Alerte,
  type: 'initial' | 'relance' | 'escalade' = 'initial'
): Promise<boolean> {
  if (!alerte.responsableEmail || !alerte.responsableNom) {
    console.warn('Alerte sans responsable email/nom:', alerte.id);
    return false;
  }

  const result = await sendAlerteEmail({
    alerte,
    destinataire: {
      email: alerte.responsableEmail,
      nom: alerte.responsableNom,
    },
    type,
  });

  return result.success;
}

/**
 * Récupère les infos du responsable d'une entité (wrapper simplifié)
 */
export async function getAlerteResponsableByEntity(
  entiteType: 'action' | 'jalon' | 'risque' | 'budget',
  entiteId: number
): Promise<{ responsableId: number; responsableNom: string; responsableEmail: string } | null> {
  try {
    let responsableId: number | undefined;

    switch (entiteType) {
      case 'action':
        const action = await db.actions.get(entiteId);
        responsableId = action?.responsableId;
        break;
      case 'jalon':
        const jalon = await db.jalons.get(entiteId);
        responsableId = jalon?.responsableId;
        break;
      case 'risque':
        const risque = await db.risques.get(entiteId);
        responsableId = risque?.responsableId;
        break;
      case 'budget':
        // Budget n'a pas de responsable direct, utiliser le premier admin
        const admins = await db.users.where('role').equals('admin').toArray();
        const admin = admins[0];
        if (admin && admin.id && admin.email) {
          return {
            responsableId: admin.id,
            responsableNom: `${admin.prenom} ${admin.nom}`,
            responsableEmail: admin.email,
          };
        }
        return null;
    }

    if (responsableId) {
      const user = await db.users.get(responsableId);
      if (user && user.id && user.email) {
        return {
          responsableId: user.id,
          responsableNom: `${user.prenom} ${user.nom}`,
          responsableEmail: user.email,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Erreur récupération responsable par entité:', error);
    return null;
  }
}
