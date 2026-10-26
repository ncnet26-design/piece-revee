/**
 * Illustrations dessinées dans le navigateur (canvas) : vignettes de matières et scènes de pièces ou de jardins.
 * Elles servent de visuels de repli tant que les photos libres de droits ne sont pas importées.
 */
import type { TextureKind } from "@/content/types";

type Ctx = CanvasRenderingContext2D;
type Rand = () => number;

export function rng(seed: number): Rand {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export function hashStr(t: string): number { let h = 2166136261; for (const ch of t) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const hx = (hex: string): [number, number, number] => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const rgba = (hex: string, a: number) => { const [r, g, b] = hx(hex); return `rgba(${r},${g},${b},${a})`; };
export const shade = (hex: string, amt: number) => { const [r, g, b] = hx(hex).map((v) => Math.max(0, Math.min(255, v + amt))) as [number, number, number]; return `rgb(${r | 0},${g | 0},${b | 0})`; };
const pick = <T,>(arr: readonly T[], R: Rand): T => arr[Math.floor(R() * arr.length)] as T;

function grain(x: Ctx, R: Rand, W: number, H: number, a: number) {
  const img = x.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = (R() - .5) * 255 * a; d[i]! += v; d[i + 1]! += v; d[i + 2]! += v; }
  x.putImageData(img, 0, 0);
}
function blotches(x: Ctx, R: Rand, W: number, H: number, col: string, n: number, rmin: number, rmax: number, a: number) {
  for (let i = 0; i < n; i++) {
    const cx = R() * W, cy = R() * H, r = rmin + R() * (rmax - rmin);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
}
function rr(x: Ctx, X: number, Y: number, w: number, h: number, r: number) { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); x.fill(); }

/* ———————— Matières ———————— */
type Painter = (x: Ctx, R: Rand, W: number, H: number, c: readonly string[]) => void;
const c0 = (c: readonly string[]) => c[0] ?? "#cccccc";
const c1 = (c: readonly string[]) => c[1] ?? c0(c);
const c2 = (c: readonly string[]) => c[2] ?? c1(c);

const PAINT: Record<TextureKind, Painter> = {
  travertine(x, R, W, H, c) { x.fillStyle = c0(c); x.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 2) { x.fillStyle = rgba(R() < .5 ? c1(c) : c2(c), .08 + .08 * Math.sin(y * .05 + R() * 2)); x.fillRect(0, y, W, 1.5 + R() * 2); }
    for (let i = 0; i < 70; i++) { x.fillStyle = rgba(c2(c), .35 + R() * .3); x.beginPath(); x.ellipse(R() * W, R() * H, 4 + R() * 18, 1 + R() * 3, 0, 0, 7); x.fill(); }
    grain(x, R, W, H, .05); },
  marble(x, R, W, H, c) { x.fillStyle = c0(c); x.fillRect(0, 0, W, H); blotches(x, R, W, H, c2(c), 22, 40, 130, .18);
    for (let v = 0; v < 7; v++) { let px = R() * W, py = -10, ang = Math.PI / 2 + (R() - .5) * 1.2; x.strokeStyle = rgba(c1(c), .35 + R() * .45); x.lineWidth = .6 + R() * 2.6; x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < 80; s++) { ang += (R() - .5) * .45; px += Math.cos(ang) * 6; py += Math.sin(ang) * 6; x.lineTo(px, py); } x.stroke(); }
    grain(x, R, W, H, .03); },
  terrazzo(x, R, W, H, c) { x.fillStyle = c0(c); x.fillRect(0, 0, W, H); grain(x, R, W, H, .05);
    for (let i = 0; i < 260; i++) { const col = c[1 + Math.floor(R() * (c.length - 1))] ?? c1(c); const px = R() * W, py = R() * H, r = 1.5 + Math.pow(R(), 3) * 16; x.fillStyle = col; x.globalAlpha = .75 + R() * .25;
      x.beginPath(); const k = 4 + Math.floor(R() * 4); for (let j = 0; j < k; j++) { const a = j / k * 6.283 + R() * .6, rr2 = r * (.6 + R() * .5); x.lineTo(px + Math.cos(a) * rr2, py + Math.sin(a) * rr2); } x.closePath(); x.fill(); }
    x.globalAlpha = 1; },
  tile(x, R, W, H, c) { const n = 10, tw = W / n, th = H / n; x.fillStyle = "#d9d6cc"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const X = i * tw + 1.2, Y = j * th + 1.2, w = tw - 2.4, h = th - 2.4; x.fillStyle = shade(pick(c, R), (R() - .5) * 16); x.fillRect(X, Y, w, h);
      const g = x.createLinearGradient(X, Y, X + w, Y + h); g.addColorStop(0, "rgba(255,255,255,.28)"); g.addColorStop(.45, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.18)"); x.fillStyle = g; x.fillRect(X, Y, w, h); } },
  cement(x, R, W, H, c) { const n = 4, s = W / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const X = i * s, Y = j * s; x.fillStyle = c0(c); x.fillRect(X, Y, s, s);
      for (const [cx, cy] of [[X, Y], [X + s, Y], [X, Y + s], [X + s, Y + s]] as const) { x.fillStyle = c1(c); x.beginPath(); x.arc(cx, cy, s * .42, 0, 7); x.fill(); x.fillStyle = c0(c); x.beginPath(); x.arc(cx, cy, s * .3, 0, 7); x.fill(); }
      x.fillStyle = c2(c); x.beginPath(); x.moveTo(X + s / 2, Y + s * .22); x.lineTo(X + s * .78, Y + s / 2); x.lineTo(X + s / 2, Y + s * .78); x.lineTo(X + s * .22, Y + s / 2); x.closePath(); x.fill();
      x.strokeStyle = "rgba(0,0,0,.12)"; x.strokeRect(X, Y, s, s); }
    grain(x, R, W, H, .04); },
  hex(x, R, W, H, c) { x.fillStyle = "#cbbfae"; x.fillRect(0, 0, W, H); const r = 22, hw = Math.sqrt(3) * r;
    for (let row = -1; row < H / (r * 1.5) + 1; row++) for (let col = -1; col < W / hw + 1; col++) { const cx = col * hw + (row % 2 ? hw / 2 : 0), cy = row * r * 1.5; x.fillStyle = shade(pick(c, R), (R() - .5) * 30); x.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; x.lineTo(cx + Math.cos(a) * (r - 1.5), cy + Math.sin(a) * (r - 1.5)); } x.closePath(); x.fill(); }
    grain(x, R, W, H, .07); },
  wood(x, R, W, H, c) { const pw = W / 3;
    for (let p = 0; p < 3; p++) { const X = p * pw, off = R() * 100; x.fillStyle = shade(c0(c), (R() - .5) * 20); x.fillRect(X, 0, pw, H);
      for (let k = 0; k < 55; k++) { const x0 = X + R() * pw; x.strokeStyle = rgba(R() < .5 ? c1(c) : c2(c), .25 + R() * .35); x.lineWidth = .5 + R() * 1.6; x.beginPath();
        for (let y = 0; y <= H; y += 6) { const xx = x0 + Math.sin((y + off) * .02 + k) * 6 + Math.sin(y * .11 + k * 3) * 1.5; if (y) x.lineTo(xx, y); else x.moveTo(xx, y); } x.stroke(); }
      x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(X, 0, 1, H); }
    grain(x, R, W, H, .04); },
  planks(x, R, W, H, c) { const ph = H / 6;
    for (let p = 0; p < 6; p++) { const Y = p * ph; x.fillStyle = shade(pick(c, R), (R() - .5) * 18); x.fillRect(0, Y, W, ph);
      for (let k = 0; k < 30; k++) { x.strokeStyle = rgba(c2(c), .2 + R() * .3); x.lineWidth = .5 + R(); x.beginPath(); const y0 = Y + R() * ph; x.moveTo(0, y0); for (let xx = 0; xx <= W; xx += 8) x.lineTo(xx, y0 + Math.sin(xx * .03 + k) * 2); x.stroke(); }
      x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(0, Y, W, 1.5); const cut = R() * W; x.fillRect(cut, Y, 1.5, ph); }
    grain(x, R, W, H, .04); },
  cork(x, R, W, H, c) { x.fillStyle = c0(c); x.fillRect(0, 0, W, H); for (let i = 0; i < 5000; i++) { x.fillStyle = rgba(R() < .5 ? c1(c) : c2(c), .3 + R() * .5); const s = .6 + R() * 2.4; x.fillRect(R() * W, R() * H, s, s); } },
  cane(x, R, W, H, c) { x.fillStyle = c2(c); x.fillRect(0, 0, W, H); const g = 18; x.lineCap = "round";
    for (const [dx, dy, col] of [[1, 0, c0(c)], [0, 1, c0(c)], [1, 1, c1(c)], [1, -1, c1(c)]] as const) { x.strokeStyle = col; x.lineWidth = 3.2;
      for (let k = -W; k < W * 2; k += g) { x.beginPath(); if (dx && !dy) { x.moveTo(0, k); x.lineTo(W, k); } else if (dy && !dx) { x.moveTo(k, 0); x.lineTo(k, H); } else if (dy > 0) { x.moveTo(k, 0); x.lineTo(k + H, H); } else { x.moveTo(k, H); x.lineTo(k + H, 0); } x.stroke(); } }
    x.fillStyle = c2(c); for (let i = 0; i < W; i += g) for (let j = 0; j < H; j += g) { x.beginPath(); x.arc(i + g / 2, j + g / 2, 3.4, 0, 7); x.fill(); }
    grain(x, R, W, H, .05); },
  weave(x, R, W, H, c) { x.fillStyle = c0(c); x.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 2) { x.fillStyle = rgba(R() < .5 ? c1(c) : c2(c), .25 + R() * .4); x.fillRect(0, y, W, 1); }
    for (let i = 0; i < W; i += 2) { x.fillStyle = rgba(R() < .5 ? c1(c) : c2(c), .15 + R() * .3); x.fillRect(i, 0, 1, H); } },
  boucle(x, R, W, H, c) { x.fillStyle = c1(c); x.fillRect(0, 0, W, H);
    for (let i = 0; i < 2400; i++) { const px = R() * W, py = R() * H, r = 1.5 + R() * 3; x.strokeStyle = R() < .5 ? c0(c) : c2(c); x.lineWidth = 1 + R(); x.beginPath(); x.arc(px, py, r, 0, 7); x.stroke(); x.strokeStyle = "rgba(0,0,0,.08)"; x.beginPath(); x.arc(px + .8, py + .8, r, 0, 3); x.stroke(); } },
  cord(x, R, W, H, c) { for (let i = 0; i < W; i += 7) { const g = x.createLinearGradient(i, 0, i + 7, 0); g.addColorStop(0, c1(c)); g.addColorStop(.5, c2(c)); g.addColorStop(1, c1(c)); x.fillStyle = g; x.fillRect(i, 0, 7, H); } grain(x, R, W, H, .06); },
  metal(x, R, W, H, c) { const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, c1(c)); g.addColorStop(.45, c2(c)); g.addColorStop(.6, c0(c)); g.addColorStop(1, c1(c)); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y++) { x.fillStyle = rgba(R() < .5 ? "#ffffff" : "#000000", R() * .08); x.fillRect(0, y, W, 1); } },
  plaster(x, R, W, H, c) { x.fillStyle = c0(c); x.fillRect(0, 0, W, H); blotches(x, R, W, H, c1(c), 40, 30, 120, .22); blotches(x, R, W, H, c2(c), 30, 20, 90, .25); grain(x, R, W, H, .035); },
  fluted(x, R, W, H, c) { x.fillStyle = c1(c); x.fillRect(0, 0, W, H); blotches(x, R, W, H, "#ffffff", 6, 60, 140, .3);
    for (let i = 0; i < W; i += 12) { const g = x.createLinearGradient(i, 0, i + 12, 0); g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(.35, "rgba(255,255,255,.05)"); g.addColorStop(.8, "rgba(0,0,0,.12)"); g.addColorStop(1, "rgba(255,255,255,.4)"); x.fillStyle = g; x.fillRect(i, 0, 12, H); } },
  lacquer(x, R, W, H, c) { const g = x.createLinearGradient(0, 0, W * .8, H); g.addColorStop(0, c2(c)); g.addColorStop(.5, c0(c)); g.addColorStop(1, c1(c)); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const h = x.createLinearGradient(0, H * .2, 0, H * .45); h.addColorStop(0, "rgba(255,255,255,0)"); h.addColorStop(.5, "rgba(255,255,255,.35)"); h.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = h; x.fillRect(0, H * .2, W, H * .25); grain(x, R, W, H, .01); },
  leather(x, R, W, H, c) { x.fillStyle = c0(c); x.fillRect(0, 0, W, H); blotches(x, R, W, H, c1(c), 30, 30, 100, .3); blotches(x, R, W, H, c2(c), 20, 20, 70, .25);
    x.strokeStyle = "rgba(0,0,0,.12)"; x.lineWidth = .6; for (let i = 0; i < 400; i++) { const px = R() * W, py = R() * H; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (R() - .5) * 8, py + (R() - .5) * 8); x.stroke(); } grain(x, R, W, H, .05); },
  raffia(x, R, W, H, c) { x.fillStyle = c1(c); x.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 4) { for (let xx = 0; xx < W;) { const w = 10 + R() * 40; x.fillStyle = shade(R() < .5 ? c0(c) : c2(c), (R() - .5) * 30); x.fillRect(xx, y + (R() - .5), w, 3.2); xx += w + 1 + R() * 2; } } },
  washi(x, R, W, H, c) { x.fillStyle = c0(c); x.fillRect(0, 0, W, H); blotches(x, R, W, H, c2(c), 20, 40, 120, .35); x.strokeStyle = rgba(c1(c), .6); x.lineWidth = .5;
    for (let i = 0; i < 300; i++) { let px = R() * W, py = R() * H, a = R() * 7; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 6; s++) { a += R() - .5; px += Math.cos(a) * 4; py += Math.sin(a) * 4; x.lineTo(px, py); } x.stroke(); } },
  brick(x, R, W, H, c) { x.fillStyle = "#d8d0c4"; x.fillRect(0, 0, W, H); const bh = H / 9, bw = W / 3.2;
    for (let row = 0; row < 10; row++) { const off = row % 2 ? -bw / 2 : 0; for (let col = -1; col < 5; col++) { x.fillStyle = shade(pick(c, R), (R() - .5) * 26); x.fillRect(off + col * bw + 2, row * bh + 2, bw - 4, bh - 4); } }
    grain(x, R, W, H, .07); },
  slate(x, R, W, H, c) { x.fillStyle = c0(c); x.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 3) { x.fillStyle = rgba(R() < .5 ? c1(c) : c2(c), .3 + R() * .4); x.fillRect(0, y, W, 1 + R() * 3); }
    x.strokeStyle = "rgba(0,0,0,.25)"; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, R() * H); x.lineTo(W, R() * H); x.stroke(); } grain(x, R, W, H, .05); },
  gravel(x, R, W, H, c) { x.fillStyle = c1(c); x.fillRect(0, 0, W, H);
    for (let i = 0; i < 1600; i++) { x.fillStyle = shade(pick(c, R), (R() - .5) * 40); x.beginPath(); x.ellipse(R() * W, R() * H, 2 + R() * 5, 1.5 + R() * 4, R() * 3, 0, 7); x.fill(); }
    grain(x, R, W, H, .04); },
};

export function paintMaterial(cv: HTMLCanvasElement, texture: TextureKind, colors: readonly string[], seedKey: string): void {
  const x = cv.getContext("2d", { willReadFrequently: true }); if (!x) return;
  const W = cv.width, H = cv.height, base = 360;
  x.save(); x.scale(W / base, H / base);
  try { PAINT[texture](x, rng(hashStr(seedKey)), base, base, colors); }
  catch { x.fillStyle = colors[0] ?? "#ccc"; x.fillRect(0, 0, base, base); }
  x.restore();
}

/* ———————— Scènes ———————— */
export interface SceneSpec { scope: "interieur" | "exterieur"; space: string; palette: readonly string[]; seed: number; bare?: boolean }

export function paintScene(cv: HTMLCanvasElement, s: SceneSpec): void {
  const x = cv.getContext("2d", { willReadFrequently: true }); if (!x) return;
  if (s.scope === "exterieur") drawGarden(x, cv.width, cv.height, s); else drawRoom(x, cv.width, cv.height, s);
}

function drawRoom(x: Ctx, W: number, H: number, s: SceneSpec) {
  const R = rng(s.seed), p = s.palette, wall = p[0] ?? "#eee", wood = p[1] ?? "#c9a", main = p[2] ?? "#888", dark = p[3] ?? "#333", acc = p[4] ?? main, hz = H * .64, kind = s.space;
  const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, shade(wall, 14)); g.addColorStop(1, shade(wall, -16)); x.fillStyle = g; x.fillRect(0, 0, W, hz);
  x.fillStyle = shade(wall, -24); x.fillRect(0, hz - 6, W, 6);
  const fg = x.createLinearGradient(0, hz, 0, H); fg.addColorStop(0, shade(wood, -8)); fg.addColorStop(1, shade(wood, 12)); x.fillStyle = fg; x.fillRect(0, hz, W, H - hz);
  x.strokeStyle = rgba(dark, .1); x.lineWidth = 1;
  if (kind === "Salle de bain" || kind === "Cuisine") { for (let i = 0; i <= 12; i++) { x.beginPath(); x.moveTo(W / 2 + (i - 6) * W * .03, hz); x.lineTo(W / 2 + (i - 6) * W * .2, H); x.stroke(); } for (let k = 1; k < 5; k++) { const y = hz + (H - hz) * Math.pow(k / 5, 1.6); x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); } }
  else for (let i = -14; i <= 14; i++) { x.beginPath(); x.moveTo(W / 2 + i * W * .025, hz); x.lineTo(W / 2 + i * W * .16, H); x.stroke(); }
  const wx = W * .07, wy = H * .1, ww = W * .2, wh = hz * .72;
  const sk = x.createLinearGradient(0, wy, 0, wy + wh); sk.addColorStop(0, "#CFE0EA"); sk.addColorStop(1, "#F4EBDD"); x.fillStyle = sk; x.fillRect(wx, wy, ww, wh);
  x.fillStyle = "#9DB08A"; x.beginPath(); x.ellipse(wx + ww * .4, wy + wh * .95, ww * .5, wh * .22, 0, Math.PI, 0); x.fill();
  x.strokeStyle = shade(wall, 30); x.lineWidth = Math.max(3, W * .008); x.strokeRect(wx, wy, ww, wh); x.beginPath(); x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh); x.stroke();
  const lb = x.createLinearGradient(wx, hz, W * .6, H); lb.addColorStop(0, "rgba(255,244,220,.35)"); lb.addColorStop(1, "rgba(255,244,220,0)"); x.fillStyle = lb;
  x.beginPath(); x.moveTo(wx, wy + wh); x.lineTo(wx + ww, wy + wh); x.lineTo(W * .62, H); x.lineTo(W * .12, H); x.closePath(); x.fill();
  if (s.bare) { x.fillStyle = rgba(dark, .25); rr(x, W * .5, hz - H * .16, W * .3, H * .2, 6); x.fillStyle = rgba(dark, .18); x.fillRect(W * .82, hz - H * .3, W * .08, H * .34); x.fillStyle = "rgba(0,0,0,.08)"; x.fillRect(0, 0, W, H); grain(x, R, W, H, .05); return; }
  x.fillStyle = dark; x.fillRect(W * .47, H * .12, W * .2, H * .22); x.fillStyle = acc; x.fillRect(W * .48, H * .135, W * .18, H * .19); x.fillStyle = rgba(main, .8); x.beginPath(); x.arc(W * .57, H * .22, H * .06, 0, 7); x.fill();
  x.strokeStyle = dark; x.lineWidth = 2; x.beginPath(); x.moveTo(W * .36, 0); x.lineTo(W * .36, H * .16); x.stroke(); x.fillStyle = shade(acc, 20); x.beginPath(); x.ellipse(W * .36, H * .18, W * .05, H * .04, 0, Math.PI, 0); x.fill();
  const gl = x.createRadialGradient(W * .36, H * .2, 2, W * .36, H * .2, W * .2); gl.addColorStop(0, "rgba(255,230,180,.35)"); gl.addColorStop(1, "rgba(255,230,180,0)"); x.fillStyle = gl; x.fillRect(0, 0, W, H);
  x.fillStyle = rgba(acc, .85); x.beginPath(); x.ellipse(W * .6, H * .86, W * .28, H * .07, 0, 0, 7); x.fill();
  if (kind === "Chambre") { x.fillStyle = shade(wood, -30); rr(x, W * .38, hz - H * .2, W * .44, H * .26, 8); x.fillStyle = main; rr(x, W * .36, hz - H * .02, W * .48, H * .2, 10); x.fillStyle = shade(main, 30); rr(x, W * .41, hz - H * .08, W * .14, H * .1, 8); rr(x, W * .63, hz - H * .08, W * .14, H * .1, 8); x.fillStyle = acc; rr(x, W * .36, hz + H * .08, W * .48, H * .06, 6); }
  else if (kind === "Cuisine") { x.fillStyle = main; x.fillRect(W * .32, hz - H * .24, W * .66, H * .24); x.fillStyle = shade(main, -25); for (let i = 0; i < 5; i++) x.fillRect(W * .33 + i * W * .13, hz - H * .22, W * .12, H * .2); x.fillStyle = shade(acc, 10); x.fillRect(W * .32, hz - H * .26, W * .66, H * .025); x.fillStyle = shade(wood, -20); x.fillRect(W * .4, hz + H * .02, W * .36, H * .17); x.fillStyle = shade(wall, -6); x.fillRect(W * .38, hz, W * .4, H * .03); }
  else if (kind === "Salle de bain") { for (let i = 0; i < 10; i++) for (let j = 0; j < 6; j++) { x.fillStyle = shade(acc, (R() - .5) * 24); x.fillRect(W * .42 + i * W * .055, H * .16 + j * H * .07, W * .052, H * .066); } x.fillStyle = "#F4F2EE"; rr(x, W * .42, hz - H * .12, W * .5, H * .22, 30); x.fillStyle = shade(wood, -10); x.fillRect(W * .3, hz - H * .16, W * .1, H * .2); }
  else if (kind === "Bureau") { x.fillStyle = shade(wood, -30); x.fillRect(W * .4, hz - H * .06, W * .4, H * .03); x.fillRect(W * .42, hz - H * .03, W * .02, H * .2); x.fillRect(W * .76, hz - H * .03, W * .02, H * .2); x.fillStyle = main; rr(x, W * .52, hz, W * .12, H * .16, 8); x.fillStyle = dark; x.fillRect(W * .82, H * .14, W * .14, hz - H * .14); x.fillStyle = acc; for (let k = 0; k < 4; k++) x.fillRect(W * .83, H * .18 + k * H * .11, W * .12, H * .02); }
  else if (kind === "Entrée") { x.fillStyle = shade(wood, -25); x.fillRect(W * .45, hz - H * .12, W * .34, H * .12); x.fillStyle = main; x.beginPath(); x.ellipse(W * .62, H * .3, W * .08, H * .13, 0, 0, 7); x.fill(); x.fillStyle = shade(wall, 30); x.beginPath(); x.ellipse(W * .62, H * .3, W * .065, H * .11, 0, 0, 7); x.fill(); }
  else { x.fillStyle = shade(main, -30); rr(x, W * .4, hz - H * .12, W * .44, H * .18, 14); x.fillStyle = main; rr(x, W * .4, hz - H * .02, W * .44, H * .14, 12); x.fillStyle = shade(main, 18); rr(x, W * .44, hz - H * .09, W * .12, H * .1, 10); rr(x, W * .68, hz - H * .09, W * .12, H * .1, 10);
    x.fillStyle = shade(wood, -28); x.beginPath(); x.ellipse(W * .62, hz + H * .2, W * .1, H * .03, 0, 0, 7); x.fill(); x.fillRect(W * .615, hz + H * .2, W * .01, H * .06); }
  const px = W * .9, py = hz + H * .04; x.fillStyle = shade(wood, -35); rr(x, px - W * .035, py, W * .07, H * .1, 4);
  for (let i = 0; i < 9; i++) { x.fillStyle = R() < .5 ? "#5E7A4E" : "#7C9563"; x.beginPath(); x.ellipse(px + (R() - .5) * W * .07, py - H * .05 - R() * H * .18, W * .02, H * .06, (R() - .5) * 1.5, 0, 7); x.fill(); }
  const vg = x.createRadialGradient(W / 2, H / 2, W * .3, W / 2, H / 2, W * .75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.18)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  grain(x, R, W, H, .035);
}

function drawGarden(x: Ctx, W: number, H: number, s: SceneSpec) {
  const R = rng(s.seed), p = s.palette, sky = p[0] ?? "#eee", deck = p[1] ?? "#a87", green = p[2] ?? "#6a5", flower = p[3] ?? "#a8b", accent = p[4] ?? "#789", hz = H * .46, kind = s.space;
  const sg = x.createLinearGradient(0, 0, 0, hz); sg.addColorStop(0, "#BFD6E6"); sg.addColorStop(1, shade(sky, 8)); x.fillStyle = sg; x.fillRect(0, 0, W, hz);
  if (kind === "Balcon") { x.fillStyle = "#B8B3AA"; x.fillRect(0, hz * .3, W, hz * .7); for (let i = 0; i < 7; i++) { x.fillStyle = shade("#B8B3AA", -10); x.fillRect(W * .04 + i * W * .14, hz * .42, W * .07, hz * .3); } }
  else for (let i = 0; i < 14; i++) { x.fillStyle = shade(green, -30 + R() * 30); x.beginPath(); x.ellipse(R() * W, hz - R() * H * .08, W * (.06 + R() * .08), H * (.08 + R() * .1), 0, 0, 7); x.fill(); }
  const gg = x.createLinearGradient(0, hz, 0, H);
  if (s.bare) { gg.addColorStop(0, "#9C9A7E"); gg.addColorStop(1, "#B5AE92"); } else { gg.addColorStop(0, shade(green, -10)); gg.addColorStop(1, shade(green, 16)); }
  x.fillStyle = gg; x.fillRect(0, hz, W, H - hz);
  if (s.bare) { x.fillStyle = rgba("#6B6656", .35); for (let i = 0; i < 40; i++) x.fillRect(R() * W, hz + R() * (H - hz), W * .04, 2); x.fillStyle = "#8E8A80"; x.fillRect(W * .3, hz + H * .12, W * .5, H * .24); x.fillStyle = "rgba(0,0,0,.08)"; x.fillRect(0, 0, W, H); grain(x, R, W, H, .05); return; }
  const tx = W * .28, ty = hz + H * .1;
  if (kind === "Jardin" || kind === "Cour") { x.fillStyle = shade(deck, 20); x.beginPath(); x.moveTo(W * .45, hz); x.lineTo(W * .55, hz); x.lineTo(W * .75, H); x.lineTo(W * .25, H); x.closePath(); x.fill(); for (let i = 0; i < 200; i++) { x.fillStyle = "rgba(0,0,0,.08)"; x.fillRect(W * .3 + R() * W * .4, hz + R() * (H - hz), 2, 2); } }
  else { x.fillStyle = deck; x.fillRect(tx - W * .2, ty, W * .92, H - ty); x.strokeStyle = "rgba(0,0,0,.15)"; x.lineWidth = 1; for (let y = ty; y < H; y += H * .035) { x.beginPath(); x.moveTo(tx - W * .2, y); x.lineTo(W, y); x.stroke(); } }
  if (kind === "Abords de piscine") { x.fillStyle = "#5FA8C7"; rr(x, W * .3, H * .62, W * .55, H * .22, 6); x.fillStyle = "rgba(255,255,255,.35)"; for (let i = 0; i < 8; i++) x.fillRect(W * .33 + R() * W * .48, H * .65 + R() * H * .17, W * .06, 2); }
  if (kind === "Terrasse") { x.strokeStyle = shade(deck, -40); x.lineWidth = Math.max(4, W * .012); x.beginPath(); x.moveTo(W * .3, hz - H * .22); x.lineTo(W * .3, ty + H * .08); x.moveTo(W * .9, hz - H * .22); x.lineTo(W * .9, ty + H * .08); x.moveTo(W * .26, hz - H * .22); x.lineTo(W * .95, hz - H * .22); x.stroke(); x.lineWidth = 2; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(W * .3 + i * W * .075, hz - H * .25); x.lineTo(W * .3 + i * W * .075, hz - H * .19); x.stroke(); } }
  if (kind !== "Jardin") { x.fillStyle = accent; rr(x, W * .5, ty + H * .06, W * .16, H * .03, 4); x.fillRect(W * .57, ty + H * .09, W * .02, H * .1); x.fillStyle = shade(accent, -20); rr(x, W * .43, ty + H * .1, W * .06, H * .1, 4); rr(x, W * .68, ty + H * .1, W * .06, H * .1, 4); }
  const beds: [number, number][] = kind === "Balcon" ? [[.1, .86], [.9, .86], [.18, .72]] : [[.08, .7], [.18, .84], [.86, .68], [.94, .84], [.4, .6]];
  for (const [bx, by] of beds) {
    if (kind === "Balcon" || kind === "Terrasse") { x.fillStyle = shade(deck, -30); rr(x, W * bx - W * .05, H * by, W * .1, H * .1, 4); }
    for (let i = 0; i < 14; i++) { x.fillStyle = R() < .6 ? shade(green, -15 + R() * 25) : flower; x.beginPath(); x.ellipse(W * bx + (R() - .5) * W * .12, H * by - R() * H * .12, W * (.012 + R() * .02), H * (.02 + R() * .03), 0, 0, 7); x.fill(); }
    for (let i = 0; i < 10; i++) { x.strokeStyle = shade(green, 10); x.lineWidth = 1.5; x.beginPath(); const sx = W * bx + (R() - .5) * W * .1; x.moveTo(sx, H * by); x.quadraticCurveTo(sx + (R() - .5) * 20, H * by - H * .08, sx + (R() - .5) * 30, H * by - H * .14); x.stroke(); }
  }
  x.fillStyle = shade(deck, -50); x.fillRect(W * .2, hz - H * .12, W * .012, H * .2);
  for (let i = 0; i < 10; i++) { x.fillStyle = shade(green, -5 + R() * 20); x.beginPath(); x.ellipse(W * .205 + (R() - .5) * W * .12, hz - H * .16 - R() * H * .1, W * .04, H * .04, 0, 0, 7); x.fill(); }
  const sun = x.createRadialGradient(W * .85, H * .05, 5, W * .85, H * .05, W * .5); sun.addColorStop(0, "rgba(255,236,190,.4)"); sun.addColorStop(1, "rgba(255,236,190,0)"); x.fillStyle = sun; x.fillRect(0, 0, W, H);
  grain(x, R, W, H, .035);
}

/** Visuel de lieu : composition graphique à partir de sa palette (jamais une photo protégée). */
export function paintPlace(cv: HTMLCanvasElement, palette: readonly string[], seedKey: string): void {
  const x = cv.getContext("2d", { willReadFrequently: true }); if (!x) return;
  const W = cv.width, H = cv.height, R = rng(hashStr(seedKey)), [a = "#eee", b = "#456", c = "#ca8", d = "#222"] = palette;
  const sky = x.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, shade(a, 10)); sky.addColorStop(1, shade(a, -14)); x.fillStyle = sky; x.fillRect(0, 0, W, H);
  const motif = Math.floor(R() * 4);
  if (motif === 0) { x.fillStyle = c; x.fillRect(0, H * .78, W, H * .22); for (let i = 0; i < 3; i++) { const X = W * (.12 + i * .28), w = W * .2, top = H * .3; x.fillStyle = b; x.beginPath(); x.moveTo(X, H * .78); x.lineTo(X, top + w / 2); x.arc(X + w / 2, top + w / 2, w / 2, Math.PI, 0); x.lineTo(X + w, H * .78); x.closePath(); x.fill(); } }
  else if (motif === 1) { x.fillStyle = c; x.fillRect(0, H * .8, W, H * .2); [[.1, .4, .35, .4], [.4, .25, .3, .55], [.66, .48, .24, .32]].forEach(([X, Y, w, h], i) => { x.fillStyle = i === 1 ? b : shade(a, -8 - i * 6); x.fillRect(X! * W, Y! * H, w! * W, h! * H); x.fillStyle = d; x.fillRect(X! * W + 12, Y! * H + 20, w! * W * .5, 10); }); }
  else if (motif === 2) { x.fillStyle = b; x.fillRect(0, 0, W, H * .4); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? a : shade(a, -18); x.fillRect(W * (.1 + i * .08), H * (.4 + i * .06), W * (.9 - i * .08), H * .06); } x.fillStyle = c; x.fillRect(W * .04, H * .18, W * .22, H * .22); }
  else { x.fillStyle = b; x.fillRect(0, H * .62, W, H * .38); x.fillStyle = a; x.fillRect(W * .08, H * .28, W * .62, H * .36); x.fillStyle = d; x.fillRect(W * .14, H * .36, W * .42, H * .12); x.fillStyle = c; x.fillRect(W * .08, H * .62, W * .62, 6); }
  grain(x, R, W, H, .04);
}
