/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ==================== TYPES ====================
interface Subtask { id: string; title: string; done: boolean; }
interface Task { id: string; title: string; description?: string; planId: string; priority: string; status: string; deadline?: string; startDate?: string; subtasks: Subtask[]; createdAt: string; }
interface GanttTask extends Task { _start: Date; _end: Date; }
interface PlanSousTache { id: string; libelle: string; avancement: number; fait: boolean; }
interface PlanLivrable { id: string; nom: string; fait: boolean; }
interface Plan { id: string; objId: string; name: string; description?: string; responsable?: string; statut?: string; avancement?: number; priorite?: string; date_debut?: string; target_date?: string; notes?: string; livrables?: PlanLivrable[]; sous_taches?: PlanSousTache[]; }
interface Kpi { id: string; objId: string; name: string; target: string; current: string; unit: string; planIds?: string[]; }
interface LogEntry { id: string; text: string; date: string; }
interface Objective { id: string; name: string; filiale: string; poids: number; type: string; }
interface PerfData { plans: Record<string, Plan>; tasks: Record<string, Task>; kpis: Record<string, Kpi>; notes: Record<string, number>; logs: Record<string, LogEntry[]>; }

// ==================== CONSTANTS ====================
const SK = "perf-pilot-2026-v5";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

const PERSONAL_OBJ: Objective[] = [
  { id:"p1", name:"Travail en équipe & Leadership", filiale:"Groupe", poids:10, type:"personal" },
  { id:"p2", name:"Loyauté", filiale:"Groupe", poids:10, type:"personal" },
  { id:"p3", name:"Stabilité émotive", filiale:"Groupe", poids:10, type:"personal" },
  { id:"p4", name:"Responsabilité", filiale:"Groupe", poids:10, type:"personal" },
  { id:"p5", name:"Sens de l'organisation", filiale:"Groupe", poids:10, type:"personal" },
  { id:"p6", name:"Mentoring", filiale:"Groupe", poids:10, type:"personal" },
  { id:"p7", name:"Assiduité, ponctualité", filiale:"Groupe", poids:10, type:"personal" },
  { id:"p8", name:"Communication", filiale:"Groupe", poids:10, type:"personal" },
  { id:"p9", name:"Analyse et synthèse", filiale:"Groupe", poids:10, type:"personal" },
  { id:"p10", name:"Autonomie & Ténacité", filiale:"Groupe", poids:10, type:"personal" },
];

const PROJECT_OBJ: Objective[] = [
  { id:"pr1", name:"Cosmos Angré - Process Pré-ouverture", filiale:"NH", poids:20, type:"project" },
  { id:"pr2", name:"Cosmos Angré - Suivi Leasing 100%", filiale:"NH", poids:10, type:"project" },
  { id:"pr3", name:"Cosmos Angré - Suivi construction", filiale:"NH", poids:5, type:"project" },
  { id:"pr4", name:"Castle Omega - Ouverture foodcourt", filiale:"NH", poids:5, type:"project" },
  { id:"pr5", name:"Castle Omega - Assistance équipe", filiale:"NH", poids:5, type:"project" },
  { id:"pr6", name:"Cosmos Yop - Performance financière", filiale:"EPSA", poids:7.5, type:"project" },
  { id:"pr7", name:"Cosmos Yop - Excellence opérationnelle", filiale:"EPSA", poids:7.5, type:"project" },
  { id:"pr8", name:"Cosmos Yop - Relations stakeholders", filiale:"EPSA", poids:7.5, type:"project" },
  { id:"pr9", name:"Cosmos Yop - Gouvernance & conformité", filiale:"EPSA", poids:2.5, type:"project" },
  { id:"pr10", name:"Cap Ivoire - Suivi Leasing 100%", filiale:"RCP", poids:10, type:"project" },
  { id:"pr11", name:"Cap Ivoire - Suivi construction", filiale:"RCP", poids:5, type:"project" },
  { id:"pr12", name:"Praedium Tech - Suivi transition", filiale:"Praedium", poids:5, type:"project" },
  { id:"pr13", name:"Support autres projets RCP", filiale:"RCP", poids:10, type:"project" },
];

const ALL_OBJ = [...PERSONAL_OBJ, ...PROJECT_OBJ];
const FC: Record<string, string> = { NH:"#8b5cf6", EPSA:"#06b6d4", RCP:"#f59e0b", Praedium:"#ec4899", Groupe:"#6366f1" };
const STATUSES = ["todo","in_progress","in_review","done"];
const SL: Record<string, string> = { todo:"À faire", in_progress:"En cours", in_review:"En revue", done:"Terminé" };
const SI: Record<string, string> = { todo:"○", in_progress:"◐", in_review:"◑", done:"●" };
const SC: Record<string, string> = { todo:"#6b7280", in_progress:"#3b82f6", in_review:"#f59e0b", done:"#22c55e" };
const PRIO = ["critical","high","medium","low"];
const PL: Record<string, string> = { critical:"Critique", high:"Haute", medium:"Moyenne", low:"Basse" };
const PC: Record<string, string> = { critical:"#ef4444", high:"#f97316", medium:"#eab308", low:"#6b7280" };

// ==================== UTILITIES ====================
const gc = (v: number | null | undefined): string => { if(!v||v===0)return"#6b7280"; if(v<4)return"#ef4444"; if(v<6)return"#f97316"; if(v<8)return"#eab308"; return"#22c55e"; };
const fmtDate = (d: string | undefined) => d ? new Date(d+"T00:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}) : "—";
const fmtDateFull = (d: string | undefined) => d ? new Date(d+"T00:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}) : "—";
const daysBetween = (a: string, b: string) => Math.ceil((new Date(b).getTime()-new Date(a).getTime())/(86400000));
const isOverdue = (t: Task) => t.deadline && t.status!=="done" && new Date(t.deadline+"T23:59:59") < new Date();

const initData = (): PerfData => ({ plans:{}, tasks:{}, kpis:{}, notes:{}, logs:{} });

// ==================== SMALL COMPONENTS ====================
const MiniBar = ({value, max=100, color="#22c55e", h="h-1.5"}: {value: number; max?: number; color?: string; h?: string}) => (
  <div className={`w-full ${h} rounded-full bg-primary-200 overflow-hidden`}>
    <div className={`${h} rounded-full transition-all duration-500`} style={{width:`${Math.min(100,max>0?(value/max)*100:0)}%`, backgroundColor:color}} />
  </div>
);

const Badge = ({label, color, small}: {label: string; color: string; small?: boolean}) => (
  <span className={`${small?"text-xs px-1.5 py-0.5":"text-xs px-1.5 py-0.5"} rounded font-medium`}
    style={{backgroundColor:color+"20", color}}>{label}</span>
);

// ==================== MAIN COMPONENT ====================
export function PerformancePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PerfData>(initData());
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [selObj, setSelObj] = useState<Objective | null>(null);
  const [taskView, setTaskView] = useState("kanban");
  const [modal, setModal] = useState<{type: string; data: any} | null>(null);
  const [period, setPeriod] = useState("s2");
  const [filter, setFilter] = useState({ status:"all", priority:"all", filiale:"all", search:"" });
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(2026);
  const [ganttStart, setGanttStart] = useState(0);
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [reportSection, setReportSection] = useState("summary");
  const [objFilter, setObjFilter] = useState({ filiale:"all", type:"all", sort:"name", search:"" });
  const [planFilter, setPlanFilter] = useState({ filiale:"all", statut:"all", priorite:"all", sort:"name", search:"" });
  const [evalFilter, setEvalFilter] = useState({ filiale:"all", type:"all" });
  const [dashFilter, setDashFilter] = useState({ filiale:"all" });

  useEffect(() => { try { const r = localStorage.getItem(SK); if(r) setData(JSON.parse(r)); } catch {} setLoaded(true); },[]);
  const save = useCallback((d: PerfData) => { try { localStorage.setItem(SK, JSON.stringify(d)); } catch {} },[]);
  const upd = useCallback((fn: (d: PerfData) => PerfData) => { setData(prev => { const n = fn(JSON.parse(JSON.stringify(prev))); save(n); return n; }); },[save]);

  const objPlans = useCallback((oid: string) => Object.values(data.plans).filter(p=>p.objId===oid), [data.plans]);
  const planTasks = useCallback((pid: string) => Object.values(data.tasks).filter(t=>t.planId===pid), [data.tasks]);
  const objTasks = useCallback((oid: string) => { const pids=objPlans(oid).map(p=>p.id); return Object.values(data.tasks).filter(t=>pids.includes(t.planId)); }, [data.tasks, objPlans]);
  const objKpis = useCallback((oid: string) => Object.values(data.kpis).filter(k=>k.objId===oid), [data.kpis]);
  const objLogs = useCallback((oid: string) => (data.logs[oid]||[]).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()), [data.logs]);
  const allTasks = useMemo(()=>Object.values(data.tasks),[data.tasks]);
  const taskProg = useCallback((tasks: Task[]) => { if(!tasks.length)return 0; return Math.round((tasks.filter(t=>t.status==="done").length/tasks.length)*100); },[]);
  const objProg = useCallback((oid: string) => taskProg(objTasks(oid)), [objTasks, taskProg]);
  const getTaskObj = useCallback((t: Task) => { const plan=data.plans[t.planId]; if(!plan)return null; return ALL_OBJ.find(o=>o.id===plan.objId)||null; },[data.plans]);
  const getTaskPlan = useCallback((t: Task) => data.plans[t.planId], [data.plans]);

  // Calcul KPI : si des actions sont liées, current = (moyenne avancements / 100) * target
  const kpiCurrent = useCallback((k: Kpi): number => {
    const linked = (k.planIds||[]).map(pid=>data.plans[pid]).filter(Boolean);
    if(linked.length>0) {
      const avgAv = linked.reduce((s,p)=>s+(p.avancement||0),0)/linked.length;
      const tar = parseFloat(k.target)||0;
      return tar>0 ? parseFloat(((avgAv/100)*tar).toFixed(1)) : 0;
    }
    return parseFloat(k.current)||0;
  }, [data.plans]);

  const filteredTasks = useMemo(()=>{
    let t = allTasks;
    if(filter.status!=="all") t=t.filter(x=>x.status===filter.status);
    if(filter.priority!=="all") t=t.filter(x=>x.priority===filter.priority);
    if(filter.filiale!=="all") {
      const oids = ALL_OBJ.filter(o=>o.filiale===filter.filiale).map(o=>o.id);
      const pids = Object.values(data.plans).filter(p=>oids.includes(p.objId)).map(p=>p.id);
      t=t.filter(x=>pids.includes(x.planId));
    }
    if(filter.search.trim()) { const s=filter.search.toLowerCase(); t=t.filter(x=>x.title.toLowerCase().includes(s)||(x.description||"").toLowerCase().includes(s)); }
    return t.sort((a,b)=>{const po: Record<string,number>={critical:0,high:1,medium:2,low:3};return (po[a.priority]??4)-(po[b.priority]??4);});
  },[allTasks,filter,data.plans]);

  const overdueTasks = useMemo(()=>allTasks.filter(isOverdue),[allTasks]);
  const upcomingTasks = useMemo(()=>{const today=new Date().toISOString().slice(0,10);const w=new Date(new Date().getTime()+7*86400000).toISOString().slice(0,10);return allTasks.filter(t=>t.deadline&&t.status!=="done"&&t.deadline>=today&&t.deadline<=w);},[allTasks]);

  const calcBonus = useCallback((objs: Objective[]) => { let t=0; objs.forEach(o=>{const n=data.notes[`${o.id}_${period}`]||0; t+=(n/10)*(o.poids/100)*10;}); return t; },[data.notes, period]);
  const personalBonus = calcBonus(PERSONAL_OBJ);
  const projectBonus = calcBonus(PROJECT_OBJ);
  const totalBonus = personalBonus + projectBonus;

  const moveTask = useCallback((taskId: string, newStatus: string) => { upd(d => { if(d.tasks[taskId]) d.tasks[taskId].status=newStatus; return d; }); },[upd]);
  const addLog = useCallback((objId: string, text: string) => { upd(d => { if(!d.logs[objId]) d.logs[objId]=[]; d.logs[objId].push({id:uid(),text,date:new Date().toISOString()}); return d; }); },[upd]);

  // ========== MODALS ==========
  const TaskModal = ({task, onClose}: {task: any; onClose: () => void}) => {
    const isNew = !task.id;
    const [f, setF] = useState(task.id ? {...task, subtasks:task.subtasks||[]} : {id:uid(),title:"",description:"",planId:task.planId||"",priority:"medium",status:"todo",deadline:"",startDate:"",subtasks:[] as Subtask[],createdAt:new Date().toISOString()});
    const plans = Object.values(data.plans);
    const doSave = () => { if(!f.title.trim()||!f.planId) return; upd(d=>{d.tasks[f.id]=f;return d;}); onClose(); };
    const doDelete = () => { if(!confirm("Supprimer cette tâche ?")) return; upd(d=>{delete d.tasks[f.id];return d;}); onClose(); };
    const addSub = () => setF((p: any)=>({...p,subtasks:[...p.subtasks,{id:uid(),title:"",done:false}]}));
    const updSub = (i: number,k: string,v: any) => setF((p: any)=>{const s=[...p.subtasks];s[i]={...s[i],[k]:v};return{...p,subtasks:s};});
    const rmSub = (i: number) => setF((p: any)=>({...p,subtasks:p.subtasks.filter((_: any,j: number)=>j!==i)}));
    return (
      <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-lg border border-primary-200 shadow-xl" onClick={e=>e.stopPropagation()}>
          <div className="p-5 border-b border-primary-200 flex items-center justify-between"><h3 className="text-lg font-bold">{isNew?"✚ Nouvelle tâche":"✎ Modifier la tâche"}</h3><button onClick={onClose} className="text-primary-400 hover:text-primary-900 text-lg">✕</button></div>
          <div className="p-5 space-y-4">
            <div><label className="text-xs text-primary-400 uppercase tracking-wider">Titre *</label><input className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30" value={f.title} onChange={e=>setF((p: any)=>({...p,title:e.target.value}))} placeholder="Ex: Finaliser le plan de recrutement" /></div>
            <div><label className="text-xs text-primary-400 uppercase tracking-wider">Description</label><textarea rows={2} className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary-400" value={f.description||""} onChange={e=>setF((p: any)=>({...p,description:e.target.value}))} /></div>
            <div><label className="text-xs text-primary-400 uppercase tracking-wider">Plan d&apos;action *</label>
              <select className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2.5 text-sm mt-1" value={f.planId} onChange={e=>setF((p: any)=>({...p,planId:e.target.value}))}>
                <option value="">Sélectionner...</option>{plans.map(p=>{const o=ALL_OBJ.find(x=>x.id===p.objId);return <option key={p.id} value={p.id}>{o?.name?.slice(0,30)} → {p.name}</option>;})}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-primary-400 uppercase">Date début</label><input type="date" className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1" value={f.startDate||""} onChange={e=>setF((p: any)=>({...p,startDate:e.target.value}))} /></div>
              <div><label className="text-xs text-primary-400 uppercase">Échéance</label><input type="date" className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1" value={f.deadline||""} onChange={e=>setF((p: any)=>({...p,deadline:e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-primary-400 uppercase">Priorité</label><div className="flex gap-1 mt-1">{PRIO.map(x=>(<button key={x} onClick={()=>setF((p: any)=>({...p,priority:x}))} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${f.priority===x?"border-white/30":"border-transparent opacity-50 hover:opacity-80"}`} style={{backgroundColor:PC[x]+"30",color:PC[x]}}>{PL[x]}</button>))}</div></div>
              <div><label className="text-xs text-primary-400 uppercase">Statut</label><div className="flex gap-1 mt-1">{STATUSES.map(x=>(<button key={x} onClick={()=>setF((p: any)=>({...p,status:x}))} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${f.status===x?"border-white/30":"border-transparent opacity-50 hover:opacity-80"}`} style={{backgroundColor:SC[x]+"30",color:SC[x]}}>{SI[x]}</button>))}</div></div>
            </div>
            <div>
              <div className="flex items-center justify-between"><label className="text-xs text-primary-400 uppercase">Sous-tâches ({f.subtasks.filter((s: Subtask)=>s.done).length}/{f.subtasks.length})</label><button onClick={addSub} className="text-xs text-primary-600 hover:text-primary-900">+ Ajouter</button></div>
              <div className="mt-2 space-y-1">{f.subtasks.map((s: Subtask,i: number)=>(<div key={s.id} className="flex items-center gap-2 bg-primary-50 rounded-lg px-2 py-1.5"><button onClick={()=>updSub(i,"done",!s.done)} className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${s.done?"bg-success-500 border-primary-900":"border-primary-300"}`}>{s.done&&<span className="text-[8px] text-white">✓</span>}</button><input className={`flex-1 bg-transparent text-xs focus:outline-none ${s.done?"line-through text-primary-400":""}`} value={s.title} onChange={e=>updSub(i,"title",e.target.value)} placeholder="Sous-tâche..." /><button onClick={()=>rmSub(i)} className="text-primary-400 hover:text-error-600 text-xs">✕</button></div>))}</div>
            </div>
          </div>
          <div className="p-4 border-t border-primary-200 flex gap-2">
            <button onClick={doSave} className="flex-1 bg-primary-900 hover:bg-primary-800 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">Enregistrer</button>
            {!isNew&&<button onClick={doDelete} className="px-4 bg-error-50 hover:bg-error-100 text-error-600 rounded-xl py-2.5 text-sm">Supprimer</button>}
            <button onClick={onClose} className="px-4 bg-primary-100 hover:bg-primary-100 rounded-xl py-2.5 text-sm">Annuler</button>
          </div>
        </div>
      </div>
    );
  };

  const PlanModal = ({plan, objId, onClose}: {plan: any; objId: string; onClose: () => void}) => {
    const isNew = !plan.id;
    const [planTab, setPlanTab] = useState("general");
    const [f, setF] = useState<any>(plan.id ? {...plan, sous_taches:plan.sous_taches||[], livrables:plan.livrables||[]} : {id:uid(),objId,name:"",description:"",responsable:"",statut:"a_faire",avancement:0,priorite:"moyenne",date_debut:"",target_date:"",notes:"",sous_taches:[] as PlanSousTache[],livrables:[] as PlanLivrable[]});

    // Auto-calcul avancement depuis sous-tâches
    const stAvg = f.sous_taches.length > 0 ? Math.round(f.sous_taches.reduce((s: number, st: PlanSousTache) => s + st.avancement, 0) / f.sous_taches.length) : null;
    const effectiveAvancement = stAvg !== null ? stAvg : f.avancement;

    // Auto-calcul statut
    const calcStatut = (av: number, blocked: boolean) => { if(blocked) return "bloque"; if(av===0) return "a_faire"; if(av>=100) return "termine"; return "en_cours"; };
    const [isBloque, setIsBloque] = useState(f.statut === "bloque");

    const doSave = () => {
      if(!f.name.trim()) return;
      const toSave = {...f, avancement: effectiveAvancement, statut: calcStatut(effectiveAvancement, isBloque)};
      upd(d=>{d.plans[toSave.id]=toSave;return d;});
      onClose();
    };
    const doDelete = () => { if(!confirm("Supprimer ce plan et ses tâches ?")) return; const tids=planTasks(f.id).map(t=>t.id); upd(d=>{delete d.plans[f.id];tids.forEach(i=>delete d.tasks[i]);return d;}); onClose(); };

    const addSt = () => setF((p: any)=>({...p,sous_taches:[...p.sous_taches,{id:uid(),libelle:"",avancement:0,fait:false}]}));
    const updSt = (i: number, k: string, v: any) => setF((p: any)=>{const s=[...p.sous_taches];s[i]={...s[i],[k]:v};if(k==="fait") s[i].avancement=v?100:0;return{...p,sous_taches:s};});
    const rmSt = (i: number) => setF((p: any)=>({...p,sous_taches:p.sous_taches.filter((_: any,j: number)=>j!==i)}));
    const addLiv = () => setF((p: any)=>({...p,livrables:[...p.livrables,{id:uid(),nom:"",fait:false}]}));
    const updLiv = (i: number, k: string, v: any) => setF((p: any)=>{const s=[...p.livrables];s[i]={...s[i],[k]:v};return{...p,livrables:s};});
    const rmLiv = (i: number) => setF((p: any)=>({...p,livrables:p.livrables.filter((_: any,j: number)=>j!==i)}));

    const ic = "w-full bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400";
    const lb = "text-xs text-primary-400 uppercase tracking-wider block mb-1";
    const PLAN_TABS = [{k:"general",l:"Général"},{k:"sousTaches",l:`Sous-tâches (${f.sous_taches.length})`},{k:"livrables",l:`Livrables (${f.livrables.filter((l: PlanLivrable)=>l.fait).length}/${f.livrables.length})`},{k:"notes",l:"Notes"}];
    const obj = ALL_OBJ.find(o=>o.id===(f.objId||objId));

    return (
      <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-2xl border border-primary-200 shadow-xl" onClick={e=>e.stopPropagation()}>
          {/* Header */}
          <div className="p-4 border-b border-primary-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-primary-900">{isNew?"Nouveau plan d'action":"Modifier le plan d'action"}</h3>
              {obj && <p className="text-xs text-primary-400 mt-0.5">{obj.name} — {obj.filiale}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary-400">Avancement</span>
                <span className="text-sm font-bold" style={{color:gc(effectiveAvancement/10)}}>{effectiveAvancement}%</span>
              </div>
              <button onClick={onClose} className="text-primary-400 hover:text-primary-900 text-lg">✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-primary-200 px-4">
            {PLAN_TABS.map(t=>(<button key={t.k} onClick={()=>setPlanTab(t.k)} className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${planTab===t.k?"border-primary-900 text-primary-900":"border-transparent text-primary-400 hover:text-primary-700"}`}>{t.l}</button>))}
          </div>

          {/* Content */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {/* === GÉNÉRAL === */}
            {planTab==="general" && (
              <div className="space-y-4">
                {/* Statut badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(["a_faire","en_cours","termine","bloque"] as const).map(s=>{
                    const cfg: Record<string,{l:string;c:string}> = {a_faire:{l:"À faire",c:"bg-primary-100 text-primary-600"},en_cours:{l:"En cours",c:"bg-info-100 text-info-700"},termine:{l:"Terminé",c:"bg-success-100 text-success-700"},bloque:{l:"Bloqué",c:"bg-error-100 text-error-700"}};
                    const cur = calcStatut(effectiveAvancement, isBloque);
                    return <span key={s} className={`text-xs px-2 py-1 rounded-full font-medium ${cur===s?cfg[s].c:"bg-primary-50 text-primary-300"}`}>{cfg[s].l}</span>;
                  })}
                  <label className="flex items-center gap-1 ml-auto text-xs text-primary-400 cursor-pointer"><input type="checkbox" checked={isBloque} onChange={e=>setIsBloque(e.target.checked)} className="rounded" /><span>Bloqué</span></label>
                </div>

                {/* Avancement slider */}
                <div>
                  <label className={lb}>Avancement ({effectiveAvancement}%){stAvg!==null?" — calculé depuis sous-tâches":""}</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0" max="100" step="5" value={effectiveAvancement} disabled={stAvg!==null} onChange={e=>setF((p: any)=>({...p,avancement:parseInt(e.target.value)}))} className="flex-1 h-2 rounded-full accent-primary-900" />
                    <span className="text-sm font-bold w-10 text-right" style={{color:gc(effectiveAvancement/10)}}>{effectiveAvancement}%</span>
                  </div>
                  <MiniBar value={effectiveAvancement} color={gc(effectiveAvancement/10)} h="h-1.5" />
                </div>

                {/* Titre + Objectif */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2"><label className={lb}>Libellé *</label><input className={ic} value={f.name} onChange={e=>setF((p: any)=>({...p,name:e.target.value}))} placeholder="Titre du plan d'action" /></div>
                  <div className="sm:col-span-2"><label className={lb}>Description</label><textarea rows={2} className={ic} value={f.description||""} onChange={e=>setF((p: any)=>({...p,description:e.target.value}))} placeholder="Description détaillée..." /></div>
                </div>

                {/* Objectif */}
                <div>
                  <label className={lb}>Objectif associé *</label>
                  <select className={ic} value={f.objId} onChange={e=>setF((p: any)=>({...p,objId:e.target.value}))}>
                    <option value="">Sélectionner...</option>
                    {ALL_OBJ.map(o=><option key={o.id} value={o.id}>{o.filiale} — {o.name}</option>)}
                  </select>
                </div>

                {/* Responsable + Priorité */}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lb}>Responsable</label><input className={ic} value={f.responsable||""} onChange={e=>setF((p: any)=>({...p,responsable:e.target.value}))} placeholder="Nom du responsable" /></div>
                  <div><label className={lb}>Priorité</label>
                    <select className={ic} value={f.priorite||"moyenne"} onChange={e=>setF((p: any)=>({...p,priorite:e.target.value}))}>
                      <option value="critique">Critique</option><option value="haute">Haute</option><option value="moyenne">Moyenne</option><option value="basse">Basse</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lb}>Date de début</label><input type="date" className={ic} value={f.date_debut||""} onChange={e=>setF((p: any)=>({...p,date_debut:e.target.value}))} /></div>
                  <div><label className={lb}>Échéance</label><input type="date" className={ic} value={f.target_date||""} onChange={e=>setF((p: any)=>({...p,target_date:e.target.value}))} /></div>
                </div>
              </div>
            )}

            {/* === SOUS-TÂCHES === */}
            {planTab==="sousTaches" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-primary-400">{f.sous_taches.length} sous-tâche(s) — Avancement moyen : <span className="font-bold" style={{color:gc((stAvg||0)/10)}}>{stAvg??0}%</span></p>
                  <button onClick={addSt} className="text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1.5 rounded-lg font-medium">+ Ajouter</button>
                </div>
                {f.sous_taches.length===0?<p className="text-sm text-primary-300 text-center py-8">Aucune sous-tâche. Cliquez sur + Ajouter.</p>:
                <div className="space-y-2">
                  {f.sous_taches.map((st: PlanSousTache, i: number)=>(
                    <div key={st.id} className="flex items-center gap-2 bg-primary-50 rounded-lg p-2.5 border border-primary-200/50">
                      <button onClick={()=>updSt(i,"fait",!st.fait)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${st.fait?"bg-success-500 border-success-500":"border-primary-300 hover:border-primary-400"}`}>{st.fait&&<span className="text-[9px] text-white">✓</span>}</button>
                      <input className={`flex-1 bg-transparent text-sm focus:outline-none ${st.fait?"line-through text-primary-400":""}`} value={st.libelle} onChange={e=>updSt(i,"libelle",e.target.value)} placeholder="Libellé de la sous-tâche..." />
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <input type="range" min="0" max="100" step="10" value={st.avancement} onChange={e=>updSt(i,"avancement",parseInt(e.target.value))} className="w-16 h-1 accent-primary-900" />
                        <span className="text-xs font-bold w-8 text-right" style={{color:gc(st.avancement/10)}}>{st.avancement}%</span>
                      </div>
                      <button onClick={()=>rmSt(i)} className="text-primary-300 hover:text-error-600 text-xs flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>}
              </div>
            )}

            {/* === LIVRABLES === */}
            {planTab==="livrables" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-primary-400">{f.livrables.filter((l: PlanLivrable)=>l.fait).length}/{f.livrables.length} livrable(s) validé(s)</p>
                  <button onClick={addLiv} className="text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1.5 rounded-lg font-medium">+ Ajouter</button>
                </div>
                {f.livrables.length===0?<p className="text-sm text-primary-300 text-center py-8">Aucun livrable. Cliquez sur + Ajouter.</p>:
                <div className="space-y-2">
                  {f.livrables.map((l: PlanLivrable, i: number)=>(
                    <div key={l.id} className="flex items-center gap-2 bg-primary-50 rounded-lg p-2.5 border border-primary-200/50">
                      <button onClick={()=>updLiv(i,"fait",!l.fait)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${l.fait?"bg-success-500 border-success-500":"border-primary-300 hover:border-primary-400"}`}>{l.fait&&<span className="text-[9px] text-white">✓</span>}</button>
                      <input className={`flex-1 bg-transparent text-sm focus:outline-none ${l.fait?"line-through text-primary-400":""}`} value={l.nom} onChange={e=>updLiv(i,"nom",e.target.value)} placeholder="Nom du livrable..." />
                      <button onClick={()=>rmLiv(i)} className="text-primary-300 hover:text-error-600 text-xs flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>}
              </div>
            )}

            {/* === NOTES === */}
            {planTab==="notes" && (
              <div>
                <label className={lb}>Notes et commentaires</label>
                <textarea rows={8} className={ic} value={f.notes||""} onChange={e=>setF((p: any)=>({...p,notes:e.target.value}))} placeholder="Notes libres, observations, points de suivi..." />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-primary-200 flex gap-2">
            <button onClick={doSave} className="flex-1 bg-primary-900 hover:bg-primary-800 text-white rounded-xl py-2.5 text-sm font-semibold">Enregistrer</button>
            {!isNew&&<button onClick={doDelete} className="px-4 bg-error-50 hover:bg-error-100 text-error-600 rounded-xl py-2.5 text-sm">Supprimer</button>}
            <button onClick={onClose} className="px-4 bg-primary-100 hover:bg-primary-200 rounded-xl py-2.5 text-sm">Annuler</button>
          </div>
        </div>
      </div>
    );
  };

  const KpiModal = ({kpi, objId, onClose}: {kpi: any; objId: string; onClose: () => void}) => {
    const isNew = !kpi.id;
    const [f, setF] = useState<any>(kpi.id ? {...kpi, planIds:kpi.planIds||[]} : {id:uid(),objId,name:"",target:"",current:"",unit:"%",planIds:[] as string[]});
    const allPlansArr = Object.values(data.plans);
    const linkedPlans = allPlansArr.filter(p=>f.planIds.includes(p.id));
    const hasLinked = linkedPlans.length > 0;

    // Auto-calcul : moyenne des avancements des actions liées → rapporté à la cible
    const autoAvancement = hasLinked ? Math.round(linkedPlans.reduce((s,p)=>s+(p.avancement||0),0)/linkedPlans.length) : null;
    const tar = parseFloat(f.target)||0;
    const autoCurrent = autoAvancement!==null && tar>0 ? ((autoAvancement/100)*tar).toFixed(1) : null;
    const displayCurrent = autoCurrent!==null ? autoCurrent : f.current;
    const curNum = parseFloat(displayCurrent)||0;
    const pct = tar>0 ? Math.min(100,Math.round((curNum/tar)*100)) : 0;

    const togglePlan = (pid: string) => setF((p: any)=>({...p, planIds: p.planIds.includes(pid) ? p.planIds.filter((x: string)=>x!==pid) : [...p.planIds, pid]}));

    const doSave = () => {
      if(!f.name.trim()) return;
      const toSave = {...f, current: displayCurrent||f.current};
      upd(d=>{d.kpis[toSave.id]=toSave;return d;});
      onClose();
    };
    const doDelete = () => { if(!confirm("Supprimer ce KPI ?")) return; upd(d=>{delete d.kpis[f.id];return d;}); onClose(); };

    return (
      <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-lg border border-primary-200 shadow-xl" onClick={e=>e.stopPropagation()}>
          <div className="p-5 border-b border-primary-200 flex items-center justify-between">
            <h3 className="text-lg font-bold">{isNew?"Nouveau KPI":"Modifier le KPI"}</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{color:gc(pct/10)}}>{pct}%</span>
              <button onClick={onClose} className="text-primary-400 hover:text-primary-900 text-lg ml-2">✕</button>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div><label className="text-xs text-primary-400 uppercase tracking-wider">Nom du KPI *</label><input className="w-full bg-primary-50 border border-primary-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-primary-400" value={f.name} onChange={e=>setF((p: any)=>({...p,name:e.target.value}))} placeholder="Ex: Taux de leasing" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-primary-400 uppercase tracking-wider">Cible</label><input className="w-full bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary-400" value={f.target} onChange={e=>setF((p: any)=>({...p,target:e.target.value}))} placeholder="100" /></div>
              <div>
                <label className="text-xs text-primary-400 uppercase tracking-wider">Atteint{hasLinked?" (auto)":""}</label>
                {hasLinked
                  ? <div className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 font-bold" style={{color:gc(pct/10)}}>{displayCurrent} <span className="text-xs font-normal text-primary-400">({autoAvancement}%)</span></div>
                  : <input className="w-full bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary-400" value={f.current} onChange={e=>setF((p: any)=>({...p,current:e.target.value}))} placeholder="0" />
                }
              </div>
              <div><label className="text-xs text-primary-400 uppercase tracking-wider">Unité</label><input className="w-full bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary-400" value={f.unit} onChange={e=>setF((p: any)=>({...p,unit:e.target.value}))} placeholder="%" /></div>
            </div>
            {/* Barre de progression */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-primary-400">Progression</span>
                <span className="text-sm font-bold" style={{color:gc(pct/10)}}>{displayCurrent||0} / {f.target||"—"} {f.unit}</span>
              </div>
              <MiniBar value={pct} color={gc(pct/10)} h="h-2" />
            </div>
            {/* Actions liées */}
            <div>
              <label className="text-xs text-primary-400 uppercase tracking-wider block mb-2">Actions liées ({f.planIds.length}){hasLinked?` — avancement moyen : ${autoAvancement}%`:""}</label>
              {allPlansArr.length===0?<p className="text-sm text-primary-300 py-4 text-center">Aucune action disponible.</p>:
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {allPlansArr.map(p=>{const obj=ALL_OBJ.find(o=>o.id===p.objId);const sel=f.planIds.includes(p.id);const av=p.avancement||0;return(
                  <div key={p.id} onClick={()=>togglePlan(p.id)} className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border transition-all ${sel?"bg-primary-100 border-primary-400":"bg-primary-50 border-primary-200/50 hover:border-primary-300"}`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${sel?"bg-primary-900 border-primary-900":"border-primary-300"}`}>{sel&&<span className="text-xs text-white">✓</span>}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-primary-400 truncate">{obj?.filiale} — {obj?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16"><MiniBar value={av} color={gc(av/10)} h="h-1" /></div>
                      <span className="text-xs font-bold w-8 text-right" style={{color:gc(av/10)}}>{av}%</span>
                    </div>
                  </div>
                );})}
              </div>}
            </div>
          </div>
          <div className="p-4 border-t border-primary-200 flex gap-2">
            <button onClick={doSave} className="flex-1 bg-primary-900 hover:bg-primary-800 text-white rounded-xl py-2.5 text-sm font-semibold">Enregistrer</button>
            {!isNew&&<button onClick={doDelete} className="px-4 bg-error-50 hover:bg-error-100 text-error-600 rounded-xl py-2.5 text-sm">Supprimer</button>}
            <button onClick={onClose} className="px-4 bg-primary-100 hover:bg-primary-200 rounded-xl py-2.5 text-sm">Annuler</button>
          </div>
        </div>
      </div>
    );
  };

  // ========== TASK CARD ==========
  const TaskCard = ({t}: {t: Task}) => {
    const obj=getTaskObj(t); const plan=getTaskPlan(t); const od=isOverdue(t);
    const subDone=t.subtasks?.filter(s=>s.done).length||0; const subTotal=t.subtasks?.length||0;
    const si=STATUSES.indexOf(t.status);
    return (
      <div className={`bg-primary-100 rounded-xl border border-primary-200 hover:border-primary-300 transition-all ${od?"ring-1 ring-error-300":""}`}>
        <div className="p-3 cursor-pointer" onClick={()=>setModal({type:"task",data:t})}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className={`text-sm font-semibold leading-snug ${t.status==="done"?"line-through text-primary-400":"text-primary-800"}`}>{t.title}</p>
            {od&&<span className="text-xs bg-error-100 text-error-600 px-1 py-0.5 rounded flex-shrink-0">Retard</span>}
          </div>
          <div className="flex items-center gap-1 flex-wrap mb-2">
            <Badge label={PL[t.priority]} color={PC[t.priority]} small />
            {obj&&<Badge label={obj.filiale} color={FC[obj.filiale]} small />}
            {plan&&<span className="text-xs text-primary-400 truncate max-w-[100px]">{plan.name}</span>}
          </div>
          {subTotal>0&&<div className="flex items-center gap-2 mb-2"><MiniBar value={subDone} max={subTotal} color="#22c55e" h="h-1" /><span className="text-xs text-primary-400">{subDone}/{subTotal}</span></div>}
          <div className="flex items-center gap-2 text-xs text-primary-400">
            {t.startDate&&<span>▸ {fmtDate(t.startDate)}</span>}
            {t.deadline&&<span className={od?"text-error-600 font-bold":""}> {fmtDate(t.deadline)}</span>}
          </div>
        </div>
        <div className="border-t border-primary-200/50 px-2 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-0.5">{si>0&&<button onClick={e=>{e.stopPropagation();moveTask(t.id,STATUSES[si-1]);}} className="text-xs px-2 py-1 rounded-lg hover:bg-primary-100 text-primary-500">◄</button>}</div>
          <span className="text-xs font-bold" style={{color:SC[t.status]}}>{SI[t.status]} {SL[t.status]}</span>
          <div className="flex items-center gap-0.5">
            {si<3&&<button onClick={e=>{e.stopPropagation();moveTask(t.id,STATUSES[si+1]);}} className="text-xs px-2 py-1 rounded-lg hover:bg-primary-100 text-primary-500">►</button>}
            {t.status!=="done"&&<button onClick={e=>{e.stopPropagation();moveTask(t.id,"done");}} className="text-xs px-2 py-1 rounded-lg hover:bg-success-50 text-success-600">✓</button>}
          </div>
        </div>
      </div>
    );
  };

  // ========== VIEWS ==========
  const KanbanView = ({tasks}: {tasks: Task[]}) => {
    const handleDragStart = (e: React.DragEvent, t: Task) => { setDragTask(t.id); e.dataTransfer.effectAllowed="move"; };
    const handleDrop = (e: React.DragEvent, status: string) => { e.preventDefault(); if(dragTask) moveTask(dragTask,status); setDragTask(null); setDragOver(null); };
    return (
      <div className="flex gap-3 overflow-x-auto pb-4" style={{minHeight:"400px"}}>
        {STATUSES.map(s=>{
          const col=tasks.filter(t=>t.status===s);
          return (
            <div key={s} className={`flex-1 min-w-[240px] max-w-[320px] rounded-xl border transition-all ${dragOver===s?"border-primary-400 bg-primary-50":"border-primary-200 bg-white/50"}`}
              onDragOver={e=>{e.preventDefault();setDragOver(s);}} onDrop={e=>handleDrop(e,s)} onDragLeave={()=>setDragOver(null)}>
              <div className="p-3 border-b border-primary-200"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:SC[s]}} /><span className="text-sm font-bold" style={{color:SC[s]}}>{SL[s]}</span><span className="ml-auto text-sm bg-primary-100 px-2 py-0.5 rounded-full text-primary-500">{col.length}</span></div></div>
              <div className="p-2 space-y-2 min-h-[100px]">
                {col.map(t=>(<div key={t.id} draggable onDragStart={e=>handleDragStart(e,t)} onDragEnd={()=>{setDragTask(null);setDragOver(null);}} className={`transition-opacity ${dragTask===t.id?"opacity-30":""}`}><TaskCard t={t} /></div>))}
                {col.length===0&&<p className="text-center text-primary-300 text-xs py-8">Glissez une tâche ici</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ListView = ({tasks}: {tasks: Task[]}) => (<div className="space-y-2">{tasks.map(t=><TaskCard key={t.id} t={t} />)}{tasks.length===0&&<p className="text-center text-primary-400 py-12 text-sm">Aucune tâche trouvée</p>}</div>);

  const CalendarView = ({tasks}: {tasks: Task[]}) => {
    const dIM=new Date(calYear,calMonth+1,0).getDate(); const fD=(new Date(calYear,calMonth,1).getDay()+6)%7;
    const days=Array.from({length:42},(_,i)=>{const d=i-fD+1;return(d<1||d>dIM)?null:d;});
    const MN=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
    const getT=(d: number)=>{const ds=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;return tasks.filter(t=>t.deadline===ds);};
    const today=new Date();
    return (
      <div>
        <div className="flex items-center justify-center gap-4 mb-4"><button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} className="w-8 h-8 rounded-lg bg-primary-100 hover:bg-primary-100 flex items-center justify-center text-primary-500">◀</button><span className="font-bold text-sm w-40 text-center">{MN[calMonth]} {calYear}</span><button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} className="w-8 h-8 rounded-lg bg-primary-100 hover:bg-primary-100 flex items-center justify-center text-primary-500">▶</button></div>
        <div className="grid grid-cols-7 gap-1">
          {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d=><div key={d} className="text-center text-xs text-primary-400 py-2 font-bold">{d}</div>)}
          {days.map((d,i)=>{if(!d)return<div key={`e${i}`} className="min-h-[70px]"/>;const dt=getT(d);const isT=d===today.getDate()&&calMonth===today.getMonth()&&calYear===today.getFullYear();return(
            <div key={i} className={`min-h-[70px] rounded-lg p-1.5 border ${isT?"border-primary-400 bg-success-50":"border-primary-200 bg-white/50"}`}>
              <p className={`text-xs mb-1 ${isT?"text-primary-600 font-bold":"text-primary-400"}`}>{d}</p>
              {dt.slice(0,3).map(t=>{const obj=getTaskObj(t);return(<div key={t.id} onClick={()=>setModal({type:"task",data:t})} className="text-[9px] px-1.5 py-0.5 rounded mb-0.5 truncate cursor-pointer hover:opacity-80 border-l-2" style={{backgroundColor:SC[t.status]+"15",color:SC[t.status],borderColor:obj?FC[obj.filiale]:"transparent"}}>{t.title}</div>);})}
              {dt.length>3&&<p className="text-xs text-primary-400">+{dt.length-3}</p>}
            </div>);})}
        </div>
      </div>
    );
  };

  const GanttView = ({tasks}: {tasks: Task[]}) => {
    const MN=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];const yr=2026;
    const visM=MN.slice(ganttStart,Math.min(ganttStart+6,12));
    const startDate=new Date(yr,ganttStart,1);const endDate=new Date(yr,ganttStart+visM.length,0);
    const totalDays=daysBetween(startDate.toISOString().slice(0,10),endDate.toISOString().slice(0,10))+1;
    const tasksG: GanttTask[]=tasks.filter(t=>t.deadline||t.startDate).map(t=>{const s=t.startDate?new Date(t.startDate+"T00:00:00"):(t.deadline?new Date(new Date(t.deadline+"T00:00:00").getTime()-7*86400000):startDate);const e=t.deadline?new Date(t.deadline+"T00:00:00"):new Date(s.getTime()+7*86400000);return{...t,_start:s,_end:e} as GanttTask;}).filter(t=>t._end>=startDate&&t._start<=endDate).sort((a,b)=>a._start.getTime()-b._start.getTime());
    const dayOff=(d: Date)=>Math.max(0,daysBetween(startDate.toISOString().slice(0,10),d.toISOString().slice(0,10)));
    const todayOff=dayOff(new Date());
    return (
      <div>
        <div className="flex items-center justify-center gap-4 mb-4"><button onClick={()=>setGanttStart(m=>Math.max(0,m-1))} className="w-8 h-8 rounded-lg bg-primary-100 hover:bg-primary-100 flex items-center justify-center text-primary-500">◀</button><span className="text-sm font-bold w-40 text-center">{MN[ganttStart]} — {visM[visM.length-1]} {yr}</span><button onClick={()=>setGanttStart(m=>Math.min(6,m+1))} className="w-8 h-8 rounded-lg bg-primary-100 hover:bg-primary-100 flex items-center justify-center text-primary-500">▶</button></div>
        <div className="overflow-x-auto"><div style={{minWidth:"700px"}}>
          <div className="flex border-b border-primary-200 mb-1"><div className="w-52 flex-shrink-0" /><div className="flex-1 flex">{visM.map((m,i)=>{const dInM=new Date(yr,ganttStart+i+1,0).getDate();return<div key={m} className="border-l border-primary-200 text-xs text-primary-400 px-1 font-bold" style={{width:`${(dInM/totalDays)*100}%`}}>{m}</div>;})}</div></div>
          <div className="relative">
            {todayOff>=0&&todayOff<=totalDays&&<div className="absolute top-0 bottom-0 w-px bg-success-500/40 z-10" style={{left:`calc(208px + (100% - 208px) * ${todayOff/totalDays})`}} />}
            {tasksG.map(t=>{const obj=getTaskObj(t);const left=dayOff(t._start);const width=Math.max(3,daysBetween(t._start.toISOString().slice(0,10),t._end.toISOString().slice(0,10)));const color=obj?FC[obj.filiale]:"#6b7280";return(
              <div key={t.id} className="flex items-center h-8 hover:bg-primary-50 cursor-pointer" onClick={()=>setModal({type:"task",data:t})}>
                <div className="w-52 flex-shrink-0 flex items-center gap-1.5 pr-2"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor:SC[t.status]}} /><span className={`text-xs truncate ${t.status==="done"?"text-primary-400 line-through":"text-primary-700"}`}>{t.title}</span></div>
                <div className="flex-1 relative h-5"><div className={`absolute h-4 rounded-md top-0.5 ${t.status==="done"?"opacity-40":""}`} style={{left:`${(left/totalDays)*100}%`,width:`${(width/totalDays)*100}%`,backgroundColor:color,minWidth:"6px",boxShadow:`0 0 8px ${color}30`}}><div className="absolute inset-0 flex items-center justify-center"><span className="text-[8px] text-white font-bold opacity-80 truncate px-1">{width}j</span></div></div></div>
              </div>);})}
            {tasksG.length===0&&<p className="text-center text-primary-400 py-12 text-sm">Aucune tâche avec dates</p>}
          </div>
        </div></div>
      </div>
    );
  };

  // ========== OBJECTIVE DETAIL ==========
  const ObjectiveDetail = ({obj}: {obj: Objective}) => {
    const plans=objPlans(obj.id);const tasks=objTasks(obj.id);const kpis=objKpis(obj.id);const logs=objLogs(obj.id);const prog=objProg(obj.id);const note=data.notes[`${obj.id}_${period}`]||0;const isP=obj.type==="personal";
    const [logInput,setLogInput]=useState("");
    return (
      <div className="space-y-4">
        <button onClick={()=>setSelObj(null)} className="text-primary-500 hover:text-primary-900 text-xs">← Retour</button>
        <div className="bg-white rounded-xl p-5 border border-primary-200">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div><div className="flex items-center gap-2 mb-2"><Badge label={obj.filiale} color={FC[obj.filiale]} /><Badge label={`${obj.poids}%`} color="#6b7280" /><Badge label={isP?"Personnel":"Projet"} color={isP?"#6366f1":"#22c55e"} /></div><h2 className="text-xl font-bold">{obj.name}</h2></div>
            <div className="flex gap-6">{!isP&&<div className="text-center"><p className="text-3xl font-bold" style={{color:gc(prog/10)}}>{prog}%</p><p className="text-xs text-primary-400">Avancement</p></div>}<div className="text-center"><input type="number" min="0" max="10" step="0.5" value={note||""} placeholder="—" onChange={e=>upd(d=>{d.notes[`${obj.id}_${period}`]=Math.min(10,Math.max(0,parseFloat(e.target.value)||0));return d;})} className="w-16 bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-center text-xl font-bold focus:outline-none focus:border-primary-400" style={{color:gc(note)}} /><p className="text-xs text-primary-400 mt-1">Note {period==="s1"?"S1":"S2"}</p></div></div>
          </div>
          {!isP&&<div className="mt-2"><MiniBar value={prog} h="h-2" color={gc(prog/10)} /></div>}
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-primary-700">📊 KPIs</h3><button onClick={()=>setModal({type:"kpi",data:{objId:obj.id}})} className="text-xs bg-primary-100 hover:bg-primary-100 px-3 py-1 rounded-lg text-primary-600">+ KPI</button></div>
          {kpis.length===0?<p className="text-xs text-primary-400 py-2">Aucun KPI défini.</p>:<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">{kpis.map(k=>{const cur=kpiCurrent(k);const tar=parseFloat(k.target)||1;const pct=Math.min(100,Math.round((cur/tar)*100));const hasAuto=(k.planIds||[]).length>0;return(<div key={k.id} onClick={()=>setModal({type:"kpi",data:k})} className="bg-primary-100 rounded-lg p-3 cursor-pointer hover:border-primary-300 border border-primary-200 transition-colors"><p className="text-xs text-primary-500 mb-1 truncate">{k.name}{hasAuto&&<span className="text-primary-300 ml-1">⚡</span>}</p><div className="flex items-baseline gap-1"><span className="text-lg font-bold" style={{color:gc(pct/10)}}>{cur}</span><span className="text-xs text-primary-400">/ {k.target} {k.unit}</span></div><MiniBar value={pct} color={gc(pct/10)} h="h-1" />{hasAuto&&<p className="text-xs text-primary-400 mt-1">{(k.planIds||[]).length} action(s) liée(s)</p>}</div>);})}</div>}
        </div>
        {!isP&&<div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-primary-700">📋 Plans d&apos;action</h3><button onClick={()=>setModal({type:"plan",data:{objId:obj.id}})} className="text-xs bg-primary-100 hover:bg-primary-100 px-3 py-1 rounded-lg text-primary-600">+ Plan</button></div>
          {plans.length===0?<p className="text-xs text-primary-400 py-4">Créez un plan d&apos;action.</p>:plans.map(p=>{const pt=planTasks(p.id);const pp=taskProg(pt);return(
            <div key={p.id} className="mb-4 bg-primary-50 rounded-xl border border-primary-200/50 overflow-hidden">
              <div className="p-3 flex items-center justify-between bg-primary-50 cursor-pointer" onClick={()=>setModal({type:"plan",data:p})}>
                <div><p className="text-sm font-semibold">{p.name}</p><div className="flex items-center gap-3 text-xs text-primary-400 mt-0.5">{p.target_date&&<span>Cible: {fmtDate(p.target_date)}</span>}</div></div>
                <div className="flex items-center gap-3"><div className="text-right"><p className="text-sm font-bold" style={{color:gc(pp/10)}}>{pp}%</p><p className="text-xs text-primary-400">{pt.filter(x=>x.status==="done").length}/{pt.length}</p></div><button onClick={e=>{e.stopPropagation();setModal({type:"task",data:{planId:p.id}});}} className="bg-primary-100 hover:bg-primary-200 text-primary-600 text-xs px-2.5 py-1.5 rounded-lg">+ Tâche</button></div>
              </div>
              <div className="px-3"><MiniBar value={pp} color={gc(pp/10)} h="h-1" /></div>
              <div className="p-2 space-y-1">{pt.map(t=>(<div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-primary-100 cursor-pointer group" onClick={()=>setModal({type:"task",data:t})}>
                <button onClick={e=>{e.stopPropagation();moveTask(t.id,t.status==="done"?"todo":"done");}} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${t.status==="done"?"bg-success-500 border-primary-900":"border-primary-300 hover:border-primary-400"}`}>{t.status==="done"&&<span className="text-[9px] text-white">✓</span>}</button>
                <span className={`text-xs flex-1 ${t.status==="done"?"line-through text-primary-400":""}`}>{t.title}</span><Badge label={PL[t.priority]} color={PC[t.priority]} small /><span className="text-[9px]" style={{color:SC[t.status]}}>{SI[t.status]}</span>{t.deadline&&<span className={`text-xs ${isOverdue(t)?"text-error-600":"text-primary-400"}`}>{fmtDate(t.deadline)}</span>}
              </div>))}</div>
            </div>);})}
        </div>}
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <h3 className="text-sm font-bold text-primary-700 mb-3">📝 Journal</h3>
          <div className="flex gap-2 mb-3"><input className="flex-1 bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-400" placeholder="Ajouter une note..." value={logInput} onChange={e=>setLogInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&logInput.trim()){addLog(obj.id,logInput.trim());setLogInput("");}}} /><button onClick={()=>{if(logInput.trim()){addLog(obj.id,logInput.trim());setLogInput("");}}} className="bg-primary-900 hover:bg-primary-800 text-white text-xs px-4 rounded-lg">+</button></div>
          {logs.length===0?<p className="text-xs text-primary-400">Aucune entrée.</p>:<div className="space-y-2 max-h-60 overflow-y-auto">{logs.map(l=>(<div key={l.id} className="flex gap-2 py-2 border-b border-primary-200"><div className="w-1.5 h-1.5 rounded-full bg-success-500 mt-1.5 flex-shrink-0" /><div className="flex-1"><p className="text-xs text-primary-700">{l.text}</p><p className="text-xs text-primary-400 mt-0.5">{new Date(l.date).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p></div><button onClick={()=>upd(d=>{d.logs[obj.id]=d.logs[obj.id].filter(x=>x.id!==l.id);return d;})} className="text-primary-300 hover:text-error-600 text-xs">✕</button></div>))}</div>}
        </div>
      </div>
    );
  };

  // ==================== RAPPORT GLOBAL ====================
  const ReportView = () => {
    const today = new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter(t=>t.status==="done").length;
    const inProgTasks = allTasks.filter(t=>t.status==="in_progress").length;
    const inRevTasks = allTasks.filter(t=>t.status==="in_review").length;
    const todoTasks = allTasks.filter(t=>t.status==="todo").length;
    const criticalTasks = allTasks.filter(t=>t.priority==="critical"&&t.status!=="done");
    const allKpis = Object.values(data.kpis);
    const allLogs = ALL_OBJ.flatMap(o=>(data.logs[o.id]||[]).map(l=>({...l,objName:o.name,objId:o.id}))).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
    const filialeStats: Record<string, {objs:number;tasks:number;done:number;overdue:number;avgProg:number;avgNote:number;bonus:number}> = {};
    Object.keys(FC).forEach(f=>{
      const objs=PROJECT_OBJ.filter(o=>o.filiale===f);
      if(!objs.length) return;
      const tasks=objs.flatMap(o=>objTasks(o.id));
      const done=tasks.filter(t=>t.status==="done").length;
      const overdue=tasks.filter(isOverdue).length;
      const avgProg=objs.length?Math.round(objs.reduce((s,o)=>s+objProg(o.id),0)/objs.length):0;
      const avgNote=objs.length?(objs.reduce((s,o)=>s+(data.notes[`${o.id}_${period}`]||0),0)/objs.length):0;
      filialeStats[f]={objs:objs.length,tasks:tasks.length,done,overdue,avgProg,avgNote,bonus:objs.reduce((s,o)=>{const n=data.notes[`${o.id}_${period}`]||0;return s+(n/10)*(o.poids/100)*10;},0)};
    });

    const sections = [
      {k:"summary",l:"Synthèse générale"},
      {k:"projects",l:"Objectifs projets détaillés"},
      {k:"personal",l:"Objectifs personnels"},
      {k:"filiales",l:"Performance par filiale"},
      {k:"tasks_overview",l:"Vue d'ensemble des tâches"},
      {k:"kpis_all",l:"Tableau des KPIs"},
      {k:"risks",l:"Risques et alertes"},
      {k:"journal",l:"Journal des activités"},
      {k:"bonus",l:"Simulation bonus"},
    ];

    const SectionTitle = ({icon, title}: {icon: string; title: string}) => (
      <div className="flex items-center gap-2 mb-4 mt-6 first:mt-0">
        <span className="text-lg">{icon}</span>
        <h2 className="text-lg font-bold text-primary-900">{title}</h2>
        <div className="flex-1 h-px bg-primary-100 ml-2" />
      </div>
    );

    const StatBox = ({label, value, sub, color}: {label: string; value: string | number; sub?: string; color?: string}) => (
      <div className="bg-primary-50 rounded-lg p-3 border border-primary-200/50">
        <p className="text-xs text-primary-400">{label}</p>
        <p className="text-2xl font-bold" style={{color:color||"#18181b"}}>{value}</p>
        {sub&&<p className="text-xs text-primary-400">{sub}</p>}
      </div>
    );

    return (
      <div className="space-y-2">
        {/* Report Header */}
        <div className="bg-white rounded-xl p-6 border border-primary-200 text-center">
          <p className="text-xs text-primary-400 uppercase tracking-widest mb-1">Rocklane Capital Partners</p>
          <h1 className="text-2xl font-extrabold text-primary-900 font-display">Rapport de performance</h1>
          <p className="text-base text-primary-500 mt-1">Pamela Atokouna</p>
          <p className="text-xs text-primary-400 mt-1">Période : {period==="s1"?"Semestre 1 (Jan — Juin)":"Année complète (Jan — Déc)"} • Généré le {today}</p>
        </div>

        {/* Section Nav */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {sections.map(s=>(
            <button key={s.k} onClick={()=>setReportSection(s.k)} className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${reportSection===s.k?"bg-primary-900 text-white":"bg-primary-100 text-primary-500 hover:text-primary-900"}`}>{s.l}</button>
          ))}
        </div>

        {/* ===== SYNTHESE ===== */}
        {reportSection==="summary" && (
          <div className="bg-white rounded-xl p-5 border border-primary-200 space-y-5">
            <SectionTitle icon="📊" title="Synthèse générale" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Bonus Total Estimé" value={`${totalBonus.toFixed(1)}%`} sub="sur 30% maximum" color={gc(totalBonus*10/30)} />
              <StatBox label="Tâches Complétées" value={`${doneTasks}/${totalTasks}`} sub={totalTasks?`${Math.round((doneTasks/totalTasks)*100)}% réalisé`:"Aucune tâche"} color="#22c55e" />
              <StatBox label="En Retard" value={overdueTasks.length} sub="tâche(s) en souffrance" color={overdueTasks.length?"#ef4444":"#22c55e"} />
              <StatBox label="KPIs Suivis" value={allKpis.length} sub={`${allKpis.filter(k=>{const c=kpiCurrent(k);const t=parseFloat(k.target)||1;return c>=t;}).length} atteints`} color="#06b6d4" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Bonus Personnel" value={`${personalBonus.toFixed(1)}%`} sub="/10%" color={gc(personalBonus)} />
              <StatBox label="Bonus Projets" value={`${projectBonus.toFixed(1)}%`} sub="/10%" color={gc(projectBonus)} />
              <StatBox label="Bonus Groupe" value="—" sub="/10% (fixé par DG)" color="#6b7280" />
            </div>
            {/* Distribution statuts */}
            <div>
              <p className="text-sm font-semibold text-primary-500 mb-2">Répartition des tâches par statut</p>
              <div className="flex h-6 rounded-full overflow-hidden bg-primary-100">
                {totalTasks>0&&<>{doneTasks>0&&<div style={{width:`${(doneTasks/totalTasks)*100}%`,backgroundColor:SC.done}} className="flex items-center justify-center"><span className="text-[8px] text-white font-bold">{doneTasks}</span></div>}{inRevTasks>0&&<div style={{width:`${(inRevTasks/totalTasks)*100}%`,backgroundColor:SC.in_review}} className="flex items-center justify-center"><span className="text-[8px] text-white font-bold">{inRevTasks}</span></div>}{inProgTasks>0&&<div style={{width:`${(inProgTasks/totalTasks)*100}%`,backgroundColor:SC.in_progress}} className="flex items-center justify-center"><span className="text-[8px] text-white font-bold">{inProgTasks}</span></div>}{todoTasks>0&&<div style={{width:`${(todoTasks/totalTasks)*100}%`,backgroundColor:SC.todo}} className="flex items-center justify-center"><span className="text-[8px] text-white font-bold">{todoTasks}</span></div>}</>}
              </div>
              <div className="flex gap-4 mt-2">{STATUSES.map(s=><div key={s} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor:SC[s]}} /><span className="text-xs text-primary-500">{SL[s]}: {allTasks.filter(t=>t.status===s).length}</span></div>)}</div>
            </div>
          </div>
        )}

        {/* ===== PROJETS DETAILLES ===== */}
        {reportSection==="projects" && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-5 border border-primary-200"><SectionTitle icon="🎯" title="Objectifs projets — détail complet" /></div>
            {PROJECT_OBJ.map(o=>{
              const plans=objPlans(o.id);const tasks=objTasks(o.id);const kpis=objKpis(o.id);const logs=objLogs(o.id);const prog=objProg(o.id);const note=data.notes[`${o.id}_${period}`]||0;
              const doneT=tasks.filter(t=>t.status==="done").length;const odTasks=tasks.filter(isOverdue).length;
              return (
                <div key={o.id} className="bg-white rounded-xl border border-primary-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div><div className="flex items-center gap-2 mb-1"><Badge label={o.filiale} color={FC[o.filiale]} /><Badge label={`${o.poids}%`} color="#6b7280" /></div><h3 className="text-sm font-bold">{o.name}</h3></div>
                      <div className="flex gap-4 text-center">
                        <div><p className="text-lg font-bold" style={{color:gc(prog/10)}}>{prog}%</p><p className="text-xs text-primary-400">Avancement</p></div>
                        <div><p className="text-lg font-bold" style={{color:gc(note)}}>{note||"—"}</p><p className="text-xs text-primary-400">Note</p></div>
                      </div>
                    </div>
                    <MiniBar value={prog} h="h-1.5" color={gc(prog/10)} />
                    <div className="flex gap-4 mt-2 text-xs text-primary-500">
                      <span>{plans.length} plan(s)</span><span>{tasks.length} tâche(s)</span><span className="text-primary-600">{doneT} terminée(s)</span>
                      {odTasks>0&&<span className="text-error-600">⚠ {odTasks} en retard</span>}
                    </div>
                    {/* KPIs */}
                    {kpis.length>0&&<div className="mt-3"><p className="text-xs text-primary-400 font-bold mb-1">KPIs:</p><div className="flex flex-wrap gap-2">{kpis.map(k=>{const cur=kpiCurrent(k);const tar=parseFloat(k.target)||1;const pct=Math.min(100,Math.round((cur/tar)*100));return(<div key={k.id} className="bg-primary-100 rounded px-2 py-1 text-xs"><span className="text-primary-500">{k.name}: </span><span className="font-bold" style={{color:gc(pct/10)}}>{cur}</span><span className="text-primary-400">/{k.target} {k.unit}</span></div>);})}</div></div>}
                    {/* Plans & Tasks */}
                    {plans.map(p=>{const pt=planTasks(p.id);const pp=taskProg(pt);return(
                      <div key={p.id} className="mt-3 bg-primary-50 rounded-lg p-3 border border-primary-200/50">
                        <div className="flex items-center justify-between mb-1"><p className="text-xs font-semibold">{p.name}</p><span className="text-xs font-bold" style={{color:gc(pp/10)}}>{pp}%</span></div>
                        {p.target_date&&<p className="text-xs text-primary-400 mb-1">Cible: {fmtDateFull(p.target_date)}</p>}
                        <MiniBar value={pp} h="h-1" color={gc(pp/10)} />
                        <div className="mt-2 space-y-0.5">{pt.map(t=>(<div key={t.id} className="flex items-center gap-2 text-xs py-0.5">
                          <span style={{color:SC[t.status]}}>{SI[t.status]}</span>
                          <span className={`flex-1 ${t.status==="done"?"line-through text-primary-400":""}`}>{t.title}</span>
                          <Badge label={PL[t.priority]} color={PC[t.priority]} small />
                          {t.deadline&&<span className={isOverdue(t)?"text-error-600":"text-primary-400"}>{fmtDate(t.deadline)}</span>}
                          {t.subtasks?.length>0&&<span className="text-primary-400">{t.subtasks.filter(s=>s.done).length}/{t.subtasks.length} st</span>}
                        </div>))}</div>
                      </div>);})}
                    {/* Recent logs */}
                    {logs.length>0&&<div className="mt-3"><p className="text-xs text-primary-400 font-bold mb-1">Journal récent:</p>{logs.slice(0,3).map(l=>(<div key={l.id} className="text-xs text-primary-500 py-0.5 flex gap-2"><span className="text-primary-400">{new Date(l.date).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</span><span>{l.text}</span></div>))}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== PERSONNEL ===== */}
        {reportSection==="personal" && (
          <div className="bg-white rounded-xl p-5 border border-primary-200">
            <SectionTitle icon="👤" title="Objectifs personnels" />
            <p className="text-xs text-primary-500 mb-4">Évaluation qualitative — 10 critères pondérés à 10% chacun. Bonus personnel maximum: 10% du salaire.</p>
            <div className="space-y-2">
              {PERSONAL_OBJ.map(o=>{
                const note=data.notes[`${o.id}_${period}`]||0;const sal=(note/10)*(o.poids/100)*10;const logs=objLogs(o.id);const kpis=objKpis(o.id);
                return (
                  <div key={o.id} className="bg-primary-50 rounded-lg p-3 border border-primary-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1"><p className="text-sm font-medium">{o.name}</p>
                        {kpis.length>0&&<div className="flex flex-wrap gap-1 mt-1">{kpis.map(k=>(<span key={k.id} className="text-[9px] bg-primary-200 rounded px-1.5 py-0.5 text-primary-700">{k.name}: {kpiCurrent(k)}/{k.target} {k.unit}</span>))}</div>}
                        {logs.length>0&&<p className="text-xs text-primary-400 mt-1 italic">Dernière note: {logs[0].text}</p>}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold" style={{color:gc(note)}}>{note||"—"}<span className="text-xs text-primary-400">/10</span></p>
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
              <p className="text-2xl font-bold" style={{color:gc(personalBonus)}}>{personalBonus.toFixed(1)}%<span className="text-sm text-primary-400"> / 10%</span></p>
            </div>
          </div>
        )}

        {/* ===== FILIALES ===== */}
        {reportSection==="filiales" && (
          <div className="bg-white rounded-xl p-5 border border-primary-200">
            <SectionTitle icon="🏢" title="Performance par filiale" />
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(filialeStats).map(([f,s])=>(
                <div key={f} className="bg-primary-50 rounded-xl p-4 border border-primary-200/50">
                  <div className="flex items-center gap-2 mb-3"><div className="w-3 h-3 rounded-full" style={{backgroundColor:FC[f]}} /><h3 className="text-sm font-bold">{f}</h3></div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div><p className="text-lg font-bold" style={{color:gc(s.avgProg/10)}}>{s.avgProg}%</p><p className="text-xs text-primary-400">Avancement moyen</p></div>
                    <div><p className="text-lg font-bold" style={{color:gc(s.avgNote)}}>{s.avgNote.toFixed(1)}</p><p className="text-xs text-primary-400">Note moyenne</p></div>
                    <div><p className="text-lg font-bold text-primary-900">{s.done}/{s.tasks}</p><p className="text-xs text-primary-400">Tâches terminées</p></div>
                    <div><p className="text-lg font-bold" style={{color:s.overdue?"#ef4444":"#22c55e"}}>{s.overdue}</p><p className="text-xs text-primary-400">En retard</p></div>
                  </div>
                  <div className="mt-2"><p className="text-xs text-primary-500">{s.objs} objectif(s) • Bonus: <span className="font-bold" style={{color:gc(s.bonus)}}>{s.bonus.toFixed(2)}%</span></p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TASKS OVERVIEW ===== */}
        {reportSection==="tasks_overview" && (
          <div className="bg-white rounded-xl p-5 border border-primary-200">
            <SectionTitle icon="✅" title="Vue d'ensemble des tâches" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatBox label="Total" value={totalTasks} color="#18181b" />
              <StatBox label="Terminées" value={doneTasks} sub={totalTasks?`${Math.round((doneTasks/totalTasks)*100)}%`:""} color="#22c55e" />
              <StatBox label="En cours" value={inProgTasks+inRevTasks} color="#3b82f6" />
              <StatBox label="En retard" value={overdueTasks.length} color={overdueTasks.length?"#ef4444":"#22c55e"} />
            </div>
            <p className="text-sm font-semibold text-primary-500 mb-2">Par priorité</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {PRIO.map(p=>{const c=allTasks.filter(t=>t.priority===p);const d=c.filter(t=>t.status==="done").length;return(
                <div key={p} className="bg-primary-50 rounded-lg p-2 border border-primary-200/50 text-center">
                  <Badge label={PL[p]} color={PC[p]} /><p className="text-sm font-bold mt-1">{c.length}</p><p className="text-xs text-primary-400">{d} terminée(s)</p>
                </div>
              );})}
            </div>
            <p className="text-sm font-semibold text-primary-500 mb-2">Toutes les tâches</p>
            <div className="space-y-0.5 max-h-96 overflow-y-auto">
              {[...allTasks].sort((a,b)=>{const po: Record<string,number>={critical:0,high:1,medium:2,low:3};return (po[a.priority]??4)-(po[b.priority]??4);}).map(t=>{const obj=getTaskObj(t);const plan=getTaskPlan(t);return(
                <div key={t.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded hover:bg-primary-50 border-b border-primary-100">
                  <span style={{color:SC[t.status]}}>{SI[t.status]}</span>
                  <span className={`flex-1 truncate ${t.status==="done"?"line-through text-primary-400":""}`}>{t.title}</span>
                  {obj&&<Badge label={obj.filiale} color={FC[obj.filiale]} small />}
                  {plan&&<span className="text-primary-400 truncate max-w-[80px]">{plan.name}</span>}
                  <Badge label={PL[t.priority]} color={PC[t.priority]} small />
                  {t.deadline&&<span className={isOverdue(t)?"text-error-600 font-bold":"text-primary-400"}>{fmtDate(t.deadline)}</span>}
                </div>
              );})}
            </div>
          </div>
        )}

        {/* ===== ALL KPIs ===== */}
        {reportSection==="kpis_all" && (
          <div className="bg-white rounded-xl p-5 border border-primary-200">
            <SectionTitle icon="📊" title="Tableau des KPIs" />
            {allKpis.length===0?<p className="text-sm text-primary-400 py-8 text-center">Aucun KPI défini. Ajoutez des KPIs dans chaque objectif.</p>:(
              <div className="space-y-2">
                {ALL_OBJ.filter(o=>objKpis(o.id).length>0).map(o=>(
                  <div key={o.id}>
                    <div className="flex items-center gap-2 mb-1 mt-3"><div className="w-2 h-2 rounded-full" style={{backgroundColor:FC[o.filiale]}} /><p className="text-xs font-bold text-primary-500">{o.name}</p></div>
                    {objKpis(o.id).map(k=>{const cur=kpiCurrent(k);const tar=parseFloat(k.target)||1;const pct=Math.min(100,Math.round((cur/tar)*100));const atteint=cur>=tar;return(
                      <div key={k.id} className="flex items-center gap-3 bg-primary-50 rounded-lg p-2.5 border border-primary-200/50">
                        <span className={`text-sm ${atteint?"text-primary-600":"text-primary-500"}`}>{atteint?"✓":"○"}</span>
                        <span className="text-xs flex-1">{k.name}</span>
                        <div className="w-24"><MiniBar value={pct} h="h-1" color={gc(pct/10)} /></div>
                        <span className="text-xs font-bold" style={{color:gc(pct/10)}}>{cur}</span>
                        <span className="text-xs text-primary-400">/ {k.target} {k.unit}</span>
                        <span className="text-xs font-bold" style={{color:gc(pct/10)}}>{pct}%</span>
                      </div>
                    );})}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== RISKS ===== */}
        {reportSection==="risks" && (
          <div className="bg-white rounded-xl p-5 border border-primary-200 space-y-4">
            <SectionTitle icon="⚠" title="Risques et alertes" />
            {/* Overdue */}
            <div>
              <p className="text-xs font-bold text-error-600 mb-2">Tâches en retard ({overdueTasks.length})</p>
              {overdueTasks.length===0?<p className="text-xs text-primary-400 bg-success-50 rounded-lg p-3 text-center">✓ Aucune tâche en retard</p>:
              <div className="space-y-1">{overdueTasks.sort((a,b)=>new Date(a.deadline||"").getTime()-new Date(b.deadline||"").getTime()).map(t=>{const obj=getTaskObj(t);const daysLate=daysBetween(t.deadline||"",new Date().toISOString().slice(0,10));return(
                <div key={t.id} className="flex items-center gap-2 bg-error-50 rounded-lg p-2.5 border border-error-200 text-xs">
                  <span className="text-error-600 font-bold">-{daysLate}j</span>
                  <span className="flex-1 text-primary-700">{t.title}</span>
                  {obj&&<Badge label={obj.filiale} color={FC[obj.filiale]} small />}
                  <Badge label={PL[t.priority]} color={PC[t.priority]} small />
                  <span className="text-error-600">{fmtDate(t.deadline)}</span>
                </div>
              );})}</div>}
            </div>
            {/* Critical tasks */}
            <div>
              <p className="text-xs font-bold text-warning-600 mb-2">Tâches critiques non terminées ({criticalTasks.length})</p>
              {criticalTasks.length===0?<p className="text-xs text-primary-400 bg-success-50 rounded-lg p-3 text-center">✓ Toutes les tâches critiques sont terminées</p>:
              <div className="space-y-1">{criticalTasks.map(t=>{const obj=getTaskObj(t);return(
                <div key={t.id} className="flex items-center gap-2 bg-warning-50 rounded-lg p-2.5 border border-warning-200 text-xs">
                  <span style={{color:SC[t.status]}}>{SI[t.status]}</span>
                  <span className="flex-1 text-primary-700">{t.title}</span>
                  {obj&&<Badge label={obj.filiale} color={FC[obj.filiale]} small />}
                  {t.deadline&&<span className={isOverdue(t)?"text-error-600":"text-primary-400"}>{fmtDate(t.deadline)}</span>}
                </div>
              );})}</div>}
            </div>
            {/* Objectives at 0% */}
            <div>
              <p className="text-xs font-bold text-warning-600 mb-2">Objectifs sans avancement</p>
              {(() => {const noProgress = PROJECT_OBJ.filter(o=>objProg(o.id)===0&&objTasks(o.id).length===0);
                return noProgress.length===0?<p className="text-xs text-primary-400 bg-success-50 rounded-lg p-3 text-center">✓ Tous les objectifs ont des tâches</p>:
                <div className="space-y-1">{noProgress.map(o=>(<div key={o.id} className="flex items-center gap-2 bg-warning-50 rounded-lg p-2.5 border border-warning-200 text-xs"><Badge label={o.filiale} color={FC[o.filiale]} small /><span className="text-primary-700">{o.name}</span><span className="ml-auto text-warning-600">Aucune tâche créée</span></div>))}</div>;
              })()}
            </div>
          </div>
        )}

        {/* ===== JOURNAL ===== */}
        {reportSection==="journal" && (
          <div className="bg-white rounded-xl p-5 border border-primary-200">
            <SectionTitle icon="📝" title="Journal des activités" />
            {allLogs.length===0?<p className="text-sm text-primary-400 py-8 text-center">Aucune entrée de journal.</p>:(
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {allLogs.map(l=>{const obj=ALL_OBJ.find(o=>o.id===l.objId);return(
                  <div key={l.id} className="flex gap-3 py-2.5 border-b border-primary-100">
                    <div className="w-16 flex-shrink-0 text-right"><p className="text-xs text-primary-400">{new Date(l.date).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</p><p className="text-xs text-primary-400">{new Date(l.date).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</p></div>
                    <div className="w-px bg-primary-200 flex-shrink-0" />
                    <div className="flex-1"><p className="text-xs text-primary-700">{l.text}</p>{obj&&<div className="mt-1"><Badge label={obj.name.slice(0,40)} color={FC[obj.filiale]||"#6b7280"} small /></div>}</div>
                  </div>
                );})}
              </div>
            )}
          </div>
        )}

        {/* ===== BONUS ===== */}
        {reportSection==="bonus" && (
          <div className="bg-white rounded-xl p-5 border border-primary-200 space-y-5">
            <SectionTitle icon="💰" title="Simulation bonus" />
            <div className="bg-primary-50 rounded-xl p-6 text-center border border-primary-200">
              <p className="text-xs text-primary-500 mb-1">Bonus Total Estimé ({period==="s1"?"S1":"S2"})</p>
              <p className="text-5xl font-extrabold" style={{color:gc(totalBonus*10/30)}}>{totalBonus.toFixed(1)}%</p>
              <p className="text-sm text-primary-400 mt-1">sur 30% maximum</p>
              <div className="w-64 mx-auto mt-3"><MiniBar value={totalBonus} max={30} h="h-3" color={gc(totalBonus*10/30)} /></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="bg-primary-50 rounded-xl p-4 border border-primary-200/50">
                <p className="text-sm text-primary-500 mb-3 font-bold">Personnel (10%)</p>
                {PERSONAL_OBJ.map(o=>{const n=data.notes[`${o.id}_${period}`]||0;const s=(n/10)*(o.poids/100)*10;return(
                  <div key={o.id} className="flex items-center justify-between text-xs py-1 border-b border-primary-200/50"><span className="text-primary-500 truncate mr-2">{o.name}</span><span className="font-bold" style={{color:gc(n)}}>{s.toFixed(2)}%</span></div>
                );})}
                <div className="mt-2 pt-2 border-t border-primary-300 flex justify-between"><span className="text-xs font-bold">Total</span><span className="text-sm font-bold" style={{color:gc(personalBonus)}}>{personalBonus.toFixed(1)}%</span></div>
              </div>
              <div className="bg-primary-50 rounded-xl p-4 border border-primary-200/50">
                <p className="text-sm text-primary-500 mb-3 font-bold">Projets (10%)</p>
                {PROJECT_OBJ.map(o=>{const n=data.notes[`${o.id}_${period}`]||0;const s=(n/10)*(o.poids/100)*10;return(
                  <div key={o.id} className="flex items-center justify-between text-xs py-1 border-b border-primary-200/50"><span className="text-primary-500 truncate mr-2">{o.name.slice(0,25)}</span><span className="font-bold" style={{color:gc(n)}}>{s.toFixed(2)}%</span></div>
                );})}
                <div className="mt-2 pt-2 border-t border-primary-300 flex justify-between"><span className="text-xs font-bold">Total</span><span className="text-sm font-bold" style={{color:gc(projectBonus)}}>{projectBonus.toFixed(1)}%</span></div>
              </div>
              <div className="bg-primary-50 rounded-xl p-4 border border-primary-200/50">
                <p className="text-sm text-primary-500 mb-3 font-bold">Groupe (10%)</p>
                <div className="flex items-center justify-center h-32"><p className="text-xs text-primary-400 text-center">Fixé par le DG<br/>en fin d&apos;année</p></div>
                <div className="mt-2 pt-2 border-t border-primary-300 flex justify-between"><span className="text-xs font-bold">Total</span><span className="text-sm font-bold text-primary-400">—</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  if(!loaded) return <div className="min-h-screen bg-primary-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-900 border-t-transparent rounded-full" /></div>;

  const tabs = [
    {k:"dashboard",l:"📊",f:"Cockpit"},
    {k:"objectives",l:"🎯",f:"Objectifs"},
    {k:"plans",l:"📋",f:"Plans d'action"},
    {k:"tasks",l:"✅",f:"Tâches"},
    {k:"eval",l:"📈",f:"Évaluation"},
    {k:"report",l:"📄",f:"Rapport"},
  ];

  return (
    <div className="min-h-screen bg-primary-50 text-primary-900">
      <div className="bg-white border-b border-primary-200 sticky top-0 z-40">
        <div className="px-4 lg:px-6 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={()=>navigate("/")} className="text-primary-400 hover:text-primary-700 text-xs" title="Retour Cockpit">← Cockpit</button>
              <div className="w-px h-4 bg-primary-200" />
              <h1 className="text-xl font-bold text-primary-900 font-display">Performance</h1>
              <span className="text-xs text-primary-400 hidden sm:block">Rocklane Capital Partners</span>
            </div>
            <div className="flex bg-primary-100 rounded-lg p-0.5">{[{k:"s1",l:"S1"},{k:"s2",l:"S2"}].map(s=>(<button key={s.k} onClick={()=>setPeriod(s.k)} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${period===s.k?"bg-primary-900 text-white shadow-lg shadow-primary-900/10":"text-primary-500"}`}>{s.l}</button>))}</div>
          </div>
          <div className="flex gap-0.5 mt-2 -mb-[1px] overflow-x-auto">
            {tabs.map(t=>(<button key={t.k} onClick={()=>{setTab(t.k);setSelObj(null);}} className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${tab===t.k?"bg-primary-50 text-primary-600 border-t-2 border-x border-primary-900 border-primary-200":"text-primary-400 hover:text-primary-700"}`}><span>{t.l}</span><span className="hidden sm:inline">{t.f}</span></button>))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-4">
        {/* DASHBOARD */}
        {tab==="dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {[{l:"Bonus Total",v:`${totalBonus.toFixed(1)}%`,s:"/30%",c:gc(totalBonus*10/30)},{l:"Personnel",v:`${personalBonus.toFixed(1)}%`,s:"/10%",c:gc(personalBonus)},{l:"Projets",v:`${projectBonus.toFixed(1)}%`,s:"/10%",c:gc(projectBonus)},{l:"Tâches faites",v:`${allTasks.filter(t=>t.status==="done").length}/${allTasks.length}`,s:"",c:allTasks.length?"#22c55e":"#6b7280"},{l:"En retard",v:`${overdueTasks.length}`,s:"",c:overdueTasks.length?"#ef4444":"#22c55e"}].map((c,i)=>(<div key={i} className="bg-white rounded-xl p-3 border border-primary-200"><p className="text-xs text-primary-400 mb-0.5">{c.l}</p><span className="text-xl font-bold" style={{color:c.c}}>{c.v}</span>{c.s&&<span className="text-xs text-primary-400 ml-1">{c.s}</span>}</div>))}
            </div>
            {(overdueTasks.length>0||upcomingTasks.length>0)&&<div className="grid sm:grid-cols-2 gap-3">
              {overdueTasks.length>0&&<div className="bg-error-50 border border-error-200 rounded-xl p-4"><h3 className="text-xs font-bold text-error-600 mb-2">⚠ En retard ({overdueTasks.length})</h3>{overdueTasks.slice(0,5).map(t=>{const obj=getTaskObj(t);return(<div key={t.id} onClick={()=>setModal({type:"task",data:t})} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-error-50 rounded px-1">{obj&&<div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor:FC[obj.filiale]}} />}<span className="text-xs text-primary-700 flex-1 truncate">{t.title}</span><span className="text-xs text-error-600">{fmtDate(t.deadline)}</span></div>);})}</div>}
              {upcomingTasks.length>0&&<div className="bg-warning-50 border border-warning-200 rounded-xl p-4"><h3 className="text-xs font-bold text-warning-600 mb-2">📅 Cette semaine ({upcomingTasks.length})</h3>{upcomingTasks.slice(0,5).map(t=>{const obj=getTaskObj(t);return(<div key={t.id} onClick={()=>setModal({type:"task",data:t})} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-warning-50 rounded px-1">{obj&&<div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor:FC[obj.filiale]}} />}<span className="text-xs text-primary-700 flex-1 truncate">{t.title}</span><span className="text-xs text-warning-600">{fmtDate(t.deadline)}</span></div>);})}</div>}
            </div>}
            <div className="bg-white rounded-xl p-4 border border-primary-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-primary-500">Avancement objectifs projets</h3>
                <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1 text-xs" value={dashFilter.filiale} onChange={e=>setDashFilter(f=>({...f,filiale:e.target.value}))}><option value="all">Toutes filiales</option>{Object.keys(FC).map(f=><option key={f} value={f}>{f}</option>)}</select>
              </div>
              {PROJECT_OBJ.filter(o=>dashFilter.filiale==="all"||o.filiale===dashFilter.filiale).map(o=>{const p=objProg(o.id);const tc=objTasks(o.id).length;const note=data.notes[`${o.id}_${period}`]||0;return(<div key={o.id} onClick={()=>{setTab("objectives");setSelObj(o);}} className="flex items-center gap-2 py-2 border-b border-primary-100 last:border-0 cursor-pointer hover:bg-primary-50 rounded px-2"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:FC[o.filiale]}} /><span className="text-xs flex-1 truncate">{o.name}</span><span className="text-xs text-primary-400 w-8 text-right">{tc}t</span><div className="w-20 hidden sm:block"><MiniBar value={p} color={gc(p/10)} h="h-1" /></div><span className="text-xs font-bold w-10 text-right" style={{color:gc(p/10)}}>{p}%</span><span className="text-xs font-bold w-8 text-right" style={{color:gc(note)}}>{note||"—"}</span></div>);})}
            </div>
          </div>
        )}

        {/* OBJECTIVES */}
        {tab==="objectives"&&!selObj&&(<div className="space-y-4">
          {/* Filtres objectifs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[150px]"><input className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary-400" placeholder="🔍 Rechercher un objectif..." value={objFilter.search} onChange={e=>setObjFilter(f=>({...f,search:e.target.value}))} /></div>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={objFilter.type} onChange={e=>setObjFilter(f=>({...f,type:e.target.value}))}><option value="all">Tous types</option><option value="project">Projets</option><option value="personal">Personnels</option></select>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={objFilter.filiale} onChange={e=>setObjFilter(f=>({...f,filiale:e.target.value}))}><option value="all">Toutes filiales</option>{Object.keys(FC).map(f=><option key={f} value={f}>{f}</option>)}</select>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={objFilter.sort} onChange={e=>setObjFilter(f=>({...f,sort:e.target.value}))}><option value="name">Tri : Nom</option><option value="progress">Tri : Avancement</option><option value="poids">Tri : Poids</option><option value="filiale">Tri : Filiale</option></select>
          </div>
          {(()=>{
            let objs = ALL_OBJ.filter(o=>{
              if(objFilter.type!=="all"&&o.type!==objFilter.type) return false;
              if(objFilter.filiale!=="all"&&o.filiale!==objFilter.filiale) return false;
              if(objFilter.search.trim()){const s=objFilter.search.toLowerCase();if(!o.name.toLowerCase().includes(s)&&!o.filiale.toLowerCase().includes(s)) return false;}
              return true;
            });
            const sortFn = (a: Objective, b: Objective) => {
              if(objFilter.sort==="progress") return objProg(b.id)-objProg(a.id);
              if(objFilter.sort==="poids") return b.poids-a.poids;
              if(objFilter.sort==="filiale") return a.filiale.localeCompare(b.filiale);
              return a.name.localeCompare(b.name);
            };
            objs = [...objs].sort(sortFn);
            const projectObjs = objs.filter(o=>o.type==="project");
            const personalObjs = objs.filter(o=>o.type==="personal");
            return (<>
              {(objFilter.type==="all"||objFilter.type==="project")&&projectObjs.length>0&&<div><h2 className="text-sm font-semibold text-primary-500 mb-3 uppercase tracking-wider">Objectifs projets ({projectObjs.length})</h2><div className="grid sm:grid-cols-2 gap-2">{projectObjs.map(o=>{const p=objProg(o.id);const pc=objPlans(o.id).length;const tc=objTasks(o.id).length;const kc=objKpis(o.id).length;return(<div key={o.id} onClick={()=>setSelObj(o)} className="bg-white rounded-xl p-4 border border-primary-200 hover:border-primary-300 cursor-pointer transition-all"><div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 mb-1"><Badge label={o.filiale} color={FC[o.filiale]} /><span className="text-xs text-primary-400">{o.poids}%</span></div><p className="text-sm font-medium truncate">{o.name}</p><p className="text-xs text-primary-400 mt-0.5">{pc} plan(s) • {tc} tâche(s) • {kc} KPI(s)</p></div><p className="text-xl font-bold flex-shrink-0" style={{color:gc(p/10)}}>{p}%</p></div><MiniBar value={p} color={gc(p/10)} h="h-1.5" /></div>);})}</div></div>}
              {(objFilter.type==="all"||objFilter.type==="personal")&&personalObjs.length>0&&<div><h2 className="text-sm font-semibold text-primary-500 mb-3 uppercase tracking-wider">Objectifs personnels ({personalObjs.length})</h2><div className="grid sm:grid-cols-2 gap-2">{personalObjs.map(o=>{const note=data.notes[`${o.id}_${period}`]||0;return(<div key={o.id} onClick={()=>setSelObj(o)} className="bg-white rounded-xl p-3 border border-primary-200 hover:border-primary-300 cursor-pointer flex items-center justify-between"><div><p className="text-sm font-medium">{o.name}</p><p className="text-xs text-primary-400">{o.poids}%</p></div><p className="text-lg font-bold" style={{color:gc(note)}}>{note||"—"}</p></div>);})}</div></div>}
              {objs.length===0&&<p className="text-sm text-primary-400 text-center py-8">Aucun objectif ne correspond aux filtres.</p>}
            </>);
          })()}
        </div>)}
        {tab==="objectives"&&selObj&&<ObjectiveDetail obj={selObj} />}

        {/* PLANS D'ACTION */}
        {tab==="plans"&&(<div className="space-y-4">
          {/* Filtres plans */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[150px]"><input className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary-400" placeholder="🔍 Rechercher un plan..." value={planFilter.search} onChange={e=>setPlanFilter(f=>({...f,search:e.target.value}))} /></div>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={planFilter.statut} onChange={e=>setPlanFilter(f=>({...f,statut:e.target.value}))}><option value="all">Tous statuts</option><option value="a_faire">À faire</option><option value="en_cours">En cours</option><option value="termine">Terminé</option><option value="bloque">Bloqué</option></select>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={planFilter.priorite} onChange={e=>setPlanFilter(f=>({...f,priorite:e.target.value}))}><option value="all">Toutes priorités</option><option value="critique">Critique</option><option value="haute">Haute</option><option value="moyenne">Moyenne</option><option value="basse">Basse</option></select>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={planFilter.filiale} onChange={e=>setPlanFilter(f=>({...f,filiale:e.target.value}))}><option value="all">Toutes filiales</option>{Object.keys(FC).map(f=><option key={f} value={f}>{f}</option>)}</select>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={planFilter.sort} onChange={e=>setPlanFilter(f=>({...f,sort:e.target.value}))}><option value="name">Tri : Nom</option><option value="avancement">Tri : Avancement</option><option value="date">Tri : Échéance</option><option value="priorite">Tri : Priorité</option><option value="statut">Tri : Statut</option></select>
          </div>
          {(()=>{
            const allPlans = Object.values(data.plans);
            let plans = allPlans.filter(plan=>{
              const obj=ALL_OBJ.find(o=>o.id===plan.objId);
              if(planFilter.statut!=="all"&&(plan.statut||"a_faire")!==planFilter.statut) return false;
              if(planFilter.priorite!=="all"&&(plan.priorite||"moyenne")!==planFilter.priorite) return false;
              if(planFilter.filiale!=="all"&&obj?.filiale!==planFilter.filiale) return false;
              if(planFilter.search.trim()){const s=planFilter.search.toLowerCase();if(!plan.name.toLowerCase().includes(s)&&!(plan.responsable||"").toLowerCase().includes(s)&&!(obj?.name||"").toLowerCase().includes(s)) return false;}
              return true;
            });
            const priOrd: Record<string,number> = {critique:0,haute:1,moyenne:2,basse:3};
            const stOrd: Record<string,number> = {bloque:0,a_faire:1,en_cours:2,termine:3};
            plans = [...plans].sort((a,b)=>{
              if(planFilter.sort==="avancement") return (b.avancement||0)-(a.avancement||0);
              if(planFilter.sort==="date") return (a.target_date||"9999").localeCompare(b.target_date||"9999");
              if(planFilter.sort==="priorite") return (priOrd[a.priorite||"moyenne"]??2)-(priOrd[b.priorite||"moyenne"]??2);
              if(planFilter.sort==="statut") return (stOrd[a.statut||"a_faire"]??1)-(stOrd[b.statut||"a_faire"]??1);
              return a.name.localeCompare(b.name);
            });
            const stCfg: Record<string,{l:string;c:string}> = {a_faire:{l:"À faire",c:"text-primary-500 bg-primary-100"},en_cours:{l:"En cours",c:"text-info-700 bg-info-100"},termine:{l:"Terminé",c:"text-success-700 bg-success-100"},bloque:{l:"Bloqué",c:"text-error-700 bg-error-100"}};
            const priCfg: Record<string,{l:string;c:string}> = {critique:{l:"Critique",c:"text-error-600"},haute:{l:"Haute",c:"text-warning-600"},moyenne:{l:"Moyenne",c:"text-primary-500"},basse:{l:"Basse",c:"text-primary-400"}};
            return plans.length===0
              ? <div className="bg-white rounded-xl p-12 border border-primary-200 text-center"><p className="text-sm text-primary-400">{allPlans.length===0?"Aucun plan d'action. Créez-en un depuis la fiche d'un objectif.":"Aucun plan ne correspond aux filtres."}</p></div>
              : <div className="space-y-2">{plans.map(plan=>{
                  const obj=ALL_OBJ.find(o=>o.id===plan.objId);
                  const tasks=planTasks(plan.id);
                  const doneT=tasks.filter(t=>t.status==="done").length;
                  const av=plan.avancement||0;
                  const st=stCfg[plan.statut||"a_faire"]||stCfg.a_faire;
                  const pri=priCfg[plan.priorite||"moyenne"]||priCfg.moyenne;
                  return(
                    <div key={plan.id} onClick={()=>setModal({type:"plan",data:plan})} className="bg-white rounded-xl p-4 border border-primary-200 hover:border-primary-300 cursor-pointer transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.c}`}>{st.l}</span>
                            {obj&&<Badge label={obj.filiale} color={FC[obj.filiale]} small />}
                            <span className={`text-xs font-medium ${pri.c}`}>{pri.l}</span>
                          </div>
                          <p className="text-sm font-semibold text-primary-800 truncate">{plan.name}</p>
                          <p className="text-xs text-primary-400 mt-0.5 truncate">
                            {obj?.name||"—"}
                            {plan.responsable&&<span> — {plan.responsable}</span>}
                            {plan.target_date&&<span> — Échéance : {fmtDate(plan.target_date)}</span>}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1"><MiniBar value={av} color={gc(av/10)} h="h-1.5" /></div>
                            <span className="text-xs font-bold" style={{color:gc(av/10)}}>{av}%</span>
                            <span className="text-xs text-primary-400">{doneT}/{tasks.length} tâche(s)</span>
                            {(plan.sous_taches?.length||0)>0&&<span className="text-xs text-primary-400">{plan.sous_taches?.filter(s=>s.fait).length}/{plan.sous_taches?.length} sous-tâche(s)</span>}
                            {(plan.livrables?.length||0)>0&&<span className="text-xs text-primary-400">{plan.livrables?.filter(l=>l.fait).length}/{plan.livrables?.length} livrable(s)</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}</div>;
          })()}
        </div>)}

        {/* TASKS */}
        {tab==="tasks"&&(<div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-primary-100 rounded-lg p-0.5">{[{k:"kanban",l:"▦ Kanban"},{k:"list",l:"☰ Liste"},{k:"calendar",l:"📅 Calendrier"},{k:"gantt",l:"▬ Gantt"}].map(v=>(<button key={v.k} onClick={()=>setTaskView(v.k)} className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${taskView===v.k?"bg-primary-900 text-white":"text-primary-500 hover:text-primary-900"}`}>{v.l}</button>))}</div>
            <div className="flex-1 min-w-[150px]"><input className="w-full bg-primary-100 border border-primary-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary-400" placeholder="🔍 Rechercher..." value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))} /></div>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))}><option value="all">Statuts</option>{STATUSES.map(s=><option key={s} value={s}>{SL[s]}</option>)}</select>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={filter.priority} onChange={e=>setFilter(f=>({...f,priority:e.target.value}))}><option value="all">Priorités</option>{PRIO.map(p=><option key={p} value={p}>{PL[p]}</option>)}</select>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={filter.filiale} onChange={e=>setFilter(f=>({...f,filiale:e.target.value}))}><option value="all">Filiales</option>{Object.keys(FC).map(f=><option key={f} value={f}>{f}</option>)}</select>
            <button onClick={()=>{if(!Object.keys(data.plans).length){alert("Créez d'abord un plan d'action.");return;} setModal({type:"task",data:{planId:Object.keys(data.plans)[0]}});}} className="bg-primary-900 hover:bg-primary-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium">+ Tâche</button>
          </div>
          <div className="bg-white rounded-xl p-3 border border-primary-200">
            {taskView==="kanban"&&<KanbanView tasks={filteredTasks} />}
            {taskView==="list"&&<ListView tasks={filteredTasks} />}
            {taskView==="calendar"&&<CalendarView tasks={filteredTasks} />}
            {taskView==="gantt"&&<GanttView tasks={filteredTasks} />}
          </div>
        </div>)}

        {/* EVALUATION */}
        {tab==="eval"&&(<div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-primary-200 text-center"><h2 className="text-base font-semibold text-primary-500 mb-1">ÉVALUATION {period==="s1"?"S1":"S2"}</h2><p className="text-5xl font-extrabold mt-3" style={{color:gc(totalBonus*10/30)}}>{totalBonus.toFixed(1)}%</p><p className="text-xs text-primary-400 mt-1">Bonus / 30%</p><div className="w-48 mx-auto mt-3"><MiniBar value={totalBonus} max={30} color={gc(totalBonus*10/30)} h="h-2" /></div></div>
          {/* Filtre évaluation */}
          <div className="flex flex-wrap items-center gap-2">
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={evalFilter.type} onChange={e=>setEvalFilter(f=>({...f,type:e.target.value}))}><option value="all">Tous types</option><option value="personal">Personnels</option><option value="project">Projets</option></select>
            <select className="bg-primary-100 border border-primary-200 rounded-lg px-2 py-1.5 text-xs" value={evalFilter.filiale} onChange={e=>setEvalFilter(f=>({...f,filiale:e.target.value}))}><option value="all">Toutes filiales</option>{Object.keys(FC).map(f=><option key={f} value={f}>{f}</option>)}</select>
          </div>
          {[{title:"Objectifs personnels (10%)",objs:PERSONAL_OBJ,type:"personal"},{title:"Objectifs projets (10%)",objs:PROJECT_OBJ,type:"project"}].filter(g=>evalFilter.type==="all"||evalFilter.type===g.type).map(({title,objs})=>{
            const filtered=evalFilter.filiale==="all"?objs:objs.filter(o=>o.filiale===evalFilter.filiale);
            if(filtered.length===0) return null;
            return(<div key={title} className="bg-white rounded-xl p-4 border border-primary-200"><h3 className="text-sm font-semibold text-primary-500 mb-3">{title}</h3>{filtered.map(o=>{const note=data.notes[`${o.id}_${period}`]||0;const prog=objProg(o.id);const sal=(note/10)*(o.poids/100)*10;return(<div key={o.id} className="flex items-center gap-2 py-2.5 border-b border-primary-100 last:border-0"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:FC[o.filiale]}} /><span className="text-xs flex-1 truncate">{o.name}</span><span className="text-xs text-primary-400 w-10 text-right">{o.poids}%</span>{o.type==="project"&&<span className="text-xs w-10 text-right hidden sm:block" style={{color:gc(prog/10)}}>{prog}%</span>}<input type="number" min="0" max="10" step="0.5" value={note||""} placeholder="—" onChange={e=>upd(d=>{d.notes[`${o.id}_${period}`]=Math.min(10,Math.max(0,parseFloat(e.target.value)||0));return d;})} className="w-14 bg-primary-100 border border-primary-200 rounded px-2 py-1 text-xs text-center font-bold focus:outline-none focus:border-primary-400" style={{color:gc(note)}} /><span className="text-xs text-primary-400 w-14 text-right">{sal.toFixed(2)}%</span></div>);})}</div>);
          })}
        </div>)}

        {/* RAPPORT */}
        {tab==="report"&&<ReportView />}
      </div>

      {modal?.type==="task"&&<TaskModal task={modal.data} onClose={()=>setModal(null)} />}
      {modal?.type==="plan"&&<PlanModal plan={modal.data} objId={modal.data.objId} onClose={()=>setModal(null)} />}
      {modal?.type==="kpi"&&<KpiModal kpi={modal.data} objId={modal.data.objId} onClose={()=>setModal(null)} />}
    </div>
  );
}
