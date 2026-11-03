/**
 * Prépare le lot d'images v3 (sans rien générer) : matériauthèque, styles détaillés, accords de matières,
 * en-têtes de pages et pièces « avant » des études. Écrit content/ia/commandes/*.json et content/ia/lots/lot-2.json,
 * puis affiche le nombre d'images, le coût nominal et l'empreinte de confirmation du lot.
 * Usage : node --experimental-strip-types scripts/ia-lot2.ts
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { MATERIALS, PAIRINGS, STYLES } from "../content/index.ts";

const INT = "Editorial interior photograph for an architecture and design magazine, shot at eye level from about 1.2 metres with a 28 mm lens and perfectly straight verticals. Natural daylight with soft shadows and clear contact shadows under the furniture, true material texture, neutral-warm colour balance, no blown highlights, calm composition with generous negative space, the quiet realism of a real photograph.";
const EXT = "Editorial architecture photograph for a design magazine, eye-level viewpoint with a 28 mm lens and perfectly straight verticals, natural light, true material texture, balanced exposure with no blown highlights, calm composition, the quiet realism of a real photograph.";
const MAT = "Editorial still-life photograph for an interior design magazine, 85 mm lens, close framing where the material fills most of the frame, soft raking daylight from the side that reveals the texture, natural depth of field, true colour, no blown highlights.";
const LOCK_I = "LOCKS: original unbranded furniture and objects only, no logo, no text, no people, no artwork with writing.";
const LOCK_M = "LOCKS: no brand, no logo, no label, no text, no people.";
const PRICE = 0.0504;

type Cmd = { id: string; usage: string; aspect_ratio: string; prompt: string };
const cmds: Cmd[] = [];
const matName = (id: string) => MATERIALS.find((m) => m.id === id)?.name ?? id.replace(/^m-/, "");

// 1. Matériauthèque : une nature morte par matière.
for (const m of MATERIALS) {
  const outdoor = !m.interior && m.exterior;
  cmds.push({ id: `lib-${m.id.replace(/^m-/, "")}`, usage: `Matériauthèque : ${m.name}`, aspect_ratio: "4:5",
    prompt: `${m.name} (${m.family}). ${m.summary} Show the real material at close range ${outdoor ? "in a contemporary garden or terrace setting" : "in a refined interior context"}, with one or two discreet complementary objects; colour palette close to ${m.colors.join(", ")}.\n${MAT}\n${LOCK_M}` });
}
// 2. Styles détaillés.
for (const s of STYLES) {
  const ext = s.scope !== "interieur";
  cmds.push({ id: `style-${s.id}`, usage: `Style : ${s.name}`, aspect_ratio: "4:3",
    prompt: `${ext ? "An outdoor space" : "A room"} in the « ${s.name} » style: ${s.summary} Key elements: ${s.keys.join("; ")}. Materials: ${s.materials.map(matName).join(", ")}. Palette close to ${s.palette.join(", ")}. Avoid: ${s.avoid.join("; ")}.\n${ext ? EXT : INT}\n${LOCK_I}` });
}
// 3. Accords de matières : nature morte des trois matières.
for (const a of PAIRINGS) {
  cmds.push({ id: `accord-${a.slug}`, usage: `Accord de matières : ${a.name}`, aspect_ratio: "4:3",
    prompt: `A designer's material composition titled in spirit « ${a.name} »: real samples of ${a.materials.map(matName).join(", ")} arranged together as an interior architect's still life, in the proportion ${a.ratio}. Mood: ${a.mood}\n${MAT}\n${LOCK_M}` });
}
// 4. En-têtes de pages (format large).
const HEROS: Array<[string, string, string]> = [
  ["hero-transformer", "En-tête : Transformer ma pièce", "A bright Parisian living room in mid-transformation feel: one half calm and finished with a linen sofa, an oak coffee table and plaster walls, warm late-morning light, a few material samples and a fabric swatch on a side table, as if an interior designer is presenting a project."],
  ["hero-boutique", "En-tête : Boutique", "A gallery-like furniture showroom in a converted Parisian atelier: a curated arrangement of a bouclé armchair, a travertine side table, a walnut sideboard, a paper pendant lamp and ceramic vases, concrete floor, tall steel windows, soft daylight."],
  ["hero-galerie", "En-tête : Inspirations", "An interior designer's studio table seen from above at an angle: mood board with fabric swatches, wood and stone samples, paint chips, a few printed interior photographs without readable text, natural light."],
  ["hero-showroom", "En-tête : Matières", "A wall of material samples in a design library: rows of stone slabs, wood veneers, plaster panels and folded fabrics on oak shelves, soft gallery lighting."],
  ["hero-studio", "En-tête : Studio 3D", "A minimal contemporary living room photographed from a slightly elevated corner, like an architectural rendering made real: sculptural sofa, round travertine table, oak floor, large window, crisp soft light."],
];
for (const [id, usage, scene] of HEROS) cmds.push({ id, usage, aspect_ratio: "16:9", prompt: `${scene}\n${INT}\n${LOCK_I}` });
// 5. Études : pièces « avant » (réalistes, datées, sans charme) ; les « après » se feront par retouche, dans un second temps.
const AVANT: Array<[string, string]> = [
  ["etude-salon-avant", "An ordinary dated living room in a French apartment before renovation: beige walls, old laminate floor, a worn grey fabric sofa, a cheap glass coffee table, a TV unit, a ceiling light fixture, daylight from one window, slightly cluttered."],
  ["etude-chambre-avant", "An ordinary bedroom before renovation: pale yellow walls, old carpet, a pine bed with mismatched bedding, a white wardrobe, a basic ceiling lamp, daylight from a window."],
  ["etude-cuisine-avant", "An ordinary small kitchen from the 2000s before renovation: glossy cream cabinets, speckled laminate worktop, white tiles, fluorescent ceiling light, a window."],
  ["etude-sdb-avant", "An ordinary small bathroom before renovation: small white square tiles, a basic white washbasin on a pedestal, a shower curtain, chrome fittings, harsh ceiling light."],
];
for (const [id, scene] of AVANT) cmds.push({ id, usage: `Étude : ${id.replace("etude-", "").replace("-avant", "")} (avant)`, aspect_ratio: "4:3", prompt: `${scene} Photographed honestly as a real estate photo, eye level, straight verticals, natural light.\n${LOCK_I}` });

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
for (const c of cmds) writeFileSync(`content/ia/commandes/${c.id}.json`, `${JSON.stringify({ id: c.id, usage: c.usage, model: "gemini-nano-banana-2.1", aspect_ratio: c.aspect_ratio, image_size: "2K", thinking_level: "medium", store: false, tarif_nominal_usd: PRICE, prompt: c.prompt }, null, 2)}\n`);
writeFileSync("content/ia/lots/lot-2.json", `${JSON.stringify({ id: "lot-2", commandes: cmds.map((c) => c.id), tarif_nominal_usd: Math.round(PRICE * cmds.length * 100) / 100 }, null, 2)}\n`);
console.log(`${cmds.length} images, ${(PRICE * cmds.length).toFixed(2)} $ nominal, empreinte ${sha(cmds.map((c) => sha(c.prompt.trim())).join("")).slice(0, 12)}`);
