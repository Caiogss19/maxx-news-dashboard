import Link from "next/link";
import type { LeadEngagement } from "@/lib/analytics";
import { RDLink } from "@/components/RDLink";
import { fmtPct, relativeTime, truncate } from "@/lib/format";

export function LeadsTable({ leads }: { leads: LeadEngagement[] }) {
  return (
    <div className="paper overflow-hidden">
      <div className="flex items-baseline justify-between p-6 pb-4">
        <h3 className="font-display text-xl">Diretório de leads</h3>
        <span className="font-mono-tag">{leads.length} leads · clique para ver a jornada</span>
      </div>
      {leads.length === 0 ? (
        <p className="text-ink-faint text-sm py-12 text-center">Nenhum lead encontrado.</p>
      ) : (
        <table className="editorial">
          <thead>
            <tr>
              <th>Email</th>
              <th>Origem</th>
              <th>Status</th>
              <th className="num">Recebidas</th>
              <th>Abertura</th>
              <th className="num">Cliques</th>
              <th>Última interação</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.email} style={l.isBot ? { opacity: 0.62 } : undefined}>
                <td className="text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <Link href={`/leads?email=${encodeURIComponent(l.email)}`} className="hover:underline">
                      {truncate(l.email, 32)}
                    </Link>
                    {/* Sem esta marca, um scanner com 468 cliques encabeça o
                        diretório e passa por lead quentíssimo. */}
                    {l.isBot && (
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-soft text-amber whitespace-nowrap"
                        title="Varredura automática, endereço interno ou inflador de abertura — fora de todos os rankings"
                      >
                        automatizado
                      </span>
                    )}
                    <RDLink email={l.email} />
                  </span>
                </td>
                <td className="text-xs text-ink-mute">
                  {l.utm_source || "—"}
                  {l.tier === "premium" ? <span className="text-plum"> · premium</span> : null}
                </td>
                <td>
                  {l.churned ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-danger-soft text-danger">churn</span>
                  ) : l.confirmed ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-olive-soft text-olive">ativo</span>
                  ) : (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-soft text-amber">pendente</span>
                  )}
                </td>
                <td className="num">{l.editions_received}</td>
                <td>
                  {l.editions_received > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="bar-track w-14">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${Math.min(100, l.open_rate)}%`,
                            background: "var(--olive)"
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs w-14">
                        {fmtPct(l.open_rate)}
                      </span>
                      <span className="text-xs text-ink-faint whitespace-nowrap">
                        {l.editions_opened} de {l.editions_received}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-faint">sem envio</span>
                  )}
                </td>
                <td className="num">{l.total_clicks}</td>
                <td className="text-xs text-ink-mute whitespace-nowrap">
                  {l.last_engaged_at ? relativeTime(l.last_engaged_at) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
