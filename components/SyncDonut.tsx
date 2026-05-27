"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type Slice = { name: string; value: number; color: string };

export function SyncDonut({
  synced,
  pending,
  failed
}: {
  synced: number;
  pending: number;
  failed: number;
}) {
  const total = synced + pending + failed;
  const data: Slice[] = [
    { name: "Sincronizados", value: synced, color: "var(--olive)" },
    { name: "Pendentes", value: pending, color: "var(--amber)" },
    { name: "Falharam", value: failed, color: "var(--crimson)" }
  ];

  return (
    <div className="paper p-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display text-xl">Sync com RD Station</h3>
        <span className="font-mono-tag">{total} eventos elegíveis</span>
      </div>
      <div className="text-xs text-ink-mute mb-4">
        Proporção de eventos do Beehiiv que viraram conversão no RD.
      </div>
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                stroke="var(--bg-paper)"
                strokeWidth={2}
              >
                {data.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--bg-paper)",
                  border: "1px solid var(--rule-strong)",
                  borderRadius: 4,
                  fontSize: 12,
                  color: "var(--ink)"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2.5">
          {data.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="text-sm flex-1">{s.name}</span>
              <span className="font-mono text-sm">{s.value}</span>
              <span className="text-xs text-ink-faint w-12 text-right">
                {total > 0 ? Math.round((s.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
