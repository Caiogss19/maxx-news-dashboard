import { createClient } from "@supabase/supabase-js";

/**
 * Client do projeto "Base Leads" (epkxxiadrevsuopkndej) — onde vive `leads_framer`.
 *
 * Existe separado do `supabase-server` porque a campanha real das inscrições da
 * Maxx News não está no projeto do Beehiiv: de lá, 100% da aquisição viva chega
 * rotulada como `rd_station / newsletter`. A campanha de verdade só existe na
 * query string de `page_url`, do outro lado. Não dá JOIN entre projetos, então a
 * agregação acontece em views (`v_maxxnews_*`) e o dashboard só lê o resultado.
 *
 * SERVER-ONLY. As envs não levam prefixo `NEXT_PUBLIC_` de propósito — a policy
 * `anon_read_leads_framer` libera a tabela de leads inteira, muito além do recorte
 * maxxnews, e uma chave pública iria parar no bundle do browser.
 */
export function createSupabaseLeads() {
  const url = process.env.SUPABASE_LEADS_URL;
  const key = process.env.SUPABASE_LEADS_ANON_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
