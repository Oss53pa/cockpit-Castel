/**
 * Hook pour l'Analyse de Charge par Responsable
 * Calcule la charge de travail de chaque utilisateur
 */

import { useMemo } from 'react';
import { useActions } from './useActions';
import { useUsers } from './useUsers';
import type { Action, User } from '@/types';

export interface ResponsableWorkload {
  userId: number;
  fullName: string;
  email: string;
  totalActions: number;
  enCours: number;
  critiques: number;      // Priorité critique ou haute
  enRetard: number;
  bloquees: number;
  chargeScore: number;    // 0-100
  status: 'surcharge' | 'elevee' | 'normale' | 'faible';
}

export interface WorkloadAlert {
  userId: number;
  fullName: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface WorkloadData {
  responsables: ResponsableWorkload[];
  overloadedCount: number;
  alerts: WorkloadAlert[];
  totalActions: number;
  actionsNonAssignees: number;
}

/**
 * Calcule le score de charge d'un responsable
 * Formule: base = min(100, (totalActions / 20) * 50)
 *          penalties = critiques * 20 + enRetard * 15 + bloquees * 25
 *          chargeScore = min(100, base + penalties)
 */
function calculateChargeScore(
  totalActions: number,
  critiques: number,
  enRetard: number,
  bloquees: number
): number {
  const base = Math.min(100, (totalActions / 20) * 50);
  const penalties = critiques * 20 + enRetard * 15 + bloquees * 25;
  return Math.min(100, base + penalties);
}

/**
 * Détermine le statut de charge basé sur le score
 */
function getChargeStatus(score: number): 'surcharge' | 'elevee' | 'normale' | 'faible' {
  if (score > 80) return 'surcharge';
  if (score >= 60) return 'elevee';
  if (score >= 30) return 'normale';
  return 'faible';
}

/**
 * Génère les alertes pour les utilisateurs surchargés
 */
function generateAlerts(responsables: ResponsableWorkload[]): WorkloadAlert[] {
  const alerts: WorkloadAlert[] = [];

  for (const resp of responsables) {
    if (resp.status === 'surcharge') {
      alerts.push({
        userId: resp.userId,
        fullName: resp.fullName,
        message: `${resp.fullName} est en surcharge avec ${resp.totalActions} actions dont ${resp.critiques} critiques et ${resp.enRetard} en retard`,
        severity: 'critical',
      });
    } else if (resp.status === 'elevee' && resp.enRetard > 0) {
      alerts.push({
        userId: resp.userId,
        fullName: resp.fullName,
        message: `${resp.fullName} a ${resp.enRetard} action(s) en retard nécessitant une attention`,
        severity: 'warning',
      });
    } else if (resp.bloquees > 0) {
      alerts.push({
        userId: resp.userId,
        fullName: resp.fullName,
        message: `${resp.fullName} a ${resp.bloquees} action(s) bloquée(s) à débloquer`,
        severity: 'warning',
      });
    }
  }

  // Trier par sévérité
  alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return alerts;
}

/**
 * Hook principal pour l'analyse de charge
 */
export function useWorkloadAnalysis(): WorkloadData | null {
  const actions = useActions();
  const users = useUsers();

  return useMemo(() => {
    if (!actions || !users || users.length === 0) return null;

    const today = new Date().toISOString().split('T')[0];

    // Grouper les actions par responsable
    const actionsByUser = new Map<number, Action[]>();

    // Compteur pour actions non assignées
    let actionsNonAssignees = 0;

    for (const action of actions) {
      if (action.statut === 'termine' || action.statut === 'annule') continue;

      if (!action.responsableId || action.responsableId === 0) {
        actionsNonAssignees++;
        continue;
      }

      const userActions = actionsByUser.get(action.responsableId) || [];
      userActions.push(action);
      actionsByUser.set(action.responsableId, userActions);
    }

    // Calculer les métriques pour chaque utilisateur
    const responsables: ResponsableWorkload[] = [];

    for (const user of users) {
      if (!user.id) continue;

      const userActions = actionsByUser.get(user.id) || [];
      if (userActions.length === 0) continue; // Ignorer les utilisateurs sans actions

      const totalActions = userActions.length;
      const enCours = userActions.filter(a => a.statut === 'en_cours').length;
      const critiques = userActions.filter(a =>
        a.priorite === 'critique' || a.priorite === 'haute'
      ).length;
      const enRetard = userActions.filter(a =>
        a.statut !== 'termine' && a.date_fin_prevue < today
      ).length;
      const bloquees = userActions.filter(a => a.statut === 'bloque').length;

      const chargeScore = calculateChargeScore(totalActions, critiques, enRetard, bloquees);
      const status = getChargeStatus(chargeScore);

      responsables.push({
        userId: user.id,
        fullName: `${user.prenom} ${user.nom}`,
        email: user.email,
        totalActions,
        enCours,
        critiques,
        enRetard,
        bloquees,
        chargeScore: Math.round(chargeScore),
        status,
      });
    }

    // Trier par score de charge (décroissant)
    responsables.sort((a, b) => b.chargeScore - a.chargeScore);

    // Compter les surchargés
    const overloadedCount = responsables.filter(r => r.status === 'surcharge').length;

    // Générer les alertes
    const alerts = generateAlerts(responsables);

    return {
      responsables,
      overloadedCount,
      alerts,
      totalActions: actions.filter(a => a.statut !== 'termine' && a.statut !== 'annule').length,
      actionsNonAssignees,
    };
  }, [actions, users]);
}
