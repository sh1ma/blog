import type { Metadata } from "next"
import "./globals.scss"
import React from "react"
import { BlogHeader } from "./header"

export const metadata: Metadata = {
  metadataBase: new URL("https://blog.sh1ma.dev/"),
  title: "blog.sh1ma.dev",
  description: "sh1maのブログです",
}

export const runtime = "edge"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div className="grid w-full place-items-center [&>header]:h-20 [&>header]:w-full [&>main]:mt-12 [&>main]:w-full">
          <BlogHeader />
          {children}
        </div>
        {/* <div className="flex min-h-screen flex-col justify-between gap-16 bg-stone-50 text-stone-900">
          <div className="container mx-auto max-w-3xl p-4">
            <header className="my-10">
              <div className="my-6">
                <Link href="/">
                  <h1 className="my-2 text-3xl">blog.sh1ma.dev</h1>
                </Link>
                <div className="flex">
                  <div>プログラムが好きです</div>
                </div>
              </div>
              <nav className="flex gap-4 font-bold text-red-800">
                <Link href="/">Home</Link>
                <Link href="/about">About</Link>
                <Link href="/tweets">Tweets</Link>
              </nav>
            </header>
            <div>{children}</div>
          </div>
          <footer className="flex flex-col items-center bg-stone-800 py-10 text-stone-50">
            <Link href="/feed">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mb-2 h-6 w-6"
                role="img"
                aria-label="RSSフィードへのリンク"
              >
                <path
                  fillRule="evenodd"
                  d="M3.75 4.5a.75.75 0 0 1 .75-.75h.75c8.284 0 15 6.716 15 15v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75C18 11.708 12.292 6 5.25 6H4.5a.75.75 0 0 1-.75-.75V4.5Zm0 6.75a.75.75 0 0 1 .75-.75h.75a8.25 8.25 0 0 1 8.25 8.25v.75a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75v-.75a6 6 0 0 0-6-6H4.5a.75.75 0 0 1-.75-.75v-.75Zm0 7.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <p className="text-sm">
              <small>{`© ${dayjs().format("YYYY")} sh1ma`}</small>
            </p>
          </footer>
        </div> */}
      </body>
    </html>
  )
}
