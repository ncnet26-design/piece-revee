import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chercher, estAccessoire, type ProduitCatalogue } from "@/lib/catalogue";
import { ShopTheLookVue } from "@/components/ShopTheLookVue";
import { PIECES } from "@/components/shop-the-look-pieces";

/** Recherche faite une fois, à la publication du site : l'accueil ne télécharge pas le catalogue. */
export function ShopTheLook() {
  const found = Object.fromEntries(PIECES.map((p) => {
    let l: ProduitCatalogue[] = [];
    try { l = JSON.parse(readFileSync(join(process.cwd(), "public/catalogue", `${p.famille}.json`), "utf8")) as ProduitCatalogue[]; } catch { /* catalogue absent */ }
    // Avec image d'abord, à ressemblance proche.
    const r = chercher(l.filter((x) => !estAccessoire(x.n)), p.query, 8);
    const best = [...r.filter((x) => x.i), ...r.filter((x) => !x.i)].slice(0, 3).map((x) => { const { score, ...rest } = x; void score; return rest; });
    return [p.id, best];
  }));
  return <ShopTheLookVue found={found} />;
}
