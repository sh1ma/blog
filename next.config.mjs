import bundleAnalyzer from "@next/bundle-analyzer"
import { withContentlayer } from "next-contentlayer2"

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

initOpenNextCloudflareForDev()

// note: the if statement is present because you
//       only need to use the function during development

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  // Optionally, add any other Next.js config below
  reactStrictMode: true,
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

export default withBundleAnalyzer(withContentlayer(nextConfig))
