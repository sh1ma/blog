import dayjs from "dayjs"
import { Tweet } from "./tweetDomain"

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
