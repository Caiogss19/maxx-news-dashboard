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
  /**
   * Quantas vezes esta pessoa converteu. Quase sempre 1.
   *
   * `v_maxxnews_leads` devolve uma linha por CONVERSÃO, e a LP aceita dois
   * submits seguidos: em 28/08/2026 havia 11 pessoas repetidas na tela, com
   * intervalos de 13 segundos a 2 minutos. A linha aqui é a pessoa; este número
   * diz quantas conversões ela gerou, para o dado não sumir no agrupamento.
   */
  conversoes: number;
  /**
   * O que a pessoa digitou em "Nome da empresa" no formulário da LP.
   *
   * `null` é resposta legítima e vai continuar sendo: a LP tem DOIS formulários
   * e só o do bloco principal pede empresa — o widget de newsletter do rodapé
   * global também aparece na página, manda o mesmo `page_url` e vira
   * `LP - Maxxnews` sem o campo. Tudo anterior a 25/08/2026 também é null,
   * porque até então o dado era descartado antes de chegar ao banco.
   *
   * NÃO confundir com o "empresa" da aba /engajamento e da ficha do lead: lá
   * empresa é o DOMÍNIO do e-mail, uma dedução. Este é declarado.
   */
  empresa: string | null;
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

/**
 * Teto do de-para de empresa. A base tem ~170 inscrições da Maxx News, então
 * 2000 é folga larga — está aqui porque o PostgREST corta em 1000 SEM ERRO e
 * sem aviso, e um corte silencioso aqui viraria "sem empresa" na tela.
 */
const TETO_EMPRESAS = 2000;

/** Casamento por e-mail entre a view e a tabela: mesma normalização dos dois lados. */
const chaveEmail = (v: unknown) => str(v).trim().toLowerCase();

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
    const [resumoRes, cmpRes, pagRes, leadsRes, devRes, empresaRes] = await Promise.all([
      sb.from("v_maxxnews_resumo").select("*").limit(1),
      sb.from("v_maxxnews_por_campanha").select("*"),
      sb.from("v_maxxnews_por_pagina").select("*"),
      sb.from("v_maxxnews_leads").select("*"),
      sb.from("v_maxxnews_devolveu").select("*"),
      // A empresa declarada NÃO está em `v_maxxnews_leads` — a view foi escrita
      // quando o formulário só pedia e-mail e devolve
      // criado_em/email/form/pagina/fonte/meio/campanha. Enquanto ela não expuser
      // a coluna, o de-para vem da tabela e o casamento é por e-mail aqui.
      //
      // O dia em que a view ganhar `empresa`, esta consulta vira redundante e o
      // `??` abaixo passa a resolver pela view sozinho — dá pra apagar sem tocar
      // no componente.
      sb
        .from("leads_framer")
        .select("email,empresa")
        .ilike("conversion_identifier", "%maxxnews%")
        .not("empresa", "is", null)
        .order("criado_em", { ascending: false })
        .limit(TETO_EMPRESAS)
    ]);

    if (resumoRes.error) throw resumoRes.error;

    const r = (resumoRes.data?.[0] ?? {}) as Record<string, unknown>;

    // Bater no teto significaria de-para incompleto MOSTRADO COMO "sem empresa",
    // que é indistinguível de lead que não declarou. Barulho no log é melhor do
    // que uma coluna vazia que parece dado.
    const linhasEmpresa = (empresaRes.data ?? []) as Array<{ email: string; empresa: string }>;
    if (linhasEmpresa.length >= TETO_EMPRESAS) {
      console.warn(
        `Aquisição: de-para de empresa bateu o teto de ${TETO_EMPRESAS} linhas — ` +
          "há inscrição com empresa fora do mapa. Exponha `empresa` em v_maxxnews_leads."
      );
    }

    const porEmail = new Map<string, string>();
    for (const l of linhasEmpresa) {
      const chave = chaveEmail(l.email);
      const valor = str(l.empresa).trim();
      // A view lista uma linha por CONVERSÃO; quem reinscreveu tem mais de uma.
      // A consulta vem por `criado_em` desc, então o primeiro visto é o mais
      // recente — e é ele que fica.
      if (chave && valor && !porEmail.has(chave)) porEmail.set(chave, valor);
    }

    const porConversao: LeadRow[] = ((leadsRes.data ?? []) as Array<Record<string, unknown>>).map(
      (row) => ({
        criado_em: str(row.criado_em),
        email: str(row.email),
        form: str(row.form),
        pagina: str(row.pagina),
        fonte: str(row.fonte),
        meio: str(row.meio),
        campanha: str(row.campanha),
        conversoes: 1,
        empresa:
          (row.empresa == null ? null : str(row.empresa).trim() || null) ??
          porEmail.get(chaveEmail(row.email)) ??
          null
      })
    );

    // Uma linha por PESSOA, não por conversão.
    //
    // A view lista conversões, e quem clica em enviar duas vezes na LP converte
    // duas vezes — aparecia como inscrição duplicada na tela. O de-duplicador do
    // fluxo RD -> Beehiiv não alcança isto: ele barra o segundo ENVIO ao Beehiiv
    // e escreve em `beehiiv_sync_outbound`, que é outro projeto. Esta lista lê a
    // Base Leads, onde as duas conversões continuam existindo — e devem mesmo,
    // porque `resumo.registros` conta conversão e é assim que a campanha é
    // medida. O agrupamento é só desta tabela.
    //
    // A view já vem `criado_em` desc, então a primeira linha vista é a conversão
    // mais recente e é ela que fica.
    const porLead = new Map<string, LeadRow>();
    for (const linha of porConversao) {
      // Sem e-mail não há como agrupar; `criado_em` mantém a linha única em vez
      // de fundir registros distintos numa chave vazia.
      const chave = chaveEmail(linha.email) || `#${linha.criado_em}`;
      const jaVisto = porLead.get(chave);
      if (!jaVisto) {
        porLead.set(chave, linha);
        continue;
      }
      jaVisto.conversoes += 1;
      // Empresa declarada em UMA das conversões vale para a pessoa: a segunda
      // submissão costuma vir pior preenchida que a primeira.
      if (!jaVisto.empresa && linha.empresa) jaVisto.empresa = linha.empresa;
    }
    const leads = Array.from(porLead.values());

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
      leads,
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
