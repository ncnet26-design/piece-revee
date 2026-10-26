/**
 * Tarifs des modèles (dollars par million de jetons), relevés le 26/10/2026 dans la documentation Anthropic.
 * À mettre à jour dans docs/DECISIONS.md en cas de changement.
 */
export const MODELS = {
  study: "claude-opus-5-5",
  advisor: "claude-sonnet-5-5",
  advisorComplex: "claude-opus-5-5",
  quick: "claude-haiku-5-5",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

const PRICES: Record<ModelId, { input: number; output: number; cacheRead: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
};

export const USD_TO_EUR = 0.9;

export interface TokenUsage { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null }

/** Coût d'un appel en centimes d'euro (arrondi au centime supérieur). */
export function callCostCents(model: ModelId, usage: TokenUsage): number {
  const p = PRICES[model];
  const usd = (usage.input_tokens * p.input + usage.output_tokens * p.output + (usage.cache_read_input_tokens ?? 0) * p.cacheRead) / 1_000_000;
  return Math.ceil(usd * USD_TO_EUR * 100);
}
