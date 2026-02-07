// ============================================================================
// TYPES RAPPORTS - GENERATION AUTOMATIQUE
// ============================================================================

import type { ReportPeriod } from '@/components/rapports/ReportPeriodSelector';
import type { MeteoNiveau, AxeType } from './exco';

// Types de rapports disponibles
export type ReportType = 'flash_hebdo' | 'rapport_mensuel' | 'exco' | 'rapport_sync';

export const REPORT_TYPE_CONFIG: Record<ReportType, {
  label: string;
  description: string;
  frequence: string;
  destinataires: string[];
  dureeEstimee: string;
  formats: ('pdf' | 'html' | 'pptx')[];
}> = {
  flash_hebdo: {
    label: 'Flash Hebdo',
    description: 'Point rapide sur l\'etat du projet (1-2 pages)',
    frequence: 'Hebdomadaire',
    destinataires: ['DGA', 'Managers'],
    dureeEstimee: '5 min',
    formats: ['pdf', 'html'],
  },
  rapport_mensuel: {
    label: 'Rapport Mensuel',
    description: 'Suivi detaille de l\'avancement (5-10 pages)',
    frequence: 'Mensuel',
    destinataires: ['DGA', 'PDG'],
    dureeEstimee: '15 min',
    formats: ['pdf', 'html'],
  },
  exco: {
    label: 'EXCO',
    description: 'Revue complete par axe avec decisions DG (12-15 slides)',
    frequence: 'Mensuel',
    destinataires: ['PDG', 'Actionnaires'],
    dureeEstimee: '2h00',
    formats: ['pdf', 'pptx', 'html'],
  },
  rapport_sync: {
    label: 'Rapport Synchronisation',
    description: 'Construction vs Mobilisation (a la demande)',
    frequence: 'A la demande',
    destinataires: ['DGA', 'Chef de projet'],
    dureeEstimee: '10 min',
    formats: ['pdf', 'html'],
  },
};

// Piece jointe
export interface ReportAttachment {
  id: string;
  nom: string;
  type: 'image' | 'document' | 'excel' | 'pdf' | 'lien';
  url?: string;
  data?: string; // Base64 pour les fichiers embarques
  taille?: number;
  description?: string;
  dateAjout: string;
  section?: string; // Section du rapport a laquelle la piece est attachee
}

// Commentaire sur une section du rapport
export interface ReportComment {
  id: string;
  sectionId: string;
  texte: string;
  auteur: string;
  dateCreation: string;
  dateModification?: string;
}

// Section de rapport generee automatiquement
export interface ReportSection {
  id: string;
  titre: string;
  ordre: number;
  type: 'meteo' | 'kpi' | 'jalons' | 'actions' | 'risques' | 'budget' | 'alertes' | 'decisions' | 'sync' | 'custom';
  donnees: unknown; // Donnees generees automatiquement
  commentaire?: string; // Commentaire ajoute par l'utilisateur
  piecesJointes: ReportAttachment[];
  visible: boolean;
}

// Rapport genere
export interface GeneratedReport {
  id: string;
  type: ReportType;
  titre: string;
  periode: ReportPeriod;
  dateGeneration: string;
  dateModification?: string;
  genereePar: string;
  statut: 'brouillon' | 'valide' | 'envoye' | 'archive';

  // Contenu genere automatiquement
  sections: ReportSection[];

  // Metadonnees
  meteoGlobale?: MeteoNiveau;
  compteARebours?: { jours: number; evenement: string };

  // Commentaires et annotations
  commentaires: ReportComment[];
  commentaireGeneral?: string;

  // Pieces jointes globales
  piecesJointes: ReportAttachment[];

  // Destinataires
  destinataires: {
    nom: string;
    email: string;
    envoye?: boolean;
    dateEnvoi?: string;
  }[];

  // Export
  exports: {
    format: 'pdf' | 'html' | 'pptx';
    url?: string;
    dateExport: string;
  }[];
}

// ============================================================================
// FLASH HEBDO - STRUCTURE SPECIFIQUE
// ============================================================================

export interface FlashHebdoData {
  semaine: number;
  annee: number;
  meteoGlobale: MeteoNiveau;
  compteARebours: { jours: number; evenement: string };

  realisations: {
    id: string;
    titre: string;
    axe?: AxeType;
  }[];

  alertes: {
    id: string;
    titre: string;
    criticite: 'critique' | 'haute' | 'moyenne';
    axe?: AxeType;
  }[];

  jalonsCritiques: {
    id: string;
    titre: string;
    date: string;
    responsable: string;
    statut: 'on_track' | 'a_surveiller' | 'en_danger';
  }[];

  actionsBloquees: {
    id: string;
    titre: string;
    raison: string;
    deblocageAttendu?: string;
  }[];
}

// ============================================================================
// RAPPORT SYNCHRONISATION - STRUCTURE SPECIFIQUE
// ============================================================================

export interface RapportSyncData {
  dateGeneration: string;

  // Etat Construction CC
  etatConstruction: {
    phase: string;
    avancement: number;
    dateFinPrevue: string;
  };

  // Seuils atteints
  seuilsAtteints: {
    phaseCode: string;
    seuil: number;
    dateAtteinte: string;
    axeCible: string;
    actionCode: string;
    description: string;
  }[];

  // Actions declenchees
  actionsDeclenchees: {
    id: string;
    code: string;
    titre: string;
    axe: AxeType;
    dateDeclenchement: string;
    statut: 'declenche' | 'en_cours' | 'termine';
  }[];

  // Ecarts
  ecarts: {
    type: 'retard' | 'avance';
    jours: number;
    phase: string;
    impact: string;
  }[];

  // Recommandations
  recommandations: {
    id: string;
    priorite: 'critique' | 'haute' | 'moyenne';
    description: string;
    axeConcerne: AxeType;
  }[];
}

// ============================================================================
// OPTIONS D'EXPORT
// ============================================================================

export interface ExportOptions {
  format: 'pdf' | 'html' | 'pptx';
  inclurePiecesJointes: boolean;
  inclureCommentaires: boolean;
  sections: string[]; // IDs des sections a inclure
  qualite: 'web' | 'impression';
  orientation: 'portrait' | 'paysage';
  enTete: boolean;
  piedPage: boolean;
  numerotation: boolean;
  tableDesMatieres: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'pdf',
  inclurePiecesJointes: true,
  inclureCommentaires: true,
  sections: [],
  qualite: 'impression',
  orientation: 'portrait',
  enTete: true,
  piedPage: true,
  numerotation: true,
  tableDesMatieres: false,
};
