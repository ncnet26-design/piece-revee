import Link from "next/link";
import { notFound } from "next/navigation";
import { STYLES, GALLERY, materialById } from "@/content/index";
import { Crumbs } from "@/components/Crumbs";
import { JsonLd } from "@/components/JsonLd";
import { Scene } from "@/components/Visual";
import { AskCamille } from "@/components/DetailBits";
import { MaterialCard } from "@/components/cards";
import { meta } from "@/lib/seo";
import { ProduitsDuStyle } from "@/components/catalogue/ProduitsDuStyle";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return STYLES.map((s) => ({ slug: s.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = STYLES.find((x) => x.slug === slug);
  return s ? meta({ title: `Style ${s.name} : les clés, les matières, les erreurs à éviter`, description: `${s.summary} ${s.budgetTip}`, path: `/styles/${s.slug}/` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = STYLES.find((x) => x.slug === slug);
  if (!s) notFound();
  const mats = s.materials.map((id) => materialById.get(id)).filter((m) => m !== undefined);
  const spaces = GALLERY.filter((g) => g.styleId === s.id);
  return (
    <article>
      <Crumbs items={[{ name: "Styles", href: "/styles/" }, { name: s.name, href: `/styles/${s.slug}/` }]} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[var(--r)] bg-soft" style={{ aspectRatio: "4 / 3", maxWidth: "100%" }}>
          <Scene spec={{ scope: s.scope, space: s.scope === "interieur" ? "Salon" : "Terrasse", palette: s.palette, seed: s.id.length * 977 }} width={800} height={600} label={`Illustration du style ${s.name}`} className="h-full w-full" />
        </div>
        <div className="flex flex-col gap-4">
          <span className="eyebrow">Style · {s.scope === "interieur" ? "Intérieur" : "Extérieur"}</span>
          <h1 className="text-[clamp(32px,4.4vw,52px)]">{s.name}</h1>
          <p className="text-lg text-muted">{s.summary}</p>
          <div><span className="eyebrow">Palette</span><div className="pal lg mt-2">{s.palette.map((c) => <span key={c} style={{ background: c }} title={c} />)}</div></div>
          <div><h2 className="eyebrow mb-2">Les clés</h2><ul className="dots">{s.keys.map((k) => <li key={k}>{k}</li>)}</ul></div>
          <div><h2 className="eyebrow mb-2">À éviter</h2><ul className="dots warn">{s.avoid.map((k) => <li key={k}>{k}</li>)}</ul></div>
          <div className="flex flex-wrap gap-1.5"><Link className="btn btn-primary" href={`/projet/nouveau/?style=${s.id}`}>Appliquer ce style à ma pièce</Link><Link className="btn" href={`/galerie/?style=${s.slug}`}>Voir les inspirations</Link><AskCamille question={`Comment adopter le style ${s.name} chez moi avec un petit budget ?`} /></div>
        </div>
      </div>
      <section className="section grid gap-4 md:grid-cols-2">
        <div className="panel"><h2 className="text-xl">Petit budget</h2><p className="mt-2 text-muted">{s.budgetTip}</p></div>
        <div className="panel"><h2 className="text-xl">Locataire</h2><p className="mt-2 text-muted">{s.rentalTip}</p></div>
      </section>
      <section className="section"><h2>Ses matières</h2><div className="grid-cards mt-4">{mats.map((m) => <MaterialCard key={m.id} m={m} />)}</div></section>
      <section className="section"><h2>Pièce par pièce</h2><div className="mt-3 flex flex-wrap gap-1.5">{spaces.map((g) => <Link key={g.id} className="chip" href={`/galerie/?g=${g.id}`}>{g.space}</Link>)}</div></section>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: `Style ${s.name}`, description: s.summary, inLanguage: "fr-FR", url: absoluteUrl(`/styles/${s.slug}/`) }} />
      <ProduitsDuStyle styleId={s.id} />
    </article>
  );
}
