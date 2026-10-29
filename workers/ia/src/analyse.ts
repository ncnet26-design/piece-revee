/**
 * Analyse d'images :
 *  - analyse(…) : meubles, objets et surfaces (murs, sol, rideaux…) d'une pièce, avec leur zone en % de l'image,
 *    pour rendre chaque élément cliquable et chercher des produits ressemblants ;
 *  - moodboard(…) : synthèse des inspirations d'un client (style, palette, matières, objets clés, consigne de transformation).
 * Gemini (clé du site) par défaut ; OpenAI si sa clé est configurée et que Gemini ne l'est pas.
 */
import type { Env } from "./config";
import { fetchRetry, ProviderError, type ImgIn } from "./providers";

export const CATS = ["canape", "fauteuil", "table-basse", "lampadaire", "luminaire", "rangement", "poignee", "chaise", "table-manger", "deco", "tapis", "lit", "salle-de-bain", "robinetterie"];
export const SURFACES = ["mur", "sol", "plafond", "rideaux", "credence", "porte", "fenetre"];
const SHAPES = "organique, arrondi, ronde, ovale, carree, basse, tres-bas, massive, droit, enveloppant, pieds-fins, pieds-bois, pieds-metal, globe, tige-fine, barre, capitonne, cannele, multi-bras";
const MATS = "travertin, marbre, pierre, bois, velours, boucle, lin, laine, cuir, laiton, metal, verre, ceramique, terre-cuite, ciment";
const STYLES = "contemporain, minimal, organique, classique, vintage, art-deco, scandinave, seventies, design-iconique, mineral, glam";
export const TEXT_MODEL = "gemini-3.8-flash";

const PIECE = [
  "You are an interior architect. Look at this interior image and return JSON only, no prose.",
  `"objects": EVERY visible item a client could buy, even small ones (max 30): furniture, lighting, rugs, cushions, throws, vases, ceramics, books, frames and art, mirrors, plants and pots, candles, trays, handles, taps. For each: "type" (one of: ${CATS.join(", ")}; use deco for small decor, luminaire for any lamp or pendant),`,
  `"label" (short French name, e.g. « Table basse sculpturale en travertin »), "shape" (French tags among: ${SHAPES}), "materials" (French among: ${MATS}),`,
  `"colors" (1-2 dominant colors: {"name" in French, "hex"}), "style" (French among: ${STYLES}), "width_cm", "depth_cm", "height_cm" (estimated real size),`,
  `"query_fr": a precise French shopping search query for this exact item (type, material, colour, shape, approximate size, e.g. « vase en grès beige mat 30 cm »),`,
  `"box_2d": [ymin, xmin, ymax, xmax] normalised 0-1000, tight around the item.`,
  `"surfaces": the main room surfaces (max 6). For each: "kind" (one of: ${SURFACES.join(", ")}), "label" (French, e.g. « Mur en enduit à la chaux »),`,
  `"colors" (1-2: {"name" in French, "hex"} of the surface itself, not of objects in front), "material" (French, e.g. peinture mate, enduit, parquet chêne, carrelage, lin),`,
  `"finish" (French: mat, satiné, brillant, brut, ciré…), "box_2d" as above covering the visible part of the surface.`,
  "Never name a brand or a commercial product. Use realistic estimates.",
].join(" ");

const MOOD = (catalog: string) => [
  "You are an award-winning interior designer preparing a client mood board. The images are the client's inspirations (Pinterest, magazines, screenshots).",
  "Return JSON only with these fields:",
  `"style": short French name of the common style (e.g. « Japandi chaleureux »), "summary": one French sentence describing the mood,`,
  `"palette": 5 to 6 colours shared by the inspirations ({"name" in French, "hex"}), ordered from dominant to accent,`,
  `"materials": up to 8 materials visible in the inspirations, as ids chosen ONLY from this catalogue (id: name): ${catalog},`,
  `"objects": up to 8 key pieces that define the look ({"type" one of: ${CATS.join(", ")}, "label" in French, "materials" French among: ${MATS}, "colors" [{"name","hex"}], "shape" French tags among: ${SHAPES}}),`,
  `"brief_fr": a precise French brief (3-4 sentences) to redesign a client's room in this spirit: palette, materials, furniture shapes, textiles, lighting, decor,`,
  `"brief_en": the same brief in English, written as instructions for an image model, without any brand name.`,
  "Never name a brand or a commercial product.",
].join(" ");

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
async function geminiJson(env: Env, parts: GeminiPart[]): Promise<Record<string, unknown>> {
  const model = env.GEMINI_TEXT_MODEL || TEXT_MODEL;
  const r = await fetchRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY! },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
  });
  if (!r.ok) throw new ProviderError("L'analyse de l'image a échoué.", r.status >= 500 || r.status === 429, `HTTP ${r.status}`);
  const j = await r.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const txt = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  try { return JSON.parse(txt.replace(/^```(?:json)?\s*|\s*```$/g, "")) as Record<string, unknown>; } catch { throw new ProviderError("Réponse d'analyse illisible.", true); }
}

const arr = (v: unknown) => (Array.isArray(v) ? v : []) as Array<Record<string, unknown>>;
const strs = (v: unknown, n = 8) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, n) as string[] : []);
const colors = (v: unknown) => arr(v).filter((c) => typeof c.hex === "string" && /^#[0-9a-f]{6}$/i.test(c.hex as string)).slice(0, 6).map((c) => ({ name: String(c.name ?? "").slice(0, 40), hex: String(c.hex).toUpperCase() }));
const clamp = (v: unknown) => Math.max(0, Math.min(100, Number(v) || 0));
/** box_2d [ymin, xmin, ymax, xmax] sur 1000 → zone en % (x, y = coin haut gauche). */
export function boxToZone(b: unknown): { x: number; y: number; w: number; h: number } | null {
  if (!Array.isArray(b) || b.length !== 4 || !b.every((n) => typeof n === "number")) return null;
  const [y0, x0, y1, x1] = (b as number[]).map((n) => Math.max(0, Math.min(1000, n)) / 10) as [number, number, number, number];
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export interface Surface { id: string; kind: string; label: string; colors: Array<{ name: string; hex: string }>; material: string; finish: string; zone: { x: number; y: number; w: number; h: number } }

export async function analyse(env: Env, image: ImgIn): Promise<{ objects: unknown[]; surfaces: Surface[] }> {
  if (env.GEMINI_API_KEY) {
    const j = await geminiJson(env, [{ text: PIECE }, { inline_data: { mime_type: image.mime, data: image.b64 } }]);
    const objects = arr(j.objects).filter((o) => CATS.includes(String(o.type))).flatMap((o, i) => {
      const zone = boxToZone(o.box_2d); if (!zone) return [];
      return [{
        id: `${String(o.type)}_${String(i + 1).padStart(3, "0")}`, type: o.type, label: String(o.label ?? "").slice(0, 80), design_source: "ai_detected", query: String(o.query_fr ?? o.label ?? "").slice(0, 120),
        shape: strs(o.shape), materials: strs(o.materials), colors: colors(o.colors), style: strs(o.style),
        estimated_dimensions_cm: Number(o.width_cm) > 0 ? { width: Number(o.width_cm), depth: Number(o.depth_cm) || 0, height: Number(o.height_cm) || 0 } : null, zone,
      }];
    });
    const surfaces = arr(j.surfaces).filter((s) => SURFACES.includes(String(s.kind))).flatMap((s, i) => {
      const zone = boxToZone(s.box_2d); if (!zone) return [];
      return [{ id: `${String(s.kind)}_${i + 1}`, kind: String(s.kind), label: String(s.label ?? "").slice(0, 80), colors: colors(s.colors), material: String(s.material ?? "").slice(0, 60), finish: String(s.finish ?? "").slice(0, 30), zone }];
    });
    return { objects, surfaces };
  }
  if (env.OPENAI_API_KEY) return { objects: await analyseOpenAI(env, image), surfaces: [] };
  throw new ProviderError("L'analyse automatique n'est pas configurée (clé manquante).", false);
}

export interface Moodboard { style: string; summary: string; palette: Array<{ name: string; hex: string }>; materials: string[]; objects: unknown[]; brief_fr: string; brief_en: string }
export async function moodboard(env: Env, images: ImgIn[], catalog: Array<{ id: string; name: string }>): Promise<Moodboard> {
  if (!env.GEMINI_API_KEY) throw new ProviderError("Le moodboard automatique n'est pas configuré (clé manquante).", false);
  const ids = new Set(catalog.map((c) => c.id));
  const j = await geminiJson(env, [{ text: MOOD(catalog.map((c) => `${c.id}: ${c.name}`).join("; ")) }, ...images.map((im) => ({ inline_data: { mime_type: im.mime, data: im.b64 } }))]);
  return {
    style: String(j.style ?? "").slice(0, 60), summary: String(j.summary ?? "").slice(0, 300), palette: colors(j.palette),
    materials: strs(j.materials, 8).filter((m) => ids.has(m)),
    objects: arr(j.objects).filter((o) => CATS.includes(String(o.type))).slice(0, 8).map((o) => ({ type: o.type, label: String(o.label ?? "").slice(0, 80), materials: strs(o.materials), colors: colors(o.colors), shape: strs(o.shape) })),
    brief_fr: String(j.brief_fr ?? "").slice(0, 1200), brief_en: String(j.brief_en ?? "").slice(0, 1500),
  };
}

/* ——— OpenAI (si sa clé est configurée et pas celle de Gemini) ——— */
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["objects"],
  properties: { objects: { type: "array", items: {
    type: "object", additionalProperties: false,
    required: ["type", "label", "shape", "materials", "colors", "style", "width_cm", "depth_cm", "height_cm", "x", "y", "w", "h"],
    properties: {
      type: { type: "string", enum: CATS }, label: { type: "string" },
      shape: { type: "array", items: { type: "string" } }, materials: { type: "array", items: { type: "string" } },
      colors: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "hex"], properties: { name: { type: "string" }, hex: { type: "string" } } } },
      style: { type: "array", items: { type: "string" } },
      width_cm: { type: "number" }, depth_cm: { type: "number" }, height_cm: { type: "number" },
      x: { type: "number" }, y: { type: "number" }, w: { type: "number" }, h: { type: "number" },
    },
  } } },
};
async function analyseOpenAI(env: Env, image: ImgIn) {
  const instructions = `You are an interior architect. List every clearly visible piece of furniture, lighting, rug and decor object (max 10): type, short French label, shape tags (${SHAPES}), materials (${MATS}), 1-2 colors (French name + hex), style tags (${STYLES}), estimated dimensions in cm, bounding box in percent (x, y = top-left, w, h). Never name a brand.`;
  const r = await fetchRetry("https://api.openai.com/v1/responses", {
    method: "POST", headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: env.OPENAI_RESPONSES_MODEL || "gpt-5.4-mini", store: false,
      input: [{ role: "user", content: [{ type: "input_text", text: instructions }, { type: "input_image", image_url: `data:${image.mime};base64,${image.b64}`, detail: "high" }] }],
      text: { format: { type: "json_schema", name: "meubles", schema: SCHEMA, strict: true } },
    }),
  });
  if (!r.ok) throw new ProviderError("L'analyse de l'image a échoué.", r.status >= 500, `HTTP ${r.status}`);
  const j = await r.json() as { output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> };
  const txt = j.output?.flatMap((o) => (o.type === "message" ? o.content ?? [] : [])).find((c) => c.type === "output_text")?.text;
  const parsed = txt ? JSON.parse(txt) as { objects: Array<Record<string, unknown>> } : { objects: [] };
  return parsed.objects.map((o, i) => ({
    id: `${String(o.type)}_${String(i + 1).padStart(3, "0")}`, type: o.type, label: o.label, design_source: "ai_detected",
    shape: o.shape, materials: o.materials, colors: (o.colors as Array<{ name: string; hex: string }>).filter((c) => /^#[0-9a-f]{6}$/i.test(c.hex)), style: o.style,
    estimated_dimensions_cm: { width: o.width_cm, depth: o.depth_cm, height: o.height_cm },
    zone: { x: clamp(o.x), y: clamp(o.y), w: clamp(o.w), h: clamp(o.h) },
  }));
}
