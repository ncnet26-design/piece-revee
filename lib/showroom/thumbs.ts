import * as THREE from "three";
import { studioEnvironment } from "./studio";
import { parseVariant } from "./catalog";
import { buildSample, disposeSample, naturalShape, sampleSize } from "./objects";
import { showroomMaterial } from "./three";

/**
 * Photographe d'échantillons : un seul moteur 3D caché rend chaque vignette du showroom
 * (vrai volume, tranche, biseau, lumière de studio, reflets et ombre portée).
 */
class Studio {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(24, 1, 0.01, 10);
  mesh: THREE.Mesh | null = null;
  soft: boolean;
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    const gl = this.renderer.getContext(), dbg = gl.getExtension("WEBGL_debug_renderer_info");
    this.soft = /swiftshader|llvmpipe|software/i.test(String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ""));
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.environment = studioEnvironment(this.renderer); this.scene.environmentIntensity = 1;
    const key = new THREE.DirectionalLight("#FFF5E9", 1.35); key.position.set(-0.45, 1, 0.35); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0004;
    Object.assign(key.shadow.camera, { left: -0.4, right: 0.4, top: 0.4, bottom: -0.4, near: 0.1, far: 3 });
    this.scene.add(key);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.ShadowMaterial({ opacity: 0.2 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.scene.add(ground);
  }
  obj: THREE.Object3D | null = null;
  async shoot(ref: string, out: HTMLCanvasElement, texSize: number): Promise<boolean> {
    const v = parseVariant(ref); if (!v) return false;
    const size = sampleSize(v.family.gen), aniso = this.renderer.capabilities.getMaxAnisotropy();
    let failed = false;
    const built = await buildSample(ref, naturalShape(v.family.gen), async (m, other) => { const mat = await showroomMaterial(other ?? ref, m, { size: texSize, anisotropy: aniso }); if (!mat) failed = true; return mat ?? new THREE.MeshStandardMaterial(); }, size);
    if (!built || failed) { if (built) disposeSample(built.obj); return false; }
    if (this.obj) { this.scene.remove(this.obj); disposeSample(this.obj); }
    this.obj = built.obj; this.scene.add(this.obj);
    // Cadrage : l'objet entier, avec une marge, vu de trois quarts plongeant.
    const box = new THREE.Box3().setFromObject(this.obj), c = box.getCenter(new THREE.Vector3()), rad = box.getBoundingSphere(new THREE.Sphere()).radius;
    const d = (rad / Math.sin(THREE.MathUtils.degToRad(this.cam.fov / 2))) * 1.08;
    this.cam.position.set(c.x, c.y + d * 0.8, c.z + d * 0.6); this.cam.lookAt(c.x, c.y, c.z);
    const w = out.width, h = out.height;
    this.renderer.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    this.renderer.render(this.scene, this.cam);
    const ctx = out.getContext("2d")!; ctx.clearRect(0, 0, w, h); ctx.drawImage(this.renderer.domElement, 0, 0, w, h);
    return true;
  }
}

let studio: Studio | null | undefined;
/** Rend la vignette 3D ; renvoie false si la 3D n'est pas disponible (on dessine alors l'aperçu 2D). */
export async function shootSample(ref: string, out: HTMLCanvasElement): Promise<boolean> {
  if (studio === undefined) { try { studio = new Studio(); } catch { studio = null; } }
  if (!studio) return false;
  return studio.shoot(ref, out, studio.soft ? 512 : 1024);
}
