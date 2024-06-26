import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import Link from "next/link"

export const ArticleList = async () => {
  return (
    <ul className="flex flex-col gap-6">
      {allArticles.toReversed().map(({ id, title, publishedAt }) => {
        return (
          <li key={id}>
            <article>
              <div className="text-sm">
                <time dateTime="2020-01-01">
                  {dayjs(publishedAt).format("YYYY-MM-DD")}
                </time>
              </div>
              <Link href={`/articles/${id}`}>
                <h2 className="text-red-800 underline">{title}</h2>
              </Link>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
