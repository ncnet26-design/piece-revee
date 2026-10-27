import Link from "next/link";
import { notFound } from "next/navigation";
import { PLANTS } from "@/content/index";
import { Crumbs } from "@/components/Crumbs";
import { JsonLd } from "@/components/JsonLd";
import { FavButton } from "@/components/FavButton";
import { AskCamille } from "@/components/DetailBits";
import { YearRow } from "@/components/Calendar";
import { PlantCard } from "@/components/cards";
import { ShopLinks } from "@/components/ShopLinks";
import { meta } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return PLANTS.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PLANTS.find((x) => x.slug === slug);
  return p ? meta({ title: `${p.name} (${p.latin}) : exposition, arrosage, entretien`, description: `${p.name} : ${p.exposure.join(", ").toLowerCase()}, arrosage ${p.water.toLowerCase()}, ${p.hardinessC !== null ? `rustique jusqu'à ${p.hardinessC} °C` : "plante d'intérieur"}. ${p.notes}`, path: `/plantes/${p.slug}/` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PLANTS.find((x) => x.slug === slug);
  if (!p) notFound();
  const similar = PLANTS.filter((x) => x.id !== p.id && x.uses.some((u) => p.uses.includes(u)) && x.exposure.some((e) => p.exposure.includes(e))).slice(0, 4);
  return (
    <article>
      <Crumbs items={[{ name: "Plantes", href: "/plantes/" }, { name: p.name, href: `/plantes/${p.slug}/` }]} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="relative grid place-items-center overflow-hidden rounded-[var(--r)]" style={{ aspectRatio: "1 / 1", maxWidth: "100%", background: "linear-gradient(160deg, #DCE5D0, #7E9568)" }}>
          <span aria-hidden="true" className="font-display text-[120px] text-white/85">{p.name.charAt(0)}</span>
          <FavButton id={p.id} name={p.name} />
        </div>
        <div className="flex flex-col gap-4">
          <span className="eyebrow">{p.type}</span>
          <h1 className="text-[clamp(32px,4.4vw,52px)]">{p.name}</h1>
          <p className="text-lg text-muted"><i>{p.latin}</i></p>
          <dl className="kv">
            <dt>Exposition</dt><dd>{p.exposure.join(", ")}</dd>
            <dt>Rusticité</dt><dd>{p.hardinessC !== null ? `Jusqu'à environ ${p.hardinessC} °C (sol drainé)` : "Plante d'intérieur, craint le froid"}</dd>
            <dt>Arrosage</dt><dd>{p.water}</dd>
            <dt>Sol</dt><dd>{p.soil}</dd>
            <dt>Taille adulte</dt><dd>{p.heightCm[0]} à {p.heightCm[1]} cm</dd>
            <dt>Feuillage</dt><dd>{p.foliage}</dd>
            <dt>Usages</dt><dd>{p.uses.join(", ")}</dd>
          </dl>
          {p.toxicity ? <div className="notice notice-warn"><b>Toxicité.</b> {p.toxicity}</div> : <div className="notice">Pas de toxicité notable connue pour les animaux domestiques.</div>}
          <p>{p.notes}</p>
          <div className="flex flex-wrap gap-1.5"><AskCamille question={`Où et comment planter « ${p.name} » chez moi ?`} /><Link className="btn btn-sm btn-primary" href="/projet/nouveau/?space=Jardin">Mon projet de jardin</Link></div>
        </div>
      </div>
      <section className="section">
        <h2>Calendrier</h2>
        <div className="tw mt-3"><div className="flex min-w-[520px] flex-col gap-1.5">
          <YearRow label="Floraison" months={p.bloom} tone="bloom" />
          <YearRow label="Plantation" months={p.plant} tone="plant" />
          <YearRow label="Taille, entretien" months={p.prune} tone="prune" />
        </div></div>
      </section>
      <section className="section"><h2>Où l'acheter</h2><p className="mb-3 mt-1 text-muted">Trouvez « {p.name.toLowerCase()} » en jardinerie en ligne, ou chez un pépiniériste près de chez vous.</p>
        <ShopLinks query={p.name} kinds={["jardin"]} title="" />
        <a className="btn btn-sm mt-3" href="https://www.tela-botanica.org" target="_blank" rel="noopener noreferrer">Fiche botanique (Tela Botanica) ↗</a></section>
      {similar.length > 0 && <section className="section"><h2>Plantes compagnes</h2><div className="grid-cards mt-4">{similar.map((x) => <PlantCard key={x.id} p={x} />)}</div></section>}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: `${p.name} (${p.latin})`, about: { "@type": "Thing", name: p.latin }, description: p.notes, inLanguage: "fr-FR", url: absoluteUrl(`/plantes/${p.slug}/`) }} />
    </article>
  );
}
