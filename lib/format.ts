export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".", ",") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".", ",") + "k";
  return String(n);
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null) return "—";
  return n.toFixed(digits).replace(".", ",") + "%";
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return Math.floor(diff) + "s atrás";
  if (diff < 3600) return Math.floor(diff / 60) + "min atrás";
  if (diff < 86400) return Math.floor(diff / 3600) + "h atrás";
  if (diff < 604800) return Math.floor(diff / 86400) + "d atrás";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function truncate(s: string | null | undefined, n: number): string {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

const EVENT_COLORS: Record<string, string> = {
  subscription: "var(--olive)",
  newsletter_list_subscription: "var(--navy)",
  post: "var(--amber)",
  survey: "var(--plum)"
};

export function categoryColor(cat: string): string {
  return EVENT_COLORS[cat] ?? "var(--ink-mute)";
}
