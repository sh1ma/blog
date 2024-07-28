import { TweetCard } from "@/tweets/TweetCard"
import { getAllTweets } from "@/tweets/tweetDomain"

// const getFeed = async (): Promise<TweetRow[]> => {
//   const tweets = await getAllTweets()
//   return tweets.map((tweet) => ({
//     id: tweet.id.toString(),
//     content: tweet.content,
//     createdAt: {
//       relative: relativeDateTimeText(tweet.created_at),
//       machineReadable: dayjs(tweet.created_at).format(),
//     },
//     author: {
//       name: "sh1ma",
//       username: "sh1ma",
//     },
//   }))
// }

const TweetFeedPage = async () => {
  const tweets = await getAllTweets()
  console.log(tweets[1].createdAt)

  return (
    <div className="max-w-7xl">
      <div className="rounded-md bg-white text-black">
        <ul className="flex flex-col [&>li:not(:last-child)]:border-b [&>li:not(:last-child)]:border-b-gray-600/50">
          {tweets.map((e) => (
            <li key={e.id}>
              <TweetCard tweet={e} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default TweetFeedPage
