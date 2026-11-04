/**
 * Inventaire de toutes les images de public/ : dimensions réelles, poids, fichiers du site qui les utilisent.
 * Sortie : docs/audit/images.json (lu pour écrire audit-images.md). Usage : node scripts/audit-images.mjs
 */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, extname, basename } from "node:path";
import sharp from "sharp";

const EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif", ".svg"]);
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const images = walk("public").filter((f) => EXT.has(extname(f).toLowerCase()));
const sources = ["app", "components", "lib", "content"].flatMap((d) => walk(d)).filter((f) => /\.(tsx?|json|css|mjs)$/.test(f));
const texts = sources.map((f) => [f, readFileSync(f, "utf8")]);
const out = [];
for (const f of images) {
  const rel = "/" + f.replace(/^public\//, "");
  const base = rel.replace(/(-\d{3,4})?\.(webp|jpe?g|png|avif|gif|svg)$/i, "");
  let w = null, h = null;
  try { const m = await sharp(f).metadata(); w = m.width; h = m.height; } catch { /* svg ou illisible */ }
  // Un fichier est « utilisé » si son chemin, son chemin de base ou son dossier+nom apparaît dans le code ou les données.
  const dir = rel.split("/").slice(0, -1).join("/"), name = basename(base);
  const refs = texts.filter(([, t]) => t.includes(rel) || t.includes(base) || (t.includes(dir) && t.includes(name))).map(([p]) => p);
  out.push({ fichier: rel, largeur: w, hauteur: h, ko: Math.round(statSync(f).size / 1024), utilise_par: refs.slice(0, 6), nb_refs: refs.length });
}
mkdirSync("docs/audit", { recursive: true });
writeFileSync("docs/audit/images.json", JSON.stringify(out, null, 1));
const big = out.filter((x) => (x.largeur ?? 0) >= 2000).length;
console.log(`${out.length} images ; ${big} de 2000 px ou plus ; ${out.filter((x) => !x.nb_refs).length} sans référence trouvée`);
