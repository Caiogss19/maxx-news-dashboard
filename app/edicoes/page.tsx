import { getEditions } from "@/lib/analytics";
import { Section } from "@/components/Section";
import { KPI } from "@/components/KPI";
import { EditionsTable } from "@/components/EditionsTable";
import { fmtNum, fmtPct } from "@/lib/format";

export const revalidate = 30;

export default async function Page() {
  const editions = await getEditions();

  const recipients = editions.reduce((a, e) => a + e.recipients, 0);
  const delivered = editions.reduce((a, e) => a + e.delivered, 0);
  const totalOpens = editions.reduce((a, e) => a + e.opens, 0);
  const totalUniqueOpens = editions.reduce((a, e) => a + e.unique_opens, 0);
  const totalClicks = editions.reduce((a, e) => a + e.unique_clicks, 0);
  const totalUnsubs = editions.reduce((a, e) => a + e.unsubscribes, 0);
  const avgOpen = editions.length ? editions.reduce((a, e) => a + e.open_rate, 0) / editions.length : 0;
  const best = [...editions].sort((a, b) => b.open_rate - a.open_rate)[0];

  return (
    <Section
      num="08"
      eyebrow="Desempenho por edição"
      title="Cada *edição*, dissecada."
      subtitle="Entregas, aberturas, cliques e descadastros de cada disparo da newsletter. Clique numa edição para abrir o detalhamento completo."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <KPI label="Edições enviadas" value={fmtNum(editions.length)} accent="navy" hint={`${fmtNum(recipients)} recipients totais`} />
        <KPI label="Entregas" value={fmtNum(delivered)} accent="ink" hint={`${fmtNum(recipients - delivered)} bounces / inválidos`} />
        <KPI label="Aberturas únicas" value={fmtNum(totalUniqueOpens)} accent="olive" hint={`${fmtNum(totalOpens)} aberturas totais`} />
        <KPI label="Cliques únicos" value={fmtNum(totalClicks)} accent="amber" hint={`${totalUnsubs} unsub via edições`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Abertura média" value={fmtPct(avgOpen)} accent="olive" hint="média simples entre edições" />
        <KPI
          label="Melhor edição"
          value={best ? fmtPct(best.open_rate) : "—"}
          accent="plum"
          hint={best ? `Ed. ${best.edition_number} · ${best.title}` : undefined}
        />
        <KPI
          label="Taxa de entrega"
          value={recipients ? fmtPct(Math.round((delivered / recipients) * 1000) / 10) : "—"}
          accent="ink"
          hint="entregues ÷ recipients"
        />
        <KPI
          label="Engajamento médio"
          value={delivered ? fmtPct(Math.round((totalUniqueOpens / delivered) * 1000) / 10) : "—"}
          accent="navy"
          hint="aberturas únicas ÷ entregas"
        />
      </div>
      <EditionsTable editions={editions} />
    </Section>
  );
}
