import { fmtPct } from "@/lib/format";

type Step = { label: string; value: number; sublabel?: string };

export function Funnel({
  title,
  caption,
  steps,
  accent = "olive"
}: {
  title: string;
  caption?: string;
  steps: Step[];
  accent?: "olive" | "crimson" | "amber" | "navy";
}) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  const accentMap: Record<string, string> = {
    olive: "var(--olive)",
    crimson: "var(--crimson)",
    amber: "var(--amber)",
    navy: "var(--navy)"
  };
  const color = accentMap[accent];

  return (
    <div className="paper p-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display text-xl">{title}</h3>
        {caption && <span className="font-mono-tag">{caption}</span>}
      </div>
      <div className="space-y-3 mt-6">
        {steps.map((s, i) => {
          const w = (s.value / max) * 100;
          const conv = i > 0 ? (steps[i - 1].value > 0 ? (s.value / steps[i - 1].value) * 100 : 0) : null;
          return (
            <div key={i} className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-3">
                <div className="text-sm">{s.label}</div>
                {s.sublabel && <div className="text-xs text-ink-faint">{s.sublabel}</div>}
              </div>
              <div className="col-span-7">
                <div className="relative">
                  <div
                    className="h-9 rounded-sm flex items-center px-3 text-sm font-medium"
                    style={{
                      width: `${Math.max(w, 6)}%`,
                      background: color,
                      color: "white",
                      minWidth: 60
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              </div>
              <div className="col-span-2 text-right">
                {conv != null && (
                  <span className="text-xs text-ink-mute">
                    <span className="font-mono text-ink">{fmtPct(conv, 1)}</span> da etapa anterior
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
