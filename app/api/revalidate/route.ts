import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const TRES_DIAS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Invalida o cache das páginas depois que o sync de 3 dias grava dados novos.
 *
 * Chamado pelo job de engajamento (n8n / agente agendado) e, como rede de
 * segurança, pelo cron diário da Vercel. No plano Hobby o cron só roda 1x/dia,
 * então o handler decide sozinho se já passaram 3 dias desde o último sync —
 * `force=1` pula essa checagem.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET não configurado no ambiente" },
      { status: 500 }
    );
  }

  // Aceita tanto Authorization: Bearer (n8n) quanto o header do Vercel Cron.
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "não autorizado" }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get("force") === "1";

  let ultimoSync: string | null = null;
  if (!force) {
    try {
      const sb = createSupabaseServer();
      const { data } = await sb
        .from("beehiiv_post_engagement")
        .select("synced_at")
        .order("synced_at", { ascending: false })
        .limit(1);
      ultimoSync = (data?.[0] as { synced_at?: string } | undefined)?.synced_at ?? null;

      if (ultimoSync && Date.now() - new Date(ultimoSync).getTime() < TRES_DIAS_MS) {
        return NextResponse.json({
          ok: true,
          revalidated: false,
          motivo: "último sync tem menos de 3 dias",
          ultimoSync
        });
      }
    } catch {
      // Sem leitura do Supabase, revalida mesmo assim — é barato e idempotente.
    }
  }

  revalidatePath("/", "layout");

  return NextResponse.json({
    ok: true,
    revalidated: true,
    force,
    ultimoSync,
    at: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  return handle(req);
}

// O Vercel Cron dispara GET.
export async function GET(req: NextRequest) {
  return handle(req);
}
