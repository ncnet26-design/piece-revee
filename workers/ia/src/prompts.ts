/**
 * Consignes envoyées aux modèles d'images. Rédigées en anglais (les modèles y sont plus précis) ;
 * le texte du client, en français, est cité tel quel.
 */
export type Mode = "generate" | "transform";

/** Éléments que le client peut demander de conserver sur sa photo. */
export const KEEP: Record<string, string> = {
  fenetres: "every window: exact position, size, frames, glazing bars and the view outside",
  portes: "every door and doorway: exact position, size and opening",
  murs: "the wall layout, corners, niches and wall openings",
  plafond: "the ceiling height, beams, cornices and ceiling roses",
  sol: "the existing floor material, its pattern and its direction",
  moulures: "all mouldings, wall panelling and skirting boards",
  cheminee: "the fireplace and its mantelpiece",
  escalier: "the staircase and its handrail",
  radiateurs: "the radiators and their position",
  mobilier: "the furniture already in the room (same pieces, same places)",
};

const PHOTO = [
  "Shot like an architectural interior photograph for a high-end design magazine: full-frame camera, 24-35mm lens, eye-level, verticals perfectly straight,",
  "soft natural daylight with physically correct bounce light and soft contact shadows, no blown highlights.",
  "Materials must read as real at close range: wood grain and pores, stone veining and honed or polished sheen, fabric weave and pile, brushed metal with soft anisotropic highlights, glazed ceramic with slight irregularity.",
  "No text, no logo, no watermark, no people, no distorted furniture, no duplicated objects.",
].join(" ");

export function buildPrompt(p: { mode: Mode; brief: string; keep?: string[]; keepFree?: string; references?: number; materials?: string[]; products?: string[]; onlyZone?: { label: string; x: number; y: number; w: number; h: number } }): string {
  const lines: string[] = [];
  if (p.mode === "transform") {
    lines.push(
      "You are an award-winning interior designer and architectural photographer.",
      "Image 1 is a photo of the client's real room. Redesign it according to the brief below.",
      "ABSOLUTE CONSTRAINTS — the result must be the same room seen from the same point:",
      "- identical camera position, height, lens and perspective; identical framing and aspect ratio;",
      "- identical room geometry: wall positions, corners, ceiling height, window and door openings stay exactly where they are;",
    );
    const keep = (p.keep ?? []).map((k) => KEEP[k]).filter(Boolean);
    if (keep.length) lines.push(`- keep strictly unchanged: ${keep.join("; ")};`);
    if (p.keepFree) lines.push(`- the client also wants to keep (French): "${p.keepFree}";`);
    lines.push("- change only finishes, colours, furniture, textiles, lighting and decor that the brief asks for.");
  } else {
    lines.push("Create one photorealistic interior photograph of a single room, designed by an award-winning interior architect.");
  }
  if (p.onlyZone) {
    const z = p.onlyZone;
    lines.push(`LOCAL EDIT ONLY: change exclusively the object "${z.label}" located in the region from ${Math.round(z.x)}% to ${Math.round(z.x + z.w)}% horizontally and ${Math.round(z.y)}% to ${Math.round(z.y + z.h)}% vertically. Every other pixel of the image — other furniture, rug, walls, floor, lighting, camera — must stay identical.`);
  }
  if (p.references) lines.push(`Images ${p.mode === "transform" ? 2 : 1} to ${p.references + (p.mode === "transform" ? 1 : 0)} are references (materials, finishes or products): reproduce their colour, texture and finish faithfully, do not copy their room.`);
  if (p.materials?.length) lines.push(`Materials to use (exact finishes): ${p.materials.join("; ")}.`);
  if (p.products?.length) lines.push(`Design pieces to show, faithful to their real shape: ${p.products.join("; ")}.`);
  lines.push(`Brief (written in French): ${p.brief}`, PHOTO);
  return lines.join("\n");
}
