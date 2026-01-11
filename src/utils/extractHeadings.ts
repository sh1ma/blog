import type { TocItem } from "@/components/TableOfContents/TableOfContents"

export function extractHeadings(html: string): TocItem[] {
  const headingRegex = /<h([2-4])[^>]*id="([^"]+)"[^>]*>([^<]+)<\/h\1>/g
  const headings: TocItem[] = []
  let match

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]) as 2 | 3 | 4
    const id = match[2]
    const text = match[3]

    headings.push({ id, text, level })
  }

  return headings
}
