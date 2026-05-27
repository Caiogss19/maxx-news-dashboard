import type { OutboundRow } from "@/lib/queries";
import { relativeTime, truncate } from "@/lib/format";

export function RecentOutbound({ rows }: { rows: OutboundRow[] }) {
  return (
    <div className="paper overflow-hidden">
      <div className="flex items-baseline justify-between p-6 pb-4">
        <h3 className="font-display text-xl">Atividade recente · RD → Beehiiv</h3>
        <span className="font-mono-tag">últimos {rows.length} envios</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-ink-faint text-sm py-12 text-center">Sem envios ainda.</p>
      ) : (
        <table className="editorial">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Email</th>
              <th>UTM</th>
              <th>Status</th>
              <th>Beehiiv ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="text-xs text-ink-mute whitespace-nowrap">{relativeTime(r.sent_at)}</td>
                <td className="text-sm">{truncate(r.email, 28)}</td>
                <td className="text-xs text-ink-mute">
                  {r.utm_source || "—"}
                  {r.utm_campaign ? <span className="text-ink-faint"> · {r.utm_campaign}</span> : null}
                </td>
                <td>
                  {r.success ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-olive-soft text-olive">
                      {r.beehiiv_status_code ?? "ok"}
                    </span>
                  ) : (
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full bg-crimson-soft text-crimson"
                      title={r.error_message ?? "erro"}
                    >
                      {r.beehiiv_status_code ?? "erro"}
                    </span>
                  )}
                </td>
                <td className="text-xs text-ink-faint font-mono">
                  {truncate(r.beehiiv_subscriber_id, 18)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
