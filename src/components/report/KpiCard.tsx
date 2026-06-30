import { fmtPct } from "@/lib/pilot-data";

type Accent = "brand" | "accent" | "warn" | "danger";

const accentMap: Record<Accent, string> = {
  brand: "from-[rgba(0,181,240,0.2)] to-[rgba(0,181,240,0.05)] border-[var(--color-hr-blue)]/25",
  accent: "from-[rgba(230,0,126,0.18)] to-[rgba(230,0,126,0.05)] border-[var(--color-hr-pink)]/25",
  warn: "from-[rgba(247,148,29,0.2)] to-[rgba(247,148,29,0.05)] border-[var(--color-hr-orange)]/25",
  danger: "from-[rgba(230,0,126,0.22)] to-[rgba(230,0,126,0.06)] border-[var(--color-hr-pink)]/30",
};

function deltaClass(value: number, lowerIsBetter = false) {
  const positive = lowerIsBetter ? value < 0 : value > 0;
  if (value === 0) return "text-slate-400";
  return positive ? "text-emerald-400" : "text-rose-400";
}

function DeltaValue({ value, lowerIsBetter = false }: { value: number; lowerIsBetter?: boolean }) {
  return (
    <span className={`font-semibold ${deltaClass(value, lowerIsBetter)}`}>{fmtPct(value)}</span>
  );
}

export function KpiCard({
  title,
  value,
  subtitle,
  accent = "brand",
  deltas,
  valueDelta,
  lowerIsBetter = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  accent?: Accent;
  deltas?: { label: string; value: number; lowerIsBetter?: boolean }[];
  valueDelta?: number;
  lowerIsBetter?: boolean;
}) {
  const valueColor =
    valueDelta !== undefined ? deltaClass(valueDelta, lowerIsBetter) : "text-white";

  return (
    <div className={`glass-card bg-gradient-to-br p-5 md:p-6 ${accentMap[accent]}`}>
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className={`mt-2 text-3xl font-extrabold tracking-tight md:text-4xl ${valueColor}`}>
        {value}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>
      {deltas && deltas.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-white/5 pt-3 text-sm">
          {deltas.map((d) => (
            <div key={d.label} className="flex items-center justify-between">
              <span className="text-slate-500">{d.label}</span>
              <DeltaValue value={d.value} lowerIsBetter={d.lowerIsBetter} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MetricRow({
  label,
  baseline,
  pilot,
  delta,
  lowerIsBetter = false,
}: {
  label: string;
  baseline: string;
  pilot: string;
  delta: number;
  lowerIsBetter?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="text-right">
        <div className="text-sm text-slate-500">
          {baseline} → <span className="font-semibold text-white">{pilot}</span>
        </div>
        <div className={`text-xs font-semibold ${deltaClass(delta, lowerIsBetter)}`}>
          {fmtPct(delta)}
        </div>
      </div>
    </div>
  );
}

export { DeltaValue };
