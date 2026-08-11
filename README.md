# Maxx News · Newsletter Dashboard

Dashboard da integração Beehiiv ↔ RD Station da newsletter Maxx News.

**Stack:** Next.js 15 (App Router) · Supabase (Postgres + Realtime) · Recharts · TailwindCSS

Identidade visual: sistema Spark Maxx Media Intel — escuro por padrão (`#0B0D10`),
acento laranja (`#FF6B35`), Inter + JetBrains Mono, sem caixa-alta. É o mesmo
sistema da Central de Leads; os tokens vivem em `app/globals.css`.

---

## 0 · Pré-requisitos

- Node.js 18.18+ ou 20+
- Conta na Vercel (deploy)
- Projeto Supabase `rximtawdguljuwiektgx` com as tabelas `beehiiv_*`
- Workflows n8n ativos (RD → Beehiiv, Beehiiv → RD, Beehiiv Stats Daily Sync)

---

## 1 · Habilitar Realtime no Supabase

```sql
alter publication supabase_realtime add table beehiiv_events;
alter publication supabase_realtime add table beehiiv_sync_outbound;
```

Isso permite que o indicador "Live" do header conte eventos chegando por WebSocket.

---

## 2 · Setup local

```bash
cp .env.local.example .env.local
# edita .env.local com SUPABASE_URL + ANON_KEY + CRON_SECRET

npm install
npm run dev
# abre http://localhost:3000
```

---

## 3 · Deploy na Vercel

1. Vercel → **New Project** → importa o repo
2. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://rximtawdguljuwiektgx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon JWT do Supabase
   - `CRON_SECRET` = segredo do endpoint de revalidação (`openssl rand -hex 32`)
3. Deploy

O `vercel.json` já registra o cron diário que bate em `/api/revalidate`.

---

## 4 · Estrutura

```
app/
  layout.tsx              # sidebar + header + footer compartilhados
  globals.css             # design tokens (tema único escuro)
  page.tsx                # visão geral · KPIs de base, engajamento e saúde
  aquisicao/              # funil ponta a ponta, timeseries 30d, UTM
  edicoes/                # desempenho por edição (+ [postId] detalhe)
  engajamento/            # rankings — quem realmente lê
  leads/                  # jornada individual + diretório
  operacao/               # eventos, sync RD, erros, atividade ao vivo
  api/revalidate/         # invalidação de cache para o job de 3 dias
components/
  Sidebar.tsx         # navegação fixa (+ MobileNav em telas estreitas)
  Section.tsx         # cabeçalho de seção; `*trecho*` vira ênfase de acento
  KPI.tsx             # KPI em cartão + KPIRow (faixa com régua vertical)
  BarList.tsx         # barras horizontais (top N)
  RankTable.tsx       # tabela de ranking com posição (+ célula Who)
  EditionDots.tsx     # quadradinhos de recorrência (n de N edições)
  Funnel.tsx          # funil com conversão entre etapas
  Timeseries.tsx      # inscrições vs. unsubs no tempo (Recharts)
  HourBars.tsx        # histograma de horário de engajamento humano
  SyncDonut.tsx       # donut de sync RD (Recharts)
  EditionsTable.tsx · LeadsTable.tsx · LeadJourneyView.tsx · LeadSearch.tsx
  RecentEvents.tsx · RecentOutbound.tsx · LiveIndicator.tsx
lib/
  supabase-client.ts  # client browser (Realtime)
  supabase-server.ts  # client server (SSR)
  queries.ts          # snapshot de base/eventos/outbound
  analytics.ts        # edições, engajamento agregado e jornada do lead
  rankings.ts         # rankings de engajamento (views agregadas)
  format.ts           # helpers de formatação
docs/
  sync-engajamento.md # especificação do job de 3 dias
```

### Tabelas e views (Supabase)

Tabelas base: `beehiiv_events` · `beehiiv_sync_outbound` · `beehiiv_editions` ·
`beehiiv_link_stats` · `beehiiv_post_engagement` · `beehiiv_internal_emails`.

`beehiiv_post_engagement` guarda engajamento por **edição × assinante**, que é a
forma como a API do Beehiiv entrega (agregado por post + subscriber, com
timestamp do último engajamento) — não evento avulso. A `beehiiv_interactions`
continua existindo para eventos individuais, mas hoje está vazia.

Views de ranking: `v_bot_accounts` · `v_lead_ranking` · `v_company_ranking` ·
`v_edition_ranking` · `v_source_engagement` · `v_engagement_hour_human` ·
`v_send_hour_performance`.

Demais views: `v_edition_performance` · `v_lead_engagement` · `v_link_performance`
· `v_subscriber_stats` · `v_utm_source_stats` · `v_utm_campaign_stats` ·
`v_event_type_stats` · `v_event_category_stats` · `v_rd_sync_stats` ·
`v_post_stats` · `v_subscriber_daily` · `v_outbound_stats` · `v_outbound_errors`.

#### Categoria de link

`beehiiv_link_categorias` classifica URL por **tipo de destino** (imprensa,
rede-social, proprio, newsletter, material). É tabela, não `CASE` no SQL — dá
para editar por SQL sem migration, mesmo padrão de `beehiiv_internal_emails`.
O match é por host, com `prioridade` menor vencendo: por isso `about.fb.com`
entra como imprensa e não como rede social.

Views: `v_link_categoria_base` (uma linha por link) · `v_link_performance_categoria`
(ranking) · `v_link_categoria_edicao` · `v_link_hosts_sem_categoria`.

> ⚠️ **`beehiiv_link_stats.base_url` está NULL nas 233 linhas** — a coluna existe
> mas o sync nunca a populou. As views extraem o host da própria `url`. Não
> escreva código novo assumindo `base_url` preenchida.
>
> A cada edição nova, conferir `v_link_hosts_sem_categoria`. Host que nenhuma
> regra pega cai em "nao classificado", e sem olhar essa view ele cresce em
> silêncio.

#### Bloqueio e entregabilidade

`v_blocked_subscribers` une o `status` de `beehiiv_subscriber_stats`
(`inactive`/`invalid`) com os eventos `subscription.deleted`. É `full join` de
propósito: e-mail deletado some da lista de subscriptions do Beehiiv, então
existe evento sem linha de stats — e esse é justamente o caso interessante
(`status = fora_da_lista`).

`v_domain_deliverability` mostra entrega por domínio, só para domínios com 2+
assinantes; com um só não dá para separar padrão de acaso.
`v_internal_emails_audit` confronta a blocklist com quem realmente aparece na
base — `cadastrado = false` num domínio interno é candidato a entrar em
`beehiiv_internal_emails`.

`rd_contact_status` guarda o status no RD dos bloqueados, populado pelo job
semanal. Serve também de cache de `rd_uuid` para o botão "ver no RD".

#### Carteira de clientes

`clientes_customerx` é **espelho** — a origem é `bypass_customerx_clients` no
projeto Supabase `xkdpbhzkhzxivwtcfulm`, e não há join cross-projeto no
Postgres. O n8n copia diariamente a partir da view `v_clientes_newsletter_feed`,
que mora no projeto de origem.

O cruzamento com a base é **por domínio de e-mail**, com `dominios_genericos` de
fora.

> ⚠️ **37 clientes têm `spark.com.br` como domínio** — o e-mail cadastrado no
> CustomerX é o do gerente de conta da Spark, não o do cliente. Sem excluir esse
> domínio, os próprios funcionários entram em 37 clientes diferentes e todos
> exibem números idênticos. Provedor público e domínio da Spark casam só por
> e-mail exato.

Views: `v_client_engagement` (uma linha por cliente) e
`v_client_engagement_totais` (KPIs). Os totais existem separados porque dois
clientes podem dividir o mesmo domínio — somar as linhas contaria o mesmo
assinante duas vezes.

#### Pontuação de volta para o RD

`v_rd_scoring_feed` é a fila: só humano (`v_bot_accounts` fora), sem
descadastrado, e **só quando a faixa muda** em relação ao último envio
bem-sucedido em `beehiiv_rd_scoring_log`. Sem essa comparação o lead ganharia
pontos de novo a cada ciclo de 3 dias e o score inflaria sozinho.

> ⚠️ Tabela nova precisa de policy `<tabela>_anon_read` para `anon` e
> `authenticated`, como todas as `beehiiv_*`. RLS ligado sem policy faz o dash
> ler vazio **sem erro nenhum**.

**Toda agregação acontece no Postgres.** O PostgREST corta respostas em 1000
linhas e a base tem 4015 leads — contar em JS sobre a resposta crua trunca o
resultado silenciosamente. Views novas devem sair já com `GROUP BY` e `ORDER BY`
de dentro, lidas com `.limit(N)`.

---

## 5 · O que o dashboard mostra

- **Visão geral** (`/`) — base ativa, confirmação de opt-in, engajamento médio, sinal de saúde
- **Aquisição** (`/aquisicao`) — funil RD → opt-in → engajamento, crescimento 30d, UTM source/campaign
- **Edições** (`/edicoes`) — entregas, abertura, CTR e unsubs por disparo; detalhe em `/edicoes/[postId]`
- **Engajamento** (`/engajamento`) — rankings de edição, origem, leitor, empresa e horário
- **Leads** (`/leads`) — busca por e-mail, linha do tempo individual, diretório, links clicados e atalho para o perfil no RD
- **Clientes** (`/clientes`) — carteira CustomerX cruzada com a base: quem lê, quem recebe e não abre, quem está fora da news
- **Operação** (`/operacao`) — distribuição de eventos, sync com RD, motivos de erro, atividade recente, **bloqueio de e-mails** (saídas, entregabilidade por domínio, coerência com o RD, blocklist interna)

### Botão "ver no RD"

`/api/rd/contato?email=...` resolve o `uuid` do contato e redireciona para o
perfil. O uuid **não está na base** — `beehiiv_sync_outbound` tem 25 dos 4.034
assinantes — então a rota consulta `rd_contact_status` primeiro e a API do RD
depois. Falhou qualquer etapa, cai na busca por e-mail no RD: botão que não abre
nada é pior que botão que abre a lista.

Env: `RD_ACCESS_TOKEN`, ou o trio `RD_CLIENT_ID` + `RD_CLIENT_SECRET` +
`RD_REFRESH_TOKEN` (o access token do RD expira em 24h, então em produção é o
refresh que vale). `RD_APP_CONTACT_URL` ajusta a base do link — o caminho do
perfil já mudou entre versões do RD (`/leads/{uuid}` e `/contatos/{uuid}`), e
essa variável evita deploy para corrigir.

A rota só resolve e-mail que está na base da newsletter. Sem essa checagem ela
vira um oráculo público de "este e-mail existe no RD?" para quem tiver a URL.

### O filtro de scanner

Dois terços dos cliques registrados não são de pessoas: filtros de segurança
corporativa abrem a mensagem e visitam cada link para checar ameaças. Sem separar
isso, o CTR do painel descreve robô, não leitor.

`v_bot_accounts` faz o corte por dois padrões — cliques ≈ aberturas com volume
alto (scanner), e aberturas altíssimas com quase nenhum clique (inflador) — mais
os endereços internos em `beehiiv_internal_emails`. Todos os rankings excluem
essas contas, e a aba Engajamento lista quem foi excluído e por quê.

Detalhe do critério e da validação em [`docs/sync-engajamento.md`](docs/sync-engajamento.md).

---

## 6 · Atualização dos dados

| Camada | Frequência | Como |
|---|---|---|
| Eventos de inscrição | tempo real | webhook Beehiiv → n8n → `beehiiv_events` |
| Snapshots de edição | diário 06:00 BRT | n8n `Beehiiv Stats Daily Sync` |
| Engajamento por assinante | a cada 3 dias | rotina agendada (ver `docs/sync-engajamento.md`) |
| Carteira CustomerX | diário 05:00 BRT | n8n `Carteira CustomerX -> Dash Maxx News` (`kudw00d3RZQxCWn2`) |
| Status no RD dos bloqueados | semanal, seg 08:00 BRT | n8n `Bloqueados Beehiiv -> status no RD` (`nADLUxukZXw3ydZ5`) |
| Pontuação Beehiiv → RD | a cada 3 dias 07:30 BRT | n8n `Maxx News -> RD: pontuacao` (`1tK6UTI7fudmhMHs`) — **inativo** |
| Cache das páginas | a cada 3 dias | `revalidate = 259200` + `/api/revalidate` |

> ⚠️ **A pontuação para o RD está desligada de propósito.** Antes de ativar:
> criar no RD os três grupos de conversão do Lead Scoring de Interesse
> (`maxxnews-engajamento-alto`, `maxxnews-engajamento-medio`,
> `maxxnews-leitor-recorrente`) e definir os pontos de cada um — sem isso a
> conversão chega mas não pontua. A primeira execução é backfill de ~1.226
> conversões e dispara qualquer automação amarrada nesses grupos.

O endpoint de revalidação exige `Authorization: Bearer $CRON_SECRET` e só
revalida se o último sync tiver 3+ dias — `?force=1` pula a checagem.

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<dash>/api/revalidate
```

---

## 7 · Adicionar uma métrica

1. Cria a view agregada no Postgres, já ordenada
2. Lê em `lib/rankings.ts` (rankings) ou `lib/queries.ts` (snapshot), dentro do `Promise.all`
3. Expande o type de retorno
4. Renderiza com `KPI`/`KPIRow`, `BarList` ou `RankTable`

---

## 8 · Customização de cores

Os tokens estão em `:root` no `app/globals.css` e o Tailwind referencia via CSS
vars — trocar lá muda a paleta inteira. Uma convenção importa: `--crimson` é o
**acento da marca** (laranja), não erro. Falha usa `--danger`.

---

## 9 · Próximos passos

- [ ] Rotina de recorrência por edição (MCP do Beehiiv) — a REST diz *quantas* edições o lead abriu, não *quais*
- [ ] Cohorts de retenção (% ativos após N dias do opt-in)
- [ ] Cruzar leitor engajado com MQL no Pipedrive
- [ ] Alerta no Teams quando um scanner novo entrar no ranking
