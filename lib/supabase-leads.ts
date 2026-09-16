import { createClient } from "@supabase/supabase-js";

/**
 * Client do projeto "Base Leads" (epkxxiadrevsuopkndej) — onde vivem
 * `leads_framer` e as views `v_maxxnews_*`.
 *
 * Existe separado do `supabase-server` porque a campanha real das inscrições da
 * Maxx News não está no projeto do Beehiiv: de lá, 100% da aquisição viva chega
 * rotulada como `rd_station / newsletter`. A campanha de verdade só existe na
 * query string de `page_url`, do outro lado. Não dá JOIN entre projetos, então a
 * agregação acontece em views (`v_maxxnews_*`) e o dashboard só lê o resultado.
 *
 * SERVER-ONLY. Nenhuma destas envs leva prefixo `NEXT_PUBLIC_`, de propósito.
 *
 * ── POR QUE A SERVICE ROLE, E NÃO A ANON (16/09/2026) ────────────────────────
 *
 * Este arquivo já avisava que "a policy `anon_read_leads_framer` libera a tabela
 * de leads inteira, muito além do recorte maxxnews". O aviso estava certo e a
 * conta chegou: medido com `SET ROLE anon`, o papel anônimo lia as 2.728 linhas
 * de `leads_framer` — 2.728 e-mails, 2.136 telefones, 2.142 nomes — e mais 583
 * e-mails pelas `v_maxxnews_*`. A mesma chave anônima vai no bundle do browser
 * da Central de Leads, então qualquer visitante de leads.sparkmaxx.com podia
 * pegá-la do JS e ler tudo pelo PostgREST.
 *
 * O conserto do lado do banco é revogar o `anon` (migração 0043 da central-leads).
 * Só que este dashboard é o ÚNICO consumidor legítimo: `pg_stat_statements`
 * registrou 102.694 execuções como `anon` em `leads_framer`, sendo 43.358 de
 * `SELECT *` na tabela inteira, mais 286 nas views. Revogar sem trocar a chave
 * aqui derruba a /aquisicao e a jornada — trocaria um vazamento por uma queda.
 *
 * Então a ordem é: esta mudança primeiro, `SUPABASE_LEADS_SERVICE_ROLE_KEY` no
 * ambiente, e só então a revogação lá.
 *
 * A service role é segura AQUI e não seria no browser: os dois chamadores
 * (`lib/aquisicao.ts`, `lib/analytics.ts`) rodam em server component, e sem
 * `NEXT_PUBLIC_` o Next nunca embute a variável no bundle do cliente.
 */
export function createSupabaseLeads() {
  const url = process.env.SUPABASE_LEADS_URL;

  // A service role é a chave CERTA; a anon é a de transição, e vai parar de
  // funcionar assim que a revogação for aplicada do outro lado.
  const servico = process.env.SUPABASE_LEADS_SERVICE_ROLE_KEY;
  const anon = process.env.SUPABASE_LEADS_ANON_KEY;
  const key = servico || anon;

  if (!url || !key) return null;

  if (!servico) {
    // Barulhento de propósito. O silêncio aqui é o que faria a /aquisicao
    // aparecer vazia sem ninguém entender por quê, no dia da revogação.
    console.warn(
      "[base-leads] usando a chave ANÔNIMA. Ela lê PII muito além do recorte maxxnews " +
        "e vai ser revogada (central-leads, migração 0043). Defina SUPABASE_LEADS_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * A chave em uso é a definitiva? Serve para a tela dizer POR QUE está vazia em
 * vez de mostrar um zero que parece dado.
 */
export function leadsUsandoServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_LEADS_SERVICE_ROLE_KEY);
}
