// Refuse la modification directe des fichiers sensibles ou générés (secrets, verrou de dépendances, service IA compilé).
let raw = ""; for await (const c of process.stdin) raw += c;
let path = "";
try { const j = JSON.parse(raw); path = j.tool_input?.file_path ?? j.tool_input?.notebook_path ?? ""; } catch { process.exit(0); }
const rules = [
  [/(^|\/)\.env(\.|$)(?!example)/, "fichier de secrets (.env) : les clés vont dans les secrets GitHub ou Cloudflare"],
  [/(^|\/)pnpm-lock\.yaml$/, "verrou des dépendances : utiliser pnpm add / pnpm remove"],
  [/workers\/ia\/worker\.js$/, "fichier généré : modifier workers/ia/src puis lancer node scripts/build-ia-worker.mjs"],
];
for (const [re, why] of rules) if (re.test(path)) { console.error(`Modification bloquée (${path}) : ${why}.`); process.exit(2); }
