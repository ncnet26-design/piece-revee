/**
 * Intègre des images IA validées dans le site : JPEG reçu → WebP 1600 px et vignette 640 px dans public/editorial/ia/,
 * puis met à jour la banque d'inspiration (l'ancienne planche reste disponible dans le champ « planche »).
 * Usage : node scripts/ia-integrer.mjs <dossier des JPEG> <id> [id…]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const [dir, ...ids] = process.argv.slice(2);
const bank = JSON.parse(readFileSync("content/data/inspiration-bank.json", "utf8"));
mkdirSync("public/editorial/ia", { recursive: true });
for (const id of ids) {
  const meta = JSON.parse(readFileSync(`${dir}/${id}.json`, "utf8"));
  const src = `public/editorial/ia/${id}.webp`;
  const info = await sharp(`${dir}/${id}.jpg`).resize({ width: 1600 }).webp({ quality: 84 }).toFile(src);
  await sharp(`${dir}/${id}.jpg`).resize({ width: 640 }).webp({ quality: 80 }).toFile(`public/editorial/ia/${id}-640.webp`);
  writeFileSync(`public/editorial/ia/${id}.json`, `${JSON.stringify({ ...meta, usage_tokens: undefined }, null, 2)}\n`);
  const e = bank.find((b) => b.id === id || b.id === `matiere-${id}` || b.id === id.replace(/-essai$/, ""));
  if (e) {
    if (e.image?.kind === "planche") e.planche = e.image.src;
    e.image = { kind: "ia", src: `/editorial/ia/${id}.webp`, width: info.width, height: info.height, credit: `Image générée par IA (${meta.generator.replace("Google gemini-nano-banana-2.1", "Google Nano Banana 2.1")}, ${meta.date.slice(0, 10)})`, license: "Création Pièce Rêvée", sourceUrl: null };
  }
  console.log("✓", id, e ? `→ ${e.id}` : "(hors banque)");
}
writeFileSync("content/data/inspiration-bank.json", `${JSON.stringify(bank, null, 2)}\n`);
