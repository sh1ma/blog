import path from "node:path"
import { cloudflare } from "@cloudflare/vite-plugin"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    cloudflare(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "contentlayer/generated": path.resolve(
        __dirname,
        "./.contentlayer/generated",
      ),
    },
  },
  build: {
    sourcemap: true,
  },
})
