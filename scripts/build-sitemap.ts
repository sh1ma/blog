import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { allArticles } from "../.contentlayer/generated/index.mjs"

const SITE_URL = process.env.SITE_URL ?? "https://blog.sh1ma.dev"
const OUT_DIR = path.resolve("./dist")
const OUT_FILE = path.join(OUT_DIR, "sitemap.xml")

type UrlEntry = {
  loc: string
  lastmod?: Date
}

const XML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&apos;",
  '"': "&quot;",
}

const escapeXml = (value: string): string =>
  value.replace(/[&<>'"]/g, (c) => XML_ESCAPE_MAP[c] ?? c)

const resolveUrl = (pathname: string): string =>
  new URL(pathname, SITE_URL).toString()

const urlToXml = (entry: UrlEntry): string => {
  const children: string[] = [`<loc>${escapeXml(entry.loc)}</loc>`]
  if (entry.lastmod) {
    children.push(`<lastmod>${entry.lastmod.toISOString()}</lastmod>`)
  }
  return `  <url>\n${children.map((c) => `    ${c}`).join("\n")}\n  </url>`
}

const buildSitemapXml = (entries: UrlEntry[]): string => {
  const body = entries.map(urlToXml).join("\n")
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
    "",
  ].join("\n")
}

const staticEntries: UrlEntry[] = [
  { loc: resolveUrl("/") },
  { loc: resolveUrl("/about") },
  { loc: resolveUrl("/en/") },
  { loc: resolveUrl("/en/about") },
]

const articleEntries: UrlEntry[] = allArticles.map((article) => {
  const prefix = article.locale === "en" ? "/en/articles" : "/articles"
  return {
    loc: resolveUrl(`${prefix}/${article.id}`),
    lastmod: new Date(article.publishedAt),
  }
})

const entries: UrlEntry[] = [...staticEntries, ...articleEntries]

await mkdir(OUT_DIR, { recursive: true })
await writeFile(OUT_FILE, buildSitemapXml(entries), "utf-8")
console.log(`Wrote ${OUT_FILE} (${entries.length} urls)`)
