import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  Outlet,
  useLocation,
} from "@tanstack/react-router"
import { useEffect } from "react"
import { BlogHeader } from "@/components/BlogHeader/BlogHeader"
import { Footer } from "@/components/Footer/Footer"

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-text-primary">404</h1>
      <p className="mt-4 text-text-muted">ページが見つかりませんでした</p>
    </main>
  ),
})

function RootLayout() {
  const pathname = useLocation({ select: (loc) => loc.pathname })
  const lang = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ja"

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <div className="flex min-h-screen flex-col">
      <BlogHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
