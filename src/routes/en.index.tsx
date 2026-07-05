import { createFileRoute, Link } from "@tanstack/react-router"
import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import { Calendar, Clock, ImageOff } from "lucide-react"
import { Tag } from "@/components/Tag/Tag"
import { TranslationNotice } from "@/components/TranslationNotice/TranslationNotice"

export const Route = createFileRoute("/en/")({
  component: EnglishHomePage,
  head: () => ({
    meta: [
      { title: "blog.sh1ma.dev" },
      { name: "description", content: "sh1ma's blog" },
    ],
  }),
})

function EnglishHomePage() {
  const articles = allArticles
    .filter((article) => article.locale === "en")
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
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
    <main className="mx-auto w-full max-w-3xl px-4 py-8" lang="en">
      <TranslationNotice targetLocale="ja" href="/" />

      <div className="mb-12">
        <h2 className="mb-2 text-4xl font-bold tracking-tight text-text-primary">
          Latest Writings
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {articles.map((article) => (
          <EnglishArticleCard key={article.id} {...article} />
        ))}
      </div>
    </main>
  )
}

type EnglishArticleCardProps = {
  id: string
  title: string
  description?: string
  thumbnail?: string
  publishedAt: string
  readingTime: number
  tags?: string[]
}

function EnglishArticleCard({
  id,
  title,
  description,
  thumbnail,
  publishedAt,
  readingTime,
  tags,
}: EnglishArticleCardProps) {
  return (
    <Link to="/en/articles/$slug" params={{ slug: id }}>
      <article className="group flex items-center gap-4 rounded-xl bg-bg-surface p-4 shadow-soft transition-all hover:-translate-y-1 hover:shadow-hover">
        <div className="size-24 shrink-0 overflow-hidden rounded-lg">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              width={96}
              height={96}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center bg-gray-100 text-gray-400">
              <ImageOff size={24} />
              <span className="mt-1 text-xs">No Image</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {tags && tags.length > 0 && (
            <div className="flex gap-2">
              {tags.map((tag) => (
                <Tag key={tag} label={tag} size="sm" />
              ))}
            </div>
          )}

          <h3 className="text-xl font-bold leading-tight text-brand-primary transition-colors group-hover:underline">
            {title}
          </h3>

          {description && (
            <p className="line-clamp-2 text-sm leading-snug text-text-secondary">
              {description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              <time dateTime={publishedAt}>{publishedAt}</time>
            </span>
            <span className="size-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1">
              <Clock size={16} />
              <span>{readingTime} min</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
