import { z } from "zod";
import { admin, handler, HttpError, json, rateLimit, requireUser } from "../_shared/http.ts";
import { requireAccess } from "../_shared/quota.ts";

const Body = z.object({ renderId: z.string().uuid(), point: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }), instruction: z.string().trim().min(3).max(500) }).strict();

/**
 * Retouche par zone : enregistre la demande (point cliqué + consigne). La segmentation (SAM 2) et l'inpainting sont exécutés
 * par le fournisseur d'images choisi au banc d'essai ; le résultat est recomposé pour que le reste de l'image reste identique au pixel près.
 */
Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  await rateLimit(`user:${user.id}:edit`, 3600, 30);
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) throw new HttpError(400, "invalid", "Touchez un élément du rendu et décrivez le changement.");
  const db = admin();
  const { data: r } = await db.from("renders").select("id, project_id, projects!inner(owner_id)").eq("id", body.data.renderId).maybeSingle();
  if (!r || (r.projects as unknown as { owner_id: string }).owner_id !== user.id) throw new HttpError(404, "not_found", "Rendu introuvable.");
  await requireAccess(user.id, "edit");
  const { data: edit } = await db.from("render_edits").insert({ render_id: r.id, owner_id: user.id, point: body.data.point, instruction: body.data.instruction, status: "en_attente" }).select("id").single();
  await db.from("job_runs").insert({ project_id: r.project_id, kind: "retouche", status: "en_attente", step: edit?.id ?? null });
  return json(req, { editId: edit?.id, status: "en_attente" });
}));
