import { MarkdownContent } from "@/components/MarkdownContent/MarkdownContent"
import About from "@/markdown/about.mdx"

const customComponents = {
  li: ({ children }: React.PropsWithChildren) => {
    return <li className="list-disc list-inside">{children}</li>
  },
  h2: ({ children }: React.PropsWithChildren) => {
    return <h2 className="text-xl font-bold">{children}</h2>
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
