/**
 * Pièce Rêvée · service d'images IA (Cloudflare Worker « piece-revee-ia »).
 *
 * Routes v2 (tâches) :
 *   POST /v2/jobs                 { mode, brief, photo?, references?, inspirations?, keep?, keepFree?, materials?, products?, quality?, width?, height?, visiteur, fournisseur? }
 *   POST /v2/moodboard            { inspirations: dataURL[], matieres: {id,name}[], visiteur } → style, palette, matières, objets, consigne
 *   POST /v2/analyse              { image, visiteur } → objets et surfaces avec leur zone
 *   POST /v2/recherche            { query, label, visiteur } → produits en vente trouvés sur internet (prix relevés sur les pages)
 *   GET  /v2/jobs/:id             état de la tâche (interroge le fournisseur si besoin)
 *   POST /v2/jobs/:id/retry       nouvelle tentative avec les mêmes données
 *   GET  /v2/images/:id           l'image produite
 *   GET  /v2/usage?visiteur=…     consommation du jour et du mois
 * Routes historiques (inchangées pour le site actuel) : POST /redesign, /concept, /photo.
 */
import { isAllowedOrigin, ALLOWED_ORIGINS, MAX_BODY, type Ctx, type Env } from "./config";
import { buildPrompt } from "./prompts";
import { isDataUrl, parseJobBody } from "./validate";
import { chooseProvider, gemini, PROVIDERS, ProviderError, type ImgIn, type ProviderRequest } from "./providers";
import { analyse, moodboard } from "./analyse";
import { rechercher } from "./recherche";
import { estimate, loadInput, loadJob, overLimit, readImage, reserve, saveInput, saveJob, settle, sha, storeImage, today, usage, type Job, type JobInput } from "./jobs";

const toImg = (s: string): ImgIn => { const m = /^data:(image\/\w+);base64,(.+)$/.exec(s)!; return { mime: m[1]!, b64: m[2]! }; };
const pub = (j: Job, base: string) => ({ ...j, ref: undefined, visitor: undefined, ipHash: undefined, error: j.error ? { message: j.error.message, retryable: j.error.retryable } : undefined, imageUrl: j.image ? `${base}/v2/images/${j.id}` : null });

/** Lance (ou relance) l'appel au fournisseur et met la fiche à jour. */
async function run(env: Env, job: Job, input: JobInput): Promise<Job> {
  const provider = PROVIDERS.find((p) => p.id === job.provider)!;
  const req: ProviderRequest = { mode: job.mode, prompt: input.prompt, photo: input.photo, references: input.references, mask: input.mask, width: job.width, height: job.height, quality: job.quality, visitor: job.visitor };
  job.attempts += 1; job.status = "en_cours"; job.error = undefined; job.ref = undefined; job.updatedAt = new Date().toISOString();
  try {
    const r = await provider.submit(req, env);
    if (r.state === "pending") job.ref = r.ref;
    else await finish(env, job, r.image, r.mime, r.costUsd);
  } catch (e) {
    const pe = e instanceof ProviderError ? e : new ProviderError("Erreur inattendue pendant la génération.", true, String(e));
    job.status = "erreur"; job.error = { message: pe.message, retryable: pe.retryable, detail: pe.detail };
  }
  job.updatedAt = new Date().toISOString();
  await saveJob(env, job);
  return job;
}
async function finish(env: Env, job: Job, image: Uint8Array, mime: string, costUsd?: number) {
  await storeImage(env, job.id, image, mime);
  job.image = { key: job.id, mime, bytes: image.byteLength }; job.status = "terminee";
  if (costUsd !== undefined) { await settle(env, job.visitor, job.ipHash, costUsd - job.costUsd); job.costUsd = Math.round(costUsd * 10000) / 10000; }
}

export default {
  async fetch(request: Request, env: Env, _ctx: Ctx): Promise<Response> {
    const origin = request.headers.get("Origin") || "";
    const allowed = isAllowedOrigin(origin);
    const cors = { "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0]!, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" };
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url), path = url.pathname, base = url.origin;

    if (request.method === "GET" && path === "/") {
      return json({ ok: true, service: "Pièce Rêvée · images IA", fournisseurs: PROVIDERS.filter((p) => p.configured(env)).map((p) => p.id), defaut: chooseProvider(env)?.id ?? null, compteur: Boolean(env.QUOTA), stockage: env.IMAGES ? "R2" : "KV", cle: Boolean(env.GEMINI_API_KEY) });
    }
    // Les images sont publiques (adresse non devinable) : affichage direct dans <img>.
    const img = /^\/v2\/images\/([0-9a-f-]{36})$/.exec(path);
    if (request.method === "GET" && img) {
      const job = env.QUOTA ? await loadJob(env, img[1]!) : null;
      const file = job?.image ? await readImage(env, job.image.key, job.image.mime) : null;
      return file ? new Response(file.body, { headers: { ...cors, "Content-Type": file.mime, "Cache-Control": "public, max-age=31536000, immutable" } }) : json({ erreur: "Image introuvable." }, 404);
    }
    if (!allowed) return json({ erreur: "Ce service n'accepte que les demandes du site Pièce Rêvée." }, 403);
    if (!env.QUOTA) return json({ erreur: "Le service n'est pas encore configuré (compteur manquant)." }, 503);
    const ip = request.headers.get("CF-Connecting-IP") || "inconnu", ipHash = await sha(`ip|${ip}`);

    if (request.method === "GET" && path === "/v2/usage") {
      const v = url.searchParams.get("visiteur") ?? "";
      if (!/^[a-z0-9-]{8,64}$/.test(v)) return json({ erreur: "Visiteur inconnu." }, 400);
      return json({ ...(await usage(env, await sha(`v|${v}`), ipHash)), fournisseurs: PROVIDERS.filter((p) => p.configured(env)).map((p) => p.id) });
    }

    if (request.method === "POST" && path === "/v2/jobs") {
      if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY) return json({ erreur: "Images trop lourdes." }, 413);
      const b = parseJobBody(await request.json().catch(() => null));
      if (!b) return json({ erreur: "Demande incomplète : décrivez le projet (et ajoutez la photo pour une transformation)." }, 400);
      const provider = chooseProvider(env, b.fournisseur);
      if (!provider) return json({ erreur: "Aucun fournisseur d'images n'est configuré (clé manquante)." }, 503);
      const visitor = await sha(`v|${b.visiteur}`), cost = estimate(provider.id, b.quality);
      const refusal = overLimit(await usage(env, visitor, ipHash), cost);
      if (refusal) return json({ erreur: refusal }, 429);
      const now = new Date().toISOString();
      const job: Job = { id: crypto.randomUUID(), status: "en_attente", mode: b.mode, provider: provider.id, model: provider.model(env, b.mode), quality: b.quality, brief: b.brief, keep: b.keep, width: b.width, height: b.height, createdAt: now, updatedAt: now, attempts: 0, costUsd: cost, visitor, ipHash };
      const input: JobInput = { prompt: buildPrompt({ mode: b.mode, brief: b.brief, keep: b.keep, keepFree: b.keepFree, references: b.references.length, inspirations: b.inspirations, materials: b.materials, products: b.products, onlyZone: b.onlyZone }), photo: b.photo ? toImg(b.photo) : undefined, references: b.references.map(toImg), mask: b.mask ? toImg(b.mask) : undefined };
      await Promise.all([saveInput(env, job.id, input), reserve(env, visitor, ipHash, cost)]);
      return json(pub(await run(env, job, input), base), 201);
    }

    if (request.method === "POST" && path === "/v2/analyse") {
      const b = await request.json().catch(() => null) as { image?: unknown; visiteur?: unknown } | null;
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
      const b = await request.json().catch(() => null) as { inspirations?: unknown; matieres?: unknown; visiteur?: unknown } | null;
      const imgs = Array.isArray(b?.inspirations) ? b.inspirations.slice(0, 6) : [];
      if (!b || !imgs.length || !imgs.every(isDataUrl) || typeof b.visiteur !== "string" || !/^[a-z0-9-]{8,64}$/.test(b.visiteur)) return json({ erreur: "Ajoutez au moins une image d'inspiration." }, 400);
      const catalog = (Array.isArray(b.matieres) ? b.matieres : []).filter((m): m is { id: string; name: string } => !!m && typeof (m as { id?: unknown }).id === "string" && typeof (m as { name?: unknown }).name === "string")
        .slice(0, 80).map((m) => ({ id: m.id.slice(0, 40), name: m.name.slice(0, 60) }));
      const visitor = await sha(`v|${b.visiteur}`), cost = 0.01;
      const refusal = overLimit(await usage(env, visitor, ipHash), cost);
      if (refusal) return json({ erreur: refusal }, 429);
      try {
        const r = await moodboard(env, (imgs as string[]).map(toImg), catalog);
        await settle(env, visitor, ipHash, cost);
        return json(r);
      } catch (e) {
        return json({ erreur: e instanceof ProviderError ? e.message : "Moodboard impossible." }, e instanceof ProviderError && !e.retryable ? 503 : 502);
      }
    }

    if (request.method === "POST" && path === "/v2/recherche") {
      const b = await request.json().catch(() => null) as { query?: unknown; label?: unknown; visiteur?: unknown; pays?: unknown } | null;
      const q = typeof b?.query === "string" ? b.query.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 160) : "";
      if (!b || q.length < 3 || typeof b.visiteur !== "string" || !/^[a-z0-9-]{8,64}$/.test(b.visiteur)) return json({ erreur: "Recherche incomplète." }, 400);
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
      const job = await loadJob(env, m[1]!);
      if (!job) return json({ erreur: "Tâche introuvable." }, 404);
      if (request.method === "GET" && !m[2]) {
        const provider = PROVIDERS.find((p) => p.id === job.provider);
        if (job.status === "en_cours" && job.ref && provider?.poll) {
          const r = await provider.poll(job.ref, env).catch((e) => ({ state: "error" as const, message: e instanceof ProviderError ? e.message : "Suivi impossible.", retryable: true }));
          if (r.state === "done") await finish(env, job, r.image, r.mime, r.costUsd);
          else if (r.state === "error") { job.status = "erreur"; job.error = { message: r.message, retryable: r.retryable }; }
          else if (Date.now() - Date.parse(job.updatedAt) > 10 * 60_000) { job.status = "erreur"; job.error = { message: "La génération a pris trop de temps.", retryable: true }; }
          if (r.state !== "pending" || job.status === "erreur") { job.updatedAt = new Date().toISOString(); await saveJob(env, job); }
        }
        return json(pub(job, base));
      }
      if (request.method === "POST" && m[2]) {
        if (job.status !== "erreur") return json({ erreur: "Seule une tâche en erreur peut être relancée." }, 409);
        if (job.attempts >= 3) return json({ erreur: "Trois tentatives déjà faites : modifiez la demande." }, 409);
        const input = await loadInput(env, job.id);
        if (!input) return json({ erreur: "Les données de départ ont expiré : relancez une nouvelle demande." }, 410);
        const cost = estimate(job.provider, job.quality);
        const refusal = overLimit(await usage(env, job.visitor, ipHash), cost);
        if (refusal) return json({ erreur: refusal }, 429);
        await reserve(env, job.visitor, ipHash, cost); job.costUsd += cost;
        return json(pub(await run(env, job, input), base));
      }
    }

    if (request.method === "POST" && ["/redesign", "/concept", "/photo"].includes(path)) return legacy(request, env, path, ip, json);
    return json({ erreur: "Adresse inconnue." }, 404);
  },
};

/* ——— Routes historiques (Gemini, réponse en data URL) ——— */
const ASPECTS = ["1:1", "4:3", "3:4", "3:2", "2:3", "16:9", "9:16", "4:5", "5:4"];
const LEGACY_DAY = 30, LEGACY_VISITOR = 6;
async function legacy(request: Request, env: Env, path: string, ip: string, json: (b: unknown, s?: number) => Response): Promise<Response> {
  if (!env.GEMINI_API_KEY) return json({ erreur: "Le service n'est pas encore configuré (clé manquante)." }, 503);
  if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY) return json({ erreur: "Images trop lourdes." }, 413);
  const day = today(), totalKey = `total:${day}`, ipKey = `ip:${day}:${ip}`;
  const total = Number(await env.QUOTA!.get(totalKey)) || 0, mine = Number(await env.QUOTA!.get(ipKey)) || 0;
  if (total >= LEGACY_DAY) return json({ erreur: "Le nombre d'images du jour est atteint. Revenez demain." }, 429);
  if (mine >= LEGACY_VISITOR) return json({ erreur: `Vous avez utilisé vos ${LEGACY_VISITOR} images du jour. Revenez demain.` }, 429);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return json({ erreur: "Demande illisible." }, 400);
  const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "");
  const image = (s: unknown): ImgIn | null => (isDataUrl(s) ? toImg(s) : null);
  const brief = clean(body.brief, 1200) || (path === "/photo" ? "Planche de matières." : "");
  if (!brief) return json({ erreur: "Décrivez le projet." }, 400);
  const aspect = ASPECTS.includes(String(body.aspect)) ? String(body.aspect) : "4:3";
  const [aw, ah] = aspect.split(":").map(Number);
  let photo: ImgIn | undefined, references: ImgIn[] = [], prompt: string;
  if (path === "/redesign") {
    photo = image(body.photo) ?? undefined;
    if (!photo) return json({ erreur: "Ajoutez une photo de la pièce (JPEG ou PNG)." }, 400);
    references = (Array.isArray(body.inspirations) ? body.inspirations.slice(0, 3).map(image).filter(Boolean) : []) as ImgIn[];
    prompt = buildPrompt({ mode: "transform", brief, keep: ["fenetres", "portes", "murs", "plafond"], references: references.length });
  } else if (path === "/photo") {
    photo = image(body.image) ?? undefined;
    if (!photo) return json({ erreur: "Image de la planche manquante." }, 400);
    prompt = [
      "This image is a 3D render of an interior designer's flat-lay material board (or a single material sample).",
      "Turn it into a photorealistic studio photograph of the very same physical samples.",
      "Keep EXACTLY the same layout, positions, overlaps, shapes, sizes, colours and camera angle. Do not add, remove or move any object.",
      "Give every sample its real-world material detail at macro level: wood grain and pores, stone veining and polish, fabric weave and pinked edges, brushed or knurled metal with soft reflections, glossy wet paint, paper fibres, ceramic glaze.",
      "Soft natural window daylight from the upper right, long gentle shadows, white textured paper background, high-end editorial look, no text, no watermark.",
      `Details (written in French): ${brief}`,
    ].join("\n");
  } else prompt = buildPrompt({ mode: "generate", brief });
  await env.QUOTA!.put(totalKey, String(total + 1), { expirationTtl: 172800 });
  await env.QUOTA!.put(ipKey, String(mine + 1), { expirationTtl: 172800 });
  try {
    const r = await gemini.submit({ mode: path === "/concept" ? "generate" : "transform", prompt, photo, references, width: aw! * 400, height: ah! * 400, quality: "standard", visitor: ip }, env);
    if (r.state !== "done") throw new ProviderError("Aucune image n'a été produite.", true);
    let bin = ""; for (let i = 0; i < r.image.length; i += 0x8000) bin += String.fromCharCode(...r.image.subarray(i, i + 0x8000));
    return json({ image: `data:${r.mime};base64,${btoa(bin)}`, restant: Math.max(0, LEGACY_VISITOR - mine - 1) });
  } catch (e) {
    return json({ erreur: e instanceof ProviderError ? e.message : "Le service d'images ne répond pas. Réessayez dans un instant." }, 502);
  }
}
