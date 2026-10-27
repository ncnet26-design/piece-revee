import { z } from "zod";
import { admin, handler, HttpError, json, log, requireUser } from "../_shared/http.ts";

const Body = z.object({ confirm: z.literal("SUPPRIMER") }).strict();

/** Suppression du compte en un clic : fichiers, données applicatives, puis compte d'authentification. Les factures restent chez Stripe (obligation légale). */
Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  if (!Body.safeParse(await req.json().catch(() => null)).success) throw new HttpError(400, "confirm", "Tapez SUPPRIMER pour confirmer.");
  const db = admin();
  for (const bucket of ["photos", "renders"]) {
    const { data: folders } = await db.storage.from(bucket).list(user.id, { limit: 1000 });
    for (const f of folders ?? []) {
      const { data: files } = await db.storage.from(bucket).list(`${user.id}/${f.name}`, { limit: 1000 });
      const paths = (files ?? []).map((x) => `${user.id}/${f.name}/${x.name}`);
      if (paths.length) await db.storage.from(bucket).remove(paths);
    }
  }
  const { error } = await db.rpc("delete_user_data", { p_user: user.id });
  if (error) throw error;
  const { error: e2 } = await db.auth.admin.deleteUser(user.id);
  if (e2) throw e2;
  log("info", "account_deleted", {});
  return json(req, { ok: true });
}));
