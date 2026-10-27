import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Migrations exécutées dans un vrai Postgres (PGlite, WebAssembly) avec une simulation de Supabase. */
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
let db: PGlite;

async function as(user: string | null, sql: string, params: unknown[] = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user ?? ""}', false); set role ${user ? "authenticated" : "anon"};`);
  try { return await db.query(sql, params); } finally { await db.exec("reset role;"); }
}

beforeAll(async () => {
  db = new PGlite({ extensions: { vector } });
  await db.exec(readFileSync("tests/sql/supabase-stub.sql", "utf8"));
  const dir = "supabase/migrations";
  for (const f of readdirSync(dir).sort()) {
    if (f.includes("_jobs")) continue; // pg_cron et pgmq n'existent pas hors Supabase
    await db.exec(readFileSync(join(dir, f), "utf8").replace("create extension if not exists pgcrypto with schema extensions;", ""));
  }
  await db.exec(`insert into auth.users (id, email) values ('${A}', 'a@exemple.fr'), ('${B}', 'b@exemple.fr');
    insert into public.projects (id, owner_id, space, brief, title) values ('aaaaaaaa-0000-4000-8000-000000000001', '${A}', 'Salon', '{}', 'Projet de A');
    insert into public.study_versions (project_id, version, result, prompt_version) values ('aaaaaaaa-0000-4000-8000-000000000001', 1, '{"concept":{"title":"x"}}', 'v1');`);
}, 60_000);

describe("schéma et RLS", () => {
  it("crée le profil à l'inscription", async () => {
    const r = await db.query<{ n: number }>("select count(*)::int as n from public.profiles");
    expect(r.rows[0]?.n).toBe(2);
  });
  it("un utilisateur ne voit que ses projets", async () => {
    expect((await as(A, "select id from public.projects")).rows).toHaveLength(1);
    expect((await as(B, "select id from public.projects")).rows).toHaveLength(0);
    expect((await as(null, "select id from public.projects")).rows).toHaveLength(0);
    expect((await as(B, "select * from public.study_versions")).rows).toHaveLength(0);
  });
  it("la vue projects_view respecte la RLS", async () => {
    expect((await as(A, "select id, versions from public.projects_view")).rows).toHaveLength(1);
    expect((await as(B, "select id from public.projects_view")).rows).toHaveLength(0);
  });
  it("un utilisateur ne peut pas modifier le statut ni le propriétaire d'un projet", async () => {
    await expect(as(A, `update public.projects set owner_id = '${B}'`)).rejects.toThrow();
    await expect(as(A, "update public.projects set status = 'termine'")).rejects.toThrow();
    await as(A, "update public.projects set title = 'Nouveau titre'");
    expect((await db.query<{ title: string }>("select title from public.projects")).rows[0]?.title).toBe("Nouveau titre");
  });
  it("un utilisateur ne peut pas modifier son identifiant client Stripe", async () => {
    await expect(as(A, "update public.profiles set stripe_customer_id = 'cus_pirate'")).rejects.toThrow();
    await as(A, "update public.profiles set display_name = 'Alice'");
  });
  it("un utilisateur ne peut pas créer de projet sans passer par le serveur (quotas)", async () => {
    await expect(as(A, `insert into public.projects (owner_id, space, brief) values ('${A}', 'Salon', '{}')`)).rejects.toThrow();
  });
  it("un utilisateur ne peut pas se créditer ni lire l'enveloppe IA", async () => {
    await expect(as(A, `insert into public.credit_ledger (user_id, delta, reason) values ('${A}', 1000, 'achat')`)).rejects.toThrow();
    await expect(as(A, "select * from public.ai_envelope")).rejects.toThrow(/permission/);
    await expect(as(A, "select * from public.stripe_events")).rejects.toThrow(/permission/);
  });
  it("le projet partagé n'est visible que s'il est public", async () => {
    await db.exec("update public.projects set share_slug = 'salon-de-a-1234', is_public = false");
    expect((await as(B, "select public.get_shared_project('salon-de-a-1234') as p")).rows[0]).toEqual({ p: null });
    await db.exec("update public.projects set is_public = true");
    const r = await as(null, "select public.get_shared_project('salon-de-a-1234') as p");
    expect((r.rows[0] as { p: { title: string; brief: { wish: string } } }).p.title).toBe("Nouveau titre");
    expect((r.rows[0] as { p: { brief: { wish: string } } }).p.brief.wish).toBe("");
  });
  it("seuls les produits actifs d'enseignes actives sont publics", async () => {
    await db.exec(`insert into public.merchants (id, name, network, active) values ('cccccccc-0000-4000-8000-000000000001', 'Enseigne active', 'awin', true), ('cccccccc-0000-4000-8000-000000000002', 'Enseigne inactive', 'awin', false);
      insert into public.products (merchant_id, external_id, title, category, price_cents, image_url, product_url, affiliate_url) values
      ('cccccccc-0000-4000-8000-000000000001', 'p1', 'Tapis', 'Tapis', 19900, 'https://ex.fr/i.jpg', 'https://ex.fr/p', 'https://aff.ex.fr/p'),
      ('cccccccc-0000-4000-8000-000000000002', 'p2', 'Tapis 2', 'Tapis', 19900, 'https://ex.fr/i.jpg', 'https://ex.fr/p', 'https://aff.ex.fr/p');
      insert into public.products (merchant_id, external_id, title, category, price_cents, image_url, product_url, affiliate_url, removed_at) values
      ('cccccccc-0000-4000-8000-000000000001', 'p3', 'Ancien', 'Tapis', 19900, 'https://ex.fr/i.jpg', 'https://ex.fr/p', 'https://aff.ex.fr/p', now());`);
    expect((await as(null, "select external_id from public.products")).rows).toEqual([{ external_id: "p1" }]);
  });
  it("refuse un lien produit non https", async () => {
    await expect(db.exec(`insert into public.products (merchant_id, external_id, title, category, price_cents, image_url, product_url, affiliate_url) values ('cccccccc-0000-4000-8000-000000000001', 'x', 'X', 'Tapis', 100, 'http://ex.fr/i.jpg', 'https://ex.fr/p', 'https://ex.fr/a')`)).rejects.toThrow();
  });
  it("une demande de devis va à 3 artisans au maximum", async () => {
    await db.exec(`insert into public.artisans (id, name, siret, email) values
      ('dddddddd-0000-4000-8000-000000000001','A1','12345678900011','a1@ex.fr'),('dddddddd-0000-4000-8000-000000000002','A2','12345678900012','a2@ex.fr'),
      ('dddddddd-0000-4000-8000-000000000003','A3','12345678900013','a3@ex.fr'),('dddddddd-0000-4000-8000-000000000004','A4','12345678900014','a4@ex.fr');
      insert into public.quote_requests (id, user_id, element, details, department) values ('eeeeeeee-0000-4000-8000-000000000001', '${A}', 'Bibliothèque', 'Sur-mesure', '75');
      insert into public.quote_request_recipients (request_id, artisan_id) values ('eeeeeeee-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000001'),('eeeeeeee-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000002'),('eeeeeeee-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000003');`);
    await expect(db.exec("insert into public.quote_request_recipients (request_id, artisan_id) values ('eeeeeeee-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004')")).rejects.toThrow(/3 artisans/);
  });
  it("calcule les droits de l'utilisateur courant", async () => {
    await db.exec(`insert into public.purchases (user_id, plan, amount_ttc_cents, stripe_event_id, access_until) values ('${A}', 'pass', 1490, 'evt_1', now() + interval '30 days');
      insert into public.usage_events (user_id, kind) values ('${A}', 'study'), ('${A}', 'render'), ('${A}', 'render');
      insert into public.credit_ledger (user_id, delta, reason) values ('${A}', 15, 'achat'), ('${A}', -1, 'rendu');`);
    const r = (await as(A, "select * from public.my_entitlements")).rows[0] as { plan: string; usage: Record<string, number>; creditBalance: number };
    expect(r.plan).toBe("pass");
    expect(r.usage).toEqual({ study: 1, render: 2 });
    expect(r.creditBalance).toBe(14);
    expect(((await as(B, "select * from public.my_entitlements")).rows[0] as { plan: string }).plan).toBe("decouverte");
  });
  it("le tableau de bord admin est réservé aux administrateurs", async () => {
    await expect(as(A, "select * from public.admin_kpis")).rejects.toThrow(/réservé/);
    await db.exec(`insert into public.user_roles (user_id, role) values ('${B}', 'admin')`);
    const r = (await as(B, "select * from public.admin_kpis")).rows[0] as { paying_users: number };
    expect(Number(r.paying_users)).toBe(1);
  });
  it("le stockage limite chaque utilisateur à son dossier", async () => {
    await db.exec(`insert into storage.objects (bucket_id, name) values ('photos', '${A}/p1/piece.jpg'), ('photos', '${B}/p2/piece.jpg'); alter table storage.objects enable row level security; grant select, insert on storage.objects to authenticated;`);
    expect((await as(A, "select name from storage.objects")).rows).toEqual([{ name: `${A}/p1/piece.jpg` }]);
    await expect(as(A, `insert into storage.objects (bucket_id, name) values ('photos', '${B}/intrus.jpg')`)).rejects.toThrow();
  });
  it("les fonctions serveur sont inaccessibles aux utilisateurs", async () => {
    await expect(as(A, "select public.envelope_credit(100000, 0, 'pirate', null)")).rejects.toThrow(/permission/);
    await expect(as(null, "select public.hit_rate_limit('x', 60, 1)")).rejects.toThrow(/permission/);
    await expect(as(A, `select public.delete_user_data('${B}')`)).rejects.toThrow(/permission/);
  });
  it("l'enveloppe IA refuse un débit sans solde suffisant", async () => {
    await db.exec("select public.envelope_credit(500, 50, 'vente', 'test')");
    expect((await db.query<{ ok: boolean }>("select public.envelope_debit(60, 'free', 't') as ok")).rows[0]?.ok).toBe(false);
    expect((await db.query<{ ok: boolean }>("select public.envelope_debit(40, 'free', 't') as ok")).rows[0]?.ok).toBe(true);
    expect((await db.query<{ ok: boolean }>("select public.envelope_debit(400, 'paid', 't') as ok")).rows[0]?.ok).toBe(true);
    const e = (await db.query<{ p: string; f: string }>("select paid_balance_cents::text p, free_balance_cents::text f from public.ai_envelope")).rows[0];
    expect(e).toEqual({ p: "100", f: "10" });
  });
  it("limite le débit par clé", async () => {
    const hits = [];
    for (let i = 0; i < 4; i++) hits.push((await db.query<{ ok: boolean }>("select public.hit_rate_limit('ip:abc', 3600, 3) as ok")).rows[0]?.ok);
    expect(hits).toEqual([true, true, true, false]);
  });
  it("le clic affilié renvoie l'URL et se journalise, sans IP en clair", async () => {
    const pid = (await db.query<{ id: string }>("select id from public.products where external_id = 'p1'")).rows[0]!.id;
    const r = await as(null, "select public.log_click($1, 'hash123') as url", [pid]);
    expect((r.rows[0] as { url: string }).url).toBe("https://aff.ex.fr/p");
    expect((await db.query<{ n: number }>("select count(*)::int n from public.affiliate_clicks where ip_hash = 'hash123'")).rows[0]?.n).toBe(1);
  });
  it("calcule le droit et l'usage pour les quotas", async () => {
    const e = (await db.query<{ e: { plan: string; firstStudyDone: boolean } }>(`select public.entitlement_of('${A}') as e`)).rows[0]!.e;
    expect(e.plan).toBe("pass");
    expect(e.firstStudyDone).toBe(true);
    const u = (await db.query<{ u: { creditBalance: number } }>(`select public.usage_snapshot('${A}', now() - interval '1 day') as u`)).rows[0]!.u;
    expect(u.creditBalance).toBe(14);
  });
  it("supprime les données d'un compte", async () => {
    await db.exec(`select public.delete_user_data('${A}')`);
    expect((await db.query<{ n: number }>(`select count(*)::int n from public.projects where owner_id = '${A}'`)).rows[0]?.n).toBe(0);
  });
});
