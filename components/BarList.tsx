import { fmtNum, fmtPct } from "@/lib/format";

type Item = {
  label: string;
  value: number;
  /** Texto à direita no lugar do "% do total" — use quando o valor já é uma taxa. */
  hint?: string;
};

type Props = {
  title: string;
  caption?: string;
  items: Item[];
  total?: number;
  accent?: "olive" | "crimson" | "amber" | "navy" | "plum" | "danger";
  max?: number;
  /** Sufixo do valor (ex.: "%"). Quando definido, a coluna de % do total some. */
  unit?: string;
};

const ACCENT_VAR: Record<NonNullable<Props["accent"]>, string> = {
  olive: "var(--olive)",
  crimson: "var(--crimson)",
  amber: "var(--amber)",
  navy: "var(--navy)",
  plum: "var(--plum)",
  danger: "var(--danger)"
};

export function BarList({
  title,
  caption,
  items,
  total,
  accent = "olive",
  max = 8,
  unit
}: Props) {
  const sliced = items.slice(0, max);
  const tot = total ?? items.reduce((a, b) => a + b.value, 0);
  const maxVal = Math.max(1, ...sliced.map((i) => i.value));

  return (
    <div className="paper">
      <div className="panel-head">
        <h3 className="nw-painel-t">
          {title}
        </h3>
        {caption && <span className="font-mono-tag">{caption}</span>}
      </div>
      {sliced.length === 0 ? (
        <p className="text-ink-faint text-sm py-10 text-center">Sem dados ainda.</p>
      ) : (
        <div className="p-5 space-y-3.5">
          {sliced.map((it, idx) => {
            const pctOfMax = (it.value / maxVal) * 100;
            // Quando o valor já é uma taxa (unit) ou há hint próprio, "% do total"
            // não significa nada — mostra o hint no lugar.
            const right =
              it.hint ?? (unit ? null : fmtPct(tot > 0 ? (it.value / tot) * 100 : 0));
            return (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-6 truncate text-sm" title={it.label}>
                  {it.label}
                </div>
                <div className="col-span-3">
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${pctOfMax}%`, background: ACCENT_VAR[accent] }}
                    />
                  </div>
                </div>
                <div className="col-span-3 flex items-baseline justify-end gap-2">
                  <span className="font-mono text-sm">
                    {unit ? it.value : fmtNum(it.value)}
                    {unit}
                  </span>
                  {right && (
                    <span className="text-xs text-ink-faint w-14 text-right">{right}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
