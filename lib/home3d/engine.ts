import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { paintMaterial, shade } from "@/lib/draw";
import { materialById } from "@/content/lookup";
import type { TextureKind } from "@/content/types";
import { buildItem, type Mats } from "./furniture";
import { instantiate, isModel } from "./models";
import { realTexture, textureUrl } from "@/lib/textures";
import { deriveStructure, hasCeiling, roomAt as roomAtL, viewpoint, type Layout, type RoomDef, type Wall } from "./layout";
import { CATALOG, EYE_H, PSEUDO_MATERIALS, WALL_H, defaultRoomStyle, type HomeState, type Item, type Note, type RoomStyle, type WallFinish } from "./plan";

export type Selection = { kind: "item"; id: string } | { kind: "wall"; roomId: string } | { kind: "room"; roomId: string } | { kind: "note"; id: string };
export type Mode = "visite" | "plan";
export interface EngineEvents {
  onSelect(sel: Selection | null): void;
  onRoom(roomId: string): void;
  onItemMoved(id: string, x: number, z: number): void;
  onNotePlaced(p: { x: number; y: number; z: number; roomId: string }): void;
  onModeChange(m: Mode): void;
}

/** Taille réelle (m) couverte par une image de texture, selon le motif. */
const TILE: Partial<Record<TextureKind, number>> = { wood: 0.6, planks: 1.4, tile: 1.0, cement: 0.8, hex: 1.1, marble: 1.8, travertine: 1.4, terrazzo: 1.0, slate: 1.2, gravel: 1.0, plaster: 2.2, brick: 1.1, washi: 1.6, cork: 0.8, weave: 1.0, fluted: 0.8, metal: 1.5, cane: 0.6 };
const ROUGH: Record<string, number> = { Pierre: 0.35, Terre: 0.55, Bois: 0.55, Fibre: 0.85, Textile: 0.95, Métal: 0.35, Verre: 0.08, Composite: 0.45, Extérieur: 0.7 };
const ACCENT = 0x2747d0;
/** Intensité du relief (carte de normales calculée depuis la texture) selon le motif. */
const BUMP: Partial<Record<TextureKind, number>> = { tile: 3, cement: 1.2, hex: 3, brick: 4, planks: 2.2, wood: 1.4, plaster: 1.2, marble: 0.3, travertine: 1.8, terrazzo: 0.8, slate: 2.6, gravel: 4, cork: 1.6, weave: 2.4, cane: 2.6, fluted: 3, washi: 1, boucle: 2.6, cord: 2.4, leather: 1.3, raffia: 2.4 };

/** Carte de normales (relief) déduite de la luminosité : joints et veines sombres = creux. */
function normalFrom(img: HTMLCanvasElement, strength: number): THREE.CanvasTexture {
  const w = img.width, h = img.height, src = img.getContext("2d")!.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = (0.3 * src[i * 4]! + 0.59 * src[i * 4 + 1]! + 0.11 * src[i * 4 + 2]!) / 255;
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const x = cv.getContext("2d")!, out = x.createImageData(w, h), d = out.data, k = strength * (w / 256);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const l = (xx - 1 + w) % w, r = (xx + 1) % w, u = ((yy - 1 + h) % h) * w, dn = ((yy + 1) % h) * w;
    const nx = -(lum[yy * w + r]! - lum[yy * w + l]!) * k, ny = (lum[dn + xx]! - lum[u + xx]!) * k, len = Math.hypot(nx, ny, 1);
    const o = (yy * w + xx) * 4;
    d[o] = (nx / len * 0.5 + 0.5) * 255; d[o + 1] = (ny / len * 0.5 + 0.5) * 255; d[o + 2] = (1 / len * 0.5 + 0.5) * 255; d[o + 3] = 255;
  }
  x.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace;
  return t;
}
/** Faces extérieures des murs qui ne donnent sur aucune pièce. */
const FACADE = "_facade";

type Box2 = { x0: number; x1: number; z0: number; z1: number };

class MatFactory implements Mats {
  private cache = new Map<string, THREE.Material>();
  private textures = new Map<string, THREE.CanvasTexture>();
  constructor(private maxAniso: number, private texSize: number, private light = false, private onUpdate: () => void = () => {}) {}
  private loader = new THREE.TextureLoader();
  /** Remplace les motifs dessinés par les vraies textures photographiées (Poly Haven, CC0) quand elles existent. */
  private real(mat: THREE.MeshStandardMaterial, id: string, repeat: number, withColor: boolean) {
    if (this.light || !realTexture(id)) return;
    for (const map of (withColor ? ["diff", "nor", "rough"] : ["nor", "rough"]) as Array<"diff" | "nor" | "rough">) {
      this.loader.load(textureUrl(id, map), (t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = this.maxAniso;
        t.colorSpace = map === "diff" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        if (map === "diff") { mat.map?.dispose(); mat.map = t; mat.color.set("#ffffff"); }
        else if (map === "nor") mat.normalMap = t;
        else { mat.roughnessMap = t; mat.roughness = 1; }
        mat.needsUpdate = true; this.onUpdate();
      }, undefined, () => { /* texture absente : on garde le motif dessiné */ });
    }
  }

  private normals = new Map<string, THREE.CanvasTexture>();
  texture(kind: TextureKind, colors: readonly string[], key: string, size = this.texSize): THREE.CanvasTexture {
    const k = `${kind}|${colors.join(",")}|${key}|${size}`;
    let t = this.textures.get(k);
    if (!t) {
      const cv = document.createElement("canvas"); cv.width = cv.height = size;
      paintMaterial(cv, kind, colors, key);
      t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = this.maxAniso;
      this.textures.set(k, t);
    }
    return t;
  }
  /** Relief associé à une texture (mis en cache). */
  normal(kind: TextureKind, base: THREE.CanvasTexture): THREE.CanvasTexture | null {
    const s = BUMP[kind]; if (!s || this.light) return null;
    let n = this.normals.get(base.uuid);
    if (!n) { n = normalFrom(base.image as HTMLCanvasElement, s); n.anisotropy = this.maxAniso; this.normals.set(base.uuid, n); }
    return n;
  }
  private memo<T extends THREE.Material>(k: string, make: () => T): T {
    let m = this.cache.get(k) as T | undefined;
    if (!m) { m = make(); this.cache.set(k, m); }
    return m;
  }
  /** Surface à coordonnées de texture en mètres (sols, murs). */
  surface(id: string): THREE.MeshStandardMaterial {
    return this.memo(`surf|${id}`, () => {
      const m = materialById.get(id) ?? (PSEUDO_MATERIALS[id] ? { ...PSEUDO_MATERIALS[id]!, family: "Extérieur" as const } : undefined);
      if (!m) return new THREE.MeshStandardMaterial({ color: "#cccccc", roughness: 0.8 });
      const base = this.texture(m.texture, m.colors, id, this.light ? this.texSize : this.texSize * 2), tex = base.clone(); tex.needsUpdate = true;
      const tile = TILE[m.texture] ?? 1.2; tex.repeat.set(1 / tile, 1 / tile);
      const nb = this.normal(m.texture, base), nm = nb ? nb.clone() : null;
      if (nm) { nm.needsUpdate = true; nm.repeat.copy(tex.repeat); }
      const mat = new THREE.MeshStandardMaterial({ map: tex, normalMap: nm, roughness: ROUGH[m.family] ?? 0.6, metalness: m.family === "Métal" ? 0.6 : 0 });
      const rt = realTexture(id); if (rt) this.real(mat, id, 1 / rt.tile, true);
      return mat;
    });
  }
  wallMaterial(f: WallFinish): THREE.MeshStandardMaterial {
    return f.kind === "peinture" ? this.memo(`wall|${f.hex}`, () => new THREE.MeshStandardMaterial({ color: f.hex, roughness: 0.92 })) : this.surface(f.id);
  }
  fabric(id: string | undefined, hex: string): THREE.Material {
    return this.memo(`fab|${id}|${hex}`, () => {
      const m = id ? materialById.get(id) : undefined;
      if (!m) return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95 });
      const base = this.texture(m.texture, [hex, shade(hex, -9), shade(hex, 7)], id ?? "tissu"), tex = base.clone(); tex.needsUpdate = true; tex.repeat.set(3, 3);
      const nb = this.normal(m.texture, base), nm = nb ? nb.clone() : null;
      if (nm) { nm.needsUpdate = true; nm.repeat.set(3, 3); }
      if (m.id === "m-cuir" || this.light) { const mat = new THREE.MeshStandardMaterial({ map: tex, normalMap: nm, roughness: m.id === "m-cuir" ? 0.5 : 0.95 }); this.real(mat, m.id, 3, false); return mat; }
      // Tissu : reflet doux sur les arêtes (« sheen »), comme un vrai velours ou un lin.
      const mat = new THREE.MeshPhysicalMaterial({ map: tex, normalMap: nm, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.92, sheen: m.id === "m-velours" ? 1 : 0.6, sheenRoughness: m.id === "m-velours" ? 0.35 : 0.7, sheenColor: new THREE.Color(shade(hex, 45)) });
      this.real(mat, m.id, 3, false);
      return mat;
    });
  }
  struct(id: string | undefined): THREE.Material {
    return this.memo(`str|${id}`, () => {
      const m = id ? materialById.get(id) : undefined;
      if (!m) return new THREE.MeshStandardMaterial({ color: "#C8A27A", roughness: 0.6 });
      if (m.family === "Métal") return new THREE.MeshStandardMaterial({ color: m.colors[1] ?? m.colors[0], metalness: 0.85, roughness: 0.32 });
      if (m.texture === "lacquer") return new THREE.MeshStandardMaterial({ color: m.colors[0], roughness: 0.12 });
      const tex = this.texture(m.texture, m.colors, `${id}-meuble`);
      const mat = new THREE.MeshStandardMaterial({ map: tex, normalMap: this.normal(m.texture, tex), normalScale: new THREE.Vector2(0.5, 0.5), roughness: ROUGH[m.family] ?? 0.55 });
      this.real(mat, id!, 0.6, true);
      return mat;
    });
  }
  paint(hex: string, rough = 0.6): THREE.Material { return this.std(hex, rough); }
  std(hex: string, rough: number, metal = 0, emissive?: string): THREE.Material {
    return this.memo(`std|${hex}|${rough}|${metal}|${emissive ?? ""}`, () => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal, ...(emissive ? { emissive, emissiveIntensity: 0.9 } : {}) }));
  }
  glass(): THREE.Material {
    return this.memo("glass", () => new THREE.MeshStandardMaterial({ color: "#d8ebf0", roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false }));
  }
  mirror(): THREE.Material { return this.memo("mirror", () => new THREE.MeshStandardMaterial({ color: "#e4ecee", roughness: 0.06, metalness: 0.95 })); }
  art(hex: string, seed: string): THREE.Material {
    return this.memo(`art|${hex}|${seed}`, () => {
      const kinds: TextureKind[] = ["plaster", "washi", "terrazzo", "marble"];
      const tex = this.texture(kinds[seed.length % kinds.length]!, [shade(hex, 40), hex, shade(hex, -50), "#E9E2D3"], seed);
      return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    });
  }
  dispose() { this.cache.forEach((m) => m.dispose()); this.textures.forEach((t) => t.dispose()); this.normals.forEach((t) => t.dispose()); }
}

/** Réécrit les coordonnées de texture en mètres (monde), pour des motifs à la bonne échelle sur tous les murs et sols. */
function worldUV(geo: THREE.BufferGeometry) {
  const pos = geo.getAttribute("position"), nor = geo.getAttribute("normal"), uv = geo.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    if (ny >= nx && ny >= nz) uv.setXY(i, x, z); else if (nx >= nz) uv.setXY(i, z, y); else uv.setXY(i, x, y);
  }
  uv.needsUpdate = true;
}

function labelSprite(text: string, sub: string): THREE.Sprite {
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 160;
  const x = cv.getContext("2d")!;
  x.fillStyle = "rgba(255,255,255,0.92)"; x.beginPath(); x.roundRect(8, 8, 496, 144, 40); x.fill();
  x.fillStyle = "#1B1B1B"; x.font = "600 54px system-ui, sans-serif"; x.textAlign = "center"; x.fillText(text, 256, 80);
  x.fillStyle = "#5A5650"; x.font = "36px system-ui, sans-serif"; x.fillText(sub, 256, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(2.2, 0.69, 1); s.renderOrder = 10;
  return s;
}

function noteSprite(): THREE.Sprite {
  const cv = document.createElement("canvas"); cv.width = cv.height = 128;
  const x = cv.getContext("2d")!;
  x.fillStyle = "#F2C14E"; x.strokeStyle = "#ffffff"; x.lineWidth = 10; x.beginPath(); x.arc(64, 64, 52, 0, Math.PI * 2); x.fill(); x.stroke();
  x.fillStyle = "#2B2B2B"; x.beginPath(); x.arc(64, 54, 20, 0, Math.PI * 2); x.fill(); x.fillRect(54, 68, 20, 18); x.fillRect(56, 89, 16, 6);
  x.fillStyle = "#F2C14E"; x.beginPath(); x.arc(64, 54, 11, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(0.32, 0.32, 1); s.renderOrder = 11;
  return s;
}

export class HomeEngine {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private mats: MatFactory;
  private orbit: OrbitControls | null = null;
  private mode: Mode = "visite";
  private state: HomeState;
  private raf = 0;
  private clock = new THREE.Clock();
  private ro: ResizeObserver;
  private disposed = false;
  /** Rendu à la demande : on ne redessine que si quelque chose a changé (batterie, mobiles). */
  private dirty = true;
  private lastCam = new Float64Array(5);
  invalidate() { this.dirty = true; }

  private pos = new THREE.Vector3();
  private yaw = 0;
  private pitch = -0.08;
  private keys = new Set<string>();
  private joy = { x: 0, y: 0 };
  private walkTarget: THREE.Vector3 | null = null;
  private tween: { t: number; dur: number; from: { x: number; z: number; yaw: number; pitch: number }; to: { x: number; z: number; yaw: number; pitch: number } } | null = null;
  private currentRoom = "";

  private structure = new THREE.Group();
  private wallGroup = new THREE.Group();
  private floorGroup = new THREE.Group();
  private ceilingGroup = new THREE.Group();
  private treeGroup = new THREE.Group();
  private sun!: THREE.DirectionalLight;
  private bounds = { x0: 0, x1: 1, z0: 0, z1: 1 };
  private center = new THREE.Vector3();
  private span = 12;
  private layoutSig = "";
  private itemGroup = new THREE.Group();
  private noteGroup = new THREE.Group();
  private labelGroup = new THREE.Group();
  private wallMeshesByRoom = new Map<string, Array<{ mesh: THREE.Mesh; index: number }>>();
  private floors = new Map<string, THREE.Mesh>();
  private itemObjs = new Map<string, THREE.Group>();
  private itemSig = new Map<string, string>();
  private noteObjs = new Map<string, THREE.Sprite>();
  private wallBoxes: Box2[] = [];
  private itemBoxes = new Map<string, Box2>();
  private clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.25);
  private clipped = new Set<THREE.Material>();
  private edgeMat: THREE.MeshStandardMaterial;

  private selected: Selection | null = null;
  private selBox: THREE.BoxHelper | null = null;
  private placingNote = false;

  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private pointer: { id: number; x: number; y: number; sx: number; sy: number; moved: boolean; drag: "look" | "item" | null; itemId?: string; offset?: THREE.Vector3 } | null = null;
  private lastTap = 0;
  private floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(private container: HTMLElement, state: HomeState, private ev: EngineEvents, opts: { quality: "haute" | "standard" }) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: false });
    // Sans carte graphique (rendu logiciel), on allège tout pour rester fluide.
    const gl = this.renderer.getContext(), dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const software = /swiftshader|llvmpipe|software|basic render/i.test(String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ""));
    this.canPhoto = !software;
    const high = opts.quality === "haute" && !software;
    this.renderer.setPixelRatio(software ? 1 : Math.min(window.devicePixelRatio, high ? 2 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = !software;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.localClippingEnabled = true;
    const cv = this.renderer.domElement;
    cv.style.display = "block"; cv.style.width = "100%"; cv.style.height = "100%"; cv.style.touchAction = "none"; cv.style.outline = "none";
    cv.setAttribute("aria-hidden", "true");
    container.appendChild(cv);

    this.mats = new MatFactory(Math.min(8, this.renderer.capabilities.getMaxAnisotropy()), software ? 256 : high ? 512 : 384, software, () => { this.dirty = true; });
    this.edgeMat = new THREE.MeshStandardMaterial({ color: "#EFEBE4", roughness: 0.9 });
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.05, 200);
    this.camera.rotation.order = "YXZ";
    this.state = state;

    this.buildEnv(high);
    this.structure.add(this.wallGroup, this.floorGroup, this.ceilingGroup, this.labelGroup, this.treeGroup);
    this.scene.add(this.structure, this.itemGroup, this.noteGroup);
    this.buildStructure();
    this.applyRooms();
    this.syncItems();
    this.syncNotes();

    cv.addEventListener("pointerdown", this.onDown);
    cv.addEventListener("pointermove", this.onMove);
    cv.addEventListener("pointerup", this.onUp);
    cv.addEventListener("pointercancel", this.onCancel);
    cv.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
    const start = this.layout.rooms.find((r) => r.id === "salon") ?? this.layout.rooms.find((r) => hasCeiling(r)) ?? this.layout.rooms[0];
    if (start) this.teleport(start.id, false);
    this.loop();
  }

  /* ——————————————— Construction ——————————————— */
  private get layout(): Layout { return this.state.layout; }
  private roomAt(x: number, z: number): RoomDef | undefined { return roomAtL(this.layout, x, z); }
  private room(id: string): RoomDef | undefined { return this.layout.rooms.find((r) => r.id === id); }

  /** Ciel, lumière, sol extérieur : construits une seule fois. */
  private buildEnv(high: boolean) {
    const s = this.scene;
    s.background = new THREE.Color("#CFE0EA");
    s.fog = new THREE.Fog("#CFE0EA", 30, 90);
    const pm = new THREE.PMREMGenerator(this.renderer);
    s.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    const mirror = this.mats.mirror() as THREE.MeshStandardMaterial; mirror.envMap = s.environment; mirror.envMapIntensity = 1.6;
    s.environmentIntensity = 0.4;
    pm.dispose();
    void this.loadHdri(mirror);
    s.add(new THREE.HemisphereLight("#EAF2F8", "#B9A98F", 0.4));
    const sun = new THREE.DirectionalLight("#FFF1DC", 3.0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(high ? 2048 : 1024, high ? 2048 : 1024);
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    s.add(sun, sun.target);
    this.sun = sun;
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: "#9DAF7E", roughness: 1 }));
    grass.rotation.x = -Math.PI / 2; grass.position.y = -0.02; grass.receiveShadow = true; s.add(grass);
  }

  /** Éclairage photographique (HDRI Poly Haven, CC0) : reflets d'intérieur réels et parc visible par les fenêtres. */
  private hdri = false;
  private async loadHdri(mirror: THREE.MeshStandardMaterial) {
    try {
      const { EXRLoader } = await import("three/examples/jsm/loaders/EXRLoader.js");
      const l = new EXRLoader();
      const [inside, outside] = await Promise.all([l.loadAsync("/3d/apartment.exr"), l.loadAsync("/3d/park.exr")]);
      if (this.disposed) { inside.dispose(); outside.dispose(); return; }
      const pm = new THREE.PMREMGenerator(this.renderer);
      const env = pm.fromEquirectangular(inside).texture;
      pm.dispose();
      this.envEquirect = inside; inside.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment?.dispose();
      this.scene.environment = env; mirror.envMap = env;
      outside.mapping = THREE.EquirectangularReflectionMapping; outside.colorSpace = THREE.LinearSRGBColorSpace;
      this.scene.background = outside; this.scene.backgroundIntensity = 0.9; this.scene.backgroundBlurriness = 0.04;
      this.scene.fog = null; this.hdri = true; this.dirty = true;
    } catch { /* on garde l'éclairage de secours */ }
  }

  /* ——————————————— Rendu photo (tracé de chemins, sur l'appareil du visiteur) ——————————————— */
  /** Faux sur les appareils sans carte graphique : le calcul serait beaucoup trop long. */
  canPhoto = false;
  private envEquirect: THREE.Texture | null = null;
  private photo: { pt: import("three-gpu-pathtracer").WebGLPathTracer; target: number; onProgress: (p: number, done: boolean) => void; envBackup: THREE.Texture | null; exposure: number; grab: ((url: string) => void) | null } | null = null;
  get photoActive() { return !!this.photo; }
  private lastProgress = 0;

  /** Lance un rendu photoréaliste progressif de la vue courante. */
  async startPhoto(onProgress: (p: number, done: boolean) => void, samples = 400) {
    if (!this.canPhoto || this.photo) return;
    this.lastProgress = 0;
    const { WebGLPathTracer } = await import("three-gpu-pathtracer");
    if (this.disposed) return;
    this.tween = null; this.walkTarget = null; this.keys.clear(); this.joy = { x: 0, y: 0 };
    const hidden: THREE.Object3D[] = [this.labelGroup, this.noteGroup, ...(this.selBox ? [this.selBox] : [])];
    hidden.forEach((o) => { o.visible = false; });
    const pt = new WebGLPathTracer(this.renderer);
    pt.tiles.set(2, 2); pt.bounces = 6; pt.filterGlossyFactor = 0.5; pt.minSamples = 1; pt.fadeDuration = 300; pt.renderDelay = 0;
    pt.renderScale = Math.min(1, 1.5 / this.renderer.getPixelRatio());
    const envBackup = this.scene.environment;
    if (this.envEquirect) this.scene.environment = this.envEquirect;
    this.photo = { pt, target: samples, onProgress, envBackup, exposure: this.renderer.toneMappingExposure, grab: null };
    this.renderer.toneMappingExposure = 1.25;
    await pt.setSceneAsync(this.scene, this.camera);
  }
  /** Arrête le rendu photo et revient à la 3D interactive. */
  stopPhoto() {
    const ph = this.photo; if (!ph) return;
    ph.pt.dispose();
    this.scene.environment = ph.envBackup;
    this.renderer.toneMappingExposure = ph.exposure;
    this.labelGroup.visible = this.mode === "plan"; this.noteGroup.visible = true;
    if (this.selBox) this.selBox.visible = true;
    this.photo = null; this.dirty = true;
  }
  /** Image du rendu photo en cours (PNG). */
  grabPhoto(): Promise<string> { return new Promise((res) => { if (this.photo) this.photo.grab = res; else res(this.capture()); }); }

  /** Murs, sols, plafonds, étiquettes et arbres : reconstruits quand le plan change. */
  private buildStructure() {
    for (const g of [this.wallGroup, this.floorGroup, this.ceilingGroup, this.labelGroup, this.treeGroup]) {
      g.traverse((o) => {
        const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose();
        const sp = o as THREE.Sprite; if (sp.isSprite) { (sp.material as THREE.SpriteMaterial).map?.dispose(); sp.material.dispose(); }
      });
      g.clear();
    }
    this.wallBoxes = []; this.floors.clear(); this.wallMeshesByRoom.clear(); this.clipped.clear();
    const l = this.layout, st = deriveStructure(l), bb = st.bbox;
    this.layoutSig = JSON.stringify(l);
    this.bounds = { x0: bb.x0 + 0.25, x1: bb.x1 - 0.25, z0: bb.z0 + 0.25, z1: bb.z1 - 0.25 };
    this.center.set((bb.x0 + bb.x1) / 2, 0, (bb.z0 + bb.z1) / 2);
    this.span = Math.max(bb.x1 - bb.x0, bb.z1 - bb.z0, 4);
    const half = this.span / 2 + 3;
    this.sun.position.set(this.center.x - 8, 11 + this.span * 0.2, this.center.z - 14); this.sun.target.position.copy(this.center);
    Object.assign(this.sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 40 + this.span * 2 });
    this.sun.shadow.camera.updateProjectionMatrix();

    for (const w of st.walls) this.buildWall(w);
    const rail = this.mats.std("#3B3D3F", 0.4, 0.7);
    for (const [a, b] of st.railings) {
      const horiz = a[1] === b[1], len = horiz ? b[0] - a[0] : b[1] - a[1], cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.02, 0.95, horiz ? 0.02 : len), this.mats.glass()); glass.position.set(cx, 0.5, cz);
      const top = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.05, 0.05, horiz ? 0.05 : len), rail); top.position.set(cx, 1.0, cz); top.castShadow = true;
      this.wallGroup.add(glass, top);
      this.wallBoxes.push(horiz ? { x0: a[0], x1: b[0], z0: cz - 0.05, z1: cz + 0.05 } : { x0: cx - 0.05, x1: cx + 0.05, z0: a[1], z1: b[1] });
    }
    for (const r of l.rooms) {
      const w = r.x1 - r.x0, d = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
      const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz); worldUV(g);
      const floor = new THREE.Mesh(g, this.mats.surface("m-chene")); floor.receiveShadow = true; floor.userData = { pick: "floor", roomId: r.id };
      this.floors.set(r.id, floor); this.floorGroup.add(floor);
      if (hasCeiling(r)) {
        const cg = new THREE.PlaneGeometry(w, d); cg.rotateX(Math.PI / 2); cg.translate(cx, WALL_H, cz);
        const ceil = new THREE.Mesh(cg, this.mats.std("#F7F5F1", 0.95)); ceil.castShadow = true; ceil.receiveShadow = true; ceil.visible = this.mode !== "plan"; this.ceilingGroup.add(ceil);
        const lamp = new THREE.PointLight("#FFD8A8", 3.2, 0, 2); lamp.position.set(cx, WALL_H - 0.25, cz); this.ceilingGroup.add(lamp);
      }
      const lab = labelSprite(r.name, `${(w * d).toFixed(0)} m²`); lab.position.set(cx, 1.7, cz); this.labelGroup.add(lab);
    }
    this.labelGroup.visible = this.mode === "plan";
    // Arbres autour du terrain
    const trunk = this.mats.std("#6A5A45", 1), crowns = [this.mats.std("#5E7A4E", 1), this.mats.std("#7A8F58", 1)];
    const R = this.span / 2 + 7;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + Math.sin(i * 3.7) * 0.15, rr = R + Math.abs(Math.sin(i * 1.3)) * 5, h = 2.5 + Math.abs(Math.sin(i * 1.7)) * 3;
      const x = this.center.x + Math.cos(a) * rr, z = this.center.z + Math.sin(a) * rr;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, h, 8), trunk); t.position.set(x, h / 2, z);
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3 + Math.abs(Math.sin(i)) * 0.9, 1), crowns[i % 2]!); c.position.set(x, h + 0.6, z); c.scale.y = 1.25;
      t.castShadow = c.castShadow = true; this.treeGroup.add(t, c);
    }
    this.applyRooms();
    if (this.mode === "plan") this.setClipping(true);
    this.dirty = true;
  }

  private buildWall(w: Wall) {
    const horiz = w.a[1] === w.b[1];
    const L = horiz ? w.b[0] - w.a[0] : w.b[1] - w.a[1];
    const along = (t: number): [number, number] => (horiz ? [w.a[0] + t, w.a[1]] : [w.a[0], w.a[1] + t]);
    const ops = w.openings.map((o) => ({ ...o, s: o.at - o.width / 2, e: o.at + o.width / 2 }));
    const cuts = new Set<number>([0, L]);
    for (const o of ops) { cuts.add(o.s); cuts.add(o.e); }
    for (const r of this.layout.rooms) for (const v of horiz ? [r.x0 - w.a[0], r.x1 - w.a[0]] : [r.z0 - w.a[1], r.z1 - w.a[1]]) if (v > 0 && v < L) cuts.add(v);
    const pts = [...cuts].sort((a, b) => a - b);
    const t = w.thick;
    for (let i = 0; i < pts.length - 1; i++) {
      let p = pts[i]!, q = pts[i + 1]!;
      const mid = (p + q) / 2, op = ops.find((o) => mid > o.s && mid < o.e);
      if (i === 0) p -= t / 2;
      if (i === pts.length - 2) q += t / 2;
      if (!op) this.wallPiece(horiz, along, p, q, 0, WALL_H, t, true);
      else {
        if (op.sill > 0) this.wallPiece(horiz, along, p, q, 0, op.sill, t, true);
        if (op.sill + op.height < WALL_H) this.wallPiece(horiz, along, p, q, op.sill + op.height, WALL_H, t, false);
      }
    }
    for (const o of ops) this.buildOpening(horiz, along, o, t);
  }

  private wallPiece(horiz: boolean, along: (t: number) => [number, number], p: number, q: number, y0: number, y1: number, thick: number, blocks: boolean) {
    const [ax, az] = along(p), [bx, bz] = along(q);
    const len = q - p, h = y1 - y0, cx = (ax + bx) / 2, cz = (az + bz) / 2;
    const geo = new THREE.BoxGeometry(horiz ? len : thick, h, horiz ? thick : len);
    geo.translate(cx, y0 + h / 2, cz); worldUV(geo);
    // Faces : 0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z
    const sides: Array<[number, number, number]> = horiz ? [[4, 0, 1], [5, 0, -1]] : [[0, 1, 0], [1, -1, 0]];
    const faceRooms: Array<string | null> = [null, null, null, null, null, null];
    for (const [idx, nx, nz] of sides) {
      const r = this.roomAt(cx + nx * (thick / 2 + 0.2), cz + nz * (thick / 2 + 0.2));
      faceRooms[idx] = r?.id ?? FACADE;
    }
    const mesh = new THREE.Mesh(geo, faceRooms.map(() => this.edgeMat));
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData = { pick: "wall", faceRooms };
    faceRooms.forEach((rid, index) => {
      if (!rid) return;
      const list = this.wallMeshesByRoom.get(rid) ?? []; list.push({ mesh, index }); this.wallMeshesByRoom.set(rid, list);
    });
    this.wallGroup.add(mesh);
    if (blocks) this.wallBoxes.push({ x0: Math.min(ax, bx) - (horiz ? 0 : thick / 2), x1: Math.max(ax, bx) + (horiz ? 0 : thick / 2), z0: Math.min(az, bz) - (horiz ? thick / 2 : 0), z1: Math.max(az, bz) + (horiz ? thick / 2 : 0) });
  }

  private buildOpening(horiz: boolean, along: (t: number) => [number, number], o: { s: number; e: number; sill: number; height: number; kind: string; width: number }, thick: number) {
    const frame = this.mats.std("#F3F1EC", 0.5), [sx, sz] = along(o.s), [ex, ez] = along(o.e);
    const cx = (sx + ex) / 2, cz = (sz + ez) / 2, w = o.width;
    const add = (bw: number, bh: number, bd: number, m: THREE.Material, x: number, y: number, z: number, shadow = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(horiz ? bw : bd, bh, horiz ? bd : bw), m);
      mesh.position.set(x, y, z); mesh.castShadow = shadow; mesh.receiveShadow = true; this.wallGroup.add(mesh); return mesh;
    };
    if (o.kind === "fenetre") {
      add(w, o.height, 0.02, this.mats.glass(), cx, o.sill + o.height / 2, cz, false);
      add(w, 0.05, thick + 0.02, frame, cx, o.sill + 0.025, cz);
      add(w, 0.05, 0.06, frame, cx, o.sill + o.height - 0.025, cz);
      for (const d of [-1, 0, 1]) add(0.05, o.height, 0.06, frame, cx + (horiz ? d * (w / 2 - 0.025) : 0), o.sill + o.height / 2, cz + (horiz ? 0 : d * (w / 2 - 0.025)));
    } else if (o.kind === "baie") {
      const pw = w / 2;
      const off = (k: number): [number, number] => (horiz ? [sx + k, cz] : [cx, sz + k]);
      const [g1x, g1z] = off(pw / 2);
      add(pw, o.height, 0.02, this.mats.glass(), g1x, o.height / 2, g1z + (horiz ? -0.03 : 0), false);
      for (const k of [0.025, pw, w - 0.025]) { const [fx, fz] = off(k); add(0.05, o.height, 0.06, frame, fx, o.height / 2, fz); }
      add(w, 0.05, 0.06, frame, cx, o.height - 0.025, cz);
      const [bx, bz] = off(pw / 2);
      this.wallBoxes.push(horiz ? { x0: bx - pw / 2, x1: bx + pw / 2, z0: bz - 0.06, z1: bz + 0.06 } : { x0: bx - 0.06, x1: bx + 0.06, z0: bz - pw / 2, z1: bz + pw / 2 });
    } else if (o.kind === "porte-entree") {
      add(w - 0.04, o.height - 0.02, 0.05, this.mats.std("#2F4A3D", 0.45), cx, o.height / 2, cz);
      add(0.03, 0.03, 0.1, this.mats.std("#B8913F", 0.3, 0.9), cx + (horiz ? w / 2 - 0.12 : 0), 1.05, cz + (horiz ? 0 : w / 2 - 0.12));
      this.wallBoxes.push(horiz ? { x0: sx, x1: ex, z0: cz - 0.1, z1: cz + 0.1 } : { x0: cx - 0.1, x1: cx + 0.1, z0: sz, z1: ez });
    } else {
      for (const d of [-1, 1]) add(0.04, o.height, thick + 0.02, frame, cx + (horiz ? d * (w / 2 - 0.02) : 0), o.height / 2, cz + (horiz ? 0 : d * (w / 2 - 0.02)));
      add(w, 0.04, thick + 0.02, frame, cx, o.height - 0.02, cz);
    }
  }

  /* ——————————————— État ——————————————— */
  setState(next: HomeState) {
    this.dirty = true;
    const roomsChanged = JSON.stringify(next.rooms) !== JSON.stringify(this.state.rooms);
    this.state = next;
    if (JSON.stringify(next.layout) !== this.layoutSig) {
      this.buildStructure();
      if (!this.room(this.currentRoom) || !this.roomAt(this.pos.x, this.pos.z)) { const first = next.layout.rooms.find((r) => hasCeiling(r)) ?? next.layout.rooms[0]; if (first) this.teleport(first.id, false); }
      if (this.mode === "plan") this.framePlan();
    } else if (roomsChanged) this.applyRooms();
    this.syncItems();
    this.syncNotes();
    this.refreshSelection();
  }

  private applyRooms() {
    const outside = this.layout.rooms.find((r) => r.kind === "exterieur");
    const facade = (outside && this.state.rooms[outside.id]?.wall) ?? defaultRoomStyle("exterieur").wall;
    for (const { mesh, index } of this.wallMeshesByRoom.get(FACADE) ?? []) (mesh.material as THREE.Material[])[index] = this.mats.wallMaterial(facade);
    for (const r of this.layout.rooms) {
      const st: RoomStyle = this.state.rooms[r.id] ?? defaultRoomStyle(r.kind);
      const wm = this.mats.wallMaterial(st.wall);
      for (const { mesh, index } of this.wallMeshesByRoom.get(r.id) ?? []) (mesh.material as THREE.Material[])[index] = wm;
      const floor = this.floors.get(r.id);
      if (floor) floor.material = this.mats.surface(st.floor);
      if (this.mode === "plan") this.setClipping(true);
    }
  }

  private syncItems() {
    const seen = new Set<string>();
    for (const it of this.state.items) {
      seen.add(it.id);
      const sig = JSON.stringify(it);
      if (this.itemSig.get(it.id) === sig) continue;
      this.removeItemObj(it.id);
      const obj = buildItem(it, this.mats);
      this.itemObjs.set(it.id, obj); this.itemSig.set(it.id, sig); this.itemGroup.add(obj);
      this.updateItemBox(it);
      if (isModel(it.type)) void this.attachModel(it, obj);
    }
    for (const id of [...this.itemObjs.keys()]) if (!seen.has(id)) this.removeItemObj(id);
  }
  /** Remplace l'emplacement provisoire par le modèle réaliste dès qu'il est chargé. */
  private async attachModel(it: Item, obj: THREE.Group) {
    try {
      const model = await instantiate(it.type, it.variant);
      if (this.disposed || this.itemObjs.get(it.id) !== obj) return;
      model.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.userData.itemId = it.id; m.userData.shared = true; } });
      for (const c of [...obj.children]) if (c.userData.placeholder) { obj.remove(c); (c as THREE.Mesh).geometry.dispose(); }
      obj.add(model);
      this.updateItemBox(it); this.refreshSelection();
    } catch { /* le volume provisoire reste affiché */ }
  }
  private removeItemObj(id: string) {
    const o = this.itemObjs.get(id); if (!o) return;
    this.itemGroup.remove(o);
    o.traverse((c) => { if ((c as THREE.Mesh).isMesh && !c.userData.shared) (c as THREE.Mesh).geometry.dispose(); });
    this.itemObjs.delete(id); this.itemSig.delete(id); this.itemBoxes.delete(id);
  }
  private updateItemBox(it: Item) {
    const o = this.itemObjs.get(it.id); if (!o) return;
    if (CATALOG[it.type].walkThrough) { this.itemBoxes.delete(it.id); return; }
    const b = new THREE.Box3().setFromObject(o);
    if (b.max.y - b.min.y < 0.2) { this.itemBoxes.delete(it.id); return; }
    this.itemBoxes.set(it.id, { x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z });
  }

  private syncNotes() {
    const seen = new Set<string>();
    for (const n of this.state.notes) {
      seen.add(n.id);
      let s = this.noteObjs.get(n.id);
      if (!s) { s = noteSprite(); s.userData = { pick: "note", noteId: n.id }; this.noteObjs.set(n.id, s); this.noteGroup.add(s); }
      s.position.set(n.x, n.y, n.z);
    }
    for (const [id, s] of this.noteObjs) if (!seen.has(id)) { this.noteGroup.remove(s); (s.material as THREE.SpriteMaterial).map?.dispose(); s.material.dispose(); this.noteObjs.delete(id); }
  }

  /* ——————————————— Sélection ——————————————— */
  select(sel: Selection | null, notify = true) {
    this.selected = sel;
    this.refreshSelection();
    if (notify) this.ev.onSelect(sel);
  }
  private refreshSelection() {
    this.dirty = true;
    if (this.selBox) { this.scene.remove(this.selBox); this.selBox.geometry.dispose(); this.selBox = null; }
    if (this.selected?.kind === "item") {
      const o = this.itemObjs.get(this.selected.id);
      if (!o) { this.selected = null; return; }
      this.selBox = new THREE.BoxHelper(o, ACCENT); (this.selBox.material as THREE.LineBasicMaterial).depthTest = false; this.selBox.renderOrder = 20;
      this.scene.add(this.selBox);
    }
  }

  /* ——————————————— Navigation ——————————————— */
  get currentMode() { return this.mode; }

  setMode(m: Mode) {
    if (m === this.mode) return;
    this.mode = m;
    this.tween = null; this.walkTarget = null;
    const plan = m === "plan";
    this.ceilingGroup.children.forEach((c) => { if ((c as THREE.Mesh).isMesh) c.visible = !plan; });
    this.labelGroup.visible = plan;
    this.dirty = true;
    this.setClipping(plan);
    this.scene.fog = plan || this.hdri ? null : new THREE.Fog("#CFE0EA", 30, 90);
    if (plan) {
      this.camera.fov = 45; this.camera.updateProjectionMatrix();
      if (!this.orbit) {
        this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbit.enableDamping = true; this.orbit.maxPolarAngle = 1.3; this.orbit.minDistance = 4; this.orbit.screenSpacePanning = false;
      }
      this.framePlan();
      this.orbit.enabled = true;
    } else {
      if (this.orbit) this.orbit.enabled = false;
      this.camera.fov = 68; this.camera.updateProjectionMatrix();
    }
    this.ev.onModeChange(m);
  }

  private framePlan() {
    const c = this.center, k = this.span;
    this.camera.position.set(c.x, k * 1.15 + 2, c.z + k * 1.2 + 2); this.camera.lookAt(c);
    if (this.orbit) { this.orbit.maxDistance = k * 3 + 10; this.orbit.target.copy(c); this.orbit.update(); }
    this.dirty = true;
  }

  private setClipping(on: boolean) {
    this.wallGroup.traverse((o) => {
      const mesh = o as THREE.Mesh; if (!mesh.isMesh) return;
      const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of ms) { mat.clippingPlanes = on ? [this.clipPlane] : null; mat.side = on ? THREE.DoubleSide : THREE.FrontSide; mat.needsUpdate = true; this.clipped.add(mat); }
    });
  }

  /** Va dans une pièce : déplacement fluide jusqu'au point de vue de la pièce. */
  teleport(roomId: string, smooth = true) {
    const r = this.room(roomId); if (!r) return;
    if (this.mode === "plan") this.setMode("visite");
    const { spawn, look } = viewpoint(this.layout, r);
    const to = { x: spawn[0], z: spawn[1], yaw: Math.atan2(-(look[0] - spawn[0]), -(look[1] - spawn[1])), pitch: -0.08 };
    this.walkTarget = null;
    if (!smooth) { this.pos.set(to.x, EYE_H, to.z); this.yaw = to.yaw; this.pitch = to.pitch; this.tween = null; this.updateRoom(); return; }
    let dy = to.yaw - this.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    this.tween = { t: 0, dur: 0.9, from: { x: this.pos.x, z: this.pos.z, yaw: this.yaw, pitch: this.pitch }, to: { ...to, yaw: this.yaw + dy } };
  }

  setJoystick(x: number, y: number) { this.joy.x = x; this.joy.y = y; if (x || y) { this.walkTarget = null; this.tween = null; } }
  setNotePlacement(on: boolean) { this.placingNote = on; this.renderer.domElement.style.cursor = on ? "crosshair" : ""; }

  /** Point de pose d'un nouvel objet : devant la caméra, dans la pièce courante. */
  spawnPoint(): { x: number; z: number; rot: number; roomId: string } {
    if (this.mode === "plan") {
      const r = this.room(this.currentRoom) ?? this.layout.rooms[0]!;
      return { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, rot: 0, roomId: r.id };
    }
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    let x = this.pos.x + fx * 1.6, z = this.pos.z + fz * 1.6;
    const r = this.roomAt(this.pos.x, this.pos.z) ?? this.room(this.currentRoom);
    if (r) { x = Math.min(r.x1 - 0.5, Math.max(r.x0 + 0.5, x)); z = Math.min(r.z1 - 0.5, Math.max(r.z0 + 0.5, z)); }
    const snap = (v: number) => Math.round(v * 20) / 20;
    return { x: snap(x), z: snap(z), rot: Math.round(this.yaw / (Math.PI / 4)) * (Math.PI / 4), roomId: r?.id ?? this.currentRoom };
  }

  itemSize(id: string): { w: number; d: number; h: number } | null {
    const o = this.itemObjs.get(id); if (!o) return null;
    const rot = o.rotation.y; o.rotation.y = 0; o.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(o); o.rotation.y = rot; o.updateMatrixWorld(true);
    return { w: b.max.x - b.min.x, d: b.max.z - b.min.z, h: b.max.y - b.min.y };
  }

  /** Capture de la vue courante (PNG). */
  capture(): string {
    if (this.selBox) this.selBox.visible = false;
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL("image/png");
    if (this.selBox) this.selBox.visible = true;
    return url;
  }

  private blocked(x: number, z: number): boolean {
    const r = 0.22;
    const B = this.bounds;
    if (x < B.x0 || x > B.x1 || z < B.z0 || z > B.z1) return true;
    const hit = (b: Box2) => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r;
    if (this.wallBoxes.some(hit)) return true;
    for (const b of this.itemBoxes.values()) if (hit(b)) return true;
    return false;
  }
  private tryMove(dx: number, dz: number): boolean {
    const wasBlocked = this.blocked(this.pos.x, this.pos.z);
    let moved = false;
    if (dx && (wasBlocked || !this.blocked(this.pos.x + dx, this.pos.z))) { this.pos.x += dx; moved = true; }
    if (dz && (wasBlocked || !this.blocked(this.pos.x, this.pos.z + dz))) { this.pos.z += dz; moved = true; }
    return moved;
  }
  private updateRoom() {
    const r = this.roomAt(this.pos.x, this.pos.z);
    if (r && r.id !== this.currentRoom) { this.currentRoom = r.id; this.ev.onRoom(r.id); }
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.1, this.clock.getDelta());
    const ph = this.photo;
    if (ph) {
      if (ph.pt.samples < ph.target) {
        ph.pt.renderSample();
        const now = performance.now();
        if (now - this.lastProgress > 250) { this.lastProgress = now; ph.onProgress(Math.min(1, ph.pt.samples / ph.target), false); }
      } else if (!ph.grab && this.lastProgress >= 0) { this.lastProgress = -1; ph.onProgress(1, true); }
      if (ph.grab) { if (ph.pt.samples >= ph.target) ph.pt.renderSample(); const g = ph.grab; ph.grab = null; g(this.renderer.domElement.toDataURL("image/jpeg", 0.92)); }
      return;
    }
    if (this.mode === "visite") this.stepVisit(dt);
    else if (this.orbit?.update()) this.dirty = true;
    const c = this.camera, l = this.lastCam;
    const now = [c.position.x, c.position.y, c.position.z, c.rotation.x, c.rotation.y];
    if (now.some((v, i) => Math.abs(v - l[i]!) > 1e-5)) { this.dirty = true; l.set(now); }
    if (!this.dirty) return;
    this.dirty = false;
    if (this.selBox) this.selBox.update();
    this.renderer.render(this.scene, this.camera);
  };

  private stepVisit(dt: number) {
    if (this.tween) {
      const tw = this.tween; tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = tw.t < 0.5 ? 2 * tw.t * tw.t : 1 - Math.pow(-2 * tw.t + 2, 2) / 2;
      this.pos.x = tw.from.x + (tw.to.x - tw.from.x) * e; this.pos.z = tw.from.z + (tw.to.z - tw.from.z) * e;
      this.yaw = tw.from.yaw + (tw.to.yaw - tw.from.yaw) * e; this.pitch = tw.from.pitch + (tw.to.pitch - tw.from.pitch) * e;
      if (tw.t >= 1) this.tween = null;
      this.updateRoom();
    } else {
      const k = this.keys;
      let f = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) + this.joy.y;
      let s = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0) + this.joy.x;
      const turn = (k.has("ArrowLeft") ? 1 : 0) - (k.has("ArrowRight") ? 1 : 0) + (k.has("KeyQ") ? 1 : 0) - (k.has("KeyE") ? 1 : 0);
      if (turn) this.yaw += turn * 1.8 * dt;
      f = Math.max(-1, Math.min(1, f)); s = Math.max(-1, Math.min(1, s));
      const speed = (k.has("ShiftLeft") || k.has("ShiftRight") ? 3.6 : 2.2) * dt;
      if (f || s) {
        this.walkTarget = null;
        const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
        this.tryMove((fx * f + rx * s) * speed, (fz * f + rz * s) * speed);
        this.updateRoom();
      } else if (this.walkTarget) {
        const dx = this.walkTarget.x - this.pos.x, dz = this.walkTarget.z - this.pos.z, dist = Math.hypot(dx, dz);
        if (dist < 0.05) this.walkTarget = null;
        else {
          const step = Math.min(dist, 2.6 * dt);
          if (!this.tryMove((dx / dist) * step, (dz / dist) * step)) this.walkTarget = null;
          this.updateRoom();
        }
      }
    }
    this.camera.position.set(this.pos.x, EYE_H, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  /* ——————————————— Entrées ——————————————— */
  private setNdc(e: PointerEvent | MouseEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
  }
  private pick(e: PointerEvent | MouseEvent): THREE.Intersection | undefined {
    this.setNdc(e);
    const targets: THREE.Object3D[] = [this.noteGroup, this.itemGroup, this.wallGroup, this.floorGroup];
    const hits = this.ray.intersectObjects(targets, true).filter((h) => h.object.visible && !(this.mode === "plan" && h.object.parent === this.wallGroup && h.point.y > this.clipPlane.constant + 0.01));
    return hits[0];
  }

  private onDown = (e: PointerEvent) => {
    if (this.photo) return;
    if (this.pointer && this.pointer.id !== e.pointerId) return;
    const cv = this.renderer.domElement;
    cv.focus({ preventScroll: true });
    const p = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, drag: null as "look" | "item" | null } as NonNullable<HomeEngine["pointer"]>;
    if (this.selected?.kind === "item" && !this.placingNote) {
      const h = this.pick(e), id = h?.object.userData.itemId as string | undefined;
      if (id && id === this.selected.id) {
        const o = this.itemObjs.get(id)!;
        const pt = new THREE.Vector3(); this.ray.ray.intersectPlane(this.floorPlane, pt);
        p.drag = "item"; p.itemId = id; p.offset = new THREE.Vector3(o.position.x - pt.x, 0, o.position.z - pt.z);
        if (this.orbit) this.orbit.enabled = false;
      }
    }
    if (!p.drag && this.mode === "visite") p.drag = "look";
    this.pointer = p;
    cv.setPointerCapture(e.pointerId);
  };

  private onMove = (e: PointerEvent) => {
    const p = this.pointer;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6) p.moved = true;
    if (!p.moved) return;
    if (p.drag === "look") {
      const k = e.pointerType === "touch" ? 0.006 : 0.0045;
      this.yaw += dx * k; this.pitch = Math.max(-1.2, Math.min(1.0, this.pitch + dy * k));
      this.tween = null;
    } else if (p.drag === "item" && p.itemId) {
      this.setNdc(e);
      const pt = new THREE.Vector3();
      if (this.ray.ray.intersectPlane(this.floorPlane, pt) && p.offset) {
        const o = this.itemObjs.get(p.itemId);
        if (o) { o.position.x = Math.round((pt.x + p.offset.x) * 20) / 20; o.position.z = Math.round((pt.z + p.offset.z) * 20) / 20; this.dirty = true; }
      }
    }
  };

  private onUp = (e: PointerEvent) => {
    const p = this.pointer;
    if (!p || p.id !== e.pointerId) return;
    this.pointer = null;
    if (this.orbit && this.mode === "plan") this.orbit.enabled = true;
    if (p.drag === "item" && p.itemId && p.moved) {
      const o = this.itemObjs.get(p.itemId);
      if (o) {
        const x = Math.max(-0.5, Math.min(12.5, o.position.x)), z = Math.max(-4.5, Math.min(9.5, o.position.z));
        this.ev.onItemMoved(p.itemId, x, z);
      }
      return;
    }
    if (!p.moved) this.tap(e);
  };
  private onCancel = (e: PointerEvent) => { if (this.pointer?.id === e.pointerId) this.pointer = null; if (this.orbit && this.mode === "plan") this.orbit.enabled = true; };

  private tap(e: PointerEvent) {
    const h = this.pick(e);
    const now = performance.now(), dbl = now - this.lastTap < 320; this.lastTap = now;
    if (!h) { this.select(null); return; }
    const o = h.object, ud = o.userData;
    if (this.placingNote) {
      const n = h.face ? h.face.normal.clone().transformDirection(o.matrixWorld) : new THREE.Vector3(0, 1, 0);
      const p = h.point.clone().addScaledVector(n, 0.12);
      if (p.y < 0.3) p.y = 1.3;
      const r = this.roomAt(p.x, p.z);
      this.setNotePlacement(false);
      this.ev.onNotePlaced({ x: p.x, y: Math.min(2.4, p.y), z: p.z, roomId: r?.id ?? this.currentRoom });
      return;
    }
    if (ud.pick === "note") { this.select({ kind: "note", id: ud.noteId as string }); return; }
    if (typeof ud.itemId === "string") { this.select({ kind: "item", id: ud.itemId }); return; }
    if (ud.pick === "wall") {
      const idx = h.face?.materialIndex ?? -1, rid = (ud.faceRooms as Array<string | null>)[idx];
      if (rid) this.select({ kind: "wall", roomId: rid }); else this.select(null);
      return;
    }
    if (ud.pick === "floor") {
      const rid = ud.roomId as string;
      if (this.mode === "plan") {
        if (dbl) { this.setMode("visite"); this.pos.set(h.point.x, EYE_H, h.point.z); this.updateRoom(); this.select(null); return; }
        this.currentRoom = rid; this.ev.onRoom(rid);
        this.select({ kind: "room", roomId: rid });
        return;
      }
      this.select(null, true);
      this.walkTarget = new THREE.Vector3(h.point.x, 0, h.point.z);
    }
  }

  private onWheel = (e: WheelEvent) => {
    if (this.mode !== "visite") return;
    e.preventDefault();
    const step = Math.max(-0.6, Math.min(0.6, -e.deltaY * 0.0025));
    this.tryMove(-Math.sin(this.yaw) * step, -Math.cos(this.yaw) * step);
    this.updateRoom();
  };

  private typing(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
  }
  private onKey = (e: KeyboardEvent) => {
    if (this.typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const handled = ["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"];
    if (!handled.includes(e.code)) return;
    // Les flèches ne déplacent la caméra que si la 3D a le focus (sinon elles font défiler la page normalement).
    if (e.code.startsWith("Arrow") && document.activeElement !== this.renderer.domElement) return;
    if (this.mode !== "visite") return;
    e.preventDefault();
    this.keys.add(e.code); this.tween = null;
  };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code); };
  private onBlur = () => { this.keys.clear(); this.joy = { x: 0, y: 0 }; };

  private resize() {
    this.dirty = true;
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    const cv = this.renderer.domElement;
    cv.removeEventListener("pointerdown", this.onDown); cv.removeEventListener("pointermove", this.onMove);
    cv.removeEventListener("pointerup", this.onUp); cv.removeEventListener("pointercancel", this.onCancel); cv.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKey); window.removeEventListener("keyup", this.onKeyUp); window.removeEventListener("blur", this.onBlur);
    this.orbit?.dispose();
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
    this.mats.dispose(); this.edgeMat.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
    cv.remove();
  }
}

export type { Note };
