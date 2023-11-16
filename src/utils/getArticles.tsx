import { readdir } from "fs/promises"
import path from "path"

export const getArticles = async () => {
  const postDirPath = path.join(process.cwd(), "src/markdown/posts")
  const postFilePaths = await readdir(postDirPath)

  const postMetas = await Promise.all(
    postFilePaths
      .map(async (filePath) => {
        const { meta } = (await import(`@/markdown/posts/${filePath}`)) as {
          meta: { title: string; publishedAt: string }
        }
        return { ...meta, id: filePath.replace(/\.mdx$/, "") }
      })
      .sort()
      .reverse(),
  )
  return postMetas
}
