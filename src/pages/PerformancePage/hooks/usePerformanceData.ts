import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PerfData, Task, Kpi, Objective } from '../types';
import { SK, ALL_OBJ } from '../constants';
import { uid, initData, isOverdue } from '../utils';

export function usePerformanceData() {
  const [data, setData] = useState<PerfData>(initData());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const r = localStorage.getItem(SK);
      if (r) setData(JSON.parse(r));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const save = useCallback((d: PerfData) => {
    try { localStorage.setItem(SK, JSON.stringify(d)); } catch { /* ignore */ }
  }, []);

  const upd = useCallback((fn: (d: PerfData) => PerfData) => {
    setData(prev => {
      const n = fn(JSON.parse(JSON.stringify(prev)));
      save(n);
      return n;
    });
  }, [save]);

  const objPlans = useCallback(
    (oid: string) => Object.values(data.plans).filter(p => p.objId === oid),
    [data.plans]
  );

  const planTasks = useCallback(
    (pid: string) => Object.values(data.tasks).filter(t => t.planId === pid),
    [data.tasks]
  );

  const objTasks = useCallback(
    (oid: string) => {
      const pids = objPlans(oid).map(p => p.id);
      return Object.values(data.tasks).filter(t => pids.includes(t.planId));
    },
    [data.tasks, objPlans]
  );

  const objKpis = useCallback(
    (oid: string) => Object.values(data.kpis).filter(k => k.objId === oid),
    [data.kpis]
  );

  const objLogs = useCallback(
    (oid: string) => (data.logs[oid] || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [data.logs]
  );

  const allTasks = useMemo(() => Object.values(data.tasks), [data.tasks]);

  const taskProg = useCallback((tasks: Task[]) => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100);
  }, []);

  const objProg = useCallback(
    (oid: string) => taskProg(objTasks(oid)),
    [objTasks, taskProg]
  );

  const getTaskObj = useCallback(
    (t: Task) => {
      const plan = data.plans[t.planId];
      if (!plan) return null;
      return ALL_OBJ.find(o => o.id === plan.objId) || null;
    },
    [data.plans]
  );

  const getTaskPlan = useCallback(
    (t: Task) => data.plans[t.planId],
    [data.plans]
  );

  const kpiCurrent = useCallback((k: Kpi): number => {
    const linked = (k.planIds || []).map(pid => data.plans[pid]).filter(Boolean);
    if (linked.length > 0) {
      const avgAv = linked.reduce((s, p) => s + (p.avancement || 0), 0) / linked.length;
      const tar = parseFloat(k.target) || 0;
      return tar > 0 ? parseFloat(((avgAv / 100) * tar).toFixed(1)) : 0;
    }
    return parseFloat(k.current) || 0;
  }, [data.plans]);

  const overdueTasks = useMemo(() => allTasks.filter(isOverdue), [allTasks]);

  const upcomingTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const w = new Date(new Date().getTime() + 7 * 86400000).toISOString().slice(0, 10);
    return allTasks.filter(t => t.deadline && t.status !== "done" && t.deadline >= today && t.deadline <= w);
  }, [allTasks]);

  const calcBonus = useCallback((objs: Objective[], period: string) => {
    let t = 0;
    objs.forEach(o => {
      const n = data.notes[`${o.id}_${period}`] || 0;
      t += (n / 10) * (o.poids / 100) * 10;
    });
    return t;
  }, [data.notes]);

  const moveTask = useCallback((taskId: string, newStatus: string) => {
    upd(d => {
      if (d.tasks[taskId]) d.tasks[taskId].status = newStatus;
      return d;
    });
  }, [upd]);

  const addLog = useCallback((objId: string, text: string) => {
    upd(d => {
      if (!d.logs[objId]) d.logs[objId] = [];
      d.logs[objId].push({ id: uid(), text, date: new Date().toISOString() });
      return d;
    });
  }, [upd]);

  return {
    data,
    loaded,
    upd,
    objPlans,
    planTasks,
    objTasks,
    objKpis,
    objLogs,
    allTasks,
    taskProg,
    objProg,
    getTaskObj,
    getTaskPlan,
    kpiCurrent,
    overdueTasks,
    upcomingTasks,
    calcBonus,
    moveTask,
    addLog,
  };
}
