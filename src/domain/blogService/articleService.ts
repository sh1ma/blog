const BLOG_ENDPOINT = process.env.MICROCMS_API_KEY
const API_KEY = process.env.MICROCMS_API_KEY

if (!BLOG_ENDPOINT) {
  throw new Error("BLOG_ENDPOINT is not defined")
}

if (!API_KEY) {
  throw new Error("API_KEY is not defined")
}

interface Pagination {
  offset: number
  limit: number
  totalCount: number
}

interface FetchArticleWithPaginationInput {
  offset: number
  limit: number
}

interface FetchArticleWithPaginationOutput extends Pagination {
  contents: Article[]
}

export const fetchArticleListWithPagination = async ({
  offset,
  limit,
}: FetchArticleWithPaginationInput): Promise<FetchArticleWithPaginationOutput> => {
  const url = new URL(FETCH_ARTICLE_LIST, BLOG_ENDPOINT)

  url.searchParams.set("offset", offset.toString())
  url.searchParams.set("limit", limit.toString())

  const fields = ["id", "title", "publishedAt"].join(",")

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch article list: ${response.status}`)
  }

  return await response.json()
}
