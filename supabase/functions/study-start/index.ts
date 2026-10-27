/// <reference path="../_shared/runtime.d.ts" />
import { z } from "zod";
import { BriefSchema } from "../_shared/core/schemas/study.ts";
import { admin, handler, HttpError, ipHash, json, rateLimit, requireUser } from "../_shared/http.ts";
import { requireAccess, reserve } from "../_shared/quota.ts";
import { runStudy } from "../_shared/study-pipeline.ts";

const Body = z.object({
  projectId: z.string().uuid(),
  brief: BriefSchema,
  photoPaths: z.array(z.string().max(300)).min(1).max(4),
  homeId: z.string().uuid().nullable(),
}).strict();

/** Coût IA réservé avant l'étude (ajusté à la fin, remboursé en cas d'échec). */
const RESERVE = { decouverte: 70, paid: 120 };

Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  await rateLimit(`user:${user.id}:study`, 3600, 12);
  await rateLimit(`ip:${await ipHash(req)}:study`, 3600, 20);
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) throw new HttpError(400, "invalid", "Certaines informations du formulaire sont incomplètes.");
  const { projectId, brief, photoPaths, homeId } = body.data;
  // Chaque chemin doit être dans le dossier de l'utilisateur et du projet : on ne lit jamais la photo d'un autre.
  if (!photoPaths.every((p) => p.startsWith(`${user.id}/${projectId}/`))) throw new HttpError(403, "forbidden", "Photo non autorisée.");

  const acc = await requireAccess(user.id, "study");
  const reserved = acc.payer === "free" ? RESERVE.decouverte : RESERVE.paid;
  await reserve(reserved, acc.payer, projectId);

  const db = admin();
  if (homeId) { const { data: h } = await db.from("homes").select("id").eq("id", homeId).eq("owner_id", user.id).maybeSingle(); if (!h) throw new HttpError(403, "forbidden", "Logement non autorisé."); }
  const { error } = await db.from("projects").insert({ id: projectId, owner_id: user.id, home_id: homeId, space: brief.space, brief, title: brief.space, status: "upload" });
  if (error) throw new HttpError(409, "exists", "Ce projet existe déjà.");
  await db.from("project_photos").insert(photoPaths.map((p, i) => ({ project_id: projectId, owner_id: user.id, kind: i === 0 ? "piece" : "inspiration", storage_path: p, exif_stripped: true })));
  const { data: job } = await db.from("job_runs").insert({ project_id: projectId, kind: "etude", status: "en_cours", step: "upload" }).select("id").single();
  await db.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", user.id);

  EdgeRuntime.waitUntil(runStudy({ userId: user.id, projectId, jobId: job!.id, plan: acc.entitlement.plan, reservedCents: reserved, payer: acc.payer, source: acc.decision.allowed ? acc.decision.source : "plan" }));
  return json(req, { projectId });
}));
