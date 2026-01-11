import { LikeButton } from "@/components/LikeButton/LikeButton"
import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"
import { TableOfContents } from "@/components/TableOfContents/TableOfContents"
import { Tag } from "@/components/Tag/Tag"
import { countLikes } from "@/db"
import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import { Calendar, Clock } from "lucide-react"
import { Metadata } from "next"
import React from "react"
import { extractHeadings } from "@/utils/extractHeadings"

interface Params {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async (props: Params): Promise<Metadata> => {
  const params = await props.params
  const { slug } = params
  const post = allArticles.find((post) => post.id === slug)

  if (!post) {
    return {
      title: "404",
      metadataBase: new URL("https://blog.sh1ma.dev"),
      description: "404",
    }
  }

  return {
    title: post.title,
    metadataBase: new URL("https://blog.sh1ma.dev"),
    description: "ブログ記事",
  }
}

const ArticlePage = async (props: Params) => {
  const params = await props.params
  const { slug } = params
  const post = allArticles.find((post) => post.id === slug)

  if (!post) {
    return <div>404</div>
  }

  const likeCount = parseInt((await countLikes(post.id))?.["count(*)"] ?? "0")
  const headings = extractHeadings(post.body.html)

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8">
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
            {post.readingTime}分
          </span>
        </div>
      </header>

      <TableOfContents headings={headings} initialOpen={false} />

      <main className="prose prose-lg max-w-none text-text-primary">
        <MarkdownContent post={post} />
      </main>

      <footer className="mt-16 border-t border-gray-200 pt-8 text-center">
        <LikeButton articleId={post.id} initialLikes={likeCount} />
      </footer>
    </article>
  )
}

export default ArticlePage
