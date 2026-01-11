import Link from "next/link"
import { PenLine, Search, Menu } from "lucide-react"

export const BlogHeader = async () => {
  return (
    <div className="sticky top-4 z-50 mb-8 w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="bg-bg-surface/90 flex items-center justify-between gap-4 rounded-xl border border-gray-200/50 px-6 py-4 shadow-soft backdrop-blur-md transition-all duration-300">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-brand-primary/10 flex size-10 items-center justify-center rounded-lg text-brand-primary">
              <PenLine className="text-3xl" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              blog.<span className="text-brand-primary">sh1ma.dev</span>
            </h1>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="border-b-2 border-brand-primary pb-0.5 text-sm font-semibold text-brand-primary"
            >
              Articles
            </Link>
            <Link
              href="/tweets"
              className="text-sm font-medium text-text-muted transition-colors hover:text-brand-primary"
            >
              Tweets
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-text-muted transition-colors hover:text-brand-primary"
            >
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
