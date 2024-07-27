import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import { Metadata } from "next"
import Link from "next/link"
import { Calendar, ThumbsUp } from "lucide-react"

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "blog.sh1ma.dev",
    description: "sh1maのブログ",
    metadataBase: new URL("https://blog.sh1ma.dev/"),
  }
}

export default function Home() {
  const articles = allArticles
    .toReversed()
    .slice(0, 10)
    .map((article) => ({
      id: article.id,
      title: article.title,
      publishedAt: dayjs(article.publishedAt).format("YYYY-MM-DD"),
    }))
  // return <ArticleList />
  return (
    <main className="max-w-7xl px-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="grid gap-4">
          <h2 className="border-b-2 border-primary-default pb-2 text-2xl text-primary-dark">
            最新の記事
          </h2>
          <ul className="grid gap-4">
            {articles.map((article) => (
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
                        <time dateTime={`${article.publishedAt}`}>0</time>
                      </span>
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <aside>
          <div className="bg-primary-default p-6 text-white">
            <h2 className="border-b-2 border-red-500 pb-2 text-xl">
              私について
            </h2>
            <p>
              テクノロジーとイノベーションに情熱を注ぐフルスタック開発者です。最新のトレンドと個人的な洞察をこのブログで共有しています。テクノロジーとイノベーションに情熱を注ぐフルスタック開発者です。最新のトレンドと個人的な洞察をこのブログで共有しています。
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
