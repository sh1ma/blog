import type { Metadata } from "next"
import "./globals.scss"
import React from "react"
import { BlogHeader } from "./header"
import { Footer } from "@/components/Footer/Footer"
import utc from "dayjs/plugin/utc"
import dayjs from "dayjs"

export const metadata: Metadata = {
  metadataBase: new URL("https://blog.sh1ma.dev/"),
  title: "blog.sh1ma.dev",
  description: "sh1maのブログです",
}

dayjs.extend(utc)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen flex-col">
          <BlogHeader />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
