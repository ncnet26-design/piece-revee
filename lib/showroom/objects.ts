import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { opt, parseVariant, variantHex, type Generator, type Variant } from "./catalog";
import { FINISH_REFS } from "./generate";

/**
 * Échantillons physiques du showroom et de la planche, en vrai volume et à l'échelle réelle :
 * goutte de peinture laquée, tissu à bords crantés, bois cannelé, quincaillerie moletée, dalle de moquette,
 * cannage ajouré dans son cadre, lé de papier peint. Partagé par les vignettes, la fiche 3D et la planche.
 */
export type SampleShape = "carre" | "rond" | "lame" | "drape" | "nuancier" | "goutte" | "piece" | "dechire";
/** Matériau de la déclinaison, une unité de coordonnée de texture couvrant `metersPerUv` mètres. */
export type MatFor = (metersPerUv: number, otherRef?: string) => Promise<THREE.Material>;

/** Forme « naturelle » de chaque famille : celle d'un échantillon que l'on recevrait. */
export function naturalShape(gen: Generator): SampleShape {
  switch (gen) {
    case "paint": return "goutte";
    case "fabric": case "leather": return "drape";
    case "fluted": case "hardware": case "wallpaper": case "carpet": case "cane": case "object": case "lighting": case "electric": case "sofa": case "rug": case "art": case "styling": return "piece";
    case "wood": return "lame";
    default: return "carre";
  }
}
/** Formes proposées dans la planche, la naturelle d'abord. */
export function shapesForGen(gen: Generator): SampleShape[] {
  switch (gen) {
    case "paint": return ["goutte", "nuancier", "carre", "rond"];
    case "fabric": return ["drape", "dechire", "carre", "rond"];
    case "leather": return ["drape", "carre", "rond"];
    case "wood": return ["lame", "carre", "rond"];
    case "metal": return ["rond", "carre", "lame"];
    case "hardware": case "object": case "lighting": case "electric": case "sofa": case "rug": case "art": case "styling": return ["piece"];
    case "fluted": return ["piece", "carre"];
    case "wallpaper": return ["piece", "dechire", "carre", "rond"];
    case "carpet": case "cane": return ["piece", "carre", "rond"];
    default: return ["carre", "rond", "lame"];
  }
}

const thickness = (gen: Generator) => ({ paint: 0.004, leather: 0.004, metal: 0.005, fabric: 0.003, wood: 0.016, fluted: 0.02, hardware: 0.005, wallpaper: 0.0012, carpet: 0.009, cane: 0.004 } as Partial<Record<Generator, number>>)[gen] ?? 0.013;
/** Couleur de la tranche quand la matière n'est qu'en surface (émail, couche colorée, peinture). */
export function bodyColor(v: Variant): string | null {
  switch (v.family.id) {
    case "zellige": return "#A9674B";
    case "faience": return "#E7E1D5";
    case "ciment": return "#A8A49B";
    case "peinture": return "#EFEBE4";
    case "papier-peint": return "#F4F1EA";
    default: return null;
  }
}

/* ——— Outils ——— */
const shared = new Map<string, THREE.Material>();
function plain(color: string, roughness = 0.8, extra: THREE.MeshPhysicalMaterialParameters = {}): THREE.Material {
  const k = `${color}|${roughness}|${JSON.stringify(extra)}`;
  let m = shared.get(k);
  if (!m) { m = new THREE.MeshPhysicalMaterial({ color, roughness, ...extra }); m.userData.shared = true; shared.set(k, m); }
  return m;
}
/** Plaque à bords adoucis, coordonnées de texture en mètres (dessus comme tranches). */
function slab(w: number, t: number, d: number, M: number, radius = Math.min(0.0025, t / 3)): THREE.BufferGeometry {
  const geo = new RoundedBoxGeometry(w, t, d, 3, radius);
  const uv = geo.attributes.uv as THREE.BufferAttribute, pos = geo.attributes.position as THREE.BufferAttribute, nrm = geo.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    const ny = Math.abs(nrm.getY(i)), nx = Math.abs(nrm.getX(i));
    if (ny > 0.5) uv.setXY(i, (pos.getX(i) + w / 2) / M, (pos.getZ(i) + d / 2) / M);
    else if (nx > 0.5) uv.setXY(i, (pos.getZ(i) + d / 2) / M, (pos.getY(i) + t / 2) / M);
    else uv.setXY(i, (pos.getX(i) + w / 2) / M, (pos.getY(i) + t / 2) / M);
  }
  return geo;
}
let pinkMask: THREE.Texture | null = null, roundMask: THREE.Texture | null = null, tornMask: THREE.Texture | null = null;
/** Bords crantés au ciseau à cranter (tissus) ou coins arrondis (cuirs), en masque de découpe. */
function edgeMask(kind: "pinked" | "round" | "torn"): THREE.Texture {
  if (kind === "torn" && tornMask) return tornMask;
  if (kind === "pinked" && pinkMask) return pinkMask;
  if (kind === "round" && roundMask) return roundMask;
  const S = 1024, c = document.createElement("canvas"); c.width = c.height = S;
  const x = c.getContext("2d")!; x.fillStyle = "#000"; x.fillRect(0, 0, S, S); x.fillStyle = "#fff";
  if (kind === "round") { x.beginPath(); x.roundRect(S * 0.012, S * 0.012, S * 0.976, S * 0.976, S * 0.03); x.fill(); }
  else if (kind === "torn") {
    // Bords déchirés à la main : fibres irrégulières sur les longs côtés, coupe nette en haut et en bas.
    let seed = 7; const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const m = S * 0.03, pts: Array<[number, number]> = [];
    for (let y = 0; y <= S; y += 6) pts.push([m + (R() * 0.6 + Math.sin(y * 0.021) * 0.4 + 0.5) * S * 0.025, y]);
    for (let y = S; y >= 0; y -= 6) pts.push([S - m - (R() * 0.6 + Math.cos(y * 0.017) * 0.4 + 0.5) * S * 0.025, y]);
    x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();
  }
  else {
    const teeth = 46, m = S * 0.012, depth = S * 0.011, step = (S - 2 * m) / teeth;
    x.beginPath(); x.moveTo(m + depth, m + depth);
    for (let i = 0; i <= teeth; i++) x.lineTo(m + i * step, i % 2 ? m : m + depth);
    for (let i = 0; i <= teeth; i++) x.lineTo(S - m - (i % 2 ? 0 : depth), m + i * step);
    for (let i = 0; i <= teeth; i++) x.lineTo(S - m - i * step, S - m - (i % 2 ? 0 : depth));
    for (let i = 0; i <= teeth; i++) x.lineTo(i % 2 ? m : m + depth, S - m - i * step);
    x.closePath(); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.userData.shared = true;
  if (kind === "pinked") pinkMask = t; else if (kind === "torn") tornMask = t; else roundMask = t;
  return t;
}
let knurlTex: THREE.Texture | null = null;
/** Moletage en pointes de diamant : carte de relief calculée, répétée au pas réel (≈ 1 mm). */
function knurl(): THREE.Texture {
  if (knurlTex) return knurlTex;
  const S = 128, c = document.createElement("canvas"); c.width = c.height = S;
  const x = c.getContext("2d")!, im = x.createImageData(S, S), hgt = new Float32Array(S * S);
  const tri = (v: number) => Math.abs(((v % 1) + 1) % 1 - 0.5) * 2;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const u = i / S, v = j / S; hgt[j * S + i] = 1 - Math.max(tri(u + v), tri(u - v)); }
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const l = hgt[j * S + ((i + S - 1) % S)]!, r = hgt[j * S + ((i + 1) % S)]!, u = hgt[((j + S - 1) % S) * S + i]!, d = hgt[((j + 1) % S) * S + i]!;
    const nx = -(r - l) * 6, ny = (d - u) * 6, len = Math.hypot(nx, ny, 1), k = (j * S + i) * 4;
    im.data[k] = (nx / len * 0.5 + 0.5) * 255; im.data[k + 1] = (ny / len * 0.5 + 0.5) * 255; im.data[k + 2] = (1 / len * 0.5 + 0.5) * 255; im.data[k + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.userData.shared = true;
  return (knurlTex = t);
}
let strieTex: THREE.Texture | null = null;
/** Stries en spirale (bouton strié) : arêtes obliques régulières. */
function stries(base: THREE.Material, ru: number, rv: number): THREE.Material {
  if (!strieTex) {
    const S = 128, c = document.createElement("canvas"); c.width = c.height = S;
    const x = c.getContext("2d")!, im = x.createImageData(S, S);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const t = ((i + j) / S) % 1, slope = Math.cos(t * Math.PI * 2), k = (j * S + i) * 4, nx = -slope * 0.6, len = Math.hypot(nx, nx, 1);
      im.data[k] = (nx / len * 0.5 + 0.5) * 255; im.data[k + 1] = (-nx / len * 0.5 + 0.5) * 255; im.data[k + 2] = (1 / len * 0.5 + 0.5) * 255; im.data[k + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    strieTex = new THREE.CanvasTexture(c); strieTex.wrapS = strieTex.wrapT = THREE.RepeatWrapping; strieTex.colorSpace = THREE.NoColorSpace; strieTex.userData.shared = true;
  }
  const m = (base as THREE.MeshPhysicalMaterial).clone(), t = strieTex.clone(); t.repeat.set(ru, rv); t.needsUpdate = true;
  m.normalMap = t; m.normalScale.set(1.6, 1.6); m.anisotropy = 0;
  return m;
}
function knurled(base: THREE.Material, ru: number, rv: number): THREE.Material {
  const m = (base as THREE.MeshPhysicalMaterial).clone();
  const t = knurl().clone(); t.repeat.set(ru, rv); t.needsUpdate = true;
  m.normalMap = t; m.normalScale.set(1.4, 1.4); m.anisotropy = 0;
  return m;
}

/* ——— Formes ——— */
/** Goutte de peinture fraîche : dôme laqué qui s'étire en pointe, posé à plat. */
function dropGeometry(R: number, seed: number): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 160, 96), p = g.attributes.position as THREE.BufferAttribute;
  const phi0 = 2.2 + (seed % 100) / 100;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const phi = Math.atan2(z, x), tail = Math.max(0, Math.cos(phi - phi0)), s = (1 + 0.62 * tail ** 4) * (1 + 0.025 * Math.sin(3 * phi + 1.3) + 0.015 * Math.sin(7 * phi));
    y = y < 0 ? y * 0.05 : y * 0.46 * (1 - 0.5 * tail ** 2) * (1 - 0.12 * (x * x + z * z));
    x *= s; z *= s;
    p.setXYZ(i, x * R, y * R, z * R);
  }
  g.computeVertexNormals();
  return g;
}
/** Tissu posé : quasi à plat, quelques ondulations souples et un coin qui se soulève. */
function drapeGeometry(size: number, seg = 96): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / size, z = p.getZ(i) / size;
    const wave = Math.max(0, Math.sin((x + 0.2) * Math.PI * 1.6)) * 0.006 * (0.5 + z);
    const corner = Math.max(0, x + z - 0.55) ** 2 * 0.09;
    p.setY(i, 0.0015 + (wave + corner + Math.sin(z * 7 + x * 2.4) * 0.0012) * (size / 0.25));
  }
  g.computeVertexNormals();
  return g;
}
/** Lé de papier peint : feuille fine dont le bout se roule légèrement. */
function sheetGeometry(w: number, l: number): THREE.BufferGeometry {
  // Feuille posée à plat, légèrement ondulée, un coin à peine soulevé.
  const g = new THREE.PlaneGeometry(w, l, 24, 32); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), u = x / w + 0.5, v = z / l + 0.5;
    p.setY(i, 0.0006 + Math.sin(v * Math.PI * 1.3 + 0.4) * 0.0012 + Math.max(0, u + v - 1.55) ** 2 * 0.06);
    uv.setXY(i, (x + w / 2) / 0.2, (l / 2 - z) / 0.2);
  }
  g.computeVertexNormals();
  return g;
}
/** Panneau cannelé : profil extrudé dans le sens du fil (joncs, cannelures), coordonnées en mètres. */
function flutedGeometry(profile: string, W: number, L: number, T: number, M: number): THREE.BufferGeometry {
  const pitch = profile === "joncs-fins" ? 0.012 : 0.02, pts: Array<[number, number]> = [];
  const N = Math.round(W / pitch), w = N * pitch;
  for (let k = 0; k < N; k++) for (let s = 0; s <= 24; s++) {
    const x = -w / 2 + k * pitch + (s / 24) * pitch, dx = x - (-w / 2 + (k + 0.5) * pitch);
    let y = T;
    if (profile === "cannelures") { const rg = pitch * 0.36, flat = T + 0.004; y = Math.abs(dx) < rg ? flat - Math.sqrt(rg * rg - dx * dx) * 0.8 : flat; }
    else { const r = pitch / 2; y = T + Math.sqrt(Math.max(0, r * r - dx * dx)) * 0.7; }
    pts.push([x, y]);
  }
  const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0);
  for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(pts[i]![0], pts[i]![1]);
  shape.closePath();
  const V = THREE.Vector2;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: L, bevelEnabled: false, steps: 1,
    UVGenerator: {
      generateTopUV: (_g, v, a, b, c) => [new V(v[a * 3]! / M, v[a * 3 + 1]! / M), new V(v[b * 3]! / M, v[b * 3 + 1]! / M), new V(v[c * 3]! / M, v[c * 3 + 1]! / M)],
      generateSideWallUV: (_g, v, a, b, c, d) => [a, b, c, d].map((i) => new V(v[i * 3 + 2]! / M, (v[i * 3]! + v[i * 3 + 1]!) / M)),
    },
  });
  geo.translate(0, 0, -L / 2);
  return geo;
}

async function hardware(model: string, metal: THREE.Material): Promise<{ g: THREE.Group; h: number }> {
  const g = new THREE.Group(), add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, rx = 0, rz = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.rotation.set(rx, 0, rz); g.add(mesh); return mesh; };
  const rosette = (r: number, t: number) => new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(r, 0), new THREE.Vector2(r, t * 0.55), new THREE.Vector2(r * 0.93, t), new THREE.Vector2(0, t)], 96);
  let h = 0.03;
  switch (model) {
    case "barre-moletee": {
      // Barre Ø 15 mm sur deux plots, moletée au centre, posée comme sur une porte.
      const L = 0.26, r = 0.0075, y = 0.034, span = 0.2;
      for (const x of [-span / 2, span / 2]) { add(rosette(0.016, 0.004), metal, x, 0, 0); add(new THREE.CylinderGeometry(0.0055, 0.0065, y, 48), metal, x, y / 2, 0); }
      const bar = (len: number, m: THREE.Material, x: number) => add(new THREE.CylinderGeometry(r, r, len, 64, 1, true), m, x, y + r * 0.2, 0, 0, Math.PI / 2);
      bar(0.16, knurled(metal, Math.round(2 * Math.PI * r / 0.0011), Math.round(0.16 / 0.0011)), 0);
      bar(0.05, metal, -0.105); bar(0.05, metal, 0.105);
      for (const s of [-1, 1]) add(new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), metal, s * L / 2, y + r * 0.2, 0, 0, -s * Math.PI / 2).scale.set(1, 0.35, 1);
      h = y + r * 2; break;
    }
    case "bouton-molete": case "bouton-rond": {
      add(rosette(0.019, 0.004), metal);
      const knob = new THREE.LatheGeometry([new THREE.Vector2(0, 0.004), new THREE.Vector2(0.006, 0.004), new THREE.Vector2(0.0055, 0.014), new THREE.Vector2(0.012, 0.018), new THREE.Vector2(0.016, 0.022), new THREE.Vector2(0.0165, 0.026), new THREE.Vector2(0.0158, 0.031), new THREE.Vector2(0.008, 0.0335), new THREE.Vector2(0, 0.034)], 96);
      add(knob, metal);
      if (model === "bouton-molete") add(new THREE.CylinderGeometry(0.0166, 0.0166, 0.009, 96, 1, true), knurled(metal, Math.round(2 * Math.PI * 0.0166 / 0.0011), 8), 0, 0.0265, 0);
      h = 0.034; break;
    }
    case "poignee-t": {
      add(rosette(0.012, 0.003), metal);
      add(new THREE.CylinderGeometry(0.004, 0.005, 0.026, 40), metal, 0, 0.016, 0);
      add(new THREE.CapsuleGeometry(0.0055, 0.05, 12, 48), metal, 0, 0.031, 0, 0, Math.PI / 2);
      h = 0.037; break;
    }
    case "coquille": {
      // Coquille demi-lune : platine en demi-disque et creux en quart de sphère, comme une poignée de tiroir ancienne.
      const half = new THREE.Shape(); half.absarc(0, 0, 0.048, 0, Math.PI, false); half.closePath();
      const plate = new THREE.ExtrudeGeometry(half, { depth: 0.003, bevelEnabled: true, bevelSize: 0.0015, bevelThickness: 0.0015, bevelSegments: 3, curveSegments: 96 }); plate.rotateX(-Math.PI / 2);
      add(plate, metal, 0, 0.0015, 0.018);
      const cup = new THREE.SphereGeometry(0.042, 96, 48, 0, Math.PI, 0, Math.PI / 2); cup.scale(1, 0.5, 0.85); cup.rotateY(Math.PI);
      const m1 = add(cup, metal, 0, 0.004, 0.018); (m1.material as THREE.Material).side = THREE.DoubleSide;
      h = 0.026; break;
    }
    case "bouton-strie": {
      add(rosette(0.014, 0.003), metal);
      add(new THREE.CylinderGeometry(0.0065, 0.0065, 0.012, 48), metal, 0, 0.009, 0);
      add(new THREE.CylinderGeometry(0.015, 0.015, 0.028, 96, 1, true), stries(metal, 30, 1), 0, 0.029, 0);
      add(new THREE.CircleGeometry(0.015, 64), metal, 0, 0.043, 0).rotation.x = -Math.PI / 2;
      h = 0.043; break;
    }
    case "pastille": {
      // Pastille d'échantillon de finition, percée pour l'anneau du nuancier.
      const disc = new THREE.Shape(); disc.absarc(0, 0, 0.035, 0, Math.PI * 2, false);
      const hole = new THREE.Path(); hole.absarc(0.0, 0.027, 0.0035, 0, Math.PI * 2, true); disc.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(disc, { depth: 0.002, bevelEnabled: true, bevelSize: 0.0008, bevelThickness: 0.0008, bevelSegments: 2, curveSegments: 128 }); geo.rotateX(-Math.PI / 2);
      add(geo, metal, 0, 0.0008, 0); h = 0.004; break;
    }
    case "robinet": {
      // Mitigeur de cuisine : corps cylindrique, levier latéral, col carré coudé, couché comme sur une planche.
      const r = 0.014;
      const body = add(new THREE.CylinderGeometry(r * 1.6, r * 1.6, 0.13, 64), metal, 0, r * 1.6, 0.12); body.rotation.x = Math.PI / 2;
      const lever = add(new THREE.CapsuleGeometry(0.005, 0.07, 6, 24), metal, 0.05, r * 1.6, 0.13); lever.rotation.z = Math.PI / 2;
      add(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 32), metal, 0.026, r * 1.6, 0.13).rotation.z = Math.PI / 2;
      const path = new THREE.CurvePath<THREE.Vector3>();
      path.add(new THREE.LineCurve3(new THREE.Vector3(0, r, 0.05), new THREE.Vector3(0, r, -0.2)));
      path.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, r, -0.2), new THREE.Vector3(0, r, -0.25), new THREE.Vector3(-0.05, r, -0.25)));
      path.add(new THREE.LineCurve3(new THREE.Vector3(-0.05, r, -0.25), new THREE.Vector3(-0.16, r, -0.25)));
      path.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.16, r, -0.25), new THREE.Vector3(-0.2, r, -0.25), new THREE.Vector3(-0.2, r, -0.21)));
      add(new THREE.TubeGeometry(path as unknown as THREE.Curve<THREE.Vector3>, 160, r, 32), metal);
      add(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.025, 32), metal, -0.2, r, -0.2).rotation.x = Math.PI / 2;
      h = r * 3.2; break;
    }
    case "bequille": {
      // Béquille de porte : rosace épaisse, col, levier moleté terminé en olive.
      add(rosette(0.026, 0.009), metal);
      add(new THREE.CylinderGeometry(0.009, 0.01, 0.03, 64), metal, 0, 0.024, 0);
      add(new THREE.SphereGeometry(0.0105, 48, 24), metal, 0, 0.04, 0);
      add(new THREE.CylinderGeometry(0.0085, 0.0085, 0.11, 64, 1, true), knurled(metal, Math.round(2 * Math.PI * 0.0085 / 0.0011), 100), 0.062, 0.04, 0, 0, Math.PI / 2);
      add(new THREE.SphereGeometry(0.0085, 48, 24), metal, 0.117, 0.04, 0).scale.set(1.2, 1, 1);
      h = 0.05; break;
    }
    default: {
      // Anneau tombant : platine ronde, piton et anneau posé à plat.
      add(rosette(0.02, 0.004), metal);
      add(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 32), metal, 0, 0.008, 0);
      add(new THREE.TorusGeometry(0.024, 0.0042, 32, 128), metal, 0, 0.0052, 0.02, -Math.PI / 2);
      h = 0.012;
    }
  }
  return { g, h };
}


/* ——— Objets de design ——— */
/** Tour de potier : profil [rayon, hauteur] (extérieur puis intérieur), coordonnées de texture en mètres. */
function lathe(pts: Array<[number, number]>, seg = 128): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y)), seg);
  const uv = g.attributes.uv as THREE.BufferAttribute, pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) { const x = pos.getX(i), z = pos.getZ(i); uv.setXY(i, (Math.atan2(z, x) / (2 * Math.PI) + 0.5) * 0.6, pos.getY(i) * 1.6); }
  g.computeVertexNormals();
  return g;
}
/** Vase à paroi épaisse : profil extérieur (r, y), refermé par une paroi intérieure d'épaisseur e. */
function vessel(outer: Array<[number, number]>, e = 0.006): THREE.BufferGeometry {
  const top = outer[outer.length - 1]!, inner = [...outer].reverse().slice(0, -1).map(([r, y]) => [r - e, y] as [number, number]).filter(([, y]) => y > e * 1.5);
  return lathe([[0, 0], ...outer, [top[0] - e / 2, top[1] + 0.0015], ...inner, [0, e * 1.5]]);
}
let wax: THREE.Material | null = null, opal: THREE.Material | null = null, mirror: THREE.Material | null = null, leaf: THREE.Material | null = null;
function designObject(forme: string, mat: THREE.Material): { g: THREE.Group; h: number } {
  const g = new THREE.Group(), add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); g.add(mesh); return mesh; };
  wax ??= plain("#F1E8D6", 0.55, { sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color("#fff4dd") });
  opal ??= plain("#F7F3EC", 0.3, { transmission: 0.35, thickness: 0.02, emissive: new THREE.Color("#FFE9C6"), emissiveIntensity: 0.35 });
  mirror ??= plain("#D9DEE0", 0.02, { metalness: 1 });
  leaf ??= plain("#3F5E35", 0.75, { sheen: 0.3, sheenColor: new THREE.Color("#9BB57A") });
  let h = 0.3;
  switch (forme) {
    case "vase-amphore": add(vessel([[0.07, 0], [0.085, 0.03], [0.12, 0.13], [0.118, 0.2], [0.08, 0.29], [0.05, 0.33], [0.055, 0.36], [0.062, 0.38]]), mat); h = 0.38; break;
    case "vase-boule": { const pts: Array<[number, number]> = []; for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + (i / 24) * Math.PI * 0.86; pts.push([Math.cos(a) * 0.12, 0.12 + Math.sin(a) * 0.12]); } pts.push([0.04, 0.235], [0.045, 0.25]); add(vessel(pts.filter(([, y]) => y >= 0)), mat); h = 0.25; break; }
    case "vase-cylindre": add(vessel([[0.06, 0], [0.064, 0.005], [0.068, 0.3]], 0.005), mat); h = 0.3; break;
    case "soliflore": add(vessel([[0.04, 0], [0.055, 0.04], [0.056, 0.1], [0.03, 0.15], [0.012, 0.2], [0.014, 0.22]], 0.004), mat); h = 0.22; break;
    case "coupe": add(lathe([[0, 0], [0.045, 0], [0.045, 0.008], [0.02, 0.015], [0.022, 0.03], [0.1, 0.055], [0.14, 0.085], [0.142, 0.09], [0.132, 0.088], [0.09, 0.06], [0, 0.038]]), mat); h = 0.09; break;
    case "bougeoir": add(lathe([[0, 0], [0.055, 0], [0.056, 0.01], [0.04, 0.02], [0.014, 0.04], [0.012, 0.17], [0.022, 0.18], [0.03, 0.2], [0.03, 0.21], [0.012, 0.21], [0, 0.205]]), mat); add(new THREE.CylinderGeometry(0.011, 0.011, 0.12, 48), wax, 0, 0.265, 0); h = 0.325; break;
    case "lampe-champignon": add(lathe([[0, 0], [0.075, 0], [0.076, 0.012], [0.03, 0.03], [0.022, 0.2], [0, 0.2]]), mat); add(lathe([[0, 0.31], [0.06, 0.305], [0.12, 0.27], [0.15, 0.215], [0.152, 0.205], [0.13, 0.205], [0.06, 0.215], [0, 0.22]]), mat); h = 0.31; break;
    case "lampe-globe": add(lathe([[0, 0], [0.07, 0], [0.072, 0.01], [0.062, 0.12], [0.03, 0.14], [0, 0.14]]), mat); add(new THREE.SphereGeometry(0.1, 96, 64), opal, 0, 0.235, 0); h = 0.335; break;
    case "gueridon": add(lathe([[0, 0], [0.17, 0], [0.172, 0.012], [0.16, 0.02], [0.05, 0.03], [0.045, 0.5], [0.06, 0.52], [0, 0.52]]), mat); add(lathe([[0, 0.52], [0.25, 0.52], [0.252, 0.535], [0.248, 0.55], [0, 0.55]]), mat); h = 0.55; break;
    case "table-tambour": add(lathe([[0, 0], [0.38, 0], [0.395, 0.015], [0.4, 0.04], [0.4, 0.32], [0.39, 0.345], [0.37, 0.35], [0, 0.35]]), mat); h = 0.35; break;
    case "tabouret": {
      add(lathe([[0, 0.42], [0.17, 0.42], [0.175, 0.435], [0.17, 0.455], [0, 0.455]]), mat);
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2, leg = add(new THREE.CylinderGeometry(0.016, 0.012, 0.44, 24), mat, Math.cos(a) * 0.11, 0.21, Math.sin(a) * 0.11); leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); }
      h = 0.455; break;
    }
    case "miroir-arche": {
      const W = 0.5, H = 0.9, r = W / 2, f = 0.035;
      const arch = (w: number, hh: number) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, hh - w / 2); s.absarc(0, hh - w / 2, w / 2, 0, Math.PI, false); s.closePath(); return s; };
      const frame = arch(W, H); frame.holes.push(arch(W - 2 * f, H - f) as unknown as THREE.Path);
      const fg = new THREE.ExtrudeGeometry(frame, { depth: 0.025, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 3, curveSegments: 64 });
      add(fg, mat, 0, 0.004, -0.0125);
      add(new THREE.ShapeGeometry(arch(W - 2 * f + 0.004, H - f + 0.002), 64), mirror, 0, 0.004, 0.0);
      g.rotation.x = 0; void r; h = H; break;
    }
    case "jardiniere": {
      add(vessel([[0.12, 0], [0.125, 0.01], [0.17, 0.26], [0.172, 0.28]], 0.012), mat);
      const ball = new THREE.IcosahedronGeometry(0.17, 6), p = ball.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), n = Math.sin(v.x * 140) * Math.sin(v.y * 150) * Math.sin(v.z * 130); v.multiplyScalar(1 + n * 0.035 + (Math.sin(v.x * 37 + v.z * 23) * 0.02)); p.setXYZ(i, v.x, v.y, v.z); }
      ball.computeVertexNormals(); add(ball, leaf, 0, 0.4, 0); h = 0.57; break;
    }
    case "plateau": {
      const ell = (rx: number, rz: number) => { const s = new THREE.Shape(); s.absellipse(0, 0, rx, rz, 0, Math.PI * 2, false, 0); return s; };
      const base = new THREE.ExtrudeGeometry(ell(0.225, 0.15), { depth: 0.008, bevelEnabled: false, curveSegments: 96 }); base.rotateX(-Math.PI / 2); add(base, mat);
      const ring = ell(0.225, 0.15); ring.holes.push(ell(0.212, 0.137) as unknown as THREE.Path);
      const rim = new THREE.ExtrudeGeometry(ring, { depth: 0.032, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 2, curveSegments: 96 }); rim.rotateX(-Math.PI / 2); add(rim, mat);
      h = 0.034; break;
    }
    default: {
      // Sculpture : trois volumes galbés posés en équilibre.
      for (const [r, y, x, sy] of [[0.11, 0.09, 0, 0.8], [0.075, 0.22, 0.02, 0.85], [0.05, 0.315, -0.01, 0.95]] as Array<[number, number, number, number]>) add(new THREE.SphereGeometry(r, 96, 64), mat, x, y, 0).scale.set(1, sy, 1);
      h = 0.36;
    }
  }
  return { g, h };
}


/* ——— Luminaires, interrupteurs, assises, tapis, tableaux ——— */
const glow = (hex: string, k = 2.2) => plain(hex, 0.4, { emissive: new THREE.Color(hex), emissiveIntensity: k });
function canopy(g: THREE.Group, fin: THREE.Material, top: number, from: number) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.025, 64), fin); c.position.y = top; g.add(c);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, top - from, 12), plain("#1E1E1E", 0.6)); cord.position.y = (top + from) / 2; g.add(cord);
}
function lighting(forme: string, fin: THREE.Material, light: string): { g: THREE.Group; h: number } {
  const g = new THREE.Group(), add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); g.add(mesh); return mesh; };
  const bulb = glow(light, 2.6), diffuser = plain("#F7F3EC", 0.35, { transmission: 0.3, thickness: 0.01, emissive: new THREE.Color(light), emissiveIntensity: 0.9 }), white = plain("#F2F0EC", 0.6);
  let h = 0.5;
  switch (forme) {
    case "lustre-spoutnik": {
      add(new THREE.SphereGeometry(0.045, 64, 32), fin, 0, 0.3, 0);
      const N = 14;
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996, dir = new THREE.Vector3(Math.cos(a) * r, y * 0.75, Math.sin(a) * r).normalize();
        const rod = add(new THREE.CylinderGeometry(0.004, 0.004, 0.26, 12), fin, ...dir.clone().multiplyScalar(0.13).add(new THREE.Vector3(0, 0.3, 0)).toArray() as [number, number, number]);
        rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        add(new THREE.SphereGeometry(0.018, 24, 16), bulb, ...dir.clone().multiplyScalar(0.27).add(new THREE.Vector3(0, 0.3, 0)).toArray() as [number, number, number]);
      }
      canopy(g, fin, 0.72, 0.34); h = 0.73; break;
    }
    case "lustre-anneaux": {
      for (const [r, y] of [[0.32, 0.12], [0.24, 0.2], [0.16, 0.28]] as Array<[number, number]>) {
        const ring = add(new THREE.TorusGeometry(r, 0.012, 24, 160), fin, 0, y, 0); ring.rotation.x = Math.PI / 2;
        const led = add(new THREE.TorusGeometry(r, 0.0045, 12, 160), bulb, 0, y - 0.011, 0); led.rotation.x = Math.PI / 2;
        for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; add(new THREE.CylinderGeometry(0.001, 0.001, 0.62 - y, 6), plain("#888", 0.4), Math.cos(a) * r * 0.98, (0.62 + y) / 2, Math.sin(a) * r * 0.98); }
      }
      add(new THREE.CylinderGeometry(0.06, 0.065, 0.025, 64), fin, 0, 0.62, 0); h = 0.63; break;
    }
    case "suspension-globe": add(new THREE.SphereGeometry(0.15, 96, 64), diffuser, 0, 0.16, 0); add(new THREE.CylinderGeometry(0.035, 0.03, 0.04, 48), fin, 0, 0.32, 0); canopy(g, fin, 0.62, 0.34); h = 0.63; break;
    case "suspension-cloche": {
      const shade = lathe([[0.2, 0], [0.19, 0.02], [0.15, 0.09], [0.08, 0.16], [0.03, 0.2], [0.02, 0.21]]);
      const outer = add(shade, fin); (outer.material as THREE.Material).side = THREE.FrontSide;
      add(lathe([[0.194, 0.002], [0.145, 0.09], [0.075, 0.155], [0.02, 0.2]]), white).scale.set(1, 1, 1);
      add(new THREE.SphereGeometry(0.04, 32, 16), bulb, 0, 0.08, 0);
      canopy(g, fin, 0.5, 0.21); h = 0.51; void outer; break;
    }
    case "applique-demi-lune": {
      const half = new THREE.Shape(); half.absarc(0, 0, 0.16, 0, Math.PI, false); half.closePath();
      add(new THREE.ExtrudeGeometry(half, { depth: 0.012, bevelEnabled: false, curveSegments: 96 }), fin, 0, 0.02, 0);
      const front = new THREE.Shape(); front.absarc(0, 0, 0.145, 0, Math.PI, false); front.closePath();
      add(new THREE.ExtrudeGeometry(front, { depth: 0.07, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 4, curveSegments: 96 }), diffuser, 0, 0.026, 0.012);
      h = 0.2; break;
    }
    case "applique-bras": {
      add(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 64), fin, 0, 0.2, 0).rotation.x = Math.PI / 2;
      const arm = add(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 16), fin, 0, 0.2, 0.13); arm.rotation.x = Math.PI / 2;
      const shade = add(lathe([[0.1, 0], [0.09, 0.02], [0.05, 0.1], [0.02, 0.13]]), fin, 0, 0.12, 0.26); void shade;
      add(new THREE.SphereGeometry(0.03, 24, 16), bulb, 0, 0.14, 0.26); h = 0.25; break;
    }
    case "spot-encastre": {
      add(lathe([[0.042, 0], [0.046, 0.002], [0.046, 0.006], [0.036, 0.007], [0.03, 0.004], [0.016, -0.02], [0, -0.02]]), fin, 0, 0.022, 0);
      add(new THREE.CircleGeometry(0.014, 32), bulb, 0, 0.0035, 0).rotation.x = -Math.PI / 2;
      h = 0.03; break;
    }
    case "rail-spots": {
      add(slab(0.8, 0.03, 0.035, 0.3, 0.004), fin, 0, 0.18, 0);
      for (const x of [-0.26, 0, 0.26]) {
        add(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 12), fin, x, 0.14, 0);
        const head = add(new THREE.CylinderGeometry(0.035, 0.032, 0.11, 48), fin, x, 0.09, 0.02); head.rotation.x = 0.6;
        const lens = add(new THREE.CircleGeometry(0.026, 32), bulb, x, 0.048, 0.05); lens.rotation.x = Math.PI / 2 + 0.6;
      }
      h = 0.2; break;
    }
    case "ruban-led": {
      // Profilé aluminium en U et diffuseur opalin allumé.
      for (const x of [-0.009, 0.009]) add(slab(0.002, 0.012, 0.6, 0.3, 0.0004), fin, x, 0.006, 0);
      add(slab(0.02, 0.002, 0.6, 0.3, 0.0004), fin, 0, 0.001, 0);
      add(slab(0.016, 0.002, 0.6, 0.3, 0.0005), glow(light, 3), 0, 0.011, 0);
      h = 0.012; break;
    }
    case "lampadaire-arc": {
      add(lathe([[0, 0], [0.16, 0], [0.165, 0.02], [0.15, 0.04], [0.02, 0.05], [0, 0.05]]), fin);
      const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, 1.9, 0), new THREE.Vector3(1.2, 2.1, 0), new THREE.Vector3(1.35, 1.75, 0));
      add(new THREE.TubeGeometry(curve, 120, 0.012, 16), fin);
      add(lathe([[0.2, 0], [0.19, 0.03], [0.12, 0.12], [0.03, 0.17]]), fin, 1.35, 1.58, 0);
      add(new THREE.SphereGeometry(0.035, 24, 16), bulb, 1.35, 1.63, 0); h = 2.05; break;
    }
    default: {
      // Lampe à poser : pied galbé et abat-jour plissé allumé.
      add(lathe([[0, 0], [0.07, 0], [0.075, 0.01], [0.055, 0.05], [0.065, 0.14], [0.03, 0.22], [0.012, 0.25], [0, 0.25]]), fin);
      const sh = new THREE.CylinderGeometry(0.1, 0.17, 0.2, 144, 4, true), sp = sh.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), z = sp.getZ(i), a = Math.atan2(z, x), k = 1 + 0.045 * Math.abs(Math.sin(a * 24)); sp.setX(i, x * k); sp.setZ(i, z * k); }
      sh.computeVertexNormals();
      add(sh, plain("#F3EDE2", 0.8, { side: THREE.DoubleSide, emissive: new THREE.Color(light), emissiveIntensity: 0.55, sheen: 0.4, sheenColor: new THREE.Color("#ffffff") }), 0, 0.33, 0);
      add(new THREE.SphereGeometry(0.03, 24, 16), bulb, 0, 0.3, 0); h = 0.43;
    }
  }
  return { g, h };
}
function electric(modele: string, fin: THREE.Material): { g: THREE.Group; h: number } {
  const g = new THREE.Group(), dark = plain("#1A1A1A", 0.6), add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); g.add(mesh); return mesh; };
  const double = modele === "prise-double", W = double ? 0.157 : 0.086;
  add(new RoundedBoxGeometry(W, 0.009, 0.086, 4, 0.003), fin, 0, 0.0045, 0);
  const well = (x: number, usb: boolean) => {
    add(lathe([[0.024, 0], [0.024, 0.001], [0.021, 0.001], [0.0215, -0.008], [0, -0.008]]), fin, x, 0.009, 0);
    for (const dx of [-0.0095, 0.0095]) add(new THREE.CylinderGeometry(0.0024, 0.0024, 0.0012, 16), dark, x + dx, 0.0012, 0);
    add(new THREE.CylinderGeometry(0.0022, 0.0022, 0.006, 16), fin, x, 0.004, -0.0155);
    if (usb) for (const dz of [0.033, 0.04]) add(new RoundedBoxGeometry(0.009, 0.001, 0.0032, 2, 0.0012), dark, x + 0.028, 0.0091, dz);
  };
  const lever = (x: number) => { add(new THREE.SphereGeometry(0.011, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), fin, x, 0.009, 0).scale.set(1, 0.4, 1); const l = add(new THREE.CapsuleGeometry(0.0038, 0.016, 6, 24), fin, x, 0.016, 0.004); l.rotation.x = 0.55; };
  switch (modele) {
    case "bascule": lever(0); break;
    case "double": lever(-0.016); lever(0.016); break;
    case "poussoir": add(new THREE.CylinderGeometry(0.014, 0.014, 0.002, 48), fin, 0, 0.01, 0); add(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 48), fin, 0, 0.012, 0); break;
    case "variateur": add(new THREE.CylinderGeometry(0.015, 0.015, 0.014, 64, 1, true), knurled(fin, 86, 10), 0, 0.016, 0); add(new THREE.CylinderGeometry(0.0148, 0.0148, 0.001, 64), fin, 0, 0.023, 0); break;
    case "prise": well(0, false); break;
    case "prise-double": well(-0.0355, false); well(0.0355, false); break;
    default: well(-0.006, true);
  }
  return { g, h: 0.02 };
}
function sofa(modele: string, fab: THREE.Material): { g: THREE.Group; h: number } {
  const g = new THREE.Group(), leg = plain("#3B2A1E", 0.5, { clearcoat: 0.3 }), M = 0.5;
  const box = (w: number, hh: number, d: number, x: number, y: number, z: number, r = 0.06) => { const m = new THREE.Mesh(slab(w, hh, d, M, Math.min(r, hh / 2.1, w / 2.1, d / 2.1)), fab); m.position.set(x, y + hh / 2, z); g.add(m); return m; };
  const legs = (w: number, d: number, hh = 0.07) => { for (const [x, z] of [[-w / 2 + 0.06, -d / 2 + 0.06], [w / 2 - 0.06, -d / 2 + 0.06], [-w / 2 + 0.06, d / 2 - 0.06], [w / 2 - 0.06, d / 2 - 0.06]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, hh, 16), leg); l.position.set(x!, hh / 2, z!); g.add(l); } };
  switch (modele) {
    case "canape-courbe": {
      const sector = (r0: number, r1: number) => { const s0 = new THREE.Shape(), a0 = Math.PI * 0.22, a1 = Math.PI * 0.78; s0.absarc(0, 0, r1, a0, a1, false); s0.absarc(0, 0, r0, a1, a0, true); s0.closePath(); return s0; };
      const ext = (sh: THREE.Shape, hh: number, y: number) => { const geo = new THREE.ExtrudeGeometry(sh, { depth: hh, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 6, curveSegments: 96 }); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, fab); m.position.set(0, y, 1.25); g.add(m); };
      ext(sector(0.62, 1.42), 0.3, 0.05); ext(sector(1.22, 1.42), 0.38, 0.4);
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 0.05, 96, 1, false, -Math.PI * 0.28, Math.PI * 0.56), leg); plinth.position.set(0, 0.025, 1.25); plinth.visible = false; g.add(plinth);
      return { g, h: 0.85 };
    }
    case "fauteuil": legs(0.82, 0.8); box(0.82, 0.24, 0.8, 0, 0.07, 0, 0.08); box(0.6, 0.14, 0.62, 0, 0.31, 0.06, 0.06); box(0.82, 0.42, 0.2, 0, 0.31, -0.3, 0.09); box(0.16, 0.26, 0.8, -0.33, 0.31, 0, 0.08); box(0.16, 0.26, 0.8, 0.33, 0.31, 0, 0.08); return { g, h: 0.73 };
    case "banquette": legs(1.4, 0.45, 0.32); box(1.4, 0.14, 0.45, 0, 0.32, 0, 0.05); return { g, h: 0.46 };
    case "pouf": { const m = new THREE.Mesh(lathe([[0, 0], [0.27, 0], [0.3, 0.03], [0.31, 0.2], [0.3, 0.37], [0.26, 0.4], [0, 0.405]]), fab); g.add(m); return { g, h: 0.4 }; }
    default:
      legs(2.1, 0.92); box(2.1, 0.24, 0.92, 0, 0.07, 0, 0.08);
      for (const x of [-0.62, 0, 0.62]) box(0.62, 0.15, 0.66, x, 0.31, 0.08, 0.07);
      box(1.7, 0.38, 0.22, 0, 0.31, -0.33, 0.1); box(0.2, 0.26, 0.92, -0.95, 0.31, 0, 0.09); box(0.2, 0.26, 0.92, 0.95, 0.31, 0, 0.09);
      return { g, h: 0.8 };
  }
}
function rug(forme: string, mat: THREE.Material): { g: THREE.Group; h: number } {
  const g = new THREE.Group(), t = 0.012;
  if (forme === "rond") { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, t, 160), [mat, mat, mat]); m.position.y = t / 2; g.add(m); return { g, h: t }; }
  const [W, L] = forme === "passage" ? [0.8, 2.4] : [2, 3];
  const m = new THREE.Mesh(new THREE.BoxGeometry(W, t, L), mat); m.position.y = t / 2; g.add(m);
  // Franges nouées aux deux extrémités.
  const n = Math.round(W / 0.022), fr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0022, 0.0018, 0.08, 6), plain("#E9E1D2", 0.9), n * 2), o = new THREE.Object3D();
  for (let i = 0; i < n * 2; i++) { const end = i < n ? -1 : 1, k = i % n; o.position.set(-W / 2 + (k + 0.5) * (W / n), 0.003, end * (L / 2 + 0.038)); o.rotation.set(Math.PI / 2, (Math.sin(i * 7.1) * 0.12), 0); o.updateMatrix(); fr.setMatrixAt(i, o.matrix); }
  g.add(fr);
  return { g, h: t };
}
async function artwork(cadre: string, art: THREE.Material, matFor: MatFor): Promise<{ g: THREE.Group; h: number }> {
  const g = new THREE.Group(), W = 0.5, H = 0.7;
  if (cadre === "toile") { const m = new THREE.Mesh(new THREE.BoxGeometry(W, 0.035, H), [art, art, art, art, art, art]); m.position.y = 0.0175; g.add(m); return { g, h: 0.035 }; }
  const bar = cadre === "laiton" ? 0.012 : 0.035, hh = cadre === "laiton" ? 0.02 : 0.032;
  const frameMat = cadre === "chene" ? await matFor(0.3, "sr:cannele:chene:joncs:huile") : cadre === "laiton" ? await matFor(0.2, FINISH_REFS.laiton) : plain("#1C1C1C", 0.45, { clearcoat: 0.2 });
  const pp = 0.05, ow = W + 2 * pp + 2 * bar, oh = H + 2 * pp + 2 * bar;
  for (const [x, z, w, d] of [[0, -oh / 2 + bar / 2, ow, bar], [0, oh / 2 - bar / 2, ow, bar], [-ow / 2 + bar / 2, 0, bar, oh - 2 * bar], [ow / 2 - bar / 2, 0, bar, oh - 2 * bar]] as Array<[number, number, number, number]>) {
    const m = new THREE.Mesh(slab(w, hh, d, 0.3, 0.003), frameMat); m.position.set(x, hh / 2, z); g.add(m);
  }
  const mount = new THREE.Mesh(new THREE.BoxGeometry(ow - 2 * bar, 0.012, oh - 2 * bar), plain("#F6F3EC", 0.9)); mount.position.y = 0.006; g.add(mount);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(W, H), art); pic.rotation.x = -Math.PI / 2; pic.position.y = 0.0122; g.add(pic);
  return { g, h: hh };
}


/* ——— Objets de stylisme ——— */
/** Tige effilée le long d'une courbe (bois, tige de fleur). */
function taperTube(curve: THREE.Curve<THREE.Vector3>, r0: number, r1: number, seg = 96): THREE.BufferGeometry {
  const g = new THREE.TubeGeometry(curve, seg, 1, 12, false), p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const ring = Math.floor(i / 13), t = ring / seg, c = curve.getPointAt(Math.min(1, t)), v = new THREE.Vector3().fromBufferAttribute(p, i).sub(c);
    v.setLength((r0 + (r1 - r0) * t) * (1 + Math.sin(t * 40) * 0.06)); p.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z);
  }
  g.computeVertexNormals();
  return g;
}
const spline = (pts: Array<[number, number, number]>) => new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
async function styling(objet: string, mat: THREE.Material, matFor: MatFor): Promise<{ g: THREE.Group; h: number }> {
  const g = new THREE.Group(), add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); g.add(mesh); return mesh; };
  const bark = plain("#6B4A33", 0.85), stem = plain("#7C8550", 0.7, { sheen: 0.3, sheenColor: new THREE.Color("#C9C79A") }), dried = plain("#B9AE86", 0.8, { sheen: 0.4, sheenColor: new THREE.Color("#E9E0C2"), side: THREE.DoubleSide });
  switch (objet) {
    case "branche": {
      add(taperTube(spline([[-0.24, 0.006, 0.05], [-0.1, 0.008, 0.0], [0.04, 0.007, 0.03], [0.16, 0.005, -0.04], [0.26, 0.004, -0.02]]), 0.007, 0.0025), bark);
      for (const [x, z, dx, dz] of [[-0.12, 0.0, -0.06, -0.09], [0.0, 0.02, 0.05, 0.1], [0.1, -0.01, 0.06, -0.1], [0.18, -0.03, 0.08, 0.05], [-0.04, 0.01, -0.03, 0.11]] as Array<[number, number, number, number]>)
        add(taperTube(spline([[x, 0.006, z], [x + dx * 0.5, 0.007, z + dz * 0.45], [x + dx, 0.004, z + dz]]), 0.003, 0.0008, 40), bark);
      return { g, h: 0.014 };
    }
    case "tulipe": {
      add(taperTube(spline([[0.0, 0.004, 0.24], [0.01, 0.005, 0.1], [-0.005, 0.008, -0.04], [0.0, 0.016, -0.1]]), 0.0035, 0.0028), stem);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2, petal = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        petal.scale(0.022, 0.05, 0.012);
        const m = add(petal, mat, Math.cos(a) * 0.008, 0.026, -0.12 + Math.sin(a) * 0.008);
        m.rotation.set(-Math.PI / 2 + Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); (m.material as THREE.Material).side = THREE.DoubleSide;
      }
      const leaf = new THREE.PlaneGeometry(0.03, 0.16, 6, 24), lp = leaf.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), y = lp.getY(i), t = y / 0.16 + 0.5, w = Math.sin(Math.PI * Math.min(1, t * 1.05)); lp.setXYZ(i, x * w, y, Math.abs(x) * 0.6 + Math.sin(t * 3) * 0.01); }
      leaf.computeVertexNormals(); const lm = add(leaf, plain("#8A9A5E", 0.7, { side: THREE.DoubleSide }), 0.03, 0.01, 0.1); lm.rotation.set(-Math.PI / 2, 0, -0.5);
      return { g, h: 0.05 };
    }
    case "feuille": {
      const leaf = new THREE.PlaneGeometry(0.11, 0.36, 12, 48), lp = leaf.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), y = lp.getY(i), t = y / 0.36 + 0.5, w = Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - t * 0.2); lp.setXYZ(i, x * w + Math.sin(t * 4) * 0.02, y, (x * w) ** 2 * 4 + Math.sin(t * 9 + x * 30) * 0.004 + t * t * 0.03); }
      leaf.computeVertexNormals(); const lm = add(leaf, dried, 0, 0.012, -0.04); lm.rotation.x = -Math.PI / 2;
      add(taperTube(spline([[0, 0.006, 0.14], [0.02, 0.004, 0.24], [0.0, 0.003, 0.34]]), 0.004, 0.0025, 40), dried);
      return { g, h: 0.04 };
    }
    case "eucalyptus": {
      add(taperTube(spline([[0, 0.004, 0.2], [0.01, 0.005, 0.0], [-0.01, 0.004, -0.2]]), 0.0025, 0.0015), stem);
      for (let i = 0; i < 9; i++) { const t = -0.18 + i * 0.045, side = i % 2 ? 1 : -1, r = 0.02 - i * 0.0009; const leaf = add(new THREE.CylinderGeometry(r, r, 0.0012, 32), mat, side * (r + 0.004), 0.007 + (i % 3) * 0.002, t); leaf.rotation.set(0.15 * side, 0, 0.2 * side); }
      return { g, h: 0.012 };
    }
    case "tasse": {
      add(lathe([[0, 0], [0.034, 0], [0.038, 0.004], [0.042, 0.03], [0.044, 0.075], [0.04, 0.076], [0.038, 0.03], [0.032, 0.007], [0, 0.007]]), mat);
      add(new THREE.CircleGeometry(0.038, 48), plain("#4A2E1E", 0.08, { clearcoat: 1, clearcoatRoughness: 0.02 }), 0, 0.058, 0).rotation.x = -Math.PI / 2;
      const handle = add(new THREE.TorusGeometry(0.018, 0.005, 16, 48, Math.PI * 1.2), mat, 0.05, 0.04, 0); handle.rotation.z = -Math.PI * 0.6;
      return { g, h: 0.076 };
    }
    case "cuillere": {
      const brass = await matFor(0.1, FINISH_REFS.laiton);
      const bowl = new THREE.SphereGeometry(0.04, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); bowl.scale(1, 0.55, 1);
      const b = add(bowl, brass, -0.12, 0.022, 0); (b.material as THREE.Material).side = THREE.DoubleSide;
      const handle = add(new THREE.CylinderGeometry(0.004, 0.0045, 0.24, 24), brass, 0.04, 0.02, 0); handle.rotation.z = Math.PI / 2;
      add(new THREE.SphereGeometry(0.005, 16, 8), brass, 0.16, 0.02, 0);
      return { g, h: 0.03 };
    }
    default: {
      const geo = new THREE.SphereGeometry(0.06, 96, 48), p = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); v.x *= 1.25 + Math.sin(v.z * 30) * 0.03; v.y *= 0.42; v.z *= 0.9; p.setXYZ(i, v.x, v.y + 0.025, v.z); }
      geo.computeVertexNormals(); add(geo, mat); return { g, h: 0.05 };
    }
  }
}

/**
 * Construit l'échantillon. `size` : côté du carré (m), 0,2 par défaut.
 * Renvoie le groupe (origine au sol, au centre) et sa hauteur.
 */
export async function buildSample(ref: string, shape: SampleShape, matFor: MatFor, size = 0.2): Promise<{ obj: THREE.Group; h: number } | null> {
  const v = parseVariant(ref); if (!v) return null;
  const gen = v.family.gen, g = new THREE.Group(), body = bodyColor(v), th = thickness(gen);
  const side = body ? plain(body, 0.85) : null;
  const done = (h: number) => { g.traverse((c) => { const m = c as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return { obj: g, h }; };

  if (shape === "goutte") {
    // La peinture elle-même, fraîche et brillante, quelle que soit sa finition sèche.
    const R = 0.042 * (size / 0.2), seed = [...ref].reduce((a, c) => a + c.charCodeAt(0), 0);
    const m = new THREE.MeshPhysicalMaterial({ color: variantHex(v), roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.035, sheen: 0.2, sheenRoughness: 0.4, sheenColor: new THREE.Color("#ffffff") });
    const mesh = new THREE.Mesh(dropGeometry(R, seed), m); mesh.position.y = R * 0.05; g.add(mesh);
    return done(R * 0.5);
  }
  if (shape === "nuancier") {
    const W = 0.11 * size / 0.2, D = 0.16 * size / 0.2;
    const card = new THREE.Mesh(new RoundedBoxGeometry(W, 0.002, D, 2, 0.001), plain("#FAF8F3", 0.7)); card.position.y = 0.001;
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.008, D * 0.72), await matFor(W)); sw.rotation.x = -Math.PI / 2; sw.position.set(0, 0.00205, -D * 0.1);
    g.add(card, sw); return done(0.0022);
  }
  if (shape === "drape") {
    const S = 0.25 * size / 0.2, base = await matFor(S) as THREE.MeshPhysicalMaterial, m = base.clone();
    m.side = THREE.DoubleSide; m.alphaMap = edgeMask(gen === "fabric" ? "pinked" : "round"); m.alphaTest = 0.5;
    g.add(new THREE.Mesh(drapeGeometry(S), m)); return done(0.008);
  }
  if (shape === "dechire") {
    // Lé déchiré à la main, posé à plat : longues fibres sur les côtés.
    const W = 0.2, L = 0.34, base = await matFor(0.2) as THREE.MeshPhysicalMaterial, m = base.clone();
    m.side = THREE.DoubleSide; m.alphaMap = edgeMask("torn"); m.alphaTest = 0.5;
    const geo = new THREE.PlaneGeometry(W, L, 24, 40); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position as THREE.BufferAttribute, uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, 0.001 + Math.sin(z * 18 + x * 6) * 0.0012); uv.setXY(i, uv.getX(i) * W / 0.2, uv.getY(i) * L / 0.2); }
    geo.computeVertexNormals();
    const mask = m.alphaMap!.clone(); mask.repeat.set(0.2 / W, 0.2 / L); mask.needsUpdate = true; m.alphaMap = mask;
    g.add(new THREE.Mesh(geo, m)); return done(0.004);
  }
  if (shape === "piece") {
    switch (gen) {
      case "hardware": {
        const { g: hw, h } = await hardware(opt(v, "modele")!.id, await matFor(0.1));
        g.add(hw); return done(h);
      }
      case "lighting": { const { g: o, h } = lighting(opt(v, "forme")!.id, await matFor(0.2), opt(v, "lumiere")!.hex!); g.add(o); return done(h); }
      case "electric": { const { g: o, h } = electric(opt(v, "modele")!.id, await matFor(0.1)); g.add(o); return done(h); }
      case "sofa": { const { g: o, h } = sofa(opt(v, "modele")!.id, await matFor(opt(v, "modele")!.id === "canape-courbe" ? 1 : 0.5)); g.add(o); return done(h); }
      case "rug": { const { g: o, h } = rug(opt(v, "forme")!.id, await matFor(1)); g.add(o); return done(h); }
      case "art": { const { g: o, h } = await artwork(opt(v, "cadre")!.id, await matFor(1), matFor); g.add(o); return done(h); }
      case "styling": { const { g: o, h } = await styling(opt(v, "objet")!.id, await matFor(0.2), matFor); g.add(o); return done(h); }
      case "object": {
        const { g: o, h } = designObject(opt(v, "forme")!.id, await matFor(0.5));
        g.add(o); return done(h);
      }
      case "fluted": {
        const prof = opt(v, "profil")!.id, W = 0.2, L = 0.3, mat = await matFor(0.3);
        if (prof === "tasseaux") {
          // Tasseaux massifs 20 × 20 mm, espacés de 1 cm, collés sur un feutre acoustique.
          const felt = new THREE.Mesh(slab(W, 0.008, L, 0.2, 0.001), plain("#2B2A28", 0.98, { sheen: 0.6, sheenRoughness: 0.8, sheenColor: new THREE.Color("#5a5650") })); felt.position.y = 0.004; g.add(felt);
          for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(slab(0.02, 0.02, L, 0.3, 0.0012), mat); s.position.set(-W / 2 + 0.015 + i * 0.03, 0.018, 0); g.add(s); }
          return done(0.028);
        }
        g.add(new THREE.Mesh(flutedGeometry(prof, W, L, 0.012, 0.3), mat)); return done(0.022);
      }
      case "wallpaper": {
        const W = 0.21, L = 0.3, sheet = sheetGeometry(W, L);
        g.add(new THREE.Mesh(sheet, await matFor(0.2)), new THREE.Mesh(sheet, plain("#F6F3EC", 0.9, { side: THREE.BackSide })));
        return done(0.01);
      }
      case "carpet": {
        const mat = await matFor(0.2), tile = new THREE.Mesh(slab(0.2, 0.009, 0.2, 0.2, 0.0015), mat); tile.position.y = 0.0055;
        const back = new THREE.Mesh(slab(0.2, 0.0015, 0.2, 0.2, 0.0005), plain("#3A3632", 0.95)); back.position.y = 0.00075;
        g.add(tile, back); return done(0.01);
      }
      case "cane": {
        const tone = new THREE.Color(variantHex(v)).multiplyScalar(0.72).getStyle(), wood = plain(tone, 0.4, { clearcoat: 0.4, clearcoatRoughness: 0.3 });
        const S = 0.2, b = 0.016, hh = 0.014;
        for (const [x, z, w, d] of [[0, -S / 2 + b / 2, S, b], [0, S / 2 - b / 2, S, b], [-S / 2 + b / 2, 0, b, S - 2 * b], [S / 2 - b / 2, 0, b, S - 2 * b]] as Array<[number, number, number, number]>) {
          const bar = new THREE.Mesh(new RoundedBoxGeometry(w, hh, d, 3, 0.004), wood); bar.position.set(x, hh / 2, z); g.add(bar);
        }
        const web = new THREE.Mesh(new THREE.PlaneGeometry(S - b * 1.4, S - b * 1.4), await matFor(S - b * 1.4)); web.rotation.x = -Math.PI / 2; web.position.y = hh * 0.62; g.add(web);
        return done(hh);
      }
    }
  }
  if (shape === "rond") {
    const top = await matFor(0.17 * size / 0.2), r = 0.085 * size / 0.2;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, th, 96, 1), [side ?? top, top, side ?? top]); mesh.position.y = th / 2; g.add(mesh);
    return done(th);
  }
  const [w, d] = shape === "lame" ? [0.4 * size / 0.2, 0.095 * size / 0.2] : [size, size];
  const M = Math.max(0.2, size), top = await matFor(M);
  const mesh = new THREE.Mesh(slab(w, th, d, M), side ? [side, side, top, side, side, side] : top); mesh.position.y = th / 2; g.add(mesh);
  return done(th);
}

/** Libère la mémoire graphique d'un échantillon (les matériaux partagés et mis en cache sont gardés). */
export function disposeSample(obj: THREE.Object3D, materials = true) {
  obj.traverse((c) => {
    const m = c as THREE.Mesh; if (!m.isMesh) return;
    m.geometry.dispose();
    if (!materials) return;
    for (const mat of ([] as THREE.Material[]).concat(m.material)) {
      if (mat.userData.shared) continue;
      const p = mat as THREE.MeshPhysicalMaterial;
      for (const t of [p.map, p.normalMap, p.roughnessMap]) if (t && !t.userData.shared) t.dispose();
      mat.dispose();
    }
  });
}

/** Côté d'échantillon (m) adapté à la famille : assez grand pour lire un calepinage. */
export const sampleSize = (gen: Generator) => (gen === "wood" ? 0.4 : gen === "tile" || gen === "cement" || gen === "terrazzo" || gen === "marble" ? 0.3 : 0.2);
