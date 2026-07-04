import type { Markdown } from "contentlayer2/core"
import { useEffect, useRef } from "react"

const TWITTER_WIDGET_SRC = "https://platform.twitter.com/widgets.js"

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (el?: HTMLElement) => void
      }
    }
  }
}

function loadTwitterWidgets(container: HTMLElement) {
  if (!container.querySelector(".twitter-tweet")) return

  const hydrate = () => {
    window.twttr?.widgets?.load(container)
  }

  if (window.twttr?.widgets) {
    hydrate()
    return
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${TWITTER_WIDGET_SRC}"]`,
  )
  if (existing) {
    existing.addEventListener("load", hydrate, { once: true })
    return
  }

  const script = document.createElement("script")
  script.src = TWITTER_WIDGET_SRC
  script.async = true
  script.charset = "utf-8"
  script.addEventListener("load", hydrate, { once: true })
  document.body.appendChild(script)
}

export const MarkdownContent = ({ post }: { post: { body: Markdown } }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) loadTwitterWidgets(ref.current)
  }, [])

  return (
    <div
      className="
    prose
    prose-lg
    prose-headings:relative
    prose-headings:font-bold
    prose-h2:border-b
    prose-h2:border-primary-default
    prose-h2:pb-heading-bottom
    prose-a:text-primary-default
    prose-code:rounded-md
    prose-code:bg-gray-700
    prose-code:px-inline-x
    prose-code:py-inline-y
    prose-code:text-slate-300
    prose-code:before:content-none
    prose-code:after:content-none
    prose-li:marker:text-black
    "
    >
      <div ref={ref} dangerouslySetInnerHTML={{ __html: post.body.html }}></div>
    </div>
  )
}
