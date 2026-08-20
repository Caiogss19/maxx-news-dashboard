"use client";

import { useMemo, useState } from "react";
import type { LeadRow } from "@/lib/aquisicao";
import { fmtDateTime } from "@/lib/format";

/**
 * Tabela lead a lead das inscrições da Maxx News, com filtro em memória.
 *
 * Não reusa `LeadSearch`: aquela navega via router para `/leads?q=`, que é outra
 * rota e outro conjunto de dados. Aqui são ~170 linhas já carregadas — filtrar no
 * cliente evita round-trip e mantém os chips instantâneos.
 */
export function MaxxnewsLeads({ leads }: { leads: LeadRow[] }) {
  const [q, setQ] = useState("");
  const [fonte, setFonte] = useState("");

  // Chips saem dos dados, não de uma lista fixa — campanha nova aparece sozinha.
  const fontes = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of leads) m.set(l.fonte, (m.get(l.fonte) ?? 0) + 1);
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([f]) => f);
  }, [leads]);

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (fonte && l.fonte !== fonte) return false;
      if (!termo) return true;
      return `${l.email} ${l.pagina} ${l.fonte} ${l.meio} ${l.campanha}`
        .toLowerCase()
        .includes(termo);
    });
  }, [leads, q, fonte]);

  const curta = (url: string) => url.replace(/^https?:\/\/[^/]+/, "") || "/";

  return (
    <div className="paper overflow-hidden">
      <div className="panel-head">
        <h3 className="font-display" style={{ fontSize: 17, fontWeight: 500 }}>
          As {leads.length} inscrições
        </h3>
        <span className="font-mono-tag">
          {filtrados.length} de {leads.length}
        </span>
      </div>

      <div className="p-5 flex flex-wrap gap-2.5 items-center" style={{ borderBottom: "1px solid var(--rule)" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filtrar por e-mail, campanha, página…"
          aria-label="Filtrar inscrições"
          className="flex-1 bg-bg-paper border border-rule rounded-sm px-4 py-2 text-sm font-mono outline-none focus:border-rule-strong transition"
          style={{ minWidth: 220 }}
        />
        <button
          type="button"
          onClick={() => setFonte("")}
          aria-pressed={fonte === ""}
          className={`pill${fonte === "" ? " pill-on" : ""}`}
        >
          todas
        </button>
        {fontes.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFonte(f)}
            aria-pressed={fonte === f}
            className={`pill${fonte === f ? " pill-on" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="text-ink-faint text-sm py-12 text-center">Nenhuma inscrição com esse filtro.</p>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: 620 }}>
          <table className="editorial">
            <thead>
              <tr>
                <th>Data</th>
                <th>E-mail</th>
                <th>Form.</th>
                <th>Página de captura</th>
                <th>Fonte</th>
                <th>Campanha</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l, i) => (
                <tr key={`${l.email}-${l.criado_em}-${i}`}>
                  <td className="num text-xs whitespace-nowrap">{fmtDateTime(l.criado_em)}</td>
                  <td className="font-mono text-xs" style={{ wordBreak: "break-all" }}>
                    {l.email}
                  </td>
                  <td>
                    <span className="pill">{l.form}</span>
                  </td>
                  <td className="font-mono text-xs text-ink-mute" style={{ wordBreak: "break-all" }}>
                    {curta(l.pagina)}
                  </td>
                  <td className="text-sm">{l.fonte}</td>
                  <td className="font-mono text-xs text-ink-mute">{l.campanha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
