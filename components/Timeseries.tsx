"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { fmtDate } from "@/lib/format";

type Point = { date: string; created: number; deleted: number; net: number };

export function Timeseries({ data }: { data: Point[] }) {
  return (
    <div className="paper p-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display text-xl">Crescimento líquido · 30d</h3>
        <span className="font-mono-tag">inscritos vs. unsubs por dia</span>
      </div>
      <div className="text-xs text-ink-mute mb-4">
        Verde = inscrições. Vermelho = unsubscribes. Linha sólida = saldo líquido.
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--olive)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--olive)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gDeleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--crimson)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--crimson)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--rule)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => fmtDate(v)}
              stroke="var(--ink-faint)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "var(--rule)" }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="var(--ink-faint)" fontSize={11} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              contentStyle={{
                background: "var(--bg-paper)",
                border: "1px solid var(--rule-strong)",
                borderRadius: 4,
                fontSize: 12,
                color: "var(--ink)"
              }}
              labelFormatter={(v) => fmtDate(String(v))}
            />
            <Area
              type="monotone"
              dataKey="created"
              stroke="var(--olive)"
              strokeWidth={1.5}
              fill="url(#gCreated)"
              name="Criados"
            />
            <Area
              type="monotone"
              dataKey="deleted"
              stroke="var(--crimson)"
              strokeWidth={1.5}
              fill="url(#gDeleted)"
              name="Removidos"
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="var(--ink)"
              strokeWidth={2}
              fill="transparent"
              name="Líquido"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
