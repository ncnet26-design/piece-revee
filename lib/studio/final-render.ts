import * as THREE from "three";

/**
 * Rendu final par lancer de rayons (three-gpu-pathtracer, MIT) : lumière indirecte, rebonds, ombres douces,
 * reflets et transparences physiquement calculés, à la résolution demandée (3840 × 2160 = 4K natif, sans agrandissement).
 * Le calcul s'affine échantillon par échantillon ; l'aperçu interactif n'est pas affecté.
 */
export interface FinalOptions { width: number; height: number; samples: number; bounces?: number; onProgress?: (done: number, total: number) => void; signal?: AbortSignal }

export async function pathTrace(scene: THREE.Scene, sourceCamera: THREE.PerspectiveCamera, o: FinalOptions): Promise<{ dataUrl: string; samples: number; width: number; height: number; ms: number }> {
  const { WebGLPathTracer } = await import("three-gpu-pathtracer");
  const t0 = performance.now();
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1); renderer.setSize(o.width, o.height, false);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const cam = sourceCamera.clone(); cam.aspect = o.width / o.height; cam.updateProjectionMatrix();
  const tracer = new WebGLPathTracer(renderer);
  tracer.bounces = o.bounces ?? 6; tracer.transmissiveBounces = 6; tracer.filterGlossyFactor = 0.4; tracer.minSamples = 1; tracer.renderDelay = 0; tracer.fadeDuration = 0;
  tracer.tiles.set(o.width > 2000 ? 3 : 2, o.width > 2000 ? 3 : 2);
  try {
    tracer.setScene(scene, cam);
    while (tracer.samples < o.samples) {
      if (o.signal?.aborted) throw new DOMException("Rendu annulé", "AbortError");
      tracer.renderSample();
      o.onProgress?.(Math.floor(tracer.samples), o.samples);
      await new Promise((r) => requestAnimationFrame(r));
    }
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.95), samples: Math.floor(tracer.samples), width: o.width, height: o.height, ms: Math.round(performance.now() - t0) };
  } finally {
    tracer.dispose(); renderer.dispose(); renderer.forceContextLoss();
  }
}
