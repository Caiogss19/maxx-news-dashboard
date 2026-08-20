import { getSnapshot } from "@/lib/queries";
import { getEngagement } from "@/lib/analytics";
import { getAquisicao } from "@/lib/aquisicao";
import { Section } from "@/components/Section";
import { Funnel } from "@/components/Funnel";
import { Timeseries } from "@/components/Timeseries";
import { BarList } from "@/components/BarList";
import { KPI } from "@/components/KPI";
import { RankTable } from "@/components/RankTable";
import { MaxxnewsLeads } from "@/components/MaxxnewsLeads";
import { fmtNum, fmtPct, fmtDate } from "@/lib/format";

export const revalidate = 259200; // 3 dias — casado com o job de sync

const semDominio = (url: string | null) =>
  url ? url.replace(/^https?:\/\/[^/]+/, "") || "/" : "—";

export default async function Page() {
  const [s, eng, aq] = await Promise.all([getSnapshot(), getEngagement(), getAquisicao()]);

  const baseTotal = aq.importado.total + aq.vivo.total;
  const importShare = baseTotal > 0 ? (aq.importado.total / baseTotal) * 100 : 0;
  const pctPago = aq.resumo.registros > 0 ? (aq.resumo.pagos / aq.resumo.registros) * 100 : 0;
  const topCampanha = aq.campanhas[0];
  const totalCampanhas = aq.campanhas.reduce((a, c) => a + c.leads, 0);
  const share = (n: number) => (totalCampanhas > 0 ? (n / totalCampanhas) * 100 : 0);

  const funnelSteps = [
    s.outbound.total > 0
      ? { label: "RD enviou", value: s.outbound.total, sublabel: "leads disparados ao Beehiiv" }
      : { label: "Base atual", value: s.base.active, sublabel: "subscribers ativos no Beehiiv" },
    { label: "Subscriber criado", value: s.base.created, sublabel: "subscription.created" },
    { label: "Confirmado", value: s.base.confirmed, sublabel: "double opt-in" },
    { label: eng.funnel.isEstimated ? "Abre em média" : "Abriu a news", value: eng.funnel.openers, sublabel: eng.funnel.isEstimated ? "média por edição" : "abriu ≥ 1 edição" },
    { label: eng.funnel.isEstimated ? "Clica em média" : "Clicou", value: eng.funnel.clickers, sublabel: eng.funnel.isEstimated ? "média por edição" : "clicou ≥ 1 edição" }
  ];

  return (
    <main>
      <Section
        num="01"
        eyebrow="Funil ponta a ponta"
        title="Do *lead RD* ao leitor engajado."
        subtitle="O ciclo de vida inteiro: cada degrau mostra quantos sobreviveram à etapa anterior — da aquisição no RD até abrir e clicar na newsletter."
      >
        <Funnel
          title="Trajeto completo · RD → opt-in → engajamento"
          caption="histórico completo"
          steps={funnelSteps}
          accent="olive"
        />
      </Section>

      <Section
        num="02"
        eyebrow="Crescimento da base"
        title="Como a base *se move* no tempo."
        subtitle="Inscrições e cancelamentos por dia. Saldo líquido mostra se a base está crescendo ou contraindo."
      >
        <Timeseries data={s.timeseries.daily} />
      </Section>

      <Section
        num="03"
        eyebrow="Aquisição real"
        title="O que é *base migrada* e o que é aquisição."
        subtitle="A régua não é o utm_source: a migração trouxe rótulos de origem herdados da plataforma antiga, espalhados por vários canais. A régua é a data de entrada. Tudo que chegou depois do import vem pela passagem RD → Beehiiv, e a campanha que originou cada inscrição é lida da URL da página de captura."
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPI
            label="Import inicial"
            value={fmtNum(aq.importado.total)}
            accent="amber"
            hint={`migração inicial · ${fmtPct(importShare)} da base`}
          />
          <KPI
            label="Aquisição desde então"
            value={fmtNum(aq.vivo.total)}
            accent="olive"
            hint="100% pela passagem RD → Beehiiv"
          />
          {/* Nome de campanha não cabe como valor de KPI (38px estoura o card):
              o número é o valor, o nome vai no hint. */}
          <KPI
            label="Top campanha"
            value={topCampanha ? fmtNum(topCampanha.leads) : "—"}
            accent="plum"
            hint={
              topCampanha
                ? `${topCampanha.campanha} · ${fmtPct(share(topCampanha.leads))} das inscrições`
                : undefined
            }
          />
          <KPI
            label="Mídia paga"
            value={aq.temCampanha ? fmtPct(pctPago) : "—"}
            accent="navy"
            hint={
              aq.temCampanha
                ? `${aq.resumo.pagos} de ${aq.resumo.registros} · ${aq.resumo.organicos} orgânicas, ${aq.resumo.diretos} diretas`
                : undefined
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <RankTable
            title="Por campanha real"
            caption={`${aq.campanhas.length} combinações · via query string da captura`}
            rows={aq.campanhas}
            empty="Base Leads indisponível — confira SUPABASE_LEADS_URL."
            columns={[
              { header: "Fonte", render: (r) => <b style={{ fontWeight: 600 }}>{r.fonte}</b> },
              {
                header: "Meio",
                render: (r) => <span className="font-mono text-xs text-ink-mute">{r.meio}</span>
              },
              {
                header: "Campanha",
                render: (r) => <span className="font-mono text-xs">{r.campanha}</span>
              },
              { header: "Leads", num: true, render: (r) => fmtNum(r.leads) },
              {
                header: "Participação",
                render: (r) => (
                  <div className="flex items-center gap-2" style={{ minWidth: 130 }}>
                    <div className="bar-track" style={{ flex: 1 }}>
                      <div
                        className="bar-fill"
                        style={{ width: `${share(r.leads)}%`, background: "var(--navy)" }}
                      />
                    </div>
                    <span className="font-mono text-xs text-ink-faint w-12 text-right">
                      {fmtPct(share(r.leads))}
                    </span>
                  </div>
                )
              },
              {
                header: "Período",
                render: (r) => (
                  <span className="font-mono text-xs text-ink-mute whitespace-nowrap">
                    {fmtDate(r.de)} – {fmtDate(r.ate)}
                  </span>
                )
              }
            ]}
            footnote="As colunas utm_source / utm_medium / utm_campaign de leads_framer vêm nulas nesses registros — a origem só existe dentro da query string de page_url. Quem filtrar a tabela pelas colunas de UTM conclui que a Maxx News não tem origem nenhuma."
          />

          <RankTable
            title="Páginas onde o formulário foi preenchido"
            caption={`${aq.resumo.viaLp} pela LP dedicada · ${aq.resumo.viaSite} pelo widget do site`}
            rows={aq.paginas}
            empty="Base Leads indisponível."
            columns={[
              {
                header: "URL de captura",
                render: (r) => (
                  <span className="font-mono text-xs" style={{ wordBreak: "break-all" }}>
                    {r.pagina}
                  </span>
                )
              },
              { header: "Formulário", render: (r) => <span className="pill">{r.form}</span> },
              { header: "Leads", num: true, render: (r) => fmtNum(r.leads) }
            ]}
          />

          <MaxxnewsLeads leads={aq.leads} />
        </div>
      </Section>

      <Section
        num="04"
        eyebrow="Retorno da newsletter"
        title="O que a news *devolveu*."
        subtitle="A leitura inversa: quem clicou num link da newsletter e converteu em outra landing page. Identificado pelo parâmetro _bhlid do Beehiiv ou por utm_source de newsletter na URL de destino."
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPI
            label="Leads devolvidos"
            value={fmtNum(aq.devolveu.length)}
            accent={aq.devolveu.length > 0 ? "olive" : "ink"}
            hint="clicaram na news e converteram em outra LP"
          />
        </div>

        <RankTable
          title="Quem a newsletter trouxe para outras LPs"
          caption="via _bhlid ou utm_source de newsletter"
          rows={aq.devolveu}
          empty="Nenhuma conversão rastreada vinda da newsletter."
          columns={[
            {
              header: "Data",
              render: (r) => (
                <span className="font-mono text-xs whitespace-nowrap">{fmtDate(r.criado_em)}</span>
              )
            },
            {
              header: "E-mail",
              render: (r) => (
                <span className="font-mono text-xs" style={{ wordBreak: "break-all" }}>
                  {r.email}
                </span>
              )
            },
            { header: "Converteu em", render: (r) => r.converteu_em },
            {
              header: "Página",
              render: (r) => (
                <span className="font-mono text-xs text-ink-mute">{semDominio(r.pagina)}</span>
              )
            },
            {
              header: "Sinal de origem",
              render: (r) => <span className="font-mono text-xs text-ink-faint">{r.sinal}</span>
            }
          ]}
        />
      </Section>

      <Section
        num="05"
        eyebrow="Composição do import"
        title="O que a *base migrada* trouxe como rótulo."
        subtitle="Retrato do que entrou na migração inicial, não performance atual. Estes utm_source vieram colados nos contatos da plataforma anterior — nenhum destes canais trouxe inscrito novo desde então."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BarList
            title="Por utm_source"
            caption="histórico migrado"
            items={aq.importado.bySource.map((g) => ({ label: g.source, value: g.count }))}
            accent="amber"
          />
          <BarList
            title="Por utm_campaign"
            caption="histórico migrado"
            items={aq.importado.byCampaign.map((g) => ({ label: g.campaign, value: g.count }))}
            accent="amber"
          />
        </div>
      </Section>
    </main>
  );
}
