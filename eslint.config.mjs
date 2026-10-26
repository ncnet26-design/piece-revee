import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  { ignores: ["out/**", ".next/**", "node_modules/**", "supabase/functions/**/index.ts", "functions/**", "reference/**", "playwright-report/**", "test-results/**", "next-env.d.ts"] },
  ...nextVitals,
  ...nextTs,
  { rules: { "@typescript-eslint/no-explicit-any": "error", "react/no-unescaped-entities": "off" } },
];
export default config;
