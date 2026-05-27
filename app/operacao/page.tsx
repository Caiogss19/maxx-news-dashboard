import { getSnapshot } from "@/lib/queries";
import { getEngagement } from "@/lib/analytics";
import { Section } from "@/components/Section";
import { KPI } from "@/components/KPI";
import { BarList } from "@/components/BarList";
import { SyncDonut } from "@/components/SyncDonut";
import { RecentEvents } from "@/components/RecentEvents";
import { RecentOutbound } from "@/components/RecentOutbound";
import { fmtNum, fmtPct } from "@/lib/format";

export const revalidate = 30;

export default async function Page() {
  const [s, eng] = await Promise.all([getSnapshot(), getEngagement()]);

  const interactions = [
    { label: "email.delivered", value: eng.totals.delivered },
    { label: "email.opened", value: eng.totals.opens },
    { label: "email.clicked", value: eng.totals.clicks },
    { label: "email.bounced", value: eng.totals.bounces },
    { label: "email.unsubscribed", value: eng.totals.unsubscribes }
  ].filter((i) => i.value > 0);

  return (
    <main>
      <Section
        num="01"
        eyebrow="Distribuição de eventos"
        title="O que está *acontecendo* no Beehiiv."
        subtitle="Eventos de ciclo de vida (inscrições, posts) e interações com as edições. Útil para detectar picos anormais."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <BarList
            title="Eventos de ciclo de vida"
            caption="subscription / post / survey"
            items={s.events.byType.map((g) => ({ label: g.type, value: g.count }))}
            accent="olive"
          />
          <SyncDonut
            synced={s.events.rdSynced.synced}
            pending={s.events.rdSynced.pending}
            failed={s.events.rdSynced.failed}
          />
        </div>
        <BarList
          title="Interações com as edições"
          caption="eventos de email"
          items={interactions}
          accent="navy"
          max={5}
        />
      </Section>

      <Section
        num="02"
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

      <Section
        num="03"
        eyebrow="Conteúdo enviado"
        title="Posts *que saíram*."
        subtitle="Eventos relacionados a posts (sent / updated / scheduled). Não tem email associado — vão direto pro Supabase, sem passar pelo RD."
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Posts enviados" value={fmtNum(s.posts.sent)} accent="amber" hint="post.sent" />
          <KPI label="Posts agendados" value={fmtNum(s.posts.scheduled)} accent="ink" hint="post.scheduled" />
          <KPI label="Posts editados" value={fmtNum(s.posts.updated)} accent="ink" hint="post.updated" />
          <KPI
            label="Categorias ativas"
            value={s.events.byCategory.length}
            accent="navy"
            hint={s.events.byCategory.map((c) => c.category).join(" · ")}
          />
        </div>
      </Section>

      <Section
        num="04"
        eyebrow="Atividade ao vivo"
        title="Os *últimos eventos*, sem filtro."
        subtitle="Cada linha é uma transação real entre RD, n8n, Beehiiv e Supabase. Use para auditar e validar o fluxo durante setup."
      >
        <div className="grid grid-cols-1 gap-6">
          <RecentOutbound rows={s.recent.outbound} />
          <RecentEvents rows={s.recent.events} />
        </div>
      </Section>
    </main>
  );
}
