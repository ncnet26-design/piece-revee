import { familleDe, type Famille, type ProduitCatalogue } from "@/lib/catalogue";
import { choisir, type Gamme } from "@/lib/choisir-produit";
import { accord, attributsObjet } from "@/lib/attributs";

type P = ProduitCatalogue & { g?: Gamme };
const cache = new Map<Famille, Promise<P[]>>();
/** Une famille de la sélection de la boutique, chargée une seule fois. */
export const familleBoutique = (f: Famille) => {
  if (!cache.has(f)) cache.set(f, fetch(`/boutique/${f}.json`).then((r) => (r.ok ? (r.json() as Promise<P[]>) : [])).catch(() => []));
  return cache.get(f)!;
};

/** Pour chaque meuble repéré : le produit le plus ressemblant de chaque budget (instantané, dans notre boutique). */
export async function produitsParBudget(objets: Array<{ id: string; type: string; label: string; query?: string; materials?: string[]; colors?: Array<{ name: string }>; shape?: string[] }>) {
  return Promise.all(objets.map(async (o) => {
    const f = familleDe(o.type, o.label);
    // Seuls les produits sans contradiction avec le meuble de l'image (matière, couleur, forme) sont candidats.
    const vu = attributsObjet(o);
    const l = f ? (await familleBoutique(f)).filter((p) => accord(vu, `${p.n} ${p.b ?? ""}`).ok) : [];
    const q = o.query || o.label, produits: Partial<Record<Gamme, ProduitCatalogue>> = {};
    for (const g of ["petit", "moyen", "haut"] as Gamme[]) { const x = choisir(l, q, g) ?? choisir(l, `${f === "deco" ? "" : (o.label.split(" ")[0] ?? "")} ${q}`.trim(), g); if (x) produits[g] = x; }
    return { id: o.id, label: o.label, produits };
  }));
}
