import { defineDocumentType, makeSource } from "contentlayer/source-files"
import rehypePrettyCode from "rehype-pretty-code"

export const Article = defineDocumentType(() => ({
  name: "Article",
  filePathPattern: `**/posts/*.md`,
  // contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    publishedAt: { type: "date", required: true },
  },
  computedFields: {
    id: {
      type: "string",
      resolve: (doc) => doc._raw.sourceFileName.replace(/\.mdx$/, ""),
    },
  },
}))

export const About = defineDocumentType(() => ({
  name: "About",
  filePathPattern: `**/about.md`,
  // contentType: "mdx",
}))

export default makeSource({
  contentDirPath: "./src/markdown/",
  documentTypes: [Article, About],
  markdown: {
    rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]],
  },
})
