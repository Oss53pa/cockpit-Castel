import { useState } from 'react';
import type { Objective, PerfData, Task, Kpi, ModalState } from '../types';
import { gc, fmtDate, isOverdue } from '../utils';
import { FC, PL, PC, SC, SI } from '../constants';
import { Badge } from '../components/Badge';
import { MiniBar } from '../components/MiniBar';

interface ObjectiveDetailProps {
  obj: Objective;
  data: PerfData;
  period: string;
  objPlans: (oid: string) => PerfData['plans'][string][];
  objTasks: (oid: string) => Task[];
  objKpis: (oid: string) => Kpi[];
  objLogs: (oid: string) => PerfData['logs'][string];
  objProg: (oid: string) => number;
  planTasks: (pid: string) => Task[];
  taskProg: (tasks: Task[]) => number;
  kpiCurrent: (k: Kpi) => number;
  moveTask: (taskId: string, newStatus: string) => void;
  addLog: (objId: string, text: string) => void;
  upd: (fn: (d: PerfData) => PerfData) => void;
  setSelObj: (obj: Objective | null) => void;
  setModal: (m: ModalState | null) => void;
}

export function ObjectiveDetail({
  obj, data, period, objPlans, objTasks, objKpis, objLogs, objProg, planTasks, taskProg, kpiCurrent, moveTask, addLog, upd, setSelObj, setModal,
}: ObjectiveDetailProps) {
  const plans = objPlans(obj.id);
  const tasks = objTasks(obj.id);
  const kpis = objKpis(obj.id);
  const logs = objLogs(obj.id);
  const prog = objProg(obj.id);
  const note = data.notes[`${obj.id}_${period}`] || 0;
  const isP = obj.type === "personal";
  const [logInput, setLogInput] = useState("");

  return (
    <div className="space-y-4">
      <button onClick={() => setSelObj(null)} className="text-primary-500 hover:text-primary-900 text-xs">← Retour</button>
      <div className="bg-white rounded-xl p-5 border border-primary-200">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge label={obj.filiale} color={FC[obj.filiale]} />
              <Badge label={`${obj.poids}%`} color="#6b7280" />
              <Badge label={isP ? "Personnel" : "Projet"} color={isP ? "#6366f1" : "#22c55e"} />
            </div>
            <h2 className="text-xl font-bold">{obj.name}</h2>
          </div>
          <div className="flex gap-6">
            {!isP && (
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: gc(prog / 10) }}>{prog}%</p>
                <p className="text-xs text-primary-400">Avancement</p>
              </div>
            )}
            <div className="text-center">
              <input type="number" min="0" max="10" step="0.5" value={note || ""} placeholder="—" onChange={e => upd(d => { d.notes[`${obj.id}_${period}`] = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)); return d; })} className="w-16 bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-center text-xl font-bold focus:outline-none focus:border-primary-400" style={{ color: gc(note) }} />
              <p className="text-xs text-primary-400 mt-1">Note {period === "s1" ? "S1" : "S2"}</p>
            </div>
          </div>
        </div>
        {!isP && <div className="mt-2"><MiniBar value={prog} h="h-2" color={gc(prog / 10)} /></div>}
      </div>

      {/* KPIs */}
      <div className="bg-white rounded-xl p-4 border border-primary-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-primary-700">📊 KPIs</h3>
          <button onClick={() => setModal({ type: "kpi", data: { objId: obj.id } })} className="text-xs bg-primary-100 hover:bg-primary-100 px-3 py-1 rounded-lg text-primary-600">+ KPI</button>
        </div>
        {kpis.length === 0
          ? <p className="text-xs text-primary-400 py-2">Aucun KPI défini.</p>
          : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {kpis.map(k => {
                const cur = kpiCurrent(k);
                const tar = parseFloat(k.target) || 1;
                const pct = Math.min(100, Math.round((cur / tar) * 100));
                const hasAuto = (k.planIds || []).length > 0;
                return (
                  <div key={k.id} onClick={() => setModal({ type: "kpi", data: k as unknown as Record<string, unknown> })} className="bg-primary-100 rounded-lg p-3 cursor-pointer hover:border-primary-300 border border-primary-200 transition-colors">
                    <p className="text-xs text-primary-500 mb-1 truncate">{k.name}{hasAuto && <span className="text-primary-300 ml-1">⚡</span>}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold" style={{ color: gc(pct / 10) }}>{cur}</span>
                      <span className="text-xs text-primary-400">/ {k.target} {k.unit}</span>
                    </div>
                    <MiniBar value={pct} color={gc(pct / 10)} h="h-1" />
                    {hasAuto && <p className="text-xs text-primary-400 mt-1">{(k.planIds || []).length} action(s) liée(s)</p>}
                  </div>
                );
              })}
            </div>
        }
      </div>

      {/* Plans */}
      {!isP && (
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-primary-700">📋 Plans d&apos;action</h3>
            <button onClick={() => setModal({ type: "plan", data: { objId: obj.id } })} className="text-xs bg-primary-100 hover:bg-primary-100 px-3 py-1 rounded-lg text-primary-600">+ Plan</button>
          </div>
          {plans.length === 0
            ? <p className="text-xs text-primary-400 py-4">Créez un plan d&apos;action.</p>
            : plans.map(p => {
                const pt = planTasks(p.id);
                const pp = taskProg(pt);
                return (
                  <div key={p.id} className="mb-4 bg-primary-50 rounded-xl border border-primary-200/50 overflow-hidden">
                    <div className="p-3 flex items-center justify-between bg-primary-50 cursor-pointer" onClick={() => setModal({ type: "plan", data: p as unknown as Record<string, unknown> })}>
                      <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <div className="flex items-center gap-3 text-xs text-primary-400 mt-0.5">
                          {p.target_date && <span>Cible: {fmtDate(p.target_date)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: gc(pp / 10) }}>{pp}%</p>
                          <p className="text-xs text-primary-400">{pt.filter(x => x.status === "done").length}/{pt.length}</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setModal({ type: "task", data: { planId: p.id } }); }} className="bg-primary-100 hover:bg-primary-200 text-primary-600 text-xs px-2.5 py-1.5 rounded-lg">+ Tâche</button>
                      </div>
                    </div>
                    <div className="px-3"><MiniBar value={pp} color={gc(pp / 10)} h="h-1" /></div>
                    <div className="p-2 space-y-1">
                      {pt.map(t => (
                        <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-primary-100 cursor-pointer group" onClick={() => setModal({ type: "task", data: t as unknown as Record<string, unknown> })}>
                          <button onClick={e => { e.stopPropagation(); moveTask(t.id, t.status === "done" ? "todo" : "done"); }} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${t.status === "done" ? "bg-success-500 border-primary-900" : "border-primary-300 hover:border-primary-400"}`}>{t.status === "done" && <span className="text-[9px] text-white">✓</span>}</button>
                          <span className={`text-xs flex-1 ${t.status === "done" ? "line-through text-primary-400" : ""}`}>{t.title}</span>
                          <Badge label={PL[t.priority]} color={PC[t.priority]} small />
                          <span className="text-[9px]" style={{ color: SC[t.status] }}>{SI[t.status]}</span>
                          {t.deadline && <span className={`text-xs ${isOverdue(t) ? "text-error-600" : "text-primary-400"}`}>{fmtDate(t.deadline)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* Journal */}
      <div className="bg-white rounded-xl p-4 border border-primary-200">
        <h3 className="text-sm font-bold text-primary-700 mb-3">📝 Journal</h3>
        <div className="flex gap-2 mb-3">
          <input className="flex-1 bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-400" placeholder="Ajouter une note..." value={logInput} onChange={e => setLogInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && logInput.trim()) { addLog(obj.id, logInput.trim()); setLogInput(""); } }} />
          <button onClick={() => { if (logInput.trim()) { addLog(obj.id, logInput.trim()); setLogInput(""); } }} className="bg-primary-900 hover:bg-primary-800 text-white text-xs px-4 rounded-lg">+</button>
        </div>
        {logs.length === 0
          ? <p className="text-xs text-primary-400">Aucune entrée.</p>
          : <div className="space-y-2 max-h-60 overflow-y-auto">
              {logs.map(l => (
                <div key={l.id} className="flex gap-2 py-2 border-b border-primary-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-success-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-primary-700">{l.text}</p>
                    <p className="text-xs text-primary-400 mt-0.5">{new Date(l.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <button onClick={() => upd(d => { d.logs[obj.id] = d.logs[obj.id].filter(x => x.id !== l.id); return d; })} className="text-primary-300 hover:text-error-600 text-xs">✕</button>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
