import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  { ignores: ["out/**", "public/workers/**", "workers/**", ".next/**", "node_modules/**", "supabase/functions/*/index.ts", "supabase/functions/_shared/{env,http,quota,claude,images,embeddings,study-pipeline}.ts", "supabase/functions/_shared/runtime.d.ts", "scripts/eval-renders.ts", "functions/**", "reference/**", "playwright-report/**", "test-results/**", "next-env.d.ts"] },
  ...nextVitals,
  ...nextTs,
  { rules: { "@typescript-eslint/no-explicit-any": "error", "react/no-unescaped-entities": "off" } },
];
export default config;
