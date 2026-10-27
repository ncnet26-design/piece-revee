import { env } from "./env.ts";
import { HttpError, log } from "./http.ts";

/**
 * Couche d'abstraction des fournisseurs d'images (rendus, retouches).
 * Les points d'accès et tarifs sont à confirmer dans la documentation officielle de chaque fournisseur au moment
 * de l'activation, et consignés dans docs/DECISIONS.md.
 */
export interface RenderInput { prompt: string; negative: string; imageUrl: string | null; width: number; height: number; seed?: number }
export interface InpaintInput { prompt: string; imageUrl: string; maskUrl: string; width: number; height: number }
export interface ImageResult { bytes: Uint8Array; mediaType: "image/png" | "image/jpeg" | "image/webp"; width: number; height: number; costCents: number; provider: string; model: string }

export interface ImageProvider {
  name: string;
  /** Édition guidée de la photo de l'utilisateur (conserve la géométrie). */
  edit(i: RenderInput): Promise<ImageResult>;
  inpaint?(i: InpaintInput): Promise<ImageResult>;
}

async function download(url: string): Promise<Uint8Array> {
  const r = await fetch(url); if (!r.ok) throw new Error(`téléchargement ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}
const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Cloudflare Workers AI : quota gratuit quotidien, qualité « aperçu ». */
const cloudflare: ImageProvider = {
  name: "cloudflare",
  async edit(i) {
    const { CLOUDFLARE_ACCOUNT_ID: acc, CLOUDFLARE_AI_TOKEN: token } = env();
    if (!acc || !token) throw new HttpError(503, "provider_unconfigured", "Fournisseur d'images non configuré.");
    const model = "@cf/black-forest-labs/flux-1-schnell";
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run/${model}`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ prompt: i.prompt.slice(0, 2000), steps: 8, seed: i.seed }),
    });
    if (!r.ok) throw new Error(`cloudflare ${r.status}`);
    const j = await r.json() as { result?: { image?: string } };
    if (!j.result?.image) throw new Error("cloudflare: réponse sans image");
    return { bytes: b64(j.result.image), mediaType: "image/jpeg", width: 1024, height: 1024, costCents: 0, provider: "cloudflare", model };
  },
};

/** fal.ai, FLUX.1 Kontext [pro] : édition guidée par instruction (prix indicatif ≈ 0,04 $ par image, à confirmer). */
const fal: ImageProvider = {
  name: "fal",
  async edit(i) {
    const key = env().FAL_KEY; if (!key) throw new HttpError(503, "provider_unconfigured", "Fournisseur d'images non configuré.");
    if (!i.imageUrl) throw new Error("fal: image source requise");
    const model = "fal-ai/flux-pro/kontext";
    const r = await fetch(`https://fal.run/${model}`, {
      method: "POST", headers: { authorization: `Key ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ prompt: i.prompt, image_url: i.imageUrl, seed: i.seed, output_format: "jpeg", safety_tolerance: "2" }),
    });
    if (!r.ok) throw new Error(`fal ${r.status}`);
    const j = await r.json() as { images?: { url: string; width?: number; height?: number }[] };
    const img = j.images?.[0]; if (!img) throw new Error("fal: réponse sans image");
    return { bytes: await download(img.url), mediaType: "image/jpeg", width: img.width ?? i.width, height: img.height ?? i.height, costCents: 4, provider: "fal", model };
  },
};

/** Replicate : pipeline diffusion + ControlNet (profondeur + lignes), modèle configurable. */
const replicate: ImageProvider = {
  name: "replicate",
  async edit(i) {
    const token = env().REPLICATE_API_TOKEN; if (!token) throw new HttpError(503, "provider_unconfigured", "Fournisseur d'images non configuré.");
    const model = Deno.env.get("REPLICATE_MODEL") ?? "";
    if (!model) throw new HttpError(503, "provider_unconfigured", "Modèle Replicate non défini (REPLICATE_MODEL).");
    const r = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", prefer: "wait" },
      body: JSON.stringify({ input: { prompt: i.prompt, negative_prompt: i.negative, image: i.imageUrl, seed: i.seed } }),
    });
    if (!r.ok) throw new Error(`replicate ${r.status}`);
    const j = await r.json() as { output?: string | string[] };
    const url = Array.isArray(j.output) ? j.output[0] : j.output; if (!url) throw new Error("replicate: réponse sans image");
    return { bytes: await download(url), mediaType: "image/png", width: i.width, height: i.height, costCents: 5, provider: "replicate", model };
  },
};

/** Fournisseur factice pour les tests et la démonstration : image unie, aucun coût. */
const mock: ImageProvider = {
  name: "mock",
  edit(i) {
    // PNG 1 × 1 gris clair.
    const png = b64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC");
    return Promise.resolve({ bytes: png, mediaType: "image/png", width: i.width, height: i.height, costCents: 0, provider: "mock", model: "mock" });
  },
};

const PROVIDERS: Record<string, ImageProvider> = { cloudflare, fal, replicate, mock };

/** Fournisseur principal, avec bascule automatique sur le fournisseur de secours en cas de panne. */
export async function renderWithFallback(i: RenderInput, quality: "apercu" | "hd"): Promise<ImageResult> {
  const primaryName = quality === "apercu" ? "cloudflare" : env().IMAGE_PROVIDER;
  const primary = PROVIDERS[primaryName] ?? mock;
  try { return await primary.edit(i); }
  catch (e) {
    const fb = env().IMAGE_PROVIDER_FALLBACK;
    log("warn", "image_provider_failed", { provider: primary.name, message: e instanceof Error ? e.message : String(e) });
    if (fb === "none" || fb === primary.name) throw new HttpError(502, "render_failed", "Le rendu n'a pas pu être généré. Réessayez : rien ne vous a été décompté.");
    return await (PROVIDERS[fb] ?? mock).edit(i);
  }
}
