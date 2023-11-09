import React from "react"

export const MarkdownContent = ({ children }: React.PropsWithChildren) => {
  return (
    <div
      className="
        prose 
        prose-headings:font-normal
        prose-p:leading-relaxed
        prose-a:text-red-800 
        prose-a:font-normal"
    >
      {children}
    </div>
  )
}
