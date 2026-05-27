type Point = { hour: number; opens: number; clicks: number };

export function HourBars({ data }: { data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.opens));
  return (
    <div className="paper p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-display text-xl">Aberturas por hora</h3>
        <span className="font-mono-tag">melhor horário de envio</span>
      </div>
      <div className="flex items-end gap-[3px] h-40">
        {data.map((d) => (
          <div key={d.hour} className="flex-1 flex flex-col justify-end" title={`${d.hour}h · ${d.opens} aberturas · ${d.clicks} cliques`}>
            <div
              className="w-full rounded-sm transition-all"
              style={{ height: `${(d.opens / max) * 100}%`, background: "var(--olive)", minHeight: 2 }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-ink-faint font-mono mt-2">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </div>
  );
}
