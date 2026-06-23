import { getSnapshot } from "@/lib/queries";
import { getEngagement } from "@/lib/analytics";
import { KPI } from "@/components/KPI";
import { fmtNum, fmtPct } from "@/lib/format";

export const revalidate = 30;

export default async function Page() {
  const [s, eng] = await Promise.all([getSnapshot(), getEngagement()]);

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
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

      {/* ── KPIs · BASE ──────────────────────────────────────────────── */}
      <div className="font-mono-tag mb-4">Base &amp; aquisição</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
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

      {/* ── KPIs · ENGAJAMENTO ───────────────────────────────────────── */}
      <div className="font-mono-tag mb-4">Engajamento da newsletter</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KPI label="Edições enviadas" value={fmtNum(eng.totals.editions)} accent="ink" hint={`${fmtNum(eng.totals.delivered)} entregas totais`} />
        <KPI label="Abertura média" value={fmtPct(eng.totals.avgOpenRate)} accent="olive" hint={`${fmtNum(eng.totals.opens)} aberturas`} />
        <KPI label="CTOR médio" value={fmtPct(eng.totals.avgCtr)} accent="amber" hint={`${fmtNum(eng.totals.clicks)} cliques`} />
        <KPI
          label={eng.funnel.isEstimated ? "Leitores únicos (média)" : "Leads engajados"}
          value={fmtNum(eng.funnel.openers)}
          accent="plum"
          hint={
            eng.funnel.isEstimated
              ? `${fmtNum(eng.funnel.clickers)} clicadores · média por edição (per-lead vai chegar via webhook)`
              : `${fmtNum(eng.funnel.clickers)} clicaram alguma edição`
          }
        />
      </div>

      {/* ── KPIs · OPERAÇÃO ──────────────────────────────────────────── */}
      <div className="font-mono-tag mb-4">Sinal de saúde</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI
          label="Posts publicados"
          value={fmtNum(s.posts.sent)}
          accent="navy"
          hint={`${s.posts.scheduled} agendados`}
        />
        <KPI
          label="Eventos totais"
          value={fmtNum(s.events.byType.reduce((a, t) => a + t.count, 0))}
          accent="ink"
          hint={`${s.events.byCategory.length} categorias ativas`}
        />
        <KPI
          label="Total de descadastros"
          value={fmtNum(s.base.deleted + eng.totals.unsubscribes)}
          accent={(s.base.deleted + eng.totals.unsubscribes) > 0 ? "amber" : "ink"}
          hint={`${s.base.deleted} via subscription · ${eng.totals.unsubscribes} via edições`}
        />
        <KPI
          label="Top origem"
          value={s.utm.bySource[0]?.source ?? "—"}
          accent="plum"
          hint={s.utm.bySource[0] ? `${fmtNum(s.utm.bySource[0].count)} subscribers` : undefined}
        />
      </div>
    </main>
  );
}
