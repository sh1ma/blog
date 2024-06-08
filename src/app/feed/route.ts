import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import RSS from "rss"

const getRssFeed = async () => {
  const feed = new RSS({
    title: "blog.sh1ma.dev",
    feed_url: "https://blog.sh1ma.dev/feed",
    site_url: "https://blog.sh1ma.dev",
  })

  allArticles.forEach((article) => {
    feed.item({
      title: article.title,
      description: "",
      url: `https://blog.sh1ma.dev/articles/${article.id}`,
      date: dayjs(article.publishedAt).toDate(),
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
