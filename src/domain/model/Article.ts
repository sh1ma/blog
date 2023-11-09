export interface Article {
  id?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  revisedAt?: string
  title?: string
  content?: string
  eyeCatch?: {
    url?: string
    height?: number
    width?: number
  }
  category?: ArticlesCategory
}

type ArticleFields = keyof Article
