/// <reference path="../_shared/runtime.d.ts" />
import { z } from "zod";
import { admin, handler, HttpError, json, rateLimit, requireUser } from "../_shared/http.ts";
import { requireAccess, reserve } from "../_shared/quota.ts";
import { runStudy } from "../_shared/study-pipeline.ts";

const Body = z.object({ projectId: z.string().uuid(), instruction: z.string().trim().min(3).max(500) }).strict();

/** Affiner : nouvelle version de l'étude (historique conservé). Compte comme une étude. */
Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  await rateLimit(`user:${user.id}:refine`, 3600, 15);
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) throw new HttpError(400, "invalid", "Décrivez la modification en quelques mots.");
  const db = admin();
  const { data: p } = await db.from("projects").select("id, status").eq("id", body.data.projectId).eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!p) throw new HttpError(404, "not_found", "Projet introuvable.");
  if (p.status !== "termine" && p.status !== "erreur") throw new HttpError(409, "busy", "Une étude est déjà en cours sur ce projet.");
  const acc = await requireAccess(user.id, "study");
  await reserve(acc.payer === "free" ? 70 : 120, acc.payer, p.id);
  const { data: job } = await db.from("job_runs").insert({ project_id: p.id, kind: "affinage", status: "en_cours" }).select("id").single();
  EdgeRuntime.waitUntil(runStudy({ userId: user.id, projectId: p.id, jobId: job!.id, plan: acc.entitlement.plan, reservedCents: acc.payer === "free" ? 70 : 120, payer: acc.payer, source: "plan", instruction: body.data.instruction }));
  return json(req, { ok: true });
}));
