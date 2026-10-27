import { admin, handler, json, rateLimit, requireUser } from "../_shared/http.ts";

/** Export RGPD : toutes les données de l'utilisateur, en JSON, avec des liens temporaires vers ses fichiers. */
Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  await rateLimit(`user:${user.id}:export`, 3600, 5);
  const db = admin(); const uid = user.id;
  const q = async (table: string, col = "user_id") => (await db.from(table).select("*").eq(col, uid)).data ?? [];
  const projects = await q("projects", "owner_id");
  const ids = projects.map((p) => p.id as string);
  const photos = await q("project_photos", "owner_id");
  const signed = await Promise.all(photos.map(async (p) => ({ path: p.storage_path, url: (await db.storage.from("photos").createSignedUrl(p.storage_path as string, 86_400)).data?.signedUrl ?? null })));
  return json(req, {
    exported_at: new Date().toISOString(),
    account: { id: uid, email: user.email, created_at: user.created_at },
    profile: (await q("profiles", "id"))[0] ?? null,
    homes: await q("homes", "owner_id"),
    projects,
    studies: ids.length ? (await db.from("study_versions").select("*").in("project_id", ids)).data : [],
    renders: ids.length ? (await db.from("renders").select("id, project_id, variant, storage_path, created_at").in("project_id", ids)).data : [],
    photos: signed,
    moodboard: await q("moodboard_items"),
    conversations: await q("chat_messages"),
    memory: (await q("user_memory"))[0] ?? null,
    purchases: await q("purchases"),
    subscriptions: await q("subscriptions"),
    credits: await q("credit_ledger"),
    quote_requests: await q("quote_requests"),
  });
}));
