import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { defineDocumentType, makeSource } from "contentlayer2/source-files"
import type { Element, Root } from "hast"
import rehypeKatex from "rehype-katex"
import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code"
import remarkGfm from "remark-gfm"
import { remarkAlert } from "remark-github-blockquote-alert"
import remarkMath from "remark-math"
import type { ThemeRegistrationRaw } from "shiki"
import { visit } from "unist-util-visit"
import { rehypeHeadingAnchors } from "./lib/rehype-heading-anchors"
import { rehypeRichEmbeds } from "./lib/rehype-rich-embeds"

const atomOneDark = {
  ...JSON.parse(
    readFileSync(resolve(process.cwd(), "themes/atom-one-dark.json"), "utf-8"),
  ),
  type: "dark",
} as ThemeRegistrationRaw

const enableLineNumbers = () => (tree: Root) => {
  visit(tree, "element", (node: Element) => {
    if (
      node.tagName === "code" &&
      node.properties &&
      typeof (
        node.properties["data-language"] ?? node.properties.dataLanguage
      ) === "string"
    ) {
      node.properties["data-line-numbers"] = ""
    }
  })
}

export const Article = defineDocumentType(() => ({
  name: "Article",
  filePathPattern: `**/posts/**/*.md`,
  fields: {
    title: { type: "string", required: true },
    publishedAt: { type: "date", required: true },
    thumbnail: { type: "string", required: false },
    description: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    priority: { type: "number", required: false },
  },
  computedFields: {
    id: {
      type: "string",
      resolve: (doc) => doc._raw.sourceFileName.replace(/\.md$/, ""),
    },
    sortKey: {
      type: "string",
      resolve: (doc) => {
        const filename = doc._raw.sourceFileName.replace(/\.md$/, "")
        const filenamePriorityMatch = filename.match(/^\d{8}_(\d+)_/)
        const filenamePriority = filenamePriorityMatch
          ? Number(filenamePriorityMatch[1])
          : 0
        const effectivePriority =
          typeof doc.priority === "number" ? doc.priority : filenamePriority
        const paddedPriority = String(effectivePriority).padStart(6, "0")
        const publishedAt =
          typeof doc.publishedAt === "string"
            ? doc.publishedAt
            : new Date(doc.publishedAt).toISOString().slice(0, 10)
        return `${publishedAt}#${paddedPriority}`
      },
    },
    locale: {
      type: "string",
      resolve: (doc) =>
        doc._raw.sourceFilePath.startsWith("posts/en/") ? "en" : "ja",
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

export default makeSource({
  contentDirPath: "./src/markdown/",
  documentTypes: [Article],
  markdown: {
    remarkPlugins: [remarkGfm, remarkAlert, remarkMath],
    rehypePlugins: [
      rehypeRichEmbeds,
      rehypeHeadingAnchors,
      [rehypeKatex, { strict: false, output: "html" }],
      [
        rehypePrettyCode,
        {
          theme: atomOneDark,
          defaultLang: {
            block: "plaintext",
          },
          keepBackground: false,
        } satisfies RehypePrettyCodeOptions,
      ],
      enableLineNumbers,
    ],
  },
})
