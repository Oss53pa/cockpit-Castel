export function MiniBar({ value, max = 100, color = "#22c55e", h = "h-1.5" }: { value: number; max?: number; color?: string; h?: string }) {
  return (
    <div className={`w-full ${h} rounded-full bg-primary-200 overflow-hidden`}>
      <div
        className={`${h} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, max > 0 ? (value / max) * 100 : 0)}%`, backgroundColor: color }}
      />
    </div>
  );
}
