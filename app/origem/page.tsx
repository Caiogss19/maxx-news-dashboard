import { getSnapshot } from "@/lib/queries";
import { Section } from "@/components/Section";
import { BarList } from "@/components/BarList";

export const revalidate = 30;

export default async function Page() {
  const s = await getSnapshot();

  return (
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
  );
}
