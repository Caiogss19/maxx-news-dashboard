// O esqueleto enquanto a tela renderiza no servidor — sem shimmer, como a
// Central (`Carregando`): animação aqui gastaria frame justo durante a carga.
export default function Loading() {
  return (
    <div className="spk-pilha" aria-busy="true" aria-live="polite">
      <div className="spk-skel spk-skel--titulo" />
      <div className="spk-skel spk-skel--linha" style={{ width: "55%" }} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginTop: "var(--s-6)" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="spk-skel spk-skel--bloco" style={{ minHeight: 118 }} />
        ))}
      </div>
      <div className="spk-skel spk-skel--bloco" style={{ minHeight: 280 }} />
    </div>
  );
}
