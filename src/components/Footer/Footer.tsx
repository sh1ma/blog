import Link from "next/link"
import { PenLine, Github } from "lucide-react"

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row lg:px-8">
        <div className="text-center md:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
            <div className="bg-brand-primary/10 flex size-6 items-center justify-center rounded-md text-brand-primary">
              <PenLine size={16} />
            </div>
            <span className="text-lg font-bold text-text-primary">
              blog.<span className="text-brand-primary">sh1ma.dev</span>
            </span>
          </div>
          <p className="text-sm text-text-muted">
            © {currentYear} sh1ma. All rights reserved.
          </p>
        </div>

        <div className="flex gap-6">
          <Link
            href="https://github.com/sh1ma"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted transition-all duration-300 hover:-translate-y-1 hover:text-brand-primary"
            aria-label="GitHub"
          >
            <Github className="size-5" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
