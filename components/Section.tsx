type Props = {
  num: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/**
 * Cabeçalho de seção: o `Cabecalho` da Central (ponto quadrado, rótulo, régua,
 * número em mono à direita) em cima de um título grande. O `title` aceita
 * `*trecho*` para dar ênfase — que neste sistema é a cor da marca, não itálico.
 */
export function Section({ num, eyebrow, title, subtitle, children }: Props) {
  return (
    <section className="nw-secao">
      <header className="nw-secao__h">
        <div className="spk-cab" style={{ ["--ac" as string]: "var(--crimson)" }}>
          <span className="spk-cab__d" />
          <span className="spk-cab__t">{eyebrow}</span>
          <span className="spk-cab__r" />
          <span className="spk-cab__n">{num}</span>
        </div>
        <h1 className="nw-secao__t">
          {title.split("*").map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : <span key={i}>{part}</span>))}
        </h1>
        {subtitle && <p className="nw-secao__s">{subtitle}</p>}
      </header>
      <div>{children}</div>
    </section>
  );
}
