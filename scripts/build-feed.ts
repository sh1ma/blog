import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import dayjs from "dayjs"
import { Feed } from "feed"
import { allArticles } from "../.contentlayer/generated/index.mjs"

const SITE_URL = process.env.SITE_URL ?? "https://blog.sh1ma.dev"
const OUT_DIR = path.resolve("./dist")
const OUT_FILE = path.join(OUT_DIR, "feed.xml")

const feed = new Feed({
  title: "blog.sh1ma.dev",
  feedLinks: { rss: `${SITE_URL}/feed.xml` },
  link: SITE_URL,
  id: SITE_URL,
  copyright: `All rights reserved ${dayjs().format("YYYY")}, sh1ma`,
})

const feedArticles = allArticles.filter((article) => article.locale === "ja")

for (const article of feedArticles) {
  feed.addItem({
    title: article.title,
    description: article.description ?? "",
    link: `${SITE_URL}/articles/${article.id}`,
    date: dayjs(article.publishedAt).toDate(),
  })
}

await mkdir(OUT_DIR, { recursive: true })
await writeFile(OUT_FILE, feed.rss2(), "utf-8")
console.log(`Wrote ${OUT_FILE} (${feedArticles.length} items)`)
