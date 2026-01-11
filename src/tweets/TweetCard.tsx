import { Tweet } from "./tweetDomain"
import { relativeDatetimeTextFromTweet } from "./util"
import Image from "next/image"

export type TweetViewModel = {
  model: Tweet
  content: string
  createdAt: string
  user: {
    screenName: string
    name: string
  }
}

const tweetToViewModel = (tweet: Tweet): TweetViewModel => {
  return {
    model: tweet,
    content: tweet.text,
    createdAt: relativeDatetimeTextFromTweet(tweet),
    user: {
      screenName: tweet.user.screenName,
      name: tweet.user.name,
    },
  }
}

export const TweetCard = ({ tweet }: { tweet: Tweet }) => {
  const viewModel = tweetToViewModel(tweet)

  return (
    <article className="grid grid-cols-[auto_1fr] gap-3 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-start">
        <div className="relative size-10">
          <Image
            src="/anon-icon-200x200.webp"
            alt={`${viewModel.user.name}のアイコン`}
            fill
            className="rounded-full"
            unoptimized={true}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-1">
          <span className="font-semibold text-text-primary">
            {viewModel.user.name}
          </span>
          <span className="text-text-muted">@{viewModel.user.screenName}</span>
          <span className="text-text-muted">·</span>
          <time
            className="text-text-muted"
            dateTime={viewModel.model.createdAt.toString()}
          >
            <span className="text-sm">{viewModel.createdAt}</span>
          </time>
        </div>
        <div className="min-w-0">
          <pre className="whitespace-pre-wrap break-words font-sans text-text-primary">
            {viewModel.content}
          </pre>
        </div>
      </div>
    </article>
  )
}
