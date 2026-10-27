import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Generator, Variant } from "./catalog";

/** Tissu : un carré souple qui retombe en plis doux, avec un coin légèrement relevé. */
export function drapeGeometry(size: number, seg = 72): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / size, z = p.getZ(i) / size;
    const fold = Math.max(0, Math.sin((x + 0.15) * Math.PI * 2.2)) * 0.014 * (0.6 + z);
    const curl = Math.max(0, x + z - 0.45) ** 2 * 0.16;
    p.setY(i, 0.0045 + (fold + curl + Math.sin(z * 9 + x * 3) * 0.0022) * (size / 0.25));
  }
  g.computeVertexNormals();
  return g;
}

/** Échantillon physique selon la famille : carreau épais, planche, carte peinte, plaque de métal, tissu drapé. */
export function sampleGeometry(gen: Generator, size = sampleSize(gen)): { geo: THREE.BufferGeometry; y: number; thick: number } {
  if (gen === "fabric") return { geo: drapeGeometry(size * 1.05), y: 0, thick: 0.01 };
  const t = gen === "paint" ? 0.005 : gen === "leather" ? 0.004 : gen === "metal" ? 0.005 : gen === "wood" ? 0.016 : 0.013;
  const geo = new RoundedBoxGeometry(size, t, size, 4, Math.min(gen === "metal" ? 0.002 : 0.0028, t / 2.2));
  // Coordonnées de texture en mètres réels, de face comme sur les tranches.
  const uv = geo.attributes.uv as THREE.BufferAttribute, pos = geo.attributes.position as THREE.BufferAttribute, nrm = geo.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    const ny = Math.abs(nrm.getY(i)), nx = Math.abs(nrm.getX(i));
    if (ny > 0.5) uv.setXY(i, (pos.getX(i) + size / 2) / size, (pos.getZ(i) + size / 2) / size);
    else if (nx > 0.5) uv.setXY(i, (pos.getZ(i) + size / 2) / size, (pos.getY(i) + t / 2) / size);
    else uv.setXY(i, (pos.getX(i) + size / 2) / size, (pos.getY(i) + t / 2) / size);
  }
  return { geo, y: t / 2, thick: t };
}

/** Taille d'échantillon (m) : assez grande pour lire le calepinage des carrelages et des parquets. */
export const sampleSize = (gen: Generator) => (gen === "wood" ? 0.4 : gen === "tile" || gen === "cement" || gen === "terrazzo" || gen === "marble" ? 0.3 : 0.2);
/** Couleur de la tranche quand la matière n'est qu'en surface (émail, couche colorée, peinture). */
export function bodyColor(v: Variant): string | null {
  switch (v.family.id) {
    case "zellige": return "#A9674B";
    case "faience": return "#E7E1D5";
    case "ciment": return "#A8A49B";
    case "peinture": return "#EFEBE4";
    default: return null;
  }
}
