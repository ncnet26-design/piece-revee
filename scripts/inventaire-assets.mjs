/**
 * Inventaire des ressources visuelles et registre des licences.
 * Parcourt public/ (images, textures, modèles 3D, éclairages) et produit :
 *  - docs/ASSETS.md : chemin, rôle, résolution, poids, provenance, licence, utilisation dans le code ;
 *  - docs/LICENCES-RESSOURCES.md : registre par source, avec les obligations de crédit.
 * Usage : node scripts/inventaire-assets.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, extname, basename, dirname } from "node:path";
import sharp from "sharp";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const pbr = read("content/data/materials-pbr.json");
const inspi = read("content/data/inspirations.json");
const models = read("content/data/models.json");

// Corpus du code et des données, pour savoir si une ressource est réellement utilisée.
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const corpus = ["app", "components", "lib", "content", "workers/ia/src"]
  .flatMap((d) => walk(d)).filter((f) => /\.(tsx?|json|mjs|css)$/.test(f))
  .map((f) => readFileSync(f, "utf8")).join("\n");
const used = (needles) => needles.some((n) => corpus.includes(n));

const IMG = new Set([".webp", ".png", ".jpg", ".jpeg", ".avif"]);
const kb = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} Mo` : `${Math.round(b / 1e3)} Ko`);
async function dims(p) {
  if (!IMG.has(extname(p))) return "—";
  try { const m = await sharp(p).metadata(); return `${m.width}×${m.height}`; } catch { return "?"; }
}

const rows = [];
const add = (r) => rows.push(r);

// 1. Visuels éditoriaux composés par nos soins.
for (const f of walk("public/editorial").filter((f) => IMG.has(extname(f)))) {
  const sub = basename(dirname(f));
  const rel = "/" + relative("public", f);
  add({ group: "Visuels éditoriaux", path: rel, file: f,
    role: sub === "matieres" ? "Gros plan de matière (banque, accueil)" : sub === "planches" ? "Planche de style (banque, accueil)" : "Rendu 3D de la scène de contrôle (accueil)",
    source: sub === "rendus" ? "Capture du moteur 3D Pièce Rêvée" : "Composé par scripts/editorial-assets.mjs à partir des textures CC0",
    license: "Création Pièce Rêvée ; textures sources CC0 1.0", used: used([rel, `/editorial/${sub}/`]) });
}
// 2. Photographies d'architecture (Wikimedia Commons).
for (const f of walk("public/inspirations")) {
  const rel = "/" + relative("public", f);
  const id = basename(f, extname(f)).replace(/-640$/, "");
  const e = inspi.find((x) => x.id === id);
  add({ group: "Photographies d'architecture", path: rel, file: f, role: e?.title ?? "Photographie",
    source: e ? `${e.author}, ${e.source} — ${e.sourceUrl}` : "?", license: e?.license ?? "À VÉRIFIER", used: used([rel, `${id}.webp`, `"${id}"`]) });
}
// 3. Textures PBR 2K (une ligne par matière).
const pbrDirs = new Map(Object.entries(pbr).map(([id, e]) => [e.dir, { id, ...e }]));
for (const d of readdirSync("public/materiaux")) {
  const dir = `/materiaux/${d}`, full = `public${dir}`;
  const files = readdirSync(full);
  const e = pbrDirs.get(dir) ?? [...pbrDirs.values()].find((x) => x.dir === dir);
  const users = Object.entries(pbr).filter(([, x]) => x.dir === dir).map(([id]) => id);
  const size = files.reduce((s, f) => s + statSync(join(full, f)).size, 0);
  add({ group: "Matières PBR 2K", path: `${dir}/ (${files.length} cartes)`, file: join(full, files.find((f) => f.startsWith("basecolor")) ?? files[0]), size,
    role: `Matière : ${users.join(", ") || "aucune"}`, source: e ? `${e.name} (${(e.authors ?? []).join(", ")}) — ${e.url}` : "?", license: e?.license ?? "À VÉRIFIER", used: users.length > 0 });
}
// 4. Textures 1K de la planche et du showroom.
const texLic = readFileSync("public/textures/LICENCES.txt", "utf8");
for (const d of readdirSync("public/textures").filter((d) => statSync(join("public/textures", d)).isDirectory())) {
  const full = join("public/textures", d), files = readdirSync(full);
  const line = texLic.split("\n").find((l) => l.startsWith(`${d} `));
  add({ group: "Textures 1K (planche, showroom)", path: `/textures/${d}/ (${files.length} cartes)`, file: join(full, files[0]),
    size: files.reduce((s, f) => s + statSync(join(full, f)).size, 0), role: "Échantillon de matière",
    source: line ? line.replace(/^\S+ ← /, "") : "voir public/textures/LICENCES.txt", license: "CC0 1.0", used: used([d]) });
}
// 5. Modèles 3D.
for (const f of walk("public/models").filter((f) => f.endsWith(".glb"))) {
  const id = basename(f, ".glb"), m = models.find((x) => x.id === id);
  add({ group: "Modèles 3D Poly Haven", path: "/" + relative("public", f), file: f, role: m?.name ?? id,
    source: m ? `${(m.authors ?? []).join(", ")} — ${m.url}` : "Poly Haven (voir LICENCES.txt)", license: m?.license ?? "CC0 1.0", used: used([`/models/${id}.glb`, `"${id}"`]) });
}
const lic3d = readFileSync("public/3d/LICENCES.txt", "utf8");
for (const f of walk("public/3d").filter((f) => !f.endsWith(".txt"))) {
  const name = basename(f), line = lic3d.split("\n").find((l) => l.includes(name)) ?? "";
  add({ group: "Modèles et éclairages Khronos / Poly Haven", path: "/" + relative("public", f), file: f, role: f.endsWith(".exr") ? "Éclairage HDR" : "Meuble 3D",
    source: line.split(":").slice(1).join(":").trim() || "voir public/3d/LICENCES.txt", license: /CC BY 4\.0/.test(lic3d.slice(lic3d.indexOf(name), lic3d.indexOf(name) + 300)) ? "CC BY 4.0 (crédit obligatoire)" : "CC0 1.0", used: used([name, `/3d/${name}`]) });
}
// 6. Anciens visuels du site.
for (const f of walk("public/visuels")) {
  const rel = "/" + relative("public", f);
  add({ group: "Anciens visuels (v1)", path: rel, file: f, role: "Illustration de l'ancienne accueil / planche",
    source: "Captures des outils 3D Pièce Rêvée (v1)", license: "Création Pièce Rêvée", used: used([rel, `vis-${basename(f, ".webp")}`]) });
}

for (const r of rows) { r.res = await dims(r.file); r.size ??= statSync(r.file).size; }

const groups = [...new Set(rows.map((r) => r.group))];
const esc = (s) => String(s).replace(/\|/g, "\\|");
let md = `# Inventaire des ressources visuelles\n\nGénéré par \`node scripts/inventaire-assets.mjs\` le ${new Date().toISOString().slice(0, 10)}. Ne pas modifier à la main.\n\n`;
md += `| Groupe | Fichiers | Poids | Utilisés | Non référencés |\n|---|---:|---:|---:|---:|\n`;
for (const g of groups) { const l = rows.filter((r) => r.group === g); md += `| ${g} | ${l.length} | ${kb(l.reduce((s, r) => s + r.size, 0))} | ${l.filter((r) => r.used).length} | ${l.filter((r) => !r.used).length} |\n`; }
md += `\n« Non référencé » : le chemin n'apparaît ni dans le code ni dans les données. Ces fichiers sont candidats à la suppression après vérification.\n`;
for (const g of groups) {
  md += `\n## ${g}\n\n| Chemin | Rôle | Résolution | Poids | Provenance | Licence | Utilisé |\n|---|---|---|---:|---|---|:-:|\n`;
  for (const r of rows.filter((x) => x.group === g)) md += `| \`${esc(r.path)}\` | ${esc(r.role)} | ${r.res} | ${kb(r.size)} | ${esc(r.source)} | ${esc(r.license)} | ${r.used ? "oui" : "**non**"} |\n`;
}
writeFileSync("docs/ASSETS.md", md);

// Registre des licences.
const byLic = new Map();
for (const r of rows) { const k = r.license; byLic.set(k, (byLic.get(k) ?? 0) + 1); }
let reg = `# Registre des licences des ressources\n\nGénéré par \`node scripts/inventaire-assets.mjs\`. Détail fichier par fichier : [ASSETS.md](./ASSETS.md).\n\n## Répartition\n\n| Licence | Fichiers |\n|---|---:|\n`;
for (const [k, n] of [...byLic].sort((a, b) => b[1] - a[1])) reg += `| ${esc(k)} | ${n} |\n`;
reg += `
## Sources autorisées et obligations

| Source | Licence | Usage commercial | Crédit obligatoire | Remarques |
|---|---|:-:|:-:|---|
| Poly Haven (textures, modèles, HDRI) | CC0 1.0 | oui | non (crédit donné par courtoisie) | Source prioritaire pour les matières et les meubles. |
| ambientCG (textures) | CC0 1.0 | oui | non | Utilisée quand Poly Haven n'a pas la matière (marbre blanc). |
| Khronos glTF Sample Assets | CC0 1.0 ou CC BY 4.0 selon le modèle | oui | oui pour CC BY | Crédit affiché dans public/3d/LICENCES.txt et dans la fiche du meuble. |
| Wikimedia Commons | CC BY-SA 4.0 (photos retenues) | oui | **oui, sur l'image** | Auteur, licence et lien affichés sous chaque photo. Une image modifiée reste sous CC BY-SA. |
| Pexels / Unsplash | Licences propres, gratuites | oui | non (recommandé) | Nécessitent une clé API gratuite créée par le propriétaire du site. Pas encore utilisées. |
| BlendKit | Royalty Free / CC0 selon l'objet | selon l'objet | selon l'objet | Nécessite un compte. Pas encore utilisé. |
| Polices (Instrument Serif, Onest, Bricolage, JetBrains Mono) | SIL OFL 1.1 | oui | non | Voir public/fonts/LICENCES.txt. |

## Règles
- Aucune image sans auteur, source et licence connus. Une ressource dont la licence est inconnue est retirée.
- Pas d'image de marque, de logo d'enseigne ni de photo de produit reprise d'un site marchand : les fiches produits renvoient vers le site du vendeur.
- Les visuels composés par Pièce Rêvée restent marqués comme tels ; ils ne sont jamais présentés comme des photographies de projets réels.
- Les images générées par IA, quand elles existeront, seront étiquetées « Image générée » avec le fournisseur et la date.
`;
writeFileSync("docs/LICENCES-RESSOURCES.md", reg);
console.log(`${rows.length} ressources ; non référencées : ${rows.filter((r) => !r.used).length}`);
for (const r of rows.filter((x) => !x.used)) console.log("  non référencé", r.path);
