import { defineDocumentType, makeSource } from "contentlayer/source-files"

export const Article = defineDocumentType(() => ({
  name: "Article",
  filePathPattern: `**/posts/*.mdx`,
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
  filePathPattern: `**/about.mdx`,
  // contentType: "mdx",
}))

export default makeSource({
  contentDirPath: "./src/markdown/",
  documentTypes: [Article, About],
})
