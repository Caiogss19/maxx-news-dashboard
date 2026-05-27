import { getSnapshot } from "@/lib/queries";
import { Section } from "@/components/Section";
import { RecentEvents } from "@/components/RecentEvents";
import { RecentOutbound } from "@/components/RecentOutbound";

export const revalidate = 30;

export default async function Page() {
  const s = await getSnapshot();

  return (
    <Section
      num="07"
      eyebrow="Atividade ao vivo"
      title="Os *últimos eventos*, sem filtro."
      subtitle="Cada linha é uma transação real entre RD, n8n, Beehiiv e Supabase. Use para auditar e validar o fluxo durante setup."
    >
      <div className="grid grid-cols-1 gap-6">
        <RecentOutbound rows={s.recent.outbound} />
        <RecentEvents rows={s.recent.events} />
      </div>
    </Section>
  );
}
