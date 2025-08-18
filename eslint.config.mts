import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import tailwindcss from "eslint-plugin-tailwindcss"
import unusedImports from "eslint-plugin-unused-imports"

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
      "import/no-unresolved": "error",
    },
    settings: {
      "import/ignore": ["node_modules", ".contentlayer"],
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
// ...compat.extends(
//   "eslint:recommended",
//   "next",
//   "next/core-web-vitals",
//   "plugin:tailwindcss/recommended",
//   "prettier",
//   "plugin:import/recommended",
// ),
// {
//   plugins: {
//     "unused-imports": unusedImports,
//     tailwindcss: tailwindcss,
//   },
//   rules: {
//     "no-unused-vars": "off",
//     "unused-imports/no-unused-imports": "error",
//     "unused-imports/no-unused-vars": [
//       "warn",
//       {
//         vars: "all",
//         varsIgnorePattern: "^_",
//         args: "after-used",
//         argsIgnorePattern: "^_",
//       },
//     ],
//     "import/no-unresolved": "error",
//   },
//   settings: {
//     "import/ignore": ["node_modules", ".contentlayer"],
//   },
// },
// {
//   ignores: [
//     ".next/**",
//     "node_modules/**",
//     "out/**",
//     "public/**",
//     ".contentlayer/**",
//     ".vercel/**",
//   ],
// },
