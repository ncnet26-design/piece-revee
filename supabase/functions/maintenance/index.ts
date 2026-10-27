import { z } from "zod";
import { embed, toPgVector } from "../_shared/embeddings.ts";
import { env } from "../_shared/env.ts";
import { admin, HttpError, json, log } from "../_shared/http.ts";

const Body = z.object({ task: z.enum(["purge", "catalogue", "knowledge-embeddings", "link-check"]) });

/** Tâches planifiées (pg_cron) : appel réservé à la clé service. */
Deno.serve(async (req) => {
  if ((req.headers.get("authorization") ?? "") !== `Bearer ${env().SUPABASE_SERVICE_ROLE_KEY}`) return json(req, { error: "forbidden" }, 403);
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return json(req, { error: "invalid" }, 400);
  const db = admin();
  try {
    switch (body.data.task) {
      case "purge": {
        // RGPD : suppression automatique des photos au-delà de la durée choisie par chaque utilisateur.
        const { data } = await db.rpc("expired_photo_paths");
        const paths = ((data ?? []) as { storage_path: string }[]).map((r) => r.storage_path);
        for (let i = 0; i < paths.length; i += 100) await db.storage.from("photos").remove(paths.slice(i, i + 100));
        if (paths.length) await db.from("project_photos").delete().in("storage_path", paths);
        await db.from("rate_limits").delete().lt("window_start", new Date(Date.now() - 86_400_000).toISOString());
        log("info", "purge_done", { photos: paths.length });
        return json(req, { purged: paths.length });
      }
      case "knowledge-embeddings": {
        const { data } = await db.from("knowledge_chunks").select("id, title, body").is("embedding", null).limit(100);
        for (const k of data ?? []) await db.from("knowledge_chunks").update({ embedding: toPgVector(await embed(`${k.title}. ${k.body}`)) }).eq("id", k.id);
        return json(req, { embedded: data?.length ?? 0 });
      }
      case "catalogue": {
        // Les produits absents du dernier flux sont retirés de l'affichage (jamais de produit périmé).
        const cutoff = new Date(Date.now() - 36 * 3600_000).toISOString();
        const { count } = await db.from("products").update({ removed_at: new Date().toISOString() }, { count: "exact" }).lt("feed_seen_at", cutoff).is("removed_at", null);
        log("info", "catalogue_cleanup", { removed: count ?? 0 });
        return json(req, { removed: count ?? 0 });
      }
      case "link-check": {
        const { data } = await db.from("products").select("id, product_url").is("removed_at", null).order("feed_seen_at").limit(200);
        let broken = 0;
        for (const p of data ?? []) {
          const r = await fetch(p.product_url, { method: "HEAD", redirect: "follow" }).catch(() => null);
          if (!r || r.status === 404 || r.status === 410) { broken++; await db.from("products").update({ removed_at: new Date().toISOString() }).eq("id", p.id); }
        }
        return json(req, { checked: data?.length ?? 0, broken });
      }
    }
  } catch (e) {
    log("error", "maintenance_failed", { task: body.data.task, message: e instanceof Error ? e.message : String(e) });
    throw new HttpError(500, "internal", "Échec de la tâche.");
  }
});
