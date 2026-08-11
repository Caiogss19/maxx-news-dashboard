/**
 * Atalho do lead no dash para o perfil dele no RD.
 *
 * Aponta sempre para `/api/rd/contato`, nunca direto para o RD: o uuid não está
 * na base e precisa ser resolvido no servidor. A rota redireciona para o perfil
 * quando acha, e para a busca por e-mail quando não acha.
 */
export function RDLink({
  email,
  variant = "icon"
}: {
  email: string;
  variant?: "icon" | "button";
}) {
  const href = `/api/rd/contato?email=${encodeURIComponent(email)}`;
  const comum = {
    href,
    target: "_blank" as const,
    rel: "noopener noreferrer",
    title: `Ver ${email} no RD Station`
  };

  if (variant === "button") {
    return (
      <a
        {...comum}
        className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5"
        style={{
          border: "1px solid var(--rule-strong)",
          borderRadius: 999,
          color: "var(--ink)"
        }}
      >
        ver no RD <Seta />
      </a>
    );
  }

  return (
    <a
      {...comum}
      className="inline-flex items-center text-ink-faint hover:text-ink"
      style={{ padding: "0 2px" }}
      aria-label={`Ver ${email} no RD Station`}
    >
      <Seta />
    </a>
  );
}

function Seta() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M4.5 2h5.5v5.5M10 2L2.5 9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
