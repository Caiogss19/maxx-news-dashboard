import { createSupabaseServer } from "./supabase-server";

/**
 * Base do perfil de contato no app do RD. Fica em env porque o caminho já mudou
 * entre versões do RD (`/leads/{uuid}` e `/contatos/{uuid}`) — se apontar para o
 * lugar errado, é trocar a variável, não fazer deploy.
 */
const APP_BASE =
  process.env.RD_APP_CONTACT_URL ?? "https://app.rdstation.com.br/contatos";

const API_BASE = "https://api.rd.services";

/** Perfil direto, quando temos o uuid. */
export function rdProfileUrl(uuid: string): string {
  return `${APP_BASE}/${uuid}`;
}

/**
 * Busca por e-mail no app do RD. Cai na lista em vez do perfil, mas não depende
 * de uuid nem de credencial — é o fallback que mantém o botão sempre vivo.
 */
export function rdSearchUrl(email: string): string {
  return `${APP_BASE}?search=${encodeURIComponent(email)}`;
}

/**
 * uuid já resolvido por um sync anterior (`rd_contact_status`, populado pelo job
 * semanal dos bloqueados). Evita ida à API no caso comum.
 */
async function uuidEmCache(email: string): Promise<string | null> {
  try {
    const sb = createSupabaseServer();
    const { data } = await sb
      .from("rd_contact_status")
      .select("rd_uuid")
      .eq("email", email)
      .not("rd_uuid", "is", null)
      .limit(1);
    return ((data ?? [])[0] as { rd_uuid?: string } | undefined)?.rd_uuid ?? null;
  } catch {
    return null;
  }
}

/**
 * Token do RD. Aceita os dois arranjos: um access token fixo no ambiente, ou o
 * trio de OAuth2 que o RD realmente usa (o access token expira em 24h, então em
 * produção é o refresh que vale).
 */
async function tokenRD(): Promise<string | null> {
  const direto = process.env.RD_ACCESS_TOKEN;
  if (direto) return direto;

  const client_id = process.env.RD_CLIENT_ID;
  const client_secret = process.env.RD_CLIENT_SECRET;
  const refresh_token = process.env.RD_REFRESH_TOKEN;
  if (!client_id || !client_secret || !refresh_token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id, client_secret, refresh_token }),
      cache: "no-store"
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { access_token?: string };
    return j.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve o uuid do contato no RD a partir do e-mail. Cache primeiro, API depois.
 * Devolve null em qualquer falha — quem chama cai na busca por e-mail.
 */
export async function resolverUuidRD(email: string): Promise<string | null> {
  const cache = await uuidEmCache(email);
  if (cache) return cache;

  const token = await tokenRD();
  if (!token) return null;

  try {
    const res = await fetch(
      `${API_BASE}/platform/contacts/email:${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const j = (await res.json()) as { uuid?: string };
    return j.uuid ?? null;
  } catch {
    return null;
  }
}

/**
 * O e-mail existe na base da newsletter? A rota `/api/rd/contato` só resolve
 * para quem passa aqui — sem isso o dash viraria um proxy de consulta ao RD
 * para qualquer e-mail que alguém digitasse na URL.
 */
export async function emailEstaNaBase(email: string): Promise<boolean> {
  try {
    const sb = createSupabaseServer();
    const { data } = await sb
      .from("v_lead_engagement")
      .select("email")
      .eq("email", email)
      .limit(1);
    return (data ?? []).length > 0;
  } catch {
    return false;
  }
}
