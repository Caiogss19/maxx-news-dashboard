import { getLeads, getLeadJourney } from "@/lib/analytics";
import { Section } from "@/components/Section";
import { LeadSearch } from "@/components/LeadSearch";
import { LeadsTable } from "@/components/LeadsTable";
import { LeadJourneyView } from "@/components/LeadJourneyView";

export const revalidate = 30;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ email?: string; q?: string }>;
}) {
  const sp = await searchParams;

  if (sp.email) {
    const journey = await getLeadJourney(sp.email);
    return (
      <Section
        num="10"
        eyebrow="Trajeto do lead"
        title="A *jornada* completa, lead a lead."
        subtitle="Do primeiro contato até a última interação: por onde entrou, o que confirmou, quais edições recebeu, abriu e clicou."
      >
        <LeadJourneyView email={sp.email} journey={journey} />
      </Section>
    );
  }

  const q = (sp.q ?? "").toLowerCase().trim();
  const all = await getLeads();
  const filtered = q ? all.filter((l) => l.email.toLowerCase().includes(q)) : all;
  const leads = [...filtered]
    .sort((a, b) => {
      const at = a.last_engaged_at ? new Date(a.last_engaged_at).getTime() : 0;
      const bt = b.last_engaged_at ? new Date(b.last_engaged_at).getTime() : 0;
      return bt - at || b.total_clicks - a.total_clicks;
    })
    .slice(0, 200);

  return (
    <Section
      num="10"
      eyebrow="Trajeto do lead"
      title="A *jornada* completa, lead a lead."
      subtitle="Busque um inscrito para ver sua linha do tempo, ou explore o diretório ordenado por interação mais recente."
    >
      <div className="mb-6">
        <LeadSearch initial={sp.q ?? ""} />
        {q && (
          <p className="text-xs text-ink-mute mt-2 font-mono">
            {filtered.length} resultado(s) para “{q}”
          </p>
        )}
      </div>
      <LeadsTable leads={leads} />
    </Section>
  );
}
