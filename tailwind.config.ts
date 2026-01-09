import type { Config } from "tailwindcss"
import typography from "@tailwindcss/typography"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],

  plugins: [typography],
  theme: {
    extend: {
      colors: {
        primary: {
          default: "#514fc9",
          dark: "#3a38a0",
          light: "#7a79d9",
          bg: "#f0f2ff",
        },
        accent: {
          default: "#ff6b6b",
        },
      },
      fontFamily: {
        system: ["system-ui"],
      },
      spacing: {
        "page-x": "1rem",
        "page-bottom": "5rem",
        card: "1.5rem",
        "card-sm": "0.5rem",
        "section-gap": "1rem",
        "section-bottom": "2.5rem",
        "heading-bottom": "0.5rem",
        "btn-x": "1rem",
        "btn-y": "0.5rem",
        "inline-x": "0.25rem",
        "inline-y": "0.125rem",
        "icon-gap": "0.25rem",
      },
    },
  },
}
export default config
