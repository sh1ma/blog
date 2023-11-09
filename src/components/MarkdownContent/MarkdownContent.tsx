"use client"

import React from "react"

export const MarkdownContent = ({ children }: React.PropsWithChildren) => {
  return (
    <div
      className="
    prose
  prose-li:marker:text-black
  prose-a:text-red-800
    prose-h2:font-normal"
    >
      {children}
    </div>
  )
}
