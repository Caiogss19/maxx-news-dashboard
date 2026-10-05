// Remonta a cada navegação: é o que faz a troca de aba entrar com a animação
// `spk-entrar` da Central, em vez de o conteúdo novo aparecer de estalo.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="spk-entrar">{children}</div>;
}
