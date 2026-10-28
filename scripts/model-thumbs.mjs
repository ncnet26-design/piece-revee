/**
 * Vignettes 240 × 240 (fond transparent) des modèles 3D de la bibliothèque, rendues dans un navigateur sans écran.
 * Usage : pnpm build, `npx serve out -l 4173`, puis node scripts/model-thumbs.mjs. Seuls les modèles sans vignette sont rendus.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { build } from "esbuild";
import { chromium } from "playwright";

await build({ entryPoints: ["scripts/thumbs-entry.ts"], bundle: true, format: "iife", outfile: "out/_thumbs.js", logLevel: "error" });
const models = JSON.parse(readFileSync("content/data/models.json", "utf8")).filter((m) => !existsSync(`public/models/thumbs/${m.id}.webp`));
console.log(`${models.length} vignettes à rendre`);
mkdirSync("public/models/thumbs", { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage();
await page.goto("http://localhost:4173/404.html");
await page.addScriptTag({ url: "/_thumbs.js" });
for (const m of models) {
  try {
    const data = await page.evaluate((file) => window.shoot(file), m.file);
    writeFileSync(`public/models/thumbs/${m.id}.webp`, Buffer.from(data.split(",")[1], "base64"));
    console.log(`✓ ${m.id}`);
  } catch (e) { console.log(`✗ ${m.id} : ${String(e.message).slice(0, 120)}`); }
}
await browser.close();
