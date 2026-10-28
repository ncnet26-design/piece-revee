/**
 * Rendus du parcours « Transformer » : planche projet en haute définition et film en motion design.
 * Tout est calculé dans le navigateur (aucun envoi), avec les polices du site.
 */
import type { StyleTheme } from "@/content/types";
import type { BoardItem } from "@/lib/board/state";
import { TIERS, type Pick, type Room, type Tier } from "./match";

export interface ProjectData {
  title: string;
  room: Room;
  style: StyleTheme;
  tier: Tier;
  photo: HTMLImageElement;
  inspirations: HTMLImageElement[];
  palette: Array<{ hex: string; name: string }>;
  picks: Pick[];
  samples: Map<string, CanvasImageSource>;
  board: HTMLImageElement | null;
  budget: { low: number; high: number };
  /** Rendu photoréaliste de la pièce transformée (service d'images IA), s'il a été créé. */
  after?: HTMLImageElement | null;
}

const IVORY = "#F4F0E8", INK = "#161512", BRONZE = "#7B5831", MUTED = "#6F675D", SERIF = '"Instrument Serif", Georgia, serif', SANS = '"Onest", system-ui, sans-serif';
export const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = () => rej(new Error("image illisible")); i.src = src; });
}
export async function fontsReady() {
  try { await Promise.all([document.fonts.load(`120px ${SERIF}`), document.fonts.load(`italic 120px ${SERIF}`), document.fonts.load(`500 40px ${SANS}`), document.fonts.load(`600 40px ${SANS}`)]); await document.fonts.ready; } catch { /* polices système */ }
}

/* ——— Dessin ——— */
type Ctx = CanvasRenderingContext2D;
function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) { c.beginPath(); c.roundRect(x, y, w, h, r); }
/** Image en « cover » dans un cadre, avec zoom et point focal. */
function cover(c: Ctx, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number, zoom = 1, fx = 0.5, fy = 0.5) {
  const iw = (img as HTMLImageElement).naturalWidth || img.width, ih = (img as HTMLImageElement).naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih) * zoom, dw = iw * s, dh = ih * s;
  c.drawImage(img, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh);
}
function framed(c: Ctx, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number, r: number, zoom = 1, shadow = true) {
  c.save();
  if (shadow) { c.shadowColor = "rgba(40,30,20,.28)"; c.shadowBlur = w * 0.06; c.shadowOffsetY = w * 0.02; rr(c, x, y, w, h, r); c.fillStyle = "#fff"; c.fill(); c.shadowColor = "transparent"; }
  rr(c, x, y, w, h, r); c.clip(); cover(c, img, x, y, w, h, zoom); c.restore();
}
function text(c: Ctx, s: string, x: number, y: number, font: string, color: string, opts: { align?: CanvasTextAlign; spacing?: number; maxW?: number; alpha?: number } = {}) {
  c.save(); c.font = font; c.fillStyle = color; c.textAlign = opts.align ?? "left"; c.textBaseline = "alphabetic"; c.globalAlpha *= opts.alpha ?? 1;
  if (opts.spacing) (c as Ctx & { letterSpacing?: string }).letterSpacing = `${opts.spacing}px`;
  let str = s;
  if (opts.maxW) while (c.measureText(str).width > opts.maxW && str.length > 4) str = `${str.slice(0, -2)}…`;
  c.fillText(str, x, y); c.restore();
}
function monogram(c: Ctx, x: number, y: number, size: number, alpha = 1) {
  c.save(); c.globalAlpha = alpha;
  c.beginPath(); c.arc(x, y, size / 2, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
  text(c, "P", x, y + size * 0.2, `${size * 0.56}px ${SERIF}`, IVORY, { align: "center" });
  c.restore();
}
const GREY = "#76767E";
/** Marque Pièce Rêvée : arche, goutte et carreau superposés. */
function logoMark(c: Ctx, x: number, y: number, size: number) {
  const k = size / 40;
  c.save(); c.translate(x, y); c.scale(k, k);
  c.fillStyle = "#C0714F"; c.beginPath(); c.moveTo(5, 37); c.lineTo(5, 17.5); c.arc(15.5, 17.5, 10.5, Math.PI, 0); c.lineTo(26, 37); c.closePath(); c.fill();
  c.globalCompositeOperation = "multiply";
  c.fillStyle = "#8FA38A"; c.beginPath(); c.arc(27.5, 12.5, 8.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#D9C3A0"; c.beginPath(); c.roundRect(20, 24, 15, 13, 2.2); c.fill();
  c.restore();
}
const retailersFor = (p: Pick) => (p.shop.kinds.includes("bricolage") ? "Leroy Merlin · Castorama · ManoMano" : p.shop.kinds.includes("jardin") ? "Leroy Merlin · Castorama" : "IKEA · Maisons du Monde · La Redoute");

/* ——— Planche projet (image 2400 × 3000) ——— */
export function drawPoster(d: ProjectData): HTMLCanvasElement {
  const W = 2400, H = 3000, M = 120, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, W, H);
  // En-tête
  text(c, `PIÈCE RÊVÉE · PROJET ${d.room.toUpperCase()}`, M, 170, `600 28px ${SANS}`, GREY, { spacing: 7 });
  text(c, d.title, M, 330, `650 150px ${SANS}`, INK, { maxW: W - 2 * M, spacing: -4 });
  text(c, `Esprit ${d.style.name.toLowerCase()} · ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`, M, 400, `400 48px ${SANS}`, GREY);
  // Avant + inspirations
  if (d.after) {
    // La pièce transformée en grand, la photo d'origine en médaillon.
    framed(c, d.after, M, 470, 1300, 975, 28);
    text(c, "VOTRE PIÈCE TRANSFORMÉE", M + 36, 470 + 975 - 40, `600 26px ${SANS}`, "#fff", { spacing: 6 });
    c.save(); rr(c, M + 1300 - 380, 470 + 24, 356, 267, 18); c.fillStyle = "#fff"; c.shadowColor = "rgba(0,0,0,.25)"; c.shadowBlur = 30; c.fill(); c.restore();
    framed(c, d.photo, M + 1300 - 372, 470 + 32, 340, 251, 12, 1, false);
    text(c, "AVANT", M + 1300 - 356, 470 + 32 + 251 - 18, `600 20px ${SANS}`, "#fff", { spacing: 5 });
  } else {
    framed(c, d.photo, M, 470, 1300, 975, 28);
    text(c, "VOTRE PIÈCE", M + 36, 470 + 975 - 40, `600 26px ${SANS}`, "#fff", { spacing: 6 });
  }
  const ih = (975 - 2 * 30) / 3;
  d.inspirations.slice(0, 3).forEach((img, i) => framed(c, img, M + 1340, 470 + i * (ih + 30), W - 2 * M - 1340, ih, 22));
  text(c, "INSPIRATIONS", W - M, 455, `600 24px ${SANS}`, MUTED, { align: "right", spacing: 6 });
  // Palette
  const py = 1530, pw = (W - 2 * M - 5 * 24) / 6;
  text(c, "LA PALETTE", M, py - 26, `600 26px ${SANS}`, GREY, { spacing: 6 });
  d.palette.slice(0, 6).forEach((p, i) => {
    const x = M + i * (pw + 24);
    c.save(); rr(c, x, py, pw, 190, 18); c.fillStyle = p.hex; c.fill(); c.restore();
    text(c, p.name, x, py + 245, `600 38px ${SANS}`, INK, { maxW: pw });
    text(c, p.hex.toUpperCase(), x, py + 290, `500 24px ${SANS}`, MUTED, { spacing: 2 });
  });
  // Planche 3D et références
  const by = 1900;
  text(c, "LES MATIÈRES", M, by - 26, `600 26px ${SANS}`, GREY, { spacing: 6 });
  if (d.board) framed(c, d.board, M, by, 1300, 867, 28, 1.04);
  const rx = M + 1360, rw = W - M - rx;
  text(c, "LES RÉFÉRENCES", rx, by - 26, `600 26px ${SANS}`, GREY, { spacing: 6 });
  const refs = d.picks.slice(0, 9), rh = 867 / Math.max(refs.length, 1);
  refs.forEach((p, i) => {
    const y = by + i * rh, s = d.samples.get(p.ref);
    if (s) { c.save(); rr(c, rx, y + 6, rh - 16, rh - 16, 12); c.clip(); c.fillStyle = "#F2F2F4"; c.fillRect(rx, y + 6, rh - 16, rh - 16); cover(c, s as HTMLCanvasElement, rx, y + 6, rh - 16, rh - 16, 1.15); c.restore(); }
    text(c, p.name.split(" · ")[0]!, rx + rh + 4, y + rh * 0.46, `600 34px ${SANS}`, INK, { maxW: rw - rh - 10 });
    text(c, `${p.role} · ${retailersFor(p)}`, rx + rh + 4, y + rh * 0.46 + 38, `500 21px ${SANS}`, MUTED, { maxW: rw - rh - 10 });
  });
  // Pied
  c.fillStyle = "#E6E6EA"; c.fillRect(M, 2850, W - 2 * M, 2);
  text(c, `Budget indicatif ${TIERS[d.tier].toLowerCase()} : ${euros(d.budget.low)} à ${euros(d.budget.high)}`, M, 2930, `600 42px ${SANS}`, INK);
  logoMark(c, W - M - 400, 2876, 64);
  text(c, "Pièce Rêvée", W - M - 322, 2930, `650 46px ${SANS}`, INK, { spacing: -1 });
  return cv;
}

/* ——— Film en motion design ——— */
const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3));
const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
export const FILM_SECONDS = 24;

/** Image du film à l'instant t (secondes) ; W × H au choix (vertical 1080 × 1920 ou paysage 1920 × 1080). */
export function drawFrame(c: Ctx, t: number, d: ProjectData, W: number, H: number) {
  const v = H > W, u = Math.min(W, H) / 1080, M = 80 * u;
  c.save(); c.fillStyle = IVORY; c.fillRect(0, 0, W, H);
  const scene = (a: number, b: number) => { const fi = seg(t, a, a + 0.6), fo = 1 - seg(t, b - 0.5, b); return t >= a && t <= b ? Math.min(fi, fo) : 0; };

  // 1. Ouverture
  let a = scene(0, 3.2);
  if (a > 0) {
    c.globalAlpha = a;
    monogram(c, W / 2, H / 2 - 210 * u, 96 * u, out(seg(t, 0.1, 0.9)));
    const k = out(seg(t, 0.5, 1.5));
    c.save(); c.beginPath(); c.rect(0, H / 2 - 120 * u, W, 170 * u); c.clip();
    text(c, d.title, W / 2, H / 2 + 20 * u + (1 - k) * 120 * u, `${(v ? 110 : 120) * u}px ${SERIF}`, INK, { align: "center", maxW: W - 2 * M });
    c.restore();
    text(c, `Esprit ${d.style.name.toLowerCase()}`, W / 2, H / 2 + 110 * u, `italic ${56 * u}px ${SERIF}`, BRONZE, { align: "center", alpha: out(seg(t, 1.2, 2)) });
    text(c, "PIÈCE RÊVÉE · VOTRE PROJET", W / 2, H - 140 * u, `600 ${22 * u}px ${SANS}`, MUTED, { align: "center", spacing: 7 * u, alpha: out(seg(t, 1.5, 2.3)) });
    c.globalAlpha = 1;
  }
  // 2. La pièce, avant
  a = scene(3, 6.8);
  if (a > 0) {
    c.globalAlpha = a;
    const z = 1.14 - 0.12 * seg(t, 3, 6.8);
    c.save(); cover(c, d.photo, 0, 0, W, H, z); c.restore();
    const g = c.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.55)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    text(c, "AVANT", M, H - 210 * u, `600 ${24 * u}px ${SANS}`, "#F2E7D6", { spacing: 8 * u, alpha: out(seg(t, 3.4, 4)) });
    text(c, "Votre pièce aujourd'hui", M, H - 130 * u, `${72 * u}px ${SERIF}`, "#fff", { alpha: out(seg(t, 3.6, 4.3)) });
    if (d.after) {
      // Révélation de la pièce transformée, par un balayage de gauche à droite.
      const k = ease(seg(t, 4.6, 5.7));
      if (k > 0) {
        c.save(); c.beginPath(); c.rect(0, 0, W * k, H); c.clip();
        cover(c, d.after, 0, 0, W, H, z);
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        text(c, "APRÈS", M, H - 210 * u, `600 ${24 * u}px ${SANS}`, "#F2E7D6", { spacing: 8 * u });
        text(c, "Votre pièce transformée", M, H - 130 * u, `${72 * u}px ${SERIF}`, "#fff", { maxW: W - 2 * M });
        c.restore();
        if (k < 1) { c.fillStyle = "#fff"; c.fillRect(W * k - 2 * u, 0, 4 * u, H); }
      }
    }
    c.globalAlpha = 1;
  }
  // 3. Les inspirations
  a = scene(6.6, 11.2);
  if (a > 0) {
    c.globalAlpha = a;
    text(c, "VOS INSPIRATIONS", M, M + 60 * u, `600 ${24 * u}px ${SANS}`, BRONZE, { spacing: 8 * u });
    text(c, "Ce qui vous ressemble", M, M + 150 * u, `${78 * u}px ${SERIF}`, INK);
    const n = Math.min(3, d.inspirations.length);
    d.inspirations.slice(0, 3).forEach((img, i) => {
      const k = out(seg(t, 7 + i * 0.35, 8.1 + i * 0.35));
      const cw = v ? W - 2 * M - 120 * u : (W - 2 * M - 60 * u * (n - 1)) / n, ch = v ? (H - 520 * u) / 3 - 30 * u : H - 420 * u;
      const x = v ? M + (i % 2) * 120 * u : M + i * (cw + 60 * u), y = v ? 300 * u + i * (ch + 30 * u) : 300 * u;
      c.save(); c.globalAlpha = a * k; c.translate(x + cw / 2, y + ch / 2 + (1 - k) * 160 * u); c.rotate(((i - 1) * 1.6 * Math.PI) / 180 * (1 - k * 0.6));
      framed(c, img, -cw / 2, -ch / 2, cw, ch, 22 * u, 1.04 + 0.04 * seg(t, 7, 11));
      c.restore();
    });
    c.globalAlpha = 1;
  }
  // 4. La palette
  a = scene(11, 14.8);
  if (a > 0) {
    c.globalAlpha = a;
    text(c, "LA PALETTE", M, M + 60 * u, `600 ${24 * u}px ${SANS}`, BRONZE, { spacing: 8 * u });
    text(c, "Tirée de vos images", M, M + 150 * u, `${78 * u}px ${SERIF}`, INK);
    const n = d.palette.length, top = 300 * u;
    d.palette.forEach((p, i) => {
      const k = ease(seg(t, 11.3 + i * 0.18, 12.4 + i * 0.18));
      if (v) {
        const bh = (H - top - 160 * u) / n;
        c.fillStyle = p.hex; c.fillRect(M, top + i * bh, (W - 2 * M) * k, bh - 14 * u);
        const light = luminance(p.hex) > 0.55;
        text(c, p.name, M + 40 * u, top + i * bh + bh * 0.55, `${54 * u}px ${SERIF}`, light ? INK : "#fff", { alpha: out(seg(t, 12 + i * 0.18, 12.6 + i * 0.18)) });
        text(c, p.hex, W - M - 40 * u, top + i * bh + bh * 0.55, `500 ${24 * u}px ${SANS}`, light ? MUTED : "rgba(255,255,255,.8)", { align: "right", spacing: 2 * u, alpha: out(seg(t, 12 + i * 0.18, 12.6 + i * 0.18)) });
      } else {
        const bw = (W - 2 * M) / n, bh = (H - top - 200 * u) * k;
        c.fillStyle = p.hex; c.fillRect(M + i * bw, top + (H - top - 200 * u) - bh, bw - 16 * u, bh);
        text(c, p.name, M + i * bw, H - 130 * u, `${40 * u}px ${SERIF}`, INK, { maxW: bw - 20 * u, alpha: out(seg(t, 12 + i * 0.18, 12.6 + i * 0.18)) });
        text(c, p.hex, M + i * bw, H - 90 * u, `500 ${20 * u}px ${SANS}`, MUTED, { alpha: out(seg(t, 12 + i * 0.18, 12.6 + i * 0.18)) });
      }
    });
    c.globalAlpha = 1;
  }
  // 5. Les matières (planche 3D)
  a = scene(14.6, 18.8);
  if (a > 0 && d.board) {
    c.globalAlpha = a;
    const k = ease(seg(t, 14.8, 16));
    if (v) {
      // Format vertical : la planche entière dans un cadre, puis les échantillons en mosaïque.
      text(c, "LES MATIÈRES", M, M + 60 * u, `600 ${24 * u}px ${SANS}`, BRONZE, { spacing: 8 * u });
      const bw = W - 2 * M, bh = bw * 2 / 3;
      c.save(); c.globalAlpha = a * k; framed(c, d.board, M, 200 * u + (1 - k) * 80 * u, bw, bh, 24 * u, 1.02 + 0.06 * seg(t, 14.6, 18.8)); c.restore();
      const sm = d.picks.filter((p) => d.samples.has(p.ref)).slice(0, 6), g = 24 * u, sw = (bw - 2 * g) / 3;
      sm.forEach((p, i) => {
        const kk = out(seg(t, 15.8 + i * 0.15, 16.6 + i * 0.15)), x = M + (i % 3) * (sw + g), y = 200 * u + bh + 50 * u + Math.floor(i / 3) * (sw + g) + (1 - kk) * 60 * u;
        c.save(); c.globalAlpha = a * kk; rr(c, x, y, sw, sw, 18 * u); c.clip(); c.fillStyle = "#EAE4D9"; c.fillRect(x, y, sw, sw); cover(c, d.samples.get(p.ref) as HTMLCanvasElement, x, y, sw, sw, 1.12); c.restore();
      });
    } else {
      c.save(); c.beginPath(); c.rect(0, H * (1 - k), W, H * k); c.clip();
      cover(c, d.board, 0, 0, W, H, 1.16 - 0.1 * seg(t, 14.6, 18.8), 0.5, 0.5); c.restore();
    }
    c.save(); c.globalAlpha = a * out(seg(t, 15.6, 16.4));
    rr(c, M, H - 250 * u, W - 2 * M, 170 * u, 24 * u); c.fillStyle = "rgba(244,240,232,.92)"; c.fill();
    text(c, "LES MATIÈRES", M + 40 * u, H - 185 * u, `600 ${22 * u}px ${SANS}`, BRONZE, { spacing: 8 * u });
    text(c, "Vos échantillons, en vrai volume", M + 40 * u, H - 115 * u, `${58 * u}px ${SERIF}`, INK, { maxW: W - 2 * M - 80 * u });
    c.restore(); c.globalAlpha = 1;
  }
  // 6. Les références
  a = scene(18.6, 22.6);
  if (a > 0) {
    c.globalAlpha = a;
    text(c, "LES RÉFÉRENCES", M, M + 60 * u, `600 ${24 * u}px ${SANS}`, BRONZE, { spacing: 8 * u });
    text(c, "À retrouver en magasin", M, M + 150 * u, `${78 * u}px ${SERIF}`, INK);
    const refs = d.picks.slice(0, v ? 8 : 6), top = 290 * u, rh = (v ? H - top - 330 * u : H - top - 250 * u) / refs.length;
    refs.forEach((p, i) => {
      const k = out(seg(t, 18.9 + i * 0.16, 19.7 + i * 0.16)), y = top + i * rh, x = M + (1 - k) * 80 * u;
      c.save(); c.globalAlpha = a * k;
      const s = d.samples.get(p.ref), sz = rh - 18 * u;
      if (s) { c.save(); rr(c, x, y, sz, sz, 14 * u); c.clip(); c.fillStyle = "#EAE4D9"; c.fillRect(x, y, sz, sz); cover(c, s as HTMLCanvasElement, x, y, sz, sz, 1.15); c.restore(); }
      text(c, p.name.split(" · ")[0]!, x + sz + 28 * u, y + sz * 0.48, `${Math.min(46, sz * 0.42 / u) * u}px ${SERIF}`, INK, { maxW: W - x - sz - M - 30 * u });
      text(c, retailersFor(p), x + sz + 28 * u, y + sz * 0.48 + 36 * u, `500 ${Math.min(22, sz * 0.2 / u) * u}px ${SANS}`, MUTED, { maxW: W - x - sz - M - 30 * u });
      c.restore();
    });
    const k = out(seg(t, 20.2, 21.6));
    text(c, `Budget indicatif : ${euros(d.budget.low * k)} – ${euros(d.budget.high * k)}`, M, H - 110 * u, `${52 * u}px ${SERIF}`, INK, { alpha: out(seg(t, 20, 20.6)), maxW: W - 2 * M });
    c.globalAlpha = 1;
  }
  // 7. Fin
  a = scene(22.4, 24.2);
  if (a > 0) {
    c.globalAlpha = a;
    monogram(c, W / 2, H / 2 - 120 * u, 110 * u);
    text(c, "Pièce Rêvée", W / 2, H / 2 + 40 * u, `${96 * u}px ${SERIF}`, INK, { align: "center" });
    text(c, "Votre intérieur rêvé, réellement faisable.", W / 2, H / 2 + 120 * u, `italic ${46 * u}px ${SERIF}`, BRONZE, { align: "center", maxW: W - 2 * M });
    c.globalAlpha = 1;
  }
  c.restore();
}
function luminance(hex: string) { const n = parseInt(hex.slice(1), 16); return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; }

/** Encode le film : MP4 (H.264) avec WebCodecs quand le navigateur le permet, sinon enregistrement direct. */
export async function encodeFilm(d: ProjectData, W: number, H: number, onProgress: (p: number) => void): Promise<{ blob: Blob; ext: "mp4" | "webm" }> {
  const fps = 30, frames = FILM_SECONDS * fps;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!;
  const codecs = ["avc1.640033", "avc1.4d0033", "avc1.42003e"];
  let config: VideoEncoderConfig | null = null;
  if (typeof VideoEncoder !== "undefined") {
    for (const codec of codecs) {
      const cfg: VideoEncoderConfig = { codec, width: W, height: H, bitrate: 12_000_000, framerate: fps, avc: { format: "avc" } };
      try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) { config = cfg; break; } } catch { /* suivant */ }
    }
  }
  if (config) {
    const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
    const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: "avc", width: W, height: H, frameRate: fps }, fastStart: "in-memory" });
    let failed: Error | null = null;
    const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta ?? undefined), error: (e) => { failed = e as Error; } });
    enc.configure(config);
    for (let i = 0; i < frames; i++) {
      drawFrame(c, i / fps, d, W, H);
      const frame = new VideoFrame(cv, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 }); frame.close();
      while (enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 4));
      if (failed) throw failed;
      if (i % 10 === 0) { onProgress(i / frames); await new Promise((r) => setTimeout(r, 0)); }
    }
    await enc.flush(); enc.close(); muxer.finalize();
    onProgress(1);
    return { blob: new Blob([(muxer.target as InstanceType<typeof ArrayBufferTarget>).buffer], { type: "video/mp4" }), ext: "mp4" };
  }
  // Repli : enregistrement en temps réel du dessin.
  const mime = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error("La création de vidéo n'est pas prise en charge par ce navigateur.");
  const stream = cv.captureStream(fps), rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 }), parts: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
  const done = new Promise<void>((r) => { rec.onstop = () => r(); });
  rec.start(250);
  const t0 = performance.now();
  await new Promise<void>((resolve) => {
    const step = () => { const t = (performance.now() - t0) / 1000; drawFrame(c, Math.min(t, FILM_SECONDS), d, W, H); onProgress(Math.min(1, t / FILM_SECONDS)); if (t < FILM_SECONDS) requestAnimationFrame(step); else resolve(); };
    step();
  });
  rec.stop(); await done; stream.getTracks().forEach((tr) => tr.stop());
  return { blob: new Blob(parts, { type: mime.split(";")[0] }), ext: mime.includes("mp4") ? "mp4" : "webm" };
}

/** Planche 3D calculée hors écran, en haute définition. */
export async function renderBoard(items: BoardItem[], bg = "#EFEBE3", width = 2400): Promise<HTMLImageElement | null> {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;width:1500px;height:1000px;pointer-events:none";
  document.body.appendChild(host);
  try {
    const { BoardEngine } = await import("@/lib/board/engine");
    const e = new BoardEngine(host, { onSelect: () => {}, onMove: () => {}, onDropAt: () => {} });
    e.setView("perspective");
    await e.sync({ v: 1, title: "", bg, items }, new Map());
    await new Promise((r) => setTimeout(r, 400));
    const url = e.exportImage(width);
    e.dispose();
    return await loadImage(url);
  } catch { return null; } finally { host.remove(); }
}
