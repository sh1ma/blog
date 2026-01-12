"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PenLine, Search, Menu } from "lucide-react"

export const BlogHeader = () => {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname?.startsWith("/articles")
    }
    return pathname?.startsWith(path)
  }

  const getLinkClassName = (path: string) => {
    if (isActive(path)) {
      return "border-b-2 border-brand-primary pb-0.5 text-sm font-semibold text-brand-primary"
    }
    return "border-b-2 border-transparent pb-0.5 text-sm font-medium text-text-muted transition-colors hover:text-brand-primary"
  }

  return (
    <div className="sticky top-4 z-50 mb-8 w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="bg-bg-surface/90 flex items-center justify-between gap-4 rounded-xl border border-gray-200/50 px-6 py-4 shadow-soft backdrop-blur-md transition-all duration-300">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-brand-primary/10 flex size-10 items-center justify-center rounded-lg text-brand-primary">
              <PenLine className="text-3xl" />
            </div>
            <div className="text-xl font-bold tracking-tight text-text-primary">
              blog.<span className="text-brand-primary">sh1ma.dev</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/" className={getLinkClassName("/")}>
              Articles
            </Link>
            <Link href="/tweets" className={getLinkClassName("/tweets")}>
              Tweets
            </Link>
            <Link href="/about" className={getLinkClassName("/about")}>
              About
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="focus-within:ring-brand-primary/20 hidden items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 transition-all focus-within:ring-2 sm:flex">
              <Search className="text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search articles..."
                className="w-64 border-none bg-transparent py-0 text-sm text-text-primary placeholder:text-gray-400 focus:ring-0"
                disabled
              />
            </div>

            <button className="p-2 text-text-muted hover:text-brand-primary sm:hidden">
              <Search />
            </button>

            <button className="p-2 text-text-muted hover:text-brand-primary md:hidden">
              <Menu />
            </button>
          </div>
        </header>
      </div>
    </div>
  )
}
