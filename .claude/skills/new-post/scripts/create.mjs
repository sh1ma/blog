#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, "..", "..", "..", "..")
const POSTS_DIR = join(REPO_ROOT, "src", "markdown", "posts")

const parseArgs = (argv) => {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]
    if (!key.startsWith("--")) continue
    const value = argv[i + 1]
    if (value === undefined || value.startsWith("--")) {
      args[key.slice(2)] = true
    } else {
      args[key.slice(2)] = value
      i++
    }
  }
  return args
}

const die = (msg) => {
  console.error(`Error: ${msg}`)
  process.exit(1)
}

const args = parseArgs(process.argv.slice(2))

if (!args.slug) die("--slug is required")
if (!args.title) die("--title is required")

const slug = String(args.slug)
if (!/^[a-z0-9_]+$/.test(slug)) {
  die(`--slug must match /^[a-z0-9_]+$/ (got: ${slug})`)
}

const date = args.date
  ? String(args.date)
  : new Date().toISOString().slice(0, 10)
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  die(`--date must be YYYY-MM-DD (got: ${date})`)
}
const datePrefix = date.replace(/-/g, "")

if (!existsSync(POSTS_DIR)) {
  die(`posts directory not found: ${POSTS_DIR}`)
}

const sameDayFiles = readdirSync(POSTS_DIR).filter(
  (name) => name.endsWith(".md") && name.startsWith(`${datePrefix}_`),
)

let maxN = 0
let hasLegacy = false
for (const name of sameDayFiles) {
  const stem = name.replace(/\.md$/, "")
  const rest = stem.slice(datePrefix.length + 1)
  const match = rest.match(/^(\d+)_/)
  if (match) {
    const n = Number(match[1])
    if (n > maxN) maxN = n
  } else {
    hasLegacy = true
  }
}

const nextN = hasLegacy && maxN === 0 ? 2 : maxN + 1

const filename = `${datePrefix}_${nextN}_${slug}.md`
const filepath = join(POSTS_DIR, filename)

if (existsSync(filepath)) {
  die(`file already exists: ${filepath}`)
}

const description = args.description ? String(args.description) : ""
const tagsRaw = args.tags ? String(args.tags) : ""
const tagsList = tagsRaw
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean)
const tagsInline = `[${tagsList.map((t) => JSON.stringify(t)).join(", ")}]`

const escapeYaml = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')

const frontmatter = [
  "---",
  `title: "${escapeYaml(args.title)}"`,
  `publishedAt: "${date}"`,
  `description: "${escapeYaml(description)}"`,
  `tags: ${tagsInline}`,
  "---",
  "",
  "",
].join("\n")

mkdirSync(POSTS_DIR, { recursive: true })
writeFileSync(filepath, frontmatter, { flag: "wx" })

console.log(filepath)
