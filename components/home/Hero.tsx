import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chercher, norm, type ProduitCatalogue } from "@/lib/catalogue";
import { PIECES } from "@/components/shop-the-look-pieces";
import { HeroVue, type Gamme, type Trouves } from "./HeroVue";

/**
 * En-tête de l'accueil : la promesse et une démonstration qu'on touche.
 * Pour chaque meuble de la pièce d'exemple, un vrai produit par budget, cherché une fois à la publication dans la sélection de la boutique.
 */
export function Hero() {
  const trouves: Trouves = {};
  for (const p of PIECES) {
    let l: Array<ProduitCatalogue & { g: Gamme }> = [];
    try { l = JSON.parse(readFileSync(join(process.cwd(), "public/boutique", `${p.famille}.json`), "utf8")); } catch { /* sélection absente */ }
    trouves[p.id] = {};
    for (const g of ["petit", "moyen", "haut"] as Gamme[]) {
      // Le nom doit désigner le bon meuble dès ses premiers mots (pas un coussin « pour canapé » ni un tableau « Buffet »).
      const nom = norm(p.query.split(" ")[0]!);
      const dans = l.filter((x) => x.g === g && x.i && x.p !== null && norm(x.n).split(" ").slice(0, 3).includes(nom));
      // Recherche précise, puis plus large (premier mot + matière) si rien n'approche.
      const mots = p.query.split(" ");
      const r = chercher(dans, p.query, 1)[0] ?? chercher(dans, `${mots[0]} ${mots[mots.length - 1]}`, 1)[0];
      if (r) { const { score, ...x } = r; void score; trouves[p.id]![g] = x; }
    }
  }
  return <HeroVue trouves={trouves} />;
}
