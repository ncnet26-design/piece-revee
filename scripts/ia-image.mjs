/**
 * Génère UNE image éditoriale avec Google Gemini à partir d'une commande validée (content/ia/commandes/<id>.json).
 * Garde-fous : un seul appel payant, aucune nouvelle tentative automatique ; la confirmation doit égaler
 * le début de l'empreinte SHA-256 de la consigne (la consigne approuvée ne peut pas changer en route).
 * Clé lue uniquement dans GEMINI_API_KEY (secret GitHub), jamais affichée.
 * Usage : node scripts/ia-image.mjs <id> <confirmation>
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [id, confirmation] = process.argv.slice(2);
if (!id || !/^[a-z0-9-]+$/.test(id)) throw new Error("identifiant de commande invalide");
const cmd = JSON.parse(readFileSync(`content/ia/commandes/${id}.json`, "utf8"));
const sha = createHash("sha256").update(cmd.prompt.trim()).digest("hex");
if (!confirmation || !sha.startsWith(confirmation) || confirmation.length < 12) {
  console.error(`Confirmation refusée : la consigne a l'empreinte ${sha.slice(0, 12)}. Rien n'a été envoyé.`);
  process.exit(2);
}
const key = process.env.GEMINI_API_KEY;
if (!key) { console.error("Secret GEMINI_API_KEY absent : rien n'a été envoyé."); process.exit(3); }

const payload = {
  model: cmd.model,
  input: [{ type: "text", text: cmd.prompt.trim() }],
  response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: cmd.aspect_ratio, image_size: cmd.image_size },
  store: false,
  generation_config: { thinking_level: cmd.thinking_level },
};
console.log(`Appel unique : ${cmd.model}, ${cmd.aspect_ratio}, ${cmd.image_size}, consigne ${sha.slice(0, 12)}`);
const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 240_000);
const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
  method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(payload), signal: ctrl.signal,
});
clearTimeout(t);
const text = await r.text();
if (!r.ok) { console.error(`Erreur du service (${r.status}) : ${text.slice(0, 600)}`); process.exit(4); }
const res = JSON.parse(text);
if (res.status && res.status !== "completed") console.error(`Statut de la tâche : ${res.status} ${JSON.stringify(res.error ?? {}).slice(0, 300)}`);
const images = [];
for (const step of res.outputs ?? res.steps ?? []) for (const b of step.content ?? [step]) if (b?.type === "image" && b.data) images.push(b.data);
if (!images.length && res.output_image?.data) images.push(res.output_image.data);
mkdirSync("public/editorial/ia", { recursive: true });
images.forEach((d, i) => writeFileSync(`public/editorial/ia/${id}${i ? `-${i + 1}` : ""}.jpg`, Buffer.from(d, "base64")));
writeFileSync(`public/editorial/ia/${id}.json`, JSON.stringify({
  id, usage: cmd.usage, generator: `Google ${cmd.model}`, date: new Date().toISOString(), prompt_sha256: sha,
  aspect_ratio: cmd.aspect_ratio, image_size: cmd.image_size, images: images.length, usage_tokens: res.usage ?? null,
  label: "Image générée par IA", synthid: "Filigrane invisible SynthID ajouté par Google",
}, null, 2));
console.log(`${images.length} image(s) reçue(s).`);
if (!images.length) { console.error(`Aucune image dans la réponse : ${text.slice(0, 600)}`); process.exit(5); }
