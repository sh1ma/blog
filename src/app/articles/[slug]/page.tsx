import { LikeButton } from "@/components/LikeButton/LikeButton"
import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"
import { countLikes } from "@/db"
import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import { Calendar } from "lucide-react"
import { Metadata } from "next"
import React from "react"

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

  return (
    <div className="grid max-w-7xl grid-cols-1 sm:grid-cols-[2fr_1fr]">
      <div className="bg-white p-card-sm sm:p-card">
        <header className="mb-section-bottom border-b border-b-primary-default pb-heading-bottom">
          <div className="flex flex-col gap-y-2">
            <span className="flex items-center gap-icon-gap text-sm">
              <Calendar size={16} className="inline" />
              {dayjs(post.publishedAt).format("YYYY-MM-DD")}
            </span>
            <h2 className="pb-heading-bottom text-2xl font-bold">
              {post.title}
            </h2>
          </div>
        </header>
        <main>
          <MarkdownContent post={post} />
        </main>
        <footer>
          <LikeButton articleId={post.id} initialLikes={likeCount}></LikeButton>
        </footer>
      </div>
    </div>
  )
}

export default ArticlePage
