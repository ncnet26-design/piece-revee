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
