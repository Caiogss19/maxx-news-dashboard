import { getEditions } from "@/lib/analytics";
import { Section } from "@/components/Section";
import { KPI } from "@/components/KPI";
import { EditionsTable } from "@/components/EditionsTable";
import { fmtNum, fmtPct } from "@/lib/format";

export const revalidate = 30;

export default async function Page() {
  const editions = await getEditions();

  const delivered = editions.reduce((a, e) => a + e.delivered, 0);
  const avgOpen = editions.length ? editions.reduce((a, e) => a + e.open_rate, 0) / editions.length : 0;
  const avgCtr = editions.length ? editions.reduce((a, e) => a + e.ctr, 0) / editions.length : 0;
  const best = [...editions].sort((a, b) => b.open_rate - a.open_rate)[0];

  return (
    <Section
      num="08"
      eyebrow="Desempenho por edição"
      title="Cada *edição*, dissecada."
      subtitle="Entregas, aberturas, cliques e descadastros de cada disparo da newsletter. Clique numa edição para abrir o detalhamento completo."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Edições enviadas" value={fmtNum(editions.length)} accent="navy" />
        <KPI label="Entregas totais" value={fmtNum(delivered)} accent="ink" hint="somatório de todas as edições" />
        <KPI label="Abertura média" value={fmtPct(avgOpen)} accent="olive" hint="média simples entre edições" />
        <KPI
          label="Melhor edição"
          value={best ? fmtPct(best.open_rate) : "—"}
          accent="plum"
          hint={best ? `Ed. ${best.edition_number} · ${best.title}` : undefined}
        />
      </div>
      <EditionsTable editions={editions} />
    </Section>
  );
}
