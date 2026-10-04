import { bindings, defineConfig } from "cf/config"

export default defineConfig({
  worker: {
    name: "blog",
    compatibilityDate: "2026-07-06",
    compatibilityFlags: ["nodejs_compat", "global_fetch_strictly_public"],
    // staging / PR preview は <alias>-blog.<subdomain>.workers.dev の Preview URL で配信している
    workersDev: true,
    previewUrls: true,
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
