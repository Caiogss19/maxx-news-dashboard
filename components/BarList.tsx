import { fmtPct } from "@/lib/format";

type Item = {
  label: string;
  value: number;
  hint?: string;
};

type Props = {
  title: string;
  caption?: string;
  items: Item[];
  total?: number;
  accent?: "olive" | "crimson" | "amber" | "navy" | "plum";
  max?: number;
};

const ACCENT_VAR: Record<NonNullable<Props["accent"]>, string> = {
  olive: "var(--olive)",
  crimson: "var(--crimson)",
  amber: "var(--amber)",
  navy: "var(--navy)",
  plum: "var(--plum)"
};

export function BarList({ title, caption, items, total, accent = "olive", max = 8 }: Props) {
  const sliced = items.slice(0, max);
  const tot = total ?? items.reduce((a, b) => a + b.value, 0);
  const maxVal = Math.max(1, ...sliced.map((i) => i.value));

  return (
    <div className="paper p-6">
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="font-display text-xl">{title}</h3>
        {caption && <span className="font-mono-tag">{caption}</span>}
      </div>
      {sliced.length === 0 ? (
        <p className="text-ink-faint text-sm py-6 text-center">Sem dados ainda.</p>
      ) : (
        <div className="space-y-4">
          {sliced.map((it, idx) => {
            const pctOfTotal = tot > 0 ? (it.value / tot) * 100 : 0;
            const pctOfMax = (it.value / maxVal) * 100;
            return (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-6 truncate text-sm">{it.label}</div>
                <div className="col-span-4">
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${pctOfMax}%`, background: ACCENT_VAR[accent] }}
                    />
                  </div>
                </div>
                <div className="col-span-2 flex items-baseline justify-end gap-2">
                  <span className="font-mono text-sm">{it.value}</span>
                  <span className="text-xs text-ink-faint w-12 text-right">
                    {fmtPct(pctOfTotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
