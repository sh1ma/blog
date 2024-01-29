import { GoogleAnalytics } from "@/components/GoogleAnalytics/GoogleAnalytics"
import dayjs from "dayjs"
import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"
import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRssSquare } from "@fortawesome/free-solid-svg-icons"

export const metadata: Metadata = {
  metadataBase: new URL("https://blog.sh1ma.dev/"),
  title: "blog.sh1ma.dev",
  description: "sh1maのブログです",
}

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
        <div className="bg-stone-50 text-stone-900 min-h-screen flex flex-col justify-between gap-16">
          <div className="container mx-auto py-4 max-w-3xl p-4">
            <header className="my-10">
              <div className="my-6">
                <Link href="/">
                  <h1 className="text-3xl my-2">blog.sh1ma.dev</h1>
                </Link>

                <div>
                  <div>プログラムが好きです</div>
                </div>
              </div>
              <nav className="text-red-800 flex gap-4 font-bold">
                <Link href="/">Home</Link>
                <Link href="/about">About</Link>
              </nav>
            </header>
            <div>{children}</div>
          </div>
          <footer className="py-10 bg-stone-800 text-stone-50">
            <div className="flex justify-center items-center gap-4">
              <p className="text-sm">
                <small>{`© ${dayjs().format("YYYY")} sh1ma`}</small>
              </p>
              <Link href="/feed">
                <FontAwesomeIcon width={"24px"} icon={faRssSquare} />
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
