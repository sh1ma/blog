import { TweetCard } from "@/tweets/TweetCard"
import { getAllTweets } from "@/tweets/tweetDomain"

// ref: https://github.com/opennextjs/opennextjs-cloudflare/issues/652
export const dynamic = "force-dynamic"

const TweetFeedPage = async () => {
  const tweets = await getAllTweets()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h2 className="mb-8 text-3xl font-bold text-text-primary">Tweets</h2>
      <div className="rounded-xl bg-bg-surface shadow-soft">
        <ul className="flex flex-col [&>li:not(:last-child)]:border-b [&>li:not(:last-child)]:border-gray-200">
          {tweets.map((e) => (
            <li key={e.id}>
              <TweetCard tweet={e} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default TweetFeedPage
