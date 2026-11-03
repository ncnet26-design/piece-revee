/**
 * Audit qualité : Lighthouse mobile (scores, LCP, CLS, TBT) et contrôle des images servies par page
 * (taille réelle / taille affichée × densité, format, srcset, chargement différé), poids transféré, débordement mobile.
 * Pré-requis : site construit et servi sur http://localhost:4173 (pnpm build && npx serve out -l 4173).
 * Sorties : docs/audit/qualite.json et docs/audit/qualite.md.
 * Usage : node scripts/audit-qualite.mjs [--sans-lighthouse]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE = "http://localhost:4173";
const PAGES = ["/", "/transformer/", "/galerie/", "/boutique/", "/showroom/", "/studio/", "/planche/", "/matieres/", "/matieres/travertin/", "/styles/", "/accords/", "/lieux/", "/plantes/", "/mobilier/"];
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";
mkdirSync("docs/audit/lh", { recursive: true });
const out = { date: new Date().toISOString(), pages: {} };

// 1. Lighthouse (mobile, simulation par défaut).
if (!process.argv.includes("--sans-lighthouse")) {
  for (const p of PAGES) {
    const file = `docs/audit/lh/${p.replace(/\//g, "_") || "_"}.json`;
    try {
      execFileSync("npx", ["-y", "lighthouse@13.6.0", BASE + p, "--output=json", `--output-path=${file}`, "--quiet", "--only-categories=performance,accessibility,best-practices,seo", "--chrome-flags=--headless=new --no-sandbox"], { env: { ...process.env, CHROME_PATH: CHROME }, stdio: "ignore", timeout: 240_000 });
      const r = JSON.parse(readFileSync(file, "utf8"));
      const a = r.audits, c = r.categories;
      out.pages[p] = { lighthouse: {
        performance: Math.round(c.performance.score * 100), accessibilite: Math.round(c.accessibility.score * 100), bonnesPratiques: Math.round(c["best-practices"].score * 100), seo: Math.round(c.seo.score * 100),
        lcp: a["largest-contentful-paint"].displayValue, cls: a["cumulative-layout-shift"].displayValue, tbt: a["total-blocking-time"].displayValue,
        poids: a["total-byte-weight"].displayValue, lcpElement: a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet?.slice(0, 120) ?? null,
      } };
      console.log("✓ lighthouse", p, out.pages[p].lighthouse.performance);
    } catch (e) { out.pages[p] = { lighthouse: { erreur: String(e).slice(0, 160) } }; console.log("✗ lighthouse", p); }
  }
}

// 2. Images servies, poids transféré, débordement (mobile 390 et ordinateur 1440).
const b = await chromium.launch();
for (const [nom, w, h, dpr] of [["mobile", 390, 844, 3], ["ordinateur", 1440, 900, 1]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  await ctx.addInitScript(() => { localStorage.setItem("pr_camille_guide", "off"); localStorage.setItem("pr_camille_vu", "1"); });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => {});
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
    await page.waitForTimeout(800);
    const r = await page.evaluate((dprIn) => {
      const imgs = [...document.images].filter((i) => i.clientWidth > 40 && i.naturalWidth > 0);
      const rows = imgs.map((i) => {
        const need = i.clientWidth * dprIn, nat = i.naturalWidth;
        return { src: (i.currentSrc || i.src).replace(location.origin, ""), naturel: nat, affiche: i.clientWidth, ratio: +(nat / need).toFixed(2), srcset: Boolean(i.srcset), lazy: i.loading === "lazy", haut: i.getBoundingClientRect().top + scrollY < innerHeight };
      });
      const bytes = performance.getEntriesByType("resource").reduce((s, e) => s + (e.transferSize || 0), 0) + (performance.getEntriesByType("navigation")[0]?.transferSize || 0);
      return { images: rows, octets: bytes, deborde: document.documentElement.scrollWidth > innerWidth + 1, dessins: document.querySelectorAll("canvas, svg[role=img]").length };
    }, dpr);
    const pg = (out.pages[p] ??= {});
    pg[nom] = {
      images: r.images.length, octets: r.octets, deborde: r.deborde, dessins: r.dessins,
      tropLourdes: r.images.filter((i) => i.ratio > 1.5).map((i) => `${i.src} (${i.naturel}px pour ${i.affiche}px)`),
      floues: r.images.filter((i) => i.ratio < 0.75).map((i) => `${i.src} (${i.naturel}px pour ${i.affiche}px affichés ×${dpr})`),
      sansSrcset: r.images.filter((i) => !i.srcset && i.naturel > 600).length,
      nonDifferees: r.images.filter((i) => !i.haut && !i.lazy).length,
      formats: [...new Set(r.images.map((i) => (i.src.split("?")[0].match(/\.(\w+)$/)?.[1] ?? "?").toLowerCase()))],
    };
  }
  await ctx.close();
}
await b.close();
writeFileSync("docs/audit/qualite.json", JSON.stringify(out, null, 1));

let md = `# Audit qualité — mesures automatiques\n\nGénéré par \`node scripts/audit-qualite.mjs\` le ${out.date.slice(0, 10)} (site servi en local, Lighthouse mobile simulé).\n\n`;
md += `| Page | Perf. | Access. | Bonnes pr. | SEO | LCP | CLS | TBT | Poids |\n|---|---:|---:|---:|---:|---|---|---|---|\n`;
for (const [p, v] of Object.entries(out.pages)) { const l = v.lighthouse ?? {}; md += `| ${p} | ${l.performance ?? "–"} | ${l.accessibilite ?? "–"} | ${l.bonnesPratiques ?? "–"} | ${l.seo ?? "–"} | ${l.lcp ?? "–"} | ${l.cls ?? "–"} | ${l.tbt ?? "–"} | ${l.poids ?? "–"} |\n`; }
md += `\n## Images servies\n\n| Page | Écran | Images | Sans srcset (>600 px) | Trop lourdes (>1,5×) | Trop petites (floues) | Non différées hors écran | Formats | Débordement | Illustrations dessinées |\n|---|---|---:|---:|---:|---:|---:|---|---|---:|\n`;
for (const [p, v] of Object.entries(out.pages)) for (const e of ["mobile", "ordinateur"]) { const x = v[e]; if (x) md += `| ${p} | ${e} | ${x.images} | ${x.sansSrcset} | ${x.tropLourdes.length} | ${x.floues.length} | ${x.nonDifferees} | ${x.formats.join(", ")} | ${x.deborde ? "**oui**" : "non"} | ${x.dessins} |\n`; }
md += `\n### Détail des images floues (mobile)\n\n`;
for (const [p, v] of Object.entries(out.pages)) if (v.mobile?.floues.length) md += `- ${p} : ${v.mobile.floues.slice(0, 5).join(" ; ")}\n`;
writeFileSync("docs/audit/qualite.md", md);
console.log("Rapport : docs/audit/qualite.md");
