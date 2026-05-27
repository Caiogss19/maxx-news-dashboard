import { getSnapshot } from "@/lib/queries";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LiveIndicator } from "@/components/LiveIndicator";
import { KPI } from "@/components/KPI";
import { Section } from "@/components/Section";
import { BarList } from "@/components/BarList";
import { Funnel } from "@/components/Funnel";
import { Timeseries } from "@/components/Timeseries";
import { SyncDonut } from "@/components/SyncDonut";
import { RecentEvents } from "@/components/RecentEvents";
import { RecentOutbound } from "@/components/RecentOutbound";
import { fmtNum, fmtPct } from "@/lib/format";

export const revalidate = 30;

export default async function Page() {
  const s = await getSnapshot();

  const funnelSteps = [
    { label: "RD enviou", value: s.outbound.total, sublabel: "leads disparados ao Beehiiv" },
    { label: "Beehiiv aceitou", value: s.outbound.ok, sublabel: "201/200 do Beehiiv" },
    { label: "Subscriber criado", value: s.base.created, sublabel: "subscription.created" },
    { label: "Confirmado", value: s.base.confirmed, sublabel: "double opt-in" }
  ];

  return (
    <main className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10 py-10">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between mb-12 pb-6 border-b border-rule">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-ink text-bg-paper flex items-center justify-center font-serif-italic text-base">
            M
          </div>
          <div>
            <div className="font-mono-tag">Spark Maxx · Growth Ops</div>
            <div className="font-display text-base">Maxx News · Newsletter Dashboard</div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <LiveIndicator />
          <ThemeToggle />
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="font-mono-tag mb-4">
          <span className="accent-line" />
          Relatório operacional · tempo real · Beehiiv ↔ RD Station
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[1.02] mb-6 tracking-tight max-w-4xl">
          {s.base.created > 0 ? (
            <>
              <span className="num-display">{fmtNum(s.base.active)}</span>{" "}
              <em className="font-serif-italic text-ink-mute">subscribers ativos</em>
              <span className="text-ink-mute">.</span>
            </>
          ) : (
            <>
              Aguardando o primeiro <em className="font-serif-italic">evento</em>
              <span className="text-ink-mute">.</span>
            </>
          )}
        </h1>
        <p className="text-ink-mute text-lg leading-relaxed max-w-3xl">
          {s.base.created > 0 ? (
            <>
              {s.base.created} inscrições no histórico · {fmtPct(s.base.confirmRate)} confirmaram opt-in ·
              taxa de churn {fmtPct(s.base.churnRate)} · saldo líquido{" "}
              <span className={s.base.netGrowth >= 0 ? "text-olive" : "text-crimson"}>
                {s.base.netGrowth >= 0 ? "+" : ""}
                {s.base.netGrowth}
              </span>{" "}
              no histórico.
            </>
          ) : (
            <>
              Assim que o primeiro lead for sincronizado entre RD e Beehiiv, este dashboard começa a
              popular automaticamente. Tudo gravado em Supabase, atualizado em tempo real via WebSocket.
            </>
          )}
        </p>
      </section>

      {/* ── KPIs TOPO ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        <KPI
          label="Subscribers ativos"
          value={fmtNum(s.base.active)}
          hint={`${s.base.created} criados · ${s.base.deleted} cancelados`}
          accent="olive"
        />
        <KPI
          label="Taxa de confirmação"
          value={fmtPct(s.base.confirmRate)}
          hint="confirmed / created"
          accent="navy"
        />
        <KPI
          label="Envios RD → Beehiiv"
          value={fmtNum(s.outbound.total)}
          hint={`${fmtPct(s.outbound.rate)} sucesso · ${s.outbound.fail} falhas`}
          accent={s.outbound.fail > 0 ? "amber" : "ink"}
        />
        <KPI
          label="Eventos sync c/ RD"
          value={fmtNum(s.events.rdSynced.synced)}
          hint={`${s.events.rdSynced.failed} falharam · ${s.events.rdSynced.pending} pendentes`}
          accent={s.events.rdSynced.failed > 0 ? "crimson" : "olive"}
        />
      </div>

      {/* ── 01 · FUNIL ─────────────────────────────────────────────────── */}
      <Section
        num="01"
        eyebrow="Funil ponta a ponta"
        title="Do *lead RD* ao subscriber confirmado."
        subtitle="Cada degrau mostra quantos sobreviveram à etapa anterior. Onde a queda for grande, é onde investigamos primeiro."
      >
        <Funnel
          title="Aquisição · RD → Beehiiv → opt-in"
          caption="histórico completo"
          steps={funnelSteps}
          accent="olive"
        />
      </Section>

      {/* ── 02 · CRESCIMENTO ───────────────────────────────────────────── */}
      <Section
        num="02"
        eyebrow="Crescimento da base"
        title="Como a base *se move* no tempo."
        subtitle="Inscrições e cancelamentos por dia. Saldo líquido mostra se a base está crescendo ou contraindo."
      >
        <Timeseries data={s.timeseries.daily} />
      </Section>

      {/* ── 03 · ORIGEM ────────────────────────────────────────────────── */}
      <Section
        num="03"
        eyebrow="Aquisição por canal"
        title="De onde *vêm os inscritos*."
        subtitle="UTMs propagadas pelo Fluxo 1 (RD → Beehiiv). Mostra qual canal e qual campanha estão alimentando a newsletter."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BarList
            title="Por utm_source"
            caption="top 8"
            items={s.utm.bySource.map((g) => ({ label: g.source, value: g.count }))}
            accent="navy"
          />
          <BarList
            title="Por utm_campaign"
            caption="top 8"
            items={s.utm.byCampaign.map((g) => ({ label: g.campaign, value: g.count }))}
            accent="plum"
          />
        </div>
      </Section>

      {/* ── 04 · EVENTOS ───────────────────────────────────────────────── */}
      <Section
        num="04"
        eyebrow="Distribuição de eventos"
        title="O que está *acontecendo* no Beehiiv."
        subtitle="Todos os 19 tipos de evento são gravados no Supabase. Aqui o top 8 por volume — útil para detectar picos anormais."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BarList
            title="Eventos por tipo"
            caption="top 8"
            items={s.events.byType.map((g) => ({ label: g.type, value: g.count }))}
            accent="olive"
          />
          <SyncDonut
            synced={s.events.rdSynced.synced}
            pending={s.events.rdSynced.pending}
            failed={s.events.rdSynced.failed}
          />
        </div>
      </Section>

      {/* ── 05 · SAÚDE ─────────────────────────────────────────────────── */}
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

      {/* ── 06 · CONTEÚDO ──────────────────────────────────────────────── */}
      <Section
        num="06"
        eyebrow="Conteúdo enviado"
        title="Posts *que saíram*."
        subtitle="Eventos relacionados a posts (sent / updated / scheduled). Não tem email associado — vão direto pro Supabase, sem passar pelo RD."
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Posts enviados" value={fmtNum(s.posts.sent)} accent="amber" hint="post.sent" />
          <KPI
            label="Posts agendados"
            value={fmtNum(s.posts.scheduled)}
            accent="ink"
            hint="post.scheduled"
          />
          <KPI label="Posts editados" value={fmtNum(s.posts.updated)} accent="ink" hint="post.updated" />
          <KPI
            label="Categorias ativas"
            value={s.events.byCategory.length}
            accent="navy"
            hint={s.events.byCategory.map((c) => c.category).join(" · ")}
          />
        </div>
      </Section>

      {/* ── 07 · ATIVIDADE RECENTE ─────────────────────────────────────── */}
      <Section
        num="07"
        eyebrow="Atividade ao vivo"
        title="Os *últimos eventos*, sem filtro."
        subtitle="Cada linha é uma transação real entre RD, n8n, Beehiiv e Supabase. Use para auditar e validar o fluxo durante setup."
      >
        <div className="grid grid-cols-1 gap-6">
          <RecentOutbound rows={s.recent.outbound} />
          <RecentEvents rows={s.recent.events} />
        </div>
      </Section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="mt-20 pt-8 border-t border-rule">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-ink-mute">
          <div>
            <div className="font-mono-tag mb-2">Stack</div>
            <p>n8n · Supabase · Beehiiv · RD Station · Pipedrive</p>
          </div>
          <div>
            <div className="font-mono-tag mb-2">Refresh</div>
            <p>Server: a cada 30s. Live: WebSocket Supabase Realtime (instantâneo).</p>
          </div>
          <div>
            <div className="font-mono-tag mb-2">Fontes</div>
            <p>
              <code className="font-mono text-xs">beehiiv_events</code> ·{" "}
              <code className="font-mono text-xs">beehiiv_sync_outbound</code>
            </p>
          </div>
        </div>
        <div className="mt-8 text-xs text-ink-faint font-mono uppercase tracking-wider">
          Spark Maxx · Growth Ops · v0.1
        </div>
      </footer>
    </main>
  );
}
