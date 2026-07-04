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
const FONT_FAMILY = "Zen Maru Gothic"

const FONT_URLS = [
  {
    weight: 400 as const,
    url: "https://fonts.gstatic.com/s/zenmarugothic/v19/o-0SIpIxzW5b-RxT-6A8jWAtCp-k7Q.ttf",
  },
  {
    weight: 700 as const,
    url: "https://fonts.gstatic.com/s/zenmarugothic/v19/o-0XIpIxzW5b-RxT-6A8jWAtCp-cUW1CPA.ttf",
  },
]

const PALETTE = ["#6365f7", "#f8dbe9", "#afdee8", "#b8bdf2"]
const textColors = {
  title: "#303036",
  meta: "#6365f7",
  time: "#8f92c9",
}

// テキスト安全領域 (この矩形の内側には図形を配置しない)
// タイトル最大 3 行 + 日付 / サイト名行が入るサイズ
const TEXT_ZONE = { x: 130, y: 175, w: WIDTH - 260, h: 280 }

// キャンバス外への overflow 許容量
const OVERFLOW_MARGIN = 120

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

const pick = <T>(arr: readonly T[], rng: () => number): T =>
  arr[Math.floor(rng() * arr.length)]

type ShapeType = "triangle" | "ellipse" | "rectangle" | "geometric"
const SHAPE_TYPES: readonly ShapeType[] = [
  "triangle",
  "ellipse",
  "rectangle",
  "geometric",
]

type BBox = { x: number; y: number; w: number; h: number }

// 図形をランダム回転でラップする (transform="rotate(angle cx cy)")
const withRotation = (elem: unknown, cx: number, cy: number, angle: number) => {
  if (Math.abs(angle) < 0.5) return elem
  return {
    type: "g",
    props: {
      transform: `rotate(${angle.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`,
      children: elem,
    },
  }
}

// bbox の中に 1 つの図形を返す (ランダム回転付き)
const buildShape = (
  type: ShapeType,
  bbox: BBox,
  color: string,
  rng: () => number,
) => {
  const { x, y, w, h } = bbox
  const rand = (min: number, max: number) => min + rng() * (max - min)
  const cx = x + w / 2
  const cy = y + h / 2
  // 柄っぽさを維持するため、回転は控えめ (±25°)
  const rotation = rand(-25, 25)

  const buildElement = () => {
    if (type === "triangle") {
      const p1 = [x + rand(0, w * 0.25), y + h]
      const p2 = [x + w - rand(0, w * 0.25), y + h]
      const p3 = [x + rand(0.3, 0.7) * w, y + rand(0, w * 0.15)]
      return {
        type: "polygon",
        props: {
          points: [p1, p2, p3].map(([px, py]) => `${px},${py}`).join(" "),
          fill: color,
        },
      }
    }

    if (type === "ellipse") {
      return {
        type: "ellipse",
        props: {
          cx,
          cy,
          rx: (w / 2) * rand(0.75, 1),
          ry: (h / 2) * rand(0.75, 1),
          fill: color,
        },
      }
    }

    if (type === "rectangle") {
      const rectW = w * rand(0.55, 0.95)
      const rectH = h * rand(0.55, 0.95)
      return {
        type: "rect",
        props: {
          x: x + (w - rectW) / 2,
          y: y + (h - rectH) / 2,
          width: rectW,
          height: rectH,
          rx: rng() < 0.4 ? rand(10, 24) : 0,
          fill: color,
        },
      }
    }

    // geometric: 円環 / 十字 / 菱形 / X のいずれか
    const variant = Math.floor(rng() * 4)
    const r = Math.min(w, h) / 2

    if (variant === 0) {
      // ring (輪郭のみの円)
      return {
        type: "circle",
        props: {
          cx,
          cy,
          r: r * 0.85,
          fill: "transparent",
          stroke: color,
          strokeWidth: rand(12, 18),
        },
      }
    }

    if (variant === 1) {
      // plus (+)
      const armLong = r * 1.7
      const armShort = r * 0.55
      return {
        type: "g",
        props: {
          children: [
            {
              type: "rect",
              props: {
                x: cx - armLong / 2,
                y: cy - armShort / 2,
                width: armLong,
                height: armShort,
                fill: color,
              },
            },
            {
              type: "rect",
              props: {
                x: cx - armShort / 2,
                y: cy - armLong / 2,
                width: armShort,
                height: armLong,
                fill: color,
              },
            },
          ],
        },
      }
    }

    if (variant === 2) {
      // diamond (菱形)
      const rx = r * 0.9
      const ry = r * 0.75
      const pts = [
        [cx, cy - ry],
        [cx + rx, cy],
        [cx, cy + ry],
        [cx - rx, cy],
      ]
      return {
        type: "polygon",
        props: {
          points: pts.map(([px, py]) => `${px},${py}`).join(" "),
          fill: color,
        },
      }
    }

    // variant 3: X 型
    const thick = r * 0.35
    const long = r * 1.6
    const s = Math.SQRT1_2
    const arm = long / 2
    const t = thick / 2
    const bar1 = [
      [cx - arm * s - t * s, cy - arm * s + t * s],
      [cx - arm * s + t * s, cy - arm * s - t * s],
      [cx + arm * s + t * s, cy + arm * s - t * s],
      [cx + arm * s - t * s, cy + arm * s + t * s],
    ]
    const bar2 = [
      [cx + arm * s - t * s, cy - arm * s - t * s],
      [cx + arm * s + t * s, cy - arm * s + t * s],
      [cx - arm * s + t * s, cy + arm * s + t * s],
      [cx - arm * s - t * s, cy + arm * s - t * s],
    ]
    return {
      type: "g",
      props: {
        children: [
          {
            type: "polygon",
            props: {
              points: bar1.map(([px, py]) => `${px},${py}`).join(" "),
              fill: color,
            },
          },
          {
            type: "polygon",
            props: {
              points: bar2.map(([px, py]) => `${px},${py}`).join(" "),
              fill: color,
            },
          },
        ],
      },
    }
  }

  return withRotation(buildElement(), cx, cy, rotation)
}

// bbox と TEXT_ZONE の重なり判定
const intersectsTextZone = (bbox: BBox) => {
  return (
    bbox.x < TEXT_ZONE.x + TEXT_ZONE.w &&
    bbox.x + bbox.w > TEXT_ZONE.x &&
    bbox.y < TEXT_ZONE.y + TEXT_ZONE.h &&
    bbox.y + bbox.h > TEXT_ZONE.y
  )
}

// 図形は "柄" として扱う。上下左右のストリップにグリッド + ジッタで並べる
type ShapeSpec = { bbox: BBox; kind: "free" }

// 1 ストリップ内にグリッドで図形を並べる。
// nCols/nRows でセル数、cellSize でセル 1 個の一辺、jitter でセル内の揺らぎ、
// shapeMin/shapeMax でセル内の実サイズ範囲
const placeGrid = (
  rng: () => number,
  rand: (a: number, b: number) => number,
  opts: {
    xStart: number
    xEnd: number
    yStart: number
    yEnd: number
    cell: number
    jitter: number
    shapeMin: number
    shapeMax: number
    staggerRows?: boolean
  },
  specs: ShapeSpec[],
) => {
  const width = opts.xEnd - opts.xStart
  const height = opts.yEnd - opts.yStart
  const nCols = Math.max(1, Math.round(width / opts.cell))
  const nRows = Math.max(1, Math.round(height / opts.cell))
  const stepX = width / nCols
  const stepY = height / nRows

  for (let r = 0; r < nRows; r++) {
    const rowShift = opts.staggerRows && r % 2 === 1 ? stepX * 0.5 : 0
    for (let c = 0; c < nCols; c++) {
      const cx =
        opts.xStart +
        (c + 0.5) * stepX +
        rowShift +
        rand(-opts.jitter, opts.jitter)
      const cy =
        opts.yStart + (r + 0.5) * stepY + rand(-opts.jitter, opts.jitter)
      const size = rand(opts.shapeMin, opts.shapeMax)
      const half = size / 2
      const bbox = { x: cx - half, y: cy - half, w: size, h: size }
      if (intersectsTextZone(bbox)) continue
      specs.push({ bbox, kind: "free" })
    }
    // 未使用パラメータ警告を避ける
    void rng
  }
}

const generateShapeSpecs = (rng: () => number): ShapeSpec[] => {
  const rand = (min: number, max: number) => min + rng() * (max - min)
  const specs: ShapeSpec[] = []

  const O = OVERFLOW_MARGIN
  const CELL = 140 // グリッドの一辺 (図形間の中心間隔)
  const JITTER = 14 // セル内のランダム変位 (柄が揺らぐ程度)
  // 図形サイズはセルの 45〜75% (被らないよう控えめ)
  const SHAPE_MIN = CELL * 0.45
  const SHAPE_MAX = CELL * 0.72

  // Top strip: canvas 端から少しはみ出させて 2 行
  placeGrid(
    rng,
    rand,
    {
      xStart: -O + 20,
      xEnd: WIDTH + O - 20,
      yStart: -O + 20,
      yEnd: TEXT_ZONE.y - 15,
      cell: CELL,
      jitter: JITTER,
      shapeMin: SHAPE_MIN,
      shapeMax: SHAPE_MAX,
      staggerRows: true,
    },
    specs,
  )
  // Bottom strip
  placeGrid(
    rng,
    rand,
    {
      xStart: -O + 20,
      xEnd: WIDTH + O - 20,
      yStart: TEXT_ZONE.y + TEXT_ZONE.h + 15,
      yEnd: HEIGHT + O - 20,
      cell: CELL,
      jitter: JITTER,
      shapeMin: SHAPE_MIN,
      shapeMax: SHAPE_MAX,
      staggerRows: true,
    },
    specs,
  )
  // Left column
  placeGrid(
    rng,
    rand,
    {
      xStart: -O + 20,
      xEnd: TEXT_ZONE.x - 15,
      yStart: TEXT_ZONE.y + 15,
      yEnd: TEXT_ZONE.y + TEXT_ZONE.h - 15,
      cell: CELL,
      jitter: JITTER,
      shapeMin: SHAPE_MIN,
      shapeMax: SHAPE_MAX,
      staggerRows: true,
    },
    specs,
  )
  // Right column
  placeGrid(
    rng,
    rand,
    {
      xStart: TEXT_ZONE.x + TEXT_ZONE.w + 15,
      xEnd: WIDTH + O - 20,
      yStart: TEXT_ZONE.y + 15,
      yEnd: TEXT_ZONE.y + TEXT_ZONE.h - 15,
      cell: CELL,
      jitter: JITTER,
      shapeMin: SHAPE_MIN,
      shapeMax: SHAPE_MAX,
      staggerRows: true,
    },
    specs,
  )
  return specs
}

const buildBackgroundSvg = (slug: string) => {
  const rng = seededRandom(slug)
  const specs = generateShapeSpecs(rng)

  // カラーは前と別の色を選ぶ (連続同色を避ける)
  let lastColor: string | null = null
  const pickColor = () => {
    let c: string
    do {
      c = pick(PALETTE, rng)
    } while (c === lastColor && PALETTE.length > 1)
    lastColor = c
    return c
  }

  const children = specs.map((spec) => {
    const color = pickColor()
    const type = pick(SHAPE_TYPES, rng)
    return buildShape(type, spec.bbox, color, rng)
  })

  return {
    type: "svg",
    props: {
      width: WIDTH,
      height: HEIGHT,
      viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
      style: { position: "absolute", top: 0, left: 0, overflow: "visible" },
      children,
    },
  }
}

const buildNode = (title: string, publishedAt: string, slug: string) => {
  const bgSvg = buildBackgroundSvg(slug)

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
        bgSvg,
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
              padding: `${TEXT_ZONE.y}px ${TEXT_ZONE.x}px ${
                HEIGHT - (TEXT_ZONE.y + TEXT_ZONE.h)
              }px`,
              position: "relative",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: 54,
                    fontWeight: 700,
                    lineHeight: 1.25,
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
                    fontSize: 36,
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
                          fontWeight: 700,
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
