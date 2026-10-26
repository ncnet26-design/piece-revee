import Link from "next/link";
import { notFound } from "next/navigation";
import { PAIRINGS, materialById, placeById } from "@/content/index";
import { Crumbs } from "@/components/Crumbs";
import { JsonLd } from "@/components/JsonLd";
import { TripleSwatch, MaterialCard } from "@/components/cards";
import { FavButton } from "@/components/FavButton";
import { AskCamille } from "@/components/DetailBits";
import { meta } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return PAIRINGS.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PAIRINGS.find((x) => x.slug === slug);
  return p ? meta({ title: `Accord ${p.name} : trois matières, une ambiance`, description: `${p.mood} ${p.why}`, path: `/accords/${p.slug}/` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PAIRINGS.find((x) => x.slug === slug);
  if (!p) notFound();
  const mats = p.materials.map((id) => materialById.get(id)).filter((m) => m !== undefined);
  const place = p.placeId ? placeById.get(p.placeId) : undefined;
  return (
    <article>
      <Crumbs items={[{ name: "Accords", href: "/accords/" }, { name: p.name, href: `/accords/${p.slug}/` }]} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[var(--r)]" style={{ aspectRatio: "4 / 3", maxWidth: "100%" }}><TripleSwatch ids={p.materials} /><FavButton id={p.id} name={p.name} /></div>
        <div className="flex flex-col gap-4">
          <span className="eyebrow">Accord de matières</span>
          <h1 className="text-[clamp(32px,4.4vw,52px)]">{p.name}</h1>
          <p className="text-lg text-muted">{p.mood}</p>
          <div><h2 className="eyebrow mb-2">Pourquoi ça marche</h2><p>{p.why}</p></div>
          <dl className="kv"><dt>Proportions</dt><dd>{p.ratio}</dd><dt>Idéal pour</dt><dd>{p.rooms.join(", ")}</dd></dl>
          {place && <p className="notice">À voir en vrai : <Link href={`/lieux/${place.slug}/`}>{place.name}</Link></p>}
          <div className="flex flex-wrap gap-1.5"><AskCamille question={`Comment appliquer l'accord « ${p.name} » dans ma pièce ?`} /><Link className="btn btn-sm btn-primary" href="/projet/nouveau/">L'appliquer à ma pièce</Link></div>
        </div>
      </div>
      <section className="section"><h2>Les trois matières</h2><div className="grid-cards mt-4">{mats.map((m) => <MaterialCard key={m.id} m={m} />)}</div></section>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: `Accord ${p.name}`, description: p.why, inLanguage: "fr-FR", url: absoluteUrl(`/accords/${p.slug}/`) }} />
    </article>
  );
}
