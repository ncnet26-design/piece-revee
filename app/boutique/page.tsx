import { Boutique } from "@/components/boutique/Boutique";
import { CatalogueAchetable } from "@/components/catalogue/CatalogueAchetable";
import data from "@/data/catalogue.json";
import selection from "@/public/boutique/index.json";
import matieres4k from "@/content/data/matieres-4k.json";
import type { ProduitAchetable } from "@/lib/catalogue-achetable";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "La boutique : de belles pièces, à chaque budget",
  description: "Une sélection de meubles, luminaires et objets d'éditeurs et de maisons reconnus, à tous les prix : par pièce, style et budget, avec le prix relevé et le lien vers l'enseigne.",
  path: "/boutique/",
});

export default function Page() {
  const produits = (data as { produits: ProduitAchetable[] }).produits;
  const textures = Object.keys(matieres4k as Record<string, unknown>);
  const compte = new Map<string, number>();
  for (const p of produits) for (const m of p.matiere) compte.set(m, (compte.get(m) ?? 0) + 1);
  const matieres = [...compte.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).map(([m]) => m);
  const sel = selection as { total: number; vendeurs: Record<string, number> };
  return (
    <div className="wrap py-10 sm:py-14">
      <header className="mx-auto max-w-[820px] text-center">
        <p className="eyebrow">La boutique</p>
        <h1 className="mx-auto mt-4 max-w-[16ch] text-[clamp(44px,6.4vw,92px)]">De belles pièces, <em>à chaque budget.</em></h1>
        <p className="mx-auto mt-6 max-w-[56ch] text-[16px] text-muted">{sel.total.toLocaleString("fr-FR")} références choisies chez {Object.keys(sel.vendeurs).length} enseignes, du petit prix au haut de gamme. Et pour chaque meuble de votre pièce transformée, l'IA cherche aussi partout en ligne : Maisons du Monde, Leroy Merlin, La Redoute… Prix relevés sur leurs pages ; vous achetez directement chez elles.</p>
        <nav aria-label="Sur cette page" className="mt-8 flex justify-center gap-2">
          <a href="#selection" className="btn">Par pièce et par style</a>
          <a href="#toute-la-boutique" className="btn btn-primary">Toute la boutique</a>
        </nav>
      </header>

      <section id="selection" aria-labelledby="h-selection" className="scroll-mt-24 mt-20 border-t border-line pt-14">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="eyebrow">La sélection vérifiée</p>
          <h2 id="h-selection" className="mt-3 text-[clamp(36px,4.4vw,60px)]">Votre pièce, votre style, <em>votre budget.</em></h2>
          <p className="mx-auto mt-4 max-w-[54ch] text-[15px] text-muted">{produits.length} pièces vérifiées une à une, rangées en petit budget, budget moyen et haut de gamme.</p>
        </div>
        <CatalogueAchetable produits={produits} textures={textures} matieres={matieres} />
      </section>

      <section id="toute-la-boutique" aria-labelledby="h-boutique" className="scroll-mt-24 mt-24 border-t border-line pt-14">
        <div className="mx-auto mb-10 max-w-[720px] text-center">
          <p className="eyebrow">Toute la boutique</p>
          <h2 id="h-boutique" className="mt-3 text-[clamp(36px,4.4vw,60px)]">Chercher, comparer, <em>choisir.</em></h2>
        </div>
        <Boutique />
      </section>
    </div>
  );
}
