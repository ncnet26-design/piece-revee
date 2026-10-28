/**
 * Fournisseurs d'images interchangeables. Chacun reçoit la même demande et rend soit l'image (appel synchrone),
 * soit une référence de tâche à interroger plus tard (file d'attente côté fournisseur).
 * Pour ajouter un fournisseur : écrire un objet `Provider` et l'ajouter à PROVIDERS.
 */
import type { Env, Quality } from "./config";
import { OPENAI_TOKEN_USD } from "./config";
import type { Mode } from "./prompts";

export type ImgIn = { mime: string; b64: string };
export interface ProviderRequest { mode: Mode; prompt: string; photo?: ImgIn; references: ImgIn[]; width: number; height: number; quality: Quality; visitor: string }
export type Done = { state: "done"; image: Uint8Array; mime: string; costUsd?: number };
export type Submit = Done | { state: "pending"; ref: string };
export type Poll = Done | { state: "pending" } | { state: "error"; message: string; retryable: boolean };
export interface Provider {
  id: "openai" | "gemini" | "fal" | "replicate";
  configured(env: Env): boolean;
  model(env: Env, mode: Mode): string;
  submit(req: ProviderRequest, env: Env): Promise<Submit>;
  poll?(ref: string, env: Env): Promise<Poll>;
}

export class ProviderError extends Error {
  constructor(message: string, readonly retryable: boolean, readonly detail = "") { super(message); }
}

/* ——— Outils ——— */
export const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
let pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Pour les tests : supprime les attentes entre deux essais. */
export const _setPause = (f: (ms: number) => Promise<unknown>) => { pause = f as typeof pause; };

/** Appel HTTP avec nouvelles tentatives sur les erreurs passagères (réseau, 429, 5xx). */
export async function fetchRetry(url: string, init: RequestInit, tries = 3): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, init);
      if (r.status !== 429 && r.status < 500) return r;
      last = new ProviderError(r.status === 429 ? "Le fournisseur d'images est saturé." : "Le fournisseur d'images est indisponible.", true, `HTTP ${r.status}`);
    } catch (e) { last = new ProviderError("Le fournisseur d'images ne répond pas.", true, String(e)); }
    if (i < tries - 1) await pause(1500 * 3 ** i);
  }
  throw last;
}
async function failure(r: Response, who: string): Promise<never> {
  const j = await r.json().catch(() => null) as { error?: { message?: string; code?: string } | string; detail?: unknown } | null;
  const msg = typeof j?.error === "string" ? j.error : j?.error?.message ?? (j?.detail ? JSON.stringify(j.detail) : "");
  const moderation = /safety|moderation|policy|content/i.test(msg);
  throw new ProviderError(moderation ? "La demande a été refusée par le filtre de contenu du fournisseur. Reformulez-la." : `${who} a refusé la demande.`, false, `${r.status} ${msg}`.slice(0, 300));
}

/** Taille de sortie : multiples de 16, rapport limité à 1:3–3:1, bord long selon la qualité. */
export function pickSize(w: number, h: number, quality: Quality, model: string): { w: number; h: number } {
  const free = /^gpt-image-2/.test(model);
  const r = Math.min(3, Math.max(1 / 3, w / h));
  if (!free) return r > 1.2 ? { w: 1536, h: 1024 } : r < 0.83 ? { w: 1024, h: 1536 } : { w: 1024, h: 1024 };
  const long = quality === "premium" ? 2048 : quality === "standard" ? 1536 : 1024;
  const s16 = (v: number) => Math.max(256, Math.round(v / 16) * 16);
  return r >= 1 ? { w: s16(long), h: s16(long / r) } : { w: s16(long * r), h: s16(long) };
}
const OPENAI_QUALITY: Record<Quality, string> = { brouillon: "low", standard: "medium", premium: "high" };

/* ——— OpenAI ——— */
const openaiModel = (env: Env) => env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";
export const openai: Provider = {
  id: "openai",
  configured: (env) => Boolean(env.OPENAI_API_KEY),
  model: (env) => openaiModel(env),
  async submit(req, env) {
    const model = openaiModel(env), size = pickSize(req.width, req.height, req.quality, model);
    const fidelity = /^gpt-image-1\.5/.test(model) ? { input_fidelity: "high" } : {};
    const images = [...(req.photo ? [req.photo] : []), ...req.references].slice(0, 16);
    const auth = { authorization: `Bearer ${env.OPENAI_API_KEY}` };

    if (env.OPENAI_MODE === "background") {
      // Tâche asynchrone côté OpenAI : réponse immédiate, image récupérée par interrogation.
      const r = await fetchRetry("https://api.openai.com/v1/responses", {
        method: "POST", headers: { ...auth, "content-type": "application/json" },
        body: JSON.stringify({
          model: env.OPENAI_RESPONSES_MODEL || "gpt-5.4-mini", background: true, store: true,
          input: [{ role: "user", content: [{ type: "input_text", text: req.prompt }, ...images.map((im) => ({ type: "input_image", image_url: `data:${im.mime};base64,${im.b64}`, detail: "high" }))] }],
          tools: [{ type: "image_generation", model, quality: OPENAI_QUALITY[req.quality], size: `${size.w}x${size.h}`, output_format: "jpeg", action: req.mode === "transform" ? "edit" : "generate", ...fidelity }],
          tool_choice: { type: "image_generation" },
        }),
      });
      if (!r.ok) await failure(r, "OpenAI");
      const j = await r.json() as { id: string };
      return { state: "pending", ref: j.id };
    }

    let r: Response;
    if (images.length === 0) {
      r = await fetchRetry("https://api.openai.com/v1/images/generations", {
        method: "POST", headers: { ...auth, "content-type": "application/json" },
        body: JSON.stringify({ model, prompt: req.prompt, size: `${size.w}x${size.h}`, quality: OPENAI_QUALITY[req.quality], output_format: "jpeg", output_compression: 92, n: 1 }),
      });
    } else {
      const form = new FormData();
      form.append("model", model); form.append("prompt", req.prompt); form.append("size", `${size.w}x${size.h}`);
      form.append("quality", OPENAI_QUALITY[req.quality]); form.append("output_format", "jpeg"); form.append("output_compression", "92");
      if (fidelity.input_fidelity) form.append("input_fidelity", fidelity.input_fidelity);
      const field = images.length > 1 ? "image[]" : "image";
      images.forEach((im, i) => form.append(field, new Blob([b64ToBytes(im.b64)], { type: im.mime }), `image-${i + 1}.${im.mime.split("/")[1]}`));
      r = await fetchRetry("https://api.openai.com/v1/images/edits", { method: "POST", headers: auth, body: form });
    }
    if (!r.ok) await failure(r, "OpenAI");
    const j = await r.json() as { data?: Array<{ b64_json?: string }>; usage?: { input_tokens_details?: { image_tokens?: number; text_tokens?: number }; output_tokens?: number } };
    const b64 = j.data?.[0]?.b64_json;
    if (!b64) throw new ProviderError("Aucune image n'a été produite.", true);
    const u = j.usage;
    const costUsd = u ? ((u.input_tokens_details?.text_tokens ?? 0) * OPENAI_TOKEN_USD.textIn + (u.input_tokens_details?.image_tokens ?? 0) * OPENAI_TOKEN_USD.imageIn + (u.output_tokens ?? 0) * OPENAI_TOKEN_USD.imageOut) / 1e6 : undefined;
    return { state: "done", image: b64ToBytes(b64), mime: "image/jpeg", costUsd };
  },
  async poll(ref, env) {
    const r = await fetchRetry(`https://api.openai.com/v1/responses/${encodeURIComponent(ref)}`, { headers: { authorization: `Bearer ${env.OPENAI_API_KEY}` } });
    if (!r.ok) return { state: "error", message: "Suivi de la tâche OpenAI impossible.", retryable: true };
    const j = await r.json() as { status: string; error?: { message?: string } | null; output?: Array<{ type: string; result?: string | null; status?: string }> };
    if (j.status === "queued" || j.status === "in_progress") return { state: "pending" };
    const call = j.output?.find((o) => o.type === "image_generation_call" && o.result);
    if (j.status === "completed" && call?.result) return { state: "done", image: b64ToBytes(call.result), mime: "image/jpeg" };
    return { state: "error", message: j.error?.message ? "La génération a échoué chez OpenAI." : "Aucune image n'a été produite.", retryable: j.status !== "cancelled" };
  },
};

/* ——— Google Gemini (service actuel du site) ——— */
const GEMINI_MODEL = "gemini-nano-banana-2.1";
const nearestRatio = (w: number, h: number) => (["1:1", "4:3", "3:4", "3:2", "2:3", "16:9", "9:16", "4:5", "5:4"] as const)
  .reduce((a, b) => { const v = (s: string) => { const [x, y] = s.split(":").map(Number); return Math.abs(Math.log(x! / y! / (w / h))); }; return v(b) < v(a) ? b : a; }, "1:1" as string);
export const gemini: Provider = {
  id: "gemini",
  configured: (env) => Boolean(env.GEMINI_API_KEY),
  model: () => GEMINI_MODEL,
  async submit(req, env) {
    const input: unknown[] = [{ type: "text", text: req.prompt }];
    if (req.photo) input.push({ type: "image", mime_type: req.photo.mime, data: req.photo.b64 });
    req.references.slice(0, 4).forEach((im) => input.push({ type: "image", mime_type: im.mime, data: im.b64 }));
    const r = await fetchRetry("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY! },
      body: JSON.stringify({ model: GEMINI_MODEL, input, response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: nearestRatio(req.width, req.height), image_size: req.quality === "premium" ? "2K" : "1K" }, generation_config: { thinking_level: "minimal" }, store: false }),
    });
    if (!r.ok) await failure(r, "Google");
    const j = await r.json() as { steps?: Array<{ type: string; content?: Array<{ type: string; data?: string; mime_type?: string }> }> };
    const block = j.steps?.flatMap((s) => (s.type === "model_output" ? s.content ?? [] : [])).find((c) => c.type === "image" && c.data);
    if (!block?.data) throw new ProviderError("Aucune image n'a été produite. Reformulez la demande.", true);
    return { state: "done", image: b64ToBytes(block.data), mime: block.mime_type || "image/jpeg" };
  },
};

/* ——— fal.ai (file d'attente) ——— */
const falModel = (env: Env, mode: Mode) => (mode === "transform" ? env.FAL_MODEL_EDIT || "fal-ai/flux-pro/kontext" : env.FAL_MODEL_TEXT || "fal-ai/flux-pro/kontext/text-to-image");
/** Les demandes de suivi se font sur « propriétaire/application » (deux premiers segments). */
const falApp = (model: string) => model.split("/").slice(0, 2).join("/");
async function fetchImage(url: string): Promise<Done> {
  const r = await fetchRetry(url, {});
  if (!r.ok) throw new ProviderError("Image produite mais introuvable chez le fournisseur.", true);
  return { state: "done", image: new Uint8Array(await r.arrayBuffer()), mime: r.headers.get("content-type") || "image/jpeg" };
}
export const fal: Provider = {
  id: "fal",
  configured: (env) => Boolean(env.FAL_KEY),
  model: falModel,
  async submit(req, env) {
    const model = falModel(env, req.mode);
    const input: Record<string, unknown> = { prompt: req.prompt, aspect_ratio: nearestRatio(req.width, req.height), output_format: "jpeg", num_images: 1 };
    if (req.photo) input.image_url = `data:${req.photo.mime};base64,${req.photo.b64}`;
    const r = await fetchRetry(`https://queue.fal.run/${model}`, { method: "POST", headers: { authorization: `Key ${env.FAL_KEY}`, "content-type": "application/json" }, body: JSON.stringify(input) });
    if (!r.ok) await failure(r, "fal.ai");
    const j = await r.json() as { request_id: string };
    return { state: "pending", ref: `${falApp(model)}|${j.request_id}` };
  },
  async poll(ref, env) {
    const [app, id] = ref.split("|");
    const h = { authorization: `Key ${env.FAL_KEY}` };
    const s = await fetchRetry(`https://queue.fal.run/${app}/requests/${id}/status`, { headers: h });
    if (!s.ok) return { state: "error", message: "Suivi de la tâche fal.ai impossible.", retryable: true };
    const st = await s.json() as { status: string };
    if (st.status !== "COMPLETED") return { state: "pending" };
    const r = await fetchRetry(`https://queue.fal.run/${app}/requests/${id}`, { headers: h });
    const j = await r.json().catch(() => null) as { images?: Array<{ url: string }> } | null;
    const url = j?.images?.[0]?.url;
    return url ? fetchImage(url) : { state: "error", message: "fal.ai n'a pas produit d'image.", retryable: true };
  },
};

/* ——— Replicate (prédictions) ——— */
const replicateModel = (env: Env) => env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-pro";
export const replicate: Provider = {
  id: "replicate",
  configured: (env) => Boolean(env.REPLICATE_API_TOKEN),
  model: (env) => replicateModel(env),
  async submit(req, env) {
    const input: Record<string, unknown> = { prompt: req.prompt, aspect_ratio: req.photo ? "match_input_image" : nearestRatio(req.width, req.height), output_format: "jpg" };
    if (req.photo) input.input_image = `data:${req.photo.mime};base64,${req.photo.b64}`;
    const r = await fetchRetry(`https://api.replicate.com/v1/models/${replicateModel(env)}/predictions`, { method: "POST", headers: { authorization: `Bearer ${env.REPLICATE_API_TOKEN}`, "content-type": "application/json" }, body: JSON.stringify({ input }) });
    if (!r.ok) await failure(r, "Replicate");
    const j = await r.json() as { id: string };
    return { state: "pending", ref: j.id };
  },
  async poll(ref, env) {
    const r = await fetchRetry(`https://api.replicate.com/v1/predictions/${encodeURIComponent(ref)}`, { headers: { authorization: `Bearer ${env.REPLICATE_API_TOKEN}` } });
    if (!r.ok) return { state: "error", message: "Suivi de la tâche Replicate impossible.", retryable: true };
    const j = await r.json() as { status: string; output?: string | string[] | null };
    if (j.status === "starting" || j.status === "processing") return { state: "pending" };
    const url = Array.isArray(j.output) ? j.output[0] : j.output;
    if (j.status === "succeeded" && url) return fetchImage(url);
    return { state: "error", message: "Replicate n'a pas produit d'image.", retryable: j.status === "failed" };
  },
};

export const PROVIDERS: Provider[] = [openai, gemini, fal, replicate];
/** Fournisseur demandé s'il est configuré, sinon celui du réglage IA_FOURNISSEUR, sinon le premier disponible. */
export function chooseProvider(env: Env, wanted?: string): Provider | null {
  const ok = PROVIDERS.filter((p) => p.configured(env));
  return ok.find((p) => p.id === wanted) ?? ok.find((p) => p.id === env.IA_FOURNISSEUR) ?? ok[0] ?? null;
}
