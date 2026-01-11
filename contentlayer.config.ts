import { defineDocumentType, makeSource } from "contentlayer2/source-files"
import rehypePrettyCode, {
  Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code"
import rehypeAutoLinkHeadings from "rehype-autolink-headings"
import rehypeSlug from "rehype-slug"

export const Article = defineDocumentType(() => ({
  name: "Article",
  filePathPattern: `**/posts/*.md`,
  fields: {
    title: { type: "string", required: true },
    publishedAt: { type: "date", required: true },
    thumbnail: { type: "string", required: false },
    description: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields: {
    id: {
      type: "string",
      resolve: (doc) => doc._raw.sourceFileName.replace(/\.md$/, ""),
    },
    readingTime: {
      type: "number",
      resolve: (doc) => {
        const CHARS_PER_MINUTE = 500
        const content = doc.body.raw
        const charCount = content.length
        return Math.ceil(charCount / CHARS_PER_MINUTE)
      },
    },
  },
}))

export const About = defineDocumentType(() => ({
  name: "About",
  filePathPattern: `**/about.md`,
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
          behavior: "append",
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
      [
        rehypePrettyCode,
        {
          theme: "one-dark-pro",
          defaultLang: {
            block: "plaintext",
          },
          keepBackground: false,
        } satisfies RehypePrettyCodeOptions,
      ],
    ],
  },
})
