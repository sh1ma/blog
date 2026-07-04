import { Link, useLocation } from "@tanstack/react-router"
import { ChevronLeft, PenLine } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const SCROLL_THRESHOLD = 80
const HIDE_DELAY_MS = 3000
const AUTO_COLLAPSE_DELAY_MS = 3000

const glassSurface =
  "bg-bg-surface/60 border border-white/40 shadow-soft backdrop-blur-xl backdrop-saturate-150"

export const BlogHeader = () => {
  const pathname = useLocation({ select: (loc) => loc.pathname })
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)
  const [userExpanded, setUserExpanded] = useState(false)
  const userExpandedRef = useRef(false)
  userExpandedRef.current = userExpanded
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  const handleExpand = () => {
    setUserExpanded(true)
    userExpandedRef.current = true
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    collapseTimerRef.current = setTimeout(() => {
      setUserExpanded(false)
      userExpandedRef.current = false
    }, AUTO_COLLAPSE_DELAY_MS)
  }

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined

    const scheduleHide = () => {
      if (hideTimer) clearTimeout(hideTimer)
      if (window.scrollY > SCROLL_THRESHOLD && !userExpandedRef.current) {
        hideTimer = setTimeout(() => setVisible(false), HIDE_DELAY_MS)
      }
    }

    const onActivity = () => {
      const s = window.scrollY > SCROLL_THRESHOLD
      setScrolled(s)
      if (!s && userExpandedRef.current) {
        setUserExpanded(false)
        userExpandedRef.current = false
        if (collapseTimerRef.current) {
          clearTimeout(collapseTimerRef.current)
          collapseTimerRef.current = undefined
        }
      }
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
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
      window.removeEventListener("scroll", onActivity)
      window.removeEventListener("pointerdown", onActivity)
      window.removeEventListener("keydown", onActivity)
      window.removeEventListener("touchstart", onActivity)
    }
  }, [])

  const isCompact = scrolled && !userExpanded

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
      <div className="mx-auto max-w-3xl">
        <div
          className={`${glassSurface} relative ml-auto overflow-hidden transition-[width,height,border-radius] duration-500 ease-out ${
            isCompact ? "h-12 w-12 rounded-full" : "h-[72px] w-full rounded-2xl"
          }`}
        >
          <header
            className={`absolute inset-y-0 left-0 flex w-full min-w-full items-center justify-between gap-4 px-6 transition-opacity duration-300 ease-out ${
              isCompact ? "pointer-events-none opacity-0" : "opacity-100"
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
          </header>

          <button
            type="button"
            aria-label="ヘッダーを展開"
            onClick={handleExpand}
            className={`absolute inset-0 flex items-center justify-center text-text-muted transition-opacity duration-300 ease-out hover:text-brand-primary ${
              isCompact
                ? "opacity-100 delay-200"
                : "pointer-events-none opacity-0"
            }`}
          >
            <ChevronLeft />
          </button>
        </div>
      </div>
    </div>
  )
}
