/**
 * Génère les fichiers dont les Edge Functions ont besoin à partir des sources du dépôt :
 * - les prompts versionnés (prompts/*.md) ;
 * - l'index de la bibliothèque (identifiants cités par Camille) ;
 * - le seed SQL de la base de connaissances.
 * Usage : node --experimental-strip-types scripts/build-server-assets.ts
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { LIBRARY, KNOWLEDGE, PLANTS } from "../content/index.ts";

const out = "supabase/functions/_shared/generated";
mkdirSync(out, { recursive: true });

const prompts: Record<string, string> = {};
for (const f of readdirSync("prompts").filter((x) => x.endsWith(".md")).sort()) prompts[f.replace(/\.md$/, "")] = readFileSync(`prompts/${f}`, "utf8").trim();
writeFileSync(`${out}/prompts.ts`, `// Fichier généré par scripts/build-server-assets.ts : ne pas modifier à la main.\nexport const PROMPTS = ${JSON.stringify(prompts, null, 2)} as const;\n`);

const lib = LIBRARY.map(({ id, kind, name, href, text }) => ({ id, kind, name, href, text: text.slice(0, 400) }));
writeFileSync(`${out}/library.json`, JSON.stringify(lib));
writeFileSync(`${out}/plants.json`, JSON.stringify(PLANTS.map((p) => ({ id: p.id, name: p.name, latin: p.latin, exposure: p.exposure, hardinessC: p.hardinessC, water: p.water, uses: p.uses, heightCm: p.heightCm }))));

const esc = (s: string) => s.replace(/'/g, "''");
const sql = KNOWLEDGE.map((k) => `insert into public.knowledge_chunks (id, domain, title, body, sources, reviewed) values ('${esc(k.id)}', '${k.domain}', '${esc(k.title)}', '${esc(k.body)}', '${esc(JSON.stringify(k.sources))}'::jsonb, ${k.reviewed}) on conflict (id) do update set title = excluded.title, body = excluded.body, sources = excluded.sources;`).join("\n");
writeFileSync("supabase/seed.sql", `-- Fichier généré par scripts/build-server-assets.ts.\n-- Base de connaissances de Camille (les embeddings sont calculés par la fonction maintenance).\n${sql}\n`);
console.log(`Prompts : ${Object.keys(prompts).length} · bibliothèque : ${lib.length} · connaissances : ${KNOWLEDGE.length}`);
