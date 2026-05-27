# Maxx News · Newsletter Dashboard

Real-time dashboard for the Beehiiv ↔ RD Station newsletter integration.

**Stack:** Next.js 15 (App Router) · Supabase (Postgres + Realtime) · Recharts · TailwindCSS

---

## 0 · Pré-requisitos

- Node.js 18.18+ ou 20+
- Conta na Vercel (deploy)
- Tabelas `beehiiv_events` e `beehiiv_sync_outbound` já criadas no Supabase (projeto `spark-maxx-rd-dashboard`)
- Workflows n8n ativos (RD → Beehiiv + Beehiiv → RD)

---

## 1 · Habilitar Realtime no Supabase

No SQL editor do Supabase, roda:

```sql
alter publication supabase_realtime add table beehiiv_events;
alter publication supabase_realtime add table beehiiv_sync_outbound;
```

Isso permite que o dash receba eventos via WebSocket assim que forem inseridos.

---

## 2 · Setup local

```bash
cp .env.local.example .env.local
# edita .env.local com SUPABASE_URL + ANON_KEY do projeto

npm install
npm run dev
# abre http://localhost:3000
```

---

## 3 · Deploy na Vercel

### Via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

A CLI vai perguntar pelas env vars. Cola `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Via Dashboard Vercel

1. Push do projeto pra um repo GitHub
2. Vercel → **New Project** → importa o repo
3. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://rximtawdguljuwiektgx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (anon JWT do Supabase, formato `eyJ...`)
4. Deploy

---

## 4 · Estrutura

```
app/
  layout.tsx              # header + nav + footer compartilhados
  page.tsx                # visão geral (hero + KPIs base/engajamento)
  globals.css             # design tokens (light + dark)
  funil/                  # 01 · funil ponta a ponta (até engajamento)
  crescimento/            # 02 · timeseries da base
  origem/                 # 03 · aquisição por UTM
  edicoes/                # 08 · desempenho por edição (+ [postId] detalhe)
  engajamento/            # 09 · engajamento agregado da base
  leads/                  # 10 · jornada do lead (busca + diretório)
  eventos/ saude/ conteudo/ atividade/   # demais seções
components/
  Nav.tsx             # navegação por abas
  KPI.tsx             # cards de métrica
  Section.tsx         # blocos editoriais com número
  BarList.tsx         # barras horizontais (top N)
  Funnel.tsx          # funil
  Timeseries.tsx      # linha temporal (Recharts)
  EngagementArea.tsx  # aberturas/cliques no tempo (Recharts)
  HourBars.tsx        # aberturas por hora
  EditionsTable.tsx   # tabela de edições
  LeadsTable.tsx      # diretório de leads
  LeadJourneyView.tsx # jornada individual + timeline
  LeadSearch.tsx      # busca de leads
  SyncDonut.tsx       # donut de sync RD
  RecentEvents.tsx    # tabela últimos eventos Beehiiv
  RecentOutbound.tsx  # tabela últimos envios RD
  ThemeToggle.tsx     # light/dark
  LiveIndicator.tsx   # contador real-time via Realtime
lib/
  supabase-client.ts  # client browser (Realtime)
  supabase-server.ts  # client server (SSR queries)
  queries.ts          # snapshot da base/eventos/outbound
  analytics.ts        # edições, engajamento e jornada do lead
  format.ts           # helpers de formatação
```

### Tabelas e views (Supabase)

Além de `beehiiv_events` e `beehiiv_sync_outbound`:

- `beehiiv_editions` — cada disparo da newsletter (título, assunto, envio, agendamento)
- `beehiiv_interactions` — 1 linha por interação de lead × edição (delivered/opened/clicked/bounced/unsubscribed)
- `v_edition_performance` — agregados por edição (open rate, CTR, CTOR, unsubs)
- `v_lead_engagement` — engajamento por lead (edições recebidas/abertas/clicadas)
- `v_subscribers` · `v_engagement_daily` · `v_engagement_by_hour` · `v_link_performance`

---

## 5 · O que o dashboard mostra

### KPIs topo
- Subscribers ativos (únicos, com último evento ≠ deleted)
- Taxa de confirmação (double opt-in)
- Envios RD → Beehiiv (sucesso + falhas)
- Eventos sync com RD (synced / pending / failed)

### Páginas (cada parte do dash em sua rota)
1. **Funil ponta a ponta** (`/funil`) — RD enviou → aceitou → criou → confirmou → abriu → clicou
2. **Crescimento da base** (`/crescimento`) — timeseries 30d (criados, removidos, líquido)
3. **Aquisição por canal** (`/origem`) — UTM source + campaign top 8
8. **Desempenho por edição** (`/edicoes`) — cada newsletter: entregas, abertura, CTR, unsubs; detalhe em `/edicoes/[postId]`
9. **Engajamento da base** (`/engajamento`) — aberturas/cliques no tempo, melhores horários, links e leads mais engajados
10. **Trajeto do lead** (`/leads`) — busca por email + linha do tempo individual; diretório ordenado por interação
- **Distribuição de eventos** (`/eventos`) — ciclo de vida + interações de email + donut sync RD
- **Saúde da integração** (`/saude`) — sucesso/falha + motivos de erro agrupados
- **Conteúdo enviado** (`/conteudo`) — posts (sent/scheduled/updated)
- **Atividade ao vivo** (`/atividade`) — últimos envios + últimos eventos

### Realtime
Indicador no header conta novos eventos chegando via WebSocket. Clica em "Atualizar" para refazer queries SSR.

---

## 6 · Adicionar nova métrica

1. Adiciona o cálculo em `lib/queries.ts` dentro de `getSnapshot()`
2. Expande o type `Snapshot` no topo do arquivo
3. Cria um componente novo em `components/` se for visual customizado
4. Importa e usa em `app/page.tsx`

---

## 7 · Customização de cores

Os tokens estão em `app/globals.css` (`:root` + `:root[data-theme="dark"]`).
Para mudar a paleta inteira, edita lá — Tailwind referencia via CSS vars.

---

## 8 · Próximos passos

- [ ] Página `/eventos` com filtros (data, tipo, email)
- [ ] Página `/outbound` com retry manual de falhas
- [ ] Cohorts de retenção (% ativos após N dias do opt-in)
- [ ] Cross-table queries (newsletter inscrito que virou MQL no Pipedrive)
- [ ] Alertas (Discord/Slack) quando taxa de erro > X%
