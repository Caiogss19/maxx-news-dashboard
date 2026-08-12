# Sync semanal — carteira CustomerX

Mantém a aba `/clientes` viva. Roda **segunda 05:00 BRT**, antes da newsletter de terça.

- **Workflow n8n:** `BcX0NCTseQFZ5fCS` — *Carteira CustomerX -> Dash Maxx News (semanal)*
- **Substitui:** `kudw00d3RZQxCWn2` (versão diária, arquivada)

## O que ele faz

```
API CustomerX  ──▶  projeto Analytics          ──▶  projeto do dash
/clients            bypass_customerx_clients        clientes_customerx
/contracts          bypass_customerx_contracts      (via v_clientes_newsletter_feed)
```

Três etapas, nessa ordem, sequenciais de propósito: o feed só pode ser lido depois
que as duas tabelas de origem já foram atualizadas.

## O bug que originou esta versão

A primeira versão do job era **diária** e só copiava `v_clientes_newsletter_feed` do
projeto Analytics para o dash. O problema é que **ninguém alimentava o Analytics**:

| Tabela | Última ingestão |
|---|---|
| `bypass_customerx_clients` | 24/06/2026 |
| `bypass_customerx_contracts` | 24/06/2026 |
| `bypass_pipedrive_deals` (comparação) | 12/08/2026 |

O Pipedrive tem ETL vivo; o CustomerX era um **snapshot manual de 24/06**. Copiar isso
todo dia às 5h teria dado a impressão perfeita de um dado fresco — 333 linhas, `synced_at`
de ontem — em cima de uma carteira de sete semanas atrás. Em 12/08 a API já tinha
**345 clientes e 351 contratos**: 12 clientes e 17 contratos que o dash nunca veria.

Por isso a fonte agora é a própria API, e não o espelho.

## Por que passa pelo Analytics em vez de ir direto ao dash

Porque `plano`, `carteira` e `mrr` não são colunas da API — são derivados:

| Campo | De onde sai |
|---|---|
| `plano` | `raw_payload -> custom_attributes[]` onde `name ~* 'plano'` |
| `carteira` | `raw_payload -> portfolio ->> description`, sem o prefixo `"Carteira "` |
| `mrr` | soma de `contract_value` dos contratos com `status = 'active'` |

Essa regra já mora na view `v_clientes_newsletter_feed`. Reimplementar em JS duplicaria
a lógica em dois lugares — e deixaria o Analytics congelado, que é o problema que esta
versão veio resolver. Por isso o `raw_payload` inteiro é gravado, não só as colunas.

## A API do CustomerX

`https://api.customerx.com.br/api/v1` · credencial n8n **`Custumer X`** (Header Auth,
`Authorization` com o token puro, **sem** `Bearer`).

| Detalhe | Valor |
|---|---|
| Envelope | **array puro**, não `{data: []}` |
| Paginação | `?page=N`, 20 por página, começa em 1 |
| Total | headers `x-total`, `x-pages`, `x-page`, `x-per-page` |
| Rate limit | 60 req/min → `requestInterval: 1100` |
| Endpoints usados | `/clients` (345), `/contracts` (351) |

> ⚠️ **`/contract-plans` devolve 404.** O plano do contrato vem embutido em
> `contract.contract_plan` — não existe endpoint separado.

> ⚠️ **`/contracts` não devolve `created_at` nem `updated_at`.** Por isso
> `cx_created_at` e `cx_updated_at` ficam **fora** do payload de upsert: mandar `null`
> apagaria o que o snapshot de junho já tinha gravado. Em `/clients` os dois campos
> existem e são enviados normalmente.

### MRR

`mrr_estimado` e `arr_estimado` não vêm da API — são calculados. No snapshot de 24/06,
`mrr_estimado == contract_value` e `arr_estimado == contract_value * 12` nas **334
linhas**, sem exceção: o `contract_value` do CustomerX já é mensal. O job reproduz
exatamente isso, para o MRR da view não mudar de significado no meio do caminho.

## Credenciais — os nomes não indicam o projeto

Testado empiricamente em 12/08/2026, um GET por credencial:

| Credencial | Projeto | Resultado |
|---|---|---|
| `Supabase Analytics REST` | `xkdpbhzkhzxivwtcfulm` | ✅ 200 |
| `GROWTH ANALYTICS` | `xkdpbhzkhzxivwtcfulm` | ✅ 200 |
| `Supabase account` | `rximtawdguljuwiektgx` (dash) | ✅ 200 |
| `Supabase Spark` | Analytics | ❌ 401 |
| `Supabase_Spark_MAXX` | Analytics | ❌ 401 |
| `Supabase account` | Analytics | ❌ 401 |

O job usa **`Supabase Analytics REST`** nas três chamadas ao Analytics e
**`Supabase account`** no upsert do dash.

> ⚠️ O criador de workflow do n8n **não auto-atribui credencial em nó HTTP Request**.
> A versão diária anterior tinha os dois nós HTTP **sem credencial nenhuma** — nunca
> teria rodado. Depois de criar ou editar, conferir nó a nó.

## Guardas

Cada etapa falha alto em vez de gravar pela metade — espelho velho é melhor que espelho
quebrado, e nenhum nó usa `neverError`:

- `/clients` ou `/contracts` vazio → erro
- menos de **250** linhas em qualquer um dos dois → erro (a API tem 345/351; menos que
  isso é quase sempre paginação que parou na primeira página, não carteira que encolheu)
- feed voltando **exatamente 1000** linhas → erro, é o corte do PostgREST, não um total
  real. Já mordeu duas vezes neste projeto.

## O que ele **não** faz

Não apaga. Cliente removido do CustomerX continua no espelho. Cancelamento não some da
carteira — vira `contract_status = 'contract_canceled'`, que é o que a aba `/clientes`
já trata. Se um dia for preciso remover de verdade, é um passo novo, não um efeito
colateral do upsert.

## Relacionado

- `rotina-engajamento.md` — a rotina de agente que cobre o Beehiiv
- `Base Clientes Sprout` (vault) — o recorte Sprout da mesma base, que agora também
  desatualiza junto se este job parar
