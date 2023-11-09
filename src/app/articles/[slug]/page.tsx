import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"
import dayjs from "dayjs"

const Page = async ({ params }: { params: { slug: string } }) => {
  const { slug } = params
  const { default: Content, meta } = (await import(
    `@/markdown/posts/${slug}.mdx`
  )) as { default: React.FC; meta: { title: string; publishedAt: string } }

  return (
    <div>
      <header className="border-b border-b-stone-200 pb-2 mb-10">
        <div className="flex flex-col gap-y-2">
          <span className="text-sm">
            {dayjs(meta.publishedAt).format("YYYY-MM-DD")}
          </span>
          <h2 className="text-xl font-bold">{meta.title}</h2>
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
