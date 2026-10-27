import Link from "next/link";
import { notFound } from "next/navigation";
import { MATERIALS, PAIRINGS, PLACES, STYLES } from "@/content/index";
import { Crumbs } from "@/components/Crumbs";
import { JsonLd } from "@/components/JsonLd";
import { MaterialSwatch } from "@/components/Visual";
import { FavButton } from "@/components/FavButton";
import { AskCamille } from "@/components/DetailBits";
import { PairingCard } from "@/components/cards";
import { ShopLinks } from "@/components/ShopLinks";
import { meta } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { realTexture } from "@/lib/textures";

export const dynamicParams = false;
export function generateStaticParams() { return MATERIALS.map((m) => ({ slug: m.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = MATERIALS.find((x) => x.slug === slug);
  return m ? meta({ title: `${m.name} : usages, entretien, prix et alternatives`, description: `${m.summary} Où l'utiliser, comment l'entretenir, prix indicatif et version petit budget.`, path: `/matieres/${m.slug}/` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = MATERIALS.find((x) => x.slug === slug);
  if (!m) notFound();
  const pairings = PAIRINGS.filter((p) => p.materials.includes(m.id));
  const places = PLACES.filter((p) => p.materials.includes(m.id));
  const styles = STYLES.filter((s) => s.materials.includes(m.id));
  return (
    <article>
      <Crumbs items={[{ name: "Matériauthèque", href: "/matieres/" }, { name: m.name, href: `/matieres/${m.slug}/` }]} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="relative overflow-hidden rounded-[var(--r)] bg-soft" style={{ aspectRatio: "1 / 1", maxWidth: "100%" }}>
          <MaterialSwatch texture={m.texture} colors={m.colors} seed={m.id} width={720} height={720} label={`Échantillon dessiné : ${m.name}`} className="h-full w-full" />
          <FavButton id={m.id} name={m.name} />
          {realTexture(m.id) && <p className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] text-white">Texture « {realTexture(m.id)!.name} », <a href={realTexture(m.id)!.url} className="text-white underline" target="_blank" rel="noopener noreferrer">Poly Haven</a>, CC0</p>}
        </div>
        <div className="flex flex-col gap-4">
          <span className="eyebrow">Matière · {m.family}</span>
          <h1 className="text-[clamp(32px,4.4vw,52px)]">{m.name}</h1>
          <p className="text-lg text-muted">{m.summary}</p>
          <dl className="kv">
            <dt>Origine</dt><dd>{m.origin}</dd>
            <dt>Prix indicatif</dt><dd>{m.priceRange}</dd>
            <dt>Où</dt><dd>{[m.interior && "Intérieur", m.exterior && "Extérieur"].filter(Boolean).join(" et ")}</dd>
            <dt>Locataire</dt><dd>{m.rentalFriendly ? "Possible sans travaux" : "Demande des travaux"}</dd>
          </dl>
          <div><h2 className="eyebrow mb-2">Où l'utiliser</h2><ul className="dots">{m.uses.map((u) => <li key={u}>{u}</li>)}</ul></div>
          <div><h2 className="eyebrow mb-2">Entretien</h2><p>{m.care}</p></div>
          <div className="notice"><b>Version petit budget.</b> {m.budgetAlternative}</div>
          <div className="flex flex-wrap gap-1.5"><AskCamille question={`Comment utiliser « ${m.name} » chez moi, avec quoi l'associer et à quel budget ?`} /><Link className="btn btn-sm btn-primary" href="/projet/nouveau/">L'essayer dans ma pièce</Link></div>
        </div>
      </div>

      <section className="section">
        <h2>Pose pas à pas</h2>
        <ol className="mt-3 flex max-w-[68ch] flex-col gap-2 pl-5">{m.laying.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="notice mt-3">Pour les supports anciens, les zones humides ou les grandes surfaces, faites appel à un artisan et demandez plusieurs devis.</p>
      </section>

      <section className="section">
        <h2>Où l'acheter</h2>
        <p className="mb-3 mt-1 text-muted">Trouvez « {m.name.toLowerCase()} » chez les enseignes françaises : vous accédez directement à leurs produits, avec leurs prix.</p>
        <ShopLinks query={m.name} kinds={["bricolage", "deco"]} title="" />
      </section>

      {pairings.length > 0 && <section className="section"><h2>Accords avec cette matière</h2><div className="grid-cards wide mt-4">{pairings.map((p) => <PairingCard key={p.id} p={p} />)}</div></section>}
      {(places.length > 0 || styles.length > 0) && (
        <section className="section"><h2>On la retrouve dans</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {styles.map((s) => <Link key={s.id} className="chip" href={`/styles/${s.slug}/`}>Style {s.name}</Link>)}
            {places.map((p) => <Link key={p.id} className="chip" href={`/lieux/${p.slug}/`}>{p.name}</Link>)}
          </div>
        </section>
      )}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: `${m.name} : usages, entretien et alternatives`, about: m.name, description: m.summary, inLanguage: "fr-FR", url: absoluteUrl(`/matieres/${m.slug}/`) }} />
    </article>
  );
}
