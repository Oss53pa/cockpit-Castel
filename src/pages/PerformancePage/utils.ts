import type { Task, PerfData } from './types';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const gc = (v: number | null | undefined): string => {
  if (!v || v === 0) return "#6b7280";
  if (v < 4) return "#ef4444";
  if (v < 6) return "#f97316";
  if (v < 8) return "#eab308";
  return "#22c55e";
};

export const fmtDate = (d: string | undefined) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

export const fmtDateFull = (d: string | undefined) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

export const daysBetween = (a: string, b: string) =>
  Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export const isOverdue = (t: Task) =>
  t.deadline && t.status !== "done" && new Date(t.deadline + "T23:59:59") < new Date();

export const initData = (): PerfData => ({
  plans: {},
  tasks: {},
  kpis: {},
  notes: {},
  logs: {},
});
