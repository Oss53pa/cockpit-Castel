import { useState } from 'react';
import type { PerfData } from '../types';
import { uid, gc } from '../utils';
import { ALL_OBJ } from '../constants';
import { MiniBar } from './MiniBar';

interface KpiModalProps {
  kpi: Record<string, unknown>;
  objId: string;
  data: PerfData;
  upd: (fn: (d: PerfData) => PerfData) => void;
  onClose: () => void;
}

export function KpiModal({ kpi, objId, data, upd, onClose }: KpiModalProps) {
  const isNew = !kpi.id;
  const [f, setF] = useState<Record<string, unknown>>(
    kpi.id
      ? { ...kpi, planIds: (kpi.planIds as string[]) || [] }
      : { id: uid(), objId, name: "", target: "", current: "", unit: "%", planIds: [] as string[] }
  );
  const allPlansArr = Object.values(data.plans);
  const planIds = f.planIds as string[];
  const linkedPlans = allPlansArr.filter(p => planIds.includes(p.id));
  const hasLinked = linkedPlans.length > 0;

  const autoAvancement = hasLinked ? Math.round(linkedPlans.reduce((s, p) => s + (p.avancement || 0), 0) / linkedPlans.length) : null;
  const tar = parseFloat(f.target as string) || 0;
  const autoCurrent = autoAvancement !== null && tar > 0 ? ((autoAvancement / 100) * tar).toFixed(1) : null;
  const displayCurrent = autoCurrent !== null ? autoCurrent : (f.current as string);
  const curNum = parseFloat(displayCurrent as string) || 0;
  const pct = tar > 0 ? Math.min(100, Math.round((curNum / tar) * 100)) : 0;

  const togglePlan = (pid: string) => setF(p => ({
    ...p,
    planIds: (p.planIds as string[]).includes(pid)
      ? (p.planIds as string[]).filter(x => x !== pid)
      : [...(p.planIds as string[]), pid],
  }));

  const doSave = () => {
    if (!(f.name as string).trim()) return;
    const toSave = { ...f, current: displayCurrent || f.current };
    upd(d => { d.kpis[toSave.id as string] = toSave as PerfData['kpis'][string]; return d; });
    onClose();
  };

  const doDelete = () => {
    if (!confirm("Supprimer ce KPI ?")) return;
    upd(d => { delete d.kpis[f.id as string]; return d; });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg border border-primary-200 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-primary-200 flex items-center justify-between">
          <h3 className="text-lg font-bold">{isNew ? "Nouveau KPI" : "Modifier le KPI"}</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: gc(pct / 10) }}>{pct}%</span>
            <button onClick={onClose} className="text-primary-400 hover:text-primary-900 text-lg ml-2">✕</button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-primary-400 uppercase tracking-wider">Nom du KPI *</label>
            <input className="w-full bg-primary-50 border border-primary-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-primary-400" value={f.name as string} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Taux de leasing" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-primary-400 uppercase tracking-wider">Cible</label>
              <input className="w-full bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary-400" value={f.target as string} onChange={e => setF(p => ({ ...p, target: e.target.value }))} placeholder="100" />
            </div>
            <div>
              <label className="text-xs text-primary-400 uppercase tracking-wider">Atteint{hasLinked ? " (auto)" : ""}</label>
              {hasLinked
                ? <div className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 font-bold" style={{ color: gc(pct / 10) }}>{displayCurrent} <span className="text-xs font-normal text-primary-400">({autoAvancement}%)</span></div>
                : <input className="w-full bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary-400" value={f.current as string} onChange={e => setF(p => ({ ...p, current: e.target.value }))} placeholder="0" />
              }
            </div>
            <div>
              <label className="text-xs text-primary-400 uppercase tracking-wider">Unité</label>
              <input className="w-full bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary-400" value={f.unit as string} onChange={e => setF(p => ({ ...p, unit: e.target.value }))} placeholder="%" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-primary-400">Progression</span>
              <span className="text-sm font-bold" style={{ color: gc(pct / 10) }}>{displayCurrent || 0} / {(f.target as string) || "—"} {f.unit as string}</span>
            </div>
            <MiniBar value={pct} color={gc(pct / 10)} h="h-2" />
          </div>
          <div>
            <label className="text-xs text-primary-400 uppercase tracking-wider block mb-2">Actions liées ({planIds.length}){hasLinked ? ` — avancement moyen : ${autoAvancement}%` : ""}</label>
            {allPlansArr.length === 0
              ? <p className="text-sm text-primary-300 py-4 text-center">Aucune action disponible.</p>
              : <div className="space-y-1 max-h-48 overflow-y-auto">
                  {allPlansArr.map(p => {
                    const obj = ALL_OBJ.find(o => o.id === p.objId);
                    const sel = planIds.includes(p.id);
                    const av = p.avancement || 0;
                    return (
                      <div key={p.id} onClick={() => togglePlan(p.id)} className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border transition-all ${sel ? "bg-primary-100 border-primary-400" : "bg-primary-50 border-primary-200/50 hover:border-primary-300"}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${sel ? "bg-primary-900 border-primary-900" : "border-primary-300"}`}>{sel && <span className="text-xs text-white">✓</span>}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-primary-400 truncate">{obj?.filiale} — {obj?.name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-16"><MiniBar value={av} color={gc(av / 10)} h="h-1" /></div>
                          <span className="text-xs font-bold w-8 text-right" style={{ color: gc(av / 10) }}>{av}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        </div>
        <div className="p-4 border-t border-primary-200 flex gap-2">
          <button onClick={doSave} className="flex-1 bg-primary-900 hover:bg-primary-800 text-white rounded-xl py-2.5 text-sm font-semibold">Enregistrer</button>
          {!isNew && <button onClick={doDelete} className="px-4 bg-error-50 hover:bg-error-100 text-error-600 rounded-xl py-2.5 text-sm">Supprimer</button>}
          <button onClick={onClose} className="px-4 bg-primary-100 hover:bg-primary-200 rounded-xl py-2.5 text-sm">Annuler</button>
        </div>
      </div>
    </div>
  );
}
