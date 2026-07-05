import { Link, useLocation } from "@tanstack/react-router"
import { allArticles } from "contentlayer/generated"
import {
  ChevronLeft,
  Languages,
  Link as LinkIcon,
  PenLine,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const SCROLL_THRESHOLD = 80
const HIDE_DELAY_MS = 3000
const AUTO_COLLAPSE_DELAY_MS = 3000

const glassSurface =
  "bg-bg-surface/75 border border-white/50 shadow-soft backdrop-blur-xl backdrop-saturate-150"

type LanguageTarget = {
  href: string
  label: string
  lang: "ja" | "en"
}

const EN_LABEL = "Read in English"
const JA_LABEL = "日本語版はこちら"

const resolveLanguageTarget = (rawPath: string): LanguageTarget | null => {
  const pathname =
    rawPath.length > 1 && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath
  if (pathname === "/") {
    return { href: "/en", label: EN_LABEL, lang: "en" }
  }
  if (pathname === "/about") {
    return { href: "/en/about", label: EN_LABEL, lang: "en" }
  }
  if (pathname === "/en") {
    return { href: "/", label: JA_LABEL, lang: "ja" }
  }
  if (pathname === "/en/about") {
    return { href: "/about", label: JA_LABEL, lang: "ja" }
  }
  const enArticle = pathname.match(/^\/en\/articles\/(.+?)\/?$/)
  if (enArticle) {
    const slug = enArticle[1]
    const hasJa = allArticles.some((p) => p.id === slug && p.locale === "ja")
    return hasJa
      ? { href: `/articles/${slug}`, label: JA_LABEL, lang: "ja" }
      : null
  }
  const jaArticle = pathname.match(/^\/articles\/(.+?)\/?$/)
  if (jaArticle) {
    const slug = jaArticle[1]
    const hasEn = allArticles.some((p) => p.id === slug && p.locale === "en")
    return hasEn
      ? { href: `/en/articles/${slug}`, label: EN_LABEL, lang: "en" }
      : null
  }
  return null
}

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
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = undefined
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHideTimer()
    if (window.scrollY > SCROLL_THRESHOLD && !userExpandedRef.current) {
      hideTimerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS)
    }
  }, [clearHideTimer])

  const handleExpand = () => {
    setUserExpanded(true)
    userExpandedRef.current = true
    clearHideTimer()
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    collapseTimerRef.current = setTimeout(() => {
      setUserExpanded(false)
      userExpandedRef.current = false
      scheduleHide()
    }, AUTO_COLLAPSE_DELAY_MS)
  }

  useEffect(() => {
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
      clearHideTimer()
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
      window.removeEventListener("scroll", onActivity)
      window.removeEventListener("pointerdown", onActivity)
      window.removeEventListener("keydown", onActivity)
      window.removeEventListener("touchstart", onActivity)
    }
  }, [scheduleHide, clearHideTimer])

  const isCompact = scrolled && !userExpanded

  const isEnglish = pathname === "/en" || pathname.startsWith("/en/")

  const isActive = (path: string) => {
    if (path === "/") {
      return (
        !isEnglish && (pathname === "/" || pathname.startsWith("/articles"))
      )
    }
    if (path === "/en") {
      return (
        pathname === "/en" ||
        (pathname.startsWith("/en/") && !pathname.startsWith("/en/about"))
      )
    }
    return pathname.startsWith(path)
  }

  const getLinkClassName = (path: string) => {
    if (isActive(path)) {
      return "border-b-2 border-brand-primary pb-0.5 text-sm font-semibold text-brand-primary"
    }
    return "border-b-2 border-transparent pb-0.5 text-sm font-medium text-text-muted transition-colors hover:text-brand-primary"
  }

  const languageTarget = resolveLanguageTarget(pathname)
  const isArticlePage =
    pathname.startsWith("/articles/") || pathname.startsWith("/en/articles/")

  return (
    <div
      className={`sticky top-4 z-50 mb-20 w-full px-4 transition-opacity duration-700 ease-out sm:px-6 md:mb-8 lg:px-8 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="relative mx-auto max-w-3xl">
        <div
          aria-hidden={isCompact}
          className={`pointer-events-none absolute inset-x-0 top-full z-0 flex flex-col items-start transition-all duration-500 ease-out ${
            isCompact
              ? "-translate-y-[calc(100%+72px)] opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          <nav
            data-testid="mobile-nav-tab"
            className={`pointer-events-auto -mt-2 flex w-[90%] items-center justify-center gap-6 self-center border border-t-0 border-white/50 bg-bg-surface/85 pb-1.5 pt-2.5 shadow-soft backdrop-blur-xl backdrop-saturate-150 md:hidden ${
              languageTarget && isArticlePage
                ? "border-b-0"
                : "rounded-b-lg"
            }`}
          >
            {isEnglish ? (
              <>
                <Link to="/en" className={getLinkClassName("/en")}>
                  Articles
                </Link>
                <Link to="/en/about" className={getLinkClassName("/en/about")}>
                  About
                </Link>
              </>
            ) : (
              <>
                <Link to="/" className={getLinkClassName("/")}>
                  Articles
                </Link>
                <Link to="/about" className={getLinkClassName("/about")}>
                  About
                </Link>
              </>
            )}
            {languageTarget && (
              <a
                href={languageTarget.href}
                lang={languageTarget.lang}
                data-testid="mobile-nav-language-link"
                className="inline-flex items-center gap-1 border-b-2 border-transparent pb-0.5 text-sm font-medium text-text-muted transition-colors hover:text-brand-primary"
              >
                <LinkIcon size={12} />
                {isEnglish ? "日本語" : "English"}
              </a>
            )}
          </nav>
          {languageTarget && isArticlePage && (
            <a
              href={languageTarget.href}
              lang={languageTarget.lang}
              data-testid="language-tab"
              className="pointer-events-auto flex w-[90%] items-center justify-center gap-1 self-center rounded-b-lg border border-t-0 border-white/50 bg-bg-surface/85 pb-1.5 pt-2 text-[11px] font-medium text-brand-primary shadow-soft backdrop-blur-xl backdrop-saturate-150 transition-colors hover:bg-bg-surface md:-mt-2 md:ml-6 md:inline-flex md:w-auto md:justify-start md:self-start md:pb-1 md:pl-2.5 md:pr-3 md:pt-2.5"
            >
              <Languages size={12} />
              {languageTarget.label}
            </a>
          )}
        </div>
        <div
          className={`${glassSurface} relative z-10 ml-auto overflow-hidden transition-[width,height,border-radius] duration-500 ease-out ${
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
              {isEnglish ? (
                <>
                  <Link to="/en" className={getLinkClassName("/en")}>
                    Articles
                  </Link>
                  <Link
                    to="/en/about"
                    className={getLinkClassName("/en/about")}
                  >
                    About
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/" className={getLinkClassName("/")}>
                    Articles
                  </Link>
                  <Link to="/about" className={getLinkClassName("/about")}>
                    About
                  </Link>
                </>
              )}
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
