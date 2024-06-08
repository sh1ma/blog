import { ArticleList } from "@/components/ArticleList/ArticleList"
import { Metadata } from "next"

export const runtime = "edge"

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "blog.sh1ma.dev",
    description: "sh1maのブログ",
    metadataBase: new URL("https://blog.sh1ma.dev/"),
  }
}

export default function Home() {
  return <ArticleList />
}
