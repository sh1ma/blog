import { D1Database } from "@cloudflare/workers-types"

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB: D1Database
      DISCORD_WEBHOOK_URL: string
    }
  }
}
