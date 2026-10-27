import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ItemType } from "./plan";

/**
 * Modèles 3D réalistes sous licence libre (voir public/3d/LICENCES.txt), optimisés pour le web.
 * Chaque coloris proposé correspond à une variante de matériaux du fichier (extension KHR_materials_variants).
 */
export const MODELS: Partial<Record<ItemType, { url: string; variants?: Record<string, string> }>> = {
  "canape-velours": { url: "/3d/canape-velours.glb", variants: { "Bleu nuit": "Navy", Champagne: "Champagne", Gris: "Gray", Noir: "Black", "Rose pâle": "Pale Pink" } },
  "fauteuil-velours": { url: "/3d/fauteuil-velours.glb", variants: { Mangue: "Mango Velvet", Paon: "Peacock Velvet" } },
  "plante-reelle": { url: "/3d/plante.glb" },
};
export const isModel = (t: ItemType) => t in MODELS || t === "objet";

const loader = new GLTFLoader();
const files = new Map<string, Promise<GLTF>>();
const variantCache = new Map<string, Promise<Map<number, THREE.Material>>>();

function load(url: string): Promise<GLTF> {
  let p = files.get(url);
  if (!p) { p = loader.loadAsync(url); files.set(url, p); p.catch(() => files.delete(url)); }
  return p;
}

type VariantsExt = { mappings?: Array<{ material: number; variants: number[] }> };
/** Matériaux d'une variante, indexés par l'ordre de parcours des maillages de la scène d'origine. */
function variantMaterials(url: string, gltf: GLTF, name: string): Promise<Map<number, THREE.Material>> {
  const key = `${url}|${name}`;
  let p = variantCache.get(key);
  if (!p) {
    p = (async () => {
      const json = gltf.parser.json as { extensions?: { KHR_materials_variants?: { variants: Array<{ name: string }> } }; meshes: Array<{ primitives: Array<{ extensions?: { KHR_materials_variants?: VariantsExt } }> }> };
      const vIdx = json.extensions?.KHR_materials_variants?.variants.findIndex((v) => v.name === name) ?? -1;
      const out = new Map<number, THREE.Material>();
      if (vIdx < 0) return out;
      const meshes: THREE.Mesh[] = [];
      gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
      await Promise.all(meshes.map(async (m, i) => {
        const assoc = gltf.parser.associations.get(m) as { meshes?: number; primitives?: number } | undefined;
        if (assoc?.meshes === undefined || assoc.primitives === undefined) return;
        const map = json.meshes[assoc.meshes]?.primitives[assoc.primitives]?.extensions?.KHR_materials_variants?.mappings?.find((x) => x.variants.includes(vIdx));
        if (map) out.set(i, (await gltf.parser.getDependency("material", map.material)) as THREE.Material);
      }));
      return out;
    })();
    variantCache.set(key, p);
  }
  return p;
}

/** Instancie un modèle : posé au sol (y = 0), centré en x/z, face avant vers +z. */
export async function instantiate(type: ItemType, variant: string | undefined): Promise<THREE.Object3D> {
  const def = type === "objet" ? (variant && /^[\w-]+$/.test(variant) ? { url: `/models/${variant}.glb`, variants: undefined } : undefined) : MODELS[type];
  if (!def) throw new Error(`modèle inconnu : ${type}`);
  const gltf = await load(def.url);
  const clone = gltf.scene.clone(true);
  const vName = type !== "objet" && variant && def.variants ? def.variants[variant] : def.variants ? Object.values(def.variants)[0] : undefined;
  if (vName) {
    const mats = await variantMaterials(def.url, gltf, vName);
    let i = 0;
    clone.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; const mat = mats.get(i++); if (mat) m.material = mat; });
  }
  const box = new THREE.Box3().setFromObject(clone);
  const wrap = new THREE.Group();
  clone.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  wrap.add(clone);
  return wrap;
}
