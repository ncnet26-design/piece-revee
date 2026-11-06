/**
 * Variantes de taille des photos du site (640, 1024, 1600, 2400 px de large) pour que chaque écran
 * charge la taille utile (srcset). Écrit lib/photos-variantes.json : pour chaque photo, les largeurs disponibles.
 * Ne touche jamais aux originaux. Usage : node scripts/variantes-images.mjs
 */
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const DOSSIERS = ["public/editorial/ia", "public/inspirations", "public/inspirations-ia"].filter((d) => existsSync(d));
const LARGEURS = [640, 1024];
const out = {};
for (const d of DOSSIERS) {
  const files = readdirSync(d).filter((f) => f.endsWith(".webp"));
  const bases = files.filter((f) => !/-(\d{3,4})\.webp$/.test(f));
  for (const f of bases) {
    const base = f.replace(/\.webp$/, "");
    const src = join(d, f);
    const meta = await sharp(src).metadata();
    const widths = new Set([meta.width]);
    for (const w of LARGEURS) {
      if (w >= meta.width) continue;
      const dst = join(d, `${base}-${w}.webp`);
      if (!existsSync(dst)) await sharp(src).resize({ width: w }).webp({ quality: 78, effort: 5 }).toFile(dst);
      widths.add(w);
    }
    const big = join(d, `${base}-2400.webp`);
    if (existsSync(big)) widths.add(2400);
    out[`/${d.replace(/^public\//, "")}/${base}`] = { w: [...widths].sort((a, b) => a - b), ratio: +(meta.width / meta.height).toFixed(4) };
  }
}
writeFileSync("lib/photos-variantes.json", JSON.stringify(out, null, 0) + "\n");
console.log(`${Object.keys(out).length} photos référencées`);
