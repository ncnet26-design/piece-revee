/**
 * Pièce Rêvée · service d'images IA (Cloudflare Worker « piece-revee-ia »).
 *
 * À coller tel quel dans l'éditeur du worker (Edit code), puis Deploy.
 * Réglages nécessaires dans Cloudflare (Settings → Variables and Secrets / Bindings) :
 *   - Secret      GEMINI_API_KEY : la clé Google AI Studio (jamais dans le site, jamais dans le code)
 *   - Liaison KV  QUOTA          : un espace KV (sert à compter les images et à plafonner la dépense)
 *
 * Routes :
 *   GET  /            → état du service (ne coûte rien)
 *   POST /redesign    → { photo, inspirations?, brief, aspect? } : la pièce de la photo, réaménagée
 *   POST /concept     → { brief, aspect? }                         : une image d'ambiance à partir d'un texte
 * Réponse : { image: "data:image/jpeg;base64,…", restant: n }
 */

// ——— Réglages ———
const MODEL = "gemini-nano-banana-2.1";               // modèle d'images Google recommandé (≈ 0,034 $ l'image 1K)
const API = "https://generativelanguage.googleapis.com/v1beta/interactions";
const DAILY_TOTAL = 30;                               // images par jour, tous visiteurs confondus
const DAILY_PER_VISITOR = 6;                          // images par jour et par adresse IP
const MAX_BODY = 9 * 1024 * 1024;                     // 9 Mo par requête
const ALLOWED_ORIGINS = [
  "https://odd-bar-c583.ewanesteves26.workers.dev",
  "http://localhost:3000",
  "http://localhost:4173",
];
const ASPECTS = ["1:1", "4:3", "3:4", "3:2", "2:3", "16:9", "9:16", "4:5", "5:4"];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin) || (/^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin) && origin.includes("piece-revee"));
    const cors = {
      "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      const day = today();
      const used = env.QUOTA ? Number(await env.QUOTA.get(`total:${day}`)) || 0 : null;
      return json({ ok: true, service: "Pièce Rêvée · images IA", cle: Boolean(env.GEMINI_API_KEY), compteur: Boolean(env.QUOTA), utilisees_aujourdhui: used, plafond_jour: DAILY_TOTAL });
    }
    if (request.method !== "POST" || !["/redesign", "/concept"].includes(url.pathname)) return json({ erreur: "Adresse inconnue." }, 404);
    if (!allowed) return json({ erreur: "Ce service n'accepte que les demandes du site Pièce Rêvée." }, 403);
    if (!env.GEMINI_API_KEY) return json({ erreur: "Le service n'est pas encore configuré (clé manquante)." }, 503);
    if (!env.QUOTA) return json({ erreur: "Le service n'est pas encore configuré (compteur manquant)." }, 503);
    if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY) return json({ erreur: "Images trop lourdes." }, 413);

    // ——— Plafonds de dépense ———
    const day = today(), ip = request.headers.get("CF-Connecting-IP") || "inconnu";
    const totalKey = `total:${day}`, ipKey = `ip:${day}:${ip}`;
    const total = Number(await env.QUOTA.get(totalKey)) || 0, mine = Number(await env.QUOTA.get(ipKey)) || 0;
    if (total >= DAILY_TOTAL) return json({ erreur: "Le nombre d'images du jour est atteint. Revenez demain." }, 429);
    if (mine >= DAILY_PER_VISITOR) return json({ erreur: `Vous avez utilisé vos ${DAILY_PER_VISITOR} images du jour. Revenez demain.` }, 429);

    let body;
    try { body = await request.json(); } catch { return json({ erreur: "Demande illisible." }, 400); }
    const brief = clean(body.brief, 1200);
    if (!brief) return json({ erreur: "Décrivez le projet." }, 400);
    const aspect = ASPECTS.includes(body.aspect) ? body.aspect : "4:3";

    const input = [];
    if (url.pathname === "/redesign") {
      const photo = image(body.photo);
      if (!photo) return json({ erreur: "Ajoutez une photo de la pièce (JPEG ou PNG)." }, 400);
      input.push({ type: "text", text: redesignPrompt(brief) });
      input.push({ type: "text", text: "Image 1: the client's room. Keep its architecture, camera position, perspective, windows, doors and ceiling height exactly." });
      input.push(photo);
      const insp = Array.isArray(body.inspirations) ? body.inspirations.slice(0, 3).map(image).filter(Boolean) : [];
      insp.forEach((im, i) => { input.push({ type: "text", text: `Inspiration ${i + 1}: use only for mood, palette and materials. Do not copy its room.` }); input.push(im); });
    } else {
      input.push({ type: "text", text: conceptPrompt(brief) });
    }

    // Le compteur avance avant l'appel : une erreur côté Google compte aussi, par prudence.
    await env.QUOTA.put(totalKey, String(total + 1), { expirationTtl: 172800 });
    await env.QUOTA.put(ipKey, String(mine + 1), { expirationTtl: 172800 });

    let res;
    try {
      res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          model: MODEL,
          input,
          response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: aspect, image_size: "1K" },
          generation_config: { thinking_level: "minimal" },
          store: false,
        }),
      });
    } catch {
      return json({ erreur: "Le service d'images ne répond pas. Réessayez dans un instant." }, 502);
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      const detail = data && data.error && data.error.message ? String(data.error.message).slice(0, 200) : `code ${res.status}`;
      return json({ erreur: "Le service d'images a refusé la demande.", detail }, 502);
    }
    for (const step of data.steps || []) {
      if (step.type !== "model_output") continue;
      for (const block of step.content || []) {
        if (block.type === "image" && block.data) {
          return json({ image: `data:${block.mime_type || "image/jpeg"};base64,${block.data}`, restant: Math.max(0, DAILY_PER_VISITOR - mine - 1) });
        }
      }
    }
    return json({ erreur: "Aucune image n'a été produite. Reformulez la demande ou changez de photo." }, 502);
  },
};

function today() { return new Date().toISOString().slice(0, 10); }
function clean(s, max) { return typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : ""; }
function image(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m || m[2].length > 6_000_000) return null;
  return { type: "image", mime_type: m[1], data: m[2] };
}
function redesignPrompt(brief) {
  return [
    "You are an award-winning interior designer and architectural photographer.",
    "Redesign the client's room shown in Image 1 according to this brief (written in French):",
    brief,
    "Requirements: keep the exact same room geometry, camera angle, lens, windows and doors.",
    "Replace finishes, colours, furniture, textiles, lighting and decor to match the brief.",
    "Output a single photorealistic interior photograph: natural daylight, soft shadows, true-to-life materials",
    "(wood grain, stone veining, fabric weave), editorial magazine quality, no text, no watermark, no people.",
  ].join("\n");
}
function conceptPrompt(brief) {
  return [
    "Create a single photorealistic interior photograph for a high-end design magazine.",
    "Brief (written in French):",
    brief,
    "Natural daylight, believable proportions, true-to-life materials (wood grain, stone veining, fabric weave),",
    "calm editorial composition, no text, no watermark, no people.",
  ].join("\n");
}
