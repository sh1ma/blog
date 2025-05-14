import { TweetCard } from "@/tweets/TweetCard"
import { getAllTweets } from "@/tweets/tweetDomain"

// ref: https://github.com/opennextjs/opennextjs-cloudflare/issues/652
export const dynamic = "force-dynamic"

const TweetFeedPage = async () => {
  const tweets = await getAllTweets()

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
