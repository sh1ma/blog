import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import tailwindcss from "eslint-plugin-tailwindcss"
import unusedImports from "eslint-plugin-unused-imports"

import { defineConfig } from "eslint/config"

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

export default defineConfig([
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/**",
      ".contentlayer/**",
      "drizzle/**",
      "next-env.d.ts",
      "cloudflare-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...compat.config({
    extends: ["next/typescript", "next/core-web-vitals", "prettier"],
  }),
  ...tailwindcss.configs["flat/recommended"],
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "import/no-unresolved": [
        "error",
        {
          ignore: ["node_modules", "contentlayer/generated"],
        },
      ],
      "react-hooks/exhaustive-deps": "error",
    },
    settings: {
      "import/ignore": ["node_modules", ".contentlayer", ".next"],
    },
  },
])
