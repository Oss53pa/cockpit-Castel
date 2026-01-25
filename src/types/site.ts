// ============================================================================
// SITE / PROJET - Types pour la gestion multi-sites
// ============================================================================

export interface Site {
  id?: number;
  code: string;              // Code unique (ex: "COSMOS", "PLAYCE")
  nom: string;               // Nom complet du site
  description?: string;      // Description du projet
  localisation?: string;     // Ville/Pays
  dateOuverture?: string;    // Date d'ouverture prévue
  surface?: number;          // Surface en m²
  couleur: string;           // Couleur pour l'UI (#hex)
  logo?: string;             // URL ou base64 du logo
  actif: boolean;            // Site actif ou archivé
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_SITE: Omit<Site, 'id' | 'createdAt' | 'updatedAt'> = {
  code: 'COSMOS',
  nom: 'COSMOS ANGRE',
  description: 'Centre commercial Cosmos Angré - Abidjan',
  localisation: 'Abidjan, Côte d\'Ivoire',
  dateOuverture: '2026-11-01',
  surface: 45000,
  couleur: '#18181b',
  actif: true,
};
