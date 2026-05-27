"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";

export function LiveIndicator() {
  const [count, setCount] = useState(0);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    let sb;
    try {
      sb = createSupabaseClient();
    } catch {
      return;
    }

    const ch = sb
      .channel("newsletter-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "beehiiv_events" },
        (payload: any) => {
          setCount((c) => c + 1);
          setLast(payload?.new?.event_type ?? null);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "beehiiv_sync_outbound" },
        () => {
          setCount((c) => c + 1);
          setLast("outbound");
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(ch);
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-mute">
      <span className="live-dot" />
      <span>Live</span>
      {count > 0 && (
        <span className="text-ink">
          · {count} {count === 1 ? "novo evento" : "novos eventos"}
          {last && <span className="text-ink-faint"> ({last})</span>}
        </span>
      )}
      {count > 0 && (
        <button
          onClick={() => window.location.reload()}
          className="ml-1 px-2 py-0.5 rounded-full border border-rule text-ink hover:bg-bg-soft transition"
          type="button"
        >
          ↻ Atualizar
        </button>
      )}
    </div>
  );
}
