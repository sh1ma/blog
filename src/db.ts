"use server"

import { D1Database } from "@cloudflare/workers-types"
import { env } from "process"

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB: D1Database
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
}
