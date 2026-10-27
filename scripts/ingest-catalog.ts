/**
 * Ingestion nocturne des flux produits d'affiliation (GitHub Actions, gratuit).
 * Usage : node --experimental-strip-types scripts/ingest-catalog.ts
 * Variables : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, et pour chaque flux FEED_<ENSEIGNE>_URL (+ réseau dans feeds).
 * Les embeddings sont calculés ensuite par la fonction maintenance (modèle gte-small, gratuit).
 */
import { createClient } from "@supabase/supabase-js";
import { MAPPINGS, dedupKey, normalizeRow, parseCsv } from "../supabase/functions/_shared/core/feed.ts";

const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.log("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY absent : rien à faire (catalogue non branché)."); process.exit(0); }
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: feeds, error } = await db.from("feeds").select("id, format, secret_name, merchants(id, name, network, active)");
if (error) throw error;
for (const f of feeds ?? []) {
  const m = f.merchants as unknown as { id: string; name: string; network: string; active: boolean } | null;
  if (!m?.active) continue;
  const feedUrl = process.env[f.secret_name];
  if (!feedUrl) { console.warn(`Flux ${m.name} : secret ${f.secret_name} absent, ignoré.`); continue; }
  const started = new Date().toISOString();
  try {
    const res = await fetch(feedUrl); if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = f.format === "csv" ? parseCsv(await res.text()) : [];
    const map = MAPPINGS[m.network] ?? MAPPINGS.generic!;
    const seen = new Set<string>(); let ok = 0, rejected = 0;
    const batch: Record<string, unknown>[] = [];
    for (const row of rows) {
      const r = normalizeRow(row, map);
      if (!r.ok) { rejected++; continue; }
      const k = dedupKey(r.product); if (seen.has(k)) continue; seen.add(k);
      const p = r.product;
      batch.push({ merchant_id: m.id, external_id: p.externalId, gtin: p.gtin, title: p.title, brand: p.brand, category: p.category, colors: p.colors, materials: p.materials,
        dims_cm: p.dimsCm, price_cents: p.priceCents, in_stock: p.inStock, image_url: p.imageUrl, product_url: p.productUrl, affiliate_url: p.affiliateUrl,
        feed_seen_at: started, removed_at: null, dedup_group: k });
      if (batch.length === 500) { await upsert(batch.splice(0)); }
      ok++;
    }
    if (batch.length) await upsert(batch);
    // Tout produit absent de ce flux est retiré de l'affichage.
    await db.from("products").update({ removed_at: started }).eq("merchant_id", m.id).lt("feed_seen_at", started).is("removed_at", null);
    await db.from("feeds").update({ last_sync_at: started, last_status: "ok", last_row_count: ok }).eq("id", f.id);
    console.log(`${m.name} : ${ok} produits, ${rejected} lignes rejetées.`);
  } catch (e) {
    await db.from("feeds").update({ last_sync_at: started, last_status: `erreur : ${String(e)}` }).eq("id", f.id);
    console.error(`${m.name} : échec ${String(e)}`);
  }
}

async function upsert(rows: Record<string, unknown>[]) {
  const { error: e } = await db.from("products").upsert(rows, { onConflict: "merchant_id,external_id" });
  if (e) throw e;
}
