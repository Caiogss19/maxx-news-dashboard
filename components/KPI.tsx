type Tone = "olive" | "crimson" | "amber" | "navy" | "plum" | "danger" | "ink";

type Props = {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  accent?: Tone;
};

const TONE: Record<Tone, string> = {
  olive: "var(--olive)",
  crimson: "var(--crimson)",
  amber: "var(--amber)",
  navy: "var(--navy)",
  plum: "var(--plum)",
  danger: "var(--danger)",
  ink: "var(--ink)"
};

export function KPI({ label, value, suffix, hint, accent = "ink" }: Props) {
  return (
    <div className="paper p-5 flex flex-col gap-3 fade-up">
      <div className="font-mono-tag">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="num-display" style={{ fontSize: 38, color: TONE[accent] }}>
          {value}
        </div>
        {suffix && <span className="text-ink-mute text-sm">{suffix}</span>}
      </div>
      {hint && <div className="text-xs text-ink-mute leading-snug">{hint}</div>}
    </div>
  );
}

/**
 * Faixa de KPIs separada por régua vertical, sem cartões — o padrão de topo da
 * Central de Leads. Usa a mesma escala de tom do KPI.
 */
export function KPIRow({
  items
}: {
  items: Array<{ label: string; value: string | number; foot?: string; accent?: Tone }>;
}) {
  return (
    <div className="paper grid grid-cols-2 md:grid-cols-4">
      {items.map((it, i) => (
        <div
          key={i}
          className="p-5"
          style={{
            borderRight: i % 4 === 3 ? "none" : "1px solid var(--rule)",
            borderBottom: i < items.length - (items.length % 4 || 4) ? "1px solid var(--rule)" : "none"
          }}
        >
          <div className="font-mono-tag mb-3">{it.label}</div>
          <div className="num-display" style={{ fontSize: 40, color: TONE[it.accent ?? "ink"] }}>
            {it.value}
          </div>
          {it.foot && <div className="text-xs text-ink-mute mt-2.5 leading-snug">{it.foot}</div>}
        </div>
      ))}
    </div>
  );
}
