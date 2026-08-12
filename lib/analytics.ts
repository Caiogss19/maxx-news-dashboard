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
  /**
   * Conta em `v_bot_accounts` — varredura automática, endereço interno ou
   * inflador de abertura. Só é preenchido por `getLeads()`; o diretório precisa
   * marcar essas linhas, senão elas aparecem como os leads mais engajados da
   * base sem nenhuma ressalva.
   */
  isBot?: boolean;
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
  funnel: { received: number; openers: number; clickers: number; isEstimated: boolean };
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
  /**
   * Em quais links este lead clicou. Depende de `beehiiv_link_clicks`, que só a
   * MCP do Beehiiv alimenta — edição sem backfill vem vazia mesmo tendo clique
   * contabilizado no agregado.
   */
  cliques: Array<{
    /** null quando o url_hash não tem de-para em `beehiiv_link_stats`. */
    url: string | null;
    categoria: string | null;
    edition_number: number | null;
    clicks: number;
    clickedAt: string | null;
  }>;
  /** Conta da carteira CustomerX a que este lead pertence, se houver. */
  cliente: {
    company_name: string;
    contract_status: string | null;
    plano: string | null;
    carteira: string | null;
    mrr: number;
    /** "email" = e-mail exato do cadastro; "dominio" = mesmo domínio da conta. */
    casou_por: string;
  } | null;
  /**
   * Presente quando o lead cai em `v_bot_accounts`. Precisa aparecer em
   * destaque: sem isso, 42 cliques de um filtro corporativo passam por
   * interesse altíssimo.
   */
  scanner: {
    motivo: string;
    cliques: number;
    aberturas: number;
    razao: number;
    latencia_mediana_s: number | null;
    /** Maior rajada: N destinos distintos abertos numa janela de segundos. */
    rajada_links: number | null;
    rajada_janela_s: number | null;
    rajada_latencia_s: number | null;
  } | null;
  /** Quem mais da mesma empresa assina, e o total da conta. */
  empresa: {
    dominio: string;
    contatos: number;
    humanos: number;
    cliquesHumanos: number;
    colegas: Array<{
      email: string;
      editions_opened: number;
      total_clicks: number;
      is_bot: boolean;
      last_engaged_at: string | null;
    }>;
  } | null;
  /** Cliques por categoria de destino — que tipo de conteúdo puxa este lead. */
  categorias: Array<{ categoria: string; cliques: number; links: number }>;
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

export type LinkDaEdicao = {
  url: string;
  urlHash: string | null;
  clicks: number;
  uniqueClicks: number;
  verifiedClicks: number;
  verifiedUniqueClicks: number;
};

export type CliqueEmLink = {
  urlHash: string;
  email: string;
  clicks: number;
  clickedAt: string | null;
  isBot: boolean;
};

const EDICAO_VAZIA = {
  edition: null,
  topLinks: [],
  engagedLeads: [],
  emailHtml: null,
  links: [],
  cliquesPorLink: []
};

export async function getEdition(postId: string): Promise<{
  edition: EditionPerf | null;
  topLinks: Array<{ url: string; clicks: number; uniqueClicks: number }>;
  engagedLeads: Array<{ email: string; opened: boolean; clicked: boolean; openedAt: string | null }>;
  /** Render do e-mail enviado, base do mapa de cliques. Null em edição antiga. */
  emailHtml: string | null;
  links: LinkDaEdicao[];
  cliquesPorLink: CliqueEmLink[];
}> {
  try {
    const sb = createSupabaseServer();
    const { data: ed } = await sb.from("v_edition_performance").select("*").eq("post_id", postId).limit(1);
    const edition = ed && ed[0] ? coerceEdition(ed[0] as Record<string, unknown>) : null;
    if (!edition) return EDICAO_VAZIA;

    // Engajamento por assinante vem de beehiiv_post_engagement — a API do Beehiiv
    // entrega agregado por post × assinante, não evento avulso. Bots ficam fora,
    // senão o topo da lista é sempre scanner corporativo.
    const [engRes, botRes, linkStatsRes, htmlRes, cliquesRes] = await Promise.all([
      sb
        .from("beehiiv_post_engagement")
        .select("email,status,last_engaged_at,total_clicked,total_opened")
        .eq("post_id", postId)
        .order("total_clicked", { ascending: false })
        .limit(1000),
      sb.from("v_bot_accounts").select("email"),
      sb
        .from("beehiiv_link_stats")
        .select("url,url_hash,total_clicks,unique_clicks,verified_total_clicks,verified_unique_clicks")
        .eq("post_id", postId),
      sb.from("beehiiv_editions").select("email_html").eq("post_id", postId).limit(1),
      sb
        .from("beehiiv_link_clicks")
        .select("url_hash,email,clicks,clicked_at")
        .eq("post_id", postId)
        .order("clicked_at", { ascending: false })
        .limit(1000)
    ]);

    const bots = new Set(
      ((botRes.data ?? []) as Array<{ email: string }>).map((b) => b.email)
    );
    const linkStats = (linkStatsRes.data ?? []) as Array<{
      url: string;
      url_hash: string | null;
      total_clicks: number;
      unique_clicks: number;
      verified_total_clicks: number | null;
      verified_unique_clicks: number | null;
    }>;

    const links: LinkDaEdicao[] = linkStats.map((r) => ({
      url: r.url,
      urlHash: r.url_hash,
      clicks: num(r.total_clicks),
      uniqueClicks: num(r.unique_clicks),
      verifiedClicks: num(r.verified_total_clicks),
      verifiedUniqueClicks: num(r.verified_unique_clicks)
    }));

    const emailHtml =
      ((htmlRes.data ?? [])[0] as { email_html?: string } | undefined)?.email_html ?? null;

    const cliquesPorLink: CliqueEmLink[] = (
      (cliquesRes.data ?? []) as Array<{
        url_hash: string;
        email: string;
        clicks: number;
        clicked_at: string | null;
      }>
    ).map((r) => ({
      urlHash: r.url_hash,
      email: r.email,
      clicks: num(r.clicks),
      clickedAt: r.clicked_at,
      isBot: bots.has(r.email)
    }));

    const topLinks = links
      .map((r) => ({ url: r.url, clicks: r.clicks, uniqueClicks: r.uniqueClicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const engagedLeads = ((engRes.data ?? []) as Array<{
      email: string;
      last_engaged_at: string | null;
      total_clicked: number;
      total_opened: number;
    }>)
      .filter((r) => !bots.has(r.email))
      .map((r) => ({
        email: r.email,
        opened: r.total_opened > 0,
        clicked: r.total_clicked > 0,
        openedAt: r.last_engaged_at
      }))
      .slice(0, 25);

    return { edition, topLinks, engagedLeads, emailHtml, links, cliquesPorLink };
  } catch {
    return EDICAO_VAZIA;
  }
}

export type CategoriaDeLink = {
  categoria: string;
  links: number;
  edicoes: number;
  cliques: number;
  cliquesUnicos: number;
  verificados: number;
  pctVerificado: number | null;
  cliquesPorLink: number | null;
};

/**
 * Desempenho por tipo de destino, não por URL crua. A regra de classificação
 * mora em `beehiiv_link_categorias` (tabela, editável por SQL) e a agregação
 * acontece no Postgres — em JS, host novo entraria como categoria fantasma.
 */
export async function getLinkCategorias(): Promise<CategoriaDeLink[]> {
  try {
    const sb = createSupabaseServer();
    const { data, error } = await sb.from("v_link_performance_categoria").select("*");
    if (error || !data) return [];
    return data.map((r) => {
      const rr = r as Record<string, unknown>;
      return {
        categoria: String(rr.categoria),
        links: num(rr.links),
        edicoes: num(rr.edicoes),
        cliques: num(rr.cliques),
        cliquesUnicos: num(rr.cliques_unicos),
        verificados: num(rr.verificados),
        pctVerificado: rr.pct_verificado == null ? null : Number(rr.pct_verificado),
        cliquesPorLink: rr.cliques_por_link == null ? null : Number(rr.cliques_por_link)
      };
    });
  } catch {
    return [];
  }
}

export async function getLeads(): Promise<LeadEngagement[]> {
  try {
    const sb = createSupabaseServer();
    // O PostgREST corta em 1000 linhas (a base tem 4015). Sem ordenar no servidor
    // a fatia é arbitrária e os leads engajados podem ficar de fora — então a
    // ordenação vai para o Postgres, não para o JS.
    const [{ data, error }, botRes] = await Promise.all([
      sb
        .from("v_lead_engagement")
        .select("*")
        .order("last_engaged_at", { ascending: false, nullsFirst: false })
        .order("editions_opened", { ascending: false })
        .order("total_clicks", { ascending: false })
        .limit(1000),
      // Lista curta (dezenas), então cabe num Set em memória sem risco de corte.
      sb.from("v_bot_accounts").select("email")
    ]);
    if (error || !data) return [];
    const bots = new Set(
      ((botRes.data ?? []) as Array<{ email: string }>).map((b) => b.email)
    );
    return data.map((r) => {
      const lead = coerceLead(r as Record<string, unknown>);
      return { ...lead, isBot: bots.has(lead.email) };
    });
  } catch {
    return [];
  }
}

export async function getEngagement(): Promise<EngagementSnapshot> {
  const empty: EngagementSnapshot = {
    totals: { editions: 0, delivered: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0, avgOpenRate: 0, avgCtr: 0 },
    funnel: { received: 0, openers: 0, clickers: 0, isEstimated: false },
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

    let received = leads.filter((l) => l.editions_received > 0).length;
    let openers = leads.filter((l) => l.editions_opened > 0).length;
    let clickers = leads.filter((l) => l.editions_clicked > 0).length;
    let isEstimated = false;
    if (openers === 0 && editions.length > 0) {
      const avgDelivered = Math.round(delivered / editions.length);
      const avgOpens = Math.round(editions.reduce((a, e) => a + e.unique_opens, 0) / editions.length);
      const avgClicks = Math.round(editions.reduce((a, e) => a + e.unique_clicks, 0) / editions.length);
      received = avgDelivered;
      openers = avgOpens;
      clickers = avgClicks;
      isEstimated = true;
    }

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
      funnel: { received, openers, clickers, isEstimated },
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
    const [leadRes, subRes, interRes, edRes, cliqueRes, linkRes] = await Promise.all([
      sb.from("v_lead_engagement").select("*").eq("email", email).limit(1),
      sb
        .from("beehiiv_events")
        .select("event_type,event_category,received_at,utm_source,utm_campaign,subscription_tier")
        .eq("email", email)
        .order("received_at", { ascending: true })
        .limit(200),
      sb
        .from("beehiiv_post_engagement")
        .select("post_id,status,last_engaged_at,total_clicked,total_opened")
        .eq("email", email)
        .order("last_engaged_at", { ascending: true })
        .limit(500),
      sb.from("beehiiv_editions").select("post_id,edition_number,title,sent_at").eq("status", "sent"),
      sb
        .from("beehiiv_link_clicks")
        .select("post_id,url_hash,clicks,clicked_at")
        .eq("email", email)
        .order("clicked_at", { ascending: false })
        .limit(200),
      // A categoria já sai resolvida do Postgres — classificar host em JS aqui
      // duplicaria a regra que vive em beehiiv_link_categorias.
      sb.from("v_link_categoria_base").select("post_id,url_hash,url,categoria")
    ]);

    // Contexto do deep dive. Roda em paralelo e cada peça falha sozinha: um
    // bloco sem dado some da tela, não derruba a jornada inteira.
    const dominio = email.toLowerCase().split("@")[1] ?? "";
    const [clienteRes, botRes, colegasRes, catRes] = await Promise.all([
      sb.from("v_lead_cliente").select("*").eq("email", email.toLowerCase()).limit(1),
      sb.from("v_bot_accounts").select("*").eq("email", email).limit(1),
      dominio
        ? sb
            .from("v_lead_dominio")
            .select("email,editions_opened,total_clicks,is_bot,last_engaged_at")
            .eq("dominio", dominio)
            .order("total_clicks", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] as unknown[] }),
      sb.from("v_lead_categoria").select("categoria,cliques,links").eq("email", email)
    ]);

    const lead = leadRes.data && leadRes.data[0] ? coerceLead(leadRes.data[0] as Record<string, unknown>) : null;

    const editions = (edRes.data ?? []).map((r) => {
      const rr = r as Record<string, unknown>;
      return { post_id: String(rr.post_id), edition_number: num(rr.edition_number), title: String(rr.title), sent_at: String(rr.sent_at) };
    });

    // Uma linha por (edição × assinante), já agregada pelo Beehiiv. O timestamp é
    // do último engajamento naquela edição — a API não devolve evento a evento.
    const inter = (interRes.data ?? []) as Array<{
      post_id: string;
      status: string;
      last_engaged_at: string | null;
      total_clicked: number;
      total_opened: number;
    }>;
    const byEdition = new Map<
      string,
      { received: boolean; opened: boolean; clicked: boolean; openedAt: string | null; clickedAt: string | null }
    >();
    for (const r of inter) {
      byEdition.set(r.post_id, {
        received: true,
        opened: r.total_opened > 0,
        clicked: r.total_clicked > 0,
        openedAt: r.total_opened > 0 ? r.last_engaged_at : null,
        clickedAt: r.total_clicked > 0 ? r.last_engaged_at : null
      });
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
      const at = r.last_engaged_at ?? ed?.sent_at ?? "";
      if (!at) continue;
      if (r.total_clicked > 0) {
        timeline.push({
          at,
          kind: "clicked",
          label: r.total_clicked === 1 ? "Clicou em link" : `Clicou ${r.total_clicked}×`,
          detail: edLabel
        });
      } else if (r.total_opened > 0) {
        timeline.push({
          at,
          kind: "opened",
          label: r.total_opened === 1 ? "Abriu edição" : `Abriu ${r.total_opened}×`,
          detail: edLabel
        });
      }
      if (r.status === "unsubscribed") {
        timeline.push({ at, kind: "unsubscribed", label: "Descadastrou", detail: edLabel });
      }
    }
    timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    // Liga clique a link pela chave (post_id, url_hash) — a mesma que o mapa de
    // cliques da edição usa.
    const porHash = new Map<string, { url: string; categoria: string }>();
    for (const r of linkRes.data ?? []) {
      const rr = r as Record<string, unknown>;
      if (!rr.url_hash) continue;
      porHash.set(`${String(rr.post_id)}|${String(rr.url_hash)}`, {
        url: String(rr.url),
        categoria: String(rr.categoria ?? "nao classificado")
      });
    }

    const edPorPost = new Map(editions.map((e) => [e.post_id, e]));
    const cliques = ((cliqueRes.data ?? []) as Array<{
      post_id: string;
      url_hash: string;
      clicks: number;
      clicked_at: string | null;
    }>).map((c) => {
      const link = porHash.get(`${c.post_id}|${c.url_hash}`);
      // Sem correspondência em beehiiv_link_stats o url_hash é só um número —
      // mostrar ele cru dá a impressão de dado corrompido. Devolve null e deixa
      // a tela explicar que falta o de-para, que só a MCP do Beehiiv preenche.
      return {
        url: link?.url ?? null,
        categoria: link?.categoria ?? null,
        edition_number: edPorPost.get(c.post_id)?.edition_number ?? null,
        clicks: num(c.clicks),
        clickedAt: c.clicked_at
      };
    });

    const c0 = (clienteRes.data ?? [])[0] as Record<string, unknown> | undefined;
    const cliente = c0
      ? {
          company_name: String(c0.company_name ?? "—"),
          contract_status: (c0.contract_status as string) ?? null,
          plano: (c0.plano as string) ?? null,
          carteira: (c0.carteira as string) ?? null,
          mrr: num(c0.mrr),
          casou_por: String(c0.casou_por ?? "dominio")
        }
      : null;

    const b0 = (botRes.data ?? [])[0] as Record<string, unknown> | undefined;
    const scanner = b0
      ? {
          motivo: String(b0.motivo ?? "scanner"),
          cliques: num(b0.cliques),
          aberturas: num(b0.aberturas),
          razao: num(b0.razao_clique_abertura),
          latencia_mediana_s: b0.latencia_mediana_s == null ? null : num(b0.latencia_mediana_s),
          rajada_links: b0.rajada_links == null ? null : num(b0.rajada_links),
          rajada_janela_s: b0.rajada_janela_s == null ? null : num(b0.rajada_janela_s),
          rajada_latencia_s: b0.rajada_latencia_s == null ? null : num(b0.rajada_latencia_s)
        }
      : null;

    const colegasRaw = ((colegasRes.data ?? []) as Array<{
      email: string;
      editions_opened: number;
      total_clicks: number;
      is_bot: boolean;
      last_engaged_at: string | null;
    }>).map((r) => ({
      email: r.email,
      editions_opened: num(r.editions_opened),
      total_clicks: num(r.total_clicks),
      is_bot: Boolean(r.is_bot),
      last_engaged_at: r.last_engaged_at
    }));

    // Só vira "empresa" com mais de um contato — um assinante sozinho no
    // domínio não é uma conta acompanhando, é ele mesmo.
    const empresa =
      dominio && colegasRaw.length > 1
        ? {
            dominio,
            contatos: colegasRaw.length,
            humanos: colegasRaw.filter((c) => !c.is_bot).length,
            cliquesHumanos: colegasRaw
              .filter((c) => !c.is_bot)
              .reduce((a, c) => a + c.total_clicks, 0),
            colegas: colegasRaw.filter((c) => c.email !== email)
          }
        : null;

    const categorias = ((catRes.data ?? []) as Array<{
      categoria: string;
      cliques: number;
      links: number;
    }>)
      .map((r) => ({ categoria: r.categoria, cliques: num(r.cliques), links: num(r.links) }))
      .sort((a, b) => b.cliques - a.cliques);

    return { lead, perEdition, timeline, cliques, cliente, scanner, empresa, categorias };
  } catch {
    return {
      lead: null,
      perEdition: [],
      timeline: [],
      cliques: [],
      cliente: null,
      scanner: null,
      empresa: null,
      categorias: []
    };
  }
}
