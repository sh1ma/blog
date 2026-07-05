import { createFileRoute, notFound } from "@tanstack/react-router"
import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import { Calendar, Clock } from "lucide-react"
import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"
import { TableOfContents } from "@/components/TableOfContents/TableOfContents"
import { Tag } from "@/components/Tag/Tag"
import { TranslationNotice } from "@/components/TranslationNotice/TranslationNotice"
import { extractHeadings } from "@/utils/extractHeadings"

export const Route = createFileRoute("/en/articles/$slug")({
  component: EnglishArticlePage,
  loader: ({ params }) => {
    const post = allArticles.find(
      (p) => p.id === params.slug && p.locale === "en",
    )
    if (!post) throw notFound()
    const hasJapaneseVersion = allArticles.some(
      (p) => p.id === params.slug && p.locale === "ja",
    )
    return { post, hasJapaneseVersion }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.post.title },
          { name: "description", content: "Blog article (English)" },
        ]
      : [{ title: "404" }],
  }),
})

function EnglishArticlePage() {
  const { post, hasJapaneseVersion } = Route.useLoaderData()
  const headings = extractHeadings(post.body.html)

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8" lang="en">
      <header className="mb-10 border-b border-gray-200 pb-6">
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex gap-2">
            {post.tags.map((tag) => (
              <Tag key={tag} label={tag} size="md" />
            ))}
          </div>
        )}

        <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-text-primary">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar size={16} />
            {dayjs(post.publishedAt).format("YYYY-MM-DD")}
          </span>
          <span className="size-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1">
            <Clock size={16} />
            {post.readingTime} min
          </span>
        </div>
      </header>

      {hasJapaneseVersion && (
        <TranslationNotice targetLocale="ja" href={`/articles/${post.id}`} />
      )}

      <TableOfContents headings={headings} initialOpen={false} />

      <main className="prose prose-lg max-w-none text-text-primary">
        <MarkdownContent post={post} />
      </main>
    </article>
  )
}
