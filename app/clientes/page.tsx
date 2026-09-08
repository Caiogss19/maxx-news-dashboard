import { getClientes } from "@/lib/clientes";
import { Section } from "@/components/Section";
import { KPIRow } from "@/components/KPI";
import { fmtNum, fmtPct, relativeTime, truncate } from "@/lib/format";

export const revalidate = 259200; // 3 dias — casado com o job de sync

function brl(v: number): string {
  if (!v) return "—";
  return "R$ " + Math.round(v).toLocaleString("pt-BR");
}

function pct(parte: number, total: number): number | null {
  if (!total) return null;
  return Math.round((parte / total) * 1000) / 10;
}

export default async function Page() {
  const { totais, clientes, ativosSemAbertura, ativosForaDaNews, porCarteira, pessoasPorProduto } =
    await getClientes();

  const aberturaCliente = pct(totais.assinantesQueAbriram, totais.assinantesDeCliente);
  const aberturaBase = pct(totais.baseQueAbriu, totais.assinantesHumanosTotal);
  const cliqueCliente = pct(totais.assinantesQueClicaram, totais.assinantesDeCliente);
  const cliqueBase = pct(totais.baseQueClicou, totais.assinantesHumanosTotal);

  const comAssinante = clientes
    .filter((c) => c.assinantes > 0)
    .sort((a, b) => b.assinantesHumanos - a.assinantesHumanos || b.mrr - a.mrr);

  const mrrCego = ativosSemAbertura.reduce((a, c) => a + c.mrr, 0);

  // A carteira lida em gente: 240 clientes ativos são 1.424 pessoas.
  const pessoasTotal = pessoasPorProduto.reduce((a, p) => a + p.pessoas, 0);
  const pessoasNaNews = pessoasPorProduto.reduce((a, p) => a + p.naNews, 0);

  return (
    <main>
      <Section
        num="11"
        eyebrow="Carteira na newsletter"
        title="Quem já é *cliente* está lendo?"
        subtitle="Cruzamento da carteira CustomerX com a base da Maxx News, por domínio de e-mail. Scanner corporativo fica de fora das contagens de leitura, mas aparece contado à parte."
      >
        <KPIRow
          items={[
            {
              label: "Clientes na news",
              value: totais.clientesNaNewsletter,
              foot: `de ${totais.clientesCarteira} na carteira · ${totais.clientesAtivos} com contrato ativo`,
              accent: "crimson"
            },
            {
              label: "Assinantes de cliente",
              value: fmtNum(totais.assinantesDeCliente),
              foot: `${fmtPct(pct(totais.assinantesDeCliente, totais.assinantesHumanosTotal))} da base humana (${fmtNum(
                totais.assinantesHumanosTotal
              )})`,
              accent: "navy"
            },
            {
              label: "Abrem",
              value: fmtPct(aberturaCliente),
              foot: `base geral: ${fmtPct(aberturaBase)}`,
              accent: "olive"
            },
            {
              label: "Clicam",
              value: fmtPct(cliqueCliente),
              foot: `base geral: ${fmtPct(cliqueBase)}`,
              accent: "amber"
            }
          ]}
        />
      </Section>

      {pessoasPorProduto.length > 0 && (
        <Section
          num="12"
          eyebrow="A carteira em gente"
          title="Quantas *pessoas* de cliente estão na news?"
          subtitle="A contagem por empresa responde uma pergunta; esta responde outra. Cada linha é uma pessoa cadastrada no CustomerX, sem repetir quem é contato de mais de um cliente. Signals é add-on de Sprout — quem tem os dois aparece só na linha combinada."
        >
          <div className="paper overflow-hidden">
            <div className="flex items-baseline justify-between p-6 pb-4">
              <h3 className="font-display text-xl">Pessoas por produto</h3>
              <span className="font-mono-tag">
                {fmtNum(pessoasNaNews)} de {fmtNum(pessoasTotal)} na news ·{" "}
                {fmtPct(pct(pessoasNaNews, pessoasTotal))}
              </span>
            </div>
            <table className="editorial">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className="num">Clientes</th>
                  <th className="num">Pessoas</th>
                  <th className="num">Na news</th>
                  <th className="num">Cobertura</th>
                  <th className="num">Abrem</th>
                  <th className="num">Fora</th>
                </tr>
              </thead>
              <tbody>
                {pessoasPorProduto.map((p) => (
                  <tr key={p.produto}>
                    <td className="text-sm">{p.produto}</td>
                    <td className="num">{p.clientes}</td>
                    <td className="num">{fmtNum(p.pessoas)}</td>
                    <td className="num">{fmtNum(p.naNews)}</td>
                    <td className="num">{fmtPct(p.coberturaPct)}</td>
                    <td className="num">{fmtNum(p.abriram)}</td>
                    <td className="num text-ink-mute">{fmtNum(p.foraDoBeehiiv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-6 pb-6 pt-4 text-xs text-ink-mute leading-relaxed">
              &quot;Fora&quot; é pessoa de cliente ativo que não existe no Beehiiv — quase
              sempre endereço que o Beehiiv tentou validar e não existe mais. É dado velho no
              CustomerX, não falta de carga.
            </p>
          </div>
        </Section>
      )}

      {ativosSemAbertura.length > 0 && (
        <Section
          num="13"
          eyebrow="Ponto cego"
          title="Cliente ativo que *recebe e não abre*."
          subtitle="Três ou mais pessoas inscritas, nenhuma abertura registrada. Em conta grande isso raramente é desinteresse — é filtro corporativo comendo a entrega antes de alguém ver. Confira o domínio na aba Operação."
        >
          <div className="paper overflow-hidden">
            <div className="flex items-baseline justify-between p-6 pb-4">
              <h3 className="font-display text-xl">Recebem, ninguém abre</h3>
              <span className="font-mono-tag">
                {ativosSemAbertura.length} clientes · {brl(mrrCego)} de MRR
              </span>
            </div>
            <table className="editorial">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Domínio</th>
                  <th>Carteira</th>
                  <th className="num">Inscritos</th>
                  <th className="num">MRR</th>
                </tr>
              </thead>
              <tbody>
                {ativosSemAbertura.slice(0, 15).map((c) => (
                  <tr key={c.clientId}>
                    <td className="text-sm">{truncate(c.companyName, 34)}</td>
                    <td className="text-xs text-ink-mute">{c.dominio ?? "—"}</td>
                    <td className="text-xs text-ink-mute">{c.carteira ?? "—"}</td>
                    <td className="num">{c.assinantesHumanos}</td>
                    <td className="num text-xs">{brl(c.mrr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section
        num="14"
        eyebrow="Por carteira"
        title="Alcance por *nível de atendimento*."
        subtitle="Quantos clientes de cada carteira têm alguém na newsletter, e quanto dessa gente abre."
      >
        <div className="paper overflow-hidden">
          <table className="editorial">
            <thead>
              <tr>
                <th>Carteira</th>
                <th className="num">Clientes ativos</th>
                <th className="num">Na news</th>
                <th>Cobertura</th>
                <th className="num">Inscritos</th>
                <th>Abrem</th>
              </tr>
            </thead>
            <tbody>
              {porCarteira.map((g) => (
                <tr key={g.carteira}>
                  <td className="text-sm">{g.carteira}</td>
                  <td className="num">{g.clientes}</td>
                  <td className="num">{g.naNews}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="bar-track w-16">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${Math.min(100, pct(g.naNews, g.clientes) ?? 0)}%`,
                            background: "var(--crimson)"
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs">{fmtPct(pct(g.naNews, g.clientes))}</span>
                    </div>
                  </td>
                  <td className="num">{g.assinantes}</td>
                  <td className="font-mono text-xs">{fmtPct(pct(g.abriram, g.assinantes))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        num="15"
        eyebrow="Cliente a cliente"
        title="A carteira, *ordenada por presença*."
        subtitle="Quem tem mais gente inscrita. A coluna de scanner mostra quantos dos inscritos são varredura automática — em domínio corporativo isso muda a leitura do número ao lado."
      >
        <div className="paper overflow-hidden">
          <div className="flex items-baseline justify-between p-6 pb-4">
            <h3 className="font-display text-xl">Clientes com inscritos</h3>
            <span className="font-mono-tag">{comAssinante.length} clientes</span>
          </div>
          <table className="editorial">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Carteira</th>
                <th>Plano</th>
                <th className="num">Inscritos</th>
                <th className="num">Scanner</th>
                <th>Abrem</th>
                <th className="num">Clicam</th>
                <th className="num">MRR</th>
                <th>Último</th>
              </tr>
            </thead>
            <tbody>
              {comAssinante.slice(0, 80).map((c) => (
                <tr key={c.clientId}>
                  <td className="text-sm">
                    {truncate(c.companyName, 30)}
                    {c.contractStatus !== "active_contract" && (
                      <span className="text-[11px] text-ink-faint"> · inativo</span>
                    )}
                  </td>
                  <td className="text-xs text-ink-mute">{c.carteira ?? "—"}</td>
                  <td className="text-xs text-ink-mute">{c.plano ?? "—"}</td>
                  <td className="num">{c.assinantesHumanos}</td>
                  <td className="num text-xs text-ink-faint">
                    {c.assinantesScanner || "—"}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="bar-track w-12">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${Math.min(100, c.aberturaPct ?? 0)}%`,
                            background: "var(--olive)"
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs w-12">{fmtPct(c.aberturaPct)}</span>
                    </div>
                  </td>
                  <td className="num">{c.humanosQueClicaram || "—"}</td>
                  <td className="num text-xs">{brl(c.mrr)}</td>
                  <td className="text-xs text-ink-mute whitespace-nowrap">
                    {c.ultimoEngajamento ? relativeTime(c.ultimoEngajamento) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        num="16"
        eyebrow="Oportunidade"
        title="Cliente ativo *fora* da newsletter."
        subtitle="Contrato ativo e ninguém do domínio inscrito. Ordenado por MRR — é onde convidar rende mais."
      >
        <div className="paper overflow-hidden">
          <div className="flex items-baseline justify-between p-6 pb-4">
            <h3 className="font-display text-xl">Sem ninguém inscrito</h3>
            <span className="font-mono-tag">
              {ativosForaDaNews.length} de {totais.clientesAtivos} clientes ativos
            </span>
          </div>
          {ativosForaDaNews.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">
              Todo cliente ativo tem pelo menos um inscrito.
            </p>
          ) : (
            <table className="editorial">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Domínio</th>
                  <th>Carteira</th>
                  <th>Plano</th>
                  <th className="num">MRR</th>
                </tr>
              </thead>
              <tbody>
                {ativosForaDaNews.slice(0, 40).map((c) => (
                  <tr key={c.clientId}>
                    <td className="text-sm">{truncate(c.companyName, 34)}</td>
                    <td className="text-xs text-ink-mute">{c.dominio ?? "—"}</td>
                    <td className="text-xs text-ink-mute">{c.carteira ?? "—"}</td>
                    <td className="text-xs text-ink-mute">{c.plano ?? "—"}</td>
                    <td className="num text-xs">{brl(c.mrr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div
            className="px-6 py-3.5 text-xs text-ink-mute"
            style={{ borderTop: "1px solid var(--rule)" }}
          >
            Cruzamento por domínio de e-mail. Cliente cadastrado no CustomerX com
            provedor público — ou com o e-mail do gerente de conta da Spark, que
            acontece em 37 casos — casa só por e-mail exato, senão um domínio
            arrastaria a base inteira para dentro dele.
          </div>
        </div>
      </Section>
    </main>
  );
}
