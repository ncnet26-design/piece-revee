import * as THREE from "three";

/** Carte de normales (relief) déduite de la luminosité : joints et veines sombres = creux. */
export function normalFrom(img: HTMLCanvasElement, strength: number): THREE.CanvasTexture {
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
