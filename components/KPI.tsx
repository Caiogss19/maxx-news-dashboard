type Tone = "olive" | "crimson" | "amber" | "navy" | "plum" | "danger" | "ink";

type Props = {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  accent?: Tone;
  /** ícone lucide do rótulo, ex. `<Users />` — pinta na cor do acento */
  icon?: React.ReactNode;
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

/** O acento do CARD (borda e brilho). `ink` não é cor: cai na moldura, como na Central. */
function acento(t: Tone) {
  return t === "ink" ? "var(--uv)" : TONE[t];
}

/**
 * O KPI em `spk-card`: a borda-gradiente e o brilho interno saem da cor do
 * acento, o número também. Card informativo — não levanta no hover.
 */
export function KPI({ label, value, suffix, hint, accent = "ink", icon }: Props) {
  return (
    <div className="spk-card nw-kpi spk-entrar" style={{ ["--ac" as string]: acento(accent) }}>
      <div className="nw-kpi__topo">
        {icon && <span className="nw-kpi__i">{icon}</span>}
        <span className="nw-kpi__r" title={label}>{label}</span>
      </div>
      <div className="nw-kpi__v" style={{ color: TONE[accent] }}>
        {value}
        {suffix && <small>{suffix}</small>}
      </div>
      {hint && <div className="nw-kpi__s">{hint}</div>}
    </div>
  );
}

/**
 * Faixa de KPIs num card só, separada por régua — o padrão de topo da Central.
 * Usa a mesma escala de tom do KPI.
 */
export function KPIRow({
  items
}: {
  items: Array<{ label: string; value: string | number; foot?: string; accent?: Tone; icon?: React.ReactNode }>;
}) {
  return (
    <div className="paper nw-faixa">
      {items.map((it, i) => {
        const tom = it.accent ?? "ink";
        return (
          <div key={i} className="nw-faixa__i" style={{ ["--ac" as string]: acento(tom) }}>
            <div className="nw-kpi__topo">
              {it.icon && <span className="nw-kpi__i">{it.icon}</span>}
              <span className="nw-kpi__r" title={it.label}>{it.label}</span>
            </div>
            <div className="nw-kpi__v" style={{ color: TONE[tom] }}>{it.value}</div>
            {it.foot && <div className="nw-kpi__s">{it.foot}</div>}
          </div>
        );
      })}
    </div>
  );
}
