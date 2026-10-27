import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { callCostCents, type ModelId } from "./core/costs.ts";
import { env } from "./env.ts";
import { admin, HttpError, log } from "./http.ts";

let client: Anthropic | null = null;
export function claude(): Anthropic {
  const key = env().ANTHROPIC_API_KEY;
  if (!key) throw new HttpError(503, "ai_unavailable", "L'IA n'est pas encore activée sur ce service.");
  client ??= new Anthropic({ apiKey: key, maxRetries: 2, timeout: 10 * 60 * 1000 });
  return client;
}

/** Repli serveur en cas de refus d'un filtre de sécurité : la requête est rejouée sur un modèle de repli, dans le même appel. */
export const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

export type ImageInput = { mediaType: "image/jpeg" | "image/png" | "image/webp"; base64: string };

export async function logCall(o: { userId: string | null; projectId: string | null; feature: string; model: ModelId; usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null }; latencyMs: number; ok: boolean }) {
  const cost = callCostCents(o.model, o.usage);
  await admin().from("ai_calls").insert({ user_id: o.userId, project_id: o.projectId, feature: o.feature, provider: "anthropic", model: o.model, input_tokens: o.usage.input_tokens, output_tokens: o.usage.output_tokens, cost_cents: cost, latency_ms: o.latencyMs, validation_ok: o.ok });
  return cost;
}

/**
 * Appel à sortie structurée : le schéma Zod contraint la réponse (sorties structurées de l'API), puis est revalidé ici.
 * En cas d'échec de validation, un second essai est fait avec les erreurs ; ensuite on abandonne proprement.
 */
export async function structured<S extends z.ZodType>(o: {
  model: ModelId; system: string; text: string; images?: ImageInput[]; schema: S; effort: "low" | "medium" | "high";
  maxTokens?: number; userId: string | null; projectId: string | null; feature: string; extraCheck?: (v: z.infer<S>) => string[];
}): Promise<{ data: z.infer<S>; costCents: number }> {
  let costCents = 0; let feedback = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const t0 = Date.now();
    const content: Anthropic.Beta.BetaContentBlockParam[] = [
      ...(o.images ?? []).map((im) => ({ type: "image" as const, source: { type: "base64" as const, media_type: im.mediaType, data: im.base64 } })),
      { type: "text", text: o.text + feedback },
    ];
    const stream = claude().beta.messages.stream({
      model: o.model, max_tokens: o.maxTokens ?? 32000,
      system: [{ type: "text", text: o.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
      output_config: { effort: o.effort, format: zodOutputFormat(o.schema) },
      ...FALLBACK,
    });
    const msg = await stream.finalMessage();
    const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    let parsed: unknown = null; let errors: string[] = [];
    if (msg.stop_reason === "refusal") errors = ["refus"];
    else { try { parsed = JSON.parse(text); } catch { errors = ["JSON illisible"]; } }
    let ok = false; let value: z.infer<S> | null = null;
    if (!errors.length) {
      const r = o.schema.safeParse(parsed);
      if (r.success) { value = r.data; errors = o.extraCheck?.(r.data) ?? []; ok = errors.length === 0; }
      else errors = r.error.issues.slice(0, 12).map((i) => `${i.path.join(".")} : ${i.message}`);
    }
    costCents += await logCall({ userId: o.userId, projectId: o.projectId, feature: o.feature, model: o.model, usage: msg.usage, latencyMs: Date.now() - t0, ok });
    if (ok && value !== null) return { data: value, costCents };
    log("warn", "structured_invalid", { feature: o.feature, attempt, errors: errors.slice(0, 5) });
    if (errors[0] === "refus") break;
    feedback = `\n\nTa réponse précédente ne respectait pas le format. Corrige ces points : ${errors.join(" ; ")}`;
  }
  throw new HttpError(502, "invalid_ai_output", "L'étude n'a pas pu être finalisée. Réessayez : rien ne vous a été décompté.");
}
