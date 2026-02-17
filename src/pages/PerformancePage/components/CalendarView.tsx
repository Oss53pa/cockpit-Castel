import type { Task, Objective, ModalState } from '../types';
import { FC, SC } from '../constants';

interface CalendarViewProps {
  tasks: Task[];
  calMonth: number;
  calYear: number;
  setCalMonth: React.Dispatch<React.SetStateAction<number>>;
  setCalYear: React.Dispatch<React.SetStateAction<number>>;
  getTaskObj: (t: Task) => Objective | null;
  setModal: (m: ModalState | null) => void;
}

export function CalendarView({ tasks, calMonth, calYear, setCalMonth, setCalYear, getTaskObj, setModal }: CalendarViewProps) {
  const dIM = new Date(calYear, calMonth + 1, 0).getDate();
  const fD = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => { const d = i - fD + 1; return (d < 1 || d > dIM) ? null : d; });
  const MN = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const getT = (d: number) => {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return tasks.filter(t => t.deadline === ds);
  };
  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="w-8 h-8 rounded-lg bg-primary-100 hover:bg-primary-100 flex items-center justify-center text-primary-500">◀</button>
        <span className="font-bold text-sm w-40 text-center">{MN[calMonth]} {calYear}</span>
        <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="w-8 h-8 rounded-lg bg-primary-100 hover:bg-primary-100 flex items-center justify-center text-primary-500">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => <div key={d} className="text-center text-xs text-primary-400 py-2 font-bold">{d}</div>)}
        {days.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="min-h-[70px]" />;
          const dt = getT(d);
          const isT = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
          return (
            <div key={i} className={`min-h-[70px] rounded-lg p-1.5 border ${isT ? "border-primary-400 bg-success-50" : "border-primary-200 bg-white/50"}`}>
              <p className={`text-xs mb-1 ${isT ? "text-primary-600 font-bold" : "text-primary-400"}`}>{d}</p>
              {dt.slice(0, 3).map(t => {
                const obj = getTaskObj(t);
                return (
                  <div key={t.id} onClick={() => setModal({ type: "task", data: t as unknown as Record<string, unknown> })} className="text-[9px] px-1.5 py-0.5 rounded mb-0.5 truncate cursor-pointer hover:opacity-80 border-l-2" style={{ backgroundColor: SC[t.status] + "15", color: SC[t.status], borderColor: obj ? FC[obj.filiale] : "transparent" }}>
                    {t.title}
                  </div>
                );
              })}
              {dt.length > 3 && <p className="text-xs text-primary-400">+{dt.length - 3}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
