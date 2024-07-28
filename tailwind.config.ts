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
    },
  },
}
export default config
