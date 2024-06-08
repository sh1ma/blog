import rehypePrettyCode from "rehype-pretty-code"
import mdx from "@next/mdx"
import { withContentlayer } from "next-contentlayer"
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev"

// note: the if statement is present because you
//       only need to use the function during development
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform()
}

const withMDX = mdx({
  options: {
    remarkPlugins: [],
    rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Optionally, add any other Next.js config below
  reactStrictMode: true,
}

export default withMDX(withContentlayer(nextConfig))
