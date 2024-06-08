import { allArticles } from "contentlayer/generated"
import dayjs from "dayjs"
import { Feed } from "feed"

export const GET = async () => {
  const feed = new Feed({
    title: "blog.sh1ma.dev",
    feedLinks: "https://blog.sh1ma.dev/feed",
    link: "https://blog.sh1ma.dev",
    id: "https://blog.sh1ma.dev",
    copyright: `All rights reserved ${dayjs().format("YYYY")}, sh1ma`,
  })

  allArticles.forEach((article) => {
    feed.addItem({
      title: article.title,
      description: "",
      link: `https://blog.sh1ma.dev/articles/${article.id}`,
      date: dayjs(article.publishedAt).toDate(),
    })
  })

  return new Response(feed.rss2(), {
    headers: {
      "content-type": "application/xml;charset=UTF-8",
    },
  })
}
