import dayjs from "dayjs"
import { readdir } from "fs/promises"
import Link from "next/link"
import path from "path"

export const ArticleList = async () => {
  const postDirPath = path.join(process.cwd(), "src/markdown/posts")
  const postFilePaths = await readdir(postDirPath)

  const postMetas = await Promise.all(
    postFilePaths.map(async (filePath) => {
      const { meta } = (await import(`@/markdown/posts/${filePath}`)) as {
        meta: { title: string; publishedAt: string }
      }
      return { ...meta, id: filePath.replace(/\.mdx$/, "") }
    }),
  )

  return (
    <ul className="flex flex-col gap-6">
      {postMetas.map(({ id, title, publishedAt }) => {
        return (
          <li key={id}>
            <article className="">
              <div className="my-2">
                <time dateTime="2020-01-01">
                  {dayjs(publishedAt).format("YYYY-MM-DD")}
                </time>
              </div>
              <Link href={`/articles/${id}`}>
                <h3 className="text-xl underline text-red-800">{title}</h3>
              </Link>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
