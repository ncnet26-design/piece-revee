import next from "eslint-config-next";

export default [
  { ignores: ["out/**", ".next/**", "node_modules/**", "supabase/functions/**/index.ts", "functions/**", "reference/**", "playwright-report/**", "test-results/**"] },
  ...next,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "react/no-unescaped-entities": "off",
    },
  },
];
