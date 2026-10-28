/**
 * Analyse d'un rendu ou d'une photo : liste des meubles visibles avec leur zone (en % de l'image) et leurs traits
 * visuels (forme, matières, couleurs, style, dimensions estimées). Sert à rendre chaque meuble cliquable
 * et à chercher des produits ressemblants. Modèle multimodal d'OpenAI (sortie JSON contrainte par un schéma).
 */
import type { Env } from "./config";
import { fetchRetry, ProviderError, type ImgIn } from "./providers";

const CATS = ["canape", "fauteuil", "table-basse", "lampadaire", "luminaire", "rangement", "poignee", "chaise", "table-manger", "deco", "tapis", "lit", "salle-de-bain", "robinetterie"];
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
const INSTRUCTIONS = [
  "You are an interior architect. List every clearly visible piece of furniture, lighting, rug and decor object in this interior image (max 10).",
  "For each: type (one of the enum), a short French label (e.g. « Table basse sculpturale en travertin »), shape tags in French kebab-case among: organique, arrondi, ronde, ovale, carree, basse, tres-bas, massive, droit, enveloppant, pieds-fins, pieds-bois, pieds-metal, globe, tige-fine, barre, capitonne, cannele, multi-bras;",
  "materials in French among: travertin, marbre, pierre, bois, velours, boucle, lin, laine, cuir, laiton, metal, verre, ceramique, terre-cuite, ciment;",
  "1-2 dominant colors (French name + hex), style tags in French (contemporain, minimal, organique, classique, vintage, art-deco, scandinave, seventies, design-iconique),",
  "estimated real dimensions in cm, and the bounding box in percent of the image (x, y = top-left corner, w, h). Never name a brand.",
].join(" ");

export async function analyse(env: Env, image: ImgIn) {
  if (!env.OPENAI_API_KEY) throw new ProviderError("L'analyse automatique nécessite la clé OpenAI (non configurée).", false);
  const r = await fetchRetry("https://api.openai.com/v1/responses", {
    method: "POST", headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: env.OPENAI_RESPONSES_MODEL || "gpt-5.4-mini", store: false,
      input: [{ role: "user", content: [{ type: "input_text", text: INSTRUCTIONS }, { type: "input_image", image_url: `data:${image.mime};base64,${image.b64}`, detail: "high" }] }],
      text: { format: { type: "json_schema", name: "meubles", schema: SCHEMA, strict: true } },
    }),
  });
  if (!r.ok) throw new ProviderError("L'analyse de l'image a échoué.", r.status >= 500, `HTTP ${r.status}`);
  const j = await r.json() as { output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> };
  const txt = j.output?.flatMap((o) => (o.type === "message" ? o.content ?? [] : [])).find((c) => c.type === "output_text")?.text;
  const parsed = txt ? JSON.parse(txt) as { objects: Array<Record<string, unknown>> } : { objects: [] };
  const clamp = (v: unknown) => Math.max(0, Math.min(100, Number(v) || 0));
  return parsed.objects.map((o, i) => ({
    id: `${String(o.type)}_${String(i + 1).padStart(3, "0")}`, type: o.type, label: o.label, design_source: "ai_detected",
    shape: o.shape, materials: o.materials, colors: (o.colors as Array<{ name: string; hex: string }>).filter((c) => /^#[0-9a-f]{6}$/i.test(c.hex)), style: o.style,
    estimated_dimensions_cm: { width: o.width_cm, depth: o.depth_cm, height: o.height_cm },
    zone: { x: clamp(o.x), y: clamp(o.y), w: clamp(o.w), h: clamp(o.h) },
  }));
}
