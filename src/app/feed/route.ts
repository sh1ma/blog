import { getArticles } from "@/utils/getArticles"
import dayjs from "dayjs"
import RSS from "rss"

const getRssFeed = async () => {
  const feed = new RSS({
    title: "blog.sh1ma.dev",
    feed_url: "https://blog.sh1ma.dev/feed",
    site_url: "https://blog.sh1ma.dev",
  })

  const postsMetas = await getArticles()
  postsMetas.forEach((post) => {
    feed.item({
      title: post.title,
      description: "",
      url: `https://blog.sh1ma.dev/posts/${post.id}`,
      date: dayjs(post.publishedAt).toDate(),
    })
  })

  return feed.xml()
}

export const GET = async () => {
  const feed = await getRssFeed()
  return new Response(feed, {
    headers: {
      "content-type": "application/xml;charset=UTF-8",
    },
  })
}
