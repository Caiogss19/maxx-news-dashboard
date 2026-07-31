import Link from "next/link";
import type { LeadEngagement } from "@/lib/analytics";
import { relativeTime, truncate } from "@/lib/format";
import { EditionDots } from "@/components/EditionDots";

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
              <th>Edições clicadas</th>
              <th className="num">Cliques</th>
              <th>Última interação</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.email}>
                <td className="text-sm">
                  <Link href={`/leads?email=${encodeURIComponent(l.email)}`} className="hover:underline">
                    {truncate(l.email, 32)}
                  </Link>
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
                  {/* Só temos engajamento por assinante para quem clicou — abertura
                      por lead não é exibida aqui para não passar "0%" como se fosse
                      "nunca abriu". A abertura agregada por edição fica em /edicoes. */}
                  {l.editions_clicked > 0 ? (
                    <EditionDots
                      filled={l.editions_clicked}
                      total={Math.max(l.editions_received, l.editions_clicked)}
                    />
                  ) : (
                    <span className="text-xs text-ink-faint">nenhuma</span>
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
