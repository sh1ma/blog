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
  const rotation = rand(-180, 180)

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

// 外周を 4 バンドに分け、それぞれに図形を密に配置する。
// - 上下 (横に長い): 多くの図形
// - 左右 (縦に長い、幅は狭い): 少なめだが必ず存在
// - サイズと位置はジッター、キャンバス端に到達 (overflow) しやすい
type Band = "top" | "right" | "bottom" | "left"

const bandExtents = (band: Band) => {
  const O = OVERFLOW_MARGIN
  if (band === "top") {
    return { xMin: -O, xMax: WIDTH + O, yMin: -O, yMax: TEXT_ZONE.y }
  }
  if (band === "bottom") {
    return {
      xMin: -O,
      xMax: WIDTH + O,
      yMin: TEXT_ZONE.y + TEXT_ZONE.h,
      yMax: HEIGHT + O,
    }
  }
  if (band === "left") {
    return {
      xMin: -O,
      xMax: TEXT_ZONE.x,
      yMin: TEXT_ZONE.y,
      yMax: TEXT_ZONE.y + TEXT_ZONE.h,
    }
  }
  return {
    xMin: TEXT_ZONE.x + TEXT_ZONE.w,
    xMax: WIDTH + O,
    yMin: TEXT_ZONE.y,
    yMax: TEXT_ZONE.y + TEXT_ZONE.h,
  }
}

// 与えられた band 内にランダムに 1 個の bbox を返す (テキスト領域と非交差)
const sampleInBand = (
  band: Band,
  size: number,
  rand: (a: number, b: number) => number,
): BBox | null => {
  const ext = bandExtents(band)
  const half = size / 2
  const availW = ext.xMax - ext.xMin
  const availH = ext.yMax - ext.yMin
  if (availW < 20 || availH < 20) return null
  // half がバンド寸法より大きいときは "半分以上はみ出す" 状態を許容するので、
  // 中心座標を band 範囲でクランプ
  const cxMin = ext.xMin + Math.min(half, availW / 2 - 10)
  const cxMax = ext.xMax - Math.min(half, availW / 2 - 10)
  const cyMin = ext.yMin + Math.min(half, availH / 2 - 10)
  const cyMax = ext.yMax - Math.min(half, availH / 2 - 10)
  const cx = rand(cxMin, cxMax)
  const cy = rand(cyMin, cyMax)
  const bbox: BBox = { x: cx - half, y: cy - half, w: size, h: size }
  if (intersectsTextZone(bbox)) return null
  return bbox
}

const pickSize = (
  rng: () => number,
  rand: (a: number, b: number) => number,
) => {
  const r = rng()
  if (r < 0.2) return rand(50, 90) // 小 (点描)
  if (r < 0.7) return rand(90, 170) // 中
  if (r < 0.92) return rand(170, 240) // 大
  return rand(240, 320) // 特大アクセント
}

const generateShapeBBoxes = (rng: () => number): BBox[] => {
  const rand = (min: number, max: number) => min + rng() * (max - min)
  const bboxes: BBox[] = []

  // 各辺に必ず十分な数を割り当てる
  // 上下: 12〜16 個ずつ、左右: 5〜8 個ずつ → 合計 34〜48 個
  const counts: Record<Band, number> = {
    top: 12 + Math.floor(rng() * 5),
    bottom: 12 + Math.floor(rng() * 5),
    left: 5 + Math.floor(rng() * 4),
    right: 5 + Math.floor(rng() * 4),
  }

  const bands: Band[] = ["top", "bottom", "left", "right"]
  for (const band of bands) {
    for (let i = 0; i < counts[band]; i++) {
      // 十分な回数試行 (テキスト非交差の bbox を得るため)
      for (let attempt = 0; attempt < 6; attempt++) {
        const size = pickSize(rng, rand)
        const bbox = sampleInBand(band, size, rand)
        if (bbox) {
          bboxes.push(bbox)
          break
        }
      }
    }
  }

  // 4 辺すべてに canvas 端に接する図形が最低 1 個は欲しい
  // (中心を端 or 端の少し外に置いて、bbox が端をまたぐようにする)
  const ensureEdgeContact: {
    edge: "top" | "bottom" | "left" | "right"
    band: Band
  }[] = [
    { edge: "top", band: "top" },
    { edge: "bottom", band: "bottom" },
    { edge: "left", band: "left" },
    { edge: "right", band: "right" },
  ]
  for (const { edge, band } of ensureEdgeContact) {
    // 既に接している bbox があるかチェック
    const hasContact = bboxes.some((b) => {
      if (edge === "top") return b.y <= 0
      if (edge === "bottom") return b.y + b.h >= HEIGHT
      if (edge === "left") return b.x <= 0
      return b.x + b.w >= WIDTH
    })
    if (hasContact) continue
    // 端を跨ぐ図形を無理やり追加
    for (let attempt = 0; attempt < 20; attempt++) {
      const size = rand(140, 220)
      const half = size / 2
      let cx: number, cy: number
      if (edge === "top" || edge === "bottom") {
        cx = rand(80, WIDTH - 80)
        cy =
          edge === "top"
            ? rand(-half + 15, -20)
            : rand(HEIGHT + 20, HEIGHT + half - 15)
      } else {
        cy = rand(TEXT_ZONE.y + 20, TEXT_ZONE.y + TEXT_ZONE.h - 20)
        cx =
          edge === "left"
            ? rand(-half + 15, -20)
            : rand(WIDTH + 20, WIDTH + half - 15)
      }
      const bbox: BBox = { x: cx - half, y: cy - half, w: size, h: size }
      if (intersectsTextZone(bbox)) continue
      bboxes.push(bbox)
      break
    }
    void band
  }

  return bboxes
}

const buildBackgroundSvg = (slug: string) => {
  const rng = seededRandom(slug)
  const bboxes = generateShapeBBoxes(rng)

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

  const children = bboxes.map((bbox) => {
    const type = pick(SHAPE_TYPES, rng)
    return buildShape(type, bbox, pickColor(), rng)
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
