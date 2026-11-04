/**
 * Écrit audit-images.md à partir de docs/audit/images.json et des notes visuelles (grille de direction-artistique-images),
 * attribuées après examen des planches-contact. Usage : node scripts/audit-images-md.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
const L = JSON.parse(readFileSync("docs/audit/images.json", "utf8"));
const base = (f) => f.split("/").pop().replace(/(-\d{3,4})?\.(webp|jpe?g|png|avif|svg)$/i, "");
/** [sujet design d'intérieur ?, note, raison] par groupe ou par nom. */
function noter(x) {
  const f = x.fichier, b = base(f);
  if (/^\/(icon|apple-icon|og)/.test(f)) return ["outil", "—", "icône / partage, technique"];
  if (f.startsWith("/models/thumbs/")) return ["oui", "—", "vignette technique du Studio 3D (240 px)"];
  if (f.startsWith("/textures/")) return ["oui", "—", "carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3)"];
  if (f.startsWith("/visuels/")) return ["oui", "C", "ancien rendu 3D plat ; encore chargé par la planche (chemin calculé « vis- ») et par les tests"];
  if (f.startsWith("/materiaux/")) {
    const d = f.split("/")[2];
    if (["velours-foret", "lin-lave", "coton"].includes(d)) return ["oui", "C", "texture réelle mais couleur contraire au nom (rouge, bleu, rose)"];
    if (["terrazzo", "pierre-naturelle", "platre-texture"].includes(d)) return ["oui", "C", "texture réelle mais ce n'est pas la matière annoncée"];
    return ["oui", "A", "texture réelle Poly Haven 2K"];
  }
  if (f.startsWith("/editorial/matieres/")) return ["oui", /verre|laque|peinture|faience|zellige|marbre|tadelakt/.test(b) ? "C" : "B", "vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre"];
  if (f.startsWith("/editorial/planches/")) return [/facade|jardin|terrasse/.test(b) ? "non" : "oui", "B", "planche composée d'échantillons, pas une photo"];
  if (f.startsWith("/inspirations/")) {
    if (/villas-24/.test(b)) return ["non", "C", "maison vue de l'extérieur, rendu"];
    if (/villas-10|cuisines-68/.test(b)) return ["oui", "C", "intérieur kitsch ou rendu de promoteur"];
    return ["oui", "B", "vraie photo (Villa Tugendhat), belle mais trop petite"];
  }
  if (f.startsWith("/editorial/ia/")) {
    if (b.startsWith("matiere-")) return ["oui", "C", "image IA de matière : interdite désormais pour les matières"];
    if (/facade|jardin/.test(b)) return ["non", "B", "extérieur : hors du concept (intérieur)"];
    if (/^(art-deco|brutalisme|campagne|haussmannien|mediterraneen|mid-century|salle-a-manger|salle-de-bain|cuisine|dressing|parisien|salon-boucle|salon-velours|terrasse)/.test(b)) return ["oui", "A", "image IA crédible, style lisible (étiquetée IA)"];
    return ["oui", "B", "image IA crédible mais beige générique, style peu reconnaissable"];
  }
  return ["?", "?", "à examiner"];
}
const rows = L.map((x) => { const [sujet, note, raison] = noter(x); return { ...x, sujet, note, raison,
  action: x.fichier.startsWith("/visuels/") ? "supprimer après avoir retiré son usage dans la planche et les tests"
    : x.fichier.startsWith("/models/thumbs/") || x.fichier.startsWith("/textures/") || /^\/(icon|apple-icon|og)/.test(x.fichier) ? "garder (technique) jusqu'au remplacement"
    : sujet === "non" || note === "C" ? "supprimer" : (x.largeur ?? 0) < 2000 ? "supprimer (< 2000 px) dès que le remplaçant existe" : "garder" }; });
const n = (p) => rows.filter(p).length;
let md = `# Audit des images (${new Date().toISOString().slice(0, 10)})\n\n`;
md += `Grille : \`direction-artistique-images\` (A publiable, B à améliorer, C à refaire). Seuil : 2000 px de large minimum.\n`;
md += `Méthode : mesures automatiques (\`scripts/audit-images.mjs\`), puis examen visuel de chaque groupe sur planches-contact.\n\n`;
md += `## Bilan\n- ${rows.length} images au total, ${n((x) => (x.largeur ?? 0) >= 2000)} font 2000 px ou plus.\n`;
md += `- Hors sujet : ${n((x) => x.sujet === "non")} ; note C : ${n((x) => x.note === "C")} ; note B : ${n((x) => x.note === "B")} ; note A : ${n((x) => x.note === "A")}.\n`;
md += `- À supprimer : ${n((x) => x.action === "supprimer")} tout de suite (hors sujet ou C), ${n((x) => x.action.startsWith("supprimer (<"))} quand leur remplaçant existera, ${n((x) => x.action === "garder")} à garder, ${n((x) => x.action.startsWith("garder (tech"))} fichiers techniques.\n`;
md += `- Les liens « utilisé par » sont des fichiers source ; les textures 3D sont chargées par un chemin calculé, d'où « 0 » parfois.\n\n`;
md += `## Détail\n| Fichier | Utilisé par | Taille (px) | Poids | Design d'intérieur | Note | Raison | Action |\n|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) md += `| \`${r.fichier}\` | ${r.utilise_par.map((p) => p.replace(/^(app|components|lib|content)\//, "")).slice(0, 2).join(", ") || "—"} | ${r.largeur ?? "?"}×${r.hauteur ?? "?"} | ${r.ko} Ko | ${r.sujet} | ${r.note} | ${r.raison} | ${r.action} |\n`;
writeFileSync("audit-images.md", md);
writeFileSync("docs/audit/images-actions.json", JSON.stringify(rows.map(({ fichier, action, note, sujet }) => ({ fichier, action, note, sujet })), null, 1));
console.log(md.split("## Détail")[0]);
