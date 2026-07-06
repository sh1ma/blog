import { type ChildProcess, spawn } from "node:child_process"
import path from "node:path"
import { cloudflare } from "@cloudflare/vite-plugin"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

const contentlayerDev = (): Plugin => {
  let child: ChildProcess | null = null
  const stop = () => {
    if (child && !child.killed) child.kill("SIGTERM")
    child = null
  }
  return {
    name: "contentlayer-dev",
    apply: "serve",
    configureServer() {
      if (child) return
      child = spawn(
        process.execPath,
        [
          path.resolve(__dirname, "./node_modules/contentlayer2/bin/cli.cjs"),
          "dev",
        ],
        { stdio: "inherit", env: process.env },
      )
      const onExit = () => stop()
      process.once("exit", onExit)
      process.once("SIGINT", onExit)
      process.once("SIGTERM", onExit)
    },
    closeBundle() {
      stop()
    },
  }
}

export default defineConfig({
  plugins: [
    contentlayerDev(),
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
