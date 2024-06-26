import { withContentlayer } from "next-contentlayer"
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev"

// note: the if statement is present because you
//       only need to use the function during development
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform()
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  // Optionally, add any other Next.js config below
  reactStrictMode: true,
}

export default withContentlayer(nextConfig)
