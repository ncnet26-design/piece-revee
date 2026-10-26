import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_MODE, SUPABASE_ANON_KEY, SUPABASE_URL } from "./site";

let client: SupabaseClient | null = null;

/** Client Supabase du navigateur (clé publique « anon », protégée par la RLS). Null en mode démonstration. */
export function supabase(): SupabaseClient | null {
  if (DEMO_MODE) return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}

/** Appelle une Edge Function avec le jeton de session. */
export async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const sb = supabase();
  if (!sb) throw new Error("demo");
  const { data, error } = await sb.functions.invoke<T>(name, { body: body as Record<string, unknown> });
  if (error) throw error;
  return data as T;
}
