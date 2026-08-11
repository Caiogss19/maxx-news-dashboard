import { getSnapshot } from "@/lib/queries";
import { getEngagement } from "@/lib/analytics";
import { getBloqueio } from "@/lib/bloqueio";
import { Section } from "@/components/Section";
import { KPI } from "@/components/KPI";
import { KPIRow } from "@/components/KPI";
import { BarList } from "@/components/BarList";
import { SyncDonut } from "@/components/SyncDonut";
import { RecentEvents } from "@/components/RecentEvents";
import { RecentOutbound } from "@/components/RecentOutbound";
import { RDLink } from "@/components/RDLink";
import { fmtNum, fmtPct, fmtDate, truncate } from "@/lib/format";

export const revalidate = 259200; // 3 dias — casado com o job de sync

export default async function Page() {
  const [s, eng, bloq] = await Promise.all([getSnapshot(), getEngagement(), getBloqueio()]);

  const interactions = [
    { label: "email.delivered", value: eng.totals.delivered },
    { label: "email.opened", value: eng.totals.opens },
    { label: "email.clicked", value: eng.totals.clicks },
    { label: "email.bounced", value: eng.totals.bounces },
    { label: "email.unsubscribed", value: eng.totals.unsubscribes }
  ].filter((i) => i.value > 0);

  return (
    <main>
      <Section
        num="01"
        eyebrow="Distribuição de eventos"
        title="O que está *acontecendo* no Beehiiv."
        subtitle="Eventos de ciclo de vida (inscrições, posts) e interações com as edições. Útil para detectar picos anormais."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <BarList
            title="Eventos de ciclo de vida"
            caption="subscription / post / survey"
            items={s.events.byType.map((g) => ({ label: g.type, value: g.count }))}
            accent="olive"
          />
          <SyncDonut
            synced={s.events.rdSynced.synced}
            pending={s.events.rdSynced.pending}
            failed={s.events.rdSynced.failed}
          />
        </div>
        <BarList
          title="Interações com as edições"
          caption="eventos de email"
          items={interactions}
          accent="navy"
          max={5}
        />
      </Section>

      <Section
        num="02"
        eyebrow="Saúde da integração"
        title="Onde a sincronização *está quebrando*."
        subtitle="Falhas que importam: Beehiiv rejeitando lead do RD, ou RD recusando conversão do Beehiiv. Cada erro é capturado com o motivo retornado pela API."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="paper p-6 md:col-span-1">
            <div className="font-mono-tag mb-3">RD → Beehiiv</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-ink-mute">Sucessos</div>
                <div className="num-display text-3xl text-olive mt-1">{s.outbound.ok}</div>
              </div>
              <div>
                <div className="text-xs text-ink-mute">Falhas</div>
                <div className="num-display text-3xl text-danger mt-1">{s.outbound.fail}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-rule">
              <div className="text-xs text-ink-mute mb-1">Taxa de sucesso</div>
              <div className="num-display text-2xl">{fmtPct(s.outbound.rate)}</div>
            </div>
          </div>
          <div className="md:col-span-2">
            <BarList
              title="Motivos de falha · RD → Beehiiv"
              caption="agrupado por error_message"
              items={s.outbound.errorsByMessage.map((g) => ({ label: g.message, value: g.count }))}
              total={s.outbound.fail}
              accent="danger"
              max={8}
            />
          </div>
        </div>
      </Section>

      <Section
        num="03"
        eyebrow="Conteúdo enviado"
        title="Posts *que saíram*."
        subtitle="Eventos relacionados a posts (sent / updated / scheduled). Não tem email associado — vão direto pro Supabase, sem passar pelo RD."
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Posts enviados" value={fmtNum(s.posts.sent)} accent="amber" hint="post.sent" />
          <KPI label="Posts agendados" value={fmtNum(s.posts.scheduled)} accent="ink" hint="post.scheduled" />
          <KPI label="Posts editados" value={fmtNum(s.posts.updated)} accent="ink" hint="post.updated" />
          <KPI
            label="Categorias ativas"
            value={s.events.byCategory.length}
            accent="navy"
            hint={s.events.byCategory.map((c) => c.category).join(" · ")}
          />
        </div>
      </Section>

      <Section
        num="04"
        eyebrow="Atividade ao vivo"
        title="Os *últimos eventos*, sem filtro."
        subtitle="Cada linha é uma transação real entre RD, n8n, Beehiiv e Supabase. Use para auditar e validar o fluxo durante setup."
      >
        <div className="grid grid-cols-1 gap-6">
          <RecentOutbound rows={s.recent.outbound} />
          <RecentEvents rows={s.recent.events} />
        </div>
      </Section>

      <Section
        num="05"
        eyebrow="Bloqueio de e-mails"
        title="Quem *saiu* da base, e por quê."
        subtitle="Descadastro, endereço inválido e sumiço da lista do Beehiiv, num lugar só. Até aqui esses números existiam no banco mas não apareciam em tela nenhuma."
      >
        <KPIRow
          items={[
            {
              label: "Fora da base",
              value: bloq.bloqueados.length,
              foot: bloq.porMotivo.map((m) => `${m.value} ${m.label}`).join(" · "),
              accent: "danger"
            },
            {
              label: "Domínios suspeitos",
              value: bloq.suspeitosDeBloqueio.length,
              foot: "3+ pessoas recebendo, zero abertura — cara de filtro corporativo",
              accent: "amber"
            },
            {
              label: "Internos fora da lista",
              value: bloq.internosNaoCadastrados,
              foot: "em domínio interno, ausentes de beehiiv_internal_emails",
              accent: "navy"
            },
            {
              label: "Divergentes com o RD",
              value: bloq.rdChecados === 0 ? "—" : bloq.divergentes.length,
              foot:
                bloq.rdChecados === 0
                  ? "sync semanal ainda não rodou"
                  : `${bloq.rdChecados} e-mails checados no RD`,
              accent: "plum"
            }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div className="paper overflow-hidden">
            <div className="flex items-baseline justify-between p-6 pb-4">
              <h3 className="font-display text-xl">Saídas recentes</h3>
              <span className="font-mono-tag">{bloq.bloqueados.length} no total</span>
            </div>
            {bloq.bloqueados.length === 0 ? (
              <p className="text-ink-faint text-sm py-10 text-center">Ninguém fora da base.</p>
            ) : (
              <table className="editorial">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Motivo</th>
                    <th className="num">Recebeu</th>
                    <th>Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {bloq.bloqueados.slice(0, 20).map((b) => (
                    <tr key={b.email}>
                      <td className="text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          {truncate(b.email, 28)}
                          <RDLink email={b.email} />
                        </span>
                      </td>
                      <td className="text-xs text-ink-mute">{b.motivo}</td>
                      <td className="num">{b.recebidas}</td>
                      <td className="text-xs text-ink-mute whitespace-nowrap">
                        {fmtDate(b.deletedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <BarList
            title="Motivo da saída"
            caption="status do Beehiiv + evento subscription.deleted"
            items={bloq.porMotivo}
            total={bloq.bloqueados.length}
            accent="danger"
            max={6}
          />
        </div>
      </Section>

      <Section
        num="06"
        eyebrow="Entregabilidade por domínio"
        title="Onde o filtro corporativo *come a entrega*."
        subtitle="Domínio que recebe e ninguém abre não é desinteresse — é gateway de segurança barrando antes do humano ver. Só domínios com 2+ assinantes: com um só, não dá para separar padrão de acaso."
      >
        <div className="paper overflow-hidden">
          <div className="flex items-baseline justify-between p-6 pb-4">
            <h3 className="font-display text-xl">Recebem e ninguém abre</h3>
            <span className="font-mono-tag">
              {bloq.suspeitosDeBloqueio.length} domínios · de {bloq.dominios.length} analisados
            </span>
          </div>
          {bloq.suspeitosDeBloqueio.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">
              Nenhum domínio com entrega e zero abertura.
            </p>
          ) : (
            <table className="editorial">
              <thead>
                <tr>
                  <th>Domínio</th>
                  <th className="num">Assinantes</th>
                  <th className="num">Receberam</th>
                  <th className="num">Abriram</th>
                  <th className="num">Scanner</th>
                  <th className="num">Bloqueados</th>
                </tr>
              </thead>
              <tbody>
                {bloq.suspeitosDeBloqueio.slice(0, 20).map((d) => (
                  <tr key={d.dominio}>
                    <td className="text-sm">{d.dominio}</td>
                    <td className="num">{d.assinantes}</td>
                    <td className="num">{d.humanosComEnvio}</td>
                    <td className="num text-danger">0</td>
                    <td className="num text-xs text-ink-faint">{d.contasScanner || "—"}</td>
                    <td className="num text-xs text-ink-faint">{d.bloqueados || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      <Section
        num="07"
        eyebrow="Coerência Beehiiv ↔ RD"
        title="Saiu de um lado, *continua no outro*?"
        subtitle="Quem descadastrou ou bounceou no Beehiiv mas o RD ainda trata como contato ativo. Alimentado pelo job semanal que consulta o RD só para a lista de bloqueados."
      >
        <div className="paper overflow-hidden">
          {bloq.rdChecados === 0 ? (
            <div className="p-6">
              <div className="font-mono-tag mb-3">aguardando primeiro sync</div>
              <p className="text-sm text-ink-mute leading-relaxed max-w-2xl">
                Nenhum e-mail checado ainda — o fluxo{" "}
                <span className="text-ink">Bloqueados Beehiiv → status no RD</span> roda às segundas,
                08:00 BRT, e grava em <code>rd_contact_status</code>. Lista vazia aqui significa{" "}
                <span className="text-ink">não conferido</span>, não “sem divergência”.
              </p>
            </div>
          ) : bloq.divergentes.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">
              Os {bloq.rdChecados} bloqueados checados também não estão ativos no RD.
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between p-6 pb-4">
                <h3 className="font-display text-xl">Ativos no RD, fora do Beehiiv</h3>
                <span className="font-mono-tag">
                  {bloq.divergentes.length} de {bloq.rdChecados} checados
                </span>
              </div>
              <table className="editorial">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Motivo da saída</th>
                    <th>Status no RD</th>
                    <th>Checado</th>
                  </tr>
                </thead>
                <tbody>
                  {bloq.divergentes.slice(0, 25).map((b) => (
                    <tr key={b.email}>
                      <td className="text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          {truncate(b.email, 30)}
                          <RDLink email={b.email} />
                        </span>
                      </td>
                      <td className="text-xs text-ink-mute">{b.motivo}</td>
                      <td className="text-xs">{b.rdStatus}</td>
                      <td className="text-xs text-ink-mute whitespace-nowrap">
                        {fmtDate(b.rdCheckedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </Section>

      <Section
        num="08"
        eyebrow="Blocklist interna"
        title="A lista de exclusão está *completa*?"
        subtitle="beehiiv_internal_emails alimenta o filtro de scanner. Endereço em domínio interno que não está cadastrado ainda conta como leitor nos rankings."
      >
        <div className="paper overflow-hidden">
          <div className="flex items-baseline justify-between p-6 pb-4">
            <h3 className="font-display text-xl">Endereços internos na base</h3>
            <span className="font-mono-tag">
              {bloq.internos.length} encontrados · {bloq.internosNaoCadastrados} fora da lista
            </span>
          </div>
          {bloq.internos.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">
              Nenhum endereço interno na base.
            </p>
          ) : (
            <table className="editorial">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Na blocklist</th>
                  <th>Filtrado por</th>
                  <th className="num">Recebeu</th>
                  <th className="num">Abriu</th>
                  <th className="num">Cliques</th>
                </tr>
              </thead>
              <tbody>
                {bloq.internos.map((i) => (
                  <tr key={i.email}>
                    <td className="text-sm">{truncate(i.email, 34)}</td>
                    <td>
                      {i.cadastrado ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-olive-soft text-olive">
                          sim
                        </span>
                      ) : (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-soft text-amber">
                          não
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-ink-mute">{i.motivoFiltro ?? "—"}</td>
                    <td className="num">{i.recebidas}</td>
                    <td className="num">{i.abertas}</td>
                    <td className="num">{i.cliques}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div
            className="px-6 py-3.5 text-xs text-ink-mute"
            style={{ borderTop: "1px solid var(--rule)" }}
          >
            “não” na blocklist com clique registrado é candidato a entrar em{" "}
            <code>beehiiv_internal_emails</code> — é tabela, dá para editar por SQL sem migration.
          </div>
        </div>
      </Section>
    </main>
  );
}
