/**
 * Robot (GitHub Actions) : photos d'inspiration libres de droits, choisies à la main.
 *  --candidats : cherche des photos par collection (villas, haussmannien…) sur Openverse, Wikimedia Commons,
 *                et Unsplash/Pexels si leurs clés existent ; écrit .robot/inspirations/candidats.json et des planches-contact numérotées.
 *  --choix     : télécharge les photos retenues (content/data/inspiration-picks.json : { collection: [numéros] })
 *                dans public/inspirations/ (1600 px et vignette 640 px) et écrit content/data/inspirations.json avec auteur, source et licence.
 * Seules les licences qui autorisent l'usage commercial sont gardées.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const UA = { "user-agent": "PieceReveeInspirations/1.0 (curation manuelle de photos libres)" };
const get = (url: string, init: RequestInit = {}) => fetch(url, { ...init, headers: { ...UA, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(25000) }).catch(() => new Response(null, { status: 599 }));
type Cand = { n: number; collection: string; url: string; thumb: string; width: number; height: number; title: string; author: string; authorUrl: string | null; source: string; sourceUrl: string; license: string };

export const COLLECTIONS: Array<{ id: string; label: string; queries: string[] }> = [
  { id: "villas", label: "Villas d'architecte", queries: ["modern villa interior", "luxury villa living room", "contemporary villa architecture", "villa swimming pool modern", "mediterranean villa interior"] },
  { id: "haussmann", label: "Appartements haussmanniens", queries: ["haussmann apartment", "parisian apartment interior", "paris apartment moulding fireplace", "herringbone parquet apartment paris"] },
  { id: "design", label: "Appartements de designer", queries: ["luxury apartment interior", "penthouse interior design", "minimalist apartment interior", "designer living room interior"] },
  { id: "chambres", label: "Chambres et suites", queries: ["luxury bedroom interior", "hotel suite interior", "boutique hotel room"] },
  { id: "cuisines", label: "Cuisines d'exception", queries: ["luxury kitchen marble", "modern kitchen island interior", "designer kitchen"] },
  { id: "bains", label: "Salles de bain", queries: ["luxury bathroom marble", "spa bathroom interior", "freestanding bathtub interior"] },
  { id: "lofts", label: "Lofts et ateliers", queries: ["loft interior design", "industrial loft living room"] },
  { id: "chateaux", label: "Châteaux et demeures", queries: ["chateau interior salon", "french chateau grand salon"] },
  { id: "exterieurs", label: "Terrasses et jardins", queries: ["rooftop terrace design", "villa garden pool", "mediterranean garden terrace"] },
];

async function openverse(q: string, collection: string): Promise<Omit<Cand, "n">[]> {
  const r = await get(`https://api.openverse.org/v1/images/?page_size=40&license_type=commercial&category=photograph&size=large&aspect_ratio=wide&mature=false&q=${encodeURIComponent(q)}`);
  if (!r.ok) { console.log(`Openverse ${r.status} pour « ${q} »`); return []; }
  const j = await r.json() as { results: Array<{ url: string; thumbnail: string; width: number | null; height: number | null; title: string; creator: string | null; creator_url: string | null; foreign_landing_url: string; license: string; license_version: string; source: string }> };
  return j.results.filter((p) => ["cc0", "pdm", "by", "by-sa"].includes(p.license) && p.url.startsWith("https://") && (p.width ?? 0) >= 1400)
    .map((p) => ({ collection, url: p.url, thumb: p.thumbnail, width: p.width ?? 0, height: p.height ?? 0, title: p.title, author: p.creator ?? "Auteur inconnu", authorUrl: p.creator_url, source: `Openverse (${p.source})`, sourceUrl: p.foreign_landing_url, license: p.license === "pdm" ? "Domaine public" : `CC ${p.license.toUpperCase()} ${p.license_version}` }));
}
async function commons(q: string, collection: string): Promise<Omit<Cand, "n">[]> {
  const r = await get(`https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=30&gsrsearch=${encodeURIComponent(q)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1600`);
  if (!r.ok) return [];
  const j = await r.json() as { query?: { pages: Record<string, { title: string; imageinfo?: Array<{ url: string; thumburl: string; width: number; height: number; descriptionurl: string; extmetadata: Record<string, { value: string }> }> }> } };
  return Object.values(j.query?.pages ?? {}).flatMap((p) => {
    const ii = p.imageinfo?.[0]; if (!ii || ii.width < 1600 || ii.width < ii.height) return [];
    const lic = ii.extmetadata.LicenseShortName?.value ?? "";
    if (!/^(CC0|CC BY(-SA)? [\d.]+|Public domain)/i.test(lic)) return [];
    return [{ collection, url: ii.thumburl, thumb: ii.thumburl, width: ii.width, height: ii.height, title: p.title.replace(/^File:|\.\w+$/g, ""), author: (ii.extmetadata.Artist?.value ?? "Auteur inconnu").replace(/<[^>]+>/g, "").trim(), authorUrl: null, source: "Wikimedia Commons", sourceUrl: ii.descriptionurl, license: lic }];
  });
}
async function pexels(q: string, collection: string): Promise<Omit<Cand, "n">[]> {
  const k = process.env.PEXELS_API_KEY; if (!k) return [];
  const r = await get(`https://api.pexels.com/v1/search?per_page=40&orientation=landscape&size=large&query=${encodeURIComponent(q)}`, { headers: { authorization: k } });
  if (!r.ok) return [];
  const j = await r.json() as { photos: Array<{ url: string; width: number; height: number; alt: string; photographer: string; photographer_url: string; src: { large2x: string; medium: string } }> };
  return j.photos.map((p) => ({ collection, url: p.src.large2x, thumb: p.src.medium, width: p.width, height: p.height, title: p.alt || q, author: p.photographer, authorUrl: p.photographer_url, source: "Pexels", sourceUrl: p.url, license: "Licence Pexels" }));
}
async function unsplash(q: string, collection: string): Promise<Omit<Cand, "n">[]> {
  const k = process.env.UNSPLASH_ACCESS_KEY; if (!k) return [];
  const r = await get(`https://api.unsplash.com/search/photos?per_page=30&orientation=landscape&query=${encodeURIComponent(q)}`, { headers: { authorization: `Client-ID ${k}` } });
  if (!r.ok) return [];
  const j = await r.json() as { results: Array<{ width: number; height: number; alt_description: string | null; urls: { regular: string; small: string }; links: { html: string }; user: { name: string; links: { html: string } } }> };
  return j.results.map((p) => ({ collection, url: p.urls.regular, thumb: p.urls.small, width: p.width, height: p.height, title: p.alt_description ?? q, author: p.user.name, authorUrl: `${p.user.links.html}?utm_source=piece_revee&utm_medium=referral`, source: "Unsplash", sourceUrl: `${p.links.html}?utm_source=piece_revee&utm_medium=referral`, license: "Licence Unsplash" }));
}

const OUT = ".robot/inspirations";
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

if (process.argv.includes("--candidats")) {
  mkdirSync(OUT, { recursive: true });
  const all: Cand[] = [];
  for (const c of COLLECTIONS) {
    for (const q of c.queries) {
      const found = [...await pexels(q, c.id), ...await unsplash(q, c.id), ...await openverse(q, c.id), ...await commons(q, c.id)];
      for (const p of found) if (!all.some((x) => x.url === p.url)) all.push({ ...p, n: all.length + 1 });
      await new Promise((r) => setTimeout(r, 700));
    }
    console.log(`${c.label} : ${all.filter((p) => p.collection === c.id).length} candidates`);
  }
  writeFileSync(`${OUT}/candidats.json`, JSON.stringify(all, null, 1));
  // Planches-contact numérotées (6 × 5 par page), pour choisir à l'œil.
  const W = 320, H = 200, COLS = 6;
  for (const c of COLLECTIONS) {
    const list = all.filter((p) => p.collection === c.id);
    for (let page = 0; page * 30 < list.length; page++) {
      const chunk = list.slice(page * 30, page * 30 + 30), tiles: sharp.OverlayOptions[] = [];
      await Promise.all(chunk.map(async (p, i) => {
        try {
          const res = await get(p.thumb); if (!res.ok) return;
          const img = await sharp(Buffer.from(await res.arrayBuffer())).resize(W, H, { fit: "cover" }).png().toBuffer();
          const x = (i % COLS) * W, y = Math.floor(i / COLS) * (H + 26);
          tiles.push({ input: img, left: x, top: y });
          tiles.push({ input: Buffer.from(`<svg width="${W}" height="26" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111"/><text x="6" y="18" font-family="sans-serif" font-size="15" fill="#fff">#${p.n} · ${esc(p.source.slice(0, 18))} · ${p.width}px</text></svg>`), left: x, top: y + H });
        } catch { /* vignette indisponible */ }
      }));
      const rows = Math.ceil(chunk.length / COLS);
      await sharp({ create: { width: COLS * W, height: rows * (H + 26), channels: 3, background: "#222" } }).composite(tiles).jpeg({ quality: 80 }).toFile(`${OUT}/${c.id}-${page + 1}.jpg`);
    }
  }
  console.log(`Total : ${all.length} candidates`);
}

if (process.argv.includes("--choix")) {
  const cands = JSON.parse(readFileSync(`${OUT}/candidats.json`, "utf8")) as Cand[];
  const picks = JSON.parse(readFileSync("content/data/inspiration-picks.json", "utf8")) as Record<string, number[]>;
  const prev = existsSync("content/data/inspirations.json") ? JSON.parse(readFileSync("content/data/inspirations.json", "utf8")) as Array<{ id: string }> : [];
  mkdirSync("public/inspirations", { recursive: true });
  const out: Array<Record<string, unknown>> = [];
  for (const [collection, nums] of Object.entries(picks)) {
    for (const n of nums) {
      const p = cands.find((x) => x.n === n); if (!p) { console.log(`✗ #${n} introuvable`); continue; }
      const id = `${collection}-${n}`;
      try {
        if (!existsSync(`public/inspirations/${id}.webp`)) {
          const res = await get(p.url); if (!res.ok) { console.log(`✗ #${n} : ${res.status}`); continue; }
          const buf = Buffer.from(await res.arrayBuffer());
          await sharp(buf).rotate().resize(1600, 1100, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(`public/inspirations/${id}.webp`);
          await sharp(buf).rotate().resize(640, 440, { fit: "cover" }).webp({ quality: 78 }).toFile(`public/inspirations/${id}-640.webp`);
        }
        const meta = await sharp(`public/inspirations/${id}.webp`).metadata();
        out.push({ id, collection, src: `/inspirations/${id}.webp`, thumb: `/inspirations/${id}-640.webp`, width: meta.width, height: meta.height, title: p.title, author: p.author, authorUrl: p.authorUrl, source: p.source, sourceUrl: p.sourceUrl, license: p.license });
        console.log(`✓ ${id}`);
      } catch (e) { console.log(`✗ #${n} : ${(e as Error).message}`); }
    }
  }
  writeFileSync("content/data/inspirations.json", JSON.stringify(out.length ? out : prev, null, 1));
}
