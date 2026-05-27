type Props = {
  num: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function Section({ num, eyebrow, title, subtitle, children }: Props) {
  return (
    <section className="py-16 border-t border-rule first:border-t-0">
      <div className="grid grid-cols-12 gap-8 mb-12">
        <div className="col-span-12 md:col-span-2">
          <div className="section-num">{num}</div>
          <div className="font-mono-tag mt-2">{eyebrow}</div>
        </div>
        <div className="col-span-12 md:col-span-10">
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] mb-3">
            {title.split("*").map((part, i) =>
              i % 2 === 1 ? (
                <em key={i} className="font-serif-italic">
                  {part}
                </em>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </h2>
          {subtitle && (
            <p className="text-ink-mute text-lg max-w-3xl leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}
