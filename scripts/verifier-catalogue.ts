/**
 * Robot (GitHub Actions) : ouvre chaque page produit de data/catalogue.json, relève le prix et la disponibilité publiés
 * (schema.org), met à jour la date de vérification et retire les produits dont la page n'existe plus.
 * robots.txt respecté, une page à la fois par enseigne, délai poli. Rapport : .robot/verification.txt
 * Usage : node --experimental-strip-types scripts/verifier-catalogue.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseProduct } from "../workers/ia/src/produit.ts";
import { robots } from "./robot-catalogue.ts";

const UA = "Mozilla/5.0 (compatible; PieceReveeBot/1.0; +https://odd-bar-c583.ewanesteves26.workers.dev/legal/)";
type P = { id: string; nom: string; enseigne: string; prix: number; url: string; verifie_le: string; disponibilite: string | null; [k: string]: unknown };
const data = JSON.parse(readFileSync("data/catalogue.json", "utf8")) as { produits: P[]; [k: string]: unknown };
const today = new Date().toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const get = async (u: string) => {
  try { const r = await fetch(u, { headers: { "user-agent": UA, accept: "text/html", "accept-language": "fr-FR,fr;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(25000) }); return { status: r.status, body: await r.text(), url: r.url }; }
  catch (e) { return { status: 0, body: String(e), url: u }; }
};

const parHote = new Map<string, P[]>();
for (const p of data.produits) { const h = new URL(p.url).host; parHote.set(h, [...(parHote.get(h) ?? []), p]); }
const lignes: string[] = [], garder: P[] = [];
await Promise.all([...parHote.entries()].map(async ([host, list]) => {
  const rb = robots((await get(`https://${host}/robots.txt`)).body);
  const delai = Math.max(2000, (rb.delay ?? 0) * 1000);
  for (const p of list) {
    if (!rb.allowed(new URL(p.url).pathname)) { lignes.push(`${host} | interdit par robots.txt | ${p.nom}`); garder.push({ ...p, verification: "non vérifiable (robots.txt)" }); continue; }
    const r = await get(p.url);
    if (r.status === 404 || r.status === 410) { lignes.push(`${host} | ${r.status} retiré | ${p.nom}`); await sleep(delai); continue; }
    const d = r.status >= 200 && r.status < 400 ? parseProduct(r.body) : null;
    if (d?.price) {
      lignes.push(`${host} | ok ${p.prix} → ${d.price} | ${p.nom}`);
      garder.push({ ...p, prix: d.price, disponibilite: d.availability ?? p.disponibilite, verifie_le: today, verification: "page ouverte, prix relevé" });
    } else {
      // Page lisible sans prix, ou enseigne qui refuse la visite : on garde le dernier relevé du robot nocturne, avec sa date.
      lignes.push(`${host} | ${r.status} sans prix lisible (relevé du ${p.verifie_le} conservé) | ${p.nom}`);
      garder.push({ ...p, verification: `page ${r.status || "injoignable"} ; dernier prix relevé le ${p.verifie_le}` });
    }
    await sleep(delai);
  }
}));
garder.sort((a, b) => data.produits.findIndex((x) => x.id === a.id) - data.produits.findIndex((x) => x.id === b.id));
writeFileSync("data/catalogue.json", JSON.stringify({ ...data, verifie_le: today, produits: garder }, null, 1));
mkdirSync(".robot", { recursive: true });
const ok = garder.filter((p) => p.verifie_le === today).length;
writeFileSync(".robot/verification.txt", `Vérification du ${today} : ${ok} prix relevés aujourd'hui, ${garder.length} produits gardés sur ${data.produits.length}.\n\n${lignes.sort().join("\n")}\n`);
console.log(`${ok} vérifiés aujourd'hui, ${garder.length}/${data.produits.length} gardés`);
