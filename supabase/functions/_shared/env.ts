import { z } from "zod";

/** Variables d'environnement des Edge Functions (secrets Supabase). Jamais exposées au navigateur. */
const Env = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  SITE_URL: z.string().url().default("https://odd-bar-c583.ewanesteves26.workers.dev"),
  ANTHROPIC_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  IMAGE_PROVIDER: z.enum(["cloudflare", "fal", "replicate", "mock"]).default("cloudflare"),
  IMAGE_PROVIDER_FALLBACK: z.enum(["cloudflare", "fal", "replicate", "mock", "none"]).default("none"),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_AI_TOKEN: z.string().optional(),
  FAL_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  ALERT_EMAIL: z.string().email().optional(),
  STUDY_COST_ALERT_CENTS: z.coerce.number().int().default(120),
  IP_HASH_SALT: z.string().min(16).optional(),
});
export type EnvT = z.infer<typeof Env>;

let cached: EnvT | null = null;
export function env(): EnvT {
  cached ??= Env.parse(Deno.env.toObject());
  return cached;
}
