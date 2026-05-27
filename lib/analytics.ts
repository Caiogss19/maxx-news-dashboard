import { createSupabaseServer } from "./supabase-server";

const num = (v: unknown): number => (v == null ? 0 : Number(v));

export type EditionPerf = {
  id: string;
  post_id: string;
  edition_number: number;
  title: string;
  subject: string | null;
  sent_at: string;
  web_url: string | null;
  recipients: number;
  delivered: number;
  unique_opens: number;
  opens: number;
  unique_clicks: number;
  clicks: number;
  unsubscribes: number;
  bounces: number;
  open_rate: number;
  ctr: number;
  ctor: number;
};

export type LeadEngagement = {
  email: string;
  subscriber_id: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  deleted_at: string | null;
  churned: boolean;
  confirmed: boolean;
  utm_source: string | null;
  utm_campaign: string | null;
  tier: string | null;
  editions_received: number;
  editions_opened: number;
  editions_clicked: number;
  total_opens: number;
  total_clicks: number;
  last_engaged_at: string | null;
  open_rate: number;
};

export type EngagementDaily = {
  day: string;
  delivered: number;
  opens: number;
  unique_opens: number;
  clicks: number;
};

export type EngagementSnapshot = {
  totals: {
    editions: number;
    delivered: number;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
    avgOpenRate: number;
    avgCtr: number;
  };
  funnel: { received: number; openers: number; clickers: number };
  daily: EngagementDaily[];
  byHour: Array<{ hour: number; opens: number; clicks: number }>;
  topLinks: Array<{ url: string; clicks: number; unique: number }>;
  topLeads: LeadEngagement[];
  distribution: Array<{ label: string; value: number }>;
};

export type LeadJourney = {
  lead: LeadEngagement | null;
  perEdition: Array<{
    edition_number: number;
    title: string;
    sent_at: string;
    received: boolean;
    opened: boolean;
    clicked: boolean;
    openedAt: string | null;
    clickedAt: string | null;
  }>;
  timeline: Array<{ at: string; kind: string; label: string; detail?: string }>;
};

function coerceEdition(r: Record<string, unknown>): EditionPerf {
  return {
    id: String(r.id),
    post_id: String(r.post_id),
    edition_number: num(r.edition_number),
    title: String(r.title),
    subject: (r.subject as string) ?? null,
    sent_at: String(r.sent_at),
    web_url: (r.web_url as string) ?? null,
    recipients: num(r.recipients),
    delivered: num(r.delivered),
    unique_opens: num(r.unique_opens),
    opens: num(r.opens),
    unique_clicks: num(r.unique_clicks),
    clicks: num(r.clicks),
    unsubscribes: num(r.unsubscribes),
    bounces: num(r.bounces),
    open_rate: num(r.open_rate),
    ctr: num(r.ctr),
    ctor: num(r.ctor)
  };
}

function coerceLead(r: Record<string, unknown>): LeadEngagement {
  return {
    email: String(r.email),
    subscriber_id: (r.subscriber_id as string) ?? null,
    created_at: (r.created_at as string) ?? null,
    confirmed_at: (r.confirmed_at as string) ?? null,
    deleted_at: (r.deleted_at as string) ?? null,
    churned: Boolean(r.churned),
    confirmed: Boolean(r.confirmed),
    utm_source: (r.utm_source as string) ?? null,
    utm_campaign: (r.utm_campaign as string) ?? null,
    tier: (r.tier as string) ?? null,
    editions_received: num(r.editions_received),
    editions_opened: num(r.editions_opened),
    editions_clicked: num(r.editions_clicked),
    total_opens: num(r.total_opens),
    total_clicks: num(r.total_clicks),
    last_engaged_at: (r.last_engaged_at as string) ?? null,
    open_rate: num(r.open_rate)
  };
}

export async function getEditions(): Promise<EditionPerf[]> {
  try {
    const sb = createSupabaseServer();
    const { data, error } = await sb.from("v_edition_performance").select("*");
    if (error || !data) return [];
    return data.map((r) => coerceEdition(r as Record<string, unknown>)).sort((a, b) => b.edition_number - a.edition_number);
  } catch {
    return [];
  }
}

export async function getEdition(postId: string): Promise<{
  edition: EditionPerf | null;
  topLinks: Array<{ url: string; clicks: number }>;
  engagedLeads: Array<{ email: string; opened: boolean; clicked: boolean; openedAt: string | null }>;
}> {
  try {
    const sb = createSupabaseServer();
    const { data: ed } = await sb.from("v_edition_performance").select("*").eq("post_id", postId).limit(1);
    const edition = ed && ed[0] ? coerceEdition(ed[0] as Record<string, unknown>) : null;
    if (!edition) return { edition: null, topLinks: [], engagedLeads: [] };

    const { data: inter } = await sb
      .from("beehiiv_interactions")
      .select("email,event_type,occurred_at,link_url")
      .eq("post_id", postId)
      .limit(20000);

    const rows = (inter ?? []) as Array<{ email: string; event_type: string; occurred_at: string; link_url: string | null }>;

    const linkMap = new Map<string, number>();
    const leadMap = new Map<string, { opened: boolean; clicked: boolean; openedAt: string | null }>();
    for (const r of rows) {
      if (r.event_type === "email.clicked" && r.link_url) {
        linkMap.set(r.link_url, (linkMap.get(r.link_url) ?? 0) + 1);
      }
      if (r.event_type === "email.opened" || r.event_type === "email.clicked") {
        const cur = leadMap.get(r.email) ?? { opened: false, clicked: false, openedAt: null };
        if (r.event_type === "email.opened") {
          cur.opened = true;
          if (!cur.openedAt || new Date(r.occurred_at) < new Date(cur.openedAt)) cur.openedAt = r.occurred_at;
        }
        if (r.event_type === "email.clicked") cur.clicked = true;
        leadMap.set(r.email, cur);
      }
    }

    const topLinks = Array.from(linkMap.entries())
      .map(([url, clicks]) => ({ url, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 6);

    const engagedLeads = Array.from(leadMap.entries())
      .map(([email, v]) => ({ email, ...v }))
      .sort((a, b) => Number(b.clicked) - Number(a.clicked) || Number(b.opened) - Number(a.opened))
      .slice(0, 25);

    return { edition, topLinks, engagedLeads };
  } catch {
    return { edition: null, topLinks: [], engagedLeads: [] };
  }
}

export async function getLeads(): Promise<LeadEngagement[]> {
  try {
    const sb = createSupabaseServer();
    const { data, error } = await sb.from("v_lead_engagement").select("*").limit(5000);
    if (error || !data) return [];
    return data.map((r) => coerceLead(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getEngagement(): Promise<EngagementSnapshot> {
  const empty: EngagementSnapshot = {
    totals: { editions: 0, delivered: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0, avgOpenRate: 0, avgCtr: 0 },
    funnel: { received: 0, openers: 0, clickers: 0 },
    daily: [],
    byHour: [],
    topLinks: [],
    topLeads: [],
    distribution: []
  };
  try {
    const sb = createSupabaseServer();
    const [editionsRes, leadsRes, dailyRes, hourRes, linksRes] = await Promise.all([
      sb.from("v_edition_performance").select("*"),
      sb.from("v_lead_engagement").select("*").limit(5000),
      sb.from("v_engagement_daily").select("*"),
      sb.from("v_engagement_by_hour").select("*"),
      sb.from("v_link_performance").select("*")
    ]);

    const editions = (editionsRes.data ?? []).map((r) => coerceEdition(r as Record<string, unknown>));
    const leads = (leadsRes.data ?? []).map((r) => coerceLead(r as Record<string, unknown>));

    const delivered = editions.reduce((a, e) => a + e.delivered, 0);
    const opens = editions.reduce((a, e) => a + e.opens, 0);
    const clicks = editions.reduce((a, e) => a + e.clicks, 0);
    const bounces = editions.reduce((a, e) => a + e.bounces, 0);
    const unsubscribes = editions.reduce((a, e) => a + e.unsubscribes, 0);
    const avgOpenRate = editions.length
      ? Math.round((editions.reduce((a, e) => a + e.open_rate, 0) / editions.length) * 10) / 10
      : 0;
    const avgCtr = editions.length
      ? Math.round((editions.reduce((a, e) => a + e.ctr, 0) / editions.length) * 10) / 10
      : 0;

    const received = leads.filter((l) => l.editions_received > 0).length;
    const openers = leads.filter((l) => l.editions_opened > 0).length;
    const clickers = leads.filter((l) => l.editions_clicked > 0).length;

    const buckets = [
      { label: "Nunca abriu", value: leads.filter((l) => l.editions_received > 0 && l.editions_opened === 0).length },
      { label: "1–2 edições", value: leads.filter((l) => l.editions_opened >= 1 && l.editions_opened <= 2).length },
      { label: "3–5 edições", value: leads.filter((l) => l.editions_opened >= 3 && l.editions_opened <= 5).length },
      { label: "6+ edições", value: leads.filter((l) => l.editions_opened >= 6).length }
    ];

    const daily = (dailyRes.data ?? [])
      .map((r) => {
        const rr = r as Record<string, unknown>;
        return {
          day: String(rr.day),
          delivered: num(rr.delivered),
          opens: num(rr.opens),
          unique_opens: num(rr.unique_opens),
          clicks: num(rr.clicks)
        };
      })
      .sort((a, b) => a.day.localeCompare(b.day));

    const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, opens: 0, clicks: 0 }));
    for (const r of hourRes.data ?? []) {
      const rr = r as Record<string, unknown>;
      const h = num(rr.hour);
      if (h >= 0 && h < 24) byHour[h] = { hour: h, opens: num(rr.opens), clicks: num(rr.clicks) };
    }

    const topLinks = (linksRes.data ?? [])
      .map((r) => {
        const rr = r as Record<string, unknown>;
        return { url: String(rr.link_url), clicks: num(rr.clicks), unique: num(rr.unique_clicks) };
      })
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 6);

    const topLeads = [...leads]
      .sort((a, b) => b.total_clicks - a.total_clicks || b.total_opens - a.total_opens)
      .slice(0, 12);

    return {
      totals: { editions: editions.length, delivered, opens, clicks, bounces, unsubscribes, avgOpenRate, avgCtr },
      funnel: { received, openers, clickers },
      daily,
      byHour,
      topLinks,
      topLeads,
      distribution: buckets
    };
  } catch {
    return empty;
  }
}

export async function getLeadJourney(email: string): Promise<LeadJourney> {
  try {
    const sb = createSupabaseServer();
    const [leadRes, subRes, interRes, edRes] = await Promise.all([
      sb.from("v_lead_engagement").select("*").eq("email", email).limit(1),
      sb
        .from("beehiiv_events")
        .select("event_type,event_category,received_at,utm_source,utm_campaign,subscription_tier")
        .eq("email", email)
        .order("received_at", { ascending: true })
        .limit(200),
      sb
        .from("beehiiv_interactions")
        .select("post_id,event_type,occurred_at,link_url")
        .eq("email", email)
        .order("occurred_at", { ascending: true })
        .limit(2000),
      sb.from("beehiiv_editions").select("post_id,edition_number,title,sent_at").eq("status", "sent")
    ]);

    const lead = leadRes.data && leadRes.data[0] ? coerceLead(leadRes.data[0] as Record<string, unknown>) : null;

    const editions = (edRes.data ?? []).map((r) => {
      const rr = r as Record<string, unknown>;
      return { post_id: String(rr.post_id), edition_number: num(rr.edition_number), title: String(rr.title), sent_at: String(rr.sent_at) };
    });

    const inter = (interRes.data ?? []) as Array<{ post_id: string; event_type: string; occurred_at: string; link_url: string | null }>;
    const byEdition = new Map<string, { received: boolean; opened: boolean; clicked: boolean; openedAt: string | null; clickedAt: string | null }>();
    for (const r of inter) {
      const cur = byEdition.get(r.post_id) ?? { received: false, opened: false, clicked: false, openedAt: null, clickedAt: null };
      if (r.event_type === "email.delivered") cur.received = true;
      if (r.event_type === "email.opened") {
        cur.opened = true;
        if (!cur.openedAt) cur.openedAt = r.occurred_at;
      }
      if (r.event_type === "email.clicked") {
        cur.clicked = true;
        if (!cur.clickedAt) cur.clickedAt = r.occurred_at;
      }
      byEdition.set(r.post_id, cur);
    }

    const perEdition = editions
      .map((e) => {
        const s = byEdition.get(e.post_id);
        return {
          edition_number: e.edition_number,
          title: e.title,
          sent_at: e.sent_at,
          received: s?.received ?? false,
          opened: s?.opened ?? false,
          clicked: s?.clicked ?? false,
          openedAt: s?.openedAt ?? null,
          clickedAt: s?.clickedAt ?? null
        };
      })
      .filter((e) => e.received)
      .sort((a, b) => b.edition_number - a.edition_number);

    const edTitle = new Map(editions.map((e) => [e.post_id, e]));
    const timeline: LeadJourney["timeline"] = [];

    const subLabels: Record<string, string> = {
      "subscription.created": "Inscreveu-se",
      "subscription.confirmed": "Confirmou opt-in",
      "subscription.deleted": "Cancelou inscrição",
      "subscription.upgraded": "Upgrade para premium",
      "survey.submitted": "Respondeu pesquisa"
    };
    for (const r of subRes.data ?? []) {
      const rr = r as Record<string, unknown>;
      const t = String(rr.event_type);
      timeline.push({
        at: String(rr.received_at),
        kind: t.startsWith("subscription") ? "subscription" : "survey",
        label: subLabels[t] ?? t,
        detail: rr.utm_source ? `via ${rr.utm_source}` : undefined
      });
    }
    for (const r of inter) {
      const ed = edTitle.get(r.post_id);
      const edLabel = ed ? `Ed. ${ed.edition_number} · ${ed.title}` : r.post_id;
      if (r.event_type === "email.delivered") timeline.push({ at: r.occurred_at, kind: "delivered", label: "Recebeu edição", detail: edLabel });
      if (r.event_type === "email.opened") timeline.push({ at: r.occurred_at, kind: "opened", label: "Abriu edição", detail: edLabel });
      if (r.event_type === "email.clicked") timeline.push({ at: r.occurred_at, kind: "clicked", label: "Clicou em link", detail: r.link_url ?? edLabel });
      if (r.event_type === "email.unsubscribed") timeline.push({ at: r.occurred_at, kind: "unsubscribed", label: "Descadastrou", detail: edLabel });
      if (r.event_type === "email.bounced") timeline.push({ at: r.occurred_at, kind: "bounced", label: "Bounce", detail: edLabel });
    }
    timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return { lead, perEdition, timeline };
  } catch {
    return { lead: null, perEdition: [], timeline: [] };
  }
}
