import { notFound } from "next/navigation";
import { GUIDES } from "@/content/index";
import { Crumbs } from "@/components/Crumbs";
import { JsonLd } from "@/components/JsonLd";
import { AskCamille } from "@/components/DetailBits";
import { meta } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return GUIDES.map((g) => ({ slug: g.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  return g ? meta({ title: g.title, description: g.summary, path: `/guides/${g.slug}/` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  return (
    <article className="max-w-[760px]">
      <Crumbs items={[{ name: "Guides", href: "/guides/" }, { name: g.title, href: `/guides/${g.slug}/` }]} />
      <h1 className="text-[clamp(30px,4vw,48px)]">{g.title}</h1>
      <p className="mt-3 text-lg text-muted">{g.summary}</p>
      <ol className="mt-8 flex flex-col gap-5 p-0" style={{ listStyle: "none" }}>
        {g.steps.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent font-mono text-sm text-accent-ink">{i + 1}</span>
            <div><h2 className="text-xl">{s.title}</h2><p className="mt-1">{s.body}</p></div>
          </li>
        ))}
      </ol>
      <section className="section"><h2 className="text-2xl">Erreurs à éviter</h2><ul className="dots warn mt-3">{g.mistakes.map((m) => <li key={m}>{m}</li>)}</ul></section>
      {g.sources.length > 0 && <section className="section"><h2 className="eyebrow">Sources</h2><ul className="mt-2 text-sm">{g.sources.map((s) => <li key={s.title}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul></section>}
      <div className="mt-8"><AskCamille className="btn btn-primary" label="Une question ? Demandez à Camille" question={`J'ai lu le guide « ${g.title} ». J'ai une question :`} /></div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "HowTo", name: g.title, description: g.summary, inLanguage: "fr-FR", url: absoluteUrl(`/guides/${g.slug}/`), step: g.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })) }} />
    </article>
  );
}
