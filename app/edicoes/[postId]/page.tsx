import Link from "next/link";
import { getEdition } from "@/lib/analytics";
import { KPI } from "@/components/KPI";
import { Funnel } from "@/components/Funnel";
import { BarList } from "@/components/BarList";
import { fmtNum, fmtPct, fmtDateTime, truncate } from "@/lib/format";

export const revalidate = 30;

export default async function Page({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const { edition, topLinks, engagedLeads } = await getEdition(postId);

  if (!edition) {
    return (
      <main className="py-16">
        <div className="paper p-10 text-center">
          <p className="text-ink-mute">Edição não encontrada.</p>
          <Link href="/edicoes" className="inline-block mt-4 text-sm font-mono uppercase tracking-wider hover:underline">
            ← Voltar às edições
          </Link>
        </div>
      </main>
    );
  }

  const funnelSteps = [
    { label: "Entregues", value: edition.delivered, sublabel: "email.delivered" },
    { label: "Abriram", value: edition.unique_opens, sublabel: "leitores únicos" },
    { label: "Clicaram", value: edition.unique_clicks, sublabel: "cliques únicos" }
  ];

  return (
    <main className="py-12">
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-mono-tag">
          <span className="accent-line" />
          Edição {edition.edition_number} · {fmtDateTime(edition.sent_at)}
        </div>
        <Link href="/edicoes" className="text-sm font-mono uppercase tracking-wider text-ink-mute hover:text-ink">
          ← Edições
        </Link>
      </div>
      <h1 className="font-display text-3xl md:text-4xl leading-tight mb-2 max-w-3xl">{edition.title}</h1>
      {edition.subject && <p className="text-ink-mute mb-8">Assunto: {edition.subject}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPI label="Entregues" value={fmtNum(edition.delivered)} accent="navy" hint={`${edition.bounces} bounces`} />
        <KPI label="Taxa de abertura" value={fmtPct(edition.open_rate)} accent="olive" hint={`${fmtNum(edition.unique_opens)} leitores`} />
        <KPI label="CTR" value={fmtPct(edition.ctr)} accent="amber" hint={`CTOR ${fmtPct(edition.ctor)}`} />
        <KPI label="Descadastros" value={fmtNum(edition.unsubscribes)} accent={edition.unsubscribes > 0 ? "crimson" : "ink"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Funnel title="Funil de engajamento" caption="desta edição" steps={funnelSteps} accent="olive" />
        <BarList
          title="Links mais clicados"
          caption="top 6"
          items={topLinks.map((l) => ({ label: l.url.replace(/^https?:\/\//, ""), value: l.clicks }))}
          accent="amber"
          max={6}
        />
      </div>

      <div className="paper overflow-hidden">
        <div className="flex items-baseline justify-between p-6 pb-4">
          <h3 className="font-display text-xl">Leads engajados</h3>
          <span className="font-mono-tag">top {engagedLeads.length}</span>
        </div>
        {engagedLeads.length === 0 ? (
          <p className="text-ink-faint text-sm py-10 text-center">Ninguém engajou ainda.</p>
        ) : (
          <table className="editorial">
            <thead>
              <tr>
                <th>Email</th>
                <th>Abriu em</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {engagedLeads.map((l) => (
                <tr key={l.email}>
                  <td className="text-sm">
                    <Link href={`/leads?email=${encodeURIComponent(l.email)}`} className="hover:underline">
                      {truncate(l.email, 34)}
                    </Link>
                  </td>
                  <td className="text-xs text-ink-mute whitespace-nowrap">{l.openedAt ? fmtDateTime(l.openedAt) : "—"}</td>
                  <td>
                    {l.clicked ? (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-soft text-amber">clicou</span>
                    ) : (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-olive-soft text-olive">abriu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
