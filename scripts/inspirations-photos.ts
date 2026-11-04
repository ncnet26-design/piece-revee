/**
 * Robot (GitHub Actions) : vraies photos d'intérieur pour les 8 styles, depuis Unsplash (UNSPLASH_ACCESS_KEY)
 * ou, à défaut, Pixabay (PIXABAY_API_KEY). Les clés restent dans les secrets GitHub.
 *
 *   --inventaire   cherche des candidates par style, écrit .robot/photos/<style>.jpg (planche numérotée)
 *                  et .robot/photos/candidats.json (identifiant, taille, photographe, liens).
 *   --choix        lit content/data/inspirations-choix.json ({ style: ["unsplash:<id>", …] }) et écrit
 *                  content/data/inspirations-styles.json. Unsplash : on garde ses adresses (affichage depuis Unsplash,
 *                  obligatoire) et on signale l'utilisation (download_location) comme le demandent ses règles.
 *
 * Usage : node --experimental-strip-types scripts/inspirations-photos.ts --inventaire | --choix
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const U = process.env.UNSPLASH_ACCESS_KEY, P = process.env.PIXABAY_API_KEY;
const OUT = ".robot/photos";

/** Recherches par style (anglais), tirées des marqueurs de signatures-styles. */
export const RECHERCHES: Record<string, string[]> = {
  japandi: ["japandi living room", "japandi bedroom oak linen", "japanese minimalist interior wood"],
  scandinave: ["scandinavian living room", "scandinavian dining room wood chairs", "nordic interior white wood"],
  industriel: ["industrial loft living room brick", "loft interior steel windows", "industrial apartment concrete"],
  haussmannien: ["parisian apartment interior moulding", "paris apartment herringbone parquet fireplace", "haussmann apartment living room"],
  "mid-century": ["mid century modern living room walnut", "mid century interior teak sideboard", "mid century modern lounge"],
  "wabi-sabi": ["wabi sabi interior", "lime plaster interior minimal", "wabi sabi bedroom linen"],
  boheme: ["bohemian living room rattan plants", "boho interior jute rug", "rattan chair living room plants"],
  contemporain: ["contemporary living room travertine", "modern luxury living room curved sofa", "minimalist contemporary interior stone"],
};

type Cand = { ref: string; w: number; h: number; auteur: string; auteur_url: string; page: string; thumb: string; full: string; download_location?: string; alt: string };
const get = async (u: string, h: Record<string, string> = {}) => { const r = await fetch(u, { headers: { "user-agent": "PieceRevee-Inspirations/1.0", ...h }, signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error(`${r.status} ${u.split("?")[0]}`); return r; };

async function unsplash(q: string): Promise<Cand[]> {
  const j = (await (await get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=30&orientation=landscape&content_filter=high`, { Authorization: `Client-ID ${U}`, "Accept-Version": "v1" })).json()) as { results: Array<{ id: string; width: number; height: number; alt_description: string | null; description: string | null; urls: { raw: string; small: string }; links: { html: string; download_location: string }; user: { name: string; links: { html: string } } }> };
  return j.results.map((r) => ({ ref: `unsplash:${r.id}`, w: r.width, h: r.height, auteur: r.user.name, auteur_url: r.user.links.html, page: r.links.html, thumb: r.urls.small, full: r.urls.raw, download_location: r.links.download_location, alt: r.alt_description ?? r.description ?? "" }));
}
async function pixabay(q: string): Promise<Cand[]> {
  const j = (await (await get(`https://pixabay.com/api/?key=${P}&q=${encodeURIComponent(q)}&image_type=photo&orientation=horizontal&min_width=2000&per_page=30&safesearch=true`)).json()) as { hits: Array<{ id: number; imageWidth: number; imageHeight: number; user: string; user_id: number; pageURL: string; webformatURL: string; largeImageURL: string; tags: string }> };
  return j.hits.map((r) => ({ ref: `pixabay:${r.id}`, w: r.imageWidth, h: r.imageHeight, auteur: r.user, auteur_url: `https://pixabay.com/users/${r.user}-${r.user_id}/`, page: r.pageURL, thumb: r.webformatURL, full: r.largeImageURL, alt: r.tags }));
}

async function inventaire() {
  mkdirSync(OUT, { recursive: true });
  const source = U ? "unsplash" : P ? "pixabay" : null;
  console.log(`Clés présentes : Unsplash ${U ? "oui" : "non"}, Pixabay ${P ? "oui" : "non"} → source : ${source ?? "aucune"}`);
  if (!source) { writeFileSync(`${OUT}/candidats.json`, "{}"); return; }
  const tout: Record<string, Cand[]> = {};
  for (const [style, qs] of Object.entries(RECHERCHES)) {
    const vus = new Set<string>(), l: Cand[] = [];
    for (const q of qs) {
      try { for (const c of await (source === "unsplash" ? unsplash(q) : pixabay(q))) if (!vus.has(c.ref) && c.w >= 2000) { vus.add(c.ref); l.push(c); } }
      catch (e) { console.log(`✗ ${style} « ${q} » : ${String(e)}`); }
    }
    tout[style] = l.slice(0, 48);
    // Planche numérotée (le numéro sert à choisir).
    const C = 300, R = 210, COLS = 8, tiles: sharp.OverlayOptions[] = [];
    await Promise.all(tout[style]!.map(async (c, i) => {
      try {
        const img = await sharp(Buffer.from(await (await get(c.thumb)).arrayBuffer())).resize(C, R, { fit: "cover" }).jpeg().toBuffer();
        const x = (i % COLS) * C, y = Math.floor(i / COLS) * (R + 22);
        tiles.push({ input: img, left: x, top: y });
        tiles.push({ input: Buffer.from(`<svg width="${C}" height="22" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111"/><text x="4" y="15" font-family="sans-serif" font-size="13" fill="#fff">${i} · ${c.w}px</text></svg>`), left: x, top: y + R });
      } catch { /* vignette indisponible */ }
    }));
    const rows = Math.max(1, Math.ceil(tout[style]!.length / COLS));
    await sharp({ create: { width: COLS * C, height: rows * (R + 22), channels: 3, background: "#222" } }).composite(tiles).jpeg({ quality: 82 }).toFile(`${OUT}/${style}.jpg`);
    console.log(`✓ ${style} : ${tout[style]!.length} candidates de 2000 px ou plus`);
  }
  writeFileSync(`${OUT}/candidats.json`, JSON.stringify({ source, styles: tout }, null, 1));
}

async function choix() {
  const c = JSON.parse(readFileSync(`${OUT}/candidats.json`, "utf8")) as { source: string; styles: Record<string, Cand[]> };
  const ch = JSON.parse(readFileSync("content/data/inspirations-choix.json", "utf8")) as Record<string, number[]>;
  const out: Record<string, unknown[]> = {};
  for (const [style, nums] of Object.entries(ch)) {
    out[style] = [];
    for (const n of nums) {
      const x = c.styles[style]?.[n]; if (!x) continue;
      // Règle Unsplash : signaler l'utilisation de la photo.
      if (x.download_location && U) { try { await get(x.download_location, { Authorization: `Client-ID ${U}` }); } catch { /* sans effet sur l'affichage */ } }
      out[style]!.push({ ref: x.ref, src: x.full, largeur: x.w, hauteur: x.h, auteur: x.auteur, auteur_url: x.auteur_url, page: x.page, alt: x.alt, source: c.source });
    }
  }
  writeFileSync("content/data/inspirations-styles.json", JSON.stringify(out, null, 1));
  console.log(Object.entries(out).map(([s, l]) => `${s}: ${l.length}`).join(", "));
}

if (process.argv.includes("--inventaire")) await inventaire();
if (process.argv.includes("--choix")) await choix();
