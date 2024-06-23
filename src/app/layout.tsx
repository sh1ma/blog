import { GoogleAnalytics } from "@/components/GoogleAnalytics/GoogleAnalytics"
import dayjs from "dayjs"
import type { Metadata } from "next"
import Link from "next/link"
import "./globals.scss"
import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRssSquare } from "@fortawesome/free-solid-svg-icons"

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
      <head>
        <GoogleAnalytics />
      </head>
      <body>
        <div className="flex min-h-screen flex-col justify-between gap-16 bg-stone-50 text-stone-900">
          <div className="container mx-auto max-w-3xl p-4">
            <header className="my-10">
              <div className="my-6">
                <Link href="/">
                  <h1 className="my-2 text-3xl">blog.sh1ma.dev</h1>
                </Link>

                <div>
                  <div>プログラムが好きです</div>
                </div>
              </div>
              <nav className="flex gap-4 font-bold text-red-800">
                <Link href="/">Home</Link>
                <Link href="/about">About</Link>
              </nav>
            </header>
            <div>{children}</div>
          </div>
          <footer className="flex flex-col items-center bg-stone-800 py-10 text-stone-50">
            <div className="flex items-center justify-center gap-4 p-4">
              <p className="text-sm">
                <small>{`© ${dayjs().format("YYYY")} sh1ma`}</small>
              </p>
              <Link href="/feed">
                <FontAwesomeIcon width={"24px"} icon={faRssSquare} />
              </Link>
            </div>
            <small className="">This website uses Google Analytics</small>
          </footer>
        </div>
      </body>
    </html>
  )
}
