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

## Duas fontes, dois papéis

| Tabela | Fonte | Cobre | Serve para |
|---|---|---|---|
| `beehiiv_subscriber_stats` | REST v2 `/subscriptions?expand[]=stats` | base inteira (4.015) | abertura e clique por lead, incluindo quem abre e nunca clica |
| `beehiiv_post_engagement` | MCP `list_post_subscriber_engagement` | só quem engajou, por edição | recorrência ("8 de 8"), timestamp, detecção de scanner |

O objeto `stats` da API devolve, por assinante:

```
total_sent · total_received · total_unique_opened
total_clicked · total_unique_clicked · open_rate · click_rate
```

**Atenção:** não são `emails_received` nem `click_through_rate`, como a doc
pública sugere. A primeira versão deste sync usou esses nomes e gravou 0 nas
4.015 linhas sem erro nenhum — o upsert só não encontrava os campos.

Estado em 31/07/2026: 3.936 leads com envio, 2.227 com abertura, 149 com clique.
A abertura média por lead (33,2%) bate com a agregada por edição (32,9%), o que
valida o número por dois caminhos independentes.

O que ainda só existe via MCP é a granularidade **por edição × assinante** — os
`total_unique_opened` da REST dizem *quantas* o lead abriu, não *quais*.

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
