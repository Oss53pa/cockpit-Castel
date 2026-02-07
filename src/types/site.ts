// ============================================================================
// SITE / PROJET - Types pour la gestion multi-sites
// ============================================================================

export interface Site {
  id?: number;
  code: string;              // Code unique (ex: "COSMOS", "PLAYCE")
  nom: string;               // Nom complet du site
  description?: string;      // Description du projet
  localisation?: string;     // Ville/Pays
  dateOuverture?: string;    // Date d'ouverture prévue (Soft Opening)
  dateInauguration?: string; // Date d'inauguration officielle
  surface?: number;          // Surface GLA en m²
  boutiquesMin?: number;     // Nombre minimum de boutiques
  boutiquesMax?: number;     // Nombre maximum de boutiques
  investissement?: number;   // Investissement total en FCFA
  nombreBatiments?: number;  // Nombre de bâtiments
  occupationCible?: number;  // Taux d'occupation cible en %
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
  localisation: 'Angré, Abidjan, Côte d\'Ivoire',
  dateOuverture: '2026-11-15',
  dateInauguration: '2027-03-01',
  surface: 16184, // Surface GLA réelle
  boutiquesMin: 100,
  boutiquesMax: 120,
  investissement: 85_000_000_000, // 85 milliards FCFA
  nombreBatiments: 6, // 6 bâtiments configurés
  occupationCible: 85, // 85% d'occupation cible
  couleur: '#18181b',
  actif: true,
};
