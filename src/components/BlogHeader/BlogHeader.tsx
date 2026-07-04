import { Link, useLocation } from "@tanstack/react-router"
import { Menu, PenLine } from "lucide-react"
import { useEffect, useState } from "react"

const SCROLL_THRESHOLD = 80
const HIDE_DELAY_MS = 3000

const glassSurface =
  "bg-bg-surface/60 border border-white/40 shadow-soft backdrop-blur-xl backdrop-saturate-150"

export const BlogHeader = () => {
  const pathname = useLocation({ select: (loc) => loc.pathname })
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined

    const scheduleHide = () => {
      if (hideTimer) clearTimeout(hideTimer)
      if (window.scrollY > SCROLL_THRESHOLD) {
        hideTimer = setTimeout(() => setVisible(false), HIDE_DELAY_MS)
      }
    }

    const onActivity = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
      setVisible(true)
      scheduleHide()
    }

    onActivity()
    window.addEventListener("scroll", onActivity, { passive: true })
    window.addEventListener("pointerdown", onActivity)
    window.addEventListener("keydown", onActivity)
    window.addEventListener("touchstart", onActivity, { passive: true })

    return () => {
      if (hideTimer) clearTimeout(hideTimer)
      window.removeEventListener("scroll", onActivity)
      window.removeEventListener("pointerdown", onActivity)
      window.removeEventListener("keydown", onActivity)
      window.removeEventListener("touchstart", onActivity)
    }
  }, [])

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname.startsWith("/articles")
    }
    return pathname.startsWith(path)
  }

  const getLinkClassName = (path: string) => {
    if (isActive(path)) {
      return "border-b-2 border-brand-primary pb-0.5 text-sm font-semibold text-brand-primary"
    }
    return "border-b-2 border-transparent pb-0.5 text-sm font-medium text-text-muted transition-colors hover:text-brand-primary"
  }

  return (
    <div
      className={`sticky top-4 z-50 mb-8 w-full px-4 transition-opacity duration-700 ease-out sm:px-6 lg:px-8 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="relative mx-auto max-w-3xl">
        <header
          className={`${glassSurface} flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-4 transition-all duration-500 ease-out ${
            scrolled
              ? "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
              : "translate-y-0 scale-100 opacity-100"
          }`}
        >
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-brand-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg text-brand-primary">
              <PenLine className="text-3xl" />
            </div>
            <div className="whitespace-nowrap text-xl font-bold tracking-tight text-text-primary">
              blog.<span className="text-brand-primary">sh1ma.dev</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/" className={getLinkClassName("/")}>
              Articles
            </Link>
            <Link to="/about" className={getLinkClassName("/about")}>
              About
            </Link>
          </nav>

          <button
            type="button"
            aria-label="Menu"
            className="shrink-0 p-2 text-text-muted transition-colors hover:text-brand-primary md:hidden"
          >
            <Menu />
          </button>
        </header>

        <button
          type="button"
          aria-label="Menu"
          className={`${glassSurface} absolute top-0 right-0 flex size-12 items-center justify-center rounded-full text-text-muted transition-all duration-500 ease-out hover:text-brand-primary ${
            scrolled
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-90 opacity-0"
          }`}
        >
          <Menu />
        </button>
      </div>
    </div>
  )
}
