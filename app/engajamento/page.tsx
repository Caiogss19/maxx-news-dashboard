import Link from "next/link";
import { getEngagement } from "@/lib/analytics";
import { Section } from "@/components/Section";
import { KPI } from "@/components/KPI";
import { Funnel } from "@/components/Funnel";
import { BarList } from "@/components/BarList";
import { EngagementArea } from "@/components/EngagementArea";
import { HourBars } from "@/components/HourBars";
import { fmtNum, fmtPct } from "@/lib/format";

export const revalidate = 30;

export default async function Page() {
  const e = await getEngagement();

  const funnelSteps = [
    { label: "Receberam", value: e.funnel.received, sublabel: "ao menos 1 edição" },
    { label: "Abriram", value: e.funnel.openers, sublabel: "ao menos 1 abertura" },
    { label: "Clicaram", value: e.funnel.clickers, sublabel: "ao menos 1 clique" }
  ];

  return (
    <Section
      num="09"
      eyebrow="Engajamento da base"
      title="O que os leads *fazem* com a news."
      subtitle="Aberturas, cliques, melhores horários e os leads mais engajados. A leitura agregada de todas as interações com as edições."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Entregas" value={fmtNum(e.totals.delivered)} accent="navy" hint={`${e.totals.bounces} bounces`} />
        <KPI label="Aberturas" value={fmtNum(e.totals.opens)} accent="olive" hint={`abertura média ${fmtPct(e.totals.avgOpenRate)}`} />
        <KPI label="Cliques" value={fmtNum(e.totals.clicks)} accent="amber" hint={`CTR médio ${fmtPct(e.totals.avgCtr)}`} />
        <KPI
          label="Descadastros"
          value={fmtNum(e.totals.unsubscribes)}
          accent={e.totals.unsubscribes > 0 ? "crimson" : "ink"}
          hint="via edições"
        />
      </div>

      <div className="mb-4">
        <EngagementArea data={e.daily} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Funnel title="Funil de engajamento" caption="leads únicos" steps={funnelSteps} accent="olive" />
        <HourBars data={e.byHour} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <BarList
          title="Distribuição de engajamento"
          caption="leads por nº de edições abertas"
          items={e.distribution}
          accent="navy"
          max={4}
        />
        <BarList
          title="Links mais clicados"
          caption="todas as edições"
          items={e.topLinks.map((l) => ({ label: l.url.replace(/^https?:\/\//, ""), value: l.clicks }))}
          accent="amber"
          max={6}
        />
      </div>

      <div className="paper overflow-hidden">
        <div className="flex items-baseline justify-between p-6 pb-4">
          <h3 className="font-display text-xl">Leads mais engajados</h3>
          <span className="font-mono-tag">top {e.topLeads.length}</span>
        </div>
        {e.topLeads.length === 0 ? (
          <p className="text-ink-faint text-sm py-10 text-center">Sem dados de engajamento.</p>
        ) : (
          <table className="editorial">
            <thead>
              <tr>
                <th>Email</th>
                <th>Origem</th>
                <th>Aberturas</th>
                <th>Cliques</th>
                <th>Abertura</th>
              </tr>
            </thead>
            <tbody>
              {e.topLeads.map((l) => (
                <tr key={l.email}>
                  <td className="text-sm">
                    <Link href={`/leads?email=${encodeURIComponent(l.email)}`} className="hover:underline">
                      {l.email}
                    </Link>
                  </td>
                  <td className="text-xs text-ink-mute">{l.utm_source || "—"}</td>
                  <td className="font-mono text-sm">{l.total_opens}</td>
                  <td className="font-mono text-sm">{l.total_clicks}</td>
                  <td className="font-mono text-xs text-ink-mute">{fmtPct(l.open_rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Section>
  );
}
