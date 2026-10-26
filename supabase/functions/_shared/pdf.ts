/**
 * Export PDF d'une étude (partagé entre le navigateur et l'Edge Function).
 * pdf-lib est en pur JavaScript : aucun navigateur sans tête nécessaire.
 */
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import qrcode from "qrcode-generator";
import type { StudyResult } from "./core/schemas/study.ts";

export interface PdfInput {
  study: StudyResult;
  space: string;
  photoJpeg: Uint8Array | null;
  renderJpegs: Uint8Array[];
  /** Pour chaque besoin : produit retenu (titre, enseigne, prix, lien de redirection) ou null. */
  products: Record<string, { title: string; merchant: string; priceLabel: string; url: string } | null>;
  plantNames: Record<string, string>;
  siteUrl: string;
  watermark: boolean;
}

const A4: [number, number] = [595.28, 841.89];
const M = 48;
const INK = rgb(0.07, 0.08, 0.07), MUTED = rgb(0.36, 0.38, 0.35), ACCENT = rgb(0.153, 0.278, 0.816), LINE = rgb(0.87, 0.875, 0.84);

/** Les polices standard PDF (WinAnsi) ne couvrent pas tous les caractères : on remplace ceux qui poseraient problème. */
const clean = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/ /g, " ").replace(/[^\x20-\x7E -ÿ€Œœ]/g, "");

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = clean(text).split(/\s+/); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (font.widthOfTextAtSize(t, size) > width && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

function hexToRgb(hex: string) { const n = parseInt(hex.slice(1), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); }

function drawQr(page: PDFPage, url: string, x: number, y: number, size: number) {
  const qr = qrcode(0, "M"); qr.addData(url); qr.make();
  const n = qr.getModuleCount(); const cell = size / n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) page.drawRectangle({ x: x + c * cell, y: y + size - (r + 1) * cell, width: cell, height: cell, color: INK });
}

export async function buildStudyPdf(input: PdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(clean(input.study.concept.title)); doc.setAuthor("Pièce Rêvée"); doc.setLanguage("fr-FR"); doc.setCreator("Pièce Rêvée");
  const reg = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage(A4); let y = A4[1] - M;
  const W = A4[0] - 2 * M;
  const newPage = () => { page = doc.addPage(A4); y = A4[1] - M; footer(); };
  const footer = () => {
    page.drawText(clean(`Pièce Rêvée · ${input.siteUrl.replace(/^https?:\/\//, "")} · Propositions indicatives, images générées par IA`), { x: M, y: 24, size: 8, font: reg, color: MUTED });
    if (input.watermark) page.drawText("Pièce Rêvée · offre Découverte", { x: M, y: A4[1] / 2, size: 34, font: bold, color: rgb(0.85, 0.85, 0.85), opacity: 0.25, rotate: degrees(35) });
  };
  const need = (h: number) => { if (y - h < 48) newPage(); };
  const text = (t: string, size = 10.5, f = reg, color = INK, gap = 4) => { for (const l of wrap(t, f, size, W)) { need(size + gap); page.drawText(l, { x: M, y: y - size, size, font: f, color }); y -= size + gap; } };
  const h2 = (t: string) => { y -= 14; need(30); page.drawText(clean(t), { x: M, y: y - 16, size: 16, font: bold, color: INK }); y -= 26; page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.6, color: LINE }); y -= 10; };
  footer();

  // Couverture
  page.drawText("PIÈCE RÊVÉE · ÉTUDE D'AMÉNAGEMENT", { x: M, y: y - 10, size: 9, font: bold, color: ACCENT }); y -= 30;
  for (const l of wrap(input.study.concept.title, bold, 28, W)) { page.drawText(l, { x: M, y: y - 28, size: 28, font: bold, color: INK }); y -= 34; }
  text(`${input.space} · ${input.study.concept.mood}`, 11, reg, MUTED); y -= 8;
  const img = input.renderJpegs[0] ?? input.photoJpeg;
  if (img) { try { const j = await doc.embedJpg(img); const h = Math.min(360, (W * j.height) / j.width); need(h); page.drawImage(j, { x: M, y: y - h, width: W, height: h }); y -= h + 8; if (input.renderJpegs[0]) text("Image générée par IA à partir de votre photo.", 8.5, reg, MUTED); } catch { /* image illisible : on continue sans */ } }
  y -= 6; text(input.study.concept.summary);

  h2("Analyse et principes");
  for (const a of input.study.concept.analysis) text(`• ${a}`);
  y -= 4; for (const p of input.study.concept.principles) text(`• ${p}`);

  h2("Palette");
  const sw = (W - 4 * 10) / 5;
  need(90);
  input.study.palette.slice(0, 5).forEach((c, i) => {
    const x = M + i * (sw + 10);
    page.drawRectangle({ x, y: y - 50, width: sw, height: 50, color: hexToRgb(c.hex), borderColor: LINE, borderWidth: 0.5 });
    page.drawText(clean(c.name).slice(0, 22), { x, y: y - 64, size: 8.5, font: bold, color: INK });
    page.drawText(`${c.hex} · ${clean(c.usage)}`.slice(0, 30), { x, y: y - 75, size: 7.5, font: reg, color: MUTED });
  });
  y -= 88;

  h2("Liste d'achats");
  for (const n of input.study.needs) {
    const p = input.products[n.id] ?? null;
    need(70);
    const top = y;
    page.drawText(clean(n.category), { x: M, y: y - 10, size: 8, font: bold, color: ACCENT }); y -= 14;
    for (const l of wrap(p ? `${p.title} · ${p.merchant} · ${p.priceLabel}` : `À chercher : ${n.description} (${n.priceRange.min} à ${n.priceRange.max} €)`, p ? bold : reg, 10, W - 70)) { page.drawText(l, { x: M, y: y - 10, size: 10, font: p ? bold : reg, color: INK }); y -= 13; }
    if (p) { drawQr(page, p.url, M + W - 56, top - 58, 56); page.drawText("Lien affilié", { x: M, y: y - 9, size: 7.5, font: reg, color: MUTED }); y -= 12; }
    y = Math.min(y, top - 64); page.drawLine({ start: { x: M, y: y + 4 }, end: { x: M + W, y: y + 4 }, thickness: 0.3, color: LINE });
  }
  if (input.study.plants.length) {
    h2("Plantes");
    for (const p of input.study.plants) text(`• ${input.plantNames[p.plantId] ?? p.plantId} × ${p.quantity} : ${p.why}`);
  }
  if (input.study.custom.length) {
    h2("Sur-mesure");
    for (const c of input.study.custom) text(`• ${c.element} (${c.trade}) : ${c.description}. Budget indicatif ${c.budgetMin} à ${c.budgetMax} €.`);
  }
  h2("Tutos");
  for (const t of input.study.tutorials) {
    text(t.title, 12, bold); text(`${t.difficulty} · ${t.duration} · Outils : ${t.tools.join(", ")}`, 9, reg, MUTED);
    t.steps.forEach((s, i) => text(`${i + 1}. ${s}`));
    text(`Astuce : ${t.tip}`, 9.5, reg, MUTED); if (t.safety) text(`Sécurité : ${t.safety}`, 9.5, reg, MUTED); y -= 6;
  }
  h2("Ordre des travaux");
  input.study.works.forEach((w, i) => text(`${i + 1}. ${w.step} · ${w.duration}${w.pro ? " · professionnel recommandé" : ""}`));
  if (input.study.regulations.length) { h2("À vérifier avant de commencer"); for (const r of input.study.regulations) text(`• ${r}`); }
  return doc.save();
}
