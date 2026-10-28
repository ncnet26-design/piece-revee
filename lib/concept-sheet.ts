/**
 * Fiche « concept » en haute définition (2400 × 3000), mise en page éditoriale :
 * titre, accroche, palette, texte, image d'ambiance et échantillons classés par rôle.
 */
import type { ConceptCard } from "./concept";

const INK = "#111113", MUTED = "#76767E", LINE = "#E6E6EA", SANS = '"Onest", system-ui, sans-serif';
type Ctx = CanvasRenderingContext2D;

function wrap(c: Ctx, s: string, maxW: number): string[] {
  const out: string[] = []; let line = "";
  for (const w of s.split(/\s+/)) {
    const t = line ? `${line} ${w}` : w;
    if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
function paragraph(c: Ctx, s: string, x: number, y: number, maxW: number, lh: number, font: string, color: string, maxLines = 99) {
  c.font = font; c.fillStyle = color;
  const lines = wrap(c, s, maxW);
  lines.slice(0, maxLines).forEach((l, i) => c.fillText(i === maxLines - 1 && lines.length > maxLines ? `${l.replace(/\s*\S+$/, "")}…` : l, x, y + i * lh));
  return y + Math.min(lines.length, maxLines) * lh;
}
function cover(c: Ctx, img: CanvasImageSource, x: number, y: number, w: number, h: number, r: number, zoom = 1) {
  const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLCanvasElement).width, ih = (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height;
  const s = Math.max(w / iw, h / ih) * zoom;
  c.save(); c.beginPath(); c.roundRect(x, y, w, h, r); c.clip();
  c.drawImage(img, x + (w - iw * s) / 2, y + (h - ih * s) / 2, iw * s, ih * s); c.restore();
}

export function drawConceptSheet(card: ConceptCard, image: HTMLImageElement, palette: string[], samples: Map<string, CanvasImageSource>): HTMLCanvasElement {
  const W = 2400, H = 3000, M = 140;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, W, H);
  c.textBaseline = "alphabetic";

  // Image d'ambiance, à droite.
  const ix = 1240, iw = W - M - ix, ih = Math.round(iw * 1.25);
  cover(c, image, ix, M, iw, ih, 36);

  // Colonne de texte, à gauche.
  const colW = ix - M - 110;
  (c as Ctx & { letterSpacing?: string }).letterSpacing = "-4px";
  let y = paragraph(c, card.title, M, M + 140, colW, 150, `650 136px ${SANS}`, INK, 3);
  (c as Ctx & { letterSpacing?: string }).letterSpacing = "0px";
  y = paragraph(c, card.tagline, M, y + 30, colW, 66, `400 50px ${SANS}`, MUTED, 3);
  palette.slice(0, 6).forEach((hex, i) => { c.beginPath(); c.arc(M + 34 + i * 92, y + 70, 34, 0, Math.PI * 2); c.fillStyle = hex; c.fill(); c.strokeStyle = "rgba(0,0,0,.08)"; c.lineWidth = 2; c.stroke(); });
  y = paragraph(c, card.text, M, y + 220, colW, 58, `400 38px ${SANS}`, "#3A3A40", 9);
  const meta: Array<[string, string]> = [["Espace", card.room], ["Style", card.style.name], ["Matières", `${card.picks.length} références`]];
  let my = Math.max(y + 60, M + ih - meta.length * 96);
  for (const [k, v] of meta) {
    c.fillStyle = LINE; c.fillRect(M, my, colW, 2);
    c.font = `500 30px ${SANS}`; c.fillStyle = MUTED; c.fillText(k.toUpperCase(), M, my + 62);
    c.font = `600 36px ${SANS}`; c.fillStyle = INK; c.textAlign = "right"; c.fillText(v, M + colW, my + 62); c.textAlign = "left";
    my += 96;
  }

  // Échantillons par rôle : 5 colonnes, 2 rangées.
  const top = M + ih + 130, cols = 5, gap = 40, cw = (W - 2 * M - gap * (cols - 1)) / cols;
  card.picks.slice(0, 10).forEach((p, i) => {
    const x = M + (i % cols) * (cw + gap), yy = top + Math.floor(i / cols) * (cw + 200);
    c.fillStyle = "#F2F2F4"; c.beginPath(); c.roundRect(x, yy, cw, cw, 22); c.fill();
    const s = samples.get(p.ref); if (s) cover(c, s, x, yy, cw, cw, 22, 1.12);
    (c as Ctx & { letterSpacing?: string }).letterSpacing = "3px";
    c.font = `600 26px ${SANS}`; c.fillStyle = MUTED; c.fillText(p.role.toUpperCase(), x, yy + cw + 56);
    (c as Ctx & { letterSpacing?: string }).letterSpacing = "0px";
    paragraph(c, p.name.split(" · ")[0]!, x, yy + cw + 104, cw, 44, `500 34px ${SANS}`, INK, 2);
  });

  c.font = `500 28px ${SANS}`; c.fillStyle = MUTED;
  c.fillText("Pièce Rêvée · Concept généré", M, H - 90);
  c.textAlign = "right"; c.fillText("Image d'ambiance créée par IA · matières du showroom", W - M, H - 90);
  return cv;
}
