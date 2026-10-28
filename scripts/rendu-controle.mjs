/**
 * Mesure du réalisme : capture chaque vue de la scène de contrôle dans l'ancien (« avant ») et le nouveau pipeline,
 * puis calcule des indicateurs objectifs : détail de surface (énergie du laplacien), contraste local, hautes lumières brûlées.
 * Usage : pnpm build, npx serve out -l 4173, puis node scripts/rendu-controle.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const VIEWS = ["generale", "bois", "murs", "pierre", "metal", "tissu"];
const OUT = "docs/rendu-controle";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

async function metrics(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  let lap = 0, n = 0, clipped = 0, sum = 0, sum2 = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, v = data[i];
    const l = 4 * v - data[i - 1] - data[i + 1] - data[i - w] - data[i + w];
    lap += Math.abs(l); n++; sum += v; sum2 += v * v; if (v >= 250) clipped++;
  }
  const mean = sum / n;
  return { detail: +(lap / n).toFixed(2), contraste: +Math.sqrt(sum2 / n - mean * mean).toFixed(1), brules_pct: +((clipped / n) * 100).toFixed(2), luminance: +mean.toFixed(1) };
}

const results = {};
for (const mode of ["avant", "apres"]) {
  for (const v of VIEWS) {
    await page.goto(`http://localhost:4173/studio/controle/?vue=${v}${mode === "avant" ? "&avant=1" : ""}`);
    await page.waitForSelector('[data-testid="qa-scene"][data-ready="1"]', { timeout: 180000 });
    const file = `${OUT}/${mode}-${v}.png`;
    const t = Date.now();
    const data = await page.evaluate(() => document.querySelector('[data-testid="qa-scene"] canvas').toDataURL("image/png"));
    writeFileSync(file, Buffer.from(data.split(",")[1], "base64"));
    console.log(`  capture ${Date.now() - t} ms`);
    results[`${mode}/${v}`] = await metrics(file);
    console.log(mode, v, results[`${mode}/${v}`]);
  }
}
await browser.close();
writeFileSync(`${OUT}/mesures.json`, JSON.stringify(results, null, 2));
// Planche avant | après
const W = 640, H = 360, tiles = [];
for (const [i, v] of VIEWS.entries()) for (const [j, mode] of ["avant", "apres"].entries())
  tiles.push({ input: await sharp(`${OUT}/${mode}-${v}.png`).resize(W, H, { fit: "cover" }).toBuffer(), left: j * W, top: i * H });
await sharp({ create: { width: 2 * W, height: VIEWS.length * H, channels: 3, background: "#ddd" } }).composite(tiles).jpeg({ quality: 82 }).toFile(`${OUT}/planche-avant-apres.jpg`);
console.log("Planche :", `${OUT}/planche-avant-apres.jpg`);
