/**
 * Calcule les dimensions réelles (m) de chaque modèle 3D de la bibliothèque et les ajoute à content/data/models.json.
 * Usage : node --experimental-strip-types scripts/model-dims.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { NodeIO, getBounds } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

type M = { id: string; file: string; dims?: { w: number; d: number; h: number } };
const list = JSON.parse(readFileSync("content/data/models.json", "utf8")) as M[];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const r = (v: number) => Math.round(v * 100) / 100;
for (const m of list) {
  const path = `public${m.file}`;
  if (!existsSync(path)) continue;
  try {
    const doc = await io.read(path);
    const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
    if (!scene) continue;
    const b = getBounds(scene);
    m.dims = { w: r(b.max[0] - b.min[0]), d: r(b.max[2] - b.min[2]), h: r(b.max[1] - b.min[1]) };
    console.log(m.id, m.dims);
  } catch (e) { console.log(`✗ ${m.id}: ${(e as Error).message}`); }
}
writeFileSync("content/data/models.json", `${JSON.stringify(list, null, 2)}\n`);
