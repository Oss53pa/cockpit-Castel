import type { Task, Plan, Objective, ModalState } from '../types';
import { fmtDate, isOverdue } from '../utils';
import { STATUSES, SL, SI, SC, PL, PC, FC } from '../constants';
import { Badge } from './Badge';
import { MiniBar } from './MiniBar';

interface TaskCardProps {
  t: Task;
  getTaskObj: (t: Task) => Objective | null;
  getTaskPlan: (t: Task) => Plan | undefined;
  moveTask: (taskId: string, newStatus: string) => void;
  setModal: (m: ModalState | null) => void;
}

export function TaskCard({ t, getTaskObj, getTaskPlan, moveTask, setModal }: TaskCardProps) {
  const obj = getTaskObj(t);
  const plan = getTaskPlan(t);
  const od = isOverdue(t);
  const subDone = t.subtasks?.filter(s => s.done).length || 0;
  const subTotal = t.subtasks?.length || 0;
  const si = STATUSES.indexOf(t.status);

  return (
    <div className={`bg-primary-100 rounded-xl border border-primary-200 hover:border-primary-300 transition-all ${od ? "ring-1 ring-error-300" : ""}`}>
      <div className="p-3 cursor-pointer" onClick={() => setModal({ type: "task", data: t as unknown as Record<string, unknown> })}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className={`text-sm font-semibold leading-snug ${t.status === "done" ? "line-through text-primary-400" : "text-primary-800"}`}>{t.title}</p>
          {od && <span className="text-xs bg-error-100 text-error-600 px-1 py-0.5 rounded flex-shrink-0">Retard</span>}
        </div>
        <div className="flex items-center gap-1 flex-wrap mb-2">
          <Badge label={PL[t.priority]} color={PC[t.priority]} small />
          {obj && <Badge label={obj.filiale} color={FC[obj.filiale]} small />}
          {plan && <span className="text-xs text-primary-400 truncate max-w-[100px]">{plan.name}</span>}
        </div>
        {subTotal > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <MiniBar value={subDone} max={subTotal} color="#22c55e" h="h-1" />
            <span className="text-xs text-primary-400">{subDone}/{subTotal}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-primary-400">
          {t.startDate && <span>▸ {fmtDate(t.startDate)}</span>}
          {t.deadline && <span className={od ? "text-error-600 font-bold" : ""}> {fmtDate(t.deadline)}</span>}
        </div>
      </div>
      <div className="border-t border-primary-200/50 px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {si > 0 && <button onClick={e => { e.stopPropagation(); moveTask(t.id, STATUSES[si - 1]); }} className="text-xs px-2 py-1 rounded-lg hover:bg-primary-100 text-primary-500">◄</button>}
        </div>
        <span className="text-xs font-bold" style={{ color: SC[t.status] }}>{SI[t.status]} {SL[t.status]}</span>
        <div className="flex items-center gap-0.5">
          {si < 3 && <button onClick={e => { e.stopPropagation(); moveTask(t.id, STATUSES[si + 1]); }} className="text-xs px-2 py-1 rounded-lg hover:bg-primary-100 text-primary-500">►</button>}
          {t.status !== "done" && <button onClick={e => { e.stopPropagation(); moveTask(t.id, "done"); }} className="text-xs px-2 py-1 rounded-lg hover:bg-success-50 text-success-600">✓</button>}
        </div>
      </div>
    </div>
  );
}
