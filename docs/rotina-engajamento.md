# Rotina semanal — engajamento por edição

Agente na nuvem que mantém `beehiiv_post_engagement` e `beehiiv_link_clicks` em dia.
Roda quarta de manhã, depois do envio de terça.

## Por que é um agente e não um workflow n8n

Testado em 12/08/2026, com as duas portas fechadas:

| Caminho | Resultado |
|---|---|
| REST v2 `/posts/{id}/clicks`, `/subscribers`, `/engagement`, `/stats` | **404** — a v2 não expõe engajamento por assinante |
| n8n chamando `https://mcp.beehiiv.com/mcp` com a credencial `Beehiiv API` | **401 `invalid_token`** — a MCP só aceita OAuth, não a chave de API |

Só a MCP do Beehiiv tem `list_post_subscriber_engagement` e `list_post_click_subscribers`,
e ela exige OAuth. Por isso o trabalho é de agente.

> ⚠️ A REST v2 **também não devolve `url_hash`**. O `stats.clicks[]` traz
> `url`, `base_url` e contagens, sem id de clique. O `url_hash` de
> `beehiiv_link_clicks` vem exclusivamente da MCP.

## Configuração

| Campo | Valor |
|---|---|
| Nome | Maxx News — Sync de engajamento por edição |
| Cron | `13 12 * * 3` (quarta 12:13 UTC = **09:13 BRT**) |
| Environment | `env_011KoRmYvqznR6oiNQiEL8oY` |
| Modelo | `claude-sonnet-5` |
| Conectores | **Beehiiv** + **Supabase** (`e6b7d74a-469e-424c-add4-9555336c4b5a`) |
| Repo | nenhum — o agente só fala com as MCPs |

O `connector_uuid` do Beehiiv sai da lista de conectores do claude.ai; a API
rejeita `mcp_connections` sem ele (`connector_uuid: Field required`), então não
dá para apontar a URL avulsa.

## Prompt do agente

```
Você mantém em dia os dados de engajamento por assinante da newsletter Maxx News.
Trabalhe sozinho e termine com um relatório curto do que mudou.

CONTEXTO FIXO
- Supabase project_id: rximtawdguljuwiektgx
- Publicação Beehiiv: pub_3f7d9a93-387d-4551-9a57-bebff578e5df
- A newsletter sai toda terça. Você roda na quarta de manhã.

POR QUE ESTA ROTINA EXISTE
A REST v2 do Beehiiv NÃO expõe engajamento por edição × assinante — /posts/{id}/clicks,
/subscribers, /engagement e /stats todos devolvem 404. Só a MCP do Beehiiv tem esse dado,
e a MCP exige OAuth (a chave de API do n8n recebe 401). Por isso este trabalho é de agente
e não de workflow n8n.

PASSO 1 — descobrir as lacunas
Rode no Supabase:

  select e.post_id, e.edition_number, e.sent_at,
         (select count(*) from beehiiv_post_engagement p where p.post_id = e.post_id) as engajamento,
         (select count(*) from beehiiv_link_clicks c where c.post_id = e.post_id) as cliques_detalhados
  from beehiiv_editions e
  where e.status = 'sent'
  order by e.edition_number desc;

Toda edição com engajamento = 0 ou cliques_detalhados = 0 precisa de backfill.
Comece pelas mais recentes.

PASSO 2 — engajamento por assinante
Para cada edição em falta, chame list_post_subscriber_engagement com statuses ['clicked']
e per_page 100, paginando até o fim. Grave em beehiiv_post_engagement com upsert:

  insert into beehiiv_post_engagement
    (post_id, email, subscriber_id, status, last_engaged_at, total_clicked, total_opened, synced_at)
  values (...)
  on conflict (post_id, email) do update set
    subscriber_id = excluded.subscriber_id, status = excluded.status,
    last_engaged_at = excluded.last_engaged_at, total_clicked = excluded.total_clicked,
    total_opened = excluded.total_opened, synced_at = excluded.synced_at;

O campo subscriber_id vai SEM o prefixo 'sub_' (é o uuid puro que a ferramenta
devolve em subscriber_id).

PASSO 3 — detalhamento de cliques por link
Para cada edição em falta, chame list_post_click_subscribers SEM url_hash (traz todos
os links de uma vez), per_page 100, paginando até o fim. Uma edição pode ter 200+ linhas
em 3 páginas.

Cada linha é UM evento de clique. A tabela beehiiv_link_clicks guarda um agregado por
(post_id, url_hash, email) com contagem. Então: crie uma tabela de staging temporária,
insira os eventos crus, agregue com count(*) e max(clicked_at), faça upsert em
beehiiv_link_clicks, e derrube a staging. Não tente agregar de cabeça.

Atenção: nessa ferramenta o campo vem como subscription_id COM prefixo 'sub_';
a tabela usa email como chave, então use o email.

PASSO 4 — hosts novos
Rode: select * from v_link_hosts_sem_categoria;
Se voltar alguma linha, são domínios que a edição nova trouxe e nenhuma regra classificou.
Insira em beehiiv_link_categorias escolhendo a categoria certa entre: imprensa, rede-social,
proprio, newsletter, material. Prioridade 60 para imprensa, 50 para rede social, 20 para
próprio, 30 para newsletter. Reporte quais você classificou.

REGRAS
- Coluna zerada em massa neste pipeline é quase sempre nome de campo errado, não ausência
  de dado. Se um upsert gravar tudo zero, pare e investigue em vez de seguir.
- Não filtre scanner/bot na gravação. A tabela guarda o dado cru; quem filtra é a view
  v_bot_accounts, aplicada na leitura. Filtrar aqui quebraria a auditoria.
- Não invente post_id. Use só os que vieram do passo 1.
- Se a MCP do Beehiiv não responder ou pedir autenticação, pare e diga isso claramente
  no relatório — não tente contornar pela REST v2, que não tem esses dados.

RELATÓRIO FINAL
Diga, por edição: quantas linhas de engajamento e de cliques você gravou, quais hosts
novos classificou, e qualquer coisa que tenha falhado.
```

## Estado em 12/08/2026

`beehiiv_post_engagement` cobre as 10 edições (backfill manual das #9 e #10 feito nesta data).
`beehiiv_link_clicks` só tem a **#8** — o resto fica para a primeira execução da rotina.

## Relacionado
- `Beehiiv-Engajamento-Sync` — o job n8n de 3 dias, que cobre o que a REST v2 alcança
- `Beehiiv-Filtro-Scanner` — `v_bot_accounts`, aplicada na leitura
