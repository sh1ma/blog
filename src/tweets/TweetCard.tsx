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
    <article className="flex gap-3 px-4 py-3">
      <div className="shrink-0">
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
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-1 overflow-hidden">
          <span className="truncate font-semibold text-text-primary">
            {viewModel.user.name}
          </span>
          <span className="shrink-0 text-text-muted">
            @{viewModel.user.screenName}
          </span>
          <span className="shrink-0 text-text-muted">·</span>
          <time
            className="shrink-0 text-text-muted"
            dateTime={viewModel.model.createdAt.toString()}
          >
            <span className="text-sm">{viewModel.createdAt}</span>
          </time>
        </div>
        <div className="min-w-0 overflow-hidden">
          <p className="whitespace-pre-wrap break-words text-text-primary">
            {viewModel.content}
          </p>
        </div>
      </div>
    </article>
  )
}
