import { getSnapshot } from "@/lib/queries";
import { Section } from "@/components/Section";
import { KPI } from "@/components/KPI";
import { fmtNum } from "@/lib/format";

export const revalidate = 30;

export default async function Page() {
  const s = await getSnapshot();

  return (
    <Section
      num="06"
      eyebrow="Conteúdo enviado"
      title="Posts *que saíram*."
      subtitle="Eventos relacionados a posts (sent / updated / scheduled). Não tem email associado — vão direto pro Supabase, sem passar pelo RD."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Posts enviados" value={fmtNum(s.posts.sent)} accent="amber" hint="post.sent" />
        <KPI
          label="Posts agendados"
          value={fmtNum(s.posts.scheduled)}
          accent="ink"
          hint="post.scheduled"
        />
        <KPI label="Posts editados" value={fmtNum(s.posts.updated)} accent="ink" hint="post.updated" />
        <KPI
          label="Categorias ativas"
          value={s.events.byCategory.length}
          accent="navy"
          hint={s.events.byCategory.map((c) => c.category).join(" · ")}
        />
      </div>
    </Section>
  );
}
