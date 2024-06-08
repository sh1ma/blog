import React from "react"
import { Markdown } from "contentlayer/core"

export const MarkdownContent = ({ post }: { post: { body: Markdown } }) => {
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
      <div dangerouslySetInnerHTML={{ __html: post.body.html }}></div>
    </div>
  )
}
