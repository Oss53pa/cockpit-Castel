export function Badge({ label, color, small }: { label: string; color: string; small?: boolean }) {
  return (
    <span
      className={`${small ? "text-xs px-1.5 py-0.5" : "text-xs px-1.5 py-0.5"} rounded font-medium`}
      style={{ backgroundColor: color + "20", color }}
    >
      {label}
    </span>
  );
}
