"use server"

import dayjs from "dayjs"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle } from "drizzle-orm/d1"
import { desc } from "drizzle-orm"
import { tweets, type Tweet as TweetRecord } from "@/db/schema"

// ツイートの型
export type Tweet = {
  id: string
  text: string
  createdAt: dayjs.Dayjs
  user: {
    screenName: string
    name: string
  }
}

// 仮のユーザー情報を返す
const DUMMY_USER = {
  screenName: "sh1ma",
  name: "sh1ma",
}

// レコードをモデルに変換する
const recordToModel = (record: TweetRecord): Tweet => {
  return {
    id: String(record.id),
    text: record.content,
    createdAt: dayjs.utc(record.createdAt),
    // 仮のユーザー情報をセット
    user: DUMMY_USER,
  }
}

// すべてのツイートを取得する
export const getAllTweets = async () => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  const results = await db
    .select()
    .from(tweets)
    .orderBy(desc(tweets.createdAt))

  return results.map(recordToModel)
}

// 最新5件のツイートを取得する
const RECENT_LIMIT = 5
export const getRecentTweets = async () => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  const results = await db
    .select()
    .from(tweets)
    .orderBy(desc(tweets.createdAt))
    .limit(RECENT_LIMIT)

  return results.map(recordToModel)
}
