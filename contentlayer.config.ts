import { defineDocumentType, makeSource } from "contentlayer/source-files"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeAutoLinkHeadings from "rehype-autolink-headings"
import rehypeSlug from "rehype-slug"

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
      resolve: (doc) => doc._raw.sourceFileName.replace(/\.md$/, ""),
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
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutoLinkHeadings,
        {
          behavior: "prepend",
          properties: {
            className: ["heading-link"],
          },
          content: {
            type: "element",
            tagName: "span",
            properties: {
              className: [""],
            },
            children: [
              {
                type: "text",
                value: "#",
              },
            ],
          },
        },
      ],
      [rehypePrettyCode, { theme: "github-dark" }],
    ],
  },
})
