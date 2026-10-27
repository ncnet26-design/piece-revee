import Link from "next/link";
import { FURNITURE, GUIDES, MATERIALS, PAIRINGS, PLACES, PLANTS, STYLES } from "@/content/index";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Explorer la bibliothèque", description: "Matières, accords, mobilier culte, lieux d'exception, plantes, styles et guides pratiques.", path: "/explorer/" });

export default function Page() {
  const items: [string, string, string, string][] = [
    ["/matieres/", "Matériauthèque", `${MATERIALS.length} matières`, "Ce qu'elles valent, où les poser, leur version petit budget."],
    ["/accords/", "Accords", `${PAIRINGS.length} trios`, "Les assemblages qui fonctionnent, et pourquoi."],
    ["/mobilier/", "Mobilier culte", `${FURNITURE.length} pièces`, "Les meubles qui ont fait l'histoire du design."],
    ["/lieux/", "Lieux d'exception", `${PLACES.length} lieux`, "Villas, maisons d'architectes et jardins célèbres."],
    ["/plantes/", "Plantes", `${PLANTS.length} fiches`, "Jardin, balcon et intérieur."],
    ["/styles/", "Styles", `${STYLES.length} styles`, "Intérieur et jardin, expliqués simplement."],
    ["/guides/", "Guides pratiques", `${GUIDES.length} guides`, "Mesurer, peindre, éclairer, planter."],
    ["/galerie/", "Galerie", "Inspirations", "Par style et par espace."],
  ];
  return (<>
    <div className="vhead"><div><h1>Explorer</h1><p>Toute la bibliothèque de Pièce Rêvée : de quoi apprendre, comparer et s'inspirer.</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([h, t, n, d]) => <Link key={h} href={h} className="panel flex flex-col gap-1.5 text-ink no-underline hover:border-ink"><span className="mono text-accent">{n}</span><span className="font-display text-2xl">{t}</span><span className="text-sm text-muted">{d}</span></Link>)}
    </div>
  </>);
}
