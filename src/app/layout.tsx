import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "blog.sh1ma.dev",
  description: "sh1maのブログです",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="bg-stone-50 text-stone-900">
      <body>
        <div className="container mx-auto py-4 max-w-3xl p-2">
          <header className="my-10">
            <div className="my-6">
              <h1 className="text-3xl my-2">sh1ma.dev</h1>
              <div>プログラムが好きです</div>
            </div>
            <nav className="text-red-800 flex gap-4 font-bold">
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
            </nav>
          </header>
          <div>{children}</div>
        </div>
      </body>
    </html>
  )
}
