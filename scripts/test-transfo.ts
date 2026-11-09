/**
 * Test de qualité des transformations (IA gratuite de Cloudflare) sur de vraies photos de pièces libres de droits (Wikimedia Commons).
 * Même consigne que le service. Résultats : .robot/test-transfo (avant + après par modèle). Lancé par .github/workflows/test-transfo.yml.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { buildPrompt } from "../workers/ia/src/prompts.ts";
import { avecPlan, planifier } from "../workers/ia/src/plan.ts";

const ACC = process.env.CF_ACCOUNT!, TOKEN = process.env.CF_TOKEN!, OUT = ".robot/test-transfo", UA = "PieceReveeTest/1.0 (test de qualité ; https://odd-bar-c583.ewanesteves26.workers.dev)";
const PIECES: Array<[string, string]> = (process.env.PIECES?.trim() ? JSON.parse(process.env.PIECES) : [["salle-de-bain", "bathroom interior sink bathtub"], ["chambre", "messy bedroom"], ["salon", "messy living room"], ["cuisine", "messy kitchen"]]) as Array<[string, string]>;
const run = async (modele: string, entree: unknown) => {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT}/ai/run/${modele}`, { method: "POST", headers: { authorization: `Bearer ${process.env.CF_TOKEN}`, "content-type": "application/json" }, body: JSON.stringify(entree) });
  const j = await r.json() as { result?: unknown; errors?: unknown };
  if (!r.ok) throw new Error(JSON.stringify(j.errors));
  return j.result;
};
const SOUHAIT: Record<string, string> = {
  "salle-de-bain": "PRIORITY — the client asks precisely for (French, apply each request exactly): carrelage mural vert sauge, meuble vasque en bois clair avec plan blanc, miroir rond, garder la baignoire et les WC.",
  chambre: "PRIORITY — the client asks precisely for (French, apply each request exactly): mur de tête de lit couleur terracotta, linge de lit en lin, deux appliques murales.",
  salon: "PRIORITY — the client asks precisely for (French, apply each request exactly): murs vert sauge, un grand canapé beige, une suspension en papier, ranger le désordre.",
  cuisine: "PRIORITY — the client asks precisely for (French, apply each request exactly): façades vert olive, plan de travail en bois, garder l'électroménager et l'îlot.",
};
const BRIEF = "Warm japandi style: light oak wood, natural linen, sand and warm white palette, matte black details, handmade ceramics, soft natural light, a few plants.";
const MODELES = (process.env.MODELES || "flux-2-klein-4b").split(",");
mkdirSync(OUT, { recursive: true });

async function photo(q: string) {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=15&gsrsearch=${encodeURIComponent(`${q} filetype:bitmap`)}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=512`;
  const j = await (await fetch(u, { headers: { "user-agent": UA } })).json() as { query?: { pages: Record<string, { title: string; imageinfo: Array<{ thumburl: string; thumbwidth: number; thumbheight: number; width: number; height: number; mime: string; descriptionurl: string; extmetadata?: { LicenseShortName?: { value: string }; Artist?: { value: string } } }> }> } };
  const ok = Object.values(j.query?.pages ?? {}).map((p) => ({ t: p.title, i: p.imageinfo[0]! }))
    .filter((x) => x.i.mime === "image/jpeg" && x.i.width >= 1200 && x.i.width > x.i.height && x.i.thumbheight <= 512);
  return ok[0];
}
for (const [piece, q] of PIECES) {
  const p = await photo(q);
  if (!p) { console.log(`${piece} : aucune photo trouvée`); continue; }
  console.log(`${piece} : ${p.t} (${p.i.extmetadata?.LicenseShortName?.value ?? "?"}) ${p.i.descriptionurl}`);
  const img = new Uint8Array(await (await fetch(p.i.thumburl, { headers: { "user-agent": UA } })).arrayBuffer());
  writeFileSync(`${OUT}/${piece}-avant.jpg`, img);
  const r = p.i.width / p.i.height, w = 1024, h = Math.round(1024 / r / 16) * 16;
  for (const niveau of ["equilibre"]) {
    const prompt = buildPrompt({ mode: "transform", brief: `${SOUHAIT[piece] ?? ""}\n${BRIEF}`, piece, niveau, keep: ["fenetres", "portes", "murs", "plafond"], references: 0 });
    const plan = await planifier(run, { mime: "image/jpeg", b64: Buffer.from(img).toString("base64") }, prompt);
    writeFileSync(`${OUT}/${piece}-plan.txt`, plan ?? "(pas de plan)");
    console.log(`  plan : ${plan ? `${plan.split("\n").length} lignes` : "aucun"}`);
    for (const m of MODELES) {
      const form = new FormData();
      form.append("prompt", avecPlan(plan, prompt).slice(0, 4000)); form.append("width", String(w)); form.append("height", String(h));
      form.append("input_image_0", new Blob([img], { type: "image/jpeg" }), "piece.jpg");
      const t = Date.now();
      let res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACC}/ai/run/@cf/black-forest-labs/${m}`, { method: "POST", headers: { authorization: `Bearer ${TOKEN}` }, body: form });
      for (let k = 0; k < 2 && res.status >= 500; k++) { await new Promise((r) => setTimeout(r, 3000)); res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACC}/ai/run/@cf/black-forest-labs/${m}`, { method: "POST", headers: { authorization: `Bearer ${TOKEN}` }, body: form }); }
      const j = await res.json() as { success: boolean; errors: unknown; result?: { image?: string } };
      console.log(`  ${m} ${niveau} : HTTP ${res.status} ${((Date.now() - t) / 1000).toFixed(1)} s ${j.success ? "" : JSON.stringify(j.errors)}`);
      if (j.result?.image) writeFileSync(`${OUT}/${piece}-${m}-${niveau}.jpg`, Buffer.from(j.result.image, "base64"));
    }
  }
}
writeFileSync(`${OUT}/consigne-exemple.txt`, buildPrompt({ mode: "transform", brief: BRIEF, piece: "salle-de-bain", niveau: "equilibre", keep: ["fenetres", "portes", "murs", "plafond"], references: 0 }));
