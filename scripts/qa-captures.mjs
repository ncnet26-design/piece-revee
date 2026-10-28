/**
 * Protocole de contrôle visuel : capture les pages principales à trois tailles d'écran
 * (images WebP réduites). Comparer docs/qa/avant et docs/qa/apres : voir docs/qa/README.md. Usage : node scripts/qa-captures.mjs <dossier> [pages…]
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const OUT = process.argv[2] ?? "docs/qa/capture";
const PAGES = process.argv.slice(3).length ? process.argv.slice(3) : ["/", "/studio/", "/showroom/", "/planche/", "/transformer/", "/concept/", "/visite-3d/", "/galerie/"];
const SIZES = [["ordinateur", 1440, 900], ["tablette", 834, 1112], ["mobile", 390, 844]];
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [name, w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: name === "mobile", hasTouch: name !== "ordinateur" });
  await ctx.addInitScript(() => { try { localStorage.setItem("pr_camille_guide", "off"); localStorage.setItem("pr_camille_vu", "1"); localStorage.setItem("pr_home3d_hint", "1"); } catch { /* */ } });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    const slug = p === "/" ? "accueil" : p.replace(/\//g, "");
    try {
      await page.goto(`http://localhost:4173${p}`, { waitUntil: "networkidle", timeout: 60000 });
    } catch { /* la 3D garde parfois le réseau actif */ }
    // Défilement complet : déclenche les images différées et les apparitions au défilement.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(2500);
    const file = `${OUT}/${slug}-${name}.webp`;
    const png = await page.screenshot({ fullPage: true, timeout: 60000 }).catch(() => page.screenshot({ timeout: 60000 }));
    // Coupé à 9000 px de haut, réduit et compressé pour rester léger dans le dépôt.
    const meta = await sharp(png).metadata();
    await sharp(png).extract({ left: 0, top: 0, width: meta.width, height: Math.min(meta.height, 9000) }).resize({ width: Math.min(meta.width, 900) }).webp({ quality: 70 }).toFile(file);
    console.log("✓", file);
  }
  await ctx.close();
}
await browser.close();
