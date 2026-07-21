import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { Resvg } from "@resvg/resvg-js"
import dayjs from "dayjs"
import satori from "satori"
import { allArticles } from "../.content-collections/generated/index.js"

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

// 角丸のかかる比率 (図形の代表サイズに対して)。全種で共通の "同じ程度" の丸み
const RADIUS_RATIO = 0.18

// N 個の頂点で構成される多角形の頂点列に、共通半径 r で角丸を付けた SVG path
// (二次ベジェで角を丸める)
const roundedPolygonPath = (points: [number, number][], r: number): string => {
  const n = points.length
  const parts: string[] = []
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]
    const curr = points[i]
    const next = points[(i + 1) % n]

    const dxIn = prev[0] - curr[0]
    const dyIn = prev[1] - curr[1]
    const inLen = Math.hypot(dxIn, dyIn) || 1
    const dxOut = next[0] - curr[0]
    const dyOut = next[1] - curr[1]
    const outLen = Math.hypot(dxOut, dyOut) || 1

    // 隣接辺の長さで丸め半径を制限 (辺の中点を超えない)
    const rr = Math.min(r, inLen / 2, outLen / 2)

    const p1x = curr[0] + (dxIn / inLen) * rr
    const p1y = curr[1] + (dyIn / inLen) * rr
    const p2x = curr[0] + (dxOut / outLen) * rr
    const p2y = curr[1] + (dyOut / outLen) * rr

    parts.push(
      i === 0
        ? `M ${p1x.toFixed(2)} ${p1y.toFixed(2)}`
        : `L ${p1x.toFixed(2)} ${p1y.toFixed(2)}`,
    )
    parts.push(
      `Q ${curr[0].toFixed(2)} ${curr[1].toFixed(2)} ${p2x.toFixed(2)} ${p2y.toFixed(2)}`,
    )
  }
  parts.push("Z")
  return parts.join(" ")
}

// bbox の中に 1 つの図形を返す (すべて線対称 & 角丸)
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
  const size = Math.min(w, h)
  const half = size / 2
  const radius = size * RADIUS_RATIO
  const rotation = rand(-25, 25)

  const buildElement = () => {
    if (type === "triangle") {
      // 正三角形 (equilateral): 外接円半径 = half、頂点は上向き
      const angles = [
        -Math.PI / 2,
        -Math.PI / 2 + (2 * Math.PI) / 3,
        -Math.PI / 2 - (2 * Math.PI) / 3,
      ]
      const pts: [number, number][] = angles.map(
        (a) =>
          [cx + half * Math.cos(a), cy + half * Math.sin(a)] as [
            number,
            number,
          ],
      )
      return {
        type: "path",
        props: { d: roundedPolygonPath(pts, radius), fill: color },
      }
    }

    if (type === "ellipse") {
      // 円 (両軸で線対称、無限軸)
      return {
        type: "circle",
        props: { cx, cy, r: half, fill: color },
      }
    }

    if (type === "rectangle") {
      // 正方形または長方形 (2 軸線対称) を角丸 rect で
      return {
        type: "rect",
        props: {
          x,
          y,
          width: w,
          height: h,
          rx: radius,
          fill: color,
        },
      }
    }

    // geometric: ring / plus / diamond / X (X は plus を 45°回転)
    const variant = Math.floor(rng() * 4)

    if (variant === 0) {
      // ring (輪郭円)
      const strokeW = size * 0.15
      return {
        type: "circle",
        props: {
          cx,
          cy,
          r: half - strokeW / 2,
          fill: "transparent",
          stroke: color,
          strokeWidth: strokeW,
        },
      }
    }

    if (variant === 1 || variant === 3) {
      // plus (+) と X は同じ形。X は 45° 回した plus とする
      const armLong = size * 0.9
      const armShort = size * 0.34
      const L = armLong / 2
      const S = armShort / 2
      const pts: [number, number][] = [
        [cx - S, cy - L],
        [cx + S, cy - L],
        [cx + S, cy - S],
        [cx + L, cy - S],
        [cx + L, cy + S],
        [cx + S, cy + S],
        [cx + S, cy + L],
        [cx - S, cy + L],
        [cx - S, cy + S],
        [cx - L, cy + S],
        [cx - L, cy - S],
        [cx - S, cy - S],
      ]
      const extraRotate = variant === 3 ? 45 : 0
      // 角丸半径は他図形と揃えるが、細腕の凹角では armShort/2 で制限される
      const path = roundedPolygonPath(pts, radius)
      const elem = { type: "path", props: { d: path, fill: color } }
      if (extraRotate === 0) return elem
      return {
        type: "g",
        props: {
          transform: `rotate(${extraRotate} ${cx.toFixed(2)} ${cy.toFixed(2)})`,
          children: elem,
        },
      }
    }

    // variant === 2: diamond (菱形: 頂点を上下左右)
    const pts: [number, number][] = [
      [cx, cy - half],
      [cx + half, cy],
      [cx, cy + half],
      [cx - half, cy],
    ]
    return {
      type: "path",
      props: { d: roundedPolygonPath(pts, radius), fill: color },
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
  locale: "ja" | "en",
  hasTranslation: boolean,
) => {
  const path = locale === "en" ? `en/articles/${slug}` : `articles/${slug}`
  const url = `${SITE_URL}/${path}`
  const ogImage = `${SITE_URL}/og/${locale === "en" ? `en/${slug}` : slug}.png`
  const desc = description ?? (locale === "en" ? "Blog article" : "ブログ記事")
  const hreflangLinks = hasTranslation
    ? [
        `    <link rel="alternate" hreflang="ja" href="${SITE_URL}/articles/${slug}" />`,
        `    <link rel="alternate" hreflang="en" href="${SITE_URL}/en/articles/${slug}" />`,
      ]
    : []
  const meta = [
    ...hreflangLinks,
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
  const withLang =
    locale === "en"
      ? withTitle.replace(/<html\s+lang="[^"]*"/, '<html lang="en"')
      : withTitle
  return injectHead(withLang, meta)
}

await mkdir(OG_DIR, { recursive: true })
await mkdir(path.join(OG_DIR, "en"), { recursive: true })
const fonts = await loadFonts()
const shell = await readFile(SHELL_HTML, "utf-8")

let pngCount = 0
let htmlCount = 0
for (const article of allArticles) {
  const locale = article.locale === "en" ? "en" : "ja"
  const publishedAt = dayjs(article.publishedAt).format("YYYY-MM-DD")
  const ogSlug = locale === "en" ? `en/${article.id}` : article.id
  await renderPng(ogSlug, article.title, publishedAt, fonts)
  pngCount++

  const articleDir =
    locale === "en"
      ? path.join(DIST_DIR, "en", "articles", article.id)
      : path.join(DIST_DIR, "articles", article.id)
  await mkdir(articleDir, { recursive: true })
  const hasTranslation = allArticles.some(
    (other) => other.id === article.id && other.locale !== article.locale,
  )
  const html = buildArticleHtml(
    shell,
    article.id,
    article.title,
    article.description,
    locale,
    hasTranslation,
  )
  await writeFile(path.join(articleDir, "index.html"), html)
  htmlCount++
}
const buildEnPageHtml = (shell: string, title: string, description: string) => {
  const withLang = shell.replace(/<html\s+lang="[^"]*"/, '<html lang="en"')
  const withTitle = withLang.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`,
  )
  const meta = [
    `    <meta name="description" content="${escapeHtml(description)}" />`,
  ].join("\n")
  return injectHead(withTitle, meta)
}

const enPages = [
  {
    dir: path.join(DIST_DIR, "en"),
    title: "blog.sh1ma.dev",
    description: "sh1ma's blog",
  },
  {
    dir: path.join(DIST_DIR, "en", "about"),
    title: "About - blog.sh1ma.dev",
    description: "About sh1ma",
  },
]
for (const page of enPages) {
  await mkdir(page.dir, { recursive: true })
  await writeFile(
    path.join(page.dir, "index.html"),
    buildEnPageHtml(shell, page.title, page.description),
  )
  htmlCount++
}

console.log(`Generated ${pngCount} OGP PNGs and ${htmlCount} HTMLs`)
