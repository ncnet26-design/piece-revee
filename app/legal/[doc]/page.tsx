import { notFound } from "next/navigation";
import { LEGAL } from "@/content/legal";
import { Crumbs } from "@/components/Crumbs";
import { meta } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() { return LEGAL.map((d) => ({ doc: d.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = LEGAL.find((x) => x.slug === doc);
  return d ? meta({ title: d.title, description: `${d.title} de Pièce Rêvée.`, path: `/legal/${d.slug}/` }) : {};
}

export default async function Page({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = LEGAL.find((x) => x.slug === doc);
  if (!d) notFound();
  return (
    <article className="max-w-[760px]">
      <Crumbs items={[{ name: d.title, href: `/legal/${d.slug}/` }]} />
      <h1 className="text-[clamp(30px,4vw,46px)]">{d.title}</h1>
      <p className="mt-2 text-sm text-muted">Mise à jour : {d.updated}</p>
      <p className="notice notice-warn mt-4">Document provisoire, en cours de relecture juridique. Les éléments entre crochets seront complétés avant l'ouverture des paiements.</p>
      {d.sections.map((s) => (
        <section key={s.h} className="mt-8"><h2 className="text-2xl">{s.h}</h2>{s.p.map((p, i) => <p key={i} className="mt-2">{p}</p>)}</section>
      ))}
    </article>
  );
}
