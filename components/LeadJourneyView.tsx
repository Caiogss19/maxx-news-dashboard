import Link from "next/link";
import type { LeadJourney } from "@/lib/analytics";
import { KPI } from "@/components/KPI";
import { RDLink } from "@/components/RDLink";
import { fmtPct, fmtNum, fmtDate, fmtDateTime, truncate, categoryColor } from "@/lib/format";
import { Inbox, MailOpen, MousePointerClick, Pointer } from "lucide-react";

/** Latência de scanner vem em segundos e quase sempre abaixo de 10 min. */
function fmtLatencia(s: number | null): string {
  if (s == null) return "—";
  if (s < 90) return `${Math.round(s)}s`;
  if (s < 5400) return `${Math.round(s / 60)} min`;
  return `${Math.round(s / 3600)} h`;
}

/** Tira protocolo e query pra caber na coluna sem virar sopa de UTM. */
function limparUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").split("?")[0];
}

const KIND_COLOR: Record<string, string> = {
  subscription: "var(--navy)",
  survey: "var(--plum)",
  delivered: "var(--ink-faint)",
  opened: "var(--olive)",
  clicked: "var(--amber)",
  unsubscribed: "var(--danger)",
  bounced: "var(--danger)"
};

export function LeadJourneyView({ email, journey }: { email: string; journey: LeadJourney }) {
  const { lead, perEdition, timeline, cliques, cliente, scanner, empresaDeclarada, empresa, categorias } =
    journey;
  const totalCategoria = categorias.reduce((a, c) => a + c.cliques, 0);
  const semDeParaUrl = cliques.filter((c) => !c.url).length;

  // Quantas edições com clique têm detalhamento, contra quantas o agregado diz
  // que existem. Sem esta conta a tabela mostra "1 link" para quem clicou em 3
  // edições e passa a impressão de que o resto não aconteceu.
  const edicoesDetalhadas = new Set(
    cliques.map((c) => c.edition_number).filter((n): n is number => n != null)
  ).size;
  const edicoesSemDetalhe = Math.max(0, (lead?.editions_clicked ?? 0) - edicoesDetalhadas);

  if (!lead) {
    return (
      <div className="paper p-10 text-center">
        <p className="text-ink-mute">
          Nenhum lead encontrado para <span className="font-mono text-ink">{email}</span>.
        </p>
        <Link href="/leads" className="spk-btn spk-btn--fantasma spk-btn--pequeno mt-4">
          ← Voltar ao diretório
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono-tag mb-1">Jornada do lead</div>
          <div className="nw-secao__t" style={{ fontSize: "var(--t-display)" }}>{lead.email}</div>
          {/*
            A empresa que a pessoa DIGITOU no formulário. Fica junto do e-mail
            porque é identidade, não análise — e porque é o único lugar da ficha
            onde "empresa" não é dedução: o bloco lá embaixo agrupa por domínio e
            o de cliente vem da carteira CustomerX. O rótulo diz de onde veio,
            senão as três viram a mesma coisa aos olhos de quem lê.
          */}
          {empresaDeclarada && (
            <div className="text-sm mt-1">
              <span className="text-ink">{empresaDeclarada.nome}</span>
              <span className="text-ink-faint">
                {" "}
                · informada no formulário ({empresaDeclarada.conversao}
                {empresaDeclarada.em ? `, ${fmtDate(empresaDeclarada.em)}` : ""})
              </span>
            </div>
          )}
          <div className="text-sm text-ink-mute mt-1">
            {lead.utm_source ? `Origem: ${lead.utm_source}` : "Origem desconhecida"}
            {lead.utm_campaign ? ` · ${lead.utm_campaign}` : ""}
            {lead.tier === "premium" ? " · premium" : ""}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lead.churned ? (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-danger-soft text-danger">churn</span>
          ) : lead.confirmed ? (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-olive-soft text-olive">ativo</span>
          ) : (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-soft text-amber">pendente</span>
          )}
          <RDLink email={lead.email} variant="button" />
          <Link href="/leads" className="spk-btn spk-btn--fantasma spk-btn--pequeno">
            ← Diretório
          </Link>
        </div>
      </div>

      {/* Vem antes dos KPIs de propósito: sem este aviso, 42 cliques de um
          filtro corporativo são lidos como interesse altíssimo. */}
      {scanner && (
        <div
          className="paper p-5"
          style={{ borderLeft: "3px solid var(--amber)" }}
        >
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <h3 className="nw-painel-t">
              Os números deste contato não medem interesse
            </h3>
            <span className="font-mono-tag">motivo: {scanner.motivo}</span>
          </div>
          <p className="text-sm text-ink-mute leading-snug max-w-3xl">
            O endereço foi classificado como varredura automática — filtro de segurança
            corporativa que abre a mensagem e visita cada link para checar ameaças. Ele fica
            fora de todos os rankings do painel. A pessoa por trás pode ser leitora real; o
            que se perde é a capacidade de medir isso por clique.
          </p>
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <div className="font-mono-tag">Cliques / aberturas</div>
              <div className="num-display text-xl mt-0.5">
                {scanner.cliques} / {scanner.aberturas}
              </div>
            </div>
            <div>
              <div className="font-mono-tag">Razão</div>
              <div className="num-display text-xl mt-0.5">{scanner.razao.toFixed(2)}</div>
            </div>
            <div>
              <div className="font-mono-tag">Latência mediana</div>
              <div className="num-display text-xl mt-0.5">
                {fmtLatencia(scanner.latencia_mediana_s)}
              </div>
              <div className="text-[11px] text-ink-faint">humano leva horas</div>
            </div>
            {scanner.rajada_links != null && (
              <div>
                <div className="font-mono-tag">Maior rajada</div>
                <div className="num-display text-xl mt-0.5">
                  {scanner.rajada_links} links / {scanner.rajada_janela_s}s
                </div>
                <div className="text-[11px] text-ink-faint">
                  {fmtLatencia(scanner.rajada_latencia_s)} após o envio
                </div>
              </div>
            )}
          </div>
          {scanner.rajada_links != null && (
            <p className="text-[11px] text-ink-faint mt-4 leading-snug max-w-3xl">
              A rajada é a prova mais direta: {scanner.rajada_links} destinos distintos abertos
              em {scanner.rajada_janela_s} segundos. Leitor humano escolhe o que abrir e volta
              ao longo de horas — varredura abre tudo de uma vez.
            </p>
          )}
        </div>
      )}

      {/* Contexto comercial: é conta da carteira ou prospect? */}
      {cliente && (
        <div className="paper p-5" style={{ borderLeft: "3px solid var(--crimson)" }}>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h3 className="nw-painel-t">
              {cliente.company_name}
              {cliente.contract_status === "active_contract" ? (
                <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-olive-soft text-olive align-middle">
                  cliente ativo
                </span>
              ) : (
                <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-bg-soft text-ink-mute align-middle">
                  {cliente.contract_status === "contract_canceled" ? "cancelado" : "sem contrato ativo"}
                </span>
              )}
            </h3>
            <span className="font-mono-tag">
              casou por {cliente.casou_por === "email" ? "e-mail exato" : "domínio"}
            </span>
          </div>
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <div className="font-mono-tag">MRR</div>
              <div className="num-display text-xl mt-0.5">R$ {fmtNum(cliente.mrr)}</div>
            </div>
            <div>
              <div className="font-mono-tag">Plano</div>
              <div className="text-sm mt-1">{cliente.plano ?? "—"}</div>
            </div>
            <div>
              <div className="font-mono-tag">Carteira</div>
              <div className="text-sm mt-1">{cliente.carteira ?? "—"}</div>
            </div>
          </div>
          {cliente.casou_por === "dominio" && (
            <p className="text-[11px] text-ink-faint mt-3 leading-snug">
              Vínculo por domínio: este e-mail não é o cadastrado no CustomerX, mas é da mesma
              empresa. Confirme antes de tratar como o contato titular da conta.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Edições recebidas" icon={<Inbox />} value={lead.editions_received} accent="navy" />
        <KPI label="Edições abertas" icon={<MailOpen />} value={lead.editions_opened} accent="olive" hint={`${fmtPct(lead.open_rate)} de abertura`} />
        <KPI label="Edições com clique" icon={<MousePointerClick />} value={lead.editions_clicked} accent="amber" />
        <KPI label="Cliques totais" icon={<Pointer />} value={lead.total_clicks} accent="plum" hint={`${lead.total_opens} aberturas no total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edições recebidas */}
        <div className="paper overflow-hidden">
          <div className="flex items-baseline justify-between p-6 pb-4">
            <h3 className="nw-painel-t">Edições recebidas</h3>
            <span className="font-mono-tag">{perEdition.length}</span>
          </div>
          {perEdition.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">Ainda não recebeu edições.</p>
          ) : (
            <table className="editorial">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Edição</th>
                  <th>Enviada</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {perEdition.map((e) => (
                  <tr key={e.edition_number}>
                    <td className="font-mono text-xs text-ink-mute">{e.edition_number}</td>
                    <td className="text-sm max-w-[240px] truncate">{e.title}</td>
                    <td className="text-xs text-ink-mute whitespace-nowrap">{fmtDate(e.sent_at)}</td>
                    <td>
                      {e.clicked ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-soft text-amber">clicou</span>
                      ) : e.opened ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-olive-soft text-olive">abriu</span>
                      ) : (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-bg-soft text-ink-mute">só recebeu</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Linha do tempo */}
        <div className="paper p-6">
          <div className="flex items-baseline justify-between mb-5">
            <h3 className="nw-painel-t">Linha do tempo</h3>
            <span className="font-mono-tag">{timeline.length} eventos</span>
          </div>
          {timeline.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">Sem eventos.</p>
          ) : (
            <ol className="max-h-[460px] overflow-y-auto pr-2 pl-[6px] ml-1">
              {/* O fio é a borda de cada item, e a lista tem 6px de respiro à
                  esquerda: o ponto fica 5px PARA FORA do item, e a lista rola
                  (`overflow-y-auto`) — sem o respiro ele saía cortado ao meio. */}
              {timeline.map((t, i) => (
                <li key={i} className="relative pl-5 pb-4 last:pb-0 border-l border-rule">
                  <span
                    className="absolute -left-[5px] top-[6px] w-2.5 h-2.5 rounded-[3px]"
                    style={{ background: KIND_COLOR[t.kind] ?? "var(--ink-mute)" }}
                    aria-hidden
                  />
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm">{t.label}</span>
                    <span className="text-[11px] text-ink-faint font-mono whitespace-nowrap">{fmtDateTime(t.at)}</span>
                  </div>
                  {t.detail && <div className="text-xs text-ink-mute truncate">{t.detail}</div>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Em que ele clicou. Só aparece quando a edição tem detalhamento
          sincronizado — o agregado sabe que houve clique, mas não em quê. */}
      <div className="paper overflow-hidden">
        <div className="flex items-baseline justify-between p-6 pb-4">
          <h3 className="nw-painel-t">Links que clicou</h3>
          <span className="font-mono-tag">
            {cliques.length > 0
              ? `${cliques.length} ${cliques.length === 1 ? "link" : "links"}`
              : "sem detalhamento"}
          </span>
        </div>
        {cliques.length === 0 ? (
          <p className="text-ink-faint text-sm px-6 pb-8 leading-snug max-w-2xl">
            {lead.editions_clicked > 0
              ? `Este lead tem clique em ${lead.editions_clicked} ${
                  lead.editions_clicked === 1 ? "edição" : "edições"
                }, mas o detalhamento por link ainda não foi sincronizado para elas. O agregado sabe que houve clique; só a MCP do Beehiiv diz em qual link.`
              : "Nenhum clique registrado."}
          </p>
        ) : (
          <table className="editorial">
            <thead>
              <tr>
                <th>Link</th>
                <th>Categoria</th>
                <th>Edição</th>
                <th className="num">Cliques</th>
                <th>Quando</th>
              </tr>
            </thead>
            <tbody>
              {cliques.map((c, i) => (
                <tr key={`${c.url ?? "sem-url"}-${i}`}>
                  <td className="text-sm" title={c.url ?? undefined}>
                    {c.url ? (
                      truncate(limparUrl(c.url), 52)
                    ) : (
                      <span className="text-ink-faint italic">link não identificado</span>
                    )}
                  </td>
                  <td className="text-xs text-ink-mute">{c.categoria ?? "—"}</td>
                  <td className="font-mono text-xs text-ink-mute">
                    {c.edition_number != null ? `#${c.edition_number}` : "—"}
                  </td>
                  <td className="num">{c.clicks}</td>
                  <td className="text-xs text-ink-mute whitespace-nowrap">
                    {fmtDateTime(c.clickedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {semDeParaUrl > 0 && (
          <div
            className="px-6 py-3.5 text-xs text-ink-mute leading-snug"
            style={{ borderTop: "1px solid var(--rule)" }}
          >
            {semDeParaUrl} {semDeParaUrl === 1 ? "clique está" : "cliques estão"} sem link
            identificado. Quase sempre é link <strong>personalizado</strong> — gerenciar
            preferências ou descadastro, que têm URL única por assinante e por isso não
            existem como link agregado em <code>beehiiv_link_stats</code>. Clique real, destino
            individual.
          </div>
        )}
        {cliques.length > 0 && edicoesSemDetalhe > 0 && (
          <div
            className="px-6 py-3.5 text-xs text-ink-mute leading-snug"
            style={{ borderTop: "1px solid var(--rule)" }}
          >
            Falta o detalhamento de {edicoesSemDetalhe}{" "}
            {edicoesSemDetalhe === 1 ? "edição" : "edições"} em que este lead também clicou — o
            agregado registra o clique, mas só a MCP do Beehiiv diz em qual link. A lista acima
            cobre {edicoesDetalhadas} de {lead.editions_clicked}.
          </div>
        )}
      </div>

      {(categorias.length > 0 || empresa) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Que tipo de conteúdo puxa este lead */}
          {categorias.length > 0 && (
            <div className="paper p-6">
              <div className="flex items-baseline justify-between mb-5">
                <h3 className="nw-painel-t">Que conteúdo puxa este lead</h3>
                <span className="font-mono-tag">{totalCategoria} cliques</span>
              </div>
              <div className="space-y-3">
                {categorias.map((c) => (
                  <div key={c.categoria} className="flex items-center gap-3">
                    <span className="text-sm w-28 shrink-0">{c.categoria}</span>
                    <div className="bar-track flex-1">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${Math.round((c.cliques / Math.max(1, totalCategoria)) * 100)}%`,
                          background: categoryColor(c.categoria)
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs w-16 text-right">
                      {fmtPct((c.cliques / Math.max(1, totalCategoria)) * 100)}
                    </span>
                    <span className="font-mono text-xs text-ink-faint w-8 text-right">
                      {c.cliques}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-ink-faint mt-4 leading-snug">
                Baseado nos {totalCategoria} cliques com link identificado
                {semDeParaUrl > 0
                  ? ` — ${semDeParaUrl} de destino individual ${
                      semDeParaUrl === 1 ? "ficou" : "ficaram"
                    } de fora`
                  : ""}
                . A classificação dos destinos mora em <code>beehiiv_link_categorias</code>.
              </p>
            </div>
          )}

          {/* A conta inteira, não só a pessoa */}
          {empresa && (
            <div className="paper overflow-hidden">
              <div className="flex items-baseline justify-between p-6 pb-4">
                <h3 className="nw-painel-t">Mais gente de {empresa.dominio}</h3>
                <span className="font-mono-tag">
                  {empresa.contatos} {empresa.contatos === 1 ? "contato" : "contatos"}
                  {empresa.humanos !== empresa.contatos
                    ? ` · ${empresa.contatos - empresa.humanos} scanner`
                    : ""}
                </span>
              </div>
              <div
                className="px-6 pb-4 text-xs text-ink-mute leading-snug"
                style={{ borderBottom: "1px solid var(--rule)" }}
              >
                A conta soma <span className="text-ink">{empresa.cliquesHumanos} cliques humanos</span>.
                Vários inscritos do mesmo domínio indicam a empresa acompanhando, não um
                interessado isolado.
              </div>
              {empresa.colegas.length === 0 ? (
                <p className="text-ink-faint text-sm py-8 text-center">
                  Só este contato tem engajamento registrado.
                </p>
              ) : (
                <table className="editorial">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th className="num">Abriu</th>
                      <th className="num">Cliques</th>
                      <th>Última</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresa.colegas.slice(0, 12).map((c) => (
                      <tr key={c.email}>
                        <td className="text-sm">
                          <Link
                            href={`/leads?email=${encodeURIComponent(c.email)}`}
                            className="hover:underline"
                          >
                            {truncate(c.email, 30)}
                          </Link>
                          {c.is_bot && (
                            <span className="ml-1.5 text-[10px] font-mono text-amber">scanner</span>
                          )}
                        </td>
                        <td className="num">{c.editions_opened}</td>
                        <td className="num">{c.total_clicks}</td>
                        <td className="text-xs text-ink-mute whitespace-nowrap">
                          {c.last_engaged_at ? fmtDate(c.last_engaged_at) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
