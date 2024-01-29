import { getArticles } from "@/utils/getArticles"
import dayjs from "dayjs"
import Link from "next/link"

export const ArticleList = async () => {
  const postMetas = await getArticles()

  return (
    <ul className="flex flex-col gap-6">
      {postMetas.map(({ id, title, publishedAt }) => {
        return (
          <li key={id}>
            <article>
              <div className="text-sm">
                <time dateTime="2020-01-01">
                  {dayjs(publishedAt).format("YYYY-MM-DD")}
                </time>
              </div>
              <Link href={`/articles/${id}`}>
                <h3 className="underline text-red-800">{title}</h3>
              </Link>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
