import * as THREE from "three";
import { PBR_MAPS, type Material } from "./schema";

/**
 * Matériau three.js physiquement réaliste à partir d'une fiche du moteur de matières :
 * cartes photographiées haute définition (couleur, normales, rugosité, occlusion, métal) quand elles existent,
 * sinon relief calculé. Jamais une simple couleur unie quand une texture est nécessaire.
 */
const loader = new THREE.TextureLoader();
const texCache = new Map<string, Promise<THREE.Texture | null>>();
function loadTex(url: string, color: boolean): Promise<THREE.Texture | null> {
  const key = `${url}|${color}`;
  let p = texCache.get(key);
  if (!p) {
    p = loader.loadAsync(url).then((t) => { t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }).catch(() => null);
    texCache.set(key, p);
  }
  return p;
}

/** Bruit pseudo-aléatoire reproductible. */
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/** Cartes calculées pour les métaux et laques : brossage (stries), poli (micro-rayures), laque poudre (grain). */
export function proceduralMaps(kind: "brosse" | "poli" | "poudre", size = 1024): { rough: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const h = new Float32Array(size * size), r = rng(kind === "brosse" ? 7 : kind === "poli" ? 11 : 13);
  if (kind === "brosse") {
    // Stries horizontales de longueurs et profondeurs variées.
    for (let y = 0; y < size; y++) { const base = (r() - 0.5) * 0.9; for (let x = 0; x < size; x++) h[y * size + x] = base; }
    for (let k = 0; k < size * 6; k++) {
      const y = Math.floor(r() * size), x0 = Math.floor(r() * size), len = 20 + r() * size * 0.6, d = (r() - 0.5) * 1.4;
      for (let i = 0; i < len; i++) { const j = y * size + ((x0 + i) % size); h[j] = h[j]! + d * Math.sin((i / len) * Math.PI); }
    }
  } else if (kind === "poli") {
    for (let k = 0; k < 260; k++) {
      let x = r() * size, y = r() * size; const a = r() * Math.PI, len = 10 + r() * 120;
      for (let i = 0; i < len; i++) { x += Math.cos(a); y += Math.sin(a); const ix = ((Math.floor(x) % size) + size) % size, iy = ((Math.floor(y) % size) + size) % size; h[iy * size + ix] = h[iy * size + ix]! - 0.6; }
    }
  } else {
    // Peau d'orange très fine : somme de bruits lissés.
    for (let i = 0; i < h.length; i++) h[i] = r();
    for (let pass = 0; pass < 2; pass++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x; h[i] = (h[i]! * 2 + h[y * size + ((x + 1) % size)]! + h[((y + 1) % size) * size + x]!) / 4;
    }
  }
  const nc = document.createElement("canvas"), rc = document.createElement("canvas");
  nc.width = nc.height = rc.width = rc.height = size;
  const nctx = nc.getContext("2d")!, rctx = rc.getContext("2d")!;
  const nd = nctx.createImageData(size, size), rd = rctx.createImageData(size, size);
  const strength = kind === "brosse" ? 1.6 : kind === "poli" ? 0.8 : 3;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, dx = (h[y * size + ((x + 1) % size)]! - h[y * size + ((x - 1 + size) % size)]!) * strength, dy = (h[((y + 1) % size) * size + x]! - h[((y - 1 + size) % size) * size + x]!) * strength;
    const l = Math.hypot(dx, dy, 1);
    nd.data[i * 4] = (-dx / l * 0.5 + 0.5) * 255; nd.data[i * 4 + 1] = (dy / l * 0.5 + 0.5) * 255; nd.data[i * 4 + 2] = (1 / l * 0.5 + 0.5) * 255; nd.data[i * 4 + 3] = 255;
    const v = kind === "brosse" ? 0.5 + h[i]! * 0.12 : kind === "poli" ? 0.5 + Math.min(0, h[i]!) * 0.3 : 0.5 + (h[i]! - 0.5) * 0.4;
    rd.data[i * 4] = rd.data[i * 4 + 1] = rd.data[i * 4 + 2] = Math.max(0, Math.min(255, v * 255)); rd.data[i * 4 + 3] = 255;
  }
  nctx.putImageData(nd, 0, 0); rctx.putImageData(rd, 0, 0);
  const mk = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t; };
  return { rough: mk(rc), normal: mk(nc) };
}
const procCache = new Map<string, ReturnType<typeof proceduralMaps>>();

/** Version désaturée de la photo, centrée sur le blanc moyen, nuances multipliées par k (cache par image). */
const neutralCache = new Map<string, THREE.Texture>();
function neutralize(tex: THREE.Texture, k: number): THREE.Texture {
  const img = tex.image as (CanvasImageSource & { width: number; height: number; src?: string }) | undefined;
  if (!img) return tex.clone();
  const key = `${img.src ?? tex.uuid}|${k}`;
  const hit = neutralCache.get(key); if (hit) return hit.clone();
  const size = Math.min(2048, img.width);
  const c = document.createElement("canvas"); c.width = c.height = size;
  const x = c.getContext("2d", { willReadFrequently: true })!; x.drawImage(img, 0, 0, size, size);
  const im = x.getImageData(0, 0, size, size), d = im.data;
  let sum = 0; for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!;
  const avg = sum / (d.length / 4);
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!;
    const v = Math.max(0, Math.min(255, 235 + (l - avg) * k));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  x.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  neutralCache.set(key, t);
  return t.clone();
}

export interface BuildOpts {
  /** Longueur réelle (m) couverte par une unité de coordonnée de texture de la géométrie cible. */
  metersPerUv?: number;
  anisotropy?: number;
  /** Appareil modeste : textures 1K au lieu de 2K. */
  light?: boolean;
  /** Relief géométrique réel (m) pour les gros plans, sur une géométrie assez subdivisée. */
  displacement?: number;
}

/** Construit le matériau (asynchrone : chargement des cartes). */
export async function buildMaterial(m: Material, o: BuildOpts = {}): Promise<THREE.MeshPhysicalMaterial> {
  const p = m.pbr;
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(m.baseColor), metalness: p.metalness, roughness: p.roughness,
    clearcoat: p.clearcoat ?? 0, clearcoatRoughness: p.clearcoatRoughness ?? 0,
    sheen: p.sheen ?? 0, sheenRoughness: p.sheenRoughness ?? 0.5, sheenColor: new THREE.Color(p.sheenColor ?? "#ffffff"),
    anisotropy: p.anisotropy ?? 0,
    transmission: p.transmission ?? 0, ior: p.ior ?? 1.5, thickness: p.thickness ?? 0,
  });
  mat.name = `pr:${m.id}`;
  const rep = (o.metersPerUv ?? 1) / m.tileMeters;
  const setRep = (t: THREE.Texture | null | undefined) => { if (!t) return; t.repeat.set(rep, rep); t.anisotropy = o.anisotropy ?? 8; t.needsUpdate = true; };
  const ns = p.normalScale ?? 1;
  const t = m.textures;

  if (t.kind === "procedural") {
    const key = `${t.generator}|${o.light ? 1024 : 2048}`;
    let maps = procCache.get(key);
    if (!maps) { maps = proceduralMaps(t.generator, o.light ? 512 : 1024); procCache.set(key, maps); }
    mat.roughnessMap = maps.rough.clone(); mat.normalMap = maps.normal.clone();
    [mat.roughnessMap, mat.normalMap].forEach(setRep);
    mat.normalScale.set(ns, ns);
    return mat;
  }
  if (t.kind === "showroom" || (t.kind === "photo" && !PBR_MAPS[m.id] && !t.fallbackDir && t.fallbackRef)) {
    const { showroomMaterial } = await import("@/lib/showroom/three");
    const ref = t.kind === "showroom" ? t.ref : t.fallbackRef!;
    const sm = await showroomMaterial(ref, o.metersPerUv ?? 1, { size: o.light ? 1024 : 2048, anisotropy: o.anisotropy, light: false });
    if (sm) { sm.name = mat.name; mat.dispose(); return sm; }
    return mat;
  }
  // Cartes photographiées : haute définition si le robot les a récupérées, sinon 1K provisoire.
  const hd = PBR_MAPS[m.id];
  const dir = hd?.dir ?? (t.kind === "photo" ? t.fallbackDir : undefined);
  if (!dir) return mat;
  const file = (k: "basecolor" | "normal" | "roughness" | "ao" | "metallic") => (hd ? hd.maps[k] : ({ basecolor: "diff.webp", normal: "nor.webp", roughness: "rough.webp" } as Record<string, string | undefined>)[k]);
  const url = (f: string | undefined) => (f ? `${dir}/${f}` : undefined);
  const disp = o.displacement && hd?.maps.displacement ? loadTex(`${dir}/${hd.maps.displacement}`, false) : Promise.resolve(null);
  const [base, nor, rough, ao, metal] = await Promise.all([
    url(file("basecolor")) ? loadTex(url(file("basecolor"))!, true) : null,
    url(file("normal")) ? loadTex(url(file("normal"))!, false) : null,
    url(file("roughness")) ? loadTex(url(file("roughness"))!, false) : null,
    url(file("ao")) ? loadTex(url(file("ao"))!, false) : null,
    url(file("metallic")) ? loadTex(url(file("metallic"))!, false) : null,
  ]);
  const own = (x: THREE.Texture | null) => (x ? x.clone() : null);
  if (base) {
    mat.map = own(base);
    // Teinte : la photo donne le relief et les nuances, la couleur vient de la fiche.
    if (p.tint) {
      // Matière teintée : la photo est désaturée et ses nuances adoucies, la couleur vient entièrement de la fiche.
      mat.map = neutralize(base, p.textureContrast ?? 0.5); mat.color.set(m.baseColor);
    } else mat.color.set("#ffffff");
  }
  mat.normalMap = own(nor); mat.roughnessMap = own(rough); mat.aoMap = own(ao); mat.metalnessMap = own(metal);
  const d = await disp;
  if (d) { mat.displacementMap = own(d); mat.displacementScale = o.displacement!; mat.displacementBias = -o.displacement! / 2; }
  if (mat.roughnessMap) mat.roughness = p.roughnessScale ?? 1;
  [mat.map, mat.normalMap, mat.roughnessMap, mat.aoMap, mat.metalnessMap, mat.displacementMap].forEach(setRep);
  mat.normalScale.set(ns, ns);
  mat.needsUpdate = true;
  return mat;
}
