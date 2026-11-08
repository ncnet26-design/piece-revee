/**
 * Vidéo avant/après à partager (format vertical 9:16 pour Instagram, TikTok et les stories), fabriquée dans le navigateur.
 * Scènes : la pièce avant, le glissement vers l'après, les meubles en vente avec leurs prix, puis la signature du site.
 */
import { encodeAnimation, fontsReady, loadImage } from "@/lib/transform/render";
import type { Gamme } from "@/lib/choisir-produit";
import type { LignePiece } from "@/components/PrixPiece";

export const VIDEO_SECONDES = 10;
const W = 1080, H = 1920;
// Couleurs de la charte (canevas : pas de variables CSS).
const FOND = "#F4F1EB", ENCRE = "#1B1A17", GRIS = "#625C53", BRONZE = "#7A5B30", SURFACE = "#FBFAF7";
const SERIF = '"Instrument Serif", Georgia, serif', SANS = '"Onest", system-ui, sans-serif';

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const doux = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} €`;

type Img = HTMLImageElement;
function cover(c: CanvasRenderingContext2D, img: Img, x: number, y: number, w: number, h: number, zoom: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom, dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
function texte(c: CanvasRenderingContext2D, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left", maxW?: number, espacement = 0) {
  c.save(); c.font = font; c.fillStyle = color; c.textAlign = align;
  if (espacement) (c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${espacement}px`;
  let str = s;
  if (maxW) while (c.measureText(str).width > maxW && str.length > 4) str = `${str.slice(0, -2)}…`;
  c.fillText(str, x, y); c.restore();
}
function pastille(c: CanvasRenderingContext2D, s: string, x: number, y: number, droite = false) {
  c.save(); c.font = `700 30px ${SANS}`; (c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "4px";
  const w = c.measureText(s).width + 48, x0 = droite ? x - w : x;
  c.fillStyle = "rgba(0,0,0,.66)"; c.beginPath(); c.roundRect(x0, y, w, 58, 29); c.fill();
  c.fillStyle = "#fff"; c.textBaseline = "middle"; c.fillText(s, x0 + 24, y + 30); c.restore();
}

export interface DonneesVideo { avant: Img; apres: Img; lignes: LignePiece[] }

/** Une image de la vidéo au temps t (secondes). */
export function dessiner(c: CanvasRenderingContext2D, t: number, d: DonneesVideo) {
  c.fillStyle = FOND; c.fillRect(0, 0, W, H);
  const M = 64, IX = M, IY = 250, IW = W - 2 * M, IH = 1000;

  // En-tête
  texte(c, "PIÈCE RÊVÉE", W / 2, 120, `600 30px ${SANS}`, BRONZE, "center", undefined, 10);
  const titre = t < 3.6 ? "Ma pièce, avant…" : "…et refaite.";
  c.save(); c.globalAlpha = t < 3.6 ? seg(t, 0, 0.6) : seg(t, 3.6, 4.2);
  texte(c, titre, W / 2, 205, `italic 78px ${SERIF}`, ENCRE, "center"); c.restore();

  // Image : avant, glissement, après (léger zoom continu)
  const zoom = 1.02 + 0.08 * seg(t, 0, 7.5);
  c.save(); c.beginPath(); c.rect(IX, IY, IW, IH); c.clip();
  cover(c, d.avant, IX, IY, IW, IH, zoom);
  const cut = doux(seg(t, 2.2, 3.8));
  if (cut > 0) {
    c.save(); c.beginPath(); c.rect(IX, IY, IW * cut, IH); c.clip(); cover(c, d.apres, IX, IY, IW, IH, zoom); c.restore();
    if (cut < 1) { c.fillStyle = "#fff"; c.fillRect(IX + IW * cut - 3, IY, 6, IH); }
  }
  c.restore();
  if (t < 3.8) pastille(c, "AVANT", IX + IW - 24, IY + 24, true);
  if (cut > 0.15) { pastille(c, "APRÈS", IX + 24, IY + 24); texte(c, "Image créée par IA", IX + 24, IY + IH - 28, `500 26px ${SANS}`, "rgba(255,255,255,.9)"); }

  // Sous-titre des premières secondes
  const ks = 1 - seg(t, 4.2, 4.6);
  if (ks > 0) {
    c.save(); c.globalAlpha = ks * seg(t, 0.4, 1);
    texte(c, "Une photo de ma pièce, et l'IA", W / 2, IY + IH + 110, `italic 60px ${SERIF}`, GRIS, "center");
    texte(c, "la refait dans mon style.", W / 2, IY + IH + 185, `italic 60px ${SERIF}`, GRIS, "center");
    c.restore();
  }
  // Les meubles en vente (budget moyen) et le prix de la pièce aux trois budgets
  const lignes = d.lignes.filter((l) => l.produits.moyen).slice(0, 4);
  const totaux = (["petit", "moyen", "haut"] as Gamme[]).map((g) => d.lignes.reduce((s, l) => s + (l.produits[g]?.p ?? 0), 0));
  const k = doux(seg(t, 4.6, 5.4));
  if (k > 0 && t < 8.6) {
    const y0 = IY + IH + 60 - (1 - k) * 40;
    c.save(); c.globalAlpha = k * (1 - seg(t, 8.2, 8.6));
    texte(c, "TOUT EST EN VENTE", M, y0 + 10, `600 28px ${SANS}`, BRONZE, "left", undefined, 8);
    lignes.forEach((l, i) => {
      const p = l.produits.moyen!, y = y0 + 70 + i * 62, a = seg(t, 5 + i * 0.25, 5.5 + i * 0.25);
      c.save(); c.globalAlpha *= a;
      texte(c, l.label, M, y, `400 36px ${SANS}`, ENCRE, "left", IW - 330);
      texte(c, p.m, W - M - 170, y, `400 26px ${SANS}`, GRIS, "right", 200);
      texte(c, p.p !== null ? eur(p.p) : "Prix sur le site", W - M, y, `600 34px ${SANS}`, ENCRE, "right");
      c.restore();
    });
    c.restore();
  }
  // Prix de la pièce complète
  const kp = doux(seg(t, 6.6, 7.3));
  if (kp > 0 && t < 8.6 && totaux.some((x) => x > 0)) {
    c.save(); c.globalAlpha = kp * (1 - seg(t, 8.2, 8.6));
    const y = H - 150, bw = (IW - 32) / 3;
    (["Petit budget", "Budget moyen", "Haut de gamme"]).forEach((nom, i) => {
      const x = M + i * (bw + 16), noir = i === 1;
      c.fillStyle = noir ? ENCRE : SURFACE; c.beginPath(); c.roundRect(x, y - 70, bw, 130, 4); c.fill();
      texte(c, nom.toUpperCase(), x + bw / 2, y - 28, `600 20px ${SANS}`, noir ? "rgba(255,255,255,.75)" : GRIS, "center", bw - 16, 3);
      texte(c, totaux[i]! > 0 ? eur(totaux[i]!) : "—", x + bw / 2, y + 38, `56px ${SERIF}`, noir ? "#fff" : ENCRE, "center");
    });
    c.restore();
  }

  // Signature
  const kf = seg(t, 8.4, 9.1);
  if (kf > 0) {
    c.save(); c.globalAlpha = kf; c.fillStyle = FOND; c.fillRect(0, 0, W, H);
    texte(c, "Pièce Rêvée", W / 2, H / 2 - 40, `128px ${SERIF}`, ENCRE, "center");
    texte(c, "Transformez votre pièce,", W / 2, H / 2 + 70, `italic 64px ${SERIF}`, GRIS, "center");
    texte(c, "achetez chaque meuble.", W / 2, H / 2 + 145, `italic 64px ${SERIF}`, GRIS, "center");
    c.restore();
  }
}

/** Fabrique la vidéo MP4 (ou WebM si le navigateur ne sait pas faire de MP4). */
export async function creerVideo(avant: string, apres: string, lignes: LignePiece[], progression: (p: number) => void) {
  await fontsReady();
  const [a, b] = await Promise.all([loadImage(avant), chargerCors(apres)]);
  return encodeAnimation((c, t) => dessiner(c, t, { avant: a, apres: b, lignes }), VIDEO_SECONDES, W, H, progression, 5_000_000);
}
/** L'image produite vient du service d'images : chargée en CORS pour pouvoir l'encoder. */
function chargerCors(src: string): Promise<HTMLImageElement> {
  if (src.startsWith("data:") || src.startsWith("blob:")) return loadImage(src);
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => rej(new Error("image illisible")); i.src = src; });
}
