import { z } from "zod";
import { CategorySchema } from "./study.ts";

/** Produit normalisé issu d'un flux d'affiliation. Aucune donnée n'est inventée : tout vient du flux. */
export const ProductSchema = z.object({
  id: z.string(),
  merchant: z.string().min(1),
  externalId: z.string().min(1),
  gtin: z.string().nullable(),
  title: z.string().min(2).max(300),
  brand: z.string().max(120).nullable(),
  category: CategorySchema,
  styles: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  dimsCm: z.object({ w: z.number().nullable(), d: z.number().nullable(), h: z.number().nullable() }),
  priceCents: z.number().int().positive(),
  currency: z.literal("EUR"),
  inStock: z.boolean(),
  imageUrl: z.string().url(),
  productUrl: z.string().url(),
  affiliateUrl: z.string().url(),
  feedSeenAt: z.string(),
  removedAt: z.string().nullable(),
  secondHand: z.boolean().default(false),
});
export type Product = z.infer<typeof ProductSchema>;

/** Ligne brute de flux (CSV / XML), avant normalisation. Les noms de colonnes varient selon les réseaux. */
export const FeedRowSchema = z.record(z.string(), z.string());
