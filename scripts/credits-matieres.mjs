/** Écrit credits.md (sources et licences des textures de la matériauthèque) à partir de content/data/matieres-4k.json. */
import { readFileSync, writeFileSync } from "node:fs";
const c = JSON.parse(readFileSync("content/data/matieres-4k.json", "utf8"));
let md = "# Crédits des images\n\n## Matières (textures photographiées, licence CC0 1.0 — domaine public)\n\n| Matière du site | Texture d'origine | Auteurs | Source | Taille | Téléchargée le |\n|---|---|---|---|---|---|\n";
for (const [k, v] of Object.entries(c)) md += `| ${k} | ${v.nom} | ${v.auteurs.join(", ")} | [${v.source}](${v.url}) | ${v.largeur}×${v.hauteur} | ${v.telecharge_le} |\n`;
const ph = JSON.parse(readFileSync("content/data/inspirations-styles.json", "utf8"));
md += "\n## Photos d'inspiration (licence Unsplash, affichées depuis Unsplash, photographe crédité sous chaque photo)\n\n| Style | Photographe | Photo | Taille |\n|---|---|---|---|\n";
for (const [s, l] of Object.entries(ph)) for (const p of l) md += `| ${s} | [${p.auteur}](${p.auteur_url}) | [${p.ref}](${p.page}) | ${p.largeur}×${p.hauteur} |\n`;
md += "\nLes autres images du site (photos d'inspiration, images générées par IA, modèles 3D) sont créditées sous chaque image et dans `audit-images.md`, `public/models/LICENCES.txt`, `public/textures/LICENCES.txt`.\n";
writeFileSync("credits.md", md);
console.log(`${Object.keys(c).length} matières créditées`);
