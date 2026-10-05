// `postcss-import` vem antes do Tailwind: os `spk-*.css` copiados da Central
// declaram `@layer components`, e o Tailwind 3 só aceita essa camada num
// arquivo que tenha `@tailwind components`. Inlinando o @import, as duas peças
// chegam ao Tailwind como um arquivo só. (O pacote já vem com o tailwindcss.)
export default {
  plugins: {
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {}
  }
};
