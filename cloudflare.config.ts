import { bindings, defineConfig } from "cf/config"

export default defineConfig({
  worker: {
    name: "blog",
    compatibilityDate: "2026-07-06",
    compatibilityFlags: ["nodejs_compat", "global_fetch_strictly_public"],
    observability: {
      enabled: true,
    },
    assets: {
      htmlHandling: "drop-trailing-slash",
      notFoundHandling: "single-page-application",
    },
    env: {
      NODE_VERSION: bindings.text("24.16.0"),
    },
  },
})
