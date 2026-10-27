import Link from "next/link";
import { notFound } from "next/navigation";
import { PLACES, PAIRINGS, PLACE_PHOTOS, materialById } from "@/content/index";
import { Crumbs } from "@/components/Crumbs";
import { JsonLd } from "@/components/JsonLd";
import { PlaceVisual } from "@/components/Visual";
import { FavButton } from "@/components/FavButton";
import { AskCamille } from "@/components/DetailBits";
import { PairingCard } from "@/components/cards";
import { meta } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return PLACES.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PLACES.find((x) => x.slug === slug);
  return p ? meta({ title: `${p.name} : ce qu'on peut lui emprunter chez soi`, description: `${p.name} (${p.author}, ${p.year}, ${p.location}) : ${p.lessons.join(" ; ")}.`, path: `/lieux/${p.slug}/` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PLACES.find((x) => x.slug === slug);
  if (!p) notFound();
  const pairings = PAIRINGS.filter((x) => x.placeId === p.id);
  const photo = PLACE_PHOTOS[p.id]?.[0];
  const commons = `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(p.commonsQuery)}&title=Special:MediaSearch&type=image`;
  return (
    <article>
      <Crumbs items={[{ name: "Lieux d'exception", href: "/lieux/" }, { name: p.name, href: `/lieux/${p.slug}/` }]} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[var(--r)] bg-soft" style={{ aspectRatio: "4 / 3", maxWidth: "100%" }}>
          {photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" />
            : <PlaceVisual palette={p.palette} seed={p.id} width={800} height={600} label={`Interprétation graphique de ${p.name}`} className="h-full w-full" />}
          <FavButton id={p.id} name={p.name} />
          {!photo && <span className="badge-ai">Interprétation graphique</span>}
        </div>
        <div className="flex flex-col gap-4">
          {photo && <p className="credit">Photo : {photo.author}, <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">{photo.source}</a> · {photo.license}</p>}
          <span className="eyebrow">{p.theme} · {p.year}</span>
          <h1 className="text-[clamp(32px,4.4vw,52px)]">{p.name}</h1>
          <dl className="kv"><dt>Par</dt><dd>{p.author}</dd><dt>Où</dt><dd>{p.location}, {p.country}</dd><dt>Visite</dt><dd>{p.visitable ? "Ouvert au public (horaires à vérifier)" : "Non visitable ou sur demande"}</dd></dl>
          <div><span className="eyebrow">Palette</span><div className="pal lg mt-2">{p.palette.map((c) => <span key={c} style={{ background: c }} title={c} />)}</div></div>
          <div><h2 className="eyebrow mb-2">À emprunter chez soi</h2><ul className="dots">{p.lessons.map((l) => <li key={l}>{l}</li>)}</ul></div>
          <div><h2 className="eyebrow mb-2">Matières clés</h2><div className="flex flex-wrap gap-1.5">{p.materials.map((id) => { const m = materialById.get(id); return m ? <Link key={id} className="chip" href={`/matieres/${m.slug}/`}>{m.name}</Link> : null; })}</div></div>
          <div className="flex flex-wrap gap-1.5">
            <a className="btn btn-sm btn-primary" href={commons} target="_blank" rel="noopener noreferrer">Photos libres sur Wikimedia Commons ↗</a>
            {p.officialUrl && <a className="btn btn-sm" href={p.officialUrl} target="_blank" rel="noopener noreferrer">Site officiel ↗</a>}
            <AskCamille question={`Comment m'inspirer de ${p.name} dans mon intérieur ou mon jardin ?`} />
          </div>
        </div>
      </div>
      {pairings.length > 0 && <section className="section"><h2>Accords inspirés de ce lieu</h2><div className="grid-cards wide mt-4">{pairings.map((x) => <PairingCard key={x.id} p={x} />)}</div></section>}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "LandmarksOrHistoricalBuildings", name: p.name, address: `${p.location}, ${p.country}`, url: absoluteUrl(`/lieux/${p.slug}/`), sameAs: p.officialUrl ?? undefined }} />
    </article>
  );
}
