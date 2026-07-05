import type { Element, ElementContent, Root, Text } from "hast"
import type { Plugin } from "unified"
import { fetchOgp, type OgpData } from "./ogp-fetcher"

const TWEET_URL_RE =
  /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([^/]+)\/status(?:es)?\/(\d+)/i

function isWhitespaceText(node: ElementContent): boolean {
  return node.type === "text" && /^\s*$/.test((node as Text).value)
}

function findStandaloneUrl(paragraph: Element): string | null {
  const nonWs = paragraph.children.filter((c) => !isWhitespaceText(c))
  if (nonWs.length !== 1) return null
  const only = nonWs[0]

  if (only.type === "text") {
    const value = (only as Text).value.trim()
    if (/^https?:\/\/\S+$/i.test(value) && !/\s/.test(value)) return value
    return null
  }

  if (only.type === "element" && (only as Element).tagName === "a") {
    const link = only as Element
    const href = link.properties?.href
    if (typeof href !== "string") return null
    const text = link.children
      .map((c) => (c.type === "text" ? (c as Text).value : ""))
      .join("")
      .trim()
    if (text !== href) return null
    if (!/^https?:\/\//i.test(href)) return null
    return href
  }

  return null
}

function buildTweetEmbed(url: string): Element {
  return {
    type: "element",
    tagName: "blockquote",
    properties: {
      className: ["twitter-tweet"],
      "data-dnt": "true",
    },
    children: [
      {
        type: "element",
        tagName: "a",
        properties: { href: url },
        children: [{ type: "text", value: url }],
      },
    ],
  }
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return `${s.slice(0, n - 1)}…`
}

function buildLinkCard(data: OgpData): Element {
  const body: Element = {
    type: "element",
    tagName: "div",
    properties: { className: ["link-card__body"] },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["link-card__title"] },
        children: [{ type: "text", value: truncate(data.title, 120) }],
      },
      ...(data.description
        ? [
            {
              type: "element",
              tagName: "div",
              properties: { className: ["link-card__desc"] },
              children: [
                { type: "text", value: truncate(data.description, 160) },
              ],
            } satisfies Element,
          ]
        : []),
      {
        type: "element",
        tagName: "div",
        properties: { className: ["link-card__meta"] },
        children: [
          ...(data.favicon
            ? [
                {
                  type: "element",
                  tagName: "img",
                  properties: {
                    className: ["link-card__favicon"],
                    src: data.favicon,
                    alt: "",
                    width: 16,
                    height: 16,
                    loading: "lazy",
                  },
                  children: [],
                } satisfies Element,
              ]
            : []),
          {
            type: "element",
            tagName: "span",
            properties: {},
            children: [{ type: "text", value: data.siteName ?? data.domain }],
          },
        ],
      },
    ],
  }

  const children: Element[] = [body]
  if (data.image) {
    children.push({
      type: "element",
      tagName: "div",
      properties: { className: ["link-card__thumb"] },
      children: [
        {
          type: "element",
          tagName: "img",
          properties: {
            src: data.image,
            alt: "",
            loading: "lazy",
          },
          children: [],
        },
      ],
    })
  }

  return {
    type: "element",
    tagName: "a",
    properties: {
      href: data.url,
      className: ["link-card"],
      target: "_blank",
      rel: "noopener noreferrer",
    },
    children,
  }
}

function buildFallbackCard(url: string): Element {
  let domain = url
  try {
    domain = new URL(url).hostname.replace(/^www\./, "")
  } catch {
    // keep url
  }
  return buildLinkCard({
    url,
    title: url,
    domain,
    favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
  })
}

type Target = {
  paragraph: Element
  parent: Element | Root
  index: number
  url: string
  kind: "tweet" | "ogp"
}

function collectTargets(root: Root): Target[] {
  const targets: Target[] = []
  const walk = (node: Element | Root) => {
    const children = node.children as ElementContent[]
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (child.type !== "element") continue
      const el = child as Element
      if (el.tagName === "p") {
        const url = findStandaloneUrl(el)
        if (url) {
          const kind: Target["kind"] = TWEET_URL_RE.test(url) ? "tweet" : "ogp"
          targets.push({
            paragraph: el,
            parent: node as Element | Root,
            index: i,
            url,
            kind,
          })
          continue
        }
      }
      walk(el)
    }
  }
  walk(root)
  return targets
}

export const rehypeRichEmbeds: Plugin<[], Root> = () => {
  return async (tree) => {
    const targets = collectTargets(tree)
    if (targets.length === 0) return

    const replacements = await Promise.all(
      targets.map(async (t) => {
        if (t.kind === "tweet") {
          return { target: t, node: buildTweetEmbed(t.url) }
        }
        const data = await fetchOgp(t.url).catch(() => null)
        const node = data ? buildLinkCard(data) : buildFallbackCard(t.url)
        return { target: t, node }
      }),
    )

    for (const { target, node } of replacements) {
      const children = target.parent.children as ElementContent[]
      const idx = children.indexOf(target.paragraph as ElementContent)
      if (idx >= 0) children[idx] = node as ElementContent
    }
  }
}
