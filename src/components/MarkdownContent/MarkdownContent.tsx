import type { Markdown } from "contentlayer2/core"
import { useEffect, useRef } from "react"

export const MarkdownContent = ({ post }: { post: { body: Markdown } }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: DOM は post.body.html から派生
  useEffect(() => {
    const root = containerRef.current
    if (!root) return

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
  }, [post.body.html])

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
      <div dangerouslySetInnerHTML={{ __html: post.body.html }}></div>
    </div>
  )
}
