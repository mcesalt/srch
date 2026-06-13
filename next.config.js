/**
 * @type {import('next').NextConfig}
 */
const repo = "srch"
const isGithubActions = process.env.GITHUB_ACTIONS === "true"

const basePath = isGithubActions ? `/${repo}` : ""

const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: isGithubActions ? `/${repo}/` : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
