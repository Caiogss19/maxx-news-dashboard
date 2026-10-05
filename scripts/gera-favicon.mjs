/**
 * Gera os PNGs e o .ico do favicon a partir de `app/icon.svg`.
 *
 * O SVG é a fonte única. Os derivados existem para quem não lê SVG — o Safari,
 * o atalho de tela inicial do iOS e quem pede `/favicon.ico` direto — e são
 * GERADOS, nunca desenhados: dois desenhos separados divergem no primeiro
 * retoque, e ninguém percebe porque favicon é a última coisa que alguém olha.
 *
 *   npm run favicon
 *
 * Adaptado de `spark-mailing/scripts/gera-favicon.mjs` para as convenções de
 * arquivo do Next (`app/icon.*`, `app/apple-icon.png`, `app/favicon.ico`), que
 * viram as tags <link> sozinhas. Usa o Chrome for Testing do cache do
 * Playwright — sem baixar navegador novo.
 *
 * O PNG é `icon1.png`, não `icon.png`: com `icon.svg` e `icon.png` de mesmo nome
 * o Next emite só UMA tag e o SVG some do <head>. Numerado, saem as duas.
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { homedir } from "node:os";

function chromeDoPlaywright() {
  const cache = path.join(homedir(), "Library/Caches/ms-playwright");
  for (const d of fs.readdirSync(cache).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
    const p = path.join(cache, d, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Chrome for Testing do Playwright não encontrado em " + cache);
}

const SVG = "app/icon.svg";
// O ícone do iOS NÃO pode ser transparente: o iOS compõe sobre branco e o canto
// arredondado aparece como uma mordida branca. O fundo é o ouro da marca.
const OURO = "#F5B800";
const SAIDAS = [
  { arq: "app/apple-icon.png", px: 180, fundo: OURO },
  { arq: "app/icon1.png", px: 32, fundo: null }
];

if (!fs.existsSync(SVG)) {
  console.error(`✗ falta ${SVG} — ele é a fonte, não o resultado.`);
  process.exit(1);
}
const svg = fs.readFileSync(SVG, "utf8");

async function renderiza(pg, px, fundo) {
  await pg.setViewportSize({ width: px, height: px });
  await pg.setContent(
    `<html><body style="margin:0;background:${fundo ?? "transparent"}">` +
      `<div style="width:${px}px;height:${px}px">${svg.replace(/width="64" height="64"/, `width="${px}" height="${px}"`)}</div>` +
      "</body></html>"
  );
  return pg.screenshot({ omitBackground: !fundo });
}

/** .ico com PNGs dentro (aceito por todo navegador desde o Vista/IE9). */
function ico(pngs) {
  const cab = Buffer.alloc(6 + 16 * pngs.length);
  cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(pngs.length, 4);
  let off = cab.length;
  pngs.forEach(({ px, buf }, i) => {
    const e = 6 + 16 * i;
    cab.writeUInt8(px >= 256 ? 0 : px, e); cab.writeUInt8(px >= 256 ? 0 : px, e + 1);
    cab.writeUInt16LE(1, e + 4); cab.writeUInt16LE(32, e + 6);
    cab.writeUInt32LE(buf.length, e + 8); cab.writeUInt32LE(off, e + 12);
    off += buf.length;
  });
  return Buffer.concat([cab, ...pngs.map((p) => p.buf)]);
}

const navegador = await chromium.launch({ executablePath: chromeDoPlaywright() });
try {
  const pg = await navegador.newPage({ deviceScaleFactor: 1 });
  for (const { arq, px, fundo } of SAIDAS) {
    fs.writeFileSync(arq, await renderiza(pg, px, fundo));
    console.log(`  ${arq}  (${px}×${px}, ${(fs.statSync(arq).size / 1024).toFixed(1)} kB)`);
  }
  const pngs = [];
  for (const px of [16, 32, 48]) pngs.push({ px, buf: await renderiza(pg, px, null) });
  fs.writeFileSync("app/favicon.ico", ico(pngs));
  console.log(`  app/favicon.ico  (16/32/48, ${(fs.statSync("app/favicon.ico").size / 1024).toFixed(1)} kB)`);
} finally {
  await navegador.close();
}
console.log(`\n✓ gerados de ${path.basename(SVG)} — não edite à mão, rode "npm run favicon"`);
