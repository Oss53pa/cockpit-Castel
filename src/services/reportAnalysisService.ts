// ============================================================================
// SERVICE D'ANALYSE AUTOMATIQUE POUR LES RAPPORTS
// Génère des commentaires, insights et recommandations basés sur les données
// ============================================================================

import type { Action, Jalon, Risque, Alerte } from '@/types';
import type { SyncStatusResult, CategoryProgress, SyncAlert, SyncAction } from '@/types/sync.types';

// Types d'analyse
export type AnalysisType = 'critical' | 'warning' | 'info' | 'success';

export interface AnalysisItem {
  type: AnalysisType;
  title: string;
  message: string;
  recommendation?: string;
  priority: number; // 1 = highest
}

export interface ExecutiveSummary {
  overallStatus: 'good' | 'warning' | 'critical';
  statusMessage: string;
  keyMetrics: {
    label: string;
    value: string | number;
    status: 'good' | 'warning' | 'bad';
    trend?: 'up' | 'down' | 'stable';
  }[];
  topPriorities: AnalysisItem[];
  achievements: string[];
  risks: string[];
}

// ============================================================================
// ANALYSE DES ACTIONS
// ============================================================================
export function analyzeActions(actions: Action[]): AnalysisItem[] {
  const analyses: AnalysisItem[] = [];

  // Actions bloquées
  const blockedActions = actions.filter(a => a.statut === 'bloque');
  if (blockedActions.length > 0) {
    analyses.push({
      type: 'critical',
      title: `${blockedActions.length} action(s) bloquee(s)`,
      message: `Les actions suivantes sont bloquees: ${blockedActions.slice(0, 3).map(a => a.titre).join(', ')}${blockedActions.length > 3 ? '...' : ''}`,
      recommendation: 'Organiser une reunion de deblocage en urgence. Identifier les responsables et les ressources necessaires.',
      priority: 1,
    });
  }

  // Actions en retard (date fin dépassée et non terminée)
  const today = new Date();
  const lateActions = actions.filter(a => {
    if (a.statut === 'termine' || a.statut === 'annule') return false;
    if (!a.date_fin_prevue) return false;
    return new Date(a.date_fin_prevue) < today;
  });

  if (lateActions.length > 0) {
    const criticalLate = lateActions.filter(a => {
      const daysDiff = Math.floor((today.getTime() - new Date(a.date_fin_prevue!).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 7;
    });

    if (criticalLate.length > 0) {
      analyses.push({
        type: 'critical',
        title: `${criticalLate.length} action(s) en retard critique (> 7 jours)`,
        message: `Actions concernees: ${criticalLate.slice(0, 3).map(a => a.titre).join(', ')}`,
        recommendation: 'Revoir immediatement le planning et reallouer les ressources. Escalader si necessaire.',
        priority: 1,
      });
    }

    if (lateActions.length > criticalLate.length) {
      analyses.push({
        type: 'warning',
        title: `${lateActions.length - criticalLate.length} action(s) en retard`,
        message: 'Ces actions ont depasse leur date de fin prevue mais restent rattrapables.',
        recommendation: 'Accelerer la realisation et mettre a jour les dates de fin.',
        priority: 3,
      });
    }
  }

  // Actions sans avancement depuis longtemps (en cours avec 0%)
  const stuckActions = actions.filter(a => a.statut === 'en_cours' && a.avancement === 0);
  if (stuckActions.length > 0) {
    analyses.push({
      type: 'warning',
      title: `${stuckActions.length} action(s) en cours sans avancement`,
      message: 'Ces actions sont marquees "en cours" mais n\'ont aucun avancement enregistre.',
      recommendation: 'Verifier si le travail a reellement commence ou si le statut doit etre corrige.',
      priority: 2,
    });
  }

  // Actions à planifier
  const toSchedule = actions.filter(a => a.statut === 'a_planifier');
  if (toSchedule.length > 5) {
    analyses.push({
      type: 'info',
      title: `${toSchedule.length} actions en attente de planification`,
      message: 'Un nombre important d\'actions reste a planifier.',
      recommendation: 'Organiser une session de planification pour definir les dates et responsables.',
      priority: 4,
    });
  }

  // Taux de complétion
  const completed = actions.filter(a => a.statut === 'termine').length;
  const total = actions.filter(a => a.statut !== 'annule').length;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  if (completionRate >= 80) {
    analyses.push({
      type: 'success',
      title: 'Excellent taux de completion des actions',
      message: `${Math.round(completionRate)}% des actions sont terminees. L'equipe maintient un bon rythme.`,
      priority: 5,
    });
  }

  return analyses;
}

// ============================================================================
// ANALYSE DES JALONS
// ============================================================================
export function analyzeJalons(jalons: Jalon[]): AnalysisItem[] {
  const analyses: AnalysisItem[] = [];
  const today = new Date();

  // Jalons dépassés
  const overdueJalons = jalons.filter(j => j.statut === 'depasse');
  if (overdueJalons.length > 0) {
    analyses.push({
      type: 'critical',
      title: `${overdueJalons.length} jalon(s) depasse(s)`,
      message: `Jalons concernes: ${overdueJalons.map(j => j.titre).join(', ')}`,
      recommendation: 'Analyser les causes du retard. Revoir le planning global et communiquer aux parties prenantes.',
      priority: 1,
    });
  }

  // Jalons en danger
  const atRiskJalons = jalons.filter(j => j.statut === 'en_danger');
  if (atRiskJalons.length > 0) {
    analyses.push({
      type: 'warning',
      title: `${atRiskJalons.length} jalon(s) en danger`,
      message: `Ces jalons risquent de ne pas etre atteints: ${atRiskJalons.map(j => j.titre).join(', ')}`,
      recommendation: 'Mettre en place des actions correctives immediates. Renforcer les ressources si necessaire.',
      priority: 2,
    });
  }

  // Jalons à venir dans les 7 prochains jours
  const upcomingJalons = jalons.filter(j => {
    if (j.statut === 'atteint') return false;
    if (!j.date_prevue) return false;
    const jalonDate = new Date(j.date_prevue);
    const daysDiff = Math.floor((jalonDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 7;
  });

  if (upcomingJalons.length > 0) {
    analyses.push({
      type: 'info',
      title: `${upcomingJalons.length} jalon(s) a venir cette semaine`,
      message: `Jalons: ${upcomingJalons.map(j => `${j.titre} (${new Date(j.date_prevue!).toLocaleDateString('fr-FR')})`).join(', ')}`,
      recommendation: 'S\'assurer que tous les prerequis sont prets pour la validation.',
      priority: 3,
    });
  }

  // Taux de réussite
  const achieved = jalons.filter(j => j.statut === 'atteint').length;
  const total = jalons.length;
  const successRate = total > 0 ? (achieved / total) * 100 : 0;

  if (successRate >= 75 && achieved > 0) {
    analyses.push({
      type: 'success',
      title: 'Bon taux d\'atteinte des jalons',
      message: `${achieved} jalon(s) atteint(s) sur ${total} (${Math.round(successRate)}%).`,
      priority: 5,
    });
  } else if (successRate < 50 && total > 3) {
    analyses.push({
      type: 'warning',
      title: 'Taux d\'atteinte des jalons insuffisant',
      message: `Seulement ${Math.round(successRate)}% des jalons ont ete atteints.`,
      recommendation: 'Revoir la planification et les moyens alloues au projet.',
      priority: 2,
    });
  }

  return analyses;
}

// ============================================================================
// ANALYSE BUDGET & EVM
// ============================================================================
export function analyzeBudget(
  budgetSynthese: { prevu: number; engage: number; realise: number; tauxEngagement: number; tauxRealisation: number; ecartRealisation: number },
  evmIndicators: { SPI: number; CPI: number; SV: number; CV: number; EAC: number; BAC: number; VAC: number }
): AnalysisItem[] {
  const analyses: AnalysisItem[] = [];

  // Dépassement budgétaire
  if (budgetSynthese.ecartRealisation < 0) {
    const depassementPct = Math.abs(budgetSynthese.ecartRealisation / budgetSynthese.prevu) * 100;
    if (depassementPct > 10) {
      analyses.push({
        type: 'critical',
        title: 'Depassement budgetaire significatif',
        message: `Le budget realise depasse le prevu de ${Math.round(depassementPct)}% (${Math.abs(budgetSynthese.ecartRealisation).toLocaleString('fr-FR')} FCFA).`,
        recommendation: 'Analyser les causes du depassement. Revoir les postes de depenses et negocier si possible.',
        priority: 1,
      });
    } else {
      analyses.push({
        type: 'warning',
        title: 'Leger depassement budgetaire',
        message: `Le budget realise depasse le prevu de ${Math.round(depassementPct)}%.`,
        recommendation: 'Surveiller de pres les depenses futures.',
        priority: 3,
      });
    }
  }

  // Analyse SPI (Schedule Performance Index)
  if (evmIndicators.SPI < 0.9) {
    analyses.push({
      type: 'critical',
      title: 'Retard significatif du projet (SPI)',
      message: `Le SPI de ${evmIndicators.SPI.toFixed(2)} indique que le projet realise seulement ${Math.round(evmIndicators.SPI * 100)}% de ce qui etait prevu.`,
      recommendation: 'Accelerer les travaux, ajouter des ressources ou revoir le planning.',
      priority: 1,
    });
  } else if (evmIndicators.SPI < 1) {
    analyses.push({
      type: 'warning',
      title: 'Leger retard du projet',
      message: `Le SPI de ${evmIndicators.SPI.toFixed(2)} indique un retard de ${Math.round((1 - evmIndicators.SPI) * 100)}% par rapport au planning.`,
      recommendation: 'Maintenir la vigilance et accelerer si possible.',
      priority: 3,
    });
  } else if (evmIndicators.SPI >= 1.05) {
    analyses.push({
      type: 'success',
      title: 'Projet en avance sur le planning',
      message: `Le SPI de ${evmIndicators.SPI.toFixed(2)} indique une avance de ${Math.round((evmIndicators.SPI - 1) * 100)}%.`,
      priority: 5,
    });
  }

  // Analyse CPI (Cost Performance Index)
  if (evmIndicators.CPI < 0.9) {
    analyses.push({
      type: 'critical',
      title: 'Performance cout defavorable (CPI)',
      message: `Le CPI de ${evmIndicators.CPI.toFixed(2)} indique que chaque franc depense ne rapporte que ${Math.round(evmIndicators.CPI * 100)} centimes de valeur.`,
      recommendation: 'Optimiser les couts, negocier avec les fournisseurs, reduire les gaspillages.',
      priority: 1,
    });
  } else if (evmIndicators.CPI > 1.1) {
    analyses.push({
      type: 'success',
      title: 'Excellente performance cout',
      message: `Le CPI de ${evmIndicators.CPI.toFixed(2)} indique une economie de ${Math.round((evmIndicators.CPI - 1) * 100)}% par rapport au budget.`,
      priority: 5,
    });
  }

  // Estimation à l'achèvement (EAC vs BAC)
  const eacVariance = ((evmIndicators.EAC - evmIndicators.BAC) / evmIndicators.BAC) * 100;
  if (eacVariance > 15) {
    analyses.push({
      type: 'critical',
      title: 'Cout final estime en forte hausse',
      message: `L'EAC (${evmIndicators.EAC.toLocaleString('fr-FR')} FCFA) depasse le BAC de ${Math.round(eacVariance)}%.`,
      recommendation: 'Revoir le perimetre du projet ou debloquer un budget supplementaire.',
      priority: 1,
    });
  } else if (eacVariance > 5) {
    analyses.push({
      type: 'warning',
      title: 'Cout final estime en hausse',
      message: `L'EAC depasse le BAC initial de ${Math.round(eacVariance)}%.`,
      recommendation: 'Controler strictement les depenses restantes.',
      priority: 2,
    });
  }

  // Budget sous-consommé
  if (budgetSynthese.tauxRealisation < 30 && budgetSynthese.tauxEngagement < 50) {
    analyses.push({
      type: 'info',
      title: 'Faible consommation budgetaire',
      message: `Seulement ${Math.round(budgetSynthese.tauxRealisation)}% du budget a ete realise.`,
      recommendation: 'Verifier si le rythme de depense est coherent avec l\'avancement du projet.',
      priority: 4,
    });
  }

  return analyses;
}

// ============================================================================
// ANALYSE DES RISQUES
// ============================================================================
export function analyzeRisques(risques: Risque[]): AnalysisItem[] {
  const analyses: AnalysisItem[] = [];

  // Risques critiques (score >= 12)
  const criticalRisks = risques.filter(r => r.score >= 12 && r.status !== 'closed');
  if (criticalRisks.length > 0) {
    analyses.push({
      type: 'critical',
      title: `${criticalRisks.length} risque(s) critique(s) actif(s)`,
      message: `Risques: ${criticalRisks.map(r => r.titre).join(', ')}`,
      recommendation: 'Activer immediatement les plans de mitigation. Escalader au comite de pilotage.',
      priority: 1,
    });
  }

  // Risques élevés (score 8-11)
  const highRisks = risques.filter(r => r.score >= 8 && r.score < 12 && r.status !== 'closed');
  if (highRisks.length > 0) {
    analyses.push({
      type: 'warning',
      title: `${highRisks.length} risque(s) eleve(s) a surveiller`,
      message: 'Ces risques necessitent une attention particuliere et des actions preventives.',
      recommendation: 'Revoir les plans de mitigation et renforcer le monitoring.',
      priority: 2,
    });
  }

  // Risques sans plan de mitigation
  const risksWithoutPlan = risques.filter(r => !r.planMitigation && r.status !== 'closed' && r.score >= 4);
  if (risksWithoutPlan.length > 0) {
    analyses.push({
      type: 'warning',
      title: `${risksWithoutPlan.length} risque(s) sans plan de mitigation`,
      message: 'Ces risques n\'ont pas de strategie de reponse definie.',
      recommendation: 'Definir les plans de mitigation pour chaque risque actif.',
      priority: 2,
    });
  }

  // Risques matérialisés
  const materializedRisks = risques.filter(r => r.status === 'materialized');
  if (materializedRisks.length > 0) {
    analyses.push({
      type: 'critical',
      title: `${materializedRisks.length} risque(s) materialise(s)`,
      message: `Les risques suivants se sont concretises: ${materializedRisks.map(r => r.titre).join(', ')}`,
      recommendation: 'Activer les plans de contingence et evaluer l\'impact reel.',
      priority: 1,
    });
  }

  // Bonne gestion des risques
  const closedRisks = risques.filter(r => r.status === 'closed').length;
  if (closedRisks > 0 && closedRisks >= risques.length * 0.3) {
    analyses.push({
      type: 'success',
      title: 'Bonne gestion des risques',
      message: `${closedRisks} risque(s) ont ete ferme(s) avec succes.`,
      priority: 5,
    });
  }

  return analyses;
}

// ============================================================================
// ANALYSE DE LA SYNCHRONISATION
// ============================================================================
export function analyzeSync(
  syncStatus: SyncStatusResult | null,
  projectCategories: CategoryProgress[],
  mobilizationCategories: CategoryProgress[],
  alerts: SyncAlert[],
  actions: SyncAction[]
): AnalysisItem[] {
  const analyses: AnalysisItem[] = [];

  if (!syncStatus) return analyses;

  // Écart critique
  if (syncStatus.alertLevel === 'RED') {
    analyses.push({
      type: 'critical',
      title: 'Ecart de synchronisation critique',
      message: `L'ecart entre le projet (${Math.round(syncStatus.projectProgress)}%) et la mobilisation (${Math.round(syncStatus.mobilizationProgress)}%) est de ${Math.round(Math.abs(syncStatus.gap))}%.`,
      recommendation: syncStatus.gap > 0
        ? 'Accelerer la mobilisation pour rattraper le projet. Prioriser les recrutements et contrats.'
        : 'La mobilisation avance plus vite que le projet. Verifier l\'avancement chantier.',
      priority: 1,
    });
  } else if (syncStatus.alertLevel === 'ORANGE') {
    analyses.push({
      type: 'warning',
      title: 'Ecart de synchronisation a surveiller',
      message: `Ecart de ${Math.round(Math.abs(syncStatus.gap))}% entre projet et mobilisation.`,
      recommendation: 'Maintenir une surveillance active et ajuster les priorites si necessaire.',
      priority: 2,
    });
  }

  // Catégories en retard (projet)
  const laggedProjectCats = projectCategories.filter(c => c.progress < 30 && c.itemsCount > 0);
  if (laggedProjectCats.length > 0) {
    analyses.push({
      type: 'warning',
      title: `${laggedProjectCats.length} categorie(s) projet en retard`,
      message: `Categories concernees: ${laggedProjectCats.map(c => c.categoryName).join(', ')}`,
      recommendation: 'Concentrer les efforts sur ces lots pour rattraper le retard.',
      priority: 3,
    });
  }

  // Catégories en retard (mobilisation)
  const laggedMobCats = mobilizationCategories.filter(c => c.progress < 30 && c.itemsCount > 0);
  if (laggedMobCats.length > 0) {
    analyses.push({
      type: 'warning',
      title: `${laggedMobCats.length} categorie(s) mobilisation en retard`,
      message: `Categories concernees: ${laggedMobCats.map(c => c.categoryName).join(', ')}`,
      recommendation: 'Accelerer les processus RH, contrats et approvisionnements.',
      priority: 3,
    });
  }

  // Alertes non traitées
  const unacknowledgedAlerts = alerts.filter(a => !a.isAcknowledged);
  if (unacknowledgedAlerts.length > 3) {
    analyses.push({
      type: 'warning',
      title: `${unacknowledgedAlerts.length} alertes sync non traitees`,
      message: 'Un nombre important d\'alertes de synchronisation attend une action.',
      recommendation: 'Traiter les alertes en priorite pour eviter l\'accumulation.',
      priority: 2,
    });
  }

  // Actions correctives en attente
  const pendingActions = actions.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
  if (pendingActions.length > 0) {
    const urgentActions = pendingActions.filter(a => a.priority === 'URGENT' || a.priority === 'HIGH');
    if (urgentActions.length > 0) {
      analyses.push({
        type: 'warning',
        title: `${urgentActions.length} action(s) corrective(s) urgente(s)`,
        message: 'Des actions de synchronisation prioritaires sont en cours.',
        recommendation: 'S\'assurer que les responsables ont les moyens de les traiter rapidement.',
        priority: 2,
      });
    }
  }

  // Bonne synchronisation
  if (syncStatus.status === 'SYNC' && syncStatus.alertLevel === 'GREEN') {
    analyses.push({
      type: 'success',
      title: 'Projet et mobilisation bien synchronises',
      message: `L'ecart de ${Math.round(Math.abs(syncStatus.gap))}% est dans la tolerance acceptable.`,
      priority: 5,
    });
  }

  return analyses;
}

// ============================================================================
// ANALYSE DES ALERTES
// ============================================================================
export function analyzeAlertes(alertes: Alerte[]): AnalysisItem[] {
  const analyses: AnalysisItem[] = [];

  const untreatedAlertes = alertes.filter(a => !a.traitee);
  const criticalUntreated = untreatedAlertes.filter(a => a.criticite === 'critical');
  const highUntreated = untreatedAlertes.filter(a => a.criticite === 'high');

  if (criticalUntreated.length > 0) {
    analyses.push({
      type: 'critical',
      title: `${criticalUntreated.length} alerte(s) critique(s) non traitee(s)`,
      message: `Alertes: ${criticalUntreated.slice(0, 3).map(a => a.titre).join(', ')}`,
      recommendation: 'Traiter ces alertes immediatement. Elles peuvent bloquer le projet.',
      priority: 1,
    });
  }

  if (highUntreated.length > 0) {
    analyses.push({
      type: 'warning',
      title: `${highUntreated.length} alerte(s) haute priorite non traitee(s)`,
      message: 'Ces alertes necessitent une attention rapide.',
      recommendation: 'Planifier le traitement dans les 48h.',
      priority: 2,
    });
  }

  // Accumulation d'alertes
  if (untreatedAlertes.length > 10) {
    analyses.push({
      type: 'warning',
      title: 'Accumulation d\'alertes non traitees',
      message: `${untreatedAlertes.length} alertes sont en attente de traitement.`,
      recommendation: 'Organiser une session de revue et traitement des alertes.',
      priority: 3,
    });
  }

  return analyses;
}

// ============================================================================
// GENERATION DU RESUME EXECUTIF
// ============================================================================
export function generateExecutiveSummary(
  analyses: {
    actions: AnalysisItem[];
    jalons: AnalysisItem[];
    budget: AnalysisItem[];
    risques: AnalysisItem[];
    sync: AnalysisItem[];
    alertes: AnalysisItem[];
  },
  kpis: {
    projectProgress: number;
    mobilizationProgress: number;
    budgetRealization: number;
    jalonsAtteints: number;
    jalonsTotal: number;
    actionsCompleted: number;
    actionsTotal: number;
    criticalRisks: number;
    spi: number;
    cpi: number;
  }
): ExecutiveSummary {
  // Rassembler toutes les analyses
  const allAnalyses = [
    ...analyses.actions,
    ...analyses.jalons,
    ...analyses.budget,
    ...analyses.risques,
    ...analyses.sync,
    ...analyses.alertes,
  ];

  // Déterminer le statut global
  const criticalCount = allAnalyses.filter(a => a.type === 'critical').length;
  const warningCount = allAnalyses.filter(a => a.type === 'warning').length;

  let overallStatus: 'good' | 'warning' | 'critical';
  let statusMessage: string;

  if (criticalCount > 0) {
    overallStatus = 'critical';
    statusMessage = `${criticalCount} point(s) critique(s) necessitent une attention immediate.`;
  } else if (warningCount > 3) {
    overallStatus = 'warning';
    statusMessage = `${warningCount} points de vigilance identifies. Le projet necessite une surveillance renforcee.`;
  } else if (warningCount > 0) {
    overallStatus = 'warning';
    statusMessage = `Quelques points de vigilance mais le projet reste sous controle.`;
  } else {
    overallStatus = 'good';
    statusMessage = 'Le projet progresse bien. Tous les indicateurs sont au vert.';
  }

  // Métriques clés
  const keyMetrics: ExecutiveSummary['keyMetrics'] = [
    {
      label: 'Avancement Projet',
      value: `${Math.round(kpis.projectProgress)}%`,
      status: kpis.projectProgress >= 80 ? 'good' : kpis.projectProgress >= 50 ? 'warning' : 'bad',
      trend: kpis.spi >= 1 ? 'up' : kpis.spi >= 0.95 ? 'stable' : 'down',
    },
    {
      label: 'Avancement Mobilisation',
      value: `${Math.round(kpis.mobilizationProgress)}%`,
      status: kpis.mobilizationProgress >= 80 ? 'good' : kpis.mobilizationProgress >= 50 ? 'warning' : 'bad',
    },
    {
      label: 'Budget',
      value: `${Math.round(kpis.budgetRealization)}%`,
      status: kpis.cpi >= 1 ? 'good' : kpis.cpi >= 0.9 ? 'warning' : 'bad',
      trend: kpis.cpi >= 1 ? 'up' : kpis.cpi >= 0.95 ? 'stable' : 'down',
    },
    {
      label: 'Jalons',
      value: `${kpis.jalonsAtteints}/${kpis.jalonsTotal}`,
      status: kpis.jalonsTotal > 0 && (kpis.jalonsAtteints / kpis.jalonsTotal) >= 0.7 ? 'good' :
        (kpis.jalonsAtteints / kpis.jalonsTotal) >= 0.5 ? 'warning' : 'bad',
    },
    {
      label: 'SPI',
      value: kpis.spi.toFixed(2),
      status: kpis.spi >= 1 ? 'good' : kpis.spi >= 0.9 ? 'warning' : 'bad',
    },
    {
      label: 'CPI',
      value: kpis.cpi.toFixed(2),
      status: kpis.cpi >= 1 ? 'good' : kpis.cpi >= 0.9 ? 'warning' : 'bad',
    },
    {
      label: 'Risques critiques',
      value: kpis.criticalRisks,
      status: kpis.criticalRisks === 0 ? 'good' : kpis.criticalRisks <= 2 ? 'warning' : 'bad',
    },
  ];

  // Top priorités (les plus critiques)
  const topPriorities = allAnalyses
    .filter(a => a.type === 'critical' || a.type === 'warning')
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);

  // Réussites
  const achievements = allAnalyses
    .filter(a => a.type === 'success')
    .map(a => a.message);

  // Risques principaux
  const risks = allAnalyses
    .filter(a => a.type === 'critical')
    .map(a => a.message);

  return {
    overallStatus,
    statusMessage,
    keyMetrics,
    topPriorities,
    achievements,
    risks,
  };
}

// ============================================================================
// GENERATION DE COMMENTAIRES PAR SECTION
// ============================================================================
export function generateSectionComment(
  section: string,
  data: {
    completionRate?: number;
    trend?: 'up' | 'down' | 'stable';
    keyFigures?: { label: string; value: string | number }[];
    issues?: string[];
  }
): string {
  let comment = '';

  switch (section) {
    case 'actions':
      if (data.completionRate !== undefined) {
        if (data.completionRate >= 80) {
          comment = `Excellent taux de completion (${Math.round(data.completionRate)}%). L'equipe maintient un bon rythme d'execution.`;
        } else if (data.completionRate >= 50) {
          comment = `Taux de completion de ${Math.round(data.completionRate)}%. Progression satisfaisante mais des efforts restent necessaires.`;
        } else {
          comment = `Taux de completion de seulement ${Math.round(data.completionRate)}%. Une acceleration est necessaire.`;
        }
      }
      break;

    case 'jalons':
      if (data.completionRate !== undefined) {
        if (data.completionRate >= 70) {
          comment = `${Math.round(data.completionRate)}% des jalons atteints. Le projet respecte globalement ses engagements.`;
        } else if (data.completionRate >= 40) {
          comment = `${Math.round(data.completionRate)}% des jalons atteints. Certains retards sont a rattraper.`;
        } else {
          comment = `Seulement ${Math.round(data.completionRate)}% des jalons atteints. Une revue du planning s'impose.`;
        }
      }
      break;

    case 'budget':
      comment = 'Suivi budgetaire base sur la methode EVM (Earned Value Management). ';
      if (data.keyFigures) {
        const spi = data.keyFigures.find(f => f.label === 'SPI');
        const cpi = data.keyFigures.find(f => f.label === 'CPI');
        if (spi && typeof spi.value === 'number') {
          comment += spi.value >= 1 ? 'Planning respecte. ' : `Retard de ${Math.round((1 - spi.value) * 100)}% vs planning. `;
        }
        if (cpi && typeof cpi.value === 'number') {
          comment += cpi.value >= 1 ? 'Couts maitrises.' : `Surcout de ${Math.round((1 - cpi.value) * 100)}%.`;
        }
      }
      break;

    case 'risques':
      if (data.issues && data.issues.length > 0) {
        comment = `${data.issues.length} point(s) d'attention identifies. Une gestion proactive des risques est essentielle.`;
      } else {
        comment = 'Les risques sont identifies et sous controle. Maintenir la vigilance.';
      }
      break;

    case 'sync':
      comment = 'La synchronisation entre le projet (construction) et la mobilisation (exploitation) est cle pour une ouverture reussie.';
      break;
  }

  return comment;
}
