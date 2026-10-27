/**
 * Banc d'essai des fournisseurs d'images (à lancer avec Deno) :
 *   npx deno run -A --config supabase/functions/deno.json scripts/eval-renders.ts
 * Lit eval/manifest.json, génère un rendu par fournisseur configuré, écrit eval/report.html.
 */
import { renderWithFallback } from "../supabase/functions/_shared/images.ts";

interface Item { file: string; space: string; style: string; source: string; license: string }
const manifest = JSON.parse(await Deno.readTextFile("eval/manifest.json")) as Item[];
const providers = (Deno.env.get("EVAL_PROVIDERS") ?? "mock").split(",");
const rows: string[] = [];
for (const it of manifest) {
  const cells: string[] = [];
  const src = `photos/${it.file}`;
  for (const p of providers) {
    Deno.env.set("IMAGE_PROVIDER", p);
    const t0 = performance.now();
    try {
      const img = await renderWithFallback({ prompt: `Photographie d'architecture intérieure, ${it.space}, style ${it.style}, géométrie et point de vue identiques à la photo, lumière naturelle`, negative: "déformation, mobilier flottant, texte", imageUrl: null, width: 1536, height: 1152 }, "hd");
      const out = `out/${p}-${it.file.replace(/\.\w+$/, "")}.${img.mediaType === "image/png" ? "png" : "jpg"}`;
      await Deno.mkdir("eval/out", { recursive: true }); await Deno.writeFile(`eval/${out}`, img.bytes);
      cells.push(`<td><img src="${out}" alt="${p}"><br>${p} · ${((performance.now() - t0) / 1000).toFixed(1)} s · ${(img.costCents / 100).toFixed(2)} €<br><label><input type="checkbox"> fidèle</label> <label><input type="checkbox"> sans artefact</label></td>`);
    } catch (e) { cells.push(`<td>${p} : échec (${String(e).slice(0, 80)})</td>`); }
  }
  rows.push(`<tr><td><img src="${src}" alt="original"><br>${it.space} · ${it.style}<br><small>${it.source} · ${it.license}</small></td>${cells.join("")}</tr>`);
}
await Deno.writeTextFile("eval/report.html", `<!doctype html><meta charset="utf-8"><title>Banc d'essai des rendus</title><style>body{font-family:system-ui;margin:16px}img{width:320px;height:auto;border-radius:6px}td{vertical-align:top;padding:8px;border-bottom:1px solid #ddd}</style><h1>Banc d'essai des rendus</h1><p>${manifest.length} photos · fournisseurs : ${providers.join(", ")} · ${new Date().toLocaleString("fr-FR")}</p><table><tr><th>Original</th>${providers.map((p) => `<th>${p}</th>`).join("")}</tr>${rows.join("")}</table>`);
console.log(`Rapport : eval/report.html (${manifest.length} photos).`);
