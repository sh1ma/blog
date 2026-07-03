import type { Metadata } from "next"
import "./globals.scss"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import type React from "react"
import { Footer } from "@/components/Footer/Footer"
import { BlogHeader } from "./header"

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
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  )
}
