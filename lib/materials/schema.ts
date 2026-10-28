import { z } from "zod";
import data from "@/content/data/materials-premium.json";
import pbr from "@/content/data/materials-pbr.json";

/**
 * Moteur de matériaux premium : chaque matière décrit son identité (nom, fabricant, référence, finition),
 * son rendu physique (PBR) et l'origine de ses textures. Un fabricant ou une référence n'est jamais inventé :
 * `manufacturer` et `reference` restent vides tant qu'ils ne sont pas vérifiés.
 */
export const Hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
export const MaterialSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  category: z.enum(["Bois", "Pierre", "Peinture", "Enduit", "Métal", "Verre", "Textile", "Céramique", "Sol"]),
  finish: z.string().min(2),
  manufacturer: z.object({ name: z.string(), url: z.string().url(), verifiedAt: z.string() }).nullable(),
  reference: z.string().nullable(),
  baseColor: Hex,
  description: z.string(),
  usages: z.array(z.string()),
  pbr: z.object({
    metalness: z.number().min(0).max(1), roughness: z.number().min(0).max(1),
    clearcoat: z.number().min(0).max(1).optional(), clearcoatRoughness: z.number().min(0).max(1).optional(),
    sheen: z.number().min(0).max(1).optional(), sheenRoughness: z.number().min(0).max(1).optional(), sheenColor: Hex.optional(),
    anisotropy: z.number().min(0).max(1).optional(), normalScale: z.number().min(0).max(3).optional(),
    transmission: z.number().min(0).max(1).optional(), ior: z.number().min(1).max(2.5).optional(), thickness: z.number().min(0).optional(),
    /** La texture photographiée sert de relief ; la couleur vient de baseColor. */
    tint: z.boolean().optional(),
    /** Pour les matières teintées : force des nuances de la photo (0 = uni, 1 = photo d'origine). */
    textureContrast: z.number().min(0).max(1).optional(),
    /** Multiplie la carte de rugosité photographiée (> 1 = plus mat). */
    roughnessScale: z.number().min(0.2).max(3).optional(),
  }),
  /** Largeur réelle couverte par une répétition de la texture (m). */
  tileMeters: z.number().positive(),
  textures: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("procedural"), generator: z.enum(["brosse", "poli", "poudre"]) }),
    z.object({ kind: z.literal("showroom"), ref: z.string() }),
    z.object({ kind: z.literal("photo"), assetId: z.string().optional(), search: z.array(z.string()).optional(), prefer: z.enum(["polyhaven", "ambientcg"]).optional(), fallbackDir: z.string().optional(), fallbackRef: z.string().optional() }),
  ]),
  compare: z.array(z.string()),
  showroom: z.string().optional(),
});
export type Material = z.infer<typeof MaterialSchema>;

/** Cartes PBR haute définition téléchargées par le robot (Poly Haven, CC0). */
export const PbrMapsSchema = z.object({
  assetId: z.string(), name: z.string(), url: z.string().url(), authors: z.array(z.string()), license: z.string(),
  resolution: z.number(), dir: z.string(),
  maps: z.object({ basecolor: z.string(), normal: z.string().optional(), roughness: z.string().optional(), ao: z.string().optional(), displacement: z.string().optional(), metallic: z.string().optional() }),
});
export type PbrMaps = z.infer<typeof PbrMapsSchema>;

export const MATERIALS: Material[] = z.array(MaterialSchema).parse(data);
export const PBR_MAPS = z.record(z.string(), PbrMapsSchema).parse(pbr) as Record<string, PbrMaps>;
export const materialById = (id: string) => MATERIALS.find((m) => m.id === id);

/** Description de la qualité des textures disponibles, pour l'afficher honnêtement. */
export function textureQuality(m: Material): { label: string; detail: string } {
  const t = m.textures;
  if (t.kind === "procedural") return { label: "Procédural 2K", detail: "Relief et micro-rayures calculés (brossage, poli ou grain de laque), sans motif répété." };
  if (t.kind === "showroom") return { label: "Procédural 2K", detail: "Carreaux, émail et joints calculés un à un, comme au showroom." };
  const hd = PBR_MAPS[m.id];
  if (hd) return { label: `Photo ${hd.resolution / 1024}K · PBR`, detail: `Cartes ${Object.keys(hd.maps).join(", ")} de « ${hd.name} » (${hd.license}).` };
  return { label: t.fallbackDir ? "Photo 1K (provisoire)" : "Procédural (provisoire)", detail: "Cartes haute définition en cours de récupération." };
}
