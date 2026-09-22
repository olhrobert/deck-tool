import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR ?? ".next",
  // Default is bottom-left, where it covers the sidebar footer.
  devIndicators: { position: "bottom-right" },
}

export default nextConfig
