/**
 * Scène 3D de la page « Expérience » : une pièce en coupe (maison de poupée).
 * Ouverture : la pièce rêvée se dessine trait par trait, se matérialise puis s'éclaire.
 * Défilement : 0 la pièce rêvée · 0,2 la pièce d'aujourd'hui (analysée) · 0,4 les inspirations · 0,6 le moodboard
 * · 0,8 la pièce transformée · 1 tout est cliquable. Les finitions (canapé, sol, murs) s'essaient en direct.
 * Matières : textures photographiées CC0 (Poly Haven) avec relief et rugosité, travertin et enduit générés,
 * éclairage d'intérieur HDR (CC0). Aucune dépendance en dehors de three.js.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { POINTS, type Choix, type Partie } from "./chapitres";

export interface Spot { x: number; y: number; v: number }
export interface StageOptions {
  getProgress: () => number;
  reduced: boolean;
  mobile: boolean;
  /** Jouer l'ouverture animée (sinon la pièce rêvée apparaît directement). */
  intro: boolean;
  choix: Choix;
  onFrame: (p: number, spots: Spot[]) => void;
  onReady: () => void;
}
export interface StageHandle {
  setActive: (on: boolean) => void;
  setReduced: (on: boolean) => void;
  setFinish: (part: Partie, id: string) => void;
  dispose: () => void;
}

const BG = 0x0c0e0b;
const AXIS_Z = new THREE.Vector3(0, 0, 1);
const INTRO_S = 4.6;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const bell = (a: number, b: number, c: number, x: number) => (x < b ? ramp(a, b, x) : 1 - ramp(b, c, x));
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = THREE.MathUtils.lerp;
const rand = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();

/** Plan dont les coordonnées de texture suivent le monde : `scale` mètres par répétition. */
function worldPlane(w: number, h: number, u0: number, v0: number, scale: number) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (u0 + uv.getX(i) * w) / scale, (v0 + uv.getY(i) * h) / scale);
  return g;
}

/** Secteur d'anneau extrudé, arrondi : assise et dossier du canapé courbe (coordonnées de texture en mètres). */
function arcSlab(inner: number, outer: number, half: number, depth: number, bevel: number) {
  const s = new THREE.Shape();
  const a0 = Math.PI / 2 - half, a1 = Math.PI / 2 + half;
  s.absarc(0, 0, outer, a0, a1, false);
  s.lineTo(Math.cos(a1) * inner, Math.sin(a1) * inner);
  s.absarc(0, 0, inner, a1, a0, true);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 6, curveSegments: 64 });
  g.rotateX(-Math.PI / 2);
  return g;
}

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

const canvas2d = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")!] as const; };

/** Travertin : fond crème, veines horizontales ondulées, pores allongés (couleur et relief). */
function travertinTextures(size: number) {
  const [c, x] = canvas2d(size, size);
  x.fillStyle = "#e6d8c0"; x.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    const y0 = rand() * size, hgt = 1 + rand() * size * 0.012, amp = rand() * size * 0.01, ph = rand() * 6;
    const l = rand(); x.fillStyle = l > 0.5 ? `rgba(250,242,228,${0.12 + rand() * 0.2})` : `rgba(176,150,112,${0.08 + rand() * 0.16})`;
    x.beginPath(); x.moveTo(0, y0);
    for (let px = 0; px <= size; px += 16) x.lineTo(px, y0 + Math.sin(px / size * 6.28 * 2 + ph) * amp);
    for (let px = size; px >= 0; px -= 16) x.lineTo(px, y0 + hgt + Math.sin(px / size * 6.28 * 2 + ph) * amp);
    x.closePath(); x.fill();
  }
  const [b, bx] = canvas2d(size, size);
  bx.fillStyle = "#808080"; bx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 1.4; i++) {
    const px = rand() * size, py = rand() * size, w = 1.5 + rand() * size * 0.012, h = 0.6 + rand() * size * 0.0028;
    x.fillStyle = `rgba(150,124,90,${0.35 + rand() * 0.4})`; x.beginPath(); x.ellipse(px, py, w, h, 0, 0, 6.28); x.fill();
    bx.fillStyle = "#3a3a3a"; bx.beginPath(); bx.ellipse(px, py, w, h, 0, 0, 6.28); bx.fill();
  }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(b);
  for (const t of [map, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
  return { map, bump };
}

/** Enduit à la chaux : nuages doux clairs (la couleur vient du matériau, donc toutes les teintes restent nettes). */
function chauxTexture(size: number) {
  const [c, x] = canvas2d(size, size);
  x.fillStyle = "#f4f1ec"; x.fillRect(0, 0, size, size);
  for (let i = 0; i < 120; i++) {
    const px = rand() * size, py = rand() * size, r = size * (0.05 + rand() * 0.18);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    const d = rand() > 0.5; g.addColorStop(0, d ? "rgba(214,206,194,0.045)" : "rgba(255,255,255,0.07)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    // Répétition sur les bords pour une texture sans couture.
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { x.save(); x.translate(ox, oy); x.fillRect(px - r, py - r, r * 2, r * 2); x.restore(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/** Ombre de contact douce (dégradé radial) et dégradé linéaire pour l'occlusion des angles. */
function blobTexture() {
  const [c, x] = canvas2d(128, 128); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,0.75)"); g.addColorStop(0.55, "rgba(0,0,0,0.32)"); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
function edgeTexture() {
  const [c, x] = canvas2d(4, 128); const g = x.createLinearGradient(0, 128, 0, 0);
  g.addColorStop(0, "rgba(0,0,0,0.7)"); g.addColorStop(0.35, "rgba(0,0,0,0.22)"); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0, 0, 4, 128); return new THREE.CanvasTexture(c);
}
function shaftTexture() {
  const [c, x] = canvas2d(64, 128); const g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "rgba(255,230,190,0.5)"); g.addColorStop(0.6, "rgba(255,220,170,0.14)"); g.addColorStop(1, "rgba(255,215,160,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 128);
  x.globalCompositeOperation = "destination-in"; const e = x.createLinearGradient(0, 0, 64, 0);
  e.addColorStop(0, "rgba(0,0,0,0)"); e.addColorStop(0.3, "rgba(0,0,0,1)"); e.addColorStop(0.7, "rgba(0,0,0,1)"); e.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = e; x.fillRect(0, 0, 64, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createStage(canvas: HTMLCanvasElement, o: StageOptions): StageHandle {
  let reduced = o.reduced;
  const mobile = o.mobile;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.toneMapping = THREE.NeutralToneMapping; // couleurs fidèles, sans dominante orange
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // État partagé (déclaré tôt : les chargements et les finitions le modifient).
  let dirty = true, introStart = 0;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 13, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  // Environnement neutre (studio blanc) : reflets et lumière d'ambiance sans dominante de couleur.

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

  // ——— Chargement : la scène apparaît quand ses textures sont prêtes (ou au bout de 5 s).
  let readyDone = false;
  const ready = () => { if (!readyDone) { readyDone = true; dirty = true; } };
  const manager = new THREE.LoadingManager(ready, undefined, () => { /* une texture manquante n'empêche pas la scène */ });
  const loader = new THREE.TextureLoader(manager);
  const readyTimer = window.setTimeout(ready, 5000);
  const textures: THREE.Texture[] = [];
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const cache = new Map<string, THREE.Texture>();
  /** Texture d'un dossier public/textures : diff (couleur), nor (relief) ou rough (rugosité). */
  const tx = (dir: string, kind: "diff" | "nor" | "rough", r = 1) => {
    const key = `${dir}/${kind}/${r}`;
    if (cache.has(key)) return cache.get(key)!;
    const t = loader.load(`/textures/${dir}/${kind}.webp`, () => { dirty = true; });
    t.colorSpace = kind === "diff" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(r, r); t.anisotropy = aniso;
    textures.push(t); cache.set(key, t); return t;
  };
  const img = (url: string) => { const t = loader.load(url, () => { dirty = true; }); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; textures.push(t); return t; };
  const blob = blobTexture(), edgeGrad = edgeTexture(), chaux = chauxTexture(512), trav = travertinTextures(1024);
  textures.push(blob, edgeGrad, chaux, trav.map, trav.bump);

  // ——— La pièce : sol, mur du fond, mur de la fenêtre (coupe « maison de poupée »).
  const W = 6, D = 5, H = 2.8, T = 0.18;
  const room = new THREE.Group(); scene.add(room);
  const roomBoxes: THREE.Mesh[] = [];
  const shadowy = (m: THREE.Mesh, cast = true) => { m.castShadow = cast; m.receiveShadow = true; return m; };

  const floorOld = new THREE.MeshStandardMaterial({ color: 0x7a7874, roughness: 0.92 });
  const floor = shadowy(new THREE.Mesh(new THREE.BoxGeometry(W + T, 0.14, D + T), floorOld), false);
  floor.position.set(-T / 2, -0.07, -T / 2); room.add(floor); roomBoxes.push(floor);
  const floorNewMat = new THREE.MeshStandardMaterial({ roughness: 0.55, transparent: true, opacity: 0 });
  const floorNew = shadowy(new THREE.Mesh(worldPlane(W, D, 0, 0, 1), floorNewMat), false);
  floorNew.rotation.x = -Math.PI / 2; floorNew.position.y = 0.003; room.add(floorNew);

  const wallOld = new THREE.MeshStandardMaterial({ color: 0xb9b8b2, roughness: 0.95 });
  const wallNewMat = new THREE.MeshStandardMaterial({ map: chaux, normalMap: tx("m-tadelakt", "nor"), normalScale: new THREE.Vector2(0.18, 0.18), roughness: 0.95, transparent: true, opacity: 0 });
  const back = shadowy(new THREE.Mesh(new THREE.BoxGeometry(W + T, H, T), wallOld));
  back.position.set(-T / 2, H / 2, -D / 2 - T / 2); room.add(back); roomBoxes.push(back);
  const backNew = shadowy(new THREE.Mesh(worldPlane(W, H, 0, 0, 2.2), wallNewMat), false);
  backNew.position.set(0, H / 2, -D / 2 + 0.004); room.add(backNew);
  const wallOverlays: THREE.Mesh[] = [backNew];
  const WZ0 = -1.3, WZ1 = 0.5, WY0 = 0.7, WY1 = 2.35;
  const leftSeg = (z0: number, z1: number, y0: number, y1: number) => {
    const b = shadowy(new THREE.Mesh(new THREE.BoxGeometry(T, y1 - y0, z1 - z0), wallOld));
    b.position.set(-W / 2 - T / 2, (y0 + y1) / 2, (z0 + z1) / 2); room.add(b); roomBoxes.push(b);
    const p = shadowy(new THREE.Mesh(worldPlane(z1 - z0, y1 - y0, z0 + 3, y0, 2.2), wallNewMat), false);
    p.rotation.y = Math.PI / 2; p.position.set(-W / 2 + 0.004, (y0 + y1) / 2, (z0 + z1) / 2); room.add(p); wallOverlays.push(p);
  };
  leftSeg(-D / 2, WZ0, 0, H); leftSeg(WZ1, D / 2, 0, H); leftSeg(WZ0, WZ1, 0, WY0); leftSeg(WZ0, WZ1, WY1, H);
  // Plinthe fine, posée avec les nouvelles finitions.
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0xe9e1d4, roughness: 0.6, transparent: true, opacity: 0 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, 0.015), plinthMat); plinth.position.set(0, 0.04, -D / 2 + 0.012); room.add(plinth);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2621, roughness: 0.45, metalness: 0.4 });
  for (const [sy, sz, y, z] of [[0.05, WZ1 - WZ0, WY0, (WZ0 + WZ1) / 2], [0.05, WZ1 - WZ0, WY1, (WZ0 + WZ1) / 2], [WY1 - WY0, 0.05, (WY0 + WY1) / 2, WZ0], [WY1 - WY0, 0.05, (WY0 + WY1) / 2, WZ1], [WY1 - WY0, 0.04, (WY0 + WY1) / 2, (WZ0 + WZ1) / 2]] as const) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.07, sy, sz), frameMat); f.position.set(-W / 2 - 0.06, y, z); room.add(f); roomBoxes.push(f);
  }
  // Occlusion douce des angles (sol-murs, coin) : la pièce ne « flotte » plus.
  const aoMat = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: edgeGrad, transparent: true, opacity: 0.32, depthWrite: false });
  const ao = (w: number, h: number, pos: [number, number, number], rot: [number, number, number]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), aoMat); m.position.set(...pos); m.rotation.set(...rot); room.add(m); };
  ao(W, 0.55, [0, 0.006, -D / 2 + 0.275], [-Math.PI / 2, 0, Math.PI]);
  ao(D, 0.55, [-W / 2 + 0.275, 0.006, 0], [-Math.PI / 2, 0, -Math.PI / 2]);
  ao(W, 0.45, [0, 0.225, -D / 2 + 0.008], [0, 0, 0]);
  ao(D, 0.45, [-W / 2 + 0.008, 0.225, 0], [0, Math.PI / 2, 0]);
  ao(H, 0.4, [-W / 2 + 0.2, H / 2, -D / 2 + 0.009], [0, 0, -Math.PI / 2]);

  // Le jour derrière la fenêtre, et son faisceau dans la pièce.
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xc9d4de, toneMapped: false });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.2), skyMat); sky.rotation.y = Math.PI / 2; sky.position.set(-W / 2 - 0.9, 1.6, -0.4); room.add(sky);
  const shaftMat = new THREE.MeshBasicMaterial({ map: shaftTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const shaftGeo = new THREE.BufferGeometry(); const sx = 2.5;
  shaftGeo.setAttribute("position", new THREE.Float32BufferAttribute([
    -W / 2, WY1, WZ0, -W / 2, WY1, WZ1, -W / 2 + sx + 1.2, 0.01, WZ1 + 0.4, -W / 2 + sx + 1.2, 0.01, WZ0 + 0.4,
    -W / 2, WY0, WZ0, -W / 2, WY0, WZ1, -W / 2 + sx * 0.45, 0.01, WZ1 + 0.15, -W / 2 + sx * 0.45, 0.01, WZ0 + 0.15,
  ], 3));
  shaftGeo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2));
  shaftGeo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  const shaft = new THREE.Mesh(shaftGeo, shaftMat); room.add(shaft);
  const dustN = mobile ? 120 : 260, dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { dustPos[i * 3] = -W / 2 + rand() * 2.8; dustPos[i * 3 + 1] = rand() * 2.4; dustPos[i * 3 + 2] = WZ0 + rand() * (WZ1 - WZ0 + 0.6); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xffe2b8, size: 0.016, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const dust = new THREE.Points(dustGeo, dustMat); scene.add(dust);

  // ——— Lumières : froide et plate avant, chaude et dessinée après.
  const hemi = new THREE.HemisphereLight(0xcfd8e3, 0x2f2f2c, 1.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xdfe8f2, 0.6);
  sun.position.set(-7.5, 5.2, 0.2); sun.target.position.set(0.6, 0, -0.6); scene.add(sun, sun.target);
  sun.castShadow = !mobile; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 });
  const rim = new THREE.DirectionalLight(0x9fb3c8, 0.4); rim.position.set(6, 4, 7); scene.add(rim);
  const lampLight = new THREE.PointLight(0xffcf94, 0, 7, 2); lampLight.position.set(0, 2.05, -0.35); scene.add(lampLight);

  const contact = (g: THREE.Group, w: number, d: number, x = 0, z = 0, a = 0.55) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: blob, transparent: true, opacity: mobile ? a * 1.25 : a, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.007, z); m.renderOrder = 1; g.add(m);
  };

  // ——— Le mobilier d'aujourd'hui : générique, gris, sans intention.
  const oldMat = new THREE.MeshStandardMaterial({ color: 0x7c7f84, roughness: 1 });
  const oldMat2 = new THREE.MeshStandardMaterial({ color: 0xa8a9a8, roughness: 0.7 });
  const oldMat3 = new THREE.MeshStandardMaterial({ color: 0xbcb3a0, roughness: 0.8 });
  const oldEdgeSrc: THREE.Mesh[] = [];
  const boxAt = (g: THREE.Group, m: THREE.Material, s: [number, number, number], p: [number, number, number]) => {
    const b = shadowy(new THREE.Mesh(new THREE.BoxGeometry(...s), m)); b.position.set(...p); g.add(b); oldEdgeSrc.push(b); return b;
  };
  const olds: THREE.Group[] = [];
  const oldPiece = (x: number, z: number, build: (g: THREE.Group) => void) => { const g = new THREE.Group(); g.position.set(x, 0, z); build(g); scene.add(g); olds.push(g); };
  oldPiece(0, -1.75, (g) => { boxAt(g, oldMat, [2.1, 0.42, 0.9], [0, 0.21, 0]); boxAt(g, oldMat, [2.1, 0.55, 0.22], [0, 0.66, -0.34]); boxAt(g, oldMat, [0.22, 0.62, 0.9], [-0.94, 0.31, 0]); boxAt(g, oldMat, [0.22, 0.62, 0.9], [0.94, 0.31, 0]); contact(g, 2.7, 1.4); });
  oldPiece(0, -0.35, (g) => { boxAt(g, oldMat2, [0.9, 0.05, 0.9], [0, 0.42, 0]); for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]] as const) boxAt(g, oldMat2, [0.04, 0.4, 0.04], [x, 0.2, z]); contact(g, 1.3, 1.3, 0, 0, 0.3); });
  oldPiece(2.2, -2.27, (g) => { boxAt(g, oldMat3, [0.9, 1.7, 0.38], [0, 0.85, 0]); contact(g, 1.3, 0.7); });
  oldPiece(0, -0.35, (g) => {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6e0 })); bulb.position.y = 2.55; g.add(bulb);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.25), frameMat); cord.position.y = 2.7; g.add(cord);
  });

  // ——— Matières de la pièce rêvée.
  const sofaMat = new THREE.MeshPhysicalMaterial({ roughness: 1, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xfff4e6) });
  const sofaBase = new THREE.MeshStandardMaterial({ color: 0x2e2822, roughness: 0.9 });
  const travertin = new THREE.MeshPhysicalMaterial({ map: trav.map, bumpMap: trav.bump, bumpScale: 1.4, color: 0xffffff, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const noyer = new THREE.MeshPhysicalMaterial({ map: tx("m-noyer", "diff", 1.2), normalMap: tx("m-noyer", "nor", 1.2), roughnessMap: mobile ? null : tx("m-noyer", "rough", 1.2), color: 0xd2b399, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.35 });
  const ceramique = new THREE.MeshPhysicalMaterial({ color: 0xa9643f, roughness: 0.62, clearcoat: 0.4, clearcoatRoughness: 0.4 });
  const papier = new THREE.MeshPhysicalMaterial({ color: 0xf6eee2, roughness: 0.9, emissive: 0xffc988, emissiveIntensity: 0, transmission: 0.0, sheen: 0.3 });
  const laine = new THREE.MeshStandardMaterial({ normalMap: tx("tx-laine", "nor", 1.6), normalScale: new THREE.Vector2(1.2, 1.2), color: 0xd6ccbe, roughness: 1 });
  const lin = new THREE.MeshPhysicalMaterial({ normalMap: tx("m-lin", "nor", 3), color: 0xf1e9dc, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.9, sheen: 0.4 });
  const niche = new THREE.MeshStandardMaterial({ map: chaux, normalMap: tx("m-tadelakt", "nor"), normalScale: new THREE.Vector2(0.18, 0.18), roughness: 0.95 });

  /** Applique une finition (couleur + relief + rugosité) : utilisé au départ et quand le visiteur choisit. */
  function applyFinish(part: Partie, id: string) {
    if (part === "canape") {
      const set = (dir: string | null, nor: string, r: number, color: number, sheen: number, sheenColor: number, sheenR: number) => {
        sofaMat.map = dir ? tx(dir, "diff", r) : null; sofaMat.normalMap = tx(nor, "nor", r); sofaMat.normalScale.set(1.1, 1.1);
        sofaMat.roughnessMap = mobile ? null : tx(nor, "rough", r);
        sofaMat.color.set(color); sofaMat.sheen = sheen; sofaMat.sheenColor.set(sheenColor); sofaMat.sheenRoughness = sheenR; sofaMat.needsUpdate = true;
      };
      if (id === "velours") set(null, "m-velours", 2.2, 0x2f4a38, 1, 0x9db59e, 0.32);
      else if (id === "lin") set(null, "m-lin", 2.4, 0xa9593a, 0.35, 0xf0c3a4, 0.8);
      else set("tx-bouclette", "tx-bouclette", 1.3, 0xffffff, 0.55, 0xfff4e6, 0.7);
    } else if (part === "sol") {
      const set = (dir: string, color: number, rough: number) => {
        floorNewMat.map = tx(dir, "diff", 1); floorNewMat.normalMap = tx(dir, "nor", 1); floorNewMat.roughnessMap = mobile ? null : tx(dir, "rough", 1);
        floorNewMat.color.set(color); floorNewMat.roughness = rough; floorNewMat.needsUpdate = true;
      };
      // Échelle réelle : chaque répétition couvre environ 1,6 à 2 m (les textures Poly Haven sont prises à l'échelle).
      if (id === "clair") set("tx-chene", 0xe8e2dc, 0.6); else if (id === "fume") set("m-chenefume", 0x9a908a, 0.5); else set("m-chene", 0xd8d0c8, 0.58);
      const s = id === "hongrie" ? 0.55 : id === "clair" ? 0.6 : 0.5;
      for (const t of [floorNewMat.map, floorNewMat.normalMap, floorNewMat.roughnessMap]) if (t) t.repeat.set(s, s);
    } else {
      wallNewMat.color.set(id === "sauge" ? 0xa9b49d : id === "terre" ? 0xcf9c7e : 0xf0e6d8);
      niche.color.copy(wallNewMat.color).multiplyScalar(0.93);
      plinthMat.color.copy(wallNewMat.color).offsetHSL(0, 0, 0.03);
    }
    pulse[part] = performance.now(); dirty = true;
  }
  const pulse: Partial<Record<Partie, number>> = {};

  type Piece = { g: THREE.Group; y: number; kind: "drop" | "unroll" | "rise"; part?: Partie };
  const news: Piece[] = [];
  const newPiece = (x: number, z: number, kind: Piece["kind"], build: (g: THREE.Group) => void, part?: Partie) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); build(g); g.traverse((c) => { const m = c as THREE.Mesh; if (m.isMesh && !(m.material as THREE.Material).transparent) shadowy(m); });
    scene.add(g); news.push({ g, y: 0, kind, part });
  };
  // 0 · tapis en laine
  newPiece(0.1, -0.7, "unroll", (g) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(3.4, 2.5, 0.4)), laine); m.rotation.x = -Math.PI / 2; m.position.y = 0.009; m.receiveShadow = true; g.add(m); });
  // 1 · niche en arche, enduit
  newPiece(-1.7, -D / 2, "rise", (g) => {
    const s = new THREE.Shape(); s.moveTo(-0.55, 0); s.lineTo(-0.55, 1.75); s.absarc(0, 1.75, 0.55, Math.PI, 0, true); s.lineTo(0.55, 0); s.closePath();
    g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 3, curveSegments: 40 }), niche));
  }, "mur");
  // 2 · canapé courbe
  newPiece(0, -0.3, "drop", (g) => {
    g.add(new THREE.Mesh(arcSlab(1.12, 1.66, 0.85, 0.06, 0.02), sofaBase));
    const seat = new THREE.Mesh(arcSlab(1.0, 1.78, 0.9, 0.24, 0.085), sofaMat); seat.position.y = 0.1; g.add(seat);
    const backrest = new THREE.Mesh(arcSlab(1.56, 1.86, 0.86, 0.5, 0.1), sofaMat); backrest.position.y = 0.1; g.add(backrest);
    contact(g, 3.6, 1.7, 0, -1.25, 0.6);
  }, "canape");
  // 3 · table basse ovale en travertin
  newPiece(0.05, -0.1, "drop", (g) => {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.07, 72), travertin); top.scale.x = 1.45; top.position.y = 0.37; g.add(top);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.34, 56), travertin); foot.scale.x = 1.35; foot.position.y = 0.17; g.add(foot);
    contact(g, 2.0, 1.35, 0, 0, 0.5);
  });
  // 4 · buffet cannelé en noyer, vase en grès, coupe en travertin
  newPiece(2.0, -2.2, "drop", (g) => {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 0.44), noyer); body.position.y = 0.4; g.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.04, 0.48), noyer); top.position.y = 0.72; g.add(top);
    const flute = new THREE.CylinderGeometry(0.045, 0.045, 0.52, 14, 1, false, -Math.PI / 2, Math.PI);
    for (let i = 0; i < 17; i++) { const f = new THREE.Mesh(flute, noyer); f.position.set(-0.8 + i * 0.1, 0.4, 0.22); g.add(f); }
    for (const x of [-0.78, 0.78]) for (const z of [-0.17, 0.17]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), frameMat); l.position.set(x, 0.05, z); g.add(l); }
    const prof = [[0, 0], [0.09, 0], [0.13, 0.08], [0.14, 0.2], [0.09, 0.32], [0.05, 0.36], [0.06, 0.4]].map(([x, y]) => new THREE.Vector2(x, y));
    const vase = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), ceramique); vase.position.set(-0.45, 0.74, 0); g.add(vase);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 40, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), travertin); bowl.rotation.x = Math.PI; bowl.position.set(0.4, 0.86, 0); g.add(bowl);
    contact(g, 2.1, 0.8, 0, 0, 0.5);
  });
  // 5 · suspension en papier
  newPiece(0, -0.35, "drop", (g) => {
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 56, 36), papier); globe.position.y = 2.15; globe.castShadow = false; g.add(globe);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4), frameMat); cord.position.y = 2.62; g.add(cord);
  });
  // 6 · voilage en lin à la fenêtre
  newPiece(-W / 2 + 0.12, WZ1 + 0.32, "rise", (g) => {
    const geo = new THREE.PlaneGeometry(0.55, 2.55, 32, 1); const pa = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 34) * 0.025);
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, lin); m.rotation.y = Math.PI / 2; m.position.y = 1.32; g.add(m);
  });
  (Object.keys(o.choix) as Partie[]).forEach((p) => applyFinish(p, o.choix[p]));
  for (const k of Object.keys(pulse)) delete pulse[k as Partie];

  // ——— Le dessin d'architecte de l'ouverture : arêtes de la pièce rêvée, tracées de bas en haut.
  scene.updateMatrixWorld(true);
  const segs: number[][] = [];
  const pushEdges = (m: THREE.Mesh) => {
    const e = new THREE.EdgesGeometry(m.geometry, 24); const p = e.attributes.position as THREE.BufferAttribute;
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 2) { a.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); b.fromBufferAttribute(p, i + 1).applyMatrix4(m.matrixWorld); segs.push([a.x, a.y, a.z, b.x, b.y, b.z]); }
    e.dispose();
  };
  roomBoxes.forEach(pushEdges);
  news.forEach((n) => n.g.traverse((c) => { const m = c as THREE.Mesh; if (m.isMesh && !(m.material as THREE.Material).transparent) pushEdges(m); }));
  segs.sort((s1, s2) => Math.min(s1[1]!, s1[4]!) - Math.min(s2[1]!, s2[4]!) || s1[0]! - s2[0]!);
  const drawGeo = new THREE.BufferGeometry(); drawGeo.setAttribute("position", new THREE.Float32BufferAttribute(segs.flat(), 3));
  const drawMat = new THREE.LineBasicMaterial({ color: 0xdcae7c, transparent: true, opacity: 0, depthTest: false });
  const drawing = new THREE.LineSegments(drawGeo, drawMat); drawing.renderOrder = 20; scene.add(drawing);
  const drawCount = segs.length * 2;

  // Le contour de la pièce d'aujourd'hui, révélé pendant l'analyse.
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xd2a271, transparent: true, opacity: 0, depthTest: false });
  const edges = new THREE.Group(); scene.add(edges);
  for (const m of [...roomBoxes, ...oldEdgeSrc]) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 20), edgeMat); l.applyMatrix4(m.matrixWorld); edges.add(l); }
  edges.renderOrder = 10;
  const scanMat = new THREE.MeshBasicMaterial({ color: 0xd2a271, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.6, D + 0.6), scanMat); scan.rotation.x = -Math.PI / 2; scene.add(scan);

  // ——— Les inspirations : cinq images qui arrivent du fond, puis se rangent en planche.
  const INSPI = ["japandi-essai", "contemporain-sculptural", "luxe-discret", "haussmannien-renove", "campagne-elegante"];
  const frameCard = new THREE.MeshBasicMaterial({ color: 0xefe9df, toneMapped: false });
  const cards = INSPI.map((n, i) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.08), frameCard));
    const im = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.93), new THREE.MeshBasicMaterial({ map: img(`/editorial/ia/${n}-640.webp`), toneMapped: false }));
    im.position.set(0, 0.035, 0.002); g.add(im);
    g.visible = false; scene.add(g);
    const start = new THREE.Vector3((i - 2) * 3.2, 5 + i * 0.6, 13 + i * 1.5);
    const orbit = [new THREE.Vector3(-3.9, 2.2, 0.3), new THREE.Vector3(-2.3, 3.4, 1.7), new THREE.Vector3(0, 3.95, 0.5), new THREE.Vector3(2.4, 3.3, 1.6), new THREE.Vector3(3.9, 2.1, 0.2)][i]!;
    const board = [new THREE.Vector3(-1.5, 4.35, -2.2), new THREE.Vector3(0, 4.35, -2.2), new THREE.Vector3(1.5, 4.35, -2.2), new THREE.Vector3(-0.75, 3.3, -2.2), new THREE.Vector3(0.75, 3.3, -2.2)][i]!;
    return { g, start, orbit, board, tilt: (i % 2 ? -1 : 1) * 0.05 };
  });
  // Les matières tirées des inspirations, qui vont ensuite se poser sur la pièce (elles suivent les finitions choisies).
  const swatchDefs: Array<[THREE.Material, THREE.Vector3]> = [
    [travertin, new THREE.Vector3(0.05, 0.4, -0.1)], [noyer, new THREE.Vector3(2.0, 0.6, -2.0)], [sofaMat, new THREE.Vector3(0, 0.5, -1.6)],
    [niche, new THREE.Vector3(-1.7, 1.6, -2.45)], [floorNewMat, new THREE.Vector3(-1.2, 0.05, 0.9)],
  ];
  const swatchGeo = new THREE.BoxGeometry(0.46, 0.46, 0.04);
  const swatches = swatchDefs.map(([m, target], i) => {
    // L'échantillon de sol partage la couleur du sol mais reste opaque.
    const mat = m === floorNewMat ? floorNewMat.clone() : m;
    if (mat !== m) { (mat as THREE.MeshStandardMaterial).transparent = false; (mat as THREE.MeshStandardMaterial).opacity = 1; }
    const mesh = new THREE.Mesh(swatchGeo, mat); mesh.visible = false; scene.add(mesh);
    return { mesh, row: new THREE.Vector3(-1.6 + i * 0.8, 2.35, -0.4), target };
  });

  // ——— Caméra : un plan-séquence le long de six positions clés.
  const camPos = new THREE.CatmullRomCurve3([
    new THREE.Vector3(5.6, 2.7, 6.6), new THREE.Vector3(3.6, 2.4, 5.6), new THREE.Vector3(0.4, 3.3, 9.2),
    new THREE.Vector3(0, 3.6, 7.2), new THREE.Vector3(4.6, 2.0, 5.0), new THREE.Vector3(1.6, 1.9, 5.6),
  ], false, "catmullrom", 0.5);
  const camTgt = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.2, 0.95, -0.9), new THREE.Vector3(-0.5, 1.0, -1.1), new THREE.Vector3(0, 1.8, -0.4),
    new THREE.Vector3(0, 3.1, -1.2), new THREE.Vector3(-0.6, 0.95, -1.0), new THREE.Vector3(0.2, 0.85, -0.9),
  ], false, "catmullrom", 0.5);

  // ——— Animation.
  const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3(), dummy = new THREE.Object3D(), qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  const cBefore = { hemiSky: new THREE.Color(0xcfd8e3), hemiGround: new THREE.Color(0x2f2f2c), sun: new THREE.Color(0xdfe8f2), sky: new THREE.Color(0xb8c3cd) };
  const cAfter = { hemiSky: new THREE.Color(0xfff6ec), hemiGround: new THREE.Color(0x6b5b4c), sun: new THREE.Color(0xffead2), sky: new THREE.Color(0xfff4e4) };
  let cur = o.getProgress(), active = true, raf = 0, last = performance.now(), time = 0, w = 0, h = 0, lastP = -1;
  const playIntro = o.intro && !reduced;
  const spots: Spot[] = POINTS.map(() => ({ x: 0, y: 0, v: 0 }));
  const portraitK = () => { const a = w / Math.max(1, h); return a < 1 ? 1 + (1 - a) * 1.15 : 1; };
  const introOf = (now: number) => (!playIntro ? 1 : introStart ? clamp01((now - introStart) / 1000 / INTRO_S) : 0);

  function resize() {
    const r = canvas.parentElement!.getBoundingClientRect(); w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 46 : 38;
    // Sur grand écran, l'image est décalée vers la droite pour laisser respirer le texte à gauche.
    camera.filmOffset = w / h > 1.15 ? -0.15 * 35 * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect : 0;
    // Sur téléphone, le texte occupe le bas de l'écran : la pièce monte dans la moitié haute.
    if (w / h < 1) camera.setViewOffset(w, h, 0, h * 0.2, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); dirty = true;
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement!); resize();

  function apply(p: number, I: number, now: number) {
    // Caméra (à l'ouverture : travelling avant et léger panoramique)
    camPos.getPoint(p, tmpP); camTgt.getPoint(p, tmpT);
    const ic = outCubic(ramp(0, 0.8, I)), introCam = 1 - ramp(0, 0.12, p);
    tmpP.sub(tmpT).applyAxisAngle(Y, lerp(0.6, 0, ic) * introCam).multiplyScalar(lerp(1.6, 1, ic * introCam + (1 - introCam))).add(tmpT);
    if (!reduced) { tmpP.x += Math.sin(time * 0.23) * 0.16; tmpP.y += Math.sin(time * 0.31) * 0.07; }
    tmpP.sub(tmpT).multiplyScalar(portraitK()).add(tmpT);
    camera.position.copy(tmpP); camera.lookAt(tmpT);

    // Ouverture : la pièce apparaît, se dessine, se matérialise, s'éclaire. Le défilement « rembobine » vers aujourd'hui.
    const dream = 1 - ramp(0.04, 0.15, p), dreamW = 1 - ramp(0.02, 0.13, p);
    const roomIn = ramp(0.12, 0.4, I);
    for (const m of [wallOld, floorOld]) { m.transparent = roomIn < 1; m.opacity = roomIn; }
    drawGeo.setDrawRange(0, Math.floor(drawCount * ramp(0.02, 0.45, I) / 2) * 2);
    drawMat.opacity = 0.9 * (1 - ramp(0.6, 0.9, I)) * dream;
    drawing.visible = drawMat.opacity > 0.005;

    // 1 · analyse : contour et balayage de la pièce d'aujourd'hui
    edgeMat.opacity = bell(0.12, 0.2, 0.36, p) * 0.9;
    scanMat.opacity = bell(0.12, 0.2, 0.34, p) * 0.22; scan.position.y = ramp(0.12, 0.32, p) * H; scan.visible = scanMat.opacity > 0.005;
    edges.visible = edgeMat.opacity > 0.005;

    // 2 et 3 · inspirations, puis planche
    const inT = ramp(0.22, 0.4, p), boardT = ramp(0.44, 0.58, p), outT = ramp(0.62, 0.7, p);
    cards.forEach((c, i) => {
      const a = outCubic(clamp01(inT * 1.25 - i * 0.06));
      c.g.visible = a > 0.001 && outT < 0.999;
      if (!c.g.visible) return;
      tmpP.lerpVectors(c.start, c.orbit, a);
      if (!reduced) tmpP.y += Math.sin(time * 0.8 + i) * 0.06 * (1 - boardT);
      tmpP.lerp(c.board, boardT);
      c.g.position.copy(tmpP);
      dummy.position.copy(tmpP); dummy.lookAt(camera.position); qA.copy(dummy.quaternion).multiply(qB.setFromAxisAngle(AXIS_Z, c.tilt));
      dummy.lookAt(tmpP.x, tmpP.y, tmpP.z + 10); qA.slerp(dummy.quaternion, boardT);
      c.g.quaternion.copy(qA);
      c.g.scale.setScalar(Math.max(0.001, lerp(1, 0.82, boardT) * (1 - outT)));
    });
    swatches.forEach((s, i) => {
      const appear = outCubic(ramp(0.48 + i * 0.015, 0.58 + i * 0.015, p));
      const fly = ramp(0.63 + i * 0.014, 0.73 + i * 0.014, p);
      s.mesh.visible = appear > 0.001 && fly < 0.999;
      if (!s.mesh.visible) return;
      tmpP.lerpVectors(s.row, s.target, fly); tmpP.y += Math.sin(Math.PI * fly) * 0.9;
      s.mesh.position.copy(tmpP); s.mesh.lookAt(camera.position); s.mesh.rotateZ(fly * 2.2);
      s.mesh.scale.setScalar(Math.max(0.001, appear * (1 - fly * 0.85)));
    });

    // 4 · transformation (ou pièce rêvée de l'ouverture) : l'ancien s'efface, les matières se posent, le neuf s'assemble.
    olds.forEach((g, i) => {
      const here = ramp(0.09 + i * 0.01, 0.17 + i * 0.01, p) * (1 - ramp(0.6 + i * 0.012, 0.68 + i * 0.012, p));
      g.scale.y = Math.max(0.001, here); g.visible = here > 0.001;
    });
    const mat = Math.max(ramp(0.32, 0.62, I) * dream, ramp(0.64, 0.78, p));
    floorNewMat.opacity = mat; wallNewMat.opacity = mat; plinthMat.opacity = mat;
    floorNew.visible = mat > 0.001; for (const wo of wallOverlays) wo.visible = mat > 0.001; plinth.visible = mat > 0.001;
    news.forEach((n, i) => {
      const k = Math.max(ramp(0.36 + i * 0.035, 0.58 + i * 0.035, I) * (1 - ramp(0.02 + i * 0.012, 0.11 + i * 0.012, p)), ramp(0.65 + i * 0.016, 0.74 + i * 0.016, p));
      n.g.visible = k > 0.001;
      // Petit rebond quand le visiteur change une finition.
      const t0 = n.part ? pulse[n.part] : undefined, pt = t0 ? (now - t0) / 1000 : 9;
      const bump = pt < 0.9 && !reduced ? Math.sin(pt * Math.PI * 3) * Math.exp(-pt * 4) * 0.06 : 0;
      if (n.kind === "drop") { n.g.position.y = n.y + (1 - outCubic(k)) * 2.4; n.g.scale.setScalar(lerp(0.9, 1, k) * (1 + bump)); }
      else if (n.kind === "unroll") { n.g.scale.set(Math.max(0.001, outCubic(k)), 1, 1); }
      else { n.g.scale.set(1 + bump, Math.max(0.001, outCubic(k)), 1 + bump); }
    });
    const warm = Math.max(ramp(0.55, 0.92, I) * dreamW, ramp(0.64, 0.82, p));
    hemi.color.lerpColors(cBefore.hemiSky, cAfter.hemiSky, warm); hemi.groundColor.lerpColors(cBefore.hemiGround, cAfter.hemiGround, warm);
    hemi.intensity = lerp(0.95, 0.9, warm) * lerp(0.2, 1, roomIn);
    sun.color.lerpColors(cBefore.sun, cAfter.sun, warm); sun.intensity = lerp(0.6, 3.6, warm) * lerp(0.2, 1, roomIn);
    skyMat.color.lerpColors(cBefore.sky, cAfter.sky, warm).multiplyScalar(lerp(0.15, 1, roomIn));
    shaftMat.opacity = warm * 0.28; dustMat.opacity = warm * 0.7; shaft.visible = dust.visible = warm > 0.01;
    lampLight.intensity = warm * 2.4; papier.emissiveIntensity = warm * 0.5;
    scene.environmentIntensity = lerp(0.35, 0.55, warm) * lerp(0.3, 1, roomIn);
    renderer.toneMappingExposure = lerp(1.0, 1.12, warm);
    if (!reduced) { dust.position.y = Math.sin(time * 0.15) * 0.06; dust.rotation.y = Math.sin(time * 0.05) * 0.03; }

    // 5 · points cliquables projetés à l'écran
    const vis = ramp(0.86, 0.96, p);
    POINTS.forEach((pt, i) => {
      tmpP.set(...pt.pos).project(camera);
      const s = spots[i]!; s.x = (tmpP.x + 1) / 2 * w; s.y = (1 - tmpP.y) / 2 * h; s.v = tmpP.z < 1 ? vis : 0;
    });
  }

  // Shaders préparés en parallèle quand le navigateur le permet, puis première image.
  let compiled = false;
  renderer.compileAsync(scene, camera).catch(() => undefined).finally(() => { compiled = true; dirty = true; });

  function frame(now: number) {
    raf = 0;
    if (!active) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const target = o.getProgress();
    if (reduced) cur = Math.round(target * 5) / 5;
    else if (Math.abs(target - cur) < 2e-4) cur = target;
    else cur += (target - cur) * (1 - Math.exp(-dt * 4.2));
    const I = introOf(now);
    const pulsing = Object.values(pulse).some((t) => t !== undefined && now - t < 1000);
    // On ne redessine que pendant le défilement, l'ouverture ou un changement de finition : à l'arrêt, la scène ne consomme rien.
    if (compiled && readyDone && (cur !== lastP || dirty || (I > 0 && I < 1) || pulsing || !introStart)) {
      if (!reduced) time += dt;
      apply(cur, I, now); renderer.render(scene, camera); o.onFrame(cur, spots); lastP = cur; dirty = false;
      // L'ouverture commence à la première image affichée (et la page montre la scène à ce moment-là).
      if (!introStart) { introStart = now; o.onReady(); }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    setActive(on) { active = on; if (on && !raf) { last = performance.now(); dirty = true; raf = requestAnimationFrame(frame); } },
    setReduced(on) { reduced = on; dirty = true; },
    setFinish(part, id) { applyFinish(part, id); },
    dispose() {
      active = false; if (raf) cancelAnimationFrame(raf); clearTimeout(readyTimer); ro.disconnect();
      scene.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((x) => x.dispose());
      });
      textures.forEach((t) => t.dispose()); shaftMat.map?.dispose(); envTex.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}
