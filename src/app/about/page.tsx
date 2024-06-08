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
  const aboutMdx = allAbouts.find(() => true)

  if (!aboutMdx) {
    return <div>Not found</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold border-b border-b-stone-200 pb-2 mb-10">
        About
      </h2>
      <MarkdownContent post={aboutMdx}></MarkdownContent>
    </div>
  )
}

export default AboutPage
