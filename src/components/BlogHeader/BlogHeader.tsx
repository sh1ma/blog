import { Link, useLocation } from "@tanstack/react-router"
import { Menu, PenLine } from "lucide-react"
import { useEffect, useState } from "react"

const SCROLL_THRESHOLD = 80
const HIDE_DELAY_MS = 3000

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
    <div className="sticky top-4 z-50 mb-8 w-full px-4 sm:px-6 lg:px-8">
      <div
        className={`mx-auto flex max-w-3xl transition-opacity duration-500 ease-out ${
          scrolled ? "justify-end" : ""
        } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <header
          className={`bg-bg-surface/90 flex items-center gap-4 rounded-xl border border-gray-200/50 shadow-soft backdrop-blur-md transition-all duration-500 ease-out ${
            scrolled ? "px-2 py-2" : "w-full justify-between px-6 py-4"
          }`}
        >
          <Link
            to="/"
            className={`flex items-center gap-3 overflow-hidden transition-all duration-500 ease-out ${
              scrolled
                ? "pointer-events-none w-0 opacity-0"
                : "w-auto opacity-100"
            }`}
          >
            <div className="bg-brand-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg text-brand-primary">
              <PenLine className="text-3xl" />
            </div>
            <div className="whitespace-nowrap text-xl font-bold tracking-tight text-text-primary">
              blog.<span className="text-brand-primary">sh1ma.dev</span>
            </div>
          </Link>

          <nav
            className={`hidden items-center gap-8 overflow-hidden transition-all duration-500 ease-out md:flex ${
              scrolled
                ? "pointer-events-none md:w-0 md:opacity-0"
                : "opacity-100"
            }`}
          >
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
            className={`shrink-0 p-2 text-text-muted transition-colors hover:text-brand-primary ${
              scrolled ? "" : "md:hidden"
            }`}
          >
            <Menu />
          </button>
        </header>
      </div>
    </div>
  )
}
