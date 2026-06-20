import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "agentproof_codex_handoff_v4/**",
    "agentproof_v5_service/**",
    "artifacts/**",
    "coverage/**",
    "node_modules/**",
    "out/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
