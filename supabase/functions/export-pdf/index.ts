import { z } from "zod";
import { StudyResultSchema } from "../_shared/core/schemas/study.ts";
import { env } from "../_shared/env.ts";
import { admin, cors, handler, HttpError, requireUser } from "../_shared/http.ts";
import { requireAccess } from "../_shared/quota.ts";
import { buildStudyPdf } from "../_shared/pdf.ts";
import plants from "../_shared/generated/plants.json" with { type: "json" };

const Body = z.object({ projectId: z.string().uuid() }).strict();

/** Export PDF côté serveur : couverture, rendus, palette, liste d'achats avec QR codes (liens affiliés), tutos. */
Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) throw new HttpError(400, "invalid", "Projet inconnu.");
  const acc = await requireAccess(user.id, "pdf");
  const db = admin();
  const { data: p } = await db.from("projects").select("id, space, study_versions(id, version, result)").eq("id", body.data.projectId).eq("owner_id", user.id).maybeSingle();
  if (!p) throw new HttpError(404, "not_found", "Projet introuvable.");
  const v = (p.study_versions as { id: string; version: number; result: unknown }[]).sort((a, b) => b.version - a.version)[0];
  if (!v) throw new HttpError(409, "no_study", "Ce projet n'a pas encore d'étude.");
  const study = StudyResultSchema.parse(v.result);
  const { data: rs } = await db.from("renders").select("storage_path").eq("study_version_id", v.id).eq("status", "pret").order("variant").limit(1);
  const renderJpegs: Uint8Array[] = [];
  for (const r of rs ?? []) { if (!r.storage_path?.endsWith(".jpg")) continue; const { data } = await db.storage.from("renders").download(r.storage_path); if (data) renderJpegs.push(new Uint8Array(await data.arrayBuffer())); }
  const { data: needs } = await db.from("product_needs").select("need_key, need_matches(rank, products(id, title, price_cents, merchants(name)))").eq("study_version_id", v.id);
  const products: Record<string, { title: string; merchant: string; priceLabel: string; url: string } | null> = {};
  for (const n of needs ?? []) {
    const principal = (n.need_matches as unknown as { rank: string; products: { id: string; title: string; price_cents: number; merchants: { name: string } | null } }[]).find((m) => m.rank === "principal");
    products[n.need_key] = principal ? { title: principal.products.title, merchant: principal.products.merchants?.name ?? "", priceLabel: `${(principal.products.price_cents / 100).toFixed(2).replace(".", ",")} €`, url: `${env().SITE_URL}/go/${principal.products.id}/` } : null;
  }
  const bytes = await buildStudyPdf({ study, space: p.space, photoJpeg: null, renderJpegs, products, plantNames: Object.fromEntries((plants as { id: string; name: string }[]).map((x) => [x.id, x.name])), siteUrl: env().SITE_URL, watermark: acc.entitlement.plan === "decouverte" });
  await db.from("usage_events").insert({ user_id: user.id, kind: "pdf", cost_cents: 0, payer: acc.payer });
  return new Response(new Uint8Array(bytes), { headers: { ...cors(req), "content-type": "application/pdf", "content-disposition": `attachment; filename="piece-revee-${p.id.slice(0, 8)}.pdf"` } });
}));
