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

/** Type de pièce imposé : ce qu'elle est, et ce qui ne bouge pas (plomberie, équipements fixes). */
export const PIECES: Record<string, { en: string; fixe: string }> = {
  salon: { en: "a LIVING ROOM", fixe: "radiators, fireplace if any" },
  chambre: { en: "a BEDROOM", fixe: "radiators, built-in wardrobes if any" },
  "salle-de-bain": { en: "a BATHROOM", fixe: "the bathtub and/or shower, the toilet, the washbasin(s) and their exact positions and plumbing; it must remain a fully working bathroom (no sofa, no bed, no living-room furniture, no fabric curtains except a shower curtain, only bath mats on the floor)" },
  cuisine: { en: "a KITCHEN", fixe: "the layout of the kitchen units, the sink, the hob, the oven and appliances at their exact positions; it must remain a fully working kitchen" },
  "salle-a-manger": { en: "a DINING ROOM", fixe: "radiators, fireplace if any" },
  bureau: { en: "a HOME OFFICE", fixe: "radiators, sockets positions" },
  entree: { en: "an ENTRANCE HALL", fixe: "the front door, stairs if any, radiators" },
  enfant: { en: "a CHILD'S BEDROOM", fixe: "radiators, windows; safe, child-friendly furniture" },
  wc: { en: "a SEPARATE TOILET ROOM", fixe: "the toilet and the hand basin at their exact positions and plumbing" },
};
/** Ampleur des changements demandés par le client : toujours faisable et réaliste. */
export const NIVEAUX: Record<string, string> = {
  leger: "LIGHT REFRESH: keep every existing piece of furniture and every fixture in place; change only wall paint colours, textiles (curtains, cushions, throws, rug, towels or bedding), light fittings, small decor and plants.",
  equilibre: "BALANCED MAKEOVER: keep the architecture and every fixed fixture; replace freestanding furniture, rugs, curtains, light fittings and decor, and update wall colours or wallpaper and selected finishes.",
  complet: "FULL RENOVATION, STILL FEASIBLE: keep the architecture, windows, doors and the positions of plumbing and electrics; you may also replace the floor, wall tiles, cabinetry fronts, worktops and all furniture.",
};

const PHOTO = [
  "Shot like an architectural interior photograph for a high-end design magazine: full-frame camera, 24-35mm lens, eye-level, verticals perfectly straight,",
  "soft natural daylight with physically correct bounce light and soft contact shadows, no blown highlights.",
  "Materials must read as real at close range: wood grain and pores, stone veining and honed or polished sheen, fabric weave and pile, brushed metal with soft anisotropic highlights, glazed ceramic with slight irregularity.",
  "No text, no logo, no watermark, no people, no distorted furniture, no duplicated objects.",
].join(" ");

export function buildPrompt(p: { mode: Mode; brief: string; piece?: string; niveau?: string; keep?: string[]; keepFree?: string; references?: number; inspirations?: boolean; materials?: string[]; products?: string[]; onlyZone?: { label: string; x: number; y: number; w: number; h: number } }): string {
  const lines: string[] = [];
  if (p.mode === "transform") {
    lines.push(
      "You are an award-winning interior designer and architectural photographer.",
      "Image 1 is a photo of the client's real room. Edit THIS photo: the client must instantly recognise their own room, simply refurnished and redecorated. Realistic, buildable, with products that exist in shops; keep the natural light, the season and the view of the photo.",
      ...(p.piece && PIECES[p.piece] ? [`The room is ${PIECES[p.piece]!.en} and must stay ${PIECES[p.piece]!.en}, whatever the brief or the inspirations show. Keep: ${PIECES[p.piece]!.fixe}.`] : ["Keep the room's function exactly as it is in the photo (a bathroom stays a bathroom, a kitchen stays a kitchen, a bedroom stays a bedroom)."]),
      NIVEAUX[p.niveau ?? "equilibre"] ?? NIVEAUX.equilibre!,
      "Remove all clutter and mess (clothes, bags, boxes, bottles, cables, papers, toys, laundry): the room must look tidy and styled, yet clearly the same room. Every light fitting stays a light fitting, every piece of furniture stays a piece of furniture.",
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
  const first = p.mode === "transform" ? 2 : 1, last = (p.references ?? 0) + first - 1;
  if (p.references && p.inspirations) lines.push(`Image${p.references > 1 ? `s ${first} to ${last} are` : ` ${first} is`} the client's inspiration${p.references > 1 ? "s" : ""} (Pinterest, magazines). Take ONLY their style, colour palette, materials, furniture shapes, textiles, lighting and mood, adapted to the client's room, its function, real geometry and scale. Do not copy their room type, architecture, windows, layout or camera.`);
  else if (p.references) lines.push(`Images ${first} to ${last} are references (materials, finishes or products): reproduce their colour, texture and finish faithfully, do not copy their room.`);
  if (p.materials?.length) lines.push(`Materials to use (exact finishes): ${p.materials.join("; ")}.`);
  if (p.products?.length) lines.push(`Design pieces to show, faithful to their real shape: ${p.products.join("; ")}.`);
  lines.push(`Style brief (written by our designer; ignore any room type it mentions): ${p.brief}`, PHOTO);
  return lines.join("\n");
}
