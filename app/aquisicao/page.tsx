import { getSnapshot } from "@/lib/queries";
import { getEngagement } from "@/lib/analytics";
import { Section } from "@/components/Section";
import { Funnel } from "@/components/Funnel";
import { Timeseries } from "@/components/Timeseries";
import { BarList } from "@/components/BarList";
import { KPI } from "@/components/KPI";
import { fmtNum, fmtPct } from "@/lib/format";

export const revalidate = 259200; // 3 dias — casado com o job de sync

export default async function Page() {
  const [s, eng] = await Promise.all([getSnapshot(), getEngagement()]);

  const totalUtm = s.utm.bySource.reduce((a, g) => a + g.count, 0);
  const directShare = totalUtm > 0
    ? Math.round((s.utm.bySource.find((g) => g.source === "direct")?.count ?? 0) / totalUtm * 1000) / 10
    : 0;
  const organicSources = s.utm.bySource.filter((g) => g.source !== "direct");
  const organicCount = organicSources.reduce((a, g) => a + g.count, 0);

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
        eyebrow="Aquisição por canal"
        title="De onde *vêm os inscritos*."
        subtitle="UTMs propagadas no momento do opt-in. Mostra qual canal e qual campanha estão alimentando a newsletter."
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPI
            label="Total da base"
            value={fmtNum(totalUtm)}
            accent="ink"
            hint="subscribers com origem rastreada"
          />
          <KPI
            label="Import direto"
            value={fmtPct(directShare)}
            accent="amber"
            hint="vieram de migração inicial sem source"
          />
          <KPI
            label="Aquisição orgânica"
            value={fmtNum(organicCount)}
            accent="olive"
            hint={`via ${organicSources.length} canais distintos`}
          />
          <KPI
            label="Top canal orgânico"
            value={organicSources[0]?.source ?? "—"}
            accent="plum"
            hint={organicSources[0] ? `${fmtNum(organicSources[0].count)} subscribers` : undefined}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BarList
            title="Por utm_source"
            caption="top 10"
            items={s.utm.bySource.map((g) => ({ label: g.source, value: g.count }))}
            accent="navy"
          />
          <BarList
            title="Por utm_campaign"
            caption="top 10"
            items={s.utm.byCampaign.map((g) => ({ label: g.campaign, value: g.count }))}
            accent="plum"
          />
        </div>
      </Section>
    </main>
  );
}
