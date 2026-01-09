"use client"

import { useEffect, useState } from "react"
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
  const [likes, setLikes] = useState<LikeState>({
    liked: false,
    likes: initialLikes,
  })

  useEffect(() => {
    const isLiked = localStorage.getItem(`like-${articleId}`) === "true"
    setLikes({
      liked: isLiked,
      likes: initialLikes,
    })
  }, [setLikes, articleId, initialLikes])

  const onClick = async () => {
    likeArticle(articleId)
    setLikes({ liked: true, likes: likes.likes + 1 })
    localStorage.setItem(`like-${articleId}`, "true")
  }

  return (
    <button
      className="rounded border-2 border-slate-700 bg-white p-btn-y text-black transition-colors hover:bg-slate-700 hover:text-white"
      onClick={onClick}
      disabled={likes.liked}
    >
      {likes.liked ? `${likes.likes} Liked!` : `🎉 ${likes.likes}`}
    </button>
  )
}
