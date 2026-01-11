import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, ThumbsUp, ImageOff } from "lucide-react"
import { Tag } from "../Tag/Tag"

type ArticleCardProps = {
  id: string
  title: string
  description?: string
  thumbnail?: string
  publishedAt: string
  readingTime: number
  likes: number
  tags?: string[]
}

export const ArticleCard = ({
  id,
  title,
  description,
  thumbnail,
  publishedAt,
  readingTime,
  likes,
  tags,
}: ArticleCardProps) => {
  return (
    <article className="group flex items-center gap-4 rounded-xl bg-bg-surface p-4 shadow-soft transition-all hover:-translate-y-1 hover:shadow-hover">
      <Link
        href={`/articles/${id}`}
        className="size-24 shrink-0 overflow-hidden rounded-lg"
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            width={96}
            height={96}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-gray-100 text-gray-400">
            <ImageOff size={24} />
            <span className="mt-1 text-xs">No Image</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        {tags && tags.length > 0 && (
          <div className="flex gap-2">
            {tags.map((tag) => (
              <Tag key={tag} label={tag} size="sm" />
            ))}
          </div>
        )}

        <Link href={`/articles/${id}`}>
          <h3 className="text-xl font-bold leading-tight text-brand-primary transition-colors group-hover:underline">
            {title}
          </h3>
        </Link>

        {description && (
          <p className="line-clamp-2 text-sm leading-snug text-text-secondary">
            {description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar size={16} />
            <time dateTime={publishedAt}>{publishedAt}</time>
          </span>
          <span className="size-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1">
            <Clock size={16} />
            <span>{readingTime}分</span>
          </span>
        </div>
      </div>

      <div className="shrink-0">
        <button className="flex items-center gap-1.5 text-text-muted transition-colors hover:text-red-500">
          <ThumbsUp size={20} />
          <span className="text-sm font-medium">{likes}</span>
        </button>
      </div>
    </article>
  )
}
