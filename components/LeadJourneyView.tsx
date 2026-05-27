import Link from "next/link";
import type { LeadJourney } from "@/lib/analytics";
import { KPI } from "@/components/KPI";
import { fmtPct, fmtDate, fmtDateTime } from "@/lib/format";

const KIND_COLOR: Record<string, string> = {
  subscription: "var(--navy)",
  survey: "var(--plum)",
  delivered: "var(--ink-faint)",
  opened: "var(--olive)",
  clicked: "var(--amber)",
  unsubscribed: "var(--crimson)",
  bounced: "var(--crimson)"
};

export function LeadJourneyView({ email, journey }: { email: string; journey: LeadJourney }) {
  const { lead, perEdition, timeline } = journey;

  if (!lead) {
    return (
      <div className="paper p-10 text-center">
        <p className="text-ink-mute">
          Nenhum lead encontrado para <span className="font-mono text-ink">{email}</span>.
        </p>
        <Link href="/leads" className="inline-block mt-4 text-sm font-mono uppercase tracking-wider text-ink hover:underline">
          ← Voltar ao diretório
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono-tag mb-1">Jornada do lead</div>
          <div className="font-display text-2xl">{lead.email}</div>
          <div className="text-sm text-ink-mute mt-1">
            {lead.utm_source ? `Origem: ${lead.utm_source}` : "Origem desconhecida"}
            {lead.utm_campaign ? ` · ${lead.utm_campaign}` : ""}
            {lead.tier === "premium" ? " · premium" : ""}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lead.churned ? (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-crimson-soft text-crimson">churn</span>
          ) : lead.confirmed ? (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-olive-soft text-olive">ativo</span>
          ) : (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-soft text-amber">pendente</span>
          )}
          <Link href="/leads" className="text-sm font-mono uppercase tracking-wider text-ink-mute hover:text-ink">
            ← Diretório
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Edições recebidas" value={lead.editions_received} accent="navy" />
        <KPI label="Edições abertas" value={lead.editions_opened} accent="olive" hint={`${fmtPct(lead.open_rate)} de abertura`} />
        <KPI label="Edições com clique" value={lead.editions_clicked} accent="amber" />
        <KPI label="Cliques totais" value={lead.total_clicks} accent="plum" hint={`${lead.total_opens} aberturas no total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edições recebidas */}
        <div className="paper overflow-hidden">
          <div className="flex items-baseline justify-between p-6 pb-4">
            <h3 className="font-display text-xl">Edições recebidas</h3>
            <span className="font-mono-tag">{perEdition.length}</span>
          </div>
          {perEdition.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">Ainda não recebeu edições.</p>
          ) : (
            <table className="editorial">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Edição</th>
                  <th>Enviada</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {perEdition.map((e) => (
                  <tr key={e.edition_number}>
                    <td className="font-mono text-xs text-ink-mute">{e.edition_number}</td>
                    <td className="text-sm max-w-[240px] truncate">{e.title}</td>
                    <td className="text-xs text-ink-mute whitespace-nowrap">{fmtDate(e.sent_at)}</td>
                    <td>
                      {e.clicked ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-soft text-amber">clicou</span>
                      ) : e.opened ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-olive-soft text-olive">abriu</span>
                      ) : (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-bg-soft text-ink-mute">só recebeu</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Linha do tempo */}
        <div className="paper p-6">
          <div className="flex items-baseline justify-between mb-5">
            <h3 className="font-display text-xl">Linha do tempo</h3>
            <span className="font-mono-tag">{timeline.length} eventos</span>
          </div>
          {timeline.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">Sem eventos.</p>
          ) : (
            <ol className="relative border-l border-rule ml-2 space-y-4 max-h-[460px] overflow-y-auto pr-2">
              {timeline.map((t, i) => (
                <li key={i} className="ml-4">
                  <span
                    className="absolute -left-[5px] w-2.5 h-2.5 rounded-full"
                    style={{ background: KIND_COLOR[t.kind] ?? "var(--ink-mute)" }}
                    aria-hidden
                  />
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm">{t.label}</span>
                    <span className="text-[11px] text-ink-faint font-mono whitespace-nowrap">{fmtDateTime(t.at)}</span>
                  </div>
                  {t.detail && <div className="text-xs text-ink-mute truncate">{t.detail}</div>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
