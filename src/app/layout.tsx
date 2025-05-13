import type { Metadata } from "next"
import "./globals.scss"
import React from "react"
import { BlogHeader } from "./header"
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
        <div className="mb-20 grid w-full place-items-center [&>*]:w-full [&>header]:h-20 sm:[&>header]:mb-12">
          <BlogHeader />
          {children}
        </div>
      </body>
    </html>
  )
}
