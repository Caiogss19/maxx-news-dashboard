# Rotina semanal — engajamento por edição

Agente na nuvem que mantém `beehiiv_post_engagement` e `beehiiv_link_clicks` em dia.
Roda quarta de manhã, depois do envio de terça.

- **Rotina:** `trig_01RpSbhiz97ogmajQiTXYMWB`
- **Painel:** <https://claude.ai/code/routines/trig_01RpSbhiz97ogmajQiTXYMWB>

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

### O de-para de `url_hash` (passo 4 da rotina)

`beehiiv_link_clicks` guarda `url_hash`; quem tem a URL legível é
`beehiiv_link_stats`. Como o sync n8n popula essa tabela pela REST v2, que não
devolve o campo, ele nascia **NULL** — e sem ele o painel sabe que houve clique
mas não em qual link.

O sintoma apareceu quando o backfill de cliques encheu `beehiiv_link_clicks`:
**814 de 882 cliques (92%) ficaram órfãos**, e a tela passou a exibir o hash cru.
Quebrava tanto o mapa de cliques da edição quanto o bloco "Links que clicou" do
lead. O passo 4 preenche o de-para via `list_post_clicks`, casando pela URL.

> 💡 **Sobram ~66 cliques órfãos e isso é esperado.** São exatamente 1 hash por
> pessoa por edição: links **personalizados** (preferências, descadastro) têm URL
> única por assinante e por isso não existem como linha agregada em
> `beehiiv_link_stats`. Não persiga esse resto.

## Configuração

| Campo | Valor |
|---|---|
| Cron | `13 12 * * 3` (quarta 12:13 UTC = **09:13 BRT**) |
| Environment | `env_011KoRmYvqznR6oiNQiEL8oY` |
| Modelo | `claude-sonnet-5` |
| Conectores | **Beehiiv** (`30a91542-5bd0-4929-b7ba-ed234dfd1dac`) + **Supabase** (`e6b7d74a-469e-424c-add4-9555336c4b5a`) |
| Repo | nenhum — o agente só fala com as MCPs |

> ⚠️ **O Beehiiv é conector personalizado e não aparece na lista automática de
> conectores** oferecida ao `/schedule`. O `connector_uuid` acima saiu da URL da
> tela de detalhe do conector no claude.ai. A API rejeita `mcp_connections` sem
> ele (`connector_uuid: Field required`), então não adianta apontar só a URL.

## A lição que custou uma execução

A primeira versão do prompt mandava pular edições que "já tinham algo" em
`beehiiv_link_clicks`. A edição 8 tinha um backfill antigo pela metade — 39 de 121
cliques — e a checagem por zero a ignorava. Ela ficaria incompleta para sempre.

A detecção agora **compara volume**: entra no backfill quem tiver menos de 90% dos
cliques esperados. E antes de reinserir uma edição parcial, apaga as linhas dela —
senão o upsert soma em cima do que já existe e infla a contagem.

> 💡 **`cliques_detalhados` ligeiramente ACIMA de `cliques_esperados` é normal**, não é
> bug. Fica ~7% acima em todas as edições porque quem clicou e depois descadastrou
> aparece nos eventos de clique mas sai do filtro `status='clicked'` do engajamento.
> Só trate como lacuna quando estiver **abaixo**.

## Prompt do agente

```
Voce mantem em dia os dados de engajamento por assinante da newsletter Maxx News.
Trabalhe sozinho e termine com um relatorio curto do que mudou.

CONTEXTO FIXO
- Supabase project_id: rximtawdguljuwiektgx
- Publicacao Beehiiv: pub_3f7d9a93-387d-4551-9a57-bebff578e5df
- A newsletter sai toda terca. Voce roda na quarta de manha.

POR QUE ESTA ROTINA EXISTE
A REST v2 do Beehiiv NAO expoe engajamento por edicao x assinante - /posts/{id}/clicks,
/subscribers, /engagement e /stats todos devolvem 404. So a MCP do Beehiiv tem esse dado,
e a MCP exige OAuth (a chave de API do n8n recebe 401). Por isso este trabalho e de agente
e nao de workflow n8n.

PASSO 1 - descobrir as lacunas
Rode no Supabase:

  select e.post_id, e.edition_number, e.sent_at,
         (select count(*) from beehiiv_post_engagement p where p.post_id = e.post_id) as engajamento,
         (select coalesce(sum(clicks),0) from beehiiv_link_clicks c where c.post_id = e.post_id) as cliques_detalhados,
         (select coalesce(sum(total_clicked),0) from beehiiv_post_engagement p where p.post_id = e.post_id) as cliques_esperados
  from beehiiv_editions e
  where e.status = 'sent'
  order by e.edition_number desc;

Uma edicao precisa de backfill se:
  (a) engajamento = 0, OU
  (b) cliques_detalhados < cliques_esperados * 0.9

A regra (b) importa: NAO basta checar se cliques_detalhados > 0. Um backfill antigo ou
interrompido deixa a edicao parcialmente preenchida, e a checagem por zero a ignoraria
para sempre. Foi o que aconteceu com a edicao 8, que ficou com 39 de 121 cliques.

cliques_detalhados um pouco ACIMA de cliques_esperados e normal, nao e erro: quem clicou
e depois descadastrou aparece nos eventos de clique mas sai do filtro status='clicked'
do engajamento. So trate como lacuna quando estiver abaixo.

Se nada precisar de backfill, diga isso e encerre.

PASSO 2 - engajamento por assinante (so para edicoes com engajamento = 0)
Chame list_post_subscriber_engagement com statuses ['clicked'] e per_page 100, paginando
ate o fim. Upsert em beehiiv_post_engagement:

  insert into beehiiv_post_engagement
    (post_id, email, subscriber_id, status, last_engaged_at, total_clicked, total_opened, synced_at)
  values (...)
  on conflict (post_id, email) do update set
    subscriber_id = excluded.subscriber_id, status = excluded.status,
    last_engaged_at = excluded.last_engaged_at, total_clicked = excluded.total_clicked,
    total_opened = excluded.total_opened, synced_at = excluded.synced_at;

subscriber_id vai SEM o prefixo 'sub_' (e o uuid puro do campo subscriber_id).

PASSO 3 - detalhamento de cliques por link
Para cada edicao marcada no passo 1, chame list_post_click_subscribers SEM url_hash
(traz todos os links de uma vez), per_page 100, paginando ate o fim. Uma edicao pode
ter 200+ linhas em 3 paginas.

Cada linha e UM evento de clique; beehiiv_link_clicks guarda um agregado por
(post_id, url_hash, email) com a contagem na coluna clicks. NAO agregue de cabeca:
salve os eventos crus num CSV, agregue com um script Python (count e max(clicked_at))
e gere o SQL a partir dele. Transcricao manual erra.

Se estiver refazendo uma edicao parcial, apague as linhas dela antes de inserir
(delete from beehiiv_link_clicks where post_id = '...') - senao o upsert soma em cima
do que ja existia e infla a contagem.

O identificador da ferramenta vem como subscription_id COM prefixo 'sub_'; a tabela usa
email como chave, entao use o email.

PASSO 4 - hosts novos
Rode: select * from v_link_hosts_sem_categoria;
Se voltar alguma linha, sao dominios que a edicao nova trouxe e nenhuma regra classificou.
Insira em beehiiv_link_categorias escolhendo entre: imprensa, rede-social, proprio,
newsletter, material. Prioridade 60 imprensa, 50 rede social, 20 proprio, 30 newsletter.
Reporte quais classificou.

PASSO 5 - conferir
Rode a query do passo 1 de novo e confirme que nenhuma edicao ficou abaixo de 90%.
Se alguma ficou, diga qual e por que.

REGRAS
- Coluna zerada em massa neste pipeline e quase sempre nome de campo errado, nao ausencia
  de dado. Se um upsert gravar tudo zero, pare e investigue.
- Nao filtre scanner/bot na gravacao. A tabela guarda o dado cru; quem filtra e a view
  v_bot_accounts, aplicada na leitura. Filtrar aqui quebraria a auditoria.
- Nao invente post_id. Use so os que vieram do passo 1.
- Se a MCP do Beehiiv nao responder ou pedir autenticacao, pare e diga isso no relatorio -
  nao tente contornar pela REST v2, que nao tem esses dados.

RELATORIO FINAL
Por edicao: quantas linhas de engajamento e de cliques gravou, quais hosts novos
classificou, o resultado da conferencia do passo 5, e o que falhou.
```

## Estado em 12/08/2026

As 10 edições cobertas nas duas tabelas, todas acima de 90% de detalhamento.
`beehiiv_link_clicks` saiu de **20 linhas em 1 edição** para **882 linhas em 10**,
e `beehiiv_link_stats.url_hash` de **13 de 256** para **256 de 256** — restam 66
cliques órfãos, todos de link personalizado (ver acima).

| Edição | Linhas | Detalhado | Esperado |
|---:|---:|---:|---:|
| 10 | 99 | 205 | 195 |
| 9 | 96 | 150 | 146 |
| 8 | 84 | 127 | 121 |
| 7 | 85 | 119 | 111 |
| 6 | 58 | 111 | 106 |
| 5 | 102 | 162 | 152 |
| 4 | 103 | 137 | 128 |
| 3 | 96 | 159 | 151 |
| 2 | 75 | 167 | 152 |
| 1 | 84 | 258 | 234 |

## Relacionado
- `Beehiiv-Engajamento-Sync` — o job n8n de 3 dias, que cobre o que a REST v2 alcança
- `Beehiiv-Filtro-Scanner` — `v_bot_accounts`, aplicada na leitura
