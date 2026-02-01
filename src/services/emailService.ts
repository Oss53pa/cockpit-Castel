/**
 * Email Service - Gestion des emails de relance et liens de mise à jour
 *
 * Fonctionnalités:
 * - Génération de tokens sécurisés
 * - Gestion des liens de mise à jour avec expiration
 * - Configuration email (SMTP ou API)
 * - Templates d'emails HTML
 * - Notifications
 */

import { db, type UpdateLink, type EmailNotification, type EmailTemplate } from '@/db';
import type { Action, Jalon, Risque } from '@/types';
import emailjs from '@emailjs/browser';
import {
  isFirebaseConfigured,
  getFirebaseConfig,
} from './firebaseConfigService';
import {
  createUpdateLinkInFirebase as createRealtimeLink,
  getUpdateLinkFromFirebase,
  markLinkAccessedInFirebase,
} from './firebaseRealtimeSync';

// ============================================
// TYPES
// ============================================

export interface EmailConfig {
  provider: 'smtp' | 'emailjs' | 'simulation';
  // SMTP Settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  // API Settings
  apiKey?: string;
  apiEndpoint?: string;
  // EmailJS Settings (client-side email - pas besoin de backend!)
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
  // Common
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  // Link Settings
  defaultLinkDuration: number; // en heures
  baseUrl: string;
}

export interface SendEmailParams {
  to: string;
  toName: string;
  subject: string;
  html: string;
  entityType: 'action' | 'jalon' | 'risque';
  entityId: number;
}

export interface SentEmail extends SendEmailParams {
  id: number;
  from: string;
  fromName: string;
  sentAt: string;
}

const CONFIG_KEY = 'email_config';
const SECURE_CONFIG_KEY = 'email_secure_config';

// Lecture des variables d'environnement EmailJS
const ENV_EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const ENV_EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const ENV_EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
const EMAILJS_ENV_CONFIGURED = !!(ENV_EMAILJS_SERVICE_ID && ENV_EMAILJS_TEMPLATE_ID && ENV_EMAILJS_PUBLIC_KEY);

const DEFAULT_CONFIG: EmailConfig = {
  provider: EMAILJS_ENV_CONFIGURED ? 'emailjs' : 'simulation',
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  // EmailJS auto-configuré depuis les variables d'environnement
  emailjsServiceId: ENV_EMAILJS_SERVICE_ID,
  emailjsTemplateId: ENV_EMAILJS_TEMPLATE_ID,
  emailjsPublicKey: ENV_EMAILJS_PUBLIC_KEY,
  fromEmail: 'patokouna@cosmos-angre.com',
  fromName: 'Cockpit-Cosmos Angré',
  defaultLinkDuration: 72, // 3 jours
  baseUrl: window.location.origin,
};

// Cache en memoire pour eviter les appels repetes a IndexedDB
let configCache: EmailConfig | null = null;

// ============================================
// CONFIGURATION (Stockage securise IndexedDB)
// ============================================

/**
 * Recuperer la configuration email depuis IndexedDB (donnees sensibles)
 * avec fallback vers localStorage pour la migration
 */
export function getEmailConfig(): EmailConfig {
  // Retourner le cache si disponible
  if (configCache) {
    return configCache;
  }

  try {
    // Essayer d'abord IndexedDB (nouveau stockage securise)
    // Note: Version synchrone pour compatibilite, la version async est preferee
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      configCache = { ...DEFAULT_CONFIG, ...parsed };
      // Les variables d'environnement EmailJS prennent le dessus
      if (EMAILJS_ENV_CONFIGURED) {
        configCache.provider = 'emailjs';
        configCache.emailjsServiceId = ENV_EMAILJS_SERVICE_ID;
        configCache.emailjsTemplateId = ENV_EMAILJS_TEMPLATE_ID;
        configCache.emailjsPublicKey = ENV_EMAILJS_PUBLIC_KEY;
      }
      return configCache;
    }
  } catch (e) {
    console.error('Error loading email config:', e);
  }
  return DEFAULT_CONFIG;
}

/**
 * Recuperer la configuration email de maniere asynchrone (recommande)
 * Utilise IndexedDB pour les donnees sensibles
 */
export async function getEmailConfigAsync(): Promise<EmailConfig> {
  try {
    // Recuperer les donnees non-sensibles
    const nonSensitive = await db.secureConfigs.where('key').equals(CONFIG_KEY).first();
    const config = nonSensitive ? JSON.parse(nonSensitive.value) : { ...DEFAULT_CONFIG };

    // Recuperer les donnees sensibles (mot de passe SMTP, cle API)
    const sensitiveConfig = await db.secureConfigs.where('key').equals(SECURE_CONFIG_KEY).first();
    if (sensitiveConfig) {
      const sensitive = JSON.parse(sensitiveConfig.value);
      config.smtpPassword = sensitive.smtpPassword;
      config.apiKey = sensitive.apiKey;
    }

    configCache = { ...DEFAULT_CONFIG, ...config };
    // Les variables d'environnement EmailJS prennent le dessus
    if (EMAILJS_ENV_CONFIGURED) {
      configCache.provider = 'emailjs';
      configCache.emailjsServiceId = ENV_EMAILJS_SERVICE_ID;
      configCache.emailjsTemplateId = ENV_EMAILJS_TEMPLATE_ID;
      configCache.emailjsPublicKey = ENV_EMAILJS_PUBLIC_KEY;
    }
    return configCache;
  } catch (e) {
    console.error('Error loading email config from IndexedDB:', e);
    // Fallback vers localStorage pour migration
    return getEmailConfig();
  }
}

/**
 * Sauvegarder la configuration email de maniere securisee
 * Les donnees sensibles sont stockees separement dans IndexedDB
 */
export async function saveEmailConfigAsync(config: Partial<EmailConfig>): Promise<void> {
  try {
    const current = await getEmailConfigAsync();
    const updated = { ...current, ...config };

    // Separer les donnees sensibles des donnees non-sensibles
    const { smtpPassword, apiKey, ...nonSensitive } = updated;
    const sensitive = { smtpPassword, apiKey };

    const now = new Date().toISOString();

    // Sauvegarder les donnees non-sensibles
    const existingConfig = await db.secureConfigs.where('key').equals(CONFIG_KEY).first();
    if (existingConfig) {
      await db.secureConfigs.update(existingConfig.id!, {
        value: JSON.stringify(nonSensitive),
        updatedAt: now,
      });
    } else {
      await db.secureConfigs.add({
        key: CONFIG_KEY,
        value: JSON.stringify(nonSensitive),
        isEncrypted: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Sauvegarder les donnees sensibles (dans une entree separee)
    const existingSensitive = await db.secureConfigs.where('key').equals(SECURE_CONFIG_KEY).first();
    if (existingSensitive) {
      await db.secureConfigs.update(existingSensitive.id!, {
        value: JSON.stringify(sensitive),
        isEncrypted: true,
        updatedAt: now,
      });
    } else {
      await db.secureConfigs.add({
        key: SECURE_CONFIG_KEY,
        value: JSON.stringify(sensitive),
        isEncrypted: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Mettre a jour le cache
    configCache = updated;

    // Supprimer l'ancienne config localStorage si elle existe (migration)
    localStorage.removeItem(CONFIG_KEY);
  } catch (e) {
    console.error('Error saving email config to IndexedDB:', e);
    throw e;
  }
}

/**
 * Sauvegarder la configuration email (version synchrone pour compatibilite)
 * @deprecated Utiliser saveEmailConfigAsync pour les nouvelles implementations
 */
export function saveEmailConfig(config: Partial<EmailConfig>): void {
  // Lancer la sauvegarde async en arriere-plan
  saveEmailConfigAsync(config).catch(console.error);

  // Mettre a jour le cache immediatement pour la reactivite UI
  const current = getEmailConfig();
  configCache = { ...current, ...config };
}

export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  if (!config.fromEmail) return false;

  switch (config.provider) {
    case 'smtp':
      return !!(config.smtpHost && config.smtpUser && config.smtpPassword);
    case 'emailjs':
      return !!(config.emailjsServiceId && config.emailjsTemplateId && config.emailjsPublicKey);
    case 'simulation':
      return false; // Mode simulation = pas configuré
    default:
      return !!config.apiKey;
  }
}

/**
 * Migrer la configuration de localStorage vers IndexedDB
 * A appeler au demarrage de l'application
 */
export async function migrateEmailConfig(): Promise<boolean> {
  try {
    const oldConfig = localStorage.getItem(CONFIG_KEY);
    if (oldConfig) {
      const parsed = JSON.parse(oldConfig);
      await saveEmailConfigAsync(parsed);
      console.info('Configuration email migree vers IndexedDB');
      return true;
    }
  } catch (e) {
    console.error('Erreur migration config email:', e);
  }
  return false;
}

// ============================================
// TOKEN GENERATION
// ============================================

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  let token = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    token += chars[array[i] % chars.length];
  }
  return token;
}

// ============================================
// UPDATE LINKS
// ============================================

export async function createUpdateLink(
  entityType: 'action' | 'jalon' | 'risque',
  entityId: number,
  recipientEmail: string,
  recipientName: string,
  durationHours?: number,
  entity?: Action | Jalon | Risque
): Promise<UpdateLink> {
  const config = getEmailConfig();
  const duration = durationHours || config.defaultLinkDuration;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000);

  const link: UpdateLink = {
    token: generateToken(),
    entityType,
    entityId,
    recipientEmail,
    recipientName,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isUsed: false,
    isExpired: false,
  };

  // Sauvegarder localement (IndexedDB) pour compatibilité
  const id = await db.updateLinks.add(link);

  // Sauvegarder dans Firebase si configuré (pour synchronisation temps réel)
  const firebaseConfig = getFirebaseConfig();
  if (firebaseConfig.enabled && isFirebaseConfigured() && entity) {
    try {
      await createRealtimeLink(
        link.token,
        entityType,
        entityId,
        entity,
        recipientEmail,
        recipientName,
        expiresAt.toISOString()
      );
      console.log('Lien sauvegardé dans Firebase (temps réel):', link.token);
    } catch (error) {
      console.error('Erreur Firebase (fallback sur IndexedDB):', error);
    }
  }

  return { ...link, id };
}

export async function getUpdateLink(token: string): Promise<(UpdateLink & { entityData?: any }) | null> {
  // D'abord essayer IndexedDB local
  const localLink = await db.updateLinks.where('token').equals(token).first();

  if (localLink) {
    // Check if expired
    if (new Date(localLink.expiresAt) < new Date()) {
      if (!localLink.isExpired) {
        await db.updateLinks.update(localLink.id!, { isExpired: true });
        await createNotification({
          type: 'link_expired',
          linkId: localLink.id!,
          entityType: localLink.entityType,
          entityId: localLink.entityId,
          recipientEmail: localLink.recipientEmail,
          recipientName: localLink.recipientName,
          message: `Le lien pour ${localLink.recipientName} a expiré`,
        });
      }
      return { ...localLink, isExpired: true };
    }
    return localLink;
  }

  // Si pas trouvé localement, essayer Firebase (pour les appareils externes)
  const firebaseConfig = getFirebaseConfig();
  if (firebaseConfig.enabled && isFirebaseConfigured()) {
    try {
      const firebaseLink = await getUpdateLinkFromFirebase(token);
      if (firebaseLink) {
        // Convertir le format Firebase vers le format UpdateLink
        return {
          id: 0, // ID virtuel pour les liens Firebase
          token: firebaseLink.token,
          entityType: firebaseLink.entityType,
          entityId: firebaseLink.entityId,
          recipientEmail: firebaseLink.recipientEmail,
          recipientName: firebaseLink.recipientName,
          createdAt: firebaseLink.createdAt,
          expiresAt: firebaseLink.expiresAt,
          isUsed: firebaseLink.isUsed,
          isExpired: firebaseLink.isExpired,
          accessedAt: firebaseLink.accessedAt,
          // Inclure les données de l'entité pour affichage
          entityData: firebaseLink.entitySnapshot ? {
            titre: firebaseLink.entitySnapshot.titre,
            statut: firebaseLink.entitySnapshot.statut,
            avancement: firebaseLink.entitySnapshot.avancement,
            date_prevue: firebaseLink.entitySnapshot.date_prevue,
            date_fin_prevue: firebaseLink.entitySnapshot.date_fin_prevue,
            probabilite: firebaseLink.entitySnapshot.probabilite,
            impact: firebaseLink.entitySnapshot.impact,
            score: firebaseLink.entitySnapshot.score,
          } : undefined,
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du lien depuis Firebase:', error);
    }
  }

  return null;
}

export async function markLinkAccessed(token: string): Promise<void> {
  // Mettre à jour dans IndexedDB local
  const link = await db.updateLinks.where('token').equals(token).first();
  if (link && !link.accessedAt) {
    await db.updateLinks.update(link.id!, {
      accessedAt: new Date().toISOString()
    });
    await createNotification({
      type: 'link_opened',
      linkId: link.id!,
      entityType: link.entityType,
      entityId: link.entityId,
      recipientEmail: link.recipientEmail,
      recipientName: link.recipientName,
      message: `${link.recipientName} a ouvert le lien de mise à jour`,
    });
  }

  // Aussi marquer comme accédé dans Firebase
  const firebaseConfig = getFirebaseConfig();
  if (firebaseConfig.enabled && isFirebaseConfigured()) {
    try {
      await markLinkAccessedInFirebase(token);
    } catch (error) {
      console.error('Erreur Firebase markLinkAccessed:', error);
    }
  }
}

export async function markLinkUpdated(token: string): Promise<void> {
  // Mettre à jour dans IndexedDB local
  const link = await db.updateLinks.where('token').equals(token).first();
  if (link) {
    await db.updateLinks.update(link.id!, {
      updatedAt: new Date().toISOString(),
      isUsed: true,
    });
    await createNotification({
      type: 'update_made',
      linkId: link.id!,
      entityType: link.entityType,
      entityId: link.entityId,
      recipientEmail: link.recipientEmail,
      recipientName: link.recipientName,
      message: `${link.recipientName} a effectué une mise à jour`,
    });
  }
}

export async function getAllUpdateLinks(): Promise<UpdateLink[]> {
  return db.updateLinks.orderBy('createdAt').reverse().toArray();
}

export async function deleteUpdateLink(id: number): Promise<void> {
  await db.updateLinks.delete(id);
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function createNotification(params: Omit<EmailNotification, 'id' | 'isRead' | 'createdAt'>): Promise<EmailNotification> {
  const notification: EmailNotification = {
    ...params,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const id = await db.emailNotifications.add(notification);
  return { ...notification, id };
}

export async function getNotifications(unreadOnly = false): Promise<EmailNotification[]> {
  const query = db.emailNotifications.orderBy('createdAt').reverse();
  if (unreadOnly) {
    return (await query.toArray()).filter(n => !n.isRead);
  }
  return query.toArray();
}

export async function markNotificationRead(id: number): Promise<void> {
  await db.emailNotifications.update(id, { isRead: true });
}

export async function markAllNotificationsRead(): Promise<void> {
  await db.emailNotifications.toCollection().modify({ isRead: true });
}

export async function deleteNotification(id: number): Promise<void> {
  await db.emailNotifications.delete(id);
}

export async function getUnreadCount(): Promise<number> {
  return db.emailNotifications.where('isRead').equals(0).count();
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id'>[] = [
  {
    name: 'Partage Rapport HTML',
    subject: '[COSMOS ANGRE] Rapport de projet - {{rapport_periode}}',
    entityType: 'rapport',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Grand+Hotel&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Exo 2', system-ui, sans-serif; line-height: 1.6; color: #27272a; background-color: #f0f9ff; }
    .wrapper { max-width: 640px; margin: 0 auto; padding: 40px 20px; }
    .container { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%); color: white; padding: 40px 30px; text-align: center; }
    .header-logo { font-family: 'Grand Hotel', cursive; font-size: 42px; color: #ffffff; margin-bottom: 8px; letter-spacing: 1px; }
    .header-subtitle { font-size: 14px; color: #7dd3fc; text-transform: uppercase; letter-spacing: 3px; font-weight: 500; }
    .header-period { margin-top: 16px; padding: 8px 20px; background: rgba(255,255,255,0.15); border-radius: 20px; display: inline-block; font-size: 14px; font-weight: 500; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #18181b; margin-bottom: 20px; }
    .greeting strong { color: #18181b; font-weight: 600; }
    .intro-text { color: #52525b; margin-bottom: 24px; font-size: 15px; }
    .report-summary { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #0284c7; }
    .report-summary-title { font-size: 16px; font-weight: 600; color: #0c4a6e; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .report-summary-title::before { content: ""; font-size: 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .summary-item { background: #ffffff; padding: 16px; border-radius: 10px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary-value { font-size: 28px; font-weight: 700; color: #0369a1; }
    .summary-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    .report-contents { margin-top: 20px; }
    .report-contents-title { font-size: 14px; font-weight: 600; color: #0c4a6e; margin-bottom: 12px; }
    .report-contents-list { list-style: none; }
    .report-contents-list li { padding: 8px 0; border-bottom: 1px solid #e0f2fe; display: flex; align-items: center; gap: 8px; color: #334155; font-size: 14px; }
    .report-contents-list li::before { content: ""; color: #0284c7; }
    .report-contents-list li:last-child { border-bottom: none; }
    .cta-section { text-align: center; padding: 30px 0; }
    .cta-text { color: #52525b; margin-bottom: 20px; font-size: 15px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: #ffffff !important; padding: 18px 50px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 14px 0 rgba(2, 132, 199, 0.39); }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px 0 rgba(2, 132, 199, 0.5); }
    .btn-icon { margin-right: 8px; }
    .info-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 16px 20px; border-radius: 10px; margin: 24px 0; border-left: 4px solid #22c55e; display: flex; align-items: flex-start; gap: 12px; }
    .info-icon { font-size: 20px; flex-shrink: 0; }
    .info-text { color: #166534; font-size: 14px; }
    .signature { margin-top: 30px; padding-top: 24px; border-top: 1px solid #e0f2fe; }
    .signature-text { color: #52525b; font-size: 15px; margin-bottom: 8px; }
    .signature-name { font-weight: 600; color: #18181b; font-size: 15px; }
    .contact-info { margin-top: 16px; padding: 16px; background: #f0f9ff; border-radius: 8px; }
    .contact-label { font-size: 12px; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .contact-name { font-weight: 600; color: #0c4a6e; font-size: 15px; }
    .contact-role { color: #0369a1; font-size: 13px; }
    .footer { background: #0c4a6e; padding: 30px; text-align: center; }
    .footer-text { color: #7dd3fc; font-size: 12px; margin-bottom: 8px; }
    .footer-note { color: #38bdf8; font-size: 11px; font-style: italic; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">Cockpit</div>
        <div class="header-subtitle">COSMOS ANGRE</div>
        <div class="header-period">{{rapport_periode}}</div>
      </div>
      <div class="content">
        <p class="greeting">Bonjour <strong>{{recipient_name}}</strong>,</p>

        <p class="intro-text">{{sender_name}} vous partage le rapport de suivi du projet COSMOS ANGRE. Ce rapport couvre la periode <strong>{{rapport_periode}}</strong>.</p>

        <div class="report-summary">
          <div class="report-summary-title">Resume du rapport</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">{{total_actions}}</div>
              <div class="summary-label">Actions</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">{{total_jalons}}</div>
              <div class="summary-label">Jalons</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">{{total_risques}}</div>
              <div class="summary-label">Risques</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">{{avancement_global}}%</div>
              <div class="summary-label">Avancement</div>
            </div>
          </div>
          <div class="report-contents">
            <div class="report-contents-title">Contenu du rapport :</div>
            <ul class="report-contents-list">
              <li>Tableau de bord et indicateurs cles</li>
              <li>Liste des actions avec statuts</li>
              <li>Calendrier des jalons</li>
              <li>Registre des risques</li>
              <li>Graphiques d'avancement</li>
            </ul>
          </div>
        </div>

        <div class="cta-section">
          <p class="cta-text">Cliquez sur le bouton ci-dessous pour consulter le rapport complet :</p>
          <a href="{{report_link}}" class="btn"><span class="btn-icon"></span>Voir le rapport</a>
        </div>

        <div class="info-box">
          <span class="info-icon"></span>
          <span class="info-text">Ce rapport est genere automatiquement par le Cockpit et reflete l'etat du projet a la date d'envoi.</span>
        </div>

        <div class="signature">
          <p class="signature-text">Si vous avez des questions, n'hesitez pas a nous contacter.</p>
          <p class="signature-text">Cordialement,</p>
          <p class="signature-name">{{sender_name}}</p>

          <div class="contact-info">
            <div class="contact-label">Votre contact</div>
            <div class="contact-name">Pamela ATOKOUNA</div>
            <div class="contact-role">Coordinatrice de projet</div>
          </div>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">Ce message a ete envoye automatiquement par le Cockpit COSMOS ANGRE.</p>
        <p class="footer-note">Merci de ne pas repondre directement a cet email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  },
  {
    name: 'Relance Action',
    subject: '[COSMOS ANGRE] Mise à jour requise - Action: {{action_titre}}',
    entityType: 'action',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Grand+Hotel&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Exo 2', system-ui, sans-serif; line-height: 1.6; color: #27272a; background-color: #f4f4f5; }
    .wrapper { max-width: 640px; margin: 0 auto; padding: 40px 20px; }
    .container { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%); color: white; padding: 40px 30px; text-align: center; }
    .header-logo { font-family: 'Grand Hotel', cursive; font-size: 42px; color: #ffffff; margin-bottom: 8px; letter-spacing: 1px; }
    .header-subtitle { font-size: 14px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 3px; font-weight: 500; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #18181b; margin-bottom: 20px; }
    .greeting strong { color: #18181b; font-weight: 600; }
    .intro-text { color: #52525b; margin-bottom: 24px; font-size: 15px; }
    .info-card { background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #18181b; }
    .info-card-title { font-size: 18px; font-weight: 600; color: #18181b; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e4e4e7; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #71717a; font-size: 14px; }
    .info-value { color: #18181b; font-weight: 500; font-size: 14px; }
    .cta-section { text-align: center; padding: 30px 0; }
    .cta-text { color: #52525b; margin-bottom: 20px; font-size: 15px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #18181b 0%, #27272a 100%); color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 14px 0 rgba(24, 24, 27, 0.39); }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px 0 rgba(24, 24, 27, 0.5); }
    .warning-box { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 16px 20px; border-radius: 10px; margin: 24px 0; border-left: 4px solid #f59e0b; display: flex; align-items: flex-start; gap: 12px; }
    .warning-icon { font-size: 20px; flex-shrink: 0; }
    .warning-text { color: #92400e; font-size: 14px; }
    .warning-text strong { color: #78350f; }
    .signature { margin-top: 30px; padding-top: 24px; border-top: 1px solid #e4e4e7; }
    .signature-text { color: #52525b; font-size: 15px; margin-bottom: 8px; }
    .signature-name { font-weight: 600; color: #18181b; font-size: 15px; }
    .contact-info { margin-top: 16px; padding: 16px; background: #fafafa; border-radius: 8px; }
    .contact-label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .contact-name { font-weight: 600; color: #18181b; font-size: 15px; }
    .contact-role { color: #52525b; font-size: 13px; }
    .footer { background: #18181b; padding: 30px; text-align: center; }
    .footer-text { color: #a1a1aa; font-size: 12px; margin-bottom: 8px; }
    .footer-note { color: #71717a; font-size: 11px; font-style: italic; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">Cockpit</div>
        <div class="header-subtitle">COSMOS ANGRE</div>
      </div>
      <div class="content">
        <p class="greeting">Bonjour <strong>{{recipient_name}}</strong>,</p>

        <p class="intro-text">Vous etes invite(e) a mettre a jour les informations concernant l'action suivante :</p>

        <div class="info-card">
          <div class="info-card-title">{{action_titre}}</div>
          <div class="info-row">
            <span class="info-label">Statut actuel</span>
            <span class="info-value">{{action_statut}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Avancement</span>
            <span class="info-value">{{action_avancement}}%</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date prevue</span>
            <span class="info-value">{{action_date_fin}}</span>
          </div>
        </div>

        <div class="cta-section" style="text-align: center; padding: 30px 0;">
          <p class="cta-text" style="color: #52525b; margin-bottom: 20px; font-size: 15px;">Cliquez sur le bouton ci-dessous pour acceder au formulaire de mise a jour :</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
            <tr>
              <td style="border-radius: 10px; background-color: #18181b;">
                <a href="{{update_link}}" target="_blank" style="display: inline-block; padding: 16px 40px; font-family: 'Exo 2', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px; background-color: #18181b;">Mettre a jour l'action</a>
              </td>
            </tr>
          </table>
        </div>

        <div class="warning-box">
          <span class="warning-icon"></span>
          <span class="warning-text"><strong>Important :</strong> Ce lien expire le <strong>{{expiration_date}}</strong></span>
        </div>

        <div class="signature">
          <p class="signature-text">Si vous avez des questions, n'hesitez pas a nous contacter.</p>
          <p class="signature-text">Cordialement,</p>
          <p class="signature-name">L'equipe COSMOS ANGRE</p>

          <div class="contact-info">
            <div class="contact-label">Votre contact</div>
            <div class="contact-name">Pamela ATOKOUNA</div>
            <div class="contact-role">Coordinatrice de projet</div>
          </div>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">Ce message a ete envoye automatiquement par le Cockpit COSMOS ANGRE.</p>
        <p class="footer-note">Merci de ne pas repondre directement a cet email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  },
  {
    name: 'Relance Jalon',
    subject: '[COSMOS ANGRE] Mise à jour requise - Jalon: {{jalon_titre}}',
    entityType: 'jalon',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Grand+Hotel&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Exo 2', system-ui, sans-serif; line-height: 1.6; color: #27272a; background-color: #f0fdf4; }
    .wrapper { max-width: 640px; margin: 0 auto; padding: 40px 20px; }
    .container { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%); color: white; padding: 40px 30px; text-align: center; }
    .header-logo { font-family: 'Grand Hotel', cursive; font-size: 42px; color: #ffffff; margin-bottom: 8px; letter-spacing: 1px; }
    .header-subtitle { font-size: 14px; color: #86efac; text-transform: uppercase; letter-spacing: 3px; font-weight: 500; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #18181b; margin-bottom: 20px; }
    .greeting strong { color: #18181b; font-weight: 600; }
    .intro-text { color: #52525b; margin-bottom: 24px; font-size: 15px; }
    .info-card { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #16a34a; }
    .info-card-icon { font-size: 24px; margin-bottom: 12px; }
    .info-card-title { font-size: 18px; font-weight: 600; color: #14532d; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bbf7d0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #166534; font-size: 14px; }
    .info-value { color: #14532d; font-weight: 500; font-size: 14px; }
    .cta-section { text-align: center; padding: 30px 0; }
    .cta-text { color: #52525b; margin-bottom: 20px; font-size: 15px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 14px 0 rgba(22, 163, 74, 0.39); }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px 0 rgba(22, 163, 74, 0.5); }
    .warning-box { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 16px 20px; border-radius: 10px; margin: 24px 0; border-left: 4px solid #f59e0b; display: flex; align-items: flex-start; gap: 12px; }
    .warning-icon { font-size: 20px; flex-shrink: 0; }
    .warning-text { color: #92400e; font-size: 14px; }
    .warning-text strong { color: #78350f; }
    .signature { margin-top: 30px; padding-top: 24px; border-top: 1px solid #dcfce7; }
    .signature-text { color: #52525b; font-size: 15px; margin-bottom: 8px; }
    .signature-name { font-weight: 600; color: #18181b; font-size: 15px; }
    .contact-info { margin-top: 16px; padding: 16px; background: #f0fdf4; border-radius: 8px; }
    .contact-label { font-size: 12px; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .contact-name { font-weight: 600; color: #14532d; font-size: 15px; }
    .contact-role { color: #166534; font-size: 13px; }
    .footer { background: #14532d; padding: 30px; text-align: center; }
    .footer-text { color: #86efac; font-size: 12px; margin-bottom: 8px; }
    .footer-note { color: #4ade80; font-size: 11px; font-style: italic; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">Cockpit</div>
        <div class="header-subtitle">COSMOS ANGRE</div>
      </div>
      <div class="content">
        <p class="greeting">Bonjour <strong>{{recipient_name}}</strong>,</p>

        <p class="intro-text">Vous etes invite(e) a mettre a jour les informations concernant le jalon suivant :</p>

        <div class="info-card">
          <div class="info-card-icon"></div>
          <div class="info-card-title">{{jalon_titre}}</div>
          <div class="info-row">
            <span class="info-label">Statut actuel</span>
            <span class="info-value">{{jalon_statut}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date prevue</span>
            <span class="info-value">{{jalon_date}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Livrables</span>
            <span class="info-value">{{jalon_livrables}}</span>
          </div>
        </div>

        <div class="cta-section" style="text-align: center; padding: 30px 0;">
          <p class="cta-text" style="color: #52525b; margin-bottom: 20px; font-size: 15px;">Cliquez sur le bouton ci-dessous pour acceder au formulaire de mise a jour :</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
            <tr>
              <td style="border-radius: 10px; background-color: #16a34a;">
                <a href="{{update_link}}" target="_blank" style="display: inline-block; padding: 16px 40px; font-family: 'Exo 2', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px; background-color: #16a34a;">Mettre a jour le jalon</a>
              </td>
            </tr>
          </table>
        </div>

        <div class="warning-box" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 16px 20px; border-radius: 10px; margin: 24px 0; border-left: 4px solid #f59e0b;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="color: #92400e; font-size: 14px;"><strong style="color: #78350f;">Important :</strong> Ce lien expire le <strong style="color: #78350f;">{{expiration_date}}</strong></td>
            </tr>
          </table>
        </div>

        <div class="signature" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #dcfce7;">
          <p style="color: #52525b; font-size: 15px; margin-bottom: 8px;">Si vous avez des questions, n'hesitez pas a nous contacter.</p>
          <p style="color: #52525b; font-size: 15px; margin-bottom: 8px;">Cordialement,</p>
          <p style="font-weight: 600; color: #18181b; font-size: 15px;">L'equipe COSMOS ANGRE</p>

          <div style="margin-top: 16px; padding: 16px; background: #f0fdf4; border-radius: 8px;">
            <div style="font-size: 12px; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Votre contact</div>
            <div style="font-weight: 600; color: #14532d; font-size: 15px;">Pamela ATOKOUNA</div>
            <div style="color: #166534; font-size: 13px;">Coordinatrice de projet</div>
          </div>
        </div>
      </div>
      <div class="footer" style="background: #14532d; padding: 30px; text-align: center;">
        <p style="color: #86efac; font-size: 12px; margin-bottom: 8px;">Ce message a ete envoye automatiquement par le Cockpit COSMOS ANGRE.</p>
        <p style="color: #4ade80; font-size: 11px; font-style: italic;">Merci de ne pas repondre directement a cet email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  },
  {
    name: 'Relance Risque',
    subject: '[COSMOS ANGRE] Mise à jour requise - Risque: {{risque_titre}}',
    entityType: 'risque',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Grand+Hotel&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Exo 2', system-ui, sans-serif; line-height: 1.6; color: #27272a; background-color: #fef2f2; }
    .wrapper { max-width: 640px; margin: 0 auto; padding: 40px 20px; }
    .container { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%); color: white; padding: 40px 30px; text-align: center; }
    .header-logo { font-family: 'Grand Hotel', cursive; font-size: 42px; color: #ffffff; margin-bottom: 8px; letter-spacing: 1px; }
    .header-subtitle { font-size: 14px; color: #fca5a5; text-transform: uppercase; letter-spacing: 3px; font-weight: 500; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #18181b; margin-bottom: 20px; }
    .greeting strong { color: #18181b; font-weight: 600; }
    .intro-text { color: #52525b; margin-bottom: 24px; font-size: 15px; }
    .info-card { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #dc2626; }
    .info-card-icon { font-size: 24px; margin-bottom: 12px; }
    .info-card-title { font-size: 18px; font-weight: 600; color: #7f1d1d; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #991b1b; font-size: 14px; }
    .info-value { color: #7f1d1d; font-weight: 500; font-size: 14px; }
    .score-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; }
    .score-high { background: #fee2e2; color: #dc2626; }
    .score-medium { background: #fef3c7; color: #d97706; }
    .score-low { background: #dcfce7; color: #16a34a; }
    .metrics-row { display: flex; gap: 16px; margin-top: 12px; }
    .metric { flex: 1; background: #ffffff; padding: 12px; border-radius: 8px; text-align: center; }
    .metric-label { font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-value { font-size: 20px; font-weight: 700; color: #991b1b; }
    .cta-section { text-align: center; padding: 30px 0; }
    .cta-text { color: #52525b; margin-bottom: 20px; font-size: 15px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.39); }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px 0 rgba(220, 38, 38, 0.5); }
    .warning-box { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 16px 20px; border-radius: 10px; margin: 24px 0; border-left: 4px solid #f59e0b; display: flex; align-items: flex-start; gap: 12px; }
    .warning-icon { font-size: 20px; flex-shrink: 0; }
    .warning-text { color: #92400e; font-size: 14px; }
    .warning-text strong { color: #78350f; }
    .signature { margin-top: 30px; padding-top: 24px; border-top: 1px solid #fee2e2; }
    .signature-text { color: #52525b; font-size: 15px; margin-bottom: 8px; }
    .signature-name { font-weight: 600; color: #18181b; font-size: 15px; }
    .contact-info { margin-top: 16px; padding: 16px; background: #fef2f2; border-radius: 8px; }
    .contact-label { font-size: 12px; color: #991b1b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .contact-name { font-weight: 600; color: #7f1d1d; font-size: 15px; }
    .contact-role { color: #991b1b; font-size: 13px; }
    .footer { background: #7f1d1d; padding: 30px; text-align: center; }
    .footer-text { color: #fca5a5; font-size: 12px; margin-bottom: 8px; }
    .footer-note { color: #f87171; font-size: 11px; font-style: italic; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">Cockpit</div>
        <div class="header-subtitle">COSMOS ANGRE</div>
      </div>
      <div class="content">
        <p class="greeting">Bonjour <strong>{{recipient_name}}</strong>,</p>

        <p class="intro-text">Vous etes invite(e) a mettre a jour les informations concernant le risque suivant :</p>

        <div class="info-card">
          <div class="info-card-icon"></div>
          <div class="info-card-title">{{risque_titre}}</div>
          <div class="info-row">
            <span class="info-label">Categorie</span>
            <span class="info-value">{{risque_categorie}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Score actuel</span>
            <span class="info-value"><span class="score-badge {{risque_score_class}}">{{risque_score}}</span></span>
          </div>
          <div class="metrics-row">
            <div class="metric">
              <div class="metric-label">Probabilite</div>
              <div class="metric-value">{{risque_probabilite}}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Impact</div>
              <div class="metric-value">{{risque_impact}}</div>
            </div>
          </div>
        </div>

        <div class="cta-section" style="text-align: center; padding: 30px 0;">
          <p class="cta-text" style="color: #52525b; margin-bottom: 20px; font-size: 15px;">Cliquez sur le bouton ci-dessous pour acceder au formulaire de mise a jour :</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
            <tr>
              <td style="border-radius: 10px; background-color: #dc2626;">
                <a href="{{update_link}}" target="_blank" style="display: inline-block; padding: 16px 40px; font-family: 'Exo 2', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px; background-color: #dc2626;">Mettre a jour le risque</a>
              </td>
            </tr>
          </table>
        </div>

        <div class="warning-box" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 16px 20px; border-radius: 10px; margin: 24px 0; border-left: 4px solid #f59e0b;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="color: #92400e; font-size: 14px;"><strong style="color: #78350f;">Important :</strong> Ce lien expire le <strong style="color: #78350f;">{{expiration_date}}</strong></td>
            </tr>
          </table>
        </div>

        <div class="signature" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #fee2e2;">
          <p style="color: #52525b; font-size: 15px; margin-bottom: 8px;">Si vous avez des questions, n'hesitez pas a nous contacter.</p>
          <p style="color: #52525b; font-size: 15px; margin-bottom: 8px;">Cordialement,</p>
          <p style="font-weight: 600; color: #18181b; font-size: 15px;">L'equipe COSMOS ANGRE</p>

          <div style="margin-top: 16px; padding: 16px; background: #fef2f2; border-radius: 8px;">
            <div style="font-size: 12px; color: #991b1b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Votre contact</div>
            <div style="font-weight: 600; color: #7f1d1d; font-size: 15px;">Pamela ATOKOUNA</div>
            <div style="color: #991b1b; font-size: 13px;">Coordinatrice de projet</div>
          </div>
        </div>
      </div>
      <div class="footer" style="background: #7f1d1d; padding: 30px; text-align: center;">
        <p style="color: #fca5a5; font-size: 12px; margin-bottom: 8px;">Ce message a ete envoye automatiquement par le Cockpit COSMOS ANGRE.</p>
        <p style="color: #f87171; font-size: 11px; font-style: italic;">Merci de ne pas repondre directement a cet email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  },
];

export async function initDefaultTemplates(): Promise<void> {
  // Check if default templates already exist for each type
  for (const template of DEFAULT_TEMPLATES) {
    const existing = await db.emailTemplates
      .where('entityType')
      .equals(template.entityType)
      .and(t => t.isDefault === true)
      .first();

    if (!existing) {
      await db.emailTemplates.add(template as EmailTemplate);
    }
  }
}

/**
 * Force la mise à jour de tous les templates par défaut
 * Remplace les templates existants par les nouvelles versions
 */
export async function updateDefaultTemplates(): Promise<number> {
  let updated = 0;

  for (const template of DEFAULT_TEMPLATES) {
    // Trouver le template existant
    const existing = await db.emailTemplates
      .where('entityType')
      .equals(template.entityType)
      .and(t => t.isDefault === true)
      .first();

    if (existing) {
      // Mettre à jour le template existant
      await db.emailTemplates.update(existing.id!, {
        ...template,
        updatedAt: new Date().toISOString(),
      });
      updated++;
    } else {
      // Créer le template s'il n'existe pas
      await db.emailTemplates.add(template as EmailTemplate);
      updated++;
    }
  }

  return updated;
}

/**
 * Réinitialise tous les templates (supprime et recrée)
 */
export async function resetDefaultTemplates(): Promise<void> {
  // Supprimer TOUS les templates (par défaut ou non)
  await db.emailTemplates.clear();

  // Recréer les templates
  for (const template of DEFAULT_TEMPLATES) {
    await db.emailTemplates.add(template as EmailTemplate);
  }
}

// Clean up duplicate templates - keep only the first default template per type
export async function cleanupDuplicateTemplates(): Promise<number> {
  const allTemplates = await db.emailTemplates.toArray();
  const seenTypes = new Map<string, number>(); // entityType -> first id
  const toDelete: number[] = [];

  for (const template of allTemplates) {
    if (template.isDefault) {
      const key = template.entityType;
      if (seenTypes.has(key)) {
        // This is a duplicate, mark for deletion
        toDelete.push(template.id!);
      } else {
        // First one of this type, keep it
        seenTypes.set(key, template.id!);
      }
    }
  }

  // Delete duplicates
  for (const id of toDelete) {
    await db.emailTemplates.delete(id);
  }

  return toDelete.length;
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  return db.emailTemplates.toArray();
}

export async function getTemplateByType(entityType: 'action' | 'jalon' | 'risque'): Promise<EmailTemplate | undefined> {
  return db.emailTemplates
    .where('entityType')
    .equals(entityType)
    .and(t => t.isDefault)
    .first();
}

export async function saveEmailTemplate(template: Partial<EmailTemplate> & { id?: number }): Promise<number> {
  const now = new Date().toISOString();

  if (template.id) {
    await db.emailTemplates.update(template.id, {
      ...template,
      updatedAt: now,
    });
    return template.id;
  } else {
    return db.emailTemplates.add({
      ...template,
      createdAt: now,
      updatedAt: now,
    } as EmailTemplate);
  }
}

export async function deleteEmailTemplate(id: number): Promise<void> {
  await db.emailTemplates.delete(id);
}

// ============================================
// EMAIL SENDING (Simulation + Webhook)
// ============================================

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendReminderEmail(
  entityType: 'action' | 'jalon' | 'risque',
  entityId: number,
  entity: Action | Jalon | Risque,
  recipientEmail: string,
  recipientName: string,
  durationHours?: number
): Promise<{ link: UpdateLink; emailResult: EmailResult }> {
  const config = getEmailConfig();

  // Create update link (avec données de l'entité pour Firebase)
  const link = await createUpdateLink(entityType, entityId, recipientEmail, recipientName, durationHours, entity);

  // Get template
  const template = await getTemplateByType(entityType);
  if (!template) {
    throw new Error(`Aucun template trouvé pour ${entityType}`);
  }

  // Build update URL - s'assurer que baseUrl est toujours défini
  const baseUrl = config.baseUrl || window.location.origin;
  const updateUrl = `${baseUrl}/update/${entityType}/${link.token}`;

  // Replace placeholders in template
  let html = template.bodyHtml;
  let subject = template.subject;

  const replacements: Record<string, string> = {
    recipient_name: recipientName,
    update_link: updateUrl,
    expiration_date: new Date(link.expiresAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  // Add entity-specific replacements
  if (entityType === 'action') {
    replacements.action_titre = entity.titre || '';
    replacements.action_statut = entity.statut || '';
    replacements.action_avancement = String(entity.avancement || 0);
    replacements.action_date_fin = entity.date_fin_prevue || '';
  } else if (entityType === 'jalon') {
    replacements.jalon_titre = entity.titre || '';
    replacements.jalon_statut = entity.statut || '';
    replacements.jalon_date = entity.date_prevue || '';
    // Formater les livrables en liste de noms (évite [object Object])
    replacements.jalon_livrables = Array.isArray(entity.livrables) && entity.livrables.length > 0
      ? entity.livrables.map((l: { nom: string }) => l.nom).join(', ')
      : 'Aucun livrable défini';
  } else if (entityType === 'risque') {
    replacements.risque_titre = entity.titre || '';
    replacements.risque_categorie = entity.categorie || '';
    replacements.risque_score = String(entity.score || 0);
    replacements.risque_probabilite = String(entity.probabilite || 0);
    replacements.risque_impact = String(entity.impact || 0);
    replacements.risque_score_class = entity.score >= 12 ? 'score-high' : entity.score >= 6 ? 'score-medium' : 'score-low';
  }

  // Apply replacements
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
    subject = subject.replace(regex, value);
  }

  // Simulate sending email (in a real app, this would call an API)
  const emailResult = await simulateSendEmail({
    to: recipientEmail,
    toName: recipientName,
    subject,
    html,
    entityType,
    entityId,
  });

  // Create notification
  await createNotification({
    type: 'link_sent',
    linkId: link.id!,
    entityType,
    entityId,
    recipientEmail,
    recipientName,
    message: `Email envoyé à ${recipientName} (${recipientEmail})`,
  });

  return { link, emailResult };
}

async function simulateSendEmail(params: SendEmailParams): Promise<EmailResult> {
  const config = getEmailConfig();

  // Store email content for history (localStorage)
  const storeEmail = () => {
    const sentEmails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
    sentEmails.push({
      id: Date.now(),
      ...params,
      from: config.fromEmail,
      fromName: config.fromName,
      sentAt: new Date().toISOString(),
    });
    localStorage.setItem('sent_emails', JSON.stringify(sentEmails.slice(-50)));
  };

  // EmailJS - Envoi reel cote client (pas besoin de backend!)
  if (config.provider === 'emailjs' && config.emailjsServiceId && config.emailjsTemplateId && config.emailjsPublicKey) {
    try {
      const templateParams = {
        to_email: params.to,
        to_name: params.toName,
        from_name: config.fromName,
        from_email: config.fromEmail,
        subject: params.subject,
        message_html: params.html,
        reply_to: config.replyTo || config.fromEmail,
      };

      const response = await emailjs.send(
        config.emailjsServiceId,
        config.emailjsTemplateId,
        templateParams,
        config.emailjsPublicKey
      );

      storeEmail();

      return {
        success: true,
        messageId: `emailjs_${response.status}_${Date.now()}`,
      };
    } catch (error) {
      console.error('EmailJS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur EmailJS inconnue',
      };
    }
  }

  // Mode simulation (defaut)
  storeEmail();

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

export function getSentEmails(): SentEmail[] {
  return JSON.parse(localStorage.getItem('sent_emails') || '[]');
}

// ============================================
// LINK URL BUILDERS
// ============================================

export function getUpdateLinkUrl(token: string, entityType: 'action' | 'jalon' | 'risque'): string {
  const config = getEmailConfig();
  const baseUrl = config.baseUrl || window.location.origin;
  return `${baseUrl}/update/${entityType}/${token}`;
}

export function copyLinkToClipboard(token: string, entityType: 'action' | 'jalon' | 'risque'): void {
  const url = getUpdateLinkUrl(token, entityType);
  navigator.clipboard.writeText(url);
}

// ============================================
// PARTAGE DE RAPPORTS HTML
// ============================================

export interface ReportShareParams {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  reportLink: string;
  reportPeriod: string;
  stats: {
    totalActions: number;
    totalJalons: number;
    totalRisques: number;
    avancementGlobal: number;
  };
}

/**
 * Recuperer le template de partage de rapport
 */
export async function getReportShareTemplate(): Promise<EmailTemplate | undefined> {
  // Chercher d'abord le template par défaut pour les rapports
  let template = await db.emailTemplates
    .where('entityType')
    .equals('rapport')
    .first();

  // Si pas de template rapport, initialiser les templates par defaut
  if (!template) {
    await initDefaultTemplates();
    template = await db.emailTemplates
      .where('entityType')
      .equals('rapport')
      .first();
  }

  return template;
}

/**
 * Envoyer un email de partage de rapport HTML
 */
export async function sendReportShareEmail(params: ReportShareParams): Promise<EmailResult> {
  const _config = getEmailConfig();

  // Get template
  const template = await getReportShareTemplate();
  if (!template) {
    return {
      success: false,
      error: 'Aucun template de partage de rapport trouvé',
    };
  }

  // Replace placeholders in template
  let html = template.bodyHtml;
  let subject = template.subject;

  const replacements: Record<string, string> = {
    recipient_name: params.recipientName,
    sender_name: params.senderName,
    rapport_periode: params.reportPeriod,
    report_link: params.reportLink,
    total_actions: String(params.stats.totalActions),
    total_jalons: String(params.stats.totalJalons),
    total_risques: String(params.stats.totalRisques),
    avancement_global: String(params.stats.avancementGlobal),
  };

  // Apply replacements
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
    subject = subject.replace(regex, value);
  }

  // Send email
  const emailResult = await simulateSendEmailForReport({
    to: params.recipientEmail,
    toName: params.recipientName,
    subject,
    html,
  });

  // Create notification
  await createNotification({
    type: 'link_sent' as const,
    linkId: 0,
    entityType: 'action', // Use action as default for report notifications
    entityId: 0,
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    message: `Rapport partagé avec ${params.recipientName} (${params.recipientEmail})`,
  });

  return emailResult;
}

/**
 * Simuler l'envoi d'email pour rapport (version simplifiee)
 */
async function simulateSendEmailForReport(params: {
  to: string;
  toName: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const config = getEmailConfig();

  // Store email content for history
  const storeEmail = () => {
    const sentEmails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
    sentEmails.push({
      id: Date.now(),
      ...params,
      entityType: 'rapport',
      entityId: 0,
      from: config.fromEmail,
      fromName: config.fromName,
      sentAt: new Date().toISOString(),
    });
    localStorage.setItem('sent_emails', JSON.stringify(sentEmails.slice(-50)));
  };

  // EmailJS - Envoi reel cote client
  if (config.provider === 'emailjs' && config.emailjsServiceId && config.emailjsTemplateId && config.emailjsPublicKey) {
    try {
      const templateParams = {
        to_email: params.to,
        to_name: params.toName,
        from_name: config.fromName,
        from_email: config.fromEmail,
        subject: params.subject,
        message_html: params.html,
        reply_to: config.replyTo || config.fromEmail,
      };

      const response = await emailjs.send(
        config.emailjsServiceId,
        config.emailjsTemplateId,
        templateParams,
        config.emailjsPublicKey
      );

      storeEmail();
      return {
        success: true,
        messageId: `emailjs_${response.status}_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur EmailJS inconnue',
      };
    }
  }

  // Mode simulation (defaut)
  storeEmail();
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    messageId: `sim_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Ouvrir le client email avec le contenu du rapport
 * Alternative simple qui utilise mailto avec un lien vers le rapport
 */
export function openEmailClientForReport(params: ReportShareParams): void {
  const subject = encodeURIComponent(`[COSMOS ANGRE] Rapport de projet - ${params.reportPeriod}`);

  const body = encodeURIComponent(`Bonjour ${params.recipientName},

${params.senderName} vous partage le rapport de suivi du projet COSMOS ANGRE.

Période couverte : ${params.reportPeriod}

Résumé :
- Actions : ${params.stats.totalActions}
- Jalons : ${params.stats.totalJalons}
- Risques : ${params.stats.totalRisques}
- Avancement global : ${params.stats.avancementGlobal}%

Pour consulter le rapport complet, cliquez sur le lien ci-dessous :
${params.reportLink}

Cordialement,
${params.senderName}

---
Ce message a été généré par le Cockpit COSMOS ANGRE.`);

  window.open(`mailto:${params.recipientEmail}?subject=${subject}&body=${body}`, '_blank');
}

// ============================================
// FONCTION GENERIQUE D'ENVOI D'EMAIL
// ============================================

export interface SimpleEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envoie un email simple (utilise par alerteEmailService)
 */
export async function sendEmail(params: SimpleEmailParams): Promise<EmailResult> {
  const config = getEmailConfig();

  // Store email content for history
  const storeEmail = () => {
    const sentEmails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
    sentEmails.push({
      id: Date.now(),
      to: params.to,
      toName: params.to,
      subject: params.subject,
      html: params.html,
      entityType: 'alerte',
      entityId: 0,
      from: config.fromEmail,
      fromName: config.fromName,
      sentAt: new Date().toISOString(),
    });
    localStorage.setItem('sent_emails', JSON.stringify(sentEmails.slice(-100)));
  };

  // EmailJS - Envoi reel cote client
  if (config.provider === 'emailjs' && config.emailjsServiceId && config.emailjsTemplateId && config.emailjsPublicKey) {
    try {
      const templateParams = {
        to_email: params.to,
        to_name: params.to,
        from_name: config.fromName,
        from_email: config.fromEmail,
        subject: params.subject,
        message_html: params.html,
        reply_to: config.replyTo || config.fromEmail,
      };

      const response = await emailjs.send(
        config.emailjsServiceId,
        config.emailjsTemplateId,
        templateParams,
        config.emailjsPublicKey
      );

      storeEmail();
      return {
        success: true,
        messageId: `emailjs_${response.status}_${Date.now()}`,
      };
    } catch (error) {
      console.error('EmailJS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur EmailJS inconnue',
      };
    }
  }

  // Mode simulation (defaut)
  storeEmail();
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    success: true,
    messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}
