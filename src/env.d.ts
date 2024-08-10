import { R2Bucket, D1Database } from "@cloudflare/workers-types"

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB: D1Database
      CDN: R2Bucket
      DISCORD_WEBHOOK_URL: string
      EXIFCUTTER_URL: string
    }
  }
}
