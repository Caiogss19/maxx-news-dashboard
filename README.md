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
  layout.tsx          # fonts + tema
  page.tsx            # dashboard principal (server component)
  globals.css         # design tokens (light + dark)
components/
  KPI.tsx             # cards de métrica
  Section.tsx         # blocos editoriais com número
  BarList.tsx         # barras horizontais (top N)
  Funnel.tsx          # funil de aquisição
  Timeseries.tsx      # linha temporal (Recharts)
  SyncDonut.tsx       # donut de sync RD
  RecentEvents.tsx    # tabela últimos eventos Beehiiv
  RecentOutbound.tsx  # tabela últimos envios RD
  ThemeToggle.tsx     # light/dark
  LiveIndicator.tsx   # contador real-time via Realtime
lib/
  supabase-client.ts  # client browser (Realtime)
  supabase-server.ts  # client server (SSR queries)
  queries.ts          # agregação completa do snapshot
  format.ts           # helpers de formatação
```

---

## 5 · O que o dashboard mostra

### KPIs topo
- Subscribers ativos (únicos, com último evento ≠ deleted)
- Taxa de confirmação (double opt-in)
- Envios RD → Beehiiv (sucesso + falhas)
- Eventos sync com RD (synced / pending / failed)

### Seções
1. **Funil ponta a ponta** — RD enviou → Beehiiv aceitou → criou subscriber → confirmou
2. **Crescimento da base** — timeseries 30d (criados, removidos, líquido)
3. **Aquisição por canal** — UTM source + campaign top 8
4. **Distribuição de eventos** — top 8 tipos + donut sync RD
5. **Saúde da integração** — sucesso/falha + motivos de erro agrupados
6. **Conteúdo enviado** — posts (sent/scheduled/updated)
7. **Atividade ao vivo** — últimos 12 envios + últimos 12 eventos

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
