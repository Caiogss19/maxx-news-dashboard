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
- **Leads** (`/leads`) — busca por e-mail, linha do tempo individual, diretório
- **Operação** (`/operacao`) — distribuição de eventos, sync com RD, motivos de erro, atividade recente

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
| Cache das páginas | a cada 3 dias | `revalidate = 259200` + `/api/revalidate` |

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
