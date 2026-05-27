import { getSnapshot } from "@/lib/queries";
import { Section } from "@/components/Section";
import { Timeseries } from "@/components/Timeseries";

export const revalidate = 30;

export default async function Page() {
  const s = await getSnapshot();

  return (
    <Section
      num="02"
      eyebrow="Crescimento da base"
      title="Como a base *se move* no tempo."
      subtitle="Inscrições e cancelamentos por dia. Saldo líquido mostra se a base está crescendo ou contraindo."
    >
      <Timeseries data={s.timeseries.daily} />
    </Section>
  );
}
