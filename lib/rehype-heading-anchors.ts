import type { Element, ElementContent, Root, Text } from "hast"
import type { Plugin } from "unified"
import { visit } from "unist-util-visit"

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"])

function extractText(node: ElementContent | Root): string {
  if (node.type === "text") return (node as Text).value
  if ("children" in node) {
    return (node.children as ElementContent[]).map(extractText).join("")
  }
  return ""
}

function slugify(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export const rehypeHeadingAnchors: Plugin<[], Root> = () => {
  return (tree) => {
    const used = new Map<string, number>()

    visit(tree, "element", (node: Element) => {
      if (!HEADING_TAGS.has(node.tagName)) return

      const properties = (node.properties ??= {})
      let id = typeof properties.id === "string" ? properties.id : ""

      if (!id) {
        const base = slugify(extractText(node))
        if (!base) return
        const count = used.get(base) ?? 0
        used.set(base, count + 1)
        id = count > 0 ? `${base}-${count}` : base
        properties.id = id
      } else {
        used.set(id, (used.get(id) ?? 0) + 1)
      }

      const anchor: Element = {
        type: "element",
        tagName: "a",
        properties: {
          href: `#${id}`,
          className: ["heading-link"],
          ariaHidden: "true",
          tabIndex: -1,
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: {},
            children: [{ type: "text", value: "#" }],
          },
        ],
      }

      node.children.push(anchor)
    })
  }
}
