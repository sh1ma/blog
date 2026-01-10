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
    <article className="grid grid-cols-[auto_1fr] gap-2  px-btn-x py-card sm:px-card sm:py-8">
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
      <div className="flex flex-col gap-icon-gap">
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            {viewModel.user.name}
            <span className="text-slate-400">@{viewModel.user.screenName}</span>
            <time
              className="ml-1 text-slate-400"
              dateTime={viewModel.model.createdAt.toString()}
            >
              <span className="text-sm">{viewModel.createdAt}</span>
            </time>
          </div>
        </div>
        <div className="w-full">
          <pre className="w-full whitespace-pre-wrap break-all font-sans">
            {viewModel.content}
          </pre>
        </div>
      </div>
    </article>
  )
}
