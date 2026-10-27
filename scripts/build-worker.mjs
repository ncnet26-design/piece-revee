/**
 * Compile le travailleur d'arrière-plan du showroom (calcul des textures) en un fichier JavaScript autonome,
 * servi tel quel depuis /workers/ (Turbopack ne compile pas encore les travailleurs).
 */
import { build } from "esbuild";

await build({
  entryPoints: ["lib/showroom/surface.worker.ts"],
  outfile: "public/workers/surface.js",
  bundle: true,
  format: "esm",
  target: ["es2022"],
  minify: true,
  legalComments: "none",
  tsconfig: "tsconfig.json",
  logLevel: "warning",
});
console.log("Travailleur du showroom compilé : public/workers/surface.js");
