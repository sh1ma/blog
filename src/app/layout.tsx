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
        <div className="mb-20 grid w-full place-items-center [&>:not(header)]:w-full [&>header]:mb-12 [&>header]:h-20 [&>header]:w-full [&>main]:mt-12">
          <BlogHeader />
          {children}
        </div>
      </body>
    </html>
  )
}
