/**
 * Compile le service d'images (workers/ia/src) en un seul fichier, workers/ia/worker.js,
 * à coller tel quel dans l'éditeur du worker Cloudflare (Edit code → Deploy).
 * Usage : node scripts/build-ia-worker.mjs
 */
import { build } from "esbuild";

const banner = `/**
 * Pièce Rêvée · service d'images IA (Cloudflare Worker « piece-revee-ia »). FICHIER GÉNÉRÉ : modifier workers/ia/src puis
 * lancer « node scripts/build-ia-worker.mjs ». À coller tel quel dans Cloudflare (Edit code), puis Deploy.
 *
 * Réglages Cloudflare (Settings → Variables and Secrets / Bindings) :
 *   Secrets (au moins un) : OPENAI_API_KEY, GEMINI_API_KEY, FAL_KEY, REPLICATE_API_TOKEN — jamais dans le site ni dans le code.
 *   Liaison KV  QUOTA     : compteurs, budget, fiches des tâches (et images si pas de R2).
 *   Liaison R2  IMAGES    : facultative, stockage durable des images produites.
 *   Variables facultatives : IA_FOURNISSEUR, OPENAI_IMAGE_MODEL, OPENAI_MODE (images | background), BUDGET_MOIS_USD (15),
 *   BUDGET_VISITEUR_MOIS_USD (1.5), IMAGES_JOUR (30), IMAGES_VISITEUR_JOUR (6).
 */`;
await build({
  entryPoints: ["workers/ia/src/index.ts"],
  outfile: "workers/ia/worker.js",
  bundle: true, format: "esm", target: ["es2022"], platform: "neutral",
  minify: false, legalComments: "none", banner: { js: banner }, logLevel: "warning",
  mainFields: ["module", "main"],
});
console.log("Service d'images compilé : workers/ia/worker.js");
