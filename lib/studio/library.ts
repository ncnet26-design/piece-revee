import { z } from "zod";
import data from "@/content/data/furniture.json";
import models from "@/content/data/models.json";
import { CATEGORIES, type Category } from "@/lib/products/schema";

/**
 * Bibliothèque de mobilier 3D du Studio : métadonnées descriptives (catégorie, style, couleurs, matières, silhouette)
 * au-dessus des fichiers GLB libres de droits (content/data/models.json) ou d'objets calculés (« procedural »).
 * Pour ajouter un meuble : déposer le GLB (robot ou scripts), puis une entrée ici. `productId` n'est rempli
 * que si le modèle 3D correspond à un produit commercial VÉRIFIÉ (aucun pour l'instant).
 */
const Color = z.object({ name: z.string(), hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/) });
export const FurnitureSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  model: z.string(),
  kind: z.enum(["glb", "procedural"]),
  name: z.string(),
  category: z.enum(Object.keys(CATEGORIES) as [Category, ...Category[]]),
  style: z.array(z.string()), colors: z.array(Color), materials: z.array(z.string()), silhouette: z.array(z.string()), features: z.array(z.string()),
  productId: z.string().nullable(),
});
export type Furniture = z.infer<typeof FurnitureSchema> & {
  dims: { w: number; d: number; h: number } | null;
  file: string | null;
  credit: { authors: string[]; license: string; url: string } | null;
};

type ModelEntry = { id: string; file: string; url: string; authors: string[]; license: string; dims?: { w: number; d: number; h: number } };
const MODELS = models as ModelEntry[];
/** Dimensions des objets calculés (m). */
const PROC_DIMS: Record<string, { w: number; d: number; h: number }> = { "proc:table-galet": { w: 1.1, d: 0.75, h: 0.32 }, "proc:robinet": { w: 0.2, d: 0.06, h: 0.33 }, "proc:lampadaire": { w: 0.34, d: 0.34, h: 1.4 }, "proc:poignee": { w: 0.18, d: 0.035, h: 0.022 }, "proc:tapis": { w: 2.4, d: 1.7, h: 0.012 } };

export const FURNITURE: Furniture[] = z.array(FurnitureSchema).parse(data).map((f) => {
  const m = MODELS.find((x) => x.id === f.model);
  return { ...f, dims: f.kind === "procedural" ? PROC_DIMS[f.model] ?? null : m?.dims ?? null, file: m?.file ?? null, credit: m ? { authors: m.authors, license: m.license, url: m.url } : null };
}).filter((f) => f.kind === "procedural" || f.file);
export const furnitureById = (id: string) => FURNITURE.find((f) => f.id === id);
export const sameCategory = (f: Furniture) => FURNITURE.filter((x) => x.category === f.category);
