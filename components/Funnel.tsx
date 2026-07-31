import { fmtNum, fmtPct } from "@/lib/format";

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
  accent?: "olive" | "crimson" | "amber" | "navy" | "plum" | "danger";
}) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  const accentMap: Record<string, string> = {
    olive: "var(--olive)",
    crimson: "var(--crimson)",
    amber: "var(--amber)",
    navy: "var(--navy)",
    plum: "var(--plum)",
    danger: "var(--danger)"
  };
  const color = accentMap[accent];

  return (
    <div className="paper">
      <div className="panel-head">
        <h3 className="font-display" style={{ fontSize: 17, fontWeight: 500 }}>
          {title}
        </h3>
        {caption && <span className="font-mono-tag whitespace-nowrap">{caption}</span>}
      </div>
      {/* Layout em linhas de rótulo + barra, não em grid de 12 colunas: dentro de
          um painel estreito o grid espremia o rótulo e quebrava a conversão em
          várias linhas. A conversão fica acima da barra, alinhada à direita. */}
      <div className="p-5 space-y-4">
        {steps.map((s, i) => {
          const w = (s.value / max) * 100;
          const conv =
            i > 0 ? (steps[i - 1].value > 0 ? (s.value / steps[i - 1].value) * 100 : 0) : null;
          return (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <div className="min-w-0">
                  <span className="text-sm">{s.label}</span>
                  {s.sublabel && (
                    <span className="text-xs text-ink-faint ml-2 truncate">{s.sublabel}</span>
                  )}
                </div>
                {conv != null && (
                  <span className="text-xs text-ink-mute whitespace-nowrap">
                    <span className="font-mono text-ink">{fmtPct(conv, 1)}</span> da etapa anterior
                  </span>
                )}
              </div>
              <div
                className="h-8 rounded-sm flex items-center px-3 text-sm font-semibold font-mono"
                style={{
                  width: `${Math.max(w, 8)}%`,
                  background: color,
                  /* texto na cor do fundo da página: contraste garantido sobre
                     qualquer acento claro do tema escuro */
                  color: "var(--bg)",
                  minWidth: 64
                }}
              >
                {fmtNum(s.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
