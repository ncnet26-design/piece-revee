/**
 * Génère des images éditoriales avec Google Gemini à partir de commandes validées :
 *  - une commande : content/ia/commandes/<id>.json, confirmation = début de l'empreinte SHA-256 de sa consigne ;
 *  - un lot : content/ia/lots/<id>.json, confirmation = début de l'empreinte SHA-256 des empreintes de ses consignes, dans l'ordre.
 * Garde-fous : un seul appel payant par image, aucune nouvelle tentative automatique, 3 appels en parallèle au plus.
 * Clé lue uniquement dans GEMINI_API_KEY (secret GitHub), jamais affichée.
 * Usage : node scripts/ia-image.mjs <id> <confirmation>
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [id, confirmation] = process.argv.slice(2);
if (!id || !/^[a-z0-9-]+$/.test(id)) throw new Error("identifiant invalide");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const load = (c) => JSON.parse(readFileSync(`content/ia/commandes/${c}.json`, "utf8"));
const lotFile = `content/ia/lots/${id}.json`;
const cmds = existsSync(lotFile) ? JSON.parse(readFileSync(lotFile, "utf8")).commandes.map(load) : [load(id)];
const expected = cmds.length === 1 && !existsSync(lotFile) ? sha(cmds[0].prompt.trim()) : sha(cmds.map((c) => sha(c.prompt.trim())).join(""));
if (!confirmation || confirmation.length < 12 || !expected.startsWith(confirmation)) {
  console.error(`Confirmation refusée : empreinte attendue ${expected.slice(0, 12)}. Rien n'a été envoyé.`);
  process.exit(2);
}
const key = process.env.GEMINI_API_KEY;
if (!key) { console.error("Secret GEMINI_API_KEY absent : rien n'a été envoyé."); process.exit(3); }
mkdirSync("public/editorial/ia", { recursive: true });

async function one(cmd) {
  const ps = sha(cmd.prompt.trim());
  const payload = {
    model: cmd.model,
    input: [{ type: "text", text: cmd.prompt.trim() }],
    response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: cmd.aspect_ratio, image_size: cmd.image_size },
    store: false,
    generation_config: { thinking_level: cmd.thinking_level },
  };
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(payload), signal: AbortSignal.timeout(240_000),
    });
    const text = await r.text();
    if (!r.ok) return { id: cmd.id, ok: false, error: `HTTP ${r.status} ${text.slice(0, 300)}` };
    const res = JSON.parse(text);
    const images = [];
    for (const step of res.steps ?? res.outputs ?? []) for (const b of step.content ?? [step]) if (b?.type === "image" && b.data) images.push(b.data);
    if (!images.length && res.output_image?.data) images.push(res.output_image.data);
    images.forEach((d, i) => writeFileSync(`public/editorial/ia/${cmd.id}${i ? `-${i + 1}` : ""}.jpg`, Buffer.from(d, "base64")));
    writeFileSync(`public/editorial/ia/${cmd.id}.json`, `${JSON.stringify({
      id: cmd.id, usage: cmd.usage, generator: `Google ${cmd.model}`, date: new Date().toISOString(), prompt_sha256: ps,
      aspect_ratio: cmd.aspect_ratio, image_size: cmd.image_size, images: images.length, status: res.status ?? null, usage_tokens: res.usage ?? null,
      label: "Image générée par IA", synthid: "Filigrane invisible SynthID ajouté par Google",
    }, null, 2)}\n`);
    return { id: cmd.id, ok: images.length > 0, images: images.length, error: images.length ? null : `aucune image (statut ${res.status})` };
  } catch (e) {
    return { id: cmd.id, ok: false, error: String(e).slice(0, 300) };
  }
}

console.log(`${cmds.length} appel(s) payant(s), un par image, empreinte ${expected.slice(0, 12)}`);
const queue = [...cmds], results = [];
await Promise.all([0, 1, 2].map(async () => { for (let c; (c = queue.shift());) { const r = await one(c); results.push(r); console.log(r.ok ? `✓ ${r.id} (${r.images})` : `✗ ${r.id} : ${r.error}`); } }));
writeFileSync(`public/editorial/ia/_rapport-${id}.json`, `${JSON.stringify({ id, date: new Date().toISOString(), results }, null, 2)}\n`);
console.log(`${results.filter((r) => r.ok).length}/${cmds.length} réussies.`);
