import { createSupabaseServer } from "./supabase-server";

const num = (v: unknown): number => (v == null ? 0 : Number(v));

export type Bloqueado = {
  email: string;
  dominio: string;
  status: string;
  motivo: string;
  deletedAt: string | null;
  recebidas: number;
  abertas: number;
  cliques: number;
  inscritoEm: string | null;
  utmSource: string | null;
  /** Do sync semanal com o RD. null = ainda não checado. */
  rdStatus: string | null;
  rdOptIn: boolean | null;
  rdCheckedAt: string | null;
};

export type DominioEntrega = {
  dominio: string;
  assinantes: number;
  contasScanner: number;
  humanosComEnvio: number;
  humanosQueAbriram: number;
  humanosQueClicaram: number;
  cliquesScanner: number;
  cliquesHumanos: number;
  bloqueados: number;
  aberturaHumanaPct: number | null;
};

export type InternoAuditado = {
  email: string;
  dominio: string;
  cadastrado: boolean;
  pegoPeloFiltro: boolean;
  motivoFiltro: string | null;
  recebidas: number;
  abertas: number;
  cliques: number;
};

export type SnapshotBloqueio = {
  bloqueados: Bloqueado[];
  porMotivo: Array<{ label: string; value: number }>;
  dominios: DominioEntrega[];
  /** Domínios com entrega, sem scanner e com zero abertura humana. */
  suspeitosDeBloqueio: DominioEntrega[];
  internos: InternoAuditado[];
  internosNaoCadastrados: number;
  /** Saiu do Beehiiv mas o RD ainda tem o contato ativo. */
  divergentes: Bloqueado[];
  rdChecados: number;
};

const VAZIO: SnapshotBloqueio = {
  bloqueados: [],
  porMotivo: [],
  dominios: [],
  suspeitosDeBloqueio: [],
  internos: [],
  internosNaoCadastrados: 0,
  divergentes: [],
  rdChecados: 0
};

export async function getBloqueio(): Promise<SnapshotBloqueio> {
  try {
    const sb = createSupabaseServer();

    // Todas as views já saem agregadas e ordenadas do Postgres. Nenhuma passa de
    // algumas centenas de linhas, mas o limit é explícito para que um
    // crescimento futuro apareça como corte visível e não como número errado.
    const [bloqRes, domRes, intRes, rdRes] = await Promise.all([
      sb.from("v_blocked_subscribers").select("*").limit(1000),
      sb.from("v_domain_deliverability").select("*").limit(1000),
      sb.from("v_internal_emails_audit").select("*").limit(500),
      sb.from("rd_contact_status").select("email,rd_status,opt_in,checked_at").limit(1000)
    ]);

    const rdPorEmail = new Map<
      string,
      { rd_status: string | null; opt_in: boolean | null; checked_at: string | null }
    >();
    for (const r of rdRes.data ?? []) {
      const rr = r as Record<string, unknown>;
      rdPorEmail.set(String(rr.email), {
        rd_status: (rr.rd_status as string) ?? null,
        opt_in: (rr.opt_in as boolean) ?? null,
        checked_at: (rr.checked_at as string) ?? null
      });
    }

    const bloqueados: Bloqueado[] = (bloqRes.data ?? []).map((r) => {
      const rr = r as Record<string, unknown>;
      const email = String(rr.email);
      const rd = rdPorEmail.get(email);
      return {
        email,
        dominio: String(rr.dominio ?? ""),
        status: String(rr.status ?? ""),
        motivo: String(rr.motivo ?? ""),
        deletedAt: (rr.deleted_at as string) ?? null,
        recebidas: num(rr.recebidas),
        abertas: num(rr.abertas),
        cliques: num(rr.cliques),
        inscritoEm: (rr.inscrito_em as string) ?? null,
        utmSource: (rr.utm_source as string) ?? null,
        rdStatus: rd?.rd_status ?? null,
        rdOptIn: rd?.opt_in ?? null,
        rdCheckedAt: rd?.checked_at ?? null
      };
    });

    const contagem = new Map<string, number>();
    for (const b of bloqueados) contagem.set(b.motivo, (contagem.get(b.motivo) ?? 0) + 1);
    const porMotivo = [...contagem.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const dominios: DominioEntrega[] = (domRes.data ?? []).map((r) => {
      const rr = r as Record<string, unknown>;
      return {
        dominio: String(rr.dominio ?? ""),
        assinantes: num(rr.assinantes),
        contasScanner: num(rr.contas_scanner),
        humanosComEnvio: num(rr.humanos_com_envio),
        humanosQueAbriram: num(rr.humanos_que_abriram),
        humanosQueClicaram: num(rr.humanos_que_clicaram),
        cliquesScanner: num(rr.cliques_scanner),
        cliquesHumanos: num(rr.cliques_humanos),
        bloqueados: num(rr.bloqueados),
        aberturaHumanaPct: rr.abertura_humana_pct == null ? null : Number(rr.abertura_humana_pct)
      };
    });

    // Recebeu e ninguém abriu, com massa suficiente para não ser acaso. É a
    // assinatura de filtro corporativo comendo a entrega antes do humano ver.
    const suspeitosDeBloqueio = dominios
      .filter((d) => d.humanosComEnvio >= 3 && d.humanosQueAbriram === 0)
      .sort((a, b) => b.humanosComEnvio - a.humanosComEnvio);

    const internos: InternoAuditado[] = (intRes.data ?? []).map((r) => {
      const rr = r as Record<string, unknown>;
      return {
        email: String(rr.email),
        dominio: String(rr.dominio ?? ""),
        cadastrado: Boolean(rr.cadastrado),
        pegoPeloFiltro: Boolean(rr.pego_pelo_filtro),
        motivoFiltro: (rr.motivo_filtro as string) ?? null,
        recebidas: num(rr.recebidas),
        abertas: num(rr.abertas),
        cliques: num(rr.cliques)
      };
    });

    // Saiu do Beehiiv e o RD ainda diz que o contato existe e está opt-in.
    // Sem o job semanal rodado, rdStatus é null e a lista fica vazia — o que é
    // diferente de "não há divergência", e a tela precisa dizer isso.
    const divergentes = bloqueados.filter((b) => b.rdStatus === "existe" && b.rdOptIn !== false);

    return {
      bloqueados,
      porMotivo,
      dominios,
      suspeitosDeBloqueio,
      internos,
      internosNaoCadastrados: internos.filter((i) => !i.cadastrado).length,
      divergentes,
      rdChecados: rdPorEmail.size
    };
  } catch {
    return VAZIO;
  }
}
