import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"
import dayjs from "dayjs"
import { Metadata } from "next"
import React from "react"

const getContent = async (slug: string) => {
  const { default: Content, meta } = (await import(
    `@/markdown/posts/${slug}.mdx`
  )) as { default: React.FC; meta: { title: string; publishedAt: string } }

  return { Content, meta }
}

interface Params {
  params: { slug: string }
}

export const generateMetadata = async ({
  params,
}: Params): Promise<Metadata> => {
  const { slug } = params
  const { meta } = (await import(`@/markdown/posts/${slug}.mdx`)) as {
    default: React.FC
    meta: { title: string; publishedAt: string }
  }

  return {
    title: meta.title,
    metadataBase: new URL("https://blog.sh1ma.dev"),
    description: "ブログ記事",

    openGraph: {
      title: meta.title,
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
      title: meta.title,
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
  const { Content, meta } = await getContent(slug)

  return (
    <div>
      <header className="border-b border-b-stone-200 pb-2 mb-10">
        <div className="flex flex-col gap-y-2">
          <span className="text-sm">
            {dayjs(meta.publishedAt).format("YYYY-MM-DD")}
          </span>
          <h2 className="text-2xl font-bold">{meta.title}</h2>
        </div>
      </header>
      <main>
        <MarkdownContent>
          <Content />
        </MarkdownContent>
      </main>
    </div>
  )
}

export default Page
