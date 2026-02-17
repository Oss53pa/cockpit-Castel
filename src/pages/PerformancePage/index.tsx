import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Objective, ModalState } from './types';
import { ALL_OBJ, PERSONAL_OBJ, PROJECT_OBJ, FC, STATUSES, SL, PRIO, PL, PC, SC } from './constants';
import { gc, fmtDate, isOverdue } from './utils';
import { usePerformanceData } from './hooks/usePerformanceData';
import { Badge } from './components/Badge';
import { MiniBar } from './components/MiniBar';
import { TaskModal } from './components/TaskModal';
import { PlanModal } from './components/PlanModal';
import { KpiModal } from './components/KpiModal';
import { KanbanView } from './components/KanbanView';
import { ListView } from './components/ListView';
import { CalendarView } from './components/CalendarView';
import { GanttView } from './components/GanttView';
import { ObjectiveDetail } from './tabs/ObjectiveDetail';
import { ReportView } from './tabs/ReportView';

export function PerformancePage() {
  const navigate = useNavigate();
  const perf = usePerformanceData();
  const { data, loaded, upd, objPlans, planTasks, objTasks, objKpis, objLogs, allTasks, taskProg, objProg, getTaskObj, getTaskPlan, kpiCurrent, overdueTasks, upcomingTasks, calcBonus, moveTask, addLog } = perf;

  const [tab, setTab] = useState("dashboard");
  const [selObj, setSelObj] = useState<Objective | null>(null);
  const [taskView, setTaskView] = useState("kanban");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [period, setPeriod] = useState("s2");
  const [filter, setFilter] = useState({ status: "all", priority: "all", filiale: "all", search: "" });
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(2026);
  const [ganttStart, setGanttStart] = useState(0);
  const [reportSection, setReportSection] = useState("summary");
  const [objFilter, setObjFilter] = useState({ filiale: "all", type: "all", sort: "name", search: "" });
  const [planFilter, setPlanFilter] = useState({ filiale: "all", statut: "all", priorite: "all", sort: "name", search: "" });
  const [evalFilter, setEvalFilter] = useState({ filiale: "all", type: "all" });
  const [dashFilter, setDashFilter] = useState({ filiale: "all" });

  const personalBonus = calcBonus(PERSONAL_OBJ, period);
  const projectBonus = calcBonus(PROJECT_OBJ, period);
  const totalBonus = personalBonus + projectBonus;

  const filteredTasks = useMemo(() => {
    let t = allTasks;
    if (filter.status !== "all") t = t.filter(x => x.status === filter.status);
    if (filter.priority !== "all") t = t.filter(x => x.priority === filter.priority);
    if (filter.filiale !== "all") {
      const oids = ALL_OBJ.filter(o => o.filiale === filter.filiale).map(o => o.id);
      const pids = Object.values(data.plans).filter(p => oids.includes(p.objId)).map(p => p.id);
      t = t.filter(x => pids.includes(x.planId));
    }
    if (filter.search.trim()) {
      const s = filter.search.toLowerCase();
      t = t.filter(x => x.title.toLowerCase().includes(s) || (x.description || "").toLowerCase().includes(s));
    }
    return t.sort((a, b) => {
      const po: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (po[a.priority] ?? 4) - (po[b.priority] ?? 4);
    });
  }, [allTasks, filter, data.plans]);

  if (!loaded) return <div className="min-h-screen bg-primary-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-900 border-t-transparent rounded-full" /></div>;

  const tabs = [
    { k: "dashboard", l: "📊", f: "Cockpit" },
    { k: "objectives", l: "🎯", f: "Objectifs" },
    { k: "plans", l: "📋", f: "Plans d'action" },
    { k: "tasks", l: "✅", f: "Tâches" },
    { k: "eval", l: "📈", f: "Évaluation" },
    { k: "report", l: "📄", f: "Rapport" },
  ];

  return (
    <div className="min-h-screen bg-primary-50 text-primary-900">
      <div className="bg-white border-b border-primary-200 sticky top-0 z-40">
        <div className="px-4 lg:px-6 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="text-primary-400 hover:text-primary-700 text-xs" title="Retour Cockpit">← Cockpit</button>
              <div className="w-px h-4 bg-primary-200" />
              <h1 className="text-xl font-bold text-primary-900 font-display">Performance</h1>
              <span className="text-xs text-primary-400 hidden sm:block">Rocklane Capital Partners</span>
            </div>
            <div className="flex bg-primary-100 rounded-lg p-0.5">
              {[{ k: "s1", l: "S1" }, { k: "s2", l: "S2" }].map(s => (
                <button key={s.k} onClick={() => setPeriod(s.k)} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${period === s.k ? "bg-primary-900 text-white shadow-lg shadow-primary-900/10" : "text-primary-500"}`}>{s.l}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-0.5 mt-2 -mb-[1px] overflow-x-auto">
            {tabs.map(t => (
              <button key={t.k} onClick={() => { setTab(t.k); setSelObj(null); }} className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${tab === t.k ? "bg-primary-50 text-primary-600 border-t-2 border-x border-primary-900 border-primary-200" : "text-primary-400 hover:text-primary-700"}`}>
                <span>{t.l}</span><span className="hidden sm:inline">{t.f}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-4">
        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {[
                { l: "Bonus Total", v: `${totalBonus.toFixed(1)}%`, s: "/30%", c: gc(totalBonus * 10 / 30) },
                { l: "Personnel", v: `${personalBonus.toFixed(1)}%`, s: "/10%", c: gc(personalBonus) },
                { l: "Projets", v: `${projectBonus.toFixed(1)}%`, s: "/10%", c: gc(projectBonus) },
                { l: "Tâches faites", v: `${allTasks.filter(t => t.status === "done").length}/${allTasks.length}`, s: "", c: allTasks.length ? "#22c55e" : "#6b7280" },
                { l: "En retard", v: `${overdueTasks.length}`, s: "", c: overdueTasks.length ? "#ef4444" : "#22c55e" },
              ].map((c, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-primary-200">
                  <p className="text-xs text-primary-400 mb-0.5">{c.l}</p>
                  <span className="text-xl font-bold" style={{ color: c.c }}>{c.v}</span>
                  {c.s && <span className="text-xs text-primary-400 ml-1">{c.s}</span>}
                </div>
              ))}
            </div>
            {(overdueTasks.length > 0 || upcomingTasks.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-3">
                {overdueTasks.length > 0 && (
                  <div className="bg-error-50 border border-error-200 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-error-600 mb-2">⚠ En retard ({overdueTasks.length})</h3>
                    {overdueTasks.slice(0, 5).map(t => {
                      const obj = getTaskObj(t);
                      return (
                        <div key={t.id} onClick={() => setModal({ type: "task", data: t as unknown as Record<string, unknown> })} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-error-50 rounded px-1">
                          {obj && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: FC[obj.filiale] }} />}
                          <span className="text-xs text-primary-700 flex-1 truncate">{t.title}</span>
                          <span className="text-xs text-error-600">{fmtDate(t.deadline)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {upcomingTasks.length > 0 && (
                  <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-warning-600 mb-2">📅 Cette semaine ({upcomingTasks.length})</h3>
                    {upcomingTasks.slice(0, 5).map(t => {
                      const obj = getTaskObj(t);
                      return (
                        <div key={t.id} onClick={() => setModal({ type: "task", data: t as unknown as Record<string, unknown> })} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-warning-50 rounded px-1">
                          {obj && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: FC[obj.filiale] }} />}
                          <span className="text-xs text-primary-700 flex-1 truncate">{t.title}</span>
                          <span className="text-xs text-warning-600">{fmtDate(t.deadline)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="bg-white rounded-xl p-4 border border-primary-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-primary-500">Avancement objectifs projets</h3>
                <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1 text-xs" value={dashFilter.filiale} onChange={e => setDashFilter(f => ({ ...f, filiale: e.target.value }))}>
                  <option value="all">Toutes filiales</option>
                  {Object.keys(FC).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              {PROJECT_OBJ.filter(o => dashFilter.filiale === "all" || o.filiale === dashFilter.filiale).map(o => {
                const p = objProg(o.id); const tc = objTasks(o.id).length; const note = data.notes[`${o.id}_${period}`] || 0;
                return (
                  <div key={o.id} onClick={() => { setTab("objectives"); setSelObj(o); }} className="flex items-center gap-2 py-2 border-b border-primary-100 last:border-0 cursor-pointer hover:bg-primary-50 rounded px-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: FC[o.filiale] }} />
                    <span className="text-xs flex-1 truncate">{o.name}</span>
                    <span className="text-xs text-primary-400 w-8 text-right">{tc}t</span>
                    <div className="w-20 hidden sm:block"><MiniBar value={p} color={gc(p / 10)} h="h-1" /></div>
                    <span className="text-xs font-bold w-10 text-right" style={{ color: gc(p / 10) }}>{p}%</span>
                    <span className="text-xs font-bold w-8 text-right" style={{ color: gc(note) }}>{note || "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OBJECTIVES */}
        {tab === "objectives" && !selObj && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[150px]"><input className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary-400" placeholder="🔍 Rechercher un objectif..." value={objFilter.search} onChange={e => setObjFilter(f => ({ ...f, search: e.target.value }))} /></div>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={objFilter.type} onChange={e => setObjFilter(f => ({ ...f, type: e.target.value }))}><option value="all">Tous types</option><option value="project">Projets</option><option value="personal">Personnels</option></select>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={objFilter.filiale} onChange={e => setObjFilter(f => ({ ...f, filiale: e.target.value }))}><option value="all">Toutes filiales</option>{Object.keys(FC).map(f => <option key={f} value={f}>{f}</option>)}</select>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={objFilter.sort} onChange={e => setObjFilter(f => ({ ...f, sort: e.target.value }))}><option value="name">Tri : Nom</option><option value="progress">Tri : Avancement</option><option value="poids">Tri : Poids</option><option value="filiale">Tri : Filiale</option></select>
            </div>
            {(() => {
              let objs = ALL_OBJ.filter(o => {
                if (objFilter.type !== "all" && o.type !== objFilter.type) return false;
                if (objFilter.filiale !== "all" && o.filiale !== objFilter.filiale) return false;
                if (objFilter.search.trim()) { const s = objFilter.search.toLowerCase(); if (!o.name.toLowerCase().includes(s) && !o.filiale.toLowerCase().includes(s)) return false; }
                return true;
              });
              const sortFn = (a: Objective, b: Objective) => {
                if (objFilter.sort === "progress") return objProg(b.id) - objProg(a.id);
                if (objFilter.sort === "poids") return b.poids - a.poids;
                if (objFilter.sort === "filiale") return a.filiale.localeCompare(b.filiale);
                return a.name.localeCompare(b.name);
              };
              objs = [...objs].sort(sortFn);
              const projectObjs = objs.filter(o => o.type === "project");
              const personalObjs = objs.filter(o => o.type === "personal");
              return (
                <>
                  {(objFilter.type === "all" || objFilter.type === "project") && projectObjs.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-primary-500 mb-3 uppercase tracking-wider">Objectifs projets ({projectObjs.length})</h2>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {projectObjs.map(o => {
                          const p = objProg(o.id); const pc = objPlans(o.id).length; const tc = objTasks(o.id).length; const kc = objKpis(o.id).length;
                          return (
                            <div key={o.id} onClick={() => setSelObj(o)} className="bg-white rounded-xl p-4 border border-primary-200 hover:border-primary-300 cursor-pointer transition-all">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1"><Badge label={o.filiale} color={FC[o.filiale]} /><span className="text-xs text-primary-400">{o.poids}%</span></div>
                                  <p className="text-sm font-medium truncate">{o.name}</p>
                                  <p className="text-xs text-primary-400 mt-0.5">{pc} plan(s) • {tc} tâche(s) • {kc} KPI(s)</p>
                                </div>
                                <p className="text-xl font-bold flex-shrink-0" style={{ color: gc(p / 10) }}>{p}%</p>
                              </div>
                              <MiniBar value={p} color={gc(p / 10)} h="h-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {(objFilter.type === "all" || objFilter.type === "personal") && personalObjs.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-primary-500 mb-3 uppercase tracking-wider">Objectifs personnels ({personalObjs.length})</h2>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {personalObjs.map(o => {
                          const note = data.notes[`${o.id}_${period}`] || 0;
                          return (
                            <div key={o.id} onClick={() => setSelObj(o)} className="bg-white rounded-xl p-3 border border-primary-200 hover:border-primary-300 cursor-pointer flex items-center justify-between">
                              <div><p className="text-sm font-medium">{o.name}</p><p className="text-xs text-primary-400">{o.poids}%</p></div>
                              <p className="text-lg font-bold" style={{ color: gc(note) }}>{note || "—"}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {objs.length === 0 && <p className="text-sm text-primary-400 text-center py-8">Aucun objectif ne correspond aux filtres.</p>}
                </>
              );
            })()}
          </div>
        )}
        {tab === "objectives" && selObj && (
          <ObjectiveDetail
            obj={selObj} data={data} period={period}
            objPlans={objPlans} objTasks={objTasks} objKpis={objKpis} objLogs={objLogs} objProg={objProg}
            planTasks={planTasks} taskProg={taskProg} kpiCurrent={kpiCurrent}
            moveTask={moveTask} addLog={addLog} upd={upd} setSelObj={setSelObj} setModal={setModal}
          />
        )}

        {/* PLANS D'ACTION */}
        {tab === "plans" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[150px]"><input className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary-400" placeholder="🔍 Rechercher un plan..." value={planFilter.search} onChange={e => setPlanFilter(f => ({ ...f, search: e.target.value }))} /></div>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={planFilter.statut} onChange={e => setPlanFilter(f => ({ ...f, statut: e.target.value }))}><option value="all">Tous statuts</option><option value="a_faire">À faire</option><option value="en_cours">En cours</option><option value="termine">Terminé</option><option value="bloque">Bloqué</option></select>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={planFilter.priorite} onChange={e => setPlanFilter(f => ({ ...f, priorite: e.target.value }))}><option value="all">Toutes priorités</option><option value="critique">Critique</option><option value="haute">Haute</option><option value="moyenne">Moyenne</option><option value="basse">Basse</option></select>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={planFilter.filiale} onChange={e => setPlanFilter(f => ({ ...f, filiale: e.target.value }))}><option value="all">Toutes filiales</option>{Object.keys(FC).map(f => <option key={f} value={f}>{f}</option>)}</select>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={planFilter.sort} onChange={e => setPlanFilter(f => ({ ...f, sort: e.target.value }))}><option value="name">Tri : Nom</option><option value="avancement">Tri : Avancement</option><option value="date">Tri : Échéance</option><option value="priorite">Tri : Priorité</option><option value="statut">Tri : Statut</option></select>
            </div>
            {(() => {
              const allPlans = Object.values(data.plans);
              let plans = allPlans.filter(plan => {
                const obj = ALL_OBJ.find(o => o.id === plan.objId);
                if (planFilter.statut !== "all" && (plan.statut || "a_faire") !== planFilter.statut) return false;
                if (planFilter.priorite !== "all" && (plan.priorite || "moyenne") !== planFilter.priorite) return false;
                if (planFilter.filiale !== "all" && obj?.filiale !== planFilter.filiale) return false;
                if (planFilter.search.trim()) { const s = planFilter.search.toLowerCase(); if (!plan.name.toLowerCase().includes(s) && !(plan.responsable || "").toLowerCase().includes(s) && !(obj?.name || "").toLowerCase().includes(s)) return false; }
                return true;
              });
              const priOrd: Record<string, number> = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
              const stOrd: Record<string, number> = { bloque: 0, a_faire: 1, en_cours: 2, termine: 3 };
              plans = [...plans].sort((a, b) => {
                if (planFilter.sort === "avancement") return (b.avancement || 0) - (a.avancement || 0);
                if (planFilter.sort === "date") return (a.target_date || "9999").localeCompare(b.target_date || "9999");
                if (planFilter.sort === "priorite") return (priOrd[a.priorite || "moyenne"] ?? 2) - (priOrd[b.priorite || "moyenne"] ?? 2);
                if (planFilter.sort === "statut") return (stOrd[a.statut || "a_faire"] ?? 1) - (stOrd[b.statut || "a_faire"] ?? 1);
                return a.name.localeCompare(b.name);
              });
              const stCfg: Record<string, { l: string; c: string }> = { a_faire: { l: "À faire", c: "text-primary-500 bg-primary-100" }, en_cours: { l: "En cours", c: "text-info-700 bg-info-100" }, termine: { l: "Terminé", c: "text-success-700 bg-success-100" }, bloque: { l: "Bloqué", c: "text-error-700 bg-error-100" } };
              const priCfg: Record<string, { l: string; c: string }> = { critique: { l: "Critique", c: "text-error-600" }, haute: { l: "Haute", c: "text-warning-600" }, moyenne: { l: "Moyenne", c: "text-primary-500" }, basse: { l: "Basse", c: "text-primary-400" } };
              return plans.length === 0
                ? <div className="bg-white rounded-xl p-12 border border-primary-200 text-center"><p className="text-sm text-primary-400">{allPlans.length === 0 ? "Aucun plan d'action. Créez-en un depuis la fiche d'un objectif." : "Aucun plan ne correspond aux filtres."}</p></div>
                : <div className="space-y-2">{plans.map(plan => {
                    const obj = ALL_OBJ.find(o => o.id === plan.objId);
                    const tasks = planTasks(plan.id);
                    const doneT = tasks.filter(t => t.status === "done").length;
                    const av = plan.avancement || 0;
                    const st = stCfg[plan.statut || "a_faire"] || stCfg.a_faire;
                    const pri = priCfg[plan.priorite || "moyenne"] || priCfg.moyenne;
                    return (
                      <div key={plan.id} onClick={() => setModal({ type: "plan", data: plan as unknown as Record<string, unknown> })} className="bg-white rounded-xl p-4 border border-primary-200 hover:border-primary-300 cursor-pointer transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.c}`}>{st.l}</span>
                              {obj && <Badge label={obj.filiale} color={FC[obj.filiale]} small />}
                              <span className={`text-xs font-medium ${pri.c}`}>{pri.l}</span>
                            </div>
                            <p className="text-sm font-semibold text-primary-800 truncate">{plan.name}</p>
                            <p className="text-xs text-primary-400 mt-0.5 truncate">
                              {obj?.name || "—"}
                              {plan.responsable && <span> — {plan.responsable}</span>}
                              {plan.target_date && <span> — Échéance : {fmtDate(plan.target_date)}</span>}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1"><MiniBar value={av} color={gc(av / 10)} h="h-1.5" /></div>
                              <span className="text-xs font-bold" style={{ color: gc(av / 10) }}>{av}%</span>
                              <span className="text-xs text-primary-400">{doneT}/{tasks.length} tâche(s)</span>
                              {(plan.sous_taches?.length || 0) > 0 && <span className="text-xs text-primary-400">{plan.sous_taches?.filter(s => s.fait).length}/{plan.sous_taches?.length} sous-tâche(s)</span>}
                              {(plan.livrables?.length || 0) > 0 && <span className="text-xs text-primary-400">{plan.livrables?.filter(l => l.fait).length}/{plan.livrables?.length} livrable(s)</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}</div>;
            })()}
          </div>
        )}

        {/* TASKS */}
        {tab === "tasks" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-primary-100 rounded-lg p-0.5">
                {[{ k: "kanban", l: "▦ Kanban" }, { k: "list", l: "☰ Liste" }, { k: "calendar", l: "📅 Calendrier" }, { k: "gantt", l: "▬ Gantt" }].map(v => (
                  <button key={v.k} onClick={() => setTaskView(v.k)} className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${taskView === v.k ? "bg-primary-900 text-white" : "text-primary-500 hover:text-primary-900"}`}>{v.l}</button>
                ))}
              </div>
              <div className="flex-1 min-w-[150px]"><input className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary-400" placeholder="🔍 Rechercher..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} /></div>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}><option value="all">Statuts</option>{STATUSES.map(s => <option key={s} value={s}>{SL[s]}</option>)}</select>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}><option value="all">Priorités</option>{PRIO.map(p => <option key={p} value={p}>{PL[p]}</option>)}</select>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={filter.filiale} onChange={e => setFilter(f => ({ ...f, filiale: e.target.value }))}><option value="all">Filiales</option>{Object.keys(FC).map(f => <option key={f} value={f}>{f}</option>)}</select>
              <button onClick={() => { if (!Object.keys(data.plans).length) { alert("Créez d'abord un plan d'action."); return; } setModal({ type: "task", data: { planId: Object.keys(data.plans)[0] } }); }} className="bg-primary-900 hover:bg-primary-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium">+ Tâche</button>
            </div>
            <div className="bg-white rounded-xl p-3 border border-primary-200">
              {taskView === "kanban" && <KanbanView tasks={filteredTasks} getTaskObj={getTaskObj} getTaskPlan={getTaskPlan} moveTask={moveTask} setModal={setModal} />}
              {taskView === "list" && <ListView tasks={filteredTasks} getTaskObj={getTaskObj} getTaskPlan={getTaskPlan} moveTask={moveTask} setModal={setModal} />}
              {taskView === "calendar" && <CalendarView tasks={filteredTasks} calMonth={calMonth} calYear={calYear} setCalMonth={setCalMonth} setCalYear={setCalYear} getTaskObj={getTaskObj} setModal={setModal} />}
              {taskView === "gantt" && <GanttView tasks={filteredTasks} ganttStart={ganttStart} setGanttStart={setGanttStart} getTaskObj={getTaskObj} setModal={setModal} />}
            </div>
          </div>
        )}

        {/* EVALUATION */}
        {tab === "eval" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 border border-primary-200 text-center">
              <h2 className="text-base font-semibold text-primary-500 mb-1">ÉVALUATION {period === "s1" ? "S1" : "S2"}</h2>
              <p className="text-5xl font-extrabold mt-3" style={{ color: gc(totalBonus * 10 / 30) }}>{totalBonus.toFixed(1)}%</p>
              <p className="text-xs text-primary-400 mt-1">Bonus / 30%</p>
              <div className="w-48 mx-auto mt-3"><MiniBar value={totalBonus} max={30} color={gc(totalBonus * 10 / 30)} h="h-2" /></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={evalFilter.type} onChange={e => setEvalFilter(f => ({ ...f, type: e.target.value }))}><option value="all">Tous types</option><option value="personal">Personnels</option><option value="project">Projets</option></select>
              <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={evalFilter.filiale} onChange={e => setEvalFilter(f => ({ ...f, filiale: e.target.value }))}><option value="all">Toutes filiales</option>{Object.keys(FC).map(f => <option key={f} value={f}>{f}</option>)}</select>
            </div>
            {[{ title: "Objectifs personnels (10%)", objs: PERSONAL_OBJ, type: "personal" }, { title: "Objectifs projets (10%)", objs: PROJECT_OBJ, type: "project" }].filter(g => evalFilter.type === "all" || evalFilter.type === g.type).map(({ title, objs }) => {
              const filtered = evalFilter.filiale === "all" ? objs : objs.filter(o => o.filiale === evalFilter.filiale);
              if (filtered.length === 0) return null;
              return (
                <div key={title} className="bg-white rounded-xl p-4 border border-primary-200">
                  <h3 className="text-sm font-semibold text-primary-500 mb-3">{title}</h3>
                  {filtered.map(o => {
                    const note = data.notes[`${o.id}_${period}`] || 0;
                    const prog = objProg(o.id);
                    const sal = (note / 10) * (o.poids / 100) * 10;
                    return (
                      <div key={o.id} className="flex items-center gap-2 py-2.5 border-b border-primary-100 last:border-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: FC[o.filiale] }} />
                        <span className="text-xs flex-1 truncate">{o.name}</span>
                        <span className="text-xs text-primary-400 w-10 text-right">{o.poids}%</span>
                        {o.type === "project" && <span className="text-xs w-10 text-right hidden sm:block" style={{ color: gc(prog / 10) }}>{prog}%</span>}
                        <input type="number" min="0" max="10" step="0.5" value={note || ""} placeholder="—" onChange={e => upd(d => { d.notes[`${o.id}_${period}`] = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)); return d; })} className="w-14 bg-primary-100 border border-primary-200 rounded px-2 py-1 text-xs text-center font-bold focus:outline-none focus:border-primary-400" style={{ color: gc(note) }} />
                        <span className="text-xs text-primary-400 w-14 text-right">{sal.toFixed(2)}%</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* RAPPORT */}
        {tab === "report" && (
          <ReportView
            data={data} period={period} allTasks={allTasks} overdueTasks={overdueTasks}
            kpiCurrent={kpiCurrent} objPlans={objPlans} objTasks={objTasks} objKpis={objKpis}
            objLogs={objLogs} objProg={objProg} planTasks={planTasks} taskProg={taskProg}
            getTaskObj={getTaskObj} getTaskPlan={getTaskPlan}
            personalBonus={personalBonus} projectBonus={projectBonus} totalBonus={totalBonus}
            reportSection={reportSection} setReportSection={setReportSection}
          />
        )}
      </div>

      {modal?.type === "task" && <TaskModal task={modal.data} data={data} upd={upd} onClose={() => setModal(null)} />}
      {modal?.type === "plan" && <PlanModal plan={modal.data} objId={(modal.data.objId as string) || ""} data={data} upd={upd} planTasks={planTasks} onClose={() => setModal(null)} />}
      {modal?.type === "kpi" && <KpiModal kpi={modal.data} objId={(modal.data.objId as string) || ""} data={data} upd={upd} onClose={() => setModal(null)} />}
    </div>
  );
}
