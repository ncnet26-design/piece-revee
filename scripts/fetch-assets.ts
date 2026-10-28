/**
 * Robot de ressources (à lancer dans GitHub Actions, qui a accès à Internet) :
 *  1. textures photographiques PBR de Poly Haven (CC0) pour chaque matière : couleur, relief (normales), rugosité ;
 *  2. meubles et objets 3D de Poly Haven (CC0), convertis en .glb optimisés pour le web ;
 * Tout est enregistré avec source, auteurs et licence dans content/data/textures.json et content/data/models.json.
 * Usage : node --experimental-strip-types scripts/fetch-assets.ts [--textures] [--models]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

const UA = { "user-agent": "PieceRevee-AssetFetcher/1.0 (site d'aménagement intérieur ; téléchargement ponctuel d'assets CC0)" };
const API = "https://api.polyhaven.com";
const args = new Set(process.argv.slice(2));
const all = !args.has("--textures") && !args.has("--models") && !args.has("--picks");

type Asset = { name: string; type: number; categories: string[]; tags: string[]; download_count: number; authors: Record<string, string> };
async function json<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return (await r.json()) as T;
}
async function download(url: string, dest: string) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ——— 1. Textures ——— */
/** Matière du site → mots-clés recherchés dans le nom, les tags et les catégories Poly Haven (par ordre d'importance). */
const TEXTURES: Record<string, string[]> = {
  "m-chene": ["herringbone", "parquet", "oak", "wood floor", "laminate"],
  "m-chenefume": ["dark wood", "dark", "wood floor", "parquet"],
  "m-noyer": ["walnut", "dark wood", "wood"],
  "m-pin": ["pine", "planks", "wood"],
  "m-bouleau": ["plywood", "birch", "wood"],
  "m-teck": ["teak", "deck", "planks", "wood"],
  "m-composite": ["decking", "deck", "planks"],
  "m-bambou": ["bamboo"],
  "m-stratifie": ["laminate", "vinyl", "wood floor"],
  "m-travertin": ["travertine", "limestone", "beige stone"],
  "m-carrare": ["white marble", "marble"],
  "m-verde": ["green marble", "marble"],
  "m-ardoise": ["slate"],
  "m-bourgogne": ["limestone", "stone floor", "sandstone", "stone tiles"],
  "m-terrazzo": ["terrazzo"],
  "m-ciment": ["patterned tiles", "cement tiles", "encaustic", "floor tiles"],
  "m-tomette": ["hexagon", "terracotta", "clay tiles"],
  "m-terrecuite": ["terracotta", "clay", "tiles"],
  "m-gres": ["floor tiles", "porcelain", "ceramic tiles", "tiles"],
  "m-zellige": ["zellige", "glazed", "ceramic tiles"],
  "m-metro": ["subway", "white tiles", "bathroom tiles", "tiles"],
  "m-beton": ["concrete floor", "polished concrete", "concrete"],
  "m-microciment": ["smooth concrete", "concrete", "plaster"],
  "m-chaux": ["lime", "white plaster", "plaster", "stucco"],
  "m-argile": ["clay plaster", "rough plaster", "plaster"],
  "m-tadelakt": ["plaster", "stucco"],
  "m-brique": ["brick wall", "brick"],
  "m-gravier": ["gravel", "pebbles"],
  "m-pierre-seche": ["stone wall", "rock wall", "dry stone", "stone"],
  "m-pelouse": ["grass", "lawn"],
  "m-lin": ["linen", "fabric"],
  "m-velours": ["velvet", "fabric"],
  "m-laine": ["wool", "knit", "fabric"],
  "m-bouclette": ["boucle", "wool", "fabric"],
  "m-cuir": ["leather"],
  "m-feutre": ["felt", "fabric"],
  "m-jute": ["jute", "sisal", "woven", "rug"],
  "m-cannage": ["rattan", "wicker", "cane"],
  "m-corten": ["rust", "rusty metal", "corroded"],
};

function score(a: Asset, id: string, words: string[]): number {
  const hay = `${a.name} ${id.replace(/_/g, " ")} ${a.tags.join(" ")} ${a.categories.join(" ")}`.toLowerCase();
  return words.reduce((s, w, i) => s + (hay.includes(w) ? (words.length - i) * 10 : 0), 0);
}

async function fetchTextures() {
  const list = await json<Record<string, Asset>>(`${API}/assets?type=textures`);
  const used = new Set<string>();
  const manifest: Record<string, { assetId: string; name: string; url: string; authors: string[]; license: string; tile: number }> = {};
  for (const [mat, words] of Object.entries(TEXTURES)) {
    const ranked = Object.entries(list)
      .map(([id, a]) => ({ id, a, s: score(a, id, words) - (used.has(id) ? 15 : 0) }))
      .filter((x) => x.s > 0)
      .sort((p, q) => q.s - p.s || q.a.download_count - p.a.download_count);
    const pick = ranked[0];
    if (!pick) { console.log(`✗ ${mat} : rien trouvé`); continue; }
    try {
      const files = await json<Record<string, Record<string, Record<string, { url: string }>>>>(`${API}/files/${pick.id}`);
      const key = (re: RegExp) => Object.keys(files).find((k) => re.test(k));
      const maps: Array<[string, string | undefined]> = [["diff", key(/^diff/i)], ["nor", key(/^nor_gl$/i)], ["rough", key(/^rough$/i)]];
      const dir = join("public/textures", mat);
      rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
      for (const [name, k] of maps) {
        const src = k ? files[k]?.["1k"]?.jpg?.url ?? files[k]?.["1k"]?.png?.url : undefined;
        if (!src) continue;
        const r = await fetch(src, { headers: UA }); if (!r.ok) continue;
        await sharp(Buffer.from(await r.arrayBuffer())).resize(1024, 1024, { fit: "cover" }).webp({ quality: name === "diff" ? 82 : 88 }).toFile(join(dir, `${name}.webp`));
      }
      if (!existsSync(join(dir, "diff.webp"))) { console.log(`✗ ${mat} : pas de texture couleur`); continue; }
      used.add(pick.id);
      // Taille réelle couverte par la texture : Poly Haven indique souvent la dimension dans les tags (« 2m », « 1x1m »), sinon 2 m.
      const dim = pick.a.tags.map((t) => /^(\d+(?:\.\d+)?)\s*m$/.exec(t)?.[1]).find(Boolean);
      manifest[mat] = { assetId: pick.id, name: pick.a.name, url: `https://polyhaven.com/a/${pick.id}`, authors: Object.keys(pick.a.authors), license: "CC0 1.0", tile: dim ? Number(dim) : 2 };
      console.log(`✓ ${mat} ← ${pick.a.name}`);
    } catch (e) { console.log(`✗ ${mat} : ${(e as Error).message}`); }
    await sleep(250);
  }
  writeFileSync("content/data/textures.json", `${JSON.stringify(manifest, null, 2)}\n`);
}

/* ——— 2. Modèles 3D ——— */
const MODEL_CATEGORIES = ["furniture", "seating", "table", "tables", "lighting", "decorative", "decor", "decorations", "plants", "shelving", "storage", "appliances", "electronics", "containers", "tableware", "kitchen", "bathroom", "office", "props"];
/** Hors intérieur (rue, chantier, armes, véhicules, nourriture…) : écartés. */
const MODEL_EXCLUDE = /(^|[\s_-])(street|lamp_?post|traffic|hydrant|dumpster|trash|bin|barrel|crate|pallet|industrial|military|weapon|gun|rifle|sword|car|truck|vehicle|bike|bicycle|tractor|rock|rocks|boulder|tree|stump|log|logs|food|fruit|bread|pizza|burger|meat|skull|bone|bones|tombstone|grave|fence|scaffold|construction|tool|tools|wrench|hammer|saw|drill|cone|sign|mailbox|gas|tank)(?=$|[\s_\d-])/i;
/** Objets écartés à la relecture (hors décoration intérieure) : jamais retéléchargés. */
const EXCLUS = new Set<string>(existsSync("content/data/models-exclus.json") ? JSON.parse((await import("node:fs")).readFileSync("content/data/models-exclus.json", "utf8")) : []);
const MAX_MODELS = Number(process.env.MAX_MODELS ?? 320);
const MAX_GLB = Number(process.env.MAX_GLB ?? 3_500_000);

async function fetchModels() {
  const list = await json<Record<string, Asset>>(`${API}/assets?type=models`);
  const picks = Object.entries(list)
    .filter(([id, a]) => a.categories.some((c) => MODEL_CATEGORIES.includes(c.toLowerCase())) && !MODEL_EXCLUDE.test(`${id} ${a.name} ${a.tags.join(" ")}`) && !EXCLUS.has(id) && !/fire_ext|garden_hose|telephone_wall|spacecraft/.test(id))
    .sort((p, q) => q[1].download_count - p[1].download_count)
    .slice(0, MAX_MODELS);
  type Entry = { id: string; name: string; categories: string[]; tags: string[]; file: string; url: string; authors: string[]; license: string; dims?: unknown };
  // On repart de la bibliothèque existante : les objets déjà présents ne sont ni retéléchargés ni perdus.
  let manifest: Entry[] = [];
  try { manifest = (JSON.parse((await import("node:fs")).readFileSync("content/data/models.json", "utf8")) as Entry[]).filter((m) => existsSync(join("public", m.file))); } catch { manifest = []; }
  console.log(`Bibliothèque existante : ${manifest.length} objets ; candidats Poly Haven : ${picks.length}`);
  const tmp = ".cache/models";
  for (const [id, a] of picks) {
    if (manifest.some((m) => m.id === id)) continue;
    try {
      const files = await json<{ gltf?: Record<string, { gltf?: { url: string; include?: Record<string, { url: string }> } }> }>(`${API}/files/${id}`);
      const g = files.gltf?.["1k"]?.gltf;
      if (!g) { console.log(`✗ ${id} : pas de glTF`); continue; }
      const total = Object.values(g.include ?? {}).reduce((n, f) => n + ((f as { size?: number }).size ?? 0), 0);
      if (total > 40_000_000) { console.log(`✗ ${id} : fichiers trop lourds`); continue; }
      const dir = join(tmp, id);
      rmSync(dir, { recursive: true, force: true });
      const main = join(dir, `${id}.gltf`);
      await download(g.url, main);
      for (const [rel, f] of Object.entries(g.include ?? {})) await download(f.url, join(dir, rel));
      const out = join("public/models", `${id}.glb`);
      mkdirSync("public/models", { recursive: true });
      execFileSync("node_modules/.bin/gltf-transform", ["optimize", main, out, "--texture-compress", "webp", "--texture-size", "1024", "--compress", "false"], { stdio: "ignore", timeout: 180_000 });
      rmSync(dir, { recursive: true, force: true });
      if (statSync(out).size > MAX_GLB) { rmSync(out); console.log(`✗ ${id} : trop lourd pour le web`); continue; }
      manifest.push({ id, name: a.name, categories: a.categories, tags: a.tags, file: `/models/${id}.glb`, url: `https://polyhaven.com/a/${id}`, authors: Object.keys(a.authors), license: "CC0 1.0" });
      writeFileSync("content/data/models.json", `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(`✓ ${a.name}`);
    } catch (e) { console.log(`✗ ${id} : ${(e as Error).message}`); }
    await sleep(250);
  }
  writeFileSync("content/data/models.json", `${JSON.stringify(manifest, null, 2)}\n`);
}

/* ——— 3. Textures choisies à la main (showroom) ——— */
/** content/data/texture-picks.json : { "clé-du-site": "identifiant Poly Haven" }, choisis sur les planches-contact du robot. */
async function fetchPicks() {
  const { readFileSync } = await import("node:fs");
  const picks = JSON.parse(readFileSync("content/data/texture-picks.json", "utf8")) as Record<string, string>;
  const out: Record<string, { assetId: string; name: string; url: string; authors: string[]; license: string; tile: number }> = {};
  const list = await json<Record<string, Asset>>(`${API}/assets?type=textures`);
  for (const [key, id] of Object.entries(picks)) {
    const a = list[id]; if (!a) { console.log(`✗ ${key} : ${id} introuvable`); continue; }
    try {
      const files = await json<Record<string, Record<string, Record<string, { url: string }>>>>(`${API}/files/${id}`);
      const k = (re: RegExp) => Object.keys(files).find((x) => re.test(x));
      const dir = join("public/textures", key);
      rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
      for (const [name, fk] of [["diff", k(/^diff/i)], ["nor", k(/^nor_gl$/i)], ["rough", k(/^rough$/i)]] as Array<[string, string | undefined]>) {
        const src = fk ? files[fk]?.["1k"]?.jpg?.url ?? files[fk]?.["1k"]?.png?.url : undefined;
        if (!src) continue;
        const r = await fetch(src, { headers: UA, signal: AbortSignal.timeout(60000) }); if (!r.ok) continue;
        await sharp(Buffer.from(await r.arrayBuffer())).resize(1024, 1024, { fit: "cover" }).webp({ quality: name === "diff" ? 84 : 88 }).toFile(join(dir, `${name}.webp`));
      }
      if (!existsSync(join(dir, "diff.webp"))) { console.log(`✗ ${key} : pas de couleur`); continue; }
      const dim = a.tags.map((t) => /^(\d+(?:\.\d+)?)\s*m$/.exec(t)?.[1]).find(Boolean);
      out[key] = { assetId: id, name: a.name, url: `https://polyhaven.com/a/${id}`, authors: Object.keys(a.authors), license: "CC0 1.0", tile: dim ? Number(dim) : 2 };
      writeFileSync("content/data/textures-showroom.json", `${JSON.stringify(out, null, 2)}\n`);
      console.log(`✓ ${key} ← ${a.name}`);
    } catch (e) { console.log(`✗ ${key} : ${(e as Error).message}`); }
    await sleep(200);
  }
  writeFileSync("content/data/textures-showroom.json", `${JSON.stringify(out, null, 2)}\n`);
}

if (args.has("--picks")) await fetchPicks();
if (all || args.has("--textures")) await fetchTextures();
if (all || args.has("--models")) await fetchModels();
