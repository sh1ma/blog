"use server"

import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle } from "drizzle-orm/d1"
import { eq, count } from "drizzle-orm"
import { articles, likes } from "@/db/schema"

export const getAllArticles = async () => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  return db.select().from(articles)
}

export const countLikes = async (articleId: string) => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  const result = await db
    .select({ count: count() })
    .from(likes)
    .where(eq(likes.articleId, articleId))
  return { "count(*)": String(result[0]?.count ?? 0) }
}

export const likeArticle = async (articleId: string) => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  await db.insert(likes).values({ articleId })

  await fetch(context.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `いいねされました: ${articleId}`,
    }),
  })
}
