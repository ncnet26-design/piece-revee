/**
 * Planches avant / après : pour chaque page et taille, le haut de la page « avant » à gauche, « après » à droite.
 * Usage : node scripts/qa-comparatif.mjs  (lit docs/qa/avant et docs/qa/apres, écrit docs/qa/comparatif/)
 */
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import sharp from "sharp";

const A = "docs/qa/avant", B = "docs/qa/apres", OUT = "docs/qa/comparatif";
mkdirSync(OUT, { recursive: true });
const label = (t, w) => Buffer.from(`<svg width="${w}" height="56" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#F4F1EB"/><text x="16" y="36" font-family="Georgia, serif" font-size="26" fill="#1B1A17">${t}</text></svg>`);
for (const f of readdirSync(B).filter((f) => f.endsWith(".webp") && existsSync(`${A}/${f}`))) {
  const mobile = f.includes("mobile"), W = mobile ? 390 : 900, H = mobile ? 1600 : 1400;
  const top = async (p) => { const m = await sharp(p).metadata(); return sharp(p).resize({ width: W }).extract({ left: 0, top: 0, width: W, height: Math.min(H, Math.round((m.height * W) / m.width)) }).png().toBuffer(); };
  const [a, b] = await Promise.all([top(`${A}/${f}`), top(`${B}/${f}`)]);
  const ha = (await sharp(a).metadata()).height, hb = (await sharp(b).metadata()).height, gap = 24;
  await sharp({ create: { width: W * 2 + gap, height: Math.max(ha, hb) + 56, channels: 3, background: "#F4F1EB" } })
    .composite([{ input: label("Avant", W), left: 0, top: 0 }, { input: label("Après", W), left: W + gap, top: 0 }, { input: a, left: 0, top: 56 }, { input: b, left: W + gap, top: 56 }])
    .webp({ quality: 72 }).toFile(`${OUT}/${f}`);
  console.log("✓", f);
}
