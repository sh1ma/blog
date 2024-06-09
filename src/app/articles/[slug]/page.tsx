import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"
import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import { Metadata } from "next"
import React from "react"

interface Params {
  params: { slug: string }
}

export const generateMetadata = async ({
  params,
}: Params): Promise<Metadata> => {
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

    openGraph: {
      title: post.title,
      description: "ブログ記事",
      type: "article",
      images: [
        {
          url: "https://blog.sh1ma.dev/anon-icon.png",
          width: 600,
          height: 600,
        },
      ],
    },
    twitter: {
      title: post.title,
      description: "ブログ記事",
      card: "summary",
      images: [
        {
          url: "https://blog.sh1ma.dev/anon-icon.png",
          width: 600,
          height: 600,
        },
      ],
    },
  }
}

const Page = async ({ params }: Params) => {
  const { slug } = params
  const post = allArticles.find((post) => post.id === slug)

  if (!post) {
    return <div>404</div>
  }

  return (
    <div>
      <header className="border-b border-b-stone-200 pb-2 mb-10">
        <div className="flex flex-col gap-y-2">
          <span className="text-sm">
            {dayjs(post.publishedAt).format("YYYY-MM-DD")}
          </span>
          <h2 className="text-2xl font-bold">{post.title}</h2>
        </div>
      </header>
      <main>
        <MarkdownContent post={post} />
      </main>
    </div>
  )
}

export default Page
