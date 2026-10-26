import Link from "next/link";
import { GUIDES, PROJECT_STEPS } from "@/content/index";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Guides pratiques : aménager, décorer, jardiner", description: "Mesurer sa pièce, choisir sa peinture, éclairer un salon, aménager un balcon, créer un jardin sec : des guides pas à pas.", path: "/guides/" });

export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Guides pratiques</h1><p>Des méthodes pas à pas, avec les erreurs à éviter et les sources officielles.</p></div></div>
    <div className="grid-cards wide">
      {GUIDES.map((g) => (
        <article key={g.id} className="card"><div className="body gap-2 p-5">
          <span className="eyebrow">{g.scope === "interieur" ? "Intérieur" : g.scope === "exterieur" ? "Extérieur" : "Intérieur et extérieur"}</span>
          <h2 className="text-xl"><Link href={`/guides/${g.slug}/`} className="card-link text-ink no-underline">{g.title}</Link></h2>
          <p>{g.summary}</p>
        </div></article>
      ))}
    </div>
    <section className="section"><h2>Le parcours d'un projet</h2><p className="mb-4 mt-1 text-muted">Chaque projet est accompagné d'un guide en cinq étapes, avec ses listes de contrôle et ses erreurs à éviter.</p>
      <ol className="grid gap-3 p-0 md:grid-cols-5" style={{ listStyle: "none" }}>{PROJECT_STEPS.map((s, i) => <li key={s.id} className="panel"><span className="mono text-accent">{i + 1}</span><h3 className="mt-1 text-lg">{s.title}</h3><p className="text-sm text-muted">{s.subtitle}</p></li>)}</ol>
    </section>
  </>);
}
