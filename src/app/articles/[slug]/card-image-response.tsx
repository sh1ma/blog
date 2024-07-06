import { countLikes } from "@/db"
import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import { ImageResponse } from "next/og"
import React, { CSSProperties } from "react"
import { ArticlePageParams } from "./params"
import { Metadata } from "next"

export const runtime = "edge"

export const alt = "OGP画像"
export const contentType = "image/png"
export const size = {
  width: 1200,
  height: 630,
}

const fontURLs = [
  {
    // IBM Plex Sans JP 400
    weight: 400 as const,
    url: "https://fonts.gstatic.com/s/ibmplexsansjp/v5/Z9XNDn9KbTDf6_f7dISNqYf_tvPT1Cr4iNJ-pwc.ttf",
  },
  {
    // IBM Plex Sans JP 600
    weight: 600 as const,
    url: "https://fonts.gstatic.com/s/ibmplexsansjp/v5/Z9XKDn9KbTDf6_f7dISNqYf_tvPT7PLWrNpVuw5_BAM.ttf",
  },
]

const loadFonts = async () => {
  const fontBuffers = await Promise.all(
    fontURLs.map(async ({ url, weight }) => {
      const fontBuffer = await (
        await fetch(url, { cache: "no-cache" })
      ).arrayBuffer()
      return { name: "IBM Plex Sans JP", data: fontBuffer, weight }
    }),
  )
  return fontBuffers
}

const fontFamily = "IBM Plex Sans JP"
const rootBorderColor = "linear-gradient(to left bottom , #1e293b, #f8fafc)"

const titleBackgroundColor = "white"
const titleBorderRadius = "8px"
const titleFontSize = "60px"
const titleFontWeight = 600

const textColors = {
  title: "#0f172a",
  meta: "#4b5563",
  like: "#f43f5e",
  time: "#1d4ed8",
}

// satoriではborderにgradientを使うことができないため、borderを使わないような実装にしている
// borderを使う代わりに、2つのコンテナdiv要素を作成し、そのサイズの差分によって生じる余白をborderとして扱う
const borderSize = 72
const titleContainerSize = {
  width: `${size.width - borderSize}px`,
  height: `${size.height - borderSize}px`,
}

const CardImageResponseMetadata = async (slug: string): Promise<Metadata> => {
  const post = allArticles.find((post) => post.id === slug)

  if (!post) {
    return {
      title: "404",
      metadataBase: new URL("https://blog.sh1ma.dev"),
      description: "404",
    }
  }

  return {
    title: post.title,
    metadataBase: new URL("https://blog.sh1ma.dev"),
    description: "ブログ記事",
  }
}

export const CardImageResponse = async ({ params }: ArticlePageParams) => {
  const { slug } = params
  const likeCount = (await countLikes(slug))?.["count(*)"] ?? 0

  const fonts = await loadFonts()
  const post = allArticles.find((post) => post.id === slug)

  if (!post) {
    return null
  }

  const postPublishedAt = dayjs(post.publishedAt).format("YYYY-MM-DD")

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          backgroundImage: rootBorderColor,
          color: textColors.title,
          fontFamily: fontFamily,
        }}
      >
        <div
          style={{
            fontSize: titleFontSize,
            fontWeight: titleFontWeight,
            backgroundColor: titleBackgroundColor,
            width: titleContainerSize.width,
            height: titleContainerSize.height,
            borderRadius: titleBorderRadius,
            padding: "24px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex" }}>{post.title}</div>
          <div
            style={{
              display: "flex",
              gap: "48px",
              marginBottom: "16px",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <MetaField
                icon={
                  <HeartIconOutlined
                    style={{
                      height: "48px",
                      width: "48px",
                      top: "10px",
                      marginRight: "8px",
                    }}
                    stroke={textColors.like}
                  />
                }
                text={likeCount.toString()}
                color={textColors.like}
              />
              <MetaField
                icon={
                  <TimeIconOutlined
                    style={{
                      height: "48px",
                      width: "48px",
                      top: "10px",
                      marginRight: "8px",
                    }}
                    stroke={textColors.time}
                  />
                }
                text={postPublishedAt}
                color={textColors.time}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                fontSize: "48px",
                color: textColors.meta,
              }}
            >
              blog.sh1ma.dev
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts,
    },
  )
}

const MetaField = ({
  icon,
  text,
  color,
}: {
  icon: React.JSX.Element
  text: string
  color?: string
}) => {
  return (
    <div style={{ display: "flex" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        {icon}
        <div
          style={{
            display: "flex",
            fontSize: "48px",
            fontFamily: "IBM Plex Sans JP",
            fontWeight: 400,
            alignItems: "flex-end",
            height: "100%",
            color: `${color ? color : "#FF7AA2"}`,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

const HeartIconOutlined = ({
  style,
  stroke,
}: {
  style?: CSSProperties
  stroke: string
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke={stroke}
    style={style}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
    />
  </svg>
)

const TimeIconOutlined = ({
  style,
  stroke,
}: {
  style?: CSSProperties
  stroke: string
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke={stroke}
    style={style}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
)
