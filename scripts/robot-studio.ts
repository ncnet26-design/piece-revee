/**
 * Robot (GitHub Actions) pour le Studio. Chaque option est indépendante :
 *  --veille   : lit les pages publiques des plateformes concurrentes (texte visible, titres, liens « API ») → .robot/veille/
 *  --pbr      : cartes PBR 2K (couleur, normales, rugosité, occlusion, déplacement, métal) depuis Poly Haven (CC0) → public/materiaux/<id>/
 *  --image    : images d'inspiration de la pièce témoin (FLUX.1 schnell via Pollinations, gratuit) → public/prototype/
 *  --produits : relit chaque fiche produit et extrait les données structurées (schema.org Product) → content/data/products-verification.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const UA = { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36", "accept-language": "fr-FR,fr;q=0.9,en;q=0.8" };
const get = (url: string) => fetch(url, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(30000) }).catch((e: Error) => ({ ok: false, status: 0, statusText: e.message, text: async () => "", json: async () => null, arrayBuffer: async () => new ArrayBuffer(0), headers: new Headers() }) as unknown as Response);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const text = (html: string) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<(h[1-4]|p|li|a|button|div|section)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();

/* ——— Veille concurrentielle ——— */
const SITES: Array<[string, string]> = [
  ["roomrecipe", "https://www.roomrecipe.app/"], ["gena", "https://gena-interior.com/en"], ["ouda", "https://ouda.ai/"],
  ["airender", "https://airender.ai/"], ["airender-tarifs", "https://airender.ai/pricing"], ["easyroom", "https://www.easyroomai.com/"], ["easyroom-api", "https://www.easyroomai.com/developers"],
  ["decorviz", "https://decorviz.ai/"], ["decorviz-api", "https://decorviz.ai/api-docs/"],
];
async function veille() {
  mkdirSync(".robot/veille", { recursive: true });
  for (const [id, url] of SITES) {
    const r = await get(url);
    const html = r.ok ? await r.text() : "";
    const meta = [...html.matchAll(/<meta[^>]+(?:name|property)="(description|og:description|og:title)"[^>]+content="([^"]*)"/gi)].map((m) => `${m[1]}: ${m[2]}`);
    const links = [...new Set([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!).filter((h) => /api|docs|developer|pricing|tarif|price|shop|terms|legal/i.test(h)))].slice(0, 40);
    const body = text(html).slice(0, 20000);
    writeFileSync(`.robot/veille/${id}.txt`, [`URL: ${url}`, `HTTP: ${r.status} ${r.statusText ?? ""}`, `Récupéré le : ${new Date().toISOString()}`, `Longueur HTML : ${html.length}`, "", ...meta, "", "Liens utiles :", ...links, "", "Texte visible :", body].join("\n"));
    console.log(`${r.ok ? "✓" : "✗"} ${id} (${r.status}, ${html.length} car.)`);
    await sleep(800);
  }
}

/* ——— Cartes PBR haute définition ——— */
type Asset = { name: string; tags: string[]; categories: string[]; download_count: number; authors: Record<string, string> };
async function pbr() {
  const mats = JSON.parse(readFileSync("content/data/materials-premium.json", "utf8")) as Array<{ id: string; textures: { kind: string; assetId?: string; search?: string[] } }>;
  const out = existsSync("content/data/materials-pbr.json") ? JSON.parse(readFileSync("content/data/materials-pbr.json", "utf8")) as Record<string, unknown> : {};
  const list = await (await get("https://api.polyhaven.com/assets?type=textures")).json() as Record<string, Asset>;
  for (const m of mats) {
    if (m.textures.kind !== "photo") continue;
    let id = m.textures.assetId;
    if (!id && m.textures.search) {
      for (const w of m.textures.search) {
        const hit = Object.entries(list).filter(([k, a]) => `${k} ${a.name} ${a.tags.join(" ")}`.toLowerCase().includes(w)).sort((a, b) => b[1].download_count - a[1].download_count)[0];
        if (hit) { id = hit[0]; break; }
      }
    }
    if (!id || !list[id]) {
      const ok = await ambient(m.id, m.textures.search ?? [], out);
      if (!ok) console.log(`✗ ${m.id} : aucune texture (Poly Haven, ambientCG)`);
      continue;
    }
    const files = await (await get(`https://api.polyhaven.com/files/${id}`)).json() as Record<string, Record<string, Record<string, { url: string }>>>;
    const key = (re: RegExp) => Object.keys(files).find((k) => re.test(k));
    const want: Array<[string, RegExp]> = [["basecolor", /^diff/i], ["normal", /^nor_gl$/i], ["roughness", /^rough$/i], ["ao", /^ao$/i], ["displacement", /^disp/i], ["metallic", /^metal/i]];
    const dir = `public/materiaux/${m.id}`; mkdirSync(dir, { recursive: true });
    const maps: Record<string, string> = {};
    for (const [name, re] of want) {
      const k = key(re); const src = k ? files[k]?.["2k"]?.jpg?.url ?? files[k]?.["2k"]?.png?.url : undefined;
      if (!src) continue;
      const r = await get(src); if (!r.ok) continue;
      await sharp(Buffer.from(await r.arrayBuffer())).resize(2048, 2048, { fit: "cover" }).webp({ quality: name === "basecolor" ? 86 : 90 }).toFile(`${dir}/${name}.webp`);
      maps[name] = `${name}.webp`;
    }
    if (!maps.basecolor) { console.log(`✗ ${m.id} : pas de couleur`); continue; }
    const a = list[id]!;
    out[m.id] = { assetId: id, name: a.name, url: `https://polyhaven.com/a/${id}`, authors: Object.keys(a.authors), license: "CC0 1.0", resolution: 2048, dir: `/materiaux/${m.id}`, maps };
    console.log(`✓ ${m.id} ← ${a.name} (${Object.keys(maps).join(", ")})`);
    await sleep(300);
  }
  writeFileSync("content/data/materials-pbr.json", `${JSON.stringify(out, null, 2)}\n`);
}

/** Repli ambientCG (CC0) : archive 2K-JPG, cartes Color / NormalGL / Roughness / AmbientOcclusion / Displacement / Metalness. */
async function ambient(id: string, terms: string[], out: Record<string, unknown>): Promise<boolean> {
  const { execFileSync } = await import("node:child_process");
  for (const term of terms) {
    const r = await get(`https://ambientcg.com/api/v2/full_json?type=Material&q=${encodeURIComponent(term)}&limit=5&sort=Popular&include=downloadData`);
    const j = await r.json().catch(() => null) as { foundAssets?: Array<{ assetId: string; displayName?: string; downloadFolders?: { default?: { downloadFiletypeCategories?: { zip?: { downloads?: Array<{ attribute: string; fullDownloadPath: string }> } } } } }> } | null;
    if (!j?.foundAssets) { console.log(`  ambientCG « ${term} » : réponse inattendue (${r.status}) ${JSON.stringify(j)?.slice(0, 200)}`); continue; }
    for (const a of j.foundAssets) {
      const dl = a.downloadFolders?.default?.downloadFiletypeCategories?.zip?.downloads?.find((d) => d.attribute === "2K-JPG");
      if (!dl) continue;
      const z = await get(dl.fullDownloadPath); if (!z.ok) continue;
      const tmp = `/tmp/acg-${a.assetId}`; mkdirSync(tmp, { recursive: true });
      writeFileSync(`${tmp}.zip`, Buffer.from(await z.arrayBuffer()));
      execFileSync("unzip", ["-o", "-q", `${tmp}.zip`, "-d", tmp]);
      const files = (await import("node:fs")).readdirSync(tmp);
      const pick = (re: RegExp) => files.find((f) => re.test(f));
      const want: Array<[string, RegExp]> = [["basecolor", /_Color\.jpg$/i], ["normal", /_NormalGL\.jpg$/i], ["roughness", /_Roughness\.jpg$/i], ["ao", /_AmbientOcclusion\.jpg$/i], ["displacement", /_Displacement\.jpg$/i], ["metallic", /_Metalness\.jpg$/i]];
      const dir = `public/materiaux/${id}`; mkdirSync(dir, { recursive: true });
      const maps: Record<string, string> = {};
      for (const [name, re] of want) { const f = pick(re); if (!f) continue; await sharp(`${tmp}/${f}`).resize(2048, 2048, { fit: "cover" }).webp({ quality: name === "basecolor" ? 86 : 90 }).toFile(`${dir}/${name}.webp`); maps[name] = `${name}.webp`; }
      if (!maps.basecolor) continue;
      out[id] = { assetId: a.assetId, name: a.displayName ?? a.assetId, url: `https://ambientcg.com/view?id=${a.assetId}`, authors: ["ambientCG (Lennart Demes)"], license: "CC0 1.0", resolution: 2048, dir: `/materiaux/${id}`, maps };
      console.log(`✓ ${id} ← ambientCG ${a.assetId} (${Object.keys(maps).join(", ")})`);
      return true;
    }
  }
  return false;
}

/* ——— Images d'inspiration de la pièce témoin ——— */
async function images() {
  const list = JSON.parse(readFileSync("content/data/prototype-prompts.json", "utf8")) as Array<{ id: string; prompt: string; width: number; height: number; seeds: number[] }>;
  mkdirSync("public/prototype", { recursive: true });
  for (const p of list) for (const seed of p.seeds) {
    const file = `public/prototype/${p.id}-${seed}.webp`;
    if (existsSync(file)) continue;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p.prompt)}?width=${p.width}&height=${p.height}&nologo=true&model=flux&seed=${seed}&enhance=false&private=true`;
    for (let i = 0; i < 3; i++) {
      const r = await get(url);
      if (r.ok && (r.headers.get("content-type") ?? "").startsWith("image/")) {
        await sharp(Buffer.from(await r.arrayBuffer())).webp({ quality: 88 }).toFile(file);
        console.log(`✓ ${file}`); break;
      }
      console.log(`  essai ${i + 1} : ${r.status}`); await sleep(15000);
    }
    await sleep(6000);
  }
}

/* ——— Vérification des fiches produits ——— */
async function produits() {
  const list = JSON.parse(readFileSync("content/data/products.json", "utf8")) as Array<{ id: string; url: string }>;
  const out: Record<string, unknown> = {};
  for (const p of list) {
    const r = await get(p.url);
    const html = r.ok ? await r.text() : "";
    const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => { try { const j = JSON.parse(m[1]!); return Array.isArray(j) ? j : j["@graph"] ?? [j]; } catch { return []; } }) as Array<Record<string, unknown>>;
    const prod = blocks.find((b) => String(b["@type"]).includes("Product"));
    const offers = prod?.offers as Record<string, unknown> | Array<Record<string, unknown>> | undefined;
    const offer = Array.isArray(offers) ? offers[0] : offers;
    out[p.id] = { checkedAt: new Date().toISOString(), http: r.status, finalUrl: r.url || p.url, title: /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? null,
      product: prod ? { name: prod.name ?? null, sku: prod.sku ?? null, mpn: prod.mpn ?? null, brand: (prod.brand as { name?: string } | undefined)?.name ?? prod.brand ?? null, image: Array.isArray(prod.image) ? prod.image[0] : prod.image ?? null,
        price: offer?.price ?? (offer as { lowPrice?: unknown } | undefined)?.lowPrice ?? null, currency: offer?.priceCurrency ?? null, availability: offer?.availability ?? null } : null };
    console.log(`${r.ok ? "✓" : "✗"} ${p.id} (${r.status}) ${prod ? "données produit trouvées" : "sans données structurées"}`);
    await sleep(1500);
  }
  writeFileSync("content/data/products-verification.json", `${JSON.stringify(out, null, 2)}\n`);
}

const args = process.argv.slice(2);
if (args.includes("--veille")) await veille();
if (args.includes("--pbr")) await pbr();
if (args.includes("--image")) await images();
if (args.includes("--produits")) await produits();
