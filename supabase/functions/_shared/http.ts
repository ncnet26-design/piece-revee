import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { env } from "./env.ts";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = [env().SITE_URL, "http://localhost:3000", "http://localhost:4173"];
  return {
    "access-control-allow-origin": allowed.includes(origin) ? origin : env().SITE_URL,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "origin",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "content-type": "application/json; charset=utf-8" } });
}

/** Journal structuré, sans donnée personnelle. */
export function log(level: "info" | "warn" | "error", event: string, data: Record<string, unknown> = {}) {
  console[level === "info" ? "log" : level](JSON.stringify({ level, event, at: new Date().toISOString(), ...data }));
}

/** Client « service » : contourne la RLS, utilisé uniquement côté serveur après contrôle d'accès. */
export function admin(): SupabaseClient {
  return createClient(env().SUPABASE_URL, env().SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

export async function requireUser(req: Request): Promise<User> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "auth", "Connectez-vous pour continuer.");
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "auth", "Votre session a expiré. Reconnectez-vous.");
  return data.user;
}

export async function ipHash(req: Request): Promise<string> {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnu";
  const data = new TextEncoder().encode(`${env().IP_HASH_SALT ?? "sel-par-defaut-a-changer"}:${ip}`);
  const d = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(d)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function rateLimit(key: string, windowSeconds: number, max: number) {
  const { data, error } = await admin().rpc("hit_rate_limit", { p_key: key, p_window_seconds: windowSeconds, p_max: max });
  if (error) throw error;
  if (!data) throw new HttpError(429, "rate_limited", "Trop de demandes en peu de temps. Réessayez dans quelques minutes.");
}

/** Enveloppe commune : CORS, méthode, erreurs propres et journalisées. */
export function handler(fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
    if (req.method !== "POST") return json(req, { error: "method", message: "Méthode non autorisée." }, 405);
    try { return await fn(req); }
    catch (e) {
      if (e instanceof HttpError) return json(req, { error: e.code, message: e.message }, e.status);
      log("error", "unhandled", { message: e instanceof Error ? e.message : String(e) });
      return json(req, { error: "internal", message: "Une erreur est survenue. Réessayez dans un instant." }, 500);
    }
  };
}
