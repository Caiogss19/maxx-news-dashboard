import { createSupabaseServer } from "./supabase-server";
import { createSupabaseLeads } from "./supabase-leads";

/**
 * Aquisição da Maxx News, lida dos dois lados.
 *
 * A régua que separa base migrada de aquisição viva NÃO é `utm_source = 'direct'`:
 * o import trouxe rótulos de UTM históricos da plataforma antiga em 10 sources
 * distintas (meta, google, instagram, whatsapp…). A régua é a DATA — tudo que
 * entrou no primeiro dia de `subscription.created` é import. Ver `v_origem_bloco`.
 *
 * Do lado do Beehiiv, 100% da aquisição pós-import chega como `rd_station/newsletter`,
 * um rótulo único que esconde a campanha. A campanha real vem do projeto Base Leads,
 * extraída da query string de `page_url` em `leads_framer` (views `v_maxxnews_*`).
 */

export type CampanhaRow = {
  fonte: string;
  meio: string;
  campanha: string;
  leads: number;
  de: string;
  ate: string;
};

export type PaginaRow = { pagina: string; form: string; leads: number };

export type LeadRow = {
  criado_em: string;
  email: string;
  form: string;
  pagina: string;
  fonte: string;
  meio: string;
  campanha: string;
};

export type DevolveuRow = {
  criado_em: string;
  email: string;
  converteu_em: string;
  pagina: string | null;
  sinal: string;
};

export type Aquisicao = {
  /** false quando o projeto Base Leads não respondeu — a página degrada em vez de quebrar. */
  temCampanha: boolean;
  /**
   * Só o total. A composição do import (utm_source/campaign da base migrada) vive em
   * `v_import_utm_*` e hoje alimenta apenas o KPI "Top origem do import" da home —
   * a página de aquisição não mostra mais esse recorte.
   */
  importado: { total: number };
  vivo: { total: number };
  resumo: {
    registros: number;
    emailsUnicos: number;
    pagos: number;
    organicos: number;
    diretos: number;
    viaLp: number;
    viaSite: number;
  };
  campanhas: CampanhaRow[];
  paginas: PaginaRow[];
  leads: LeadRow[];
  devolveu: DevolveuRow[];
};

const EMPTY_RESUMO = {
  registros: 0,
  emailsUnicos: 0,
  pagos: 0,
  organicos: 0,
  diretos: 0,
  viaLp: 0,
  viaSite: 0
};

const EMPTY: Aquisicao = {
  temCampanha: false,
  importado: { total: 0 },
  vivo: { total: 0 },
  resumo: EMPTY_RESUMO,
  campanhas: [],
  paginas: [],
  leads: [],
  devolveu: []
};

const num = (v: unknown) => Number(v ?? 0);
const str = (v: unknown) => String(v ?? "");

/** Beehiiv: import vs aquisição viva, e a composição do que foi migrado. */
async function getBloco(): Promise<Pick<Aquisicao, "importado" | "vivo">> {
  try {
    const sb = createSupabaseServer();
    const resumoRes = await sb.from("v_origem_bloco_resumo").select("*");

    const linhas = resumoRes.data ?? [];
    const acha = (b: string) =>
      num(linhas.find((r) => str((r as any).bloco) === b)?.["subs" as never]);

    return {
      importado: { total: acha("import") },
      vivo: { total: acha("pos_import") }
    };
  } catch (err) {
    console.error("Aquisição / bloco de origem:", err);
    return { importado: EMPTY.importado, vivo: EMPTY.vivo };
  }
}

/** Base Leads: a campanha real por trás de cada inscrição. */
async function getCampanha(): Promise<
  Pick<Aquisicao, "temCampanha" | "resumo" | "campanhas" | "paginas" | "leads" | "devolveu">
> {
  const vazio = {
    temCampanha: false,
    resumo: EMPTY_RESUMO,
    campanhas: [],
    paginas: [],
    leads: [],
    devolveu: []
  };

  const sb = createSupabaseLeads();
  if (!sb) {
    console.warn("SUPABASE_LEADS_URL/ANON_KEY ausentes — seção de campanha real fica vazia.");
    return vazio;
  }

  try {
    const [resumoRes, cmpRes, pagRes, leadsRes, devRes] = await Promise.all([
      sb.from("v_maxxnews_resumo").select("*").limit(1),
      sb.from("v_maxxnews_por_campanha").select("*"),
      sb.from("v_maxxnews_por_pagina").select("*"),
      sb.from("v_maxxnews_leads").select("*"),
      sb.from("v_maxxnews_devolveu").select("*")
    ]);

    if (resumoRes.error) throw resumoRes.error;

    const r = (resumoRes.data?.[0] ?? {}) as Record<string, unknown>;

    return {
      temCampanha: true,
      resumo: {
        registros: num(r.registros),
        emailsUnicos: num(r.emails_unicos),
        pagos: num(r.pagos),
        organicos: num(r.organicos),
        diretos: num(r.diretos),
        viaLp: num(r.via_lp),
        viaSite: num(r.via_site)
      },
      campanhas: (cmpRes.data ?? []) as CampanhaRow[],
      paginas: (pagRes.data ?? []) as PaginaRow[],
      leads: (leadsRes.data ?? []) as LeadRow[],
      devolveu: (devRes.data ?? []) as DevolveuRow[]
    };
  } catch (err) {
    console.error("Aquisição / campanha real (Base Leads):", err);
    return vazio;
  }
}

export async function getAquisicao(): Promise<Aquisicao> {
  const [bloco, campanha] = await Promise.all([getBloco(), getCampanha()]);
  return { ...bloco, ...campanha };
}
