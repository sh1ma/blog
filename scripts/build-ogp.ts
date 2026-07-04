import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { Resvg } from "@resvg/resvg-js"
import dayjs from "dayjs"
import satori from "satori"
import { allArticles } from "../.contentlayer/generated/index.mjs"

const SITE_URL = process.env.SITE_URL ?? "https://blog.sh1ma.dev"
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

// 元のグラデーション枠と揃えた4色。角ごとにシャッフルされる
const CORNER_PALETTE = ["#6365f7", "#f8dbe9", "#afdee8", "#b8bdf2"]
const textColors = {
  title: "#303036",
  meta: "#6365f7",
  time: "#b8bdf2",
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

// slug をシードにした決定的な乱数
const seededRandom = (seed: string) => {
  let state = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    state = Math.imul(state ^ seed.charCodeAt(i), 0x01000193) | 0
  }
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) | 0
    return ((state >>> 0) % 0x100000000) / 0x100000000
  }
}

const shuffle = <T>(arr: T[], rng: () => number): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 4隅の不定形ポリゴンを生成する。各ポリゴンは対応する角と、
// その角に接する2辺の各1点、内部の2〜3点を経由する五角形〜六角形。
// これにより「4辺に完全に接する」を担保しつつランダム感を出す
const buildCornerPolygons = (rng: () => number) => {
  const rand = (min: number, max: number) => min + rng() * (max - min)
  const jitter = (base: number, spread: number) =>
    base + (rng() - 0.5) * 2 * spread

  const palette = shuffle(CORNER_PALETTE, rng)

  // 各コーナー: 辺沿いの延長距離と内部の凹凸点
  // edgeH: 縦辺方向の延長, edgeW: 横辺方向の延長
  const buildPoints = (
    corner: "tl" | "tr" | "bl" | "br",
    edgeW: number,
    edgeH: number,
    innerPts: Array<{ x: number; y: number }>,
  ) => {
    // 角の座標
    const cx = corner === "tl" || corner === "bl" ? 0 : WIDTH
    const cy = corner === "tl" || corner === "tr" ? 0 : HEIGHT
    const signX = corner === "tl" || corner === "bl" ? 1 : -1
    const signY = corner === "tl" || corner === "tr" ? 1 : -1

    // 頂点順: 角 → 横辺沿いの点 → 内部点 → 縦辺沿いの点 → 角 (自動 close)
    const pts: Array<[number, number]> = [
      [cx, cy],
      [cx + signX * edgeW, cy],
      ...innerPts.map(
        (p) => [cx + signX * p.x, cy + signY * p.y] as [number, number],
      ),
      [cx, cy + signY * edgeH],
    ]
    return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  }

  // 下側 (bl/br) は下端に載る meta 行を避けるため縦方向を短めに、
  // 上側 (tl/tr) は多少大きくても OK
  const corners = (["tl", "tr", "bl", "br"] as const).map((corner, i) => {
    const isBottom = corner === "bl" || corner === "br"
    const edgeW = rand(300, 460)
    const edgeH = isBottom ? rand(120, 200) : rand(220, 340)
    const innerPts = [
      { x: jitter(edgeW * 0.72, 40), y: jitter(edgeH * 0.28, 20) },
      { x: jitter(edgeW * 0.55, 60), y: jitter(edgeH * 0.55, 30) },
      { x: jitter(edgeW * 0.28, 30), y: jitter(edgeH * 0.78, 20) },
    ]
    return {
      color: palette[i],
      points: buildPoints(corner, edgeW, edgeH, innerPts),
    }
  })

  return corners
}

const buildNode = (title: string, publishedAt: string, slug: string) => {
  const rng = seededRandom(slug)
  const corners = buildCornerPolygons(rng)

  const svgChildren = corners.map((c) => ({
    type: "polygon",
    props: { points: c.points, fill: c.color },
  }))

  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "white",
        color: textColors.title,
        fontFamily: FONT_FAMILY,
      },
      children: [
        // 背景の4隅ポリゴン
        {
          type: "svg",
          props: {
            width: WIDTH,
            height: HEIGHT,
            viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
            },
            children: svgChildren,
          },
        },
        // 前景のテキストレイヤー
        {
          type: "div",
          props: {
            style: {
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "96px 96px 72px",
              position: "relative",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: 64,
                    fontWeight: 600,
                    lineHeight: 1.25,
                    marginTop: 48,
                  },
                  children: title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    fontSize: 44,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", color: textColors.time },
                        children: publishedAt,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          color: textColors.meta,
                          fontWeight: 600,
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
      ],
    },
  }
}

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
  const svg = await satori(buildNode(title, publishedAt, slug) as never, {
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
