import { allArticles, Article } from "contentlayer/generated"
import { Metadata } from "next"
import dayjs from "dayjs"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { ArticleCard } from "@/components/ArticleCard/ArticleCard"

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "blog.sh1ma.dev",
    description: "sh1maのブログ",
    metadataBase: new URL("https://blog.sh1ma.dev/"),
  }
}

// ref: https://github.com/opennextjs/opennextjs-cloudflare/issues/652
export const dynamic = "force-dynamic"

const getArticleLikes = async (articles: Article[]) => {
  const articleIds = articles.map((article) => article.id)
  const query = `select article_id, count(*) from likes where article_id in (${articleIds.map(
    () => "?",
  )}) group by article_id`

  const context = getCloudflareContext()
  const { results } = await context.env.DB.prepare(query)
    .bind(...articleIds)
    .all<{ article_id: string; "count(*)": string }>()

  return results
}

export default async function Home() {
  const articles = allArticles.toReversed()
  const likes = await getArticleLikes(articles)

  const articlesWithLikes = articles.map((article) => {
    const like = likes.find((like) => like.article_id === article.id)

    return {
      id: article.id,
      title: article.title,
      description: article.description,
      thumbnail: article.thumbnail,
      publishedAt: dayjs(article.publishedAt).format("YYYY-MM-DD"),
      readingTime: article.readingTime,
      likes: Number(like?.["count(*)"] ?? 0),
      tags: article.tags,
    }
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-12">
        <h2 className="mb-2 text-4xl font-bold tracking-tight text-text-primary">
          Latest Writings
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {articlesWithLikes.map((article) => (
          <ArticleCard key={article.id} {...article} />
        ))}
      </div>
    </main>
  )
}
