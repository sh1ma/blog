import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { Resvg } from "@resvg/resvg-js"
import dayjs from "dayjs"
import satori from "satori"
import { allArticles } from "../.contentlayer/generated/index.mjs"

const SITE_URL = "https://blog.sh1ma.dev"
const DIST_DIR = path.resolve("./dist")
const OG_DIR = path.join(DIST_DIR, "og")
const SHELL_HTML = path.join(DIST_DIR, "index.html")
const WIDTH = 1200
const HEIGHT = 630
const FONT_FAMILY = "IBM Plex Sans JP"

const FONT_URLS = [
  {
    weight: 400 as const,
    url: "https://fonts.gstatic.com/s/ibmplexsansjp/v5/Z9XNDn9KbTDf6_f7dISNqYf_tvPT1Cr4iNJ-pwc.ttf",
  },
  {
    weight: 600 as const,
    url: "https://fonts.gstatic.com/s/ibmplexsansjp/v5/Z9XKDn9KbTDf6_f7dISNqYf_tvPT7PLWrNpVuw5_BAM.ttf",
  },
]

const rootBorderColor =
  "linear-gradient(to left bottom , #6365f7 20%, #f8dbe9 , #afdee8)"
const textColors = {
  title: "#303036",
  meta: "#6365f7",
  time: "#b8bdf2",
}
const borderSize = 72
const titleContainerSize = {
  width: WIDTH - borderSize,
  height: HEIGHT - borderSize,
}

const loadFonts = async () => {
  return Promise.all(
    FONT_URLS.map(async ({ url, weight }) => {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Failed to fetch font ${url}: ${res.status}`)
      }
      const data = await res.arrayBuffer()
      return {
        name: FONT_FAMILY,
        data,
        weight,
        style: "normal" as const,
      }
    }),
  )
}

const buildNode = (title: string, publishedAt: string) => ({
  type: "div",
  props: {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundImage: rootBorderColor,
      color: textColors.title,
      fontFamily: FONT_FAMILY,
    },
    children: {
      type: "div",
      props: {
        style: {
          fontSize: 60,
          fontWeight: 600,
          backgroundColor: "white",
          width: titleContainerSize.width,
          height: titleContainerSize.height,
          borderRadius: 8,
          padding: "24px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        },
        children: [
          {
            type: "div",
            props: { style: { display: "flex" }, children: title },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                gap: 48,
                marginBottom: 16,
                justifyContent: "space-between",
                alignItems: "flex-end",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      fontSize: 48,
                      color: textColors.time,
                    },
                    children: publishedAt,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: 48,
                      color: textColors.meta,
                    },
                    children: "blog.sh1ma.dev",
                  },
                },
              ],
            },
          },
        ],
      },
    },
  },
})

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

const renderPng = async (
  slug: string,
  title: string,
  publishedAt: string,
  fonts: Awaited<ReturnType<typeof loadFonts>>,
) => {
  const svg = await satori(buildNode(title, publishedAt) as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  })
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  })
    .render()
    .asPng()
  const outPath = path.join(OG_DIR, `${slug}.png`)
  await writeFile(outPath, png)
}

const injectHead = (shell: string, tags: string) => {
  return shell.replace("</head>", `${tags}\n  </head>`)
}

const buildArticleHtml = (
  shell: string,
  slug: string,
  title: string,
  description: string | undefined,
) => {
  const url = `${SITE_URL}/articles/${slug}`
  const ogImage = `${SITE_URL}/og/${slug}.png`
  const desc = description ?? "ブログ記事"
  const meta = [
    `    <meta property="og:type" content="article" />`,
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(desc)}" />`,
    `    <meta property="og:url" content="${url}" />`,
    `    <meta property="og:image" content="${ogImage}" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    `    <meta name="twitter:image" content="${ogImage}" />`,
  ].join("\n")
  // Also override <title>
  const withTitle = shell.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`,
  )
  return injectHead(withTitle, meta)
}

await mkdir(OG_DIR, { recursive: true })
const fonts = await loadFonts()
const shell = await readFile(SHELL_HTML, "utf-8")

let pngCount = 0
let htmlCount = 0
for (const article of allArticles) {
  const publishedAt = dayjs(article.publishedAt).format("YYYY-MM-DD")
  await renderPng(article.id, article.title, publishedAt, fonts)
  pngCount++

  const articleDir = path.join(DIST_DIR, "articles", article.id)
  await mkdir(articleDir, { recursive: true })
  const html = buildArticleHtml(
    shell,
    article.id,
    article.title,
    article.description,
  )
  await writeFile(path.join(articleDir, "index.html"), html)
  htmlCount++
}
console.log(`Generated ${pngCount} OGP PNGs and ${htmlCount} article HTMLs`)
