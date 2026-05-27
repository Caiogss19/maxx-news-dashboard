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

    // ── Outbound (Fluxo 1) ────────────────────────────────────────────────
    const { data: outbound, error: e1 } = await sb
      .from("beehiiv_sync_outbound")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(5000);

    // ── Events (Fluxo 2) ──────────────────────────────────────────────────
    const { data: events, error: e2 } = await sb
      .from("beehiiv_events")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(10000);

    if (e1 || e2) {
      console.error("Supabase errors:", e1, e2);
      return EMPTY;
    }

    const out = (outbound ?? []) as OutboundRow[];
    const ev = (events ?? []) as EventRow[];

    // ── Outbound metrics ─────────────────────────────────────────────────
    const outOk = out.filter((r) => r.success).length;
    const outFail = out.length - outOk;
    const errorGroups = groupCount(
      out.filter((r) => !r.success && r.error_message),
      "error_message" as any
    ).map((g) => ({ message: g.key, count: g.count }));

    // ── Base de subscribers ──────────────────────────────────────────────
    const created = ev.filter((r) => r.event_type === "subscription.created").length;
    const confirmed = ev.filter((r) => r.event_type === "subscription.confirmed").length;
    const deleted = ev.filter((r) => r.event_type === "subscription.deleted").length;
    // Active = subscribers únicos com último evento != deleted
    const lastByEmail = new Map<string, EventRow>();
    for (const r of ev) {
      if (!r.email) continue;
      const cat = r.event_category;
      if (cat !== "subscription") continue;
      const cur = lastByEmail.get(r.email);
      if (!cur || new Date(r.received_at) > new Date(cur.received_at)) {
        lastByEmail.set(r.email, r);
      }
    }
    let active = 0;
    for (const r of lastByEmail.values()) {
      if (r.event_type !== "subscription.deleted") active++;
    }

    // ── UTM ──────────────────────────────────────────────────────────────
    const subCreated = ev.filter((r) => r.event_type === "subscription.created");
    const utmSource = groupCount(subCreated, "utm_source" as any)
      .filter((g) => g.key && g.key !== "—")
      .slice(0, 10)
      .map((g) => ({ source: g.key, count: g.count }));
    const utmCampaign = groupCount(subCreated, "utm_campaign" as any)
      .filter((g) => g.key && g.key !== "—")
      .slice(0, 10)
      .map((g) => ({ campaign: g.key, count: g.count }));

    // ── Events distribution ──────────────────────────────────────────────
    const byType = groupCount(ev, "event_type" as any).map((g) => ({ type: g.key, count: g.count }));
    const byCategory = groupCount(ev, "event_category" as any).map((g) => ({ category: g.key, count: g.count }));

    const rdSynced = ev.filter((r) => r.rd_synced === true).length;
    const rdFailed = ev.filter(
      (r) => r.rd_synced === false && r.rd_sync_status_code != null && r.rd_sync_status_code >= 400
    ).length;
    const rdEligibleEvents = ev.filter((r) => r.event_category !== "post").length;
    const rdPending = Math.max(0, rdEligibleEvents - rdSynced - rdFailed);

    // ── Posts ────────────────────────────────────────────────────────────
    const postsSent = ev.filter((r) => r.event_type === "post.sent").length;
    const postsScheduled = ev.filter((r) => r.event_type === "post.scheduled").length;
    const postsUpdated = ev.filter((r) => r.event_type === "post.updated").length;

    // ── Timeseries (last 30 days) ────────────────────────────────────────
    const days = 30;
    const daily: Array<{ date: string; created: number; deleted: number; net: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      daily.push({ date: dateStr, created: 0, deleted: 0, net: 0 });
    }
    const dailyIdx = new Map(daily.map((r, i) => [r.date, i]));
    for (const r of ev) {
      const date = (r.received_at ?? "").slice(0, 10);
      const idx = dailyIdx.get(date);
      if (idx == null) continue;
      if (r.event_type === "subscription.created") daily[idx].created++;
      if (r.event_type === "subscription.deleted") daily[idx].deleted++;
    }
    for (const d of daily) d.net = d.created - d.deleted;

    return {
      outbound: {
        total: out.length,
        ok: outOk,
        fail: outFail,
        rate: pct(outOk, out.length),
        errorsByMessage: errorGroups.slice(0, 8)
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
        byType: byType.slice(0, 20),
        byCategory,
        rdSynced: { synced: rdSynced, pending: rdPending, failed: rdFailed }
      },
      posts: { sent: postsSent, scheduled: postsScheduled, updated: postsUpdated },
      timeseries: { daily },
      recent: {
        events: ev.slice(0, 12),
        outbound: out.slice(0, 12)
      }
    };
  } catch (err) {
    console.error("Snapshot error:", err);
    return EMPTY;
  }
}
