import { globSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { defineCollection, defineConfig } from "@content-collections/core"
import { compileMarkdown } from "@content-collections/markdown"
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
import { z } from "zod"
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

const articles = defineCollection({
  name: "articles",
  directory: "src/markdown",
  include: "posts/**/*.md",
  schema: z.object({
    content: z.string(),
    title: z.string(),
    publishedAt: z.string(),
    thumbnail: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    priority: z.number().optional(),
  }),
  transform: async (doc, context) => {
    const html = await compileMarkdown(context, doc, {
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
    })

    const id = doc._meta.fileName.replace(/\.md$/, "")
    const filenamePriorityMatch = id.match(/^\d{8}_(\d+)_/)
    const filenamePriority = filenamePriorityMatch
      ? Number(filenamePriorityMatch[1])
      : 0
    const effectivePriority =
      typeof doc.priority === "number" ? doc.priority : filenamePriority
    const paddedPriority = String(effectivePriority).padStart(6, "0")
    const sortKey = `${doc.publishedAt}#${paddedPriority}`

    const locale = doc._meta.filePath.startsWith("posts/en/") ? "en" : "ja"

    const CHARS_PER_MINUTE = 500
    const readingTime = Math.ceil(doc.content.length / CHARS_PER_MINUTE)

    const { content: _content, ...rest } = doc
    return {
      ...rest,
      id,
      sortKey,
      locale,
      readingTime,
      body: { html },
    }
  },
  onSuccess: (documents) => {
    // frontmatter の parse 失敗などで記事がサイレントに欠落するのを防ぐ
    const expected = globSync("src/markdown/posts/**/*.md").length
    if (documents.length !== expected) {
      throw new Error(
        `記事数が一致しません: markdown ${expected} 件に対し生成 ${documents.length} 件。parse エラーでスキップされた記事があります。`,
      )
    }
  },
})

export default defineConfig({
  content: [articles],
})
