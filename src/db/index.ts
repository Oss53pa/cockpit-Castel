import Dexie, { type EntityTable } from 'dexie';
import type {
  Project,
  ProjectSettings,
  User,
  Team,
  Action,
  Jalon,
  Risque,
  BudgetItem,
  Alerte,
  AlerteEmailHistorique,
  Historique,
  LienChantierMobilisation,
  IAImport,
  IAExtraction,
  IAIntegration,
  IAFile,
  SousTache,
  Preuve,
  NoteAction,
} from '@/types';
import type { LigneBudgetExploitation, BudgetConfiguration } from '@/types/budgetExploitation.types';
import type { Site } from '@/types/site';
import type {
  StudioReport,
  ReportVersion,
  ReportComment,
  ReportActivity,
  ReportTemplate,
  ChartTemplate,
  TableTemplate,
} from '@/types/reportStudio';
import type { DeepDive } from '@/types/deepDive';
import type {
  SyncCategory,
  SyncItem,
  SyncSnapshot,
  SyncAlert,
  SyncAction,
} from '@/types/sync.types';

// Types pour les liens de mise à jour et notifications
export interface UpdateLink {
  id?: number;
  token: string;
  entityType: 'action' | 'jalon' | 'risque';
  entityId: number;
  recipientEmail: string;
  recipientName: string;
  createdAt: string;
  expiresAt: string;
  accessedAt?: string;
  updatedAt?: string;
  isUsed: boolean;
  isExpired: boolean;
}

export interface EmailNotification {
  id?: number;
  type: 'link_sent' | 'link_opened' | 'update_made' | 'link_expired';
  linkId: number;
  entityType: 'action' | 'jalon' | 'risque';
  entityId: number;
  recipientEmail: string;
  recipientName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface EmailTemplate {
  id?: number;
  name: string;
  subject: string;
  bodyHtml: string;
  entityType: 'action' | 'jalon' | 'risque' | 'rapport' | 'general';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Configuration securisee (stockee en IndexedDB au lieu de localStorage)
export interface SecureConfig {
  id?: number;
  key: string;
  value: string;
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types pour le partage externe
export interface ShareToken {
  id?: number;
  token: string;
  entityType: 'action' | 'jalon' | 'risque';
  entityId: number;
  entityTitle: string;
  recipientEmail: string;
  recipientName: string;
  createdAt: string;
  expiresAt: string;
  usedCount: number;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface ExternalUpdate {
  id?: number;
  token: string;
  entityType: 'action' | 'jalon' | 'risque';
  entityId: number;
  submittedAt: string;
  submittedBy: {
    name?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
  changes: {
    status?: string;
    progress?: number;
    comment?: string;
    probability?: number;
    impact?: number;
    newDueDate?: string;
  };
  attachments: Array<{
    name: string;
    url?: string;
    size: number;
    data?: string;
  }>;
  isSynchronized: boolean;
  synchronizedAt?: string;
  isReviewed: boolean;
  reviewedAt?: string;
  reviewedBy?: number;
}

class CockpitDatabase extends Dexie {
  // Sites (multi-sites support)
  sites!: EntityTable<Site, 'id'>;

  project!: EntityTable<Project, 'id'>;
  users!: EntityTable<User, 'id'>;
  teams!: EntityTable<Team, 'id'>;
  actions!: EntityTable<Action, 'id'>;
  jalons!: EntityTable<Jalon, 'id'>;
  risques!: EntityTable<Risque, 'id'>;
  budget!: EntityTable<BudgetItem, 'id'>;
  alertes!: EntityTable<Alerte, 'id'>;
  historique!: EntityTable<Historique, 'id'>;

  // Report Studio tables
  reports!: EntityTable<StudioReport, 'id'>;
  reportVersions!: EntityTable<ReportVersion, 'id'>;
  reportComments!: EntityTable<ReportComment, 'id'>;
  reportActivities!: EntityTable<ReportActivity, 'id'>;
  reportTemplates!: EntityTable<ReportTemplate, 'id'>;
  chartTemplates!: EntityTable<ChartTemplate, 'id'>;
  tableTemplates!: EntityTable<TableTemplate, 'id'>;

  // Email & Update Links tables
  updateLinks!: EntityTable<UpdateLink, 'id'>;
  emailNotifications!: EntityTable<EmailNotification, 'id'>;
  emailTemplates!: EntityTable<EmailTemplate, 'id'>;

  // Configuration securisee
  secureConfigs!: EntityTable<SecureConfig, 'id'>;

  // Synchronisation Chantier/Mobilisation tables
  liensSync!: EntityTable<LienChantierMobilisation, 'id'>;

  // Import IA tables
  iaImports!: EntityTable<IAImport, 'id'>;
  iaExtractions!: EntityTable<IAExtraction, 'id'>;
  iaIntegrations!: EntityTable<IAIntegration, 'id'>;
  iaFiles!: EntityTable<IAFile, 'id'>;

  // DeepDive / Journal tables
  deepDives!: EntityTable<DeepDive, 'id'>;

  // Synchronisation Projet vs Mobilisation tables
  syncCategories!: EntityTable<SyncCategory, 'id'>;
  syncItems!: EntityTable<SyncItem, 'id'>;
  syncSnapshots!: EntityTable<SyncSnapshot, 'id'>;
  syncAlerts!: EntityTable<SyncAlert, 'id'>;
  syncActions!: EntityTable<SyncAction, 'id'>;

  // External Sharing tables
  shareTokens!: EntityTable<ShareToken, 'id'>;
  externalUpdates!: EntityTable<ExternalUpdate, 'id'>;

  // Project Settings table
  projectSettings!: EntityTable<ProjectSettings, 'id'>;

  // Sous-tâches, Preuves, Notes (spécifications v2.0)
  sousTaches!: EntityTable<SousTache, 'id'>;
  preuves!: EntityTable<Preuve, 'id'>;
  notesAction!: EntityTable<NoteAction, 'id'>;

  // Historique des emails d'alertes
  alerteEmailHistorique!: EntityTable<AlerteEmailHistorique, 'id'>;

  // Budget Exploitation (modifiable)
  budgetExploitation!: EntityTable<LigneBudgetExploitation, 'id'>;
  budgetConfigurations!: EntityTable<BudgetConfiguration, 'id'>;

  constructor() {
    super('CockpitCosmosAngre');

    this.version(1).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId',
      jalons: '++id, axe, date_prevue, statut',
      risques: '++id, categorie, score, status, responsableId',
      budget: '++id, categorie, axe',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
    });

    // Version 2: Add Report Studio tables
    this.version(2).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId',
      jalons: '++id, axe, date_prevue, statut',
      risques: '++id, categorie, score, status, responsableId',
      budget: '++id, categorie, axe',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
    });

    // Version 3: Add Teams table
    this.version(3).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId',
      jalons: '++id, axe, date_prevue, statut',
      risques: '++id, categorie, score, status, responsableId',
      budget: '++id, categorie, axe',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
    });

    // Version 4: Add Email & Update Links tables
    this.version(4).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId',
      jalons: '++id, axe, date_prevue, statut',
      risques: '++id, categorie, score, status, responsableId',
      budget: '++id, categorie, axe',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      // Email & Update Links tables
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
    });

    // Version 5: Add Synchronisation Chantier/Mobilisation table
    this.version(5).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId',
      jalons: '++id, axe, date_prevue, statut',
      risques: '++id, categorie, score, status, responsableId',
      budget: '++id, categorie, axe',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      // Email & Update Links tables
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      // Synchronisation Chantier/Mobilisation table
      liensSync: '++id, action_technique_id, action_mobilisation_id',
    });

    // Version 6: Add Import IA tables
    this.version(6).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId',
      jalons: '++id, axe, date_prevue, statut',
      risques: '++id, categorie, score, status, responsableId',
      budget: '++id, categorie, axe',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      // Email & Update Links tables
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      // Synchronisation Chantier/Mobilisation table
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      // Import IA tables
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
    });

    // Version 7: Add DeepDive / Journal table
    this.version(7).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId',
      jalons: '++id, axe, date_prevue, statut',
      risques: '++id, categorie, score, status, responsableId',
      budget: '++id, categorie, axe',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      // Email & Update Links tables
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      // Synchronisation Chantier/Mobilisation table
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      // Import IA tables
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      // DeepDive / Journal table
      deepDives: '++id, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
    });

    // Version 8: Add Synchronisation Projet vs Mobilisation tables
    this.version(8).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId',
      jalons: '++id, axe, date_prevue, statut',
      risques: '++id, categorie, score, status, responsableId',
      budget: '++id, categorie, axe',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      // Email & Update Links tables
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      // Synchronisation Chantier/Mobilisation table (legacy)
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      // Import IA tables
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      // DeepDive / Journal table
      deepDives: '++id, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
      // Synchronisation Projet vs Mobilisation tables
      syncCategories: 'id, code, dimension, displayOrder',
      syncItems: '++id, projectId, categoryId, code, status, [projectId+categoryId]',
      syncSnapshots: '++id, projectId, snapshotDate, syncStatus',
      syncAlerts: '++id, projectId, alertType, isAcknowledged, createdAt',
      syncActions: '++id, projectId, dimension, status, priority, createdAt',
    });

    // Version 9: Add Secure Config table for sensitive data
    this.version(9).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId',
      jalons: '++id, axe, date_prevue, statut',
      risques: '++id, categorie, score, status, responsableId',
      budget: '++id, categorie, axe',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      // Email & Update Links tables
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      // Synchronisation Chantier/Mobilisation table (legacy)
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      // Import IA tables
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      // DeepDive / Journal table
      deepDives: '++id, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
      // Synchronisation Projet vs Mobilisation tables
      syncCategories: 'id, code, dimension, displayOrder',
      syncItems: '++id, projectId, categoryId, code, status, [projectId+categoryId]',
      syncSnapshots: '++id, projectId, snapshotDate, syncStatus',
      syncAlerts: '++id, projectId, alertType, isAcknowledged, createdAt',
      syncActions: '++id, projectId, dimension, status, priority, createdAt',
      // Secure Config table (for sensitive data like API keys)
      secureConfigs: '++id, key, isEncrypted, updatedAt',
    });

    // Version 10: Add External Sharing tables
    this.version(10).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId',
      jalons: '++id, axe, date_prevue, statut',
      risques: '++id, categorie, score, status, responsableId',
      budget: '++id, categorie, axe',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      // Email & Update Links tables
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      // Synchronisation Chantier/Mobilisation table (legacy)
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      // Import IA tables
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      // DeepDive / Journal table
      deepDives: '++id, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
      // Synchronisation Projet vs Mobilisation tables
      syncCategories: 'id, code, dimension, displayOrder',
      syncItems: '++id, projectId, categoryId, code, status, [projectId+categoryId]',
      syncSnapshots: '++id, projectId, snapshotDate, syncStatus',
      syncAlerts: '++id, projectId, alertType, isAcknowledged, createdAt',
      syncActions: '++id, projectId, dimension, status, priority, createdAt',
      // Secure Config table
      secureConfigs: '++id, key, isEncrypted, updatedAt',
      // External Sharing tables
      shareTokens: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isActive',
      externalUpdates: '++id, token, entityType, entityId, submittedAt, isSynchronized, isReviewed',
    });

    // Version 11: Add Project Settings table + projectPhase index on entities
    this.version(11).stores({
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId, projectPhase',
      jalons: '++id, axe, date_prevue, statut, projectPhase',
      risques: '++id, categorie, score, status, responsableId, projectPhase',
      budget: '++id, categorie, axe, projectPhase',
      alertes: '++id, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      // Email & Update Links tables
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      // Synchronisation Chantier/Mobilisation table (legacy)
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      // Import IA tables
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      // DeepDive / Journal table
      deepDives: '++id, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
      // Synchronisation Projet vs Mobilisation tables
      syncCategories: 'id, code, dimension, displayOrder',
      syncItems: '++id, projectId, categoryId, code, status, [projectId+categoryId]',
      syncSnapshots: '++id, projectId, snapshotDate, syncStatus',
      syncAlerts: '++id, projectId, alertType, isAcknowledged, createdAt',
      syncActions: '++id, projectId, dimension, status, priority, createdAt',
      // Secure Config table
      secureConfigs: '++id, key, isEncrypted, updatedAt',
      // External Sharing tables
      shareTokens: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isActive',
      externalUpdates: '++id, token, entityType, entityId, submittedAt, isSynchronized, isReviewed',
      // Project Settings table (métadonnées V2.0)
      projectSettings: '++id, projectId',
    });

    // Version 12: Add Sites table for multi-site support + siteId indexes
    this.version(12).stores({
      // Sites table (NEW)
      sites: '++id, code, nom, actif',
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      // Add siteId index to main data tables
      actions: '++id, siteId, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId, projectPhase',
      jalons: '++id, siteId, axe, date_prevue, statut, projectPhase',
      risques: '++id, siteId, categorie, score, status, responsableId, projectPhase',
      budget: '++id, siteId, categorie, axe, projectPhase',
      alertes: '++id, siteId, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      // Report Studio tables
      reports: '++id, siteId, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      // Email & Update Links tables
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      // Synchronisation Chantier/Mobilisation table (legacy)
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      // Import IA tables
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      // DeepDive / Journal table
      deepDives: '++id, siteId, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
      // Synchronisation Projet vs Mobilisation tables
      syncCategories: 'id, code, dimension, displayOrder',
      syncItems: '++id, projectId, categoryId, code, status, [projectId+categoryId]',
      syncSnapshots: '++id, projectId, snapshotDate, syncStatus',
      syncAlerts: '++id, projectId, alertType, isAcknowledged, createdAt',
      syncActions: '++id, projectId, dimension, status, priority, createdAt',
      // Secure Config table
      secureConfigs: '++id, key, isEncrypted, updatedAt',
      // External Sharing tables
      shareTokens: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isActive',
      externalUpdates: '++id, token, entityType, entityId, submittedAt, isSynchronized, isReviewed',
      // Project Settings table
      projectSettings: '++id, projectId',
    }).upgrade(async (tx) => {
      // Migration: Create default site and assign siteId to existing data
      const sites = tx.table('sites');
      const now = new Date().toISOString();

      // Create default site
      const defaultSiteId = await sites.add({
        code: 'COSMOS',
        nom: 'COSMOS ANGRE',
        description: 'Centre commercial Cosmos Angré - Abidjan',
        localisation: 'Abidjan, Côte d\'Ivoire',
        dateOuverture: '2026-11-01',
        dateInauguration: '2027-03-01',
        surface: 16184,
        nombreBatiments: 6,
        occupationCible: 85,
        couleur: '#18181b',
        actif: true,
        createdAt: now,
        updatedAt: now,
      });

      // Assign siteId to all existing records
      const tables = ['actions', 'jalons', 'risques', 'budget', 'alertes', 'reports', 'deepDives'];
      for (const tableName of tables) {
        const table = tx.table(tableName);
        const records = await table.toArray();
        for (const record of records) {
          if (!record.siteId) {
            await table.update(record.id, { siteId: defaultSiteId });
          }
        }
      }
    });

    // Version 13: Add offset fields for automatic date recalculation
    this.version(13).stores({
      sites: '++id, code, nom, actif',
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, siteId, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId, projectPhase',
      jalons: '++id, siteId, axe, date_prevue, statut, projectPhase',
      risques: '++id, siteId, categorie, score, status, responsableId, projectPhase',
      budget: '++id, siteId, categorie, axe, projectPhase',
      alertes: '++id, siteId, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      reports: '++id, siteId, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      deepDives: '++id, siteId, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
      syncCategories: 'id, code, dimension, displayOrder',
      syncItems: '++id, projectId, categoryId, code, status, [projectId+categoryId]',
      syncSnapshots: '++id, projectId, snapshotDate, syncStatus',
      syncAlerts: '++id, projectId, alertType, isAcknowledged, createdAt',
      syncActions: '++id, projectId, dimension, status, priority, createdAt',
      secureConfigs: '++id, key, isEncrypted, updatedAt',
      shareTokens: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isActive',
      externalUpdates: '++id, token, entityType, entityId, submittedAt, isSynchronized, isReviewed',
      projectSettings: '++id, projectId',
    }).upgrade(async (tx) => {
      // Migration v13: Calculate phase references and delai_declenchement from existing dates
      const MS_PER_DAY = 24 * 60 * 60 * 1000;

      // Get project config from secureConfigs
      const secureConfigs = tx.table('secureConfigs');
      const configRecord = await secureConfigs.where('key').equals('projectConfig').first();

      const defaultConfig = {
        dateDebutConstruction: '2024-01',
        dateDebutMobilisation: '2026-01',
        dateSoftOpening: '2026-11',
        dateFinMobilisation: '2027-03',
      };

      let config = defaultConfig;
      if (configRecord) {
        try {
          config = { ...defaultConfig, ...JSON.parse(configRecord.value) };
        } catch { /* use fallback */ }
      }

      // Normalize phase dates to YYYY-MM-DD
      const phaseDates: Record<string, Date> = {
        dateDebutConstruction: new Date(config.dateDebutConstruction + (config.dateDebutConstruction.length === 7 ? '-01' : '')),
        dateDebutMobilisation: new Date(config.dateDebutMobilisation + (config.dateDebutMobilisation.length === 7 ? '-01' : '')),
        dateSoftOpening: new Date(config.dateSoftOpening + (config.dateSoftOpening.length === 7 ? '-01' : '')),
        dateFinMobilisation: new Date(config.dateFinMobilisation + (config.dateFinMobilisation.length === 7 ? '-01' : '')),
      };

      // Auto-detect closest phase for a given date
      const detectPhase = (dateStr: string): string => {
        const target = new Date(dateStr).getTime();
        let closest = 'dateSoftOpening';
        let minDist = Infinity;
        for (const [key, phaseDate] of Object.entries(phaseDates)) {
          const dist = Math.abs(target - phaseDate.getTime());
          if (dist < minDist) {
            minDist = dist;
            closest = key;
          }
        }
        return closest;
      };

      // Migrate jalons
      const jalons = tx.table('jalons');
      const allJalons = await jalons.toArray();

      for (const jalon of allJalons) {
        if (jalon.date_prevue) {
          const phaseRef = detectPhase(jalon.date_prevue);
          const phaseDate = phaseDates[phaseRef];
          const delai = Math.round(
            (new Date(jalon.date_prevue).getTime() - phaseDate.getTime()) / MS_PER_DAY
          );
          await jalons.update(jalon.id, {
            jalon_reference: phaseRef,
            delai_declenchement: delai,
            date_verrouillage_manuel: false,
          });
        }
      }

      // Migrate actions
      const actions = tx.table('actions');
      const allActions = await actions.toArray();

      for (const action of allActions) {
        if (action.date_debut_prevue) {
          const phaseRef = detectPhase(action.date_debut_prevue);
          const phaseDate = phaseDates[phaseRef];
          const delai = Math.round(
            (new Date(action.date_debut_prevue).getTime() - phaseDate.getTime()) / MS_PER_DAY
          );
          await actions.update(action.id, {
            jalon_reference: phaseRef,
            delai_declenchement: delai,
            unite_temps: 'jours',
            date_verrouillage_manuel: false,
          });
        } else {
          await actions.update(action.id, {
            date_verrouillage_manuel: false,
          });
        }
      }
    });

    // Version 14: Add SousTaches, Preuves, NotesAction tables (spécifications v2.0)
    this.version(14).stores({
      sites: '++id, code, nom, actif',
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, siteId, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId, projectPhase',
      jalons: '++id, siteId, axe, date_prevue, statut, projectPhase',
      risques: '++id, siteId, categorie, score, status, responsableId, projectPhase',
      budget: '++id, siteId, categorie, axe, projectPhase',
      alertes: '++id, siteId, type, criticite, lu, traitee, entiteType, entiteId',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      reports: '++id, siteId, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      deepDives: '++id, siteId, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
      syncCategories: 'id, code, dimension, displayOrder',
      syncItems: '++id, projectId, categoryId, code, status, [projectId+categoryId]',
      syncSnapshots: '++id, projectId, snapshotDate, syncStatus',
      syncAlerts: '++id, projectId, alertType, isAcknowledged, createdAt',
      syncActions: '++id, projectId, dimension, status, priority, createdAt',
      secureConfigs: '++id, key, isEncrypted, updatedAt',
      shareTokens: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isActive',
      externalUpdates: '++id, token, entityType, entityId, submittedAt, isSynchronized, isReviewed',
      projectSettings: '++id, projectId',
      // NEW: Sous-tâches, Preuves, Notes (spécifications v2.0)
      sousTaches: '++id, actionId, ordre',
      preuves: '++id, actionId, type, createdAt',
      notesAction: '++id, actionId, createdAt',
    });

    // Version 15: Enhanced Alertes with responsable + email history
    this.version(15).stores({
      sites: '++id, code, nom, actif',
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, siteId, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId, projectPhase',
      jalons: '++id, siteId, axe, date_prevue, statut, projectPhase',
      risques: '++id, siteId, categorie, score, status, responsableId, projectPhase',
      budget: '++id, siteId, categorie, axe, projectPhase',
      // UPDATED: Alertes with responsable and email tracking
      alertes: '++id, siteId, type, criticite, lu, traitee, entiteType, entiteId, responsableId, emailEnvoye',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      reports: '++id, siteId, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      deepDives: '++id, siteId, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
      syncCategories: 'id, code, dimension, displayOrder',
      syncItems: '++id, projectId, categoryId, code, status, [projectId+categoryId]',
      syncSnapshots: '++id, projectId, snapshotDate, syncStatus',
      syncAlerts: '++id, projectId, alertType, isAcknowledged, createdAt',
      syncActions: '++id, projectId, dimension, status, priority, createdAt',
      secureConfigs: '++id, key, isEncrypted, updatedAt',
      shareTokens: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isActive',
      externalUpdates: '++id, token, entityType, entityId, submittedAt, isSynchronized, isReviewed',
      projectSettings: '++id, projectId',
      sousTaches: '++id, actionId, ordre',
      preuves: '++id, actionId, type, createdAt',
      notesAction: '++id, actionId, createdAt',
      // NEW: Historique des emails d'alertes
      alerteEmailHistorique: '++id, alerteId, type, destinataireEmail, envoyeAt, statut',
    }).upgrade(async (tx) => {
      // Migration: Initialize new fields on existing alertes
      const alertes = tx.table('alertes');
      const allAlertes = await alertes.toArray();
      for (const alerte of allAlertes) {
        await alertes.update(alerte.id, {
          emailEnvoye: false,
          emailRelanceCount: 0,
        });
      }
    });

    // Version 16: Add Budget Exploitation tables (modifiable)
    this.version(16).stores({
      sites: '++id, code, nom, actif',
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, siteId, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId, projectPhase',
      jalons: '++id, siteId, axe, date_prevue, statut, projectPhase',
      risques: '++id, siteId, categorie, score, status, responsableId, projectPhase',
      budget: '++id, siteId, categorie, axe, projectPhase',
      alertes: '++id, siteId, type, criticite, lu, traitee, entiteType, entiteId, responsableId, emailEnvoye',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      reports: '++id, siteId, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      deepDives: '++id, siteId, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
      syncCategories: 'id, code, dimension, displayOrder',
      syncItems: '++id, projectId, categoryId, code, status, [projectId+categoryId]',
      syncSnapshots: '++id, projectId, snapshotDate, syncStatus',
      syncAlerts: '++id, projectId, alertType, isAcknowledged, createdAt',
      syncActions: '++id, projectId, dimension, status, priority, createdAt',
      secureConfigs: '++id, key, isEncrypted, updatedAt',
      shareTokens: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isActive',
      externalUpdates: '++id, token, entityType, entityId, submittedAt, isSynchronized, isReviewed',
      projectSettings: '++id, projectId',
      sousTaches: '++id, actionId, ordre',
      preuves: '++id, actionId, type, createdAt',
      notesAction: '++id, actionId, createdAt',
      alerteEmailHistorique: '++id, alerteId, type, destinataireEmail, envoyeAt, statut',
      // NEW: Budget Exploitation tables (modifiable)
      budgetExploitation: '++id, siteId, budgetType, annee, ordre, categorie',
      budgetConfigurations: '++id, siteId, budgetType, annee',
    });

    // Version 17: Add nombreBatiments to existing sites
    this.version(17).stores({
      sites: '++id, code, nom, actif',
      project: '++id, name',
      users: '++id, nom, email, role',
      teams: '++id, nom, responsableId, actif',
      actions: '++id, siteId, axe, status, responsableId, dateDebut, dateFin, priorite, jalonId, projectPhase',
      jalons: '++id, siteId, axe, date_prevue, statut, projectPhase',
      risques: '++id, siteId, categorie, score, status, responsableId, projectPhase',
      budget: '++id, siteId, categorie, axe, projectPhase',
      alertes: '++id, siteId, type, criticite, lu, traitee, entiteType, entiteId, responsableId, emailEnvoye',
      historique: '++id, timestamp, entiteType, entiteId, auteurId',
      reports: '++id, siteId, centreId, type, status, author, createdAt, updatedAt, publishedAt',
      reportVersions: '++id, reportId, versionNumber, createdAt',
      reportComments: '++id, reportId, sectionId, blockId, authorId, isResolved, createdAt',
      reportActivities: '++id, reportId, type, userId, createdAt',
      reportTemplates: 'id, name, category, type',
      chartTemplates: 'id, name, category, chartType',
      tableTemplates: 'id, name, category',
      updateLinks: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isUsed',
      emailNotifications: '++id, type, linkId, entityType, entityId, isRead, createdAt',
      emailTemplates: '++id, name, entityType, isDefault',
      liensSync: '++id, action_technique_id, action_mobilisation_id',
      iaImports: '++id, importRef, documentType, status, createdAt, createdBy, targetModule',
      iaExtractions: '++id, importId, field, correctedAt',
      iaIntegrations: '++id, importId, targetModule, targetTable, recordId, integratedAt',
      iaFiles: '++id, importId, filename, mimeType, createdAt',
      deepDives: '++id, siteId, titre, projectName, status, createdAt, updatedAt, createdBy, presentedAt',
      syncCategories: 'id, code, dimension, displayOrder',
      syncItems: '++id, projectId, categoryId, code, status, [projectId+categoryId]',
      syncSnapshots: '++id, projectId, snapshotDate, syncStatus',
      syncAlerts: '++id, projectId, alertType, isAcknowledged, createdAt',
      syncActions: '++id, projectId, dimension, status, priority, createdAt',
      secureConfigs: '++id, key, isEncrypted, updatedAt',
      shareTokens: '++id, token, entityType, entityId, recipientEmail, createdAt, expiresAt, isActive',
      externalUpdates: '++id, token, entityType, entityId, submittedAt, isSynchronized, isReviewed',
      projectSettings: '++id, projectId',
      sousTaches: '++id, actionId, ordre',
      preuves: '++id, actionId, type, createdAt',
      notesAction: '++id, actionId, createdAt',
      alerteEmailHistorique: '++id, alerteId, type, destinataireEmail, envoyeAt, statut',
      budgetExploitation: '++id, siteId, budgetType, annee, ordre, categorie',
      budgetConfigurations: '++id, siteId, budgetType, annee',
    }).upgrade(async (tx) => {
      // Migration v17: Ajouter nombreBatiments aux sites existants qui n'ont pas cette valeur
      const sites = tx.table('sites');
      const allSites = await sites.toArray();

      for (const site of allSites) {
        if (site.nombreBatiments === undefined || site.nombreBatiments === null) {
          // Valeur par défaut de 6 pour COSMOS Angré, sinon 0
          const defaultValue = site.code === 'COSMOS' ? 6 : 0;
          await sites.update(site.id, {
            nombreBatiments: defaultValue,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });
  }
}

export const db = new CockpitDatabase();

// Database utilities
export async function clearDatabase(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
}

export async function exportDatabase(): Promise<string> {
  const data = {
    version: '12.0',
    exportedAt: new Date().toISOString(),
    sites: await db.sites.toArray(),
    project: await db.project.toArray(),
    projectSettings: await db.projectSettings.toArray(),
    users: await db.users.toArray(),
    teams: await db.teams.toArray(),
    actions: await db.actions.toArray(),
    jalons: await db.jalons.toArray(),
    risques: await db.risques.toArray(),
    budget: await db.budget.toArray(),
    alertes: await db.alertes.toArray(),
    historique: await db.historique.toArray(),
    // Report Studio data
    reports: await db.reports.toArray(),
    reportVersions: await db.reportVersions.toArray(),
    reportComments: await db.reportComments.toArray(),
    reportActivities: await db.reportActivities.toArray(),
    reportTemplates: await db.reportTemplates.toArray(),
    chartTemplates: await db.chartTemplates.toArray(),
    tableTemplates: await db.tableTemplates.toArray(),
    // Email & Update Links data
    updateLinks: await db.updateLinks.toArray(),
    emailNotifications: await db.emailNotifications.toArray(),
    emailTemplates: await db.emailTemplates.toArray(),
    // Synchronisation data
    liensSync: await db.liensSync.toArray(),
    // Import IA data (excluding file blobs for size)
    iaImports: await db.iaImports.toArray(),
    iaExtractions: await db.iaExtractions.toArray(),
    iaIntegrations: await db.iaIntegrations.toArray(),
    // DeepDive / Journal data
    deepDives: await db.deepDives.toArray(),
    // Synchronisation Projet vs Mobilisation data
    syncCategories: await db.syncCategories.toArray(),
    syncItems: await db.syncItems.toArray(),
    syncSnapshots: await db.syncSnapshots.toArray(),
    syncAlerts: await db.syncAlerts.toArray(),
    // Sous-tâches, Preuves, Notes (spécifications v2.0)
    sousTaches: await db.sousTaches.toArray(),
    preuves: await db.preuves.toArray(),
    notesAction: await db.notesAction.toArray(),
    syncActions: await db.syncActions.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importDatabase(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);

  await db.transaction('rw', db.tables, async () => {
    // Clear existing data
    for (const table of db.tables) {
      await table.clear();
    }

    // Import new data
    if (data.sites?.length) await db.sites.bulkAdd(data.sites);
    if (data.project?.length) await db.project.bulkAdd(data.project);
    if (data.projectSettings?.length) await db.projectSettings.bulkAdd(data.projectSettings);
    if (data.users?.length) await db.users.bulkAdd(data.users);
    if (data.teams?.length) await db.teams.bulkAdd(data.teams);
    if (data.actions?.length) await db.actions.bulkAdd(data.actions);
    if (data.jalons?.length) await db.jalons.bulkAdd(data.jalons);
    if (data.risques?.length) await db.risques.bulkAdd(data.risques);
    if (data.budget?.length) await db.budget.bulkAdd(data.budget);
    if (data.alertes?.length) await db.alertes.bulkAdd(data.alertes);
    if (data.historique?.length) await db.historique.bulkAdd(data.historique);

    // Import Report Studio data
    if (data.reports?.length) await db.reports.bulkAdd(data.reports);
    if (data.reportVersions?.length) await db.reportVersions.bulkAdd(data.reportVersions);
    if (data.reportComments?.length) await db.reportComments.bulkAdd(data.reportComments);
    if (data.reportActivities?.length) await db.reportActivities.bulkAdd(data.reportActivities);
    if (data.reportTemplates?.length) await db.reportTemplates.bulkAdd(data.reportTemplates);
    if (data.chartTemplates?.length) await db.chartTemplates.bulkAdd(data.chartTemplates);
    if (data.tableTemplates?.length) await db.tableTemplates.bulkAdd(data.tableTemplates);

    // Import Email & Update Links data
    if (data.updateLinks?.length) await db.updateLinks.bulkAdd(data.updateLinks);
    if (data.emailNotifications?.length) await db.emailNotifications.bulkAdd(data.emailNotifications);
    if (data.emailTemplates?.length) await db.emailTemplates.bulkAdd(data.emailTemplates);

    // Import Synchronisation data
    if (data.liensSync?.length) await db.liensSync.bulkAdd(data.liensSync);

    // Import IA data
    if (data.iaImports?.length) await db.iaImports.bulkAdd(data.iaImports);
    if (data.iaExtractions?.length) await db.iaExtractions.bulkAdd(data.iaExtractions);
    if (data.iaIntegrations?.length) await db.iaIntegrations.bulkAdd(data.iaIntegrations);

    // Import DeepDive / Journal data
    if (data.deepDives?.length) await db.deepDives.bulkAdd(data.deepDives);

    // Import Synchronisation Projet vs Mobilisation data
    if (data.syncCategories?.length) await db.syncCategories.bulkAdd(data.syncCategories);
    if (data.syncItems?.length) await db.syncItems.bulkAdd(data.syncItems);
    if (data.syncSnapshots?.length) await db.syncSnapshots.bulkAdd(data.syncSnapshots);
    if (data.syncAlerts?.length) await db.syncAlerts.bulkAdd(data.syncAlerts);
    if (data.syncActions?.length) await db.syncActions.bulkAdd(data.syncActions);

    // Import Sous-tâches, Preuves, Notes (spécifications v2.0)
    if (data.sousTaches?.length) await db.sousTaches.bulkAdd(data.sousTaches);
    if (data.preuves?.length) await db.preuves.bulkAdd(data.preuves);
    if (data.notesAction?.length) await db.notesAction.bulkAdd(data.notesAction);
  });
}
