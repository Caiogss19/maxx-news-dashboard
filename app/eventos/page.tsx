import { getSnapshot } from "@/lib/queries";
import { Section } from "@/components/Section";
import { BarList } from "@/components/BarList";
import { SyncDonut } from "@/components/SyncDonut";

export const revalidate = 30;

export default async function Page() {
  const s = await getSnapshot();

  return (
    <Section
      num="04"
      eyebrow="Distribuição de eventos"
      title="O que está *acontecendo* no Beehiiv."
      subtitle="Todos os 19 tipos de evento são gravados no Supabase. Aqui o top 8 por volume — útil para detectar picos anormais."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BarList
          title="Eventos por tipo"
          caption="top 8"
          items={s.events.byType.map((g) => ({ label: g.type, value: g.count }))}
          accent="olive"
        />
        <SyncDonut
          synced={s.events.rdSynced.synced}
          pending={s.events.rdSynced.pending}
          failed={s.events.rdSynced.failed}
        />
      </div>
    </Section>
  );
}
