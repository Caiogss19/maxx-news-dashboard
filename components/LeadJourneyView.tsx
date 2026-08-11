import Link from "next/link";
import type { LeadJourney } from "@/lib/analytics";
import { KPI } from "@/components/KPI";
import { RDLink } from "@/components/RDLink";
import { fmtPct, fmtDate, fmtDateTime, truncate } from "@/lib/format";

/** Tira protocolo e query pra caber na coluna sem virar sopa de UTM. */
function limparUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").split("?")[0];
}

const KIND_COLOR: Record<string, string> = {
  subscription: "var(--navy)",
  survey: "var(--plum)",
  delivered: "var(--ink-faint)",
  opened: "var(--olive)",
  clicked: "var(--amber)",
  unsubscribed: "var(--danger)",
  bounced: "var(--danger)"
};

export function LeadJourneyView({ email, journey }: { email: string; journey: LeadJourney }) {
  const { lead, perEdition, timeline, cliques } = journey;

  // Quantas edições com clique têm detalhamento, contra quantas o agregado diz
  // que existem. Sem esta conta a tabela mostra "1 link" para quem clicou em 3
  // edições e passa a impressão de que o resto não aconteceu.
  const edicoesDetalhadas = new Set(
    cliques.map((c) => c.edition_number).filter((n): n is number => n != null)
  ).size;
  const edicoesSemDetalhe = Math.max(0, (lead?.editions_clicked ?? 0) - edicoesDetalhadas);

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
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-danger-soft text-danger">churn</span>
          ) : lead.confirmed ? (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-olive-soft text-olive">ativo</span>
          ) : (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-soft text-amber">pendente</span>
          )}
          <RDLink email={lead.email} variant="button" />
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

      {/* Em que ele clicou. Só aparece quando a edição tem detalhamento
          sincronizado — o agregado sabe que houve clique, mas não em quê. */}
      <div className="paper overflow-hidden">
        <div className="flex items-baseline justify-between p-6 pb-4">
          <h3 className="font-display text-xl">Links que clicou</h3>
          <span className="font-mono-tag">
            {cliques.length > 0
              ? `${cliques.length} ${cliques.length === 1 ? "link" : "links"}`
              : "sem detalhamento"}
          </span>
        </div>
        {cliques.length === 0 ? (
          <p className="text-ink-faint text-sm px-6 pb-8 leading-snug max-w-2xl">
            {lead.editions_clicked > 0
              ? `Este lead tem clique em ${lead.editions_clicked} ${
                  lead.editions_clicked === 1 ? "edição" : "edições"
                }, mas o detalhamento por link ainda não foi sincronizado para elas. O agregado sabe que houve clique; só a MCP do Beehiiv diz em qual link.`
              : "Nenhum clique registrado."}
          </p>
        ) : (
          <table className="editorial">
            <thead>
              <tr>
                <th>Link</th>
                <th>Categoria</th>
                <th>Edição</th>
                <th className="num">Cliques</th>
                <th>Quando</th>
              </tr>
            </thead>
            <tbody>
              {cliques.map((c, i) => (
                <tr key={`${c.url}-${i}`}>
                  <td className="text-sm" title={c.url}>
                    {truncate(limparUrl(c.url), 52)}
                  </td>
                  <td className="text-xs text-ink-mute">{c.categoria}</td>
                  <td className="font-mono text-xs text-ink-mute">
                    {c.edition_number != null ? `#${c.edition_number}` : "—"}
                  </td>
                  <td className="num">{c.clicks}</td>
                  <td className="text-xs text-ink-mute whitespace-nowrap">
                    {fmtDateTime(c.clickedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {cliques.length > 0 && edicoesSemDetalhe > 0 && (
          <div
            className="px-6 py-3.5 text-xs text-ink-mute leading-snug"
            style={{ borderTop: "1px solid var(--rule)" }}
          >
            Falta o detalhamento de {edicoesSemDetalhe}{" "}
            {edicoesSemDetalhe === 1 ? "edição" : "edições"} em que este lead também clicou — o
            agregado registra o clique, mas só a MCP do Beehiiv diz em qual link. A lista acima
            cobre {edicoesDetalhadas} de {lead.editions_clicked}.
          </div>
        )}
      </div>
    </div>
  );
}
