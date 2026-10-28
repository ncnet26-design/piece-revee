/**
 * Visuels éditoriaux originaux, composés uniquement à partir de textures photographiées CC0 (Poly Haven, ambientCG)
 * déjà présentes dans public/materiaux :
 *  - public/editorial/matieres/<id>.webp : gros plan photographique d'une matière (teinte de la fiche pour les matières teintées) ;
 *  - public/editorial/planches/<id>.webp : planche de style (échantillons superposés, ombres douces, pastilles de couleur).
 * Usage : node scripts/editorial-assets.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const pbr = JSON.parse(readFileSync("content/data/materials-pbr.json", "utf8"));
const mats = Object.fromEntries(JSON.parse(readFileSync("content/data/materials-premium.json", "utf8")).map((m) => [m.id, m]));
const bank = JSON.parse(readFileSync("content/data/inspiration-bank.json", "utf8"));
mkdirSync("public/editorial/matieres", { recursive: true });
mkdirSync("public/editorial/planches", { recursive: true });

const hex = (h) => { const n = parseInt(h.slice(1), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; };

/** Gros plan d'une matière, avec une lumière rasante douce (dégradé) pour donner du volume. */
async function swatch(id, size) {
  const m = mats[id];
  if (!m) throw new Error(`matière inconnue ${id}`);
  if (id.startsWith("laiton") || id === "bronze-brosse" || id === "inox-brosse" || id === "chrome-poli" || id === "noir-mat") return metal(m, size);
  const e = pbr[id];
  if (!e) {
    // Pas de photographie fiable : aplat sobre de la couleur de la fiche, grain très fin (jamais une fausse matière).
    const grain = await sharp({ create: { width: size, height: size, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 6 } } }).greyscale().png().toBuffer();
    return sharp({ create: { width: size, height: size, channels: 3, background: hex(m.baseColor) } }).composite([{ input: grain, blend: "soft-light" }]).png().toBuffer();
  }
  let img = sharp(`public${e.dir}/${e.maps.basecolor}`).extract({ left: 512, top: 512, width: 1024, height: 1024 }).resize(size, size);
  if (m.pbr.tint) {
    // Matière teintée : photo désaturée, nuances adoucies (k), luminosité moyenne = celle de la couleur de la fiche.
    const k = m.pbr.textureContrast ?? 0.5;
    const grey = await img.greyscale().png().toBuffer();
    const mean = (await sharp(grey).stats()).channels[0].mean;
    const c = hex(m.baseColor), L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    img = sharp(await sharp(grey).linear(k, L - k * mean).png().toBuffer()).tint(c);
  }
  const light = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  return img.composite([{ input: light, blend: "over" }]).png().toBuffer();
}
/** Métal brossé calculé (aucune photo libre de qualité disponible) : stries fines et reflet étiré. */
async function metal(m, size) {
  const c = hex(m.baseColor), L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  // Stries horizontales : une colonne de bruit étirée sur la largeur.
  const col = await sharp({ create: { width: 1, height: size, channels: 3, noise: { type: "gaussian", mean: L, sigma: 14 } } }).greyscale().png().toBuffer();
  const streaks = await sharp(col).resize(size, size, { kernel: "nearest", fit: "fill" }).blur(0.5).png().toBuffer();
  const sheen = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const tinted = await sharp(streaks).tint(c).png().toBuffer();
  return sharp(tinted).composite([{ input: sheen, blend: "soft-light" }]).png().toBuffer();
}
/** Ombre portée douce sous un échantillon. */
async function shadow(w, h, blur = 18, opacity = 0.22) {
  const pad = blur * 3;
  return sharp({ create: { width: w + pad * 2, height: h + pad * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp({ create: { width: w, height: h, channels: 4, background: { r: 40, g: 30, b: 20, alpha: opacity } } }).png().toBuffer(), left: pad, top: pad }])
    .blur(blur).png().toBuffer();
}

// 1. Gros plans des matières citées par la banque.
const used = new Set(bank.flatMap((b) => b.materials));
for (const id of used) {
  try {
    const buf = await swatch(id, 1200);
    await sharp(buf).webp({ quality: 84 }).toFile(`public/editorial/matieres/${id}.webp`);
  } catch (e) { console.log("✗", id, e.message); }
}

// 2. Planches : composition fixe et calme (grand fond, deux moyens, un petit, palette).
const W = 1600, H = 1200, PAPER = { r: 241, g: 237, b: 230 };
const SLOTS = [[110, 120, 760, 900], [760, 170, 560, 560], [930, 640, 420, 420], [600, 760, 300, 300], [1250, 120, 240, 240]];
for (const b of bank.filter((x) => x.image?.kind === "planche")) {
  const layers = [];
  for (const [i, id] of b.materials.slice(0, SLOTS.length).entries()) {
    const [x, y, w, h] = SLOTS[i];
    const tile = await sharp(await swatch(id, Math.max(w, h))).resize(w, h, { fit: "cover" }).png().toBuffer();
    const sh = await shadow(w, h);
    layers.push({ input: sh, left: x - 54 + 10, top: y - 54 + 18 }, { input: tile, left: x, top: y });
  }
  // Pastilles de la palette, alignées en bas à gauche.
  b.palette.slice(0, 5).forEach((c, i) => {
    layers.push({ input: Buffer.from(`<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="${c}" stroke="rgba(0,0,0,.08)"/></svg>`), left: 120 + i * 78, top: 1060 });
  });
  await sharp({ create: { width: W, height: H, channels: 3, background: PAPER } }).composite(layers).webp({ quality: 82 }).toFile(`public/editorial/planches/${b.id}.webp`);
  console.log("✓ planche", b.id);
}
writeFileSync("public/editorial/LICENCES.txt", "Visuels composés pour Pièce Rêvée à partir de textures CC0 (Poly Haven, ambientCG ; voir content/data/materials-pbr.json). Métaux : textures calculées.\n");
