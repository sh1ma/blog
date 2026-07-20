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

function attachCopyButtons(root: HTMLElement): () => void {
  const figures = root.querySelectorAll<HTMLElement>(
    "figure[data-rehype-pretty-code-figure]",
  )
  const cleanups: Array<() => void> = []

  for (const figure of figures) {
    if (figure.querySelector(".copy-btn")) continue

    const button = document.createElement("button")
    button.type = "button"
    button.className = "copy-btn"
    button.textContent = "Copy"
    button.setAttribute("aria-label", "コードをコピー")

    let resetTimer: number | undefined
    const onClick = async () => {
      const code = figure.querySelector("code")?.textContent ?? ""
      try {
        await navigator.clipboard.writeText(code)
        button.textContent = "Copied!"
        button.dataset.copied = "true"
        if (resetTimer) window.clearTimeout(resetTimer)
        resetTimer = window.setTimeout(() => {
          button.textContent = "Copy"
          delete button.dataset.copied
        }, 1500)
      } catch {
        button.textContent = "Failed"
        if (resetTimer) window.clearTimeout(resetTimer)
        resetTimer = window.setTimeout(() => {
          button.textContent = "Copy"
        }, 1500)
      }
    }

    button.addEventListener("click", onClick)
    figure.appendChild(button)

    cleanups.push(() => {
      button.removeEventListener("click", onClick)
      if (resetTimer) window.clearTimeout(resetTimer)
      button.remove()
    })
  }

  return () => {
    for (const cleanup of cleanups) cleanup()
  }
}

export const MarkdownContent = ({
  post,
}: {
  post: { body: { html: string } }
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const html = post.body.html

  useEffect(() => {
    if (!html) return
    const root = containerRef.current
    if (!root) return
    const detachCopyButtons = attachCopyButtons(root)
    loadTwitterWidgets(root)
    return detachCopyButtons
  }, [html])

  return (
    <div
      ref={containerRef}
      className="
    prose
    prose-lg
    prose-headings:relative
    prose-headings:font-bold
    prose-h2:border-b
    prose-h2:border-primary-default
    prose-h2:pb-heading-bottom
    prose-a:text-primary-default
    prose-code:before:content-none
    prose-code:after:content-none
    prose-li:marker:text-black
    "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
