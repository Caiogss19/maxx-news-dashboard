"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; sub: string };

const NAV: NavItem[] = [
  { href: "/", label: "Visão geral", sub: "KPIs da news" },
  { href: "/aquisicao", label: "Aquisição", sub: "Origem da base" },
  { href: "/edicoes", label: "Edições", sub: "Desempenho por envio" },
  { href: "/engajamento", label: "Engajamento", sub: "Quem lê de verdade" },
  { href: "/leads", label: "Leads", sub: "Jornada individual" },
  { href: "/clientes", label: "Clientes", sub: "Carteira na news" },
  { href: "/operacao", label: "Operação", sub: "Saúde da integração" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[228px] hidden md:flex flex-col z-40"
      style={{ background: "var(--bg)", borderRight: "1px solid var(--rule)" }}
    >
      {/* ── Marca ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2.5"
        style={{ padding: "20px 20px 18px", borderBottom: "1px solid var(--rule)" }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 30,
            height: 30,
            background: "var(--accent)",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 16
          }}
        >
          S
        </div>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Spark Maxx
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>Maxx News</div>
        </div>
      </div>

      {/* ── Navegação ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "14px 10px" }}>
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="w-full text-left flex flex-col"
              style={{
                gap: 2,
                padding: "9px 12px",
                marginBottom: 2,
                borderRadius: 8,
                background: active ? "var(--bg-soft)" : "transparent",
                borderLeft: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                transition: "background .12s"
              }}
            >
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: active ? "var(--ink)" : "var(--ink-mute)"
                }}
              >
                {item.label}
              </span>
              <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>{item.sub}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Rodapé ────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--rule)", padding: 14 }}>
        <div style={{ fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.5 }}>
          Growth Ops · v0.2
          <br />
          Beehiiv · Supabase · RD
        </div>
      </div>
    </aside>
  );
}

/** Navegação em barra para telas estreitas, onde a sidebar fixa não cabe. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex md:hidden gap-1 overflow-x-auto mb-8 -mx-5 px-5"
      style={{ borderBottom: "1px solid var(--rule)" }}
    >
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap px-3 py-3 -mb-px text-[13px]"
            style={{
              borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
              color: active ? "var(--ink)" : "var(--ink-mute)"
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
