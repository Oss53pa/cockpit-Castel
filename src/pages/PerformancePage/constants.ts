import type { Objective } from './types';

export const SK = "perf-pilot-2026-v5";

export const PERSONAL_OBJ: Objective[] = [
  { id: "p1", name: "Travail en équipe & Leadership", filiale: "Groupe", poids: 10, type: "personal" },
  { id: "p2", name: "Loyauté", filiale: "Groupe", poids: 10, type: "personal" },
  { id: "p3", name: "Stabilité émotive", filiale: "Groupe", poids: 10, type: "personal" },
  { id: "p4", name: "Responsabilité", filiale: "Groupe", poids: 10, type: "personal" },
  { id: "p5", name: "Sens de l'organisation", filiale: "Groupe", poids: 10, type: "personal" },
  { id: "p6", name: "Mentoring", filiale: "Groupe", poids: 10, type: "personal" },
  { id: "p7", name: "Assiduité, ponctualité", filiale: "Groupe", poids: 10, type: "personal" },
  { id: "p8", name: "Communication", filiale: "Groupe", poids: 10, type: "personal" },
  { id: "p9", name: "Analyse et synthèse", filiale: "Groupe", poids: 10, type: "personal" },
  { id: "p10", name: "Autonomie & Ténacité", filiale: "Groupe", poids: 10, type: "personal" },
];

export const PROJECT_OBJ: Objective[] = [
  { id: "pr1", name: "Cosmos Angré - Process Pré-ouverture", filiale: "NH", poids: 20, type: "project" },
  { id: "pr2", name: "Cosmos Angré - Suivi Leasing 100%", filiale: "NH", poids: 10, type: "project" },
  { id: "pr3", name: "Cosmos Angré - Suivi construction", filiale: "NH", poids: 5, type: "project" },
  { id: "pr4", name: "Castle Omega - Ouverture foodcourt", filiale: "NH", poids: 5, type: "project" },
  { id: "pr5", name: "Castle Omega - Assistance équipe", filiale: "NH", poids: 5, type: "project" },
  { id: "pr6", name: "Cosmos Yop - Performance financière", filiale: "EPSA", poids: 7.5, type: "project" },
  { id: "pr7", name: "Cosmos Yop - Excellence opérationnelle", filiale: "EPSA", poids: 7.5, type: "project" },
  { id: "pr8", name: "Cosmos Yop - Relations stakeholders", filiale: "EPSA", poids: 7.5, type: "project" },
  { id: "pr9", name: "Cosmos Yop - Gouvernance & conformité", filiale: "EPSA", poids: 2.5, type: "project" },
  { id: "pr10", name: "Cap Ivoire - Suivi Leasing 100%", filiale: "RCP", poids: 10, type: "project" },
  { id: "pr11", name: "Cap Ivoire - Suivi construction", filiale: "RCP", poids: 5, type: "project" },
  { id: "pr12", name: "Praedium Tech - Suivi transition", filiale: "Praedium", poids: 5, type: "project" },
  { id: "pr13", name: "Support autres projets RCP", filiale: "RCP", poids: 10, type: "project" },
];

export const ALL_OBJ = [...PERSONAL_OBJ, ...PROJECT_OBJ];

export const FC: Record<string, string> = {
  NH: "#8b5cf6",
  EPSA: "#06b6d4",
  RCP: "#f59e0b",
  Praedium: "#ec4899",
  Groupe: "#6366f1",
};

export const STATUSES = ["todo", "in_progress", "in_review", "done"];

export const SL: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  in_review: "En revue",
  done: "Terminé",
};

export const SI: Record<string, string> = {
  todo: "○",
  in_progress: "◐",
  in_review: "◑",
  done: "●",
};

export const SC: Record<string, string> = {
  todo: "#6b7280",
  in_progress: "#3b82f6",
  in_review: "#f59e0b",
  done: "#22c55e",
};

export const PRIO = ["critical", "high", "medium", "low"];

export const PL: Record<string, string> = {
  critical: "Critique",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

export const PC: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#6b7280",
};
