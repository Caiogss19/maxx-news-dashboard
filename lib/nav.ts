// Inventário das abas: caminho, menu e topo num lugar só (como `abas.ts` do
// Mailing e `rotas.ts` da Central).
import {
  Activity,
  Building2,
  LayoutDashboard,
  MousePointerClick,
  Newspaper,
  Route,
  UserPlus,
  type LucideIcon
} from "lucide-react";

export type ItemNav = {
  href: string;
  label: string;
  sub: string;
  icone: LucideIcon;
  titulo: string;
  subtitulo: string;
};

export const NAV: ItemNav[] = [
  { href: "/", label: "Visão geral", sub: "KPIs da news", icone: LayoutDashboard,
    titulo: "Visão geral", subtitulo: "A base, o engajamento e a saúde da integração Beehiiv ↔ RD Station" },
  { href: "/aquisicao", label: "Aquisição", sub: "origem da base", icone: UserPlus,
    titulo: "Aquisição", subtitulo: "De onde vêm os inscritos e quem entrou pelo formulário da Maxx News" },
  { href: "/edicoes", label: "Edições", sub: "desempenho por envio", icone: Newspaper,
    titulo: "Edições", subtitulo: "Entregas, aberturas e cliques de cada disparo da newsletter" },
  { href: "/engajamento", label: "Engajamento", sub: "quem lê de verdade", icone: MousePointerClick,
    titulo: "Engajamento", subtitulo: "Quem abre, quem clica e quais empresas leem a news" },
  { href: "/leads", label: "Leads", sub: "jornada individual", icone: Route,
    titulo: "Leads", subtitulo: "A linha do tempo de cada inscrito, do primeiro contato ao último clique" },
  { href: "/clientes", label: "Clientes", sub: "carteira na news", icone: Building2,
    titulo: "Clientes", subtitulo: "A carteira da Spark que recebe e lê a newsletter" },
  { href: "/operacao", label: "Operação", sub: "saúde da integração", icone: Activity,
    titulo: "Operação", subtitulo: "Sync RD → Beehiiv, eventos e falhas da integração" }
];

export function itemAtivo(pathname: string): ItemNav {
  return (
    NAV.find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href))) ?? NAV[0]
  );
}
