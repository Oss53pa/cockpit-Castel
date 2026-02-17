import { useState } from 'react';
import type { Task, Plan, Objective, ModalState } from '../types';
import { STATUSES, SL, SC } from '../constants';
import { TaskCard } from './TaskCard';

interface KanbanViewProps {
  tasks: Task[];
  getTaskObj: (t: Task) => Objective | null;
  getTaskPlan: (t: Task) => Plan | undefined;
  moveTask: (taskId: string, newStatus: string) => void;
  setModal: (m: ModalState | null) => void;
}

export function KanbanView({ tasks, getTaskObj, getTaskPlan, moveTask, setModal }: KanbanViewProps) {
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, t: Task) => {
    setDragTask(t.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (dragTask) moveTask(dragTask, status);
    setDragTask(null);
    setDragOver(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "400px" }}>
      {STATUSES.map(s => {
        const col = tasks.filter(t => t.status === s);
        return (
          <div
            key={s}
            className={`flex-1 min-w-[240px] max-w-[320px] rounded-xl border transition-all ${dragOver === s ? "border-primary-400 bg-primary-50" : "border-primary-200 bg-white/50"}`}
            onDragOver={e => { e.preventDefault(); setDragOver(s); }}
            onDrop={e => handleDrop(e, s)}
            onDragLeave={() => setDragOver(null)}
          >
            <div className="p-3 border-b border-primary-200">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SC[s] }} />
                <span className="text-sm font-bold" style={{ color: SC[s] }}>{SL[s]}</span>
                <span className="ml-auto text-sm bg-primary-100 px-2 py-0.5 rounded-full text-primary-500">{col.length}</span>
              </div>
            </div>
            <div className="p-2 space-y-2 min-h-[100px]">
              {col.map(t => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={e => handleDragStart(e, t)}
                  onDragEnd={() => { setDragTask(null); setDragOver(null); }}
                  className={`transition-opacity ${dragTask === t.id ? "opacity-30" : ""}`}
                >
                  <TaskCard t={t} getTaskObj={getTaskObj} getTaskPlan={getTaskPlan} moveTask={moveTask} setModal={setModal} />
                </div>
              ))}
              {col.length === 0 && <p className="text-center text-primary-300 text-xs py-8">Glissez une tâche ici</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
