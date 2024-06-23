"use client"

import { useState } from "react"
import { likeArticle } from "@/db"

type LikeState =
  | {
      likes: number
      liked: false
    }
  | {
      liked: true
    }

export const LikeButton = ({
  articleId,
  initialLikes,
}: {
  initialLikes: number
  articleId: string
}) => {
  const isLiked = localStorage.getItem(`like-${articleId}`) === "true"

  const [likes, setLikes] = useState<LikeState>(
    isLiked
      ? { liked: true }
      : {
          liked: false,
          likes: initialLikes,
        },
  )

  const onClick = async () => {
    likeArticle(articleId)
    setLikes({ liked: true })
    localStorage.setItem(`like-${articleId}`, "true")
  }

  return (
    <button
      className="rounded border-2 border-slate-700 bg-white p-2 text-black transition-colors hover:bg-slate-700 hover:text-white"
      onClick={onClick}
      disabled={likes.liked}
    >
      {likes.liked ? "Liked!" : `🎉 ${likes.likes}`}
    </button>
  )
}
