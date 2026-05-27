"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Visão geral" },
  { href: "/funil", label: "Funil" },
  { href: "/crescimento", label: "Crescimento" },
  { href: "/origem", label: "Origem" },
  { href: "/edicoes", label: "Edições" },
  { href: "/engajamento", label: "Engajamento" },
  { href: "/leads", label: "Leads" },
  { href: "/eventos", label: "Eventos" },
  { href: "/saude", label: "Saúde" },
  { href: "/conteudo", label: "Conteúdo" },
  { href: "/atividade", label: "Atividade" }
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-rule mb-10 -mx-6 px-6 md:mx-0 md:px-0">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap px-3 py-3 -mb-px border-b-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
              active
                ? "border-ink text-ink"
                : "border-transparent text-ink-mute hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
