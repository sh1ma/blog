import React from "react"
import { type Markdown } from "contentlayer2/core"

export const MarkdownContent = ({ post }: { post: { body: Markdown } }) => {
  return (
    <div
      className="
    prose
    prose-lg
    prose-headings:relative
    prose-headings:font-bold
    prose-h2:border-b
    prose-h2:border-primary-default
    prose-h2:pb-2
    prose-a:text-primary-default
    prose-code:rounded-md
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
