import { Hono } from "hono"
import { Bindings } from "./bindings"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { getCloudflareContext } from "@opennextjs/cloudflare"

const tweetSchema = z.object({
  content: z.string().min(1).max(140),
})

export const twitterAPI = new Hono<{ Bindings: Bindings }>()
  .get("/tweets", async (c) => {
    const db = (await getCloudflareContext({ async: true })).env.DB
    const { results } = await db.prepare("SELECT * FROM tweets").all<Tweet>()

    return c.json({ tweets: results })
  })
  .post("/tweets", zValidator("json", tweetSchema), async (c) => {
    const authorization = c.req.header("Authorization")
    if (
      authorization !==
      (await getCloudflareContext({ async: true })).env.TWEET_TOKEN
    ) {
      return c.text("Unauthorized", 401)
    }

    const { content } = c.req.valid("json")

    const db = (await getCloudflareContext({ async: true })).env.DB
    await db
      .prepare("INSERT INTO tweets (content) VALUES (?)")
      .bind(content)
      .run()

    return c.text("Created", 201)
  })

export type Tweet = {
  content: string
  created_at: string
  id: number
}
