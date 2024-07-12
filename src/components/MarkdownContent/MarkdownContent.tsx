import React from "react"
import { type Markdown } from "contentlayer/core"

export const MarkdownContent = ({ post }: { post: { body: Markdown } }) => {
  return (
    <div
      className="
    prose
    prose-headings:relative
    prose-headings:font-bold
    prose-h2:border-b-2
    prose-h2:pb-2
    prose-h2:text-xl
    prose-h3:text-base
    prose-a:text-red-800
    prose-code:rounded-sm
    prose-code:bg-gray-700
    prose-code:px-1
    prose-code:py-0.5
    prose-code:text-slate-300
    prose-code:before:content-none
    prose-code:after:content-none
    prose-li:marker:text-black
    "
    >
      <div dangerouslySetInnerHTML={{ __html: post.body.html }}></div>
    </div>
  )
}
