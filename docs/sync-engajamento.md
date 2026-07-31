# Sync de engajamento · a cada 3 dias

O que mantém os rankings da aba **Engajamento** vivos. Este documento é a
especificação da rotina agendada — está separado do README porque descreve
infraestrutura, não o app.

## O que já roda hoje

| Job | Onde | Frequência | O que faz |
|---|---|---|---|
| `Beehiiv → RD + Supabase (Events Sync)` | n8n `zN6m5RkolKaDSG8N` | webhook | grava eventos de inscrição em `beehiiv_events` |
| `Beehiiv Stats Daily Sync` | n8n `Xoaq9t1yTy8sg7AF` | diário 06:00 BRT | atualiza `snapshot_*` de `beehiiv_editions` |

Nenhum dos dois popula engajamento por assinante — é essa a lacuna que a rotina
de 3 dias fecha.

## O que falta agendar

**Bloqueio atual:** o MCP do Beehiiv não é um conector claude.ai, então um agente
na nuvem não o alcança. Para criar a rotina, conectar primeiro em
<https://claude.ai/customize/connectors>.

A API REST v2 pública **não** substitui: os webhooks do Beehiiv não têm
`email.opened`/`email.clicked` e `expand[]=stats` do post não quebra por
assinante. O endpoint com essa granularidade só aparece via MCP
(`list_post_subscriber_engagement`).

### Passos da rotina

Conectores necessários: **Beehiiv** + **Supabase**.

1. `list_publications` → `pub_3f7d9a93-387d-4551-9a57-bebff578e5df`
2. `list_posts` com `status: "published"` → post_ids das edições
3. Para cada edição **ainda não sincronizada ou enviada nos últimos ~10 dias**:
   `list_post_subscriber_engagement` com `statuses: ["clicked"]`,
   `order_by: "most_clicks"`, `per_page: 100`, paginando até esgotar.
4. Upsert em `beehiiv_post_engagement` (PK `post_id, email`):

   ```sql
   insert into beehiiv_post_engagement
     (post_id, email, subscriber_id, status, last_engaged_at, total_clicked, total_opened)
   values (...)
   on conflict (post_id, email) do update set
     status = excluded.status,
     last_engaged_at = excluded.last_engaged_at,
     total_clicked = excluded.total_clicked,
     total_opened = excluded.total_opened,
     synced_at = now();
   ```

5. `list_post_clicks` por edição → upsert em `beehiiv_link_stats`.
6. `POST https://<dash>/api/revalidate` com `Authorization: Bearer $CRON_SECRET`.

### Cron

`0 9 */3 * *` — a cada 3 dias, 06:00 BRT (09:00 UTC), depois do sync diário de
edições.

## Lacuna conhecida: aberturas por assinante

O backfill de 31/07/2026 cobriu **apenas quem clicou** (164 registros nas 8
edições). Os ~1.150 abridores por edição não foram puxados: seriam ~9.200 linhas,
cerca de 92 chamadas paginadas.

Consequência: `v_lead_engagement.editions_opened` só conta quem também clicou. Por
isso o diretório em `/leads` mostra **edições clicadas**, não taxa de abertura por
lead — exibir "0%" para quem abriu mas não clicou seria mentira. A abertura
agregada por edição (`v_edition_performance`) está correta e vem do snapshot do
Beehiiv, sem depender disso.

Para fechar a lacuna, rodar o passo 3 com `statuses: ["opened"]` nas 8 edições.

## Filtro de scanner

`v_bot_accounts` é a peça que separa leitor de robô. Dois padrões, ambos
confirmados nos dados:

- **scanner de clique** — cliques ≈ aberturas (razão ≥ 0,85) com volume ≥ 10, em
  2+ edições. Reage em 160–457 s do envio.
- **inflador de abertura** — 40+ aberturas com razão < 0,15.

Mais os endereços de `beehiiv_internal_emails` (time Spark), editável por SQL sem
migration.

Validação em 31/07/2026: **348 cliques humanos de 1.155** (30%). Três leituras
independentes convergem — o relatório manual de 27/07 deu 32%, e o
`verified_clicks` nativo do Beehiiv dá ~30% na edição #8.

Ao adicionar uma edição nova, conferir se `v_bot_accounts` continua devolvendo as
contas conhecidas; scanner novo aparece de vez em quando (a `annie.annuseck@…`
estreou na #8).
