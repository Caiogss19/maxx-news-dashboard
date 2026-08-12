import { createSupabaseServer } from "./supabase-server";

const num = (v: unknown): number => (v == null ? 0 : Number(v));
const str = (v: unknown): string => (v == null ? "" : String(v));

export type BotAccount = {
  email: string;
  edicoes: number;
  cliques: number;
  aberturas: number;
  razao: number;
  latenciaMedianaS: number;
  motivo: string;
  /**
   * Evidência de rajada: maior número de links distintos abertos numa mesma
   * edição, a janela em que isso aconteceu e quanto tempo depois do envio.
   * Null em conta pega por outro sinal (interna ou inflador de abertura).
   */
  rajadaLinks: number | null;
  rajadaJanelaS: number | null;
  rajadaLatenciaS: number | null;
};

export type EditionRank = {
  postId: string;
  editionNumber: number;
  title: string;
  sentAt: string;
  openRate: number;
  ctr: number;
  uniqueClicks: number;
  cliquesHumanos: number;
  posAbertura: number;
  posCtr: number;
};

export type LeadRank = {
  email: string;
  dominio: string;
  edicoesClicadas: number;
  cliques: number;
  aberturas: number;
  ultimoEngajamento: string | null;
  utmSource: string | null;
};

export type CompanyRank = {
  dominio: string;
  contatos: number;
  edicoesComClique: number;
  cliques: number;
};

export type SourceRank = {
  origem: string;
  leads: number;
  leadsQueClicaram: number;
  cliques: number;
  pctClicou: number;
};

export type SendHourRank = {
  faixa: string;
  edicoes: number;
  aberturaMedia: number;
  ctrMedio: number;
};

export type HourPoint = { hour: number; engajamentos: number; cliques: number };

export type Rankings = {
  totals: {
    edicoes: number;
    contatosBrutos: number;
    contatosHumanos: number;
    cliquesBrutos: number;
    cliquesHumanos: number;
    pctHumano: number;
  };
  edicoes: EditionRank[];
  leads: LeadRank[];
  empresas: CompanyRank[];
  origens: SourceRank[];
  horaDisparo: SendHourRank[];
  horaEngajamento: HourPoint[];
  bots: BotAccount[];
};

const EMPTY: Rankings = {
  totals: {
    edicoes: 0,
    contatosBrutos: 0,
    contatosHumanos: 0,
    cliquesBrutos: 0,
    cliquesHumanos: 0,
    pctHumano: 0
  },
  edicoes: [],
  leads: [],
  empresas: [],
  origens: [],
  horaDisparo: [],
  horaEngajamento: [],
  bots: []
};

/**
 * Todos os rankings vêm de views já agregadas e ordenadas no Postgres — o mesmo
 * padrão do commit que corrigiu o teto de 1000 linhas do PostgREST. Nada aqui
 * lê linha crua nem ordena em JS.
 */
export async function getRankings(): Promise<Rankings> {
  try {
    const sb = createSupabaseServer();

    const [edRes, leadRes, coRes, srcRes, sendHourRes, hourRes, botRes] = await Promise.all([
      sb.from("v_edition_ranking").select("*"),
      sb.from("v_lead_ranking").select("*").eq("is_bot", false).limit(40),
      sb.from("v_company_ranking").select("*").limit(25),
      sb.from("v_source_engagement").select("*").limit(12),
      sb.from("v_send_hour_performance").select("*"),
      sb.from("v_engagement_hour_human").select("*"),
      sb.from("v_bot_accounts").select("*")
    ]);

    const edicoes: EditionRank[] = (edRes.data ?? []).map((r) => {
      const x = r as Record<string, unknown>;
      return {
        postId: str(x.post_id),
        editionNumber: num(x.edition_number),
        title: str(x.title),
        sentAt: str(x.sent_at),
        openRate: num(x.open_rate),
        ctr: num(x.ctr),
        uniqueClicks: num(x.unique_clicks),
        cliquesHumanos: num(x.cliques_humanos),
        posAbertura: num(x.pos_abertura),
        posCtr: num(x.pos_ctr)
      };
    });

    const leads: LeadRank[] = (leadRes.data ?? []).map((r) => {
      const x = r as Record<string, unknown>;
      return {
        email: str(x.email),
        dominio: str(x.dominio),
        edicoesClicadas: num(x.edicoes_clicadas),
        cliques: num(x.cliques),
        aberturas: num(x.aberturas),
        ultimoEngajamento: (x.ultimo_engajamento as string) ?? null,
        utmSource: (x.utm_source as string) ?? null
      };
    });

    const bots: BotAccount[] = (botRes.data ?? []).map((r) => {
      const x = r as Record<string, unknown>;
      return {
        email: str(x.email),
        edicoes: num(x.edicoes),
        cliques: num(x.cliques),
        aberturas: num(x.aberturas),
        razao: num(x.razao_clique_abertura),
        latenciaMedianaS: num(x.latencia_mediana_s),
        motivo: str(x.motivo),
        rajadaLinks: x.rajada_links == null ? null : num(x.rajada_links),
        rajadaJanelaS: x.rajada_janela_s == null ? null : num(x.rajada_janela_s),
        rajadaLatenciaS: x.rajada_latencia_s == null ? null : num(x.rajada_latencia_s)
      };
    });

    const empresas: CompanyRank[] = (coRes.data ?? []).map((r) => {
      const x = r as Record<string, unknown>;
      return {
        dominio: str(x.dominio),
        contatos: num(x.contatos),
        edicoesComClique: num(x.edicoes_com_clique),
        cliques: num(x.cliques)
      };
    });

    const origens: SourceRank[] = (srcRes.data ?? []).map((r) => {
      const x = r as Record<string, unknown>;
      return {
        origem: str(x.origem),
        leads: num(x.leads),
        leadsQueClicaram: num(x.leads_que_clicaram),
        cliques: num(x.cliques),
        pctClicou: num(x.pct_clicou)
      };
    });

    const horaDisparo: SendHourRank[] = (sendHourRes.data ?? []).map((r) => {
      const x = r as Record<string, unknown>;
      return {
        faixa: str(x.faixa),
        edicoes: num(x.edicoes),
        aberturaMedia: num(x.abertura_media),
        ctrMedio: num(x.ctr_medio)
      };
    });

    const horaEngajamento: HourPoint[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      engajamentos: 0,
      cliques: 0
    }));
    for (const r of hourRes.data ?? []) {
      const x = r as Record<string, unknown>;
      const h = num(x.hour);
      if (h >= 0 && h < 24) {
        horaEngajamento[h] = {
          hour: h,
          engajamentos: num(x.engajamentos),
          cliques: num(x.cliques)
        };
      }
    }

    const cliquesBrutos = edicoes.reduce((a, e) => a + e.uniqueClicks, 0);
    const cliquesHumanos = edicoes.reduce((a, e) => a + e.cliquesHumanos, 0);
    const cliquesTotaisBrutos =
      cliquesHumanos + bots.reduce((a, b) => a + b.cliques, 0);

    return {
      totals: {
        edicoes: edicoes.length,
        contatosBrutos: leads.length + bots.length,
        contatosHumanos: leads.length,
        cliquesBrutos: cliquesTotaisBrutos || cliquesBrutos,
        cliquesHumanos,
        pctHumano:
          cliquesTotaisBrutos > 0
            ? Math.round((cliquesHumanos / cliquesTotaisBrutos) * 1000) / 10
            : 0
      },
      edicoes,
      leads,
      empresas,
      origens,
      horaDisparo,
      horaEngajamento,
      bots
    };
  } catch (err) {
    console.error("Rankings error:", err);
    return EMPTY;
  }
}
