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
  const [soComEmpresa, setSoComEmpresa] = useState(false);

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
      if (soComEmpresa && !l.empresa) return false;
      if (!termo) return true;
      return `${l.email} ${l.empresa ?? ""} ${l.pagina} ${l.fonte} ${l.meio} ${l.campanha}`
        .toLowerCase()
        .includes(termo);
    });
  }, [leads, q, fonte, soComEmpresa]);

  // Quantas declararam empresa. É contagem sobre a lista INTEIRA já carregada
  // (não sobre `filtrados`), senão o número mudaria de significado a cada filtro.
  const comEmpresa = useMemo(() => leads.filter((l) => l.empresa).length, [leads]);

  // Quem converteu mais de uma vez. Fica no cabeçalho porque o total de linhas
  // agora conta PESSOA, e sem isso a diferença para `resumo.registros` (que
  // conta conversão) pareceria erro de contagem.
  const repetidos = useMemo(() => leads.filter((l) => l.conversoes > 1).length, [leads]);

  const curta = (url: string) => url.replace(/^https?:\/\/[^/]+/, "") || "/";

  return (
    <div className="paper overflow-hidden">
      <div className="panel-head">
        <h3 className="font-display" style={{ fontSize: 17, fontWeight: 500 }}>
          Os {leads.length} inscritos
        </h3>
        <span className="font-mono-tag">
          {comEmpresa} com empresa
          {repetidos > 0 && ` · ${repetidos} converteram mais de uma vez`} · {filtrados.length} de{" "}
          {leads.length}
        </span>
      </div>

      <div className="p-5 flex flex-wrap gap-2.5 items-center" style={{ borderBottom: "1px solid var(--rule)" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filtrar por e-mail, empresa, campanha, página…"
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
        {comEmpresa > 0 && (
          <button
            type="button"
            onClick={() => setSoComEmpresa((v) => !v)}
            aria-pressed={soComEmpresa}
            className={`pill${soComEmpresa ? " pill-on" : ""}`}
            title="Só as inscrições que declararam empresa no formulário"
          >
            com empresa
          </button>
        )}
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
                <th>Empresa</th>
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
                    {/*
                      A pessoa preencheu a LP mais de uma vez. A linha mostra a
                      conversão mais recente; o selo evita que o agrupamento
                      esconda que houve repetição.
                    */}
                    {l.conversoes > 1 && (
                      <span
                        className="pill ml-2"
                        title={`${l.conversoes} conversões deste e-mail — a data mostrada é a mais recente`}
                      >
                        {l.conversoes}×
                      </span>
                    )}
                  </td>
                  {/*
                    "—" em vez de célula vazia: quem não declarou empresa entrou
                    pelo widget do rodapé (que não pergunta) ou é anterior a
                    25/08/2026. Célula vazia leria como falha de carregamento.
                  */}
                  <td className="text-sm">
                    {l.empresa ?? <span className="text-ink-faint">—</span>}
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
