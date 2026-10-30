import { defineConfig, globalIgnores } from "eslint/config";
import nextTypeScript from "eslint-config-next/typescript";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  // Playwright's generated report includes third-party viewer bundles, not
  // application source. Keep recordings/reports out of source linting.
  globalIgnores([".next/**", "node_modules/**", "coverage/**", "artifacts/**", "playwright-report/**", "test-results/**"]),
]);
