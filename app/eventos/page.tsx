import { getSnapshot } from "@/lib/queries";
import { getEngagement } from "@/lib/analytics";
import { Section } from "@/components/Section";
import { BarList } from "@/components/BarList";
import { SyncDonut } from "@/components/SyncDonut";

export const revalidate = 30;

export default async function Page() {
  const [s, eng] = await Promise.all([getSnapshot(), getEngagement()]);

  const interactions = [
    { label: "email.delivered", value: eng.totals.delivered },
    { label: "email.opened", value: eng.totals.opens },
    { label: "email.clicked", value: eng.totals.clicks },
    { label: "email.bounced", value: eng.totals.bounces },
    { label: "email.unsubscribed", value: eng.totals.unsubscribes }
  ].filter((i) => i.value > 0);

  return (
    <Section
      num="04"
      eyebrow="Distribuição de eventos"
      title="O que está *acontecendo* no Beehiiv."
      subtitle="Eventos de ciclo de vida (inscrições, posts) e interações com as edições (entregas, aberturas, cliques). Útil para detectar picos anormais."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <BarList
          title="Eventos de ciclo de vida"
          caption="subscription / post / survey"
          items={s.events.byType.map((g) => ({ label: g.type, value: g.count }))}
          accent="olive"
        />
        <SyncDonut
          synced={s.events.rdSynced.synced}
          pending={s.events.rdSynced.pending}
          failed={s.events.rdSynced.failed}
        />
      </div>
      <BarList
        title="Interações com as edições"
        caption="eventos de email"
        items={interactions}
        accent="navy"
        max={5}
      />
    </Section>
  );
}
