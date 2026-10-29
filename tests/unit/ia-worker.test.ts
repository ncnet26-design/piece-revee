import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "@/workers/ia/src/index";
import { _setPause, chooseProvider, pickSize } from "@/workers/ia/src/providers";
import { buildPrompt } from "@/workers/ia/src/prompts";
import { parseJobBody } from "@/workers/ia/src/validate";
import type { Env, KVNamespace } from "@/workers/ia/src/config";

/** KV en mémoire, suffisant pour simuler Cloudflare. */
function memoryKV(): KVNamespace & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    async get(k: string, type?: "arrayBuffer") { const v = data.get(k); if (v === undefined) return null; if (type === "arrayBuffer") return (v as Uint8Array).buffer as ArrayBuffer; return v as string; },
    async put(k: string, v: string | ArrayBuffer | Uint8Array) { data.set(k, v); },
    async delete(k: string) { data.delete(k); },
  } as KVNamespace & { data: Map<string, unknown> };
}
const ORIGIN = "http://localhost:3000";
const PNG = "data:image/png;base64,iVBORw0KGgo=";
const JPEG_B64 = btoa("\xFF\xD8\xFFfausse-image");
const call = (env: Env, path: string, init: RequestInit = {}) =>
  worker.fetch(new Request(`https://ia.test${path}`, { ...init, headers: { Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": "1.2.3.4", ...(init.headers ?? {}) } }), env, { waitUntil() {} });
const body = (o: Record<string, unknown>) => JSON.stringify({ mode: "generate", brief: "Salon haussmannien, velours vert", visiteur: "visiteur-test-01", ...o });

describe("service d'images v2", () => {
  let env: Env & { QUOTA: ReturnType<typeof memoryKV> };
  const fetchMock = vi.fn();
  beforeEach(() => { env = { QUOTA: memoryKV(), OPENAI_API_KEY: "sk-test" }; vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); _setPause(async () => {}); });
  afterEach(() => vi.unstubAllGlobals());

  it("génère une pièce depuis un texte (OpenAI, appel direct), stocke l'image et compte le coût réel", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ b64_json: JPEG_B64 }], usage: { input_tokens_details: { text_tokens: 1000, image_tokens: 0 }, output_tokens: 4000 } }), { status: 200 }));
    const r = await call(env, "/v2/jobs", { method: "POST", body: body({ quality: "standard", width: 1600, height: 1000 }) });
    expect(r.status).toBe(201);
    const job = await r.json() as { id: string; status: string; imageUrl: string; costUsd: number; provider: string; model: string };
    expect(job.status).toBe("terminee");
    expect(job.provider).toBe("openai");
    expect(job.model).toBe("gpt-image-2.5-sunburst");
    expect(job.costUsd).toBeCloseTo((1000 * 5 + 4000 * 30) / 1e6, 5);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/images/generations");
    const sent = JSON.parse(String((init as RequestInit).body));
    expect(sent).toMatchObject({ model: "gpt-image-2.5-sunburst", quality: "medium", size: "1536x960", output_format: "jpeg" });
    expect(sent.prompt).toContain("Salon haussmannien");
    const img = await call(env, `/v2/images/${job.id}`);
    expect(img.headers.get("content-type")).toBe("image/jpeg");
    expect(new Uint8Array(await img.arrayBuffer())[0]).toBe(0xff);
  });

  it("transforme une photo en multipart avec les consignes de conservation", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ b64_json: JPEG_B64 }] }), { status: 200 }));
    const r = await call(env, "/v2/jobs", { method: "POST", body: body({ mode: "transform", photo: PNG, references: [PNG], keep: ["fenetres", "moulures", "inconnu"] }) });
    const job = await r.json() as { status: string };
    expect(job.status).toBe("terminee");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/images/edits");
    const form = (init as RequestInit).body as FormData;
    expect(form.getAll("image[]")).toHaveLength(2);
    expect(String(form.get("prompt"))).toContain("every window");
    expect(String(form.get("prompt"))).toContain("mouldings");
    expect(form.get("input_fidelity")).toBeNull();
  });

  it("refuse une transformation sans photo", async () => {
    const r = await call(env, "/v2/jobs", { method: "POST", body: body({ mode: "transform" }) });
    expect(r.status).toBe(400);
  });

  it("réessaie sur une erreur passagère puis réussit", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ b64_json: JPEG_B64 }] }), { status: 200 }));
    const job = await (await call(env, "/v2/jobs", { method: "POST", body: body({}) })).json() as { status: string };
    expect(job.status).toBe("terminee");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("une erreur définitive est rapportée, puis la tâche peut être relancée", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "Your request was rejected by the safety system" } }), { status: 400 }));
    const job = await (await call(env, "/v2/jobs", { method: "POST", body: body({}) })).json() as { id: string; status: string; error: { message: string; retryable: boolean } };
    expect(job.status).toBe("erreur");
    expect(job.error.message).toMatch(/filtre de contenu/);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ b64_json: JPEG_B64 }] }), { status: 200 }));
    const again = await (await call(env, `/v2/jobs/${job.id}/retry`, { method: "POST" })).json() as { status: string; attempts: number };
    expect(again.status).toBe("terminee");
    expect(again.attempts).toBe(2);
  });

  it("mode asynchrone OpenAI : la tâche est suivie jusqu'à l'image", async () => {
    env.OPENAI_MODE = "background";
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: "resp_123", status: "queued" }), { status: 200 }));
    const job = await (await call(env, "/v2/jobs", { method: "POST", body: body({ quality: "premium" }) })).json() as { id: string; status: string };
    expect(job.status).toBe("en_cours");
    const sent = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body));
    expect(sent).toMatchObject({ background: true, store: true, tool_choice: { type: "image_generation" } });
    expect(sent.tools[0]).toMatchObject({ type: "image_generation", quality: "high", size: "2048x1360" });
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: "in_progress" }), { status: 200 }));
    expect(((await (await call(env, `/v2/jobs/${job.id}`)).json()) as { status: string }).status).toBe("en_cours");
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: "completed", output: [{ type: "image_generation_call", result: JPEG_B64 }] }), { status: 200 }));
    const done = await (await call(env, `/v2/jobs/${job.id}`)).json() as { status: string; imageUrl: string };
    expect(done.status).toBe("terminee");
    expect(done.imageUrl).toBe(`https://ia.test/v2/images/${job.id}`);
  });

  it("respecte le budget : plafond d'images du visiteur et budget mensuel", async () => {
    env.IMAGES_VISITEUR_JOUR = "1";
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: JPEG_B64 }] }), { status: 200 }));
    expect((await call(env, "/v2/jobs", { method: "POST", body: body({}) })).status).toBe(201);
    const r = await call(env, "/v2/jobs", { method: "POST", body: body({}) });
    expect(r.status).toBe(429);
    env.IMAGES_VISITEUR_JOUR = "10"; env.BUDGET_MOIS_USD = "0.01";
    expect((await call(env, "/v2/jobs", { method: "POST", body: body({ visiteur: "autre-visiteur-02" }) })).status).toBe(429);
    const u = await (await call(env, "/v2/usage?visiteur=visiteur-test-01")).json() as { visitorDay: { images: number }; fournisseurs: string[] };
    expect(u.visitorDay.images).toBe(1);
    expect(u.fournisseurs).toEqual(["openai"]);
  });

  it("refuse les origines étrangères et les clés absentes", async () => {
    const r = await worker.fetch(new Request("https://ia.test/v2/jobs", { method: "POST", headers: { Origin: "https://ailleurs.example" }, body: body({}) }), env, { waitUntil() {} });
    expect(r.status).toBe(403);
    const none = await call({ QUOTA: memoryKV() }, "/v2/jobs", { method: "POST", body: body({}) });
    expect(none.status).toBe(503);
  });
});

describe("choix du fournisseur et formats", () => {
  it("choisit le fournisseur demandé s'il est configuré, sinon le réglage, sinon le premier", () => {
    expect(chooseProvider({ GEMINI_API_KEY: "g", FAL_KEY: "f" }, "fal")?.id).toBe("fal");
    expect(chooseProvider({ GEMINI_API_KEY: "g", FAL_KEY: "f" }, "openai")?.id).toBe("gemini");
    expect(chooseProvider({ GEMINI_API_KEY: "g", FAL_KEY: "f", IA_FOURNISSEUR: "fal" })?.id).toBe("fal");
    expect(chooseProvider({})).toBeNull();
  });
  it("tailles : multiples de 16, rapport borné, tailles standard pour les anciens modèles", () => {
    expect(pickSize(4000, 3000, "premium", "gpt-image-2")).toEqual({ w: 2048, h: 1536 });
    expect(pickSize(1000, 5000, "standard", "gpt-image-2.5-flare")).toEqual({ w: 512, h: 1536 });
    expect(pickSize(1600, 1000, "premium", "gpt-image-1.5")).toEqual({ w: 1536, h: 1024 });
  });
  it("validation : écarte les images non conformes et les champs inconnus", () => {
    expect(parseJobBody({ mode: "generate", brief: "ok ok", visiteur: "abcdefgh", photo: "http://x" })).toBeNull();
    expect(parseJobBody({ mode: "generate", brief: "ok ok", visiteur: "abcdefgh", keep: ["sol", "pirate"] })?.keep).toEqual(["sol"]);
  });
  it("consigne : texte libre à conserver et références", () => {
    const p = buildPrompt({ mode: "transform", brief: "Bureau", keepFree: "la bibliothèque", references: 2 });
    expect(p).toContain("la bibliothèque");
    expect(p).toContain("Images 2 to 3 are references");
  });
});

describe("analyse et moodboard (Gemini)", () => {
  let env: Env & { QUOTA: ReturnType<typeof memoryKV> };
  const fetchMock = vi.fn();
  beforeEach(() => { env = { QUOTA: memoryKV(), GEMINI_API_KEY: "g-test" }; vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); _setPause(async () => {}); });
  afterEach(() => vi.unstubAllGlobals());
  const gem = (o: unknown) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(o) }] } }] }), { status: 200 });

  it("repère objets et surfaces, convertit les zones et ignore ce qui est invalide", async () => {
    fetchMock.mockResolvedValueOnce(gem({
      objects: [
        { type: "canape", label: "Canapé courbe en bouclé", shape: ["arrondi"], materials: ["boucle"], colors: [{ name: "Crème", hex: "#efe5d3" }], style: ["organique"], width_cm: 220, depth_cm: 95, height_cm: 75, box_2d: [500, 100, 900, 450] },
        { type: "fusee", label: "Inconnu", box_2d: [0, 0, 10, 10] },
        { type: "tapis", label: "Tapis", box_2d: [900, 900, 100, 100] },
      ],
      surfaces: [{ kind: "mur", label: "Mur à la chaux", colors: [{ name: "Blanc chaud", hex: "#EEE8DD" }, { name: "faux", hex: "beige" }], material: "enduit", finish: "mat", box_2d: [0, 0, 600, 1000] }],
    }));
    const r = await call(env, "/v2/analyse", { method: "POST", body: JSON.stringify({ image: PNG, visiteur: "visiteur-test-01" }) });
    expect(r.status).toBe(200);
    const d = await r.json() as { objects: Array<{ type: string; zone: object; colors: Array<{ hex: string }> }>; surfaces: Array<{ kind: string; zone: object; colors: unknown[] }> };
    expect(d.objects).toHaveLength(1);
    expect(d.objects[0]).toMatchObject({ type: "canape", zone: { x: 10, y: 50, w: 35, h: 40 }, colors: [{ hex: "#EFE5D3" }] });
    expect(d.surfaces).toEqual([expect.objectContaining({ kind: "mur", zone: { x: 0, y: 0, w: 100, h: 60 } })]);
    expect(d.surfaces[0]!.colors).toHaveLength(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("models/gemini-3.8-flash:generateContent");
    expect((init as RequestInit).headers).toMatchObject({ "x-goog-api-key": "g-test" });
  });

  it("compose un moodboard à partir des inspirations, sans matière hors catalogue", async () => {
    fetchMock.mockResolvedValueOnce(gem({ style: "Japandi chaleureux", summary: "Calme et naturel.", palette: [{ name: "Lin", hex: "#E6DCCB" }], materials: ["chene-fume", "inventee"], objects: [{ type: "table-basse", label: "Table basse ronde en chêne", materials: ["bois"], colors: [], shape: ["ronde"] }], brief_fr: "Salon apaisé.", brief_en: "Calm living room." }));
    const r = await call(env, "/v2/moodboard", { method: "POST", body: JSON.stringify({ inspirations: [PNG, PNG], matieres: [{ id: "chene-fume", name: "Chêne fumé" }], visiteur: "visiteur-test-01" }) });
    expect(r.status).toBe(200);
    const d = await r.json() as { style: string; materials: string[]; objects: unknown[]; brief_en: string };
    expect(d).toMatchObject({ style: "Japandi chaleureux", materials: ["chene-fume"], brief_en: "Calm living room." });
    const sent = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body));
    expect(sent.contents[0].parts.filter((p: object) => "inline_data" in p)).toHaveLength(2);
    expect(sent.contents[0].parts[0].text).toContain("chene-fume: Chêne fumé");
  });

  it("refuse un moodboard sans image", async () => {
    const r = await call(env, "/v2/moodboard", { method: "POST", body: JSON.stringify({ inspirations: [], visiteur: "visiteur-test-01" }) });
    expect(r.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("la consigne de transformation traite les références comme des inspirations", () => {
    const p = buildPrompt({ mode: "transform", brief: "Salon japandi", references: 3, inspirations: true });
    expect(p).toContain("Images 2 to 4 are the client's inspirations");
    expect(p).toContain("Do not copy their architecture");
    expect(p).not.toContain("are references (materials");
  });
});

describe("recherche de produits sur internet", () => {
  let env: Env & { QUOTA: ReturnType<typeof memoryKV> };
  const fetchMock = vi.fn();
  beforeEach(() => { env = { QUOTA: memoryKV(), GEMINI_API_KEY: "g-test" }; vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); _setPause(async () => {}); });
  afterEach(() => vi.unstubAllGlobals());

  it("lit les données produit publiées par le vendeur (schema.org)", async () => {
    const { parseProduct } = await import("@/workers/ia/src/recherche");
    const html = `<html><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList"},{"@type":"Product","name":"Vase en grès beige","brand":{"@type":"Brand","name":"Atelier"},"offers":{"@type":"Offer","price":"39,90","priceCurrency":"EUR","availability":"https://schema.org/InStock"}}]}</script></html>`;
    expect(parseProduct(html)).toEqual({ name: "Vase en grès beige", brand: "Atelier", price: 39.9, currency: "EUR", availability: "InStock" });
    expect(parseProduct("<html>pas de produit</html>")).toBeNull();
  });

  it("ne garde que les pages trouvées par la recherche Google et n'affiche un prix que s'il est relevé sur la page", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("generativelanguage")) return new Response(JSON.stringify({ candidates: [{
        content: { parts: [{ text: '```json\n{"products":[{"title":"Vase grès","url":"https://boutique-a.fr/vase-gres","merchant":"Boutique A"},{"title":"Lien inventé","url":"https://site-invente.com/x","merchant":"?"},{"title":"Vase sans données","url":"https://boutique-b.fr/vase","merchant":"Boutique B"}]}\n```' }] },
        groundingMetadata: { groundingChunks: [{ web: { uri: "https://boutique-a.fr/vase-gres", title: "boutique-a.fr" } }, { web: { uri: "https://boutique-b.fr/vase", title: "boutique-b.fr" } }], searchEntryPoint: { renderedContent: "<div>suggestions</div>" }, webSearchQueries: ["vase grès beige"] },
      }] }), { status: 200 });
      if (url.includes("boutique-a.fr")) return new Response(`<script type="application/ld+json">{"@type":"Product","name":"Vase en grès beige mat","offers":{"price":45,"priceCurrency":"EUR"}}</script>`, { status: 200, headers: { "content-type": "text/html" } });
      if (url.includes("boutique-b.fr")) return new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } });
      return new Response("", { status: 404 });
    });
    const r = await call(env, "/v2/recherche", { method: "POST", body: JSON.stringify({ query: "vase en grès beige mat", label: "Vase", visiteur: "visiteur-test-01" }) });
    expect(r.status).toBe(200);
    const d = await r.json() as { produits: Array<{ url: string; price: number | null; source: string }>; suggestions: string; requetes: string[] };
    expect(d.produits.map((p) => p.url)).toEqual(["https://boutique-a.fr/vase-gres", "https://boutique-b.fr/vase"]);
    expect(d.produits[0]).toMatchObject({ price: 45, source: "page" });
    expect(d.produits[1]).toMatchObject({ price: null, source: "recherche" });
    expect(d.suggestions).toBe("<div>suggestions</div>");
    const sent = JSON.parse(String((fetchMock.mock.calls.find((c) => String(c[0]).includes("generativelanguage"))![1] as RequestInit).body));
    expect(sent.tools).toEqual([{ google_search: {} }]);
  });
});

describe("titre depuis l'adresse", () => {
  it("rend lisible l'adresse d'une page produit", async () => {
    const { slugTitle } = await import("@/workers/ia/src/recherche");
    expect(slugTitle("https://www.drawer.fr/table-basse-ovale-effet-travertin-119x60cm-sam.html")).toBe("Table basse ovale effet travertin 119x60cm sam");
    expect(slugTitle("https://www.laredoute.fr/ppdp/prod-602053824.aspx")).toBe("");
  });
});
describe("titre depuis l'adresse (références)", () => {
  it("retire les références techniques", async () => {
    const { slugTitle } = await import("@/workers/ia/src/recherche");
    expect(slugTitle("https://www.madeindesign.com/prod-vase-isold-ceramique-beige-o-12-5-x-h-22-cm-bloomingville-refm114455401.html")).toBe("Vase isold ceramique beige o 12 5 x h 22 cm bloomingville");
  });
});
