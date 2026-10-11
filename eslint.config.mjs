import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Temp/scratch folders
    "temp_folder_*/**",
    "todo/**",
    // Agent artefacts and their probes (gitignored): the handoff contract puts planted violations
    // in .handoff/<task>/scratch, and linting them failed the operator's gate (walk round 4 F5).
    ".handoff/**",
  ]),
]);

export default eslintConfig;
