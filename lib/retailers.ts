import verified from "@/content/data/retailers.json";

/**
 * Enseignes où acheter : liens vers leur moteur de recherche (vrais produits, prix réels affichés chez elles).
 * Aucun prix ni produit n'est inventé ici. Les formats d'adresse sont vérifiés par le robot GitHub (scripts/check-retailers.ts) ;
 * tant qu'un format n'est pas vérifié, on renvoie vers la page d'accueil de l'enseigne.
 */
import { RETAILERS, type RetailerKind } from "./retailers-list";
export { RETAILERS, type Retailer, type RetailerKind } from "./retailers-list";

/** Résultat de la vérification : format retenu par enseigne (null = non vérifié). */
const VERIFIED = verified as Record<string, { pattern: string | null; checkedAt: string }>;

export interface ShopLink { retailer: string; url: string; exact: boolean }
/** Liens d'achat pour une recherche (« canapé velours bleu »), limités aux enseignes adaptées. */
export function shopLinks(query: string, kinds: RetailerKind[] = ["meuble", "deco"], max = 5): ShopLink[] {
  return RETAILERS.filter((r) => r.kinds.some((k) => kinds.includes(k))).slice(0, max).map((r) => {
    const p = VERIFIED[r.id]?.pattern;
    return p ? { retailer: r.name, url: p.replace("{q}", encodeURIComponent(query)), exact: true } : { retailer: r.name, url: r.home, exact: false };
  });
}
