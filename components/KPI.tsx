type Props = {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  accent?: "olive" | "crimson" | "amber" | "navy" | "plum" | "ink";
};

const ACCENT_CLASS: Record<NonNullable<Props["accent"]>, string> = {
  olive: "text-olive",
  crimson: "text-crimson",
  amber: "text-amber",
  navy: "text-navy",
  plum: "text-plum",
  ink: "text-ink"
};

export function KPI({ label, value, suffix, hint, accent = "ink" }: Props) {
  return (
    <div className="paper p-6 flex flex-col gap-3 fade-up">
      <div className="font-mono-tag">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className={`num-display text-5xl ${ACCENT_CLASS[accent]}`}>{value}</div>
        {suffix && <span className="text-ink-mute text-sm">{suffix}</span>}
      </div>
      {hint && <div className="text-xs text-ink-mute leading-snug">{hint}</div>}
    </div>
  );
}
