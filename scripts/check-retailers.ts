/**
 * Vérifie, depuis GitHub Actions, quels formats d'adresse de recherche fonctionnent pour chaque enseigne.
 * Une adresse est retenue si la page répond (statut 2xx après redirections) et reste une page de recherche contenant le mot cherché.
 * Résultat : content/data/retailers.json. Usage : node --experimental-strip-types scripts/check-retailers.ts
 */
import { writeFileSync } from "node:fs";
import { RETAILERS } from "../lib/retailers-list.ts";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const out: Record<string, { pattern: string | null; checkedAt: string; detail: string }> = {};
for (const r of RETAILERS) {
  let ok: string | null = null, detail = "";
  for (const p of r.patterns) {
    const url = p.replace("{q}", encodeURIComponent("canapé"));
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, "accept-language": "fr-FR,fr;q=0.9", accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
      const body = (await res.text()).toLowerCase();
      detail = `${res.status} ${res.url}`;
      const isHome = new URL(res.url).pathname.replace(/\/(fr\/fr\/?|FR\/fr\/?)?$/i, "") === "";
      if (res.ok && !isHome && (body.includes("canapé") || body.includes("canap&eacute;") || body.includes("canap%c3%a9"))) { ok = p; break; }
      // Protection anti-robot (403/429) : le format est plausible mais non vérifiable automatiquement.
      if (res.status === 403 || res.status === 429) detail += " (protection anti-robot)";
    } catch (e) { detail = (e as Error).message; }
  }
  out[r.id] = { pattern: ok, checkedAt: new Date().toISOString().slice(0, 10), detail };
  console.log(`${ok ? "✓" : "✗"} ${r.name} : ${detail}`);
}
writeFileSync("content/data/retailers.json", `${JSON.stringify(out, null, 2)}\n`);
