import { z } from "zod";

const pct = z.number().min(0).max(100);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadécimale attendue (#RRGGBB)");
const euros = z.number().int().min(0).max(1_000_000);

export const SPACES_INTERIOR = ["Salon", "Chambre", "Chambre d'enfant", "Cuisine", "Salle de bain", "WC", "Salle à manger", "Bureau", "Entrée", "Couloir", "Escalier", "Dressing", "Buanderie", "Combles", "Sous-sol", "Studio entier", "Local professionnel"] as const;
export const SPACES_EXTERIOR = ["Jardin", "Terrasse", "Balcon", "Loggia", "Cour", "Allée", "Entrée et portail", "Clôture", "Façade", "Abords de piscine", "Potager", "Toit-terrasse", "Véranda"] as const;
export const SpaceSchema = z.enum([...SPACES_INTERIOR, ...SPACES_EXTERIOR]);
export type Space = z.infer<typeof SpaceSchema>;
export const isExterior = (s: Space): boolean => (SPACES_EXTERIOR as readonly string[]).includes(s);

export const BudgetBandSchema = z.enum(["malin", "confort", "premium", "haut_de_gamme"]);
export const BUDGET_LABELS: Record<z.infer<typeof BudgetBandSchema>, string> = {
  malin: "Moins de 1 500 €", confort: "1 500 – 6 000 €", premium: "6 000 – 20 000 €", haut_de_gamme: "Plus de 20 000 €",
};

export const BriefSchema = z.object({
  space: SpaceSchema,
  surfaceM2: z.number().positive().max(10_000).nullable(),
  wish: z.string().trim().max(2000),
  styles: z.array(z.string().max(60)).max(6),
  budget: BudgetBandSchema,
  tenure: z.enum(["proprietaire", "locataire"]),
  keep: z.string().trim().max(500),
  postalCode: z.string().regex(/^\d{5}$/).nullable(),
});
export type Brief = z.infer<typeof BriefSchema>;

/** Sortie de l'analyse vision (Claude). Boîtes en % de l'image. */
export const PhotoAnalysisSchema = z.object({
  isRoomOrOutdoor: z.boolean(),
  detectedSpace: SpaceSchema.nullable(),
  quality: z.object({ tooDark: z.boolean(), blurry: z.boolean(), comment: z.string().max(300) }),
  estimatedDimensions: z.object({ widthM: z.number().nullable(), depthM: z.number().nullable(), ceilingM: z.number().nullable() }),
  light: z.object({ mainSource: z.enum(["gauche", "droite", "face", "dos", "zenithale", "inconnue"]), orientationGuess: z.enum(["nord", "sud", "est", "ouest", "inconnue"]) }),
  elements: z.array(z.object({ label: z.string().max(80), box: z.object({ x: pct, y: pct, w: pct, h: pct }) })).max(30),
  constraints: z.array(z.string().max(200)).max(10),
  strengths: z.array(z.string().max(200)).max(10),
});
export type PhotoAnalysis = z.infer<typeof PhotoAnalysisSchema>;

export const CATEGORIES = ["Peinture", "Revêtement mural", "Sol", "Carrelage", "Assise", "Table", "Rangement", "Lit", "Luminaire", "Textile", "Tapis", "Décoration", "Robinetterie", "Plante", "Pot", "Mobilier extérieur", "Éclairage extérieur", "Matériau extérieur", "Ombrage", "Arrosage"] as const;
export const CategorySchema = z.enum(CATEGORIES);
export const GammeSchema = z.enum(["accessible", "milieu", "haut", "luxe"]);

/** Un besoin produit est décrit par attributs, jamais par un nom de produit inventé. */
export const ProductNeedSchema = z.object({
  id: z.string().max(20),
  zoneId: z.number().int().min(1).max(20),
  category: CategorySchema,
  description: z.string().max(240),
  style: z.array(z.string().max(40)).max(5),
  materials: z.array(z.string().max(40)).max(5),
  colors: z.array(z.string().max(40)).max(5),
  maxDimensionsCm: z.object({ w: z.number().nullable(), d: z.number().nullable(), h: z.number().nullable() }),
  priceRange: z.object({ min: euros, max: euros }).refine((r) => r.min <= r.max, "Fourchette de prix invalide"),
  gamme: GammeSchema,
  quantity: z.number().int().min(1).max(500),
});
export type ProductNeed = z.infer<typeof ProductNeedSchema>;

export const PaletteEntrySchema = z.object({
  name: z.string().max(80),
  usage: z.string().max(120),
  hex,
  /** Identifiant dans la table paint_colors si la teinte vient d'un nuancier réel ; sinon null et marqué « à vérifier ». */
  paintColorId: z.string().max(60).nullable(),
});

export const PlantPickSchema = z.object({
  plantId: z.string().max(60),
  zoneId: z.number().int().min(1).max(20),
  quantity: z.number().int().min(1).max(500),
  why: z.string().max(240),
});

export const StudyResultSchema = z.object({
  concept: z.object({
    title: z.string().min(3).max(90),
    summary: z.string().max(900),
    mood: z.string().max(200),
    analysis: z.array(z.string().max(220)).min(2).max(8),
    principles: z.array(z.string().max(220)).min(2).max(8),
  }),
  palette: z.array(PaletteEntrySchema).min(3).max(6),
  zones: z.array(z.object({ id: z.number().int().min(1).max(20), x: pct, y: pct, title: z.string().max(60), action: z.string().max(260) })).min(2).max(10),
  needs: z.array(ProductNeedSchema).min(1).max(24),
  plants: z.array(PlantPickSchema).max(30),
  custom: z.array(z.object({ element: z.string().max(120), trade: z.string().max(60), description: z.string().max(400), budgetMin: euros, budgetMax: euros })).max(4),
  tutorials: z.array(z.object({
    title: z.string().max(120), zoneId: z.number().int().min(1).max(20).nullable(), difficulty: z.enum(["Facile", "Moyen", "Avancé"]),
    duration: z.string().max(60), tools: z.array(z.string().max(80)).max(15), steps: z.array(z.string().max(400)).min(2).max(15),
    tip: z.string().max(400), safety: z.string().max(300).nullable(),
  })).min(1).max(5),
  works: z.array(z.object({ step: z.string().max(160), duration: z.string().max(60), pro: z.boolean() })).min(2).max(10),
  regulations: z.array(z.string().max(400)).max(6),
  renderBrief: z.object({ prompt: z.string().max(2500), negative: z.string().max(800), light: z.string().max(300) }),
});
export type StudyResult = z.infer<typeof StudyResultSchema>;

export function parseStudy(json: unknown): { ok: true; data: StudyResult } | { ok: false; errors: string[] } {
  const r = StudyResultSchema.safeParse(json);
  if (r.success) {
    const zoneIds = new Set(r.data.zones.map((z) => z.id));
    const bad = [...r.data.needs, ...r.data.plants].filter((n) => !zoneIds.has(n.zoneId));
    if (bad.length) return { ok: false, errors: [`Zones inconnues référencées : ${[...new Set(bad.map((b) => b.zoneId))].join(", ")}`] };
    return { ok: true, data: r.data };
  }
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join(".")} : ${i.message}`) };
}
