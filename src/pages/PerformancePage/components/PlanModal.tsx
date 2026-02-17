import { useState } from 'react';
import type { PerfData, PlanSousTache, PlanLivrable, Task } from '../types';
import { uid, gc } from '../utils';
import { ALL_OBJ } from '../constants';
import { MiniBar } from './MiniBar';

interface PlanModalProps {
  plan: Record<string, unknown>;
  objId: string;
  data: PerfData;
  upd: (fn: (d: PerfData) => PerfData) => void;
  planTasks: (pid: string) => Task[];
  onClose: () => void;
}

export function PlanModal({ plan, objId, data, upd, planTasks, onClose }: PlanModalProps) {
  const isNew = !plan.id;
  const [planTab, setPlanTab] = useState("general");
  const [f, setF] = useState<Record<string, unknown>>(
    plan.id
      ? { ...plan, sous_taches: (plan.sous_taches as PlanSousTache[]) || [], livrables: (plan.livrables as PlanLivrable[]) || [] }
      : {
          id: uid(), objId, name: "", description: "", responsable: "",
          statut: "a_faire", avancement: 0, priorite: "moyenne",
          date_debut: "", target_date: "", notes: "",
          sous_taches: [] as PlanSousTache[], livrables: [] as PlanLivrable[],
        }
  );

  const sousTaches = f.sous_taches as PlanSousTache[];
  const livrables = f.livrables as PlanLivrable[];
  const stAvg = sousTaches.length > 0 ? Math.round(sousTaches.reduce((s, st) => s + st.avancement, 0) / sousTaches.length) : null;
  const effectiveAvancement = stAvg !== null ? stAvg : (f.avancement as number);

  const calcStatut = (av: number, blocked: boolean) => {
    if (blocked) return "bloque";
    if (av === 0) return "a_faire";
    if (av >= 100) return "termine";
    return "en_cours";
  };
  const [isBloque, setIsBloque] = useState((f.statut as string) === "bloque");

  const doSave = () => {
    if (!(f.name as string).trim()) return;
    const toSave = { ...f, avancement: effectiveAvancement, statut: calcStatut(effectiveAvancement, isBloque) };
    upd(d => { d.plans[toSave.id as string] = toSave as PerfData['plans'][string]; return d; });
    onClose();
  };

  const doDelete = () => {
    if (!confirm("Supprimer ce plan et ses tâches ?")) return;
    const tids = planTasks(f.id as string).map(t => t.id);
    upd(d => { delete d.plans[f.id as string]; tids.forEach(i => delete d.tasks[i]); return d; });
    onClose();
  };

  const addSt = () => setF(p => ({ ...p, sous_taches: [...(p.sous_taches as PlanSousTache[]), { id: uid(), libelle: "", avancement: 0, fait: false }] }));
  const updSt = (i: number, k: string, v: unknown) => setF(p => {
    const s = [...(p.sous_taches as PlanSousTache[])];
    s[i] = { ...s[i], [k]: v };
    if (k === "fait") s[i].avancement = v ? 100 : 0;
    return { ...p, sous_taches: s };
  });
  const rmSt = (i: number) => setF(p => ({ ...p, sous_taches: (p.sous_taches as PlanSousTache[]).filter((_, j) => j !== i) }));
  const addLiv = () => setF(p => ({ ...p, livrables: [...(p.livrables as PlanLivrable[]), { id: uid(), nom: "", fait: false }] }));
  const updLiv = (i: number, k: string, v: unknown) => setF(p => {
    const s = [...(p.livrables as PlanLivrable[])];
    s[i] = { ...s[i], [k]: v };
    return { ...p, livrables: s };
  });
  const rmLiv = (i: number) => setF(p => ({ ...p, livrables: (p.livrables as PlanLivrable[]).filter((_, j) => j !== i) }));

  const ic = "w-full bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400";
  const lb = "text-xs text-primary-400 uppercase tracking-wider block mb-1";
  const PLAN_TABS = [
    { k: "general", l: "Général" },
    { k: "sousTaches", l: `Sous-tâches (${sousTaches.length})` },
    { k: "livrables", l: `Livrables (${livrables.filter(l => l.fait).length}/${livrables.length})` },
    { k: "notes", l: "Notes" },
  ];
  const obj = ALL_OBJ.find(o => o.id === ((f.objId as string) || objId));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-primary-200 shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-primary-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary-900">{isNew ? "Nouveau plan d'action" : "Modifier le plan d'action"}</h3>
            {obj && <p className="text-xs text-primary-400 mt-0.5">{obj.name} — {obj.filiale}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary-400">Avancement</span>
              <span className="text-sm font-bold" style={{ color: gc(effectiveAvancement / 10) }}>{effectiveAvancement}%</span>
            </div>
            <button onClick={onClose} className="text-primary-400 hover:text-primary-900 text-lg">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-primary-200 px-4">
          {PLAN_TABS.map(t => (
            <button key={t.k} onClick={() => setPlanTab(t.k)} className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${planTab === t.k ? "border-primary-900 text-primary-900" : "border-transparent text-primary-400 hover:text-primary-700"}`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {planTab === "general" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {(["a_faire", "en_cours", "termine", "bloque"] as const).map(s => {
                  const cfg: Record<string, { l: string; c: string }> = {
                    a_faire: { l: "À faire", c: "bg-primary-100 text-primary-600" },
                    en_cours: { l: "En cours", c: "bg-info-100 text-info-700" },
                    termine: { l: "Terminé", c: "bg-success-100 text-success-700" },
                    bloque: { l: "Bloqué", c: "bg-error-100 text-error-700" },
                  };
                  const cur = calcStatut(effectiveAvancement, isBloque);
                  return <span key={s} className={`text-xs px-2 py-1 rounded-full font-medium ${cur === s ? cfg[s].c : "bg-primary-50 text-primary-300"}`}>{cfg[s].l}</span>;
                })}
                <label className="flex items-center gap-1 ml-auto text-xs text-primary-400 cursor-pointer">
                  <input type="checkbox" checked={isBloque} onChange={e => setIsBloque(e.target.checked)} className="rounded" />
                  <span>Bloqué</span>
                </label>
              </div>
              <div>
                <label className={lb}>Avancement ({effectiveAvancement}%){stAvg !== null ? " — calculé depuis sous-tâches" : ""}</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" step="5" value={effectiveAvancement} disabled={stAvg !== null} onChange={e => setF(p => ({ ...p, avancement: parseInt(e.target.value) }))} className="flex-1 h-2 rounded-full accent-primary-900" />
                  <span className="text-sm font-bold w-10 text-right" style={{ color: gc(effectiveAvancement / 10) }}>{effectiveAvancement}%</span>
                </div>
                <MiniBar value={effectiveAvancement} color={gc(effectiveAvancement / 10)} h="h-1.5" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><label className={lb}>Libellé *</label><input className={ic} value={f.name as string} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Titre du plan d'action" /></div>
                <div className="sm:col-span-2"><label className={lb}>Description</label><textarea rows={2} className={ic} value={(f.description as string) || ""} onChange={e => setF(p => ({ ...p, description: e.target.value }))} placeholder="Description détaillée..." /></div>
              </div>
              <div>
                <label className={lb}>Objectif associé *</label>
                <select className={ic} value={f.objId as string} onChange={e => setF(p => ({ ...p, objId: e.target.value }))}>
                  <option value="">Sélectionner...</option>
                  {ALL_OBJ.map(o => <option key={o.id} value={o.id}>{o.filiale} — {o.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lb}>Responsable</label><input className={ic} value={(f.responsable as string) || ""} onChange={e => setF(p => ({ ...p, responsable: e.target.value }))} placeholder="Nom du responsable" /></div>
                <div>
                  <label className={lb}>Priorité</label>
                  <select className={ic} value={(f.priorite as string) || "moyenne"} onChange={e => setF(p => ({ ...p, priorite: e.target.value }))}>
                    <option value="critique">Critique</option><option value="haute">Haute</option><option value="moyenne">Moyenne</option><option value="basse">Basse</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lb}>Date de début</label><input type="date" className={ic} value={(f.date_debut as string) || ""} onChange={e => setF(p => ({ ...p, date_debut: e.target.value }))} /></div>
                <div><label className={lb}>Échéance</label><input type="date" className={ic} value={(f.target_date as string) || ""} onChange={e => setF(p => ({ ...p, target_date: e.target.value }))} /></div>
              </div>
            </div>
          )}

          {planTab === "sousTaches" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-primary-400">{sousTaches.length} sous-tâche(s) — Avancement moyen : <span className="font-bold" style={{ color: gc((stAvg || 0) / 10) }}>{stAvg ?? 0}%</span></p>
                <button onClick={addSt} className="text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1.5 rounded-lg font-medium">+ Ajouter</button>
              </div>
              {sousTaches.length === 0
                ? <p className="text-sm text-primary-300 text-center py-8">Aucune sous-tâche. Cliquez sur + Ajouter.</p>
                : <div className="space-y-2">
                    {sousTaches.map((st, i) => (
                      <div key={st.id} className="flex items-center gap-2 bg-primary-50 rounded-lg p-2.5 border border-primary-200/50">
                        <button onClick={() => updSt(i, "fait", !st.fait)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${st.fait ? "bg-success-500 border-success-500" : "border-primary-300 hover:border-primary-400"}`}>{st.fait && <span className="text-[9px] text-white">✓</span>}</button>
                        <input className={`flex-1 bg-transparent text-sm focus:outline-none ${st.fait ? "line-through text-primary-400" : ""}`} value={st.libelle} onChange={e => updSt(i, "libelle", e.target.value)} placeholder="Libellé de la sous-tâche..." />
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <input type="range" min="0" max="100" step="10" value={st.avancement} onChange={e => updSt(i, "avancement", parseInt(e.target.value))} className="w-16 h-1 accent-primary-900" />
                          <span className="text-xs font-bold w-8 text-right" style={{ color: gc(st.avancement / 10) }}>{st.avancement}%</span>
                        </div>
                        <button onClick={() => rmSt(i)} className="text-primary-300 hover:text-error-600 text-xs flex-shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {planTab === "livrables" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-primary-400">{livrables.filter(l => l.fait).length}/{livrables.length} livrable(s) validé(s)</p>
                <button onClick={addLiv} className="text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1.5 rounded-lg font-medium">+ Ajouter</button>
              </div>
              {livrables.length === 0
                ? <p className="text-sm text-primary-300 text-center py-8">Aucun livrable. Cliquez sur + Ajouter.</p>
                : <div className="space-y-2">
                    {livrables.map((l, i) => (
                      <div key={l.id} className="flex items-center gap-2 bg-primary-50 rounded-lg p-2.5 border border-primary-200/50">
                        <button onClick={() => updLiv(i, "fait", !l.fait)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${l.fait ? "bg-success-500 border-success-500" : "border-primary-300 hover:border-primary-400"}`}>{l.fait && <span className="text-[9px] text-white">✓</span>}</button>
                        <input className={`flex-1 bg-transparent text-sm focus:outline-none ${l.fait ? "line-through text-primary-400" : ""}`} value={l.nom} onChange={e => updLiv(i, "nom", e.target.value)} placeholder="Nom du livrable..." />
                        <button onClick={() => rmLiv(i)} className="text-primary-300 hover:text-error-600 text-xs flex-shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {planTab === "notes" && (
            <div>
              <label className={lb}>Notes et commentaires</label>
              <textarea rows={8} className={ic} value={(f.notes as string) || ""} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} placeholder="Notes libres, observations, points de suivi..." />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-primary-200 flex gap-2">
          <button onClick={doSave} className="flex-1 bg-primary-900 hover:bg-primary-800 text-white rounded-xl py-2.5 text-sm font-semibold">Enregistrer</button>
          {!isNew && <button onClick={doDelete} className="px-4 bg-error-50 hover:bg-error-100 text-error-600 rounded-xl py-2.5 text-sm">Supprimer</button>}
          <button onClick={onClose} className="px-4 bg-primary-100 hover:bg-primary-200 rounded-xl py-2.5 text-sm">Annuler</button>
        </div>
      </div>
    </div>
  );
}
