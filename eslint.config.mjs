import pluginUnusedImport from "eslint-plugin-unused-imports"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import pluginNext from "@next/eslint-plugin-next"
import pluginPrettier from "eslint-config-prettier"
import pluginTailwindCSS from "eslint-plugin-tailwindcss"
import typescriptParser from "@typescript-eslint/parser"

/** @type import("eslint").Linter.FlatConfig **/
const generalConfig = {
  files: ["**/*.ts", "**/*.tsx"],
  languageOptions: {
    parser: typescriptParser,
  },
  plugins: {
    "unused-imports": pluginUnusedImport,
    react: pluginReact,
    "react-hooks": pluginReactHooks,
    "@next/next": pluginNext,
    prettier: pluginPrettier,
    tailwindCSS: pluginTailwindCSS,
  },
  ignores: [".next/*"],
}

/** @type import("eslint").Linter.FlatConfig[] **/
const configs = [generalConfig]

export default configs
