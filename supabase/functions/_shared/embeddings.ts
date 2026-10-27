/// <reference path="./runtime.d.ts" />
/** Embeddings texte (384 dimensions) calculés par le modèle open source gte-small intégré au runtime Supabase : gratuit. */
let session: Supabase.ai.Session | null = null;
export async function embed(text: string): Promise<number[]> {
  session ??= new Supabase.ai.Session("gte-small");
  return await session.run(text.slice(0, 2000), { mean_pool: true, normalize: true });
}
export const toPgVector = (v: number[]) => `[${v.map((x) => x.toFixed(6)).join(",")}]`;
