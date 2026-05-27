import { getSnapshot } from "@/lib/queries";
import { getEngagement } from "@/lib/analytics";
import { Section } from "@/components/Section";
import { Funnel } from "@/components/Funnel";

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
    <Section
      num="01"
      eyebrow="Funil ponta a ponta"
      title="Do *lead RD* ao leitor engajado."
      subtitle="O ciclo de vida inteiro: cada degrau mostra quantos sobreviveram à etapa anterior — da aquisição no RD até abrir e clicar na newsletter. Onde a queda for grande, é onde investigamos primeiro."
    >
      <Funnel
        title="Trajeto completo · RD → opt-in → engajamento"
        caption="histórico completo"
        steps={funnelSteps}
        accent="olive"
      />
    </Section>
  );
}
