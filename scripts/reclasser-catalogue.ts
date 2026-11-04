/**
 * Reclasse le catalogue publié avec les règles actuelles de lib/catalogue.ts (sans rien télécharger) :
 * utile après une correction des familles, sans attendre le passage nocturne du robot.
 * Usage : npx tsx scripts/reclasser-catalogue.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { famille, FAMILLES, nomProduit, type Famille, type IndexCatalogue, type ProduitCatalogue } from "../lib/catalogue";

const dir = "public/catalogue";
const idx = JSON.parse(readFileSync(`${dir}/index.json`, "utf8")) as IndexCatalogue;
const tous: ProduitCatalogue[] = [];
for (const f of Object.keys(FAMILLES)) if (existsSync(`${dir}/${f}.json`)) tous.push(...(JSON.parse(readFileSync(`${dir}/${f}.json`, "utf8")) as ProduitCatalogue[]));
const par = new Map<Famille, ProduitCatalogue[]>(), vus = new Set<string>();
let retires = 0;
for (const p of tous) {
  if (vus.has(p.u)) continue; vus.add(p.u);
  p.n = nomProduit(p.n, p.u);
  const f = famille(`${p.n} ${p.u}`);
  if (!f) { retires++; continue; }
  if (!par.has(f)) par.set(f, []);
  par.get(f)!.push(p);
}
const familles: IndexCatalogue["familles"] = {}, vendeurs: Record<string, number> = {};
for (const f of Object.keys(FAMILLES) as Famille[]) {
  const l = (par.get(f) ?? []).sort((a, b) => a.n.localeCompare(b.n, "fr"));
  writeFileSync(`${dir}/${f}.json`, JSON.stringify(l));
  familles[f] = l.length;
  for (const p of l) vendeurs[p.m] = (vendeurs[p.m] ?? 0) + 1;
}
const total = Object.values(familles).reduce((a, b) => a + (b ?? 0), 0);
writeFileSync(`${dir}/index.json`, JSON.stringify({ ...idx, total, familles, vendeurs }));
console.log(`${tous.length} → ${total} produits (${retires} retirés : outils, accessoires ou hors maison)`, familles);
