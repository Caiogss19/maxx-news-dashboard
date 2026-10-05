"use client";

import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
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
    <div className="nw-vivo">
      <span className="live-dot" />
      <span>Ao vivo</span>
      {count > 0 && (
        <span className="nw-vivo__n">
          · {count} {count === 1 ? "novo evento" : "novos eventos"}
          {last && <small> ({last})</small>}
        </span>
      )}
      {count > 0 && (
        <button onClick={() => window.location.reload()} className="spk-btn spk-btn--pequeno" type="button">
          <RotateCw /> Atualizar
        </button>
      )}
    </div>
  );
}
