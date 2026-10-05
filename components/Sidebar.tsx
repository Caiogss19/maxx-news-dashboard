"use client";

// A barra lateral da Central (`central-leads/src/components/Sidebar.tsx`), com
// as abas deste app. Mesmas classes `spk-nav*` e mesmo colapso; no lugar da
// sessão (a news não tem login) o pé mostra de onde vem o dado.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV, itemAtivo } from "@/lib/nav";

export function Sidebar({
  compacta,
  onAlternarCompacta
}: {
  compacta: boolean;
  onAlternarCompacta: () => void;
}) {
  const ativo = itemAtivo(usePathname());

  return (
    <aside className="spk-nav">
      <div className="spk-nav-topo">
        <div className="spk-marca">S</div>
        {!compacta && (
          <div className="spk-nav-id">
            <div className="spk-nav-marca">Spark Maxx</div>
            <div className="spk-nav-sub">Maxx News</div>
          </div>
        )}
        <button
          type="button"
          className="spk-nav-toggle"
          onClick={onAlternarCompacta}
          aria-pressed={compacta}
          aria-label={compacta ? "Expandir o menu" : "Recolher o menu"}
          title={compacta ? "Expandir o menu" : "Recolher o menu"}
        >
          {compacta ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      <nav className="spk-nav-lista">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo.href === item.href ? "page" : undefined}
            className="spk-navi"
            title={compacta ? `${item.label} — ${item.sub}` : undefined}
          >
            <span className="spk-navi__i">
              <item.icone size={15} />
            </span>
            <span className="spk-navi__c">
              <span className="spk-navi__t">{item.label}</span>
              <span className="spk-navi__s">{item.sub}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="spk-nav-pe">
        <div className="spk-nav-user" style={{ marginTop: 0 }}>
          <span className="spk-pulso" />
          {!compacta && (
            <div className="spk-nav-user__c">
              <div className="spk-nav-user__n" style={{ textTransform: "none" }}>
                Beehiiv · RD · Supabase
              </div>
              <div className="spk-nav-sub" style={{ fontSize: "var(--t-micro)" }}>
                Growth Ops · v0.3
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
