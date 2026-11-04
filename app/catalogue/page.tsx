import { CatalogueAchetable } from "@/components/catalogue/CatalogueAchetable";
import data from "@/data/catalogue.json";
import matieres4k from "@/content/data/matieres-4k.json";
import type { ProduitAchetable } from "@/lib/catalogue-achetable";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Catalogue : meubles et matières par budget, pièce et style",
  description: "Des produits réels, vérifiés page par page, classés en petit budget, budget moyen et haut de gamme, à filtrer par pièce, style et matière, avec le lien pour les acheter.",
  path: "/catalogue/",
});

export default function Page() {
  const produits = (data as { produits: ProduitAchetable[] }).produits;
  const textures = Object.keys(matieres4k as Record<string, unknown>);
  const compte = new Map<string, number>();
  for (const p of produits) for (const m of p.matiere) compte.set(m, (compte.get(m) ?? 0) + 1);
  const matieres = [...compte.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).map(([m]) => m);
  return (
    <div className="wrap py-10 sm:py-14">
      <p className="eyebrow">Catalogue</p>
      <h1 className="mt-3 max-w-[18ch] text-[clamp(40px,5.6vw,76px)]">Votre style, <em>à votre budget.</em></h1>
      <p className="mt-5 max-w-[60ch] text-[16px] text-muted">Choisissez une pièce et un style : voici des pièces réellement en vente, rangées en petit budget, budget moyen et haut de gamme, chacune avec son prix relevé et le lien vers l'enseigne.</p>
      <CatalogueAchetable produits={produits} textures={textures} matieres={matieres} />
    </div>
  );
}
