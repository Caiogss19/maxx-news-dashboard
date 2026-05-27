import { getSnapshot } from "@/lib/queries";
import { Section } from "@/components/Section";
import { Funnel } from "@/components/Funnel";

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
  );
}
