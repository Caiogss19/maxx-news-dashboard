type Point = { hour: number; opens: number; clicks: number };

/**
 * Histograma do horário em que o leitor humano engaja (BRT). Os scanners já
 * saem daqui na view — sem isso o gráfico só retrataria a hora do disparo,
 * porque filtro corporativo dispara em minutos.
 */
export function HourBars({ data }: { data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.opens));
  const vazio = data.every((d) => d.opens === 0);

  return (
    <div className="paper p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="nw-painel-t">
          Quando o leitor engaja
        </h3>
        <span className="font-mono-tag">hora BRT · sem scanners</span>
      </div>

      {vazio ? (
        <p className="text-ink-faint text-sm py-10 text-center">Sem dados ainda.</p>
      ) : (
        <>
          <div className="text-xs text-ink-mute mb-4">pico de {max} engajamentos</div>
          {/* items-stretch (padrão) é obrigatório: com items-end a coluna encolhe
              para o conteúdo e a altura percentual da barra perde a referência. */}
          <div className="flex gap-[3px] h-32">
            {data.map((d) => (
              <div
                key={d.hour}
                className="flex-1 h-full flex flex-col justify-end"
                title={`${d.hour}h · ${d.opens} engajamentos · ${d.clicks} cliques`}
              >
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${(d.opens / max) * 100}%`,
                    background: d.opens > 0 ? "var(--accent)" : "var(--rule)",
                    minHeight: 2
                  }}
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
        </>
      )}
    </div>
  );
}
