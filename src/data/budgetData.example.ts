/**
 * FICHIER EXEMPLE - Données budgétaires fictives pour le développement
 *
 * Copiez ce fichier vers budgetData.ts et remplacez les valeurs
 * par les données réelles du projet.
 *
 * NOTE: budgetData.ts est ignoré par git pour protéger les données sensibles.
 */

import type { BudgetItem } from '@/types';

// Budget global du projet (en XOF) - VALEUR FICTIVE
export const PROJECT_BUDGET = 100000000;

// Données budgétaires détaillées - VALEURS FICTIVES
export const budgetData: Omit<BudgetItem, 'id'>[] = [
  // Études
  { libelle: 'Études architecturales', categorie: 'etudes', axe: 'axe3_technique', montantPrevu: 5000000, montantEngage: 5000000, montantRealise: 4000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { libelle: 'Études techniques', categorie: 'etudes', axe: 'axe3_technique', montantPrevu: 3000000, montantEngage: 3000000, montantRealise: 2800000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { libelle: 'Études environnementales', categorie: 'etudes', axe: 'axe3_technique', montantPrevu: 1600000, montantEngage: 1600000, montantRealise: 1500000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Travaux
  { libelle: 'Fondations', categorie: 'travaux', axe: 'axe3_technique', montantPrevu: 16000000, montantEngage: 15000000, montantRealise: 13000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { libelle: 'Gros œuvre', categorie: 'travaux', axe: 'axe3_technique', montantPrevu: 30000000, montantEngage: 24000000, montantRealise: 9000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { libelle: 'Second œuvre', categorie: 'travaux', axe: 'axe3_technique', montantPrevu: 20000000, montantEngage: 6000000, montantRealise: 1000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Équipements
  { libelle: 'Équipements électriques', categorie: 'equipements', axe: 'axe3_technique', montantPrevu: 8000000, montantEngage: 7000000, montantRealise: 2000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { libelle: 'Climatisation', categorie: 'equipements', axe: 'axe3_technique', montantPrevu: 7000000, montantEngage: 4000000, montantRealise: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { libelle: 'Ascenseurs', categorie: 'equipements', axe: 'axe3_technique', montantPrevu: 5000000, montantEngage: 0, montantRealise: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Honoraires
  { libelle: 'Maîtrise d\'œuvre', categorie: 'honoraires', axe: 'axe3_technique', montantPrevu: 3000000, montantEngage: 3000000, montantRealise: 1600000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { libelle: 'Conseils juridiques', categorie: 'honoraires', axe: 'axe4_budget', montantPrevu: 1000000, montantEngage: 800000, montantRealise: 500000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Assurances
  { libelle: 'Assurance chantier', categorie: 'assurances', axe: 'axe4_budget', montantPrevu: 600000, montantEngage: 600000, montantRealise: 600000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Divers
  { libelle: 'Frais administratifs', categorie: 'divers', axe: 'axe4_budget', montantPrevu: 1000000, montantEngage: 800000, montantRealise: 600000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { libelle: 'Communication', categorie: 'divers', axe: 'axe5_marketing', montantPrevu: 2000000, montantEngage: 1000000, montantRealise: 400000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
