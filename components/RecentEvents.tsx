import type { EventRow } from "@/lib/queries";
import { relativeTime, truncate, categoryColor } from "@/lib/format";

export function RecentEvents({ rows }: { rows: EventRow[] }) {
  return (
    <div className="paper overflow-hidden">
      <div className="flex items-baseline justify-between p-6 pb-4">
        <h3 className="font-display text-xl">Atividade recente · Beehiiv → RD</h3>
        <span className="font-mono-tag">últimos {rows.length} eventos</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-ink-faint text-sm py-12 text-center">Sem eventos ainda.</p>
      ) : (
        <table className="editorial">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Evento</th>
              <th>Email</th>
              <th>UTM</th>
              <th>RD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="text-xs text-ink-mute whitespace-nowrap">{relativeTime(r.received_at)}</td>
                <td>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: categoryColor(r.event_category) }}
                      aria-hidden
                    />
                    <span className="font-mono text-xs">{r.event_type}</span>
                  </span>
                </td>
                <td className="text-sm">{truncate(r.email, 28)}</td>
                <td className="text-xs text-ink-mute">
                  {r.utm_source || "—"}
                  {r.utm_campaign ? <span className="text-ink-faint"> · {r.utm_campaign}</span> : null}
                </td>
                <td>
                  {r.rd_synced ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-olive-soft text-olive">
                      ok
                    </span>
                  ) : r.rd_sync_status_code && r.rd_sync_status_code >= 400 ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-crimson-soft text-crimson">
                      {r.rd_sync_status_code}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
