"use server"

import { getCloudflareContext } from "@opennextjs/cloudflare"
import { Tweet } from "./app/api/[[...route]]/twitter"

export const getAllArticles = async () => {
  const context = getCloudflareContext()
  const { results } = await context.env.DB.prepare(
    "select * from articles",
  ).all()
  return results
}

export const countLikes = async (articleId: string) => {
  const context = getCloudflareContext()
  const result = await context.env.DB.prepare(
    "select count(*) from likes where article_id = ?",
  )
    .bind(articleId)
    .first<{ "count(*)": string }>()
  return result
}

export const likeArticle = async (articleId: string) => {
  const context = getCloudflareContext()
  await context.env.DB.prepare("insert into likes (article_id) values (?)")
    .bind(articleId)
    .run()

  await fetch(context.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `いいねされました: ${articleId}`,
    }),
  })
}

export const getAllTweets = async () => {
  const context = getCloudflareContext()
  const { results } = await context.env.DB.prepare(
    "select * from tweets order by created_at desc",
  ).all<Tweet>()
  return results
}

export const getRecentTweets = async () => {
  const context = getCloudflareContext()
  const { results } = await context.env.DB.prepare(
    "select * from tweets order by created_at desc limit 4",
  ).all<Tweet>()
  return results
}
