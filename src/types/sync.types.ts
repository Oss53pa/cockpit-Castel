// ============================================================================
// SYNCHRONISATION PROJET vs MOBILISATION - Types
// ============================================================================

// Dimensions de synchronisation
export type SyncDimension = 'PROJECT' | 'MOBILIZATION';

// Statuts de synchronisation
export type SyncStatusType = 'SYNC' | 'PROJECT_AHEAD' | 'MOBILIZATION_AHEAD' | 'CRITICAL';

// Niveau d'alerte
export type SyncAlertLevel = 'GREEN' | 'ORANGE' | 'RED';

// Types d'alerte
export type SyncAlertType = 'WARNING' | 'CRITICAL' | 'INFO';

// Types d'action corrective
export type SyncActionType = 'ACCELERATE' | 'DELAY' | 'REINFORCE' | 'OPTIMIZE' | 'MONITOR';

// Priorité des actions
export type SyncPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Statuts des items
export type SyncItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'BLOCKED';

// Statuts des actions correctives
export type SyncActionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// ============================================================================
// CATEGORIES DE SYNCHRONISATION
// ============================================================================

export interface SyncCategory {
  id: string;
  code: string;
  name: string;
  dimension: SyncDimension;
  weight: number;
  displayOrder: number;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

// Catégories PROJET
export const PROJECT_CATEGORIES: SyncCategory[] = [
  { id: 'PRJ-01', code: 'ETUDES', name: 'Études & Conception', dimension: 'PROJECT', weight: 1.0, displayOrder: 1, color: '#3B82F6', icon: 'FileText', createdAt: '', updatedAt: '' },
  { id: 'PRJ-02', code: 'TERRASSEMENT', name: 'Terrassement & VRD', dimension: 'PROJECT', weight: 1.0, displayOrder: 2, color: '#8B5CF6', icon: 'Mountain', createdAt: '', updatedAt: '' },
  { id: 'PRJ-03', code: 'GROS_OEUVRE', name: 'Gros Œuvre', dimension: 'PROJECT', weight: 1.5, displayOrder: 3, color: '#EC4899', icon: 'Building', createdAt: '', updatedAt: '' },
  { id: 'PRJ-04', code: 'SECOND_OEUVRE', name: 'Second Œuvre', dimension: 'PROJECT', weight: 1.2, displayOrder: 4, color: '#F59E0B', icon: 'Layers', createdAt: '', updatedAt: '' },
  { id: 'PRJ-05', code: 'LOTS_TECHNIQUES', name: 'Lots Techniques', dimension: 'PROJECT', weight: 1.3, displayOrder: 5, color: '#10B981', icon: 'Wrench', createdAt: '', updatedAt: '' },
  { id: 'PRJ-06', code: 'AMENAGEMENTS_EXT', name: 'Aménagements Extérieurs', dimension: 'PROJECT', weight: 0.8, displayOrder: 6, color: '#06B6D4', icon: 'Trees', createdAt: '', updatedAt: '' },
  { id: 'PRJ-07', code: 'FINITIONS', name: 'Finitions & Réceptions', dimension: 'PROJECT', weight: 1.0, displayOrder: 7, color: '#6366F1', icon: 'CheckSquare', createdAt: '', updatedAt: '' },
];

// Catégories MOBILISATION
export const MOBILIZATION_CATEGORIES: SyncCategory[] = [
  { id: 'MOB-01', code: 'RH', name: 'Ressources Humaines', dimension: 'MOBILIZATION', weight: 1.5, displayOrder: 1, color: '#EF4444', icon: 'Users', createdAt: '', updatedAt: '' },
  { id: 'MOB-02', code: 'EQUIPEMENTS', name: 'Équipements', dimension: 'MOBILIZATION', weight: 1.2, displayOrder: 2, color: '#F97316', icon: 'Package', createdAt: '', updatedAt: '' },
  { id: 'MOB-03', code: 'CONTRATS', name: 'Contrats', dimension: 'MOBILIZATION', weight: 1.3, displayOrder: 3, color: '#84CC16', icon: 'FileSignature', createdAt: '', updatedAt: '' },
  { id: 'MOB-04', code: 'SYSTEMES', name: 'Systèmes', dimension: 'MOBILIZATION', weight: 1.0, displayOrder: 4, color: '#14B8A6', icon: 'Server', createdAt: '', updatedAt: '' },
  { id: 'MOB-05', code: 'PROCEDURES', name: 'Procédures', dimension: 'MOBILIZATION', weight: 1.0, displayOrder: 5, color: '#8B5CF6', icon: 'ClipboardList', createdAt: '', updatedAt: '' },
  { id: 'MOB-06', code: 'MARKETING', name: 'Marketing & Communication', dimension: 'MOBILIZATION', weight: 0.8, displayOrder: 6, color: '#EC4899', icon: 'Megaphone', createdAt: '', updatedAt: '' },
];

// ============================================================================
// ITEMS DE SYNCHRONISATION
// ============================================================================

export interface SyncItem {
  id?: number;
  projectId: string;
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progressPercent: number;
  weight: number;
  status: SyncItemStatus;
  responsible?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SNAPSHOTS DE SYNCHRONISATION
// ============================================================================

// Item simplifié pour l'affichage dans CategoryProgress
export interface CategoryActionItem {
  id: number;
  id_action: string;
  titre: string;
  avancement: number;
  statut: string;
  responsable?: string;
  date_fin_prevue?: string;
  sousTaches?: Array<{
    id: number;
    libelle: string;
    fait: boolean;
  }>;
}

export interface CategoryProgress {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  progress: number;
  itemsCount: number;
  completedCount: number;
  // Actions détaillées (optionnel, pour affichage dans la vue expandée)
  items?: CategoryActionItem[];
}

export interface SyncSnapshot {
  id?: number;
  projectId: string;
  snapshotDate: string;
  projectProgress: number;
  mobilizationProgress: number;
  syncGap: number;
  syncStatus: SyncStatusType;
  projectDetails: CategoryProgress[];
  mobilizationDetails: CategoryProgress[];
  createdAt: string;
}

// ============================================================================
// ALERTES DE SYNCHRONISATION
// ============================================================================

export interface RecommendedAction {
  dimension: SyncDimension;
  categoryCode: string;
  actionType: SyncActionType;
  title: string;
  priority: SyncPriority;
}

export interface SyncAlert {
  id?: number;
  projectId: string;
  alertDate: string;
  alertType: SyncAlertType;
  dimension: SyncDimension | 'BOTH';
  categoryId?: string;
  title: string;
  description?: string;
  recommendedActions: RecommendedAction[];
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

// ============================================================================
// ACTIONS CORRECTIVES
// ============================================================================

export interface SyncAction {
  id?: number;
  projectId: string;
  alertId?: number;
  dimension: SyncDimension;
  categoryId?: string;
  actionType: SyncActionType;
  title: string;
  description?: string;
  responsible?: string;
  dueDate?: string;
  status: SyncActionStatus;
  priority: SyncPriority;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// STATUT DE SYNCHRONISATION (Calculé)
// ============================================================================

export interface SyncStatusResult {
  projectProgress: number;
  mobilizationProgress: number;
  gap: number;
  gapDays: number;
  status: SyncStatusType;
  alertLevel: SyncAlertLevel;
}

// ============================================================================
// ITEMS INITIAUX - PROJET
// ============================================================================

export const INITIAL_PROJECT_ITEMS: Partial<SyncItem>[] = [
  // Études & Conception (Phase 1 - Préparation)
  { categoryId: 'PRJ-01', code: 'ETU-001', name: 'Plans architecturaux définitifs', weight: 1.5, plannedStartDate: '2025-09-01', plannedEndDate: '2025-12-31' },
  { categoryId: 'PRJ-01', code: 'ETU-002', name: 'Études structure béton', weight: 1.2, plannedStartDate: '2025-10-01', plannedEndDate: '2026-01-31' },
  { categoryId: 'PRJ-01', code: 'ETU-003', name: 'Études fluides CVC', weight: 1.0, plannedStartDate: '2025-10-15', plannedEndDate: '2026-02-15' },
  { categoryId: 'PRJ-01', code: 'ETU-004', name: 'Permis de construire obtenu', weight: 2.0, plannedStartDate: '2025-06-01', plannedEndDate: '2025-11-30' },
  { categoryId: 'PRJ-01', code: 'ETU-005', name: 'Études VRD et réseaux', weight: 1.0, plannedStartDate: '2025-11-01', plannedEndDate: '2026-02-28' },

  // Terrassement & VRD (Phase 1-2 transition)
  { categoryId: 'PRJ-02', code: 'TER-001', name: 'Terrassement général', weight: 1.5, plannedStartDate: '2026-01-15', plannedEndDate: '2026-03-31' },
  { categoryId: 'PRJ-02', code: 'TER-002', name: 'Voiries et accès', weight: 1.2, plannedStartDate: '2026-02-15', plannedEndDate: '2026-05-31' },
  { categoryId: 'PRJ-02', code: 'TER-003', name: 'Réseaux eau et assainissement', weight: 1.0, plannedStartDate: '2026-02-01', plannedEndDate: '2026-04-30' },
  { categoryId: 'PRJ-02', code: 'TER-004', name: 'Réseaux électriques enterrés', weight: 1.0, plannedStartDate: '2026-02-15', plannedEndDate: '2026-04-30' },

  // Gros Œuvre (Phase 1-2)
  { categoryId: 'PRJ-03', code: 'GRO-001', name: 'Fondations', weight: 2.0, plannedStartDate: '2026-03-01', plannedEndDate: '2026-05-15' },
  { categoryId: 'PRJ-03', code: 'GRO-002', name: 'Structure béton RDC', weight: 1.5, plannedStartDate: '2026-04-15', plannedEndDate: '2026-07-15' },
  { categoryId: 'PRJ-03', code: 'GRO-003', name: 'Structure béton R+1', weight: 1.5, plannedStartDate: '2026-06-01', plannedEndDate: '2026-08-31' },
  { categoryId: 'PRJ-03', code: 'GRO-004', name: 'Charpente et toiture', weight: 1.2, plannedStartDate: '2026-07-15', plannedEndDate: '2026-09-30' },

  // Second Œuvre (Phase 2)
  { categoryId: 'PRJ-04', code: 'SEC-001', name: 'Cloisons et doublages', weight: 1.0, plannedStartDate: '2026-07-01', plannedEndDate: '2026-09-15' },
  { categoryId: 'PRJ-04', code: 'SEC-002', name: 'Menuiseries extérieures', weight: 1.2, plannedStartDate: '2026-06-15', plannedEndDate: '2026-08-31' },
  { categoryId: 'PRJ-04', code: 'SEC-003', name: 'Menuiseries intérieures', weight: 1.0, plannedStartDate: '2026-08-01', plannedEndDate: '2026-10-15' },
  { categoryId: 'PRJ-04', code: 'SEC-004', name: 'Faux plafonds', weight: 0.8, plannedStartDate: '2026-08-15', plannedEndDate: '2026-10-31' },
  { categoryId: 'PRJ-04', code: 'SEC-005', name: 'Revêtements sols et murs', weight: 1.0, plannedStartDate: '2026-09-01', plannedEndDate: '2026-11-15' },

  // Lots Techniques (Phase 2)
  { categoryId: 'PRJ-05', code: 'TEC-001', name: 'Électricité courants forts', weight: 1.5, plannedStartDate: '2026-06-01', plannedEndDate: '2026-09-30' },
  { categoryId: 'PRJ-05', code: 'TEC-002', name: 'Électricité courants faibles', weight: 1.2, plannedStartDate: '2026-07-01', plannedEndDate: '2026-10-15' },
  { categoryId: 'PRJ-05', code: 'TEC-003', name: 'Plomberie sanitaire', weight: 1.0, plannedStartDate: '2026-06-15', plannedEndDate: '2026-09-15' },
  { categoryId: 'PRJ-05', code: 'TEC-004', name: 'CVC - Climatisation', weight: 1.5, plannedStartDate: '2026-07-01', plannedEndDate: '2026-10-31' },
  { categoryId: 'PRJ-05', code: 'TEC-005', name: 'Sécurité incendie', weight: 1.3, plannedStartDate: '2026-08-01', plannedEndDate: '2026-11-15' },
  { categoryId: 'PRJ-05', code: 'TEC-006', name: 'GTC / GTB', weight: 1.0, plannedStartDate: '2026-09-01', plannedEndDate: '2026-11-30' },

  // Aménagements Extérieurs (Phase 2-3)
  { categoryId: 'PRJ-06', code: 'EXT-001', name: 'Parking et marquages', weight: 1.2, plannedStartDate: '2026-09-01', plannedEndDate: '2026-11-15' },
  { categoryId: 'PRJ-06', code: 'EXT-002', name: 'Espaces verts', weight: 0.8, plannedStartDate: '2026-09-15', plannedEndDate: '2026-11-30' },
  { categoryId: 'PRJ-06', code: 'EXT-003', name: 'Éclairage extérieur', weight: 1.0, plannedStartDate: '2026-09-01', plannedEndDate: '2026-11-15' },
  { categoryId: 'PRJ-06', code: 'EXT-004', name: 'Signalétique extérieure', weight: 0.8, plannedStartDate: '2026-10-01', plannedEndDate: '2026-12-15' },

  // Finitions & Réceptions (Phase 3 - Lancement)
  { categoryId: 'PRJ-07', code: 'FIN-001', name: 'OPR et levée réserves', weight: 1.5, plannedStartDate: '2026-11-01', plannedEndDate: '2026-12-15' },
  { categoryId: 'PRJ-07', code: 'FIN-002', name: 'Réception des lots', weight: 1.2, plannedStartDate: '2026-11-15', plannedEndDate: '2026-12-31' },
  { categoryId: 'PRJ-07', code: 'FIN-003', name: 'Certifications et conformités', weight: 1.0, plannedStartDate: '2026-11-01', plannedEndDate: '2026-12-31' },
  { categoryId: 'PRJ-07', code: 'FIN-004', name: 'DOE et documentation', weight: 0.8, plannedStartDate: '2026-11-15', plannedEndDate: '2026-12-31' },
];

// ============================================================================
// ITEMS INITIAUX - MOBILISATION
// ============================================================================

export const INITIAL_MOBILIZATION_ITEMS: Partial<SyncItem>[] = [
  // RH (Phase 2 Mobilisation → Phase 3 Lancement)
  { categoryId: 'MOB-01', code: 'RH-001', name: 'Recrutement Directeur Centre', weight: 2.0, plannedStartDate: '2026-03-01', plannedEndDate: '2026-05-31' },
  { categoryId: 'MOB-01', code: 'RH-002', name: 'Recrutement Responsable Technique', weight: 1.5, plannedStartDate: '2026-04-01', plannedEndDate: '2026-06-30' },
  { categoryId: 'MOB-01', code: 'RH-003', name: 'Recrutement équipe sécurité', weight: 1.5, plannedStartDate: '2026-06-01', plannedEndDate: '2026-08-31' },
  { categoryId: 'MOB-01', code: 'RH-004', name: 'Recrutement équipe entretien', weight: 1.2, plannedStartDate: '2026-06-15', plannedEndDate: '2026-09-15' },
  { categoryId: 'MOB-01', code: 'RH-005', name: 'Recrutement accueil et admin', weight: 1.0, plannedStartDate: '2026-07-01', plannedEndDate: '2026-09-30' },
  { categoryId: 'MOB-01', code: 'RH-006', name: 'Formations initiales', weight: 1.0, plannedStartDate: '2026-09-01', plannedEndDate: '2026-11-30' },
  { categoryId: 'MOB-01', code: 'RH-007', name: 'Onboarding et intégration', weight: 0.8, plannedStartDate: '2026-10-01', plannedEndDate: '2026-12-15' },

  // Équipements (Phase 2-3)
  { categoryId: 'MOB-02', code: 'EQP-001', name: 'Mobilier bureaux et accueil', weight: 1.0, plannedStartDate: '2026-07-01', plannedEndDate: '2026-09-30' },
  { categoryId: 'MOB-02', code: 'EQP-002', name: 'Matériel informatique', weight: 1.2, plannedStartDate: '2026-08-01', plannedEndDate: '2026-10-15' },
  { categoryId: 'MOB-02', code: 'EQP-003', name: 'Équipements techniques maintenance', weight: 1.5, plannedStartDate: '2026-07-15', plannedEndDate: '2026-10-31' },
  { categoryId: 'MOB-02', code: 'EQP-004', name: 'Équipements sécurité', weight: 1.3, plannedStartDate: '2026-08-01', plannedEndDate: '2026-10-31' },
  { categoryId: 'MOB-02', code: 'EQP-005', name: 'Véhicules de service', weight: 0.8, plannedStartDate: '2026-09-01', plannedEndDate: '2026-11-15' },

  // Contrats (Phase 2)
  { categoryId: 'MOB-03', code: 'CTR-001', name: 'Contrat maintenance multi-technique', weight: 1.5, plannedStartDate: '2026-05-01', plannedEndDate: '2026-08-31' },
  { categoryId: 'MOB-03', code: 'CTR-002', name: 'Contrat sécurité/gardiennage', weight: 1.3, plannedStartDate: '2026-05-15', plannedEndDate: '2026-08-31' },
  { categoryId: 'MOB-03', code: 'CTR-003', name: 'Contrat nettoyage', weight: 1.0, plannedStartDate: '2026-06-01', plannedEndDate: '2026-09-15' },
  { categoryId: 'MOB-03', code: 'CTR-004', name: 'Contrat espaces verts', weight: 0.8, plannedStartDate: '2026-07-01', plannedEndDate: '2026-09-30' },
  { categoryId: 'MOB-03', code: 'CTR-005', name: 'Contrats énergie (EECI, SODECI)', weight: 1.2, plannedStartDate: '2026-04-01', plannedEndDate: '2026-07-31' },
  { categoryId: 'MOB-03', code: 'CTR-006', name: 'Assurances', weight: 1.0, plannedStartDate: '2026-04-15', plannedEndDate: '2026-07-31' },

  // Systèmes (Phase 2-3)
  { categoryId: 'MOB-04', code: 'SYS-001', name: 'Déploiement réseau informatique', weight: 1.2, plannedStartDate: '2026-08-01', plannedEndDate: '2026-10-31' },
  { categoryId: 'MOB-04', code: 'SYS-002', name: 'Installation COCKPIT', weight: 1.5, plannedStartDate: '2026-09-01', plannedEndDate: '2026-11-15' },
  { categoryId: 'MOB-04', code: 'SYS-003', name: 'Paramétrage GTC', weight: 1.3, plannedStartDate: '2026-09-15', plannedEndDate: '2026-11-30' },
  { categoryId: 'MOB-04', code: 'SYS-004', name: 'Système vidéosurveillance', weight: 1.0, plannedStartDate: '2026-08-15', plannedEndDate: '2026-10-31' },
  { categoryId: 'MOB-04', code: 'SYS-005', name: 'Système contrôle d\'accès', weight: 1.0, plannedStartDate: '2026-09-01', plannedEndDate: '2026-11-15' },

  // Procédures (Phase 2-3)
  { categoryId: 'MOB-05', code: 'PRC-001', name: 'Procédures exploitation', weight: 1.2, plannedStartDate: '2026-06-01', plannedEndDate: '2026-09-30' },
  { categoryId: 'MOB-05', code: 'PRC-002', name: 'Procédures HSE', weight: 1.5, plannedStartDate: '2026-06-15', plannedEndDate: '2026-09-30' },
  { categoryId: 'MOB-05', code: 'PRC-003', name: 'Plan d\'urgence et évacuation', weight: 1.3, plannedStartDate: '2026-07-01', plannedEndDate: '2026-10-15' },
  { categoryId: 'MOB-05', code: 'PRC-004', name: 'Autorisations administratives', weight: 1.0, plannedStartDate: '2026-04-01', plannedEndDate: '2026-08-31' },
  { categoryId: 'MOB-05', code: 'PRC-005', name: 'Certifications qualité', weight: 0.8, plannedStartDate: '2026-08-01', plannedEndDate: '2026-11-30' },

  // Marketing & Communication (Phase 2-3)
  { categoryId: 'MOB-06', code: 'MKT-001', name: 'Signalétique intérieure', weight: 1.0, plannedStartDate: '2026-09-01', plannedEndDate: '2026-11-30' },
  { categoryId: 'MOB-06', code: 'MKT-002', name: 'Site web et réseaux sociaux', weight: 0.8, plannedStartDate: '2026-06-01', plannedEndDate: '2026-09-30' },
  { categoryId: 'MOB-06', code: 'MKT-003', name: 'Campagne pré-ouverture', weight: 1.2, plannedStartDate: '2026-09-01', plannedEndDate: '2026-12-15' },
  { categoryId: 'MOB-06', code: 'MKT-004', name: 'Événement inauguration', weight: 1.0, plannedStartDate: '2026-11-01', plannedEndDate: '2026-12-31' },
  { categoryId: 'MOB-06', code: 'MKT-005', name: 'Relations locataires', weight: 1.5, plannedStartDate: '2026-04-01', plannedEndDate: '2026-12-31' },
];
