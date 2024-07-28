import { allArticles, Article } from "contentlayer/generated"
import { Metadata } from "next"
import Link from "next/link"
import { Calendar, ThumbsUp } from "lucide-react"
import dayjs from "dayjs"
import { getRecentTweets } from "@/db"
import Image from "next/image"

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "blog.sh1ma.dev",
    description: "sh1maのブログ",
    metadataBase: new URL("https://blog.sh1ma.dev/"),
  }
}

const getArticleLikes = async (articles: Article[]) => {
  const articleIds = articles.map((article) => article.id)
  const query = `select article_id, count(*) from likes where article_id in (${articleIds.map(
    () => "?",
  )}) group by article_id`

  const { results } = await process.env.DB.prepare(query)
    .bind(...articleIds)
    .all<{ article_id: string; "count(*)": string }>()

  return results
}

const friendLinks = [
  { name: "hiwaitanのメモ帳", href: "https://blog.unitypackage.zip/" },
  { name: "chun's diary", href: "https://chun37.hatenablog.com/" },
  { name: "moytus.dev", href: "https://moytus.dev/" },
]

export default async function Home() {
  const articles = allArticles.toReversed().slice(0, 10)
  const likes = await getArticleLikes(articles)
  const recentTweets = await getRecentTweets()

  const articlesWithLikes = articles.map((article) => {
    const like = likes.find((like) => like.article_id === article.id)

    return {
      ...article,
      publishedAt: dayjs(article.publishedAt).format("YYYY-MM-DD"),
      likes: like?.["count(*)"] ?? 0,
    }
  })
  return (
    <main className="max-w-7xl px-4">
      <div className="grid items-start gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="row-span-3 grid gap-4">
          <h2 className="border-b-2 border-primary-default pb-2 text-2xl text-primary-dark">
            最新の記事
          </h2>
          <ul className="grid gap-4">
            {articlesWithLikes.map((article) => (
              <li key={article.id}>
                <Link href={`/articles/${article.id}`}>
                  <article className="relative bg-white p-6 shadow-md transition-colors hover:bg-primary-light/20">
                    <h3 className="text-xl text-primary-default">
                      {article.title}
                    </h3>
                    <div>
                      <span className="flex gap-1 text-sm text-gray-500">
                        <Calendar size={20} />
                        <time dateTime={`${article.publishedAt}`}>
                          {article.publishedAt}
                        </time>
                      </span>
                      <span className="flex gap-1 text-sm text-gray-500">
                        <ThumbsUp size={20} />
                        {article.likes}
                      </span>
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <aside className="grid items-start gap-4">
          <div className="grid gap-4 bg-primary-default p-6 text-white">
            <h2 className=" text-xl">私について</h2>
            <p>プログラマです。</p>
            <Link
              href="/about"
              className="max-w-max bg-white px-4 py-2 text-primary-default transition-colors hover:bg-primary-dark hover:text-white"
            >
              もっと知る
            </Link>
          </div>
          <div className="grid bg-primary-default">
            <ul className="[&>li:not(:last-child)]:border-b [&>li:not(:last-child)]:border-b-gray-600/50">
              {recentTweets.map(({ content, id, created_at }) => (
                <li
                  key={id}
                  className="grid grid-cols-[auto_1fr] gap-2  bg-white px-4 py-6 sm:px-6 sm:py-8 "
                >
                  <div className="flex items-start">
                    <div className="relative size-10">
                      <Image
                        src="/anon-icon-200x200.webp"
                        alt="アイコン"
                        fill
                        className="rounded-full"
                        unoptimized={true}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-end gap-2">
                        {"sh1ma"}
                        <span className="text-slate-400">@{"sh1ma"}</span>
                        <time
                          className="ml-1 text-slate-400"
                          dateTime={created_at}
                        >
                          <span className="text-sm">{created_at}</span>
                        </time>
                      </div>
                    </div>
                    <div className="w-full">
                      <pre className="w-full whitespace-pre-wrap break-all font-sans">
                        {content}
                      </pre>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid bg-primary-default p-6 text-white">
            <h2 className="border-b-2 border-primary-default pb-2 text-xl">
              フレンドリンク
            </h2>
            <ul className="grid gap-4">
              {friendLinks.map(({ name, href }) => (
                <li key={href} className="flex">
                  <Link
                    href={href}
                    className=" w-full bg-white px-4 py-2 text-primary-default"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
