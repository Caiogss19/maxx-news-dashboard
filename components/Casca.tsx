"use client";

// A casca do app: barra lateral + topo + palco + rodapé, no vocabulário da
// Central. É cliente só por causa do colapso da barra (que mora no
// localStorage); as telas continuam server components, passadas como children.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { LiveIndicator } from "@/components/LiveIndicator";
import { itemAtivo } from "@/lib/nav";

const CHAVE_NAV = "maxxnews:nav-compacta";

export function Casca({ children }: { children: React.ReactNode }) {
  const meta = itemAtivo(usePathname());
  // Lido DEPOIS de montar: ler no useState inicial daria HTML do servidor
  // (expandido) diferente do primeiro render do cliente (compacto).
  const [compacta, setCompacta] = useState(false);
  useEffect(() => {
    try { setCompacta(window.localStorage.getItem(CHAVE_NAV) === "1"); } catch { /* sem storage */ }
  }, []);

  const alternar = () =>
    setCompacta((v) => {
      const novo = !v;
      try { window.localStorage.setItem(CHAVE_NAV, novo ? "1" : "0"); } catch { /* sem storage */ }
      return novo;
    });

  return (
    <div className={`spk-app${compacta ? " spk-app--compacta" : ""}`}>
      <Sidebar compacta={compacta} onAlternarCompacta={alternar} />

      <div className="spk-conteudo nw-coluna">
        <header className="spk-topo">
          <div className="nw-topo__id">
            <span className="nw-topo__ic" aria-hidden="true">
              <meta.icone size={17} />
            </span>
            <div className="nw-topo__txt">
              <h2 className="spk-topo__t">{meta.titulo}</h2>
              <p className="spk-topo__s">{meta.subtitulo}</p>
            </div>
          </div>
          <LiveIndicator />
        </header>

        <main className="nw-main spk-palco">
          <div className="spk-amb" aria-hidden="true" />
          {children}
        </main>

        <footer className="nw-rodape">
          <span>Spark Maxx · Maxx News</span>
          <small>
            Engajamento e rankings a cada 3 dias · inscrições ao vivo · <code>beehiiv_events</code>{" "}
            · <code>beehiiv_post_engagement</code>
          </small>
        </footer>
      </div>
    </div>
  );
}
