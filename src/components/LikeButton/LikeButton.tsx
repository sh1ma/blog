"use client"

import { useState } from "react"
import { likeArticle } from "@/db"

type LikeState = {
  likes: number
  liked: boolean
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
      ? { liked: true, likes: initialLikes }
      : {
          liked: false,
          likes: initialLikes,
        },
  )

  const onClick = async () => {
    likeArticle(articleId)
    setLikes({ liked: true, likes: likes.likes + 1 })
    localStorage.setItem(`like-${articleId}`, "true")
  }

  return (
    <button
      className="rounded border-2 border-slate-700 bg-white p-2 text-black transition-colors hover:bg-slate-700 hover:text-white"
      onClick={onClick}
      disabled={likes.liked}
    >
      {likes.liked ? `${likes.likes} Liked!` : `🎉 ${likes.likes}`}
    </button>
  )
}
