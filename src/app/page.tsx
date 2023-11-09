import { ArticleList } from "@/components/ArticleList/ArticleList"
import { Metadata } from "next"

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "blog.sh1ma.dev",
    description: "sh1maのブログ",
  }
}

export default function Home() {
  return <ArticleList />
}
