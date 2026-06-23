import { createSupabaseServer } from "./supabase-server";

export type EventRow = {
  id: string;
  event_id: string;
  event_type: string;
  event_category: string;
  email: string | null;
  subscriber_id: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referring_site: string | null;
  post_id: string | null;
  post_title: string | null;
  rd_synced: boolean;
  rd_sync_status_code: number | null;
  beehiiv_created_at: string | null;
  received_at: string;
};

export type OutboundRow = {
  id: string;
  email: string;
  rd_uuid: string | null;
  rd_conversion_identifier: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  success: boolean;
  beehiiv_status_code: number | null;
  beehiiv_subscriber_id: string | null;
  error_message: string | null;
  sent_at: string;
};

export type Snapshot = {
  outbound: {
    total: number;
    ok: number;
    fail: number;
    rate: number;
    errorsByMessage: Array<{ message: string; count: number }>;
  };
  base: {
    created: number;
    confirmed: number;
    deleted: number;
    active: number;
    confirmRate: number;
    churnRate: number;
    netGrowth: number;
  };
  utm: {
    bySource: Array<{ source: string; count: number }>;
    byCampaign: Array<{ campaign: string; count: number }>;
  };
  events: {
    byType: Array<{ type: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
    rdSynced: { synced: number; pending: number; failed: number };
  };
  posts: {
    sent: number;
    scheduled: number;
    updated: number;
  };
  timeseries: {
    daily: Array<{ date: string; created: number; deleted: number; net: number }>;
  };
  recent: {
    events: EventRow[];
    outbound: OutboundRow[];
  };
};

const EMPTY: Snapshot = {
  outbound: { total: 0, ok: 0, fail: 0, rate: 0, errorsByMessage: [] },
  base: { created: 0, confirmed: 0, deleted: 0, active: 0, confirmRate: 0, churnRate: 0, netGrowth: 0 },
  utm: { bySource: [], byCampaign: [] },
  events: { byType: [], byCategory: [], rdSynced: { synced: 0, pending: 0, failed: 0 } },
  posts: { sent: 0, scheduled: 0, updated: 0 },
  timeseries: { daily: [] },
  recent: { events: [], outbound: [] }
};

function pct(n: number, d: number): number {
  if (!d) return 0;
  return Math.round((n / d) * 1000) / 10;
}

function groupCount<T extends Record<string, any>>(arr: T[], key: keyof T): Array<{ key: string; count: number }> {
  const m = new Map<string, number>();
  for (const r of arr) {
    const v = (r[key] ?? "—") as string;
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return Array.from(m.entries())
    .map(([k, v]) => ({ key: k, count: v }))
    .sort((a, b) => b.count - a.count);
}

export async function getSnapshot(): Promise<Snapshot> {
  try {
    const sb = createSupabaseServer();

    // Tudo agregado server-side via views (sem cair no limit 1000 do PostgREST)
    const [
      subStatsRes, utmSrcRes, utmCmpRes,
      typeStatsRes, catStatsRes, rdStatsRes, postStatsRes,
      dailyRes, outStatsRes, outErrRes,
      recentEventsRes, recentOutboundRes
    ] = await Promise.all([
      sb.from("v_subscriber_stats").select("*").limit(1),
      sb.from("v_utm_source_stats").select("*").limit(10),
      sb.from("v_utm_campaign_stats").select("*").limit(10),
      sb.from("v_event_type_stats").select("*").limit(20),
      sb.from("v_event_category_stats").select("*"),
      sb.from("v_rd_sync_stats").select("*").limit(1),
      sb.from("v_post_stats").select("*").limit(1),
      sb.from("v_subscriber_daily").select("*"),
      sb.from("v_outbound_stats").select("*").limit(1),
      sb.from("v_outbound_errors").select("*").limit(8),
      sb.from("beehiiv_events").select("*").order("received_at", { ascending: false }).limit(12),
      sb.from("beehiiv_sync_outbound").select("*").order("sent_at", { ascending: false }).limit(12)
    ]);

    const subS = (subStatsRes.data?.[0] ?? {}) as { created?: number; confirmed?: number; deleted?: number; active?: number };
    const created = Number(subS.created ?? 0);
    const confirmed = Number(subS.confirmed ?? 0);
    const deleted = Number(subS.deleted ?? 0);
    const active = Number(subS.active ?? 0);

    const utmSource = (utmSrcRes.data ?? []).map((r) => ({ source: String((r as any).source ?? ""), count: Number((r as any).count ?? 0) }));
    const utmCampaign = (utmCmpRes.data ?? []).map((r) => ({ campaign: String((r as any).campaign ?? ""), count: Number((r as any).count ?? 0) }));

    const byType = (typeStatsRes.data ?? []).map((r) => ({ type: String((r as any).type ?? ""), count: Number((r as any).count ?? 0) }));
    const byCategory = (catStatsRes.data ?? []).map((r) => ({ category: String((r as any).category ?? ""), count: Number((r as any).count ?? 0) }));

    const rdS = (rdStatsRes.data?.[0] ?? {}) as { synced?: number; pending?: number; failed?: number };
    const postS = (postStatsRes.data?.[0] ?? {}) as { sent?: number; scheduled?: number; updated?: number };

    // Timeseries: completa 30 dias com zero pros dias sem evento
    const days = 30;
    const daily: Array<{ date: string; created: number; deleted: number; net: number }> = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      daily.push({ date: d.toISOString().slice(0, 10), created: 0, deleted: 0, net: 0 });
    }
    const dailyIdx = new Map(daily.map((r, i) => [r.date, i]));
    for (const r of dailyRes.data ?? []) {
      const dateStr = String((r as any).date ?? "").slice(0, 10);
      const idx = dailyIdx.get(dateStr);
      if (idx == null) continue;
      daily[idx].created = Number((r as any).created ?? 0);
      daily[idx].deleted = Number((r as any).deleted ?? 0);
    }
    for (const d of daily) d.net = d.created - d.deleted;

    const outS = (outStatsRes.data?.[0] ?? {}) as { total?: number; ok?: number; fail?: number };
    const outTotal = Number(outS.total ?? 0);
    const outOk = Number(outS.ok ?? 0);
    const outFail = Number(outS.fail ?? 0);
    const errorGroups = (outErrRes.data ?? []).map((r) => ({ message: String((r as any).message ?? ""), count: Number((r as any).count ?? 0) }));

    return {
      outbound: {
        total: outTotal,
        ok: outOk,
        fail: outFail,
        rate: pct(outOk, outTotal),
        errorsByMessage: errorGroups
      },
      base: {
        created,
        confirmed,
        deleted,
        active,
        confirmRate: pct(confirmed, created),
        churnRate: pct(deleted, created),
        netGrowth: created - deleted
      },
      utm: { bySource: utmSource, byCampaign: utmCampaign },
      events: {
        byType,
        byCategory,
        rdSynced: {
          synced: Number(rdS.synced ?? 0),
          pending: Number(rdS.pending ?? 0),
          failed: Number(rdS.failed ?? 0)
        }
      },
      posts: {
        sent: Number(postS.sent ?? 0),
        scheduled: Number(postS.scheduled ?? 0),
        updated: Number(postS.updated ?? 0)
      },
      timeseries: { daily },
      recent: {
        events: ((recentEventsRes.data ?? []) as EventRow[]),
        outbound: ((recentOutboundRes.data ?? []) as OutboundRow[])
      }
    };
  } catch (err) {
    console.error("Snapshot error:", err);
    return EMPTY;
  }
}
