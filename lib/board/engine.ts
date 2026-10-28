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
import { parseVariant } from "@/lib/showroom/catalog";
import { buildSample, type SampleShape } from "@/lib/showroom/objects";
import { showroomMaterial } from "@/lib/showroom/three";

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
    p.setY(i, 0.0045 + fold + curl + Math.sin(z * 9 + x * 3) * 0.0022);
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
  /** Point visé (panoramique quand on zoome sur un détail). */
  private pan = new THREE.Vector2(0, 0);
  private panDrag: { x: number; z: number } | null = null;
  private touches = new Map<number, { x: number; y: number }>();
  private pinch: { d: number; zoom: number } | null = null;
  private disposed = false;
  /** Vitrine (page d'accueil) : les échantillons tombent un à un sur la planche, la caméra respire doucement. */
  private showcase = false;
  private paused = false;
  private born = new Map<string, number>();
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
    // Soleil bas venant de l'arrière droit : ombres longues et douces, comme une planche photographiée près d'une fenêtre.
    this.sun.position.set(1.5, 1.55, -1.1);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera; sc.left = -1; sc.right = 1; sc.top = 0.8; sc.bottom = -0.8; sc.near = 0.3; sc.far = 5;
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
    cv.addEventListener("wheel", this.onWheel, { passive: false });
    cv.addEventListener("dragover", (e) => e.preventDefault());
    cv.addEventListener("drop", this.onDrop);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
    this.resize();
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      if (this.showcase && !this.paused) this.tick(performance.now());
      if (this.dirty) { this.dirty = false; this.renderer.render(this.scene, this.camera); }
    };
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
    const px = this.pan.x, pz = this.pan.y;
    if (this.view === "dessus") { this.camera.position.set(px, d, pz + 0.0001); this.camera.lookAt(px, 0, pz); }
    else { const a = THREE.MathUtils.degToRad(52); this.camera.position.set(px, Math.sin(a) * d * 1.08, pz + Math.cos(a) * d * 1.08); this.camera.lookAt(px, 0, pz + 0.03 / this.zoom); }
    this.camera.updateProjectionMatrix(); this.dirty = true;
  }
  setView(v: View) { this.view = v; this.placeCamera(); }
  /** Active la vitrine animée (sans interaction). */
  enableShowcase() { this.showcase = true; this.renderer.domElement.style.pointerEvents = "none"; }
  setPaused(p: boolean) { this.paused = p; if (!p) this.dirty = true; }
  private tick(now: number) {
    // Caméra : léger balancement (quelques degrés), comme filmée à l'épaule.
    const t = now / 1000, fit = Math.max(BOARD_W / this.camera.aspect, BOARD_D) * 0.5 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const d = fit * 0.98, el = THREE.MathUtils.degToRad(56 + Math.sin(t * 0.23) * 4), az = Math.sin(t * 0.17) * 0.16;
    this.camera.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d); this.camera.lookAt(0, 0, 0.02);
    // Chute amortie des échantillons qui viennent d'arriver.
    for (const [id, t0] of this.born) {
      const o = this.objects.get(id); if (!o) continue;
      const k = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - k, 3), bounce = Math.sin(k * Math.PI) * 0.004 * (1 - k);
      o.obj.position.y = (o.obj.userData.baseY as number ?? 0) + (1 - e) * 0.22 + bounce;
      o.obj.rotation.z = (1 - e) * 0.25;
      if (k >= 1) { this.born.delete(id); o.obj.rotation.z = 0; o.obj.position.y = o.obj.userData.baseY as number ?? 0; }
    }
    this.dirty = true;
  }
  setZoom(z: number) { this.zoom = Math.min(6, Math.max(0.8, z)); if (this.zoom <= 1) this.pan.set(0, 0); this.clampPan(); this.placeCamera(); }
  get zoomLevel() { return this.zoom; }
  private clampPan() { const k = Math.max(0, 1 - 1 / this.zoom); this.pan.set(THREE.MathUtils.clamp(this.pan.x, -BOARD_W / 2 * k, BOARD_W / 2 * k), THREE.MathUtils.clamp(this.pan.y, -BOARD_D / 2 * k, BOARD_D / 2 * k)); }
  /** Zoom vers un point de l'écran (molette, pincement) : le point visé reste sous le curseur. */
  private zoomAt(clientX: number, clientY: number, factor: number) {
    this.pick({ clientX, clientY }); const p = this.boardPoint();
    const old = this.zoom, next = Math.min(6, Math.max(0.8, old * factor));
    if (p && next !== old) { const t = 1 - old / next; this.pan.set(this.pan.x + (p.x - this.pan.x) * t, this.pan.y + (p.z - this.pan.y) * t); }
    this.setZoom(next);
  }
  private onWheel = (e: WheelEvent) => { if (this.showcase) return; e.preventDefault(); this.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0016)); };

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

  /** Matériau d'une déclinaison du showroom, à l'échelle réelle (mis en cache par référence et échelle). */
  private srCache = new Map<string, Promise<THREE.Material>>();
  private srMat(ref: string, metersPerUv: number): Promise<THREE.Material> {
    const key = `${ref}|${metersPerUv}`;
    let p = this.srCache.get(key);
    if (!p) {
      p = showroomMaterial(ref, metersPerUv, { size: this.software ? 512 : 1024, anisotropy: this.renderer.capabilities.getMaxAnisotropy(), light: this.software })
        .then((m) => m ?? new THREE.MeshStandardMaterial({ color: "#cccccc" }));
      this.srCache.set(key, p);
    }
    return p;
  }
  private plain(color: string, roughness = 0.8): THREE.Material {
    const k = `plain|${color}|${roughness}`;
    return this.matCache.get(k) ?? (() => { const e = new THREE.MeshStandardMaterial({ color, roughness }); this.matCache.set(k, e); return e; })();
  }
  /** Étiquette : carte crème, texte en capitales fines, comme une planche d'architecte. */
  private label(text: string): THREE.Group {
    const g = new THREE.Group(), w = 0.17, d = 0.042;
    const card = new THREE.Mesh(new RoundedBoxGeometry(w, 0.0025, d, 2, 0.001), this.plain("#FBF8F1", 0.75));
    card.position.y = 0.00125;
    const cv = document.createElement("canvas"); cv.width = 1600; cv.height = 400;
    const x = cv.getContext("2d")!;
    x.fillStyle = "#2A2621"; x.textAlign = "center"; x.textBaseline = "middle";
    let size = 150; x.font = `${size}px "Instrument Serif", Georgia, serif`;
    while (x.measureText(text).width > 1480 && size > 60) { size -= 6; x.font = `${size}px "Instrument Serif", Georgia, serif`; }
    x.fillText(text, 800, 210);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.006, d - 0.004), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9 }));
    plane.rotation.x = -Math.PI / 2; plane.position.y = 0.0026;
    g.add(card, plane);
    return g;
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
    if (it.shape === "etiquette") {
      const lab = this.label(it.ref.slice(2)); cast(lab); g.add(lab);
      return { obj: g, h: 0.003 };
    }
    const variant = it.ref.startsWith("sr:") ? parseVariant(it.ref) : null;
    if (variant) {
      const built = await buildSample(it.ref, it.shape as SampleShape, (m, other) => this.srMat(other ?? it.ref, m));
      if (!built) throw new Error("variante inconnue");
      g.add(built.obj);
      if (["object", "lighting", "sofa", "rug", "art"].includes(variant.family.gen)) {
        // Objets et meubles en miniature sur la planche, comme les modèles 3D de la bibliothèque.
        const size = new THREE.Box3().setFromObject(built.obj).getSize(new THREE.Vector3()), k = Math.min(1, SIZE.objet / Math.max(size.x, size.z, size.y * 0.8, 0.01));
        built.obj.scale.setScalar(k);
        return { obj: g, h: built.h * k };
      }
      return { obj: g, h: built.h };
    }
    if (it.shape === "photo") {
      // Tirage façon polaroïd : marges fines, bandeau du bas plus large, papier légèrement brillant.
      const url = it.ref.startsWith("vis-") ? `/visuels/${it.ref.slice(4)}.webp` : uploads.get(it.ref);
      const t = url ? await this.tex(url, true) : null;
      const ar = t ? (t.image as HTMLImageElement).width / (t.image as HTMLImageElement).height : 1.33;
      const w = SIZE.photo, d = w / ar, b = 0.009, bottom = 0.036;
      const paper = new THREE.Mesh(new RoundedBoxGeometry(w + b * 2, 0.0016, d + b + bottom, 2, 0.0006), new THREE.MeshPhysicalMaterial({ color: "#FBFAF6", roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4 }));
      paper.position.set(0, 0.0008, (bottom - b) / 2);
      const img = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.15 }));
      img.rotation.x = -Math.PI / 2; img.position.y = 0.0017;
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
        if (this.showcase) this.born.set(it.id, performance.now());
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
      o.obj.position.y = y; o.obj.userData.baseY = y;
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
    this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.touches.size === 2) {
      const [a, b] = [...this.touches.values()] as [{ x: number; y: number }, { x: number; y: number }];
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.zoom }; this.drag = null; this.panDrag = null; return;
    }
    this.pick(e);
    const hits = this.ray.intersectObjects(this.root.children, true);
    let id: string | null = null;
    for (const h of hits) { let o: THREE.Object3D | null = h.object; while (o && !o.userData.itemId) o = o.parent; if (o) { id = o.userData.itemId as string; break; } }
    this.events.onSelect(id); this.select(id);
    if (!id) {
      // Fond de planche : faire glisser déplace la vue quand on a zoomé.
      if (this.zoom > 1) { const p = this.boardPoint(); if (p) { this.panDrag = { x: p.x, z: p.z }; this.renderer.domElement.setPointerCapture(e.pointerId); } }
      return;
    }
    const it = this.items.find((i) => i.id === id), p = this.boardPoint();
    if (!it || !p) return;
    this.drag = { id, dx: it.x - p.x, dz: it.z - p.z, moved: false };
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };
  private onMoveEv = (e: PointerEvent) => {
    if (this.touches.has(e.pointerId)) this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pinch && this.touches.size === 2) {
      const [a, b] = [...this.touches.values()] as [{ x: number; y: number }, { x: number; y: number }];
      const d = Math.hypot(a.x - b.x, a.y - b.y); this.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (this.pinch.zoom * d / this.pinch.d) / this.zoom); return;
    }
    if (this.panDrag) {
      this.pick(e); const p = this.boardPoint(); if (!p) return;
      this.pan.set(this.pan.x - (p.x - this.panDrag.x), this.pan.y - (p.z - this.panDrag.z)); this.clampPan(); this.placeCamera();
      this.pick(e); const q = this.boardPoint(); if (q) this.panDrag = { x: q.x, z: q.z };
      return;
    }
    if (!this.drag) return;
    this.pick(e); const p = this.boardPoint(); if (!p) return;
    const it = this.items.find((i) => i.id === this.drag!.id); if (!it) return;
    it.x = Math.min(BOARD_W / 2, Math.max(-BOARD_W / 2, p.x + this.drag.dx));
    it.z = Math.min(BOARD_D / 2, Math.max(-BOARD_D / 2, p.z + this.drag.dz));
    this.drag.moved = true; this.layout();
  };
  private onUp = (e?: PointerEvent) => {
    if (e) this.touches.delete(e.pointerId);
    if (this.touches.size < 2) this.pinch = null;
    this.panDrag = null;
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
