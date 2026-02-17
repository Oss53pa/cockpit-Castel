import type { Task, Kpi, PerfData, Objective } from '../types';
import { gc, fmtDate, fmtDateFull, isOverdue, daysBetween } from '../utils';
import { ALL_OBJ, PERSONAL_OBJ, PROJECT_OBJ, FC, STATUSES, SL, SC, SI, PRIO, PL, PC } from '../constants';
import { Badge } from '../components/Badge';
import { MiniBar } from '../components/MiniBar';

interface ReportViewProps {
  data: PerfData;
  period: string;
  allTasks: Task[];
  overdueTasks: Task[];
  kpiCurrent: (k: Kpi) => number;
  objPlans: (oid: string) => PerfData['plans'][string][];
  objTasks: (oid: string) => Task[];
  objKpis: (oid: string) => Kpi[];
  objLogs: (oid: string) => PerfData['logs'][string];
  objProg: (oid: string) => number;
  planTasks: (pid: string) => Task[];
  taskProg: (tasks: Task[]) => number;
  getTaskObj: (t: Task) => Objective | null;
  getTaskPlan: (t: Task) => PerfData['plans'][string] | undefined;
  personalBonus: number;
  projectBonus: number;
  totalBonus: number;
  reportSection: string;
  setReportSection: (s: string) => void;
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-6 first:mt-0">
      <span className="text-lg">{icon}</span>
      <h2 className="text-lg font-bold text-primary-900">{title}</h2>
      <div className="flex-1 h-px bg-primary-100 ml-2" />
    </div>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-primary-50 rounded-lg p-3 border border-primary-200/50">
      <p className="text-xs text-primary-400">{label}</p>
      <p className="text-2xl font-bold" style={{ color: color || "#18181b" }}>{value}</p>
      {sub && <p className="text-xs text-primary-400">{sub}</p>}
    </div>
  );
}

export function ReportView({
  data, period, allTasks, overdueTasks, kpiCurrent,
  objPlans, objTasks, objKpis, objLogs, objProg, planTasks, taskProg,
  getTaskObj, getTaskPlan,
  personalBonus, projectBonus, totalBonus,
  reportSection, setReportSection,
}: ReportViewProps) {
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.status === "done").length;
  const inProgTasks = allTasks.filter(t => t.status === "in_progress").length;
  const inRevTasks = allTasks.filter(t => t.status === "in_review").length;
  const todoTasks = allTasks.filter(t => t.status === "todo").length;
  const criticalTasks = allTasks.filter(t => t.priority === "critical" && t.status !== "done");
  const allKpis = Object.values(data.kpis);
  const allLogs = ALL_OBJ.flatMap(o => (data.logs[o.id] || []).map(l => ({ ...l, objName: o.name, objId: o.id }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filialeStats: Record<string, { objs: number; tasks: number; done: number; overdue: number; avgProg: number; avgNote: number; bonus: number }> = {};
  Object.keys(FC).forEach(f => {
    const objs = PROJECT_OBJ.filter(o => o.filiale === f);
    if (!objs.length) return;
    const tasks = objs.flatMap(o => objTasks(o.id));
    const done = tasks.filter(t => t.status === "done").length;
    const overdue = tasks.filter(isOverdue).length;
    const avgProg = objs.length ? Math.round(objs.reduce((s, o) => s + objProg(o.id), 0) / objs.length) : 0;
    const avgNote = objs.length ? (objs.reduce((s, o) => s + (data.notes[`${o.id}_${period}`] || 0), 0) / objs.length) : 0;
    filialeStats[f] = { objs: objs.length, tasks: tasks.length, done, overdue, avgProg, avgNote, bonus: objs.reduce((s, o) => { const n = data.notes[`${o.id}_${period}`] || 0; return s + (n / 10) * (o.poids / 100) * 10; }, 0) };
  });

  const sections = [
    { k: "summary", l: "Synthèse générale" },
    { k: "projects", l: "Objectifs projets détaillés" },
    { k: "personal", l: "Objectifs personnels" },
    { k: "filiales", l: "Performance par filiale" },
    { k: "tasks_overview", l: "Vue d'ensemble des tâches" },
    { k: "kpis_all", l: "Tableau des KPIs" },
    { k: "risks", l: "Risques et alertes" },
    { k: "journal", l: "Journal des activités" },
    { k: "bonus", l: "Simulation bonus" },
  ];

  return (
    <div className="space-y-2">
      {/* Report Header */}
      <div className="bg-white rounded-xl p-6 border border-primary-200 text-center">
        <p className="text-xs text-primary-400 uppercase tracking-widest mb-1">Rocklane Capital Partners</p>
        <h1 className="text-2xl font-extrabold text-primary-900 font-display">Rapport de performance</h1>
        <p className="text-base text-primary-500 mt-1">Pamela Atokouna</p>
        <p className="text-xs text-primary-400 mt-1">Période : {period === "s1" ? "Semestre 1 (Jan — Juin)" : "Année complète (Jan — Déc)"} • Généré le {today}</p>
      </div>

      {/* Section Nav */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {sections.map(s => (
          <button key={s.k} onClick={() => setReportSection(s.k)} className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${reportSection === s.k ? "bg-primary-900 text-white" : "bg-primary-100 text-primary-500 hover:text-primary-900"}`}>{s.l}</button>
        ))}
      </div>

      {/* SYNTHESE */}
      {reportSection === "summary" && (
        <div className="bg-white rounded-xl p-5 border border-primary-200 space-y-5">
          <SectionTitle icon="📊" title="Synthèse générale" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Bonus Total Estimé" value={`${totalBonus.toFixed(1)}%`} sub="sur 30% maximum" color={gc(totalBonus * 10 / 30)} />
            <StatBox label="Tâches Complétées" value={`${doneTasks}/${totalTasks}`} sub={totalTasks ? `${Math.round((doneTasks / totalTasks) * 100)}% réalisé` : "Aucune tâche"} color="#22c55e" />
            <StatBox label="En Retard" value={overdueTasks.length} sub="tâche(s) en souffrance" color={overdueTasks.length ? "#ef4444" : "#22c55e"} />
            <StatBox label="KPIs Suivis" value={allKpis.length} sub={`${allKpis.filter(k => { const c = kpiCurrent(k); const t = parseFloat(k.target) || 1; return c >= t; }).length} atteints`} color="#06b6d4" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Bonus Personnel" value={`${personalBonus.toFixed(1)}%`} sub="/10%" color={gc(personalBonus)} />
            <StatBox label="Bonus Projets" value={`${projectBonus.toFixed(1)}%`} sub="/10%" color={gc(projectBonus)} />
            <StatBox label="Bonus Groupe" value="—" sub="/10% (fixé par DG)" color="#6b7280" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-500 mb-2">Répartition des tâches par statut</p>
            <div className="flex h-6 rounded-full overflow-hidden bg-primary-100">
              {totalTasks > 0 && <>
                {doneTasks > 0 && <div style={{ width: `${(doneTasks / totalTasks) * 100}%`, backgroundColor: SC.done }} className="flex items-center justify-center"><span className="text-[8px] text-white font-bold">{doneTasks}</span></div>}
                {inRevTasks > 0 && <div style={{ width: `${(inRevTasks / totalTasks) * 100}%`, backgroundColor: SC.in_review }} className="flex items-center justify-center"><span className="text-[8px] text-white font-bold">{inRevTasks}</span></div>}
                {inProgTasks > 0 && <div style={{ width: `${(inProgTasks / totalTasks) * 100}%`, backgroundColor: SC.in_progress }} className="flex items-center justify-center"><span className="text-[8px] text-white font-bold">{inProgTasks}</span></div>}
                {todoTasks > 0 && <div style={{ width: `${(todoTasks / totalTasks) * 100}%`, backgroundColor: SC.todo }} className="flex items-center justify-center"><span className="text-[8px] text-white font-bold">{todoTasks}</span></div>}
              </>}
            </div>
            <div className="flex gap-4 mt-2">{STATUSES.map(s => <div key={s} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: SC[s] }} /><span className="text-xs text-primary-500">{SL[s]}: {allTasks.filter(t => t.status === s).length}</span></div>)}</div>
          </div>
        </div>
      )}

      {/* PROJETS DETAILLES */}
      {reportSection === "projects" && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-5 border border-primary-200"><SectionTitle icon="🎯" title="Objectifs projets — détail complet" /></div>
          {PROJECT_OBJ.map(o => {
            const plans = objPlans(o.id); const tasks = objTasks(o.id); const kpis = objKpis(o.id); const logs = objLogs(o.id); const prog = objProg(o.id); const note = data.notes[`${o.id}_${period}`] || 0;
            const doneT = tasks.filter(t => t.status === "done").length; const odTasks = tasks.filter(isOverdue).length;
            return (
              <div key={o.id} className="bg-white rounded-xl border border-primary-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div><div className="flex items-center gap-2 mb-1"><Badge label={o.filiale} color={FC[o.filiale]} /><Badge label={`${o.poids}%`} color="#6b7280" /></div><h3 className="text-sm font-bold">{o.name}</h3></div>
                    <div className="flex gap-4 text-center">
                      <div><p className="text-lg font-bold" style={{ color: gc(prog / 10) }}>{prog}%</p><p className="text-xs text-primary-400">Avancement</p></div>
                      <div><p className="text-lg font-bold" style={{ color: gc(note) }}>{note || "—"}</p><p className="text-xs text-primary-400">Note</p></div>
                    </div>
                  </div>
                  <MiniBar value={prog} h="h-1.5" color={gc(prog / 10)} />
                  <div className="flex gap-4 mt-2 text-xs text-primary-500">
                    <span>{plans.length} plan(s)</span><span>{tasks.length} tâche(s)</span><span className="text-primary-600">{doneT} terminée(s)</span>
                    {odTasks > 0 && <span className="text-error-600">⚠ {odTasks} en retard</span>}
                  </div>
                  {kpis.length > 0 && <div className="mt-3"><p className="text-xs text-primary-400 font-bold mb-1">KPIs:</p><div className="flex flex-wrap gap-2">{kpis.map(k => { const cur = kpiCurrent(k); const tar = parseFloat(k.target) || 1; const pct = Math.min(100, Math.round((cur / tar) * 100)); return (<div key={k.id} className="bg-primary-100 rounded px-2 py-1 text-xs"><span className="text-primary-500">{k.name}: </span><span className="font-bold" style={{ color: gc(pct / 10) }}>{cur}</span><span className="text-primary-400">/{k.target} {k.unit}</span></div>); })}</div></div>}
                  {plans.map(p => { const pt = planTasks(p.id); const pp = taskProg(pt); return (
                    <div key={p.id} className="mt-3 bg-primary-50 rounded-lg p-3 border border-primary-200/50">
                      <div className="flex items-center justify-between mb-1"><p className="text-xs font-semibold">{p.name}</p><span className="text-xs font-bold" style={{ color: gc(pp / 10) }}>{pp}%</span></div>
                      {p.target_date && <p className="text-xs text-primary-400 mb-1">Cible: {fmtDateFull(p.target_date)}</p>}
                      <MiniBar value={pp} h="h-1" color={gc(pp / 10)} />
                      <div className="mt-2 space-y-0.5">{pt.map(t => (
                        <div key={t.id} className="flex items-center gap-2 text-xs py-0.5">
                          <span style={{ color: SC[t.status] }}>{SI[t.status]}</span>
                          <span className={`flex-1 ${t.status === "done" ? "line-through text-primary-400" : ""}`}>{t.title}</span>
                          <Badge label={PL[t.priority]} color={PC[t.priority]} small />
                          {t.deadline && <span className={isOverdue(t) ? "text-error-600" : "text-primary-400"}>{fmtDate(t.deadline)}</span>}
                          {t.subtasks?.length > 0 && <span className="text-primary-400">{t.subtasks.filter(s => s.done).length}/{t.subtasks.length} st</span>}
                        </div>
                      ))}</div>
                    </div>
                  ); })}
                  {logs.length > 0 && <div className="mt-3"><p className="text-xs text-primary-400 font-bold mb-1">Journal récent:</p>{logs.slice(0, 3).map(l => (<div key={l.id} className="text-xs text-primary-500 py-0.5 flex gap-2"><span className="text-primary-400">{new Date(l.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span><span>{l.text}</span></div>))}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PERSONNEL */}
      {reportSection === "personal" && (
        <div className="bg-white rounded-xl p-5 border border-primary-200">
          <SectionTitle icon="👤" title="Objectifs personnels" />
          <p className="text-xs text-primary-500 mb-4">Évaluation qualitative — 10 critères pondérés à 10% chacun. Bonus personnel maximum: 10% du salaire.</p>
          <div className="space-y-2">
            {PERSONAL_OBJ.map(o => {
              const note = data.notes[`${o.id}_${period}`] || 0; const sal = (note / 10) * (o.poids / 100) * 10; const logs = objLogs(o.id); const kpis = objKpis(o.id);
              return (
                <div key={o.id} className="bg-primary-50 rounded-lg p-3 border border-primary-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{o.name}</p>
                      {kpis.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{kpis.map(k => (<span key={k.id} className="text-[9px] bg-primary-200 rounded px-1.5 py-0.5 text-primary-700">{k.name}: {kpiCurrent(k)}/{k.target} {k.unit}</span>))}</div>}
                      {logs.length > 0 && <p className="text-xs text-primary-400 mt-1 italic">Dernière note: {logs[0].text}</p>}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold" style={{ color: gc(note) }}>{note || "—"}<span className="text-xs text-primary-400">/10</span></p>
                      <p className="text-xs text-primary-400">{sal.toFixed(2)}% salaire</p>
                    </div>
                  </div>
                  <MiniBar value={note} max={10} h="h-1" color={gc(note)} />
                </div>
              );
            })}
          </div>
          <div className="mt-4 bg-primary-100 rounded-lg p-3 text-center">
            <p className="text-xs text-primary-500">Total Bonus Personnel</p>
            <p className="text-2xl font-bold" style={{ color: gc(personalBonus) }}>{personalBonus.toFixed(1)}%<span className="text-sm text-primary-400"> / 10%</span></p>
          </div>
        </div>
      )}

      {/* FILIALES */}
      {reportSection === "filiales" && (
        <div className="bg-white rounded-xl p-5 border border-primary-200">
          <SectionTitle icon="🏢" title="Performance par filiale" />
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(filialeStats).map(([f, s]) => (
              <div key={f} className="bg-primary-50 rounded-xl p-4 border border-primary-200/50">
                <div className="flex items-center gap-2 mb-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: FC[f] }} /><h3 className="text-sm font-bold">{f}</h3></div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div><p className="text-lg font-bold" style={{ color: gc(s.avgProg / 10) }}>{s.avgProg}%</p><p className="text-xs text-primary-400">Avancement moyen</p></div>
                  <div><p className="text-lg font-bold" style={{ color: gc(s.avgNote) }}>{s.avgNote.toFixed(1)}</p><p className="text-xs text-primary-400">Note moyenne</p></div>
                  <div><p className="text-lg font-bold text-primary-900">{s.done}/{s.tasks}</p><p className="text-xs text-primary-400">Tâches terminées</p></div>
                  <div><p className="text-lg font-bold" style={{ color: s.overdue ? "#ef4444" : "#22c55e" }}>{s.overdue}</p><p className="text-xs text-primary-400">En retard</p></div>
                </div>
                <div className="mt-2"><p className="text-xs text-primary-500">{s.objs} objectif(s) • Bonus: <span className="font-bold" style={{ color: gc(s.bonus) }}>{s.bonus.toFixed(2)}%</span></p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TASKS OVERVIEW */}
      {reportSection === "tasks_overview" && (
        <div className="bg-white rounded-xl p-5 border border-primary-200">
          <SectionTitle icon="✅" title="Vue d'ensemble des tâches" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatBox label="Total" value={totalTasks} color="#18181b" />
            <StatBox label="Terminées" value={doneTasks} sub={totalTasks ? `${Math.round((doneTasks / totalTasks) * 100)}%` : ""} color="#22c55e" />
            <StatBox label="En cours" value={inProgTasks + inRevTasks} color="#3b82f6" />
            <StatBox label="En retard" value={overdueTasks.length} color={overdueTasks.length ? "#ef4444" : "#22c55e"} />
          </div>
          <p className="text-sm font-semibold text-primary-500 mb-2">Par priorité</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRIO.map(p => { const c = allTasks.filter(t => t.priority === p); const d = c.filter(t => t.status === "done").length; return (
              <div key={p} className="bg-primary-50 rounded-lg p-2 border border-primary-200/50 text-center">
                <Badge label={PL[p]} color={PC[p]} /><p className="text-sm font-bold mt-1">{c.length}</p><p className="text-xs text-primary-400">{d} terminée(s)</p>
              </div>
            ); })}
          </div>
          <p className="text-sm font-semibold text-primary-500 mb-2">Toutes les tâches</p>
          <div className="space-y-0.5 max-h-96 overflow-y-auto">
            {[...allTasks].sort((a, b) => { const po: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }; return (po[a.priority] ?? 4) - (po[b.priority] ?? 4); }).map(t => {
              const obj = getTaskObj(t); const plan = getTaskPlan(t);
              return (
                <div key={t.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded hover:bg-primary-50 border-b border-primary-100">
                  <span style={{ color: SC[t.status] }}>{SI[t.status]}</span>
                  <span className={`flex-1 truncate ${t.status === "done" ? "line-through text-primary-400" : ""}`}>{t.title}</span>
                  {obj && <Badge label={obj.filiale} color={FC[obj.filiale]} small />}
                  {plan && <span className="text-primary-400 truncate max-w-[80px]">{plan.name}</span>}
                  <Badge label={PL[t.priority]} color={PC[t.priority]} small />
                  {t.deadline && <span className={isOverdue(t) ? "text-error-600 font-bold" : "text-primary-400"}>{fmtDate(t.deadline)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALL KPIs */}
      {reportSection === "kpis_all" && (
        <div className="bg-white rounded-xl p-5 border border-primary-200">
          <SectionTitle icon="📊" title="Tableau des KPIs" />
          {allKpis.length === 0
            ? <p className="text-sm text-primary-400 py-8 text-center">Aucun KPI défini. Ajoutez des KPIs dans chaque objectif.</p>
            : <div className="space-y-2">
                {ALL_OBJ.filter(o => objKpis(o.id).length > 0).map(o => (
                  <div key={o.id}>
                    <div className="flex items-center gap-2 mb-1 mt-3"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: FC[o.filiale] }} /><p className="text-xs font-bold text-primary-500">{o.name}</p></div>
                    {objKpis(o.id).map(k => { const cur = kpiCurrent(k); const tar = parseFloat(k.target) || 1; const pct = Math.min(100, Math.round((cur / tar) * 100)); const atteint = cur >= tar; return (
                      <div key={k.id} className="flex items-center gap-3 bg-primary-50 rounded-lg p-2.5 border border-primary-200/50">
                        <span className={`text-sm ${atteint ? "text-primary-600" : "text-primary-500"}`}>{atteint ? "✓" : "○"}</span>
                        <span className="text-xs flex-1">{k.name}</span>
                        <div className="w-24"><MiniBar value={pct} h="h-1" color={gc(pct / 10)} /></div>
                        <span className="text-xs font-bold" style={{ color: gc(pct / 10) }}>{cur}</span>
                        <span className="text-xs text-primary-400">/ {k.target} {k.unit}</span>
                        <span className="text-xs font-bold" style={{ color: gc(pct / 10) }}>{pct}%</span>
                      </div>
                    ); })}
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* RISKS */}
      {reportSection === "risks" && (
        <div className="bg-white rounded-xl p-5 border border-primary-200 space-y-4">
          <SectionTitle icon="⚠" title="Risques et alertes" />
          <div>
            <p className="text-xs font-bold text-error-600 mb-2">Tâches en retard ({overdueTasks.length})</p>
            {overdueTasks.length === 0
              ? <p className="text-xs text-primary-400 bg-success-50 rounded-lg p-3 text-center">✓ Aucune tâche en retard</p>
              : <div className="space-y-1">{[...overdueTasks].sort((a, b) => new Date(a.deadline || "").getTime() - new Date(b.deadline || "").getTime()).map(t => { const obj = getTaskObj(t); const daysLate = daysBetween(t.deadline || "", new Date().toISOString().slice(0, 10)); return (
                  <div key={t.id} className="flex items-center gap-2 bg-error-50 rounded-lg p-2.5 border border-error-200 text-xs">
                    <span className="text-error-600 font-bold">-{daysLate}j</span>
                    <span className="flex-1 text-primary-700">{t.title}</span>
                    {obj && <Badge label={obj.filiale} color={FC[obj.filiale]} small />}
                    <Badge label={PL[t.priority]} color={PC[t.priority]} small />
                    <span className="text-error-600">{fmtDate(t.deadline)}</span>
                  </div>
                ); })}</div>
            }
          </div>
          <div>
            <p className="text-xs font-bold text-warning-600 mb-2">Tâches critiques non terminées ({criticalTasks.length})</p>
            {criticalTasks.length === 0
              ? <p className="text-xs text-primary-400 bg-success-50 rounded-lg p-3 text-center">✓ Toutes les tâches critiques sont terminées</p>
              : <div className="space-y-1">{criticalTasks.map(t => { const obj = getTaskObj(t); return (
                  <div key={t.id} className="flex items-center gap-2 bg-warning-50 rounded-lg p-2.5 border border-warning-200 text-xs">
                    <span style={{ color: SC[t.status] }}>{SI[t.status]}</span>
                    <span className="flex-1 text-primary-700">{t.title}</span>
                    {obj && <Badge label={obj.filiale} color={FC[obj.filiale]} small />}
                    {t.deadline && <span className={isOverdue(t) ? "text-error-600" : "text-primary-400"}>{fmtDate(t.deadline)}</span>}
                  </div>
                ); })}</div>
            }
          </div>
          <div>
            <p className="text-xs font-bold text-warning-600 mb-2">Objectifs sans avancement</p>
            {(() => {
              const noProgress = PROJECT_OBJ.filter(o => objProg(o.id) === 0 && objTasks(o.id).length === 0);
              return noProgress.length === 0
                ? <p className="text-xs text-primary-400 bg-success-50 rounded-lg p-3 text-center">✓ Tous les objectifs ont des tâches</p>
                : <div className="space-y-1">{noProgress.map(o => (<div key={o.id} className="flex items-center gap-2 bg-warning-50 rounded-lg p-2.5 border border-warning-200 text-xs"><Badge label={o.filiale} color={FC[o.filiale]} small /><span className="text-primary-700">{o.name}</span><span className="ml-auto text-warning-600">Aucune tâche créée</span></div>))}</div>;
            })()}
          </div>
        </div>
      )}

      {/* JOURNAL */}
      {reportSection === "journal" && (
        <div className="bg-white rounded-xl p-5 border border-primary-200">
          <SectionTitle icon="📝" title="Journal des activités" />
          {allLogs.length === 0
            ? <p className="text-sm text-primary-400 py-8 text-center">Aucune entrée de journal.</p>
            : <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {allLogs.map(l => { const obj = ALL_OBJ.find(o => o.id === l.objId); return (
                  <div key={l.id} className="flex gap-3 py-2.5 border-b border-primary-100">
                    <div className="w-16 flex-shrink-0 text-right"><p className="text-xs text-primary-400">{new Date(l.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</p><p className="text-xs text-primary-400">{new Date(l.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p></div>
                    <div className="w-px bg-primary-200 flex-shrink-0" />
                    <div className="flex-1"><p className="text-xs text-primary-700">{l.text}</p>{obj && <div className="mt-1"><Badge label={obj.name.slice(0, 40)} color={FC[obj.filiale] || "#6b7280"} small /></div>}</div>
                  </div>
                ); })}
              </div>
          }
        </div>
      )}

      {/* BONUS */}
      {reportSection === "bonus" && (
        <div className="bg-white rounded-xl p-5 border border-primary-200 space-y-5">
          <SectionTitle icon="💰" title="Simulation bonus" />
          <div className="bg-primary-50 rounded-xl p-6 text-center border border-primary-200">
            <p className="text-xs text-primary-500 mb-1">Bonus Total Estimé ({period === "s1" ? "S1" : "S2"})</p>
            <p className="text-5xl font-extrabold" style={{ color: gc(totalBonus * 10 / 30) }}>{totalBonus.toFixed(1)}%</p>
            <p className="text-sm text-primary-400 mt-1">sur 30% maximum</p>
            <div className="w-64 mx-auto mt-3"><MiniBar value={totalBonus} max={30} h="h-3" color={gc(totalBonus * 10 / 30)} /></div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-200/50">
              <p className="text-sm text-primary-500 mb-3 font-bold">Personnel (10%)</p>
              {PERSONAL_OBJ.map(o => { const n = data.notes[`${o.id}_${period}`] || 0; const s = (n / 10) * (o.poids / 100) * 10; return (
                <div key={o.id} className="flex items-center justify-between text-xs py-1 border-b border-primary-200/50"><span className="text-primary-500 truncate mr-2">{o.name}</span><span className="font-bold" style={{ color: gc(n) }}>{s.toFixed(2)}%</span></div>
              ); })}
              <div className="mt-2 pt-2 border-t border-primary-300 flex justify-between"><span className="text-xs font-bold">Total</span><span className="text-sm font-bold" style={{ color: gc(personalBonus) }}>{personalBonus.toFixed(1)}%</span></div>
            </div>
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-200/50">
              <p className="text-sm text-primary-500 mb-3 font-bold">Projets (10%)</p>
              {PROJECT_OBJ.map(o => { const n = data.notes[`${o.id}_${period}`] || 0; const s = (n / 10) * (o.poids / 100) * 10; return (
                <div key={o.id} className="flex items-center justify-between text-xs py-1 border-b border-primary-200/50"><span className="text-primary-500 truncate mr-2">{o.name.slice(0, 25)}</span><span className="font-bold" style={{ color: gc(n) }}>{s.toFixed(2)}%</span></div>
              ); })}
              <div className="mt-2 pt-2 border-t border-primary-300 flex justify-between"><span className="text-xs font-bold">Total</span><span className="text-sm font-bold" style={{ color: gc(projectBonus) }}>{projectBonus.toFixed(1)}%</span></div>
            </div>
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-200/50">
              <p className="text-sm text-primary-500 mb-3 font-bold">Groupe (10%)</p>
              <div className="flex items-center justify-center h-32"><p className="text-xs text-primary-400 text-center">Fixé par le DG<br />en fin d&apos;année</p></div>
              <div className="mt-2 pt-2 border-t border-primary-300 flex justify-between"><span className="text-xs font-bold">Total</span><span className="text-sm font-bold text-primary-400">—</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
