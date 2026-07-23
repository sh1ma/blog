import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { allArticles } from "../.content-collections/generated/index.js"

const SITE_URL = process.env.SITE_URL ?? "https://blog.sh1ma.dev"
const OUT_DIR = path.resolve("./dist")
const OUT_FILE = path.join(OUT_DIR, "sitemap.xml")

type AlternateLink = {
  hreflang: string
  href: string
}

type UrlEntry = {
  loc: string
  lastmod?: Date
  alternates?: AlternateLink[]
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
  for (const alternate of entry.alternates ?? []) {
    children.push(
      `<xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}" />`,
    )
  }
  return `  <url>\n${children.map((c) => `    ${c}`).join("\n")}\n  </url>`
}

const buildSitemapXml = (entries: UrlEntry[]): string => {
  const body = entries.map(urlToXml).join("\n")
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    body,
    "</urlset>",
    "",
  ].join("\n")
}

const staticEntries: UrlEntry[] = [
  { loc: resolveUrl("/") },
  { loc: resolveUrl("/about") },
  { loc: resolveUrl("/en") },
  { loc: resolveUrl("/en/about") },
]

const articleEntries: UrlEntry[] = allArticles.map((article) => {
  const prefix = article.locale === "en" ? "/en/articles" : "/articles"
  const hasTranslation = allArticles.some(
    (other) => other.id === article.id && other.locale !== article.locale,
  )
  return {
    loc: resolveUrl(`${prefix}/${article.id}`),
    lastmod: new Date(article.publishedAt),
    alternates: hasTranslation
      ? [
          { hreflang: "ja", href: resolveUrl(`/articles/${article.id}`) },
          { hreflang: "en", href: resolveUrl(`/en/articles/${article.id}`) },
        ]
      : undefined,
  }
})

const entries: UrlEntry[] = [...staticEntries, ...articleEntries]

await mkdir(OUT_DIR, { recursive: true })
await writeFile(OUT_FILE, buildSitemapXml(entries), "utf-8")
console.log(`Wrote ${OUT_FILE} (${entries.length} urls)`)
