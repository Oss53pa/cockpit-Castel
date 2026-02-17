export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  planId: string;
  priority: string;
  status: string;
  deadline?: string;
  startDate?: string;
  subtasks: Subtask[];
  createdAt: string;
}

export interface GanttTask extends Task {
  _start: Date;
  _end: Date;
}

export interface PlanSousTache {
  id: string;
  libelle: string;
  avancement: number;
  fait: boolean;
}

export interface PlanLivrable {
  id: string;
  nom: string;
  fait: boolean;
}

export interface Plan {
  id: string;
  objId: string;
  name: string;
  description?: string;
  responsable?: string;
  statut?: string;
  avancement?: number;
  priorite?: string;
  date_debut?: string;
  target_date?: string;
  notes?: string;
  livrables?: PlanLivrable[];
  sous_taches?: PlanSousTache[];
}

export interface Kpi {
  id: string;
  objId: string;
  name: string;
  target: string;
  current: string;
  unit: string;
  planIds?: string[];
}

export interface LogEntry {
  id: string;
  text: string;
  date: string;
}

export interface Objective {
  id: string;
  name: string;
  filiale: string;
  poids: number;
  type: string;
}

export interface PerfData {
  plans: Record<string, Plan>;
  tasks: Record<string, Task>;
  kpis: Record<string, Kpi>;
  notes: Record<string, number>;
  logs: Record<string, LogEntry[]>;
}

export interface ModalState {
  type: string;
  data: Record<string, unknown>;
}
