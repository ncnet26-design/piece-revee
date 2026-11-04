/**
 * Robot (GitHub Actions, accès internet) : textures réelles CC0 en 4K pour la matériauthèque.
 *
 *   --inventaire    cherche des candidates sur Poly Haven et ambientCG pour chaque matière de MATIERES,
 *                   écrit .robot/matieres/<matiere>.jpg (planche de vignettes étiquetées) et candidats.json.
 *   --telecharger   lit content/data/matieres-choix.json ({ matiere: "ph:<id>" | "acg:<id>" }), télécharge la
 *                   texture couleur en 4K, écrit public/matieres/<matiere>/ : original 4K (WebP qualité 92),
 *                   AVIF et WebP en 640, 1280, 1920 et 3840 px ; et content/data/matieres-4k.json (crédits).
 *
 * Usage : node --experimental-strip-types scripts/matieres-4k.ts --inventaire | --telecharger
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const UA = { "user-agent": "PieceRevee-Matieres/1.0 (textures CC0, usage ponctuel)" };
const LARGEURS = [640, 1280, 1920, 3840];

/** Matières du site et mots-clés de recherche (anglais : langue des deux bibliothèques). */
export const MATIERES: Record<string, { nom: string; mots: string[] }> = {
  "chene-huile": { nom: "Chêne huilé", mots: ["oak", "wood floor", "oak veneer"] },
  "chene-fume": { nom: "Chêne fumé", mots: ["dark wood", "smoked oak", "dark oak"] },
  "parquet-point-de-hongrie": { nom: "Parquet point de Hongrie", mots: ["herringbone", "chevron", "parquet"] },
  noyer: { nom: "Noyer", mots: ["walnut"] },
  travertin: { nom: "Travertin", mots: ["travertine"] },
  "marbre-carrare": { nom: "Marbre de Carrare", mots: ["white marble", "carrara", "marble"] },
  terrazzo: { nom: "Terrazzo", mots: ["terrazzo"] },
  "beton-cire": { nom: "Béton ciré", mots: ["polished concrete", "concrete floor", "smooth concrete"] },
  "enduit-chaux": { nom: "Enduit à la chaux", mots: ["plaster", "stucco", "lime"] },
  "laiton-brosse": { nom: "Laiton brossé", mots: ["brushed metal", "brass", "gold metal"] },
  "lin-lave": { nom: "Lin lavé", mots: ["linen", "fabric linen"] },
  bouclette: { nom: "Bouclette", mots: ["boucle", "wool fabric", "towel", "terry"] },
  velours: { nom: "Velours", mots: ["velvet", "velour"] },
  cuir: { nom: "Cuir", mots: ["leather"] },
  rotin: { nom: "Rotin et cannage", mots: ["wicker", "rattan", "cane"] },
  brique: { nom: "Brique", mots: ["brick"] },
  zellige: { nom: "Zellige", mots: ["zellige", "glazed tiles", "ceramic tiles", "tiles"] },
  "terre-cuite": { nom: "Terre cuite (tomette)", mots: ["terracotta", "clay tiles", "terracotta floor"] },
  "pierre-calcaire": { nom: "Pierre calcaire", mots: ["limestone", "sandstone"] },
  ardoise: { nom: "Ardoise", mots: ["slate"] },
};

type PH = { name: string; categories: string[]; tags: string[]; download_count: number; authors: Record<string, string>; dimensions?: number[] };
type ACG = { assetId: string; displayName: string; tags?: string[]; previewImage?: Record<string, string>; downloadFolders?: { default?: { downloadFiletypeCategories?: { zip?: { downloads?: Array<{ attribute: string; downloadLink: string; size: number }> } } } } };

const get = async (u: string) => { const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(60000) }); if (!r.ok) throw new Error(`${r.status} ${u}`); return r; };
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

async function acgSearch(q: string): Promise<ACG[]> {
  const u = `https://ambientcg.com/api/v2/full_json?type=Material&q=${encodeURIComponent(q)}&include=downloadData,previewData,tagData&limit=8&sort=Popular`;
  try { return ((await (await get(u)).json()) as { foundAssets?: ACG[] }).foundAssets ?? []; } catch (e) { console.log("ambientCG", q, String(e)); return []; }
}

async function inventaire() {
  const OUT = ".robot/matieres"; mkdirSync(OUT, { recursive: true });
  const ph = (await (await get("https://api.polyhaven.com/assets?t=textures")).json()) as Record<string, PH>;
  const resume: Record<string, Array<{ ref: string; nom: string; detail: string }>> = {};
  for (const [slug, m] of Object.entries(MATIERES)) {
    const t = (s: string) => s.toLowerCase();
    const phHits = Object.entries(ph).filter(([id, a]) => m.mots.some((w) => [id.replace(/_/g, " "), a.name, ...a.tags, ...a.categories].some((x) => t(x).includes(t(w)))))
      .sort((p, q) => q[1].download_count - p[1].download_count).slice(0, 8)
      .map(([id, a]) => ({ ref: `ph:${id}`, nom: a.name, detail: `${a.dimensions ? `${a.dimensions.map((d) => d / 1000).join("×")} m` : ""} ${Object.keys(a.authors).join(", ")}`, thumb: `https://cdn.polyhaven.com/asset_img/thumbs/${id}.png?width=256&height=256` }));
    const acgHits: typeof phHits = [];
    for (const w of m.mots) for (const a of await acgSearch(w)) if (!acgHits.some((h) => h.ref === `acg:${a.assetId}`) && acgHits.length < 8)
      acgHits.push({ ref: `acg:${a.assetId}`, nom: a.displayName, detail: (a.tags ?? []).slice(0, 4).join(", "), thumb: a.previewImage?.["256-PNG"] ?? a.previewImage?.["128-PNG"] ?? "" });
    const all = [...phHits, ...acgHits];
    resume[slug] = all.map(({ ref, nom, detail }) => ({ ref, nom, detail }));
    const C = 256, COLS = 8, tiles: sharp.OverlayOptions[] = [];
    await Promise.all(all.map(async (h, i) => {
      try {
        const img = await sharp(Buffer.from(await (await get(h.thumb)).arrayBuffer())).resize(C, C, { fit: "cover" }).png().toBuffer();
        const x = (i % COLS) * C, y = Math.floor(i / COLS) * (C + 24);
        tiles.push({ input: img, left: x, top: y });
        tiles.push({ input: Buffer.from(`<svg width="${C}" height="24" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111"/><text x="4" y="16" font-family="sans-serif" font-size="13" fill="#fff">${esc(h.ref.slice(0, 34))}</text></svg>`), left: x, top: y + C });
      } catch { /* vignette indisponible */ }
    }));
    const rows = Math.max(1, Math.ceil(all.length / COLS));
    await sharp({ create: { width: COLS * C, height: rows * (C + 24), channels: 3, background: "#222" } }).composite(tiles).jpeg({ quality: 80 }).toFile(`${OUT}/${slug}.jpg`);
    console.log(`✓ ${slug} : ${phHits.length} Poly Haven, ${acgHits.length} ambientCG`);
  }
  writeFileSync(`${OUT}/candidats.json`, JSON.stringify(resume, null, 1));
}

async function telecharger() {
  const choix = JSON.parse(readFileSync("content/data/matieres-choix.json", "utf8")) as Record<string, string>;
  const credits: Record<string, unknown> = existsSync("content/data/matieres-4k.json") ? JSON.parse(readFileSync("content/data/matieres-4k.json", "utf8")) : {};
  const ph = (await (await get("https://api.polyhaven.com/assets?t=textures")).json()) as Record<string, PH>;
  const tmp = ".robot/tmp"; mkdirSync(tmp, { recursive: true });
  for (const [slug, ref] of Object.entries(choix)) {
    if (existsSync(`public/matieres/${slug}/original-4k.webp`) && (credits[slug] as { id?: string } | undefined)?.id === ref.split(":")[1]) { console.log(`= ${slug} déjà présent`); continue; }
    try {
      const [src, id] = ref.split(":") as ["ph" | "acg", string];
      let buf: Buffer, credit: Record<string, unknown>;
      if (src === "ph") {
        const files = (await (await get(`https://api.polyhaven.com/files/${id}`)).json()) as Record<string, Record<string, Record<string, { url: string }>>>;
        const k = Object.keys(files).find((x) => /^diff/i.test(x));
        const f = k ? files[k]?.["4k"]?.jpg ?? files[k]?.["4k"]?.png : undefined;
        if (!f) throw new Error("pas de texture couleur 4K");
        buf = Buffer.from(await (await get(f.url)).arrayBuffer());
        const a = ph[id]!;
        credit = { source: "Poly Haven", id, nom: a.name, auteurs: Object.keys(a.authors), licence: "CC0 1.0", url: `https://polyhaven.com/a/${id}`, dimensions_m: a.dimensions?.map((d) => d / 1000) ?? null };
      } else {
        const byId = `https://ambientcg.com/api/v2/full_json?id=${encodeURIComponent(id)}&include=downloadData`;
        const found = (((await (await get(byId)).json()) as { foundAssets?: ACG[] }).foundAssets ?? []).find((a) => a.assetId === id);
        const dl = found?.downloadFolders?.default?.downloadFiletypeCategories?.zip?.downloads?.find((d) => d.attribute === "4K-JPG");
        if (!dl) throw new Error("pas de 4K-JPG");
        const zip = `${tmp}/${id}.zip`; writeFileSync(zip, Buffer.from(await (await get(dl.downloadLink)).arrayBuffer()));
        rmSync(`${tmp}/${id}`, { recursive: true, force: true }); execFileSync("unzip", ["-q", "-o", zip, "-d", `${tmp}/${id}`]);
        const color = execFileSync("bash", ["-c", `ls ${tmp}/${id}/*_Color.jpg | head -1`]).toString().trim();
        buf = readFileSync(color);
        credit = { source: "ambientCG", id, nom: found?.displayName ?? id, auteurs: ["ambientCG (Lennart Demes)"], licence: "CC0 1.0", url: `https://ambientcg.com/view?id=${id}`, dimensions_m: null };
      }
      const dir = `public/matieres/${slug}`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
      const meta = await sharp(buf).metadata();
      await sharp(buf).webp({ quality: 92 }).toFile(`${dir}/original-4k.webp`);
      for (const w of LARGEURS) {
        if ((meta.width ?? 0) < w) continue;
        await sharp(buf).resize({ width: w }).avif({ quality: 55, effort: 4 }).toFile(`${dir}/${w}.avif`);
        await sharp(buf).resize({ width: w }).webp({ quality: 80 }).toFile(`${dir}/${w}.webp`);
      }
      credits[slug] = { ...credit, largeur: meta.width, hauteur: meta.height, telecharge_le: new Date().toISOString().slice(0, 10) };
      console.log(`✓ ${slug} ← ${ref} (${meta.width}×${meta.height})`);
    } catch (e) { console.log(`✗ ${slug} ← ${ref} : ${String(e)}`); }
  }
  writeFileSync("content/data/matieres-4k.json", JSON.stringify(credits, null, 1));
}

if (process.argv.includes("--inventaire")) await inventaire();
if (process.argv.includes("--telecharger")) await telecharger();
