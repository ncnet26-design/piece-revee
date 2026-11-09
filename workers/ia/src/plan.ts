/**
 * Étape d'analyse avant la transformation : une IA de vision (gratuite, Cloudflare) examine la photo réelle et écrit
 * un plan précis, objet par objet (position, catégorie, quoi faire), que le modèle d'images suit ensuite.
 * Sans ce plan, le modèle d'images devine et confond (un pot de fleurs à la place d'un lustre, des rideaux dans une salle de bain…).
 */
export type Runner = (modele: string, entree: unknown) => Promise<unknown>;
export const MODELES_VISION = ["@cf/mistralai/mistral-small-3.1-24b-instruct", "@cf/meta/llama-3.2-11b-vision-instruct"] as const;

const CONSIGNE = `You are a senior interior designer. You are preparing exact instructions for a photo-editing model that will edit THIS photo.
Read the client's brief and constraints below, then examine the photo carefully.
1. ROOM: the room type (if the brief states it, use exactly that).
2. KEEP: the fixed elements to keep exactly (walls, windows, doors, ceiling, plumbing fixtures such as bathtub, shower, toilet, washbasin, sink, kitchen units and appliances, radiators, built-ins), with their position.
3. PLAN: short numbered imperative lines (8 to 14). Each line names ONE object or surface, its position in the photo (left / centre / right and top / middle / bottom), its category in capitals (LIGHTING, FURNITURE, TEXTILE, DECOR, WALL, FLOOR, FIXTURE, CLUTTER) and exactly what to do with it.
If the brief lists REAL PRODUCTS, write one PLAN line for each product: where it goes (position in the photo), its approximate size in cm and what it replaces; place them as a professional interior designer would (sofa against a wall facing the focal point, rug under the front legs, pendant centred above the table…).
Rules: a light fitting stays a light fitting (LIGHTING is never replaced by a plant or an object); furniture stays furniture of a type that suits the room; first apply the client's own requests, then the style; respect the requested change level; remove all clutter and mess (clothes, bags, boxes, bottles, cables, papers, toys, laundry) and leave tidy, styled surfaces; never add anything that makes no sense in this room type (for a bathroom: no fabric curtains except a shower curtain, no sofa, no bed, no carpet other than a bath mat); everything must be realistic, feasible and buildable.
Answer ONLY in this format:
ROOM: ...
KEEP: ...
PLAN:
1. ...`;

/** Renvoie le plan (texte) ou null si aucune IA de vision n'a répondu correctement. */
export async function planifier(run: Runner, photo: { mime: string; b64: string }, brief: string): Promise<string | null> {
  const image = `data:${photo.mime};base64,${photo.b64}`;
  for (const modele of MODELES_VISION) {
    try {
      const r = await run(modele, {
        messages: [{ role: "user", content: [{ type: "text", text: `${CONSIGNE}\n\nClient brief and constraints:\n${brief.slice(0, 2500)}` }, { type: "image_url", image_url: { url: image } }] }],
        max_tokens: 700, temperature: 0.2,
      }) as { response?: string; choices?: Array<{ message?: { content?: string } }> };
      const t = (r?.response ?? r?.choices?.[0]?.message?.content ?? "").trim();
      if (/PLAN:\s*\n?\s*1\./i.test(t) && t.length > 120) return t.slice(0, 2200);
    } catch { /* modèle suivant */ }
  }
  return null;
}

/** Consigne finale : le plan précis d'abord (il prime), puis les contraintes et le style. */
export const avecPlan = (plan: string | null, consigne: string) => (plan
  ? `PRECISE EDIT PLAN written after examining THIS exact photo — follow it line by line; every object keeps its category and position unless the plan says otherwise:\n${plan}\n\n${consigne}`
  : consigne);
