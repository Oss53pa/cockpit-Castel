import type { Task, Plan, Objective, ModalState } from '../types';
import { TaskCard } from './TaskCard';

interface ListViewProps {
  tasks: Task[];
  getTaskObj: (t: Task) => Objective | null;
  getTaskPlan: (t: Task) => Plan | undefined;
  moveTask: (taskId: string, newStatus: string) => void;
  setModal: (m: ModalState | null) => void;
}

export function ListView({ tasks, getTaskObj, getTaskPlan, moveTask, setModal }: ListViewProps) {
  return (
    <div className="space-y-2">
      {tasks.map(t => <TaskCard key={t.id} t={t} getTaskObj={getTaskObj} getTaskPlan={getTaskPlan} moveTask={moveTask} setModal={setModal} />)}
      {tasks.length === 0 && <p className="text-center text-primary-400 py-12 text-sm">Aucune tâche trouvée</p>}
    </div>
  );
}
