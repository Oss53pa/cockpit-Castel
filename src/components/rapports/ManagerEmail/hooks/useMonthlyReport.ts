// ============================================================================
// HOOK - Données pour le Rapport Mensuel Manager
// ============================================================================

import { useMemo } from 'react';
import { useActions, useJalons, useUsers, useDashboardKPIs, useCurrentSite, useSites } from '@/hooks';
import type { Action, Jalon, User } from '@/types';
import { PROJET_CONFIG } from '@/data/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface MonthlyReportData {
  // Période
  mois: number;
  annee: number;
  periodeLabel: string;
  debutMois: Date;
  finMois: Date;

  // Projet
  projectName: string;
  joursRestants: number;
  dateOuverture: string;

  // Actions
  actionsduMois: Action[];
  actionsEnRetard: Action[];
  actionsTerminees: Action[];
  actionsByAxe: Record<string, Action[]>;

  // Jalons
  jalonsduMois: Jalon[];
  jalonsEnDanger: Jalon[];
  jalonsAtteints: Jalon[];

  // Récapitulatif par responsable
  recapParResponsable: ResponsableSummary[];

  // Managers
  managers: User[];

  // Stats
  stats: {
    totalActions: number;
    totalJalons: number;
    actionsEnRetard: number;
    actionsTerminees: number;
    jalonsEnDanger: number;
    jalonsAtteints: number;
  };

  // État
  isLoading: boolean;
}

export interface ResponsableSummary {
  id: string;
  nom: string;
  email?: string;
  actions: number;
  actionsEnRetard: number;
  jalons: number;
  jalonsEnDanger: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const AXE_LABELS: Record<string, string> = {
  'axe1_rh': 'AXE 1 - RH & Organisation',
  'axe2_commercial': 'AXE 2 - Commercialisation',
  'axe3_technique': 'AXE 3 - Technique & Handover',
  'axe4_budget': 'AXE 4 - Budget & Pilotage',
  'axe5_marketing': 'AXE 5 - Marketing & Communication',
  'axe6_exploitation': 'AXE 6 - Exploitation & Systèmes',
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtient le début et la fin d'un mois
 */
function getMonthBounds(mois: number, annee: number): { debut: Date; fin: Date } {
  const debut = new Date(annee, mois, 1);
  const fin = new Date(annee, mois + 1, 0, 23, 59, 59, 999);
  return { debut, fin };
}

/**
 * Formate une date en français
 */
function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Filtre les actions actives pendant un mois donné
 * Une action est active si elle chevauche la période du mois
 */
function filterActionsduMois(actions: Action[], debutMois: Date, finMois: Date): Action[] {
  return actions.filter(action => {
    if (!action.date_debut && !action.date_fin_prevue) return false;

    const dateDebut = action.date_debut ? new Date(action.date_debut) : new Date(action.date_fin_prevue!);
    const dateFinPrevue = action.date_fin_prevue ? new Date(action.date_fin_prevue) : dateDebut;

    // Action active pendant le mois (chevauche la période)
    return dateDebut <= finMois && dateFinPrevue >= debutMois;
  });
}

/**
 * Filtre les jalons du mois
 */
function filterJalonsduMois(jalons: Jalon[], debutMois: Date, finMois: Date): Jalon[] {
  return jalons.filter(jalon => {
    if (!jalon.date_prevue) return false;

    const datePrevue = new Date(jalon.date_prevue);
    return datePrevue >= debutMois && datePrevue <= finMois;
  });
}

/**
 * Identifie les actions en retard
 */
function getActionsEnRetard(actions: Action[]): Action[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return actions.filter(action => {
    if (!action.date_fin_prevue) return false;
    const dateFinPrevue = new Date(action.date_fin_prevue);
    return dateFinPrevue < today && (action.avancement || 0) < 100 && action.statut !== 'termine';
  });
}

/**
 * Identifie les actions terminées
 */
function getActionsTerminees(actions: Action[]): Action[] {
  return actions.filter(action =>
    action.statut === 'termine' || (action.avancement || 0) >= 100
  );
}

/**
 * Identifie les jalons en danger (non atteints avec date dépassée ou proche)
 */
function getJalonsEnDanger(jalons: Jalon[]): Jalon[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  return jalons.filter(jalon => {
    if (jalon.statut === 'atteint') return false;
    if (!jalon.date_prevue) return false;

    const datePrevue = new Date(jalon.date_prevue);
    // En retard ou à moins de 7 jours
    return datePrevue < today || (datePrevue <= in7Days && jalon.statut !== 'atteint');
  });
}

/**
 * Identifie les jalons atteints
 */
function getJalonsAtteints(jalons: Jalon[]): Jalon[] {
  return jalons.filter(jalon => jalon.statut === 'atteint');
}

/**
 * Groupe les actions par axe
 */
function groupActionsByAxe(actions: Action[]): Record<string, Action[]> {
  const grouped: Record<string, Action[]> = {};

  // Initialiser tous les axes
  Object.keys(AXE_LABELS).forEach(axe => {
    grouped[axe] = [];
  });

  // Grouper les actions
  actions.forEach(action => {
    const axe = action.axe || 'axe6_exploitation';
    if (!grouped[axe]) {
      grouped[axe] = [];
    }
    grouped[axe].push(action);
  });

  return grouped;
}

/**
 * Calcule le récapitulatif par responsable
 */
function calculateRecapParResponsable(
  actions: Action[],
  jalons: Jalon[],
  actionsEnRetard: Action[],
  jalonsEnDanger: Jalon[]
): ResponsableSummary[] {
  const recapMap = new Map<string, ResponsableSummary>();

  // Compter les actions par responsable
  actions.forEach(action => {
    const responsable = action.responsable || 'Non assigné';
    if (!recapMap.has(responsable)) {
      recapMap.set(responsable, {
        id: responsable,
        nom: responsable,
        actions: 0,
        actionsEnRetard: 0,
        jalons: 0,
        jalonsEnDanger: 0,
      });
    }
    const summary = recapMap.get(responsable)!;
    summary.actions++;
  });

  // Compter les actions en retard par responsable
  actionsEnRetard.forEach(action => {
    const responsable = action.responsable || 'Non assigné';
    const summary = recapMap.get(responsable);
    if (summary) {
      summary.actionsEnRetard++;
    }
  });

  // Compter les jalons par responsable
  jalons.forEach(jalon => {
    const responsable = jalon.responsable || 'Non assigné';
    if (!recapMap.has(responsable)) {
      recapMap.set(responsable, {
        id: responsable,
        nom: responsable,
        actions: 0,
        actionsEnRetard: 0,
        jalons: 0,
        jalonsEnDanger: 0,
      });
    }
    const summary = recapMap.get(responsable)!;
    summary.jalons++;
  });

  // Compter les jalons en danger par responsable
  jalonsEnDanger.forEach(jalon => {
    const responsable = jalon.responsable || 'Non assigné';
    const summary = recapMap.get(responsable);
    if (summary) {
      summary.jalonsEnDanger++;
    }
  });

  // Trier par nombre d'actions (décroissant)
  return Array.from(recapMap.values()).sort((a, b) => b.actions - a.actions);
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useMonthlyReport(mois?: number, annee?: number): MonthlyReportData {
  // Utiliser le mois courant si non spécifié
  const now = new Date();
  const targetMois = mois ?? now.getMonth();
  const targetAnnee = annee ?? now.getFullYear();

  // Hooks de données
  const actionsDb = useActions();
  const jalonsDb = useJalons();
  const usersDb = useUsers();
  const kpis = useDashboardKPIs();
  const currentSite = useCurrentSite();
  const allSites = useSites();

  // Site actif pour les données projet
  const site = currentSite || allSites.find(s => s.actif) || allSites[0];

  // Calculer les bornes du mois
  const { debut: debutMois, fin: finMois } = useMemo(
    () => getMonthBounds(targetMois, targetAnnee),
    [targetMois, targetAnnee]
  );

  // Période formatée
  const periodeLabel = useMemo(
    () => `${MOIS_FR[targetMois]} ${targetAnnee}`,
    [targetMois, targetAnnee]
  );

  // Filtrer les actions du mois
  const actionsduMois = useMemo(
    () => filterActionsduMois(actionsDb, debutMois, finMois),
    [actionsDb, debutMois, finMois]
  );

  // Actions en retard et terminées
  const actionsEnRetard = useMemo(
    () => getActionsEnRetard(actionsduMois),
    [actionsduMois]
  );

  const actionsTerminees = useMemo(
    () => getActionsTerminees(actionsduMois),
    [actionsduMois]
  );

  // Actions groupées par axe
  const actionsByAxe = useMemo(
    () => groupActionsByAxe(actionsduMois),
    [actionsduMois]
  );

  // Filtrer les jalons du mois
  const jalonsduMois = useMemo(
    () => filterJalonsduMois(jalonsDb, debutMois, finMois),
    [jalonsDb, debutMois, finMois]
  );

  // Jalons en danger et atteints
  const jalonsEnDanger = useMemo(
    () => getJalonsEnDanger(jalonsduMois),
    [jalonsduMois]
  );

  const jalonsAtteints = useMemo(
    () => getJalonsAtteints(jalonsduMois),
    [jalonsduMois]
  );

  // Récapitulatif par responsable
  const recapParResponsable = useMemo(
    () => calculateRecapParResponsable(actionsduMois, jalonsduMois, actionsEnRetard, jalonsEnDanger),
    [actionsduMois, jalonsduMois, actionsEnRetard, jalonsEnDanger]
  );

  // Managers (users avec rôle manager ou admin)
  const managers = useMemo(
    () => usersDb.filter(user =>
      user.role === 'manager' || user.role === 'admin' || user.role === 'responsable'
    ),
    [usersDb]
  );

  // Stats
  const stats = useMemo(() => ({
    totalActions: actionsduMois.length,
    totalJalons: jalonsduMois.length,
    actionsEnRetard: actionsEnRetard.length,
    actionsTerminees: actionsTerminees.length,
    jalonsEnDanger: jalonsEnDanger.length,
    jalonsAtteints: jalonsAtteints.length,
  }), [actionsduMois, jalonsduMois, actionsEnRetard, actionsTerminees, jalonsEnDanger, jalonsAtteints]);

  // État de chargement
  const isLoading = actionsDb.length === 0 && jalonsDb.length === 0;

  return {
    mois: targetMois,
    annee: targetAnnee,
    periodeLabel,
    debutMois,
    finMois,
    projectName: site?.nom ?? kpis.projectName ?? PROJET_CONFIG.nom,
    joursRestants: kpis.joursRestants || 0,
    dateOuverture: site?.dateOuverture ?? PROJET_CONFIG.jalonsClés.softOpening,
    actionsduMois,
    actionsEnRetard,
    actionsTerminees,
    actionsByAxe,
    jalonsduMois,
    jalonsEnDanger,
    jalonsAtteints,
    recapParResponsable,
    managers,
    stats,
    isLoading,
  };
}

// ============================================================================
// EXPORTS UTILITAIRES
// ============================================================================

export { MOIS_FR, AXE_LABELS, formatDateFr, getMonthBounds };
