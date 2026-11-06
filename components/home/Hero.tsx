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
      // Le plus ressemblant : tous les mots de la recherche, sinon au moins les deux tiers ; jamais un produit à moins de 15 €.
      const ok = dans.filter((x) => (x.p ?? 0) >= 15 && !/salle de bain|pour chaise|batonnets|piece detachee|robinetterie|plomberie|raccord/.test(norm(x.n)));
      const r = chercher(ok, p.query, 20).find((x) => x.score >= 100) ?? chercher(ok, p.query, 20).find((x) => x.score >= 67);
      if (r) { const { score, ...x } = r; void score; trouves[p.id]![g] = x; }
    }
  }
  return <HeroVue trouves={trouves} />;
}
