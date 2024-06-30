import { countLikes } from "@/db"
import { allArticles } from "contentlayer/generated"
import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "OGP画像"
export const size = {
  width: 1200,
  height: 630,
}

const fontURL =
  "https://fonts.gstatic.com/s/ibmplexsansjp/v5/Z9XKDn9KbTDf6_f7dISNqYf_tvPT7PLWrNpVuw5_BAM.ttf"

const borderSize = 48

const titleContainerSize = {
  width: size.width - borderSize,
  height: size.height - borderSize,
}

export const contentType = "image/png"

interface Params {
  params: { slug: string }
}

export default async function Image({ params }: Params) {
  const { slug } = params
  const likeCount = (await countLikes(slug))?.["count(*)"] ?? 0

  const fontBuffer = await (
    await fetch(fontURL, { cache: "no-cache" })
  ).arrayBuffer()
  const post = allArticles.find((post) => post.id === slug)

  if (!post) {
    return null
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(to bottom, #6283F5, #FF7AA2)",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontFamily: "IBM Plex Sans JP",
            backgroundColor: "white",
            width: `${titleContainerSize.width}px`,
            height: `${titleContainerSize.height}px`,
            borderRadius: "8px",
            padding: "60px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              width: `${titleContainerSize.width}px`,
              height: `${titleContainerSize.height}px`,
              borderRadius: "8px",
              padding: "60px",
            }}
          >
            {post.title}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "IBM Plex Sans JP",
          data: fontBuffer,
        },
      ],
    },
  )
}
