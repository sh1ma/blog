import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { defineDocumentType, makeSource } from "contentlayer2/source-files"
import type { Element, Root } from "hast"
import rehypeAutoLinkHeadings from "rehype-autolink-headings"
import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code"
import rehypeSlug from "rehype-slug"
import type { ThemeRegistrationRaw } from "shiki"
import { visit } from "unist-util-visit"

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
  },
  computedFields: {
    id: {
      type: "string",
      resolve: (doc) => doc._raw.sourceFileName.replace(/\.md$/, ""),
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
