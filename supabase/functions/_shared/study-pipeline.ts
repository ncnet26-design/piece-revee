import { z } from "zod";
import { MODELS } from "./core/costs.ts";
import { matchNeed, type Candidate } from "./core/matching.ts";
import { PhotoAnalysisSchema, StudyResultSchema, isExterior, type Brief, type PhotoAnalysis, type StudyResult } from "./core/schemas/study.ts";
import type { Product } from "./core/schemas/catalog.ts";
import { getPlan, type PlanId } from "./core/plans.ts";
import { asData } from "./core/guard.ts";
import { structured, type ImageInput } from "./claude.ts";
import { embed, toPgVector } from "./embeddings.ts";
import { renderWithFallback } from "./images.ts";
import { admin, log } from "./http.ts";
import { env } from "./env.ts";
import { PROMPTS } from "./generated/prompts.ts";
import plants from "./generated/plants.json" with { type: "json" };

const db = () => admin();
const PLANT_IDS = new Set((plants as { id: string }[]).map((p) => p.id));

async function setStatus(projectId: string, jobId: string, status: string, step: string | null, error: string | null = null) {
  await db().from("projects").update({ status, error }).eq("id", projectId);
  await db().from("job_runs").update({ status: status === "termine" ? "termine" : status === "erreur" ? "erreur" : "en_cours", step, error }).eq("id", jobId);
}

async function sha256(bytes: Uint8Array) {
  const d = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function toBase64(bytes: Uint8Array) { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); }

async function loadPhotos(projectId: string) {
  const { data } = await db().from("project_photos").select("id, kind, storage_path").eq("project_id", projectId).order("created_at");
  const photos = [] as { id: string; kind: string; path: string; bytes: Uint8Array }[];
  for (const p of data ?? []) {
    const { data: blob, error } = await db().storage.from("photos").download(p.storage_path);
    if (error || !blob) throw new Error("photo introuvable");
    photos.push({ id: p.id, kind: p.kind, path: p.storage_path, bytes: new Uint8Array(await blob.arrayBuffer()) });
  }
  return photos;
}

async function analyse(userId: string, projectId: string, photo: { id: string; bytes: Uint8Array }, inspirations: ImageInput[]): Promise<{ analysis: PhotoAnalysis; costCents: number }> {
  const hash = await sha256(photo.bytes);
  const { data: cached } = await db().from("photo_analyses").select("result").eq("input_hash", hash).eq("prompt_version", "analyse.v1").maybeSingle();
  if (cached) return { analysis: PhotoAnalysisSchema.parse(cached.result), costCents: 0 };
  const { data, costCents } = await structured({
    model: MODELS.study, system: PROMPTS["analyse.v1"], effort: "medium", maxTokens: 16000, feature: "analyse", userId, projectId,
    images: [{ mediaType: "image/jpeg", base64: toBase64(photo.bytes) }, ...inspirations.slice(0, 3)],
    text: inspirations.length ? "Image 1 : l'espace à analyser. Images suivantes : inspirations du client (ne pas les analyser comme l'espace)." : "Analyse cette photo.",
    schema: PhotoAnalysisSchema,
  });
  await db().from("photo_analyses").insert({ photo_id: photo.id, input_hash: hash, model: MODELS.study, prompt_version: "analyse.v1", result: data });
  return { analysis: data, costCents };
}

async function paintPalette(): Promise<{ id: string; brand: string; name: string; code: string | null; hex_approx: string }[]> {
  const { data } = await db().from("paint_colors").select("id, brand, name, code, hex_approx").limit(400);
  return data ?? [];
}

const studyChecks = (exterior: boolean, paintIds: Set<string>) => (s: StudyResult): string[] => {
  const errs: string[] = [];
  const zones = new Set(s.zones.map((z) => z.id));
  for (const n of [...s.needs, ...s.plants]) if (!zones.has(n.zoneId)) errs.push(`zone ${n.zoneId} inexistante`);
  for (const p of s.plants) if (!PLANT_IDS.has(p.plantId)) errs.push(`plante inconnue ${p.plantId} : utilise uniquement plantes_disponibles`);
  for (const c of s.palette) if (c.paintColorId && !paintIds.has(c.paintColorId)) errs.push(`teinte de nuancier inconnue ${c.paintColorId} : mets null`);
  if (exterior && s.plants.length === 0) errs.push("un extérieur doit proposer des plantes");
  return errs;
};

async function designStudy(o: { userId: string; projectId: string; brief: Brief; analysis: PhotoAnalysis; previous?: StudyResult; instruction?: string; thread: unknown }) {
  const exterior = isExterior(o.brief.space);
  const paints = await paintPalette();
  const input = {
    brief: o.brief, analyse_photo: o.analysis, fil_conducteur_du_logement: o.thread ?? null,
    plantes_disponibles: exterior ? plants : [], nuancier: paints.slice(0, 200),
    ...(o.previous ? { etude_precedente: o.previous } : {}),
  };
  const text = [
    asData("brief et contexte", JSON.stringify(input)),
    o.instruction ? `\nModification demandée par le client :\n${asData("demande du client", o.instruction)}` : "",
  ].join("");
  return await structured({
    model: MODELS.study, system: o.instruction ? `${PROMPTS["etude.v1"]}\n\n${PROMPTS["affinage.v1"]}` : PROMPTS["etude.v1"], effort: "high", maxTokens: 48000,
    feature: o.instruction ? "affinage" : "etude", userId: o.userId, projectId: o.projectId, text, schema: StudyResultSchema,
    extraCheck: studyChecks(exterior, new Set(paints.map((p) => p.id))),
  });
}

/** Appariement des besoins avec le catalogue réel (pgvector + filtres SQL). Rien n'est inventé : sans correspondance, « à chercher ». */
async function matchCatalog(versionId: string, study: StudyResult) {
  for (const need of study.needs) {
    const text = `${need.category}. ${need.description}. ${need.materials.join(", ")}. ${need.colors.join(", ")}. ${need.style.join(", ")}`;
    let vector: number[] | null = null;
    try { vector = await embed(text); } catch (e) { log("warn", "embed_failed", { message: String(e) }); }
    const { data: row } = await db().from("product_needs").insert({ study_version_id: versionId, need_key: need.id, attributes: need, embedding: vector ? toPgVector(vector) : null }).select("id").single();
    if (!vector || !row) continue;
    const { data: hits } = await db().rpc("match_products", { p_embedding: toPgVector(vector), p_category: need.category, p_max_price_cents: Math.round(need.priceRange.max * 100 * 1.6), p_limit: 120 });
    const ids = ((hits ?? []) as { id: string; similarity: number }[]);
    if (!ids.length) continue;
    const { data: prods } = await db().from("products").select("*").in("id", ids.map((h) => h.id));
    const candidates: Candidate[] = (prods ?? []).map((p) => ({ similarity: ids.find((h) => h.id === p.id)?.similarity ?? 0, product: {
      id: p.id, merchant: p.merchant_id, externalId: p.external_id, gtin: p.gtin, title: p.title, brand: p.brand, category: p.category, styles: p.styles, materials: p.materials, colors: p.colors,
      dimsCm: p.dims_cm, priceCents: p.price_cents, currency: "EUR", inStock: p.in_stock, imageUrl: p.image_url, productUrl: p.product_url, affiliateUrl: p.affiliate_url,
      feedSeenAt: p.feed_seen_at, removedAt: p.removed_at, secondHand: p.second_hand } as Product }));
    const m = matchNeed(need, candidates);
    type Row = { need_id: string; product_id: string; rank: "principal" | "accessible" | "premium"; score: number };
    const rows: Row[] = [
      ...(m.principal ? [{ need_id: row.id as string, product_id: m.principal.id, rank: "principal" as const, score: 1 }] : []),
      ...m.alternatives.map((p) => ({ need_id: row.id as string, product_id: p.id, rank: (p.priceCents < (m.principal?.priceCents ?? 0) ? "accessible" : "premium") as Row["rank"], score: 0.8 })),
    ];
    if (rows.length) await db().from("need_matches").insert(rows);
  }
}

const Verdict = z.object({ geometrie: z.number().min(0).max(10), artefacts: z.number().min(0).max(10), coherence: z.number().min(0).max(10), realisme: z.number().min(0).max(10), defauts: z.array(z.string().max(200)).max(8) });

/** Rendus : génération, contrôle par Claude Vision, au plus deux nouvelles tentatives, meilleure version conservée. */
async function renders(o: { userId: string; projectId: string; versionId: string; study: StudyResult; photo: { path: string; bytes: Uint8Array }; plan: PlanId }) {
  const plan = getPlan(o.plan);
  const variants = plan.id === "decouverte" ? 1 : 3;
  const quality = plan.id === "decouverte" ? "apercu" : "hd";
  const { data: signed } = await db().storage.from("photos").createSignedUrl(o.photo.path, 600);
  let cost = 0;
  const looks = ["", " Variante plus chaleureuse, mêmes matières.", " Variante plus contrastée et graphique, mêmes matières."];
  for (let v = 0; v < variants; v++) {
    const { data: row } = await db().from("renders").insert({ study_version_id: o.versionId, project_id: o.projectId, variant: v, status: "en_cours", watermark: plan.watermark, prompt: o.study.renderBrief.prompt + looks[v], negative_prompt: o.study.renderBrief.negative }).select("id").single();
    let best: { bytes: Uint8Array; mediaType: string; score: number; width: number; height: number; provider: string; model: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const img = await renderWithFallback({ prompt: `${o.study.renderBrief.prompt}${looks[v]} ${o.study.renderBrief.light}. Garder exactement la géométrie, les fenêtres, les portes et le point de vue de la photo.`, negative: o.study.renderBrief.negative, imageUrl: signed?.signedUrl ?? null, width: Math.min(plan.renderMaxPx, 2048), height: Math.round(Math.min(plan.renderMaxPx, 2048) * 0.75), seed: 1000 * v + attempt }, quality);
      cost += img.costCents;
      let score = 6;
      if (img.provider !== "mock") {
        try {
          const { data: verdict, costCents } = await structured({ model: MODELS.advisor, system: PROMPTS["rendu-controle.v1"], effort: "low", maxTokens: 4000, feature: "controle", userId: o.userId, projectId: o.projectId,
            images: [{ mediaType: "image/jpeg", base64: toBase64(o.photo.bytes) }, { mediaType: img.mediaType === "image/png" ? "image/png" : "image/jpeg", base64: toBase64(img.bytes) }],
            text: `Image 1 : photo d'origine. Image 2 : rendu. Étude : ${o.study.concept.title}, palette ${o.study.palette.map((c) => c.hex).join(" ")}.`, schema: Verdict });
          cost += costCents;
          score = Math.min(verdict.geometrie, verdict.artefacts) * 0.6 + (verdict.coherence + verdict.realisme) * 0.2;
        } catch (e) { log("warn", "verify_failed", { message: String(e) }); }
      }
      if (!best || score > best.score) best = { ...img, score };
      if (score >= 7.5) break;
    }
    if (best && row) {
      const path = `${o.userId}/${o.projectId}/rendu-${o.versionId.slice(0, 8)}-${v}.${best.mediaType === "image/png" ? "png" : "jpg"}`;
      await db().storage.from("renders").upload(path, best.bytes, { contentType: best.mediaType, upsert: true });
      await db().from("renders").update({ status: "pret", storage_path: path, provider: best.provider, model: best.model, width: best.width, height: best.height, scores: { global: best.score }, cost_cents: cost }).eq("id", row.id);
    }
  }
  return cost;
}

async function alertIfExpensive(projectId: string, totalCents: number) {
  const e = env();
  if (totalCents <= e.STUDY_COST_ALERT_CENTS || !e.RESEND_API_KEY || !e.ALERT_EMAIL) return;
  await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${e.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: "Pièce Rêvée <alertes@notifications.piece-revee.fr>", to: [e.ALERT_EMAIL], subject: `Coût d'étude élevé : ${(totalCents / 100).toFixed(2)} €`, text: `Projet ${projectId} : coût IA ${(totalCents / 100).toFixed(2)} €, seuil ${(e.STUDY_COST_ALERT_CENTS / 100).toFixed(2)} €.` }) }).catch(() => undefined);
}

/** Étude complète, exécutée en tâche de fond après la réponse HTTP. */
export async function runStudy(o: { userId: string; projectId: string; jobId: string; plan: PlanId; reservedCents: number; payer: "paid" | "free"; source: "plan" | "credits"; instruction?: string }) {
  let total = 0;
  try {
    const { data: project } = await db().from("projects").select("brief, home_id").eq("id", o.projectId).single();
    if (!project) throw new Error("projet introuvable");
    const brief = project.brief as Brief;
    const photos = await loadPhotos(o.projectId);
    const main = photos.find((p) => p.kind === "piece");
    if (!main) throw new Error("photo principale manquante");
    const inspirations: ImageInput[] = photos.filter((p) => p.kind === "inspiration").map((p) => ({ mediaType: "image/jpeg", base64: toBase64(p.bytes) }));
    const thread = project.home_id ? (await db().from("homes").select("common_thread").eq("id", project.home_id).single()).data?.common_thread : null;

    await setStatus(o.projectId, o.jobId, "analyse", "analyse");
    const { analysis, costCents: c1 } = await analyse(o.userId, o.projectId, main, inspirations); total += c1;
    if (!analysis.isRoomOrOutdoor) { await setStatus(o.projectId, o.jobId, "erreur", null, "Nous ne reconnaissons pas de pièce ni d'extérieur sur cette photo. Essayez une photo prise depuis un angle de la pièce, en lumière du jour. Rien ne vous a été décompté."); await refund(o, total); return; }

    await setStatus(o.projectId, o.jobId, "etude", "etude");
    const { data: last } = await db().from("study_versions").select("id, version, result").eq("project_id", o.projectId).order("version", { ascending: false }).limit(1).maybeSingle();
    const { data: study, costCents: c2 } = await designStudy({ userId: o.userId, projectId: o.projectId, brief, analysis, previous: o.instruction ? (last?.result as StudyResult) : undefined, instruction: o.instruction, thread });
    total += c2;
    const { data: version } = await db().from("study_versions").insert({ project_id: o.projectId, version: (last?.version ?? 0) + 1, parent_id: last?.id ?? null, instruction: o.instruction ?? null, result: study, prompt_version: "etude.v1" }).select("id").single();
    if (!version) throw new Error("enregistrement de l'étude impossible");
    await db().from("projects").update({ title: study.concept.title }).eq("id", o.projectId);

    await setStatus(o.projectId, o.jobId, "catalogue", "catalogue");
    await matchCatalog(version.id, study);

    await setStatus(o.projectId, o.jobId, "rendus", "rendus");
    total += await renders({ userId: o.userId, projectId: o.projectId, versionId: version.id, study, photo: main, plan: o.plan });

    await setStatus(o.projectId, o.jobId, "termine", null);
    await db().from("usage_events").insert({ user_id: o.userId, kind: "study", cost_cents: total, payer: o.payer });
    if (o.reservedCents > total) await db().rpc("envelope_credit", { p_paid: o.payer === "paid" ? o.reservedCents - total : 0, p_free: o.payer === "free" ? o.reservedCents - total : 0, p_reason: "ajustement", p_ref: o.projectId });
    await alertIfExpensive(o.projectId, total);
    log("info", "study_done", { projectId: o.projectId, costCents: total });
  } catch (e) {
    log("error", "study_failed", { projectId: o.projectId, message: e instanceof Error ? e.message : String(e) });
    await setStatus(o.projectId, o.jobId, "erreur", null, "L'étude n'a pas pu aboutir. Relancez-la : rien ne vous a été décompté.");
    await refund(o, total);
  }
}

async function refund(o: { reservedCents: number; payer: "paid" | "free"; projectId: string }, spent: number) {
  const back = Math.max(0, o.reservedCents - spent);
  if (back) await db().rpc("envelope_credit", { p_paid: o.payer === "paid" ? back : 0, p_free: o.payer === "free" ? back : 0, p_reason: "remboursement_echec", p_ref: o.projectId });
}
