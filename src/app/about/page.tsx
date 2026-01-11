import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"
import { allAbouts } from "contentlayer/generated"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About - blog.sh1ma.dev",
  metadataBase: new URL("https://blog.sh1ma.dev"),
  description: "私について",
  openGraph: {
    title: "About - blog.sh1ma.dev",
    description: "私について",
  },
  twitter: {
    title: "About - blog.sh1ma.dev",
    description: "私について",
    card: "summary",
  },
}

const AboutPage = () => {
  const aboutMd = allAbouts.find(() => true)

  if (!aboutMd) {
    return <div>Not found</div>
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h2 className="mb-8 border-b border-gray-200 pb-4 text-3xl font-bold text-text-primary">
        About
      </h2>
      <MarkdownContent post={aboutMd}></MarkdownContent>
    </div>
  )
}

export default AboutPage
