"use server"

import { D1Database } from "@cloudflare/workers-types"
import { env } from "process"
import { Tweet } from "./app/api/[[...route]]/twitter"

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB: D1Database
      DISCORD_WEBHOOK_URL: string
    }
  }
}

export const getAllArticles = async () => {
  const { results } = await env.DB.prepare("select * from articles").all()
  return results
}

export const countLikes = async (articleId: string) => {
  const result = await env.DB.prepare(
    "select count(*) from likes where article_id = ?",
  )
    .bind(articleId)
    .first<{ "count(*)": string }>()
  return result
}

export const likeArticle = async (articleId: string) => {
  await env.DB.prepare("insert into likes (article_id) values (?)")
    .bind(articleId)
    .run()

  await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `いいねされました: ${articleId}`,
    }),
  })
}

export const getAllTweets = async () => {
  const { results } = await env.DB.prepare(
    "select * from tweets order by created_at desc",
  ).all<Tweet>()
  return results
}

export const getRecentTweets = async () => {
  const { results } = await env.DB.prepare(
    "select * from tweets order by created_at desc limit 4",
  ).all<Tweet>()
  return results
}
