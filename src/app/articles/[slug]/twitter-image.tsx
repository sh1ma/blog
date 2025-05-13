import { CardImageResponse } from "./card-image-response"
import { ArticlePageParams } from "./params"

export const alt = "OGP画像"
export const size = {
  width: 1200,
  height: 627,
}
export const contentType = "image/png"

export default async function Image(params: ArticlePageParams) {
  return CardImageResponse(params)
}
