/**
 * Robot (GitHub Actions) : inventaire des textures Poly Haven (CC0) pour choisir les plus réalistes.
 * Produit des planches-contact étiquetées par catégorie dans .robot/catalogue/ (relues avant tout choix).
 * Usage : node --experimental-strip-types scripts/texture-catalog.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const UA = { "user-agent": "PieceRevee-AssetFetcher/1.0 (inventaire ponctuel d'assets CC0)" };
const OUT = ".robot/catalogue";
const WANTED = ["fabric", "wood", "floor", "tiles", "marble", "stone", "plaster", "concrete", "terrazzo", "brick", "metal", "leather", "carpet", "wall", "rock", "terrain"];

type Asset = { name: string; categories: string[]; tags: string[]; download_count: number };
const r = await fetch("https://api.polyhaven.com/assets?type=textures", { headers: UA });
const list = (await r.json()) as Record<string, Asset>;
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/textures.json`, JSON.stringify(Object.fromEntries(Object.entries(list).map(([id, a]) => [id, { name: a.name, categories: a.categories, tags: a.tags }])), null, 1));

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
const CELL = 200, COLS = 8;
for (const cat of WANTED) {
  const ids = Object.entries(list).filter(([, a]) => a.categories.map((c) => c.toLowerCase()).includes(cat)).sort((p, q) => q[1].download_count - p[1].download_count).map(([id]) => id);
  if (!ids.length) continue;
  for (let page = 0; page * 48 < ids.length; page++) {
    const chunk = ids.slice(page * 48, page * 48 + 48);
    const tiles: sharp.OverlayOptions[] = [];
    await Promise.all(chunk.map(async (id, i) => {
      try {
        const res = await fetch(`https://cdn.polyhaven.com/asset_img/thumbs/${id}.png?width=${CELL}&height=${CELL}`, { headers: UA, signal: AbortSignal.timeout(20000) });
        if (!res.ok) return;
        const img = await sharp(Buffer.from(await res.arrayBuffer())).resize(CELL, CELL, { fit: "cover" }).png().toBuffer();
        const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * (CELL + 22);
        tiles.push({ input: img, left: x, top: y });
        tiles.push({ input: Buffer.from(`<svg width="${CELL}" height="22" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111"/><text x="4" y="15" font-family="sans-serif" font-size="12" fill="#fff">${esc(id.slice(0, 30))}</text></svg>`), left: x, top: y + CELL });
      } catch { /* vignette indisponible */ }
    }));
    const rows = Math.ceil(chunk.length / COLS);
    await sharp({ create: { width: COLS * CELL, height: rows * (CELL + 22), channels: 3, background: "#222" } }).composite(tiles).jpeg({ quality: 78 }).toFile(`${OUT}/${cat}-${page + 1}.jpg`);
    console.log(`✓ ${cat} ${page + 1} (${chunk.length})`);
  }
}
