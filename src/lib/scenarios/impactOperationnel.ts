/**
 * Module d'impact opérationnel — Fonctions pures
 * Calcul de l'impact sur les actions, jalons, et cascades pour les scénarios EXCO
 */

import type { Action, Jalon } from '@/types';
import type { InterdependencyGraph } from '@/types/interdependency.types';
import type { ConfigPropagation } from '@/types/parametresMetier';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ============================================================================
// INTERFACES DE RÉSULTAT
// ============================================================================

export interface ImpactActions {
  actions_nouvellement_en_retard: number;
  taux_completion_projete: number;
  velocite_actuelle: number;       // actions/semaine
  velocite_requise: number;        // actions/semaine pour finir à temps
  ratio_acceleration: number;      // plafonné à 10
  actions_critiques_impactees: number;
}

export interface ImpactJalons {
  jalons_inatteignables: number;
  jalons_glisses: number;
  glissement_moyen_jours: number;
  jalon_critique_principal: { id: number; titre: string; cascades: number } | null;
}

export interface CascadeAnalysis {
  profondeur_max: number;
  elements_impactes_total: number;
  axes_impactes: string[];
  actions_marge_nulle: number;
}

// ============================================================================
// CALCUL D'IMPACT SUR LES ACTIONS
// ============================================================================

export function calculerImpactActions(
  actions: Action[],
  joursRestants: number,
  moisReport: number,
  config: ConfigPropagation
): ImpactActions {
  if (actions.length === 0) {
    return {
      actions_nouvellement_en_retard: 0,
      taux_completion_projete: 100,
      velocite_actuelle: 0,
      velocite_requise: 0,
      ratio_acceleration: 0,
      actions_critiques_impactees: 0,
    };
  }

  const now = new Date();
  const reportMs = moisReport * 30 * MS_PER_DAY;

  // Actions actuellement terminées
  const terminees = actions.filter(a => a.statut === 'termine');
  const nonTerminees = actions.filter(a => a.statut !== 'termine');

  // Actions nouvellement en retard avec le report
  let nouvellementEnRetard = 0;
  for (const action of nonTerminees) {
    const dateFinMs = new Date(action.date_fin_prevue).getTime();
    const isDejaEnRetard = dateFinMs < now.getTime();
    const seraEnRetard = dateFinMs < (now.getTime() + reportMs);
    if (!isDejaEnRetard && seraEnRetard) {
      nouvellementEnRetard++;
    }
  }

  // Vélocité actuelle : actions terminées dans les N dernières semaines
  const fenetreSemaines = config.velocite_fenetre_semaines;
  const fenetreMs = fenetreSemaines * 7 * MS_PER_DAY;
  const dateDebutFenetre = new Date(now.getTime() - fenetreMs);
  const actionsTermineesRecemment = terminees.filter(a => {
    if (!a.date_fin_reelle) return false;
    return new Date(a.date_fin_reelle) >= dateDebutFenetre;
  }).length;

  const velociteActuelle = fenetreSemaines > 0 ? actionsTermineesRecemment / fenetreSemaines : 0;

  // Vélocité requise pour finir à temps après le report
  const semainesRestantes = Math.max(1, (joursRestants - moisReport * 30) / 7);
  const actionsRestantes = nonTerminees.length;
  const velociteRequise = actionsRestantes / semainesRestantes;

  // Ratio d'accélération, plafonné à 10
  const ratioAcceleration = Math.min(10, velociteRequise / Math.max(0.1, velociteActuelle));

  // Taux de complétion projeté
  const actionsProjetees = Math.round(velociteActuelle * semainesRestantes);
  const tauxCompletionProjete = Math.min(100,
    Math.round(((terminees.length + actionsProjetees) / actions.length) * 100)
  );

  // Actions critiques impactées (priorité haute ou critique)
  const actionsCritiques = nonTerminees.filter(a =>
    a.priorite === 'critique' || a.priorite === 'haute'
  ).length;

  return {
    actions_nouvellement_en_retard: nouvellementEnRetard,
    taux_completion_projete: tauxCompletionProjete,
    velocite_actuelle: Math.round(velociteActuelle * 10) / 10,
    velocite_requise: Math.round(velociteRequise * 10) / 10,
    ratio_acceleration: Math.round(ratioAcceleration * 10) / 10,
    actions_critiques_impactees: actionsCritiques,
  };
}

// ============================================================================
// CALCUL D'IMPACT SUR LES JALONS
// ============================================================================

export function calculerImpactJalons(
  jalons: Jalon[],
  actions: Action[],
  joursRestants: number,
  moisReport: number,
  dateSoftOpening: string
): ImpactJalons {
  if (jalons.length === 0) {
    return {
      jalons_inatteignables: 0,
      jalons_glisses: 0,
      glissement_moyen_jours: 0,
      jalon_critique_principal: null,
    };
  }

  const now = new Date();
  const reportMs = moisReport * 30 * MS_PER_DAY;
  const softOpeningMs = new Date(dateSoftOpening).getTime();

  let jalonsInatteignables = 0;
  let jalonsGlisses = 0;
  let totalGlissement = 0;
  let jalonCritique: { id: number; titre: string; cascades: number } | null = null;
  let maxCascades = 0;

  for (const jalon of jalons) {
    if (jalon.statut === 'ATTEINT' || !jalon.id) continue;

    const datePrevueMs = new Date(jalon.date_prevue).getTime();

    // Avec le report, la date projetée glisse
    const dateProjetee = jalon.date_projetee
      ? new Date(jalon.date_projetee).getTime()
      : datePrevueMs;
    const dateProjeteeAvecReport = dateProjetee + reportMs;

    if (dateProjeteeAvecReport > softOpeningMs) {
      jalonsInatteignables++;
    }

    const glissement = Math.round((dateProjeteeAvecReport - datePrevueMs) / MS_PER_DAY);
    if (glissement > 0) {
      jalonsGlisses++;
      totalGlissement += glissement;
    }

    // Compter les cascades (actions liées)
    const cascades = actions.filter(a => a.jalonId === jalon.id).length;
    if (cascades > maxCascades) {
      maxCascades = cascades;
      jalonCritique = { id: jalon.id, titre: jalon.titre, cascades };
    }
  }

  const jalonsNonAtteints = jalons.filter(j => j.statut !== 'ATTEINT').length;

  return {
    jalons_inatteignables: jalonsInatteignables,
    jalons_glisses: jalonsGlisses,
    glissement_moyen_jours: jalonsGlisses > 0 ? Math.round(totalGlissement / jalonsGlisses) : 0,
    jalon_critique_principal: jalonCritique,
  };
}

// ============================================================================
// ANALYSE DES CASCADES VIA CPM
// ============================================================================

export function analyserCascades(
  graph: InterdependencyGraph,
  moisReport: number
): CascadeAnalysis {
  if (!graph || graph.nodes.size === 0) {
    return {
      profondeur_max: 0,
      elements_impactes_total: 0,
      axes_impactes: [],
      actions_marge_nulle: 0,
    };
  }

  const reportDays = moisReport * 30;
  const axesImpactes = new Set<string>();
  let actionsMargenulle = 0;
  let profondeurMax = 0;

  // Count nodes with zero slack (critical path)
  for (const [, node] of graph.nodes) {
    if (node.slack === 0 || node.isCritical) {
      actionsMargenulle++;
      if (node.action?.axe) {
        axesImpactes.add(node.action.axe);
      }
    }
  }

  // Calculate cascade depth via BFS from critical path nodes
  const criticalNodes = graph.criticalPath || [];
  if (criticalNodes.length > 0) {
    const visited = new Set<string>();
    let frontier = new Set(criticalNodes);
    let depth = 0;

    while (frontier.size > 0) {
      depth++;
      const nextFrontier = new Set<string>();
      for (const nodeId of frontier) {
        visited.add(nodeId);
        // Find successors
        const successorEdges = graph.edges.filter(e => e.sourceId === nodeId);
        for (const edge of successorEdges) {
          if (!visited.has(edge.targetId)) {
            nextFrontier.add(edge.targetId);
            const targetNode = graph.nodes.get(edge.targetId);
            if (targetNode?.action?.axe) {
              axesImpactes.add(targetNode.action.axe);
            }
          }
        }
      }
      frontier = nextFrontier;
    }
    profondeurMax = depth;
  }

  return {
    profondeur_max: profondeurMax,
    elements_impactes_total: graph.stats.criticalActions + (graph.stats.blockedActions || 0),
    axes_impactes: Array.from(axesImpactes),
    actions_marge_nulle: actionsMargenulle,
  };
}
