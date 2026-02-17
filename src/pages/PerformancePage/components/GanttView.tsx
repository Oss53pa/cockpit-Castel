import type { Task, GanttTask, Objective, ModalState } from '../types';
import { daysBetween } from '../utils';
import { FC, SC } from '../constants';

interface GanttViewProps {
  tasks: Task[];
  ganttStart: number;
  setGanttStart: React.Dispatch<React.SetStateAction<number>>;
  getTaskObj: (t: Task) => Objective | null;
  setModal: (m: ModalState | null) => void;
}

export function GanttView({ tasks, ganttStart, setGanttStart, getTaskObj, setModal }: GanttViewProps) {
  const MN = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const yr = 2026;
  const visM = MN.slice(ganttStart, Math.min(ganttStart + 6, 12));
  const startDate = new Date(yr, ganttStart, 1);
  const endDate = new Date(yr, ganttStart + visM.length, 0);
  const totalDays = daysBetween(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)) + 1;

  const tasksG: GanttTask[] = tasks
    .filter(t => t.deadline || t.startDate)
    .map(t => {
      const s = t.startDate ? new Date(t.startDate + "T00:00:00") : (t.deadline ? new Date(new Date(t.deadline + "T00:00:00").getTime() - 7 * 86400000) : startDate);
      const e = t.deadline ? new Date(t.deadline + "T00:00:00") : new Date(s.getTime() + 7 * 86400000);
      return { ...t, _start: s, _end: e } as GanttTask;
    })
    .filter(t => t._end >= startDate && t._start <= endDate)
    .sort((a, b) => a._start.getTime() - b._start.getTime());

  const dayOff = (d: Date) => Math.max(0, daysBetween(startDate.toISOString().slice(0, 10), d.toISOString().slice(0, 10)));
  const todayOff = dayOff(new Date());

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => setGanttStart(m => Math.max(0, m - 1))} className="w-8 h-8 rounded-lg bg-primary-100 hover:bg-primary-100 flex items-center justify-center text-primary-500">◀</button>
        <span className="text-sm font-bold w-40 text-center">{MN[ganttStart]} — {visM[visM.length - 1]} {yr}</span>
        <button onClick={() => setGanttStart(m => Math.min(6, m + 1))} className="w-8 h-8 rounded-lg bg-primary-100 hover:bg-primary-100 flex items-center justify-center text-primary-500">▶</button>
      </div>
      <div className="overflow-x-auto">
        <div style={{ minWidth: "700px" }}>
          <div className="flex border-b border-primary-200 mb-1">
            <div className="w-52 flex-shrink-0" />
            <div className="flex-1 flex">
              {visM.map((m, i) => {
                const dInM = new Date(yr, ganttStart + i + 1, 0).getDate();
                return <div key={m} className="border-l border-primary-200 text-xs text-primary-400 px-1 font-bold" style={{ width: `${(dInM / totalDays) * 100}%` }}>{m}</div>;
              })}
            </div>
          </div>
          <div className="relative">
            {todayOff >= 0 && todayOff <= totalDays && <div className="absolute top-0 bottom-0 w-px bg-success-500/40 z-10" style={{ left: `calc(208px + (100% - 208px) * ${todayOff / totalDays})` }} />}
            {tasksG.map(t => {
              const obj = getTaskObj(t);
              const left = dayOff(t._start);
              const width = Math.max(3, daysBetween(t._start.toISOString().slice(0, 10), t._end.toISOString().slice(0, 10)));
              const color = obj ? FC[obj.filiale] : "#6b7280";
              return (
                <div key={t.id} className="flex items-center h-8 hover:bg-primary-50 cursor-pointer" onClick={() => setModal({ type: "task", data: t as unknown as Record<string, unknown> })}>
                  <div className="w-52 flex-shrink-0 flex items-center gap-1.5 pr-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: SC[t.status] }} />
                    <span className={`text-xs truncate ${t.status === "done" ? "text-primary-400 line-through" : "text-primary-700"}`}>{t.title}</span>
                  </div>
                  <div className="flex-1 relative h-5">
                    <div className={`absolute h-4 rounded-md top-0.5 ${t.status === "done" ? "opacity-40" : ""}`} style={{ left: `${(left / totalDays) * 100}%`, width: `${(width / totalDays) * 100}%`, backgroundColor: color, minWidth: "6px", boxShadow: `0 0 8px ${color}30` }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold opacity-80 truncate px-1">{width}j</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {tasksG.length === 0 && <p className="text-center text-primary-400 py-12 text-sm">Aucune tâche avec dates</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
