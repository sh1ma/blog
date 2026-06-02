"use client"

import { useState, useSyncExternalStore } from "react"
import { likeArticle } from "@/db"

// 他タブでの変更を検知するためのstorageイベント購読
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

export const LikeButton = ({
  articleId,
  initialLikes,
}: {
  initialLikes: number
  articleId: string
}) => {
  const storageKey = `like-${articleId}`

  // localStorageを外部ストアとして購読（SSRではfalse、クライアントで実値に同期）
  const storedLiked = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(storageKey) === "true",
    () => false,
  )
  const [clicked, setClicked] = useState(false)

  const liked = storedLiked || clicked
  const likes = clicked ? initialLikes + 1 : initialLikes

  const onClick = async () => {
    likeArticle(articleId)
    localStorage.setItem(storageKey, "true")
    setClicked(true)
  }

  return (
    <button
      className="rounded border-2 border-slate-700 bg-white p-btn-y text-black transition-colors hover:bg-slate-700 hover:text-white"
      onClick={onClick}
      disabled={liked}
    >
      {liked ? `${likes} Liked!` : `🎉 ${likes}`}
    </button>
  )
}
