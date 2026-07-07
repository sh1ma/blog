import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import dayjs from "dayjs"
import { Feed } from "feed"
import { allArticles } from "../.contentlayer/generated/index.mjs"

const SITE_URL = process.env.SITE_URL ?? "https://blog.sh1ma.dev"
const OUT_DIR = path.resolve("./dist")

type LocaleFeedConfig = {
  locale: "ja" | "en"
  outFile: string
  feedPath: string
  articlePathPrefix: string
  title: string
  description: string
  language: string
}

const FEED_CONFIGS: LocaleFeedConfig[] = [
  {
    locale: "ja",
    outFile: path.join(OUT_DIR, "feed"),
    feedPath: "/feed",
    articlePathPrefix: "/articles",
    title: "blog.sh1ma.dev",
    description: "sh1maのブログです",
    language: "ja",
  },
  {
    locale: "en",
    outFile: path.join(OUT_DIR, "en", "feed"),
    feedPath: "/en/feed",
    articlePathPrefix: "/en/articles",
    title: "blog.sh1ma.dev (English)",
    description: "sh1ma's blog (English)",
    language: "en",
  },
]

for (const config of FEED_CONFIGS) {
  const feed = new Feed({
    title: config.title,
    description: config.description,
    feedLinks: { rss: `${SITE_URL}${config.feedPath}` },
    link: SITE_URL,
    id: `${SITE_URL}${config.feedPath}`,
    language: config.language,
    copyright: `All rights reserved ${dayjs().format("YYYY")}, sh1ma`,
  })

  const feedArticles = allArticles
    .filter((article) => article.locale === config.locale)
    .sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1))

  for (const article of feedArticles) {
    feed.addItem({
      title: article.title,
      description: article.description ?? "",
      link: `${SITE_URL}${config.articlePathPrefix}/${article.id}`,
      date: dayjs(article.publishedAt).toDate(),
    })
  }

  await mkdir(path.dirname(config.outFile), { recursive: true })
  await writeFile(config.outFile, feed.rss2(), "utf-8")
  console.log(`Wrote ${config.outFile} (${feedArticles.length} items)`)
}
