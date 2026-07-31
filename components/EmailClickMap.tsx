"use client";

import { useEffect, useRef, useState } from "react";
import { fmtDateTime, truncate } from "@/lib/format";

export type LinkMarcado = {
  idx: number;
  url: string;
  urlHash: string | null;
  clicks: number;
  verifiedClicks: number;
};

export type ClicaramNoLink = {
  urlHash: string;
  email: string;
  clicks: number;
  clickedAt: string | null;
  isBot: boolean;
};

const CORES = ["#6C7075", "#5B9BD5", "#3CCB7F", "#F5B63F", "#FF6B35"];

function faixa(v: number): number {
  if (v <= 0) return 0;
  if (v <= 1) return 1;
  if (v <= 3) return 2;
  if (v <= 6) return 3;
  return 4;
}

function limpar(url: string): string {
  return url.replace(/^https?:\/\//, "").split("?")[0];
}

export function EmailClickMap({
  html,
  marcados,
  cliques,
  foraDoCorpo
}: {
  html: string;
  marcados: LinkMarcado[];
  cliques: ClicaramNoLink[];
  foraDoCorpo: Array<{ url: string; clicks: number; verifiedClicks: number }>;
}) {
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [altura, setAltura] = useState(900);
  const [expandido, setExpandido] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // A newsletter passa de 12.000px. Sem teto, o preview domina a página inteira
  // e some com o resto do dash; então rola por dentro até o usuário expandir.
  const TETO = 720;

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data;
      if (!d || typeof d !== "object") return;
      if (typeof d.cm === "number") setSelecionado(d.cm);
      // Teto para o caso de um e-mail com imagem quebrada reportar altura absurda.
      if (typeof d.cmHeight === "number" && d.cmHeight > 0) {
        setAltura(Math.min(d.cmHeight + 24, 20000));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const link = selecionado != null ? marcados.find((m) => m.idx === selecionado) : null;
  const doLink = link?.urlHash
    ? cliques.filter((c) => c.urlHash === link.urlHash)
    : [];
  const humanos = doLink.filter((c) => !c.isBot);
  const bots = doLink.filter((c) => c.isBot);

  return (
    <div className="paper overflow-hidden">
      <div className="panel-head">
        <h3 className="font-display" style={{ fontSize: 17, fontWeight: 500 }}>
          Mapa de cliques
        </h3>
        <span className="font-mono-tag">
          {marcados.length} links no corpo · calor por clique verificado
        </span>
      </div>

      {/* Legenda: sem ela o gradiente não significa nada. */}
      <div
        className="flex flex-wrap items-center gap-4 px-5 py-3 text-xs text-ink-mute"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        {[
          { c: CORES[0], t: "só robô" },
          { c: CORES[1], t: "1" },
          { c: CORES[2], t: "2–3" },
          { c: CORES[3], t: "4–6" },
          { c: CORES[4], t: "7+" }
        ].map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <i
              className="inline-block"
              style={{ width: 10, height: 10, borderRadius: 2, background: f.c }}
            />
            {f.t}
          </span>
        ))}
        <span className="ml-auto text-ink-faint">clique num link para ver quem clicou</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
        {/* Preview do e-mail.
            sandbox sem allow-same-origin: o script do mapa roda, mas o documento
            fica em origem opaca — sem acesso ao DOM nem aos cookies do dash. Sem
            allow-top-navigation e allow-popups, clique em link não navega. */}
        <div style={{ background: "#fff", position: "relative" }}>
          <div
            style={{
              height: expandido ? altura : Math.min(altura, TETO),
              overflowY: expandido ? "visible" : "auto"
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={html}
              sandbox="allow-scripts"
              title="Preview do e-mail com mapa de cliques"
              scrolling="no"
              style={{ width: "100%", height: altura, border: 0, display: "block" }}
            />
          </div>
          {altura > TETO && (
            <button
              onClick={() => setExpandido((v) => !v)}
              className="absolute left-1/2 -translate-x-1/2 text-xs font-mono px-3 py-1.5"
              style={{
                bottom: 10,
                background: "var(--bg-paper)",
                border: "1px solid var(--rule-strong)",
                borderRadius: 999,
                color: "var(--ink)"
              }}
            >
              {expandido ? "recolher" : `expandir · ${Math.round(altura / 100) / 10}k px`}
            </button>
          )}
        </div>

        {/* Painel lateral */}
        <div style={{ borderLeft: "1px solid var(--rule)" }}>
          {!link ? (
            <div className="p-5">
              <div className="font-mono-tag mb-3">Links por clique verificado</div>
              <div className="space-y-2">
                {[...marcados]
                  .sort((a, b) => b.verifiedClicks - a.verifiedClicks)
                  .slice(0, 12)
                  .map((m) => (
                    <button
                      key={m.idx}
                      onClick={() => setSelecionado(m.idx)}
                      className="w-full text-left flex items-center gap-2"
                      style={{ padding: "4px 0" }}
                    >
                      <i
                        className="shrink-0"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: CORES[faixa(m.verifiedClicks)]
                        }}
                      />
                      <span className="text-xs truncate flex-1" title={m.url}>
                        {truncate(limpar(m.url), 30)}
                      </span>
                      <span className="font-mono text-xs">{m.verifiedClicks}</span>
                      <span className="font-mono text-[11px] text-ink-faint w-7 text-right">
                        {m.clicks}
                      </span>
                    </button>
                  ))}
              </div>
              <p className="text-[11px] text-ink-faint mt-4 leading-snug">
                Verificado à esquerda, bruto em cinza. A diferença entre os dois é
                varredura automática.
              </p>
            </div>
          ) : (
            <div className="p-5">
              <button
                onClick={() => setSelecionado(null)}
                className="text-xs text-ink-mute hover:text-ink mb-3"
              >
                ← todos os links
              </button>
              <div className="text-xs break-all mb-1">{limpar(link.url)}</div>
              <div className="font-mono-tag mb-4">
                {link.verifiedClicks} verificados · {link.clicks} brutos
              </div>

              {!link.urlHash ? (
                <p className="text-xs text-ink-faint leading-snug">
                  Sem detalhamento para este link — o <code>url_hash</code> ainda não
                  foi sincronizado.
                </p>
              ) : doLink.length === 0 ? (
                <p className="text-xs text-ink-faint leading-snug">
                  Ninguém registrado ainda. O detalhamento de quem clicou depende de
                  um sync manual pela MCP do Beehiiv.
                </p>
              ) : (
                <>
                  {humanos.length > 0 && (
                    <div className="mb-4">
                      <div className="font-mono-tag mb-2">
                        {humanos.length} {humanos.length === 1 ? "pessoa" : "pessoas"}
                      </div>
                      {humanos.map((c) => (
                        <div key={c.email} className="mb-2.5">
                          <div className="text-xs break-all">{c.email}</div>
                          <div className="text-[11px] text-ink-faint">
                            {fmtDateTime(c.clickedAt)}
                            {c.clicks > 1 ? ` · ${c.clicks}×` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {bots.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 12 }}>
                      <div className="font-mono-tag mb-2">
                        {bots.length} automatizado{bots.length > 1 ? "s" : ""}
                      </div>
                      {bots.map((c) => (
                        <div key={c.email} className="text-[11px] text-ink-faint mb-1.5">
                          {truncate(c.email, 30)}
                          {c.clicks > 1 ? ` · ${c.clicks}×` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {foraDoCorpo.length > 0 && (
        <div
          className="px-5 py-3.5 text-xs text-ink-mute"
          style={{ borderTop: "1px solid var(--rule)" }}
        >
          <span className="text-ink">{foraDoCorpo.length} links fora do corpo</span> —
          rodapé, descadastro e preferências. Têm clique registrado mas não posição no
          mapa:{" "}
          {foraDoCorpo
            .slice(0, 4)
            .map((l) => `${limpar(l.url)} (${l.clicks})`)
            .join(" · ")}
          {foraDoCorpo.length > 4 ? " …" : ""}
        </div>
      )}
    </div>
  );
}
