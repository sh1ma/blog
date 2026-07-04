import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export type OgpData = {
  url: string
  title: string
  description?: string
  image?: string
  siteName?: string
  favicon?: string
  domain: string
}

type CacheEntry = {
  fetchedAt: number
  data: OgpData | null
}

const CACHE_DIR = path.resolve(process.cwd(), "node_modules/.cache/ogp")
const CACHE_FILE = path.join(CACHE_DIR, "ogp-cache.json")
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30
const FETCH_TIMEOUT_MS = 8000
const USER_AGENT =
  "Mozilla/5.0 (compatible; BlogOgpBot/1.0; +https://sh1ma.dev)"

let cache: Record<string, CacheEntry> | null = null

async function loadCache(): Promise<Record<string, CacheEntry>> {
  if (cache) return cache
  if (existsSync(CACHE_FILE)) {
    try {
      const raw = await readFile(CACHE_FILE, "utf-8")
      cache = JSON.parse(raw)
      return cache!
    } catch {
      // fall through
    }
  }
  cache = {}
  return cache
}

async function saveCache() {
  if (!cache) return
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
}

function extractMeta(html: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`,
        "i",
      ),
    ]
    for (const p of patterns) {
      const m = html.match(p)
      if (m?.[1]) return decodeHtmlEntities(m[1].trim())
    }
  }
  return undefined
}

function extractTitleTag(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (m?.[1]) return decodeHtmlEntities(m[1].trim())
  return undefined
}

function resolveUrl(base: string, ref: string): string {
  try {
    return new URL(ref, base).toString()
  } catch {
    return ref
  }
}

async function fetchWithTimeout(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en;q=0.8",
      },
    })
    if (!res.ok) return null
    const ct = res.headers.get("content-type") || ""
    if (!/text\/html|xhtml/i.test(ct) && ct !== "") return null
    // Only read the head portion to keep it small.
    const buf = await res.arrayBuffer()
    return new TextDecoder("utf-8", { fatal: false })
      .decode(buf)
      .slice(0, 200_000)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function fetchOgpFresh(url: string): Promise<OgpData | null> {
  const html = await fetchWithTimeout(url)
  if (!html) return null

  const finalUrl = url
  const domain = (() => {
    try {
      return new URL(finalUrl).hostname.replace(/^www\./, "")
    } catch {
      return finalUrl
    }
  })()

  const title =
    extractMeta(html, ["og:title", "twitter:title"]) ??
    extractTitleTag(html) ??
    domain
  const description = extractMeta(html, [
    "og:description",
    "twitter:description",
    "description",
  ])
  const imageRaw = extractMeta(html, ["og:image", "twitter:image"])
  const image = imageRaw ? resolveUrl(finalUrl, imageRaw) : undefined
  const siteName = extractMeta(html, ["og:site_name"])
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`

  return { url: finalUrl, title, description, image, siteName, favicon, domain }
}

export async function fetchOgp(url: string): Promise<OgpData | null> {
  const c = await loadCache()
  const now = Date.now()
  const hit = c[url]
  if (hit && now - hit.fetchedAt < CACHE_TTL_MS) {
    return hit.data
  }
  const data = await fetchOgpFresh(url)
  c[url] = { fetchedAt: now, data }
  await saveCache()
  return data
}
