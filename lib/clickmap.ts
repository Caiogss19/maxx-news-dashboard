/**
 * Sobrepõe o mapa de cliques no HTML do e-mail enviado.
 *
 * Funciona porque o render do Beehiiv traz as **URLs cruas**, com os mesmos UTMs
 * gravados em `beehiiv_link_stats` — não há redirect de tracking no meio. Então o
 * casamento é por igualdade exata de string, sem normalização nem heurística.
 *
 * Puro: recebe strings, devolve strings. Sem DOM, roda no server.
 */

export type LinkStat = {
  url: string;
  urlHash: string | null;
  clicks: number;
  uniqueClicks: number;
  verifiedClicks: number;
  verifiedUniqueClicks: number;
};

export type MapaDeCliques = {
  /** HTML pronto para o srcDoc do iframe. */
  html: string;
  /** Links do e-mail que casaram com o tracking, na ordem em que aparecem. */
  marcados: Array<LinkStat & { idx: number }>;
  /**
   * Links com clique registrado que NÃO estão no corpo do e-mail — rodapé,
   * unsubscribe, preferências. Existem no tracking mas não têm posição no mapa,
   * então precisam ser listados à parte em vez de sumir.
   */
  foraDoCorpo: LinkStat[];
};

/** Escapa para inserir com segurança dentro de um atributo HTML. */
function escaparAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * O render do Beehiiv acrescenta `_bhlid` (id do link por destinatário) a cada
 * href, então a URL do HTML é a do tracking **mais** esse parâmetro. Comparar
 * string inteira falha; normalizar remove o ruído por destinatário.
 */
export function normalizarUrl(url: string): string {
  return url
    .replace(/[?&]_bhlid=[^&#]*/gi, "")
    .replace(/[?&]utm_id=[^&#]*/gi, "")
    .replace(/#.*$/, "")
    .replace(/[?&]$/, "");
}

/**
 * Faixa de calor por cliques verificados. Cinco níveis, usando os tokens do
 * dash — não uma paleta nova. Zero verificado tem faixa própria: o link existe,
 * foi clicado, mas só por varredura automática.
 */
export function faixaDeCalor(verificados: number): 0 | 1 | 2 | 3 | 4 {
  if (verificados <= 0) return 0;
  if (verificados <= 1) return 1;
  if (verificados <= 3) return 2;
  if (verificados <= 6) return 3;
  return 4;
}

const ESTILO = `
<style id="cm-style">
  a[data-cm] {
    position: relative !important;
    outline: 2px solid var(--cm-c) !important;
    outline-offset: 2px !important;
    border-radius: 2px !important;
    cursor: pointer !important;
  }
  a[data-cm]:hover { outline-width: 3px !important; }
  /* Só a primeira ocorrência de cada destino carrega data-cm-v — e portanto badge. */
  a[data-cm-v]::after {
    content: attr(data-cm-v);
    position: absolute;
    top: -9px;
    right: -9px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--cm-c);
    color: #0B0D10;
    font: 700 10px/16px ui-monospace, monospace;
    text-align: center;
    z-index: 2147483647;
    pointer-events: none;
  }
  a[data-cm-heat="0"] { --cm-c: #6C7075; }
  a[data-cm-heat="1"] { --cm-c: #5B9BD5; }
  a[data-cm-heat="2"] { --cm-c: #3CCB7F; }
  a[data-cm-heat="3"] { --cm-c: #F5B63F; }
  a[data-cm-heat="4"] { --cm-c: #FF6B35; }
  /* Âncoras internas (#secao) não têm clique rastreado — não recebem marcação. */
</style>`;

const SCRIPT = `
<script>
(function () {
  // Intercepta o clique para abrir o painel no dash em vez de navegar. O
  // sandbox do iframe já bloqueia navegação, mas o preventDefault evita o
  // erro no console e o flash visual.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[data-cm]');
    if (!a) { e.preventDefault(); return; }
    e.preventDefault();
    parent.postMessage({ cm: Number(a.getAttribute('data-cm')) }, '*');
  }, true);

  function altura() {
    var h = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0
    );
    parent.postMessage({ cmHeight: h }, '*');
  }
  window.addEventListener('load', altura);
  document.addEventListener('DOMContentLoaded', altura);
  setTimeout(altura, 400);
  setTimeout(altura, 1500);
})();
</script>`;

export function montarMapaDeCliques(
  html: string | null | undefined,
  links: LinkStat[]
): MapaDeCliques | null {
  if (!html) return null;

  // Índice por URL normalizada. Uma passada só sobre os href do documento —
  // evita o problema de uma URL ser prefixo de outra e não depende de ordem.
  const porUrl = new Map<string, LinkStat>();
  for (const l of links) porUrl.set(normalizarUrl(l.url), l);

  const marcados: Array<LinkStat & { idx: number }> = [];
  const idxPorUrl = new Map<string, number>();

  const saidaBruta = html.replace(/href="([^"]*)"/g, (inteiro, href: string) => {
    const chave = normalizarUrl(href);
    const link = porUrl.get(chave);
    if (!link) return inteiro; // âncora interna, imagem, link não rastreado

    // Mesmo destino aparecendo várias vezes no bloco (imagem + título + label)
    // reaproveita o índice. Só a primeira ocorrência leva o badge — as demais
    // ficam com o contorno, senão um bloco vira uma nuvem de números repetidos.
    let idx = idxPorUrl.get(chave);
    const primeira = idx === undefined;
    if (primeira) {
      idx = marcados.length;
      idxPorUrl.set(chave, idx);
      marcados.push({ ...link, idx });
    }

    const heat = faixaDeCalor(link.verifiedClicks);
    return (
      `href="${escaparAttr(href)}"` +
      ` data-cm="${idx}"` +
      (primeira ? ` data-cm-v="${link.verifiedClicks}"` : "") +
      ` data-cm-heat="${heat}"`
    );
  });

  let saida = saidaBruta;

  const foraDoCorpo = links.filter(
    (l) => !idxPorUrl.has(normalizarUrl(l.url)) && l.clicks > 0
  );

  // Injeta antes de </head> quando existe; senão prefixa, que ainda funciona em
  // srcDoc porque o browser normaliza o documento.
  const extras = ESTILO + SCRIPT;
  saida = saida.includes("</head>")
    ? saida.replace("</head>", `${extras}</head>`)
    : extras + saida;

  return { html: saida, marcados, foraDoCorpo };
}
