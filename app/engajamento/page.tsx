import Link from "next/link";
import { getEngagement } from "@/lib/analytics";
import { getRankings } from "@/lib/rankings";
import { Section } from "@/components/Section";
import { KPIRow } from "@/components/KPI";
import { BarList } from "@/components/BarList";
import { HourBars } from "@/components/HourBars";
import { RankTable, Who } from "@/components/RankTable";
import { EditionDots } from "@/components/EditionDots";
import { fmtNum, fmtPct, fmtDate, relativeTime } from "@/lib/format";

export const revalidate = 259200; // 3 dias — casado com o job de sync

function latencia(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}min`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export default async function Page() {
  const [e, r] = await Promise.all([getEngagement(), getRankings()]);

  const totalEd = r.totals.edicoes || 8;
  const cliquesBot = r.totals.cliquesBrutos - r.totals.cliquesHumanos;
  const pctBot =
    r.totals.cliquesBrutos > 0
      ? Math.round((cliquesBot / r.totals.cliquesBrutos) * 1000) / 10
      : 0;

  return (
    <Section
      num="04"
      eyebrow="Engajamento da base"
      title="Quem *realmente* lê a Maxx News."
      subtitle="Ranking de leitores, empresas e edições por engajamento — já descontada a varredura automática de e-mail corporativo, que responde pela maior parte dos cliques registrados."
    >
      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <KPIRow
          items={[
            {
              label: "Entregas",
              value: fmtNum(e.totals.delivered),
              foot: `${e.totals.bounces} bounces`,
              accent: "navy"
            },
            {
              label: "Abertura média",
              value: fmtPct(e.totals.avgOpenRate),
              foot: `${fmtNum(e.totals.opens)} aberturas no total`,
              accent: "olive"
            },
            {
              label: "Cliques de pessoas",
              value: fmtNum(r.totals.cliquesHumanos),
              foot: `de ${fmtNum(r.totals.cliquesBrutos)} registrados · ${fmtPct(r.totals.pctHumano)}`,
              accent: "crimson"
            },
            {
              label: "Descadastros",
              value: fmtNum(e.totals.unsubscribes),
              foot: "via edições",
              accent: e.totals.unsubscribes > 0 ? "danger" : "ink"
            }
          ]}
        />
      </div>

      {/* ── Achado: viés de scanner ──────────────────────────────────────── */}
      {cliquesBot > 0 && (
        <div
          className="paper p-5 mb-4"
          style={{ borderLeft: "3px solid var(--accent)" }}
        >
          <h2 className="font-display mb-2.5" style={{ fontSize: 17, fontWeight: 600 }}>
            {pctBot.toFixed(0)}% dos cliques não são de pessoas
          </h2>
          <p className="text-sm text-ink-mute leading-relaxed" style={{ maxWidth: "68ch" }}>
            {r.bots.filter((b) => b.motivo === "scanner").length} contas somam{" "}
            <span className="text-ink">{fmtNum(cliquesBot)}</span> dos{" "}
            {fmtNum(r.totals.cliquesBrutos)} cliques. Nelas o total de cliques é
            praticamente igual ao de aberturas e o disparo acontece em minutos após o
            envio — comportamento de filtro de segurança corporativo, que abre a mensagem
            e visita cada link para checar ameaças. A leitura humana real está nos
            rankings abaixo, que excluem essas contas e os endereços internos da Spark.
          </p>
        </div>
      )}

      {/* ── Ranking de edições ───────────────────────────────────────────── */}
      <div className="mb-4">
        <RankTable
          title="Ranking de edições"
          caption={`${r.edicoes.length} edições · ordenado por abertura`}
          rows={r.edicoes}
          columns={[
            {
              header: "Edição",
              render: (ed) => (
                <Link
                  href={`/edicoes/${ed.postId}`}
                  className="hover:underline"
                  title={ed.title}
                >
                  #{ed.editionNumber}
                </Link>
              )
            },
            {
              header: "Enviada",
              render: (ed) => (
                <span className="text-xs text-ink-mute">{fmtDate(ed.sentAt)}</span>
              )
            },
            {
              header: "Abertura",
              num: true,
              render: (ed) => (
                <span className="flex items-center justify-end gap-2">
                  <span className="bar-track" style={{ width: 56 }}>
                    <span
                      className="bar-fill block"
                      style={{
                        width: `${Math.min(100, ed.openRate * 2.5)}%`,
                        background: "var(--olive)"
                      }}
                    />
                  </span>
                  {fmtPct(ed.openRate)}
                </span>
              )
            },
            { header: "CTR bruto", num: true, render: (ed) => fmtPct(ed.ctr) },
            {
              header: "Cliques de pessoas",
              num: true,
              render: (ed) => (
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {ed.cliquesHumanos}
                </span>
              )
            }
          ]}
          footnote={
            <>
              O CTR bruto e o clique humano contam histórias diferentes: a{" "}
              <span className="text-ink">#6</span> tem a maior taxa de abertura da série e
              o pior engajamento real. Assunto que abre bem não é conteúdo que converte em
              clique.
            </>
          }
        />
      </div>

      {/* ── Origem × engajamento ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <BarList
          title="Origem que traz leitor engajado"
          caption="% da origem que já clicou"
          items={r.origens
            .filter((o) => o.leads >= 3)
            .map((o) => ({
              label: o.origem,
              value: o.pctClicou,
              hint: `${o.leadsQueClicaram}/${o.leads}`
            }))}
          accent="navy"
          unit="%"
          max={8}
        />
        <BarList
          title="Links mais clicados"
          caption="todas as edições"
          items={e.topLinks.map((l) => ({
            label: l.url.replace(/^https?:\/\//, ""),
            value: l.clicks
          }))}
          accent="amber"
          max={8}
        />
      </div>

      {/* ── Ranking de leads ─────────────────────────────────────────────── */}
      <div className="mb-4">
        <RankTable
          title="Ranking de leitores"
          caption="recorrência primeiro · volume no desempate"
          rows={r.leads.slice(0, 15)}
          columns={[
            { header: "Contato", render: (l) => <Who email={l.email} /> },
            {
              header: "Empresa",
              render: (l) => <span className="text-ink-mute text-xs">{l.dominio}</span>
            },
            {
              header: "Edições clicadas",
              render: (l) => (
                <EditionDots filled={l.edicoesClicadas} total={totalEd} />
              )
            },
            { header: "Cliques", num: true, render: (l) => l.cliques },
            { header: "Aberturas", num: true, render: (l) => l.aberturas },
            {
              header: "Último",
              num: true,
              render: (l) => (
                <span className="text-xs text-ink-mute">
                  {relativeTime(l.ultimoEngajamento)}
                </span>
              )
            }
          ]}
          footnote="Ordenado por número de edições em que a pessoa clicou: um clique isolado pode ser curiosidade, oito são hábito."
        />
      </div>

      {/* ── Empresas ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <RankTable
          title="Ranking de empresas"
          caption="agrupado por domínio"
          rows={r.empresas.slice(0, 10)}
          columns={[
            {
              header: "Empresa",
              render: (c) => (
                <div>
                  <div>{c.dominio}</div>
                  {c.contatos > 1 && (
                    <div className="text-xs text-ink-faint">{c.contatos} contatos</div>
                  )}
                </div>
              )
            },
            {
              header: "Edições",
              render: (c) => <EditionDots filled={c.edicoesComClique} total={totalEd} />
            },
            { header: "Cliques", num: true, render: (c) => c.cliques }
          ]}
        />

        <div className="space-y-4">
          <BarList
            title="Horário de disparo × abertura"
            caption="média por faixa (BRT)"
            items={r.horaDisparo.map((h) => ({
              label: h.faixa,
              value: h.aberturaMedia,
              hint: `${h.edicoes} ed.`
            }))}
            accent="olive"
            unit="%"
            max={6}
          />
          <HourBars
            data={r.horaEngajamento.map((h) => ({
              hour: h.hour,
              opens: h.engajamentos,
              clicks: h.cliques
            }))}
          />
        </div>
      </div>

      {/* ── Contas automatizadas ─────────────────────────────────────────── */}
      <RankTable
        title="Contas excluídas dos rankings"
        caption={`${r.bots.length} contas`}
        rows={r.bots}
        columns={[
          { header: "Conta", render: (b) => <Who email={b.email} /> },
          {
            header: "Motivo",
            render: (b) => (
              <span className={b.motivo === "interno" ? "pill" : "pill pill-on"}>
                {b.motivo}
              </span>
            )
          },
          { header: "Cliques", num: true, render: (b) => b.cliques },
          { header: "Aberturas", num: true, render: (b) => b.aberturas },
          {
            header: "Cliques/aberturas",
            num: true,
            render: (b) => b.razao.toFixed(2).replace(".", ",")
          },
          {
            header: "Reage em",
            num: true,
            render: (b) => (
              <span className="text-ink-mute text-xs">{latencia(b.latenciaMedianaS)}</span>
            )
          }
        ]}
        footnote="A pessoa por trás do endereço pode ser um leitor real — o filtro corporativo apenas torna os números dela inúteis para medir interesse. Para avaliar essas contas, use resposta direta ou presença em evento, não clique."
      />
    </Section>
  );
}
