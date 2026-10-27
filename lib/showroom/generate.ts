/**
 * Générateurs de surfaces réalistes du showroom. Code « pur » : il tourne dans un travailleur en arrière-plan
 * (OffscreenCanvas) pour ne jamais figer la page, ou dans la page à défaut.
 * Chaque déclinaison donne trois cartes raccordables (couleur, relief, rugosité) et ses paramètres de rendu,
 * à partir de textures photographiées (Poly Haven, CC0) quand elles existent, sinon d'une génération procédurale.
 */
import { parseVariant, opt, type Variant } from "./catalog";
import { textureUrl } from "@/lib/textures";
import { showroomTexture } from "./textures";

export interface SurfaceParams { metalness: number; sheen: number; sheenRoughness: number; clearcoat: number; clearcoatRoughness: number; normalStrength: number; transmission?: number; anisotropy?: number }
export interface Surface {
  size: number;
  /** Côté réel (m) couvert par une répétition de la texture. */
  period: number;
  color: Uint8ClampedArray;
  height: Float32Array;
  rough: Float32Array;
  params: SurfaceParams;
  /** Carte de relief photographiée (prioritaire sur le relief calculé) et sa répétition propre. */
  normalUrl?: string;
}

/* ——— Outils ——— */
type RGB = [number, number, number];
const hex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a: RGB, k: number): RGB => [a[0] * k, a[1] * k, a[2] * k];
const css = (c: RGB) => `rgb(${Math.round(Math.max(0, Math.min(255, c[0])))},${Math.round(Math.max(0, Math.min(255, c[1])))},${Math.round(Math.max(0, Math.min(255, c[2])))})`;
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function hashStr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const h2 = (x: number, y: number, s: number) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/** Bruit de valeur périodique (se raccorde à la période p, en cellules). */
function vnoise(x: number, y: number, p: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const m = (v: number) => ((v % p) + p) % p;
  const a = h2(m(xi), m(yi), seed), b = h2(m(xi + 1), m(yi), seed), c = h2(m(xi), m(yi + 1), seed), d = h2(m(xi + 1), m(yi + 1), seed);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** Bruit fractal périodique ; u, v dans [0, 1). */
function fbm(u: number, v: number, base: number, oct: number, seed: number, gain = 0.5): number {
  let s = 0, amp = 0.5, tot = 0, p = base;
  for (let o = 0; o < oct; o++) { s += vnoise(u * p, v * p, p, seed + o * 17) * amp; tot += amp; amp *= gain; p *= 2; }
  return s / tot;
}
/** Bruit cellulaire périodique (distance au point le plus proche, 0 à ~1). */
function worley(u: number, v: number, n: number, seed: number): number {
  const x = u * n, y = v * n, xi = Math.floor(x), yi = Math.floor(y);
  let d = 9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cy = yi + j, wx = ((cx % n) + n) % n, wy = ((cy % n) + n) % n;
    const px = cx + h2(wx, wy, seed), py = cy + h2(wx, wy, seed + 9);
    const dd = (px - x) ** 2 + (py - y) ** 2; if (dd < d) d = dd;
  }
  return Math.sqrt(d);
}
/** Flou en boîte raccordable (3 passes ≈ gaussien). */
function blurWrap(src: Float32Array, w: number, r: number): Float32Array {
  if (r < 1) return src.slice();
  const a = src.slice(), b = new Float32Array(src.length);
  const pass = (from: Float32Array, to: Float32Array, horiz: boolean) => {
    const k = 1 / (2 * r + 1);
    for (let line = 0; line < w; line++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) { const j = ((i % w) + w) % w; acc += horiz ? from[line * w + j]! : from[j * w + line]!; }
      for (let i = 0; i < w; i++) {
        if (horiz) to[line * w + i] = acc * k; else to[i * w + line] = acc * k;
        const add = (i + r + 1) % w, rem = ((i - r) % w + w) % w;
        acc += (horiz ? from[line * w + add]! : from[add * w + line]!) - (horiz ? from[line * w + rem]! : from[rem * w + line]!);
      }
    }
  };
  for (let it = 0; it < 3; it++) { pass(a, b, true); pass(b, a, false); }
  return a;
}
type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
function canvas(size: number): [AnyCanvas, CanvasRenderingContext2D] {
  const c: AnyCanvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(size, size) : Object.assign(document.createElement("canvas"), { width: size, height: size });
  return [c, c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D];
}
const imgCache = new Map<string, Promise<ImageBitmap>>();
function loadImg(url: string): Promise<ImageBitmap> {
  let p = imgCache.get(url);
  if (!p) {
    p = fetch(url).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); }).then((b) => createImageBitmap(b));
    imgCache.set(url, p); p.catch(() => imgCache.delete(url));
  }
  return p;
}
/** Luminance normalisée (moyenne 0,5) d'une photo de texture, redimensionnée. */
async function lumaOf(url: string, size: number, rotate = false, minSd = 0.02, blur = 0): Promise<Float32Array | null> {
  try {
    const img = await loadImg(url);
    const [c, x] = canvas(size);
    if (rotate) { x.translate(size, 0); x.rotate(Math.PI / 2); }
    x.drawImage(img, 0, 0, size, size);
    const d = x.getImageData(0, 0, size, size).data, out = new Float32Array(size * size);
    let mean = 0;
    for (let i = 0; i < out.length; i++) { out[i] = (0.3 * d[i * 4]! + 0.59 * d[i * 4 + 1]! + 0.11 * d[i * 4 + 2]!) / 255; mean += out[i]!; }
    mean /= out.length;
    let v = 0; for (let i = 0; i < out.length; i++) v += (out[i]! - mean) ** 2;
    // Gain plafonné : une photo très unie ne doit pas faire ressortir ses artefacts de compression.
    const sd = Math.max(minSd, Math.sqrt(v / out.length));
    for (let i = 0; i < out.length; i++) out[i] = clamp01(0.5 + ((out[i]! - mean) / sd) * 0.16);
    void c;
    return blur > 0 ? blurWrap(out, size, blur) : out;
  } catch { return null; }
}
async function rgbOf(url: string, size: number): Promise<Uint8ClampedArray | null> {
  try { const img = await loadImg(url); const [, x] = canvas(size); x.drawImage(img, 0, 0, size, size); return x.getImageData(0, 0, size, size).data; } catch { return null; }
}
const P = (p: Partial<SurfaceParams>): SurfaceParams => ({ metalness: 0, sheen: 0, sheenRoughness: 0.6, clearcoat: 0, clearcoatRoughness: 0.1, normalStrength: 1.4, ...p });

/** Texture photographiée du showroom si le robot l'a fournie, sinon une texture de la matériauthèque. */
const src = (key: string, fallback: string) => (showroomTexture(key) ? `/textures/${key}/diff.webp` : textureUrl(fallback, "diff"));

/* ——— Carrelages : zellige, faïence, tomette ——— */
type Shape = { poly?: Array<[number, number]>; circle?: [number, number, number]; alt?: boolean };
interface Layout { px: number; py: number; shapes: Shape[]; joint: number; tileSize: number }

function rects(w: number, h: number, nx: number, ny: number, stagger: boolean): Shape[] {
  const s: Shape[] = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = i * w + (stagger && j % 2 ? w / 2 : 0), y = j * h;
    s.push({ poly: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] });
  }
  return s;
}
/** Bâtons rompus : briques a × b, réseau (b, b) et (2a, 0), période 2a dans les deux sens. */
function herringbone(a: number, b: number): Shape[] {
  const P2 = 2 * a, s: Shape[] = [];
  for (let k = -3; k <= 3; k++) for (let n = -Math.ceil(P2 / b) - 6; n <= Math.ceil(P2 / b) + 6; n++) {
    const ox = k * 2 * a;
    const H: [number, number, number, number] = [n * b + ox, n * b, a, b], V: [number, number, number, number] = [n * b + a + ox, n * b - (a - b), b, a];
    for (const [x, y, w, h] of [H, V]) {
      if (x + w < 0 || x > P2 || y + h < 0 || y > P2) continue;
      s.push({ poly: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], alt: w < h });
    }
  }
  return s;
}
function hexes(w: number, nx: number, ny: number): Shape[] {
  const r = w / Math.sqrt(3), s: Shape[] = [];
  for (let j = -1; j <= ny; j++) for (let i = -1; i <= nx; i++) {
    const cx = i * w + (j % 2 ? w / 2 : 0), cy = j * 1.5 * r;
    s.push({ poly: Array.from({ length: 6 }, (_, k) => { const an = Math.PI / 6 + (k * Math.PI) / 3; return [cx + r * Math.cos(an), cy + r * Math.sin(an)] as [number, number]; }) });
  }
  return s;
}
function tileLayout(format: string, style: string): Layout {
  switch (format) {
    case "carre5": return { px: 0.4, py: 0.4, shapes: rects(0.05, 0.05, 8, 8, false), joint: 0.0018, tileSize: 0.05 };
    case "metro": return style === "faience" ? { px: 0.3, py: 0.3, shapes: rects(0.15, 0.075, 2, 4, true), joint: 0.002, tileSize: 0.075 } : { px: 0.3, py: 0.3, shapes: rects(0.15, 0.05, 2, 6, true), joint: 0.0018, tileSize: 0.05 };
    case "metro-biseau": return { px: 0.3, py: 0.3, shapes: rects(0.15, 0.075, 2, 4, true), joint: 0.002, tileSize: 0.075 };
    case "baguette": return { px: 0.3, py: 0.3, shapes: rects(0.3, 0.075, 1, 4, true), joint: 0.002, tileSize: 0.075 };
    case "chevron": return style === "faience" ? { px: 0.3, py: 0.3, shapes: herringbone(0.15, 0.075), joint: 0.002, tileSize: 0.075 } : { px: 0.3, py: 0.3, shapes: herringbone(0.15, 0.05), joint: 0.0018, tileSize: 0.05 };
    case "losange": {
      const d = 0.1 * Math.SQRT2, s: Shape[] = [];
      for (let j = -1; j <= 6; j++) for (let i = -1; i <= 3; i++) { const cx = i * d + (j % 2 ? d / 2 : 0), cy = (j * d) / 2; s.push({ poly: [[cx, cy - d / 2], [cx + d / 2, cy], [cx, cy + d / 2], [cx - d / 2, cy]] }); }
      return { px: 3 * d, py: 3 * d, shapes: s, joint: 0.0018, tileSize: 0.1 };
    }
    case "hexagone": return style === "tomette" ? { px: 7 * 0.165, py: 8 * 1.5 * (0.165 / Math.sqrt(3)), shapes: hexes(0.165, 7, 8), joint: 0.004, tileSize: 0.165 } : { px: 0.7, py: 8 * 1.5 * (0.1 / Math.sqrt(3)), shapes: hexes(0.1, 7, 8), joint: 0.002, tileSize: 0.1 };
    case "ecaille": {
      const r = 0.0325, s: Shape[] = [];
      for (let j = -2; j <= 13; j++) for (let i = -1; i <= 6; i++) s.push({ circle: [i * 2 * r + (j % 2 ? r : 0) + r, j * r, r] });
      return { px: 12 * r, py: 12 * r, shapes: s, joint: 0.0018, tileSize: 2 * r };
    }
    case "carre": return { px: 0.48, py: 0.48, shapes: rects(0.16, 0.16, 3, 3, false), joint: 0.005, tileSize: 0.16 };
    case "octogone": {
      const t = 0.16, c = t / (2 + Math.SQRT2), s: Shape[] = [];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const x = i * t, y = j * t;
        s.push({ poly: [[x + c, y], [x + t - c, y], [x + t, y + c], [x + t, y + t - c], [x + t - c, y + t], [x + c, y + t], [x, y + t - c], [x, y + c]] });
        s.push({ poly: [[x, y - c], [x + c, y], [x, y + c], [x - c, y]], alt: true });
      }
      return { px: 0.48, py: 0.48, shapes: s, joint: 0.004, tileSize: 0.16 };
    }
    default: return { px: 0.4, py: 0.4, shapes: rects(0.1, 0.1, 4, 4, false), joint: 0.002, tileSize: 0.1 };
  }
}

function drawShapes(x: CanvasRenderingContext2D, L: Layout, size: number, fill: (i: number, s: Shape) => string, strokeCol: string | null, jointW: number) {
  const kx = size / L.px, ky = size / L.py;
  L.shapes.forEach((s, i) => {
    for (const ox of [-L.px, 0, L.px]) for (const oy of [-L.py, 0, L.py]) {
      x.setTransform(kx, 0, 0, ky, ox * kx, oy * ky);
      x.beginPath();
      if (s.circle) x.arc(s.circle[0], s.circle[1], s.circle[2], 0, Math.PI * 2);
      else { s.poly!.forEach(([a, b], k) => (k ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); }
      x.fillStyle = fill(i, s); x.fill();
      if (strokeCol) { x.lineWidth = jointW; x.strokeStyle = strokeCol; x.stroke(); }
    }
  });
  x.setTransform(1, 0, 0, 1, 0, 0);
}

function shapeCenter(s: Shape): [number, number] {
  if (s.circle) return [s.circle[0], s.circle[1] - s.circle[2] * 0.35];
  const xs = s.poly!.map((p) => p[0]), ys = s.poly!.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}
/** Bruit cellulaire : distances au 1er et au 2e point (pour les craquelures de l'émail). */
function worley2(u: number, v: number, n: number, seed: number): [number, number] {
  const x = u * n, y = v * n, xi = Math.floor(x), yi = Math.floor(y);
  let d1 = 9, d2 = 9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cy = yi + j, wx = ((cx % n) + n) % n, wy = ((cy % n) + n) % n;
    const dd = (cx + h2(wx, wy, seed) - x) ** 2 + (cy + h2(wx, wy, seed + 9) - y) ** 2;
    if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd;
  }
  return [Math.sqrt(d1), Math.sqrt(d2)];
}

function genTile(v: Variant, size: number): Surface {
  const style = v.family.id, seed = hashStr(v.ref);
  const base = hex(opt(v, "teinte")!.hex!), format = opt(v, "format")!.id, finish = opt(v, "finition")!.id, jointOpt = opt(v, "joint")!;
  const L = tileLayout(format, style), R = rng(seed), n = size * size;
  const jointHex: RGB = jointOpt.id === "assorti" ? mul(base, 0.62) : hex(jointOpt.hex!);
  const zel = style === "zellige", tom = style === "tomette";
  const tomettePal = tom && opt(v, "teinte")!.id === "nuancee" ? ["#B5603E", "#C98468", "#A8553A", "#C9924F", "#9C4E32"].map(hex) : null;
  // Chaque carreau a sa nuance, son inclinaison et son bombé : c'est ce qui fait vivre les reflets.
  const tiles = L.shapes.map((s) => {
    let c: RGB;
    if (s.alt && format === "octogone") c = opt(v, "teinte")!.id === "blanchie" ? hex("#B5603E") : hex("#E6DAC4");
    else if (tomettePal) c = mul(tomettePal[Math.floor(R() * tomettePal.length)]!, 0.92 + R() * 0.16);
    else {
      const spread = zel ? 0.22 : tom ? 0.14 : 0.03, k = 1 + (R() - 0.55) * spread * (R() < 0.18 ? 1.9 : 1);
      c = mixc(mul(base, k), mixc(base, [255, 255, 255], 0.25), zel && R() < 0.15 ? 0.2 : 0);
    }
    const tiltAmp = zel ? 0.55 : tom ? 0.18 : 0.06;
    return { c, center: shapeCenter(s), ax: (R() - 0.5) * tiltAmp, ay: (R() - 0.5) * tiltAmp, bulge: zel ? 0.15 + R() * 0.35 : tom ? 0.1 : 0.02, ph: R() * 100 };
  });
  const [, cx] = canvas(size), [, mx] = canvas(size), [, ix] = canvas(size);
  cx.fillStyle = css(jointHex); cx.fillRect(0, 0, size, size);
  mx.fillStyle = "#000"; mx.fillRect(0, 0, size, size);
  ix.fillStyle = "#000"; ix.fillRect(0, 0, size, size);
  const jw = L.joint;
  drawShapes(cx, L, size, (i) => css(tiles[i]!.c), css(jointHex), jw);
  drawShapes(mx, L, size, () => "#fff", "#000", jw * 1.05);
  ix.imageSmoothingEnabled = false;
  drawShapes(ix, L, size, (i) => `rgb(${(i + 1) & 255},${((i + 1) >> 8) & 255},0)`, null, 0);
  const col = cx.getImageData(0, 0, size, size).data, mk = mx.getImageData(0, 0, size, size).data, idd = ix.getImageData(0, 0, size, size).data;
  const mask = new Float32Array(n); for (let i = 0; i < n; i++) mask[i] = mk[i * 4]! / 255;
  const tilePx = (L.tileSize / L.px) * size, tileM = L.tileSize;
  const bevel = format === "metro-biseau" ? 0.1 : zel ? 0.07 : tom ? 0.07 : 0.022;
  const e = blurWrap(mask, size, Math.max(1, Math.round(tilePx * bevel)));
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n), rough = new Float32Array(n);
  const glossy = finish === "brillant", tr = tom ? (finish === "ciree" ? 0.4 : 0.82) : glossy ? (zel ? 0.05 : 0.04) : zel ? 0.28 : 0.48;
  const clay: RGB = [214, 196, 170], crazeN = Math.round(L.px / 0.012);
  let lastId = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, u = x / size, w = y / size, m = mask[i]!, ed = smooth(0.12, 0.96, e[i]! * m);
    const fine = h2(x, y, seed) - 0.5;
    let id = (idd[i * 4]! | (idd[i * 4 + 1]! << 8)) - 1; if (id < 0 || id >= tiles.length) id = lastId; else lastId = id;
    const t = tiles[id]!;
    let r = col[i * 4]!, g = col[i * 4 + 1]!, b = col[i * 4 + 2]!, h = 0, ro = 0.92;
    if (m > 0.5) {
      // Position dans le carreau (unités de carreau), en tenant compte du raccord des bords.
      let dx = u * L.px - t.center[0], dy = w * L.py - t.center[1];
      dx -= Math.round(dx / L.px) * L.px; dy -= Math.round(dy / L.py) * L.py;
      dx /= tileM; dy /= tileM;
      const und = vnoise(dx * 2.2 + t.ph, dy * 2.2 + t.ph, 1e6, seed);
      const dome = 1 - Math.min(1, (dx * dx + dy * dy) * 2.2);
      const roll = zel ? Math.pow(ed, 0.45) : tom ? Math.pow(ed, 0.3) : format === "metro-biseau" ? ed : 0.88 + 0.12 * ed;
      h = roll * (0.55 + t.bulge * dome + t.ax * dx + t.ay * dy + (zel ? (und - 0.5) * 0.35 : tom ? (und - 0.5) * 0.12 : 0));
      let k = 1;
      if (zel) {
        const cloud = fbm(u, w, Math.max(2, Math.round(L.px / 0.05)), 3, seed + 4);
        k = (0.8 + 0.2 * ed) * (1 + (cloud - 0.5) * 0.16) * (1 + fine * 0.012);
        const [f1, f2] = worley2(u, w, crazeN, seed + 21), craze = 1 - smooth(0, 0.035, f2 - f1);
        k *= 1 - craze * 0.05; h -= craze * 0.012;
        const chip = ed < 0.4 && vnoise(u * size / 6, w * size / 6, size / 6, seed + 31) > 0.82;
        if (chip) { r = clay[0]; g = clay[1]; b = clay[2]; h *= 0.75; ro = 0.8; } else ro = tr + (1 - ed) * 0.05 + (cloud - 0.5) * 0.04;
        if (h2(x, y, seed + 3) > 0.99985) { k *= 0.55; h -= 0.04; }
      } else if (tom) {
        const burn = fbm(u, w, 8, 4, seed + 5), mot = fbm(u, w, 24, 3, seed + 8);
        k = (0.9 + 0.1 * ed) * (1 - smooth(0.6, 0.85, burn) * 0.2) * (1 + (mot - 0.5) * 0.12 + fine * 0.07) * (finish === "ciree" ? 0.88 : 1.02);
        if (h2(x, y, seed + 11) > 0.996) { k *= 0.72; h -= 0.05; }
        h += (mot - 0.5) * 0.08;
        ro = tr + (mot - 0.5) * 0.1;
      } else {
        k = (0.965 + 0.035 * ed) * (1 + fine * 0.006);
        ro = tr + (1 - ed) * 0.04;
      }
      r *= k; g *= k; b *= k;
    } else {
      const lo = fbm(u, w, 16, 3, seed + 2), sand = h2(x, y, seed + 1);
      const k = 0.92 + (sand - 0.5) * 0.16 + (lo - 0.5) * 0.08;
      r *= k; g *= k; b *= k; h = 0.06 * lo + 0.02 * sand; ro = 0.92;
    }
    color[i * 4] = r; color[i * 4 + 1] = g; color[i * 4 + 2] = b; color[i * 4 + 3] = 255;
    height[i] = Math.max(0, h) * m + (1 - m) * h;
    rough[i] = clamp01(ro);
  }
  return { size, period: (L.px + L.py) / 2, color, height, rough, params: P({ normalStrength: zel ? 2.2 : tom ? 2 : 1.4 }) };
}

/* ——— Carreaux de ciment ——— */
function cementPattern(x: CanvasRenderingContext2D, motif: string, s: number, c: string[]) {
  const [bg, main, acc] = c as [string, string, string];
  const P0 = (pts: Array<[number, number]>, f: string) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a * s, b * s) : x.moveTo(a * s, b * s))); x.closePath(); x.fillStyle = f; x.fill(); };
  const C = (cx: number, cy: number, r: number, f: string) => { x.beginPath(); x.arc(cx * s, cy * s, r * s, 0, Math.PI * 2); x.fillStyle = f; x.fill(); };
  x.fillStyle = bg; x.fillRect(0, 0, s, s);
  switch (motif) {
    case "etoile": {
      const star = (r: number, f: string) => { const pts: Array<[number, number]> = []; for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8 - Math.PI / 2, rr = k % 2 ? r * 0.55 : r; pts.push([0.5 + rr * Math.cos(a), 0.5 + rr * Math.sin(a)]); } P0(pts, f); };
      star(0.42, main); star(0.22, bg); C(0.5, 0.5, 0.08, acc);
      for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) P0([[a, b - 0.14], [a + 0.14, b], [a, b + 0.14], [a - 0.14, b]], acc);
      break;
    }
    case "rosace": {
      for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) { C(a, b, 0.5, main); C(a, b, 0.36, bg); C(a, b, 0.2, acc); }
      for (let k = 0; k < 4; k++) { x.save(); x.translate(0.5 * s, 0.5 * s); x.rotate((k * Math.PI) / 2); x.beginPath(); x.ellipse(0, -0.14 * s, 0.07 * s, 0.14 * s, 0, 0, Math.PI * 2); x.fillStyle = main; x.fill(); x.restore(); }
      C(0.5, 0.5, 0.06, acc);
      break;
    }
    case "losange": P0([[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]], main); P0([[0.5, 0.18], [0.82, 0.5], [0.5, 0.82], [0.18, 0.5]], bg); P0([[0.5, 0.34], [0.66, 0.5], [0.5, 0.66], [0.34, 0.5]], acc); break;
    case "sablier": P0([[0, 0], [1, 0], [0.5, 0.5]], main); P0([[0, 1], [1, 1], [0.5, 0.5]], main); P0([[0.5, 0.36], [0.64, 0.5], [0.5, 0.64], [0.36, 0.5]], acc); break;
    case "arabesque": {
      for (const [a, b] of [[0.5, 0.27], [0.73, 0.5], [0.5, 0.73], [0.27, 0.5]] as const) C(a, b, 0.23, main);
      C(0.5, 0.5, 0.16, bg); C(0.5, 0.5, 0.07, acc);
      for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) C(a, b, 0.13, acc);
      break;
    }
    case "ecaille": for (let j = 0; j < 5; j++) for (let i = -1; i < 5; i++) { const cx = (i + (j % 2 ? 0.5 : 0) + 0.25) / 2, cy = j / 4; C(cx, cy, 0.25, j % 2 ? main : acc); C(cx, cy, 0.17, bg); } break;
    case "damier": x.fillStyle = main; x.fillRect(0, 0, s / 2, s / 2); x.fillRect(s / 2, s / 2, s / 2, s / 2); break;
    default: x.fillStyle = main; x.fillRect(0, 0, s, s);
  }
}
function genCement(v: Variant, size: number): Surface {
  const seed = hashStr(v.ref), motif = opt(v, "motif")!.id, cols = opt(v, "coloris")!.colors!, n = size * size;
  const tiles = 4, tp = size / tiles;
  const [cc, cx] = canvas(size), [, mx] = canvas(size);
  for (let j = 0; j < tiles; j++) for (let i = 0; i < tiles; i++) { cx.save(); cx.translate(i * tp, j * tp); cx.beginPath(); cx.rect(0, 0, tp, tp); cx.clip(); cementPattern(cx, motif, tp, cols); cx.restore(); }
  void cc;
  mx.fillStyle = "#fff"; mx.fillRect(0, 0, size, size); mx.strokeStyle = "#000"; mx.lineWidth = Math.max(1, size * 0.0025);
  for (let k = 0; k <= tiles; k++) { mx.beginPath(); mx.moveTo(k * tp, 0); mx.lineTo(k * tp, size); mx.moveTo(0, k * tp); mx.lineTo(size, k * tp); mx.stroke(); }
  const col = cx.getImageData(0, 0, size, size).data, mk = mx.getImageData(0, 0, size, size).data;
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n), rough = new Float32Array(n);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, u = x / size, w = y / size, m = mk[i * 4]! / 255;
    const mott = fbm(u, w, 8, 5, seed), wear = smooth(0.66, 0.82, fbm(u, w, 5, 3, seed + 4)), fine = h2(x, y, seed) - 0.5;
    let k = (1 + (mott - 0.5) * 0.12 + fine * 0.06) * (m > 0.5 ? 1 : 0.86);
    k = k * (1 - wear * 0.06) + wear * 0.08;
    for (let c = 0; c < 3; c++) color[i * 4 + c] = col[i * 4 + c]! * k + wear * 18;
    color[i * 4 + 3] = 255;
    height[i] = m * (0.9 + mott * 0.1); rough[i] = 0.74 + (mott - 0.5) * 0.1 + (1 - m) * 0.15;
  }
  return { size, period: 0.8, color, height, rough, params: P({ normalStrength: 1.2 }) };
}

/* ——— Marbres et pierres ——— */
async function genMarble(v: Variant, size: number): Promise<Surface> {
  const seed = hashStr(v.ref), stone = opt(v, "pierre")!, finish = opt(v, "finition")!.id, n = size * size;
  const [b0, v0] = stone.colors!.map(hex) as [RGB, RGB];
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n), rough = new Float32Array(n);
  const id = stone.id;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, u = x / size, w = y / size;
    const turb = fbm(u, w, 3, 6, seed), cloud = fbm(u, w, 2, 5, seed + 3), fine = h2(x, y, seed) - 0.5;
    let c: RGB = mixc(b0, mul(b0, 0.9), cloud * 0.6);
    let hgt = 0.5;
    const vein = (fx: number, fy: number, amp: number, sharp: number, s2: number) => Math.pow(1 - Math.abs(Math.sin(Math.PI * (u * fx + w * fy + fbm(u, w, 3, 6, seed + s2) * amp))), sharp);
    if (id === "carrare") { c = mixc(c, v0, vein(1, 2, 2.6, 24, 1) * 0.7 + vein(3, 1, 3.2, 60, 2) * 0.45 + smooth(0.55, 0.8, cloud) * 0.25); }
    else if (id === "calacatta") { c = mixc(c, v0, Math.min(1, vein(1, 1, 2.2, 7, 1) * 0.9 + vein(2, 3, 3, 40, 5) * 0.4)); }
    else if (id === "viola") { c = mixc(c, v0, Math.min(1, vein(1, 2, 2.4, 5, 1) * 0.95 + vein(3, 1, 2.6, 22, 6) * 0.5 + smooth(0.6, 0.9, turb) * 0.3)); }
    else if (id === "nero") { c = mixc(mixc(b0, [40, 40, 42], cloud * 0.5), v0, Math.min(1, vein(1, 2, 2.4, 45, 1) * 0.95 + vein(2, 1, 3.4, 80, 2) * 0.6)); }
    else if (id === "verde") { c = mixc(mixc(b0, [14, 40, 30], cloud * 0.7), v0, Math.min(1, vein(1, 2, 2.8, 26, 1) * 0.75 + vein(3, 1, 3.4, 70, 2) * 0.55 + vein(2, 3, 2.2, 120, 3) * 0.4)); }
    else if (id === "rosa") { c = mixc(mixc(b0, v0, smooth(0.45, 0.8, cloud) * 0.45), mul(v0, 0.85), vein(1, 1, 2.5, 18, 1) * 0.5); }
    else if (id === "emperador") { c = mixc(mixc(b0, mul(b0, 0.72), cloud * 0.8), v0, Math.min(1, vein(2, 1, 3, 40, 1) * 0.7 + vein(1, 3, 3.6, 90, 4) * 0.55 + vein(3, 2, 2.4, 160, 5) * 0.4)); }
    else if (id === "travertin") {
      const band = 0.5 + 0.5 * Math.sin(Math.PI * 2 * (w * 9 + turb * 0.8));
      c = mixc(b0, v0, band * 0.35 + cloud * 0.25);
      const pit = vnoise(u * 90, w * 260, 90, seed + 8);
      if (pit > 0.86) { c = mul(c, 0.72); hgt = 0.1; }
    } else if (id === "bourgogne") {
      c = mixc(b0, v0, cloud * 0.5 + (turb - 0.5) * 0.3);
      if (h2(x >> 1, y >> 1, seed + 5) > 0.997) c = mul(c, 0.8);
    } else {
      // Ardoise : surface clivée, nuances gris-bleu très douces.
      const cl = fbm(u, w, 4, 6, seed + 9), layer = fbm(u * 0.5, w * 3, 6, 4, seed + 2);
      c = mixc(b0, v0, (cl - 0.5) * 0.5 + 0.25 + (layer - 0.5) * 0.15); hgt = cl * 0.8 + layer * 0.2;
    }
    const k = 1 + fine * 0.03;
    color[i * 4] = c[0] * k; color[i * 4 + 1] = c[1] * k; color[i * 4 + 2] = c[2] * k; color[i * 4 + 3] = 255;
    const pol = finish === "poli" ? 0.1 : finish === "adouci" ? 0.42 : 0.62;
    if (finish === "vieilli") hgt = hgt * 0.6 + fbm(u, w, 16, 4, seed + 12) * 0.4;
    height[i] = finish === "poli" && id !== "ardoise" ? hgt * 0.15 : hgt;
    rough[i] = clamp01(pol + (cloud - 0.5) * 0.08 + (id === "ardoise" ? 0.25 : 0));
  }
  return { size, period: 0.8, color, height, rough, params: P({ normalStrength: finish === "poli" ? 0.4 : 1.6, clearcoat: finish === "poli" ? 0.3 : 0, clearcoatRoughness: 0.08 }) };
}

/* ——— Terrazzo ——— */
function genTerrazzo(v: Variant, size: number): Surface {
  const seed = hashStr(v.ref), R = rng(seed), n = size * size, per = 0.4;
  const base = hex(opt(v, "fond")!.hex!), grain = opt(v, "eclats")!.id, palO = opt(v, "palette")!;
  const pal: RGB[] = palO.id === "ton" ? [mul(base, 1.12), mul(base, 0.82), mul(base, 0.65), mixc(base, [255, 255, 255], 0.4)] : palO.colors!.map(hex);
  const [, cx] = canvas(size);
  cx.fillStyle = css(base); cx.fillRect(0, 0, size, size);
  const k = size / per;
  const sizes: Array<[number, number, number]> = grain === "fins" ? [[0.002, 0.006, 3200]] : grain === "moyens" ? [[0.005, 0.014, 650], [0.0015, 0.004, 1400]] : [[0.016, 0.04, 90], [0.004, 0.01, 500], [0.0015, 0.004, 1200]];
  for (const [a, b, count] of sizes) for (let c = 0; c < count * (size / 1024) ** 0; c++) {
    const r = a + (b - a) * Math.pow(R(), 1.6), x0 = R() * per, y0 = R() * per, sides = 5 + Math.floor(R() * 4), rot = R() * Math.PI;
    const pts = Array.from({ length: sides }, (_, s) => { const an = rot + (s / sides) * Math.PI * 2, rr = r * (0.6 + R() * 0.55); return [Math.cos(an) * rr, Math.sin(an) * rr * (0.7 + R() * 0.4)]; });
    const col = mul(pal[Math.floor(R() * pal.length)]!, 0.9 + R() * 0.2);
    cx.fillStyle = css(col);
    for (const ox of [-per, 0, per]) for (const oy of [-per, 0, per]) {
      const X = x0 + ox, Y = y0 + oy; if (X < -b || X > per + b || Y < -b || Y > per + b) continue;
      cx.beginPath(); pts.forEach(([px, py], s) => (s ? cx.lineTo((X + px!) * k, (Y + py!) * k) : cx.moveTo((X + px!) * k, (Y + py!) * k))); cx.closePath(); cx.fill();
    }
  }
  const col = cx.getImageData(0, 0, size, size).data, color = new Uint8ClampedArray(n * 4), height = new Float32Array(n), rough = new Float32Array(n);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, u = x / size, w = y / size, cl = fbm(u, w, 6, 4, seed), fine = h2(x, y, seed) - 0.5;
    let kk = 1 + (cl - 0.5) * 0.06 + fine * 0.05;
    if (h2(x, y, seed + 2) > 0.9985) kk *= 0.55;
    for (let c = 0; c < 3; c++) color[i * 4 + c] = col[i * 4 + c]! * kk;
    color[i * 4 + 3] = 255; height[i] = 0.5 + fine * 0.05; rough[i] = 0.14 + (cl - 0.5) * 0.06;
  }
  return { size, period: per, color, height, rough, params: P({ normalStrength: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.08 }) };
}

/* ——— Parquets : lames tirées de vrais placages photographiés ——— */
async function genWood(v: Variant, size: number): Promise<Surface> {
  const seed = hashStr(v.ref), R = rng(seed), n = size * size;
  const ess = opt(v, "essence")!, pose = opt(v, "pose")!.id, finish = opt(v, "finition")!.id;
  const [dark, light] = ess.colors!.map(hex) as [RGB, RGB];
  const grainUrl = /noyer|teck/.test(ess.id) ? textureUrl("m-noyer", "diff") : /frene|pin/.test(ess.id) ? src("tx-bois-fin", "m-bouleau") : src("tx-chene", "m-bouleau");
  const gs = 1024, grain = (await lumaOf(grainUrl, gs)) ?? new Float32Array(gs * gs).fill(0.5);
  // Fil du bois colorisé selon l'essence (clair → foncé), sur une source carrée qui couvre ~1,2 m.
  const [gc, gx] = canvas(gs); const gimg = gx.createImageData(gs, gs);
  for (let i = 0; i < gs * gs; i++) { const t = clamp01((grain[i]! - 0.5) * 1.05 + 0.5); const c = mixc(dark, light, Math.pow(t, 0.9)); gimg.data[i * 4] = c[0]; gimg.data[i * 4 + 1] = c[1]; gimg.data[i * 4 + 2] = c[2]; gimg.data[i * 4 + 3] = 255; }
  gx.putImageData(gimg, 0, 0);
  const srcM = 1.2;
  type Plank = { pts: Array<[number, number]>; ang: number };
  let per = 0.84; const planks: Plank[] = [];
  const rect = (x: number, y: number, w: number, h: number, ang: number) => planks.push({ pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], ang });
  if (pose === "anglaise" || pose === "larges") {
    const pw = pose === "larges" ? 0.22 : 0.14, rows = 6; per = pw * rows;
    for (let j = 0; j < rows; j++) { let x = R() * per; const end = x + per; while (x < end - 0.05) { const l = Math.min(end - x, (pose === "larges" ? 0.9 : 0.5) + R() * (pose === "larges" ? 0.8 : 0.6)); rect(x, j * pw, l, pw, 0); x += l; } }
  } else if (pose === "batons") {
    const a = 0.42, b = 0.07; per = 2 * a;
    for (const s of herringbone(a, b)) { const p0 = s.poly![0]!, p2 = s.poly![2]!; rect(p0[0], p0[1], p2[0] - p0[0], p2[1] - p0[1], s.alt ? Math.PI / 2 : 0); }
  } else if (pose === "hongrie") {
    const C = 0.3, rows = 5; per = 2 * C; const h = per / rows;
    for (let col = 0; col < 2; col++) for (let j = -2; j <= rows + 2; j++) {
      const x0 = col * C, y0 = j * h, s = col === 0 ? -1 : 1;
      const pts: Array<[number, number]> = col === 0 ? [[x0, y0], [x0 + C, y0 - C], [x0 + C, y0 - C + h], [x0, y0 + h]] : [[x0, y0 - C], [x0 + C, y0], [x0 + C, y0 + h], [x0, y0 - C + h]];
      planks.push({ pts, ang: s * -Math.PI / 4 });
    }
  } else {
    const sq = 0.3, k3 = sq / 3; per = 2 * sq;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) for (let s = 0; s < 3; s++) { if ((i + j) % 2) rect(i * sq + s * k3, j * sq, k3, sq, Math.PI / 2); else rect(i * sq, j * sq + s * k3, sq, k3, 0); }
  }
  const [cc, cx] = canvas(size), [, mx] = canvas(size), k = size / per;
  void cc;
  mx.fillStyle = "#000"; mx.fillRect(0, 0, size, size);
  planks.forEach((pl) => {
    const tint = 0.9 + R() * 0.2, offx = R() * srcM, offy = R() * srcM;
    for (const ox of [-per, 0, per]) for (const oy of [-per, 0, per]) {
      const path = () => { cx.beginPath(); pl.pts.forEach(([a, b], i) => (i ? cx.lineTo((a + ox) * k, (b + oy) * k) : cx.moveTo((a + ox) * k, (b + oy) * k))); cx.closePath(); };
      const minx = Math.min(...pl.pts.map((p) => p[0])) + ox, maxx = Math.max(...pl.pts.map((p) => p[0])) + ox, miny = Math.min(...pl.pts.map((p) => p[1])) + oy, maxy = Math.max(...pl.pts.map((p) => p[1])) + oy;
      if (maxx < 0 || minx > per || maxy < 0 || miny > per) continue;
      cx.save(); path(); cx.clip();
      const cxm = ((pl.pts[0]![0] + ox) * k), cym = ((pl.pts[0]![1] + oy) * k);
      cx.translate(cxm, cym); cx.rotate(pl.ang);
      const scale = (size / per) * (srcM / gs);
      cx.drawImage(gc, -offx * gs / srcM * scale - gs * scale, -offy * gs / srcM * scale - gs * scale, gs * scale * 3, gs * scale * 3);
      cx.restore();
      cx.save(); path(); cx.globalCompositeOperation = "multiply"; cx.fillStyle = css([255 * tint, 255 * tint, 255 * tint]); cx.fill(); cx.restore();
      cx.save(); path(); cx.strokeStyle = "rgba(25,15,8,.55)"; cx.lineWidth = Math.max(1, size / 700); cx.stroke(); cx.restore();
      mx.beginPath(); pl.pts.forEach(([a, b], i) => (i ? mx.lineTo((a + ox) * k, (b + oy) * k) : mx.moveTo((a + ox) * k, (b + oy) * k))); mx.closePath(); mx.fillStyle = "#fff"; mx.fill(); mx.strokeStyle = "#000"; mx.lineWidth = Math.max(1, size / 600); mx.stroke();
    }
  });
  const col = cx.getImageData(0, 0, size, size).data, mk = mx.getImageData(0, 0, size, size).data;
  const mask = new Float32Array(n); for (let i = 0; i < n; i++) mask[i] = mk[i * 4]! / 255;
  const e = blurWrap(mask, size, Math.max(1, Math.round(size / 400)));
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n), rough = new Float32Array(n);
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) lum[i] = (0.3 * col[i * 4]! + 0.59 * col[i * 4 + 1]! + 0.11 * col[i * 4 + 2]!) / 255;
  const fr = finish === "huile" ? 0.55 : finish === "vitrifie" ? 0.3 : 0.72;
  for (let i = 0; i < n; i++) {
    // Pores du bois : fines piqûres sombres, plus marquées sur un bois brut.
    const pore = h2(i % size, ((i / size) | 0) >> 2, seed + 13) > (finish === "brut" ? 0.985 : 0.992) ? 0.84 : 1;
    const kk = (finish === "brut" ? 1.05 : finish === "vitrifie" ? 0.97 : 1) * pore;
    for (let c = 0; c < 3; c++) color[i * 4 + c] = col[i * 4 + c]! * kk;
    color[i * 4 + 3] = 255;
    height[i] = e[i]! * 0.7 + lum[i]! * (finish === "brut" ? 0.5 : 0.25);
    rough[i] = clamp01(fr + (0.5 - lum[i]!) * 0.15 + (1 - e[i]!) * 0.2);
  }
  return { size, period: per, color, height, rough, params: P({ normalStrength: finish === "brut" ? 2.4 : 1.5, clearcoat: finish === "vitrifie" ? 0.35 : 0, clearcoatRoughness: 0.18 }) };
}

/* ——— Peintures ——— */
function genPaint(v: Variant, size: number): Surface {
  const seed = hashStr(v.ref), base = hex(opt(v, "teinte")!.hex!), fin = opt(v, "finition")!.id, n = size * size;
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n), rough = new Float32Array(n);
  const stip = new Float32Array(n); for (let i = 0; i < n; i++) stip[i] = h2(i % size, (i / size) | 0, seed);
  const sb = blurWrap(stip, size, 1);
  const r0 = fin === "mat" ? 0.94 : fin === "velours" ? 0.72 : fin === "satin" ? 0.42 : 0.12;
  for (let i = 0; i < n; i++) {
    const u = (i % size) / size, w = ((i / size) | 0) / size, roll = fbm(u, w, 4, 3, seed);
    const k = 1 + (sb[i]! - 0.5) * 0.05 + (roll - 0.5) * 0.025;
    color[i * 4] = base[0] * k; color[i * 4 + 1] = base[1] * k; color[i * 4 + 2] = base[2] * k; color[i * 4 + 3] = 255;
    height[i] = sb[i]! * 0.6 + roll * 0.4; rough[i] = clamp01(r0 + (roll - 0.5) * 0.05);
  }
  return { size, period: 0.5, color, height, rough, params: P({ normalStrength: fin === "brillant" ? 0.25 : 0.6, clearcoat: fin === "brillant" ? 0.9 : fin === "satin" ? 0.25 : 0, clearcoatRoughness: fin === "brillant" ? 0.04 : 0.3 }) };
}

/* ——— Enduits ——— */
async function genPlaster(v: Variant, size: number): Promise<Surface> {
  const seed = hashStr(v.ref), type = opt(v, "type")!.id, base = hex(opt(v, "teinte")!.hex!), asp = opt(v, "aspect")!.id, n = size * size;
  const detUrl = type === "beton-cire" || type === "microciment" ? src("tx-beton", "m-beton") : type === "chaux" ? src("tx-enduit-nuage", "m-chaux") : src("tx-enduit", "m-tadelakt");
  const det = (await lumaOf(detUrl, size, false, 0.06, Math.max(1, Math.round(size / 512)))) ?? new Float32Array(n).fill(0.5);
  const amp = { chaux: 0.26, tadelakt: 0.2, "beton-cire": 0.18, microciment: 0.1, stuc: 0.12, argile: 0.2 }[type] ?? 0.15;
  const a2 = asp === "nuage" ? amp * 1.35 : asp === "lisse" ? amp * 0.45 : amp;
  const r0 = { chaux: 0.94, tadelakt: 0.3, "beton-cire": 0.45, microciment: 0.52, stuc: 0.12, argile: 0.95 }[type] ?? 0.6;
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n), rough = new Float32Array(n);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, u = x / size, w = y / size, cl = fbm(u, w, 3, 6, seed), d = det[i]!;
    let k = 1 + (cl - 0.5) * a2 * 2 + (d - 0.5) * (asp === "lisse" ? 0.25 : 0.6);
    if (asp === "brosse") k += (vnoise(u * 4, w * 180, 4, seed + 3) - 0.5) * 0.12;
    if (type === "tadelakt") k -= Math.pow(1 - Math.abs(Math.sin(Math.PI * (u * 2 + w + fbm(u, w, 4, 4, seed + 6) * 1.6))), 30) * 0.12;
    if (type === "stuc") k += Math.pow(1 - Math.abs(Math.sin(Math.PI * (u + w * 2 + fbm(u, w, 3, 5, seed + 7) * 2.4))), 40) * 0.1;
    if ((type === "beton-cire" || type === "microciment") && h2(x, y, seed + 1) > 0.9975) k *= 0.7;
    let c = mul(base, k);
    if (type === "argile" && vnoise(u * 300, w * 20, 300, seed + 8) > 0.93 && h2(x >> 2, y, seed) > 0.6) c = mixc(c, [196, 160, 96], 0.5);
    color[i * 4] = c[0]; color[i * 4 + 1] = c[1]; color[i * 4 + 2] = c[2]; color[i * 4 + 3] = 255;
    height[i] = d * (asp === "lisse" ? 0.2 : 0.35) + cl * 0.15;
    rough[i] = clamp01(r0 + (cl - 0.5) * 0.12);
  }
  return { size, period: 1, color, height, rough, params: P({ normalStrength: asp === "lisse" ? 0.25 : asp === "brosse" ? 0.8 : 0.5, clearcoat: type === "stuc" ? 0.5 : type === "tadelakt" ? 0.25 : 0, clearcoatRoughness: 0.12 }) };
}

/* ——— Tissus ——— */
async function genFabric(v: Variant, size: number): Promise<Surface> {
  const seed = hashStr(v.ref), mat = opt(v, "matiere")!.id, base = hex(opt(v, "couleur")!.hex!), n = size * size;
  const real = showroomTexture(`tx-${mat}`) ? `/textures/tx-${mat}/diff.webp` : mat === "lin" || mat === "coton" ? textureUrl("m-lin", "diff") : mat === "velours" ? textureUrl("m-velours", "diff") : mat === "jute" ? textureUrl("m-jute", "diff") : null;
  let L = real ? await lumaOf(real, size) : null;
  // Échelle réelle d'une répétition de chaque trame (m).
  let per = ({ lin: 0.25, coton: 0.15, velours: 0.25, cotele: 0.2, bouclette: 0.2, laine: 0.25, chine: 0.2, jute: 0.25 } as Record<string, number>)[mat] ?? 0.2;
  if (L && mat === "velours" && !showroomTexture("tx-velours")) for (let i = 0; i < L.length; i++) L[i] = 0.5 + (L[i]! - 0.5) * 0.35;
  if (L && mat === "coton" && !showroomTexture("tx-coton")) for (let i = 0; i < L.length; i++) L[i] = 0.5 + (L[i]! - 0.5) * 0.7;
  if (!L) {
    L = new Float32Array(n);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, w = y / size, i = y * size + x;
      if (mat === "cotele") { const rib = Math.pow(Math.abs(Math.sin(Math.PI * u * 60)), 0.6); L[i] = 0.3 + 0.5 * rib + (vnoise(u * 300, w * 300, 300, seed) - 0.5) * 0.08; }
      else if (mat === "coton") { const t = 96, a = Math.sin(Math.PI * u * t * 2), b = Math.sin(Math.PI * w * t * 2), over = ((Math.floor(u * t) + Math.floor(w * t)) % 2) ? a : b; L[i] = 0.5 + 0.18 * Math.abs(over) + (vnoise(u * 400, w * 400, 400, seed) - 0.5) * 0.12; }
      else if (mat === "bouclette") { const d = worley(u, w, 70, seed), d2 = worley(u, w, 140, seed + 1); L[i] = 0.35 + 0.45 * (1 - Math.min(1, d * 1.3)) * 0.8 + (1 - Math.min(1, d2 * 1.4)) * 0.2; }
      else { const tw = Math.sin(Math.PI * 2 * ((u + w) * 60)), heather = vnoise(u * 300, w * 40, 300, seed); L[i] = 0.5 + tw * 0.08 + (heather - 0.5) * 0.35; }
    }
    per = mat === "bouclette" ? 0.12 : mat === "cotele" ? 0.2 : 0.08;
  }
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n), rough = new Float32Array(n);
  const dark = (base[0] + base[1] + base[2]) / 3 < 80;
  for (let i = 0; i < n; i++) {
    const l = L[i]!, k = dark ? 0.75 + l * 0.6 : 0.62 + l * 0.76;
    color[i * 4] = base[0] * k; color[i * 4 + 1] = base[1] * k; color[i * 4 + 2] = base[2] * k; color[i * 4 + 3] = 255;
    height[i] = l; rough[i] = mat === "velours" ? 0.85 : 0.93;
  }
  const normalUrl = showroomTexture(`tx-${mat}`) ? `/textures/tx-${mat}/nor.webp` : real ? real.replace("/diff.webp", "/nor.webp") : undefined;
  return { size, period: per, color, height, rough, normalUrl, params: P({ normalStrength: mat === "bouclette" ? 3 : mat === "velours" ? 0.6 : mat === "cotele" ? 2.6 : 2, sheen: mat === "velours" || mat === "cotele" ? 1 : 0.45, sheenRoughness: mat === "velours" || mat === "cotele" ? 0.35 : 0.6 }) };
}

/* ——— Cuirs ——— */
async function genLeather(v: Variant, size: number): Promise<Surface> {
  const seed = hashStr(v.ref), type = opt(v, "type")!.id, base = hex(opt(v, "couleur")!.hex!), n = size * size;
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n), rough = new Float32Array(n);
  const key = type === "pleine-fleur" ? "tx-cuir" : type === "vieilli" ? "tx-cuir-vieilli" : type === "nubuck" ? "tx-nubuck" : "";
  const hide = key && showroomTexture(key) ? await lumaOf(`/textures/${key}/diff.webp`, size) : null;
  if (hide) {
    // Peau photographiée : son grain et ses nuances, teints dans la couleur choisie.
    const dark = (base[0] + base[1] + base[2]) / 3 < 70;
    for (let i = 0; i < n; i++) {
      const l = hide[i]!, k = dark ? 0.7 + l * 0.65 : 0.55 + l * 0.9;
      color[i * 4] = base[0] * k; color[i * 4 + 1] = base[1] * k; color[i * 4 + 2] = base[2] * k; color[i * 4 + 3] = 255;
      height[i] = l; rough[i] = clamp01((type === "nubuck" ? 0.92 : type === "vieilli" ? 0.42 : 0.5) + (0.5 - l) * 0.15);
    }
    return { size, period: 0.4, color, height, rough, normalUrl: `/textures/${key}/nor.webp`, params: P({ normalStrength: type === "nubuck" ? 0.9 : 2.2, sheen: type === "nubuck" ? 0.5 : 0, sheenRoughness: 0.5, clearcoat: type === "vieilli" ? 0.2 : 0.08, clearcoatRoughness: 0.3 }) };
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, u = x / size, w = y / size, cl = fbm(u, w, 4, 5, seed);
    let k = 1, h = 0.5, r = 0.5;
    if (type === "tresse") {
      const s = 10, a = u * s, b = w * s, ia = Math.floor(a), ib = Math.floor(b), over = (ia + ib) % 2 === 0;
      const t = over ? a - ia : b - ib, prof = Math.sin(Math.PI * t);
      k = 0.62 + 0.42 * prof + (over ? 0.04 : -0.04); h = prof * 0.9; r = 0.5 - prof * 0.1;
      k *= 1 + (vnoise(u * 160, w * 160, 160, seed) - 0.5) * 0.08;
    } else {
      const g = worley(u, w, type === "nubuck" ? 260 : 150, seed), crease = Math.pow(Math.min(1, g * 1.25), 0.6);
      h = crease * (type === "nubuck" ? 0.3 : 1);
      k = 0.82 + crease * 0.22 + (cl - 0.5) * (type === "vieilli" ? 0.45 : 0.14);
      if (type === "vieilli") k += smooth(0.6, 0.85, fbm(u, w, 6, 4, seed + 3)) * 0.18;
      if (type === "nubuck") k += (h2(x, y, seed) - 0.5) * 0.08;
      r = type === "nubuck" ? 0.95 : type === "vieilli" ? 0.42 : 0.52;
    }
    color[i * 4] = base[0] * k; color[i * 4 + 1] = base[1] * k; color[i * 4 + 2] = base[2] * k; color[i * 4 + 3] = 255;
    height[i] = h; rough[i] = clamp01(r + (cl - 0.5) * 0.1);
  }
  return { size, period: type === "tresse" ? 0.12 : 0.3, color, height, rough, params: P({ normalStrength: type === "tresse" ? 3 : type === "nubuck" ? 0.8 : 2.8, sheen: type === "nubuck" ? 0.5 : 0, sheenRoughness: 0.5, clearcoat: type === "vieilli" ? 0.25 : 0 }) };
}

/* ——— Métaux ——— */
function genMetal(v: Variant, size: number): Surface {
  const seed = hashStr(v.ref), base = hex(opt(v, "metal")!.hex!), fin = opt(v, "finition")!.id, n = size * size;
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n), rough = new Float32Array(n);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, u = x / size, w = y / size;
    // Brossage : une rayure par ligne de pixels, modulée lentement dans la longueur (aucun effet de moiré).
    const streak = h2(0, y, seed) * 0.5 + h2(1, y >> 1, seed) * 0.3 + vnoise(u * 3, w * 3, 3, seed + 1) * 0.2, cl = fbm(u, w, 4, 5, seed + 2);
    let c = base, h = 0.5, r = 0.08;
    if (fin === "brosse") { c = mul(base, 0.97 + streak * 0.06); h = streak * 0.12; r = 0.4 + streak * 0.08; }
    else if (fin === "vieilli") { const pat = smooth(0.45, 0.8, cl); c = mixc(mul(base, 0.8), mul(base, 0.45), pat); h = cl * 0.6 + streak * 0.2; r = 0.45 + pat * 0.25; }
    else { c = mul(base, 0.98 + (cl - 0.5) * 0.04); h = 0.5; r = 0.16 + (cl - 0.5) * 0.03; }
    // Albédo des métaux un peu retenu : sous la lumière du studio, ils restent profonds au lieu de saturer.
    color[i * 4] = c[0] * 0.8; color[i * 4 + 1] = c[1] * 0.8; color[i * 4 + 2] = c[2] * 0.8; color[i * 4 + 3] = 255;
    height[i] = h; rough[i] = clamp01(r);
  }
  return { size, period: 0.3, color, height, rough, params: P({ metalness: 1, normalStrength: fin === "brosse" ? 0.2 : fin === "vieilli" ? 1.2 : 0.1, anisotropy: fin === "brosse" ? 0.35 : 0 }) };
}

/* ——— Entrée ——— */
/** Calcule la surface d'une déclinaison (sans cache : voir surfaces.ts). */
export async function generateSurface(ref: string, size = 512): Promise<Surface | null> {
  const v = parseVariant(ref); if (!v) return null;
  switch (v.family.gen) {
    case "tile": return genTile(v, size);
    case "cement": return genCement(v, size);
    case "marble": return genMarble(v, size);
    case "terrazzo": return genTerrazzo(v, size);
    case "wood": return genWood(v, size);
    case "paint": return genPaint(v, size);
    case "plaster": return genPlaster(v, size);
    case "fabric": return genFabric(v, size);
    case "leather": return genLeather(v, size);
    case "metal": return genMetal(v, size);
  }
}

/** Carte de normales calculée en virgule flottante depuis le relief (pas d'escaliers sur les reflets). */
export function normalInto(s: Surface, d: Uint8ClampedArray) {
  const S = s.size, k = s.params.normalStrength * (S / 256);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, l = s.height[y * S + ((x + S - 1) % S)]!, r = s.height[y * S + ((x + 1) % S)]!, u = s.height[((y + S - 1) % S) * S + x]!, dn = s.height[((y + 1) % S) * S + x]!;
    const nx = -(r - l) * k, ny = (dn - u) * k, len = Math.hypot(nx, ny, 1);
    d[i * 4] = (nx / len * 0.5 + 0.5) * 255; d[i * 4 + 1] = (ny / len * 0.5 + 0.5) * 255; d[i * 4 + 2] = (1 / len * 0.5 + 0.5) * 255; d[i * 4 + 3] = 255;
  }
}

/**
 * Vignette « photographiée » : éclairage rasant d'atelier, reflets selon la rugosité, métal ou non.
 * Rendu sur toile 2D, sans carte graphique : rapide et identique partout.
 */
export function renderSwatch(s: Surface, out: HTMLCanvasElement, repeat = 1) {
  const W = out.width, H = out.height, x = out.getContext("2d")!, im = x.createImageData(W, H), d = im.data, S = s.size;
  const lx = -0.45, ly = -0.55, lz = 0.7, ll = Math.hypot(lx, ly, lz), Lx = lx / ll, Ly = ly / ll, Lz = lz / ll;
  const hx = Lx, hy = Ly, hz = Lz + 1, hl = Math.hypot(hx, hy, hz), Hx = hx / hl, Hy = hy / hl, Hz = hz / hl;
  const k = s.params.normalStrength * 3.2, metal = s.params.metalness > 0.5;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const sx = Math.floor((px / W) * S * repeat) % S, sy = Math.floor((py / H) * S * repeat) % S;
    const i = sy * S + sx, il = sy * S + ((sx + S - 1) % S), ir = sy * S + ((sx + 1) % S), iu = ((sy + S - 1) % S) * S + sx, id = ((sy + 1) % S) * S + sx;
    const nx = -(s.height[ir]! - s.height[il]!) * k, ny = -(s.height[id]! - s.height[iu]!) * k, nl = Math.hypot(nx, ny, 1);
    const Nx = nx / nl, Ny = ny / nl, Nz = 1 / nl;
    const diff = Math.max(0, Nx * Lx + Ny * Ly + Nz * Lz), r = s.rough[i]!, gloss = 1 - r;
    const spec = Math.pow(Math.max(0, Nx * Hx + Ny * Hy + Nz * Hz), 6 + gloss * gloss * 260) * (0.04 + gloss * 0.9);
    const env = 0.55 + 0.45 * (1 - (px / W + py / H) / 2);
    const vig = 1 - 0.18 * (((px / W - 0.42) ** 2 + (py / H - 0.4) ** 2) * 1.6);
    for (let c = 0; c < 3; c++) {
      const base = s.color[i * 4 + c]! / 255;
      const lit = metal ? base * (0.35 + 0.65 * env) * (0.6 + 0.6 * diff) + spec * base * 1.6 + spec * 0.25 : base * (0.42 + 0.68 * diff) + spec * (0.9 + s.params.clearcoat * 0.6);
      d[(py * W + px) * 4 + c] = Math.min(255, Math.pow(Math.max(0, lit * vig), 1 / 1.04) * 255);
    }
    d[(py * W + px) * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0);
}

export { rgbOf };
