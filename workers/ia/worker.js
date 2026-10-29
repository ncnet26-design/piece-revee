/**
 * Pièce Rêvée · service d'images IA (Cloudflare Worker « piece-revee-ia »). FICHIER GÉNÉRÉ : modifier workers/ia/src puis
 * lancer « node scripts/build-ia-worker.mjs ». À coller tel quel dans Cloudflare (Edit code), puis Deploy.
 *
 * Réglages Cloudflare (Settings → Variables and Secrets / Bindings) :
 *   Secrets (au moins un) : OPENAI_API_KEY, GEMINI_API_KEY, FAL_KEY, REPLICATE_API_TOKEN — jamais dans le site ni dans le code.
 *   Liaison KV  QUOTA     : compteurs, budget, fiches des tâches (et images si pas de R2).
 *   Liaison R2  IMAGES    : facultative, stockage durable des images produites.
 *   Variables facultatives : IA_FOURNISSEUR, OPENAI_IMAGE_MODEL, OPENAI_MODE (images | background), BUDGET_MOIS_USD (15),
 *   BUDGET_VISITEUR_MOIS_USD (1.5), IMAGES_JOUR (30), IMAGES_VISITEUR_JOUR (6).
 */

// workers/ia/src/config.ts
var ALLOWED_ORIGINS = [
  "https://odd-bar-c583.ewanesteves26.workers.dev",
  "http://localhost:3000",
  "http://localhost:4173"
];
var isAllowedOrigin = (origin) => ALLOWED_ORIGINS.includes(origin) || /^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin) && origin.includes("piece-revee");
var MAX_BODY = 12 * 1024 * 1024;
var num = (v, d) => v !== void 0 && v !== "" && Number.isFinite(Number(v)) ? Number(v) : d;
var limits = (env) => ({
  monthUsd: num(env.BUDGET_MOIS_USD, 15),
  visitorMonthUsd: num(env.BUDGET_VISITEUR_MOIS_USD, 1.5),
  dayImages: num(env.IMAGES_JOUR, 30),
  visitorDayImages: num(env.IMAGES_VISITEUR_JOUR, 6)
});
var PRICE_ESTIMATE = {
  openai: { brouillon: 0.02, standard: 0.06, premium: 0.2 },
  gemini: { brouillon: 0.04, standard: 0.04, premium: 0.06 },
  fal: { brouillon: 0.04, standard: 0.04, premium: 0.08 },
  replicate: { brouillon: 0.04, standard: 0.04, premium: 0.08 }
};
var OPENAI_TOKEN_USD = { textIn: 5, imageIn: 8, imageOut: 30 };

// workers/ia/src/prompts.ts
var KEEP = {
  fenetres: "every window: exact position, size, frames, glazing bars and the view outside",
  portes: "every door and doorway: exact position, size and opening",
  murs: "the wall layout, corners, niches and wall openings",
  plafond: "the ceiling height, beams, cornices and ceiling roses",
  sol: "the existing floor material, its pattern and its direction",
  moulures: "all mouldings, wall panelling and skirting boards",
  cheminee: "the fireplace and its mantelpiece",
  escalier: "the staircase and its handrail",
  radiateurs: "the radiators and their position",
  mobilier: "the furniture already in the room (same pieces, same places)"
};
var PHOTO = [
  "Shot like an architectural interior photograph for a high-end design magazine: full-frame camera, 24-35mm lens, eye-level, verticals perfectly straight,",
  "soft natural daylight with physically correct bounce light and soft contact shadows, no blown highlights.",
  "Materials must read as real at close range: wood grain and pores, stone veining and honed or polished sheen, fabric weave and pile, brushed metal with soft anisotropic highlights, glazed ceramic with slight irregularity.",
  "No text, no logo, no watermark, no people, no distorted furniture, no duplicated objects."
].join(" ");
function buildPrompt(p) {
  const lines = [];
  if (p.mode === "transform") {
    lines.push(
      "You are an award-winning interior designer and architectural photographer.",
      "Image 1 is a photo of the client's real room. Redesign it according to the brief below.",
      "ABSOLUTE CONSTRAINTS \u2014 the result must be the same room seen from the same point:",
      "- identical camera position, height, lens and perspective; identical framing and aspect ratio;",
      "- identical room geometry: wall positions, corners, ceiling height, window and door openings stay exactly where they are;"
    );
    const keep = (p.keep ?? []).map((k) => KEEP[k]).filter(Boolean);
    if (keep.length) lines.push(`- keep strictly unchanged: ${keep.join("; ")};`);
    if (p.keepFree) lines.push(`- the client also wants to keep (French): "${p.keepFree}";`);
    lines.push("- change only finishes, colours, furniture, textiles, lighting and decor that the brief asks for.");
  } else {
    lines.push("Create one photorealistic interior photograph of a single room, designed by an award-winning interior architect.");
  }
  if (p.onlyZone) {
    const z = p.onlyZone;
    lines.push(`LOCAL EDIT ONLY: change exclusively the object "${z.label}" located in the region from ${Math.round(z.x)}% to ${Math.round(z.x + z.w)}% horizontally and ${Math.round(z.y)}% to ${Math.round(z.y + z.h)}% vertically. Every other pixel of the image \u2014 other furniture, rug, walls, floor, lighting, camera \u2014 must stay identical.`);
  }
  const first = p.mode === "transform" ? 2 : 1, last = (p.references ?? 0) + first - 1;
  if (p.references && p.inspirations) lines.push(`Image${p.references > 1 ? `s ${first} to ${last} are` : ` ${first} is`} the client's inspiration${p.references > 1 ? "s" : ""} (Pinterest, magazines). Bring their style, colour palette, materials, furniture shapes, textiles, lighting and mood into the client's room, adapted to its real geometry and scale. Do not copy their architecture, windows, layout or camera.`);
  else if (p.references) lines.push(`Images ${first} to ${last} are references (materials, finishes or products): reproduce their colour, texture and finish faithfully, do not copy their room.`);
  if (p.materials?.length) lines.push(`Materials to use (exact finishes): ${p.materials.join("; ")}.`);
  if (p.products?.length) lines.push(`Design pieces to show, faithful to their real shape: ${p.products.join("; ")}.`);
  lines.push(`Brief (written in French): ${p.brief}`, PHOTO);
  return lines.join("\n");
}

// workers/ia/src/validate.ts
var DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
var isDataUrl = (v) => typeof v === "string" && v.length <= 9e6 && DATA_URL.test(v);
var QUALITIES = ["brouillon", "standard", "premium"];
var FOURNISSEURS = ["openai", "gemini", "fal", "replicate"];
function parseJobBody(raw) {
  if (!raw || typeof raw !== "object") return null;
  const b = raw;
  const str = (v, max) => typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
  const strs2 = (v, n2, max) => Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, n2).map((x) => str(x, max)).filter(Boolean) : [];
  const int = (v, d) => typeof v === "number" && Number.isInteger(v) && v >= 256 && v <= 8e3 ? v : d;
  if (b.mode !== "generate" && b.mode !== "transform") return null;
  const brief = str(b.brief, 2e3);
  if (brief.length < 3) return null;
  if (typeof b.visiteur !== "string" || !/^[a-z0-9-]{8,64}$/.test(b.visiteur)) return null;
  if (b.photo !== void 0 && !isDataUrl(b.photo)) return null;
  if (b.mode === "transform" && !b.photo) return null;
  const refs = Array.isArray(b.references) ? b.references : [];
  if (refs.length > 6 || !refs.every(isDataUrl)) return null;
  if (b.mask !== void 0 && !(isDataUrl(b.mask) && b.mask.startsWith("data:image/png"))) return null;
  const z = b.onlyZone;
  const pct = (v) => typeof v === "number" && v >= 0 && v <= 100;
  const onlyZone = z && typeof z.label === "string" && pct(z.x) && pct(z.y) && pct(z.w) && pct(z.h) ? { label: str(z.label, 80), x: z.x, y: z.y, w: z.w, h: z.h } : void 0;
  return {
    inspirations: b.inspirations === true,
    mask: b.mask,
    onlyZone,
    mode: b.mode,
    brief,
    photo: b.photo,
    references: refs,
    keep: strs2(b.keep, 12, 20).filter((k) => k in KEEP),
    keepFree: str(b.keepFree, 300) || void 0,
    materials: strs2(b.materials, 10, 160),
    products: strs2(b.products, 6, 160),
    quality: QUALITIES.includes(b.quality) ? b.quality : "standard",
    width: int(b.width, 1536),
    height: int(b.height, 1024),
    visiteur: b.visiteur,
    fournisseur: FOURNISSEURS.includes(b.fournisseur) ? b.fournisseur : void 0
  };
}

// workers/ia/src/providers.ts
var ProviderError = class extends Error {
  constructor(message, retryable, detail = "") {
    super(message);
    this.retryable = retryable;
    this.detail = detail;
  }
};
var b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
var pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchRetry(url, init, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, init);
      if (r.status !== 429 && r.status < 500) return r;
      last = new ProviderError(r.status === 429 ? "Le fournisseur d'images est satur\xE9." : "Le fournisseur d'images est indisponible.", true, `HTTP ${r.status}`);
    } catch (e) {
      last = new ProviderError("Le fournisseur d'images ne r\xE9pond pas.", true, String(e));
    }
    if (i < tries - 1) await pause(1500 * 3 ** i);
  }
  throw last;
}
async function failure(r, who) {
  const j = await r.json().catch(() => null);
  const msg = typeof j?.error === "string" ? j.error : j?.error?.message ?? (j?.detail ? JSON.stringify(j.detail) : "");
  const moderation = /safety|moderation|policy|content/i.test(msg);
  throw new ProviderError(moderation ? "La demande a \xE9t\xE9 refus\xE9e par le filtre de contenu du fournisseur. Reformulez-la." : `${who} a refus\xE9 la demande.`, false, `${r.status} ${msg}`.slice(0, 300));
}
function pickSize(w, h, quality, model) {
  const free = /^gpt-image-2/.test(model);
  const r = Math.min(3, Math.max(1 / 3, w / h));
  if (!free) return r > 1.2 ? { w: 1536, h: 1024 } : r < 0.83 ? { w: 1024, h: 1536 } : { w: 1024, h: 1024 };
  const long = quality === "premium" ? 2048 : quality === "standard" ? 1536 : 1024;
  const s16 = (v) => Math.max(256, Math.round(v / 16) * 16);
  return r >= 1 ? { w: s16(long), h: s16(long / r) } : { w: s16(long * r), h: s16(long) };
}
var OPENAI_QUALITY = { brouillon: "low", standard: "medium", premium: "high" };
var openaiModel = (env) => env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";
var openai = {
  id: "openai",
  configured: (env) => Boolean(env.OPENAI_API_KEY),
  model: (env) => openaiModel(env),
  async submit(req, env) {
    const model = openaiModel(env), size = pickSize(req.width, req.height, req.quality, model);
    const fidelity = /^gpt-image-1\.5/.test(model) ? { input_fidelity: "high" } : {};
    const images = [...req.photo ? [req.photo] : [], ...req.references].slice(0, 16);
    const auth = { authorization: `Bearer ${env.OPENAI_API_KEY}` };
    if (env.OPENAI_MODE === "background") {
      const r2 = await fetchRetry("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { ...auth, "content-type": "application/json" },
        body: JSON.stringify({
          model: env.OPENAI_RESPONSES_MODEL || "gpt-5.4-mini",
          background: true,
          store: true,
          input: [{ role: "user", content: [{ type: "input_text", text: req.prompt }, ...images.map((im) => ({ type: "input_image", image_url: `data:${im.mime};base64,${im.b64}`, detail: "high" }))] }],
          tools: [{ type: "image_generation", model, quality: OPENAI_QUALITY[req.quality], size: `${size.w}x${size.h}`, output_format: "jpeg", action: req.mode === "transform" ? "edit" : "generate", ...fidelity }],
          tool_choice: { type: "image_generation" }
        })
      });
      if (!r2.ok) await failure(r2, "OpenAI");
      const j2 = await r2.json();
      return { state: "pending", ref: j2.id };
    }
    let r;
    if (images.length === 0) {
      r = await fetchRetry("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { ...auth, "content-type": "application/json" },
        body: JSON.stringify({ model, prompt: req.prompt, size: `${size.w}x${size.h}`, quality: OPENAI_QUALITY[req.quality], output_format: "jpeg", output_compression: 92, n: 1 })
      });
    } else {
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", req.prompt);
      form.append("size", `${size.w}x${size.h}`);
      form.append("quality", OPENAI_QUALITY[req.quality]);
      form.append("output_format", "jpeg");
      form.append("output_compression", "92");
      if (fidelity.input_fidelity) form.append("input_fidelity", fidelity.input_fidelity);
      const field = images.length > 1 ? "image[]" : "image";
      images.forEach((im, i) => form.append(field, new Blob([b64ToBytes(im.b64)], { type: im.mime }), `image-${i + 1}.${im.mime.split("/")[1]}`));
      if (req.mask) form.append("mask", new Blob([b64ToBytes(req.mask.b64)], { type: "image/png" }), "masque.png");
      r = await fetchRetry("https://api.openai.com/v1/images/edits", { method: "POST", headers: auth, body: form });
    }
    if (!r.ok) await failure(r, "OpenAI");
    const j = await r.json();
    const b64 = j.data?.[0]?.b64_json;
    if (!b64) throw new ProviderError("Aucune image n'a \xE9t\xE9 produite.", true);
    const u = j.usage;
    const costUsd = u ? ((u.input_tokens_details?.text_tokens ?? 0) * OPENAI_TOKEN_USD.textIn + (u.input_tokens_details?.image_tokens ?? 0) * OPENAI_TOKEN_USD.imageIn + (u.output_tokens ?? 0) * OPENAI_TOKEN_USD.imageOut) / 1e6 : void 0;
    return { state: "done", image: b64ToBytes(b64), mime: "image/jpeg", costUsd };
  },
  async poll(ref, env) {
    const r = await fetchRetry(`https://api.openai.com/v1/responses/${encodeURIComponent(ref)}`, { headers: { authorization: `Bearer ${env.OPENAI_API_KEY}` } });
    if (!r.ok) return { state: "error", message: "Suivi de la t\xE2che OpenAI impossible.", retryable: true };
    const j = await r.json();
    if (j.status === "queued" || j.status === "in_progress") return { state: "pending" };
    const call = j.output?.find((o) => o.type === "image_generation_call" && o.result);
    if (j.status === "completed" && call?.result) return { state: "done", image: b64ToBytes(call.result), mime: "image/jpeg" };
    return { state: "error", message: j.error?.message ? "La g\xE9n\xE9ration a \xE9chou\xE9 chez OpenAI." : "Aucune image n'a \xE9t\xE9 produite.", retryable: j.status !== "cancelled" };
  }
};
var GEMINI_MODEL = "gemini-nano-banana-2.1";
var nearestRatio = (w, h) => ["1:1", "4:3", "3:4", "3:2", "2:3", "16:9", "9:16", "4:5", "5:4"].reduce((a, b) => {
  const v = (s) => {
    const [x, y] = s.split(":").map(Number);
    return Math.abs(Math.log(x / y / (w / h)));
  };
  return v(b) < v(a) ? b : a;
}, "1:1");
var gemini = {
  id: "gemini",
  configured: (env) => Boolean(env.GEMINI_API_KEY),
  model: () => GEMINI_MODEL,
  async submit(req, env) {
    const input = [{ type: "text", text: req.prompt }];
    if (req.photo) input.push({ type: "image", mime_type: req.photo.mime, data: req.photo.b64 });
    req.references.slice(0, 6).forEach((im) => input.push({ type: "image", mime_type: im.mime, data: im.b64 }));
    const r = await fetchRetry("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({ model: GEMINI_MODEL, input, response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: nearestRatio(req.width, req.height), image_size: req.quality === "premium" ? "2K" : "1K" }, generation_config: { thinking_level: "minimal" }, store: false })
    });
    if (!r.ok) await failure(r, "Google");
    const j = await r.json();
    const block = j.steps?.flatMap((s) => s.type === "model_output" ? s.content ?? [] : []).find((c) => c.type === "image" && c.data);
    if (!block?.data) throw new ProviderError("Aucune image n'a \xE9t\xE9 produite. Reformulez la demande.", true);
    return { state: "done", image: b64ToBytes(block.data), mime: block.mime_type || "image/jpeg" };
  }
};
var falModel = (env, mode) => mode === "transform" ? env.FAL_MODEL_EDIT || "fal-ai/flux-pro/kontext" : env.FAL_MODEL_TEXT || "fal-ai/flux-pro/kontext/text-to-image";
var falApp = (model) => model.split("/").slice(0, 2).join("/");
async function fetchImage(url) {
  const r = await fetchRetry(url, {});
  if (!r.ok) throw new ProviderError("Image produite mais introuvable chez le fournisseur.", true);
  return { state: "done", image: new Uint8Array(await r.arrayBuffer()), mime: r.headers.get("content-type") || "image/jpeg" };
}
var fal = {
  id: "fal",
  configured: (env) => Boolean(env.FAL_KEY),
  model: falModel,
  async submit(req, env) {
    const model = falModel(env, req.mode);
    const input = { prompt: req.prompt, aspect_ratio: nearestRatio(req.width, req.height), output_format: "jpeg", num_images: 1 };
    if (req.photo) input.image_url = `data:${req.photo.mime};base64,${req.photo.b64}`;
    const r = await fetchRetry(`https://queue.fal.run/${model}`, { method: "POST", headers: { authorization: `Key ${env.FAL_KEY}`, "content-type": "application/json" }, body: JSON.stringify(input) });
    if (!r.ok) await failure(r, "fal.ai");
    const j = await r.json();
    return { state: "pending", ref: `${falApp(model)}|${j.request_id}` };
  },
  async poll(ref, env) {
    const [app, id] = ref.split("|");
    const h = { authorization: `Key ${env.FAL_KEY}` };
    const s = await fetchRetry(`https://queue.fal.run/${app}/requests/${id}/status`, { headers: h });
    if (!s.ok) return { state: "error", message: "Suivi de la t\xE2che fal.ai impossible.", retryable: true };
    const st = await s.json();
    if (st.status !== "COMPLETED") return { state: "pending" };
    const r = await fetchRetry(`https://queue.fal.run/${app}/requests/${id}`, { headers: h });
    const j = await r.json().catch(() => null);
    const url = j?.images?.[0]?.url;
    return url ? fetchImage(url) : { state: "error", message: "fal.ai n'a pas produit d'image.", retryable: true };
  }
};
var replicateModel = (env) => env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-pro";
var replicate = {
  id: "replicate",
  configured: (env) => Boolean(env.REPLICATE_API_TOKEN),
  model: (env) => replicateModel(env),
  async submit(req, env) {
    const input = { prompt: req.prompt, aspect_ratio: req.photo ? "match_input_image" : nearestRatio(req.width, req.height), output_format: "jpg" };
    if (req.photo) input.input_image = `data:${req.photo.mime};base64,${req.photo.b64}`;
    const r = await fetchRetry(`https://api.replicate.com/v1/models/${replicateModel(env)}/predictions`, { method: "POST", headers: { authorization: `Bearer ${env.REPLICATE_API_TOKEN}`, "content-type": "application/json" }, body: JSON.stringify({ input }) });
    if (!r.ok) await failure(r, "Replicate");
    const j = await r.json();
    return { state: "pending", ref: j.id };
  },
  async poll(ref, env) {
    const r = await fetchRetry(`https://api.replicate.com/v1/predictions/${encodeURIComponent(ref)}`, { headers: { authorization: `Bearer ${env.REPLICATE_API_TOKEN}` } });
    if (!r.ok) return { state: "error", message: "Suivi de la t\xE2che Replicate impossible.", retryable: true };
    const j = await r.json();
    if (j.status === "starting" || j.status === "processing") return { state: "pending" };
    const url = Array.isArray(j.output) ? j.output[0] : j.output;
    if (j.status === "succeeded" && url) return fetchImage(url);
    return { state: "error", message: "Replicate n'a pas produit d'image.", retryable: j.status === "failed" };
  }
};
var PROVIDERS = [openai, gemini, fal, replicate];
function chooseProvider(env, wanted) {
  const ok = PROVIDERS.filter((p) => p.configured(env));
  return ok.find((p) => p.id === wanted) ?? ok.find((p) => p.id === env.IA_FOURNISSEUR) ?? ok[0] ?? null;
}

// workers/ia/src/analyse.ts
var CATS = ["canape", "fauteuil", "table-basse", "lampadaire", "luminaire", "rangement", "poignee", "chaise", "table-manger", "deco", "tapis", "lit", "salle-de-bain", "robinetterie"];
var SURFACES = ["mur", "sol", "plafond", "rideaux", "credence", "porte", "fenetre"];
var SHAPES = "organique, arrondi, ronde, ovale, carree, basse, tres-bas, massive, droit, enveloppant, pieds-fins, pieds-bois, pieds-metal, globe, tige-fine, barre, capitonne, cannele, multi-bras";
var MATS = "travertin, marbre, pierre, bois, velours, boucle, lin, laine, cuir, laiton, metal, verre, ceramique, terre-cuite, ciment";
var STYLES = "contemporain, minimal, organique, classique, vintage, art-deco, scandinave, seventies, design-iconique, mineral, glam";
var TEXT_MODEL = "gemini-3.8-flash";
var PIECE = [
  "You are an interior architect. Look at this interior image and return JSON only, no prose.",
  `"objects": EVERY visible item a client could buy, even small ones (max 30): furniture, lighting, rugs, cushions, throws, vases, ceramics, books, frames and art, mirrors, plants and pots, candles, trays, handles, taps. For each: "type" (one of: ${CATS.join(", ")}; use deco for small decor, luminaire for any lamp or pendant),`,
  `"label" (short French name, e.g. \xAB Table basse sculpturale en travertin \xBB), "shape" (French tags among: ${SHAPES}), "materials" (French among: ${MATS}),`,
  `"colors" (1-2 dominant colors: {"name" in French, "hex"}), "style" (French among: ${STYLES}), "width_cm", "depth_cm", "height_cm" (estimated real size),`,
  `"query_fr": a precise French shopping search query for this exact item (type, material, colour, shape, approximate size, e.g. \xAB vase en gr\xE8s beige mat 30 cm \xBB),`,
  `"box_2d": [ymin, xmin, ymax, xmax] normalised 0-1000, tight around the item.`,
  `"surfaces": the main room surfaces (max 6). For each: "kind" (one of: ${SURFACES.join(", ")}), "label" (French, e.g. \xAB Mur en enduit \xE0 la chaux \xBB),`,
  `"colors" (1-2: {"name" in French, "hex"} of the surface itself, not of objects in front), "material" (French, e.g. peinture mate, enduit, parquet ch\xEAne, carrelage, lin),`,
  `"finish" (French: mat, satin\xE9, brillant, brut, cir\xE9\u2026), "box_2d" as above covering the visible part of the surface.`,
  "Never name a brand or a commercial product. Use realistic estimates."
].join(" ");
var MOOD = (catalog) => [
  "You are an award-winning interior designer preparing a client mood board. The images are the client's inspirations (Pinterest, magazines, screenshots).",
  "Return JSON only with these fields:",
  `"style": short French name of the common style (e.g. \xAB Japandi chaleureux \xBB), "summary": one French sentence describing the mood,`,
  `"palette": 5 to 6 colours shared by the inspirations ({"name" in French, "hex"}), ordered from dominant to accent,`,
  `"materials": up to 8 materials visible in the inspirations, as ids chosen ONLY from this catalogue (id: name): ${catalog},`,
  `"objects": up to 8 key pieces that define the look ({"type" one of: ${CATS.join(", ")}, "label" in French, "materials" French among: ${MATS}, "colors" [{"name","hex"}], "shape" French tags among: ${SHAPES}}),`,
  `"brief_fr": a precise French brief (3-4 sentences) to redesign a client's room in this spirit: palette, materials, furniture shapes, textiles, lighting, decor,`,
  `"brief_en": the same brief in English, written as instructions for an image model, without any brand name.`,
  "Never name a brand or a commercial product."
].join(" ");
async function geminiJson(env, parts) {
  const model = env.GEMINI_TEXT_MODEL || TEXT_MODEL;
  const r = await fetchRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } })
  });
  if (!r.ok) throw new ProviderError("L'analyse de l'image a \xE9chou\xE9.", r.status >= 500 || r.status === 429, `HTTP ${r.status}`);
  const j = await r.json();
  const txt = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  try {
    return JSON.parse(txt.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new ProviderError("R\xE9ponse d'analyse illisible.", true);
  }
}
var arr = (v) => Array.isArray(v) ? v : [];
var strs = (v, n2 = 8) => Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, n2) : [];
var colors = (v) => arr(v).filter((c) => typeof c.hex === "string" && /^#[0-9a-f]{6}$/i.test(c.hex)).slice(0, 6).map((c) => ({ name: String(c.name ?? "").slice(0, 40), hex: String(c.hex).toUpperCase() }));
var clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
function boxToZone(b) {
  if (!Array.isArray(b) || b.length !== 4 || !b.every((n2) => typeof n2 === "number")) return null;
  const [y0, x0, y1, x1] = b.map((n2) => Math.max(0, Math.min(1e3, n2)) / 10);
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
async function analyse(env, image) {
  if (env.GEMINI_API_KEY) {
    const j = await geminiJson(env, [{ text: PIECE }, { inline_data: { mime_type: image.mime, data: image.b64 } }]);
    const objects = arr(j.objects).filter((o) => CATS.includes(String(o.type))).flatMap((o, i) => {
      const zone = boxToZone(o.box_2d);
      if (!zone) return [];
      return [{
        id: `${String(o.type)}_${String(i + 1).padStart(3, "0")}`,
        type: o.type,
        label: String(o.label ?? "").slice(0, 80),
        design_source: "ai_detected",
        query: String(o.query_fr ?? o.label ?? "").slice(0, 120),
        shape: strs(o.shape),
        materials: strs(o.materials),
        colors: colors(o.colors),
        style: strs(o.style),
        estimated_dimensions_cm: Number(o.width_cm) > 0 ? { width: Number(o.width_cm), depth: Number(o.depth_cm) || 0, height: Number(o.height_cm) || 0 } : null,
        zone
      }];
    });
    const surfaces = arr(j.surfaces).filter((s) => SURFACES.includes(String(s.kind))).flatMap((s, i) => {
      const zone = boxToZone(s.box_2d);
      if (!zone) return [];
      return [{ id: `${String(s.kind)}_${i + 1}`, kind: String(s.kind), label: String(s.label ?? "").slice(0, 80), colors: colors(s.colors), material: String(s.material ?? "").slice(0, 60), finish: String(s.finish ?? "").slice(0, 30), zone }];
    });
    return { objects, surfaces };
  }
  if (env.OPENAI_API_KEY) return { objects: await analyseOpenAI(env, image), surfaces: [] };
  throw new ProviderError("L'analyse automatique n'est pas configur\xE9e (cl\xE9 manquante).", false);
}
async function moodboard(env, images, catalog) {
  if (!env.GEMINI_API_KEY) throw new ProviderError("Le moodboard automatique n'est pas configur\xE9 (cl\xE9 manquante).", false);
  const ids = new Set(catalog.map((c) => c.id));
  const j = await geminiJson(env, [{ text: MOOD(catalog.map((c) => `${c.id}: ${c.name}`).join("; ")) }, ...images.map((im) => ({ inline_data: { mime_type: im.mime, data: im.b64 } }))]);
  return {
    style: String(j.style ?? "").slice(0, 60),
    summary: String(j.summary ?? "").slice(0, 300),
    palette: colors(j.palette),
    materials: strs(j.materials, 8).filter((m) => ids.has(m)),
    objects: arr(j.objects).filter((o) => CATS.includes(String(o.type))).slice(0, 8).map((o) => ({ type: o.type, label: String(o.label ?? "").slice(0, 80), materials: strs(o.materials), colors: colors(o.colors), shape: strs(o.shape) })),
    brief_fr: String(j.brief_fr ?? "").slice(0, 1200),
    brief_en: String(j.brief_en ?? "").slice(0, 1500)
  };
}
var SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["objects"],
  properties: { objects: { type: "array", items: {
    type: "object",
    additionalProperties: false,
    required: ["type", "label", "shape", "materials", "colors", "style", "width_cm", "depth_cm", "height_cm", "x", "y", "w", "h"],
    properties: {
      type: { type: "string", enum: CATS },
      label: { type: "string" },
      shape: { type: "array", items: { type: "string" } },
      materials: { type: "array", items: { type: "string" } },
      colors: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "hex"], properties: { name: { type: "string" }, hex: { type: "string" } } } },
      style: { type: "array", items: { type: "string" } },
      width_cm: { type: "number" },
      depth_cm: { type: "number" },
      height_cm: { type: "number" },
      x: { type: "number" },
      y: { type: "number" },
      w: { type: "number" },
      h: { type: "number" }
    }
  } } }
};
async function analyseOpenAI(env, image) {
  const instructions = `You are an interior architect. List every clearly visible piece of furniture, lighting, rug and decor object (max 10): type, short French label, shape tags (${SHAPES}), materials (${MATS}), 1-2 colors (French name + hex), style tags (${STYLES}), estimated dimensions in cm, bounding box in percent (x, y = top-left, w, h). Never name a brand.`;
  const r = await fetchRetry("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: env.OPENAI_RESPONSES_MODEL || "gpt-5.4-mini",
      store: false,
      input: [{ role: "user", content: [{ type: "input_text", text: instructions }, { type: "input_image", image_url: `data:${image.mime};base64,${image.b64}`, detail: "high" }] }],
      text: { format: { type: "json_schema", name: "meubles", schema: SCHEMA, strict: true } }
    })
  });
  if (!r.ok) throw new ProviderError("L'analyse de l'image a \xE9chou\xE9.", r.status >= 500, `HTTP ${r.status}`);
  const j = await r.json();
  const txt = j.output?.flatMap((o) => o.type === "message" ? o.content ?? [] : []).find((c) => c.type === "output_text")?.text;
  const parsed = txt ? JSON.parse(txt) : { objects: [] };
  return parsed.objects.map((o, i) => ({
    id: `${String(o.type)}_${String(i + 1).padStart(3, "0")}`,
    type: o.type,
    label: o.label,
    design_source: "ai_detected",
    shape: o.shape,
    materials: o.materials,
    colors: o.colors.filter((c) => /^#[0-9a-f]{6}$/i.test(c.hex)),
    style: o.style,
    estimated_dimensions_cm: { width: o.width_cm, depth: o.depth_cm, height: o.height_cm },
    zone: { x: clamp(o.x), y: clamp(o.y), w: clamp(o.w), h: clamp(o.h) }
  }));
}

// workers/ia/src/produit.ts
var clean = (s, n2) => typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, n2) : "";
function parseProduct(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const all = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      const o = v;
      all.push(o);
      if (o["@graph"]) walk(o["@graph"]);
    }
  };
  for (const b of blocks) {
    try {
      walk(JSON.parse(b.trim()));
    } catch {
    }
  }
  const isProduct = (o) => {
    const t = o["@type"];
    return ["Product", "ProductGroup", "IndividualProduct"].some((k) => t === k || Array.isArray(t) && t.includes(k));
  };
  for (const o of [...all]) if (o.mainEntity && typeof o.mainEntity === "object") walk(o.mainEntity);
  const p = all.find(isProduct) ?? metaProduct(html);
  if (!p) return null;
  const variant = Array.isArray(p.hasVariant) ? p.hasVariant[0] : void 0;
  const rawOffers = p.offers ?? variant?.offers;
  const offers = Array.isArray(rawOffers) ? rawOffers[0] : rawOffers;
  const agg = offers && (offers["@type"] === "AggregateOffer" ? offers : void 0);
  const raw = offers?.price ?? agg?.lowPrice ?? offers?.priceSpecification?.price;
  const price = raw !== void 0 && Number.isFinite(Number(String(raw).replace(",", "."))) ? Number(String(raw).replace(",", ".")) : null;
  const brand = typeof p.brand === "string" ? p.brand : clean(p.brand?.name, 60) || null;
  const av = clean(offers?.availability, 80).replace(/^https?:\/\/schema\.org\//, "") || null;
  return { name: clean(p.name, 160), brand, price: price && price > 0 ? price : null, currency: clean(offers?.priceCurrency, 3) || null, availability: av };
}
function metaProduct(html) {
  const meta = (prop) => new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i").exec(html)?.[1] ?? new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i").exec(html)?.[1];
  const type = meta("og:type"), price = meta("product:price:amount") ?? meta("og:price:amount");
  if (!price || type && !/product/i.test(type)) return null;
  return { "@type": "Product", name: meta("og:title") ?? "", brand: meta("product:brand") ?? void 0, offers: { price, priceCurrency: meta("product:price:currency") ?? meta("og:price:currency") ?? "EUR", availability: meta("product:availability") ?? void 0 } };
}

// workers/ia/src/recherche.ts
var PROMPT = (q, label, pays) => [
  `Use Google Search now (at most 2 searches) to find up to 8 different products currently for sale online that closely match this item seen in an interior design image: "${label}". Shopping query (French): "${q}".`,
  `Prefer online shops that deliver to ${pays === "FR" ? "France" : "Europe"} (marketplaces, furniture and decor retailers, DIY stores, design brands), with a range of prices from affordable to premium.`,
  "Only list direct product pages (one product per page), never category pages, blogs or search pages. Never invent a URL: only pages you found with the search.",
  'Finish your answer with a JSON block: {"products":[{"title":"","url":"","merchant":""}]}.'
].join("\n");
var host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
var clean2 = (s, n2) => typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, n2) : "";
function slugTitle(u) {
  try {
    const seg = new URL(u).pathname.split("/").filter(Boolean).map((x) => decodeURIComponent(x).replace(/\.(html?|php|aspx)$/i, "")).filter((x) => /[a-z]{3,}-[a-z]{3,}/i.test(x)).pop();
    if (!seg) return "";
    const t = seg.replace(/[-_]+/g, " ").split(" ").filter((w) => !/^(prod|produit|product|p|ref\w*|sku)$/i.test(w) && !/^(ref|sku|prod)?[a-z]?\d{5,}$/i.test(w)).join(" ").trim();
    return t.length > 6 ? t.charAt(0).toUpperCase() + t.slice(1, 120) : "";
  } catch {
    return "";
  }
}
async function resolve(u) {
  if (!/grounding-api-redirect/.test(u)) return u;
  try {
    const r = await fetch(u, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(5e3) });
    return r.headers.get("location") || u;
  } catch {
    return u;
  }
}
async function inspect(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; PieceReveeBot/1.0; +https://odd-bar-c583.ewanesteves26.workers.dev)", accept: "text/html", "accept-language": "fr-FR,fr;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(7e3) });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) return null;
    const html = (await r.text()).slice(0, 15e5);
    return parseProduct(html);
  } catch {
    return null;
  }
}
async function rechercher(env, q, label, pays = "FR") {
  if (!env.GEMINI_API_KEY) throw new ProviderError("La recherche sur internet n'est pas configur\xE9e (cl\xE9 manquante).", false);
  const model = env.GEMINI_SEARCH_MODEL || env.GEMINI_TEXT_MODEL || TEXT_MODEL;
  const r = await fetchRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: PROMPT(q, label, pays) }] }], tools: [{ google_search: {} }] })
  });
  if (!r.ok) throw new ProviderError("La recherche sur internet a \xE9chou\xE9.", r.status >= 500 || r.status === 429, `HTTP ${r.status}`);
  const j = await r.json();
  const c = j.candidates?.[0];
  const meta = c?.groundingMetadata;
  const txt = c?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  let listed = [];
  try {
    listed = JSON.parse(txt.slice(txt.indexOf('{"products"'), txt.lastIndexOf("}") + 1)).products ?? [];
  } catch {
  }
  for (const m of txt.matchAll(/\[([^\]]{3,160})\]\((https:\/\/[^\s)]+)\)/g)) listed.push({ title: m[1], url: m[2], merchant: "" });
  for (const m of txt.matchAll(/https:\/\/[^\s)"'<>\]]+/g)) if (!listed.some((p) => p.url === m[0])) listed.push({ title: "", url: m[0], merchant: "" });
  const chunks = (meta?.groundingChunks ?? []).map((g) => g.web).filter((w) => typeof w?.uri === "string");
  const isRedirect = (u) => /grounding-api-redirect/.test(u);
  const viaModel = listed.map((p) => ({ url: clean2(p.url, 1200), title: clean2(p.title, 160), merchant: clean2(p.merchant, 60) })).filter((p) => /^https?:\/\//.test(p.url));
  const toResolve = [...viaModel.filter((p) => isRedirect(p.url)), ...chunks.map((w) => ({ url: w.uri, title: "", merchant: "" }))].slice(0, 14);
  const resolved = await Promise.all(toResolve.map(async (p) => ({ ...p, url: await resolve(p.url) })));
  const domains = new Set([...resolved.map((w) => host(w.url)), ...chunks.map((w) => (w.title ?? "").replace(/^www\./, ""))].filter(Boolean));
  const direct = viaModel.filter((p) => !isRedirect(p.url) && domains.has(host(p.url)));
  const isPage = (u) => {
    try {
      const x = new URL(u);
      return x.protocol === "https:" && x.pathname.length > 1 && !/\.(jpe?g|png|webp|gif|avif|svg|pdf)$/i.test(x.pathname) && !/\/(cdn|wp-content\/uploads|media\/catalog)\//i.test(x.pathname);
    } catch {
      return false;
    }
  };
  const key = (u) => u.split("#")[0].split("?")[0];
  const named = new Map([...resolved, ...direct].filter((p) => p.title).map((p) => [key(p.url), p]));
  const candidates = [...resolved, ...direct].filter((p) => !isRedirect(p.url) && isPage(p.url)).map((p) => ({ ...p, title: p.title || named.get(key(p.url))?.title || "", merchant: p.merchant || named.get(key(p.url))?.merchant || "" }));
  const seen = /* @__PURE__ */ new Set(), unique = candidates.filter((p) => {
    const k = p.url.split("#")[0].split("?")[0];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 10);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const produits = (await Promise.all(unique.map(async (p) => {
    const d = await inspect(p.url);
    const title = d?.name || p.title || slugTitle(p.url);
    if (!title) return null;
    return {
      title,
      url: p.url,
      merchant: p.merchant || host(p.url),
      price: d?.price ?? null,
      currency: d?.price ? d.currency ?? "EUR" : null,
      availability: d?.availability ?? null,
      brand: d?.brand ?? null,
      checkedAt: d ? now : null,
      source: d ? "page" : "recherche"
    };
  }))).filter((x) => x !== null && x.title.length > 2);
  produits.sort((a, b) => a.source === b.source ? (a.price ?? 1e9) - (b.price ?? 1e9) : a.source === "page" ? -1 : 1);
  const etapes = { listes: listed.length, sources: chunks.length, redirections: resolved.filter((p) => !isRedirect(p.url)).length, candidats: unique.length, pagesLues: produits.filter((p) => p.source === "page").length, exemples: unique.slice(0, 3).map((p) => host(p.url)) };
  return { produits: produits.slice(0, 8), suggestions: meta?.searchEntryPoint?.renderedContent ?? null, requetes: (meta?.webSearchQueries ?? []).slice(0, 5), etapes };
}

// workers/ia/src/jobs.ts
var DAY = 86400;
var today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var month = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
async function sha(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var saveJob = (env, j) => env.QUOTA.put(`job:${j.id}`, JSON.stringify(j), { expirationTtl: 90 * DAY });
async function loadJob(env, id) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const s = await env.QUOTA.get(`job:${id}`);
  return s ? JSON.parse(s) : null;
}
var saveInput = (env, id, input) => env.QUOTA.put(`in:${id}`, JSON.stringify(input), { expirationTtl: 2 * DAY });
async function loadInput(env, id) {
  const s = await env.QUOTA.get(`in:${id}`);
  return s ? JSON.parse(s) : null;
}
async function storeImage(env, key, bytes, mime) {
  if (env.IMAGES) await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: mime } });
  else await env.QUOTA.put(`img:${key}`, bytes, { expirationTtl: 30 * DAY, metadata: { mime } });
}
async function readImage(env, key, mime) {
  if (env.IMAGES) {
    const o = await env.IMAGES.get(key);
    if (o) return { body: await o.arrayBuffer(), mime: o.httpMetadata?.contentType ?? mime };
  }
  const b = await env.QUOTA.get(`img:${key}`, "arrayBuffer");
  return b ? { body: b, mime } : null;
}
var n = async (env, k) => Number(await env.QUOTA.get(k)) || 0;
var add = (env, k, v, ttl) => n(env, k).then((cur) => env.QUOTA.put(k, String(Math.round((cur + v) * 1e4) / 1e4), { expirationTtl: ttl }));
async function usage(env, visitor, ip) {
  const L = limits(env), d = today(), m = month();
  const [dayImg, ipImg, vImg, mUsd, vUsd, ipUsd] = await Promise.all([n(env, `total:${d}`), n(env, `ip:${d}:${ip}`), n(env, `v:${d}:${visitor}`), n(env, `usd:${m}`), n(env, `usd:${m}:v:${visitor}`), n(env, `usd:${m}:ip:${ip}`)]);
  return { day: { images: dayImg, max: L.dayImages }, visitorDay: { images: Math.max(ipImg, vImg), max: L.visitorDayImages }, month: { usd: mUsd, max: L.monthUsd }, visitorMonth: { usd: Math.max(vUsd, ipUsd), max: L.visitorMonthUsd } };
}
function overLimit(u, estimate2) {
  if (u.day.images >= u.day.max) return "Le nombre d'images du jour est atteint. Revenez demain.";
  if (u.visitorDay.images >= u.visitorDay.max) return `Vous avez utilis\xE9 vos ${u.visitorDay.max} images du jour. Revenez demain.`;
  if (u.month.usd + estimate2 > u.month.max) return "Le budget d'images du mois est atteint.";
  if (u.visitorMonth.usd + estimate2 > u.visitorMonth.max) return "Vous avez atteint votre budget d'images du mois.";
  return null;
}
var estimate = (provider, quality) => PRICE_ESTIMATE[provider]?.[quality] ?? 0.2;
async function reserve(env, visitor, ip, usd) {
  const d = today(), m = month();
  await Promise.all([add(env, `total:${d}`, 1, 2 * DAY), add(env, `ip:${d}:${ip}`, 1, 2 * DAY), add(env, `v:${d}:${visitor}`, 1, 2 * DAY), add(env, `usd:${m}`, usd, 62 * DAY), add(env, `usd:${m}:v:${visitor}`, usd, 62 * DAY), add(env, `usd:${m}:ip:${ip}`, usd, 62 * DAY)]);
}
async function settle(env, visitor, ip, delta) {
  if (!delta) return;
  const m = month();
  await Promise.all([add(env, `usd:${m}`, delta, 62 * DAY), add(env, `usd:${m}:v:${visitor}`, delta, 62 * DAY), add(env, `usd:${m}:ip:${ip}`, delta, 62 * DAY)]);
}

// workers/ia/src/index.ts
var toImg = (s) => {
  const m = /^data:(image\/\w+);base64,(.+)$/.exec(s);
  return { mime: m[1], b64: m[2] };
};
var pub = (j, base) => ({ ...j, ref: void 0, visitor: void 0, ipHash: void 0, error: j.error ? { message: j.error.message, retryable: j.error.retryable } : void 0, imageUrl: j.image ? `${base}/v2/images/${j.id}` : null });
async function run(env, job, input) {
  const provider = PROVIDERS.find((p) => p.id === job.provider);
  const req = { mode: job.mode, prompt: input.prompt, photo: input.photo, references: input.references, mask: input.mask, width: job.width, height: job.height, quality: job.quality, visitor: job.visitor };
  job.attempts += 1;
  job.status = "en_cours";
  job.error = void 0;
  job.ref = void 0;
  job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const r = await provider.submit(req, env);
    if (r.state === "pending") job.ref = r.ref;
    else await finish(env, job, r.image, r.mime, r.costUsd);
  } catch (e) {
    const pe = e instanceof ProviderError ? e : new ProviderError("Erreur inattendue pendant la g\xE9n\xE9ration.", true, String(e));
    job.status = "erreur";
    job.error = { message: pe.message, retryable: pe.retryable, detail: pe.detail };
  }
  job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await saveJob(env, job);
  return job;
}
async function finish(env, job, image, mime, costUsd) {
  await storeImage(env, job.id, image, mime);
  job.image = { key: job.id, mime, bytes: image.byteLength };
  job.status = "terminee";
  if (costUsd !== void 0) {
    await settle(env, job.visitor, job.ipHash, costUsd - job.costUsd);
    job.costUsd = Math.round(costUsd * 1e4) / 1e4;
  }
}
var index_default = {
  async fetch(request, env, _ctx) {
    const origin = request.headers.get("Origin") || "";
    const allowed = isAllowedOrigin(origin);
    const cors = { "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0], "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" };
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url), path = url.pathname, base = url.origin;
    if (request.method === "GET" && path === "/") {
      return json({ ok: true, service: "Pi\xE8ce R\xEAv\xE9e \xB7 images IA", fournisseurs: PROVIDERS.filter((p) => p.configured(env)).map((p) => p.id), defaut: chooseProvider(env)?.id ?? null, compteur: Boolean(env.QUOTA), stockage: env.IMAGES ? "R2" : "KV", cle: Boolean(env.GEMINI_API_KEY) });
    }
    const img = /^\/v2\/images\/([0-9a-f-]{36})$/.exec(path);
    if (request.method === "GET" && img) {
      const job = env.QUOTA ? await loadJob(env, img[1]) : null;
      const file = job?.image ? await readImage(env, job.image.key, job.image.mime) : null;
      return file ? new Response(file.body, { headers: { ...cors, "Content-Type": file.mime, "Cache-Control": "public, max-age=31536000, immutable" } }) : json({ erreur: "Image introuvable." }, 404);
    }
    if (!allowed) return json({ erreur: "Ce service n'accepte que les demandes du site Pi\xE8ce R\xEAv\xE9e." }, 403);
    if (!env.QUOTA) return json({ erreur: "Le service n'est pas encore configur\xE9 (compteur manquant)." }, 503);
    const ip = request.headers.get("CF-Connecting-IP") || "inconnu", ipHash = await sha(`ip|${ip}`);
    if (request.method === "GET" && path === "/v2/usage") {
      const v = url.searchParams.get("visiteur") ?? "";
      if (!/^[a-z0-9-]{8,64}$/.test(v)) return json({ erreur: "Visiteur inconnu." }, 400);
      return json({ ...await usage(env, await sha(`v|${v}`), ipHash), fournisseurs: PROVIDERS.filter((p) => p.configured(env)).map((p) => p.id) });
    }
    if (request.method === "POST" && path === "/v2/jobs") {
      if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY) return json({ erreur: "Images trop lourdes." }, 413);
      const b = parseJobBody(await request.json().catch(() => null));
      if (!b) return json({ erreur: "Demande incompl\xE8te : d\xE9crivez le projet (et ajoutez la photo pour une transformation)." }, 400);
      const provider = chooseProvider(env, b.fournisseur);
      if (!provider) return json({ erreur: "Aucun fournisseur d'images n'est configur\xE9 (cl\xE9 manquante)." }, 503);
      const visitor = await sha(`v|${b.visiteur}`), cost = estimate(provider.id, b.quality);
      const refusal = overLimit(await usage(env, visitor, ipHash), cost);
      if (refusal) return json({ erreur: refusal }, 429);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const job = { id: crypto.randomUUID(), status: "en_attente", mode: b.mode, provider: provider.id, model: provider.model(env, b.mode), quality: b.quality, brief: b.brief, keep: b.keep, width: b.width, height: b.height, createdAt: now, updatedAt: now, attempts: 0, costUsd: cost, visitor, ipHash };
      const input = { prompt: buildPrompt({ mode: b.mode, brief: b.brief, keep: b.keep, keepFree: b.keepFree, references: b.references.length, inspirations: b.inspirations, materials: b.materials, products: b.products, onlyZone: b.onlyZone }), photo: b.photo ? toImg(b.photo) : void 0, references: b.references.map(toImg), mask: b.mask ? toImg(b.mask) : void 0 };
      await Promise.all([saveInput(env, job.id, input), reserve(env, visitor, ipHash, cost)]);
      return json(pub(await run(env, job, input), base), 201);
    }
    if (request.method === "POST" && path === "/v2/analyse") {
      const b = await request.json().catch(() => null);
      if (!b || !isDataUrl(b.image) || typeof b.visiteur !== "string" || !/^[a-z0-9-]{8,64}$/.test(b.visiteur)) return json({ erreur: "Image manquante." }, 400);
      const visitor = await sha(`v|${b.visiteur}`), cost = 0.01;
      const refusal = overLimit(await usage(env, visitor, ipHash), cost);
      if (refusal) return json({ erreur: refusal }, 429);
      try {
        const r = await analyse(env, toImg(b.image));
        await settle(env, visitor, ipHash, cost);
        return json(r);
      } catch (e) {
        return json({ erreur: e instanceof ProviderError ? e.message : "Analyse impossible." }, e instanceof ProviderError && !e.retryable ? 503 : 502);
      }
    }
    if (request.method === "POST" && path === "/v2/moodboard") {
      if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY) return json({ erreur: "Images trop lourdes." }, 413);
      const b = await request.json().catch(() => null);
      const imgs = Array.isArray(b?.inspirations) ? b.inspirations.slice(0, 6) : [];
      if (!b || !imgs.length || !imgs.every(isDataUrl) || typeof b.visiteur !== "string" || !/^[a-z0-9-]{8,64}$/.test(b.visiteur)) return json({ erreur: "Ajoutez au moins une image d'inspiration." }, 400);
      const catalog = (Array.isArray(b.matieres) ? b.matieres : []).filter((m2) => !!m2 && typeof m2.id === "string" && typeof m2.name === "string").slice(0, 80).map((m2) => ({ id: m2.id.slice(0, 40), name: m2.name.slice(0, 60) }));
      const visitor = await sha(`v|${b.visiteur}`), cost = 0.01;
      const refusal = overLimit(await usage(env, visitor, ipHash), cost);
      if (refusal) return json({ erreur: refusal }, 429);
      try {
        const r = await moodboard(env, imgs.map(toImg), catalog);
        await settle(env, visitor, ipHash, cost);
        return json(r);
      } catch (e) {
        return json({ erreur: e instanceof ProviderError ? e.message : "Moodboard impossible." }, e instanceof ProviderError && !e.retryable ? 503 : 502);
      }
    }
    if (request.method === "POST" && path === "/v2/recherche") {
      const b = await request.json().catch(() => null);
      const q = typeof b?.query === "string" ? b.query.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 160) : "";
      if (!b || q.length < 3 || typeof b.visiteur !== "string" || !/^[a-z0-9-]{8,64}$/.test(b.visiteur)) return json({ erreur: "Recherche incompl\xE8te." }, 400);
      const label = typeof b.label === "string" ? b.label.trim().slice(0, 100) : q;
      const visitor = await sha(`v|${b.visiteur}`), cost = 0.03;
      const refusal = overLimit(await usage(env, visitor, ipHash), cost);
      if (refusal) return json({ erreur: refusal }, 429);
      try {
        const r = await rechercher(env, q, label, b.pays === "EU" ? "EU" : "FR");
        await settle(env, visitor, ipHash, cost);
        return json(r);
      } catch (e) {
        return json({ erreur: e instanceof ProviderError ? e.message : "Recherche impossible." }, e instanceof ProviderError && !e.retryable ? 503 : 502);
      }
    }
    const m = /^\/v2\/jobs\/([0-9a-f-]{36})(\/retry)?$/.exec(path);
    if (m) {
      const job = await loadJob(env, m[1]);
      if (!job) return json({ erreur: "T\xE2che introuvable." }, 404);
      if (request.method === "GET" && !m[2]) {
        const provider = PROVIDERS.find((p) => p.id === job.provider);
        if (job.status === "en_cours" && job.ref && provider?.poll) {
          const r = await provider.poll(job.ref, env).catch((e) => ({ state: "error", message: e instanceof ProviderError ? e.message : "Suivi impossible.", retryable: true }));
          if (r.state === "done") await finish(env, job, r.image, r.mime, r.costUsd);
          else if (r.state === "error") {
            job.status = "erreur";
            job.error = { message: r.message, retryable: r.retryable };
          } else if (Date.now() - Date.parse(job.updatedAt) > 10 * 6e4) {
            job.status = "erreur";
            job.error = { message: "La g\xE9n\xE9ration a pris trop de temps.", retryable: true };
          }
          if (r.state !== "pending" || job.status === "erreur") {
            job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
            await saveJob(env, job);
          }
        }
        return json(pub(job, base));
      }
      if (request.method === "POST" && m[2]) {
        if (job.status !== "erreur") return json({ erreur: "Seule une t\xE2che en erreur peut \xEAtre relanc\xE9e." }, 409);
        if (job.attempts >= 3) return json({ erreur: "Trois tentatives d\xE9j\xE0 faites : modifiez la demande." }, 409);
        const input = await loadInput(env, job.id);
        if (!input) return json({ erreur: "Les donn\xE9es de d\xE9part ont expir\xE9 : relancez une nouvelle demande." }, 410);
        const cost = estimate(job.provider, job.quality);
        const refusal = overLimit(await usage(env, job.visitor, ipHash), cost);
        if (refusal) return json({ erreur: refusal }, 429);
        await reserve(env, job.visitor, ipHash, cost);
        job.costUsd += cost;
        return json(pub(await run(env, job, input), base));
      }
    }
    if (request.method === "POST" && ["/redesign", "/concept", "/photo"].includes(path)) return legacy(request, env, path, ip, json);
    return json({ erreur: "Adresse inconnue." }, 404);
  }
};
var ASPECTS = ["1:1", "4:3", "3:4", "3:2", "2:3", "16:9", "9:16", "4:5", "5:4"];
var LEGACY_DAY = 30;
var LEGACY_VISITOR = 6;
async function legacy(request, env, path, ip, json) {
  if (!env.GEMINI_API_KEY) return json({ erreur: "Le service n'est pas encore configur\xE9 (cl\xE9 manquante)." }, 503);
  if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY) return json({ erreur: "Images trop lourdes." }, 413);
  const day = today(), totalKey = `total:${day}`, ipKey = `ip:${day}:${ip}`;
  const total = Number(await env.QUOTA.get(totalKey)) || 0, mine = Number(await env.QUOTA.get(ipKey)) || 0;
  if (total >= LEGACY_DAY) return json({ erreur: "Le nombre d'images du jour est atteint. Revenez demain." }, 429);
  if (mine >= LEGACY_VISITOR) return json({ erreur: `Vous avez utilis\xE9 vos ${LEGACY_VISITOR} images du jour. Revenez demain.` }, 429);
  const body = await request.json().catch(() => null);
  if (!body) return json({ erreur: "Demande illisible." }, 400);
  const clean3 = (s, max) => typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
  const image = (s) => isDataUrl(s) ? toImg(s) : null;
  const brief = clean3(body.brief, 1200) || (path === "/photo" ? "Planche de mati\xE8res." : "");
  if (!brief) return json({ erreur: "D\xE9crivez le projet." }, 400);
  const aspect = ASPECTS.includes(String(body.aspect)) ? String(body.aspect) : "4:3";
  const [aw, ah] = aspect.split(":").map(Number);
  let photo, references = [], prompt;
  if (path === "/redesign") {
    photo = image(body.photo) ?? void 0;
    if (!photo) return json({ erreur: "Ajoutez une photo de la pi\xE8ce (JPEG ou PNG)." }, 400);
    references = Array.isArray(body.inspirations) ? body.inspirations.slice(0, 3).map(image).filter(Boolean) : [];
    prompt = buildPrompt({ mode: "transform", brief, keep: ["fenetres", "portes", "murs", "plafond"], references: references.length });
  } else if (path === "/photo") {
    photo = image(body.image) ?? void 0;
    if (!photo) return json({ erreur: "Image de la planche manquante." }, 400);
    prompt = [
      "This image is a 3D render of an interior designer's flat-lay material board (or a single material sample).",
      "Turn it into a photorealistic studio photograph of the very same physical samples.",
      "Keep EXACTLY the same layout, positions, overlaps, shapes, sizes, colours and camera angle. Do not add, remove or move any object.",
      "Give every sample its real-world material detail at macro level: wood grain and pores, stone veining and polish, fabric weave and pinked edges, brushed or knurled metal with soft reflections, glossy wet paint, paper fibres, ceramic glaze.",
      "Soft natural window daylight from the upper right, long gentle shadows, white textured paper background, high-end editorial look, no text, no watermark.",
      `Details (written in French): ${brief}`
    ].join("\n");
  } else prompt = buildPrompt({ mode: "generate", brief });
  await env.QUOTA.put(totalKey, String(total + 1), { expirationTtl: 172800 });
  await env.QUOTA.put(ipKey, String(mine + 1), { expirationTtl: 172800 });
  try {
    const r = await gemini.submit({ mode: path === "/concept" ? "generate" : "transform", prompt, photo, references, width: aw * 400, height: ah * 400, quality: "standard", visitor: ip }, env);
    if (r.state !== "done") throw new ProviderError("Aucune image n'a \xE9t\xE9 produite.", true);
    let bin = "";
    for (let i = 0; i < r.image.length; i += 32768) bin += String.fromCharCode(...r.image.subarray(i, i + 32768));
    return json({ image: `data:${r.mime};base64,${btoa(bin)}`, restant: Math.max(0, LEGACY_VISITOR - mine - 1) });
  } catch (e) {
    return json({ erreur: e instanceof ProviderError ? e.message : "Le service d'images ne r\xE9pond pas. R\xE9essayez dans un instant." }, 502);
  }
}
export {
  index_default as default
};
