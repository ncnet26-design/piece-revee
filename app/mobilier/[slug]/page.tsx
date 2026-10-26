import Link from "next/link";
import { notFound } from "next/navigation";
import { FURNITURE } from "@/content/index";
import { Crumbs } from "@/components/Crumbs";
import { JsonLd } from "@/components/JsonLd";
import { TripleSwatch, FurnitureCard } from "@/components/cards";
import { FavButton } from "@/components/FavButton";
import { AskCamille } from "@/components/DetailBits";
import { meta } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return FURNITURE.map((f) => ({ slug: f.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = FURNITURE.find((x) => x.slug === slug);
  return f ? meta({ title: `${f.name} (${f.designer}, ${f.year}) : histoire et conseils`, description: `${f.story} Éditeur officiel : ${f.editor}.`, path: `/mobilier/${f.slug}/` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = FURNITURE.find((x) => x.slug === slug);
  if (!f) notFound();
  const same = FURNITURE.filter((x) => x.id !== f.id && (x.designer === f.designer || x.category === f.category)).slice(0, 4);
  return (
    <article>
      <Crumbs items={[{ name: "Mobilier culte", href: "/mobilier/" }, { name: f.name, href: `/mobilier/${f.slug}/` }]} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[var(--r)]" style={{ aspectRatio: "4 / 3", maxWidth: "100%" }}><TripleSwatch ids={[...f.materials, ...f.materials, ...f.materials].slice(0, 3)} /><FavButton id={f.id} name={f.name} /></div>
        <div className="flex flex-col gap-4">
          <span className="eyebrow">{f.category} · {f.year}</span>
          <h1 className="text-[clamp(32px,4.4vw,52px)]">{f.name}</h1>
          <dl className="kv"><dt>Designer</dt><dd>{f.designer}</dd><dt>Année</dt><dd>{f.year}</dd><dt>Éditeur officiel</dt><dd>{f.editor}</dd><dt>Ordre de prix neuf</dt><dd>{f.budgetTier} <span className="text-[12px] text-muted">(indicatif, à vérifier chez l'éditeur)</span></dd></dl>
          <p>{f.story}</p>
          <div className="notice"><b>Comment l'intégrer.</b> {f.howTo}</div>
          {f.counterfeitRisk !== "faible" && <div className="notice notice-warn"><b>Attention aux copies.</b> Ce modèle est {f.counterfeitRisk === "élevé" ? "très souvent" : "souvent"} copié. Achetez chez l'éditeur, un revendeur agréé, ou en vintage avec preuve d'authenticité (marquage, facture). La reproduction d'un design protégé peut être une contrefaçon.</div>}
          <div className="flex flex-wrap gap-1.5">
            <a className="btn btn-sm btn-primary" href={f.editorUrl} target="_blank" rel="noopener noreferrer">Site de l'éditeur ↗</a>
            <a className="btn btn-sm" href="https://www.selency.fr" target="_blank" rel="noopener noreferrer">Chercher en vintage ↗</a>
            <AskCamille question={`Comment intégrer « ${f.name} » de ${f.designer} dans mon intérieur ?`} />
          </div>
          <p className="text-[12px] text-muted">Noms de designers et d'éditeurs cités à titre informatif. Pièce Rêvée n'est pas lié à ces marques.</p>
        </div>
      </div>
      {same.length > 0 && <section className="section"><h2>Dans le même esprit</h2><div className="grid-cards mt-4">{same.map((x) => <FurnitureCard key={x.id} f={x} />)}</div></section>}
      <p className="mt-8"><Link href="/mobilier/">← Tout le mobilier culte</Link></p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CreativeWork", name: f.name, creator: { "@type": "Person", name: f.designer }, dateCreated: String(f.year), publisher: { "@type": "Organization", name: f.editor, url: f.editorUrl }, description: f.story, url: absoluteUrl(`/mobilier/${f.slug}/`) }} />
    </article>
  );
}
