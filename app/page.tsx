import { getSnapshot } from "@/lib/queries";
import { getEngagement } from "@/lib/analytics";
import { KPI } from "@/components/KPI";
import { fmtNum, fmtPct } from "@/lib/format";
import {
  CalendarCheck,
  Compass,
  Eye,
  MailCheck,
  MailOpen,
  MousePointerClick,
  Newspaper,
  RefreshCw,
  Send,
  UserMinus,
  Users,
  Zap
} from "lucide-react";

export const revalidate = 259200; // 3 dias — casado com o job de sync

export default async function Page() {
  const [s, eng] = await Promise.all([getSnapshot(), getEngagement()]);

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="nw-secao" style={{ paddingBottom: "var(--s-8)" }}>
        <div className="spk-cab" style={{ ["--ac" as string]: "var(--crimson)" }}>
          <span className="spk-cab__d" />
          <span className="spk-cab__t">Relatório operacional · tempo real · Beehiiv ↔ RD Station</span>
          <span className="spk-cab__r" />
        </div>
        <h1 className="nw-secao__t">
          {s.base.created > 0 ? (
            <>
              <em>{fmtNum(s.base.active)}</em> subscribers ativos
              <span className="text-ink-mute">.</span>
            </>
          ) : (
            <>
              Aguardando o primeiro <em>evento</em>
              <span className="text-ink-mute">.</span>
            </>
          )}
        </h1>
        <p className="nw-secao__s">
          {s.base.created > 0 ? (
            <>
              {s.base.created} inscrições no histórico · {fmtPct(s.base.confirmRate)} confirmaram opt-in ·
              taxa de churn {fmtPct(s.base.churnRate)} · saldo líquido{" "}
              <span className={s.base.netGrowth >= 0 ? "text-olive" : "text-danger"}>
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
      <Rotulo>Base &amp; aquisição</Rotulo>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KPI
          label="Subscribers ativos" icon={<Users />}
          value={fmtNum(s.base.active)}
          hint={`${s.base.created} criados · ${s.base.deleted} cancelados`}
          accent="olive"
        />
        <KPI
          label="Taxa de confirmação" icon={<MailCheck />}
          value={fmtPct(s.base.confirmRate)}
          hint="confirmed / created"
          accent="navy"
        />
        <KPI
          label="Envios RD → Beehiiv" icon={<Send />}
          value={fmtNum(s.outbound.total)}
          hint={`${fmtPct(s.outbound.rate)} sucesso · ${s.outbound.fail} falhas`}
          accent={s.outbound.fail > 0 ? "amber" : "ink"}
        />
        <KPI
          label="Eventos sync c/ RD" icon={<RefreshCw />}
          value={fmtNum(s.events.rdSynced.synced)}
          hint={`${s.events.rdSynced.failed} falharam · ${s.events.rdSynced.pending} pendentes`}
          accent={s.events.rdSynced.failed > 0 ? "danger" : "olive"}
        />
      </div>

      {/* ── KPIs · ENGAJAMENTO ───────────────────────────────────────── */}
      <Rotulo>Engajamento da newsletter</Rotulo>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KPI label="Edições enviadas" icon={<Newspaper />} value={fmtNum(eng.totals.editions)} accent="ink" hint={`${fmtNum(eng.totals.delivered)} entregas totais`} />
        <KPI label="Abertura média" icon={<MailOpen />} value={fmtPct(eng.totals.avgOpenRate)} accent="olive" hint={`${fmtNum(eng.totals.opens)} aberturas`} />
        <KPI label="CTOR médio" icon={<MousePointerClick />} value={fmtPct(eng.totals.avgCtr)} accent="amber" hint={`${fmtNum(eng.totals.clicks)} cliques`} />
        <KPI
          label={eng.funnel.isEstimated ? "Leitores únicos (média)" : "Leads engajados"}
          icon={<Eye />}
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
      <Rotulo>Sinal de saúde</Rotulo>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Posts publicados" icon={<CalendarCheck />}
          value={fmtNum(s.posts.sent)}
          accent="navy"
          hint={`${s.posts.scheduled} agendados`}
        />
        <KPI
          label="Eventos totais" icon={<Zap />}
          value={fmtNum(s.events.byType.reduce((a, t) => a + t.count, 0))}
          accent="ink"
          hint={`${s.events.byCategory.length} categorias ativas`}
        />
        <KPI
          label="Total de descadastros" icon={<UserMinus />}
          value={fmtNum(s.base.deleted + eng.totals.unsubscribes)}
          accent={(s.base.deleted + eng.totals.unsubscribes) > 0 ? "amber" : "ink"}
          hint={`${s.base.deleted} via subscription · ${eng.totals.unsubscribes} via edições`}
        />
        <KPI
          label="Top origem do import" icon={<Compass />}
          value={s.utm.bySource[0]?.source ?? "—"}
          accent="plum"
          hint={s.utm.bySource[0] ? `${fmtNum(s.utm.bySource[0].count)} da base migrada · não é aquisição atual` : undefined}
        />
      </div>
    </main>
  );
}

/** Rótulo de grupo de KPIs: o `Cabecalho` da Central, com régua. */
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <div className="spk-cab">
      <span className="spk-cab__d" />
      <span className="spk-cab__t">{children}</span>
      <span className="spk-cab__r" />
    </div>
  );
}
