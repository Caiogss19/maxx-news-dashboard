import { createSupabaseServer } from "./supabase-server";

const num = (v: unknown): number => (v == null ? 0 : Number(v));

export type ClienteEngajamento = {
  clientId: number;
  companyName: string;
  tradingName: string | null;
  dominio: string | null;
  contractStatus: string | null;
  plano: string | null;
  carteira: string | null;
  mrr: number;
  assinantes: number;
  assinantesScanner: number;
  assinantesHumanos: number;
  humanosQueAbriram: number;
  humanosQueClicaram: number;
  assinantesChurn: number;
  aberturas: number;
  cliques: number;
  ultimoEngajamento: string | null;
  aberturaPct: number | null;
};

export type TotaisClientes = {
  clientesCarteira: number;
  clientesAtivos: number;
  clientesNaNewsletter: number;
  assinantesDeCliente: number;
  assinantesQueAbriram: number;
  assinantesQueClicaram: number;
  assinantesHumanosTotal: number;
  baseQueAbriu: number;
  baseQueClicou: number;
};

/**
 * A carteira lida em PESSOAS, não em empresas. São duas contagens diferentes e
 * ambas certas: 240 clientes ativos são 1.424 pessoas. Vem de
 * v_client_pessoas_produto, que já dedupe quem é contato de mais de um cliente.
 */
export type PessoasProduto = {
  produto: string;
  clientes: number;
  pessoas: number;
  naNews: number;
  foraDoBeehiiv: number;
  descadastrados: number;
  abriram: number;
  clicaram: number;
  coberturaPct: number | null;
};

export type SnapshotClientes = {
  totais: TotaisClientes;
  clientes: ClienteEngajamento[];
  /** Ativo, na newsletter e ninguém abre. Lista de ação, não métrica. */
  ativosSemAbertura: ClienteEngajamento[];
  /** Ativo e sem ninguém inscrito. A oportunidade óbvia. */
  ativosForaDaNews: ClienteEngajamento[];
  porCarteira: Array<{
    carteira: string;
    clientes: number;
    naNews: number;
    assinantes: number;
    abriram: number;
  }>;
  /** Pessoas da carteira ativa, quebradas por produto (Sprout / Sprout + Signals). */
  pessoasPorProduto: PessoasProduto[];
};

const TOTAIS_ZERO: TotaisClientes = {
  clientesCarteira: 0,
  clientesAtivos: 0,
  clientesNaNewsletter: 0,
  assinantesDeCliente: 0,
  assinantesQueAbriram: 0,
  assinantesQueClicaram: 0,
  assinantesHumanosTotal: 0,
  baseQueAbriu: 0,
  baseQueClicou: 0
};

const VAZIO: SnapshotClientes = {
  totais: TOTAIS_ZERO,
  clientes: [],
  ativosSemAbertura: [],
  ativosForaDaNews: [],
  porCarteira: [],
  pessoasPorProduto: []
};

const ATIVO = "active_contract";

export async function getClientes(): Promise<SnapshotClientes> {
  try {
    const sb = createSupabaseServer();

    // Os totais vêm de view própria porque dois clientes podem dividir o mesmo
    // domínio — somar as linhas da tabela contaria o mesmo assinante duas vezes.
    const [linhasRes, totaisRes, pessoasRes] = await Promise.all([
      sb.from("v_client_engagement").select("*").limit(1000),
      sb.from("v_client_engagement_totais").select("*").limit(1),
      sb.from("v_client_pessoas_produto").select("*").limit(50)
    ]);

    const clientes: ClienteEngajamento[] = (linhasRes.data ?? []).map((r) => {
      const rr = r as Record<string, unknown>;
      return {
        clientId: num(rr.client_id),
        companyName: String(rr.company_name ?? "—"),
        tradingName: (rr.trading_name as string) ?? null,
        dominio: (rr.dominio as string) ?? null,
        contractStatus: (rr.contract_status as string) ?? null,
        plano: (rr.plano as string) ?? null,
        carteira: (rr.carteira as string) ?? null,
        mrr: num(rr.mrr),
        assinantes: num(rr.assinantes),
        assinantesScanner: num(rr.assinantes_scanner),
        assinantesHumanos: num(rr.assinantes_humanos),
        humanosQueAbriram: num(rr.humanos_que_abriram),
        humanosQueClicaram: num(rr.humanos_que_clicaram),
        assinantesChurn: num(rr.assinantes_churn),
        aberturas: num(rr.aberturas),
        cliques: num(rr.cliques),
        ultimoEngajamento: (rr.ultimo_engajamento as string) ?? null,
        aberturaPct: rr.abertura_pct == null ? null : Number(rr.abertura_pct)
      };
    });

    const t = (totaisRes.data ?? [])[0] as Record<string, unknown> | undefined;
    const totais: TotaisClientes = t
      ? {
          clientesCarteira: num(t.clientes_carteira),
          clientesAtivos: num(t.clientes_ativos),
          clientesNaNewsletter: num(t.clientes_na_newsletter),
          assinantesDeCliente: num(t.assinantes_de_cliente),
          assinantesQueAbriram: num(t.assinantes_que_abriram),
          assinantesQueClicaram: num(t.assinantes_que_clicaram),
          assinantesHumanosTotal: num(t.assinantes_humanos_total),
          baseQueAbriu: num(t.base_que_abriu),
          baseQueClicou: num(t.base_que_clicou)
        }
      : TOTAIS_ZERO;

    const ativos = clientes.filter((c) => c.contractStatus === ATIVO);

    const ativosSemAbertura = ativos
      .filter((c) => c.assinantesHumanos >= 3 && c.humanosQueAbriram === 0)
      .sort((a, b) => b.mrr - a.mrr);

    const ativosForaDaNews = ativos
      .filter((c) => c.assinantes === 0)
      .sort((a, b) => b.mrr - a.mrr);

    const mapa = new Map<
      string,
      { carteira: string; clientes: number; naNews: number; assinantes: number; abriram: number }
    >();
    for (const c of ativos) {
      const k = c.carteira ?? "sem carteira";
      const g = mapa.get(k) ?? { carteira: k, clientes: 0, naNews: 0, assinantes: 0, abriram: 0 };
      g.clientes += 1;
      if (c.assinantes > 0) g.naNews += 1;
      g.assinantes += c.assinantesHumanos;
      g.abriram += c.humanosQueAbriram;
      mapa.set(k, g);
    }
    const porCarteira = [...mapa.values()].sort((a, b) => b.clientes - a.clientes);

    const pessoasPorProduto: PessoasProduto[] = (pessoasRes.data ?? [])
      .map((r) => {
        const rr = r as Record<string, unknown>;
        return {
          produto: String(rr.produto ?? "sem produto"),
          clientes: num(rr.clientes),
          pessoas: num(rr.pessoas),
          naNews: num(rr.na_news),
          foraDoBeehiiv: num(rr.fora_do_beehiiv),
          descadastrados: num(rr.descadastrados),
          abriram: num(rr.abriram),
          clicaram: num(rr.clicaram),
          coberturaPct: rr.cobertura_pct == null ? null : Number(rr.cobertura_pct)
        };
      })
      .sort((a, b) => b.pessoas - a.pessoas);

    return {
      totais,
      clientes,
      ativosSemAbertura,
      ativosForaDaNews,
      porCarteira,
      pessoasPorProduto
    };
  } catch {
    return VAZIO;
  }
}
