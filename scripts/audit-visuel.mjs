/**
 * Audit visuel : inventaire et mesures de chaque image affichée par le site, planches contact pour la relecture.
 * Sorties : docs/audit/visuel.json, docs/audit/visuel.md (mesures), docs/audit/planches/*.webp.
 * La notation A/B/C se fait à la relecture des planches (compétence audit-visuel).
 * Usage : node scripts/audit-visuel.mjs
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import sharp from "sharp";

const OUT = "docs/audit";
mkdirSync(`${OUT}/planches`, { recursive: true });
const walk = (d, o = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p, o); else o.push(p); } return o; };
const code = ["app", "components", "lib", "content"].flatMap((d) => walk(d)).filter((f) => /\.(tsx?|json)$/.test(f) && !f.includes("catalogue")).map((f) => [f, readFileSync(f, "utf8")]);
const IMG = /\.(webp|jpe?g|png|avif)$/i;

// Groupes d'images affichées (les textures de la 3D et des matières PBR ne sont pas des images éditoriales).
const groups = [
  ["Images IA : styles", (f) => /editorial\/ia\/(parisien|haussmannien|minimalisme|scandinave|japandi|brutalisme|mid-century|art-deco|mediterraneen|campagne|luxe|contemporain)/.test(f)],
  ["Images IA : espaces", (f) => /editorial\/ia\/(salon\.|cuisine|salle-de-bain|chambre|entree|salle-a-manger|bureau|dressing|terrasse|jardin|facade)/.test(f)],
  ["Images IA : matières", (f) => /editorial\/ia\/matiere-/.test(f)],
  ["Images IA : accueil et Studio", (f) => /editorial\/ia\/(accueil|salon-boucle|salon-velours|art-deco-contemporain-2400)/.test(f)],
  ["Gros plans de textures (composés)", (f) => /editorial\/matieres\//.test(f)],
  ["Planches de style (composées)", (f) => /editorial\/planches\//.test(f)],
  ["Photographies d'architecture", (f) => /\/inspirations\//.test(f)],
  ["Anciens visuels", (f) => /\/visuels\//.test(f)],
];
const files = ["public/editorial", "public/inspirations", "public/visuels"].flatMap((d) => walk(d)).filter((f) => IMG.test(f) && !/-640\.webp$|-2400\.webp$/.test(f) || /art-deco-contemporain-2400/.test(f));

async function measure(f) {
  const img = sharp(f), m = await img.metadata();
  const small = await sharp(f).resize(32, 32, { fit: "fill" }).removeAlpha().raw().toBuffer();
  let sr = 0, sg = 0, sb = 0, sat = 0, lum = 0; const hist = new Array(64).fill(0);
  for (let i = 0; i < small.length; i += 3) {
    const r = small[i], g = small[i + 1], b = small[i + 2];
    sr += r; sg += g; sb += b;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    sat += mx ? (mx - mn) / mx : 0; lum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    hist[(r >> 6) * 16 + (g >> 6) * 4 + (b >> 6)]++;
  }
  const n = small.length / 3;
  const gray = await sharp(f).resize(9, 8, { fit: "fill" }).greyscale().raw().toBuffer();
  let hash = ""; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) hash += gray[y * 9 + x] < gray[y * 9 + x + 1] ? "1" : "0";
  const rel = "/" + relative("public", f);
  const users = code.filter(([, t]) => t.includes(rel) || t.includes(basename(f, extname(f)))).map(([p]) => p);
  return { path: rel, w: m.width, h: m.height, ratio: +(m.width / m.height).toFixed(3), kb: Math.round(statSync(f).size / 1024), format: m.format,
    mean: [sr / n, sg / n, sb / n].map(Math.round), saturation: +(sat / n).toFixed(3), luminance: Math.round(lum / n), hash, hist: hist.map((v) => v / n), usedIn: users.slice(0, 4) };
}
const ham = (a, b) => [...a].reduce((s, c, i) => s + (c !== b[i] ? 1 : 0), 0);
const histDist = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / 2;

const rows = [];
for (const f of files) rows.push({ ...(await measure(f)), group: groups.find(([, t]) => t(f))?.[0] ?? "Autres" });

// Planches contact par groupe.
for (const [g] of groups) {
  const list = rows.filter((r) => r.group === g); if (!list.length) continue;
  const cols = 6, tw = 300, th = 240, pad = 6, lh = 22;
  const tiles = [];
  for (const [i, r] of list.entries()) {
    const buf = await sharp(`public${r.path}`).resize(tw, th, { fit: "cover" }).png().toBuffer();
    const x = (i % cols) * (tw + pad), y = Math.floor(i / cols) * (th + lh + pad);
    const label = Buffer.from(`<svg width="${tw}" height="${lh}"><rect width="100%" height="100%" fill="#fff"/><text x="4" y="15" font-size="12" font-family="sans-serif" fill="#111">${basename(r.path).slice(0, 44)} · ${r.w}×${r.h}</text></svg>`);
    tiles.push({ input: buf, left: x, top: y }, { input: label, left: x, top: y + th });
  }
  const W = cols * (tw + pad), H = Math.ceil(list.length / cols) * (th + lh + pad);
  await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } }).composite(tiles).webp({ quality: 70 }).toFile(`${OUT}/planches/${g.replace(/[^a-z]+/gi, "-").toLowerCase()}.webp`);
}

// Ressemblance entre images de styles différents (palette + structure).
const styles = rows.filter((r) => r.group === "Images IA : styles" || r.group === "Images IA : espaces");
const pairs = [];
for (let i = 0; i < styles.length; i++) for (let j = i + 1; j < styles.length; j++) {
  const a = styles[i], b = styles[j];
  pairs.push({ a: basename(a.path), b: basename(b.path), palette: +histDist(a.hist, b.hist).toFixed(3), structure: ham(a.hash, b.hash) });
}
pairs.sort((x, y) => x.palette - y.palette);
const doublons = [];
for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) if (ham(rows[i].hash, rows[j].hash) <= 6 && histDist(rows[i].hist, rows[j].hist) < 0.15) doublons.push([rows[i].path, rows[j].path]);

writeFileSync(`${OUT}/visuel.json`, JSON.stringify({ date: new Date().toISOString(), images: rows.map((r) => { const { hist: _h, ...rest } = r; void _h; return rest; }), styles: pairs, doublons }, null, 1));
const ratios = [...new Set(rows.map((r) => r.ratio))].sort();
const sat = (g) => { const l = rows.filter((r) => r.group === g); return l.length ? (l.reduce((s, r) => s + r.saturation, 0) / l.length).toFixed(2) : "–"; };
let md = `# Audit visuel — mesures automatiques\n\nGénéré par \`node scripts/audit-visuel.mjs\` le ${new Date().toISOString().slice(0, 10)}. La notation A/B/C est dans \`docs/AUDIT-REFONTE.md\`.\n\n`;
md += `| Groupe | Images | Ratios | Saturation moyenne | Poids moyen |\n|---|---:|---|---:|---:|\n`;
for (const [g] of groups) { const l = rows.filter((r) => r.group === g); if (l.length) md += `| ${g} | ${l.length} | ${[...new Set(l.map((r) => r.ratio))].join(", ")} | ${sat(g)} | ${Math.round(l.reduce((s, r) => s + r.kb, 0) / l.length)} Ko |\n`; }
md += `\nRatios différents sur l'ensemble : ${ratios.length} (${ratios.join(", ")}).\n\n## Styles trop proches (palette la plus semblable)\n\n| Image | Image | Écart de palette (0 = identique) | Écart de structure (/64) |\n|---|---|---:|---:|\n`;
for (const p of pairs.slice(0, 15)) md += `| ${p.a} | ${p.b} | ${p.palette} | ${p.structure} |\n`;
md += `\n## Quasi-doublons\n\n${doublons.length ? doublons.map(([a, b]) => `- ${a} ≈ ${b}`).join("\n") : "Aucun."}\n`;
writeFileSync(`${OUT}/visuel.md`, md);
console.log(`${rows.length} images ; ${ratios.length} ratios ; ${doublons.length} quasi-doublons ; planches dans ${OUT}/planches`);
