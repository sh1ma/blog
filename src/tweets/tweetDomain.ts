"use server"

import dayjs from "dayjs"
import { getCloudflareContext } from "@opennextjs/cloudflare"
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

// データベースのレコードの型
type TweetDBRecord = {
  id: string
  created_at: string
  content: string
}

// 仮のユーザー情報を返す
const DUMMY_USER = {
  screenName: "sh1ma",
  name: "sh1ma",
}

// レコードをモデルに変換する
const recordToModel = (record: TweetDBRecord): Tweet => {
  return {
    id: record.id,
    text: record.content,
    createdAt: dayjs.utc(record.created_at),
    // 仮のユーザー情報をセット
    user: DUMMY_USER,
  }
}

// すべてのツイートを取得する
export const getAllTweets = async () => {
  const context = getCloudflareContext()
  const { results } = await context.env.DB.prepare(
    "select * from tweets order by created_at desc",
  ).all<TweetDBRecord>()

  return results.map(recordToModel)
}

// 最新5件のツイートを取得する
const RECENT_LIMIT = 5
export const getRecentTweets = async () => {
  const context = getCloudflareContext()
  const { results } = await context.env.DB.prepare(
    `select * from tweets order by created_at desc limit ${RECENT_LIMIT}`,
  ).all<TweetDBRecord>()
  return results.map(recordToModel)
}
