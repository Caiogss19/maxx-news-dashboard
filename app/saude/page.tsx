import { getSnapshot } from "@/lib/queries";
import { Section } from "@/components/Section";
import { BarList } from "@/components/BarList";
import { fmtPct } from "@/lib/format";

export const revalidate = 30;

export default async function Page() {
  const s = await getSnapshot();

  return (
    <Section
      num="05"
      eyebrow="Saúde da integração"
      title="Onde a sincronização *está quebrando*."
      subtitle="Falhas que importam: Beehiiv rejeitando lead do RD, ou RD recusando conversão do Beehiiv. Cada erro é capturado com o motivo retornado pela API."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="paper p-6 md:col-span-1">
          <div className="font-mono-tag mb-3">RD → Beehiiv</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-ink-mute">Sucessos</div>
              <div className="num-display text-3xl text-olive mt-1">{s.outbound.ok}</div>
            </div>
            <div>
              <div className="text-xs text-ink-mute">Falhas</div>
              <div className="num-display text-3xl text-crimson mt-1">{s.outbound.fail}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-rule">
            <div className="text-xs text-ink-mute mb-1">Taxa de sucesso</div>
            <div className="num-display text-2xl">{fmtPct(s.outbound.rate)}</div>
          </div>
        </div>
        <div className="md:col-span-2">
          <BarList
            title="Motivos de falha · RD → Beehiiv"
            caption="agrupado por error_message"
            items={s.outbound.errorsByMessage.map((g) => ({ label: g.message, value: g.count }))}
            total={s.outbound.fail}
            accent="crimson"
            max={8}
          />
        </div>
      </div>
    </Section>
  );
}
