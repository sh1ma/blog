"use client"

import { likeArticle } from "@/db"
import { useTransition } from "react"

export const LikeButton = ({ articleId }: { articleId: string }) => {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      onClick={() =>
        startTransition(() => {
          likeArticle(articleId)
        })
      }
    >
      {isPending ? "いいね中" : "いいね"}
    </button>
  )
}
