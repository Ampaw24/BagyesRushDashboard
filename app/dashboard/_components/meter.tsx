type MeterProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
};

export function Meter({ label, value, icon }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          {icon}
        </span>
        <span className="text-2xl font-semibold tracking-tight text-foreground">{clamped.toFixed(1)}%</span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="break-words text-sm text-text-secondary">{label}</p>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-brand/15"
          role="meter"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div className="h-full rounded-full bg-brand transition-[width] duration-150" style={{ width: `${clamped}%` }} />
        </div>
      </div>
    </div>
  );
}
