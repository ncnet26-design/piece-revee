/**
 * Réglages du service d'images. Les clés ne sont JAMAIS ici : elles sont lues dans les secrets Cloudflare (env).
 * Les tarifs sont des estimations servant au plafond de dépense ; à ajuster d'après les pages tarifs officielles.
 */
export interface Env {
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  FAL_KEY?: string;
  REPLICATE_API_TOKEN?: string;
  /** Fournisseur par défaut : "openai" | "gemini" | "fal" | "replicate" (sinon : le premier dont la clé existe). */
  IA_FOURNISSEUR?: string;
  OPENAI_IMAGE_MODEL?: string;
  /** "images" (appel direct, synchrone) ou "background" (tâche asynchrone côté OpenAI). */
  OPENAI_MODE?: string;
  OPENAI_RESPONSES_MODEL?: string;
  /** Modèle Gemini d'analyse (moodboard, repérage des objets). */
  GEMINI_TEXT_MODEL?: string;
  /** Modèle Gemini de la recherche de produits sur internet (recherche Google). */
  GEMINI_SEARCH_MODEL?: string;
  FAL_MODEL_EDIT?: string;
  FAL_MODEL_TEXT?: string;
  REPLICATE_MODEL?: string;
  /** Budget mensuel total (USD) et par visiteur, et nombre d'images par jour. */
  BUDGET_MOIS_USD?: string;
  BUDGET_VISITEUR_MOIS_USD?: string;
  IMAGES_JOUR?: string;
  IMAGES_VISITEUR_JOUR?: string;
  /** Images gratuites par jour avec l'IA de Cloudflare (10 000 « neurones » offerts par jour ≈ 80 images). */
  IMAGES_GRATUITES_JOUR?: string;
  /** IA de Cloudflare (liaison « AI ») : gratuite jusqu'au quota quotidien. */
  AI?: { run(model: string, input: unknown): Promise<unknown> };
  QUOTA?: KVNamespace;
  /** Facultatif : stockage R2 des images (sinon KV, 30 jours). */
  IMAGES?: R2Bucket;
}

/* Types minimaux de l'environnement Cloudflare (évite une dépendance de développement). */
export interface KVNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
  put(key: string, value: string | ArrayBuffer | Uint8Array, opts?: { expirationTtl?: number; metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
}
export interface R2Bucket {
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer>; httpMetadata?: { contentType?: string } } | null>;
  put(key: string, value: ArrayBuffer | Uint8Array, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
}
export interface Ctx { waitUntil(p: Promise<unknown>): void }

export const ALLOWED_ORIGINS = [
  "https://odd-bar-c583.ewanesteves26.workers.dev",
  "http://localhost:3000",
  "http://localhost:4173",
];
export const isAllowedOrigin = (origin: string) => ALLOWED_ORIGINS.includes(origin) || (/^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin) && origin.includes("piece-revee"));

export const MAX_BODY = 12 * 1024 * 1024;
export const num = (v: string | undefined, d: number) => (v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v) : d);
export const limits = (env: Env) => ({
  monthUsd: num(env.BUDGET_MOIS_USD, 15),
  visitorMonthUsd: num(env.BUDGET_VISITEUR_MOIS_USD, 1.5),
  dayImages: num(env.IMAGES_JOUR, 30),
  visitorDayImages: num(env.IMAGES_VISITEUR_JOUR, 6),
  freeDayImages: num(env.IMAGES_GRATUITES_JOUR, 60),
});

export type Quality = "brouillon" | "standard" | "premium";

/**
 * Coût estimé d'une image (USD), réservé AVANT l'appel pour ne jamais dépasser le budget.
 * OpenAI facture au jeton : le coût réel est recalculé après coup avec `usage` quand il est fourni.
 */
export const PRICE_ESTIMATE: Record<string, Record<Quality, number>> = {
  cloudflare: { brouillon: 0, standard: 0, premium: 0 },
  openai: { brouillon: 0.02, standard: 0.06, premium: 0.2 },
  gemini: { brouillon: 0.04, standard: 0.04, premium: 0.06 },
  fal: { brouillon: 0.04, standard: 0.04, premium: 0.08 },
  replicate: { brouillon: 0.04, standard: 0.04, premium: 0.08 },
};
/** Tarifs OpenAI au million de jetons (images) : à vérifier sur la page tarifs d'OpenAI. */
export const OPENAI_TOKEN_USD = { textIn: 5, imageIn: 8, imageOut: 30 };
