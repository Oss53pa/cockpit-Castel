import { useState } from 'react';
import type { PerfData, Subtask } from '../types';
import { uid } from '../utils';
import { ALL_OBJ, STATUSES, PRIO, PL, PC, SI, SC } from '../constants';

interface TaskModalProps {
  task: Record<string, unknown>;
  data: PerfData;
  upd: (fn: (d: PerfData) => PerfData) => void;
  onClose: () => void;
}

export function TaskModal({ task, data, upd, onClose }: TaskModalProps) {
  const isNew = !task.id;
  const [f, setF] = useState(
    task.id
      ? { ...(task as Record<string, unknown>), subtasks: (task.subtasks as Subtask[]) || [] }
      : {
          id: uid(), title: "", description: "", planId: (task.planId as string) || "",
          priority: "medium", status: "todo", deadline: "", startDate: "",
          subtasks: [] as Subtask[], createdAt: new Date().toISOString(),
        }
  );
  const plans = Object.values(data.plans);

  const doSave = () => {
    if (!(f.title as string).trim() || !f.planId) return;
    upd(d => { d.tasks[f.id as string] = f as PerfData['tasks'][string]; return d; });
    onClose();
  };

  const doDelete = () => {
    if (!confirm("Supprimer cette tâche ?")) return;
    upd(d => { delete d.tasks[f.id as string]; return d; });
    onClose();
  };

  const addSub = () => setF(p => ({ ...p, subtasks: [...(p.subtasks as Subtask[]), { id: uid(), title: "", done: false }] }));
  const updSub = (i: number, k: string, v: unknown) => setF(p => {
    const s = [...(p.subtasks as Subtask[])];
    s[i] = { ...s[i], [k]: v };
    return { ...p, subtasks: s };
  });
  const rmSub = (i: number) => setF(p => ({ ...p, subtasks: (p.subtasks as Subtask[]).filter((_, j) => j !== i) }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg border border-primary-200 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-primary-200 flex items-center justify-between">
          <h3 className="text-lg font-bold">{isNew ? "✚ Nouvelle tâche" : "✎ Modifier la tâche"}</h3>
          <button onClick={onClose} className="text-primary-400 hover:text-primary-900 text-lg">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-primary-400 uppercase tracking-wider">Titre *</label>
            <input className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30" value={f.title as string} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Finaliser le plan de recrutement" />
          </div>
          <div>
            <label className="text-xs text-primary-400 uppercase tracking-wider">Description</label>
            <textarea rows={2} className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary-400" value={(f.description as string) || ""} onChange={e => setF(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-primary-400 uppercase tracking-wider">Plan d&apos;action *</label>
            <select className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2.5 text-sm mt-1" value={f.planId as string} onChange={e => setF(p => ({ ...p, planId: e.target.value }))}>
              <option value="">Sélectionner...</option>
              {plans.map(p => {
                const o = ALL_OBJ.find(x => x.id === p.objId);
                return <option key={p.id} value={p.id}>{o?.name?.slice(0, 30)} → {p.name}</option>;
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-primary-400 uppercase">Date début</label><input type="date" className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1" value={(f.startDate as string) || ""} onChange={e => setF(p => ({ ...p, startDate: e.target.value }))} /></div>
            <div><label className="text-xs text-primary-400 uppercase">Échéance</label><input type="date" className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1" value={(f.deadline as string) || ""} onChange={e => setF(p => ({ ...p, deadline: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-primary-400 uppercase">Priorité</label>
              <div className="flex gap-1 mt-1">
                {PRIO.map(x => (
                  <button key={x} onClick={() => setF(p => ({ ...p, priority: x }))} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${f.priority === x ? "border-white/30" : "border-transparent opacity-50 hover:opacity-80"}`} style={{ backgroundColor: PC[x] + "30", color: PC[x] }}>
                    {PL[x]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-primary-400 uppercase">Statut</label>
              <div className="flex gap-1 mt-1">
                {STATUSES.map(x => (
                  <button key={x} onClick={() => setF(p => ({ ...p, status: x }))} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${f.status === x ? "border-white/30" : "border-transparent opacity-50 hover:opacity-80"}`} style={{ backgroundColor: SC[x] + "30", color: SC[x] }}>
                    {SI[x]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-primary-400 uppercase">Sous-tâches ({(f.subtasks as Subtask[]).filter(s => s.done).length}/{(f.subtasks as Subtask[]).length})</label>
              <button onClick={addSub} className="text-xs text-primary-600 hover:text-primary-900">+ Ajouter</button>
            </div>
            <div className="mt-2 space-y-1">
              {(f.subtasks as Subtask[]).map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 bg-primary-50 rounded-lg px-2 py-1.5">
                  <button onClick={() => updSub(i, "done", !s.done)} className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${s.done ? "bg-success-500 border-primary-900" : "border-primary-300"}`}>{s.done && <span className="text-[8px] text-white">✓</span>}</button>
                  <input className={`flex-1 bg-transparent text-xs focus:outline-none ${s.done ? "line-through text-primary-400" : ""}`} value={s.title} onChange={e => updSub(i, "title", e.target.value)} placeholder="Sous-tâche..." />
                  <button onClick={() => rmSub(i)} className="text-primary-400 hover:text-error-600 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-primary-200 flex gap-2">
          <button onClick={doSave} className="flex-1 bg-primary-900 hover:bg-primary-800 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">Enregistrer</button>
          {!isNew && <button onClick={doDelete} className="px-4 bg-error-50 hover:bg-error-100 text-error-600 rounded-xl py-2.5 text-sm">Supprimer</button>}
          <button onClick={onClose} className="px-4 bg-primary-100 hover:bg-primary-100 rounded-xl py-2.5 text-sm">Annuler</button>
        </div>
      </div>
    </div>
  );
}
