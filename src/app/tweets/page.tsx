import { getAllTweets } from "@/db"
import dayjs from "dayjs"
import Image from "next/image"

type TweetRow = {
  id: string
  content: string
  createdAt: {
    relative: string
    machineReadable: string
  }
  author: {
    name: string
    username: string
  }
}

const getFeed = async (): Promise<TweetRow[]> => {
  const tweets = await getAllTweets()
  return tweets.map((tweet) => ({
    id: tweet.id.toString(),
    content: tweet.content,
    createdAt: {
      relative: relativeDateTimeText(tweet.created_at),
      machineReadable: dayjs(tweet.created_at).format(),
    },
    author: {
      name: "sh1ma",
      username: "sh1ma",
    },
  }))
}

const relativeDateTimeText = (time: string) => {
  // 2024-07-15 11:55:23 のようなフォーマットの文字列を受け取る想定
  const date = dayjs(time)
  const now = dayjs()

  const dayDiff = now.diff(date, "day")
  // もし6日以内ならば、相対時間で表示
  if (dayDiff < 7) {
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
    }
  }
  // 7日以上ならば、YYYY/MM/DD形式で表示
  return date.format("YYYY/MM/DD")
}

const TweetFeedPage = async () => {
  const feed = await getFeed()
  return (
    <div className="rounded-md bg-gray-700 text-white">
      <ul className="flex flex-col">
        {feed.map((e) => (
          <li
            className="flex gap-2 border-b border-b-gray-600 px-8 py-6"
            key={e.id}
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image src="/anon-icon.png" alt="アイコン" fill={true} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {e.author.name}
                  <span className="text-slate-400">@{e.author.username}</span>
                  <time
                    className="text-sm"
                    dateTime={e.createdAt.machineReadable}
                  >
                    <pre>{e.createdAt.relative}</pre>
                  </time>
                </div>
              </div>
              <pre className="font-sans">{e.content}</pre>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TweetFeedPage
