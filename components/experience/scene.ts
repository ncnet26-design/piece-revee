/**
 * Scène 3D de la page « Expérience » : une pièce en coupe (maison de poupée) que le défilement transforme.
 * 0 ouverture · 0,2 la pièce analysée · 0,4 les inspirations · 0,6 le moodboard · 0,8 la pièce transformée · 1 tout est cliquable.
 * Aucune dépendance en dehors de three.js ; textures CC0 (Poly Haven, ambientCG) et images du site.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { POINTS } from "./chapitres";

export interface Spot { x: number; y: number; v: number }
export interface StageOptions {
  getProgress: () => number;
  reduced: boolean;
  mobile: boolean;
  onFrame: (p: number, spots: Spot[]) => void;
  onReady: () => void;
}
export interface StageHandle { setActive: (on: boolean) => void; setReduced: (on: boolean) => void; dispose: () => void }

const BG = 0x0c0e0b;
const AXIS_Z = new THREE.Vector3(0, 0, 1);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const bell = (a: number, b: number, c: number, x: number) => (x < b ? ramp(a, b, x) : 1 - ramp(b, c, x));
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = THREE.MathUtils.lerp;

/** Plan dont les coordonnées de texture suivent le monde (texture continue d'un pan de mur à l'autre). */
function worldPlane(w: number, h: number, u0: number, v0: number, scale: number) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (u0 + uv.getX(i) * w) / scale, (v0 + uv.getY(i) * h) / scale);
  return g;
}

/** Secteur d'anneau extrudé, arrondi : assise et dossier du canapé courbe. */
function arcSlab(inner: number, outer: number, half: number, depth: number, bevel: number) {
  const s = new THREE.Shape();
  const a0 = Math.PI / 2 - half, a1 = Math.PI / 2 + half;
  s.absarc(0, 0, outer, a0, a1, false);
  s.lineTo(Math.cos(a1) * inner, Math.sin(a1) * inner);
  s.absarc(0, 0, inner, a1, a0, true);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 56 });
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

/** Dégradé pour le faisceau de lumière de la fenêtre. */
function shaftTexture() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 128;
  const x = c.getContext("2d")!; const g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "rgba(255,226,180,0.55)"); g.addColorStop(0.6, "rgba(255,214,160,0.16)"); g.addColorStop(1, "rgba(255,210,150,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 128);
  // Bords adoucis : le faisceau n'a pas d'arêtes nettes.
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 13, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

  // ——— Chargement : la scène apparaît quand ses textures sont prêtes (ou au bout de 5 s).
  let readyDone = false;
  const ready = () => { if (!readyDone) { readyDone = true; dirty = true; o.onReady(); } };
  const manager = new THREE.LoadingManager(ready, undefined, () => { /* une texture manquante n'empêche pas la scène */ });
  const loader = new THREE.TextureLoader(manager);
  const readyTimer = window.setTimeout(ready, 5000);
  const textures: THREE.Texture[] = [];
  const tex = (url: string, r = 1) => {
    const t = loader.load(url, () => { dirty = true; });
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(r, r);
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.push(t); return t;
  };

  // ——— La pièce : sol, mur du fond, mur de la fenêtre (coupe « maison de poupée »).
  const W = 6, D = 5, H = 2.8, T = 0.18;
  const room = new THREE.Group(); scene.add(room);
  const edgeSources: THREE.Mesh[] = [];
  const shadowy = (m: THREE.Mesh, cast = true) => { m.castShadow = cast; m.receiveShadow = true; return m; };

  const floorOld = new THREE.MeshStandardMaterial({ color: 0x7d7b77, roughness: 0.9 });
  const floor = shadowy(new THREE.Mesh(new THREE.BoxGeometry(W + T, 0.14, D + T), floorOld), false);
  floor.position.set(-T / 2, -0.07, -T / 2); room.add(floor); edgeSources.push(floor);
  const floorNewMat = new THREE.MeshStandardMaterial({ map: tex("/textures/m-chene/diff.webp"), color: 0xd2c2b0, roughness: 0.6, transparent: true, opacity: 0 });
  const floorNew = shadowy(new THREE.Mesh(worldPlane(W, D, 0, 0, 1.6), floorNewMat), false);
  floorNew.rotation.x = -Math.PI / 2; floorNew.position.y = 0.003; room.add(floorNew);

  const wallOld = new THREE.MeshStandardMaterial({ color: 0xbdbcb6, roughness: 0.95 });
  const chauxNor = tex("/textures/m-chaux/nor.webp"); chauxNor.colorSpace = THREE.NoColorSpace;
  const wallNewMat = new THREE.MeshStandardMaterial({ normalMap: chauxNor, normalScale: new THREE.Vector2(0.9, 0.9), color: 0xe6d8c4, roughness: 0.95, transparent: true, opacity: 0 });
  const back = shadowy(new THREE.Mesh(new THREE.BoxGeometry(W + T, H, T), wallOld));
  back.position.set(-T / 2, H / 2, -D / 2 - T / 2); room.add(back); edgeSources.push(back);
  const backNew = shadowy(new THREE.Mesh(worldPlane(W, H, 0, 0, 1.8), wallNewMat), false);
  backNew.position.set(0, H / 2, -D / 2 + 0.004); room.add(backNew);
  // Mur de gauche, percé d'une grande fenêtre.
  const WZ0 = -1.3, WZ1 = 0.5, WY0 = 0.7, WY1 = 2.35;
  const leftSeg = (z0: number, z1: number, y0: number, y1: number) => {
    const b = shadowy(new THREE.Mesh(new THREE.BoxGeometry(T, y1 - y0, z1 - z0), wallOld));
    b.position.set(-W / 2 - T / 2, (y0 + y1) / 2, (z0 + z1) / 2); room.add(b); edgeSources.push(b);
    const p = shadowy(new THREE.Mesh(worldPlane(z1 - z0, y1 - y0, z0 + 3, y0, 1.8), wallNewMat), false);
    p.rotation.y = Math.PI / 2; p.position.set(-W / 2 + 0.004, (y0 + y1) / 2, (z0 + z1) / 2); room.add(p);
  };
  leftSeg(-D / 2, WZ0, 0, H); leftSeg(WZ1, D / 2, 0, H); leftSeg(WZ0, WZ1, 0, WY0); leftSeg(WZ0, WZ1, WY1, H);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b2722, roughness: 0.5, metalness: 0.3 });
  for (const [sy, sz, y, z] of [[0.05, WZ1 - WZ0, WY0, (WZ0 + WZ1) / 2], [0.05, WZ1 - WZ0, WY1, (WZ0 + WZ1) / 2], [WY1 - WY0, 0.05, (WY0 + WY1) / 2, WZ0], [WY1 - WY0, 0.05, (WY0 + WY1) / 2, WZ1], [WY1 - WY0, 0.04, (WY0 + WY1) / 2, (WZ0 + WZ1) / 2]] as const) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.07, sy, sz), frameMat); f.position.set(-W / 2 - 0.06, y, z); room.add(f);
  }
  // Le jour derrière la fenêtre, et son faisceau dans la pièce.
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xc9d4de, toneMapped: false });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.2), skyMat); sky.rotation.y = Math.PI / 2; sky.position.set(-W / 2 - 0.9, 1.6, -0.4); room.add(sky);
  const shaftMat = new THREE.MeshBasicMaterial({ map: shaftTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const shaftGeo = new THREE.BufferGeometry();
  // Deux nappes : du haut de la fenêtre au fond de la tache de soleil, du bas de la fenêtre à son bord proche.
  const sx = 2.5;
  shaftGeo.setAttribute("position", new THREE.Float32BufferAttribute([
    -W / 2, WY1, WZ0, -W / 2, WY1, WZ1, -W / 2 + sx + 1.2, 0.01, WZ1 + 0.4, -W / 2 + sx + 1.2, 0.01, WZ0 + 0.4,
    -W / 2, WY0, WZ0, -W / 2, WY0, WZ1, -W / 2 + sx * 0.45, 0.01, WZ1 + 0.15, -W / 2 + sx * 0.45, 0.01, WZ0 + 0.15,
  ], 3));
  shaftGeo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2));
  shaftGeo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  const shaft = new THREE.Mesh(shaftGeo, shaftMat); room.add(shaft);
  // Poussière dans la lumière : profondeur et vie.
  const dustN = mobile ? 120 : 260, dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { dustPos[i * 3] = -W / 2 + Math.random() * 2.8; dustPos[i * 3 + 1] = Math.random() * 2.4; dustPos[i * 3 + 2] = WZ0 + Math.random() * (WZ1 - WZ0 + 0.6); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xffe2b8, size: 0.018, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const dust = new THREE.Points(dustGeo, dustMat); scene.add(dust);

  // ——— Lumières : froide et plate avant, chaude et dessinée après.
  const hemi = new THREE.HemisphereLight(0xcfd8e3, 0x2f2f2c, 1.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xdfe8f2, 0.6);
  sun.position.set(-7.5, 5.2, 0.2); sun.target.position.set(0.6, 0, -0.6); scene.add(sun, sun.target);
  sun.castShadow = !mobile; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 });
  const rim = new THREE.DirectionalLight(0x9fb3c8, 0.45); rim.position.set(6, 4, 7); scene.add(rim);
  const lampLight = new THREE.PointLight(0xffcf94, 0, 7, 2); lampLight.position.set(0, 1.95, -0.35); scene.add(lampLight);

  // ——— Le mobilier d'avant : générique, gris, sans intention.
  const oldMat = new THREE.MeshStandardMaterial({ color: 0x7c7f84, roughness: 1 });
  const oldMat2 = new THREE.MeshStandardMaterial({ color: 0xa8a9a8, roughness: 0.7 });
  const oldMat3 = new THREE.MeshStandardMaterial({ color: 0xbcb3a0, roughness: 0.8 });
  const boxAt = (g: THREE.Group, m: THREE.Material, s: [number, number, number], p: [number, number, number]) => {
    const b = shadowy(new THREE.Mesh(new THREE.BoxGeometry(...s), m)); b.position.set(...p); g.add(b); edgeSources.push(b); return b;
  };
  const olds: THREE.Group[] = [];
  const oldPiece = (x: number, z: number, build: (g: THREE.Group) => void) => { const g = new THREE.Group(); g.position.set(x, 0, z); build(g); scene.add(g); olds.push(g); };
  oldPiece(0, -1.75, (g) => { boxAt(g, oldMat, [2.1, 0.42, 0.9], [0, 0.21, 0]); boxAt(g, oldMat, [2.1, 0.55, 0.22], [0, 0.66, -0.34]); boxAt(g, oldMat, [0.22, 0.62, 0.9], [-0.94, 0.31, 0]); boxAt(g, oldMat, [0.22, 0.62, 0.9], [0.94, 0.31, 0]); });
  oldPiece(0, -0.35, (g) => { boxAt(g, oldMat2, [0.9, 0.05, 0.9], [0, 0.42, 0]); for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]] as const) boxAt(g, oldMat2, [0.04, 0.4, 0.04], [x, 0.2, z]); });
  oldPiece(2.2, -2.27, (g) => { boxAt(g, oldMat3, [0.9, 1.7, 0.38], [0, 0.85, 0]); });
  oldPiece(0, -0.35, (g) => {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6e0 })); bulb.position.y = 2.55; g.add(bulb);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.25), frameMat); cord.position.y = 2.7; g.add(cord);
  });

  // Le contour de la pièce, révélé pendant l'analyse.
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xd2a271, transparent: true, opacity: 0, depthTest: false });
  const edges = new THREE.Group(); scene.add(edges);
  scene.updateMatrixWorld(true);
  for (const m of edgeSources) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 20), edgeMat); l.applyMatrix4(m.matrixWorld); edges.add(l); }
  edges.renderOrder = 10;
  const scanMat = new THREE.MeshBasicMaterial({ color: 0xd2a271, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.6, D + 0.6), scanMat); scan.rotation.x = -Math.PI / 2; scene.add(scan);

  // ——— Le mobilier d'après : chaque pièce s'assemble en tombant à sa place.
  const boucle = new THREE.MeshPhysicalMaterial({ map: tex("/textures/tx-bouclette/diff.webp", 1.4), color: 0xf2ebdf, roughness: 1, sheen: 0.7, sheenColor: new THREE.Color(0xfff2e2), sheenRoughness: 0.8 });
  const boucleDark = new THREE.MeshStandardMaterial({ color: 0x3b332b, roughness: 0.9 });
  const travertin = new THREE.MeshStandardMaterial({ map: tex("/textures/m-travertin/diff.webp", 1.2), color: 0xf1e6d2, roughness: 0.55 });
  const noyer = new THREE.MeshStandardMaterial({ map: tex("/textures/m-noyer/diff.webp", 1.5), color: 0xd8b597, roughness: 0.45 });
  const ceramique = new THREE.MeshStandardMaterial({ color: 0xb06c45, roughness: 0.75 });
  const papier = new THREE.MeshStandardMaterial({ color: 0xf6eee2, roughness: 0.9, emissive: 0xffc988, emissiveIntensity: 0 });
  const laine = new THREE.MeshStandardMaterial({ map: tex("/textures/tx-laine/diff.webp", 1.1), color: 0xe6dccb, roughness: 1 });
  const lin = new THREE.MeshStandardMaterial({ color: 0xf1e9dc, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
  const niche = new THREE.MeshStandardMaterial({ normalMap: chauxNor, color: 0xd6c4ac, roughness: 0.95 });

  type Piece = { g: THREE.Group; y: number; kind: "drop" | "unroll" | "rise" };
  const news: Piece[] = [];
  const newPiece = (x: number, z: number, kind: Piece["kind"], build: (g: THREE.Group) => void, y = 0) => {
    const g = new THREE.Group(); g.position.set(x, y, z); build(g); g.traverse((c) => { if ((c as THREE.Mesh).isMesh) shadowy(c as THREE.Mesh); });
    g.visible = false; scene.add(g); news.push({ g, y, kind });
  };
  // 0 · tapis
  newPiece(0.1, -0.7, "unroll", (g) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(3.4, 2.5, 0.4)), laine); m.rotation.x = -Math.PI / 2; m.position.y = 0.008; g.add(m); });
  // 1 · niche en arche, enduit
  newPiece(-1.7, -D / 2, "rise", (g) => {
    const s = new THREE.Shape(); s.moveTo(-0.55, 0); s.lineTo(-0.55, 1.75); s.absarc(0, 1.75, 0.55, Math.PI, 0, true); s.lineTo(0.55, 0); s.closePath();
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 3, curveSegments: 40 }), niche); g.add(m);
  });
  // 2 · canapé courbe en bouclé
  newPiece(0, -0.3, "drop", (g) => {
    const plinth = new THREE.Mesh(arcSlab(1.1, 1.68, 0.86, 0.06, 0.02), boucleDark); g.add(plinth);
    const seat = new THREE.Mesh(arcSlab(1.0, 1.78, 0.9, 0.24, 0.08), boucle); seat.position.y = 0.1; g.add(seat);
    const backrest = new THREE.Mesh(arcSlab(1.56, 1.86, 0.86, 0.5, 0.1), boucle); backrest.position.y = 0.1; g.add(backrest);
  });
  // 3 · table basse ovale en travertin
  newPiece(0.05, -0.1, "drop", (g) => {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.07, 64), travertin); top.scale.x = 1.45; top.position.y = 0.37; g.add(top);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.34, 48), travertin); foot.scale.x = 1.35; foot.position.y = 0.17; g.add(foot);
  });
  // 4 · buffet cannelé en noyer, vase en grès
  newPiece(2.0, -2.2, "drop", (g) => {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 0.44), noyer); body.position.y = 0.4; g.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.04, 0.48), noyer); top.position.y = 0.72; g.add(top);
    const flute = new THREE.CylinderGeometry(0.045, 0.045, 0.52, 12, 1, false, -Math.PI / 2, Math.PI);
    for (let i = 0; i < 17; i++) { const f = new THREE.Mesh(flute, noyer); f.position.set(-0.8 + i * 0.1, 0.4, 0.22); g.add(f); }
    for (const x of [-0.78, 0.78]) for (const z of [-0.17, 0.17]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), frameMat); l.position.set(x, 0.05, z); g.add(l); }
    const prof = [[0, 0], [0.09, 0], [0.13, 0.08], [0.14, 0.2], [0.09, 0.32], [0.05, 0.36], [0.06, 0.4]].map(([x, y]) => new THREE.Vector2(x, y));
    const vase = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), ceramique); vase.position.set(-0.45, 0.74, 0); g.add(vase);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), travertin); bowl.rotation.x = Math.PI; bowl.position.set(0.4, 0.86, 0); g.add(bowl);
  });
  // 5 · suspension en papier
  newPiece(0, -0.35, "drop", (g) => {
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 48, 32), papier); globe.position.y = 2.15; globe.castShadow = false; g.add(globe);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4), frameMat); cord.position.y = 2.62; g.add(cord);
  });
  // 6 · voilage en lin à la fenêtre
  newPiece(-W / 2 + 0.12, WZ1 + 0.32, "rise", (g) => {
    const geo = new THREE.PlaneGeometry(0.55, 2.55, 24, 1); const pa = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 34) * 0.025);
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, lin); m.rotation.y = Math.PI / 2; m.position.y = 1.32; g.add(m);
  });

  // ——— Les inspirations : cinq images qui arrivent du fond, puis se rangent en planche.
  const INSPI = ["japandi-essai", "contemporain-sculptural", "luxe-discret", "haussmannien-renove", "campagne-elegante"];
  const frameCard = new THREE.MeshBasicMaterial({ color: 0xefe9df, toneMapped: false });
  const cards = INSPI.map((n, i) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.08), frameCard));
    const img = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.93), new THREE.MeshBasicMaterial({ map: tex(`/editorial/ia/${n}-640.webp`), toneMapped: false }));
    img.position.set(0, 0.035, 0.002); g.add(img);
    g.visible = false; scene.add(g);
    const start = new THREE.Vector3((i - 2) * 3.2, 5 + i * 0.6, 13 + i * 1.5);
    const orbit = [new THREE.Vector3(-3.9, 2.2, 0.3), new THREE.Vector3(-2.3, 3.4, 1.7), new THREE.Vector3(0, 3.95, 0.5), new THREE.Vector3(2.4, 3.3, 1.6), new THREE.Vector3(3.9, 2.1, 0.2)][i]!;
    const board = [new THREE.Vector3(-1.5, 4.35, -2.2), new THREE.Vector3(0, 4.35, -2.2), new THREE.Vector3(1.5, 4.35, -2.2), new THREE.Vector3(-0.75, 3.3, -2.2), new THREE.Vector3(0.75, 3.3, -2.2)][i]!;
    return { g, start, orbit, board, tilt: (i % 2 ? -1 : 1) * 0.05 };
  });
  // Les matières tirées des inspirations, qui vont ensuite se poser sur la pièce.
  const swatchDefs: Array<[THREE.Material, THREE.Vector3]> = [
    [travertin, new THREE.Vector3(0.05, 0.4, -0.1)], [noyer, new THREE.Vector3(2.0, 0.6, -2.0)], [boucle, new THREE.Vector3(0, 0.5, -1.6)],
    [wallNewMat.clone(), new THREE.Vector3(-1.7, 1.6, -2.45)], [floorNewMat.clone(), new THREE.Vector3(-1.2, 0.05, 0.9)],
  ];
  const swatches = swatchDefs.map(([m, target], i) => {
    const mat = (m as THREE.MeshStandardMaterial).clone(); mat.transparent = false; mat.opacity = 1;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.04), mat); mesh.visible = false; scene.add(mesh);
    return { mesh, row: new THREE.Vector3(-1.6 + i * 0.8, 2.35, -0.4), target };
  });

  // ——— Caméra : un plan-séquence le long de six positions clés.
  const camPos = new THREE.CatmullRomCurve3([
    new THREE.Vector3(7.6, 4.3, 8.6), new THREE.Vector3(3.6, 2.3, 5.4), new THREE.Vector3(0.4, 3.3, 9.2),
    new THREE.Vector3(0, 3.6, 7.2), new THREE.Vector3(4.6, 2.0, 5.0), new THREE.Vector3(1.6, 1.9, 5.6),
  ], false, "catmullrom", 0.5);
  const camTgt = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.0, -0.6), new THREE.Vector3(-0.6, 1.0, -1.1), new THREE.Vector3(0, 1.8, -0.4),
    new THREE.Vector3(0, 3.1, -1.2), new THREE.Vector3(-0.6, 0.95, -1.0), new THREE.Vector3(0.2, 0.85, -0.9),
  ], false, "catmullrom", 0.5);

  // ——— Boucle d'animation.
  const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3(), dummy = new THREE.Object3D(), qA = new THREE.Quaternion(), qB = new THREE.Quaternion();
  const cBefore = { hemiSky: new THREE.Color(0xcfd8e3), hemiGround: new THREE.Color(0x2f2f2c), sun: new THREE.Color(0xdfe8f2), sky: new THREE.Color(0xb8c3cd) };
  const cAfter = { hemiSky: new THREE.Color(0xffeedd), hemiGround: new THREE.Color(0x4a3a2c), sun: new THREE.Color(0xffe2bd), sky: new THREE.Color(0xfff2de) };
  let cur = o.getProgress(), active = true, raf = 0, last = performance.now(), time = 0, dirty = true, w = 0, h = 0, lastP = -1;
  const spots: Spot[] = POINTS.map(() => ({ x: 0, y: 0, v: 0 }));
  const portraitK = () => { const a = w / Math.max(1, h); return a < 1 ? 1 + (1 - a) * 1.15 : 1; };

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

  function apply(p: number) {
    // Caméra
    camPos.getPoint(p, tmpP); camTgt.getPoint(p, tmpT);
    if (!reduced) { tmpP.x += Math.sin(time * 0.23) * 0.16; tmpP.y += Math.sin(time * 0.31) * 0.07; }
    tmpP.sub(tmpT).multiplyScalar(portraitK()).add(tmpT);
    camera.position.copy(tmpP); camera.lookAt(tmpT);

    // 1 · analyse : contour et balayage
    const scanT = ramp(0.06, 0.3, p);
    edgeMat.opacity = bell(0.06, 0.18, 0.36, p) * 0.9;
    scanMat.opacity = bell(0.06, 0.16, 0.32, p) * 0.22; scan.position.y = scanT * H; scan.visible = scanMat.opacity > 0.005;
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
      const s = lerp(1, 0.82, boardT) * (1 - outT);
      c.g.scale.setScalar(Math.max(0.001, s));
    });
    swatches.forEach((s, i) => {
      const appear = outCubic(ramp(0.48 + i * 0.015, 0.58 + i * 0.015, p));
      const fly = ramp(0.63 + i * 0.014, 0.73 + i * 0.014, p);
      s.mesh.visible = appear > 0.001 && fly < 0.999;
      if (!s.mesh.visible) return;
      tmpP.lerpVectors(s.row, s.target, fly); tmpP.y += Math.sin(Math.PI * fly) * 0.9;
      s.mesh.position.copy(tmpP);
      s.mesh.lookAt(camera.position);
      s.mesh.rotateZ(fly * 2.2);
      s.mesh.scale.setScalar(Math.max(0.001, appear * (1 - fly * 0.85)));
    });

    // 4 · transformation : l'ancien s'efface, les matières se posent, le neuf s'assemble, la lumière se réchauffe.
    olds.forEach((g, i) => { const k = ramp(0.6 + i * 0.012, 0.68 + i * 0.012, p); g.scale.y = Math.max(0.001, 1 - k); g.visible = k < 0.999; });
    const mat = ramp(0.64, 0.78, p);
    floorNewMat.opacity = mat; wallNewMat.opacity = mat;
    floorNew.visible = backNew.visible = mat > 0.001;
    news.forEach((n, i) => {
      const k = ramp(0.65 + i * 0.016, 0.74 + i * 0.016, p);
      n.g.visible = k > 0.001;
      if (n.kind === "drop") { n.g.position.y = n.y + (1 - outCubic(k)) * 2.4; n.g.scale.setScalar(lerp(0.9, 1, k)); }
      else if (n.kind === "unroll") { n.g.scale.set(Math.max(0.001, outCubic(k)), 1, 1); }
      else { n.g.scale.set(1, Math.max(0.001, outCubic(k)), 1); }
    });
    const warm = ramp(0.64, 0.82, p);
    hemi.color.lerpColors(cBefore.hemiSky, cAfter.hemiSky, warm); hemi.groundColor.lerpColors(cBefore.hemiGround, cAfter.hemiGround, warm);
    hemi.intensity = lerp(1.0, 0.55, warm);
    sun.color.lerpColors(cBefore.sun, cAfter.sun, warm); sun.intensity = lerp(0.6, 3.4, warm);
    skyMat.color.lerpColors(cBefore.sky, cAfter.sky, warm);
    shaftMat.opacity = warm * 0.3; dustMat.opacity = warm * 0.7; shaft.visible = dust.visible = warm > 0.01;
    lampLight.intensity = warm * 2.6; papier.emissiveIntensity = warm * 0.45;
    scene.environmentIntensity = lerp(0.25, 0.45, warm);
    renderer.toneMappingExposure = lerp(0.95, 1.08, warm);
    if (!reduced) { dust.position.y = Math.sin(time * 0.15) * 0.06; dust.rotation.y = Math.sin(time * 0.05) * 0.03; }

    // 5 · points cliquables projetés à l'écran
    const vis = ramp(0.86, 0.96, p);
    POINTS.forEach((pt, i) => {
      tmpP.set(...pt.pos).project(camera);
      const s = spots[i]!; s.x = (tmpP.x + 1) / 2 * w; s.y = (1 - tmpP.y) / 2 * h; s.v = tmpP.z < 1 ? vis : 0;
    });
  }

  function frame(now: number) {
    raf = 0;
    if (!active) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const target = o.getProgress();
    if (reduced) cur = Math.round(target * 5) / 5;
    else if (Math.abs(target - cur) < 2e-4) cur = target;
    else cur += (target - cur) * (1 - Math.exp(-dt * 4.2));
    // On ne redessine que pendant le défilement (ou après un chargement) : à l'arrêt, la scène ne consomme rien.
    if (compiled && (cur !== lastP || dirty)) { if (!reduced) time += dt; apply(cur); renderer.render(scene, camera); o.onFrame(cur, spots); lastP = cur; dirty = false; }
    raf = requestAnimationFrame(frame);
  }
  // Shaders préparés en parallèle quand le navigateur le permet, puis première image.
  let compiled = false;
  renderer.compileAsync(scene, camera).catch(() => undefined).finally(() => { compiled = true; dirty = true; });
  raf = requestAnimationFrame(frame);

  return {
    setActive(on) { active = on; if (on && !raf) { last = performance.now(); dirty = true; raf = requestAnimationFrame(frame); } },
    setReduced(on) { reduced = on; dirty = true; },
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
