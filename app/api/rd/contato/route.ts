import { NextRequest, NextResponse } from "next/server";
import { emailEstaNaBase, resolverUuidRD, rdProfileUrl, rdSearchUrl } from "@/lib/rd";

export const dynamic = "force-dynamic";

/**
 * Leva do lead no dash direto para o perfil dele no RD.
 *
 * O uuid não está na base — `beehiiv_sync_outbound` tem apenas 25 dos 4.034
 * assinantes — então ele é resolvido na hora: cache em `rd_contact_status`
 * primeiro, API do RD depois. Se qualquer etapa falhar, redireciona para a busca
 * por e-mail no RD em vez de devolver erro. Botão que não abre nada é pior que
 * botão que abre a lista.
 */
export async function GET(req: NextRequest) {
  const bruto = req.nextUrl.searchParams.get("email") ?? "";
  const email = bruto.toLowerCase().trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ erro: "email ausente ou inválido" }, { status: 400 });
  }

  // Só resolve e-mail que está na nossa base. Sem esta checagem a rota vira um
  // oráculo público de "este e-mail existe no RD?" para qualquer um com a URL.
  if (!(await emailEstaNaBase(email))) {
    return NextResponse.json({ erro: "e-mail fora da base da newsletter" }, { status: 404 });
  }

  const uuid = await resolverUuidRD(email);
  return NextResponse.redirect(uuid ? rdProfileUrl(uuid) : rdSearchUrl(email), 302);
}
