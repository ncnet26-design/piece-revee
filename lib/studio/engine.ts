import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { load as loadGltf, variantMaterials } from "@/lib/home3d/models";
import { buildMaterial } from "@/lib/materials/three";
import { materialById } from "@/lib/materials/schema";
import { furnitureById, type Furniture } from "./library";
import type { SceneObject, StudioScene } from "./scene";

/**
 * Moteur 3D du Studio : une vraie scène three.js (pas une image aplatie), avec des objets indépendants,
 * sélectionnables au clic ou au toucher (lancer de rayon), déplaçables, orientables, remplaçables,
 * dont on change les matières. Rendu PBR : éclairage d'intérieur photographié (HDR), soleil avec ombres douces,
 * occlusion ambiante (GTAO) sur les appareils qui le permettent, contour de sélection.
 */
export type Tool = "selection" | "deplacer" | "pivoter";
export interface StudioEvents {
  onSelect(uid: string | null): void;
  onChange(scene: StudioScene): void;
  onLoading(pending: number): void;
}
export interface Slot { id: string; label: string; area: number }
interface Live { obj: SceneObject; def: Furniture; root: THREE.Group; content: THREE.Object3D | null; gltf?: GLTF; slots: Map<string, THREE.Mesh[]>; originals: Map<THREE.Mesh, THREE.Material | THREE.Material[]> }

const SLOT_NAMES: Array<[RegExp, string]> = [[/velvet|fabric|cloth|cushion|seat|uphol|tissu|textile|pillow/i, "Tissu"], [/leather|cuir/i, "Cuir"], [/wood|oak|walnut|bois|veneer/i, "Bois"], [/metal|steel|brass|chrome|iron|gold|leg/i, "Métal"], [/marble|stone|top/i, "Plateau"], [/glass|verre/i, "Verre"], [/leaf|plant|stem/i, "Feuillage"], [/pot|ceramic|clay|terra/i, "Pot"]];
const slotLabel = (name: string, i: number) => SLOT_NAMES.find(([re]) => re.test(name))?.[1] ?? `Zone ${i + 1}`;

export class StudioEngine {
  readonly renderer: THREE.WebGLRenderer;
  readonly soft: boolean;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private transform: TransformControls;
  private composer: EffectComposer | null = null;
  private outline: OutlinePass | null = null;
  private room = new THREE.Group();
  private live = new Map<string, Live>();
  private state: StudioScene;
  private selected: string | null = null;
  private tool: Tool = "selection";
  private raf = 0;
  private dirty = true;
  private disposed = false;
  private pending = 0;
  private ro: ResizeObserver;
  private down: { x: number; y: number; t: number } | null = null;
  private ray = new THREE.Raycaster();
  private floorMat: THREE.Material | null = null;

  constructor(private host: HTMLElement, scene: StudioScene, private ev: StudioEvents, private quality: "haute" | "standard" = "haute") {
    this.state = structuredClone(scene);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    const gl = this.renderer.getContext(), dbg = gl.getExtension("WEBGL_debug_renderer_info");
    this.soft = /swiftshader|llvmpipe|software/i.test(String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ""));
    if (this.soft) this.quality = "standard";
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.soft ? 1 : this.quality === "haute" ? 2 : 1.5));
    this.renderer.toneMapping = THREE.NeutralToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const cv = this.renderer.domElement;
    Object.assign(cv.style, { width: "100%", height: "100%", display: "block", touchAction: "none", outline: "none" });
    cv.setAttribute("role", "application"); cv.setAttribute("aria-label", "Scène 3D de la pièce : touchez un meuble pour le sélectionner");
    cv.tabIndex = 0;
    host.appendChild(cv);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 60);
    this.camera.position.set(1.6, 1.75, 4.6);
    this.controls = new OrbitControls(this.camera, cv);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 1.2, maxDistance: 10, maxPolarAngle: 1.5, screenSpacePanning: true });
    this.controls.target.set(-0.2, 0.7, -0.2);
    this.controls.addEventListener("change", () => { this.dirty = true; });

    this.transform = new TransformControls(this.camera, cv);
    this.transform.setSize(0.8); this.transform.showY = false; this.transform.setSpace("world");
    this.transform.addEventListener("dragging-changed", (e) => { this.controls.enabled = !(e as unknown as { value: boolean }).value; if (!(e as unknown as { value: boolean }).value) this.commitTransform(); });
    this.transform.addEventListener("objectChange", () => { this.clampSelected(); this.dirty = true; });
    this.transform.addEventListener("change", () => { this.dirty = true; });
    this.scene.add(this.transform.getHelper());

    this.setupLights();
    this.setupComposer();
    this.buildRoom();
    void this.loadEnvironment();
    void this.syncObjects();

    cv.addEventListener("pointerdown", this.onDown);
    cv.addEventListener("pointerup", this.onUp);
    cv.addEventListener("keydown", this.onKey);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host); this.resize();
    const loop = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      const moving = this.controls.update();
      if (!this.dirty && !moving && !this.transform.dragging) return;
      this.dirty = false;
      if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  /* ——— Lumière et rendu ——— */
  private sun!: THREE.DirectionalLight;
  private setupLights() {
    this.scene.background = new THREE.Color("#E9E6E0");
    const hemi = new THREE.HemisphereLight("#FFF8EE", "#B9AD9B", 0.35); this.scene.add(hemi);
    // Soleil entrant par les fenêtres du mur du fond : ombres longues et douces.
    const sun = new THREE.DirectionalLight("#FFF1DD", 2.4);
    sun.position.set(-1.8, 4.2, -5.5); sun.target.position.set(0.2, 0, 0.6);
    sun.castShadow = true;
    const sz = this.quality === "haute" ? 2048 : 1024;
    sun.shadow.mapSize.set(sz, sz); sun.shadow.radius = 6; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 14 });
    this.scene.add(sun, sun.target);
    this.sun = sun;
  }
  private setupComposer() {
    if (this.soft) return;
    const c = new EffectComposer(this.renderer);
    c.addPass(new RenderPass(this.scene, this.camera));
    if (this.quality === "haute") {
      const ao = new GTAOPass(this.scene, this.camera, 512, 512);
      ao.blendIntensity = 0.85;
      ao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1.2, scale: 1 });
      c.addPass(ao);
    }
    this.outline = new OutlinePass(new THREE.Vector2(512, 512), this.scene, this.camera);
    Object.assign(this.outline, { edgeStrength: 4, edgeGlow: 0.2, edgeThickness: 1.2, pulsePeriod: 0 });
    this.outline.visibleEdgeColor.set("#1F1A16"); this.outline.hiddenEdgeColor.set("#8A8178");
    c.addPass(this.outline);
    c.addPass(new OutputPass());
    this.composer = c;
  }
  private async loadEnvironment() {
    try {
      const { EXRLoader } = await import("three/examples/jsm/loaders/EXRLoader.js");
      const tex = await new EXRLoader().loadAsync("/3d/apartment.exr");
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const pm = new THREE.PMREMGenerator(this.renderer);
      const env = pm.fromEquirectangular(tex).texture;
      pm.dispose(); tex.dispose();
      if (this.disposed) { env.dispose(); return; }
      this.scene.environment = env; this.scene.environmentIntensity = 0.75;
      this.dirty = true;
    } catch { /* éclairage direct seul */ }
  }
  private resize() {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    // Sur un écran étroit, on recule pour voir toute la pièce.
    this.camera.fov = w / h < 0.8 ? 58 : 42;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  /* ——— La pièce ——— */
  private buildRoom() {
    this.room.clear();
    const { w, d, h, wall } = this.state.room;
    const floorGeo = new THREE.PlaneGeometry(w, d); floorGeo.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: "#B08A60", roughness: 0.6 }));
    floor.receiveShadow = true; floor.userData.room = "sol"; floor.name = "sol";
    this.room.add(floor);
    const fm = materialById(this.state.room.floor);
    if (fm) void buildMaterial(fm, { metersPerUv: w, light: this.quality !== "haute", anisotropy: this.renderer.capabilities.getMaxAnisotropy() }).then((m) => {
      // UV du plan : 0..1 sur la largeur → répétition à l'échelle réelle.
      [m.map, m.normalMap, m.roughnessMap].forEach((t) => t?.repeat.set(w / fm.tileMeters, d / fm.tileMeters));
      this.floorMat?.dispose(); this.floorMat = m; floor.material = m; this.dirty = true;
    });
    const wallMat = new THREE.MeshStandardMaterial({ color: wall, roughness: 0.92 });
    wallMat.name = "mur";
    const mkWall = (len: number, pos: THREE.Vector3, rotY: number) => {
      const g = new THREE.PlaneGeometry(len, h); const m = new THREE.Mesh(g, wallMat);
      m.position.copy(pos); m.rotation.y = rotY; m.receiveShadow = true; m.userData.room = "mur"; this.room.add(m);
      // Plinthe et corniche moulurée.
      const base = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.018), new THREE.MeshStandardMaterial({ color: "#F4F1EA", roughness: 0.6 }));
      base.position.set(0, -h / 2 + 0.06, 0.009); m.add(base);
      const crown = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.05), new THREE.MeshStandardMaterial({ color: "#F4F1EA", roughness: 0.7 }));
      crown.position.set(0, h / 2 - 0.045, 0.025); m.add(crown);
      return m;
    };
    const back = mkWall(w, new THREE.Vector3(0, h / 2, -d / 2), 0);
    mkWall(w, new THREE.Vector3(0, h / 2, d / 2), Math.PI);
    mkWall(d, new THREE.Vector3(-w / 2, h / 2, 0), Math.PI / 2);
    mkWall(d, new THREE.Vector3(w / 2, h / 2, 0), -Math.PI / 2);
    // Deux grandes portes-fenêtres sur le mur du fond (lumière du jour).
    const glass = new THREE.MeshBasicMaterial({ color: new THREE.Color("#EAF1F6").multiplyScalar(1.35) });
    const frameMat = new THREE.MeshStandardMaterial({ color: "#F6F4EF", roughness: 0.5 });
    for (const x of [-1.25, 1.05]) {
      const win = new THREE.Group(); win.position.set(x, -h / 2 + 1.25, 0.004);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 2.3), glass); win.add(pane);
      const bars: Array<[number, number, number, number]> = [[0, 1.17, 1.15, 0.06], [0, -1.17, 1.15, 0.06], [-0.55, 0, 0.06, 2.4], [0.55, 0, 0.06, 2.4], [0, 0, 0.035, 2.3], [0, 0.35, 1.05, 0.03]];
      for (const [bx, by, bw, bh] of bars) { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.05), frameMat); b.position.set(bx, by, 0.02); b.castShadow = true; win.add(b); }
      back.add(win);
    }
    // Plafond, visible seulement de l'intérieur (vue en coupe quand la caméra est au-dessus).
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: "#F7F5F0", roughness: 0.95 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = h; this.room.add(ceil);
    this.room.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.userData.room !== "sol") m.raycast = () => {}; });
    floor.raycast = () => {};
    this.scene.add(this.room);
  }
  setWallColor(hex: string) {
    this.state.room.wall = hex;
    this.room.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && (m.material as THREE.Material).name === "mur") (m.material as THREE.MeshStandardMaterial).color.set(hex); });
    this.dirty = true; this.emit();
  }
  setFloor(materialId: string) { this.state.room.floor = materialId; this.scene.remove(this.room); this.buildRoom(); this.emit(); }

  /* ——— Objets ——— */
  private async syncObjects() {
    const want = new Set(this.state.objects.map((o) => o.uid));
    for (const [uid, l] of this.live) if (!want.has(uid)) { l.root.parent?.remove(l.root); this.live.delete(uid); }
    // Parents d'abord : les objets fixés s'accrochent à leur support.
    const sorted = [...this.state.objects].sort((a, b) => Number(Boolean(a.parent)) - Number(Boolean(b.parent)));
    await Promise.all(sorted.filter((o) => !o.parent).map((o) => this.ensure(o)));
    await Promise.all(sorted.filter((o) => o.parent).map((o) => this.ensure(o)));
  }
  private async ensure(o: SceneObject) {
    const def = furnitureById(o.furnitureId);
    if (!def) return;
    let l = this.live.get(o.uid);
    if (!l) {
      const root = new THREE.Group(); root.userData.uid = o.uid; root.name = o.uid;
      l = { obj: o, def, root, content: null, slots: new Map(), originals: new Map() };
      this.live.set(o.uid, l);
      const parent = o.parent ? this.live.get(o.parent)?.root : null;
      (parent ?? this.scene).add(root);
    }
    l.obj = o; l.def = def;
    l.root.position.set(o.x, o.y, o.z); l.root.rotation.set(0, o.rotY, 0);
    this.pending++; this.ev.onLoading(this.pending);
    try {
      const content = def.kind === "procedural" ? await this.procedural(def) : await this.glb(def, l, o.variant);
      if (this.disposed) return;
      if (l.content) { l.root.remove(l.content); }
      l.content = content; l.root.add(content);
      l.slots.clear(); l.originals.clear();
      const byMat = new Map<string, THREE.Mesh[]>();
      content.traverse((x) => {
        const m = x as THREE.Mesh; if (!m.isMesh) return;
        m.castShadow = true; m.receiveShadow = true; m.userData.uid = o.uid;
        l!.originals.set(m, m.material);
        const key = (Array.isArray(m.material) ? m.material[0] : m.material)?.name || "matiere";
        byMat.set(key, [...(byMat.get(key) ?? []), m]);
      });
      l.slots = byMat;
      for (const [slot, mid] of Object.entries(o.materials ?? {})) await this.applyMaterial(l, slot, mid);
      for (const [slot, hex] of Object.entries(o.colors ?? {})) this.applyColor(l, slot, hex);
    } catch { /* modèle indisponible : l'objet reste vide mais garde sa place */ }
    finally { this.pending--; this.ev.onLoading(this.pending); this.dirty = true; }
  }
  private async glb(def: Furniture, l: Live, variant?: string): Promise<THREE.Object3D> {
    const gltf = await loadGltf(def.file!);
    l.gltf = gltf;
    const clone = gltf.scene.clone(true);
    const names = this.variantNames(gltf);
    const v = variant && names.includes(variant) ? variant : undefined;
    if (v) {
      const mats = await variantMaterials(def.file!, gltf, v);
      let i = 0;
      clone.traverse((x) => { const m = x as THREE.Mesh; if (!m.isMesh) return; const mat = mats.get(i++); if (mat) m.material = mat; });
    }
    // Lumières embarquées dans certains fichiers : retirées (l'éclairage est celui de la pièce).
    clone.traverse((x) => { if ((x as THREE.Light).isLight) x.visible = false; });
    const box = new THREE.Box3().setFromObject(clone);
    clone.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    const g = new THREE.Group(); g.add(clone);
    return g;
  }
  private variantNames(gltf: GLTF): string[] {
    const ext = (gltf.parser.json as { extensions?: { KHR_materials_variants?: { variants: Array<{ name: string }> } } }).extensions?.KHR_materials_variants;
    return ext?.variants.map((v) => v.name) ?? [];
  }
  /** Objets calculés : lampadaire globe, poignée moletée, tapis. */
  private async procedural(def: Furniture): Promise<THREE.Object3D> {
    const g = new THREE.Group();
    const light = this.quality !== "haute", aniso = this.renderer.capabilities.getMaxAnisotropy();
    const brass = await buildMaterial(materialById("laiton-brosse")!, { metersPerUv: 0.2, light, anisotropy: aniso });
    brass.name = "Métal";
    if (def.model === "proc:lampadaire") {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.025, 64), brass); base.position.y = 0.0125;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.08, 24), brass); stem.position.y = 0.565;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 24), brass); arm.rotation.z = Math.PI / 2; arm.position.set(0.07, 1.1, 0);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.04, 32), brass); cup.position.set(0.14, 1.12, 0);
      const opal = new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.35, transmission: 0.25, thickness: 0.01, emissive: new THREE.Color("#FFE7C4"), emissiveIntensity: 1.6 });
      opal.name = "Verre";
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.15, 64, 48), opal); globe.position.set(0.14, 1.27, 0); globe.castShadow = false;
      const bulb = new THREE.PointLight("#FFD9A8", 1.4, 3.5, 2); bulb.position.copy(globe.position);
      g.add(base, stem, arm, cup, globe, bulb);
    } else if (def.model === "proc:poignee") {
      // Barre moletée : relief en losanges calculé, deux plots de fixation. Orientée le long de x, face avant vers +z.
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 32, 1), brass); bar.rotation.z = Math.PI / 2; bar.position.set(0, 0, 0.03);
      const knurl = await buildMaterial({ ...materialById("laiton-brosse")!, pbr: { ...materialById("laiton-brosse")!.pbr, roughness: 0.38, normalScale: 0.9 } }, { metersPerUv: 0.02, light, anisotropy: aniso });
      knurl.name = "Métal"; bar.material = knurl;
      for (const x of [-0.08, 0.08]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.03, 20), brass); post.rotation.x = Math.PI / 2; post.position.set(x, 0, 0.015); g.add(post); }
      g.add(bar);
    } else if (def.model === "proc:tapis") {
      const wool = new THREE.MeshPhysicalMaterial({ color: "#E6DCCB", roughness: 0.95, sheen: 0.6, sheenRoughness: 0.8, sheenColor: new THREE.Color("#ffffff") });
      wool.name = "Tissu";
      const loader = new THREE.TextureLoader();
      const [map, nor] = await Promise.all([loader.loadAsync("/textures/tx-laine/diff.webp").catch(() => null), loader.loadAsync("/textures/tx-laine/nor.webp").catch(() => null)]);
      for (const t of [map, nor]) if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3); t.anisotropy = aniso; }
      if (map) { map.colorSpace = THREE.SRGBColorSpace; wool.map = map; wool.color.set("#F2E8D8"); }
      if (nor) { wool.normalMap = nor; wool.normalScale.set(1.2, 1.2); }
      const rug = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.012, 1.7, 1, 1, 1), wool); rug.position.y = 0.006;
      g.add(rug);
    }
    return g;
  }

  /* ——— Matières, couleurs, variantes ——— */
  slots(uid: string): Slot[] {
    const l = this.live.get(uid); if (!l) return [];
    return [...l.slots.entries()].map(([id, meshes], i) => ({ id, label: slotLabel(id, i), area: meshes.reduce((s, m) => { const b = new THREE.Box3().setFromObject(m), v = b.getSize(new THREE.Vector3()); return s + v.x * v.y + v.y * v.z + v.x * v.z; }, 0) }))
      .sort((a, b) => b.area - a.area).slice(0, 5);
  }
  variants(uid: string): string[] { const l = this.live.get(uid); return l?.gltf ? this.variantNames(l.gltf) : []; }
  private async applyMaterial(l: Live, slot: string, materialId: string) {
    const meshes = l.slots.get(slot); const m = materialById(materialId);
    if (!meshes || !m) return;
    const size = new THREE.Box3().setFromObject(l.root).getSize(new THREE.Vector3());
    const mat = await buildMaterial(m, { metersPerUv: Math.max(0.3, Math.max(size.x, size.z)), light: this.quality !== "haute", anisotropy: this.renderer.capabilities.getMaxAnisotropy() });
    mat.name = slot;
    meshes.forEach((x) => { x.material = mat; });
    this.dirty = true;
  }
  private applyColor(l: Live, slot: string, hex: string) {
    l.slots.get(slot)?.forEach((x) => {
      const src = Array.isArray(x.material) ? x.material[0]! : x.material;
      const c = src.clone() as THREE.MeshStandardMaterial; c.name = slot;
      if ("color" in c) { c.color.set(hex); if (c.map) c.color.multiplyScalar(1.6); }
      x.material = c;
    });
    this.dirty = true;
  }
  async setMaterial(uid: string, slot: string, materialId: string | null) {
    const l = this.live.get(uid); if (!l) return;
    const o = this.find(uid)!;
    o.materials = { ...(o.materials ?? {}) }; o.colors = { ...(o.colors ?? {}) };
    delete o.colors[slot];
    if (materialId) { o.materials[slot] = materialId; await this.applyMaterial(l, slot, materialId); }
    else { delete o.materials[slot]; l.slots.get(slot)?.forEach((x) => { x.material = l.originals.get(x) ?? x.material; }); this.dirty = true; }
    this.emit();
  }
  setColor(uid: string, slot: string, hex: string) {
    const l = this.live.get(uid); if (!l) return;
    const o = this.find(uid)!;
    o.colors = { ...(o.colors ?? {}), [slot]: hex }; o.materials = { ...(o.materials ?? {}) }; delete o.materials[slot];
    l.slots.get(slot)?.forEach((x) => { x.material = l.originals.get(x) ?? x.material; });
    this.applyColor(l, slot, hex); this.emit();
  }
  async setVariant(uid: string, variant: string) {
    const o = this.find(uid); if (!o) return;
    o.variant = variant; o.materials = {}; o.colors = {};
    await this.ensure(o); this.refreshOutline(); this.emit();
  }
  /** Remplace le modèle en gardant l'identifiant, la position et l'orientation. */
  async replace(uid: string, furnitureId: string) {
    const o = this.find(uid); if (!o || !furnitureById(furnitureId)) return;
    o.furnitureId = furnitureId; o.variant = undefined; o.materials = {}; o.colors = {};
    await this.ensure(o); this.refreshOutline(); this.emit();
  }
  remove(uid: string) {
    this.state.objects = this.state.objects.filter((o) => o.uid !== uid && o.parent !== uid);
    if (this.selected === uid) this.select(null);
    void this.syncObjects(); this.emit();
  }

  /* ——— Sélection et manipulation ——— */
  select(uid: string | null) {
    this.selected = uid && this.live.has(uid) ? uid : null;
    this.refreshOutline();
    this.attachTool();
    this.ev.onSelect(this.selected);
    this.dirty = true;
  }
  /** Cadre la caméra sur l'objet choisi (depuis la liste des objets). */
  focus(uid: string) {
    const l = this.live.get(uid); if (!l) return;
    const c = new THREE.Box3().setFromObject(l.root).getCenter(new THREE.Vector3());
    this.controls.target.lerp(c, 0.6); this.dirty = true;
  }
  private refreshOutline() { if (this.outline) this.outline.selectedObjects = this.selected ? [this.live.get(this.selected)!.root] : []; }
  setTool(t: Tool) { this.tool = t; this.attachTool(); }
  private attachTool() {
    const l = this.selected ? this.live.get(this.selected) : null;
    if (!l || this.tool === "selection" || l.obj.parent) { this.transform.detach(); this.dirty = true; return; }
    this.transform.attach(l.root);
    this.transform.setMode(this.tool === "deplacer" ? "translate" : "rotate");
    this.transform.showX = this.tool === "deplacer"; this.transform.showZ = this.tool === "deplacer"; this.transform.showY = this.tool === "pivoter";
    this.dirty = true;
  }
  private clampSelected() {
    const l = this.selected ? this.live.get(this.selected) : null; if (!l) return;
    const { w, d } = this.state.room, r = l.root;
    const half = l.def.dims ? Math.max(l.def.dims.w, l.def.dims.d) / 2 * 0.6 : 0.2;
    r.position.x = Math.max(-w / 2 + half, Math.min(w / 2 - half, r.position.x));
    r.position.z = Math.max(-d / 2 + half, Math.min(d / 2 - half, r.position.z));
    r.position.y = l.obj.y;
    r.rotation.x = 0; r.rotation.z = 0;
  }
  private commitTransform() {
    const l = this.selected ? this.live.get(this.selected) : null; if (!l) return;
    const o = this.find(l.obj.uid)!;
    o.x = Math.round(l.root.position.x * 100) / 100; o.z = Math.round(l.root.position.z * 100) / 100;
    o.rotY = Math.round(l.root.rotation.y * 1000) / 1000;
    this.emit();
  }
  /** Rotation par pas de 15° (boutons ou touche R). */
  rotateSelected(deg: number) {
    const l = this.selected ? this.live.get(this.selected) : null; if (!l || l.obj.parent) return;
    l.root.rotation.y += (deg * Math.PI) / 180; this.commitTransform(); this.dirty = true;
  }
  /** Déplacement fin au clavier (flèches), 5 cm. */
  nudge(dx: number, dz: number) {
    const l = this.selected ? this.live.get(this.selected) : null; if (!l || l.obj.parent) return;
    l.root.position.x += dx; l.root.position.z += dz; this.clampSelected(); this.commitTransform(); this.dirty = true;
  }
  private onKey = (e: KeyboardEvent) => {
    if (!this.selected) return;
    const k: Record<string, () => void> = { ArrowLeft: () => this.nudge(-0.05, 0), ArrowRight: () => this.nudge(0.05, 0), ArrowUp: () => this.nudge(0, -0.05), ArrowDown: () => this.nudge(0, 0.05), r: () => this.rotateSelected(15), R: () => this.rotateSelected(-15), Escape: () => this.select(null) };
    const f = k[e.key]; if (f) { e.preventDefault(); f(); }
  };
  private onDown = (e: PointerEvent) => { this.down = { x: e.clientX, y: e.clientY, t: performance.now() }; };
  private onUp = (e: PointerEvent) => {
    const d = this.down; this.down = null;
    if (!d || this.transform.dragging) return;
    // Un clic ou un toucher bref, pas une rotation de caméra.
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 600) return;
    const uid = this.pick(e.clientX, e.clientY);
    if (uid !== undefined) this.select(uid);
  };
  /** Objet sous le point de l'écran (null : vide). */
  pick(clientX: number, clientY: number): string | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), this.camera);
    const roots = [...this.live.values()].map((l) => l.root);
    const hit = this.ray.intersectObjects(roots, true).find((h) => (h.object as THREE.Mesh).isMesh && h.object.visible);
    let o: THREE.Object3D | null = hit?.object ?? null;
    while (o && !o.userData.uid) o = o.parent;
    // L'objet le plus précis : la poignée plutôt que le buffet qui la porte.
    return (hit?.object.userData.uid as string | undefined) ?? (o?.userData.uid as string | undefined) ?? null;
  }
  /** Position écran d'un objet (tests automatiques et bulles d'aide). */
  screenPosition(uid: string): { x: number; y: number } | null {
    const l = this.live.get(uid); if (!l) return null;
    const c = new THREE.Box3().setFromObject(l.root).getCenter(new THREE.Vector3()).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (c.x + 1) / 2 * r.width, y: r.top + (1 - c.y) / 2 * r.height };
  }
  /** Dimensions réelles (cm) de l'objet tel qu'il est dans la scène. */
  dimensions(uid: string): { w: number; d: number; h: number } | null {
    const l = this.live.get(uid); if (!l?.content) return null;
    const s = new THREE.Box3().setFromObject(l.content).getSize(new THREE.Vector3());
    return { w: Math.round(s.x * 100), d: Math.round(s.z * 100), h: Math.round(s.y * 100) };
  }

  /* ——— État ——— */
  private find(uid: string) { return this.state.objects.find((o) => o.uid === uid); }
  private emit() { this.ev.onChange(structuredClone(this.state)); }
  get sceneState(): StudioScene { return structuredClone(this.state); }
  async load(scene: StudioScene) {
    this.select(null);
    for (const l of this.live.values()) l.root.parent?.remove(l.root);
    this.live.clear();
    this.state = structuredClone(scene);
    this.scene.remove(this.room); this.buildRoom();
    await this.syncObjects(); this.emit();
  }
  get loading() { return this.pending; }
  /** Image de la vue actuelle, sans contour de sélection (pour le rendu photoréaliste par IA). */
  capture(maxSide = 1600): string {
    const keep = this.outline?.selectedObjects ?? []; if (this.outline) this.outline.selectedObjects = [];
    const helper = this.transform.getHelper(); const vis = helper.visible; helper.visible = false;
    if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
    const src = this.renderer.domElement, k = Math.min(1, maxSide / Math.max(src.width, src.height));
    const c = document.createElement("canvas"); c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
    c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
    if (this.outline) this.outline.selectedObjects = keep; helper.visible = vis; this.dirty = true;
    return c.toDataURL("image/jpeg", 0.9);
  }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf); this.ro.disconnect();
    const cv = this.renderer.domElement;
    cv.removeEventListener("pointerdown", this.onDown); cv.removeEventListener("pointerup", this.onUp); cv.removeEventListener("keydown", this.onKey);
    this.transform.dispose(); this.controls.dispose(); this.composer?.dispose();
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry?.dispose(); });
    this.scene.environment?.dispose(); this.renderer.dispose(); cv.remove();
  }
}
