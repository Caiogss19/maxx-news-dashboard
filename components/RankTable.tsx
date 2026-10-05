import React from "react";

export type RankColumn<T> = {
  header: string;
  /** Alinha à direita e usa tabular-nums. */
  num?: boolean;
  render: (row: T, index: number) => React.ReactNode;
};

/**
 * Tabela de ranking com posição na primeira coluna. Usa a `.editorial` do
 * globals.css para herdar régua, hover e cabeçalho do sistema.
 */
export function RankTable<T>({
  title,
  caption,
  rows,
  columns,
  empty = "Sem dados ainda.",
  footnote
}: {
  title: string;
  caption?: string;
  rows: T[];
  columns: RankColumn<T>[];
  empty?: string;
  footnote?: React.ReactNode;
}) {
  return (
    <div className="paper overflow-hidden">
      <div className="panel-head">
        <h3 className="nw-painel-t">
          {title}
        </h3>
        {caption && <span className="font-mono-tag">{caption}</span>}
      </div>

      {rows.length === 0 ? (
        <p className="text-ink-faint text-sm py-10 text-center">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="editorial">
            <thead>
              <tr>
                <th className="num" style={{ width: 40 }}>
                  #
                </th>
                {columns.map((c, i) => (
                  <th key={i} className={c.num ? "num" : undefined}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="num text-ink-faint">{idx + 1}</td>
                  {columns.map((c, i) => (
                    <td key={i} className={c.num ? "num" : undefined}>
                      {c.render(row, idx)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {footnote && (
        <div
          className="text-xs text-ink-mute px-5 py-3.5"
          style={{ borderTop: "1px solid var(--rule)" }}
        >
          {footnote}
        </div>
      )}
    </div>
  );
}

/** Célula "quem": nome/handle em cima, e-mail em mono embaixo. */
export function Who({ email }: { email: string }) {
  const [local, domain] = email.split("@");
  return (
    <div style={{ minWidth: 190 }}>
      <b style={{ fontWeight: 600, display: "block" }}>{local}</b>
      <span className="font-mono text-xs text-ink-mute" style={{ wordBreak: "break-all" }}>
        @{domain}
      </span>
    </div>
  );
}
