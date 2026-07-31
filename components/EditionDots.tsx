/**
 * Quadradinhos de recorrência: quantas das N edições o contato engajou.
 * Recorrência distingue hábito de curiosidade — um clique isolado pode ser
 * qualquer coisa, oito são leitura recorrente.
 */
export function EditionDots({
  filled,
  total,
  title
}: {
  filled: number;
  total: number;
  title?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 whitespace-nowrap" title={title}>
      <span className="inline-flex gap-[3px]">
        {Array.from({ length: total }, (_, i) => (
          <i
            key={i}
            className="block"
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              border: `1px solid ${i < filled ? "var(--accent)" : "var(--rule-strong)"}`,
              background: i < filled ? "var(--accent)" : "transparent"
            }}
          />
        ))}
      </span>
      <em className="not-italic font-mono text-xs text-ink-mute">
        {filled} de {total}
      </em>
    </div>
  );
}
