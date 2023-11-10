"use client"

import React from "react"
import { MDXProvider, useMDXComponents } from "@mdx-js/react"

export const MarkdownContent = ({ children }: React.PropsWithChildren) => {
  return (
    <div
      className="
    prose
  prose-li:marker:text-black
  prose-a:text-red-800
    prose-headings:font-bold
    prose-h2:text-xl
    prose-h2:border-b-2
    prose-h2:pb-2
    prose-h3:text-base
    "
    >
      {children}
    </div>
  )
}
