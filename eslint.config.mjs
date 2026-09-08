import { defineConfig, globalIgnores } from "eslint/config";
import nextTypeScript from "eslint-config-next/typescript";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["performance/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "coverage/**"]),
]);
