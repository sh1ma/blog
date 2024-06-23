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
    <div>
      <h2 className="mb-10 border-b border-b-stone-200 pb-2 text-2xl font-bold">
        About
      </h2>
      <MarkdownContent post={aboutMd}></MarkdownContent>
    </div>
  )
}

export default AboutPage
