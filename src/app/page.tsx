import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import type { Metadata } from "next"
import { ArticleCard } from "@/components/ArticleCard/ArticleCard"

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "blog.sh1ma.dev",
    description: "sh1maのブログ",
    metadataBase: new URL("https://blog.sh1ma.dev/"),
  }
}

export default async function Home() {
  const articles = allArticles.toReversed().map((article) => ({
    id: article.id,
    title: article.title,
    description: article.description,
    thumbnail: article.thumbnail,
    publishedAt: dayjs(article.publishedAt).format("YYYY-MM-DD"),
    readingTime: article.readingTime,
    tags: article.tags,
  }))

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-12">
        <h2 className="mb-2 text-4xl font-bold tracking-tight text-text-primary">
          Latest Writings
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} {...article} />
        ))}
      </div>
    </main>
  )
}
