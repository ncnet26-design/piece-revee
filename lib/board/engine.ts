import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { materialById } from "@/content/lookup";
import { paintMaterial, shade } from "@/lib/draw";
import { realTexture, textureUrl } from "@/lib/textures";
import { normalFrom } from "@/lib/home3d/normal";
import { instantiate } from "@/lib/home3d/models";
import { libModel } from "@/lib/home3d/library";
import { BOARD_D, BOARD_W, type Board, type BoardItem } from "./state";

export interface BoardEvents {
  onSelect(id: string | null): void;
  onMove(id: string, x: number, z: number): void;
  onDropAt(x: number, z: number): void;
}
export type View = "dessus" | "perspective";

/** Dimensions de base (m) de chaque forme d'échantillon, avant l'échelle choisie. */
const SIZE = { carre: 0.2, rond: 0.085, lameL: 0.4, lameW: 0.095, drape: 0.25, chipW: 0.11, chipD: 0.16, objet: 0.22, photo: 0.24 };
const THICK: Record<string, number> = { Pierre: 0.014, Terre: 0.011, Bois: 0.016, Composite: 0.01, Extérieur: 0.016, Métal: 0.004, Verre: 0.008, Fibre: 0.004, Textile: 0.004 };
const TINT = new Set(["weave", "boucle", "cord", "leather", "raffia", "cane", "plaster"]);
const ROUGH: Record<string, number> = { Pierre: 0.35, Terre: 0.6, Bois: 0.6, Fibre: 0.9, Textile: 0.95, Métal: 0.32, Verre: 0.06, Composite: 0.45, Extérieur: 0.75 };

/** Tissu : un carré souple qui retombe en plis doux, avec un léger bord relevé. */
function drapeGeometry(size: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(size, size, 56, 56);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / size, z = p.getZ(i) / size;
    const fold = Math.max(0, Math.sin((x + 0.15) * Math.PI * 2.2)) * 0.014 * (0.6 + z);
    const curl = Math.max(0, x + z - 0.45) ** 2 * 0.16;
    p.setY(i, 0.002 + fold + curl + Math.sin(z * 9 + x * 3) * 0.0022);
  }
  g.computeVertexNormals();
  return g;
}

export class BoardEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1.5, 0.05, 20);
  private root = new THREE.Group();
  private ground: THREE.Mesh;
  private sun: THREE.DirectionalLight;
  private objects = new Map<string, { key: string; obj: THREE.Object3D; h: number }>();
  private texLoader = new THREE.TextureLoader();
  private texCache = new Map<string, Promise<THREE.Texture>>();
  private matCache = new Map<string, THREE.Material>();
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private drag: { id: string; dx: number; dz: number; moved: boolean } | null = null;
  private selected: string | null = null;
  private selRing: THREE.Mesh;
  private dirty = true;
  private raf = 0;
  private items: BoardItem[] = [];
  private bg = "";
  private view: View = "perspective";
  private zoom = 1;
  private disposed = false;
  private ro: ResizeObserver;
  readonly software: boolean;

  constructor(private host: HTMLElement, private events: BoardEvents) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    const gl = this.renderer.getContext(), dbg = gl.getExtension("WEBGL_debug_renderer_info");
    this.software = /swiftshader|llvmpipe|software|basic render/i.test(String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ""));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.software ? 1 : 2));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const cv = this.renderer.domElement;
    cv.style.display = "block"; cv.style.width = "100%"; cv.style.height = "100%"; cv.style.touchAction = "none";
    cv.setAttribute("aria-label", "Planche de matières en 3D : faites glisser les échantillons pour les déplacer");
    cv.setAttribute("role", "img");
    host.appendChild(cv);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(room, 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    room.dispose(); pmrem.dispose();

    // Lumière d'atelier : une grande fenêtre en haut à gauche, ombres douces.
    this.sun = new THREE.DirectionalLight("#FFF6EA", 2.4);
    this.sun.position.set(-0.9, 2.2, -0.7);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera; sc.left = -0.8; sc.right = 0.8; sc.top = 0.6; sc.bottom = -0.6; sc.near = 0.5; sc.far = 4;
    this.sun.shadow.mapSize.set(this.software ? 1024 : 2048, this.software ? 1024 : 2048);
    this.sun.shadow.radius = 6; this.sun.shadow.blurSamples = 16; this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.002;
    this.scene.add(this.sun, new THREE.HemisphereLight("#FFFFFF", "#D9D2C4", 0.5));

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(BOARD_W * 3, BOARD_D * 3), new THREE.MeshStandardMaterial({ color: "#EFEBE3", roughness: 0.95 }));
    this.ground.rotation.x = -Math.PI / 2; this.ground.receiveShadow = true;
    this.scene.add(this.ground, this.root);

    this.selRing = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 64), new THREE.MeshBasicMaterial({ color: "#7B5831", transparent: true, opacity: 0.9, depthTest: false }));
    this.selRing.rotation.x = -Math.PI / 2; this.selRing.visible = false; this.selRing.renderOrder = 10;
    this.scene.add(this.selRing);

    cv.addEventListener("pointerdown", this.onDown);
    cv.addEventListener("pointermove", this.onMoveEv);
    cv.addEventListener("pointerup", this.onUp);
    cv.addEventListener("pointercancel", this.onUp);
    cv.addEventListener("dragover", (e) => e.preventDefault());
    cv.addEventListener("drop", this.onDrop);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
    this.resize();
    const loop = () => { this.raf = requestAnimationFrame(loop); if (this.dirty) { this.dirty = false; this.renderer.render(this.scene, this.camera); } };
    loop();
  }

  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf); this.ro.disconnect();
    this.renderer.dispose(); this.renderer.domElement.remove();
  }

  private resize() {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.placeCamera();
  }
  private placeCamera() {
    // Cadre la planche entière quel que soit le format de l'écran.
    const fit = Math.max(BOARD_W / this.camera.aspect, BOARD_D) * 0.5 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const d = fit * 0.94 / this.zoom;
    if (this.view === "dessus") { this.camera.position.set(0, d, 0.0001); this.camera.lookAt(0, 0, 0); }
    else { const a = THREE.MathUtils.degToRad(52); this.camera.position.set(0, Math.sin(a) * d * 1.08, Math.cos(a) * d * 1.08); this.camera.lookAt(0, 0, 0.03); }
    this.camera.updateProjectionMatrix(); this.dirty = true;
  }
  setView(v: View) { this.view = v; this.placeCamera(); }
  setZoom(z: number) { this.zoom = Math.min(2.5, Math.max(0.8, z)); this.placeCamera(); }

  /* ——— Matériaux ——— */
  private tex(url: string, color: boolean): Promise<THREE.Texture> {
    let p = this.texCache.get(url);
    if (!p) {
      p = this.texLoader.loadAsync(url).then((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = this.renderer.capabilities.getMaxAnisotropy(); t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; });
      this.texCache.set(url, p);
    }
    return p;
  }
  /** Matériau photographié (couleur, relief, rugosité) ou, à défaut, motif dessiné avec relief calculé. */
  private material(ref: string, repeat: number): THREE.Material {
    const key = `${ref}|${repeat.toFixed(2)}`;
    const cached = this.matCache.get(key); if (cached) return cached;
    let mat: THREE.MeshPhysicalMaterial;
    if (ref.startsWith("#")) {
      mat = new THREE.MeshPhysicalMaterial({ color: ref, roughness: 0.82, clearcoat: 0.05 });
    } else {
      const m = materialById.get(ref);
      const fabric = m?.family === "Textile" || m?.family === "Fibre";
      mat = new THREE.MeshPhysicalMaterial({
        color: "#ffffff", roughness: m ? ROUGH[m.family] ?? 0.6 : 0.6, metalness: m?.family === "Métal" ? 0.85 : 0,
        ...(fabric ? { sheen: m?.texture === "cord" ? 1 : 0.5, sheenRoughness: 0.5, sheenColor: new THREE.Color(shade(m!.colors[0], 40)) } : {}),
        ...(m?.texture === "lacquer" || m?.family === "Verre" ? { clearcoat: 1, clearcoatRoughness: 0.08 } : {}),
        ...(m?.family === "Verre" ? { transmission: 0.6, thickness: 0.01, roughness: 0.15 } : {}),
      });
      if (m) {
        const cv = document.createElement("canvas"); cv.width = cv.height = 512;
        paintMaterial(cv, m.texture, m.colors, ref);
        // Tissus et fibres : la photo donne la trame, la couleur reste celle de la matière (comme dans les fiches).
        const tint = TINT.has(m.texture) ? m.colors[0] : undefined;
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
        mat.map = t;
        if (!this.software) { const n = normalFrom(cv, 1.6); n.repeat.set(repeat, repeat); mat.normalMap = n; }
        if (realTexture(ref)) {
          const maps = (this.software ? ["diff"] : ["diff", "nor", "rough"]) as Array<"diff" | "nor" | "rough">;
          for (const map of maps) {
            void this.tex(textureUrl(ref, map), map === "diff").then((src) => {
              const t2 = src.clone(); t2.repeat.set(repeat, repeat); t2.needsUpdate = true;
              if (map === "diff") {
                if (tint) {
                  // Trame photographiée en niveaux de gris, teintée dans la couleur de la matière.
                  const img = src.image as HTMLImageElement, c2 = document.createElement("canvas"); c2.width = img.width; c2.height = img.height;
                  const x = c2.getContext("2d")!; x.filter = "grayscale(1) contrast(1.15) brightness(1.35)"; x.drawImage(img, 0, 0);
                  const gt = new THREE.CanvasTexture(c2); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.colorSpace = THREE.SRGBColorSpace; gt.repeat.set(repeat, repeat); gt.anisotropy = t2.anisotropy;
                  mat.map = gt; mat.color.set(tint);
                } else mat.map = t2;
              }
              else if (map === "nor") { mat.normalMap = t2; mat.normalScale.set(1.2, 1.2); }
              else { mat.roughnessMap = t2; mat.roughness = 1; }
              mat.needsUpdate = true; this.dirty = true;
            }).catch(() => { /* on garde le motif dessiné */ });
          }
        }
      }
    }
    this.matCache.set(key, mat);
    return mat;
  }
  private edge(ref: string): THREE.Material {
    // Tranche de l'échantillon : même matière, plus sombre (comme une coupe réelle).
    const m = materialById.get(ref);
    const c = ref.startsWith("#") ? "#F4F1EA" : shade(m?.colors[1] ?? "#bbbbbb", -6);
    return this.matCache.get(`edge|${c}`) ?? (() => { const e = new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }); this.matCache.set(`edge|${c}`, e); return e; })();
  }

  /* ——— Construction des éléments ——— */
  private async build(it: BoardItem, uploads: Map<string, string>): Promise<{ obj: THREE.Object3D; h: number }> {
    const g = new THREE.Group();
    const m = materialById.get(it.ref);
    const cast = (o: THREE.Object3D) => o.traverse((c) => { const mesh = c as THREE.Mesh; if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; } });
    if (it.shape === "objet") {
      const lm = libModel(it.ref);
      const model = await instantiate("objet", it.ref);
      const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
      const k = SIZE.objet / Math.max(size.x, size.z, size.y * 0.8, 0.01);
      model.scale.setScalar(k); cast(model); g.add(model);
      return { obj: g, h: (lm?.dims?.h ?? size.y) * k };
    }
    if (it.shape === "photo") {
      const url = uploads.get(it.ref);
      const t = url ? await this.tex(url, true) : null;
      const ar = t ? (t.image as HTMLImageElement).width / (t.image as HTMLImageElement).height : 1.33;
      const w = SIZE.photo, d = w / ar, b = 0.008;
      const paper = new THREE.Mesh(new THREE.BoxGeometry(w + b * 2, 0.0015, d + b * 2), new THREE.MeshStandardMaterial({ color: "#FBFAF7", roughness: 0.6 }));
      paper.position.y = 0.00075;
      const img = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.45 }));
      img.rotation.x = -Math.PI / 2; img.position.y = 0.0016;
      g.add(paper, img); cast(g);
      return { obj: g, h: 0.002 };
    }
    if (it.shape === "nuancier") {
      // Nuancier de peinture : carte épaisse, aplat de couleur, bande blanche en bas.
      const card = new THREE.Mesh(new RoundedBoxGeometry(SIZE.chipW, 0.002, SIZE.chipD, 2, 0.001), new THREE.MeshStandardMaterial({ color: "#FAF8F3", roughness: 0.7 }));
      card.position.y = 0.001;
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(SIZE.chipW - 0.008, SIZE.chipD * 0.72), this.material(it.ref, 1));
      sw.rotation.x = -Math.PI / 2; sw.position.set(0, 0.00205, -SIZE.chipD * 0.1);
      g.add(card, sw); cast(g);
      return { obj: g, h: 0.0022 };
    }
    if (it.shape === "drape") {
      const geo = drapeGeometry(SIZE.drape);
      const mesh = new THREE.Mesh(geo, this.material(it.ref, 0.35));
      (mesh.material as THREE.MeshPhysicalMaterial).side = THREE.DoubleSide;
      g.add(mesh); cast(g);
      return { obj: g, h: 0.008 };
    }
    const t = m ? THICK[m.family] ?? 0.012 : 0.01;
    const repeat = it.shape === "lame" ? 0.3 : 0.4;
    if (it.shape === "rond") {
      const geo = new THREE.CylinderGeometry(SIZE.rond, SIZE.rond, t, 64, 1);
      const mesh = new THREE.Mesh(geo, [this.edge(it.ref), this.material(it.ref, repeat * 0.9), this.edge(it.ref)]);
      mesh.position.y = t / 2; g.add(mesh); cast(g);
      return { obj: g, h: t };
    }
    const [w, d] = it.shape === "lame" ? [SIZE.lameL, SIZE.lameW] : [SIZE.carre, SIZE.carre];
    const geo = new RoundedBoxGeometry(w, t, d, 3, Math.min(0.0025, t / 3));
    // Coordonnées de texture du dessus proportionnelles aux dimensions réelles (pas de veinage étiré sur les lames).
    const uv = geo.attributes.uv as THREE.BufferAttribute, pos = geo.attributes.position as THREE.BufferAttribute, nrm = geo.attributes.normal as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) if (nrm.getY(i) > 0.5) uv.setXY(i, (pos.getX(i) + w / 2) / 0.2, (pos.getZ(i) + d / 2) / 0.2);
    const mesh = new THREE.Mesh(geo, this.material(it.ref, repeat));
    mesh.position.y = t / 2; g.add(mesh); cast(g);
    return { obj: g, h: t };
  }

  /** Met la scène en accord avec la planche (seuls les éléments modifiés sont reconstruits). */
  async sync(b: Board, uploads: Map<string, string>) {
    this.items = b.items;
    if (b.bg !== this.bg) {
      this.bg = b.bg;
      const gm = this.ground.material as THREE.MeshStandardMaterial;
      if (b.bg.startsWith("#")) { gm.map = null; gm.normalMap = null; gm.roughnessMap = null; gm.color.set(b.bg); gm.roughness = 0.95; gm.needsUpdate = true; }
      else { this.ground.material = this.material(b.bg, 1.2); }
      this.dirty = true;
    }
    const keep = new Set(b.items.map((i) => i.id));
    for (const [id, o] of this.objects) if (!keep.has(id)) { this.root.remove(o.obj); this.objects.delete(id); }
    await Promise.all(b.items.map(async (it) => {
      const key = `${it.ref}|${it.shape}`;
      const cur = this.objects.get(it.id);
      if (cur && cur.key === key) return;
      try {
        const built = await this.build(it, uploads);
        if (this.disposed) return;
        const old = this.objects.get(it.id); if (old) this.root.remove(old.obj);
        built.obj.userData.itemId = it.id;
        this.objects.set(it.id, { key, obj: built.obj, h: built.h });
        this.root.add(built.obj);
      } catch { /* modèle indisponible : l'élément est ignoré à l'affichage */ }
    }));
    this.layout();
  }

  /** Empile les échantillons comme sur une vraie table : un élément posé sur un autre repose sur sa tranche. */
  private layout() {
    const placed: Array<{ box: THREE.Box3; top: number }> = [];
    for (const it of this.items) {
      const o = this.objects.get(it.id); if (!o) continue;
      o.obj.position.set(it.x, 0, it.z);
      o.obj.rotation.y = THREE.MathUtils.degToRad(-it.rot);
      o.obj.scale.setScalar(it.s);
      o.obj.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(o.obj); box.expandByScalar(-0.004);
      let y = 0;
      for (const p of placed) if (p.box.min.x < box.max.x && p.box.max.x > box.min.x && p.box.min.z < box.max.z && p.box.max.z > box.min.z) y = Math.max(y, p.top);
      if (this.drag?.id === it.id) y += 0.012;
      o.obj.position.y = y;
      placed.push({ box, top: y + (o.h * (it.shape === "objet" ? 0.25 : 1)) * it.s });
    }
    this.updateRing(); this.dirty = true;
  }
  private updateRing() {
    const o = this.selected ? this.objects.get(this.selected) : undefined;
    if (!o) { this.selRing.visible = false; return; }
    const box = new THREE.Box3().setFromObject(o.obj), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    const r = Math.hypot(s.x, s.z) / 2 + 0.012;
    this.selRing.position.set(c.x, box.max.y + 0.002, c.z); this.selRing.scale.setScalar(r); this.selRing.visible = true;
  }
  select(id: string | null) { this.selected = id; this.updateRing(); this.dirty = true; }

  /* ——— Interaction ——— */
  private pick(e: { clientX: number; clientY: number }) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
  }
  private boardPoint(): THREE.Vector3 | null {
    const p = new THREE.Vector3();
    return this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) ? p : null;
  }
  private onDown = (e: PointerEvent) => {
    this.pick(e);
    const hits = this.ray.intersectObjects(this.root.children, true);
    let id: string | null = null;
    for (const h of hits) { let o: THREE.Object3D | null = h.object; while (o && !o.userData.itemId) o = o.parent; if (o) { id = o.userData.itemId as string; break; } }
    this.events.onSelect(id); this.select(id);
    if (!id) return;
    const it = this.items.find((i) => i.id === id), p = this.boardPoint();
    if (!it || !p) return;
    this.drag = { id, dx: it.x - p.x, dz: it.z - p.z, moved: false };
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };
  private onMoveEv = (e: PointerEvent) => {
    if (!this.drag) return;
    this.pick(e); const p = this.boardPoint(); if (!p) return;
    const it = this.items.find((i) => i.id === this.drag!.id); if (!it) return;
    it.x = Math.min(BOARD_W / 2, Math.max(-BOARD_W / 2, p.x + this.drag.dx));
    it.z = Math.min(BOARD_D / 2, Math.max(-BOARD_D / 2, p.z + this.drag.dz));
    this.drag.moved = true; this.layout();
  };
  private onUp = () => {
    const d = this.drag; this.drag = null;
    if (d?.moved) { const it = this.items.find((i) => i.id === d.id); if (it) this.events.onMove(d.id, it.x, it.z); }
    this.layout();
  };
  private onDrop = (e: DragEvent) => {
    e.preventDefault(); this.pick(e); const p = this.boardPoint();
    if (p) this.events.onDropAt(Math.min(BOARD_W / 2, Math.max(-BOARD_W / 2, p.x)), Math.min(BOARD_D / 2, Math.max(-BOARD_D / 2, p.z)));
  };

  /** Image haute définition de la planche (sans le repère de sélection). */
  exportImage(width = 3000): string {
    const cv = this.renderer.domElement, w = cv.clientWidth || 1, h = cv.clientHeight || 1;
    const ratio = this.renderer.getPixelRatio(), ring = this.selRing.visible, shadow = this.sun.shadow.mapSize.x;
    this.selRing.visible = false;
    this.renderer.setPixelRatio(Math.max(1, Math.min(4, width / w)));
    this.renderer.setSize(w, h, false);
    if (!this.software) { this.sun.shadow.mapSize.set(4096, 4096); this.sun.shadow.map?.dispose(); this.sun.shadow.map = null; }
    this.renderer.render(this.scene, this.camera);
    const url = cv.toDataURL("image/jpeg", 0.92);
    this.selRing.visible = ring;
    this.renderer.setPixelRatio(ratio); this.renderer.setSize(w, h, false);
    if (!this.software) { this.sun.shadow.mapSize.set(shadow, shadow); this.sun.shadow.map?.dispose(); this.sun.shadow.map = null; }
    this.dirty = true;
    return url;
  }
}
