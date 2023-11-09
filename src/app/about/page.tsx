"use client"

import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"
import About from "@/markdown/about.mdx"

const AboutPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold border-b border-b-stone-200 pb-2 mb-10">
        About
      </h1>
      <MarkdownContent>
        <About />
      </MarkdownContent>
    </div>
  )
}

export default AboutPage
