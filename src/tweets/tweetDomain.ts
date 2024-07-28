import dayjs from "dayjs"

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
  const { results } = await process.env.DB.prepare(
    "select * from tweets order by created_at desc",
  ).all<TweetDBRecord>()

  return results.map(recordToModel)
}

// 最新5件のツイートを取得する
const RECENT_LIMIT = 5
export const getRecentTweets = async () => {
  const { results } = await process.env.DB.prepare(
    `select * from tweets order by created_at desc limit ${RECENT_LIMIT}`,
  ).all<TweetDBRecord>()
  return results.map(recordToModel)
}

export const relativeDatetimeTextFromTweet = (tweet: Tweet) => {
  // 2024-07-15 11:55:23 のようなフォーマットの文字列を受け取る想定
  const date = tweet.createdAt
  const now = dayjs()

  const dayDiff = now.diff(date, "day")
  // 同日ならば相対時刻
  if (dayDiff === 0) {
    const hourDiff = now.diff(date, "hour")
    if (hourDiff === 0) {
      const minuteDiff = now.diff(date, "minute")
      if (minuteDiff === 0) {
        return "たった今"
      }
      return `${minuteDiff}分前`
    }
    return `${hourDiff}時間前`
  } else if (dayDiff === 1) {
    return "昨日"
  }
  // 7日以上ならば、YYYY/MM/DD形式で表示
  // return date.format("YYYY/MM/DD")
  return date.format("YYYY/MM/DD")
}
