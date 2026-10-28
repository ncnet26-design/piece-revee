/**
 * Robot (GitHub Actions) : photos d'inspiration créées par IA, dans l'esprit des rendus d'architectes d'intérieur.
 * Lit content/data/ai-prompts.json, crée les images manquantes (au plus MAX_IMAGES par lancement) et les ajoute
 * à content/data/inspirations.json (mention « Image créée par IA »).
 * Avec le secret GitHub GEMINI_API_KEY (jamais dans le code), Gemini est utilisé ; chaque image consomme alors du crédit Google :
 * le nombre d'images par lancement est donc plafonné.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const KEY = process.env.GEMINI_API_KEY;
const MAX = Number(process.env.MAX_IMAGES ?? 40);
/**
 * Sans clé Gemini, les images sont créées gratuitement par le service Pollinations (modèle FLUX.1 schnell,
 * licence Apache 2.0 qui autorise l'usage commercial des images produites).
 */
async function pollinations(prompt: string, seed: number): Promise<Buffer | null> {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=1600&nologo=true&model=flux&seed=${seed}&enhance=false&private=true`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(240000) });
      if (r.ok && (r.headers.get("content-type") ?? "").startsWith("image/")) return Buffer.from(await r.arrayBuffer());
      console.log(`  essai ${attempt + 1} : ${r.status}`);
    } catch (e) { console.log(`  essai ${attempt + 1} : ${(e as Error).message}`); }
    await new Promise((res) => setTimeout(res, 20000));
  }
  return null;
}
type P = { id: string; collection: string; title: string; prompt: string };
const prompts = JSON.parse(readFileSync("content/data/ai-prompts.json", "utf8")) as P[];
const list = JSON.parse(readFileSync("content/data/inspirations.json", "utf8")) as Array<Record<string, unknown>>;
mkdirSync("public/inspirations", { recursive: true });
let made = 0;
for (const p of prompts) {
  if (made >= MAX) break;
  const id = `ia-${p.id}`;
  if (list.some((x) => x.id === id) || existsSync(`public/inspirations/${id}.webp`)) continue;
  const full = [
    "Photorealistic interior design visualization, as published by a top interior architecture studio and in high-end decoration magazines.",
    p.prompt,
    "Ultra realistic materials and textures, refined composition, natural light, 35mm architectural photography, no people, no text, no watermark, no logo.",
  ].join(" ");
  try {
    let buf: Buffer | null = null;
    if (KEY) {
      const body = { model: "gemini-nano-banana-2.1", input: [{ type: "text", text: full }], response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "4:5", image_size: "2K" }, generation_config: { thinking_level: "minimal" }, store: false };
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": KEY }, body: JSON.stringify(body), signal: AbortSignal.timeout(180000) });
      const j = await r.json() as { steps?: Array<{ type: string; content?: Array<{ type: string; data?: string }> }>; error?: { message?: string } };
      const data = j.steps?.flatMap((st) => (st.type === "model_output" ? st.content ?? [] : [])).find((c) => c.type === "image" && c.data)?.data;
      if (data) buf = Buffer.from(data, "base64"); else console.log(`✗ ${id} (Gemini) : ${j.error?.message ?? r.status}`);
    } else {
      buf = await pollinations(full, [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0));
      await new Promise((res) => setTimeout(res, 8000));
    }
    if (!buf) { console.log(`✗ ${id}`); continue; }
    await sharp(buf).resize(1600, 2000, { fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toFile(`public/inspirations/${id}.webp`);
    await sharp(buf).resize(640, 800, { fit: "cover" }).webp({ quality: 80 }).toFile(`public/inspirations/${id}-640.webp`);
    const meta = await sharp(`public/inspirations/${id}.webp`).metadata();
    list.unshift({ id, collection: p.collection, src: `/inspirations/${id}.webp`, thumb: `/inspirations/${id}-640.webp`, width: meta.width, height: meta.height, title: p.title, author: "Image créée par IA", authorUrl: null, source: KEY ? "Gemini" : "FLUX.1 schnell (Pollinations)", sourceUrl: "", license: "Image générée par IA, à titre d'inspiration" });
    writeFileSync("content/data/inspirations.json", JSON.stringify(list, null, 1));
    made++; console.log(`✓ ${id}`);
  } catch (e) { console.log(`✗ ${id} : ${(e as Error).message}`); }
}
console.log(`${made} image(s) créée(s).`);
