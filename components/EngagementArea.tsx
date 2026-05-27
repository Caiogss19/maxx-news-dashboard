"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { fmtDate } from "@/lib/format";

type Point = { day: string; opens: number; clicks: number; delivered: number };

export function EngagementArea({ data }: { data: Point[] }) {
  return (
    <div className="paper p-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display text-xl">Engajamento ao longo do tempo</h3>
        <span className="font-mono-tag">aberturas vs. cliques por dia</span>
      </div>
      <div className="text-xs text-ink-mute mb-4">
        Azul = entregas. Verde = aberturas. Âmbar = cliques.
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gOpens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--olive)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--olive)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--amber)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--rule)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="day"
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
            <Area type="monotone" dataKey="delivered" stroke="var(--navy)" strokeWidth={1.5} fill="transparent" name="Entregas" />
            <Area type="monotone" dataKey="opens" stroke="var(--olive)" strokeWidth={1.5} fill="url(#gOpens)" name="Aberturas" />
            <Area type="monotone" dataKey="clicks" stroke="var(--amber)" strokeWidth={2} fill="url(#gClicks)" name="Cliques" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
