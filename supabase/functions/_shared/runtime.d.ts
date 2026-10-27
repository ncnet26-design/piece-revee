// Globaux fournis par le runtime Supabase Edge (Deno).
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };
declare namespace Supabase {
  namespace ai {
    class Session {
      constructor(model: "gte-small");
      run(input: string, opts: { mean_pool: boolean; normalize: boolean }): Promise<number[]>;
    }
  }
}
