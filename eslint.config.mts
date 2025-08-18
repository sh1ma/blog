import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import tailwindcss from "eslint-plugin-tailwindcss"
import unusedImports from "eslint-plugin-unused-imports"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"

import { defineConfig } from "eslint/config"

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

export default defineConfig([
  js.configs.recommended,
  ...compat.config({
    extends: ["next/typescript", "next/core-web-vitals", "prettier"],
  }),
  {
    plugins: {
      "unused-imports": unusedImports,
      tailwindcss: tailwindcss,
      react: react,
      "react-hooks": reactHooks,
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
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/**",
      ".contentlayer/**",
    ],
  },
])
