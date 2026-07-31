type Props = {
  num: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/**
 * Cabeçalho de seção. O `title` aceita `*trecho*` para dar ênfase — que neste
 * sistema é peso + cor de acento, não mais serifa itálica.
 */
export function Section({ num, eyebrow, title, subtitle, children }: Props) {
  return (
    <section className="pb-14">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="accent-line" />
          <span className="font-mono-tag">
            {num} · {eyebrow}
          </span>
        </div>
        <h1
          className="font-display mb-3"
          style={{ fontSize: "clamp(26px, 3.4vw, 38px)", lineHeight: 1.06, fontWeight: 400 }}
        >
          {title.split("*").map((part, i) =>
            i % 2 === 1 ? (
              <span key={i} className="font-display-em">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </h1>
        {subtitle && (
          <p className="text-ink-mute max-w-3xl leading-relaxed" style={{ fontSize: 15 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}
