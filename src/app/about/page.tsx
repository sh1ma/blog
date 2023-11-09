import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"
import About from "@/markdown/about.mdx"
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
  return (
    <div>
      <h2 className="text-2xl font-bold border-b border-b-stone-200 pb-2 mb-10">
        About
      </h2>
      <MarkdownContent>
        <About />
      </MarkdownContent>
    </div>
  )
}

export default AboutPage
