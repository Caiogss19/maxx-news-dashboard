import { getSnapshot } from "@/lib/queries";
import { getEngagement } from "@/lib/analytics";
import { Section } from "@/components/Section";
import { Funnel } from "@/components/Funnel";
import { Timeseries } from "@/components/Timeseries";
import { BarList } from "@/components/BarList";

export const revalidate = 30;

export default async function Page() {
  const [s, eng] = await Promise.all([getSnapshot(), getEngagement()]);

  const funnelSteps = [
    { label: "RD enviou", value: s.outbound.total, sublabel: "leads disparados ao Beehiiv" },
    { label: "Beehiiv aceitou", value: s.outbound.ok, sublabel: "201/200 do Beehiiv" },
    { label: "Subscriber criado", value: s.base.created, sublabel: "subscription.created" },
    { label: "Confirmado", value: s.base.confirmed, sublabel: "double opt-in" },
    { label: "Abriu a news", value: eng.funnel.openers, sublabel: "abriu ≥ 1 edição" },
    { label: "Clicou", value: eng.funnel.clickers, sublabel: "clicou ≥ 1 edição" }
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
    </main>
  );
}
