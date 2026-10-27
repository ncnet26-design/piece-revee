import * as THREE from "three";
import { surfaceFor, toCanvases } from "./generate";

/**
 * Matériau 3D d'une déclinaison du showroom, à l'échelle réelle :
 * `metersPerUv` = longueur réelle couverte par une unité de coordonnée de texture de la géométrie.
 */
export async function showroomMaterial(ref: string, metersPerUv: number, opts: { size?: number; anisotropy?: number; light?: boolean } = {}): Promise<THREE.MeshPhysicalMaterial | null> {
  const s = await surfaceFor(ref, opts.size ?? 1024);
  if (!s) return null;
  const c = toCanvases(s);
  const rep = metersPerUv / s.period;
  const tex = (cv: HTMLCanvasElement, color: boolean) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = opts.anisotropy ?? 8;
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return t;
  };
  const p = s.params;
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex(c.diff, true), roughnessMap: tex(c.rough, false), roughness: 1, metalness: p.metalness,
    clearcoat: p.clearcoat, clearcoatRoughness: p.clearcoatRoughness,
    sheen: p.sheen, sheenRoughness: p.sheenRoughness, sheenColor: new THREE.Color("#ffffff").multiplyScalar(p.sheen ? 0.6 : 0),
  });
  if (!opts.light) {
    mat.normalMap = tex(c.normal, false);
    if (s.normalUrl) {
      // Relief photographié : fils, côtes, grain de la peau.
      try {
        const t = await new THREE.TextureLoader().loadAsync(s.normalUrl);
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = opts.anisotropy ?? 8; t.colorSpace = THREE.NoColorSpace;
        mat.normalMap.dispose(); mat.normalMap = t; mat.normalScale.set(1.1, 1.1);
      } catch { /* on garde le relief calculé */ }
    }
  }
  return mat;
}
