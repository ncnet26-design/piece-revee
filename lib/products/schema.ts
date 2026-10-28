import { z } from "zod";
import data from "@/content/data/products.json";

/**
 * Base de produits commerciaux, indépendante de la bibliothèque 3D. Chaque information vient d'une source citée
 * (fiche officielle) avec sa date de relevé : rien n'est inventé. Un champ inconnu reste `null`.
 * `demo: true` signale une donnée fictive (aucune pour l'instant) : elle ne doit jamais être présentée comme une offre réelle.
 */
const Src = z.string().url();
export const CATEGORIES = { canape: "Canapés", fauteuil: "Fauteuils", "table-basse": "Tables basses", lampadaire: "Lampadaires", poignee: "Poignées", chaise: "Chaises", "table-manger": "Tables à manger", rangement: "Rangements", luminaire: "Luminaires", deco: "Décoration", "salle-de-bain": "Salle de bain", robinetterie: "Robinetterie", lit: "Lits", tapis: "Tapis" } as const;
export type Category = keyof typeof CATEGORIES;
export const TIERS = { economique: "Économique", intermediaire: "Intermédiaire", premium: "Premium" } as const;

export const ProductSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  brand: z.string(), retailer: z.string(), name: z.string(),
  category: z.enum(Object.keys(CATEGORIES) as [Category, ...Category[]]),
  tier: z.enum(["economique", "intermediaire", "premium"]),
  designer: z.string().nullable(),
  reference: z.string().nullable(),
  /** Dimensions en cm quand elles sont publiées (null sinon). */
  dimensions: z.object({ w: z.number().nullable(), d: z.number().nullable(), h: z.number().nullable(), text: z.string(), source: Src }).nullable(),
  /** Photo uniquement si sa licence l'autorise (flux partenaire, presse) ; sinon null et lien vers la fiche. */
  image: z.object({ src: z.string(), credit: z.string(), license: z.string() }).nullable(),
  price: z.object({ amount: z.number().nullable(), currency: z.string(), text: z.string(), region: z.string(), source: Src, observedAt: z.string() }).nullable(),
  availability: z.object({ text: z.string(), source: Src, observedAt: z.string() }).nullable(),
  url: Src,
  material: z.string(), materials: z.array(z.string()),
  colors: z.array(z.object({ name: z.string(), hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/) })),
  finish: z.string().nullable(),
  style: z.array(z.string()), silhouette: z.array(z.string()),
  materialId: z.string().nullable(),
  demo: z.boolean(),
  note: z.string().nullable(),
  verification: z.object({ method: z.string(), at: z.string(), sources: z.array(Src) }),
});
export type Product = z.infer<typeof ProductSchema>;

export const PRODUCTS: Product[] = z.array(ProductSchema).parse(data);
export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
export const daysSince = (iso: string, now = Date.now()) => Math.floor((now - Date.parse(iso)) / 86_400_000);
