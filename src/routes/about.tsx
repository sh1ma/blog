import { createFileRoute } from "@tanstack/react-router"
import { allAbouts } from "contentlayer/generated"
import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About - blog.sh1ma.dev" },
      { name: "description", content: "私について" },
    ],
  }),
})

function AboutPage() {
  const aboutMd = allAbouts[0]

  if (!aboutMd) {
    return <div>Not found</div>
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h2 className="mb-8 border-b border-gray-200 pb-4 text-3xl font-bold text-text-primary">
        About
      </h2>
      <MarkdownContent post={aboutMd} />
    </main>
  )
}
