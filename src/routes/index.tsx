import { createFileRoute } from "@tanstack/react-router"
import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import { ArticleCard } from "@/components/ArticleCard/ArticleCard"

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "blog.sh1ma.dev" },
      { name: "description", content: "sh1maのブログ" },
    ],
  }),
})

function HomePage() {
  const articles = allArticles
    .filter((article) => article.locale === "ja")
    .sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1))
    .map((article) => ({
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
