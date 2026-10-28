"use client";
import { useEffect, useRef, useState } from "react";
import type * as THREE_NS from "three";
import { parseVariant } from "@/lib/showroom/catalog";

/** Échantillon en 3D, éclairé comme en studio, que l'on fait tourner du doigt. */
export function SampleViewer({ refId, label }: { refId: string; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const api = useRef<{ setRef: (r: string) => Promise<void>; dispose: () => void } | null>(null);
  const [state, setState] = useState<"chargement" | "pret" | "indisponible">("chargement");

  useEffect(() => {
    const host = box.current; if (!host) return;
    let alive = true;
    void (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { studioEnvironment } = await import("@/lib/showroom/studio");
      const { buildSample, disposeSample, naturalShape, sampleSize } = await import("@/lib/showroom/objects");
      const { showroomMaterial } = await import("@/lib/showroom/three");
      if (!alive) return;
      let renderer: THREE_NS.WebGLRenderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch { setState("indisponible"); return; }
      const gl = renderer.getContext(), dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const soft = /swiftshader|llvmpipe|software/i.test(String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ""));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, soft ? 1 : 2));
      renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1; renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      const cv = renderer.domElement; cv.style.width = "100%"; cv.style.height = "100%"; cv.style.display = "block"; cv.style.touchAction = "none";
      cv.setAttribute("role", "img"); cv.setAttribute("aria-label", label);
      host.appendChild(cv);
      const scene = new THREE.Scene();
      scene.environment = studioEnvironment(renderer);
      const sun = new THREE.DirectionalLight("#FFF6EC", 1.35); sun.position.set(-0.5, 1.2, 0.6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 5;
      Object.assign(sun.shadow.camera, { left: -0.45, right: 0.45, top: 0.45, bottom: -0.45, near: 0.1, far: 3 });
      scene.add(sun);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.18 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
      const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 10); cam.position.set(0.22, 0.34, 0.42);
      const ctl = new OrbitControls(cam, cv); ctl.enableDamping = true; ctl.enablePan = false; ctl.maxPolarAngle = 1.45; ctl.target.set(0, 0.006, 0); ctl.autoRotate = true; ctl.autoRotateSpeed = 0.6;
      let mesh: THREE_NS.Object3D | null = null, raf = 0, token = 0;
      const resize = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
      const ro = new ResizeObserver(resize); ro.observe(host); resize();
      const loop = () => { raf = requestAnimationFrame(loop); ctl.update(); renderer.render(scene, cam); };
      loop();
      const setRef = async (ref: string) => {
        const v = parseVariant(ref); if (!v) return;
        setState("chargement");
        const size = sampleSize(v.family.gen), my = ++token;
        const built = await buildSample(ref, naturalShape(v.family.gen), async (m, other) => (await showroomMaterial(other ?? ref, m, { size: soft ? 1024 : 2048, anisotropy: renderer.capabilities.getMaxAnisotropy(), light: false })) ?? new THREE.MeshStandardMaterial(), size);
        if (!alive || !built || my !== token) { if (built) disposeSample(built.obj); return; }
        if (mesh) { scene.remove(mesh); disposeSample(mesh); }
        mesh = built.obj; scene.add(mesh);
        const box = new THREE.Box3().setFromObject(mesh), r = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
        const d = r * 2.6; cam.position.set(d * 0.35, d * 0.75, d * 0.6); ctl.target.set(0, (box.max.y - box.min.y) * 0.35, 0); ctl.minDistance = r * 1.1; ctl.maxDistance = r * 4.5;
        setState("pret");
      };
      api.current = { setRef, dispose: () => { cancelAnimationFrame(raf); ro.disconnect(); ctl.dispose(); renderer.dispose(); cv.remove(); } };
      await setRef(refId);
    })();
    return () => { alive = false; api.current?.dispose(); api.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la scène est créée une fois ; la déclinaison change ensuite via setRef
  }, []);
  useEffect(() => { void api.current?.setRef(refId); }, [refId]);

  return (
    <div className="relative h-full w-full">
      <div ref={box} className="h-full w-full" />
      {state === "chargement" && <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[12px] text-muted">Préparation de l'échantillon…</span>}
      {state === "indisponible" && <span className="absolute inset-0 grid place-items-center p-6 text-center text-[13px] text-muted">L'aperçu 3D n'est pas disponible sur cet appareil.</span>}
    </div>
  );
}
