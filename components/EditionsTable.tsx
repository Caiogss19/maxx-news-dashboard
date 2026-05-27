import Link from "next/link";
import type { EditionPerf } from "@/lib/analytics";
import { fmtNum, fmtPct, fmtDate } from "@/lib/format";

export function EditionsTable({ editions }: { editions: EditionPerf[] }) {
  return (
    <div className="paper overflow-hidden">
      <div className="flex items-baseline justify-between p-6 pb-4">
        <h3 className="font-display text-xl">Edições publicadas</h3>
        <span className="font-mono-tag">{editions.length} edições · clique para detalhar</span>
      </div>
      {editions.length === 0 ? (
        <p className="text-ink-faint text-sm py-12 text-center">Sem edições ainda.</p>
      ) : (
        <table className="editorial">
          <thead>
            <tr>
              <th>#</th>
              <th>Edição</th>
              <th>Enviada</th>
              <th>Entregues</th>
              <th>Abertura</th>
              <th>CTR</th>
              <th>Cliques</th>
              <th>Unsub</th>
            </tr>
          </thead>
          <tbody>
            {editions.map((e) => (
              <tr key={e.post_id}>
                <td className="font-mono text-xs text-ink-mute">{e.edition_number}</td>
                <td className="max-w-[280px]">
                  <Link href={`/edicoes/${e.post_id}`} className="text-sm hover:underline">
                    {e.title}
                  </Link>
                </td>
                <td className="text-xs text-ink-mute whitespace-nowrap">{fmtDate(e.sent_at)}</td>
                <td className="font-mono text-sm">{fmtNum(e.delivered)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="bar-track w-16">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.min(100, e.open_rate)}%`, background: "var(--olive)" }}
                      />
                    </div>
                    <span className="font-mono text-xs w-12">{fmtPct(e.open_rate)}</span>
                  </div>
                </td>
                <td className="font-mono text-sm">{fmtPct(e.ctr)}</td>
                <td className="font-mono text-sm">{fmtNum(e.unique_clicks)}</td>
                <td className="font-mono text-xs text-ink-mute">{e.unsubscribes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
