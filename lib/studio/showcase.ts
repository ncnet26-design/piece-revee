import { z } from "zod";
import data from "@/content/data/showcase.json";
import { CATEGORIES, type Category } from "@/lib/products/schema";
import type { ObjectFeatures } from "./similar";

/**
 * Meubles d'un rendu : création originale de l'IA (ou repérés par l'utilisateur), décrits par leurs traits visuels.
 * Aucune marque : les produits commerciaux n'interviennent qu'ensuite, comme alternatives.
 * La zone est en % de l'image : elle reste alignée quand l'image change de taille.
 */
export const AiObjectSchema = z.object({
  id: z.string(),
  type: z.enum(Object.keys(CATEGORIES) as [Category, ...Category[]]),
  label: z.string(),
  design_source: z.enum(["ai_generated", "user_marked", "ai_detected", "studio_designed"]),
  shape: z.array(z.string()),
  materials: z.array(z.string()),
  colors: z.array(z.object({ name: z.string(), hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/) })),
  style: z.array(z.string()),
  estimated_dimensions_cm: z.object({ width: z.number(), depth: z.number(), height: z.number() }).nullable(),
  zone: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  description: z.string().optional(),
});
export type AiObject = z.infer<typeof AiObjectSchema>;
export const RenderSchema = z.object({
  id: z.string(), title: z.string(), brief: z.string(),
  image: z.object({ src: z.string(), width: z.number(), height: z.number() }),
  generator: z.string(),
  objects: z.array(AiObjectSchema),
});
export type Render = z.infer<typeof RenderSchema>;
export const SHOWCASE: Render[] = z.array(RenderSchema).parse(data);

export const featuresOf = (o: AiObject): ObjectFeatures => ({
  category: o.type, style: o.style, silhouette: o.shape, materials: o.materials, colors: o.colors.map((c) => c.hex),
  dims: o.estimated_dimensions_cm ? { w: o.estimated_dimensions_cm.width, d: o.estimated_dimensions_cm.depth, h: o.estimated_dimensions_cm.height } : null,
  productId: null,
});
